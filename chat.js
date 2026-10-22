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
    const r = await fetch(API, { method: 'POST', headers, signal: AbortSignal.timeout(55000), body: JSON.stringify(Object.assign({ lop: lop || 'Khách', phien }, payload)) });
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
      if (r.nguon && r.nguon.length) h += '<div class="srcRow">' + r.nguon.map((n) => `<button class="src" data-source="${esc(n.id)}" title="Mở tư liệu">📚 ${esc(n.id)} · ${esc(n.ten)}</button>`).join('') + '</div>';
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

  msgs.addEventListener('click', async e => {
    const b=e.target.closest('[data-source]'); if(!b)return;
    try {const r=await call({action:'resources'});const src=r.sources.find(s=>s.id===b.dataset.source);if(src)addMsg('bot','<b>'+esc(src.id)+' · '+esc(src.nguon)+'</b><p>'+esc(src.noidung)+'</p><small>Tư liệu tổng hợp hiện có; đối chiếu nguồn gốc cùng giáo viên.</small>');}
    catch {addMsg('sys','Chưa mở được tư liệu. Em thử lại sau nhé.');}
  });
  // ---------- Thám tử sử liệu ----------
  const det = {started:false, render(){
    $('#detPane').innerHTML='<div class="detIntro"><b>Thám tử sử liệu • Phòng học mới</b><p>Ba nhiệm vụ: quan sát, kiểm chứng và lập luận. Nhận phản hồi AI theo ba tiêu chí, sửa bài và theo dõi tiến bộ.</p><p>Mô hình là học liệu tổng hợp do AI tạo, không phải bản sao chính xác của một di tích.</p><a href="hoc-tap.html" style="display:block;padding:14px;background:#ffd86b;color:#143b42;border-radius:12px;text-align:center;font-weight:bold">Vào phòng học →</a></div>';
  },start(){location.href='hoc-tap.html';}};
  window.__thamTu = det;
})();
