# 05 — Chi tiết nhỏ (polish)

Những thứ người dùng không gọi tên được nhưng cảm thấy "chỉn chu". Mỗi mục: vấn đề → cách làm → mã.

Mục lục: 1. Hình khối · 2. Chữ & số · 3. Tương tác & con trỏ · 4. Form · 5. Cuộn & khung nhìn ·
6. Ảnh & media · 7. Trạng thái & phản hồi · 8. Văn bản giao diện · 9. Danh sách soát nhanh

---

## 1. Hình khối

**Bo góc đồng tâm.** Khung ngoài = khung trong + khoảng cách. Composer bo 20, nút gửi cách mép 6 →
nút bo 14 (hoặc tròn hẳn). Thẻ bo 16, ảnh bên trong cách 8 → ảnh bo 8.
```css
.card { --pad: 8px; --r: var(--r-lg); padding: var(--pad); border-radius: var(--r); }
.card > img { border-radius: calc(var(--r) - var(--pad)); }
```

**Căn giữa quang học.** Icon play ▶ căn giữa hình học trông lệch trái → dịch phải ~1–2px
(`transform: translateX(1px)` hoặc `margin-left: 2px`). Icon có đuôi (mũi tên) tương tự. Nút có
icon + chữ: padding bên có icon nhỏ hơn 2–4px (`padding: 0 16px 0 13px`) để khối trông cân.

**Hairline sắc.** Viền 1px trên màn hình HiDPI dùng màu đặc, không alpha quá thấp (mờ nhòe); bóng bậc 1
dùng `0 0 .5px` + `0 1px 1px` cho viền "như in".

**Icon cùng một bộ, cùng stroke.** 16px trong nút/hàng, 18px trong tile, 20–24 cho hành động lớn;
`stroke-width` 1.75–2 đồng nhất; `flex-shrink: 0` để icon không bị bóp.

**Kích thước chẵn theo thang.** 32/36/40/44 cho điều khiển; khoảng cách 4/8/12/16; lệch 1px chỉ khi bù
quang học.

**Khoảng cách chữ–viền trong nút pill:** padding ngang ≈ 0.45 × chiều cao (36px → 16px).

## 2. Chữ & số

- `font-variant-numeric: tabular-nums` cho: đồng hồ, bộ đếm, kích thước file, thời lượng, cột số, giá —
  số không nhảy ngang khi đổi.
- `text-wrap: balance` cho tiêu đề ngắn; `text-wrap: pretty` cho đoạn và chú thích — tránh một chữ mồ
  côi ở dòng cuối.
- `overflow-wrap: anywhere` cho chỗ có thể chứa đường dẫn/URL dài (tên file, lỗi); `word-break` không
  cần.
