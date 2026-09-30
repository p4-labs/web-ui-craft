# 07 — Giao diện "sống": polling, job nền, chat agent

UI cập nhật liên tục (poll 2–6s, job chạy nhiều phút, agent trả lời từng bước) có những lỗi mà ảnh chụp
tĩnh không bao giờ lộ: nhấp nháy, mất focus, audio đang phát bị tắt, nút nhảy trạng thái, dữ liệu dự án
cũ đè dự án mới. Các mẫu dưới đây đều lấy từ Studio (đã qua review độc lập).

Mục lục: 1. Vòng poll · 2. Vẽ lại theo chữ ký · 3. Render theo key · 4. Thứ tự phản hồi & đổi ngữ cảnh ·
5. Đồng hồ dùng chung · 6. Trạng thái "đang gửi" (pending) · 7. Vòng đời của một hàng hành động ·
8. Nhãn bước agent · 9. Thông báo & trình đọc màn hình · 10. inert & chuyển focus · 11. Checklist review

---

## 1. Vòng poll

```js
// poller.js — bỏ qua khi tab ẩn; đọc lại độ trễ mỗi vòng (nhanh khi đang có việc)
export function startPoller(fn, getDelayMs, { immediate = true } = {}) {
  let stopped = false, timer = null;
  async function tick() {
    if (stopped) return;
    if (!document.hidden) { try { await fn(); } catch (err) { console.error('poller tick failed', err); } }
    if (stopped) return;
    timer = setTimeout(tick, getDelayMs());
  }
  if (immediate) tick(); else timer = setTimeout(tick, getDelayMs());
  return () => { stopped = true; if (timer) clearTimeout(timer); };
}
// dùng: startPoller(refresh, () => (runningJob() ? 2500 : 4000));
```
- `setTimeout` nối tiếp (không `setInterval`) → không chồng request khi mạng chậm.
- Nhịp thích ứng: 2.5s khi có job chạy, 4–6s khi rảnh.
- Lỗi lặp chỉ toast **một lần** (`failing` flag), tới khi hồi phục.
- Khi job vừa chuyển từ running → xong, **gọi lại danh sách file** (job có thể ghi output sau lần đọc
  file đầu).

## 2. Vẽ lại theo chữ ký (patchSection)

Không vẽ lại khi dữ liệu không đổi — nếu không mỗi 4s DOM bị thay → nhấp nháy, mất hover, mất focus,
animation chạy lại.
```js
export function patchSection(sec, model, build) {
  const sig = model ? JSON.stringify(model) : '';
  if (sec.dataset.sig === sig) return false;          // không đổi → không chạm DOM
  const active = document.activeElement;
  const hadFocus = sec.contains(active);
  const focusKey = hadFocus ? active.closest('[data-fk]')?.dataset.fk : null;
  sec.dataset.sig = sig;
  sec.replaceChildren(...(model ? [build(model)].flat().filter(Boolean) : []));
  if (hadFocus) {                                     // trả focus về đúng điều khiển (data-fk)
    const keyed = focusKey ? sec.querySelector(`[data-fk="${CSS.escape(focusKey)}"]`) : null;
    (keyed || sec.querySelector('button, [href], input, select, textarea'))?.focus({ preventScroll: true });
  }
  return true;
}
```
- **Model chỉ chứa thứ hiển thị**, đã làm tròn: `mtime: Math.round(f.mtime)`; không để đồng hồ đang đếm
  trong model (xem mục 5) — nếu không chữ ký đổi mỗi giây.
- Mỗi nút quan trọng có `data-fk` ổn định để focus quay về đúng chỗ.

## 3. Render theo key (giữ node sống)

Danh sách có `<audio>/<video>` đang phát, ô đang hover, menu đang mở → không được thay node.
```js
export function keyedChildren(container, items, keyOf, build) {
  // cache: Map(key → node) theo container; chỉ tạo/di chuyển/xoá node khi key đổi
  … (xem Studio dom-patch-helpers.js)
}
```
- Node mới tạo → gắn `.is-new` (animation vào) — trừ lần render đầu.
- Cập nhật nội dung nhỏ trong node cũ (giờ, kích thước) bằng `textContent` khi khác, không build lại.
- Form bị build lại: chụp focus + vùng chọn trước, khôi phục sau (`snapshotFocus`).

## 4. Thứ tự phản hồi & đổi ngữ cảnh

Hai lỗi kinh điển: (a) phản hồi poll cũ về **sau** phản hồi mới và đè lên; (b) người dùng đổi dự án
trong lúc request của dự án cũ đang bay → dữ liệu cũ vẽ lên dự án mới.
```js
let generation = 0;   // tăng mỗi lần đổi dự án
let requestSeq = 0, appliedSeq = 0;

async function refresh() {
  const id = state.id, gen = generation, seq = ++requestSeq;
  const stale = () => gen !== generation || seq < appliedSeq;
  const [files, jobs] = await Promise.all([listFiles(id), listJobs(id)]);
  if (stale()) return;                // bỏ phản hồi cũ / của dự án khác
  appliedSeq = seq;
  …
}
```
- **Chụp id trước mọi `await`** trong handler: `const projectId = state.id; await saveDialog(); runJob(kind,
  input, { projectId })` → nếu người dùng đã đổi dự án trong lúc dialog mở, huỷ thay vì chạy job trên
  dự án mới.
