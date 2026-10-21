/* ===== Trợ lý AI Tháp Chăm: Hỏi đáp + Thám tử sử liệu ===== */
(function () {
  const CFG = window.THAPCHAM_CONFIG || {};
  const API = (CFG.API_URL || '').trim();
  const headers = { 'Content-Type': 'application/json' };
  if (CFG.API_ANON_KEY) {
    headers.Authorization = 'Bearer ' + CFG.API_ANON_KEY;
    headers.apikey = CFG.API_ANON_KEY;
  }
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  let phien = store.get('tc_phien', '');
  if (!phien) { phien = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); store.set('tc_phien', phien); }
  let lop = store.get('tc_lop', '');
  let currentPart = '';
  const history = [];

  // ---------- Gọi máy chủ ----------
  async function call(payload) {
    const r = await fetch(API, { method: 'POST', headers, body: JSON.stringify(Object.assign({ lop: lop || 'Khách', phien }, payload)) });
    const data = await r.json();
    if (!data.ok) throw new Error(data.error || 'Lỗi không xác định');
    return data;
  }
  function log(su_kien, chi_tiet) {
    if (!API) return;
    try { fetch(API, { method: 'POST', headers, keepalive: true, body: JSON.stringify({ action: 'log', lop: lop || 'Khách', phien, su_kien, chi_tiet: chi_tiet || '' }) }).catch(() => {}); } catch (e) {}
  }

  // ---------- Giao diện ----------
  const wrap = document.createElement('div');
  wrap.innerHTML = `
  <button id="aiFab" title="Mở Trợ lý AI"><span class="spark">✦</span>Trợ lý AI</button>
  <section id="aiPanel" class="glass" aria-label="Trợ lý AI Tháp Chăm">
    <div class="aiHead">
      <div class="aiHeadRow">
        <div class="aiTitle"><div class="ico">✦</div><div><b>Trợ lý Tháp Chăm</b><small>Chỉ trả lời theo tư liệu bài học</small></div></div>
        <div style="display:flex;gap:8px;align-items:center">
          <label class="aiClass">Lớp <input id="aiLop" maxlength="12" placeholder="10A1"></label>
          <button id="aiClose" class="close" title="Đóng">×</button>
        </div>
      </div>
      <div class="aiTabs"><button data-tab="ask" class="active">💬 Hỏi đáp</button><button data-tab="det">🔍 Thám tử sử liệu</button></div>
    </div>
    <div class="aiBody">
      <div id="askPane" class="aiPane show">
        <div id="aiMsgs"></div>
        <div id="aiChips"></div>
        <div class="aiInput"><textarea id="aiQ" maxlength="400" placeholder="Hỏi về tháp Chăm, văn minh Champa…"></textarea><button id="aiSend" class="active" title="Gửi">➤</button></div>
        <div class="aiFoot">AI có thể sai. Mỗi câu trả lời đều ghi nguồn tư liệu để em kiểm chứng. Không nhập họ tên, số điện thoại hay thông tin cá nhân.</div>
      </div>
      <div id="detPane" class="aiPane"></div>
    </div>
  </section>`;
  document.getElementById('app').appendChild(wrap);

  const panel = $('#aiPanel'), msgs = $('#aiMsgs'), q = $('#aiQ'), lopInput = $('#aiLop');
  lopInput.value = lop;
  lopInput.addEventListener('change', () => { lop = lopInput.value.trim().toUpperCase().slice(0, 12); lopInput.value = lop; store.set('tc_lop', lop); });

  function openPanel(tab) {
    document.getElementById('info')?.classList.remove('show');
    panel.classList.add('show');
    if (tab) switchTab(tab);
    if (!lop) setTimeout(() => lopInput.focus(), 300);
  }
  $('#aiFab').onclick = () => { panel.classList.contains('show') ? panel.classList.remove('show') : openPanel(); };
  $('#aiClose').onclick = () => panel.classList.remove('show');
  function switchTab(t) {
    panel.querySelectorAll('.aiTabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === t));
    $('#askPane').classList.toggle('show', t === 'ask');
    $('#detPane').classList.toggle('show', t === 'det');
    if (t === 'det' && !det.started) det.render();
  }
  panel.querySelectorAll('.aiTabs button').forEach((b) => (b.onclick = () => switchTab(b.dataset.tab)));

  // ---------- Hỏi đáp ----------
  function md(s) {
    let h = esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    const lines = h.split(/\n/);
    let out = '', inList = false;
    for (const ln of lines) {
      const m = ln.match(/^\s*[-•*]\s+(.*)/);
      if (m) { if (!inList) { out += '<ul>'; inList = true; } out += '<li>' + m[1] + '</li>'; }
      else { if (inList) { out += '</ul>'; inList = false; } if (ln.trim()) out += ln + '<br>'; }
    }
    if (inList) out += '</ul>';
    return out.replace(/(<br>)+$/, '');
  }
  function addMsg(cls, html) {
    const d = document.createElement('div'); d.className = 'msg ' + cls; d.innerHTML = html; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
  }
  addMsg('bot', 'Xin chào! Mình là <b>Trợ lý Tháp Chăm</b>. Em có thể hỏi về kiến trúc, lịch sử tháp Chăm và văn minh Champa. Hãy click vào một bộ phận trên mô hình rồi hỏi mình về nó nhé.');
  if (!API) addMsg('sys', 'Trợ lý AI chưa được kết nối. Giáo viên cần dán link Apps Script vào file <b>config.js</b>. Phần Thám tử sử liệu vẫn dùng được.');

  const CHIPS_GENERAL = ['Tháp Chăm xây bằng vật liệu gì?', 'Kalan và Gopura khác nhau thế nào?', 'Vì sao gạch tháp Chăm dính chặt?', 'Mô hình 3D này giống tháp thật đến đâu?', 'Kể tên các tháp Chăm tiêu biểu'];
  const CHIPS_PART = (p) => [`${p} có đặc điểm gì?`, `${p} có vai trò gì trong kiến trúc?`, `So sánh ${p.toLowerCase()} trên mô hình với tháp thật`];
  function renderChips() {
    const list = currentPart ? CHIPS_PART(currentPart).concat(CHIPS_GENERAL.slice(0, 2)) : CHIPS_GENERAL;
    const c = $('#aiChips'); c.innerHTML = '';
    list.forEach((t) => { const b = document.createElement('button'); b.textContent = t; b.onclick = () => ask(t); c.appendChild(b); });
  }
  renderChips();

  let busy = false;
  async function ask(text) {
    text = (text || '').trim(); if (!text || busy) return;
    if (!API) { addMsg('user', esc(text)); addMsg('sys', 'Trợ lý AI chưa được kết nối (thiếu link trong config.js).'); return; }
    busy = true; q.value = '';
    addMsg('user', esc(text));
    const t = addMsg('bot', '<span class="typing"><i></i><i></i><i></i></span>');
    try {
      const r = await call({ action: 'chat', cau_hoi: text, bo_phan: currentPart, lich_su: history.slice(-6) });
      let h = '';
      if (!r.trong_tu_lieu) h += '<span class="outScope">NGOÀI TƯ LIỆU – CẦN KIỂM CHỨNG</span><br>';
      h += md(r.tra_loi);
      if (r.nguon && r.nguon.length) h += '<div class="srcRow">' + r.nguon.map((n) => `<span class="src" title="${esc(n.ten)}">📚 ${esc(n.id)} · ${esc(n.ten)}</span>`).join('') + '</div>';
      if (r.cau_hoi_goi_mo) h += `<div class="probe">🤔 ${esc(r.cau_hoi_goi_mo)}</div>`;
      t.innerHTML = h;
      history.push({ role: 'user', text }, { role: 'model', text: r.tra_loi });
    } catch (e) {
      t.className = 'msg sys'; console.warn('Trợ lý AI lỗi:', e.message); t.innerHTML = /quá nhanh|hơi nhanh|trống/.test(e.message) ? esc(e.message) : 'Trợ lý AI đang tạm bận, em thử lại sau ít phút nhé. Trong lúc chờ, em có thể chơi <b>Thám tử sử liệu</b>.';
    }
    msgs.scrollTop = msgs.scrollHeight; busy = false;
  }
  $('#aiSend').onclick = () => ask(q.value);
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(q.value); } });

  // ---------- Kết nối với mô hình 3D ----------
  const infoBody = document.querySelector('#info .infoBody');
  if (infoBody) {
    const btn = document.createElement('button'); btn.className = 'partAsk'; btn.id = 'partAsk'; btn.textContent = '✦ Hỏi Trợ lý AI về bộ phận này';
    btn.onclick = () => { openPanel('ask'); renderChips(); q.focus(); };
    infoBody.appendChild(btn);
  }
  if (typeof window.showInfo === 'function') {
    const orig = window.showInfo;
    window.showInfo = function (detail) {
      orig.apply(this, arguments);
      if (detail && detail.title) {
        currentPart = detail.title; renderChips();
        const b = document.getElementById('partAsk'); if (b) b.textContent = '✦ Hỏi Trợ lý AI về ' + detail.title.toLowerCase();
        log('chon_bo_phan', detail.title);
        if (panel.classList.contains('show')) panel.classList.remove('show');
      }
    };
  }
  document.getElementById('btnHistory')?.addEventListener('click', () => log('mo_tu_lieu', 'Lịch sử tháp'));
  document.getElementById('btnDiagram')?.addEventListener('click', () => log('mo_tu_lieu', 'Sơ đồ chi tiết'));
  log('mo_app', navigator.userAgent.includes('Mobi') ? 'điện thoại' : 'máy tính');


  // ---------- Phiếu khảo sát trước / sau (minh chứng tác động) ----------
  const SURVEY_Q = [
    'Em tự tin nhận biết được các bộ phận chính của một tháp Chăm.',
    'Khi AI đưa ra thông tin, em thường kiểm tra lại bằng tư liệu hoặc bằng chứng.',
    'Em thấy di sản tháp Chăm gần gũi và muốn tìm hiểu thêm.'
  ];
  const SURVEY_AFTER = 'App giúp em hiểu bài hơn so với chỉ đọc sách.';
  function survey(loai, done) {
    const p = $('#detPane'), qs = SURVEY_Q.concat(loai === 'sau' ? [SURVEY_AFTER] : []), ans = {};
    p.innerHTML = `<div class="detIntro"><b>${loai === 'truoc' ? '📝 Trước khi điều tra' : '📝 Sau khi điều tra'}</b><br>Chọn mức độ đồng ý: 1 = Hoàn toàn không đồng ý … 5 = Hoàn toàn đồng ý. Không cần ghi tên.</div>` +
      qs.map((t, i) => `<div class="svQ"><div>${i + 1}. ${esc(t)}</div><div class="svRow" data-i="${i}">${[1, 2, 3, 4, 5].map((v) => `<button data-v="${v}">${v}</button>`).join('')}</div></div>`).join('') +
      (loai === 'sau' ? `<div class="detLabel">Điều em học được về cách dùng AI khi học Lịch sử?</div><textarea id="svText" maxlength="300" style="width:100%;min-height:64px;border-radius:12px;border:1px solid rgba(104,246,255,.25);background:rgba(255,255,255,.04);color:var(--txt);padding:10px;font:inherit;font-size:12.5px"></textarea>` : '') +
      `<button id="svGo" class="active" style="height:44px" disabled>${loai === 'truoc' ? 'Bắt đầu điều tra' : 'Gửi phiếu'}</button>
       <button id="svSkip" style="height:34px;font-size:11px;opacity:.7">Bỏ qua</button>`;
    p.querySelectorAll('.svRow').forEach((row) => row.querySelectorAll('button').forEach((b) => (b.onclick = () => {
      ans[row.dataset.i] = +b.dataset.v; row.querySelectorAll('button').forEach((x) => x.classList.toggle('pick', x === b));
      $('#svGo').disabled = Object.keys(ans).length < qs.length;
    })));
    const finish = (sent) => { store.set('tc_ks_' + loai, sent ? '1' : 'skip'); done(); };
    $('#svSkip').onclick = () => finish(false);
    $('#svGo').onclick = () => {
      if (API) call({ action: 'survey', loai, c1: ans[0], c2: ans[1], c3: ans[2], c4: ans[3] || '', y_kien: ($('#svText') || {}).value || '' }).catch(() => {});
      finish(true);
    };
  }

  // ---------- Thám tử sử liệu ----------
  const CLAIMS = [
    { ma: 'N1', text: 'Tháp Chăm chủ yếu được xây bằng đá ong.', dung: false, giai: 'Sai. Tháp Chăm chủ yếu xây bằng gạch nung màu đỏ, mạch ghép rất khít; đá chỉ dùng ở một số chi tiết như ngưỡng cửa, bệ, tượng.', nguon: 'T5 – Tư liệu app: Đặc điểm kiến trúc', hint: 'Bật chế độ "Bản thật", phóng to thân tháp và quan sát bề mặt.' },
    { ma: 'N2', text: 'Thân tháp Chăm vươn cao và thu nhỏ dần khi lên cao.', dung: true, giai: 'Đúng. Thân tháp vươn cao, các tầng mái lùi dần vào trong và nhỏ dần lên phía chóp.', nguon: 'T5 – Tư liệu app: Đặc điểm kiến trúc', hint: 'Xoay mô hình nhìn ngang, so sánh chiều rộng phần đế, thân và mái.' },
    { ma: 'N3', text: 'Mô hình 3D trong app là bản sao chính xác của tháp Po Klong Garai.', dung: false, giai: 'Sai. Mô hình là tháp Chăm tổng hợp do AI dựng từ ảnh tham chiếu, đại diện cho phong cách chung, có thể có chi tiết chưa đúng với một tháp cụ thể.', nguon: 'T14 – Ghi chú mô hình', hint: 'Mở "Lịch sử tháp", đọc mục 6 – Ghi chú cho mô hình.' },
    { ma: 'N4', text: 'Tháp chính (kalan) thường chỉ có một cửa ra vào thật, các mặt còn lại là cửa giả.', dung: true, giai: 'Đúng. Cửa chính thường quay về hướng đông; ba mặt còn lại là cửa giả để cân đối và trang trí.', nguon: 'T6 – Tư liệu GV biên soạn', hint: 'Click vào cửa ở các mặt khác nhau. Mặt nào có cầu thang dẫn lên?' },
    { ma: 'N5', text: 'Tháp Chăm được xây dựng để làm nơi ở cho vua và hoàng tộc.', dung: false, giai: 'Sai. Tháp Chăm là kiến trúc tôn giáo, nơi thờ thần (Shiva, Vishnu, Po Nagar…) hoặc vua đã được thần thánh hóa; gian bên trong nhỏ, hẹp, tối – không phải nơi ở.', nguon: 'T4, T6', hint: 'Nhìn vào ô cửa chính: không gian bên trong rộng hay hẹp?' },
    { ma: 'N6', text: 'Cách người Chăm kết dính các viên gạch đã được khoa học giải thích hoàn toàn.', dung: false, giai: 'Sai. Đến nay vẫn còn nhiều giả thuyết (chất kết dính hữu cơ như nhựa dầu rái, mài gạch rồi nung kết…), chưa có kết luận thống nhất.', nguon: 'T7 – Kỹ thuật xây dựng', hint: 'Đọc mục 3 – Kỹ thuật xây dựng trong "Lịch sử tháp".' },
    { ma: 'N7', text: 'Thánh địa Mỹ Sơn được UNESCO công nhận là Di sản văn hóa thế giới.', dung: true, giai: 'Đúng. Năm 1999, Mỹ Sơn được UNESCO công nhận là Di sản văn hóa thế giới.', nguon: 'T11 – Di tích', hint: 'Tìm thông tin về Mỹ Sơn trong tư liệu hoặc hỏi Trợ lý AI.' },
    { ma: 'N8', text: 'Vòm cửa tháp Chăm có dạng bán nguyệt tròn giống cổng nhà thờ châu Âu.', dung: false, giai: 'Sai. Vòm cửa tháp Chăm thường nhọn, có hình lá đề/ngọn lửa nhiều lớp, mang ảnh hưởng nghệ thuật Ấn Độ.', nguon: 'T9, T10', hint: 'Click vào một cửa tháp và quan sát hình dáng phần vòm phía trên.' },
    { ma: 'N9', text: 'Kiến trúc và điêu khắc Chăm chịu ảnh hưởng của văn hóa Ấn Độ.', dung: true, giai: 'Đúng. Người Chăm theo Hindu giáo, Phật giáo; chữ viết dựa trên chữ Phạn; điêu khắc có Apsara, Garuda, Naga… nhưng vẫn mang phong cách riêng.', nguon: 'T2, T10', hint: 'Mở "Sơ đồ chi tiết" xem phần hoa văn trang trí.' },
    { ma: 'N10', text: 'Chóp tháp và mái tháp là cùng một bộ phận.', dung: false, giai: 'Sai. Mái là hệ nhiều tầng thu nhỏ dần phía trên thân; chóp là bộ phận cao nhất, đặt trên tầng mái trên cùng.', nguon: 'T9 – Các bộ phận', hint: 'Click vào chóp tháp rồi so sánh với các tầng mái bên dưới.' },
    { ma: 'N11', text: 'Gopura là tháp chính, nơi đặt tượng thần để thờ.', dung: false, giai: 'Sai. Tháp chính là Kalan; Gopura là tháp cổng dẫn vào khu thờ tự.', nguon: 'T8 – Các loại công trình', hint: 'Đọc mục 4 – Các loại công trình trong quần thể.' },
    { ma: 'N12', text: 'Mái tháp Chăm thường chia nhiều tầng, có các tháp góc nhỏ trang trí.', dung: true, giai: 'Đúng. Mái gồm nhiều tầng giật cấp thu nhỏ dần, mỗi tầng có các tháp góc nhỏ mô phỏng hình tháp chính.', nguon: 'T5, T9', hint: 'Xoay mô hình, đếm số tầng mái và quan sát các góc.' },
    { ma: 'A1', ai: true, text: 'Tháp chính (kalan) có cửa ra vào thật ở cả bốn mặt, giống như mô hình AI thể hiện.', dung: false, giai: 'Sai. Ở kalan thật, thường chỉ cửa chính (hướng đông) là cửa thật; ba mặt còn lại là cửa giả. Mô hình do AI dựng có thể thể hiện cửa giống nhau ở nhiều mặt – đó là chi tiết cần kiểm chứng, không nên tin ngay.', nguon: 'T6, T14', hint: 'Xoay mô hình xem các mặt, rồi đọc mục 6 – Ghi chú cho mô hình.' },
    { ma: 'A2', ai: true, text: 'Lớp rêu xanh trên mô hình là một phần trang trí do người Chăm thiết kế.', dung: false, giai: 'Sai. Rêu mọc do thời gian và độ ẩm, không phải thiết kế ban đầu. AI dựng mô hình từ ảnh di tích đã xuống cấp nên "học" luôn cả rêu – ví dụ cho thấy AI chép cả những gì không phải bản chất.', nguon: 'T5, T14', hint: 'So sánh màu gạch trên mô hình với mô tả "gạch nung màu đỏ" trong tư liệu.' },
    { ma: 'A3', ai: true, text: 'Mô hình do AI tạo từ ảnh thật thì luôn chính xác, vì AI đã "nhìn" thấy di tích.', dung: false, giai: 'Sai. AI tạo mô hình bằng cách đoán phần không thấy trong ảnh, nên có thể thêm, bớt hoặc làm sai chi tiết. Người học phải đối chiếu với tư liệu và ảnh di tích thật trước khi kết luận.', nguon: 'T14 – Ghi chú mô hình', hint: 'Tìm một chi tiết trên mô hình mà em nghi là AI làm chưa đúng.' },
    { ma: 'A4', ai: true, text: 'Trợ lý AI trong app đôi khi có thể trả lời sai, nên câu trả lời luôn kèm nguồn để em kiểm tra.', dung: true, giai: 'Đúng. Trợ lý chỉ được dùng bộ tư liệu của lớp và phải ghi nguồn; câu nào ngoài tư liệu sẽ được đánh dấu "cần kiểm chứng". Dù vậy AI vẫn có thể sai – nhà sử học luôn hỏi "bằng chứng nào?".', nguon: 'Nguyên tắc dùng AI có trách nhiệm', hint: 'Hỏi Trợ lý một câu rồi xem phần nguồn bên dưới câu trả lời.' }
  ];
  const ROUND = 6;
  const det = {
    started: false, list: [], i: 0, pick: null, score: 0, ev: 0,
    start() {
      if (!store.get('tc_ks_truoc', '')) return survey('truoc', () => this.start());
      this.started = true; this.i = 0; this.score = 0; this.ev = 0; this.pick = null;
      const mix = (a) => a.slice().sort(() => Math.random() - 0.5);
      const aiC = mix(CLAIMS.filter((c) => c.ai)).slice(0, 2), base = mix(CLAIMS.filter((c) => !c.ai)).slice(0, ROUND - 2);
      this.list = mix(aiC.concat(base));
      log('tham_tu_bat_dau', '');
      this.render();
    },
    render() {
      const p = $('#detPane');
      if (!this.started) {
        p.innerHTML = `<div class="detIntro"><b>🔍 Thám tử sử liệu</b><br>AI và tư liệu có thể đưa ra những nhận định <b>đúng hoặc sai</b>. Nhiệm vụ của em: chọn Đúng/Sai và <b>nêu bằng chứng</b> (từ tư liệu, sơ đồ hoặc quan sát trên mô hình 3D).<br><br>Mỗi lượt có ${ROUND} nhận định. ${API ? 'Trợ lý AI sẽ chấm phần bằng chứng của em (0–2 sao).' : ''}</div>
          <button id="detStart" class="active" style="height:46px">Bắt đầu điều tra</button>`;
        $('#detStart').onclick = () => this.start();
        return;
      }
      if (this.i >= this.list.length) {
        const pct = Math.round(this.score / this.list.length * 100);
        p.innerHTML = `<div class="detDone"><div class="big">${this.score}/${this.list.length}</div><div style="color:#bfe5ea;font-size:13px;margin-top:6px">nhận định được xác định đúng (${pct}%)</div>
          ${API ? `<div style="margin-top:10px;color:#ffd86b">Điểm bằng chứng: ${this.ev}/${this.list.length * 2} ★</div>` : ''}
          <p style="font-size:12px;color:#9fc5ca;line-height:1.6;margin-top:14px">Nhà sử học không tin ngay mọi thông tin, kể cả thông tin do AI đưa ra. Họ luôn hỏi: <b>“Bằng chứng nào cho nhận định đó?”</b></p></div>
          <button id="detAgain" class="active" style="height:44px">Chơi lượt mới</button>`;
        $('#detAgain').onclick = () => this.start();
        if (!store.get('tc_ks_sau', '')) { const b = document.createElement('button'); b.style.height = '40px'; b.textContent = '📝 Làm phiếu cảm nhận (1 phút)'; b.onclick = () => survey('sau', () => { this.started = true; this.render(); }); $('#detAgain').after(b); }
        log('tham_tu_ket_thuc', `${this.score}/${this.list.length}; bằng chứng ${this.ev}`);
        return;
      }
      const c = this.list[this.i];
      this.pick = null;
      p.innerHTML = `<div class="detTop"><span>Nhận định <b>${this.i + 1}</b>/${this.list.length}</span><span>Đúng: <b>${this.score}</b></span></div>
        <div class="claim"><span>NHẬN ĐỊNH CẦN KIỂM CHỨNG</span><p>“${esc(c.text)}”</p><div class="claimHint">💡 Gợi ý quan sát: ${esc(c.hint)}</div></div>
        <div class="tfRow"><button data-v="1">✔ Đúng</button><button data-v="0">✘ Sai</button></div>
        <div class="detLabel">Bằng chứng của em (dựa vào đâu?)</div>
        <textarea id="detEvidence" maxlength="500" placeholder="VD: Trên mô hình em thấy… / Theo tư liệu mục…"></textarea>
        <button id="detSubmit" disabled>Nộp nhận định</button>`;
      p.querySelectorAll('.tfRow button').forEach((b) => (b.onclick = () => {
        this.pick = b.dataset.v === '1';
        p.querySelectorAll('.tfRow button').forEach((x) => x.classList.toggle('pick', x === b));
        $('#detSubmit').disabled = false;
      }));
      $('#detSubmit').onclick = () => this.submit();
    },
    async submit() {
      const c = this.list[this.i], bc = $('#detEvidence').value.trim(), right = this.pick === c.dung;
      if (right) this.score++;
      const btn = $('#detSubmit'); btn.disabled = true; btn.textContent = API ? 'Trợ lý AI đang đọc bằng chứng…' : 'Đang chấm…';
      let aiHtml = '';
      if (API) {
        try {
          const r = await call({ action: 'judge', ma: c.ma, nhan_dinh: c.text, dap_an: c.dung, chon: this.pick, giai_thich: c.giai, bang_chung: bc });
          this.ev += r.diem;
          aiHtml = `<div class="ai"><b>Nhận xét bằng chứng</b> <span class="stars">${'★'.repeat(r.diem)}${'☆'.repeat(2 - r.diem)}</span><br>${esc(r.nhan_xet)}${r.goi_y ? '<br><i style="color:#bfe5ea">→ ' + esc(r.goi_y) + '</i>' : ''}</div>`;
        } catch (e) { console.warn('Chấm AI lỗi:', e.message); aiHtml = `<div class="ai" style="color:#d9c98c">Trợ lý AI đang tạm bận nên chưa chấm được bằng chứng. Em vẫn xem được đáp án ở trên.</div>`; }
      } else {
        log('tham_tu', `${c.ma}: ${right ? 'đúng' : 'sai'}`);
      }
      const v = document.createElement('div');
      v.className = 'verdict ' + (right ? 'ok' : 'no');
      v.innerHTML = `<h4>${right ? '✅ Chính xác!' : '❌ Chưa đúng'}</h4>${esc(c.giai)}<div class="srcRow"><span class="src">📚 ${esc(c.nguon)}</span></div>${aiHtml}`;
      btn.replaceWith(v);
      const next = document.createElement('button'); next.className = 'active'; next.style.height = '42px';
      next.textContent = this.i + 1 < this.list.length ? 'Nhận định tiếp theo →' : 'Xem kết quả';
      next.onclick = () => { this.i++; this.render(); $('#detPane').scrollTop = 0; };
      v.after(next); next.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };
  window.__thamTu = det;
})();
