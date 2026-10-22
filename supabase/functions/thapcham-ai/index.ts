// Tháp Chăm AI – hàm máy chủ (Supabase Edge Function "thapcham-ai")
// Chỉ đọc/ghi khu riêng "thapcham", không đụng dữ liệu app Quản lí học tập.
// Bí mật cần có: GEMINI_API_KEY (Edge Functions → Secrets).
import postgres from "npm:postgres@3.4.4";
import { CLAIMS } from "./legacy.ts";
import { cycle, hash, limit, teacher } from "./cycle.ts";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 3 });
const MODELS = ["gemini-2.5-flash", "gemini-flash-latest"];
const LIMIT_PER_10MIN = 25;

// ===== BỘ TƯ LIỆU (giáo viên duyệt & chỉnh) =====
const TU_LIEU = [
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

const SYSTEM_CHAT =
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

const SYSTEM_JUDGE =
  'Bạn là giáo viên Lịch sử chấm phần "Thám tử sử liệu" của học sinh lớp 10.\n' +
  'Học sinh được đưa một NHẬN ĐỊNH, chọn Đúng/Sai và viết BẰNG CHỨNG. Đáp án và giải thích chuẩn đã được cung cấp.\n' +
  'Hãy đánh giá PHẦN BẰNG CHỨNG học sinh viết (không chỉ việc chọn đúng/sai):\n' +
  '- diem: 0 (không có/không liên quan), 1 (có nhưng chung chung hoặc chưa chính xác), 2 (cụ thể, chính xác, có căn cứ từ tư liệu hoặc quan sát).\n' +
  '- nhan_xet: 1–3 câu tiếng Việt, khen điểm tốt, chỉ ra điểm cần sửa, giọng khích lệ. Không bịa thông tin ngoài tư liệu.\n' +
  '- goi_y: 1 câu gợi ý cách tìm bằng chứng tốt hơn.\n' +
  'Trả về JSON: {"diem": number, "nhan_xet": string, "goi_y": string}';

const tuLieuText = TU_LIEU.map((t) => `[${t.id}] (${t.nguon}) ${t.noidung}`).join("\n");
const nguonMap: Record<string, string> = Object.fromEntries(TU_LIEU.map((t) => [t.id, t.nguon]));
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
const clean = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
const score = (v: unknown) => { const n = Number(v); return n >= 1 && n <= 5 ? Math.round(n) : null; };

async function allow(table: "hoi_dap" | "tham_tu", phien: string) {
  const [{ n }] = table === "hoi_dap"
    ? await sql`select count(*)::int n from thapcham.hoi_dap where phien=${phien} and tg > now() - interval '10 minutes'`
    : await sql`select count(*)::int n from thapcham.tham_tu where phien=${phien} and tg > now() - interval '10 minutes'`;
  return n < LIMIT_PER_10MIN;
}

// Bounded retry for transient Gemini failures. Keep requests below the client 55s timeout.
async function gemini(systemText: string, contents: unknown[], temperature: number): Promise<any> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_KEY_MISSING");
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemText }] }, contents,
    generationConfig: { temperature, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 }, responseMimeType: "application/json" },
    safetySettings: ["HARM_CATEGORY_HARASSMENT", "HARM_CATEGORY_HATE_SPEECH", "HARM_CATEGORY_SEXUALLY_EXPLICIT", "HARM_CATEGORY_DANGEROUS_CONTENT"].map((category) => ({ category, threshold: "BLOCK_LOW_AND_ABOVE" })),
  });
  const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
  const deadline = Date.now() + 44000;
  let last = "UNKNOWN";
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining < 2500) throw new Error("GEMINI_BUSY");
      let status = 0;
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body, signal: AbortSignal.timeout(Math.min(16000, remaining - 1000))
        });
        status = response.status;
        if (response.ok) {
          const data = await response.json();
          const answer = (data.candidates?.[0]?.content?.parts ?? []).map((part: any) => part.text ?? "").join("");
          if (!answer) throw new Error("GEMINI_EMPTY");
          let parsed: any;
          try { parsed = JSON.parse(answer); }
          catch { throw new Error("GEMINI_INVALID_JSON"); }
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("GEMINI_INVALID_JSON");
          return parsed;
        }
        const errorText = (await response.text()).slice(0, 250);
        last = `${status}: ${errorText}`;
        if (status === 401 || status === 403) throw new Error("GEMINI_AUTH");
        if (![404, 429, 500, 502, 503, 504].includes(status)) throw new Error("GEMINI_REQUEST_FAILED");
        if (status === 404) break; // unavailable model: switch model immediately
      } catch (error) {
        const code = (error as Error).message || "";
        if (["GEMINI_AUTH", "GEMINI_REQUEST_FAILED", "GEMINI_EMPTY", "GEMINI_INVALID_JSON"].includes(code)) throw error;
        last = code || last;
      }
      if (attempt === 0 && status !== 404) {
        const pause = 650 + Math.floor(Math.random() * 300);
        if (Date.now() + pause + 2500 < deadline) await sleep(pause);
      }
    }
  }
  console.error("Gemini exhausted models and retries:", last);
  throw new Error("GEMINI_BUSY");
}

