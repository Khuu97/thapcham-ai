/**
 * THÁP CHĂM AI – Backend (Google Apps Script)
 * ------------------------------------------------------------
 * Chức năng:
 *  1. Nhận câu hỏi từ app → gọi Gemini → trả lời CHỈ dựa trên bộ tư liệu (TU_LIEU) bên dưới.
 *  2. Chấm phần "Thám tử sử liệu" (học sinh chọn Đúng/Sai + nêu bằng chứng).
 *  3. Ghi lại toàn bộ lượt dùng vào Google Sheet này để làm minh chứng tác động.
 *
 * Cài đặt (làm 1 lần):
 *  - Mở Google Sheet mới → Tiện ích mở rộng → Apps Script → dán toàn bộ file này.
 *  - Cài đặt dự án (bánh răng) → Thuộc tính tập lệnh → thêm GEMINI_API_KEY = <key của thầy>.
 *  - Chạy hàm setup() một lần (cấp quyền).
 *  - Triển khai → Tùy chọn triển khai mới → Ứng dụng web
 *        Thực thi với tư cách: Tôi   |   Người có quyền truy cập: Bất kỳ ai
 *  - Copy URL /exec dán vào file config.js của app.
 *
 * Khi sửa TU_LIEU: lưu lại rồi Triển khai → Quản lý triển khai → Sửa → Phiên bản mới.
 */

