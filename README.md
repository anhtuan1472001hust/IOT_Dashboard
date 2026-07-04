# IoT Office Dashboard

Web dashboard giám sát và điều khiển hệ thống IoT văn phòng thông minh — frontend cho
backend iot-project-server (Spring Boot). Xây bằng React + Vite + TypeScript.

Lưu ý quan trọng: Dashboard này không chạy độc lập được. Nó chỉ hiển thị dữ liệu do backend
cung cấp qua REST API. Muốn thấy dashboard hoạt động, bạn phải chạy đủ ba tầng theo thứ tự:
PostgreSQL, rồi Backend (Spring Boot), rồi Frontend (dashboard này).

---

## 1. Kiến trúc tổng thể

Hệ thống gồm ba tầng nối tiếp nhau:

- Tầng dữ liệu: PostgreSQL (cổng 5432, database tên "iot") — lưu toàn bộ dữ liệu.
- Tầng backend: Spring Boot (cổng 8080) — đọc/ghi database và cung cấp REST API dưới đường
  dẫn /api/v1.
- Tầng frontend: dashboard React + Vite (cổng 5173) — gọi API của backend và hiển thị.

Luồng hoạt động: Dashboard gửi yêu cầu REST (kèm JWT để xác thực) tới Backend; Backend truy
vấn PostgreSQL rồi trả dữ liệu JSON về cho Dashboard hiển thị.

Một số điểm cần biết:

- Frontend nói chuyện với backend hoàn toàn qua REST/JSON dưới /api/v1, xác thực bằng JWT.
- Không có WebSocket/SSE — các màn hình thời gian thực dùng cơ chế polling (tự gọi lại API
  mỗi vài giây).
- Backend chưa cấu hình CORS, nên khi chạy ở chế độ phát triển, dashboard dùng Vite proxy để
  chuyển đường dẫn /api sang http://localhost:8080 (tránh lỗi CORS). Xem file vite.config.ts.

---

## 2. Yêu cầu cài đặt

| Thành phần | Phiên bản | Dùng để | Bắt buộc |
|---|---|---|---|
| Node.js | 18 trở lên | chạy frontend (npm) | Có |
| Java (JDK) | đúng 21 | chạy backend | Có |
| PostgreSQL | 17 (16+ cũng được) | cơ sở dữ liệu của backend | Có |
| Git | mới | tải mã nguồn | Có |
| Source backend | iot-project-server | cung cấp API | Có |

Lưu ý về Java: backend ghim cứng JDK 21 trong file build.gradle. Nếu máy bạn có Java phiên bản
khác (ví dụ 17, 23, 25) thì Gradle sẽ báo lỗi "Cannot find a Java installation ... matching
languageVersion=21". Bắt buộc phải có JDK 21 — xem mục Xử lý sự cố ở phần 6.

---

## 3. Cách chạy — bốn bước

### Bước 1 — PostgreSQL

Cài PostgreSQL 17 từ trang https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
(giữ cổng 5432, đặt mật khẩu cho user postgres và ghi nhớ mật khẩu này). Sau đó tạo database
tên "iot". Cách nhanh bằng dòng lệnh (dùng psql trong thư mục cài PostgreSQL):

    psql -U postgres -c "CREATE DATABASE iot;"

Hoặc tạo bằng pgAdmin: chuột phải Databases, chọn Create, chọn Database, đặt tên "iot".

### Bước 2 — Backend (Spring Boot)

Backend nằm ở project iot-project-server. Từ thư mục gốc của backend:

    # Windows PowerShell — thay bằng mật khẩu postgres bạn đã đặt ở Bước 1
    $env:DB_PASSWORD = "mat_khau_postgres_cua_ban"
    .\gradlew.bat bootRun

    # macOS/Linux
    DB_PASSWORD=mat_khau_postgres_cua_ban ./gradlew bootRun

Chờ tới khi log hiện dòng "Started IotProjectServerApplication" và "Seeded local dev fixtures".
Backend chạy ở http://localhost:8080, tự tạo bảng (Flyway) và nạp sẵn dữ liệu mẫu (gồm hai khu
vực, cảm biến, cảnh báo, thiết bị) nên không cần chạy emulator hay MQTT để demo. Mặc định user
database là postgres; nếu bạn dùng user khác thì đặt thêm biến DB_USERNAME.

### Bước 3 — Frontend (dashboard này)

    git clone https://github.com/anhtuan1472001hust/IOT_Dashboard.git
    cd IOT_Dashboard
    npm install
    npm run dev

Mở trình duyệt tới địa chỉ http://localhost:5173

### Bước 4 — Đăng nhập

Dùng một trong các tài khoản mẫu, mật khẩu đều là changeme:

