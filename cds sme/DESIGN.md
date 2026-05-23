# DESIGN.md — Hệ thống Thiết kế CDS SME

> Tài liệu chuẩn UI/UX cho hệ thống **Đánh giá Chuyển đổi số SME**.
> Mục tiêu: trải nghiệm **premium, hiện đại, tin cậy, 100% tiếng Việt** — đủ chi tiết để bất kỳ AI (Cursor, Claude Code, Copilot…) đều có thể implement nhất quán.

---

## 0. Bộ não — Quy ước chung

- **Ngôn ngữ**: 100% tiếng Việt. Mọi nút, label, error, empty state, tooltip phải được dịch chuẩn xác. Tham khảo từ điển ở §10.
- **Stack**: React 18 + TypeScript + Vite, Tailwind CSS v3, Headless UI / Radix UI cho a11y.
- **Phong cách**: premium, clean, generous whitespace. Không gradient tím/neon. Không dashboard mẫu rẻ tiền.
- **Cảm xúc thương hiệu**: tin cậy (xanh teal đậm), ấm áp (copper accent), chuyên nghiệp nhưng không cứng.

---

## 1. Brand mark

Logo dạng diamond (◆) bằng accent copper — đặt trong khung 40×40 bo `--r-md`, có gradient nhẹ `135deg, accent → accent-darker` và highlight phía trên `linear-gradient(180deg, rgba(255,255,255,.25), transparent 60%)`. Bên cạnh logo: tên brand **CDS SME** (Outfit 700, 16px) + tagline phụ "Quản trị hệ thống" (11px, sidebar-text-muted, letter-spacing 0.02em).

---

## 2. Color System (OKLCH-based, không hex tuỳ ý)

### 2.1 Brand
| Token | Giá trị | Dùng cho |
|---|---|---|
| `--primary` | `oklch(0.43 0.075 200)` — teal đậm | Nút chính, link, focus ring, biểu tượng trạng thái "đã chấm điểm" |
| `--primary-hover` | `oklch(0.38 0.085 200)` | Hover của primary |
| `--primary-tint` | `oklch(0.95 0.025 200)` | Nền card chủ đạo, badge nhẹ |
| `--accent` | `oklch(0.7 0.135 55)` — copper ấm | Điểm nhấn quan trọng (KHÔNG dùng cho hành động chính), nhãn AI, "đã nộp" |
| `--accent-tint` | `oklch(0.96 0.035 60)` | Nền badge accent, AI suggestion box |

### 2.2 Status
| Token | OKLCH | Dùng cho trạng thái |
|---|---|---|
| `--success` | `oklch(0.6 0.13 155)` | Đã công bố, hoàn thành |
| `--warning` | `oklch(0.74 0.14 70)` | Nháp, cần bổ sung |
| `--danger` | `oklch(0.58 0.18 25)` | Bắt buộc, xoá, lỗi |
| `--info` | `oklch(0.6 0.12 245)` | Chờ duyệt, thông tin |

Mỗi status có biến `--{status}-tint` tương ứng (lightness 0.95-0.96) cho background của badge / banner.

### 2.3 Surfaces
| Token | OKLCH | Dùng cho |
|---|---|---|
| `--surface-page` | `oklch(0.985 0.003 80)` | Nền trang (warm off-white) |
| `--surface` | `#ffffff` | Card, modal |
| `--surface-muted` | `oklch(0.97 0.004 80)` | Bảng header, foot, hover row |
| `--surface-sunken` | `oklch(0.955 0.005 80)` | Input disabled, nested container |

### 2.4 Sidebar (admin)
| Token | OKLCH |
|---|---|
| `--sidebar-bg` | `oklch(0.23 0.035 235)` — navy sâu |
| `--sidebar-bg-elev` | `oklch(0.27 0.04 235)` |
| `--sidebar-text` | `oklch(0.92 0.015 235)` |
| `--sidebar-text-muted` | `oklch(0.68 0.02 235)` |

### 2.5 Lines & Text
| Token | OKLCH |
|---|---|
| `--border` | `oklch(0.92 0.005 80)` |
| `--border-strong` | `oklch(0.86 0.008 80)` |
| `--text` | `oklch(0.22 0.01 240)` |
| `--text-muted` | `oklch(0.5 0.012 240)` |
| `--text-subtle` | `oklch(0.65 0.008 240)` |

### 2.6 Quy tắc dùng màu