- Sau mỗi `await`, kiểm lại `if (state.id !== id) return`.
- Timer (fresh highlight, toast trễ) cũng kiểm `generation` trước khi chạy.

## 5. Đồng hồ dùng chung

Mọi đồng hồ đang chạy (`0:42`) dùng **một** `setInterval` 1s, cập nhật `textContent` trực tiếp — không
đi qua model/patchSection (nếu không chữ ký đổi mỗi giây → cả vùng build lại mỗi giây).
```js
// live-clock.js
let timer = null;
function tick() {
  const clocks = document.querySelectorAll('[data-since]');
  if (!clocks.length) { clearInterval(timer); timer = null; return; }   // tự dừng khi hết đồng hồ
  if (document.hidden) return;
  for (const node of clocks) {
    const text = elapsedSince(node.dataset.since);
    if (node.textContent !== text) node.textContent = text;
  }
}
export function ensureLiveClock() { tick(); if (!timer && document.querySelector('[data-since]')) timer = setInterval(tick, 1000); }
```
HTML: `<span class="clock" aria-hidden="true" data-since="2026-09-29T14:02:11Z">0:00</span>` + gọi
`ensureLiveClock()` sau khi render. `tabular-nums` để số không nhảy.

## 6. Trạng thái "đang gửi" (pending)

Bấm "Dựng video" → request bay 300ms–2s → nếu nút trở lại "sẵn sàng" trước khi poll thấy job mới, người
dùng bấm lần hai (409) và nút nhấp nháy sẵn sàng → chạy.
```js
export async function runJob(kind, input, { projectId = state.id } = {}) {
  const id = state.id;
  if (!id || id !== projectId || state.pending) return false;
  state.pending = { kind, input, at: new Date().toISOString() };   // nút → "đang chạy" ngay
  emit();
  let ok = false;
  try { const res = await createJob(id, kind, input); ok = true; /* toast "Đã bắt đầu…" */ }
  catch (err) { toastError(err, 'Không tạo được tiến trình.'); }
  if (state.id !== id) return ok;
  if (ok) await refresh();              // giữ pending tới khi danh sách job có job mới
  if (state.id === id) { state.pending = null; emit(); }
  return ok;
}
```
- Pending mang `at` → đồng hồ bắt đầu đếm ngay từ lúc bấm.
- Mọi nút job khác bị chặn khi có pending/running, **có lý do** (`jobBlockReason()` → `title`).

## 7. Vòng đời của một hàng hành động (next step)

Hàng "Bước tiếp theo" dưới chat (03 mục 14). Luật đã chốt sau review:
- **Chỉ đi theo tin khép lại cuộc trò chuyện**: tin cuối là của agent và agent đã xong lượt. Agent đang
  chạy → ẩn lời mời.
- Lời mời lấy từ `askedForAll(text)` (09 mục regex) — chọn yêu cầu **cuối cùng có đầu vào sẵn sàng**
  ("bấm Nghe thử… rồi bấm Dựng video" khi chưa có plan → vẫn mời nghe thử).
- **Ghim khi job đã chạy:** `pinned = {kind, at}` — hàng sống qua các lượt chat mới (người dùng chat
  trong lúc render, hoặc góp ý khi đang nghe thử) cho tới khi một lời mời mới thay thế hoặc đổi dự án.
  Lỗi thật đã gặp: không ghim → người dùng gửi tin, hàng biến mất, audio đang phát bị tắt.
- **"Xong" đọc từ job** (status + `ended_at ≥ at`), file output (mtime ≥ at) chỉ là dự phòng khi server
  không còn liệt kê job. Không đọc "xong" chỉ từ mtime — file cũ của lần trước sẽ báo xong sai.
- Lời mời mới đến khi job cũ còn chạy → hàng giữ job đang chạy; lời mời mới đợi.
- Trạng thái: `ready → running (pending/job) → done | failed` — mỗi trạng thái một bố cục, patchSection
  theo model `{kind, at, state, since, stage, path, mtime, blocked}`.

**"Vừa xong" chỉ khi thật sự vừa xong.** Hiệu ứng mừng (chấm bước tiến độ nảy + tick tự vẽ) cần biết
trạng thái trước: giữ `prevStates` (id → state) của lần vẽ trước, `null` ngay sau khi đổi dự án (lần vẽ
đầu không mừng gì), và một **cửa sổ lắng ~2s** sau khi mở dự án — dữ liệu phụ (cấu hình, trạng thái
phim) về trễ có thể lật một bước sang "xong" mà người dùng chưa làm gì.