// ===================== BỘ TƯ LIỆU (giáo viên duyệt & chỉnh) =====================
// Mỗi mục có mã [Tx] để AI dẫn nguồn. Chỉ những gì có ở đây AI mới được trả lời.
var TU_LIEU = [
  {id:'T1', nguon:'SGK Lịch sử 10 – Bài 16 (tóm tắt của GV)', noidung:
   'Vương quốc Champa hình thành ở vùng duyên hải miền Trung Việt Nam. Cuối thế kỉ II (năm 192), Khu Liên lập nước Lâm Ấp ở vùng Tượng Lâm, sau này phát triển thành Champa. Từ cuối thế kỉ XVII, vùng đất Champa dần trở thành một phần lãnh thổ Đại Việt.'},
  {id:'T2', nguon:'SGK Lịch sử 10 – Bài 16 (tóm tắt của GV)', noidung:
   'Cư dân Champa chịu ảnh hưởng sâu sắc của văn hóa Ấn Độ: theo Hindu giáo (thờ Shiva là chủ yếu, cùng Vishnu, Brahma) và Phật giáo. Từ khoảng thế kỉ IV, người Chăm sáng tạo chữ viết riêng dựa trên chữ Phạn (Sanskrit) của Ấn Độ.'},
  {id:'T3', nguon:'SGK Lịch sử 10 – Bài 16 (tóm tắt của GV)', noidung:
   'Xã hội Chăm theo chế độ mẫu hệ. Lễ hội Ka-tê là lễ hội tiêu biểu của người Chăm theo đạo Bà-la-môn, tổ chức tại các đền tháp ở Ninh Thuận, Bình Thuận (cũ) như Po Klong Garai, Po Rome.'},
  {id:'T4', nguon:'Tư liệu app – Lịch sử tháp', noidung:
   'Tháp Chăm là loại hình kiến trúc tôn giáo của Champa, phát triển mạnh khoảng thế kỉ VII–XVII. Tháp dùng để thờ thần (Shiva, Vishnu, nữ thần Po Nagar) hoặc thờ các vị vua được thần thánh hóa.'},
  {id:'T5', nguon:'Tư liệu app – Đặc điểm kiến trúc', noidung:
   'Tháp Chăm chủ yếu xây bằng gạch nung màu đỏ, mạch ghép rất khít. Thân tháp vươn cao, thu nhỏ dần lên trên. Mặt trước có cửa ra vào; các mặt còn lại thường có cửa giả hoặc hốc vòm cân đối. Mái chia nhiều tầng, có gờ chỉ và các tháp góc nhỏ. Đỉnh tháp có chóp hoặc bầu trang trí.'},
  {id:'T6', nguon:'Tư liệu GV biên soạn', noidung:
   'Tháp chính (kalan) thường có mặt bằng hình vuông; cửa chính thường quay về hướng đông, ba mặt còn lại là cửa giả. Bên trong là gian thờ nhỏ, hẹp và tối, nơi đặt tượng thần hoặc bộ linga – yoni (biểu tượng thờ thần Shiva).'},
  {id:'T7', nguon:'Tư liệu app – Kỹ thuật xây dựng', noidung:
   'Gạch được gia công tương đối đều, xếp khít để tạo khối vững chắc. Cách kết dính gạch của người Chăm đến nay vẫn còn tranh luận: có giả thuyết cho rằng dùng chất kết dính hữu cơ (như nhựa cây dầu rái), có giả thuyết cho rằng gạch được mài khít và nung kết. Một số hoa văn được chạm trực tiếp lên gạch sau khi xây xong.'},
  {id:'T8', nguon:'Tư liệu app – Các loại công trình', noidung:
   'Trong một quần thể đền tháp có: Kalan (tháp chính, nơi đặt tượng/biểu tượng thờ); Gopura (tháp cổng dẫn vào khu thờ); Mandapa (nhà dài/tiền sảnh); Kosagrha (tháp lửa hay kho thiêng, mái thường hình thuyền); ngoài ra có tháp bia và các công trình phụ.'},
  {id:'T9', nguon:'Tư liệu app – Các bộ phận', noidung:
   'Các bộ phận chính của một tháp Chăm từ dưới lên: đế tháp (bệ giật cấp, nâng đỡ công trình); cầu thang dẫn lên cửa chính; thân tháp (khối tường chính, có trụ ốp/cột áp tường chia nhịp mặt đứng); cửa và vòm cửa (vòm nhọn hình ngọn lửa/lá đề); mái tháp (nhiều tầng thu nhỏ dần, có tháp góc); chóp tháp ở trên cùng.'},
  {id:'T10', nguon:'Tư liệu app – Hoa văn', noidung:
   'Hoa văn và điêu khắc trên tháp Chăm gồm: vòm cửa hình lá đề/ngọn lửa, hoa văn dây lá, hình vũ nữ Apsara, thần, chim thần Garuda, rắn thần Naga, voi, sư tử. Điêu khắc Chăm chịu ảnh hưởng nghệ thuật Ấn Độ nhưng mang phong cách riêng.'},
  {id:'T11', nguon:'Tư liệu GV biên soạn – Di tích', noidung:
   'Thánh địa Mỹ Sơn (huyện Duy Xuyên, tỉnh Quảng Nam cũ – nay thuộc TP Đà Nẵng) là trung tâm tôn giáo lớn của Champa, có hơn 70 công trình được xây dựng trong khoảng thế kỉ IV–XIII. Năm 1999, Mỹ Sơn được UNESCO công nhận là Di sản văn hóa thế giới. Nhiều tháp ở Mỹ Sơn bị bom đạn tàn phá trong chiến tranh.'},
  {id:'T12', nguon:'Tư liệu GV biên soạn – Di tích', noidung:
   'Tháp Po Nagar (Nha Trang, Khánh Hòa) thờ nữ thần Po Inư Nưgar – mẹ xứ sở, được xây dựng trong khoảng thế kỉ VII–XII. Tháp Po Klong Garai (Phan Rang, tỉnh Ninh Thuận cũ – nay thuộc Khánh Hòa) xây khoảng cuối thế kỉ XIII – đầu thế kỉ XIV, thờ vua Po Klong Garai. Tháp Po Rome (Ninh Thuận cũ) là một trong những tháp Chăm xây muộn nhất (khoảng thế kỉ XVII).'},
  {id:'T13', nguon:'Tư liệu GV biên soạn – Di tích', noidung:
   'Các cụm tháp tiêu biểu khác: Dương Long, Bánh Ít, Cánh Tiên (Bình Định cũ – nay thuộc Gia Lai); tháp Nhạn (Phú Yên cũ – nay thuộc Đắk Lắk); Po Sah Inư (Phan Thiết, Bình Thuận cũ – nay thuộc Lâm Đồng). Phật viện Đồng Dương (Quảng Nam cũ) là trung tâm Phật giáo lớn của Champa thế kỉ IX.'},
  {id:'T14', nguon:'Tư liệu app – Ghi chú mô hình', noidung:
   'Mô hình 3D trong app là một THÁP CHĂM TỔNG HỢP do AI (Tripo AI) dựng từ ảnh tham chiếu. Nó đại diện cho phong cách kiến trúc Chăm nói chung, KHÔNG phải bản sao chính xác của một tháp cụ thể. Một số chi tiết do AI tạo có thể chưa đúng (ví dụ: số cửa mỗi mặt, màu sắc, rêu). Học sinh cần đối chiếu mô hình với ảnh di tích thật và tư liệu.'},
  {id:'T15', nguon:'Tư liệu GV biên soạn – Giá trị', noidung:
   'Tháp Chăm là di sản kiến trúc – nghệ thuật độc đáo, thể hiện trình độ kĩ thuật xây dựng và tín ngưỡng của cư dân Champa; là minh chứng cho sự đa dạng văn hóa Việt Nam. Bảo tồn tháp Chăm cần: không leo trèo, viết vẽ lên di tích; tìm hiểu, giới thiệu đúng giá trị; ủng hộ việc trùng tu khoa học.'}
];