- **KHÔNG được**: gradient tím-xanh kiểu Stripe, neon glow, màu chói saturation > 0.18.
- Mỗi screen tối đa **2 màu accent** (primary + 1 status hoặc accent).
- Saturation của off-white/black không vượt 0.02.
- WCAG AA tối thiểu: text/bg ratio ≥ 4.5:1; large text ≥ 3:1.
- Map trạng thái sang token (KHÔNG hardcode hex):
  - `draft` → warning · `submitted` → accent · `reviewing` → info · `scored` → primary · `published` → success.

---

## 3. Typography

### 3.1 Font

```
@import "Outfit:wght@300;400;500;600;700"
@import "JetBrains Mono:wght@400;500;600"
```

- **Body & display**: `Outfit` (toàn bộ giao diện). Outfit có range geometric tốt, dễ đọc cho tiếng Việt có dấu, hỗ trợ display sizes.
- **Mono**: `JetBrains Mono` — chỉ dùng cho **mã (BKS-0042, S03_01), số liệu khoa học (điểm 84.7), timestamp, kbd**.
- Fallback chuỗi: `ui-sans-serif, system-ui, sans-serif`.

> ❌ KHÔNG dùng Inter / Roboto / Arial / Open Sans làm primary — đã quá phổ biến, "AI slop" feel.

### 3.2 Type scale

| Token | Size / Line / Weight / Letter | Dùng cho |
|---|---|---|
| Display | 40 / 44 / 600 / -0.025em | Hero survey |
| H1 | 28 / 34 / 600 / -0.02em | Page title |
| H2 | 22 / 28 / 600 / -0.01em | Section header (group) |
| H3 | 18 / 24 / 600 / -0.01em | Card title trong drawer |
| Title | 16 / 22 / 600 / -0.005em | Card title chung |
| Body | 14 / 21 / 400 | Default |
| Body-medium | 14 / 21 / 500 | Nhấn nhẹ |
| Small | 13 / 19 / 400 | Sub-text |
| XS | 12 / 16 / 400 | Hint, table sub |
| Micro | 11 / 14 / 600 / 0.08em UPPERCASE | Table header, eyebrow |

Áp dụng `font-feature-settings: "ss01", "cv11"` cho Outfit.

---

## 4. Spacing & Layout

### 4.1 Scale (bội số 4)
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 96`

### 4.2 Radius
| Token | Giá trị |
|---|---|
| `--r-xs` | 6px — chip nhỏ, kbd |
| `--r-sm` | 8px — input nhỏ, btn-sm |
| `--r-md` | 12px — button, input, badge nội bộ |
| `--r-lg` | 16px — card, stat |
| `--r-xl` | 20px — survey qcard, hero card |
| `--r-2xl` | 28px — hero pill |
| `--r-full` | 999px — pill, avatar, chip |

### 4.3 Shadow (warm layered — KHÔNG cool blue)

```css
--sh-xs:  0 1px 2px rgba(20,30,48,.04);
--sh-sm:  0 1px 2px rgba(20,30,48,.04), 0 2px 4px rgba(20,30,48,.04);
--sh-md:  0 2px 4px rgba(20,30,48,.04), 0 6px 16px rgba(20,30,48,.06);
--sh-lg:  0 4px 8px rgba(20,30,48,.05), 0 16px 32px rgba(20,30,48,.08);
--sh-xl:  0 8px 16px rgba(20,30,48,.06), 0 24px 48px rgba(20,30,48,.12);
```

### 4.4 Layout grid

- **Admin shell**: `grid-template-columns: 264px 1fr` — sidebar cố định, main scroll riêng, topbar `position: sticky; top: 0` có `backdrop-filter: blur(12px)`.
- **User survey**: full-bleed, max-width container 920px, hero centered.
- **Page padding**: 28px 32px desktop / 20px 24px tablet.
- **Card-grid gap**: 20px desktop, 16px tablet.

### 4.5 Responsive break

| Tên | Width | Behavior |
|---|---|---|
| Desktop | ≥1280 | 4-col KPI, sidebar mở |
| Laptop | 1024–1280 | 4-col KPI, sidebar mở |
| Tablet | 768–1023 | 2-col KPI, sidebar thu gọn icon-only |
| Mobile | <768 | 1-col, sidebar drawer overlay |

---

## 5. Motion

- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (`--ease-out`) cho transition; `cubic-bezier(0.34, 1.56, 0.64, 1)` (`--ease-spring`) cho toggle/checkbox.
- Duration: 120ms (fast/hover) · 200ms (default) · 320ms (modal/drawer in).
- Fade-in stagger 60ms cho list (qcard, table row sau filter).
- Modal: zoom-in 96% → 100% + scrim fade.
- Drawer: slide từ right `translateX(100%) → 0`.
- **KHÔNG** dùng motion > 400ms, không bounce dài, không parallax.

---

## 6. Components Library

### 6.1 Button

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| primary | `--primary` | `#fff` | — | CTA chính (1/screen) |
| secondary | `#fff` | `--text` | `--border-strong` | Hành động phụ |
| ghost | transparent | `--text-muted` | — | Trong table, toolbar |
| accent | `--accent` | `#fff` | — | Hành động "AI suggest" |
| danger | `--danger` | `#fff` | — | Xoá, từ chối |

