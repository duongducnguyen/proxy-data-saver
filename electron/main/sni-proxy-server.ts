/**
 * SNI-aware Proxy Server (Optimized for Performance)
 * Extracts SNI from TLS ClientHello for accurate hostname detection
 */

import * as net from 'net';
import * as http from 'http';
import { URL } from 'url';
import { parseSNI, isTLSClientHello } from './sni-parser';
import { EventEmitter } from 'events';

export interface ProxyServerOptions {
  port: number;
  host?: string;
  upstreamProxyUrl: string | null;
  onRequest: (info: RequestInfo) => RequestDecision;
}

export interface RequestInfo {
  hostname: string;
  port: number;
  sniHostname: string | null;
  method: string;
  isHttps: boolean;
}

export interface RequestDecision {
  action: 'proxy' | 'direct';
  matchedRule: string | null;
}

export interface TrafficLogData {
  hostname: string;
  sniHostname: string | null;
  port: number;
  method: string;
  action: 'proxy' | 'direct';
  matchedRule: string | null;
  bytesIn: number;
  bytesOut: number;
}

// Optimized SNI extraction timeout (ms)
const SNI_TIMEOUT_MS = 150;
const MAX_SNI_BUFFER = 4096;

export class SNIProxyServer extends EventEmitter {
  private server: http.Server | null = null;
  private options: ProxyServerOptions;
  private connections: Set<net.Socket> = new Set();

  constructor(options: ProxyServerOptions) {
    super();
    this.options = options;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer();

      // Handle regular HTTP requests (non-CONNECT)
      this.server.on('request', (req, res) => {
        this.handleHttpRequest(req, res);
      });

      // Handle CONNECT requests (HTTPS tunneling)
      this.server.on('connect', (req, clientSocket, head) => {
        this.handleConnectRequest(req, clientSocket, head);
      });

      this.server.on('error', (err) => {
        this.emit('error', err);
        reject(err);
      });

      this.server.listen(this.options.port, this.options.host || '0.0.0.0', () => {
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    // Close all active connections
    for (const socket of this.connections) {
      socket.destroy();
    }
    this.connections.clear();

    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const targetUrl = req.url || '/';
    let hostname: string;
    let port: number;
    let path: string;

    try {
      if (targetUrl.startsWith('http://')) {
        const url = new URL(targetUrl);
        hostname = url.hostname;
        port = parseInt(url.port) || 80;
        path = url.pathname + url.search;
      } else {
        hostname = req.headers.host?.split(':')[0] || 'localhost';
        port = parseInt(req.headers.host?.split(':')[1] || '80');
        path = targetUrl;
      }
    } catch {
      res.writeHead(400);
      res.end('Bad Request');
      return;
    }

    const requestInfo: RequestInfo = {
      hostname,
      port,
      sniHostname: null,
      method: req.method || 'GET',
      isHttps: false
    };

    const decision = this.options.onRequest(requestInfo);

    // Log traffic immediately
    this.emit('traffic', {
      hostname,
      sniHostname: null,
      port,
      method: req.method || 'GET',
      action: decision.action,
      matchedRule: decision.matchedRule,
      bytesIn: 0,
      bytesOut: 0
    } as TrafficLogData);

    if (decision.action === 'proxy' && this.options.upstreamProxyUrl) {
      this.forwardHttpViaProxy(req, res, hostname, port, path);
    } else {
      this.forwardHttpDirect(req, res, hostname, port, path);
    }
  }

  private forwardHttpDirect(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    hostname: string,
    port: number,
    path: string
  ): void {
    const options: http.RequestOptions = {
      hostname,
      port,
      path,
      method: req.method,
      headers: { ...req.headers }
    };

    delete options.headers!['proxy-connection'];

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(502);
      }
      res.end('Bad Gateway');
    });

