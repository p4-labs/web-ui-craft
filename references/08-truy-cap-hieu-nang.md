# 08 — Trợ năng (a11y) & hiệu năng

Mục lục: 1. HTML ngữ nghĩa · 2. Bàn phím & focus · 3. Mẫu ARIA hay dùng · 4. Tương phản & kích thước ·
5. Chế độ người dùng (reduced motion, forced colors, transparency) · 6. Hiệu năng: chỉ số · 7. Font ·
8. Ảnh & media · 9. JS & DOM · 10. Mạng & cache

---

## 1. HTML ngữ nghĩa

- `<button>` cho hành động, `<a href>` cho điều hướng. Không `<div onclick>` (không Tab được, không Enter
  được, trình đọc màn hình không biết là nút).
- Landmark: `<header>`, `<nav>`, `<main>` (một), `<aside>`, `<footer>`; `aria-label` phân biệt khi có hai
  `<nav>`.
- Heading theo thứ tự (h1 → h2 → h3), không chọn heading theo cỡ chữ — cỡ chữ là việc của CSS.
- Danh sách là `<ul>/<ol>`; bảng dữ liệu là `<table>` có `<th scope>`.
- `<dialog>` cho hộp thoại; `<details>/<summary>` cho khối mở/đóng; `popover` cho menu/tooltip đơn giản.
- `<html lang="vi">`; đoạn tiếng Anh `<span lang="en">`.
- `<label for>` cho mọi input; nhóm radio trong `<fieldset><legend>`.

## 2. Bàn phím & focus

- Tab đi hết mọi điều khiển theo thứ tự đọc; không `tabindex` dương.
- `:focus-visible` rõ trên mọi nền (vòng 2px màu brand, offset 2px); không `outline: none` mà không có
  thay thế (audit-css bắt lỗi này).
- Esc đóng dialog/ngăn kéo/menu; focus trả về nút đã mở nó.
- Phím mũi tên trong nhóm (tablist, radiogroup, menu, toolbar) theo **roving tabindex**: chỉ mục đang
  chọn có `tabindex="0"`, còn lại `-1`; ←/→ (hoặc ↑/↓) di chuyển, Home/End về đầu/cuối.
- Phím tắt: không chiếm phím của trình duyệt/trình đọc màn hình; hiển thị trong tooltip/`<kbd>`; không
  kích hoạt khi đang gõ trong input (trừ Esc, Ctrl+Enter).
- "Skip link" (`Bỏ qua tới nội dung`) cho trang có nav dài.
- Phần ẩn nhưng còn trong DOM: `inert` (07 mục 10).

## 3. Mẫu ARIA hay dùng

| Thành phần | Thuộc tính |
|---|---|
| Tab | `role="tablist"` › `role="tab" aria-selected aria-controls` ; `role="tabpanel" aria-labelledby` |
| Nút bật/tắt | `aria-pressed="true|false"` |
| Nút mở khối | `aria-expanded` + `aria-controls` |
| Mục điều hướng hiện tại | `aria-current="page"` |
| Nút bận | `aria-busy="true"` (+ chữ "Đang tạo…") |
| Nút bị chặn có lý do | `aria-disabled="true"` + `title`/`aria-describedby` |
| Input lỗi | `aria-invalid="true"` + `aria-describedby="id-lỗi"` |
| Icon trang trí | `aria-hidden="true"` (SVG trong nút có chữ) |
| Nút chỉ có icon | `aria-label="Gửi"` |
| Trạng thái đổi | `role="status"` (polite) / `role="alert"` (khẩn) |
| Đồng hồ trong vùng live | `aria-hidden="true"` |
| Thanh tiến trình | `role="progressbar" aria-valuenow aria-valuemin aria-valuemax` (vô định: bỏ valuenow) |

Luật số 1 của ARIA: dùng phần tử HTML gốc trước; ARIA chỉ khi không có phần tử gốc.

## 4. Tương phản & kích thước

- Chữ thường ≥4.5:1; chữ lớn (≥24px, hoặc ≥18.66px đậm) ≥3:1; thành phần không phải chữ (viền input,
  icon mang nghĩa, vòng focus) ≥3:1 với màu kề bên. Đo: `node scripts/contrast.mjs`.
- Không truyền đạt chỉ bằng màu: trạng thái lỗi có icon + chữ; chấm trạng thái có `title`/nhãn ẩn.
- Vùng chạm: WCAG 2.2 AA tối thiểu 24×24; mục tiêu thực tế 44×44 trên cảm ứng.
- Chữ phóng 200% không vỡ bố cục; không khoá `user-scalable=no`.
- Không chữ < 11–12px.

## 5. Chế độ người dùng

