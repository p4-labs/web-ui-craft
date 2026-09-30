# 10 — Kiểm tra trước khi báo xong

Ảnh chụp là bằng chứng; "code trông đúng" không phải. Mọi lần làm lại Studio đều tìm ra lỗi chỉ lộ khi
nhìn tận mắt (chữ tràn ở 1024, dấu bị cắt, poster đen, thanh cuộn ngang ở 390).

Mục lục: 1. Ma trận ảnh chụp · 2. Giả lập trạng thái · 3. Kiểm bằng máy trong trang · 4. Script của skill ·
5. Bàn phím & trình đọc màn hình · 6. Test logic trên dữ liệu thật · 7. Review độc lập · 8. Chấm điểm &
vòng sửa · 9. Báo cáo · 10. Mẹo & bẫy môi trường

---

## 1. Ma trận ảnh chụp

Tối thiểu: **3 cỡ × 2 chế độ** cho mỗi màn hình/tab chính.

| Cỡ | Vì sao |
|---|---|
| 1440×900 | desktop chuẩn |
| 1024×768 | cỡ hay vỡ nhất: sidebar + nội dung chật, header dồn |
| 390×844 | điện thoại (thêm 320 cho trang công khai) |

× sáng / tối (`prefers-color-scheme`). Thêm: reduced-motion (1 lần), forced-colors (1 lần nếu app có
nhiều trạng thái màu).

**Cách 1 — script đi kèm** (Playwright + Chrome có sẵn trên máy):
```bash
node <skill>/scripts/screenshot-matrix.mjs http://127.0.0.1:8789/#agent --out D:/path/shots \
  --sizes 1440x900,1024x768,390x844 --schemes light,dark --wait 1200
# có thể lặp --url cho nhiều tab; --full chụp cả trang dài; --playwright <thư mục node_modules>
```
Script cũng in cảnh báo: cuộn ngang, lỗi console, request hỏng.

**Cách 2 — Playwright MCP** (`mcp__playwright__*`): `browser_resize` → `browser_navigate` →
`browser_emulate_media({colorScheme})` → `browser_take_screenshot`. Lưu ảnh trong thư mục được phép của
MCP (Studio: `D:\AI\youtube\.playwright-mcp\…`) — ngoài đó bị từ chối.

**Xem ảnh thật sự:** mở từng ảnh (Read tool hiển thị ảnh), soi: thứ bậc, khoảng cách, chữ bị cắt, dấu
tiếng Việt, căn lề, màu trạng thái, dark mode có mảng nào quên token (nền trắng chói, chữ đen trên nền
tối).

## 2. Giả lập trạng thái

Trạng thái hiếm (đang chạy, lỗi, xong, rỗng, rất nhiều dữ liệu, tên siêu dài) phải được **nhìn**, không
cần chờ job thật:
- **Import module ngay trong trang** rồi gọi hàm render với model giả:
  ```js
  const m = await import('/chat-next-action.js');           // browser_evaluate / run_code
  // hoặc gọi hàm build/patch với dữ liệu tự tạo, chụp, rồi reload để trả về trạng thái thật
  ```
- **Chặn mạng**: `page.route('**/api/projects/*/jobs', r => r.fulfill({ json: [{ id: 'x', kind: 'render',
  status: 'running', started_at: new Date(Date.now() - 83000).toISOString() }] }))`.
- **Dữ liệu cực đoan**: tên dự án 120 ký tự, 200 file, tin agent 30 KB markdown, đường dẫn Windows không
  khoảng trắng dài 180 ký tự, chữ hoa có dấu chồng.
- Trạng thái lỗi mạng: tắt server hoặc route trả 500 → toast một lần, UI không vỡ.
- Reload sau khi giả lập để không để lại trạng thái bẩn.

## 3. Kiểm bằng máy trong trang

