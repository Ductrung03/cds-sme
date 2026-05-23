# LUCKY.md - Quy tắc và Bối cảnh Dự án

File này định nghĩa các quy tắc vận hành và bối cảnh kỹ thuật cho hệ thống Đánh giá Chuyển đổi số SME. Mọi Agent và Developer phải tuân thủ nghiêm ngặt các hướng dẫn này.

## A. Quy tắc Vận hành Phổ quát

1.  **Giao tiếp và Tài liệu**:
    *   Sử dụng tiếng Việt làm ngôn ngữ chính trong code comment (nếu cần giải thích nghiệp vụ) và tài liệu.
    *   Mọi thay đổi quan trọng về kiến trúc hoặc logic nghiệp vụ phải được cập nhật vào `LUCKY.md` hoặc `DESIGN.md`.

2.  **Tiêu chuẩn Code**:
    *   **Clean Code**: Viết code tự giải thích (self-documenting), hạn chế comment thừa.
    *   **Type Safety**: Sử dụng TypeScript cho cả Frontend và Backend để đảm bảo an toàn dữ liệu.
    *   **Bất biến (Immutability)**: Ưu tiên sử dụng `const`, hạn chế `let`, không sử dụng `var`.
    *   **Xử lý lỗi**: Mọi API call và logic nghiệp vụ quan trọng phải có try-catch và log lỗi chi tiết.

3.  **Quy trình Git**:
    *   **Không commit tự tiện**: Chỉ thực hiện commit khi người dùng yêu cầu rõ ràng.
    *   **Thông điệp commit**: Tuân thủ định dạng `type(scope): description` (ví dụ: `feat(api): thêm endpoint khảo sát`).

4.  **Bảo mật**:
    *   **Tuyệt đối không lưu secrets** (API key, password, connection string) vào bất kỳ file markdown hay source code nào. Sử dụng `.env` (đã được gitignore).

5.  **Kiểm thử**:
    *   Khuyến khích viết Unit Test cho các thuật toán tính toán điểm (TOPSIS).

## B. Bối cảnh Dự án (Project Context)

### 1. Thông tin chung
*   **Tên dự án**: Hệ thống Đánh giá Mức độ Chuyển đổi số cho doanh nghiệp vừa và nhỏ (SME).
*   **Mục tiêu**: Giúp doanh nghiệp tự đánh giá và admin chấm điểm dựa trên các bộ tiêu chí chuẩn.
*   **Ngôn ngữ UI**: **100% Tiếng Việt**. Tuyệt đối không để sót các nhãn (label), thông báo lỗi hoặc nút bấm bằng tiếng Anh.

### 2. Công nghệ (Tech Stack)
*   **Frontend**: ReactJS (Vite, Tailwind CSS).
*   **Backend**: NodeJS (Express hoặc NestJS).
*   **Database**: SQL Server 2022 chạy trong Docker.
*   **AI**: Tích hợp hỗ trợ Admin phân tích các câu trả lời "Khác" trong khảo sát.

### 3. Nghiệp vụ Chính
*   **Đối tượng sử dụng**:
    *   **Người dùng (User)**: Đăng nhập, thực hiện nộp các khảo sát đánh giá.
    *   **Quản trị viên (Admin)**: Xem danh sách khảo sát, thực hiện chấm điểm, xem báo cáo.
*   **Thuật toán & Quy chuẩn**:
    *   Tính toán điểm dựa trên thuật toán **TOPSIS**.
    *   Tuân thủ **Phụ lục 3** (theo tài liệu hướng dẫn của Bộ/Ngành liên quan).
*   **Tính năng AI**: Hỗ trợ Admin review và phân loại các đáp án mở (đáp án "Khác") từ người dùng để đưa ra gợi ý chấm điểm chính xác.

### 4. Quy tắc Code & Triển khai
*   Ưu tiên hiệu năng và trải nghiệm người dùng mượt mà.
*   Mã nguồn phải được tổ chức rõ ràng theo module/feature.
*   Đảm bảo tính nhất quán giữa bản thiết kế (`DESIGN.md`) và thực tế triển khai.

## C. Backend Structure & Commands

### Directory Layout (`backend/`)
```
backend/
  src/
    config/       env.ts (zod validated)
    db/           pool.ts, repository.ts, migrate.ts, seed.ts
    middleware/    auth.ts, validate.ts, error-handler.ts
    modules/      auth/, questionnaire/, assessment/, admin/, health/
    services/     scoring.ts (TOPSIS), ai-review.ts (heuristic/openai/gemini), audit.ts
    types/        models.ts (Row interfaces)
    utils/        api-response.ts, errors.ts, logger.ts, async-handler.ts
    app.ts        Express app
    server.ts     Entry point
  migrations/     001_init.sql
  tests/          scoring.test.ts (21 tests)
```