// ===================== CẤU HÌNH =====================
var MODELS = ['gemini-2.5-flash', 'gemini-flash-latest'];  // thử lần lượt
var MAX_Q_LEN = 400;          // độ dài tối đa câu hỏi
var LIMIT_PER_10MIN = 25;     // giới hạn số câu hỏi / phiên / 10 phút

function tuLieuText_() {
  return TU_LIEU.map(function (t) { return '[' + t.id + '] (' + t.nguon + ') ' + t.noidung; }).join('\n');
}
function nguonMap_() {
  var m = {}; TU_LIEU.forEach(function (t) { m[t.id] = t.nguon; }); return m;
}

var SYSTEM_CHAT =
  'Bạn là "Trợ lý Tháp Chăm", trợ lý học tập môn Lịch sử lớp 10 (Bài 16 – Văn minh Champa) cho học sinh Việt Nam.\n' +
  'QUY TẮC BẮT BUỘC:\n' +
  '1. CHỈ trả lời dựa trên BỘ TƯ LIỆU được cung cấp. Không bịa thêm năm, số liệu, tên người, địa danh.\n' +
  '2. Nếu tư liệu không có thông tin → đặt "trong_tu_lieu": false, nói rõ "Tư liệu của lớp chưa có thông tin này" và gợi ý cách kiểm chứng (SGK, sách tham khảo, hỏi thầy cô). Không đoán.\n' +
  '3. Trả lời bằng tiếng Việt, ngắn gọn (tối đa khoảng 120 từ), dễ hiểu với học sinh lớp 10. Có thể dùng gạch đầu dòng.\n' +
  '4. Liệt kê mã tư liệu đã dùng (ví dụ ["T5","T9"]) trong "nguon".\n' +
  '5. Cuối câu trả lời, đặt MỘT câu hỏi gợi mở ngắn để học sinh tự quan sát/kiểm chứng trên mô hình 3D, đặt trong "cau_hoi_goi_mo".\n' +
  '6. Nếu câu hỏi không liên quan đến bài học (hoặc không phù hợp), lịch sự từ chối và hướng về chủ đề tháp Chăm/Champa.\n' +
  '7. Nhắc học sinh không chia sẻ thông tin cá nhân nếu các em gửi thông tin đó.\n' +
  '8. Nếu học sinh hỏi về mô hình 3D, nhớ rằng đó là tháp tổng hợp do AI dựng (T14), có thể có chi tiết chưa chính xác.\n' +
  'Trả về JSON đúng dạng: {"tra_loi": string, "nguon": string[], "trong_tu_lieu": boolean, "cau_hoi_goi_mo": string}';

