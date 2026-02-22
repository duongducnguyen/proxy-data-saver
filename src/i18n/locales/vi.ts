export const vi = {
  app: {
    title: 'Proxy Data Saver',
    status: {
      running: 'Đang chạy',
      stopped: 'Đã dừng'
    },
    checking: 'Đang kiểm tra'
  },
  firewall: {
    title: 'Cần cấp quyền Firewall',
    description: 'Ứng dụng cần quyền Windows Firewall để các thiết bị trong mạng (điện thoại, laptop) có thể kết nối qua proxy.',
    requestPermission: 'Cấp quyền Firewall',
    checkAgain: 'Kiểm tra lại',
    hint: 'Nhấn nút ở trên để cấp quyền. Windows sẽ hiển thị hộp thoại UAC yêu cầu quyền quản trị viên.'
  },
  tabs: {
    dashboard: 'Bảng điều khiển',
    proxy: 'Proxy',
    rules: 'Quy tắc',
    traffic: 'Lưu lượng'
  },
  footer: {
    lan: 'LAN',
    proxies: 'Proxy',
    rules: 'Quy tắc',
    active: 'hoạt động'
  },
  proxy: {
    title: 'Danh sách Proxy',
    titleActive: 'Proxy đang chạy',
    status: {
      running: 'Đang chạy',
      stopped: 'Đã dừng',
      ok: 'OK',
      failed: 'Lỗi'
    },
    proxyCount: 'proxy',
    placeholder: `Nhập proxy, mỗi dòng một proxy:
username:password:hostname:port

Ví dụ:
user1:pass1:sg-pr.lunaproxy.net:23501
user2:pass2:us-pr.lunaproxy.net:23502

Hoặc không có auth:
hostname:port`,
    formatHint: 'Định dạng: username:password:host:port hoặc host:port',
    settings: {
      startPort: 'Port bắt đầu',
      portsRange: 'Ports',
      defaultAction: 'Hành động mặc định',
      useProxy: 'Dùng Proxy',
      directConnection: 'Kết nối trực tiếp',
      whenNoRule: 'Khi không có quy tắc nào khớp',
      autoStart: 'Tự động chạy khi khởi động'
    },
    actions: {
      save: 'Lưu',
      discard: 'Hủy',
      start: 'Khởi động',
      stop: 'Dừng tất cả',
      restart: 'Khởi động lại',
      starting: 'Đang khởi động...',
      stopping: 'Đang dừng...',
      restarting: 'Đang khởi động lại...',
      copy: 'Sao chép',
      copyAll: 'Sao chép tất cả'
    },
    table: {
      localPort: 'Port local',
      upstream: 'Proxy gốc',
      status: 'Trạng thái',
      lanAddress: 'Địa chỉ LAN'
    },
    hints: {
      configureDevices: 'Cấu hình thiết bị của bạn để sử dụng các địa chỉ này làm HTTP proxy.',
      yourLanIp: 'IP LAN của bạn',
      saveBeforeStart: 'Lưu hoặc huỷ thay đổi trước khi khởi động'
    },
    dismiss: 'Bỏ qua'
  },
  rules: {
    title: 'Quy tắc định tuyến',
    testRules: 'Kiểm tra',
    hideTester: 'Ẩn kiểm tra',
    addRule: 'Thêm quy tắc',
    editRule: 'Sửa quy tắc',
    noRules: 'Chưa có quy tắc nào. Thêm quy tắc để bắt đầu.',
    rulesInfo: 'Quy tắc được đánh giá theo thứ tự. Quy tắc khớp đầu tiên sẽ được áp dụng.',
    form: {
      name: 'Tên',
      namePlaceholder: 'VD: Chặn quảng cáo',
      pattern: 'Mẫu',
      patternPlaceholder: `Nhập mẫu, mỗi dòng một mẫu:
*.google.com
*.youtube.com
*.facebook.com`,
      patternHint: 'Dùng * làm ký tự đại diện. Mỗi mẫu một dòng.',
      action: 'Hành động',
      useProxy: 'Dùng Proxy',
      directConnection: 'Kết nối trực tiếp',
      priority: 'Độ ưu tiên',
      priorityHint: 'Số nhỏ hơn = ưu tiên cao hơn',
      enabled: 'Bật',
      save: 'Lưu quy tắc',
      cancel: 'Hủy',
      validating: 'Đang kiểm tra...',
      patternValid: 'Mẫu hợp lệ',
      patternInvalid: 'Mẫu không hợp lệ'
    },
    tester: {
      title: 'Kiểm tra quy tắc',
      hostname: 'Hostname kiểm tra',
      hostnamePlaceholder: 'VD: www.google.com',
      test: 'Kiểm tra',
      testing: 'Đang kiểm tra...',
      result: 'Kết quả',
      matchedRule: 'Quy tắc khớp',
      noMatch: 'Không có quy tắc nào khớp (sử dụng hành động mặc định)',
      action: {
        proxy: 'Dùng Proxy',
        direct: 'Kết nối trực tiếp'
      }
    },
    item: {
      enabled: 'Đang bật',
      disabled: 'Đã tắt',
      proxy: 'Proxy',
      direct: 'Trực tiếp',
      edit: 'Sửa',
      delete: 'Xóa',
      moveUp: 'Di chuyển lên',
      moveDown: 'Di chuyển xuống',
      confirmDelete: 'Bạn có chắc muốn xóa quy tắc này?'
    },
    dismiss: 'Bỏ qua',
    disabledWhileRunning: 'Dừng proxy để chỉnh sửa quy tắc'
  },
  traffic: {
    title: 'Giám sát lưu lượng',
    pause: 'Tạm dừng',
    resume: 'Tiếp tục',
    clear: 'Xóa',
    stats: {
      total: 'Tổng',
      proxy: 'Proxy',
      direct: 'Trực tiếp',
      hosts: 'Host'
    },
    filter: {
      placeholder: 'Lọc theo hostname...',
      all: 'Tất cả',
      proxy: 'Proxy',
      direct: 'Trực tiếp',
      allProxies: 'Tất cả Proxy',
      proxyPort: 'Port {port}'
    },
    paused: 'Giám sát lưu lượng đang tạm dừng. Nhấn Tiếp tục để tiếp tục.',
    table: {
      time: 'Thời gian',
      method: 'Phương thức',
      hostname: 'SNI / Hostname',
      action: 'Hành động',
      rule: 'Quy tắc'
    },
    noTraffic: 'Chưa có lưu lượng. Khởi động proxy và thực hiện một số yêu cầu.',
    noMatch: 'Không tìm thấy lưu lượng phù hợp.',
    showing: 'Hiển thị {count} / {total} mục'
  },
  dashboard: {
    title: 'Bảng điều khiển',
    filter: {
      allProxies: 'Tất cả Proxy'
    },
    period: {
      today: 'Hôm nay',
      week: 'Tuần',
      month: 'Tháng',
      all: 'Tất cả'
    },
    stats: {
      totalData: 'Tổng dữ liệu',
      proxyData: 'Qua Proxy',
      directData: 'Trực tiếp',
      savings: 'Tiết kiệm',
      requests: 'Yêu cầu'
    },
    topDomains: {
      title: 'Domain hàng đầu',
      domain: 'Domain',
      bytes: 'Dữ liệu',
      requests: 'Yêu cầu',
      action: 'Hành động',
      noData: 'Chưa có dữ liệu'
    },
    chart: {
      proxy: 'Qua Proxy',
      direct: 'Trực tiếp'
    },
    actions: {
      reset: 'Đặt lại',
      confirmReset: 'Bạn có chắc muốn đặt lại tất cả thống kê? Hành động này không thể hoàn tác.',
      refresh: 'Làm mới'
    },
    noData: 'Chưa có dữ liệu. Khởi động proxy và duyệt web để xem thống kê.'
  },
  language: {
    en: 'English',
    vi: 'Tiếng Việt'
  },
  update: {
    available: 'Có phiên bản mới: v{version}',
    download: 'Tải về'
  }
};
