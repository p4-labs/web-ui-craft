# 04 — Chuyển động & vi tương tác

Mục lục: 1. Nguyên tắc · 2. Khi nào KHÔNG animate · 3. Bảng thời lượng · 4. Easing & spring ·
5. Thuộc tính được animate · 6. Công thức (copy-paste) · 7. Chuyển động bằng JS (WAAPI, FLIP, View
Transitions) · 8. Reduced motion · 9. Hiệu năng · 10. Landing: chuyển động kể chuyện · 11. Lỗi hay gặp

Tất cả công thức CSS nằm sẵn trong `assets/motion.css`.

---

## 1. Nguyên tắc

1. **Chuyển động phải trả lời một câu hỏi**: cái này từ đâu ra? (vào), nó đi đâu? (ra), tôi vừa bấm
   trúng chưa? (nhấn), cái gì vừa đổi? (cập nhật), còn đang chạy không? (tiến trình). Không trả lời câu
   nào → bỏ.
2. **Nhanh.** Tương tác 100–200ms; không quá 300ms cho thứ người dùng chờ. Dropdown 180ms "cảm giác
   nhanh hơn" 400ms dù cùng nội dung (Emil Kowalski).
3. **Ease-out mạnh** cho gần như mọi thứ: bắt đầu nhanh (phản hồi ngay), lắng chậm. Không `linear` cho
   UI (trừ spinner/tiến trình). Không `ease-in` cho thứ đi vào (khởi động chậm = cảm giác lag).
4. **Nhỏ.** Dịch 4–8px, scale .96–.98, blur 2–4px. Không bay từ ngoài màn hình, không scale từ 0.
5. **Ra nhẹ hơn vào:** thoát nhanh hơn (≈ 2/3 thời lượng vào) và dịch ít hơn — người dùng đã quyết
   định rời, đừng bắt họ xem.
6. **Có thể ngắt giữa chừng:** tương tác trạng thái (hover, mở/đóng, chọn) dùng `transition`, không
   `@keyframes` — transition đảo chiều mượt khi người dùng đổi ý giữa chừng.
7. **Một thứ một lúc:** dàn cảnh theo thứ tự (khung → nội dung → điểm nhấn), không mọi thứ cùng động.
8. **Không nảy (bounce/elastic) trên UI**, không hạt nổ, không glow nhấp nháy. Overshoot tối đa ~2–8%
   và chỉ cho khoảnh khắc hiếm (hoàn thành job).
9. **Luôn có `prefers-reduced-motion`.**

## 2. Khi nào KHÔNG animate

- Hành động **lặp hàng trăm lần/ngày**: di chuyển trong danh sách, mở menu quen, gõ phím, chuyển tab liên
  tục → tức thì hoặc ≤120ms chỉ opacity.
- Hành động **khởi từ bàn phím**: ⌘K mở bảng lệnh, phím tắt chuyển tab → không animate (người dùng
  bàn phím muốn tốc độ).
- **Focus ring**: hiện tức thì, không transition.
- **Đổi theme sáng/tối**: tắt transition toàn trang trong khoảnh khắc đổi (thêm class
  `.no-transitions * { transition: none !important }` rồi gỡ ở frame sau).
- **Tooltip**: lần đầu có trễ ~400–600ms; các tooltip liền kề sau đó mở ngay không animation.
- **Nội dung đang đọc** (tin nhắn cũ, đoạn văn): không animate lại khi dữ liệu poll về — chỉ phần tử
  **mới thật sự** được animate (xem 6.9).

## 3. Bảng thời lượng

