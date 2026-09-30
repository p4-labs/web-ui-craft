---
name: web-ui-craft
description: >-
  Craft beautiful, non-generic web UIs end to end — process (references → design-system file →
  mockup → build → screenshot QA), design tokens (AffiVN preset included), layout & components,
  motion and micro-interactions with exact timings, micro-detail polish, the anti-"AI slop"
  blacklist, live/polling-UI JavaScript patterns, accessibility & performance, Vietnamese-text
  specifics, plus CSS-audit, contrast, spring-easing and screenshot-matrix scripts. Use this skill whenever the user
  wants to build, redesign, restyle, polish, animate or review any web page, app screen, dashboard,
  landing page, component or stylesheet — including Vietnamese requests such as "làm giao diện",
  "thiết kế lại trang", "cải thiện trang này", "làm đẹp hơn", "CSS lại", "animation cho nút",
  "hiệu ứng", "chi tiết nhỏ", "trông như AI làm", "landing page", "dashboard" — even when the user
  never says "design system" or names this skill.
---

# web-ui-craft — làm giao diện web đẹp, có chủ đích, không "AI slop"

Skill này gom mọi thứ đã học được khi: (1) tổng hợp quy tắc thiết kế từ cộng đồng (Shann Holmberg,
Meng To, taste-skill, Impeccable, Hallmark, Anthropic frontend-design, Jakub Krehel, Emil Kowalski,
Rauno, Google DESIGN.md, số liệu 15 site SaaS thật) và (2) làm lại toàn bộ Studio (127.0.0.1:8789)
theo hệ thiết kế AffiVN. Mọi con số ở đây đều đã dùng hoặc đã kiểm chứng.

Ý tưởng lõi: **giao diện đẹp = quyết định có lý do + ít biến thể + chi tiết được chăm + kiểm bằng mắt.**
Model mặc định sinh ra "trung bình của mọi website" (chữ giữa, gradient tím, 3 thẻ đều, fade-in khắp
nơi). Việc của skill là thay mặc định đó bằng: tham chiếu thật, hệ token chặt, chuyển động có mục
đích, và vòng kiểm tra.

## Khi nào đọc file nào

| Việc đang làm | Đọc |
|---|---|
| Bắt đầu một trang/app mới, hoặc "làm lại giao diện" | `references/01-quy-trinh.md` (bắt buộc), rồi 02 + 03 |
| Chọn màu, font, cỡ chữ, bo góc, bóng, dark mode, viết DESIGN.md | `references/02-he-thiet-ke-token.md` + `assets/tokens-affivn.css` + `assets/DESIGN.md.template` |
| Dựng bố cục, header, tab, form, thẻ, dialog, chat, landing hero | `references/03-bo-cuc-thanh-phan.md` |
| Animation, hover, nhấn nút, mở/đóng, chuyển tab, toast, skeleton | `references/04-chuyen-dong.md` + `assets/motion.css` + `scripts/spring-easing.mjs` |
| "Làm đẹp từng chi tiết nhỏ" (polish) | `references/05-chi-tiet-nho.md` |
| Soát xem có "trông như AI làm" không; viết copy | `references/06-chong-ai-slop.md` |
| UI cập nhật liên tục (polling, chat agent, job chạy nền, đồng hồ) | `references/07-giao-dien-song.md` |
| Trợ năng, bàn phím, trình đọc màn hình, hiệu năng, font | `references/08-truy-cap-hieu-nang.md` |
| Chữ tiếng Việt: font, dấu, regex, IME, số/ngày | `references/09-tieng-viet.md` |
| Kiểm tra trước khi báo xong (screenshot, script, review) | `references/10-kiem-tra.md` |

Đọc theo nhu cầu, không cần đọc hết một lúc. Khi nhiệm vụ lớn (làm lại cả app), đọc 01 → 02 → 03 →
04 → 05 theo thứ tự, và 10 trước khi báo xong.

## Quy trình rút gọn (chi tiết: 01-quy-trinh.md)

1. **Hiểu brief** — cho ai, dùng để làm gì, cảm giác gì. Tóm lại một dòng: "Đọc là: <loại trang> cho
   <người dùng>, giọng <tính cách>, nghiêng về <hệ thiết kế>". Mơ hồ thì hỏi đúng MỘT câu.
2. **Tìm nguồn sự thật trước khi tự sáng tác** — thương hiệu đã có token/DESIGN.md chưa (AffiVN:
   `D:\AI\shoppe\packages\design\tokens.ts`)? Người dùng từng chọn gì (memory)? Có ảnh tham chiếu?
   Lý do: tự nghĩ màu là con đường ngắn nhất tới "trung bình của mọi website"; lần làm Studio, chỉ
   cần đọc tokens.ts là phát hiện bảng màu tím đang dùng bị chính thương hiệu cấm.
