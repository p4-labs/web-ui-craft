# 02 — Hệ thiết kế & token

Mục lục: 1. Kiến trúc token 3 lớp · 2. Màu · 3. Dark mode · 4. Chữ (thang app vs landing) · 5. Spacing ·
6. Bo góc · 7. Độ nổi (elevation) · 8. Z-index · 9. Chuyển động (token) · 10. Kích thước & container ·
11. Preset AffiVN · 12. Dựng hệ mới trong 30 phút · 13. DESIGN.md · 14. Số liệu 15 site thật

---

## 1. Kiến trúc token 3 lớp

```
Lớp 1 — bảng màu thô (palette)   --ceramic #f2f0eb, --house #1e3932, --gold #cba258 …
Lớp 2 — vai trò (role)            --bg, --surface, --text-2, --accent, --danger-soft, --shadow-card …
Lớp 3 — thành phần (tuỳ chọn)     --btn-h: 36px; --composer-radius: var(--r-xl) …
```

- File khác CHỈ dùng lớp 2 (và lớp 3 nếu có). Lớp 1 chỉ xuất hiện trong file token.
- Đặt tên theo **vai trò**, không theo màu: `--text-3` chứ không `--gray-500`; `--accent` chứ không
  `--green`. Lý do: đổi thương hiệu/dark mode = đổi giá trị, không đổi tên ở 20 file.
- Mỗi token ghi chú **dùng cho gì** + tỉ lệ tương phản nếu là màu chữ (như Studio: `--text-3: #6e6e68;
  /* 5.1:1 on white, 4.5:1 on ceramic */`). Người/agent sau không phải đo lại.
- Token "để tương thích" (tên cũ) được phép giữ, trỏ về token mới, có ghi chú (`--accent-glow:
  transparent; /* kept for old references: the redesign has no glows */`).
- Kiểm bằng `scripts/audit-css.mjs`: mọi hex/rgb ngoài file token = lỗi.

## 2. Màu

**Bộ vai trò tối thiểu cho một app:**

| Nhóm | Token | Ghi chú |
|---|---|---|
| Nền | `--bg` `--surface` `--surface-subtle` `--surface-2` `--surface-3` `--panel-bg` | 3–5 bậc mặt phẳng; bậc cao hơn = nổi hơn/được chọn |
| Đường | `--border` `--border-strong` `--input-border` | hairline 1px; **không dùng làm màu chữ** |
| Chữ | `--text` `--text-2` `--text-3` `--placeholder` | text-3 vẫn phải ≥4.5:1 trên nền chính |
| Nhấn | `--accent` `--accent-hover` `--accent-text` `--accent-soft` `--accent-border` `--accent-ring` `--on-accent` | accent-text là bản đậm hơn để làm chữ/icon xanh trên nền sáng |
| Trạng thái | `--success(-text,-soft)` `--danger(-text,-soft,-border)` `--warn(-text,-soft,-border)` | mỗi trạng thái 3–4 sắc: đặc, chữ, nền nhạt, viền |
| Khác | `--hover` (lớp phủ alpha), `--scrim` (nền mờ dialog), `--code-bg`, màu loại file… | |

**Quy tắc:**
- **Một màu nhấn**, ≲5% diện tích: nút chính, focus ring, trạng thái chọn, link. Không phủ nền lớn.
- Màu đặc biệt mang **đúng một nghĩa**: Studio dùng vàng `--gold` chỉ cho "video đã dựng xong" (chấm
  vàng ở sidebar, huy hiệu "Đã dựng xong"). Dùng vàng cho thứ khác = mất nghĩa.
- Cảnh báo "chậm/tốn thời gian" dùng hổ phách (warn), **không dùng đỏ** — đỏ chỉ cho lỗi/xoá.
- Neutral **ngả theo hue thương hiệu** (ấm/xanh), không xám chết `#888`, không `#000`/`#fff` thuần cho
  nền lớn (trừ mặt `--surface: #fff` trên nền ấm — đó là "tờ giấy").