async function chat(req: any, lop: string, phien: string) {
  const q = clean(req.cau_hoi, 400);
  if (!q) return { ok: false, error: "Câu hỏi trống." };
  if (!(await allow("hoi_dap", phien))) return { ok: false, error: "Em hỏi hơi nhanh rồi, nghỉ vài phút rồi hỏi tiếp nhé!" };
  const bo_phan = clean(req.bo_phan, 40);
  const history = (Array.isArray(req.lich_su) ? req.lich_su : []).slice(-6).map((h: any) => ({ role: h.role === "model" ? "model" : "user", parts: [{ text: clean(h.text, 600) }] }));
  const userText = (bo_phan ? `(Học sinh đang chọn bộ phận trên mô hình: ${bo_phan})\n` : "") + "Câu hỏi: " + q;
  const out = await gemini(SYSTEM_CHAT + "\n\nBỘ TƯ LIỆU:\n" + tuLieuText, [...history, { role: "user", parts: [{ text: userText }] }], 0.3);
  const nguon = (Array.isArray(out.nguon) ? out.nguon : []).filter((id: string) => nguonMap[id]).map((id: string) => ({ id, ten: nguonMap[id] }));
  const res = { ok: true, tra_loi: String(out.tra_loi ?? ""), nguon, trong_tu_lieu: out.trong_tu_lieu !== false, cau_hoi_goi_mo: String(out.cau_hoi_goi_mo ?? "") };
  await sql`insert into thapcham.hoi_dap (lop, phien, bo_phan, cau_hoi, tra_loi, trong_tu_lieu, nguon) values (${lop}, ${phien}, ${bo_phan}, ${q}, ${res.tra_loi}, ${res.trong_tu_lieu}, ${nguon.map((n: any) => n.id).join(", ")})`;
  return res;
}

