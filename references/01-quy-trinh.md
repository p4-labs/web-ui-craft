# 01 — Quy trình làm giao diện (từ brief tới bàn giao)

Mục lục: 1. Brief · 2. Nguồn sự thật · 3. Soát hiện trạng · 4. Tham chiếu · 5. Hệ thiết kế thành file ·
6. Plan theo phần · 7. Mockup trước khi code · 8. Build · 9. Kiểm & sửa theo hàng rào · 10. Làm việc
song song với agent · 11. Mẫu prompt · 12. Bài học từ các ca thật

---

## 1. Brief — đọc đúng yêu cầu trước khi vẽ

Ba câu hỏi bắt buộc (tự trả lời từ ngữ cảnh; chỉ hỏi người dùng khi thực sự mơ hồ, và hỏi MỘT câu):
- **Ai dùng?** (chính người dùng một mình, khách hàng, người duyệt nội bộ, người mới…)
- **Dùng để làm gì?** (hành động chính trên màn hình này là gì — bấm gì tiếp theo?)
- **Cảm giác gì?** Chọn tính từ cực đoan: biên tập / thô mộc (brutalist) / mềm / công cụ / sang /
  vui / kỹ thuật / tối giản. "Sạch và hiện đại" không phải là một tone.

Viết ra một dòng "đọc brief": *Đọc là: <loại trang> cho <người dùng>, giọng <tính cách>, nghiêng về
<hệ thiết kế/thương hiệu>.* Ví dụ: *Đọc là: app nội bộ làm video cho một người vận hành, giọng công cụ
ấm, nghiêng về thương hiệu AffiVN.*

Câu người dùng mơ hồ như "cải thiện trang này" thường có nghĩa: áp những quy tắc vừa bàn + sửa chỗ
xấu/khó dùng rõ nhất. Nếu người dùng cho phép "làm lại CSS hoàn toàn" → được đổi bố cục/màu/chữ, nhưng
giữ kiến trúc thông tin (các tab, luồng) mà họ đã chọn trước đó — kiểm tra memory/plan cũ.

## 2. Nguồn sự thật — tìm trước, sáng tác sau

Thứ tự tìm:
1. **Token/DESIGN.md của thương hiệu** trong repo hoặc repo anh em (AffiVN: `D:\AI\shoppe\packages\design\tokens.ts`,
   bản mô tả `.stitch/DESIGN.md` trong các studio cũ). Có rồi thì dùng, không phát minh bảng màu mới.
2. **Quyết định cũ của người dùng** (memory, plan cũ): ví dụ "giữ thương hiệu AffiVN sáng, không dark
   theme mặc định", "bỏ panel phải, dùng tab".
3. **Font có sẵn** trong các dự án (shoppe có Be Vietnam Pro + Lora đã subset theo unicode-range) — chép
   sang, tự host.
4. **Tham chiếu hình ảnh** người dùng đưa hoặc đã lưu.

Chỉ khi không có gì mới dựng hệ mới (xem 02 mục "Dựng hệ mới trong 30 phút").

## 3. Soát hiện trạng (khi sửa trang có sẵn)

- Mở trang thật; nếu khung trình duyệt nhỏ, dùng Playwright chụp đúng độ phân giải (1440×900,
  1024×768, 390×844), sáng + tối (`emulateMedia({colorScheme})`).
- Chụp cả các trạng thái khó thấy: rỗng, đang tải, lỗi, đang chạy (giả lập bằng `import('/module.js')`
  ngay trong trang rồi gọi hàm render với dữ liệu giả — không tốn lượt agent/job thật).
- Đo CSS: `node scripts/audit-css.mjs frontend --tokens frontend/style.css` → số cỡ chữ, độ đậm, màu thô.
- Đọc code các vùng chính (layout, header, thành phần hay dùng) để biết cấu trúc DOM/class.
- Viết danh sách vấn đề theo 3 mức: **hỏng/khó dùng** (ưu tiên 1), **lệch hệ thống** (màu, chữ, bo góc,
  bóng không nhất quán), **thiếu chăm chút** (chi tiết nhỏ, chuyển động).
- Tìm "cơ hội UX" chứ không chỉ "lỗi đẹp": ví dụ agent bảo người dùng "bấm Dựng video" nhưng nút ở tab
  khác → đặt nút ngay trong chat. Loại cải tiến này thường giá trị hơn mọi chỉnh màu.

## 4. Tham chiếu — show, don't tell