| Tương tác | Thời lượng | Easing | Ghi chú |
|---|---|---|---|
| Hover đổi màu/nền | 100–150ms | `--ease` | chỉ `@media (hover: hover)` |
| Nhấn (press) | 80–120ms | `--ease` | scale .97 (nút), .94–.95 (nút tròn nhỏ) |
| Focus ring | 0 | — | tức thì |
| Tooltip | 120ms (trễ 400–600ms lần đầu) | ease-out | |
| Dropdown/menu/popover | 150–180ms vào, 100–120ms ra | `--ease` | scale .96 + opacity, `transform-origin` phía nút mở |
| Dialog | 180–240ms vào, 120–160ms ra | `--ease` | translateY(8px) scale(.98) |
| Toast | 180–220ms vào, 150ms ra | `--ease` | translateY(8px) |
| Chỉ báo tab trượt | 150–200ms | `--ease` hoặc spring không nảy | |
| Mở/đóng khối (details, accordion) | 200–260ms | `--ease` | height auto qua `interpolate-size` |
| Ngăn kéo/sidebar | 240–300ms | `--ease` | transform |
| Đổi icon (copy → tick) | 150–200ms | `--ease` | opacity + scale + blur |
| Tick tự vẽ | 300–400ms (trễ 60–100ms) | `--ease` | stroke-dashoffset |
| "Pop" hoàn thành | 280–360ms | spring nhẹ | đỉnh ≤ 1.08 |
| Stagger danh sách | 30–60ms/mục, trần 6–8 mục | | tổng ≤ 300ms |
| Stagger section (landing) | 80–100ms | | |
| Spinner | 0.7–0.8s/vòng | linear | |
| Chấm "đang chạy" (pulse) | 1.6s | ease-out | vòng lan, không nhấp nháy opacity |
| Skeleton | 1.6s | ease-in-out | đổi màu nền, không shimmer chói |
| Tô "vừa mới" (fresh) | 2.6–5s | ease | nền tint rồi phai |
| Reveal kể chuyện (landing) | 600–1200ms | expo-out | đọc được sau 1/3 đầu |

## 4. Easing & spring

```css
--ease: cubic-bezier(.2, .8, .2, 1);          /* mặc định tương tác (Studio) */
--ease-out-quint: cubic-bezier(.22, 1, .36, 1);
--ease-out-expo: cubic-bezier(.16, 1, .3, 1);   /* vào sân mạnh, lắng dài (Meng To dùng khắp nơi) */
--ease-in-out: cubic-bezier(.65, 0, .35, 1);    /* vật di chuyển giữa hai điểm trên màn hình */
--ease-in: cubic-bezier(.4, 0, 1, 1);           /* chỉ cho thoát rất ngắn, nếu muốn */
```

**Spring bằng CSS `linear()`** (Chrome 113+, Safari 17.2+, Firefox 112+): sinh bằng script, không tự gõ.
```bash
node scripts/spring-easing.mjs --preset no-bounce       # tới hạn, 0% vượt — chỉ báo tab, ngăn kéo (514ms)
node scripts/spring-easing.mjs --preset snappy          # ~0.6% — menu, popover, toggle nhỏ
node scripts/spring-easing.mjs --preset gentle --plot   # ~3% — pop hoàn thành, thẻ "đặt xuống"
node scripts/spring-easing.mjs --response 0.4 --bounce 0.2 --css-var ease-spring   # tự chỉnh
node scripts/spring-easing.mjs --stiffness 300 --damping 26 --mass 1               # thông số vật lý
```
Script in ra `linear(…)`, thời lượng (lúc spring lắng trong 0.1%), thời điểm đạt 95%, % vượt. Thời lượng
spring dài hơn cubic-bezier (≈500ms) nhưng 95% quãng đường xong trong ~250ms nên vẫn cảm giác nhanh.
`bounce` → độ vượt: 0 → 0%, 0.15 → 0.6%, 0.25 → 2.8%, 0.4 → 9.5%. Luôn khai báo fallback:
```css
.pop { transition: transform 320ms var(--ease); }
@supports (transition-timing-function: linear(0, 1)) { .pop { transition-timing-function: var(--ease-spring); } }
```
Spring hợp với thứ "vật lý" (kéo thả, chỉ báo di chuyển, pop); chữ và màu không cần spring.

## 5. Thuộc tính được animate

- **Rẻ (compositor):** `transform`, `opacity`, `filter` nhỏ. Mặc định chỉ dùng hai cái đầu.
- **Chấp nhận có điều kiện:** `background-color`, `color`, `border-color`, `box-shadow` (trên ít phần
  tử, hover); `height`/`grid-template-*` cho **một** khối mở/đóng không thường xuyên.
