# PROXY DATA SAVER

**Biến máy tính thành trạm kiểm soát proxy cho mạng LAN**

Phiên bản 1.1.0 | Hướng dẫn sử dụng

---

## Mục lục

1. [Proxy Data Saver là gì?](#1-proxy-data-saver-là-gì)
2. [Nguyên lý hoạt động](#2-nguyên-lý-hoạt-động)
3. [Hướng dẫn sử dụng chi tiết](#3-hướng-dẫn-sử-dụng-chi-tiết)

---

## 1. Proxy Data Saver là gì?

### 1.1. Giới thiệu

Proxy Data Saver là phần mềm chạy trên máy tính Windows, giúp **biến máy tính của bạn thành một trạm kiểm soát proxy** cho toàn bộ các thiết bị trong mạng LAN.

Khi các thiết bị (điện thoại, laptop, tablet...) trong cùng mạng WiFi kết nối đến Proxy Data Saver, chúng sẽ **phải tuân thủ các nguyên tắc (rules)** mà bạn đặt ra. Bạn có toàn quyền quyết định:

- Trang web nào được đi qua proxy
- Trang web nào phải đi direct (không qua proxy)
- Theo dõi tất cả traffic của các thiết bị
- Thống kê dung lượng sử dụng

### 1.2. Ví dụ thực tế

Giả sử bạn có 1 proxy và muốn chia sẻ cho cả gia đình/nhóm sử dụng, nhưng muốn kiểm soát để tiết kiệm dung lượng:

| Trang web | Bạn quy định | Tất cả thiết bị |
|-----------|--------------|-----------------|
| Facebook, Instagram | Đi qua proxy | Phải tuân thủ |
| YouTube (video nặng) | Đi direct | Phải tuân thủ |
| Google tìm kiếm | Đi direct | Phải tuân thủ |
| Web công việc | Đi qua proxy | Phải tuân thủ |

→ Dù là điện thoại của bạn hay laptop của người khác, khi kết nối qua Proxy Data Saver, tất cả đều phải tuân theo rules bạn đặt ra.

### 1.3. Các tính năng chính

- **Trạm kiểm soát tập trung:** Quản lý proxy cho tất cả thiết bị trong LAN từ một nơi
- **Rules bắt buộc:** Các thiết bị kết nối phải tuân thủ nguyên tắc bạn đặt ra
- **Hỗ trợ nhiều proxy:** Nhập nhiều proxy cùng lúc, mỗi proxy một port riêng
- **Theo dõi real-time:** Xem traffic của tất cả thiết bị đang kết nối
- **Thống kê chi tiết:** Dashboard hiển thị tổng data, % tiết kiệm, top domains
- **Giao diện song ngữ:** Hỗ trợ tiếng Việt và tiếng Anh
- **Chế độ sáng/tối:** Tùy chọn giao diện Light hoặc Dark mode

### 1.4. Ai nên sử dụng?

- Người muốn chia sẻ proxy cho nhiều thiết bị nhưng cần kiểm soát cách sử dụng
- Người quản lý proxy cho nhóm/gia đình và muốn tiết kiệm dung lượng
- Người muốn theo dõi traffic của các thiết bị trong mạng
- Người cần đặt ra quy tắc sử dụng proxy thống nhất cho nhiều thiết bị

---

## 2. Nguyên lý hoạt động

### 2.1. Tổng quan cách hoạt động

Proxy Data Saver biến máy tính của bạn thành một **trạm trung chuyển bắt buộc**. Mọi thiết bị muốn sử dụng proxy của bạn phải kết nối qua Proxy Data Saver, và phải tuân thủ các rules bạn đã thiết lập.

**Sơ đồ hoạt động:**

```
                         ┌─────────────────────────────────────┐
                         │     MÁY TÍNH CỦA BẠN               │
                         │  ┌─────────────────────────────┐   │
┌──────────────┐         │  │    PROXY DATA SAVER         │   │         ┌──────────────┐
│ Điện thoại 1 │ ──┐     │  │                             │   │    ┌──► │ Proxy Server │
├──────────────┤   │     │  │  ┌───────────────────────┐  │   │    │    └──────────────┘
│ Điện thoại 2 │ ──┼────►│  │  │   RULES (Luật)        │  │───┼────┤
├──────────────┤   │     │  │  │   - Facebook → proxy  │  │   │    │    ┌──────────────┐
│ Laptop       │ ──┤     │  │  │   - YouTube → direct  │  │   │    └──► │   Internet   │
├──────────────┤   │     │  │  │   - Google → direct   │  │   │         │   (Direct)   │
│ Tablet       │ ──┘     │  │  └───────────────────────┘  │   │         └──────────────┘
└──────────────┘         │  └─────────────────────────────┘   │
                         │                                     │
  Tất cả thiết bị        │      Kiểm soát & Phân loại         │      Đích đến
  phải kết nối qua       │                                     │
  trạm này               └─────────────────────────────────────┘
```

### 2.2. Quy trình xử lý từng request

Khi một thiết bị trong LAN truy cập trang web (ví dụ: www.facebook.com):

1. **Bước 1 - Nhận request:** Thiết bị gửi request đến Proxy Data Saver trên máy tính của bạn

2. **Bước 2 - Nhận diện trang web:** Phần mềm đọc địa chỉ trang web đang được truy cập

3. **Bước 3 - Kiểm tra Rules:** So sánh với danh sách rules bạn đã tạo

4. **Bước 4 - Áp dụng quy tắc:**
   - Nếu match rule "proxy" → chuyển tiếp qua upstream proxy
   - Nếu match rule "direct" → đi thẳng ra Internet, không qua proxy

5. **Bước 5 - Trả kết quả:** Gửi response về cho thiết bị

6. **Bước 6 - Ghi nhận:** Đếm bytes, ghi log để bạn theo dõi và thống kê

### 2.3. Hệ thống Rules (Luật định tuyến)

Rules là các quy tắc bắt buộc mà tất cả thiết bị kết nối phải tuân thủ. Mỗi rule gồm:

| Thành phần | Giải thích | Ví dụ |
|------------|------------|-------|
| Name | Tên gọi để bạn dễ nhớ | Facebook, YouTube, Công việc |
| Pattern | Mẫu địa chỉ web cần match | *.facebook.com, *.google.com |
| Action | Đi proxy hay direct | proxy = qua proxy, direct = đi thẳng |
| Priority | Độ ưu tiên (số nhỏ = ưu tiên cao) | 1, 2, 3... |
| Enabled | Bật/tắt rule này | Bật hoặc Tắt |

#### Cách viết Pattern:

Pattern sử dụng ký tự `*` (dấu sao) để đại diện cho "bất kỳ ký tự nào":

- **`*.facebook.com`** → Match: www.facebook.com, m.facebook.com, vi-vn.facebook.com
- **`*.google.com`** → Match: www.google.com, mail.google.com, drive.google.com
- **`facebook.com`** → Chỉ match đúng facebook.com (không có www)
- **`*.tiktok.com, *.tiktokcdn.com`** → Match nhiều domain, cách nhau bởi dấu phẩy

### 2.4. Multi-Proxy (Nhiều proxy cùng lúc)

Proxy Data Saver hỗ trợ nhập nhiều proxy. Mỗi proxy sẽ được gán một port riêng:

| Proxy bạn nhập | Port được gán | Địa chỉ kết nối |
|----------------|---------------|-----------------|
| user1:pass1:proxy1.com:8080 | 8080 | localhost:8080 |
| user2:pass2:proxy2.com:8080 | 8081 | localhost:8081 |
| user3:pass3:proxy3.com:8080 | 8082 | localhost:8082 |

→ Bạn có thể phân chia thiết bị nào dùng proxy nào, và theo dõi thống kê riêng cho từng proxy.

---

## 3. Hướng dẫn sử dụng chi tiết

### 3.1. Cài đặt phần mềm

#### Yêu cầu hệ thống:

- Hệ điều hành: Windows 10 hoặc Windows 11
- RAM: Tối thiểu 2GB (khuyến nghị 4GB)
- Dung lượng: Khoảng 200MB
- Kết nối: Có WiFi hoặc mạng LAN

#### Các bước cài đặt:

1. **Tải file cài đặt:** Download file Proxy-Data-Saver-Setup.exe từ nguồn chính thức

2. **Chạy file setup:** Double-click vào file vừa tải, Windows có thể hỏi xác nhận → chọn "Yes"

3. **Làm theo wizard:** Nhấn Next → chọn thư mục cài đặt (hoặc để mặc định) → Install

4. **Cho phép Firewall:** Khi Windows Firewall hỏi, **QUAN TRỌNG: Chọn "Allow access"** để các thiết bị khác kết nối được

5. **Hoàn tất:** Nhấn Finish, phần mềm sẽ tự động mở lên

> ⚠️ **Lưu ý về Firewall:** Nếu bạn không cho phép qua Firewall, các thiết bị khác trong mạng sẽ KHÔNG thể kết nối được. Nếu lỡ chọn "Block", hãy vào Windows Firewall Settings để cho phép lại.

### 3.2. Giao diện phần mềm

Khi mở Proxy Data Saver, bạn sẽ thấy giao diện với các tab chính:

| Tab | Chức năng |
|-----|-----------|
| Dashboard | Tổng quan: tổng data, % tiết kiệm, biểu đồ, top domains |
| Proxy Config | Nhập proxy, cấu hình port, bật/tắt proxy |
| Rules | Tạo, sửa, xóa các rules (luật bắt buộc) |
| Traffic | Xem real-time traffic của tất cả thiết bị đang kết nối |

**Góc trên bên phải có các nút:**

- Nút mặt trời/mặt trăng: Chuyển đổi chế độ sáng/tối
- Nút thu nhỏ (_): Thu nhỏ cửa sổ
- Nút đóng (X): Ẩn vào khay hệ thống (KHÔNG tắt app)

### 3.3. Cấu hình Proxy

Đây là bước quan trọng nhất để phần mềm hoạt động.

#### Bước 1: Mở tab "Proxy Config"

Click vào tab "Proxy Config" ở thanh điều hướng phía trên.

#### Bước 2: Nhập proxy của bạn

Trong ô "Proxy List", nhập proxy theo định dạng:

| Loại proxy | Định dạng |
|------------|-----------|
| Có username/password | `username:password:host:port` |
| Không có auth | `host:port` |

**Ví dụ:**

```
myuser:mypass123:proxy.example.com:8080
admin:abc123:103.15.20.30:3128
192.168.1.200:8080
```

**Nếu có nhiều proxy, mỗi proxy một dòng:**

```
user1:pass1:proxy1.com:8080
user2:pass2:proxy2.com:8080
user3:pass3:proxy3.com:8080
```

#### Bước 3: Cấu hình Start Port

Start Port là port đầu tiên mà phần mềm sử dụng. Mặc định là 8080. Nếu bạn nhập 3 proxy, chúng sẽ dùng port 8080, 8081, 8082.

> 💡 **Mẹo:** Nếu port 8080 bị trùng với phần mềm khác (Docker, XAMPP...), hãy đổi sang port khác như 9090.

#### Bước 4: Khởi động proxy

Nhấn nút **"Start Proxy"** màu xanh để bắt đầu.

**Nếu thành công:**
- Nút chuyển thành "Stop Proxy" màu đỏ
- Hiển thị danh sách các proxy đang chạy với port tương ứng
- Status hiển thị "Running"
- Trạm kiểm soát đã sẵn sàng nhận kết nối từ các thiết bị

**Nếu thất bại:**
- Kiểm tra lại định dạng proxy đã đúng chưa
- Kiểm tra port có bị trùng không
- Kiểm tra Firewall đã cho phép chưa

### 3.4. Tạo Rules (Luật bắt buộc)

Sau khi proxy đã chạy, bạn cần tạo Rules - các quy tắc mà tất cả thiết bị kết nối phải tuân thủ.

#### Bước 1: Mở tab "Rules"

Click vào tab "Rules" ở thanh điều hướng.

#### Bước 2: Thêm rule mới

Nhấn nút **"Add Rule"** hoặc biểu tượng dấu cộng (+).

#### Bước 3: Điền thông tin rule

- **Name:** Đặt tên dễ nhớ, ví dụ: "Facebook", "Mạng xã hội", "Công việc"
- **Pattern:** Nhập các domain, cách nhau bằng dấu phẩy. Dùng * để match subdomain
- **Action:** Chọn "proxy" nếu muốn đi qua proxy, chọn "direct" nếu muốn đi thẳng
- **Priority:** Số nhỏ = ưu tiên cao. Rule priority 1 sẽ được kiểm tra trước priority 2
- **Enabled:** Bật/tắt rule này

#### Bước 4: Lưu rule

Nhấn **"Save"** để lưu. Rule có hiệu lực ngay lập tức cho tất cả thiết bị đang kết nối.

#### Các rule mẫu phổ biến:

| Tên | Pattern | Action | Giải thích |
|-----|---------|--------|------------|
| Facebook | `*.facebook.com, *.fbcdn.net, *.fb.com` | proxy | Cần IP proxy |
| Instagram | `*.instagram.com, *.cdninstagram.com` | proxy | Cần IP proxy |
| TikTok | `*.tiktok.com, *.tiktokcdn.com` | proxy | Cần IP proxy |
| YouTube | `*.youtube.com, *.googlevideo.com` | direct | Video nặng, tiết kiệm |
| Google | `*.google.com, *.googleapis.com, *.gstatic.com` | direct | Không cần proxy |
| Shopee | `*.shopee.vn, *.shopeemobile.com` | proxy | Cần IP proxy |

> 💡 **Mẹo:** Nếu bạn không biết domain của một trang web, hãy truy cập trang đó và xem tab "Traffic" để biết các domain đang được gọi.

### 3.5. Kết nối thiết bị vào trạm kiểm soát

Sau khi proxy đã chạy và rules đã được tạo, hướng dẫn các thiết bị kết nối vào trạm kiểm soát của bạn.

#### Tìm địa chỉ IP máy tính (trạm kiểm soát):

1. Nhấn **Windows + R**, gõ `cmd` và Enter
2. Trong cửa sổ Command Prompt, gõ `ipconfig` và Enter
3. Tìm dòng **"IPv4 Address"** trong phần WiFi hoặc Ethernet
4. Ghi lại địa chỉ IP, ví dụ: `192.168.1.100`

#### Kết nối từ điện thoại Android:

1. Mở **Cài đặt** (Settings)
2. Vào **WiFi** → nhấn giữ vào mạng WiFi đang kết nối → chọn "Modify network"
3. Cuộn xuống tìm mục **"Proxy"** → chọn "Manual"
4. Nhập **Proxy hostname:** địa chỉ IP máy tính (ví dụ: 192.168.1.100)
5. Nhập **Proxy port:** 8080 (hoặc port bạn đã cấu hình)
6. Nhấn **Save**

→ Từ giờ điện thoại này phải tuân thủ rules bạn đặt ra.

#### Kết nối từ iPhone/iPad:

1. Mở **Cài đặt** (Settings)
2. Vào **WiFi** → nhấn vào biểu tượng (i) bên cạnh mạng WiFi đang kết nối
3. Cuộn xuống phần **"HTTP Proxy"** → chọn "Manual"
4. Nhập **Server:** địa chỉ IP máy tính (ví dụ: 192.168.1.100)
5. Nhập **Port:** 8080
6. Quay lại để lưu

→ Từ giờ iPhone/iPad này phải tuân thủ rules bạn đặt ra.

#### Kết nối từ laptop/PC khác:

1. Vào **Settings** → tìm "proxy" → Open your computer's proxy settings
2. Bật **"Use a proxy server"**
3. Nhập **Address:** địa chỉ IP máy trạm kiểm soát (ví dụ: 192.168.1.100)
4. Nhập **Port:** 8080
5. Nhấn **Save**

> ⚠️ **Lưu ý:** Tất cả thiết bị phải kết nối cùng mạng WiFi/LAN với máy tính chạy Proxy Data Saver.

### 3.6. Theo dõi Traffic của các thiết bị

Tab "Traffic" cho phép bạn xem real-time tất cả traffic từ các thiết bị đang kết nối qua trạm kiểm soát của bạn.

**Mỗi dòng traffic hiển thị:**

- **Hostname:** Tên miền đang được truy cập
- **Action:** "proxy" (đi qua proxy) hoặc "direct" (đi thẳng)
- **Matched Rule:** Rule nào đã áp dụng cho request này
- **Bytes In/Out:** Lượng data đã nhận/gửi
- **Local Port:** Port của proxy đang xử lý

→ Bạn có thể theo dõi tất cả thiết bị đang truy cập trang web gì, có tuân thủ rules không.

> 💡 **Mẹo:** Nếu thấy một trang cần đi proxy nhưng đang "direct", hãy thêm domain đó vào rule tương ứng.

### 3.7. Xem Dashboard thống kê

Tab "Dashboard" hiển thị tổng quan về lượng data của tất cả thiết bị đi qua trạm kiểm soát.

**Các thông tin hiển thị:**

- **Total Data:** Tổng lượng data đã xử lý
- **Proxy Data:** Lượng data đi qua proxy (tốn dung lượng proxy)
- **Direct Data:** Lượng data đi direct (tiết kiệm được)
- **Savings:** Phần trăm tiết kiệm = Direct / Total × 100%
- **Top Domains:** Các domain sử dụng nhiều data nhất
- **Biểu đồ:** Trực quan hóa tỷ lệ Proxy vs Direct

**Lọc thống kê theo thời gian:**

- **Today:** Chỉ tính hôm nay
- **Week:** 7 ngày gần nhất
- **Month:** 30 ngày gần nhất
- **All:** Tất cả từ khi bắt đầu dùng

Nếu bạn dùng nhiều proxy, có thể xem thống kê riêng cho từng proxy.

### 3.8. Các lưu ý quan trọng

#### Về Firewall:

Windows Firewall cần cho phép Proxy Data Saver để các thiết bị khác kết nối được. Nếu bạn lỡ chặn, vào **Control Panel → Windows Defender Firewall → Allow an app** → tìm Proxy Data Saver và cho phép cả Private và Public network.

#### Về port:

Nếu port 8080 đã được dùng bởi phần mềm khác (Docker, XAMPP, Skype...), hãy đổi Start Port sang số khác như 9090, 10080...

#### Về app banking:

Một số ứng dụng ngân hàng có cơ chế bảo mật đặc biệt và có thể **KHÔNG hoạt động** qua proxy. Nếu gặp lỗi, hãy tắt proxy trên thiết bị khi sử dụng app ngân hàng.

#### Về nút đóng (X):

Khi nhấn nút X, phần mềm ẩn vào khay hệ thống (system tray) chứ **KHÔNG tắt**. Trạm kiểm soát vẫn hoạt động. Để tắt hoàn toàn, click chuột phải vào icon trong khay hệ thống và chọn "Exit".

#### Về máy tính trạm kiểm soát:

Máy tính chạy Proxy Data Saver cần được bật liên tục. Nếu tắt máy hoặc tắt phần mềm, tất cả thiết bị sẽ mất kết nối proxy.

---

**Proxy Data Saver** | Phát triển bởi **Woware**

Website: https://app.woware.net/

Phiên bản: 1.1.0