Chạy trong console/`browser_evaluate`:
```js
// cuộn ngang + phần tử tràn phải (bỏ qua thứ đã bị cha overflow:hidden/clip cắt — hình trang trí)
(() => {
  const W = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth <= W) return 'không cuộn ngang';
  const clipped = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement)
    if (/(hidden|clip)/.test(getComputedStyle(p).overflowX)) return true; return false; };
  return [...document.querySelectorAll('body *')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width && r.right > W + 1 && getComputedStyle(el).position !== 'fixed' && !clipped(el);
  }).map((el) => `${el.tagName}.${el.className}`.slice(0, 80)).slice(0, 20);
})()
```
```js
// chữ bị cắt mà không có dấu … (overflow hidden, không ellipsis)
[...document.querySelectorAll('body *')].filter((el) => {
  const cs = getComputedStyle(el);
  return el.scrollWidth > el.clientWidth + 1 && cs.overflowX === 'hidden' && cs.textOverflow !== 'ellipsis' && el.children.length === 0;
}).map((el) => el.className).slice(0, 20)
```
```js
// cỡ chữ & độ đậm thực tế đang dùng (đếm số biến thể)
(() => { const s = new Map(); for (const el of document.querySelectorAll('body *')) { if (!el.childNodes.length) continue;
  const cs = getComputedStyle(el); const k = `${cs.fontSize}/${cs.fontWeight}`; s.set(k, (s.get(k) || 0) + 1); }
  return [...s].sort((a, b) => b[1] - a[1]); })()
```
```js
// vùng chạm nhỏ hơn 24px (desktop) / 44px (cảm ứng)
[...document.querySelectorAll('button, a[href], input, select, [role=tab]')].filter((el) => {
  const r = el.getBoundingClientRect(); return r.width && (r.width < 24 || r.height < 24);
}).map((el) => el.getAttribute('aria-label') || el.textContent.trim().slice(0, 30))
```
Console: không lỗi, không cảnh báo (cảnh báo preload font là thật — xem 08 mục 7).

## 4. Script của skill

```bash
node <skill>/scripts/audit-css.mjs <thư-mục-css> --tokens <file-token.css>   # lỗi → exit 1
node <skill>/scripts/audit-css.mjs frontend --tokens frontend/style.css --json > audit.json
node <skill>/scripts/contrast.mjs "#6e6e68" "#f2f0eb"                         # 1 cặp
node <skill>/scripts/contrast.mjs --tokens frontend/style.css --pairs "text-3:bg,text-3:surface,on-accent:accent"
node <skill>/scripts/spring-easing.mjs --preset gentle
node <skill>/scripts/screenshot-matrix.mjs <url> --out <dir>
```
Đọc kết quả audit như một danh sách việc: lỗi (error) phải sửa; cảnh báo (warn) xem xét từng cái, cái nào
có chủ đích thì để lại chú thích trong CSS.

## 5. Bàn phím & trình đọc màn hình

- Rút chuột: Tab từ đầu tới cuối trang — mọi điều khiển tới được, focus luôn thấy, thứ tự hợp lý, không
  kẹt (trừ trong dialog), Esc đóng, mũi tên chạy trong tab/radio.
- Mở dialog → focus vào trong; đóng → focus về nút mở.
- Narrator/NVDA (Windows): đọc danh sách tab ("tab, 2 trên 4, đã chọn"), một nút icon (đọc nhãn), một
  vùng trạng thái (đọc một lần, không đọc đồng hồ mỗi giây).
- Zoom 200%: không mất nội dung, không cuộn ngang ở 1280.

## 6. Test logic trên dữ liệu thật

- Tách logic thuần (không DOM) ra module riêng: nhãn bước, regex lời mời, định dạng thời gian, trạng
  thái hàng hành động. Frontend ES module import thẳng được từ test Node của backend:
  ```js
  // backend/test/chat-labels.test.js
  import { test } from 'node:test'; import assert from 'node:assert/strict';
  import { describeStep } from '../../frontend/chat-step-labels.js';
  ```
- **Fixture lấy từ log thật** (chat.jsonl, output agent thật), không tự bịa định dạng. Ca thật Studio:
  test tự bịa qua 100%, dữ liệu thật sai 8/24.
- Mỗi regex có test: khớp đúng, không khớp nhắc suông, không khớp phủ định, không khớp trong từ khác,
  hiệu năng trên văn bản 100 KB (< 50ms).