- **Tránh:** `width`, `height`, `top/left`, `margin`, `padding` trên danh sách hay thứ lặp — gây layout
  mỗi frame. Dùng `transform` (FLIP) thay.
- **Cấm `transition: all`**: animate cả thứ không định (padding, màu khi đổi theme), khó đoán, tốn.
  Liệt kê thuộc tính cụ thể.
- Bóng khi hover trên lưới nhiều thẻ: đặt bóng bậc cao vào `::after` và animate `opacity` của nó thay vì
  animate `box-shadow`.

## 6. Công thức

### 6.1 Nhấn (press)
```css
.btn { transition: background-color var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease); }
.btn:active:not(:disabled) { transform: scale(.97); }
.icon-btn:active { transform: scale(.95); }
```
Không scale dưới .95 (trông như giật). Nút có nhãn dài: `translateY(1px)` thay scale.

### 6.2 Hover chỉ trên thiết bị có hover
```css
@media (hover: hover) {
  .card:hover { box-shadow: var(--shadow-lift); }
  .card:hover img { transform: scale(1.03); }
}
```
Trên cảm ứng, `:hover` "dính" sau khi chạm — bọc media query để tránh.

### 6.3 Dialog vào + ra bằng `@starting-style` (không cần JS)
```css
dialog {
  opacity: 0; transform: translateY(8px) scale(.98);
  transition: opacity 140ms var(--ease), transform 140ms var(--ease),
              overlay 140ms allow-discrete, display 140ms allow-discrete;
}
dialog[open] { opacity: 1; transform: none; transition-duration: 220ms; }
@starting-style { dialog[open] { opacity: 0; transform: translateY(8px) scale(.98); } }

dialog::backdrop { background: var(--scrim); opacity: 0;
  transition: opacity 140ms var(--ease), overlay 140ms allow-discrete, display 140ms allow-discrete; }
dialog[open]::backdrop { opacity: 1; }
@starting-style { dialog[open]::backdrop { opacity: 0; } }
```
Trình duyệt chưa hỗ trợ: dialog hiện/ẩn tức thì (không hỏng). Popover (`[popover]:popover-open`) dùng
cùng công thức. Cách cũ (chỉ có vào): `dialog[open] { animation: dialog-in 260ms var(--ease) }`.

Hai cái bẫy khi có hiệu ứng ra (gặp thật ở Studio, 30/9):
- **Dialog đang mờ dần vẫn nuốt click** (nó và backdrop còn trong top layer thêm 140ms): thêm
  `dialog:not([open]), dialog:not([open])::backdrop { pointer-events: none; }`.
- **Code dọn nội dung trong sự kiện `close`** (xoá body, gỡ `src` video) làm dialog mờ dần trong
  trạng thái trống. Tắt tiếng ngay (`media.pause()`), còn phần dọn thì chờ hiệu ứng xong:
  ```js
  export function afterExit(dialog, cleanup) {          // dialog-exit.js ở Studio
    const running = dialog.getAnimations?.() ?? [];      // gọi getAnimations() sẽ cập nhật style → transition đã chạy
    const failsafe = new Promise((r) => setTimeout(r, 400));
    Promise.race([Promise.allSettled(running.map((a) => a.finished)), failsafe]).then(cleanup);
  }
  // trong 'close': const t = ++token; afterExit(dialog, () => { if (t === token && !dialog.open) body.replaceChildren(); });
  ```
  Media đã gỡ khỏi DOM thì luôn nhả `src` (kể cả khi dialog mở lại) để không tải ngầm 20 MB.

### 6.4 `<details>` mở mượt tới `height: auto`
```css
:root { interpolate-size: allow-keywords; }
details::details-content {
  block-size: 0; overflow-y: clip;
  transition: block-size 220ms var(--ease), content-visibility 220ms allow-discrete;
}
details[open]::details-content { block-size: auto; }
details summary .chevron { transition: transform 180ms var(--ease); }
details[open] summary .chevron { transform: rotate(90deg); }
```
Chrome 131+; nơi khác mở tức thì. Hợp cho "Đã chạy 12 bước" trong chat, FAQ, nhật ký lỗi. Cách không
cần tính năng mới: lưới `grid-template-rows: 0fr → 1fr` với con `min-height: 0`.