- Cắt một dòng: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0` (con flex
  cần `min-width: 0` mới cắt được). Nhiều dòng: `display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden`.
- Cắt **ở giữa** cho tên file (giữ đuôi `.mp4`): JS `name.slice(0, 18) + '…' + name.slice(-10)` + `title`
  đầy đủ.
- Dấu ngoặc kép cong “…”, dấu ba chấm một ký tự `…`, dấu nhân `×`, gạch ngang khoảng `–` (10–20), mũi tên
  `→`. Không dùng `...` ba dấu chấm trong UI.
- Đơn vị cách số bằng khoảng trắng không ngắt: `12&nbsp;MB`, `3&nbsp;phút`.
- Chữ hoa nhỏ (nhãn caps) cần `letter-spacing: .04–.08em`; chữ lớn cần tracking âm. Nhưng đừng caps giãn
  khắp nơi (dấu hiệu AI #21).
- Không đổi `font-weight` khi hover/chọn (xem 02 mục 4).
- `::selection { background: var(--tint); color: var(--text); }` — bôi đen theo thương hiệu.
- `hanging-punctuation: first` cho trích dẫn (Safari).

## 3. Tương tác & con trỏ

- **Vùng chạm ≥ 44×44** trên cảm ứng; trên desktop ≥ 32. Icon nhỏ mở rộng vùng bấm bằng pseudo-element:
  ```css
  .tiny-btn { position: relative; }
  .tiny-btn::after { content: ""; position: absolute; inset: -8px; }
  ```
- Không có "vùng chết" giữa các mục danh sách: cả hàng là vùng bấm (`<button>`/`<a>` chiếm trọn hàng),
  khoảng cách bằng padding bên trong, không bằng margin.
- `cursor: pointer` chỉ cho thứ bấm được; `cursor: not-allowed` cho disabled; không `pointer` trên thẻ
  không bấm được.
- `-webkit-tap-highlight-color: transparent` + trạng thái `:active` riêng (ô xám mặc định của mobile
  trông rẻ). **iOS Safari chỉ áp `:active` khi trang có ít nhất một listener `touchstart`** — nếu bỏ vệt
  chớp mà không có listener, chạm vào nút không còn phản hồi gì:
  `document.addEventListener('touchstart', () => {}, { passive: true });`
- `touch-action: manipulation` trên nút → bỏ trễ double-tap-zoom.
- `user-select: none` cho nhãn nút/tab (tránh bôi đen khi bấm nhanh); **không** cho nội dung người dùng
  muốn chép.
- Focus: `:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px }` — hiện tức thì, không
  transition, không dựng bằng border (nhảy layout). Trong input có viền: `outline-offset: 0` hoặc vòng
  `box-shadow`.
- `accent-color: var(--accent)` cho checkbox/radio/range gốc — một dòng là hết màu xanh dương mặc định.
- `caret-color` màu thương hiệu cho mọi ô nhập (`input, textarea, [contenteditable]`) — dùng **màu chữ
  xanh** (`--accent-text`), không dùng màu nền nút: ở AffiVN `--accent` chỉ đạt 3.4:1 trên nền tối.
- Vùng cuộn không chứa phần tử focus được (khối log, danh sách bước) **tự nhận focus** trong Chrome
  130+; nếu cha có `overflow: clip/hidden` thì vòng focus bị cắt → `:focus-visible { outline-offset: -2px }`.
- Nút icon-only: `aria-label` + `title` (tooltip) cùng nội dung.
- Phím tắt hiển thị bằng `<kbd>` (viền dưới dày 2px giả phím thật).

## 4. Form

- `:user-invalid` (không phải `:invalid`) để chỉ báo lỗi **sau khi** người dùng tương tác, không đỏ lòm
  ngay khi mở form.
  ```css
  input:user-invalid { border-color: var(--danger); }
  input:user-invalid + .field-error { display: block; }
  ```
- `field-sizing: content` cho textarea/select tự co giãn theo nội dung (select "im lặng" chỉ rộng bằng
  lựa chọn hiện tại).
- Placeholder là **ví dụ**, không phải nhãn ("VD: Vì sao Hà Nội có mùa hoa sữa?"), màu `--placeholder`
  `opacity: 1` (Firefox mặc định làm mờ). Placeholder cũng là chữ: ≥ 4.5:1 — xám "cho nhạt" hay rớt
  (Studio: `#8b8b84` = 3.4:1, dark `#6f7d76` = 4.0:1) → đặt `--placeholder: var(--text-3)`.
- Ô số: `inputmode="numeric"`, bỏ nút tăng giảm nếu xấu (`appearance: textfield`).
- Nút submit đổi trạng thái ngay khi bấm (pending), không đợi mạng.
- Enter trong input một dòng submit form; Ctrl/⌘+Enter trong textarea.
- Tự focus ô đầu khi mở dialog tạo mới; con trỏ đặt **cuối** văn bản có sẵn (`setSelectionRange(end, end)`).
- Giữ bản nháp khi đóng dialog bằng Esc/nền; chỉ "Huỷ" mới xoá.

## 5. Cuộn & khung nhìn

- `scrollbar-gutter: stable` cho vùng cuộn → nội dung không xô ngang khi thanh cuộn xuất hiện.
- `overscroll-behavior: contain` cho vùng cuộn con (chat, ngăn kéo) → cuộn tới đáy không kéo cả trang.
- `scrollbar-width: thin; scrollbar-color: var(--border-strong) transparent` — thanh cuộn mảnh theo
  thương hiệu.
- `scroll-margin-top` cho mục tiêu anchor dưới header dính; `scroll-padding` cho container cuộn.
- `100dvh` thay `100vh` (khai báo `100vh` trước làm fallback).
- `env(safe-area-inset-*)` cho thanh dưới trên iPhone.
- Chat tự cuộn xuống chỉ khi đang ở gần đáy; hiện nút "về mới nhất" khi đang đọc phía trên.
- Khi nội dung vẽ lại (poll), **giữ vị trí cuộn** và focus (07 mục 2).
- `content-visibility: auto; contain-intrinsic-size: auto 400px` cho danh sách rất dài (tin nhắn cũ).

