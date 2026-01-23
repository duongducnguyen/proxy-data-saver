# Proxy Data Saver - Claude Code Guide

## Tổng quan dự án

**Proxy Data Saver** là ứng dụng Electron tạo local proxy server với khả năng routing có điều kiện:
- Request A → đi qua upstream proxy (proxy thật của user)
- Request B → đi trực tiếp (dùng IP local)

### Use case chính
- Tiết kiệm data 4G bằng cách chỉ route một số traffic qua proxy
- Cho phép thiết bị trong LAN (phone, laptop) kết nối qua proxy
- Rule-based routing dựa trên domain/hostname

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop Framework | Electron + electron-vite |
| Frontend | React + TypeScript + TailwindCSS |
| Proxy Server | Custom implementation với SNI extraction |
| Pattern Matching | wildcard-match |
| Storage | electron-store |

---

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│                 Electron Application                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Main Process                           │ │
│  │  ┌──────────────┐  ┌────────────┐  ┌────────────┐  │ │
│  │  │SNI Proxy     │  │Rule Engine │  │Config Store│  │ │
│  │  │Server        │◄─┤(wildcard)  │◄─┤(electron-  │  │ │
│  │  │(sni-proxy-   │  │            │  │store)      │  │ │
│  │  │server.ts)    │  └────────────┘  └────────────┘  │ │
│  │  └──────┬───────┘                                   │ │
│  └─────────│───────────────────────────────────────────┘ │
│            │ 0.0.0.0:8080+                               │
│  ┌─────────│───────────────────────────────────────────┐ │
│  │         │      Renderer (React UI)                   │ │
│  │  ┌──────┴─────┐  ┌──────────┐  ┌───────────────┐    │ │
│  │  │ProxyConfig │  │RuleManager│  │TrafficMonitor│    │ │
│  │  └────────────┘  └──────────┘  └───────────────┘    │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
         ▲
         │ Proxy Connection (HTTP/HTTPS)
┌────────┴────────┐
│  LAN Devices    │
│ (Phone, Laptop) │
└─────────────────┘
```

---

## Cấu trúc thư mục

```
proxy-data-saver/
├── electron/
│   ├── main/
│   │   ├── index.ts              # Entry point, window & tray management
│   │   ├── sni-proxy-server.ts   # Custom proxy server với SNI extraction
│   │   ├── sni-parser.ts         # TLS ClientHello parser
│   │   ├── proxy-server.ts       # ProxyServerManager (quản lý multiple proxies)
│   │   ├── rule-engine.ts        # Rule matching với wildcard-match
│   │   ├── config-store.ts       # Electron-store wrapper
│   │   ├── ipc-handlers.ts       # IPC handlers cho renderer
│   │   └── types.ts              # TypeScript interfaces
│   └── preload/
│       └── index.ts              # contextBridge API cho renderer
├── src/                          # React UI
│   ├── App.tsx                   # Main app với tabs
│   ├── components/
│   │   ├── ProxyConfig/          # Cấu hình proxy (multi-proxy input)
│   │   ├── RuleManager/          # CRUD rules
│   │   └── TrafficMonitor/       # Real-time traffic logs
│   └── hooks/
│       ├── useProxy.ts           # Proxy state management
│       ├── useRules.ts           # Rules state management
│       └── useTraffic.ts         # Traffic logs state
├── electron.vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## Core Concepts

### 1. SNI Extraction (Quan trọng!)

**Vấn đề**: HTTPS traffic được mã hóa, proxy chỉ thấy IP trong CONNECT request.

**Giải pháp**: Extract SNI (Server Name Indication) từ TLS ClientHello.

```
Client                              Proxy                              Server
   │                                  │                                  │
   │─── CONNECT 31.13.84.4:443 ──────→│                                  │
   │←── 200 Connection Established ───│                                  │
   │                                  │                                  │
   │─── TLS ClientHello ─────────────→│                                  │
   │    (SNI: "www.facebook.com")     │──── Extract SNI ────┐            │
   │                                  │                     │            │
   │                                  │←── Match rules ─────┘            │
   │                                  │    *facebook.com → proxy         │
   │                                  │                                  │
   │←─────────── Tunnel ──────────────│─────── Tunnel ──────────────────→│
```

**Files liên quan**:
- `sni-parser.ts`: Parse TLS ClientHello, extract SNI extension
- `sni-proxy-server.ts`: Intercept tunnel, đọc SNI trước khi forward