- Hover nên là **lớp phủ alpha** của màu chữ (`rgba(30,57,50,.055)`) → dùng được trên mọi bề mặt.
- `color-mix(in srgb, var(--k) 12%, var(--surface))` để tạo nền nhạt từ một màu vai trò (thẻ loại file)
  — không cần thêm token cho từng biến thể.
- Không gradient trên UI chrome (nút, header, thẻ). Không glow. Thương hiệu cho phép thì một gradient
  phẳng làm nền hero là tối đa.
- Tương phản: chữ thân ≥4.5:1, chữ lớn (≥24px hoặc ≥18.66px đậm) và icon/viền quan trọng ≥3:1.
  Đo bằng `node scripts/contrast.mjs`. Nhớ đo: placeholder, chữ trên nút màu, chữ trên nền trạng thái,
  focus ring trên nền, disabled (không bắt buộc AA nhưng phải đọc được).

**Disabled:** nền đục (`--surface-2`) + chữ `--text-3` + bỏ viền. Không dùng "màu nhấn mờ 50%" — nhìn
như lỗi render và lẫn với trạng thái hover.

**Lớp phủ trên media là một nhóm token riêng, KHÔNG đổi theo chế độ sáng/tối** (chúng nằm trên video/ảnh,
không nằm trên UI): `--media-bg` (letterbox đen), `--media-scrim` / `--media-scrim-strong` (nền chip,
nút play, màn chờ/lỗi trên poster), `--on-media` / `-2` / `-3` (chữ trắng 96/84/72%), `--media-shadow`.
Riêng `--media-outline` (viền trong 1px cho ảnh/video) thì đổi: đen 10% ở sáng, trắng 10% ở tối. Thiếu
nhóm này, agent phụ sẽ rải `rgba(0,0,0,.6)` khắp các file (Studio: 22/28 lỗi audit là vậy). Tương tự:
toast có token riêng (`--toast-bg/-text/-icon-*`) để dark mode chỉ đổi ở file token.

## 3. Dark mode

- Thiết kế **cả hai chế độ từ đầu** bằng cùng một bộ vai trò; chỉ đổi giá trị trong
  `@media (prefers-color-scheme: dark) { :root { … } }` (hoặc `[data-theme="dark"]` nếu có nút đổi).
- `color-scheme: light dark` trên `:root` để thanh cuộn, form control gốc đổi theo.
- **Bề mặt tối:** độ sáng ~4–15%, ngả hue thương hiệu (Studio: `#0e1512` → `#27352f`, xanh rêu). Bề
  mặt nổi hơn = sáng hơn (thay cho bóng đổ).
- **Màu nhấn nâng sáng** để đọc được trên nền tối: `--accent-text` `#006241` → `#7ed1ab`; nút chính
  giữ đậm đủ để chữ trắng ≥4.5:1 (`#1a7f56` → 5.0:1).
- **Bóng trong dark gần như vô hình** → dùng vòng hairline `0 0 0 1px rgba(0,0,0,.25)` + bóng đậm hơn
  (alpha .35–.55), hoặc chỉ chồng bề mặt sáng dần (Linear/Raycast không dùng bóng ở dark).
- Nền trạng thái (danger-soft, warn-soft) trong dark = màu rất tối ngả sắc (`#2e1614`), chữ trạng thái
  sáng (`#ff9d95`).
- Thành phần "slab tối" (toast xanh house) trong dark đổi thành bề mặt nổi + viền, không để đen trên đen.
- Ảnh/checkerboard: cho người dùng đảo nền xem ảnh trong suốt (Studio `data-image-backdrop="contrast"`).
- Đổi theme **không kích hoạt transition** (tắt transition khi đổi, hoặc chỉ transition thuộc tính cụ
  thể trên thành phần tương tác).

## 4. Chữ

### Chọn font
- Tối đa **2 họ** (display + UI) + 1 mono; thường một họ sans là đủ cho app.
- Tiếng Việt: kiểm dấu chồng (ặ, ỗ, ử), dấu không va dòng trên, độ đậm dấu đồng đều. Be Vietnam Pro
  (thiết kế cho tiếng Việt) là lựa chọn an toàn; xem 09-tieng-viet.md.