- Tìm 1–12 site/app thật **cùng ngành** (Mobbin, Lapa Ninja, Awwwards, navbar.gallery, component.gallery,
  refero styles / awesome-design-md cho DESIGN.md mẫu). 5 site trên Mobbin có khi chỉ 1 site thực sự
  cùng ngành — chỉ giữ cái đó.
- Chụp từng **section**, không chụp cả trang: hero, danh sách, bảng giá, form, footer…
- Với mỗi tham chiếu hỏi "vì sao đẹp": bố cục? khoảng cách? chữ? cấu trúc? tương tác? Ghi lại.
- Nói thành lời khẩu vị theo 5 trục (Dickie Bush): **font · màu · texture** (góc, viền, bóng, nền) **·
  format** (bố cục) **· chú thích trang trí** — dạng "nhiều ___ hơn, ít ___ hơn".
- Trộn section từ nhiều nguồn được (hero của A, bảng giá của B), nhưng giữ một hệ token chung.
- Không copy toàn trang; không lấy logo/nội dung/nhân vật của tham chiếu.

## 5. Hệ thiết kế thành file

Viết trước khi code thành phần:
- `style.css` (hoặc `tokens.css`): mọi token màu/chữ/bo góc/bóng/chuyển động, sáng + tối.
- `DESIGN.md` (mẫu: `assets/DESIGN.md.template`) hoặc mục "Hệ thị giác" trong plan.md: token + **lý do**
  bằng lời + Do/Don't. Agent đọc file này trước mỗi lần build nên phong cách không trôi.
- Nếu đang ở dự án AffiVN: chép `assets/tokens-affivn.css` rồi chỉnh.

Chi tiết cách dựng token: 02-he-thiet-ke-token.md.

## 6. Plan theo phần

- Chia theo section (trang marketing) hoặc theo tab/vùng (app). Mỗi phần ghi: tham chiếu, nội dung,
  "người xem phải hiểu gì", trạng thái cần có, hành vi mobile.
- Ghi rõ **những gì giữ nguyên** (kiến trúc thông tin, API, tên class JS dùng, test đang có).
- Ghi **phân công theo file** nếu làm song song (mục 10).
- Plan ngắn gọn; để trong `plans/<ngày-giờ>-<slug>/plan.md` theo quy ước dự án.

## 7. Mockup trước khi code (khi dựng mới / đổi lớn)

- Nhờ công cụ sinh ảnh (image-gen) vẽ mockup từ brief + tham chiếu; hoặc chụp một trang tĩnh nhanh.
- Duyệt mockup như duyệt một trang người thật sẽ dùng: thông điệp rõ? bố cục dẫn mắt tới hành động?
  chữ đọc được? đúng thương hiệu? có mục chung chung/bịa cần bỏ?
- Sửa trên mockup rẻ hơn sửa trên code. Chốt mockup → build plan (section, thành phần tái dùng, tài sản,
  tương tác, trạng thái loading/lỗi, phương án mobile).

## 8. Build

Thứ tự tốt: **khung (layout shell) → token áp vào base → thành phần dùng chung → từng vùng → trạng thái →
chuyển động → chi tiết nhỏ**. Mỗi bước nhìn lại bằng mắt một lần.

- Giữ tên class mà JS dùng; nếu đổi markup, đổi ở hàm dựng DOM và giữ hành vi.
- Ưu tiên thành phần thật (thư viện/đã có trong repo) hơn tự vẽ; icon lấy từ bộ có sẵn, không tự vẽ SVG
  icon (trừ logo đơn giản).
- Nội dung/tài sản thật: ảnh sản phẩm thật hoặc sinh ảnh; không "screenshot giả bằng div", không số
  liệu/testimonial/giá bịa.
- Viết chú thích đầu file mô tả vùng đó làm gì (như các sheet của Studio).

## 9. Kiểm & sửa theo hàng rào

- Kiểm theo 10-kiem-tra.md (3 cỡ × 2 chế độ, trạng thái, console, audit, contrast, test, review).
- Chấm 1–10 theo: thứ bậc rõ · đọc được ở 360px · nhất quán · đúng thương hiệu · chăm chút. Sửa 3 lỗi
  tệ nhất, lặp tới khi mọi mục ≥8.
- **Hàng rào sửa:** "Một lượt sửa, chỉ phần <X>. <Một thay đổi>. Không đổi gì khác." Không có hàng rào,
  model hay làm lại cả trang và làm hỏng phần đã đúng.
- Lưu "taste file": những pattern đã được duyệt ghi vào DESIGN.md/memory để lần sau bắt đầu từ đó.

## 10. Làm việc song song với agent phụ

- Lead viết **nền móng trước**: token, font, thành phần dùng chung (nút, chip, player, empty state…).
  Agent phụ xây trên đó.