### Commands
- `npm run dev` – Start with tsx hot-reload (port 4000)
- `npm run build` – TypeScript compile → dist/
- `npm run test` – vitest unit tests
- `npm run db:migrate` – Apply SQL migrations
- `npm run db:seed` – Seed demo data
- `npm run db:reset` – Drop + recreate + migrate + seed

### API Response Format
```json
{ "success": true, "data": {}, "error": null, "meta": { "timestamp": "..." } }
```

### Route Ordering Gotcha
Trong Express, các route literal (vd `/me`) phải đăng ký **TRƯỚC** route param (`/:id`)
trong cùng router; nếu không Express sẽ match `id="me"` và đẩy chuỗi không phải GUID
vào `sql.UniqueIdentifier`, gây 500 `INTERNAL_ERROR`.

### User Assessments API
- `GET /api/assessments/me` – DTO cho user hiện tại:
  `{ id, trangThai, maNganh, tenNganh?, ngayNop?, ngayTao }` (JOIN `Industries`,
  không SELECT *). Đây là nguồn dữ liệu cho màn Survey/Result của user.

### Admin Score Config API (Cấu hình điểm)
- `GET /api/admin/score-config` – trả `{ rankThresholds[], groupWeights[], rules }`.
  `groupWeights` chỉ lấy từ bộ khảo sát đang `IsActive = 1` (JOIN `QuestionnaireVersions`).
- `PATCH /api/admin/score-config/rank-thresholds/:id` – sửa `name|minScore|maxScore|description`.
  Server validate `minScore <= maxScore` (422 nếu sai). Audit `UPDATE_RANK_THRESHOLD`.
- `PATCH /api/admin/score-config/group-weights/:id` – sửa `weight` ∈ [0, 10]. Audit `UPDATE_GROUP_WEIGHT`.
- Router: `backend/src/modules/admin/admin.score-config.routes.ts` mount **trước**
  `admin.routes.ts` trong `app.ts` để tránh path collision (cùng nguyên tắc với
  `admin.questions.routes.ts` và `admin.appendix.routes.ts`).
- Frontend page: `frontend/src/pages/admin/ScoreConfig.tsx`, route `/admin/score-config`
  trong `AdminLayout` (sidebar “Cấu hình điểm”).

### Demo Accounts (seed idempotent — luôn được đảm bảo tồn tại)
| Email | Password | Role | Ghi chú |
|---|---|---|---|
| admin@cds.vn | Admin@2026! | admin | Quản trị viên |
| chuyenvien@cds.vn | Admin@2026! | admin | Chuyên viên đánh giá |
| user@cds.vn | User@2026! | user | User demo cơ bản |
| doanhnghiep@demo.vn | User@2026! | user | Doanh nghiệp Demo |
| banle@demo.vn | User@2026! | user | Ngành bán lẻ |
| logistics@demo.vn | User@2026! | user | Ngành logistics |
| giaoduc@demo.vn | User@2026! | user | Giáo dục đào tạo |
| khachsan@demo.vn | User@2026! | user | Lưu trú, khách sạn |
| duocpham@demo.vn | User@2026! | user | Dược phẩm |
| nhahang@demo.vn | User@2026! | user | Ăn uống, nhà hàng |
| nongnghiep@demo.vn | User@2026! | user | Nông nghiệp |
| xaydung@demo.vn | User@2026! | user | Xây dựng |

Seed (`backend/src/db/seed.ts`) lookup theo email: nếu user tồn tại → UPDATE FullName/Role/OrganizationName (KHÔNG đổi PasswordHash); nếu thiếu → INSERT. Có thể chạy lại `npm run db:seed` an toàn nhiều lần.

### Frontend Routing Convention
- **User routes** bọc trong `<Layout />` (header/footer cho người dùng cuối).
- **Admin routes** bọc trong `<AdminLayout />` (sidebar quản trị). Mọi route `/admin/*` PHẢI nằm trong nested route `AdminLayout` để sidebar hiển thị đúng.
- Admin assessment detail dùng đường dẫn **plural**: `/admin/assessments/:id`. Route singular `/admin/assessment/:id` được giữ làm redirect tương thích ngược.

### AI Review — Phân tích đáp án "Khác"
- Chỉ hiển thị nút **"Phân tích AI"** ở từng câu hỏi có `dapAnKhac` (người dùng tích "Khác" và tự nhập).
- Endpoint per-câu: `POST /api/admin/assessments/:id/questions/:qid/ai-review`
- Provider config trong `.env`: `AI_PROVIDER=gemini` + `GEMINI_API_KEY=<key từ Google AI Studio>`
- Model default: `GEMINI_MODEL=gemini-2.0-flash`. Có thể đổi sang `gemini-1.5-flash` hoặc `gemini-1.5-pro`.
- Fallback tự động về heuristic nếu API key không cấu hình hoặc lỗi mạng.

### Env File
Copy `.env.example` → `backend/.env`, edit as needed. Default DB password: `LuckyDev!2026`

### Docker
`docker compose up mssql -d` then `npm run db:migrate && npm run db:seed && npm run dev`
