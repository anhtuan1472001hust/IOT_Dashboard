# IoT Office Dashboard

Web dashboard giám sát & điều khiển hệ thống IoT văn phòng thông minh — frontend cho
`iot-project-server` (Spring Boot). Xây bằng **React + Vite + TypeScript**.

Phục vụ đồ án môn *Kiến trúc và bảo mật ứng dụng IoT*, làm nổi bật 4 nhóm chức năng:

| Nhóm | Trang | Endpoint chính |
|---|---|---|
| Giám sát realtime | Tổng quan | `GET /current-state`, `/connectivity`, `/alerts?status=OPEN` (polling) |
| Biểu đồ & thống kê | Biểu đồ | `GET /telemetry?sensorId=&from=&to=` + Recharts |
| Điều khiển thiết bị | Điều khiển | `GET /actuator-state`, `POST /commands`, `GET /commands/{id}` |
| Bảo mật & cảnh báo | Cảnh báo, Kiểm toán | `GET /alerts`, `:acknowledge`/`:resolve`, `GET /audit-logs` |

## Kiến trúc & lựa chọn thiết kế

- **Polling, không WebSocket.** Backend không có push (SSE/WebSocket) — mọi view realtime
  poll các endpoint current-state rẻ qua TanStack Query `refetchInterval` (5–15s).
- **Vite dev proxy giải quyết CORS.** Backend chưa cấu hình CORS; `vite.config.ts` proxy
  `/api` → `http://localhost:8080`, nên trình duyệt gọi same-origin.
- **JWT + refresh token xoay vòng.** `src/api/tokenStore.ts` giữ access token trong bộ nhớ,
  refresh token trong localStorage; axios interceptor (`src/api/client.ts`) tự gắn Bearer,
  thêm `X-Correlation-Id`, và refresh khi gặp 401.
- **Gate UI theo vai trò, server là chân lý.** `src/auth/roles.ts` ẩn/hiện nút theo thứ bậc
  `SUPER_ADMIN > ADMIN > OPERATOR > TECHNICIAN > VIEWER`, nhưng luôn hiển thị lỗi 403/409 thật
  từ máy chủ.
- **Idempotency-Key** (UUID) tự sinh cho mỗi lệnh `POST /commands`.

## Cấu trúc thư mục

```
src/
  api/        client.ts (axios+interceptor), endpoints.ts, types.ts, tokenStore.ts
  auth/       AuthContext.tsx, ProtectedRoute.tsx, roles.ts
  components/ Layout, Tags, Loading
  lib/        format.ts, labels.ts
  pages/      Login, Overview, Telemetry, Devices, Control, Alerts, Audit
  styles/     tokens.css, global.css
```

## Chạy dev

Yêu cầu: Node 18+ và backend chạy ở `http://localhost:8080` (profile `local`).

```bash
npm install
npm run dev
# mở http://localhost:5173
```

Backend profile `local` tự nạp dữ liệu mẫu (`LocalDevSeed.java`): 2 khu vực `office_1`,
`meeting`, ~6h telemetry, thiết bị online/offline, actuator "drift", cảnh báo — đủ để demo
toàn bộ dashboard **không cần chạy emulator hay MQTT**.

### Tài khoản demo (mật khẩu `changeme`)

| Tài khoản | Vai trò | Dùng để demo |
|---|---|---|
| `admin` | SUPER_ADMIN | mọi thứ + kiểm toán |
| `manager` | ADMIN | kiểm toán, quản lý |
| `operator` | OPERATOR | điều khiển, tiếp nhận/xử lý cảnh báo |
| `tech` | TECHNICIAN | chỉ điều khiển actuator routine |
| `user` | VIEWER | chỉ xem (nút điều khiển bị chặn) |

## Build

```bash
npm run build      # tsc -b + vite build -> dist/
npm run preview
```

## Đổi địa chỉ backend

Sửa target proxy qua biến môi trường khi chạy dev:

```bash
VITE_PROXY_TARGET=http://192.168.1.10:8080 npm run dev
```
