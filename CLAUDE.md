# Proxy Data Saver - Claude Code Guide

## Claude Code Rules

- **Không thêm Co-Author**: Khi commit, KHÔNG thêm dòng `Co-Authored-By: Claude` vào commit message.

---

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
| i18n | Custom React Context (English/Vietnamese) |

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
│   │   ├── sni-proxy-server.ts   # Custom proxy server với SNI extraction + byte counting
│   │   ├── sni-parser.ts         # TLS ClientHello parser
│   │   ├── proxy-server.ts       # ProxyServerManager (quản lý multiple proxies)
│   │   ├── stats-manager.ts      # Stats tracking với batched delta updates
│   │   ├── rule-engine.ts        # Rule matching với wildcard-match
│   │   ├── config-store.ts       # Electron-store wrapper
│   │   ├── ipc-handlers.ts       # IPC handlers cho renderer
│   │   └── types.ts              # TypeScript interfaces
│   └── preload/
│       └── index.ts              # contextBridge API cho renderer
├── src/                          # React UI
│   ├── App.tsx                   # Main app với tabs + custom titlebar
│   ├── components/
│   │   ├── Dashboard/            # Dashboard với stats tracking
│   │   │   ├── Dashboard.tsx     # Main container với proxy filter
│   │   │   ├── StatsCards.tsx    # Stat cards (Total, Proxy, Direct, Savings)
│   │   │   ├── PeriodSelector.tsx# Period buttons (Today/Week/Month/All)
│   │   │   ├── TopDomains.tsx    # Top domains table
│   │   │   └── DataChart.tsx     # Donut chart visualization
│   │   ├── ProxyConfig/          # Cấu hình proxy (multi-proxy input)
│   │   ├── RuleManager/          # CRUD rules
│   │   └── TrafficMonitor/       # Real-time traffic logs
│   ├── contexts/                 # React Contexts
│   │   └── ThemeContext.tsx      # Theme provider (light/dark/system)
│   ├── i18n/                     # Internationalization
│   │   ├── index.tsx             # I18nProvider, useI18n, useTranslation
│   │   └── locales/
│   │       ├── en.ts             # English translations
│   │       └── vi.ts             # Vietnamese translations
│   ├── hooks/
│   │   ├── useProxy.ts           # Proxy state management
│   │   ├── useRules.ts           # Rules state management
│   │   ├── useTraffic.ts         # Traffic logs state
│   │   └── useStats.ts           # Stats với delta updates + proxy filter
│   └── utils/
│       └── formatBytes.ts        # Byte formatting utility
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
  bytesIn: number;            // Bytes nhận từ server
  bytesOut: number;           // Bytes gửi đến server
}
```

### 5. Stats Tracking

Stats được track theo session và persist vào electron-store (90 ngày):

```typescript
interface AggregatedStats {
  period: 'today' | 'week' | 'month' | 'all';
  totalBytes: number;
  proxyBytes: number;
  directBytes: number;
  savingsPercent: number;     // direct / total * 100
  requestCount: number;
  topDomains: DomainStats[];
  dailyBreakdown: DailyStats[];
}
```

**Batched Delta Updates**: Stats được push mỗi 2 giây thay vì per-request để tối ưu performance.

**Per-proxy Tracking**: Mỗi proxy port có stats riêng, có thể filter trên Dashboard.

---

## IPC Communication

### Main → Renderer Events
```typescript
'proxy:started'      // Proxy đã start
'proxy:stopped'      // Proxy đã stop
'proxy:error'        // Có lỗi
'proxy:status-change'// Status thay đổi
'traffic:new'        // Traffic log mới
'stats:delta'        // Batched stats update (mỗi 2 giây)
'stats:reset'        // Stats đã được reset
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
'stats:get'          // Get stats (period, localPort?)
'stats:reset'        // Reset all stats
'stats:getActiveProxyPorts' // Get active proxy ports
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
- **v1.3.0**: Internationalization (i18n) - English/Vietnamese support, improved UI layout
- **v1.4.0**: Dashboard with Data Savings Tracking
  - Byte counting với Transform streams
  - Stats persistence (90 ngày history)
  - Dashboard UI: Stats cards, Donut chart, Top domains
  - Period selector: Today/Week/Month/All
  - Per-proxy stats filter
  - Batched delta updates (mỗi 2 giây) cho performance
  - Custom frameless window với titlebar
  - Window: 16:9 aspect ratio (1024x576), no drag-resize, maximize/minimize allowed
- **v1.5.0**: Flatten monorepo structure
  - Di chuyển code từ `client/` lên root folder
  - Xóa cấu trúc monorepo, giờ là single project
  - ARCHITECTURE.md đổi tên thành CLAUDE.md
- **v1.6.0**: UI Refactoring & Bug Fixes
  - Minimalist UI redesign (Notion/Linear/Stripe inspired)
  - Neutral color palette (white/gray/black với indigo accent)
  - Clean typography, lots of whitespace, no heavy borders/shadows
  - Traffic logging: log ngay khi connection established (không đợi close)
  - SNI timeout giảm từ 1000ms → 150ms
  - Fix binary data handling trong tunnelViaProxy (dùng Buffer thay vì string)
  - Fix deprecated substr() → substring()
  - Fix tray behavior: click X ẩn vào tray, click tray mở lại
  - Thêm error handling cho socket operations
  - Generated logo options trong resources/
- **v1.6.1**: Critical Bug Fixes
  - Fix memory leak: IPC handlers chỉ đăng ký 1 lần, thêm cleanup khi quit
  - Fix StatsManager timer: gọi stopBatchTimer() khi app quit
  - Fix crash: kiểm tra window.isDestroyed() trước khi send events
  - Fix auto-start: sửa check từ `upstreamProxyUrl` (không tồn tại) sang `proxyList`
  - Thêm safeSend() helper, updateWindowReference(), cleanupIpcHandlers()
- **v1.7.0**: Dark/Light Mode Theme Switch
  - ThemeContext với 3 modes: light, dark, system (auto-detect)
  - Theme toggle button trong titlebar (Sun/Moon/Monitor icons)
  - Persist theme preference vào localStorage
  - System preference detection via matchMedia
  - Tailwind darkMode: 'selector' - class-based dark mode
  - Tất cả components cập nhật với dark: variants
  - Tray icon tự động cập nhật theo theme
  - Thêm logo-dark.png và logo-light.png cho tray