3. **Soát hiện trạng** (nếu sửa trang có sẵn) — chụp 1440 / 1024 / 390, sáng + tối, và các trạng thái
   khó thấy (đang tải, rỗng, lỗi, đang chạy). Đếm cỡ chữ, độ đậm, màu thô trong CSS
   (`node scripts/audit-css.mjs <thư mục css>`). Viết danh sách vấn đề theo mức độ.
4. **Viết hệ token + spec thành FILE** (style.css tokens + DESIGN.md hoặc plan.md) trước khi code
   thành phần. Mọi file khác chỉ được dùng token.
5. **Plan theo section/tab**, mỗi phần có tham chiếu + "người xem phải hiểu gì". Chia việc song song
   theo quyền sở hữu file (mỗi agent một nhóm file; file dùng chung chỉ một người sửa).
6. **Build từng phần nhỏ**: khung → thành phần → trạng thái → chuyển động → chi tiết nhỏ.
7. **Kiểm bằng mắt + máy** (10-kiem-tra.md): screenshot 3 cỡ × 2 chế độ, giả lập trạng thái, không
   cuộn ngang, console sạch, audit CSS, contrast, test logic trên dữ liệu THẬT, review code.
8. **Sửa theo "hàng rào"**: mỗi lượt chỉ một phần, ghi rõ "không đổi gì khác".

## 16 luật vàng

1. **Tham chiếu thật > mô tả.** Gọi tên phong cách, đưa ảnh/URL; không có tham chiếu thì model rơi về
   mặc định. Lấy "ngữ pháp" (nhịp, tỉ lệ, cách xếp), không lấy nội dung/logo.
2. **Hệ thiết kế là một file** agent đọc trước mỗi lần build (token + lý do bằng lời).
3. **Một màu nhấn.** Chiếm ≲5% diện tích, dành cho hành động chính, focus, trạng thái chọn. Màu đặc biệt
   khác (vàng, đỏ…) mỗi màu gắn đúng MỘT nghĩa (AffiVN: vàng = video đã dựng xong).
4. **Ít bậc chữ:** app ~6 cỡ, 3 độ đậm (400 thân, 500 nhãn/nút, 600 tiêu đề + strong). 18 cỡ lộn xộn
   là lý do phổ biến nhất khiến giao diện "rối mà không biết vì sao".
5. **Token theo vai trò** (`--bg --surface --text-2 --accent`…), không theo tên màu; không mã màu thô
   ngoài file token. Đổi thương hiệu = sửa một file.
6. **Mặt phẳng + hairline trước bóng đổ.** Không thẻ lồng thẻ, không viền dày một bên, không kính mờ
   khắp nơi. Bóng chỉ cho thứ đang nổi (menu, dialog, composer).
7. **Bo góc có thang và đồng tâm:** pill cho nút/chip/tab, 12 cho input/hàng, 16 cho thẻ, 20 cho
   dialog; khung ngoài = khung trong + padding.
8. **Hero/đầu trang:** tiêu đề ≤2 dòng, mô tả ≤20 từ, CTA thấy ngay; mỗi kiểu bố cục dùng tối đa một
   lần/trang; không "tiêu đề giữa + 3 thẻ đều".
9. **Chuyển động có nghĩa:** 120–200ms cho tương tác, ease-out mạnh, chỉ transform/opacity, không
   bounce, không animate thao tác lặp/bàn phím, luôn có `prefers-reduced-motion`.
10. **Phản hồi ngay tại chỗ bấm:** copy → icon thành dấu tick; nút bận → spinner trong nút; bước tiếp
    theo → nút ngay dưới lời mời (đừng bắt người dùng đổi tab tìm nút).
11. **Trạng thái đầy đủ:** default, hover, focus-visible, active, disabled, loading, empty, error,
    success. Disabled là nền đục, không phải màu nhấn mờ.
12. **Copy cụ thể:** động từ thật, số thật, một tên cho một hành động xuyên suốt; bỏ nhãn trang trí,
    eyebrow khắp nơi, chú thích xám thừa.
13. **Tiếng Việt là công dân hạng nhất:** font có dấu tốt (Be Vietnam Pro), line-height ≥1.5, regex
    dùng ranh giới Unicode (không `\b`), chặn Enter khi IME đang gõ.
14. **UI sống không được giật:** chỉ vẽ lại khi dữ liệu đổi (chữ ký), đồng hồ tách riêng, giữ
    "pending" tới khi dữ liệu mới về, chụp id trước mỗi `await`.
15. **Đẹp ≠ dùng được.** Mỗi màn hình phải trả lời: người dùng cần bấm gì tiếp theo, và nó có nằm
    đúng chỗ họ đang nhìn không.
16. **Kiềm chế cho app, cá tính cho trang giới thiệu.** Luật 3–7 giữ app yên và nhất quán, nhưng một
    landing chỉ "đúng hệ" thì dễ nhạt. Mỗi trang giới thiệu cần **một ý tưởng đặc trưng** rút từ vật thật
    của sản phẩm (phiếu hoàn tiền in ra, vé, biên lai, tấm voucher có khía…) và dám làm nó thật kỹ — vẫn
    trong token của thương hiệu. Đánh giá 30/9: bản không skill thắng về độ "có hồn" ở landing nhờ đúng
    một ý tưởng như vậy, trong khi bản theo skill sạch nhưng giản dị.