### 6.5 Chỉ báo tab trượt
Cách JS (chạy mọi nơi, chỉ transform):
```css
.tabs { position: relative; }
.tab-indicator { position: absolute; left: 0; bottom: 0; height: 2px; width: 1px; background: var(--accent);
  transform-origin: left; transform: translateX(var(--x, 0)) scaleX(var(--w, 0));
  transition: transform 180ms var(--ease); }
```
```js
function moveIndicator(tabs, indicator) {
  const active = tabs.querySelector('[aria-selected="true"]');
  if (!active) return;
  indicator.style.setProperty('--x', `${active.offsetLeft}px`);
  indicator.style.setProperty('--w', active.offsetWidth);
}
// gọi khi chọn tab + trong một ResizeObserver quan sát CẢ hàng tab LẪN TỪNG tab:
// chấm "đang chạy" hiện trên một tab, hay font web vừa tải xong, làm tab đó rộng ra mà hàng không đổi cỡ
const ro = new ResizeObserver(() => moveIndicator(tabs, indicator, { animate: false }));
ro.observe(tabs); tabs.querySelectorAll('[role="tab"]').forEach((t) => ro.observe(t));
```
Chỉ animate khi bấm chuột; đổi tab bằng phím mũi tên hoặc do code (mở dự án, deep link) thì nhảy thẳng.
Nếu chỉ báo là **nền pill** thay vì gạch chân: đặt `--x --y --w --h` và transition `width` (một phần tử
absolute, không làm xô gì) — `scaleX` sẽ bóp méo hai đầu bo tròn. Tab đang chọn khi đó để nền trong suốt.
Cách CSS thuần (anchor positioning, Chromium): tab chọn có `anchor-name: --tab`, chỉ báo
`position-anchor: --tab; left: anchor(left); right: anchor(right); transition: left .18s, right .18s`.
Lần tải đầu: đặt vị trí **không** transition (thêm transition sau frame đầu) để chỉ báo không bay từ 0.

### 6.6 Đổi icon: copy → tick
```css
.swap { display: inline-grid; }
.swap > * { grid-area: 1 / 1; transition: opacity 160ms var(--ease), transform 160ms var(--ease), filter 160ms var(--ease); }
.swap > .to, .swap[data-on] > .from { opacity: 0; transform: scale(.5); filter: blur(2px); }
.swap[data-on] > .to { opacity: 1; transform: none; filter: none; }
```
```js
btn.dataset.on = ''; announce('Đã chép');                 // aria-live
setTimeout(() => delete btn.dataset.on, 1500);
```
Dùng cho: copy, lưu (đĩa → tick), play ↔ pause, gửi ↔ dừng.

### 6.7 Tick tự vẽ (xong)
```html
<svg class="check-draw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round"><path pathLength="1" d="M5 12.5l4.5 4.5L19 7.5"/></svg>
```
```css
.check-draw path { stroke-dasharray: 1; animation: check-draw 340ms var(--ease) 80ms both; }
@keyframes check-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
```
`pathLength="1"` để khỏi đo độ dài path. Trạng thái "ẩn" chỉ nằm trong keyframes (fill `both`): nếu
viết `stroke-dashoffset: 1` ở rule thường, khi reduced-motion tắt animation (hoặc một sheet load sau
thắng specificity) thì dấu tick **biến mất hẳn** — lỗi thật ở Studio.

### 6.8 "Pop" hoàn thành (hiếm)
```css
@keyframes pop { 0% { transform: scale(.6); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
.done-badge.is-new { animation: pop 320ms var(--ease) both; }
```
Chỉ cho khoảnh khắc đáng ăn mừng (video dựng xong), không cho mỗi lần lưu.

