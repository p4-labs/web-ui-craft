# 03 — Bố cục & thành phần

Mục lục: 1. Khung app (shell) · 2. Header & tab · 3. Sidebar/ngăn kéo · 4. Chat UI · 5. Form ·
6. Nút · 7. Thẻ & danh sách · 8. Dialog · 9. Toast · 10. Trạng thái rỗng/tải/lỗi · 11. Media ·
12. Landing page · 13. Responsive · 14. Mẫu "hàng hành động" (next step)

---

## 1. Khung app (shell)

Mẫu đã dùng ở Studio — gọn, ít "hộp":

```
┌ nền --bg (ceramic) ───────────────────────────────────────────┐
│ sidebar 264px (trong suốt, nằm trên nền)  ┌ tờ giấy trắng ────┐ │
│  logo · Tạo dự án · danh sách             │ header + tab      │ │
│                                           │ nội dung tab      │ │
│                                           └───────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

```css
.app-shell { height: 100vh; height: 100dvh; display: grid;
  grid-template-columns: var(--sidebar-w) minmax(0, 1fr); background: var(--bg); }
.main-sheet { margin: 8px 8px 8px 0; background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r-lg); box-shadow: var(--shadow-card); overflow: hidden;
  display: flex; flex-direction: column; min-width: 0; min-height: 0; }
```

- **Một "tờ giấy"** (bề mặt trắng) trên nền ấm; sidebar không cần hộp riêng — nó nằm thẳng trên nền.
  Ít hộp = ít viền = yên hơn.
- `minmax(0, 1fr)` + `min-width: 0` ở mọi con flex/grid: không có nó, một dòng dài (đường dẫn, code)
  làm vỡ bố cục/cuộn ngang.
- Thu gọn sidebar: đổi `grid-template-columns` về `0 minmax(0,1fr)`, sidebar `visibility: hidden`, đặt
  `inert` bằng JS (không Tab vào được), nhớ trạng thái trong localStorage, trả focus về nút bật.
- `body { overflow: hidden }` cho app một màn hình; từng vùng tự cuộn (`overflow-y: auto;
  overscroll-behavior: contain; scrollbar-gutter: stable`).

## 2. Header & tab

- Header một dòng: [☰ thu gọn] [tên dự án (cắt bằng ellipsis)] [chip trạng thái] … [hành động].
- **Tab** kiểu pill hoặc gạch chân; tab đang chọn: nền `--tint`/chữ `--accent-text` (pill) hoặc gạch 2px
  màu nhấn (underline). Huy hiệu nhỏ trên tab cho trạng thái nền: chấm nhấp nháy khi đang chạy, số đếm
  khi có mới.
- ARIA: `role="tablist"`, `role="tab"` + `aria-selected` + `aria-controls`, `role="tabpanel"`; mũi tên
  trái/phải chuyển tab; URL hash (`#agent`, `#ket-qua`) để F5/giữ link.
- Header dùng **container query** (`container: header / inline-size`) để ẩn dần: nhãn nút → chỉ icon →
  chuyển vào menu, theo bề rộng của chính nó chứ không của cửa sổ.
- Thanh tiến trình của cả quy trình (bước 1→4) đặt dưới header, không chiếm thêm hộp: chấm + nhãn.

## 3. Sidebar / ngăn kéo

- Nút chính trên cùng ("Tạo dự án"), danh sách bên dưới; mục đang chọn: nền `--surface` + bóng bậc 1
  (như một tấm thẻ nổi lên trên nền), không viền màu một bên.
- Chấm trạng thái ở mỗi mục: xanh nhấp nháy = đang chạy; vàng = đã có video (màu mang một nghĩa).
- Dưới 760px: sidebar thành ngăn kéo trái, `transform: translateX(-100%)` + `visibility: hidden`
  (transition visibility trễ bằng thời lượng để không bị cắt), scrim phía sau, nút đóng riêng, Esc đóng,
  focus bẫy trong ngăn kéo (hoặc `inert` phần còn lại).