var SYSTEM_JUDGE =
  'Bạn là giáo viên Lịch sử chấm phần "Thám tử sử liệu" của học sinh lớp 10.\n' +
  'Học sinh được đưa một NHẬN ĐỊNH, chọn Đúng/Sai và viết BẰNG CHỨNG. Đáp án và giải thích chuẩn đã được cung cấp.\n' +
  'Hãy đánh giá PHẦN BẰNG CHỨNG học sinh viết (không chỉ việc chọn đúng/sai):\n' +
  '- diem: 0 (không có/không liên quan), 1 (có nhưng chung chung hoặc chưa chính xác), 2 (cụ thể, chính xác, có căn cứ từ tư liệu hoặc quan sát).\n' +
  '- nhan_xet: 1–3 câu tiếng Việt, khen điểm tốt, chỉ ra điểm cần sửa, giọng khích lệ. Không bịa thông tin ngoài tư liệu.\n' +
  '- goi_y: 1 câu gợi ý cách tìm bằng chứng tốt hơn.\n' +
  'Trả về JSON: {"diem": number, "nhan_xet": string, "goi_y": string}';

// ===================== WEB APP =====================
function doGet(e) {
  return json_({ ok: true, app: 'Thap Cham AI', time: new Date().toISOString() });
}

function doPost(e) {
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var lop = clean_(req.lop, 20) || 'Khách';
    var phien = clean_(req.phien, 40) || 'na';
    if (req.action === 'chat') return json_(chat_(req, lop, phien));
    if (req.action === 'judge') return json_(judge_(req, lop, phien));
    if (req.action === 'log') { logEvent_(lop, phien, clean_(req.su_kien, 40), clean_(req.chi_tiet, 200)); return json_({ ok: true }); }
    return json_({ ok: false, error: 'Hành động không hợp lệ' });
  } catch (err) {
    return json_({ ok: false, error: 'Lỗi máy chủ: ' + err.message });
  }
}

function chat_(req, lop, phien) {
  var q = clean_(req.cau_hoi, MAX_Q_LEN);
  if (!q) return { ok: false, error: 'Câu hỏi trống.' };
  if (!allow_(phien)) return { ok: false, error: 'Em hỏi hơi nhanh rồi, nghỉ vài phút rồi hỏi tiếp nhé!' };
  var bophan = clean_(req.bo_phan, 40);
  var history = (req.lich_su || []).slice(-6).map(function (h) {
    return { role: h.role === 'model' ? 'model' : 'user', parts: [{ text: clean_(h.text, 600) }] };
  });
  var userText = (bophan ? '(Học sinh đang chọn bộ phận trên mô hình: ' + bophan + ')\n' : '') + 'Câu hỏi: ' + q;
  var contents = history.concat([{ role: 'user', parts: [{ text: userText }] }]);
  var out = gemini_(SYSTEM_CHAT + '\n\nBỘ TƯ LIỆU:\n' + tuLieuText_(), contents, 0.3);
  var m = nguonMap_();
  var nguon = (out.nguon || []).filter(function (id) { return m[id]; }).map(function (id) { return { id: id, ten: m[id] }; });
  var res = { ok: true, tra_loi: String(out.tra_loi || ''), nguon: nguon, trong_tu_lieu: out.trong_tu_lieu !== false, cau_hoi_goi_mo: String(out.cau_hoi_goi_mo || '') };
  sheet_('Hoi_dap', ['Thời gian', 'Lớp', 'Phiên', 'Bộ phận đang chọn', 'Câu hỏi', 'Trả lời', 'Trong tư liệu', 'Nguồn'])
    .appendRow([new Date(), lop, phien, bophan, q, res.tra_loi, res.trong_tu_lieu ? 'Có' : 'Không', nguon.map(function (n) { return n.id; }).join(', ')]);
  return res;
}

