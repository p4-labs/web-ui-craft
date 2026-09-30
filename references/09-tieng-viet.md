# 09 — Tiếng Việt trong giao diện

Mục lục: 1. Font · 2. Dấu & chiều cao dòng · 3. Độ dài dòng · 4. Unicode NFC/NFD · 5. Regex ·
6. Tìm kiếm không dấu & sắp xếp · 7. Bộ gõ (IME, Telex) · 8. Số, tiền, ngày giờ · 9. Văn phong UI ·
10. Slug & tên file · 11. Chuỗi thử

---

## 1. Font

- **Be Vietnam Pro**: thiết kế cho tiếng Việt, dấu cân, nhiều độ đậm — lựa chọn mặc định (AffiVN,
  Studio). Serif có tiếng Việt tốt: **Lora**. Nét tay: **Shantell Sans** (vevideo).
- Kiểm một font bất kỳ: Google Fonts → lọc "Language: Vietnamese", rồi gõ chuỗi thử (mục 11) ở cỡ thật.
  Lỗi hay gặp ở font "có hỗ trợ" nhưng kém: dấu chồng (ặ, ổ) va nhau, dấu hỏi quá nhỏ, dấu đậm/nhạt
  không đều, `ư ơ` có râu lệch.
- Fallback có tiếng Việt: `"Segoe UI Variable Text", "Segoe UI"` (Windows), `-apple-system` (macOS/iOS),
  `system-ui`, Roboto (Android).
- Ship đủ độ đậm dùng thật (400/500/600) — làm đậm giả làm dấu nhoè.
- `unicode-range` subset `vietnamese`:
  `U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301,
  U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB`.

## 2. Dấu & chiều cao dòng

- Thân chữ: `line-height` ≥1.5 (dấu trên + dấu dưới cần chỗ); đoạn đọc 1.6.
- **Display tiếng Việt cần leading ≥ ~1.15–1.2**: số liệu display của site Mỹ (leading 0.85–1.05)
  sẽ làm dấu của chữ HOA (Ệ, Ộ, Ử) chạm/đè dòng trên. Kiểm chữ hoa có dấu chồng ở dòng thứ hai.
- Vùng có `overflow: hidden` (nút, chip, ô một dòng) có thể **cắt dấu** trên/dưới nếu chiều cao =
  line-height sát: để chiều cao dư 2–4px hoặc dùng padding thay cho height cứng + line-height 1.
- Tránh tiêu đề lớn toàn chữ HOA: chữ hoa có dấu chồng rất cao, dòng trông lởm chởm; caps giãn rộng
  càng khó đọc.
- `text-transform: uppercase` đúng với tiếng Việt, nhưng để nhãn nhỏ (≤12px) thì dấu khó thấy — dùng
  sentence case.

## 3. Độ dài dòng

- Tiếng Việt đơn âm tiết, nhiều khoảng trắng → dòng chứa nhiều "từ" hơn tiếng Anh ở cùng số ký tự.
- Đo thực tế Be Vietnam Pro 15px ≈ **7.3px/ký tự** → cột 640px ≈ 88 ký tự: vẫn dễ đọc với tiếng Việt
  (cột kịch bản Studio). Mục tiêu 60–90 ký tự; `max-width: 65ch` là điểm khởi đầu tốt cho văn bản dài.
- Không ngắt giữa số và đơn vị: `12&nbsp;phút`, `3&nbsp;MB`, `TP.&nbsp;HCM`.
- `text-wrap: pretty` tránh một âm tiết mồ côi ở dòng cuối. `hyphens` không áp dụng cho tiếng Việt.

## 4. Unicode NFC/NFD

Cùng một chữ "ệ" có thể là 1 ký tự (NFC) hoặc "e" + dấu mũ + dấu nặng (NFD). Văn bản dán từ macOS, tên
file trên macOS, một số bộ gõ cũ sinh NFD → nhìn giống hệt nhưng: so sánh chuỗi sai, regex không khớp,
tìm kiếm không ra, một số font đặt dấu lệch.
```js
const clean = (s) => String(s ?? '').normalize('NFC');
```
- Chuẩn hoá **ở biên**: khi nhận input, khi đọc file, trước khi so sánh/lưu. Server cũng làm.
- Độ dài chuỗi (`.length`) khác nhau giữa NFC/NFD — đếm ký tự hiển thị bằng
  `[...new Intl.Segmenter('vi', { granularity: 'grapheme' }).segment(s)].length`.

