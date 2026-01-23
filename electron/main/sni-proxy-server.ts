/**
 * SNI-aware Proxy Server
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
}

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
    // Parse target URL
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
        // Relative URL with Host header
        hostname = req.headers.host?.split(':')[0] || 'localhost';
        port = parseInt(req.headers.host?.split(':')[1] || '80');
        path = targetUrl;
      }
    } catch (e) {
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

    this.emit('traffic', {
      hostname,
      sniHostname: null,
      port,
      method: req.method || 'GET',
      action: decision.action,
      matchedRule: decision.matchedRule
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

    proxyReq.on('error', (err) => {
      res.writeHead(502);
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

    // Add proxy auth if present
    if (proxyUrl.username) {
      const auth = Buffer.from(`${proxyUrl.username}:${proxyUrl.password || ''}`).toString('base64');
      options.headers!['Proxy-Authorization'] = `Basic ${auth}`;
    }

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502);
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

    // Parse target from CONNECT request
    const [hostname, portStr] = (req.url || '').split(':');
    const port = parseInt(portStr) || 443;

    // Tell client we're ready to tunnel
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');

    // Wait for first data to extract SNI
    this.waitForSNI(clientSocket, head, hostname, port);
  }

  private waitForSNI(
    clientSocket: net.Socket,
    head: Buffer,
    connectHostname: string,
    port: number
  ): void {
    let buffer = head.length > 0 ? head : Buffer.alloc(0);
    let sniExtracted = false;

    const onData = (data: Buffer) => {
      buffer = Buffer.concat([buffer, data]);

      // Try to parse SNI once we have enough data
      if (!sniExtracted && buffer.length >= 5) {
        if (isTLSClientHello(buffer)) {
          // Wait for complete ClientHello (check record length)
          const recordLength = (buffer[3] << 8) | buffer[4];
          if (buffer.length >= 5 + recordLength) {
            sniExtracted = true;
            clientSocket.removeListener('data', onData);

            const sniResult = parseSNI(buffer);
            this.establishTunnel(
              clientSocket,
              buffer,
              connectHostname,
              port,
              sniResult.hostname
            );
          }
        } else {
          // Not TLS, just forward
          sniExtracted = true;
          clientSocket.removeListener('data', onData);
          this.establishTunnel(clientSocket, buffer, connectHostname, port, null);
        }
      }

      // Timeout - if we've waited too long, proceed without SNI
      if (!sniExtracted && buffer.length > 8192) {
        sniExtracted = true;
        clientSocket.removeListener('data', onData);
        this.establishTunnel(clientSocket, buffer, connectHostname, port, null);
      }
    };

    clientSocket.on('data', onData);

    // Timeout fallback
    setTimeout(() => {
      if (!sniExtracted) {
        sniExtracted = true;
        clientSocket.removeListener('data', onData);
        this.establishTunnel(clientSocket, buffer, connectHostname, port, null);
      }
    }, 1000);
  }

  private establishTunnel(
    clientSocket: net.Socket,
    initialData: Buffer,
    connectHostname: string,
    port: number,
    sniHostname: string | null
  ): void {
    // Use SNI hostname if available, otherwise fall back to CONNECT hostname
    const effectiveHostname = sniHostname || connectHostname;

    const requestInfo: RequestInfo = {
      hostname: connectHostname,
      port,
      sniHostname,
      method: 'CONNECT',
      isHttps: true
    };

    const decision = this.options.onRequest(requestInfo);

    this.emit('traffic', {
      hostname: connectHostname,
      sniHostname,
      port,
      method: 'CONNECT',
      action: decision.action,
      matchedRule: decision.matchedRule
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
      // Send initial data (ClientHello) that we buffered
      if (initialData.length > 0) {
        serverSocket.write(initialData);
      }

      // Pipe bidirectionally
      clientSocket.pipe(serverSocket);
      serverSocket.pipe(clientSocket);
    });

    serverSocket.on('error', (err) => {
      clientSocket.destroy();
    });

    clientSocket.on('error', () => {
      serverSocket.destroy();
    });

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
      // Build CONNECT request to upstream proxy
      let connectReq = `CONNECT ${hostname}:${port} HTTP/1.1\r\n`;
      connectReq += `Host: ${hostname}:${port}\r\n`;

      // Add proxy authentication if present
      if (proxyUrl.username) {
        const auth = Buffer.from(`${proxyUrl.username}:${proxyUrl.password || ''}`).toString('base64');
        connectReq += `Proxy-Authorization: Basic ${auth}\r\n`;
      }

      connectReq += '\r\n';
      proxySocket.write(connectReq);
    });

    let connected = false;
    let responseBuffer = '';

    proxySocket.on('data', (data) => {
      if (!connected) {
        responseBuffer += data.toString();

        // Check for end of HTTP response headers
        const headerEnd = responseBuffer.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const statusLine = responseBuffer.split('\r\n')[0];
          if (statusLine.includes('200')) {
            connected = true;

            // Send initial data (ClientHello) that we buffered
            if (initialData.length > 0) {
              proxySocket.write(initialData);
            }

            // Pipe bidirectionally
            clientSocket.pipe(proxySocket);
            proxySocket.pipe(clientSocket);

            // Handle any data after headers
            const remaining = responseBuffer.slice(headerEnd + 4);
            if (remaining.length > 0) {
              clientSocket.write(remaining);
            }
          } else {
            // Proxy rejected the connection
            clientSocket.destroy();
            proxySocket.destroy();
          }
        }
      }
    });

    proxySocket.on('error', (err) => {
      clientSocket.destroy();
    });

    clientSocket.on('error', () => {
      proxySocket.destroy();
    });

    this.connections.add(proxySocket);
    proxySocket.on('close', () => this.connections.delete(proxySocket));
  }
}