function judge_(req, lop, phien) {
  if (!allow_(phien)) return { ok: false, error: 'Em làm hơi nhanh rồi, nghỉ một chút nhé!' };
  var nhanDinh = clean_(req.nhan_dinh, 300), dapAn = req.dap_an === true, chon = req.chon === true;
  var giaiThich = clean_(req.giai_thich, 600), bangChung = clean_(req.bang_chung, 500);
  var out = { diem: 0, nhan_xet: 'Em chưa viết bằng chứng. Hãy ghi rõ em dựa vào đâu (tư liệu nào, quan sát gì trên mô hình).', goi_y: 'Mở "Lịch sử tháp" hoặc click vào bộ phận trên mô hình để tìm bằng chứng.' };
  if (bangChung.length >= 3) {
    var prompt = 'NHẬN ĐỊNH: ' + nhanDinh + '\nĐÁP ÁN CHUẨN: ' + (dapAn ? 'Đúng' : 'Sai') + '\nGIẢI THÍCH CHUẨN: ' + giaiThich +
      '\nHỌC SINH CHỌN: ' + (chon ? 'Đúng' : 'Sai') + '\nBẰNG CHỨNG HỌC SINH VIẾT: ' + bangChung;
    out = gemini_(SYSTEM_JUDGE + '\n\nBỘ TƯ LIỆU THAM KHẢO:\n' + tuLieuText_(), [{ role: 'user', parts: [{ text: prompt }] }], 0.2);
  }
  var diem = Math.max(0, Math.min(2, Number(out.diem) || 0));
  sheet_('Tham_tu', ['Thời gian', 'Lớp', 'Phiên', 'Mã nhận định', 'Nhận định', 'Chọn', 'Đúng/Sai', 'Bằng chứng', 'Điểm bằng chứng (0-2)', 'Nhận xét AI'])
    .appendRow([new Date(), lop, phien, clean_(req.ma, 10), nhanDinh, chon ? 'Đúng' : 'Sai', chon === dapAn ? 'Chọn đúng' : 'Chọn sai', bangChung, diem, String(out.nhan_xet || '')]);
  return { ok: true, diem: diem, nhan_xet: String(out.nhan_xet || ''), goi_y: String(out.goi_y || '') };
}

// ===================== GEMINI =====================
function gemini_(systemText, contents, temperature) {
  var key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!key) throw new Error('Chưa cài GEMINI_API_KEY trong Thuộc tính tập lệnh.');
  var payload = {
    systemInstruction: { parts: [{ text: systemText }] },
    contents: contents,
    generationConfig: { temperature: temperature, maxOutputTokens: 1024, responseMimeType: 'application/json' },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' }
    ]
  };
  var lastErr = '';
  for (var i = 0; i < MODELS.length; i++) {
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODELS[i] + ':generateContent';
    var r = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', headers: { 'x-goog-api-key': key },
      payload: JSON.stringify(payload), muteHttpExceptions: true });
    var code = r.getResponseCode();
    if (code === 200) {
      var data = JSON.parse(r.getContentText());
      var c = data.candidates && data.candidates[0];
      var text = c && c.content && c.content.parts ? c.content.parts.map(function (p) { return p.text || ''; }).join('') : '';
      if (!text) return { tra_loi: 'Trợ lý không trả lời được câu này. Em thử hỏi cách khác về tháp Chăm nhé.', nguon: [], trong_tu_lieu: false, diem: 0, nhan_xet: 'Chưa chấm được, em thử lại nhé.' };
      try { return JSON.parse(text); } catch (e) {
        var m = text.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]); } catch (e2) {} }
        return { tra_loi: text, nguon: [], trong_tu_lieu: true, nhan_xet: text };
      }
    }
    lastErr = code + ' ' + r.getContentText().slice(0, 200);
    if (code !== 404 && code !== 400) break;   // lỗi khác (hết hạn mức…) → không thử model khác
  }
  throw new Error('Gemini: ' + lastErr);
}