## 6. Ảnh & media

- Viền ảnh: `outline: 1px solid rgb(0 0 0 / .1); outline-offset: -1px` (dark: trắng .1) — ảnh nền sáng
  không tan vào thẻ trắng, và viền nằm **trong** ảnh nên không đổi kích thước.
- `aspect-ratio` cố định cho khung ảnh/video → không nhảy layout khi tải (CLS).
- `object-fit: cover` cho thumbnail; `contain` + nền bàn cờ cho ảnh trong suốt.
- Poster thật cho video (khung ở ~30%), không để khung đen/trống đầu tiên.
- `decoding="async"`, `loading="lazy"` cho ảnh dưới màn hình đầu; `fetchpriority="high"` cho ảnh LCP.
- Ảnh trang trí: `alt=""`; ảnh nội dung: alt mô tả.
- Chỉ một media phát một lúc.

## 7. Trạng thái & phản hồi

- **Phản hồi tại chỗ** hơn toast: copy → tick; lưu → "Đã lưu 14:02" cạnh nút; job xong → hàng đổi
  thành player.
- **Đồng hồ cho việc chờ** > 3 giây: "Đang dựng video… 1:23" — người dùng biết không bị treo.
- **Giai đoạn** cho việc dài: "Đang tạo giọng đọc" → "Đang căn chữ" → "Đang dựng cảnh 4/12".
- **Mục mới** tô tint rồi phai (2.6–5s) — mắt tìm ra ngay cái vừa xuất hiện.
- **Chấm chưa lưu** cạnh tiêu đề/nút Lưu khi có thay đổi.
- **Disabled có lý do**: `aria-disabled` + `title` "Đang có tiến trình chạy, chờ xong rồi thử lại".
- **Thời gian tương đối** ("2 phút trước") cho gần đây, tuyệt đối ("14:02, 28/9") khi hover (`title`)
  và cho thứ cũ hơn một ngày.
- **Số đếm trên tab/nhóm** (`count-pill`), ẩn khi 0 (`:empty { display: none }`).
- **Skeleton trễ 200ms** — tải nhanh thì không nháy.
- **Optimistic UI** cho thao tác chắc chắn thành công (đổi tên, chọn phong cách): cập nhật ngay, lỗi thì
  hoàn lại + toast.

## 8. Văn bản giao diện

- Một tên cho một hành động xuyên suốt: nút "Dựng video" → toast "Đã bắt đầu dựng video." → "Video đã
  dựng xong." → hàng "Đang dựng video…". Không lẫn "render"/"xuất"/"tạo video".
- Nhãn nút = động từ + đối tượng; không "OK", "Submit", "Xác nhận" chung chung — "Xoá dự án".
- Lỗi: nói chuyện gì + làm gì tiếp; không xin lỗi, không mã lỗi trần (mã để trong chi tiết).
- Empty state nói người dùng **làm được gì**, không "Không có dữ liệu".
- Không chú thích xám thừa dưới mọi nút; không lặp tiêu đề trong mô tả.
- Viết hoa chữ đầu câu (sentence case) cho nút/tab tiếng Việt: "Nghe thử kịch bản", không "Nghe Thử
  Kịch Bản".

## 9. Danh sách soát nhanh (15 phút)

- [ ] Bo góc đồng tâm ở mọi khung lồng nhau
- [ ] Icon play/mũi tên căn quang học
- [ ] tabular-nums ở mọi số thay đổi
- [ ] text-wrap balance/pretty ở tiêu đề/đoạn
- [ ] Ellipsis + title cho mọi tên có thể dài; không dòng nào làm vỡ bố cục
- [ ] Vùng chạm ≥44 trên cảm ứng; không vùng chết trong danh sách
- [ ] accent-color, caret-color, ::selection theo thương hiệu
- [ ] Focus ring hiện tức thì, rõ trên mọi nền
- [ ] :user-invalid thay :invalid
- [ ] scrollbar-gutter + overscroll-behavior ở vùng cuộn
- [ ] 100dvh + safe-area
- [ ] Viền 1px trong ảnh, aspect-ratio giữ chỗ, poster video thật
- [ ] Đồng hồ + giai đoạn cho việc chờ; mục mới được tô
- [ ] Disabled có lý do; nút bận giữ bề rộng
- [ ] Một tên cho một hành động xuyên suốt