```css
.sidebar { position: fixed; inset: 0 auto 0 0; width: min(300px, 86vw); transform: translateX(-100%);
  visibility: hidden; transition: transform var(--dur-slow) var(--ease), visibility 0s linear var(--dur-slow); }
.app-shell[data-drawer="sidebar"] .sidebar { transform: none; visibility: visible;
  transition: transform var(--dur-slow) var(--ease); }
```

## 4. Chat UI

- **Cột đọc ~720px** căn giữa; tin người dùng là bong bóng nhạt (`--user-bubble`) căn phải; tin agent
  **không có bong bóng** (chữ thẳng trên nền, như bài viết) — dễ đọc markdown dài.
- Markdown: đoạn 15px/1.6, heading 15–18px đậm 600, code nền `--code-bg`, bảng có hairline, link màu
  `--accent-text` gạch chân mảnh.
- **Bước công cụ** (agent chạy lệnh/sửa file): gom thành một dòng "Đã chạy N bước" có thể mở, mỗi bước
  một **nhãn tiếng Việt ngắn** ("Sửa script.md", "Đọc 3 file", "Tìm web: …") + dòng mờ là lệnh gốc
  (title = lệnh đầy đủ). Không đổ nguyên lệnh PowerShell dài vào chat. Xem 07 mục 8.
- **Đang suy nghĩ:** 3 chấm nhịp + đồng hồ đếm `0:42` (tabular-nums) — người dùng biết nó còn sống.
- **Ô soạn (composer):** thẻ nổi bo 20px, bóng bậc 2; textarea tự cao (tới ~220px), nút gửi tròn 38px
  màu nhấn; khi agent chạy nút gửi đổi thành nút "Dừng" (slab tối). Focus-within: viền brand + vòng 3px
  `--accent-ring`. Dòng dưới: chọn agent/mức suy nghĩ (select "im lặng" — trông như chữ tới khi hover,
  `field-sizing: content`) + gợi ý phím `Enter gửi · Shift+Enter xuống dòng`.
- **Nút "về tin mới nhất"** tròn nổi phía trên composer khi người dùng cuộn lên xa.
- Tự cuộn xuống **chỉ khi** người dùng đang ở gần đáy (≤ ~80px); đang đọc lên trên thì không giật.
- Enter gửi, Shift+Enter xuống dòng, **bỏ qua khi IME đang gõ** (`e.isComposing || e.keyCode === 229`).
- Hành động trên tin: copy (icon → tick 1.5s), thử lại; hiện khi hover trên desktop, luôn hiện trên
  cảm ứng.
- Trạng thái trống của chat: lời chào + 3–4 **gợi ý bấm được** (điền sẵn ô soạn), không phải đoạn giới
  thiệu dài.

## 5. Form

- Nhãn **trên** input (không dùng placeholder làm nhãn), trợ giúp dưới nhãn hoặc dưới input (12px
  `--text-3`), lỗi dưới input (màu `--danger-text` + icon), chừa chỗ `min-height: 1lh` để lỗi không đẩy
  layout.
- Input: cao 40–44px, bo 12, viền `--input-border`, nền `--surface`; focus: viền `--brand` + vòng 3px
  `--accent-ring` (không đổi bề dày viền → không nhảy).
- Nhóm radio lớn (chọn phong cách, độ dài): thẻ chọn được (`label` bọc `input` ẩn nhưng vẫn focus
  được); trạng thái chọn = viền nhấn + vòng (`box-shadow: 0 0 0 1px var(--accent)`) + dấu tick góc.
  `:has(input:checked)` để tô thẻ không cần JS.