Sizes: `xs` (26h, 12pt) · `sm` (32h, 13pt) · default (40h, 14pt) · `lg` (46h, 15pt).
Icon-only: thêm class `btn--icon` (40×40), không hiện text. Có hỗ trợ `icon` (trái) và `iconRight` (phải).
**States bắt buộc**: hover, focus-visible (ring 3px `--primary-tint`), active (translateY 1px), disabled (opacity 0.5, cursor not-allowed).

### 6.2 Input / Select / Textarea

- Height: 42px (default), 36px (sm), 32px (xs).
- Padding: 0 14px; radius `--r-md`; border `--border-strong`.
- **Focus**: border `--primary` + ring `0 0 0 4px var(--primary-tint)` + background `#fff`.
- **Error**: border `--danger` + ring danger-tint, có icon ⚠ + message `--danger` 12pt.
- Select: appearance-none + custom chevron SVG inline.
- Disabled: background `--surface-muted`, text muted, không hover effect.
- Hỗ trợ `input-group` với `input-group__icon` (absolute left 12px) cho search.

### 6.3 Radio Card / Check Card

- Padding 14×16, radius `--r-md`, border `1.5px` để nổi khi checked.
- Checked: border `--primary`, bg `--primary-tint`, dot/check fill primary.
- Hover: border `--border-strong`, bg `--surface-muted`.
- Hint phụ 12pt muted bên dưới label.

### 6.4 Toggle

38×22px pill, knob trắng 16px shadow nhẹ; spring transition khi flip; bg `--primary` khi on.

### 6.5 Badge

Pill 24px height, radius `--r-full`. Variants: primary/accent/success/warning/danger/info/neutral. Optional `dot` (6×6 currentColor) bên trái.

### 6.6 Status Badge mapping

```js
{
  draft:     { variant: "warning", text: "Nháp",       dot: true },
  submitted: { variant: "accent",  text: "Đã nộp",     dot: true },
  reviewing: { variant: "info",    text: "Chờ duyệt",  dot: true },
  scored:    { variant: "primary", text: "Đã chấm điểm", dot: true },
  published: { variant: "success", text: "Đã công bố", dot: true },
}
```

### 6.7 Card

`background: --surface; border: 1px solid --border; radius: --r-lg; shadow: --sh-sm`.
- `card__head` 18×22 padding, border-bottom; title 16/600, sub 13 muted.
- `card__body` padding 22 (hoặc 0 nếu chứa table).
- `card__foot` padding 14×22, bg `--surface-muted`, border-top.

### 6.8 Stat Card

`padding: 20 22 22`; icon 40×40 bo 12, bg `--{accent}-tint`, color `--{accent}`; label 13 muted; value 34/600 Outfit, letter -0.02em; delta pill 12pt với arrow icon (success/danger/neutral tint); strip rule 3px ở đáy với progress bar color theo accent. Hover: `translateY(-2px)`.

### 6.9 Table

- Border-collapse separate, không vertical border.
- Header: 11pt uppercase 0.08em letter-spacing, weight 600 muted, bg `--surface-muted`.
- Body row: padding 16, border-bottom `--border`, hover bg `--surface-muted`.
- Cột actions: `text-align: right; width: 1%; white-space: nowrap`.
- `cell-primary` 14/600, `cell-sub` 12 muted.
- Mỗi row tối đa 5 actions hiện thị (eye/edit/more), dồn vào dropdown nếu nhiều hơn.

### 6.10 Chip Filter

Pill 32h, padding 0×14; default border `--border-strong` text muted; active: bg `--text`, color #fff. Có thể nhúng `chip__count` (pill nhỏ 11pt).

### 6.11 Progress

`height: 6px; background: --border; radius: 999px;` bar fill `--primary` (hoặc accent/success variant). Transition width 500ms ease-out.