- **Quyền sở hữu file rõ ràng**: mỗi agent một nhóm file CSS/JS; file dùng chung chỉ lead sửa; agent cần
  gì ở file chung thì ghi vào báo cáo.
- Prompt cho agent phụ phải tự đủ: đường dẫn spec, danh sách token, file được sửa, file cấm sửa, hướng
  thiết kế cụ thể cho vùng đó (bố cục, trạng thái, responsive), yêu cầu báo cáo, và **không dùng
  trình duyệt/Playwright** (một trình duyệt dùng chung sẽ xung đột) — lead kiểm hình ảnh.
- Nhận báo cáo → chấp nhận/hủy các quyết định mở → gom yêu cầu cho file chung → lead sửa.
- Review code bằng agent độc lập (tìm race condition, a11y, regex chậm, dữ liệu thật). Sửa hết mức
  cao/vừa; ghi report.

## 11. Mẫu prompt (dùng cho chính mình hoặc giao agent)

**Research → báo cáo → chờ duyệt** (Prajwal Tomar):
```
Dùng <nguồn tham chiếu> nghiên cứu các <trang/app> thật cùng ngành trước khi sửa gì.
Viết báo cáo: (1) chỗ nào trên trang hiện tại trông chung chung/do AI làm, (2) mẫu lặp lại ở các
ví dụ mạnh, (3) hướng thị giác đề xuất (một câu), (4) danh sách mọi thay đổi + lý do.
Đừng build gì tới khi tôi duyệt báo cáo.
```

**Nói thành lời khẩu vị** (Dickie Bush):
```
Xem các ảnh tham chiếu này và mô tả khẩu vị của tôi theo 5 trục: font, màu, texture (góc, viền,
bóng, nền), format (bố cục), chú thích trang trí. Mỗi trục chỉ ra ví dụ cụ thể và gợi ý dạng
"nhiều ___ hơn, ít ___ hơn". Hỏi tôi xác nhận, đừng giả định tôi thích mọi thứ trong ảnh.
Sau đó viết brief ngắn với đề xuất cụ thể: tên font, mã màu, bề mặt, luật bố cục, luật chi tiết.
```

**3 hệ thiết kế để chọn**:
```
Từ brief đã duyệt, tạo 3 hệ thiết kế khác nhau rõ rệt, cùng một nội dung để so sánh.
Mỗi hệ: mẫu tiêu đề/thân kèm tên font; swatch màu kèm hex + công dụng; nút và thẻ (góc, viền,
bóng, nền); một hero + một section mẫu; cách xử lý nhãn/chú thích. Đặt tên ngắn cho mỗi hệ.
```

**Build theo mockup**:
```
Dựng mockup đã duyệt thành trang responsive. Giữ bố cục, khoảng cách, chữ, thứ bậc; dùng copy đã
duyệt; làm đủ tương tác đã thống nhất (hover, focus, loading, lỗi). Chỉ dùng token trong <file>.
Chỗ nào cần quyết định thiết kế mới thì hỏi, đừng tự đổi.
```

**Sửa có hàng rào**:
```
Một lượt sửa, chỉ phần <tên section>. <Một thay đổi cụ thể>. Không đổi gì khác.
```

**Tự kiểm**:
```
Chụp desktop 1440 + mobile 390, sáng + tối. Chấm 1–10: thứ bậc, đọc được ở 360px, nhất quán,
đúng thương hiệu, chăm chút. Liệt kê 3 lỗi tệ nhất, sửa, chụp lại, lặp tới khi mọi mục ≥ 8.
```

## 12. Bài học từ các ca thật

- **Studio 29/9:** chỉ đổi màu là chưa đủ; thứ người dùng thấy giá trị nhất là **nút bước tiếp theo
  ngay trong chat** + **đồng hồ khi agent chạy** + **nhãn bước tiếng Việt** — tức là UX, không phải
  màu.
- Test đầu tiên dùng định dạng lệnh tự bịa → qua hết, nhưng 8/24 bước thật sai. **Luôn test trên dữ
  liệu thật** (log, file của dự án).
- Agent phụ làm CSS rất tốt khi có token + spec; nhưng không thể thay việc lead nhìn bằng mắt.
- Review độc lập tìm ra lỗi nặng (dòng hành động biến mất khi người dùng chat tiếp, audio bị tắt giữa
  chừng) — những lỗi này không lộ ra khi chỉ chụp ảnh tĩnh.
- "One-shot" giao diện bằng AI là ảo tưởng: 70% đầu mất 30 giây, 30% cuối là toàn bộ công việc.