## Checklist trước khi báo xong (bản đầy đủ: 10-kiem-tra.md)

- [ ] Chụp 1440×900, 1024×768, 390×844 — sáng + tối (`scripts/screenshot-matrix.mjs`) — rồi MỞ XEM từng
      ảnh: không cuộn ngang, không chữ/dấu bị cắt, dark mode không sót mảng trắng.
- [ ] Trạng thái rỗng / đang tải / lỗi / đang chạy / xong đều đã nhìn tận mắt (giả lập nếu cần).
- [ ] `node scripts/audit-css.mjs <css-dir> --tokens <file-token>` không còn lỗi (màu thô, cỡ chữ lạ,
      `transition: all`, animate width/height…).
- [ ] Cặp chữ/nền chính đạt WCAG AA (`node scripts/contrast.mjs <fg> <bg>`): thân ≥4.5, chữ lớn ≥3.
- [ ] Console không lỗi/cảnh báo; bàn phím đi hết được; focus thấy rõ; reduced-motion đã thử.
- [ ] Logic mới có test chạy trên dữ liệu thật (không bịa định dạng).
- [ ] Đối chiếu blacklist ở 06-chong-ai-slop.md.
- [ ] Ghi lại quyết định + chỗ còn mở trong plan/report; hỏi người dùng những điểm thuộc về gu.

## Công cụ đi kèm

| File | Dùng khi |
|---|---|
| `assets/tokens-affivn.css` | Khởi tạo token + base + nút cho dự án thương hiệu AffiVN (sáng + tối) |
| `assets/motion.css` | Token chuyển động + công thức copy-paste (nhấn, dialog vào/ra, details mở mượt, icon swap, tick tự vẽ, tab trượt, toast, skeleton, reveal khi cuộn) |
| `assets/DESIGN.md.template` | Viết hệ thiết kế thành file cho agent đọc (định dạng Google DESIGN.md) |
| `scripts/audit-css.mjs` | Soát CSS: màu thô, cỡ/độ đậm ngoài thang, `transition: all`, animate thuộc tính layout, thiếu/sót reduced-motion, `!important`, z-index, gradient, blur, outline:none, 100vh. Tự đoán file token nếu không truyền `--tokens`. Trường hợp cố ý: `/* audit-ok: <id> */` |
| `scripts/contrast.mjs` | Tỉ lệ tương phản WCAG cho cặp màu, hoặc cho cặp token đọc từ file CSS (`--scheme dark` đọc khối dark) |
| `scripts/spring-easing.mjs` | Sinh `linear()` easing kiểu spring (preset no-bounce / snappy / gentle / bouncy) + thời lượng, % vượt |
| `scripts/screenshot-matrix.mjs` | Chụp mọi URL × cỡ × sáng/tối bằng Playwright + Chrome có sẵn; báo cuộn ngang, lỗi console, request hỏng |

Chạy bằng Node 18+, không cần cài gói (riêng screenshot cần Playwright có trong máy — ví dụ
`--playwright D:\AI\youtube\studio\engine\lemo-opuscar`): `node ~/.claude/skills/web-ui-craft/scripts/<tên>.mjs --help`.
Chạy thật trên Studio 30/9: audit tìm 28 lỗi (overlay `rgba()` thô, cỡ `em` trong markdown-prose) và contrast
bắt placeholder 3.43:1 — thứ mắt người bỏ qua; sửa xong còn 0 lỗi, số cỡ chữ 15 → 9.

## Khi làm việc với agent phụ

- Viết spec + token trước, giao theo **quyền sở hữu file**; file dùng chung (token, atom) chỉ lead sửa.
- Agent phụ không dùng chung trình duyệt (xung đột) → lead làm toàn bộ QA hình ảnh.
- Yêu cầu mỗi agent trả báo cáo: đã đổi gì, class thêm/đổi tên, cần gì ở file dùng chung, câu hỏi mở.
- Review code bằng agent độc lập, chạy trên dữ liệu thật; agent code-reviewer có thể không ghi được
  file — dán kết quả của nó vào report. Lần review Studio 30/9 bắt 1 lỗi cao + 2 vừa mà ảnh chụp không
  lộ (chỉ báo tab lệch khi có badge, hiệu ứng phát lại khi quay lại tab, tick biến mất ở reduced-motion).
- **Vòng kiểm tra tương xứng với việc:** đầy đủ (ma trận ảnh, audit, review độc lập) cho việc lớn hoặc
  có logic sống (poll, job, race); trang tĩnh nhỏ thì tự soát checklist là đủ. Đánh giá 30/9: vòng đầy
  đủ làm tốn thêm ~50% token và thời gian.
