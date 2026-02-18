/**
 * SNI-aware Proxy Server
 * Extracts SNI from TLS ClientHello for accurate hostname detection
 * Uses Transform streams for accurate byte counting
 */

import * as net from 'net';
import * as http from 'http';
import { URL } from 'url';
import { Transform, TransformCallback } from 'stream';
import { parseSNI, isTLSClientHello } from './sni-parser';

const SNI_TIMEOUT_MS = 300;
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


/**
 * Transform stream that counts bytes passing through
 */
class ByteCounterStream extends Transform {
  public bytes = 0;

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    this.bytes += chunk.length;
    this.push(chunk);
    callback();
  }
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

      this.server.on('request', (req, res) => {
        this.handleHttpRequest(req, res);
      });

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

    // Create byte counters
    const inCounter = new ByteCounterStream();
    const outCounter = new ByteCounterStream();

    const emitTraffic = () => {
      this.emit('traffic', {
        hostname,
        sniHostname: null,
        port,
        method: req.method || 'GET',
        action: decision.action,
        matchedRule: decision.matchedRule,
        bytesIn: inCounter.bytes,
        bytesOut: outCounter.bytes
      } as TrafficLogData);
    };

    if (decision.action === 'proxy' && this.options.upstreamProxyUrl) {
      this.forwardHttpViaProxy(req, res, hostname, port, path, inCounter, outCounter, emitTraffic);
    } else {
      this.forwardHttpDirect(req, res, hostname, port, path, inCounter, outCounter, emitTraffic);
    }
  }

  private forwardHttpDirect(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    hostname: string,
    port: number,
    path: string,
    inCounter: ByteCounterStream,
    outCounter: ByteCounterStream,
    onComplete: () => void
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
      proxyRes.pipe(inCounter).pipe(res);
    });

    proxyReq.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(502);
      }
      res.end('Bad Gateway');
    });

    res.on('close', onComplete);
    req.pipe(outCounter).pipe(proxyReq);
  }

  private forwardHttpViaProxy(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    hostname: string,
    port: number,
    path: string,
    inCounter: ByteCounterStream,
    outCounter: ByteCounterStream,
    onComplete: () => void
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
      proxyRes.pipe(inCounter).pipe(res);
    });

    proxyReq.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(502);
      }
      res.end('Bad Gateway');
    });

    res.on('close', onComplete);
    req.pipe(outCounter).pipe(proxyReq);
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

    console.log(`[PROXY] CONNECT ${hostname}:${port}`);

    if (clientSocket.writable) {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      this.extractSNIAndLog(clientSocket, head, hostname, port);
    } else {
      clientSocket.destroy();
    }
  }

  private extractSNIAndLog(
    clientSocket: net.Socket,
    head: Buffer,
    hostname: string,
    port: number
  ): void {
    let tunnelSetup = false;
    let timeoutId: NodeJS.Timeout | null = null;
    const chunks: Buffer[] = head.length > 0 ? [head] : [];
    let totalLen = head.length;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      clientSocket.removeListener('data', onData);
      clientSocket.removeListener('error', onError);
      clientSocket.removeListener('close', onClose);
    };

    const logAndTunnel = (sni: string | null) => {
      if (tunnelSetup) return;
      tunnelSetup = true;
      cleanup();

      const effectiveHostname = sni || hostname;
      const decision = this.options.onRequest({
        hostname,
        port,
        sniHostname: sni,
        method: 'CONNECT',
        isHttps: true
      });

      console.log(`[PROXY] LOG ${sni || hostname}`);

      // Emit immediately for traffic list visibility (bytes will be updated on close)
      this.emit('traffic', {
        hostname,
        sniHostname: sni,
        port,
        method: 'CONNECT',
        action: decision.action,
        matchedRule: decision.matchedRule,
        bytesIn: 0,
        bytesOut: 0
      } as TrafficLogData);

      if (clientSocket.destroyed) return;

      const buffer = chunks.length === 0 ? Buffer.alloc(0) :
                     chunks.length === 1 ? chunks[0] : Buffer.concat(chunks);

      // Tunnel info for byte counting (will emit again on close with actual bytes)
      const tunnelInfo = {
        hostname,
        sniHostname: sni,
        port,
        decision
      };

      if (decision.action === 'proxy' && this.options.upstreamProxyUrl) {
        this.tunnelViaProxy(clientSocket, buffer, hostname, port, tunnelInfo);
      } else {
        this.tunnelDirect(clientSocket, buffer, effectiveHostname, port, tunnelInfo);
      }
    };

    const onData = (data: Buffer) => {
      if (tunnelSetup) return;
      chunks.push(data);
      totalLen += data.length;

      if (totalLen >= 5) {
        const first = chunks[0];
        if (isTLSClientHello(first)) {
          const recordLen = (first[3] << 8) | first[4];
          if (totalLen >= 5 + recordLen) {
            const buf = chunks.length === 1 ? first : Buffer.concat(chunks);
            const result = parseSNI(buf);
            logAndTunnel(result.hostname);
            return;
          }
        } else {
          logAndTunnel(null);
          return;
        }
      }

      if (totalLen > 4096) {
        logAndTunnel(null);
      }
    };

    const onError = () => logAndTunnel(null);
    const onClose = () => logAndTunnel(null);

    clientSocket.on('data', onData);
    clientSocket.on('error', onError);
    clientSocket.on('close', onClose);

    timeoutId = setTimeout(() => logAndTunnel(null), SNI_TIMEOUT_MS);
  }

  private tunnelDirect(
    clientSocket: net.Socket,
    initialData: Buffer,
    hostname: string,
    port: number,
    tunnelInfo: { hostname: string; sniHostname: string | null; port: number; decision: RequestDecision }
  ): void {
    // Byte counters for HTTPS traffic
    const inCounter = new ByteCounterStream();
    const outCounter = new ByteCounterStream();
    let trafficEmitted = false;

    const emitTraffic = () => {
      if (trafficEmitted) return;
      trafficEmitted = true;
      this.emit('traffic', {
        hostname: tunnelInfo.hostname,
        sniHostname: tunnelInfo.sniHostname,
        port: tunnelInfo.port,
        method: 'CONNECT',
        action: tunnelInfo.decision.action,
        matchedRule: tunnelInfo.decision.matchedRule,
        bytesIn: inCounter.bytes,
        bytesOut: outCounter.bytes + initialData.length
      } as TrafficLogData);
    };

    const serverSocket = net.connect(port, hostname, () => {
      if (initialData.length > 0) {
        serverSocket.write(initialData);
      }
      // Pipe with byte counting
      clientSocket.pipe(outCounter).pipe(serverSocket);
      serverSocket.pipe(inCounter).pipe(clientSocket);
    });

    serverSocket.on('error', () => clientSocket.destroy());
    clientSocket.on('error', () => serverSocket.destroy());
    clientSocket.on('close', () => {
      emitTraffic();
      serverSocket.destroy();
    });
    serverSocket.on('close', () => {
      emitTraffic();
      clientSocket.destroy();
    });

    this.connections.add(serverSocket);
    serverSocket.on('close', () => this.connections.delete(serverSocket));
  }

  private tunnelViaProxy(
    clientSocket: net.Socket,
    initialData: Buffer,
    hostname: string,
    port: number,
    tunnelInfo: { hostname: string; sniHostname: string | null; port: number; decision: RequestDecision }
  ): void {
    const proxyUrl = new URL(this.options.upstreamProxyUrl!);
    const proxyHost = proxyUrl.hostname;
    const proxyPort = parseInt(proxyUrl.port) || 8080;

    // Byte counters for HTTPS traffic
    const inCounter = new ByteCounterStream();
    const outCounter = new ByteCounterStream();
    let trafficEmitted = false;

    const emitTraffic = () => {
      if (trafficEmitted) return;
      trafficEmitted = true;
      this.emit('traffic', {
        hostname: tunnelInfo.hostname,
        sniHostname: tunnelInfo.sniHostname,
        port: tunnelInfo.port,
        method: 'CONNECT',
        action: tunnelInfo.decision.action,
        matchedRule: tunnelInfo.decision.matchedRule,
        bytesIn: inCounter.bytes,
        bytesOut: outCounter.bytes + initialData.length
      } as TrafficLogData);
    };

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

            // Pipe with byte counting
            clientSocket.pipe(outCounter).pipe(proxySocket);
            proxySocket.pipe(inCounter).pipe(clientSocket);

            const remaining = responseBuffer.subarray(headerEndIndex + 4);
            if (remaining.length > 0) {
              inCounter.bytes += remaining.length;
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
    clientSocket.on('close', () => {
      emitTraffic();
      proxySocket.destroy();
    });
    proxySocket.on('close', () => {
      emitTraffic();
      clientSocket.destroy();
    });

    this.connections.add(proxySocket);
    proxySocket.on('close', () => this.connections.delete(proxySocket));
  }
}