## 8. Nhãn bước agent (dịch lệnh thành tiếng người)

Agent Codex/DeepSeek phát sự kiện công cụ dạng lệnh thô:
`$ "C:\…\powershell.exe" -Command '$p='"'script.md'; "'$s=Get-Content …'`. Hiển thị nguyên văn = rác.
- **Bỏ vỏ shell** trước: Codex bọc `-Command` theo kiểu POSIX (đoạn `'…'` dán với `"…"`) → hàm
  `unshellQuote` (lấy nguyên đoạn `'…'`, bỏ ngoặc `"…"` và các escape `\" \\ \$ \``).
- **Nhận dạng ý định** bằng regex có thứ tự ưu tiên: ghi (Set-Content/Out-File) → chép/chuyển → xoá →
  đọc (Get-Content) → xem thư mục → tìm (rg/Select-String) → chạy python -m / script → tải web.
  Giải biến `$p='script.md'` để ra tên file thật.
- **Rút gọn đường dẫn**: file trong dự án → đường dẫn tương đối (`audio/script.mp3`); ngoài dự án → 2 đoạn
  cuối (`viet-bai/SKILL.md`); bỏ đoạn `.` (`.\dung-plan.py` → `dung-plan.py`).
- Nhiều đích: "Đọc script.md và 2 file khác".
- Giữ lệnh gốc trong `title` + dòng mờ thứ hai (dòng "đáng xem" nhất: với here-string là dòng
  Set-Content) — nhãn được phép đơn giản hoá vì chỉ để hiển thị.
- **Test trên log thật** (lấy từ chat.jsonl của dự án): test đầu tiên dùng định dạng tự bịa, qua hết,
  nhưng 8/24 bước thật ra nhãn sai.

## 9. Thông báo & trình đọc màn hình

- Vùng trạng thái thay đổi: `role="status"` (lịch sự) — đọc **một lần** khi nội dung đổi.
- **Đồng hồ trong vùng live phải `aria-hidden="true"`** — nếu không trình đọc màn hình đọc "một phút
  hai mươi ba giây" mỗi giây.
- Toast: container `aria-live="polite"`; lỗi quan trọng `role="alert"`.
- Copy/lưu thành công: thông báo qua một vùng `.sr-only` `role="status"` ("Đã chép") — **vùng riêng**,
  tạo sẵn lúc tải trang, không dùng chung với vùng đọc nội dung (câu trả lời của agent): ghi đè vùng
  chung sẽ cắt ngang câu đang đọc. Xoá rỗng rồi đặt chữ ở frame sau để lần chép thứ hai vẫn được đọc.
- Nút bận: `aria-busy="true"`; nút bị chặn: `aria-disabled="true"` + lý do trong `title`/
  `aria-describedby`.
- Tin nhắn agent mới: không đọc cả tin dài; thông báo ngắn "Agent đã trả lời" nếu người dùng đang ở tab
  khác.

## 10. inert & chuyển focus

- Phần bị che/ẩn nhưng vẫn trong DOM (sidebar thu gọn, nội dung sau ngăn kéo mobile) → `el.inert = true`:
  không Tab vào, không click, trình đọc màn hình bỏ qua.
- **Trước khi đặt inert, chuyển focus ra ngoài** nếu focus đang ở trong — nếu không focus rơi về `<body>`:
  ```js
  if (hide && panel.contains(document.activeElement)) toggle.focus({ preventScroll: true });
  panel.inert = hide;
  ```
- Mở ngăn kéo: focus vào nút đóng (trong `requestAnimationFrame`, sau khi hiện); đóng: trả focus về nút mở.
- Esc đóng ngăn kéo — trừ khi đang có `dialog[open]` (Esc thuộc về dialog).
- Đổi breakpoint khi ngăn kéo đang mở → đóng và áp lại trạng thái desktop.

## 11. Checklist review cho UI sống

- [ ] Poll không chồng request; nhịp thích ứng; dừng khi tab ẩn; lỗi toast một lần
- [ ] Vẽ lại chỉ khi chữ ký đổi; model không chứa giá trị đổi mỗi giây
- [ ] Media đang phát, hover, focus, vùng chọn sống qua mỗi lần poll
- [ ] Phản hồi cũ/của dự án khác bị bỏ (generation + seq); id chụp trước `await`
- [ ] Pending giữ tới khi danh sách job có job mới; không double-submit
- [ ] "Xong" đọc từ trạng thái job, không chỉ từ mtime
- [ ] Đồng hồ: một interval, aria-hidden trong vùng live, tự dừng
- [ ] inert + chuyển focus trước khi ẩn
- [ ] Animation vào chỉ cho node mới, không cho lần render đầu; class một lần được gỡ khi
      `animationend` (tab ẩn/hiện lại không phát lại hiệu ứng)
- [ ] Vùng live cho phản hồi UI tách khỏi vùng đọc nội dung
- [ ] Test logic thuần (nhãn, regex, trạng thái) bằng dữ liệu thật; review độc lập tìm race condition