- Self-host woff2, `font-display: swap`, chia `unicode-range` (latin / latin-ext / vietnamese) — trang
  tiếng Việt không tải latin-ext thừa. Chỉ ship các độ đậm thực sự dùng (Studio: 400/500/600).
- Tránh mặc định "Inter + slate" nếu không có lý do; tránh combo "serif lớn + vài chữ nghiêng màu nhấn +
  sans thân" (dấu hiệu AI hay gặp nhất) trừ khi thương hiệu thực sự vậy.

### Thang cỡ chữ — app (mật độ cao)

| Token | px | Dùng cho |
|---|---|---|
| `--fs-xs` | 12 | meta, giờ, số đếm, kbd, huy hiệu (sàn: không chữ nào dưới 11–12px) |
| `--fs-sm` | 13 | UI phụ: chip, chú thích, picker, bước công cụ |
| `--fs-md` | 14 | UI mặc định: nút, tab, input, danh sách |
| `--fs-lg` | 15 | đọc: chat, trình sửa, ô soạn |
| `--fs-xl` | 18 | tiêu đề: dự án, thẻ, dialog, empty state |
| `--fs-2xl` | 26 | một tiêu đề chào duy nhất |

Studio trước khi làm lại có **18 cỡ chữ và 5 độ đậm**; sau khi gom còn 6 cỡ + 3 độ đậm → nhìn "yên"
hẳn mà không cần đổi gì khác. Trên thiết bị cảm ứng, input phải ≥16px (iOS zoom) — đó là ngoại lệ duy
nhất được phép thêm cỡ.

**Markdown/prose cũng lên thang**, đừng để `h1 { font-size: 1.25em }` tự sinh cỡ lẻ (15px × 1.25 = 18.75,
× 1.12 = 16.8…). Ánh xạ đã dùng ở Studio (thân prose = `--fs-lg`): `#`/`##` → `--fs-xl`; `###`…`######` →
cỡ thân + đậm 600 (thứ bậc bằng độ đậm); code inline → `--fs-sm`; bảng → `--fs-md`; tiêu đề tài liệu ở
chế độ đọc → `--fs-2xl` (tiêu đề duy nhất của màn hình đó).

### Thang cỡ chữ — landing/marketing (số liệu thật, mục 14)
- Display hero **56–96px** (trung vị 80), tracking âm −1%…−5% cỡ chữ (`letter-spacing: -.02em`),
  line-height 0.95–1.1; weight display 500–600, hoặc nhẹ 300–400 cho giọng sang.
- Body **16–18px**, line-height 1.5–1.6, độ dài dòng 45–75 ký tự (`max-width: 65ch`).
- Khai báo fluid: `font-size: clamp(44px, 5.6vw + 12px, 88px);` — chặn sàn cho mobile.
- Tiêu đề ≤2 dòng trên desktop; H1 4 dòng = lỗi cỡ chữ, không phải lỗi copy.

### Độ đậm
- 3 bậc: `--fw-regular 400` (thân), `--fw-medium 500` (nhãn, nút, tab), `--fw-bold 600` (tiêu đề,
  `<strong>`). Không dưới 400 cho chữ nhỏ.
- **Không đổi độ đậm khi hover/chọn** (chữ nở ra làm xô layout) — đổi màu/nền thay thế; nếu buộc phải
  đậm, giữ chỗ bằng `::after { content: attr(data-text); font-weight: 600; visibility: hidden; height: 0 }`.

### Chi tiết chữ
- `line-height`: 1.5 cho UI, 1.6 cho đoạn đọc, 1.35 cho tiêu đề nhỏ, 1.1 cho display.
- `letter-spacing: -.005em` cho thân sans ở cỡ nhỏ-vừa; `-.01em` cho tiêu đề 18px; âm hơn cho display.
- `text-wrap: balance` cho tiêu đề (≤ 6 dòng), `text-wrap: pretty` cho đoạn văn/chú thích (tránh một
  chữ mồ côi dòng cuối).