// ===================== TIỆN ÍCH =====================
function allow_(phien) {
  var cache = CacheService.getScriptCache(), k = 'rl_' + phien, n = Number(cache.get(k) || 0);
  if (n >= LIMIT_PER_10MIN) return false;
  cache.put(k, String(n + 1), 600); return true;
}
function clean_(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); sh.setFrozenRows(1); sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0b3b44').setFontColor('#ffffff'); }
  return sh;
}
function logEvent_(lop, phien, suKien, chiTiet) {
  sheet_('Su_dung', ['Thời gian', 'Lớp', 'Phiên', 'Sự kiện', 'Chi tiết']).appendRow([new Date(), lop, phien, suKien, chiTiet]);
}

// Chạy 1 lần: tạo các trang tính + trang Tổng hợp có công thức
function setup() {
  sheet_('Hoi_dap', ['Thời gian', 'Lớp', 'Phiên', 'Bộ phận đang chọn', 'Câu hỏi', 'Trả lời', 'Trong tư liệu', 'Nguồn']);
  sheet_('Tham_tu', ['Thời gian', 'Lớp', 'Phiên', 'Mã nhận định', 'Nhận định', 'Chọn', 'Đúng/Sai', 'Bằng chứng', 'Điểm bằng chứng (0-2)', 'Nhận xét AI']);
  sheet_('Su_dung', ['Thời gian', 'Lớp', 'Phiên', 'Sự kiện', 'Chi tiết']);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var th = ss.getSheetByName('Tong_hop') || ss.insertSheet('Tong_hop', 0);
  th.clear();
  var rows = [
    ['TỔNG HỢP MINH CHỨNG – THÁP CHĂM AI', ''],
    ['Số lượt mở app', '=COUNTIF(Su_dung!D:D,"mo_app")'],
    ['Số phiên học (thiết bị) khác nhau', '=IFERROR(COUNTUNIQUE(Su_dung!C2:C),0)'],
    ['Số lần click bộ phận trên mô hình', '=COUNTIF(Su_dung!D:D,"chon_bo_phan")'],
    ['Số câu hỏi gửi Trợ lý AI', '=MAX(0,COUNTA(Hoi_dap!E:E)-1)'],
    ['Tỉ lệ câu hỏi nằm trong tư liệu', '=IFERROR(COUNTIF(Hoi_dap!G:G,"Có")/(COUNTA(Hoi_dap!G:G)-1),0)'],
    ['Số lượt làm Thám tử sử liệu', '=MAX(0,COUNTA(Tham_tu!F:F)-1)'],
    ['Tỉ lệ chọn đúng Đúng/Sai', '=IFERROR(COUNTIF(Tham_tu!G:G,"Chọn đúng")/(COUNTA(Tham_tu!G:G)-1),0)'],
    ['Điểm bằng chứng trung bình (0-2)', '=IFERROR(AVERAGE(Tham_tu!I2:I),0)'],
    ['Tỉ lệ bằng chứng đạt 2 điểm', '=IFERROR(COUNTIF(Tham_tu!I2:I,2)/COUNT(Tham_tu!I2:I),0)']
  ];
  th.getRange(1, 1, rows.length, 2).setValues(rows);
  th.getRange('A1').setFontWeight('bold').setFontSize(14);
  th.getRange('B6').setNumberFormat('0%'); th.getRange('B8').setNumberFormat('0%'); th.getRange('B10').setNumberFormat('0%');
  th.getRange('B9').setNumberFormat('0.00');
  th.setColumnWidth(1, 320);
}

// Kiểm tra nhanh trong trình soạn thảo: chạy testChat() rồi xem Nhật ký thực thi
function testChat() {
  Logger.log(JSON.stringify(chat_({ cau_hoi: 'Tháp Chăm được xây bằng vật liệu gì?' }, 'TEST', 'test')));
}