- Chạy toàn bộ bộ test (`npm test`) sau mỗi lượt sửa; không bỏ qua test hỏng.

## 7. Review độc lập

Giao cho agent code-reviewer (hoặc tự review với "mắt người lạ") với trọng tâm:
- Race condition: phản hồi cũ đè mới, đổi dự án giữa `await`, timer chạy sau khi đổi ngữ cảnh.
- Vòng đời UI sống: phần tử biến mất khi không nên (hàng hành động khi chat tiếp), media bị tắt, focus
  mất.
- a11y: vùng live đọc lặp, nút thiếu nhãn, inert không chuyển focus.
- Regex: ASCII `\b` với tiếng Việt, backtracking, phủ định.
- CSS: token lạ, cỡ chữ ngoài thang, `transition: all`, thiếu reduced-motion, dark mode quên.
Sửa hết mức cao + vừa; mức thấp ghi lại. Agent reviewer có thể không ghi được file → lead dán kết quả
vào `plans/<plan>/reports/`.

## 8. Chấm điểm & vòng sửa

Chấm 1–10, mỗi mục ghi lý do một dòng:

| Mục | Câu hỏi |
|---|---|
| Thứ bậc | Mắt đi đâu đầu tiên? Có phải hành động chính? |
| Đọc được ở 360–390px | Chữ ≥ 12px, không tràn, vùng chạm đủ? |
| Nhất quán | Cùng loại phần tử trông giống nhau ở mọi tab? |
| Đúng thương hiệu | Màu, chữ, bo góc, bóng theo token? |
| Chăm chút | Chi tiết ở 05 đã qua? Trạng thái đủ? |
| Người lạ | Người mới biết bấm gì tiếp trong 5 giây? |

Sửa 3 lỗi tệ nhất → chụp lại → chấm lại, tới khi mọi mục ≥ 8. Mỗi lượt sửa theo "hàng rào" (một vùng,
một thay đổi, không đổi gì khác).

## 9. Báo cáo

- Đã đổi gì (theo vùng/tab), file nào, class/hàm mới.
- Ảnh trước/sau (1–3 ảnh quan trọng nhất, không đổ cả 24 ảnh).
- Kết quả test (`N/N pass`), audit, contrast.
- **Quyết định thuộc về gu** cần người dùng chốt (màu vàng cho "xong"? độ rộng cột?), liệt kê cuối báo cáo.
- Việc còn mở/chưa làm, nói thẳng.

## 10. Mẹo & bẫy môi trường

- Khung trình duyệt nhúng trong app có thể **không vẽ lại** ở bề rộng hẹp (trang trắng) — xác minh bằng
  Playwright trước khi kết luận app lỗi.
- Tab bị ẩn → `document.hidden` = true → poller dừng, đồng hồ dừng: chụp ảnh trạng thái sống ở tab đang
  hiển thị.
- Font chưa tải xong lúc chụp → chờ `document.fonts.ready` rồi thêm ~300ms.
- **Ảnh chụp toàn trang có mảng trống lớn** → các section "hiện khi cuộn tới" (IntersectionObserver,
  `animation-timeline: view()`) chưa chạy vì ảnh toàn trang không cuộn. Cuộn hết trang rồi về đầu trước
  khi chụp (`screenshot-matrix.mjs --full` đã làm sẵn). Đồng thời tự hỏi: nội dung có hiện đủ khi JS lỗi
  hoặc bật reduced-motion không? Nội dung chính không nên phụ thuộc vào reveal.
- **API giả lập có độ trễ ngẫu nhiên** → ảnh chụp chỉ thấy skeleton; tăng `--wait` (≈9s) hoặc cho lần gọi
  đầu của mock trả nhanh.
- Animation vào đang chạy lúc chụp → chờ hoặc emulate reduced-motion cho ảnh tĩnh.
- Server dev cache file tĩnh → thêm `?v=` hoặc hard reload.
- Nhiều agent phụ cùng dùng một trình duyệt → xung đột; chỉ lead chụp.
- Ảnh chụp lưu trong repo làm phình dung lượng → để trong thư mục tạm/thư mục MCP, chỉ giữ ảnh cần cho
  báo cáo.