- Số thay đổi (đồng hồ, bộ đếm, cột số): `font-variant-numeric: tabular-nums` để không nhảy.
- `-webkit-font-smoothing: antialiased` trên macOS cho chữ sáng trên nền tối đỡ đậm.

## 5. Spacing

- Nền 4px: `2 4 6 8 12 16 20 24 32 40 48 64 80 96`. Số lẻ (13px, 17px) là dấu hiệu làm ẩu —
  ngoại lệ có chủ ý: bù quang học 1–2px (xem 05).
- Quan hệ gần–xa (luật Gestalt): khoảng cách **trong** nhóm < khoảng cách **giữa** nhóm, ít nhất gấp
  đôi. Nhãn–input 6–8px; field–field 20–24px; section–section 40–64px (app), 96–150px (landing).
- Padding thẻ: 16–24px (app); 28–64px (landing, `clamp(28px, 3.3vw, 64px)`).
- Gutter trang: 16px mobile, 24–32px desktop; container 1120–1280px cho nội dung đọc/cấu hình
  (Studio tab Cấu hình: 1120px), 640–720px cho cột đọc văn bản (Studio kịch bản: 640px ≈ 88 ký tự tiếng
  Việt ở 15px).
- Dùng `gap` thay margin giữa các con; `margin-block-start` cho dòng chảy văn bản.

## 6. Bo góc

**Thang theo loại phần tử (Studio/AffiVN):**

| Phần tử | Bo | Token |
|---|---|---|
| Nút, chip, tab, huy hiệu, ô tìm kiếm | pill | `--r-pill: 999px` |
| Ô nhỏ (logo nhỏ, kbd) | 6 | `--r-xs` |
| Tile icon, logo | 8 | `--r-sm` |
| Input, textarea, hàng danh sách, toast | 12 | `--r-md` |
| Thẻ, khung video, ô soạn chat lớn | 16 | `--r-lg` |
| Dialog, composer nổi | 20 | `--r-xl` |

- **Đồng tâm:** khung ngoài = khung trong + padding. Ví dụ ô soạn 20px chứa nút gửi cách mép 6px →
  nút gửi bo 14px (hoặc pill). Lệch đồng tâm là thứ mắt thấy "sai sai" mà không gọi tên được.
