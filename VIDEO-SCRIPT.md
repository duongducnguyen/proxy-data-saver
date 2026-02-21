# Kịch bản Video: Hướng dẫn sử dụng Proxy Data Saver

**Thời lượng ước tính:** ~11 phút

---

## PHẦN 1: GIỚI THIỆU (0:00 - 1:30)

**[Màn hình: Logo Proxy Data Saver + tên app]**

**Lời thoại:**
> "Xin chào các bạn, hôm nay mình sẽ hướng dẫn sử dụng phần mềm **Proxy Data Saver** - một công cụ giúp bạn tiết kiệm data 4G khi sử dụng proxy."

**[Màn hình: Hiển thị sơ đồ hoạt động]**

**Lời thoại:**
> "Vậy Proxy Data Saver hoạt động như thế nào?"
>
> "Thông thường khi bạn dùng proxy, **tất cả traffic** đều đi qua proxy và tốn data 4G."
>
> "Với Proxy Data Saver, bạn có thể **chọn lọc**:
> - Chỉ những website cần thiết mới đi qua proxy
> - Còn lại đi thẳng Internet, không tốn data 4G"

**[Màn hình: Ví dụ minh họa]**

**Lời thoại:**
> "Ví dụ: Bạn chỉ cần proxy để vào Facebook. Thay vì tất cả YouTube, Google, TikTok đều tốn data proxy, giờ chỉ có Facebook đi qua proxy thôi. Tiết kiệm đến 80-90% data!"

**[Màn hình: Các tính năng chính]**

**Lời thoại:**
> "Các tính năng chính:
> - Hỗ trợ **nhiều proxy** cùng lúc
> - **Rule-based routing** - tự động phân luồng theo domain
> - **Dashboard** thống kê data đã tiết kiệm
> - Cho phép **điện thoại, laptop khác** kết nối qua
> - Giao diện đẹp, hỗ trợ **tiếng Việt**"

---

## PHẦN 2: CÀI ĐẶT (1:30 - 2:30)

**[Màn hình: Trang download]**

**Lời thoại:**
> "Để cài đặt, các bạn tải file cài đặt từ link trong mô tả video."

**[Hành động: Double-click file setup]**

**Lời thoại:**
> "Double-click vào file **Proxy-Data-Saver-Setup.exe** để bắt đầu cài đặt."

**[Màn hình: Setup wizard]**

**Lời thoại:**
> "Nhấn **Next**, chọn thư mục cài đặt, rồi nhấn **Install**."
>
> "Đợi vài giây để hoàn tất..."

**[Màn hình: Windows Firewall prompt]**

**Lời thoại:**
> "**Quan trọng!** Khi Windows Firewall hỏi, các bạn nhấn **Allow access** để cho phép ứng dụng hoạt động."
>
> "Nếu không cho phép, các thiết bị khác trong mạng sẽ không kết nối được."

**[Màn hình: App đã mở]**

**Lời thoại:**
> "Cài đặt xong, ứng dụng sẽ tự động mở lên."

---

## PHẦN 3: CẤU HÌNH PROXY (2:30 - 4:00)

**[Màn hình: Tab Proxy]**

**Lời thoại:**
> "Đầu tiên, chúng ta cần nhập thông tin proxy vào."

**[Hành động: Focus vào ô nhập proxy]**

**Lời thoại:**
> "Định dạng nhập proxy như sau:
> **username:password:host:port**"
>
> "Ví dụ: `user123:matkhau456:proxy.example.com:8080`"

**[Hành động: Gõ proxy vào]**

**Lời thoại:**
> "Nếu proxy không cần đăng nhập, chỉ cần nhập:
> **host:port**"
>
> "Ví dụ: `proxy.example.com:8080`"

**[Hành động: Nhập thêm proxy dòng thứ 2]**

**Lời thoại:**
> "Bạn có thể nhập **nhiều proxy**, mỗi dòng một proxy.
> Mỗi proxy sẽ chạy trên một port khác nhau."