### 6.9 Chỉ phần tử MỚI được vào sân
UI poll 3–4s một lần: nếu mọi lần vẽ lại đều chạy animation vào → cả danh sách nhấp nháy liên tục.
- Render theo key (07 mục 3); class `.is-new` chỉ gắn trong hàm **tạo** node, và **bỏ qua lần tải đầu**
  (lần đầu mọi thứ đều "mới").
- Với danh sách tin nhắn có chỉ số tăng dần: giữ "mốc cao nhất đã hiện" (`seenUpTo`), chỉ tin có
  `i > seenUpTo` mới được `.is-new`; lần render đầu của một dự án truyền `animate: false`.
- **Gỡ class sau khi chạy xong** (`animationend` + `animationcancel`, bắt bằng event delegation ở
  container). Lý do: CSS animation chạy lại mỗi khi tổ tiên `display:none` được hiện lại — tab panel ẩn
  bằng `[hidden]` → quay lại tab là tin nhắn cuối, nút "Dừng", hàng "Bước tiếp theo" lại trượt vào.
  Cùng lý do, đừng đặt animation vào sân thẳng lên class cơ bản của phần tử sống lâu (`.stop-btn {
  animation: … }`); dùng class một lần (`.is-entering`) do JS gắn đúng lúc trạng thái đổi.
- Stagger bằng biến: `style="--i: 3"` + `animation-delay: calc(min(var(--i), 6) * 40ms)`.
```css
.row.is-new { animation: row-in 220ms var(--ease) both; animation-delay: calc(min(var(--i, 0), 6) * 40ms); }
@keyframes row-in { from { opacity: 0; transform: translateY(4px); } }
.row.is-fresh { animation: row-fresh 5s ease forwards; }   /* file vừa được job tạo ra */
@keyframes row-fresh { 0%, 30% { background: var(--tint); } 100% { background: transparent; } }
```

### 6.10 Toast ra
```js
function dismiss(toast) {
  toast.classList.remove('show');                     // .toast { opacity:0; transform: translateY(8px) } .show { opacity:1; transform:none }
  const done = () => toast.remove();
  toast.addEventListener('transitionend', done, { once: true });
  setTimeout(done, 400);                              // failsafe: không có transition (reduced motion) vẫn gỡ
}
```
Vào: thêm node, đợi một frame (`requestAnimationFrame` hai lần hoặc đọc `offsetWidth`) rồi thêm `.show`
— hoặc dùng `@starting-style`. Ra: `.leaving { transform: translateY(4px); transition-duration: 140ms }`
(ngắn hơn đường vào). Tạm dừng đếm giờ khi rê chuột bằng `pointerenter/pointerleave` **chỉ với
`e.pointerType === 'mouse'`** — trên điện thoại một lần chạm bắn `mouseenter` mà không có `mouseleave`,
toast sẽ bị ghim đè lên ô soạn. `dismiss()` phải bỏ qua nếu toast đã `.leaving`.

### 6.11 Nút gửi: mũi tên "nhích"
```css
@media (hover: hover) { .send-btn:hover:not(:disabled) .icon { transform: translateY(-1px); } }
.send-btn .icon { transition: transform var(--dur-fast) var(--ease); }
.send-btn:active:not(:disabled) { transform: scale(.94); }
```
Một pixel là đủ — gợi hướng "đi lên/gửi đi" mà không làm trò.

### 6.12 Skeleton
```css
.sk { background: var(--surface-2); border-radius: var(--r-sm); animation: sk-pulse 1.6s ease-in-out infinite; }
@keyframes sk-pulse { 50% { background: var(--surface-3); } }
.sk-wrap { animation: fade-in 180ms ease .2s both; }   /* tải nhanh (<200ms) thì skeleton không kịp nháy */
```
Đúng hình dạng nội dung sắp tới; không shimmer gradient chói; reduced-motion: đứng yên.