- Không trộn "tất cả nhọn" với "tất cả pill" trong một màn hình trừ khi có ánh xạ rõ (như bảng trên).
- Pill cho mọi thứ = dấu hiệu AI (#5 của Shann) — chỉ dùng pill cho những phần tử là "nút/nhãn", không
  cho thẻ/khối nội dung.

## 7. Độ nổi (elevation)

4 bậc là đủ:

| Bậc | Dùng cho | Light (Studio) |
|---|---|---|
| 0 phẳng | nền, bảng, danh sách | không bóng; tách bằng hairline/bề mặt |
| 1 thẻ | thẻ, player, ô chọn | `0 0 .5px rgba(30,57,50,.14), 0 1px 1px rgba(30,57,50,.18)` |
| 2 nâng | hover thẻ, menu, composer | `0 0 2px rgba(30,57,50,.10), 0 4px 8px rgba(30,57,50,.10), 0 12px 20px rgba(30,57,50,.08)` |
| 3 phủ | dialog, toast | `0 12px 32px rgba(30,57,50,.18), 0 32px 80px rgba(30,57,50,.16)` |

- Bóng **nhuộm màu chữ thương hiệu** (rgba của house green), không xám đen — hoà với nền ấm.
- Nhiều lớp alpha thấp (một lớp sát mép + một lớp lan) trông tự nhiên hơn một lớp đậm.
- Hairline **hoặc** bóng, không cả hai trên cùng thẻ (trừ bóng bậc 1 vốn đã đóng vai viền).
- Dark: xem mục 3.

## 8. Z-index

Khai báo thang, không rải số tuỳ hứng:
```css
--z-sticky: 10;   /* header dính, thanh công cụ */
--z-drawer: 40;   /* ngăn kéo sidebar mobile + scrim */
--z-popover: 50;  /* menu, tooltip */
--z-toast: 60;
/* dialog dùng <dialog>.showModal() → top layer, không cần z-index */
```
Ưu tiên `<dialog>` + `popover` (top layer) thay vì chồng z-index. `isolation: isolate` trên thành phần
để z-index bên trong không rò ra ngoài.

## 9. Token chuyển động

```css
--ease: cubic-bezier(.2, .8, .2, 1);        /* ease-out mạnh — mặc định cho mọi tương tác */
--ease-out-quint: cubic-bezier(.22, 1, .36, 1);
--ease-out-expo: cubic-bezier(.16, 1, .3, 1); /* vào sân "nhanh tới, chậm lắng" (Meng To) */
--ease-in-out: cubic-bezier(.65, 0, .35, 1);  /* thứ di chuyển giữa 2 vị trí trên màn hình */
--dur-fast: 120ms;  /* hover, nhấn, đổi màu */
--dur: 180ms;       /* menu, toast, trạng thái */
--dur-slow: 260ms;  /* dialog vào, panel mở */
```
Chi tiết + spring `linear()`: 04-chuyen-dong.md, `assets/motion.css`, `scripts/spring-easing.mjs`.

## 10. Kích thước & container

- Chiều cao điều khiển: nút 36 (nhỏ 32), icon-btn 36×36, input 40–44; trên `(pointer: coarse)` tất
  cả ≥44.
- Sidebar 240–280px (Studio 264), thu gọn được; dưới ~760px thành ngăn kéo.
- **Container query** cho thành phần sống trong nhiều bề rộng (tab trong main area):
  `container: results / inline-size;` rồi `@container results (max-width: 640px) { … }` — thành phần
  tự thích nghi dù sidebar đang mở hay đóng; media query chỉ biết bề rộng cửa sổ.
- Chiều cao màn hình: `100dvh` (không `100vh` — thanh địa chỉ mobile), khai báo fallback `100vh` trước.

## 11. Preset AffiVN (dùng ngay)

File: `assets/tokens-affivn.css` (đầy đủ sáng + tối + base + nút). Tóm tắt:

- Mặt phẳng ấm: ceramic `#F2F0EB` (nền), off-white `#F7F5F0`, sand `#EDEBE4`, oat `#E3E1D9`, warm-sand
  `#D6D3C9` (viền đậm); thẻ trắng `#FFF`.
- Chữ xanh thường xanh: `#1E3932` (12.6:1), `#37423D` (10.4:1), `#6E6E68` (4.5:1 trên ceramic).
- Xanh: accent `#00754A` (nút chính, chữ trắng 5.8:1), brand `#006241` (focus, chữ xanh 7.4:1), tint
  `#D4E9E2` (chọn, xong), house `#1E3932` (slab tối, nút tối), uplift `#2B5148` (hover nút tối).
- Vàng `#CBA258` **chỉ** cho "đã dựng xong/thành phẩm"; đỏ `#C82014` cho lỗi/xoá.
- Font Be Vietnam Pro 400/500/600; pill cho nút; 12 input; 16 thẻ; 20 dialog.
- Nguồn gốc: `D:\AI\shoppe\packages\design\tokens.ts` — thương hiệu **cấm tím**, cấm gradient, cấm glow.

## 12. Dựng hệ mới trong 30 phút (khi không có thương hiệu)

1. Chọn **một** tính từ chủ đạo từ brief (công cụ / biên tập / mềm / kỹ thuật / sang…).
2. Chọn hue nền (ấm, lạnh, trung tính) + một màu nhấn tương phản với hue đó; tránh tím→xanh.
3. Sinh 5 bậc bề mặt bằng cách giảm độ sáng 2–4% mỗi bậc (OKLCH tiện: giữ C,H, đổi L).
4. 3 màu chữ: đậm nhất ~12:1, giữa ~9:1, nhạt ≥4.5:1 — trên nền chính. Đo bằng `contrast.mjs`.
5. Chọn font theo tính từ (công cụ: grotesk/humanist sans; biên tập: serif thân + sans UI; kỹ thuật:
   mono nhấn nhá). Tiếng Việt: kiểm dấu.
6. Thang chữ 6 bậc, thang bo 4–6 bậc theo loại phần tử, 4 bậc bóng nhuộm màu chữ.
7. Viết thành `tokens.css` + `DESIGN.md` (có "vì sao") → dựng MỘT màn hình mẫu → chỉnh → mới nhân ra.
8. Hoặc: nhờ model sinh **3 hệ khác nhau cho cùng một nội dung** (mẫu prompt ở 01 mục 11) rồi chọn.

## 13. DESIGN.md — hệ thiết kế thành file

Định dạng Google `design.md`: YAML token ở đầu + văn xuôi giải thích. Mẫu: `assets/DESIGN.md.template`.
Các mục: Overview (tính cách, cho ai) · Colors (vai trò + hex + dùng khi nào + cấm gì) · Typography ·
Layout (lưới, spacing, container, breakpoint) · Elevation · Shapes (bo góc) · Components (nút, input,
thẻ, dialog, toast, trạng thái) · Motion · Do's & Don'ts (kèm lý do).

Vì sao cần: agent đọc file trước mỗi lần build → không trôi phong cách giữa các phiên; người mới/agent
phụ làm đúng mà không phải hỏi; có chỗ ghi "đã duyệt" để lần sau bắt đầu từ đó.

## 14. Số liệu từ 15 site SaaS thật (awesome-design-md, parse YAML thủ công)

| Brand | Display (px/weight/tracking/leading) | Body | Thang bo | Nút chính |
|---|---|---|---|---|
| Stripe | 56/300/−1.4px/1.03 | 16 | 4·6·8·12·16 | pill 8×16 |
| Linear | 80/600/−3px/1.05 | 18 | 4·6·8·12·16·24 | bo vừa 8×14 |
| Vercel | 48/600/−2.4px/1.0 | 18 | 0·4·6·8·12·16·pill | pill |
| Notion | 80/600/−2px/1.05 | 16 | 4…24 | bo vừa 10×18 |
| Apple | 56/600/−0.28px/1.07 | 17 | 0·5·8·11·18 | pill 11×22 |
| Cursor | 72/400/−2.16px/1.1 | 16 | 0…16 | bo vừa, cao 40 |
| Figma | 86/340/−1.72px/1.0 | 20 | 2·6·8·24·32·pill | pill 10×20 |
| Framer | 110/500/−5.5px/0.85 | 18 | 4…100 | pill |
| Mintlify | 72/600/−2px/1.05 | 16 | 4…24 | pill |
| PostHog | 36/700/0/1.5 | 16 | 0·2·4·6·8 | bo vừa, cao 40 |
| Resend | 96/400/−0.96px/1.0 | 18 | 0…16 | bo vừa, cao 36 |
| Sentry | 88/700/0/1.2 | 16 | 4…18 | bo vừa 12×16 |
| Shopify | 96/330/+2.4px/1.0 | 18 | 4·5·8·12·20 | pill |
| Webflow | 80/600/−0.8px/1.04 | — | 0·2·4·8 | bo nhỏ |
| Airbnb | — | 16 | 0…32 | bo nhỏ, cao 48 |

Mẫu số chung: display 56–96px; tracking âm; body 16–18 (không site nào < 16 trên marketing); thang bo
4·6·8·12·16(·24)+pill; nút cao 36–48; spacing nền 4; elevation 4–6 bậc, bậc 0 phẳng; dark mode dùng
bề mặt sáng dần + hairline thay bóng; "trang trí" = ảnh UI sản phẩm thật, không phải icon/hạt lơ lửng.
Lưu ý: đây là bản phân tích cộng đồng, không phải tài liệu chính thức của brand.
