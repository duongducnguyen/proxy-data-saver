# Sơ đồ hoạt động Proxy Data Saver

## Sơ đồ 1: Luồng hoạt động chính

```mermaid
flowchart TD
    A[🖥️ Thiết bị của bạn<br/>PC, Điện thoại, Laptop] --> B[📦 PROXY DATA SAVER]

    B --> C{🔍 Kiểm tra Rules<br/>Domain này đi đâu?}

    C -->|✅ Qua Proxy| D[🌐 Proxy Server<br/>4G / Datacenter / ...]
    C -->|❌ Đi thẳng| E[🏠 Internet trực tiếp<br/>WiFi / Cáp quang]

    D --> F[🎯 Website đích]
    E --> F

    style A fill:#e1f5fe
    style B fill:#fff3e0
    style C fill:#fce4ec
    style D fill:#ffebee
    style E fill:#e8f5e9
    style F fill:#f3e5f5
```

## Sơ đồ 2: Ví dụ cụ thể

```mermaid
flowchart LR
    subgraph input [" 📱 Truy cập từ thiết bị "]
        A1[youtube.com]
        A2[work-tool.com]
        A3[spotify.com]
    end

    subgraph pds [" 📦 Proxy Data Saver "]
        B[Bộ lọc Rules]
    end

    subgraph output [" 🌐 Đường đi "]
        C1[❌ Đi thẳng<br/>Miễn phí]
        C2[✅ Qua Proxy<br/>Tốn lưu lượng]
        C3[❌ Đi thẳng<br/>Miễn phí]
    end

    A1 --> B
    A2 --> B
    A3 --> B

    B --> C1
    B --> C2
    B --> C3

    style C1 fill:#e8f5e9
    style C2 fill:#ffebee
    style C3 fill:#e8f5e9
```

## Sơ đồ 3: So sánh Trước vs Sau

```mermaid
flowchart TB
    subgraph before [" ❌ TRƯỚC KHI DÙNG "]
        direction TB
        B1[Tất cả traffic] --> B2[Proxy 4G<br/>50GB/tháng]
        B2 --> B3[Hết 50GB<br/>trong 1 tuần! 😢]
    end

    subgraph after [" ✅ SAU KHI DÙNG "]
        direction TB
        A1[Traffic công việc<br/>~10GB] --> A2[Proxy 4G]
        A3[YouTube, Spotify...<br/>~40GB] --> A4[WiFi nhà<br/>Miễn phí]
        A2 --> A5[Tiết kiệm 80%! 🎉]
        A4 --> A5
    end

    style before fill:#ffebee
    style after fill:#e8f5e9
```

## Sơ đồ 4: Chia sẻ LAN

```mermaid
flowchart TD
    subgraph lan [" 🏠 Mạng LAN văn phòng "]
        A1[💻 PC 1]
        A2[💻 PC 2]
        A3[📱 Điện thoại]
        A4[💻 Laptop]
    end

    B[📦 Máy chạy<br/>Proxy Data Saver<br/>192.168.1.100:8080]

    C[🌐 1 Proxy Server<br/>dùng chung]

    A1 --> B
    A2 --> B
    A3 --> B
    A4 --> B

    B --> C

    style B fill:#fff3e0
    style C fill:#e3f2fd
```

---

## Hướng dẫn render

1. **Mermaid Live Editor**: https://mermaid.live - Paste code vào và export PNG/SVG
2. **VS Code**: Cài extension "Markdown Preview Mermaid Support"
3. **GitHub**: Tự động render khi xem file .md

## Gợi ý sử dụng

- **Sơ đồ 1**: Dùng cho phần "Cách hoạt động" trong mô tả sản phẩm
- **Sơ đồ 2**: Dùng để minh họa ví dụ cụ thể
- **Sơ đồ 3**: Dùng để highlight lợi ích tiết kiệm
- **Sơ đồ 4**: Dùng cho tính năng chia sẻ LAN