- Segmented control (2–4 lựa chọn ngắn): pill chứa các pill; mục chọn có nền trắng + bóng bậc 1.
- Toggle có hiệu lực ngay (không cần nút Lưu); form nhiều trường có nút Lưu cố định + chấm "chưa lưu".
- Hỏi trước khi rời trang/đổi dự án khi còn thay đổi chưa lưu (`beforeunload` + guard của router).
- `autocomplete`, `inputmode`, `enterkeyhint` đúng loại; `spellcheck="false"` cho mã/đường dẫn.
- `field-sizing: content` cho textarea tự cao (Chromium 123+), JS fallback `autoGrow(el, max)`.
- Ô tìm kiếm có nút xoá (×) + phím `/` để focus + Esc để xoá.

## 6. Nút

| Loại | Dùng | Studio |
|---|---|---|
| primary | MỘT hành động chính mỗi vùng | nền `--accent`, chữ trắng |
| dark | hành động mạnh thứ hai/"Dừng" | nền `--house` |
| default | hành động thường | nền trắng + viền `--border-strong` |
| ghost | hành động phụ, trong thanh công cụ | trong suốt, hover `--hover` |
| danger | xoá (trong dialog xác nhận) | nền `--danger` hoặc chữ đỏ + viền |
| icon-btn | icon-only 36×36 | tròn, `aria-label` bắt buộc |
| link-btn | hành động trong câu | chữ nhấn, gạch chân khi hover |

- Cao 36 (nhỏ 32, cảm ứng ≥44), pill, chữ 14/500, icon 16px cách chữ 6–7px; nhãn **động từ + đối
  tượng**, ≤3 từ ("Dựng video", "Nghe thử kịch bản"), một tên cho một hành động xuyên suốt app/toast.
- Nút bận: spinner 14px thay icon, nhãn đổi "Đang tạo…", giữ nguyên bề rộng (`min-width` hoặc để
  spinner thay đúng chỗ icon), `aria-busy="true"`, không nhận click lần hai.
