(()=>{'use strict';
const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cfg=window.THAPCHAM_CONFIG||{},headers={'Content-Type':'application/json',Authorization:'Bearer '+cfg.API_ANON_KEY,apikey:cfg.API_ANON_KEY};
const storage={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}},remove(k){try{localStorage.removeItem(k)}catch{}}};

const ANSWER_OPTIONS = {
  Q1: ['Mái nằm phía trên thân, chóp là phần cao nhất', 'Mái và chóp giống hệt nhau, không phân biệt được', 'Chóp nằm dưới mái'],
  Q3: ['Đúng', 'Sai', 'Chưa đủ căn cứ'],
  Q5: ['Sai – người Chăm tiếp nhận và biến đổi ảnh hưởng Ấn Độ, không chỉ sao chép', 'Đúng – tháp Chăm chỉ là bản sao đền Ấn Độ', 'Không thể biết vì không có tư liệu']
};
// Xáo trộn một lần cho mỗi người học/nhiệm vụ, giữ thứ tự khi lưu nháp hay tải lại trang.
function shuffledOptions(taskId){
 const values=ANSWER_OPTIONS[taskId]||[];
 const key='tc_option_order_'+(token||'guest')+'_'+taskId;
 let indexes;try{indexes=JSON.parse(storage.get(key))}catch{}
 if(!Array.isArray(indexes)||indexes.length!==values.length||new Set(indexes).size!==values.length||indexes.some(i=>!Number.isInteger(i)||i<0||i>=values.length)){
   indexes=values.map((_,i)=>i);
   for(let i=indexes.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[indexes[i],indexes[j]]=[indexes[j],indexes[i]];}
   storage.set(key,JSON.stringify(indexes));
 }
 return indexes.map(i=>values[i]);
}
// Giữ nguyên văn câu và mã nguồn; chỉ ngắt khi dấu câu thực sự kết thúc một câu.
function splitSentences(text){
 const s=String(text||''),result=[];let from=0;
 for(let i=0;i<s.length;i++){
   if(/[.!?]/.test(s[i])&&(i===s.length-1||/\s/.test(s[i+1]))){
     const part=s.slice(from,i+1).trim();if(part)result.push(part);from=i+1;
   }
 }
 const tail=s.slice(from).trim();if(tail)result.push(tail);
 return result;
}
function explanationOkay(text){
 const input=String(text||'').trim();
 const words=input.toLocaleLowerCase('vi').match(/[\p{L}\p{N}]+/gu)||[];
 if(input.length>300||words.length<6)return false;
 const normalized=input.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D');
 if(!/[aeiouy]/i.test(normalized))return false;
 const counts=new Map();
 for(const word of words){
   const plain=word.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
   counts.set(plain,(counts.get(plain)||0)+1);
   if(counts.get(plain)>words.length/2)return false;
 }
 return true;
}
let token=storage.get('tc_learning_token'),cat=null,progress=null,taskId='Q1',busy=false,teacherToken='',dashboard=null;
try{teacherToken=sessionStorage.getItem('tc_teacher_session')||''}catch{}
const notice=s=>{$('#notice').textContent=s||'';};
async function api(data){const r=await fetch(cfg.API_URL,{method:'POST',headers,signal:AbortSignal.timeout(60000),body:JSON.stringify({...data,learner_token:token,teacher_token:teacherToken})});let d;try{d=await r.json()}catch{throw Error('Máy chủ chưa trả lời. Bản nháp vẫn được giữ.')}if(!d.ok){if(d.code==='AUTH'){teacherToken='';try{sessionStorage.removeItem('tc_teacher_session')}catch{}}throw Error(d.error||'Chưa xử lí được.')}return d;}
// Mỗi lượt lưu bài được tự thử lại tối đa một lần, cách 4 giây khi API/mạng lỗi.
async function submitWithRetry(payload){
 let error=null;
 for(let attempt=0;attempt<2;attempt++){
  try{
   const data=await api(payload);
   if(data.status!=='error'&&!data.ai_unavailable&&!data.ai_error)return {ok:true,data};
   error=Error('AI_UNAVAILABLE');
  }catch(e){error=e;}
  if(attempt===0)await new Promise(resolve=>setTimeout(resolve,4000));
 }
 return {ok:false,error};
}
async function guarded(button,fn){if(busy)return;busy=true;if(button)button.disabled=true;notice('');try{await fn()}catch(e){notice(e.name==='TimeoutError'?'Máy chủ phản hồi chậm. Bản nháp vẫn được giữ; thử tải lại tiến độ trước khi nộp lại.':e.message)}finally{busy=false;if(button)button.disabled=false;}}
const srcs=ids=>ids.map(id=>{const s=cat.sources.find(s=>s.id===id);return `<article class="source" id="${E(id)}"><b>${E(s.id)} · ${E(s.title)}</b><p>${E(s.text)}</p><small>${E(s.author)} · ${E(s.section)}</small>${s.url?`<a href="${E(s.url)}" target="_blank" rel="noopener">Mở nguồn gốc ↗</a>`:''}</article>`}).join('');
function rubric(){return `<details><summary>Tiêu chí phản hồi · 0–2 điểm mỗi mục</summary>${cat.rubric.map(r=>`<p><b>${E(r.label)}</b><br>${r.levels.map((v,i)=>`${i}: ${E(v)}`).join('<br>')}</p>`).join('')}<small>Rubric của ứng dụng; giáo viên rà soát trước khi dùng để đánh giá chính thức.</small></details>`;}
function feedback(a){
 if(!a)return '';
 if(a.status!=='done')return `<div class="error">Bài đã lưu. ${a.status==='pending'?'AI đang xử lí.':'AI đang bận. Em bấm nút bên dưới để thử lại.'}</div>`;
 const f=a.feedback;if(!f||!Array.isArray(f.tieu_chi)||!f.tieu_chi.length)return '<div class="error">Chưa có phản hồi để hiển thị.</div>';
 const score=Math.max(0,Math.min(6,Number(f.tong)||0));
 const best=f.tieu_chi.reduce((a,b)=>b.diem>a.diem?b:a);
 const weak=f.tieu_chi.reduce((a,b)=>b.diem<a.diem?b:a);
 const strength=best.diem>0?best.nhan_xet:'Em đã nộp bài. Đọc gợi ý bên dưới rồi thử sửa nhé.';
 const improvement=score===6?(f.goi_y||'Thử vận dụng lập luận này với một tư liệu khác.'):weak.nhan_xet;
 return `<div class="feedback"><div class="feedbackBrief"><div class="stars" role="img" aria-label="${score} trong 6 điểm tham khảo">${'★'.repeat(score)}${'☆'.repeat(6-score)}</div><b class="aLabel">AI NHẬN XÉT · ${score}/6</b></div><p><b>Làm tốt:</b> ${E(strength)}</p>${score===6?'<p><b>Xuất sắc!</b> Em đã chọn đúng và dùng bằng chứng hợp lí.</p>':`<p><b>Cần sửa:</b> ${E(improvement)}</p>`}${f.can_gv_xem?'<small>Giáo viên cần xem lại phản hồi này.</small>':''}</div>`;
}
function work(a){return `<p><b>Kết luận</b></p><div class="readonly">${E(a.body.ket_luan||a.body.chon)}</div><p><b>Bằng chứng</b></p><div class="readonly">${E(a.body.bang_chung)}<br>Nguồn: ${(a.body.nguon||[]).map(E).join(', ')}</div><p><b>Giải thích</b></p><div class="readonly">${E(a.body.giai_thich)}</div>`;}
function viewer(on){const v=$('#viewer');if(!v)return;v.hidden=!on;if(on&&!v.querySelector('iframe')){v.innerHTML='<div class="viewerHead"><b>Mô hình 3D tháp Chăm</b><span><button class="ghost" id="viewerToggle">Thu gọn</button> <a href="index.html" target="_blank" rel="noopener">Toàn màn hình ↗</a></span></div><iframe src="index.html?embed=1" title="Mô hình 3D tháp Chăm" loading="lazy" allow="fullscreen"></iframe>';$('#viewerToggle').onclick=e=>{v.classList.toggle('mini');e.target.textContent=v.classList.contains('mini')?'Mở mô hình':'Thu gọn';};}}
function hero(on){const h=document.querySelector('.hero');if(h)h.hidden=!on;}
function intro(){
 viewer(false);hero(true);
 $('#app').innerHTML=`<section class="card narrow"><h2>Vào phòng học</h2><p>3 nhiệm vụ ngắn • khoảng 15 phút</p><label for="class">Lớp của em</label><input id="class" maxlength="12" placeholder="Ví dụ: 10A1" autocomplete="off"><p class="muted">Không cần họ tên. Bài làm được lưu để giáo viên xem; nội dung bài làm được gửi đến Gemini để tạo nhận xét. Phiếu góp ý cuối buổi chỉ giáo viên xem, không gửi cho AI.</p><label class="consent"><input id="consent" type="checkbox">Em đồng ý và làm theo hướng dẫn của thầy cô.</label><button id="start" class="wide">Vào học →</button></section>`;
 $('#start').onclick=e=>guarded(e.target,async()=>{const classCode=$('#class').value.replace(/\s+/g,'').toLocaleUpperCase('vi');$('#class').value=classCode;if(!$('#consent').checked||!classCode)throw Error('Em nhập lớp và đánh dấu ô đồng ý nhé.');if(!token)token=crypto.randomUUID();storage.set('tc_learning_token',token);progress=await api({action:'enroll',lop:classCode,consent:true});render();});
}
async function refresh(){progress=await api({action:'progress'});render();}
function quiz(phase){viewer(false);hero(false);const questions=cat.quiz[phase];$('#app').innerHTML=`<section class="card narrow"><p class="eyebrow">${phase==='truoc'?'TRƯỚC KHI KHÁM PHÁ':'SAU KHI HOÀN THÀNH'}</p><h2>Phiếu ${phase==='truoc'?'đầu vào':'cuối hoạt động'}</h2><p>Tự trả lời, chưa dùng trợ lý AI. Mỗi phiếu chỉ nộp một lần.</p>${questions.map((q,i)=>`<fieldset><legend>${i+1}. ${E(q.q)}</legend>${q.options.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}">${E(o)}</label>`).join('')}</fieldset>`).join('')}<button id="quizSubmit">Nộp phiếu</button></section>`;$('#quizSubmit').onclick=e=>guarded(e.target,async()=>{const answers=questions.map((_,i)=>document.querySelector(`input[name=q${i}]:checked`)?.value);if(answers.some(x=>x===undefined))throw Error('Hãy trả lời đủ các câu.');await api({action:'assessment',phase,answers:answers.map(Number)});await refresh();});}

function experience(){
 viewer(false);hero(false);
 const choices=[
  {key:'ease',title:'1. Em thao tác với ứng dụng có dễ không?',options:['Dễ sử dụng','Tương đối dễ, có vài khó khăn','Khó sử dụng']},
  {key:'helpful',title:'2. Hoạt động nào giúp em học tập nhiều nhất?',options:['Khám phá mô hình 3D','Hỏi Trợ lý AI','Thám tử sử liệu và nhận phản hồi AI','Chưa có hoạt động nào hữu ích rõ rệt']},
  {key:'ai_awareness',title:'3. Theo em, thông tin do AI tạo ra cần được sử dụng thế nào?',options:['Cần kiểm chứng bằng tư liệu','Chỉ kiểm chứng khi AI trả lời không rõ','Có thể tin mọi thông tin AI cung cấp']}
 ];
 $('#app').innerHTML=`<section class="card narrow experienceForm"><p class="eyebrow">PHẢN HỒI TRẢI NGHIỆM · KHÔNG TÍNH ĐIỂM</p><h2>Em thấy Tháp Chăm AI thế nào?</h2><p>Ba câu chọn nhanh và một ý kiến tùy chọn. Em có thể bỏ qua. Phản hồi được lưu theo mã phiên để giáo viên cải thiện ứng dụng, <b>không gửi nội dung này đến AI</b>.</p>
 ${choices.map(c=>`<fieldset class="experienceField"><legend>${E(c.title)}</legend><div class="experienceOptions">${c.options.map((label,i)=>`<label class="experienceChoice"><input type="radio" name="${E(c.key)}" value="${i+1}"><span>${E(label)}</span></label>`).join('')}</div></fieldset>`).join('')}
 <label for="experienceNote"><b>4. Em muốn ứng dụng cải thiện điều gì? (không bắt buộc)</b></label>
 <textarea id="experienceNote" maxlength="500" rows="3" placeholder="Ví dụ: câu hỏi chưa rõ, thao tác khó, AI trả lời chậm…"></textarea>
 <p class="muted">Không ghi tên, số điện thoại hoặc thông tin cá nhân.</p>
 <div class="experienceActions"><button type="button" id="experienceSubmit" class="wide">Gửi phản hồi</button><button type="button" id="experienceSkip" class="ghost">Bỏ qua</button></div>
 </section>`;
 $('#experienceSubmit').onclick=e=>guarded(e.target,async()=>{
  const get=name=>Number(document.querySelector('input[name="'+name+'"]:checked')?.value||0);
  const ease=get('ease'),helpful=get('helpful'),ai_awareness=get('ai_awareness');
  if(!ease||!helpful||!ai_awareness){notice('Em chọn một phương án ở mỗi câu nhé.');return;}
  const r=await api({action:'experience_submit',ease,helpful,ai_awareness,comment:$('#experienceNote').value.trim().slice(0,500)});
  progress.experience=r.experience;storage.remove('tc_skip_experience_'+token);render();
  notice('Đã ghi nhận góp ý của em. Cảm ơn em!');
 });
 $('#experienceSkip').onclick=()=>{storage.set('tc_skip_experience_'+token,'1');render();notice('Em đã hoàn thành hoạt động.');};
}

function render(){
 if(!progress.assessments.some(a=>a.phase==='truoc'))return quiz('truoc');
 if(progress.assessments.some(a=>a.phase==='sau')&&!progress.experience&&storage.get('tc_skip_experience_'+token)!=='1')return experience();
 viewer(true);hero(false);
 const t=cat.tasks.find(x=>x.id===taskId),rows=progress.attempts.filter(a=>a.task===t.id),first=rows.find(a=>a.version===1),second=rows.find(a=>a.version===2);
 const completed=cat.tasks.filter(t=>progress.attempts.some(a=>a.task===t.id&&a.status==='done')).length,total=cat.tasks.length,next=cat.tasks[cat.tasks.indexOf(t)+1];
 const version=first?.status==='done'?2:1;let draft={};try{draft=JSON.parse(storage.get('tc_draft_'+token+'_'+t.id+'_'+version)||'{}')}catch{}
 const current=second||null,base=Object.keys(draft).length?draft:(first?.body||{});
 const sentenceCards=t.sources.flatMap(id=>{const source=cat.sources.find(s=>s.id===id);return source?splitSentences(source.text).map((text,i)=>({id,text,key:id+'-'+i})):[];});
 const selectedAnswer=t.id==='Q3'?(base.chon||String(base.ket_luan||'').replace(/^Nhận định này /,'')):base.ket_luan;
 const selectedEvidenceIndex=sentenceCards.findIndex(c=>c.text===base.bang_chung&&(base.nguon||[]).includes(c.id));
 $('#app').innerHTML=`<div class="learningTop">
 <nav class="taskProgress" role="group" aria-label="Tiến độ ba nhiệm vụ">
  ${cat.tasks.map((q,i)=>`<button type="button" data-task="${E(q.id)}" class="progressDot ${q.id===taskId?'active':''} ${progress.attempts.some(a=>a.task===q.id&&a.status==='done')?'done':''}" aria-label="Nhiệm vụ ${i+1}: ${E(q.title)}" aria-current="${q.id===taskId?'step':'false'}" title="${E(q.title)}"><span aria-hidden="true"></span></button>`).join('')}
 </nav>
 <details class="moreMenu"><summary aria-label="Tùy chọn phiên học" title="Tùy chọn phiên học">⋯</summary>
  <div class="morePanel"><p class="sessionLabel">${E(progress.learner.lop)} · ${E(progress.learner.code)}</p>
   <button type="button" id="reload" class="ghost">Tải lại tiến độ</button>
   <button type="button" id="end" class="ghost">Kết thúc trên thiết bị</button>
  </div>
 </details>
</div>
<div class="layout"><section class="lessonContent">
 <article class="card questionCard"><span class="qLabel">CÂU HỎI ${cat.tasks.indexOf(t)+1}/${total} · ${E(t.kind)}</span><h2>${E(t.title)}</h2><p class="qText">${E(t.prompt)}</p><p class="muted">Xoay, phóng to mô hình 3D phía trên để quan sát.</p></article>
 ${first?`<article class="card answerCard"><span class="aLabel">BÀI EM ĐÃ NỘP</span>${work(first)}${feedback(first)}${first.status!=='done'?'<button id="retryFirst" class="ghost">Thử lại</button>':''}</article>`:''}
 ${current?`<article class="card answerCard"><span class="aLabel">BÀI EM ĐÃ SỬA</span>${work(current)}${feedback(current)}${current.status!=='done'?'<button id="retrySecond" class="ghost">Thử lại</button>':''}${next?`<button class="nextTask wide" data-next="${next.id}">Sang câu hỏi tiếp →</button>`:''}</article>`:`<article class="card answerCard"><span class="aLabel">${version===1?'BÀI LÀM CỦA EM':'SỬA BÀI (KHÔNG BẮT BUỘC)'}</span>${version===2&&next?`<button class="ghost nextTask" data-next="${next.id}">Không sửa, sang câu hỏi tiếp →</button>`:''}
 <h4>① Chọn kết luận đúng</h4>
 <div class="tapOptions" id="answerOptions">${shuffledOptions(t.id).map(value=>`<button type="button" class="tapOption ${selectedAnswer===value?'pick':''}" data-answer="${E(value)}" aria-pressed="${selectedAnswer===value}">${E(value)}</button>`).join('')}</div>
 <h4>② Chạm vào câu tư liệu làm bằng chứng</h4>
 <div class="evidenceCards" id="evidenceCards">${sentenceCards.map((c,i)=>`<button type="button" class="evidenceCard ${selectedEvidenceIndex===i?'pick':''}" data-evidence-index="${i}" aria-pressed="${selectedEvidenceIndex===i}"><small>${E(c.id)} · ${E(cat.sources.find(s=>s.id===c.id)?.title||'Tư liệu')}</small><span>${E(c.text)}</span></button>`).join('')}</div>
 <label for="reason"><b>③ Viết 1 câu giải thích</b></label><textarea id="reason" rows="2" maxlength="300" placeholder="Vì tư liệu cho thấy…">${E(String(base.giai_thich||'').slice(0,300))}</textarea><div class="reasonMeta"><span>Ít nhất 6 chữ.</span><span id="reasonCount">${String(base.giai_thich||'').slice(0,300).length}/300</span></div>
 <button id="submit" class="wide" ${first?.status==='pending'?'disabled':''}>${version===1?'Nộp bài':'Nộp bản sửa'}</button><p id="saveStatus" class="muted" aria-live="polite"></p></article>`}
 ${completed<total&&!progress.assessments.some(a=>a.phase==='sau')?'':`<article class="card completionCard">${completed===total?`<div class="detectiveBadge" role="status"><span class="medal">🏅</span><div><strong>THÁM TỬ SỬ LIỆU</strong><p>Em đã nộp đủ ba nhiệm vụ. Xem lại phản hồi rồi làm phiếu cuối.</p></div></div>`:''}<h3>Hoàn thành hoạt động</h3>${progress.assessments.some(a=>a.phase==='sau')?`<p>Phiếu đầu vào: <b>${progress.assessments.find(a=>a.phase==='truoc').score}/3</b> · Phiếu cuối: <b>${progress.assessments.find(a=>a.phase==='sau').score}/3</b></p><p class="muted">Hai phiếu ngắn chỉ phản ánh một phần kết quả; cần giáo viên đối chiếu bài làm.</p>`:`<button id="post" class="wide" ${completed<total?'disabled':''}>Làm phiếu cuối hoạt động</button><p class="muted">${completed<total?`Mở sau khi nộp đủ ${total} nhiệm vụ (còn ${total-completed}). Bản sửa là không bắt buộc.`:'Em đã nộp đủ nhiệm vụ – hãy làm phiếu cuối nhé!'}</p>`}</article>`}</section></div>`;
 document.querySelectorAll('[data-task]').forEach(b=>b.onclick=()=>{if(busy)return;taskId=b.dataset.task;render();});document.querySelectorAll('[data-next]').forEach(b=>b.onclick=()=>{if(busy)return;taskId=b.dataset.next;render();scrollTo({top:0,behavior:'smooth'});});
 $('#reload').onclick=e=>guarded(e.target,refresh);$('#end').onclick=()=>{if(busy)return;for(const t of cat.tasks)for(const v of [1,2])storage.remove('tc_draft_'+token+'_'+t.id+'_'+v);storage.remove('tc_learning_token');storage.remove('tc_skip_experience_'+token);token=null;progress=null;taskId='Q1';intro();notice('Đã kết thúc phiên trên thiết bị. Bài đã nộp vẫn được lưu cho giáo viên.');};
 const read=()=>{
  const chosen=document.querySelector('#answerOptions .tapOption.pick')?.dataset.answer||'';
  const selected=document.querySelector('#evidenceCards .evidenceCard.pick');
  const index=selected?Number(selected.dataset.evidenceIndex):-1;
  const evidence=sentenceCards[index];
  return {ket_luan:t.id==='Q3'&&chosen?'Nhận định này '+chosen:chosen,chon:t.id==='Q3'?chosen:'',bang_chung:evidence?.text||'',nguon:evidence?[evidence.id]:[],giai_thich:($('#reason')?.value||'').trim().slice(0,300)};
 };
 if($('#submit')){
  const save=()=>{storage.set('tc_draft_'+token+'_'+t.id+'_'+version,JSON.stringify(read()));$('#saveStatus').textContent='Đã giữ bản nháp trên thiết bị.';};
  function selectOne(container,selector,button){
   container.querySelectorAll(selector).forEach(b=>{const active=b===button;b.classList.toggle('pick',active);b.setAttribute('aria-pressed',String(active));});
   save();
  }
  document.querySelectorAll('#answerOptions .tapOption').forEach(b=>b.addEventListener('click',()=>selectOne($('#answerOptions'),'.tapOption',b)));
  document.querySelectorAll('#evidenceCards .evidenceCard').forEach(b=>b.addEventListener('click',()=>selectOne($('#evidenceCards'),'.evidenceCard',b)));
  $('#reason').addEventListener('input',()=>{$('#reasonCount').textContent=$('#reason').value.length+'/300';save();});
  $('#submit').onclick=e=>guarded(e.target,async()=>{
    const body=read();
    if(!body.ket_luan){notice('Em hãy chọn một kết luận.');return;}
    if(!body.bang_chung||!body.nguon.length){notice('Em hãy chọn một câu tư liệu làm bằng chứng.');return;}
    if(!explanationOkay(body.giai_thich)){notice('Viết rõ hơn một chút nhé');return;}
    if(version===2&&first){
      const normal=s=>String(s||'').trim().replace(/\s+/g,' ');
      const earlier=first.body||{};
      const same=['ket_luan','chon','bang_chung','giai_thich'].every(key=>normal(body[key])===normal(earlier[key])) &&
        JSON.stringify(body.nguon)===JSON.stringify(earlier.nguon||[]);
      if(same){notice('Em chưa sửa gì');return;}
    }
    save();notice('Đang lưu bài và xin phản hồi AI…');
    const result=await submitWithRetry({action:'submit_attempt',task:t.id,version,body});
    if(!result.ok){
      try{await refresh();}catch(_){}
      notice('AI đang bận, chờ vài giây rồi bấm gửi lại');
      return;
    }
    await refresh();
    const response=result.data;
    notice(response.message|| (response.pending?'Bài đang được chấm, chờ vài giây rồi tải lại trang.':'Đã nộp bài. Xem nhận xét bên dưới.'));

  });
 }
 for(const [id,a] of [['retryFirst',first],['retrySecond',second]])if($("#"+id))$("#"+id).onclick=e=>guarded(e.target,async()=>{const result=await submitWithRetry({action:'submit_attempt',task:t.id,version:a.version,body:a.body});if(result.ok){await refresh();}else{try{await refresh();}catch(_){}notice('AI đang bận, chờ vài giây rồi bấm gửi lại');}});
 if($('#solution'))$('#solution').onclick=e=>guarded(e.target,async()=>{const r=await api({action:'solution',task:t.id});$('#solutionText').textContent=r.answer;});
 if($('#post'))$('#post').onclick=()=>quiz('sau');

}
function teacherLogin(){hero(false);
 viewer(false);
 $('#app').innerHTML='<section class="card narrow"><h2>Không gian giáo viên</h2><p>Xem bài trước–sau, phản hồi AI và ghi đánh giá của giáo viên.</p><label for="teacherCode">Mã giáo viên của dự án mới</label><input id="teacherCode" type="password" autocomplete="off"><button id="login" style="margin-top:16px">Đăng nhập</button><p class="muted">Phiên có thời hạn một giờ, chỉ lưu trong tab. Không chia sẻ mã với học sinh.</p></section>';
 $('#login').onclick=e=>guarded(e.target,async()=>{const r=await api({action:'teacher_login',ma_gv:$('#teacherCode').value});teacherToken=r.token;try{sessionStorage.setItem('tc_teacher_session',teacherToken)}catch{}await teacherLoad();});
}
async function teacherLoad(lop=''){dashboard=await api({action:'learning_dashboard',lop});teacherRender(lop);}
const CORRECT={Q1:b=>b.ket_luan===ANSWER_OPTIONS.Q1[0],Q3:b=>['Chưa đủ căn cứ','Sai'].includes(b.chon),Q5:b=>b.ket_luan===ANSWER_OPTIONS.Q5[0]};
function summary(){
 const real=a=>!/^TEST/i.test(a.lop||'');
 const att=dashboard.attempts.filter(real),asm=dashboard.assessments.filter(real);
 const classes=[...new Set([...att,...asm].map(a=>a.lop))].sort();
 const pct=(n,d)=>d?Math.round(100*n/d)+'%':'–',avg=xs=>xs.length?(xs.reduce((x,y)=>x+y,0)/xs.length).toFixed(1):'–';
 const rows=classes.map(lop=>{
  const A=att.filter(a=>a.lop===lop),first=A.filter(a=>a.version===1&&a.status==='done');
  const per=cat.tasks.map(t=>{const F=first.filter(a=>a.task===t.id);return `${t.id}: ${avg(F.map(a=>Number(a.feedback?.tong)||0))}/6 · đúng ${pct(F.filter(a=>CORRECT[t.id]?.(a.body||{})).length,F.length)}`;}).join('<br>');
  const pre=asm.filter(a=>a.lop===lop&&a.phase==='truoc').map(a=>a.score),post=asm.filter(a=>a.lop===lop&&a.phase==='sau').map(a=>a.score);
  return `<tr><td><b>${E(lop)}</b></td><td>${new Set([...A.map(a=>a.code),...asm.filter(a=>a.lop===lop).map(a=>a.code)]).size}</td><td>${first.length}</td><td>${per}</td><td>${avg(pre)} (${pre.length}) → ${avg(post)} (${post.length})</td></tr>`;}).join('');
 return `<section class="card"><h3>Tổng hợp theo lớp</h3><p class="muted">Đã bỏ các lớp thử nghiệm có tên bắt đầu bằng TEST. “Đúng” = tỉ lệ chọn đúng kết luận ở bài nộp lần đầu.</p><div class="scroll"><table><thead><tr><th>Lớp</th><th>Số học sinh</th><th>Bài nộp</th><th>Điểm AI TB · chọn đúng</th><th>Phiếu đầu → cuối (/3)</th></tr></thead><tbody>${rows||'<tr><td colspan="5">Chưa có dữ liệu.</td></tr>'}</tbody></table></div></section>`;
}

const EXPERIENCE_LABELS={
 ease:['Dễ sử dụng','Tương đối dễ','Khó sử dụng'],
 helpful:['Khám phá 3D','Trợ lý AI','Thám tử sử liệu','Chưa thấy hữu ích'],
 ai_awareness:['Cần kiểm chứng bằng tư liệu','Chỉ kiểm chứng khi AI chưa rõ','Có thể tin mọi thông tin AI']
};
function experienceTeacherBlock(){
 const list=dashboard.experiences||[];
 const classes=[...new Set(list.map(x=>x.lop))].sort();
 const counts=(list,key)=>EXPERIENCE_LABELS[key].map((label,i)=>label+': <b>'+list.filter(x=>Number(x[key])===i+1).length+'</b>').join(' · ');
 return `<section class="card"><div class="row"><h3>Phản hồi trải nghiệm · không tính điểm</h3><button type="button" class="ghost" id="exportExperiences">Xuất CSV phản hồi</button></div>
 <p class="muted">${list.length} phiếu phản hồi từ ${new Set(list.map(x=>x.code)).size} mã phiên, không đồng nghĩa với số học sinh duy nhất. Đây là nhận xét của người học, không phải điểm kiểm tra năng lực.</p>
 ${classes.map(lop=>{const a=list.filter(x=>x.lop===lop);return `<div class="experienceSummary"><h4>Lớp ${E(lop)} · ${a.length} phiếu</h4><p><b>Dễ sử dụng:</b> ${counts(a,'ease')}</p><p><b>Hoạt động hữu ích:</b> ${counts(a,'helpful')}</p><p><b>Nhận thức về AI:</b> ${counts(a,'ai_awareness')}</p></div>`;}).join('')||'<p>Chưa có phiếu phản hồi trải nghiệm.</p>'}
 <details><summary>Xem từng phản hồi và góp ý</summary><div class="scroll"><table><thead><tr><th>Ngày</th><th>Lớp</th><th>Mã phiên</th><th>Dễ sử dụng</th><th>Hữu ích nhất</th><th>Nhận thức về AI</th><th>Góp ý</th></tr></thead>
 <tbody>${list.map(a=>`<tr><td>${E(new Date(a.created_at).toLocaleString('vi-VN'))}</td><td>${E(a.lop)}</td><td>${E(a.code)}</td><td>${E(EXPERIENCE_LABELS.ease[Number(a.ease)-1]||'–')}</td><td>${E(EXPERIENCE_LABELS.helpful[Number(a.helpful)-1]||'–')}</td><td>${E(EXPERIENCE_LABELS.ai_awareness[Number(a.ai_awareness)-1]||'–')}</td><td>${E(a.comment||'')}</td></tr>`).join('')||'<tr><td colspan="7">Chưa có phản hồi.</td></tr>'}</tbody></table></div></details></section>`;
}

function teacherRender(lop){hero(false);
 const groups=new Map();for(const a of dashboard.attempts){const key=a.code+'|'+a.task;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(a);}
 const paired=[...groups.values()].filter(g=>g.some(a=>a.version===1)&&g.some(a=>a.version===2));
 const needs=dashboard.attempts.filter(a=>a.status!=='done'||a.feedback?.can_gv_xem).length;
 $('#app').innerHTML=`<section class="card"><div class="row"><h2>Hồ sơ học tập</h2><button id="logout" class="ghost">Đăng xuất</button></div><div class="row"><input id="filter" maxlength="12" value="${E(lop)}" placeholder="Lọc lớp" style="max-width:180px"><button id="filterGo">Lọc</button><button id="export" class="ghost">Xuất minh chứng CSV</button><button id="print" class="ghost">In / PDF</button></div><p>${dashboard.attempts.length} bài nộp · ${paired.length} bài có bản sửa · ${needs} bài cần thầy cô xem</p><p class="muted">Hiển thị tối đa 500 bài gần nhất. Mỗi mã HS là một lượt vào học. Điểm AI chỉ để tham khảo.</p></section>${summary()}${experienceTeacherBlock()}<section class="card"><h3>Phiếu đầu–cuối</h3><div class="scroll"><table><thead><tr><th>Mã phiên</th><th>Lớp</th><th>Thời điểm</th><th>Kết quả</th></tr></thead><tbody>${dashboard.assessments.map(a=>`<tr><td>${E(a.code)}</td><td>${E(a.lop)}</td><td>${a.phase==='truoc'?'Đầu vào':'Cuối hoạt động'}</td><td>${a.score}/3</td></tr>`).join('')||'<tr><td colspan="4">Chưa có dữ liệu.</td></tr>'}</tbody></table></div></section>${[...groups.values()].map(g=>`<section class="card"><h3>${E(g[0].code)} · ${E(g[0].lop)} · ${E(g[0].task)}</h3><div class="grid">${[1,2].map(v=>{const a=g.find(a=>a.version===v);if(!a)return '<div class="subtle">Chưa có bản sửa.</div>';return `<article><h3>${v===1?'Bản đầu':'Bản sửa'}</h3>${work(a)}${feedback(a)}${a.review?`<div class="subtle"><b>Giáo viên: ${a.review.scores.reduce((x,y)=>x+y,0)}/6</b><p>${E(a.review.note)}</p></div>`:''}<form class="review" data-id="${a.id}"><details><summary>Đánh giá / điều chỉnh của giáo viên</summary>${cat.rubric.map((r,i)=>`<label>${E(r.label)} <select name="s${i}">${[0,1,2].map(n=>`<option ${a.review?.scores[i]===n?'selected':''}>${n}</option>`).join('')}</select></label>`).join('')}<label>Nhận xét và lí do điều chỉnh<textarea name="note" maxlength="1500" required>${E(a.review?.note||'')}</textarea></label><button>Lưu đánh giá</button></details></form></article>`;}).join('')}</div></section>`).join('')||'<section class="card">Chưa có bài làm. Dữ liệu sẽ xuất hiện sau khi học sinh nộp.</section>'}`;
 $('#filterGo').onclick=e=>guarded(e.target,()=>teacherLoad($('#filter').value));$('#print').onclick=()=>window.print();
 $('#exportExperiences').onclick=()=>{
  const q=x=>'"'+String(x??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';
  const rows=[['Ngày','Lớp','Mã phiên','Dễ sử dụng','Hữu ích nhất','Nhận thức về AI','Góp ý'],
   ...(dashboard.experiences||[]).map(a=>[new Date(a.created_at).toLocaleString('vi-VN'),a.lop,a.code,
     EXPERIENCE_LABELS.ease[Number(a.ease)-1]||'',EXPERIENCE_LABELS.helpful[Number(a.helpful)-1]||'',EXPERIENCE_LABELS.ai_awareness[Number(a.ai_awareness)-1]||'',a.comment||''])];
  const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='ThapChamAI_PhanHoiHocSinh.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 $('#logout').onclick=e=>guarded(e.target,async()=>{await api({action:'teacher_logout'});teacherToken='';try{sessionStorage.removeItem('tc_teacher_session')}catch{}teacherLogin();});
 document.querySelectorAll('.review').forEach(f=>f.onsubmit=e=>{e.preventDefault();guarded(f.querySelector('button'),async()=>{await api({action:'teacher_review',attempt_id:f.dataset.id,scores:[0,1,2].map(i=>Number(f.elements['s'+i].value)),note:f.elements.note.value});await teacherLoad(lop);notice('Đã lưu đánh giá của giáo viên; giữ nguyên phản hồi AI và lịch sử đánh giá.');});});
 $('#export').onclick=()=>{const quote=x=>'"'+String(x??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';const rows=[['Thời gian','Mã phiên','Lớp','Nhiệm vụ','Phiên bản','Kết luận','Bằng chứng','Giải thích','Nguồn','Điểm AI','Điểm GV','Nhận xét GV'],...dashboard.attempts.map(a=>[new Date(a.created_at).toLocaleString('vi-VN'),a.code,a.lop,a.task,a.version,a.body.ket_luan,a.body.bang_chung,a.body.giai_thich,(a.body.nguon||[]).join('; '),a.feedback?.tong,a.review?.scores.reduce((x,y)=>x+y,0),a.review?.note])];const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ThapChamAI_MinhChung.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
}
(async()=>{try{cat=await api({action:'catalog'});if(new URLSearchParams(location.search).has('teacher')){if(teacherToken){try{await teacherLoad()}catch{teacherLogin()}}else teacherLogin();}else if(token){try{await refresh()}catch{intro();notice('Chưa khôi phục được phiên. Kiểm tra kết nối rồi tải lại trang.')}}else intro();}catch(e){$('#app').innerHTML='<section class="card"><h2>Chưa kết nối được phòng học</h2><p>Bản nháp đã lưu trên thiết bị vẫn được giữ. Em có thể tiếp tục quan sát mô hình.</p><a class="button" href="index.html">Khám phá 3D</a><button class="ghost" onclick="location.reload()">Thử lại</button></section>';notice(e.message);}})();
})();