| Tài khoản | Vai trò | Demo được gì |
|---|---|---|
| admin | SUPER_ADMIN | tất cả và nhật ký kiểm toán |
| manager | ADMIN | quản lý và kiểm toán |
| operator | OPERATOR | điều khiển thiết bị, xử lý cảnh báo |
| tech | TECHNICIAN | chỉ điều khiển actuator thường |
| user | VIEWER | chỉ xem (nút điều khiển bị chặn) |

---

## 4. Tính năng theo trang

| Trang | Chức năng | API sử dụng |
|---|---|---|
| Tổng quan | Giám sát thời gian thực theo khu vực (đồng hồ nhiệt độ/độ ẩm, khói, trạng thái online) | /current-state, /connectivity, /alerts |
| Biểu đồ và thống kê | Lịch sử telemetry và các chỉ số nhỏ nhất/lớn nhất/trung bình (Recharts) | /telemetry |
| Thiết bị | Danh sách thiết bị và tình trạng (RAM/CPU/RSSI) | /devices, /devices/{id}/health |
| Điều khiển | Bật/tắt đèn, điều hòa, rèm, quạt (lệnh bất đồng bộ) | /actuator-state, /commands |
| Cảnh báo | Tiếp nhận và xử lý cảnh báo, phát hiện bất thường bảo mật | /alerts |
| Kiểm toán | Nhật ký hành động (chỉ ADMIN) | /audit-logs |

---

## 5. Cấu hình và đóng gói production

### Đổi địa chỉ backend

Mặc định proxy trỏ tới http://localhost:8080. Nếu backend nằm ở máy hoặc cổng khác:

    # Windows
    $env:VITE_PROXY_TARGET = "http://192.168.1.10:8080"; npm run dev

### Build bản production (đóng gói tĩnh)

    npm run build      # tạo thư mục dist chứa HTML/CSS/JS đã tối ưu
    npm run preview    # chạy thử bản build ở http://localhost:4173

Thư mục dist có thể đem deploy lên bất kỳ web server tĩnh nào (Nginx, Vercel, Netlify). Khi
deploy production, dashboard và backend nên đặt cùng origin hoặc đặt sau một reverse proxy có
thêm header CORS (vì backend chưa bật CORS sẵn).

---

## 6. Xử lý sự cố thường gặp

| Triệu chứng | Nguyên nhân | Cách khắc phục |
|---|---|---|
| Lỗi "Request failed with status code 500" khi đăng nhập hoặc dùng app | Backend hoặc PostgreSQL chưa chạy, khiến Vite proxy trả 500 | Chạy PostgreSQL (Bước 1) và backend (Bước 2) trước |
| Backend báo "Cannot find a Java installation ... languageVersion=21" | Máy không có JDK 21 (đang dùng bản khác) | Cài JDK 21 (ví dụ Temurin 21 tại https://adoptium.net/temurin/releases/?version=21). Nếu vẫn muốn giữ Java khác làm mặc định, tải JDK 21 dạng zip rồi chạy: ./gradlew bootRun "-Dorg.gradle.java.installations.paths=đường-dẫn-jdk-21" |
| Backend báo "password authentication failed for user postgres" | Sai biến DB_PASSWORD | Đặt đúng mật khẩu postgres đã tạo ở Bước 1 |
| Lỗi "npm: command not found" | Chưa cài Node.js, hoặc chưa mở lại terminal sau khi cài | Cài Node.js 18+, mở lại terminal |
| Trang trắng hoặc lỗi CORS trong Console | Gọi backend không qua proxy | Dùng npm run dev (đã cấu hình proxy), đừng mở file HTML trực tiếp |
| Đăng nhập báo sai mật khẩu | Tài khoản hoặc mật khẩu chưa đúng | Dùng tài khoản mẫu ở Bước 4 (mật khẩu changeme) |

---

## 7. Cấu trúc thư mục

    IOT_Dashboard/
      index.html              điểm vào HTML
      package.json            khai báo thư viện và script
      vite.config.ts          cấu hình Vite và proxy /api sang cổng 8080
      tsconfig*.json          cấu hình TypeScript
      src/
        main.tsx              khởi tạo React, Router, React Query
        App.tsx               định tuyến các trang
        api/                  client axios, endpoints, kiểu dữ liệu, lưu token
        auth/                 đăng nhập, bảo vệ route, phân quyền
        components/           Layout, Gauge, Tags, Loading
        lib/                  tiện ích định dạng, nhãn tiếng Việt
        pages/                bảy trang: Login, Overview, Telemetry, Devices, Control, Alerts, Audit
        styles/               tokens.css (design system) và global.css

---

## 8. Công nghệ sử dụng

React 18, Vite 5, TypeScript, React Router, TanStack Query (polling), Axios, Recharts.