### 6.12 Stepper

Số tròn 24px, current = bg primary white; done = bg success + checkmark; pending = bg muted muted-border. Line nối flex-1 height 2px, bg `--success` khi done. Sticky top trong survey (top 84px sau topbar).

### 6.13 Tabs

Underline style, height ~40, gap 4. Active: color `--primary` + border-bottom 2px primary, mb -1 để overlap với border của card.

### 6.14 Drawer / Modal

- **Scrim**: fixed inset 0, bg `oklch(0.2 0.02 240 / 0.4)` + `backdrop-filter: blur(4px)`, z 50.
- **Drawer**: right slide, width 540 (default) / 620 (rich content), shadow `--sh-xl`, có head (22×28) / body (24×28 scroll) / foot (16×28 bg muted right-align buttons).
- **Modal**: center grid, card 480px max, zoom-in spring.

### 6.15 Topbar (admin)

- Sticky, glass: `rgba(255,255,255,0.7)` + `backdrop-filter: blur(12px)`, border-bottom 1px.
- Crumbs (13pt muted, last bold), search field max-w 380, kbd ⌘K.
- 3 icon-buttons (help/bell/settings) 38×38, có dot indicator khi có thông báo.
- Primary action ở cuối (luôn 1 button).

### 6.16 Sidebar (admin)

- Width 264, padding 16×12, bg navy, sticky height 100vh.
- Section labels uppercase 10pt 0.12em.
- Nav item: 10×12 padding, radius `--r-sm`, icon 18 + label 14/500.
- Active item: bg `linear-gradient(90deg, lighter-bg, transparent)`, color #fff, có **accent stripe 3px** màu copper bên trái (left -12px).
- User card đáy: bg elevated, avatar 36 + name/email + logout icon button.

### 6.17 AI Suggestion box (đặc thù CDS SME)

```
padding: 16; radius: --r-md;
background: linear-gradient(135deg, var(--accent-tint) 0%, transparent 100%);
border: 1px solid oklch(0.85 0.07 60);
```

Có eyebrow "ĐỀ XUẤT TỪ AI" + icon sparkles `--accent`, content gồm dropdown phân loại + 5-button score selector (1-5, bg accent khi active).

### 6.18 Charts

- **Radar**: 6 trục, polygon grids 4 mức (25/50/75/100%), data polygon fill `--primary` 18% opacity + stroke 2.5px, dot 4px white-bordered. Labels 11pt muted ở 118% radius; score value 11pt mono primary ở 65% radius.
- **Bar / Distribution**: horizontal bar 6×W, mỗi level dùng màu riêng (xem §2.2 + LV1=danger → LV5=info tone), label trái + count phải.
- **Level Spectrum**: thanh ngang phân khúc theo width = (max-min+1), height 16, có shadow inset; labels phía dưới căn theo flex.

---

## 7. Key Screens

### 7.1 User — Survey Form
**Route**: `/survey` (hoặc public landing → /survey/:id sau khi login)

Layout:
1. **Topbar glass** với brand + indicator "Đã lưu nháp" + user card + nút Đăng xuất
2. **Hero** (chỉ ở step 0): pill "Phiên bản 1.0 — 2026", h1 40/600 với line-break, sub 16 muted
3. **Stepper sticky** dưới topbar (top 84): info + 7 nhóm + review
4. **Step body**:
   - Step 0 (Thông tin): 2-col grid input + radio-card-grid cho ngành (auto-fill 200px)
   - Step group: section header (avatar number + name + meta) → list **qcard** (radius xl, padding 22×28) cho từng câu hỏi → option grid radio/checkbox + dashed "Khác" input pencil-icon
   - Step review: success illustration + 2-stat box + per-group completion list
5. **Action bar sticky đáy**: bg glass white 0.9, Trở lại trái + Lưu nháp + Tiếp tục/Nộp phải, progress bar ở giữa với count.

**Auto-save**: debounce 500ms sau khi user trả lời, hiển thị "Đã lưu nháp ✓" 600ms.

### 7.2 Admin — Dashboard
- Page head: title + sub + select kỳ.
- KPI grid 4 col (Tổng nộp / Chờ duyệt / Đã chấm / Đã công bố) — mỗi card khác accent, delta pill, progress strip.
- Main split 2fr/1fr: bảng "Bài khảo sát gần đây" + side stack (Phân bố cấp độ + AI Queue Mini).

