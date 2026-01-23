# Proxy Data Saver

Ứng dụng Electron tạo local proxy server với khả năng routing có điều kiện - giúp tiết kiệm data bằng cách chỉ route một số traffic qua proxy.

## Tính năng

- **Conditional Routing**: Route request qua upstream proxy hoặc đi trực tiếp dựa trên rules
- **SNI Extraction**: Tự động extract hostname từ TLS ClientHello để matching chính xác
- **Multi-Proxy Support**: Hỗ trợ nhiều proxy cùng lúc, mỗi proxy một port riêng
- **Rule-based Matching**: Wildcard pattern matching (ví dụ: `*.google.com`, `*.facebook.com`)
- **LAN Access**: Cho phép thiết bị trong mạng LAN (phone, laptop) kết nối qua proxy
- **Traffic Monitor**: Theo dõi real-time các request đi qua proxy

## Use Cases

- Tiết kiệm data 4G bằng cách chỉ route một số traffic qua proxy
- Bypass geo-restriction cho một số websites cụ thể
- Debug/monitor network traffic

## Cài đặt

### Từ Release

Download installer từ [Releases](../../releases) page.

### Build từ source

```bash
# Clone repo
git clone https://github.com/your-username/proxy-data-saver.git
cd proxy-data-saver

# Install dependencies
npm install

# Run development
npm run dev

# Build production
npm run build:win
```

## Sử dụng

### 1. Cấu hình Proxy

Nhập proxy theo format:
```
username:password:host:port
```
hoặc không có auth:
```
host:port
```

Có thể nhập nhiều proxy, mỗi proxy một dòng.

### 2. Tạo Rules

Rules quyết định traffic nào đi qua proxy, traffic nào đi trực tiếp.

**Pattern syntax:**
- `*` - match any characters
- `*.google.com` - match `www.google.com`, `mail.google.com`, etc.
- `*.local, localhost` - multiple patterns (phân cách bằng dấu phẩy)

**Ví dụ rules:**
| Pattern | Action | Mô tả |
|---------|--------|-------|
| `*.facebook.com, *.fbcdn.net` | proxy | Facebook qua proxy |
| `*.google.com` | direct | Google đi trực tiếp |
| `*` | direct | Mặc định đi trực tiếp |

### 3. Kết nối thiết bị

Cấu hình HTTP Proxy trên browser/device:
- **Host**: IP máy chạy app (hoặc `localhost`)
- **Port**: Port hiển thị trong app (mặc định `8080`)

## Tech Stack

- **Electron** + electron-vite
- **React** + TypeScript + TailwindCSS
- **Custom Proxy Server** với SNI extraction
- **wildcard-match** cho pattern matching
- **electron-store** cho lưu cấu hình

## Lưu ý

### Windows Firewall
App bind `0.0.0.0` để thiết bị LAN kết nối được. Cần allow app qua Windows Firewall khi được hỏi.

### Certificate Pinning
Một số apps có certificate pinning (banking, etc.) sẽ không hoạt động qua proxy.

### Port Conflicts
Nếu port đã được sử dụng bởi ứng dụng khác, cần đổi Start Port trong settings.

## License

MIT