### 2. Multi-Proxy Support

User nhập nhiều proxy, mỗi proxy được gán một local port:

```
Input:
user1:pass1:proxy1.com:8080
user2:pass2:proxy2.com:8080

Output:
localhost:8080 → proxy1.com:8080
localhost:8081 → proxy2.com:8080
```

**Format hỗ trợ**:
- `username:password:host:port` (có auth)
- `host:port` (không auth)

### 3. Rule Engine

Rules được match theo priority (số nhỏ = ưu tiên cao):

```typescript
interface Rule {
  id: string;
  name: string;
  pattern: string;      // "*.google.com, *.youtube.com"
  action: 'proxy' | 'direct';
  enabled: boolean;
  priority: number;
}
```

**Pattern syntax** (wildcard-match):
- `*` = match any characters
- `*.google.com` = match `www.google.com`, `mail.google.com`
- `*.local, localhost` = multiple patterns (comma-separated)

### 4. Traffic Logging

```typescript
interface TrafficLog {
  id: string;
  timestamp: number;
  hostname: string;           // CONNECT hostname (có thể là IP)
  resolvedHostname: string;   // SNI hostname (domain thật)
  method: string;             // CONNECT, GET, POST...
  action: 'proxy' | 'direct';
  matchedRule: string | null;
  localPort: number;
}
```

---

## IPC Communication

### Main → Renderer Events
```typescript
'proxy:started'      // Proxy đã start
'proxy:stopped'      // Proxy đã stop
'proxy:error'        // Có lỗi
'proxy:status-change'// Status thay đổi
'traffic:new'        // Traffic log mới
```

### Renderer → Main (invoke)
```typescript
'proxy:start'        // Start proxy
'proxy:stop'         // Stop proxy
'proxy:restart'      // Restart proxy
'proxy:status'       // Get status
'config:get'         // Get config
'config:setProxy'    // Update proxy config
'rules:get'          // Get rules
'rules:add'          // Add rule
'rules:update'       // Update rule
'rules:delete'       // Delete rule
```

---

## Development

### Commands
```bash
npm run dev          # Development mode
npm run build        # Build production
npm run build:win    # Build Windows installer
```

### Debugging
- DevTools tự động mở trong dev mode
- Main process logs: terminal
- Renderer logs: DevTools console

### Testing proxy
1. Start app, nhập proxy, click Start
2. Cấu hình browser/device dùng `localhost:8080` làm HTTP proxy
3. Truy cập website, xem Traffic tab

---

## Lưu ý quan trọng

### 1. Windows Firewall
App bind `0.0.0.0` để LAN devices kết nối được. User cần allow app qua Windows Firewall.

### 2. Certificate Pinning
Một số apps (banking, etc.) có certificate pinning sẽ không hoạt động qua proxy.

### 3. SNI Limitations
- Một số apps cũ không gửi SNI
- Encrypted SNI (ESNI/ECH) sẽ không extract được
- Fallback về CONNECT hostname nếu không có SNI

### 4. Port Conflicts
Nếu port đã được dùng (Docker, etc.), app sẽ fail. User cần đổi Start Port.

---

## Extending

### Thêm rule type mới
1. Update `Rule` interface trong `types.ts`
2. Update `RuleEngine` trong `rule-engine.ts`
3. Update UI trong `RuleManager/`

### Thêm proxy protocol mới (SOCKS5, etc.)
1. Update `sni-proxy-server.ts` để support protocol mới
2. Update `buildUpstreamUrl()` trong `types.ts`
3. Update UI trong `ProxyConfig/`

### Thêm statistics/analytics
1. Extend `TrafficLog` interface
2. Update `ProxyServerManager` để track thêm data
3. Tạo component mới hoặc extend `TrafficMonitor`

---

## Common Issues

| Issue | Solution |
|-------|----------|
| App không start | Check port conflict, đổi Start Port |
| Traffic không hiện SNI | App/browser cũ, hoặc ESNI enabled |
| Rules không match | Kiểm tra pattern syntax, priority order |
| LAN device không kết nối được | Check Windows Firewall |
| Proxy auth fail | Kiểm tra username:password format |

---

## Version History

- **v1.0.0**: Initial release với proxy-chain
- **v1.1.0**: Multi-proxy support
- **v1.2.0**: SNI Extraction thay thế Reverse DNS