### 7.3 Admin — Bài khảo sát
- Chip filter row (all/draft/submitted/reviewing/scored/published) với count.
- Search + sector filter bên phải.
- Table 9-col (checkbox, mã/DN, ngành, status, điểm, cấp độ, AI review count, time, actions).
- Footer paginator.
- Click row → **drawer 620px** chi tiết với KPI grid + radar mini + breakdown per group.

### 7.4 Admin — Quản lý câu hỏi
- 240px sidebar group list (count badge) + main area card với toolbar + table.
- Edit modal: drawer 560 với textarea câu hỏi + group/type select + 2 toggles + dynamic options list (drag/delete + score input).

### 7.5 Admin — Phụ lục III
- Chip filter ngành.
- Section per ngành: card với head (icon Building + tên + meta) → grid auto-fill 320 các SolutionCard.
- **SolutionCard**: left-border 3px (primary cho tiền đề / accent cho phụ thuộc), code mono + badge type, arrow→ depends, hover ghost-buttons sửa/xoá.

### 7.6 Admin — Cấu hình điểm (TOPSIS)
- **RuleCard grid 3-col** giải thích algorithm (icon + title + body).
- Warning banner WCAG audit log.
- Table levels editable inline (5 row, color swatch + min/max input + desc input + save).
- **LevelSpectrum** visual (thanh phân khúc + labels).
- Table group weights với progress bar hiện tại + input new + save.

### 7.7 Admin — AI Review
- 360px queue list trái + detail card phải.
- Queue item: meta mono + confidence badge + question + raw answer truncated.
- Detail: company avatar + meta + confidence; question; raw answer (italic muted box); **AI Suggest gradient box** với dropdown phân loại + 5-button score; note textarea; foot 4 actions (Bỏ qua / AI gợi ý khác / Duyệt).

### 7.8 Admin — Báo cáo
- Split 1.4fr/1fr: card báo cáo chính với info DN + level badge + RadarFull 320px + 3 ScoreBox; side: bar list per group + recommendation list (giải pháp đã/chưa đạt).

---

## 8. States — Mỗi component phải có

| State | Trigger | Visual |
|---|---|---|
| **Default** | — | baseline |
| **Hover** | pointer over | border đậm hơn, bg muted-tint, cursor pointer |
| **Focus-visible** | tab keyboard | ring 3-4px `--primary-tint` ngoài, không outline mặc định |
| **Active/Pressed** | mousedown | translateY(1px) hoặc bg deeper |
| **Disabled** | aria-disabled | opacity 0.5, cursor not-allowed, không hover |
| **Loading** | async | spinner icon (Loader) + text "Đang xử lý…" |
| **Error** | validation | border `--danger`, ring danger-tint, message dưới |
| **Empty** | no data | `.empty` block: icon 64 + title 16/600 + sub 13 muted |
| **Success** | post-action | toast 4s hoặc inline check-icon success |

---

## 9. Accessibility

- WCAG 2.1 AA tối thiểu.
- Mọi icon đơn lẻ có `aria-label` tiếng Việt; icon đi kèm text → `aria-hidden`.
- Tất cả form input có `<label>` liên kết qua `htmlFor` / `id`.
- Focus trap trong modal/drawer; Esc đóng; trả focus về trigger.
- Stepper: tab focus theo thứ tự bước, mũi tên trái/phải để di chuyển.
- Skip-link "Bỏ qua đến nội dung chính" cho keyboard user.
- Contrast: primary trên white = 7.2 (AAA), accent trên white = 4.6 (AA).
- Reduced motion: tôn trọng `prefers-reduced-motion` → disable slide/zoom, dùng fade duration 80ms.

---

## 10. Từ điển Tiếng Việt (chuẩn hoá copy)