**[Hành động: Chỉ vào Start Port]**

**Lời thoại:**
> "**Start Port** là port bắt đầu. Mặc định là 8080.
> - Proxy đầu tiên sẽ chạy ở port 8080
> - Proxy thứ hai ở port 8081
> - Và tiếp tục..."

**[Hành động: Click nút Start Proxy]**

**Lời thoại:**
> "Nhấn **Start Proxy** để khởi động."

**[Màn hình: Trạng thái Running]**

**Lời thoại:**
> "Khi thấy trạng thái **Running** và nút chuyển sang **Stop Proxy** là đã thành công."

---

## PHẦN 4: THIẾT LẬP RULES (4:00 - 6:00)

**[Hành động: Click tab Rules]**

**Lời thoại:**
> "Tiếp theo là phần quan trọng nhất - **thiết lập Rules** để phân luồng traffic."

**[Màn hình: Tab Rules trống]**

**Lời thoại:**
> "Rules quyết định website nào đi qua proxy, website nào đi thẳng."

**[Hành động: Click Add Rule]**

**Lời thoại:**
> "Nhấn **Add Rule** để thêm rule mới."

**[Hành động: Điền form rule]**

**Lời thoại:**
> "Ví dụ mình muốn **chỉ Facebook đi qua proxy**:
> - **Name**: Facebook qua proxy
> - **Pattern**: `*.facebook.com, *.fbcdn.net`
> - **Action**: Proxy
> - **Priority**: 1"

**[Hành động: Save rule]**

**Lời thoại:**
> "Nhấn **Save** để lưu."

**[Hành động: Thêm rule thứ 2]**

**Lời thoại:**
> "Tiếp theo, mình tạo rule cho **tất cả còn lại đi thẳng**:
> - **Name**: Còn lại đi thẳng
> - **Pattern**: `*` (dấu sao match tất cả)
> - **Action**: Direct
> - **Priority**: 100 (số lớn = ưu tiên thấp)"

**[Màn hình: Danh sách 2 rules]**

**Lời thoại:**
> "Giờ logic sẽ là:
> 1. Check Facebook trước (priority 1) → đi Proxy
> 2. Còn lại (priority 100) → đi Direct
>
> Như vậy chỉ Facebook tốn data proxy thôi!"

**[Màn hình: Giải thích pattern]**

**Lời thoại:**
> "Một số pattern hay dùng:
> - `*.google.com` - tất cả subdomain Google
> - `*.facebook.com, *.instagram.com` - nhiều domain, cách bởi dấu phẩy
> - `*` - match tất cả"

---

## PHẦN 5: KẾT NỐI TỪ THIẾT BỊ KHÁC (6:00 - 7:30)

**[Màn hình: Sơ đồ kết nối]**

**Lời thoại:**
> "Một tính năng hay là bạn có thể cho **điện thoại hoặc laptop khác** kết nối qua Proxy Data Saver."

**[Hành động: Mở CMD, gõ ipconfig]**

**Lời thoại:**
> "Đầu tiên, tìm IP máy tính đang chạy app.
> Mở CMD, gõ `ipconfig`.
> Tìm dòng **IPv4 Address**, ví dụ `192.168.1.100`."

**[Màn hình: Điện thoại - Settings WiFi]**

**Lời thoại:**
> "Trên điện thoại, vào **Settings → WiFi → tên mạng WiFi**"

**[Hành động: Cuộn xuống phần Proxy]**

**Lời thoại:**
> "Kéo xuống tìm phần **Proxy**, chọn **Manual**"

**[Hành động: Nhập thông tin]**

**Lời thoại:**
> "Nhập:
> - **Proxy hostname**: IP máy tính, ví dụ `192.168.1.100`
> - **Proxy port**: `8080`"

**[Hành động: Save]**

