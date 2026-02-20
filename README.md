# Proxy Data Saver

![Proxy Data Saver](resources/thumbnail.png)

**[English](#english)** | **[Tiếng Việt](#tiếng-việt)**

---

## Download / Tải xuống

**[Download Proxy Data Saver / Tải Proxy Data Saver](https://app.woware.net/items/proxy-data-saver/4)**

---

## Screenshots

| Dashboard | Proxy Config |
|:---------:|:------------:|
| ![Dashboard](resources/screenshots-1.jpg) | ![Proxy Config](resources/screenshots-2.jpg) |

| Rules Manager | Traffic Monitor |
|:-------------:|:---------------:|
| ![Rules](resources/screenshots-3.jpg) | ![Traffic](resources/screenshots-4.jpg) |

---

# English

## What is Proxy Data Saver?

**Proxy Data Saver** is a Windows application that helps you save mobile data (4G/5G) through smart routing - only necessary traffic goes through proxy, the rest goes directly through your local network.

### The Problem

When you use a proxy (VPN, HTTP proxy), **all your traffic** goes through the proxy - including websites that don't need it like Google, YouTube, or local services. This causes:

- **Wasted bandwidth**: Proxies often charge by data usage
- **Slower speeds**: Traffic routes through distant proxy servers
- **Unnecessary**: Many websites work fine without proxy

**Proxy Data Saver** solves this by letting you **define** which traffic goes through proxy and which goes direct.

---

## Key Features

### Conditional Routing
Automatically route traffic based on your rules:
- Request A → through proxy (e.g., Facebook, Netflix)
- Request B → direct (e.g., Google, YouTube)

### SNI Extraction
Automatically identifies real domain names from HTTPS traffic (TLS ClientHello) for accurate matching, no IP dependency.

### Multi-Proxy Support
Support multiple proxies simultaneously - each proxy gets its own port (8080, 8081, 8082...).

### Rule-based Matching
Use wildcard patterns to match domains:
- `*.facebook.com` - matches `www.facebook.com`, `m.facebook.com`
- `*.google.com, *.youtube.com` - match multiple patterns

### LAN Access
Allow other devices on your LAN (phone, laptop) to connect through your proxy.

### Traffic Monitor & Statistics
- Real-time monitoring of all requests through proxy
- Detailed statistics: total data, proxy data, direct data
- Visual charts by day/week/month

---

## How to Use

### Step 1: Configure Proxy

Enter your proxy in the **Proxy List** field:

```
username:password:host:port
```

Or without authentication:

```
host:port
```

*You can enter multiple proxies, one per line.*

### Step 2: Create Rules

Rules decide which traffic goes through proxy and which goes direct.

**Pattern Syntax:**
| Pattern | Description |
|---------|-------------|
| `*` | Match all |
| `*.facebook.com` | Match `www.facebook.com`, `m.facebook.com`, ... |
| `*.local, localhost` | Match multiple patterns (comma-separated) |

**Example Rules:**

| Pattern | Action | Explanation |
|---------|--------|-------------|
| `*.facebook.com, *.fbcdn.net` | Proxy | Facebook through proxy |
| `*.google.com, *.youtube.com` | Direct | Google, YouTube go direct |
| `*` | Direct | Default: go direct |

### Step 3: Connect Devices

Configure HTTP Proxy on your browser or device:

- **Host**: IP of the machine running the app (or `localhost` if same machine)
- **Port**: Port shown in the app (default `8080`)

---

## System Requirements

- **OS**: Windows 10/11
- **Windows Firewall**: Allow the app when prompted (for LAN devices to connect)

---

## Important Notes

### Windows Firewall
On first launch, Windows will ask to allow network access. You need to **Allow** for:
- LAN devices to connect
- Proxy server to work properly

### Certificate Pinning
Some apps with certificate pinning (banking, e-wallets) will **not work** through proxy - this is a security mechanism, not an app bug.

### Port Conflicts
If port 8080 is already used by another application (Docker, XAMPP...), change the **Start Port** in settings.

---

# Tiếng Việt

## Proxy Data Saver là gì?

**Proxy Data Saver** là ứng dụng Windows giúp bạn tiết kiệm data di động (4G/5G) bằng cách điều hướng thông minh - chỉ những traffic cần thiết mới đi qua proxy, còn lại đi trực tiếp qua mạng local.

### Vấn đề

Khi bạn dùng proxy (VPN, HTTP proxy), **toàn bộ traffic** của bạn sẽ đi qua proxy - kể cả những website không cần proxy như Google, YouTube, hay các dịch vụ trong nước. Điều này gây:

- **Lãng phí data**: Proxy thường tính tiền theo lưu lượng
- **Tốc độ chậm**: Traffic đi vòng qua server proxy xa
- **Không cần thiết**: Nhiều website hoạt động tốt mà không cần proxy

**Proxy Data Saver** giải quyết vấn đề này bằng cách cho phép bạn **tự định nghĩa** traffic nào đi qua proxy, traffic nào đi trực tiếp.

---

## Tính năng chính

### Conditional Routing
Tự động điều hướng traffic dựa trên rules bạn định nghĩa:
- Request A → đi qua proxy (ví dụ: Facebook, Netflix)
- Request B → đi trực tiếp (ví dụ: Google, YouTube)

### SNI Extraction
Tự động nhận diện tên miền thực từ HTTPS traffic (TLS ClientHello) để matching chính xác, không cần dựa vào IP.

### Multi-Proxy Support
Hỗ trợ nhiều proxy cùng lúc - mỗi proxy được gán một port riêng (8080, 8081, 8082...).

### Rule-based Matching
Sử dụng wildcard pattern để match domain:
- `*.facebook.com` - match `www.facebook.com`, `m.facebook.com`
- `*.google.com, *.youtube.com` - match nhiều pattern

### LAN Access
Cho phép các thiết bị khác trong mạng LAN (điện thoại, laptop) kết nối qua proxy của bạn.

### Traffic Monitor & Statistics
- Theo dõi real-time tất cả request đi qua proxy
- Thống kê chi tiết: tổng data, data qua proxy, data đi trực tiếp
- Biểu đồ trực quan theo ngày/tuần/tháng

---

## Hướng dẫn sử dụng

### Bước 1: Cấu hình Proxy

Nhập proxy của bạn vào ô **Proxy List** theo format:

```
username:password:host:port
```

Hoặc nếu proxy không có xác thực:

```
host:port
```

*Có thể nhập nhiều proxy, mỗi proxy một dòng.*

### Bước 2: Tạo Rules

Rules quyết định traffic nào đi qua proxy, traffic nào đi trực tiếp.

**Cú pháp Pattern:**
| Pattern | Mô tả |
|---------|-------|
| `*` | Match tất cả |
| `*.facebook.com` | Match `www.facebook.com`, `m.facebook.com`, ... |
| `*.local, localhost` | Match nhiều pattern (phân cách bằng dấu phẩy) |

**Ví dụ cấu hình Rules:**

| Pattern | Action | Giải thích |
|---------|--------|------------|
| `*.facebook.com, *.fbcdn.net` | Proxy | Facebook đi qua proxy |
| `*.google.com, *.youtube.com` | Direct | Google, YouTube đi trực tiếp |
| `*` | Direct | Mặc định đi trực tiếp |

### Bước 3: Kết nối thiết bị

Cấu hình HTTP Proxy trên browser hoặc thiết bị:

- **Host**: IP máy chạy app (hoặc `localhost` nếu dùng trên cùng máy)
- **Port**: Port hiển thị trong app (mặc định `8080`)

---

## Yêu cầu hệ thống

- **OS**: Windows 10/11
- **Windows Firewall**: Cho phép app khi được hỏi (để thiết bị LAN kết nối được)

---

## Lưu ý quan trọng

### Windows Firewall
Khi khởi động lần đầu, Windows sẽ hỏi cho phép app truy cập mạng. Bạn cần **Allow** để:
- Các thiết bị trong LAN có thể kết nối
- Proxy server hoạt động đúng

### Certificate Pinning
Một số ứng dụng có certificate pinning (ngân hàng, ví điện tử) sẽ **không hoạt động** qua proxy - đây là cơ chế bảo mật, không phải lỗi của app.

### Port Conflicts
Nếu port 8080 đã được sử dụng bởi ứng dụng khác (Docker, XAMPP...), hãy đổi **Start Port** trong phần cấu hình.

---

## Build từ source (For Developers)

```bash
# Clone repo
git clone https://github.com/duongducnguyen/proxy-data-saver.git
cd proxy-data-saver

# Install dependencies
npm install

# Run development mode
npm run dev

# Build production (Windows)
npm run build:win
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop Framework | Electron + electron-vite |
| Frontend | React + TypeScript + TailwindCSS |
| Proxy Server | Custom implementation with SNI extraction |
| Pattern Matching | wildcard-match |
| Storage | electron-store |
| i18n | Vietnamese / English |

---

## Support / Hỗ trợ

Website: [https://app.woware.net](https://app.woware.net)

---

## License

MIT License

---

**Made by [Woware](https://app.woware.net)**