## 5. Regex

- **`\b` và `\w` trong JavaScript chỉ hiểu ASCII**, kể cả với cờ `u`. "ụ", "ấ", "đ" bị coi là ký tự
  không-phải-chữ → `\bbấm\b` khớp sai/không khớp; `/^(Sửa file|Công cụ)\b/` hỏng ngay sau "ụ".
- Dùng ranh giới Unicode:
  ```js
  const WORD_START = '(?<![\\p{L}\\p{N}])', WORD_END = '(?![\\p{L}\\p{N}])';
  /(?<![\p{L}\p{N}])(?:bấm|nhấn|ấn|chọn|click)(?![\p{L}\p{N}])/giu
  /^(Sửa file|Đọc file|Tìm web|Đọc web|Công cụ)(?=[\s:]|$)/i      // đuôi: lookahead thay \b
  ```
- Chữ cái: `\p{L}` thay `[a-zA-Z]`/`\w`; dấu kết hợp: `\p{M}` (hoặc `\p{Diacritic}`).
- Cờ `i` + `u` đúng cho hoa/thường tiếng Việt (Đ/đ, Ệ/ệ).
- Luôn `normalize('NFC')` cả mẫu lẫn văn bản trước khi khớp.

**Ví dụ thật — phát hiện lời mời bấm nút trong tin agent** (Studio `chat-call-to-action.js`):
```js
const ASK_RE = /(?<![\p{L}\p{N}])(?:bấm|nhấn|ấn|chọn|click)(?:\s{1,3}(?:vào|nút|lại))*\s{0,3}[*_`“"'«‘]{0,3}\s{0,2}(nghe thử(?:\s{1,3}kịch bản)?|dựng video)(?![\p{L}\p{N}])/giu;
const NEGATION_RE = /(?:đừng|chớ|khoan|chưa(?:\s+cần)?|không(?:\s+cần|\s+nên)?)[\s,]*(?:vội\s+)?(?:hãy\s+)?$/iu;
const LOOKBACK = 24; // xét phủ định trong 24 ký tự ngay trước động từ
```
- Khớp: "bấm **Dựng video**", "nhấn nút “Nghe thử kịch bản”".
- Không khớp: nhắc suông ("sau khi dựng video xong"), động từ nằm trong từ khác ("Anh Tuấn nghe thử"),
  phủ định ("đừng bấm", "chưa cần bấm", "không cần bấm", "khoan hãy bấm").
- Lượng từ có giới hạn (`\s{1,3}`) → không backtracking thảm hoạ trên tin dài.

## 6. Tìm kiếm không dấu & sắp xếp

```js
// "Hà Nội" ~ "ha noi"; NFD không tách "đ" (chữ riêng) → thay tay
const fold = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const match = (item, q) => fold(item).includes(fold(q));
```
- Tô sáng kết quả trên chuỗi gốc: tìm vị trí trên bản fold có cùng độ dài theo ký tự NFC (fold từ NFC
  giữ 1-1 ký tự sau khi bỏ dấu kết hợp) rồi cắt chuỗi gốc NFC tại cùng chỉ số.
- Sắp xếp theo bảng chữ cái Việt (a ă â b c d đ e ê …):
  `items.sort(new Intl.Collator('vi').compare)`; so sánh bỏ dấu + hoa/thường:
  `new Intl.Collator('vi', { sensitivity: 'base' })` (lưu ý: `đ` ≠ `d` ở mức base).

## 7. Bộ gõ (IME, Telex)

- Bộ gõ trên macOS, iOS, Android (Gboard) dùng **composition**: trong lúc gõ "tieengs", chữ đang ghép
  chưa chốt; Enter lúc đó là để **chốt chữ**, không phải để gửi.
  ```js
  textarea.addEventListener('keydown', (e) => {
    if (e.isComposing || e.keyCode === 229) return;          // đang ghép chữ
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  ```
- Unikey/EVKey trên Windows gửi phím xoá + ký tự thay thế (không composition) → sự kiện `input` bắn ra
  với chuỗi trung gian ("tiee" → "tiê"): tìm-khi-gõ phải debounce ~200ms; đừng validate/format giữa
  chừng.
- `contenteditable` tự chế hay xung đột với bộ gõ Việt → ưu tiên `<textarea>` / `<input>` gốc.
- Đừng chặn/đổi ký tự trong `keydown` (kiểu "chỉ cho phép a–z") — sẽ phá bộ gõ.
- `autocapitalize="sentences"`, `spellcheck` bật cho văn bản thường, tắt cho mã/đường dẫn.

## 8. Số, tiền, ngày giờ

```js
new Intl.NumberFormat('vi-VN').format(1234567.8)                               // "1.234.567,8"
new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(125000) // "125.000 ₫"
new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(1.5)       // "1,5" (1,5 MB)
new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) // "29/09/2026"
new Intl.RelativeTimeFormat('vi', { numeric: 'auto' }).format(-1, 'day')       // "hôm qua"
```
- Giờ 24h ("14:02"); ngày/tháng/năm; hôm nay chỉ ghi giờ, ngày khác ghi "28/09 14:02", khác năm thêm năm.
- Thời gian tương đối: "vừa xong" (<45s), "5 phút trước", "3 giờ trước", "hôm qua", "4 ngày trước",
  rồi ngày tuyệt đối. Tính "hôm qua" theo **ngày lịch địa phương**, không theo 24 giờ UTC.
- Khoảng thời gian bằng chữ: "45 giây", "1 phút 37 giây", "12 phút"; đồng hồ: "1:04", "1:02:05".
- Tiếng Việt không có số nhiều: "1 file", "3 file" — không cần hàm plural (nhưng vẫn cần "Chưa có file"
  cho 0).

## 9. Văn phong UI

- Sentence case: "Nghe thử kịch bản", không "Nghe Thử Kịch Bản".
- Nhất quán đại từ: chọn "bạn" (Studio) và giữ khắp nơi; agent xưng hô theo AGENTS.md.
- Động từ đứng đầu nhãn nút: "Dựng video", "Tạo dự án", "Xoá dự án".
- Dấu ba chấm một ký tự trong trạng thái: "Đang tạo…"; ngoặc kép cong “…”.
- Thông báo lỗi: chuyện gì + làm gì tiếp ("Không tải được file của dự án." / "Dựng video thất bại. Xem
  nhật ký ở tab Kết quả.").
- Tránh văn dịch máy ("Hãy chắc chắn rằng…", "Được tạo bởi…"), tránh Anh–Việt trộn không cần thiết
  ("render xong" → "dựng xong"), trừ thuật ngữ người dùng quen.
- Viết tắt/tên riêng đọc bằng TTS là chuyện khác (xem dự án video), UI chỉ cần hiển thị đúng.

## 10. Slug & tên file

```js
const slug = (s) => fold(s.normalize('NFC')).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
// "Vì sao Hà Nội có mùa hoa sữa?" → "vi-sao-ha-noi-co-mua-hoa-sua"
```
Hiển thị tên gốc có dấu cho người dùng; slug chỉ để lưu/URL.

## 11. Chuỗi thử

```
Tiếng Việt có dấu: Ặ Ẳ Ẵ Ấ Ầ Ẩ Ẫ Ậ Ễ Ệ Ổ Ỗ Ộ Ờ Ở Ỡ Ợ Ừ Ử Ữ Ự Ỳ Ỷ Ỹ Ỵ Đ
thường: ặ ẳ ẵ ấ ầ ẩ ẫ ậ ễ ệ ổ ỗ ộ ờ ở ỡ ợ ừ ử ữ ự ỳ ỷ ỹ ỵ đ
Câu: "Người Việt Nam yêu thương đất nước, gửi lời chúc mừng năm mới." · "KHOẢNH KHẮC ĐẸP NHẤT"
Số: 1.234.567,8 · 125.000 ₫ · 29/09/2026 14:02
```
Dán vào tiêu đề, nút, chip, input — ở cỡ thật — trước khi chốt font và line-height.