async function judge(req: any, lop: string, phien: string) {
  if (!(await allow("tham_tu", phien))) return { ok: false, error: "Em làm hơi nhanh rồi, nghỉ một chút nhé!" };
  const claim = CLAIMS.find(c => c.ma === req.ma);
  if (!claim || typeof req.chon !== "boolean") return {ok:false,error:"Nhận định không hợp lệ."};
  const nhanDinh = claim.text, dapAn = claim.dung, chon = req.chon;
  const bangChung = clean(req.bang_chung, 500);
  let out: any = { diem: 0, nhan_xet: "Em chưa viết bằng chứng. Hãy ghi rõ em dựa vào đâu (tư liệu nào, quan sát gì trên mô hình).", goi_y: 'Mở "Lịch sử tháp" hoặc click vào bộ phận trên mô hình để tìm bằng chứng.' };
  if (bangChung.length >= 3) {
    const prompt = `NHẬN ĐỊNH: ${nhanDinh}\nĐÁP ÁN CHUẨN: ${dapAn ? "Đúng" : "Sai"}\nGIẢI THÍCH CHUẨN: ${claim.giai}\nHỌC SINH CHỌN: ${chon ? "Đúng" : "Sai"}\nBẰNG CHỨNG HỌC SINH VIẾT: ${bangChung}`;
    out = await gemini(SYSTEM_JUDGE + "\n\nBỘ TƯ LIỆU THAM KHẢO:\n" + tuLieuText, [{ role: "user", parts: [{ text: prompt }] }], 0.2);
  }
  const diem = Math.max(0, Math.min(2, Math.round(Number(out.diem) || 0)));
  await sql`insert into thapcham.tham_tu (lop, phien, ma, nhan_dinh, chon, chon_dung, bang_chung, diem, nhan_xet) values (${lop}, ${phien}, ${clean(req.ma, 10)}, ${nhanDinh}, ${chon}, ${chon === dapAn}, ${bangChung}, ${diem}, ${String(out.nhan_xet ?? "")})`;
  return { ok: true, diem, nhan_xet: String(out.nhan_xet ?? ""), goi_y: String(out.goi_y ?? "") };
}

async function stats(req: any) {
  const [{ gia_tri }] = await sql`select gia_tri from thapcham.cau_hinh where khoa='ma_giao_vien'`;
  if (!(await teacher(sql, req)) && clean(req.ma_gv, 20).toUpperCase() !== gia_tri) { await new Promise((ok) => setTimeout(ok, 800)); return { ok: false, error: "Sai mã giáo viên." }; }
  const lop = clean(req.loc_lop, 12);
  const f = lop ? sql`where lop = ${lop}` : sql``;
  const [tong] = await sql`select
    (select count(*) from thapcham.su_dung ${f} ${lop ? sql`and` : sql`where`} su_kien='mo_app')::int mo_app,
    (select count(distinct phien) from thapcham.su_dung ${f})::int so_phien,
    (select count(*) from thapcham.su_dung ${f} ${lop ? sql`and` : sql`where`} su_kien='chon_bo_phan')::int click_bo_phan,
    (select count(*) from thapcham.hoi_dap ${f})::int cau_hoi,
    (select coalesce(avg(trong_tu_lieu::int),0)::float from thapcham.hoi_dap ${f}) ti_le_trong_tu_lieu,
    (select count(*) from thapcham.tham_tu ${f})::int luot_tham_tu,
    (select coalesce(avg(chon_dung::int),0)::float from thapcham.tham_tu ${f}) ti_le_chon_dung,
    (select coalesce(avg(diem),0)::float from thapcham.tham_tu ${f}) diem_bang_chung_tb,
    (select coalesce(avg(chon_dung::int),0)::float from thapcham.tham_tu ${f} ${lop ? sql`and` : sql`where`} ma like 'A%') ti_le_phat_hien_loi_ai`;
  const khao_sat = await sql`select loai, count(*)::int n, avg(c1)::float c1, avg(c2)::float c2, avg(c3)::float c3, avg(c4)::float c4 from thapcham.khao_sat ${f} group by loai`;
  const theo_lop = await sql`select coalesce(lop,'Khách') lop, count(distinct phien)::int so_phien, count(*)::int luot from thapcham.su_dung group by 1 order by 2 desc limit 30`;
  const nhan_dinh = await sql`select ma, count(*)::int luot, avg(chon_dung::int)::float ti_le_dung, avg(diem)::float diem_tb from thapcham.tham_tu ${f} group by ma order by ma`;
  const cau_hoi = await sql`select tg, lop, bo_phan, cau_hoi, tra_loi, trong_tu_lieu, nguon from thapcham.hoi_dap ${f} order by tg desc limit 300`;
  const y_kien = await sql`select tg, lop, y_kien from thapcham.khao_sat ${f} ${lop ? sql`and` : sql`where`} coalesce(y_kien,'') <> '' order by tg desc limit 200`;
  return { ok: true, tong, khao_sat, theo_lop, nhan_dinh, cau_hoi, y_kien };
}