### 6.13 Chấm "đang chạy"
```css
.dot-busy { background: var(--accent); animation: dot-pulse 1.6s ease-out infinite; }
@keyframes dot-pulse { 0% { box-shadow: 0 0 0 0 var(--accent-ring); } 70% { box-shadow: 0 0 0 6px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }
```
Vòng lan ra rồi tắt — "còn sống" mà không nhấp nháy khó chịu. Chỉ khi thật sự có việc đang chạy (chấm
"live" trang trí là dấu hiệu AI #11).

### 6.14 Đang suy nghĩ (3 chấm)
```css
.thinking i { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: think 1.2s infinite ease-in-out; }
.thinking i:nth-child(2) { animation-delay: .15s; } .thinking i:nth-child(3) { animation-delay: .3s; }
@keyframes think { 0%, 80%, 100% { transform: scale(.55); opacity: .35; } 40% { transform: scale(1); opacity: 1; } }
```
Kèm đồng hồ đếm `0:42` — chấm nói "đang chạy", đồng hồ nói "bao lâu rồi".

### 6.15 Thanh tiến trình vô định
```css
.indeterminate { position: relative; height: 3px; overflow: hidden; background: var(--surface-2); border-radius: 99px; }
.indeterminate::after { content: ""; position: absolute; inset: 0 auto 0 0; width: 36%; background: var(--accent);
  border-radius: inherit; animation: slide-across 1.4s var(--ease) infinite; }
@keyframes slide-across { from { transform: translateX(-100%); } to { transform: translateX(280%); } }
```

### 6.16 Reveal khi cuộn (chỉ landing)
```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal { animation: reveal linear both; animation-timeline: view(); animation-range: entry 0% cover 28%; }
    @keyframes reveal { from { opacity: 0; transform: translateY(16px); } }
  }
}
```
Không dùng `window.addEventListener('scroll')`. Không cho mọi section cùng một hiệu ứng (dấu hiệu AI #17)
— reveal dành cho vài khoảnh khắc chính.

## 7. Chuyển động bằng JS

**Web Animations API** thay cho setTimeout + class:
```js
const anim = el.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }],
  { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
await anim.finished; // rồi dọn dẹp
```

**FLIP** — di chuyển/sắp xếp lại mà chỉ animate transform:
```js
function flip(el, mutate, duration = 220) {
  const first = el.getBoundingClientRect();
  mutate();                                            // đổi DOM/class
  const last = el.getBoundingClientRect();
  const dx = first.left - last.left, dy = first.top - last.top;
  if (!dx && !dy) return;
  el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
    { duration, easing: 'cubic-bezier(.2,.8,.2,1)' });
}
```

**View Transitions** (cùng tài liệu) cho đổi cảnh lớn: đổi tab nội dung, sắp xếp lưới, mở ảnh to:
```js
if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) update();
else document.startViewTransition(update);
```
```css
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 180ms; }
.video-thumb { view-transition-name: hero-video; }   /* tên duy nhất trên trang */
```

**Luôn tôn trọng reduced motion trong JS:** `const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches`.

## 8. Reduced motion

Chính sách: **bỏ di chuyển, giữ thông tin.**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: .01ms !important; scroll-behavior: auto !important; }
  /* liệt kê từng animation trang trí; KHÔNG tắt .spinner (nó báo "đang chạy") */
  .dot-busy, .thinking i, .sk, .row.is-new, dialog[open], .chat-action { animation: none !important; }
  .btn:active, .icon-btn:active, .card:hover img { transform: none !important; }
}
```
- Spinner **giữ** (nó mang trạng thái); có thể đổi sang nhịp opacity chậm.
- `*, *::before, *::after` **không khớp** `::details-content`, `::backdrop`, `::marker`… → khối mở/đóng
  mượt (6.4) vẫn trượt 260ms dưới reduced-motion nếu không thêm rule riêng:
  `details.anim::details-content { transition: none !important; }` (cần `!important` vì thứ tự load).
- Thứ bị "ẩn chờ animation" (tick tự vẽ, phần tử vào sân) phải hiện đủ khi animation bị tắt: để trạng
  thái ẩn trong keyframes, không ở rule thường (6.7).
- Reveal/parallax/loop → tĩnh ở trạng thái cuối; ornament đứng yên.
- Có thể thay chuyển động bằng crossfade opacity ngắn (vẫn cho biết "đã đổi").
- Kiểm: DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`, hoặc Playwright
  `page.emulateMedia({ reducedMotion: 'reduce' })`.