    req.pipe(proxyReq);
  }

  private forwardHttpViaProxy(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    hostname: string,
    port: number,
    path: string
  ): void {
    const proxyUrl = new URL(this.options.upstreamProxyUrl!);
    const options: http.RequestOptions = {
      hostname: proxyUrl.hostname,
      port: parseInt(proxyUrl.port) || 8080,
      path: `http://${hostname}:${port}${path}`,
      method: req.method,
      headers: { ...req.headers }
    };

    if (proxyUrl.username) {
      const auth = Buffer.from(`${proxyUrl.username}:${proxyUrl.password || ''}`).toString('base64');
      options.headers!['Proxy-Authorization'] = `Basic ${auth}`;
    }

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(502);
      }
      res.end('Bad Gateway');
    });

    req.pipe(proxyReq);
  }

  private handleConnectRequest(
    req: http.IncomingMessage,
    clientSocket: net.Socket,
    head: Buffer
  ): void {
    this.connections.add(clientSocket);
    clientSocket.on('close', () => this.connections.delete(clientSocket));
    clientSocket.on('error', () => this.connections.delete(clientSocket));

    const [hostname, portStr] = (req.url || '').split(':');
    const port = parseInt(portStr) || 443;

    // Tell client we're ready to tunnel
    if (clientSocket.writable) {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      // Wait for first data to extract SNI
      this.waitForSNI(clientSocket, head, hostname, port);
    } else {
      clientSocket.destroy();
    }
  }

  private waitForSNI(
    clientSocket: net.Socket,
    head: Buffer,
    connectHostname: string,
    port: number
  ): void {
    const buffers: Buffer[] = head.length > 0 ? [head] : [];
    let totalLength = head.length;
    let sniExtracted = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      clientSocket.removeListener('data', onData);
      clientSocket.removeListener('close', onClose);
      clientSocket.removeListener('error', onClose);
    };

    const finalize = (sniHostname: string | null) => {
      if (sniExtracted) return;
      sniExtracted = true;
      cleanup();

      // Don't proceed if socket is destroyed
      if (clientSocket.destroyed) return;

      const buffer = buffers.length === 0
        ? Buffer.alloc(0)
        : buffers.length === 1
          ? buffers[0]
          : Buffer.concat(buffers, totalLength);

      this.establishTunnel(clientSocket, buffer, connectHostname, port, sniHostname);
    };

    const onClose = () => {
      if (!sniExtracted) {
        sniExtracted = true;
        cleanup();
      }
    };

    const onData = (data: Buffer) => {
      buffers.push(data);
      totalLength += data.length;

      if (totalLength >= 5) {
        const firstChunk = buffers[0];

        if (isTLSClientHello(firstChunk)) {
          const recordLength = (firstChunk[3] << 8) | firstChunk[4];
          if (totalLength >= 5 + recordLength) {
            const buffer = buffers.length === 1 ? firstChunk : Buffer.concat(buffers, totalLength);
            const sniResult = parseSNI(buffer);
            finalize(sniResult.hostname);
            return;
          }
        } else {
          finalize(null);
          return;
        }
      }

      if (totalLength > MAX_SNI_BUFFER) {
        finalize(null);
      }
    };

    clientSocket.on('data', onData);
    clientSocket.on('close', onClose);
    clientSocket.on('error', onClose);

    // Timeout - proceed without SNI
    timeoutId = setTimeout(() => {
      finalize(null);
    }, SNI_TIMEOUT_MS);
  }

  private establishTunnel(
    clientSocket: net.Socket,
    initialData: Buffer,
    connectHostname: string,
    port: number,
    sniHostname: string | null
  ): void {
    const effectiveHostname = sniHostname || connectHostname;

    const requestInfo: RequestInfo = {
      hostname: connectHostname,
      port,
      sniHostname,
      method: 'CONNECT',
      isHttps: true
    };

    const decision = this.options.onRequest(requestInfo);

    // Log traffic immediately when tunnel is established (don't wait for close)
    this.emit('traffic', {
      hostname: connectHostname,
      sniHostname,
      port,
      method: 'CONNECT',
      action: decision.action,
      matchedRule: decision.matchedRule,
      bytesIn: 0,
      bytesOut: initialData.length
    } as TrafficLogData);

    if (decision.action === 'proxy' && this.options.upstreamProxyUrl) {
      this.tunnelViaProxy(clientSocket, initialData, connectHostname, port);
    } else {
      this.tunnelDirect(clientSocket, initialData, effectiveHostname, port);
    }
  }

  private tunnelDirect(
    clientSocket: net.Socket,
    initialData: Buffer,
    hostname: string,
    port: number
  ): void {
    const serverSocket = net.connect(port, hostname, () => {
      if (initialData.length > 0) {
        serverSocket.write(initialData);
      }

      // Use pipe for proper backpressure handling
      clientSocket.pipe(serverSocket);
      serverSocket.pipe(clientSocket);
    });

    serverSocket.on('error', () => clientSocket.destroy());
    clientSocket.on('error', () => serverSocket.destroy());
    clientSocket.on('close', () => serverSocket.destroy());
    serverSocket.on('close', () => clientSocket.destroy());

    this.connections.add(serverSocket);
    serverSocket.on('close', () => this.connections.delete(serverSocket));
  }

  private tunnelViaProxy(
    clientSocket: net.Socket,
    initialData: Buffer,
    hostname: string,
    port: number
  ): void {
    const proxyUrl = new URL(this.options.upstreamProxyUrl!);
    const proxyHost = proxyUrl.hostname;
    const proxyPort = parseInt(proxyUrl.port) || 8080;

    const proxySocket = net.connect(proxyPort, proxyHost, () => {
      let connectReq = `CONNECT ${hostname}:${port} HTTP/1.1\r\n`;
      connectReq += `Host: ${hostname}:${port}\r\n`;

      if (proxyUrl.username) {
        const auth = Buffer.from(`${proxyUrl.username}:${proxyUrl.password || ''}`).toString('base64');
        connectReq += `Proxy-Authorization: Basic ${auth}\r\n`;
      }

      connectReq += '\r\n';
      proxySocket.write(connectReq);
    });

    let connected = false;
    const responseChunks: Buffer[] = [];
    const HEADER_END = Buffer.from('\r\n\r\n');

    const onProxyData = (data: Buffer) => {
      if (!connected) {
        responseChunks.push(data);
        const responseBuffer = Buffer.concat(responseChunks);

        const headerEndIndex = responseBuffer.indexOf(HEADER_END);
        if (headerEndIndex !== -1) {
          const headerPart = responseBuffer.subarray(0, headerEndIndex).toString('ascii');
          const statusLine = headerPart.split('\r\n')[0];

          if (statusLine.includes('200')) {
            connected = true;
            proxySocket.removeListener('data', onProxyData);

            if (initialData.length > 0) {
              proxySocket.write(initialData);
            }

            // Use pipe for proper backpressure handling
            clientSocket.pipe(proxySocket);
            proxySocket.pipe(clientSocket);

            // Handle any binary data after headers (use Buffer, not string)
            const remaining = responseBuffer.subarray(headerEndIndex + 4);
            if (remaining.length > 0) {
              clientSocket.write(remaining);
            }
          } else {
            clientSocket.destroy();
            proxySocket.destroy();
          }
        }
      }
    };

    proxySocket.on('data', onProxyData);

    proxySocket.on('error', () => clientSocket.destroy());
    clientSocket.on('error', () => proxySocket.destroy());
    clientSocket.on('close', () => proxySocket.destroy());
    proxySocket.on('close', () => clientSocket.destroy());

    this.connections.add(proxySocket);
    proxySocket.on('close', () => this.connections.delete(proxySocket));
  }
}