**Lời thoại:**
> "Nhấn **Save**. Giờ mọi traffic trên điện thoại sẽ đi qua Proxy Data Saver và được phân luồng theo rules."

---

## PHẦN 6: THEO DÕI TRAFFIC (7:30 - 8:30)

**[Hành động: Click tab Traffic]**

**Lời thoại:**
> "Tab **Traffic** cho phép bạn xem **real-time** các kết nối đang đi qua."

**[Màn hình: Traffic logs đang chạy]**

**Lời thoại:**
> "Mỗi dòng là một kết nối:
> - **Hostname**: Website đang truy cập
> - **Action**: Proxy hay Direct
> - **Matched Rule**: Rule nào đã match
> - **Bytes**: Dung lượng data"

**[Hành động: Trỏ vào một dòng Facebook]**

**Lời thoại:**
> "Như các bạn thấy, Facebook đang đi qua **Proxy**, còn các website khác đi **Direct** đúng như rule mình đã thiết lập."

---

## PHẦN 7: XEM THỐNG KÊ - DASHBOARD (8:30 - 9:30)

**[Hành động: Click tab Dashboard]**

**Lời thoại:**
> "Tab **Dashboard** hiển thị thống kê data đã sử dụng."

**[Màn hình: Dashboard với stats]**

**Lời thoại:**
> "Các thông số quan trọng:
> - **Total**: Tổng data đã dùng
> - **Via Proxy**: Data đi qua proxy (tốn data 4G)
> - **Direct**: Data đi thẳng (tiết kiệm được)
> - **Savings**: Phần trăm tiết kiệm"

**[Hành động: Click các nút Today/Week/Month]**

**Lời thoại:**
> "Bạn có thể xem theo **Today**, **Week**, **Month** hoặc **All**."

**[Hành động: Trỏ vào biểu đồ]**

**Lời thoại:**
> "Biểu đồ donut cho thấy tỷ lệ Proxy vs Direct trực quan."

**[Hành động: Trỏ vào Top Domains]**

**Lời thoại:**
> "Bảng **Top Domains** cho thấy website nào tốn nhiều data nhất."

---

## PHẦN 8: CÁC TIPS & LƯU Ý (9:30 - 10:30)

**[Màn hình: Tips list]**

**Lời thoại:**
> "Một số tips và lưu ý khi sử dụng:"

**Tip 1: Dark mode**
> "Nhấn icon mặt trời/mặt trăng trên titlebar để đổi Dark/Light mode."

**Tip 2: Tray icon**
> "Nhấn nút X không thoát app, chỉ ẩn vào system tray. Click icon tray để mở lại."

**Tip 3: Port conflict**
> "Nếu app báo lỗi không start được, có thể port 8080 đang bị dùng. Đổi Start Port sang số khác như 8888."

**Tip 4: Banking apps**
> "Một số app ngân hàng có bảo mật cao sẽ không hoạt động qua proxy. Đây là bình thường."

---

## PHẦN 9: KẾT THÚC (10:30 - 11:00)

**[Màn hình: Logo + thông tin]**

**Lời thoại:**
> "Vậy là mình đã hướng dẫn xong cách sử dụng **Proxy Data Saver**."
>
> "Tóm tắt lại:
> 1. Nhập proxy vào tab Proxy
> 2. Thiết lập rules để phân luồng
> 3. Kết nối thiết bị qua IP và port
> 4. Theo dõi traffic và xem thống kê tiết kiệm"
>
> "Nếu có thắc mắc, các bạn comment bên dưới nhé. Cảm ơn các bạn đã xem!"

**[Màn hình: Subscribe + Like]**

---

## Checklist quay video

- [ ] Chuẩn bị proxy test hoạt động
- [ ] Reset app về trạng thái mới (xóa rules, stats)
- [ ] Chuẩn bị điện thoại để demo kết nối
- [ ] Kiểm tra microphone
- [ ] Đóng các app không liên quan trên màn hình
- [ ] Bật Light mode cho dễ nhìn khi quay