## 9. Hiệu năng chuyển động

- `will-change: transform` chỉ trong lúc animate (thêm trước, gỡ sau) — để thường trực làm chữ mờ và tốn
  bộ nhớ.
- Blur lớn (`backdrop-filter: blur(20px)`) trên vùng lớn rất tốn GPU; tránh trên thứ cuộn.
- Vòng lặp (spinner, pulse) dừng khi khuất: `animation-play-state: paused` khi tab ẩn/phần tử ngoài
  màn hình (IntersectionObserver), hoặc chỉ render khi có việc.
- Đồng hồ đếm: một `setInterval` chung cho mọi đồng hồ, bỏ qua khi `document.hidden` (07 mục 5).
- `contain: layout paint` cho vùng có animation độc lập.
- Đo: DevTools Performance → không có "Layout" tím dày trong lúc animation; FPS ổn định 60.

## 10. Landing: chuyển động kể chuyện

- **Cuộn kể chuyện, thời gian chỉ di chuyển vật nhỏ.** Việc lớn gắn vị trí cuộn; "nhanh tới, chậm lắng".
- Hero là **một màn vào sân có dàn dựng**: khung → tiêu đề (từng dòng ~90ms, hoặc từng chữ blur 10→0px,
  y 50→0, 0.7s, stagger 100ms) → mô tả → CTA → visual. Không rải hiệu ứng lẻ khắp nơi.
- Ornament trôi nhẹ trong ô trống (drift ~14px, ±1.5°, 7–9s), **không đè chữ**.
- Kỹ thuật: CSS `animation-timeline: view()`, IntersectionObserver, GSAP ScrollTrigger, Lenis cho cuộn
  mượt (cân nhắc — cuộn "lướt" làm người dùng bàn phím/trackpad khó chịu).
- Loader của trang nặng (WebGL, video) luôn có failsafe (~15s) để không nhốt người dùng.

## 11. Lỗi hay gặp

| Lỗi | Sửa |
|---|---|
| Mọi thứ fade-in khi tải trang | Chỉ vài điểm chính; nội dung đọc hiện ngay |
| Cả danh sách nháy mỗi lần poll | Render theo key + `.is-new` chỉ khi tạo node (6.9) |
| Nút nhảy bề rộng khi đổi "Lưu" → "Đang lưu…" | Giữ `min-width`, spinner thay icon |
| Chữ đậm lên khi hover → xô layout | Đổi màu/nền, không đổi weight |
| Dialog chỉ có animation vào, đóng thì biến mất cụt | `@starting-style` + `allow-discrete` (6.3) |
| Chỉ báo tab bay từ trái sang khi tải trang | Đặt vị trí lần đầu không transition |
| `transition: all .3s` | Liệt kê thuộc tính |
| Hover "dính" trên điện thoại | `@media (hover: hover)` |
| Animation chạy cả khi reduced motion | Mục 8 + kiểm bằng emulate |
| Bounce ở mọi thứ | Spring không nảy hoặc ease-out; overshoot chỉ cho khoảnh khắc hiếm |
| Scale từ 0 | Bắt đầu .9–.98 |
| Quay lại tab là hiệu ứng vào chạy lại | Class một lần, gỡ khi `animationend` (6.9) |
| Dialog mờ dần mà trống trơn | Dọn nội dung sau khi exit xong (`afterExit`, 6.3) |
| Click ngay sau Esc bị nuốt | `pointer-events: none` cho dialog/backdrop `:not([open])` |
| Chỉ báo tab lệch khi tab có chấm badge | ResizeObserver trên từng tab (6.5) |
| Reduced-motion: tick biến mất / details vẫn trượt | Ẩn trong keyframes; rule riêng cho `::details-content` (mục 8) |
| Ảnh chụp toàn trang trống giữa chừng | Nội dung "reveal khi cuộn" chưa chạy: cuộn hết trang trước khi chụp (10) |