Deno.serve(async (r) => {
  if (r.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (r.method !== "POST") return json({ ok: true, app: "Thap Cham AI" });
  try {
    if (Number(r.headers.get("content-length") || 0) > 20000) return json({ok:false,error:"Nội dung quá dài."},413);
    const raw = await r.text();
    if (raw.length > 20000) return json({ok:false,error:"Nội dung quá dài."},413);
    const req = JSON.parse(raw || "{}");
    const ip = await hash(r.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown");
    if (["catalog","teacher_login","teacher_logout","learning_dashboard","teacher_review","enroll","progress","assessment","solution","hint","submit_attempt"].includes(req.action)) return json(await cycle(req,sql,gemini,ip));
    if (req.action === "resources") return json({ok:true,sources:TU_LIEU});
    if (["chat","judge"].includes(req.action)) {await limit(sql,"legacy-ai:"+ip,40);await limit(sql,"global-ai",400,86400);}
    if(req.action === "stats" && !(await teacher(sql,req))) await limit(sql,"teacher:"+ip,8);
    const lop = clean(req.lop, 12).toUpperCase() || "KHÁCH", phien = clean(req.phien, 40) || "na";
    switch (req.action) {
      case "chat": return json(await chat(req, lop, phien));
      case "judge": return json(await judge(req, lop, phien));
      case "survey":
        await sql`insert into thapcham.khao_sat (lop, phien, loai, c1, c2, c3, c4, y_kien) values (${lop}, ${phien}, ${req.loai === "sau" ? "sau" : "truoc"}, ${score(req.c1)}, ${score(req.c2)}, ${score(req.c3)}, ${score(req.c4)}, ${clean(req.y_kien, 300)})`;
        return json({ ok: true });
      case "log":
        await sql`insert into thapcham.su_dung (lop, phien, su_kien, chi_tiet) values (${lop}, ${phien}, ${clean(req.su_kien, 40)}, ${clean(req.chi_tiet, 200)})`;
        return json({ ok: true });
      case "stats": return json(await stats(req));
      default: return json({ ok: false, error: "Hành động không hợp lệ" });
    }
  } catch (e) {
    console.error(e);
    const code=(e as Error).message;
    const messages:Record<string,string>={AUTH:"Phiên giáo viên hết hạn hoặc mã chưa đúng.",SESSION:"Phiên học chưa hợp lệ. Hãy vào lại phòng học.",CONSENT:"Cần xác nhận thông tin dữ liệu trước khi bắt đầu.",INPUT:"Kiểm tra lại các trường thông tin.",RATE_LIMIT:"Đã đạt giới hạn lượt sử dụng. Vui lòng thử lại sau.",FINISH_TASKS:"Hãy nộp đủ ba nhiệm vụ trước khi làm phiếu cuối.",PRE_FIRST:"Hãy làm phiếu đầu vào trước.",GEMINI_KEY_MISSING:"Trợ lý AI chưa được cấu hình (thiếu GEMINI_API_KEY).",GEMINI_AUTH:"Trợ lý AI bị Google từ chối (key sai hoặc bị chặn).",GEMINI_BUSY:"Trợ lý AI đang quá tải, em thử lại sau ít phút.",REVISE_FIRST:"Hãy nộp bài và chờ xử lí trước khi tiếp tục."};
    return json({ok:false,error:messages[code]||"Máy chủ chưa xử lí được. Bản nháp trên thiết bị vẫn được giữ.",code:messages[code]?code:"SERVER"},code==="AUTH"?401:400);
  }
});