| Khái niệm | UI label | Notes |
|---|---|---|
| Submit | Nộp / Gửi | "Nộp khảo sát", "Gửi yêu cầu" |
| Save | Lưu | "Lưu nháp", "Lưu thay đổi" |
| Cancel | Huỷ | KHÔNG "Hủy bỏ" |
| Edit | Sửa / Chỉnh sửa | Button: "Sửa"; modal title: "Chỉnh sửa câu hỏi" |
| Delete | Xoá | KHÔNG "Xóa bỏ" |
| Required | Bắt buộc | Asterisk * màu danger |
| Optional | Tuỳ chọn | |
| Search | Tìm kiếm / Tìm | Placeholder: "Tìm doanh nghiệp, câu hỏi…" |
| Filter | Bộ lọc / Lọc | |
| Approve | Duyệt | "Duyệt và chấm điểm" |
| Reject | Từ chối | |
| Loading | Đang tải… | |
| Saved | Đã lưu | Cờ "Đã lưu nháp ✓" |
| Submitted | Đã nộp | Status badge accent |
| Pending review | Chờ duyệt | Status badge info |
| Scored | Đã chấm điểm | Status badge primary |
| Published | Đã công bố | Status badge success |
| Draft | Nháp | Status badge warning |
| Other | Khác | Option cuối + textarea AI sẽ phân loại |
| Confidence | Độ tin cậy | "Độ tin cậy 94%" |
| Level (CĐS) | Cấp độ | "Cấp độ 4 — Khá" |
| Group (câu hỏi) | Nhóm | "Nhóm 1: Thông tin chung" |
| Weight | Trọng số | Mono number |
| Threshold | Ngưỡng | |
| Audit log | Nhật ký audit | |

**Quy tắc**: dấu chấm câu Việt; viết hoa đầu câu chữ thường (không Title Case kiểu English). Số có 4+ chữ số dùng dấu chấm: `1.250 doanh nghiệp`.

---

## 11. Cấu trúc thư mục đề xuất

```
src/
  components/
    ui/                Button, Input, Select, Badge, Card, Stat, Toggle, RadioCard, Progress, Tabs, Chip, Drawer, Modal, Avatar
    layout/            Sidebar, Topbar, PageHeader, PageContainer
    charts/            Radar, BarDistribution, LevelSpectrum
    domain/            StatusBadge, LevelBadge, SolutionCard, AIQueueItem, AISuggestBox, QuestionCard
  pages/
    admin/             Dashboard, Assessments, Questions, Solutions, Scoring, AIReview, Reports
    survey/            Survey (Stepper container) + steps/Info, GroupStep, ReviewStep
  styles/
    tokens.css         CSS vars (clone từ §2-4)
    base.css           reset + body + scrollbar
  lib/
    topsis.ts          Pure function tính TOPSIS
    formatters.ts      formatScore, formatDate, formatVNCurrency
  data/
    sectors.ts, questionGroups.ts, levels.ts, solutions.ts
```

---

## 12. Implementation Checklist (cho AI dev)

- [ ] Cài Outfit + JetBrains Mono qua `<link>` hoặc `@fontsource`.
- [ ] Copy nguyên `tokens.css` (CSS variables) trước khi viết Tailwind config.
- [ ] Mọi component dùng CSS variable, KHÔNG hardcode hex.
- [ ] Tailwind config extend colors từ `var(--primary)` etc. để class `bg-primary` map đúng token.
- [ ] Mọi page-title dùng class `font-display` + tracking tight.
- [ ] Stepper / Drawer phải có Esc + click-outside + focus trap (dùng Radix Dialog hoặc Headless Dialog).
- [ ] Mọi async action (nộp, duyệt) phải có optimistic UI + rollback nếu lỗi.
- [ ] Survey auto-save mọi 500ms debounce; lưu vào localStorage + API.
- [ ] AI Review: confidence ≥ 90% → auto-suggest active state nhấn mạnh; < 70% → cảnh báo "Độ tin cậy thấp" warning badge.
- [ ] Chart radar: SVG inline, KHÔNG dùng chart.js (quá nặng cho 6-trục đơn giản).
- [ ] Audit log entry phải có: actor, action, timestamp ISO, before, after, reason.
- [ ] Test responsive ≥ 1280, 1024, 768.

---

## 13. Anti-patterns (cấm)

❌ Gradient tím-cam-xanh kiểu "AI startup landing".
❌ Card có left-border-accent vô tội vạ cho mọi list item.
❌ Icon vẽ SVG phức tạp tự bịa (đặc biệt với illustration con người, thiết bị). Dùng lucide-style minimal hoặc placeholder.
❌ Emoji decoration (✨📊📈) trong UI thật.
❌ Box-shadow neon glow (blur > 32px, sat cao).
❌ Skeuomorphic 3D buttons.
❌ Animations dài > 400ms, bounce nhảy nhiều lần.
❌ Inter/Roboto/Arial làm primary font.
❌ Hardcode "Submit", "Cancel", "OK", "Yes/No" — phải tiếng Việt.
❌ Dùng emoji thay icon trong button/menu.
❌ Saturation > 0.18 cho text/border, > 0.14 cho fill chính.

---

**Phiên bản**: 2.0 — 2026
**Người duyệt**: Design Lead CDS SME