```css
@media (prefers-reduced-motion: reduce) { … }        /* 04 mục 8 */
@media (prefers-reduced-transparency: reduce) { .glass { background: var(--surface); backdrop-filter: none; } }
@media (prefers-contrast: more) { :root { --border: var(--border-strong); --text-3: var(--text-2); } }
@media (forced-colors: active) {
  /* Windows High Contrast xoá nền/bóng: giữ thứ mang trạng thái, vẽ vòng chọn bằng màu hệ thống */
  .logo-mark, .status-dot, .tab-badge { forced-color-adjust: none; }
  .tab[aria-selected="true"] { outline: 2px solid Highlight; outline-offset: -2px; }
  .choice-card:has(input:checked) { outline: 3px solid Highlight; outline-offset: 1px; }
}
```
Kiểm bằng DevTools → Rendering → Emulate CSS media (reduced-motion, forced-colors, color-scheme).

## 6. Hiệu năng: chỉ số

- **LCP < 2.5s** (phần tử lớn nhất hiện), **INP < 200ms** (phản hồi tương tác), **CLS < 0.1** (xô bố
  cục).
- App nội bộ vẫn cần: INP tốt (nút phản hồi ngay bằng trạng thái pending), CLS = 0 khi poll cập nhật.
- Đo: Lighthouse (trang công khai), Performance panel (app), `PerformanceObserver` cho layout-shift khi
  nghi ngờ.

## 7. Font

- Tự host woff2; `font-display: swap`; chia `unicode-range` theo subset (latin, latin-ext, vietnamese)
  → trình duyệt chỉ tải subset có ký tự trên trang.
- Chỉ ship độ đậm dùng thật (400/500/600); khai báo đủ để trình duyệt **không tự làm đậm giả** (dấu tiếng
  Việt bị nhoè khi faux bold). Có thể thêm `font-synthesis: none`.
- `preload` font chỉ khi chữ hiện **trước** khi JS chạy (trang tĩnh). App vẽ UI bằng JS sau khi tải →
  preload sinh cảnh báo "preloaded but not used within a few seconds" → bỏ (Studio đã gặp).
- Giảm CLS khi font thay: fallback có số đo gần (`size-adjust`, `ascent-override` trên một @font-face
  fallback trỏ `local("Segoe UI")`), hoặc chọn fallback stack có metric gần.
- Không `<link>` Google Fonts ở sản phẩm thật (thêm một kết nối, lộ IP người dùng); tải file về.

## 8. Ảnh & media

- `width`/`height` hoặc `aspect-ratio` → không CLS.
- `loading="lazy"` + `decoding="async"` cho ảnh dưới màn hình đầu; ảnh LCP: không lazy,
  `fetchpriority="high"`.
- `srcset` + `sizes` cho ảnh lớn; AVIF/WebP.
- Video: `preload="metadata"`; poster; không autoplay có tiếng.
- Giải phóng media tạm (probe lấy poster): `removeAttribute('src'); load()` để nhả kết nối và bộ giải mã.
- Cache-bust file đổi nội dung cùng tên: `?v=${mtime}` (Studio: audio/video mới render cùng đường dẫn).

## 9. JS & DOM

- ES module thuần, không build, cho app nhỏ; tách file theo trách nhiệm (≤200 dòng mỗi file).
- Gom đọc DOM rồi ghi DOM (tránh layout thrash: đọc `offsetWidth` xen giữa các lần ghi style).
- `requestAnimationFrame` cho cập nhật thị giác; `ResizeObserver` thay `resize` listener;
  `IntersectionObserver` thay `scroll` listener.
- Debounce ô tìm kiếm ~200ms (cũng tránh tìm chuỗi trung gian khi gõ Telex).
- Danh sách dài: `content-visibility: auto` hoặc ảo hoá.
- Không tạo lại node khi dữ liệu không đổi (07 mục 2–3).
- Regex chạy trên văn bản dài (tin agent): lượng từ có giới hạn (`\s{0,3}` thay `\s*`), không lồng
  `(a+)+` — tránh backtracking thảm hoạ; đo trên 100 KB văn bản thật (Studio test: < 50ms).
- Dọn listener/timer khi đóng vùng (trả về hàm `stop`/`unsubscribe`).

## 10. Mạng & cache

- Poll nhẹ: endpoint trả danh sách nhỏ; có thể dùng ETag/`If-None-Match` cho danh sách lớn.
- Dừng poll khi tab ẩn (`document.hidden`).
- Tải song song (`Promise.all`) các request độc lập.
- File tĩnh (CSS/JS) có `?v=` phiên bản khi đổi, để trình duyệt không giữ bản cũ (Studio: `/?v=8`).