- `aria-disabled="true"` + `title` giải thích vì sao bị chặn ("Đang có tiến trình chạy, chờ xong rồi
  thử lại") tốt hơn `disabled` trơn — vẫn focus được, vẫn đọc được lý do.
- Mỗi vùng tối đa một nút primary. Hai nút cạnh nhau: primary bên phải (hành động tiến), phụ bên trái.

## 7. Thẻ & danh sách

- Thẻ chỉ khi cần "một vật thể" (video, phong cách để chọn). Danh sách file/nhật ký = hàng có hairline,
  không phải chồng thẻ.
- Hàng danh sách: cao 44–56, tile loại file 32px bo 8 (màu theo loại qua `color-mix`), tên (ellipsis ở
  giữa nếu cần), meta phải (kích thước · giờ, tabular-nums), hành động hiện khi hover/focus-within.
- Mục mới xuất hiện: nền `--tint` rồi phai trong 2.6–5s (`@keyframes row-fresh`) — "cái này vừa ra".
- Lưới thẻ: `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`; thẻ có ảnh đầu (tỉ lệ cố
  định `aspect-ratio: 16/9`), tên, mô tả 1–2 dòng (`-webkit-line-clamp`).
- Hover thẻ: bóng bậc 1 → 2 + ảnh zoom 1.03 (chỉ `@media (hover: hover)`), không nâng cả thẻ lên 8px.
- Không "icon trong ô vuông bo màu ở đầu mỗi thẻ" (dấu hiệu AI #25); nếu cần icon, dùng icon trần.

## 8. Dialog

- Dùng `<dialog>` + `showModal()`: top layer, Esc đóng, focus vào phần tử đầu, `::backdrop` làm scrim.
- Bo 20, bóng bậc 3, padding 24; tiêu đề 18/600; nút ở góc phải dưới (Huỷ ghost · Hành động primary).
- Vào: opacity 0→1 + `translateY(8px) scale(.98)` → none, 180–260ms ease-out. Ra: nhanh hơn (120–160ms)
  — xem 04 mục công thức dialog `@starting-style`.
- Click nền: **đóng nhưng giữ bản nháp** (dễ bấm nhầm); "Huỷ" mới xoá nháp. Esc giống click nền.
- Ctrl/⌘+Enter để gửi form trong dialog.
- Dialog xác nhận xoá: nêu **tên** thứ bị xoá, hành động đỏ, focus mặc định vào nút an toàn.
- Mobile (<560px): dialog lớn thành toàn màn hình (`100dvh`, bo 0) hoặc sheet dưới.
- Không `<dialog>` lồng `<dialog>`; không chặn cuộn body bằng `overflow:hidden` khi đã dùng showModal
  (top layer đã chặn tương tác).

## 9. Toast

- Góc phải dưới (mobile: trải ngang, cách mép 12px), slab tối (`--house`) chữ sáng, bo 12, bóng bậc 3,
  icon theo loại (thành công/lỗi/thông tin), ≤ 2 dòng.
- Vào `translateY(8px)`→0 + opacity, 180ms; ra nhanh hơn; tự tắt 3–5s (lỗi lâu hơn hoặc giữ tới khi
  đóng); hover thì dừng đếm.
- Chỉ toast cho sự kiện **không có chỗ hiển thị tại chỗ** (job xong khi đang ở tab khác). Có chỗ tại
  chỗ thì phản hồi tại chỗ (nút đổi thành tick).
- Cùng một lỗi lặp (poll hỏng) chỉ toast một lần, tới khi hồi phục (`failing` flag).
- `role="status"` (thông tin) hoặc `role="alert"` (lỗi) trên container `aria-live`.
- Lời văn: nói chuyện gì xảy ra + bước tiếp ("Dựng video thất bại. Xem nhật ký ở tab Kết quả."),
  không xin lỗi, không "Đã xảy ra lỗi".

## 10. Trạng thái rỗng / đang tải / lỗi

- **Rỗng = lời mời hành động:** icon/ảnh nhỏ nhẹ, tiêu đề 18px nói điều người dùng *làm được*, một câu
  giải thích, một nút. Ví dụ: "Chưa có video — Dựng video khi kịch bản và kế hoạch hình đã sẵn sàng."
- **Đang tải:** skeleton đúng hình dạng nội dung sẽ tới (ô ảnh + 2 dòng chữ), nhịp sáng-tối 1.6s; chỉ
  hiện sau ~200ms (tải nhanh thì không nháy): `animation: fade-in 180ms ease .2s both`.
- **Tiến trình dài:** thanh chạy vô định (indeterminate) hoặc phần trăm thật + giai đoạn ("Đang tạo
  giọng đọc", "Đang dựng cảnh 3/12") + đồng hồ đã chạy.
- **Lỗi:** tại chỗ, nói nguyên nhân dễ hiểu + cách sửa + nút "Thử lại"; nhật ký chi tiết thu gọn.
- **Loader luôn có lối thoát** (timeout/failsafe) — đừng nhốt người dùng sau spinner vô tận.

## 11. Media

- **Poster cho video:** khung đầu của video vẽ tay thường trống → trông như video hỏng. Lấy khung ở ~30%
  thời lượng bằng một `<video>` ẩn + canvas → `video.poster` (Studio `video-poster-frame.js`).
- Video: `controls`, `preload="metadata"`, `playsinline`; hero video: `muted autoplay loop playsinline`
  + `poster` + không lazy nếu là LCP.
- Audio nhỏ gọn: nút play tròn + thanh tiến trình + thời gian tabular-nums; phím Space/←/→ khi focus.
- Ảnh: `width`/`height` hoặc `aspect-ratio` để giữ chỗ; `loading="lazy"` cho ảnh dưới màn hình đầu;
  viền `outline: 1px solid rgb(0 0 0 / .1); outline-offset: -1px` để ảnh sáng không tan vào nền trắng.
- Ảnh trong suốt: nền bàn cờ (`repeating-conic-gradient`) + nút đảo nền sáng/tối.
- Không phát 2 media cùng lúc: khi một cái play, pause các cái khác (lắng nghe `play` ở capture phase
  trên document).
- Giữ node `<video>/<audio>` khi dữ liệu poll cập nhật (render theo key) — xem 07.

## 12. Landing page

- **Hero vừa một màn hình:** H1 ≤2 dòng, mô tả ≤20 từ, CTA chính + tối đa một phụ, ≤4 khối chữ; một
  visual thật (ảnh sản phẩm/UI thật, ảnh sinh có chủ đích), không "chữ + blob gradient".
- Logo "được tin dùng" nằm **dưới** hero, chỉ logo (SVG thật), không nhãn ngành.
- Mỗi section: tiêu đề ≤8 từ + mô tả ≤25 từ + một visual hoặc một CTA. Danh sách >5 mục đổi dạng
  (tab/accordion/lưới).
- **Đa dạng bố cục:** mỗi kiểu bố cục dùng ≤1 lần/trang; trang 8 section cần ≥4 kiểu; zigzag ảnh–chữ
  ≤2 lần liền. Không mở bằng "tiêu đề giữa + 3 thẻ đều".
- Phân cách section bằng thay đổi nội dung/màu nền/ornament, không chỉ bằng khoảng trắng bằng nhau.
- Container 1200–1400px; lưới hairline 1px là một motif đẹp (Meng To: 3 cột kẻ 1px, lề 20px).
- Nav một dòng ≤80px; tránh "nav AI" (wordmark trái + 5 link + nút phải + hairline trắng) nếu không có
  gì riêng; footer không bắt buộc 4 cột.
- Số liệu, testimonial, bảng giá **phải thật** — không có thì bỏ section, đừng bịa.
- Testimonial ≤3 dòng + tên + chức danh + ảnh thật.

## 13. Responsive

- Kiểm 3 cỡ: **1440** (desktop), **1024** (laptop nhỏ/tablet ngang — cỡ hay vỡ nhất vì sidebar + nội
  dung chật), **390** (điện thoại). Thêm 320 nếu là trang công khai.
- Breakpoint theo nội dung, không theo thiết bị. Studio: 760 (sidebar → ngăn kéo), container query cho
  từng tab (script 1100/760/560, results 640, config 900/560, header 980/560).
- Mọi bố cục nhiều cột khai báo phương án 1 cột.
- Cảm ứng: `@media (pointer: coarse)` → vùng chạm ≥44px, input ≥16px, hiện hành động vốn chỉ hiện
  khi hover.
- `env(safe-area-inset-bottom)` cho thanh dưới trên iPhone: `padding-bottom: max(10px, env(safe-area-inset-bottom))`.
- Không cuộn ngang ở bất kỳ bề rộng nào 320–1920: kiểm bằng
  `document.documentElement.scrollWidth > innerWidth` (xem 10).

## 14. Mẫu "hàng hành động" — bước tiếp theo ngay tại chỗ

Vấn đề thật: agent viết "bạn hãy bấm **Dựng video**" nhưng nút nằm ở tab Kết quả → người dùng phải đi
tìm. Giải pháp: khi tin cuối của agent chứa lời mời bấm, hiện một hàng ngay dưới cuộc trò chuyện:

```
[icon] Bước tiếp theo                         [▶ Dựng video]
       Mất vài phút. Bạn vẫn chat được trong lúc chờ.
```

Vòng đời: sẵn sàng → đang chạy (spinner + "Đang dựng video… 1:23" + giai đoạn + link "Xem ở Kết quả")
→ xong (âm thanh: player ngay trong hàng; video: nền vàng nhạt + "Xem video") → lỗi ("Dựng video thất
bại lúc 14:02" + "Thử lại"). Khi job đã chạy, hàng được **ghim**: không biến mất khi người dùng chat
tiếp. Logic phát hiện lời mời + trạng thái: 07-giao-dien-song.md mục 6–7 và 09-tieng-viet.md mục regex.

Nguyên tắc chung rút ra: **nút cho bước tiếp theo nằm đúng chỗ mắt người dùng đang nhìn**, và phản hồi
kết quả ở chính chỗ đó.
