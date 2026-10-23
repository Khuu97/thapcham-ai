export const SOURCES = [
 {id:'S1',title:'Mỹ Sơn: vật liệu và chức năng',author:'UNESCO World Heritage Centre',url:'https://whc.unesco.org/en/list/949/',section:'Outstanding Universal Value – Brief synthesis',text:'Các đền tháp Mỹ Sơn được xây bằng gạch nung, kết hợp cột đá và phù điêu sa thạch. Nhiều đền thờ các thần Hindu, nổi bật là Shiva. Đây là thông tin về di tích Mỹ Sơn; không nên suy rộng mọi chi tiết cho tất cả tháp Chăm.'},
 {id:'S2',title:'Mỹ Sơn: giao lưu văn hóa',author:'UNESCO World Heritage Centre',url:'https://whc.unesco.org/en/list/949/',section:'Criterion (ii); Date of Inscription',text:'Mỹ Sơn thể hiện sự tiếp nhận và thích ứng của cư dân bản địa với ảnh hưởng văn hóa bên ngoài, nhất là nghệ thuật và kiến trúc Hindu từ Ấn Độ. Di tích được ghi danh Di sản thế giới năm 1999.'},
 {id:'S3',title:'Giới hạn mô hình đang sử dụng',author:'Hồ sơ kỹ thuật Tháp Chăm AI',url:'https://github.com/Khuu97/thapcham-ai',section:'Mô tả học liệu số',text:'Mô hình trong ứng dụng là tháp tổng hợp được tạo bằng AI từ ảnh tham chiếu. Chưa có hồ sơ đo đạc chứng minh mô hình là bản sao chính xác của Po Klong Garai. Không dùng màu sắc, số cửa hoặc tỉ lệ của mô hình làm bằng chứng duy nhất về một di tích thật.'},
 {id:'S4',title:'Quy ước quan sát và lập luận',author:'Hướng dẫn học tập của ứng dụng',url:'',section:'Học liệu hướng dẫn – cần giáo viên rà soát trước tiết dạy',text:'Trong hoạt động này, đế chỉ phần nền đỡ phía dưới; thân là khối đứng chính; mái là phần phía trên thân; chóp là phần cao nhất. Đây là quy ước nhận diện. Khi lập luận cần tách điều quan sát trên mô hình khỏi kết luận về di tích thật. Một nguồn đáng tin vẫn phải có nội dung liên quan trực tiếp tới nhận định.'},
 {id:'S5',title:'Bảo tồn di tích',author:'UNESCO World Heritage Centre',url:'https://whc.unesco.org/en/list/949/',section:'Integrity; Authenticity',text:'Mỹ Sơn từng chịu tổn hại trong chiến tranh; độ ẩm và lũ lụt cũng là các nguy cơ đối với di tích. Nghiên cứu và bảo tồn quan tâm đến vật liệu, thiết kế, kĩ thuật và bối cảnh của công trình.'}
];
const ALL_TASKS = [
 {id:'Q1',kind:'Quan sát',title:'Đọc cấu trúc tháp',prompt:'Quan sát mô hình: mô tả vị trí của đế, thân, mái và chóp. Chọn một dấu hiệu giúp em phân biệt mái với chóp; nêu giới hạn của quan sát này.',sources:['S3','S4'],answer:'Nhận diện theo vị trí tương đối: đế ở dưới, thân là khối chính, mái trên thân, chóp cao nhất. Mô tả điều nhìn thấy và không khẳng định mô hình đại diện chính xác mọi di tích.',hint:'So sánh vị trí và phạm vi của mái với phần cao nhất.',choice:null},
 {id:'Q2',kind:'Quan sát',title:'Màu sắc có đủ không?',prompt:'Nhận định: “Chỉ từ màu đỏ trên mô hình AI, ta đã chứng minh được vật liệu thật của một di tích cụ thể.” Chọn Đúng, Sai hoặc Chưa đủ căn cứ, rồi giải thích bằng chứng cần bổ sung.',sources:['S1','S3'],answer:'Sai: màu mô hình không chứng minh vật liệu di tích. S1 cung cấp thông tin gạch nung của Mỹ Sơn, S3 giới hạn mô hình. Chấp nhận diễn đạt chưa đủ căn cứ nếu giải thích đúng giới hạn bằng chứng.',hint:'Tách màu hiển thị khỏi thông tin vật liệu được tài liệu xác nhận.',choice:'Sai'},
 {id:'Q3',kind:'Kiểm chứng',title:'Có phải Po Klong Garai?',prompt:'Nhận định: “Mô hình này là bản sao chính xác của Po Klong Garai.” Đánh giá mức độ có căn cứ của nhận định bằng hồ sơ mô hình.',sources:['S3'],answer:'Không đủ căn cứ xác nhận sự trùng khớp chính xác. Hồ sơ nói rõ đây là mô hình tổng hợp, không phải hồ sơ phục dựng di tích. Chấp nhận Sai hoặc Chưa đủ căn cứ nếu lí giải đúng.',hint:'Tìm thông tin về cách tạo và hồ sơ đo đạc của mô hình.',choice:'Chưa đủ căn cứ'},
 {id:'Q4',kind:'Kiểm chứng',title:'Đọc đúng thông tin UNESCO',prompt:'Nhận định: “Mỹ Sơn được ghi danh Di sản thế giới năm 1999.” Nêu kết luận, nguồn và giải thích vì sao nguồn đó hỗ trợ nhận định.',sources:['S2'],answer:'Đúng. S2, dựa trên mục Date of Inscription của UNESCO, ghi năm 1999. Cần liên kết đúng thông tin ghi danh với di tích Mỹ Sơn.',hint:'Mở nguồn và kiểm tra mục năm ghi danh.',choice:'Đúng'},
 {id:'Q5',kind:'Lập luận',title:'Phản biện một câu do AI tạo',prompt:'Tình huống giả lập để học: AI nói “Kiến trúc Mỹ Sơn chịu ảnh hưởng Ấn Độ nên chỉ là sự sao chép, không có sự sáng tạo của cư dân bản địa.” Hãy sửa nhận định bằng lập luận có nguồn.',sources:['S1','S2'],answer:'Bác bỏ suy luận ảnh hưởng đồng nghĩa sao chép. S2 nói sự tiếp nhận và thích ứng của cư dân bản địa. Cần phân biệt nguồn ảnh hưởng với cách chủ thể bản địa tiếp nhận.',hint:'Hai từ “ảnh hưởng” và “thích ứng” có cùng nghĩa với sao chép không?',choice:null},
 {id:'Q6',kind:'Lập luận',title:'Viết nhãn giới thiệu có trách nhiệm',prompt:'Viết nhãn giới thiệu 60–100 từ cho mô hình: nói rõ mô hình thể hiện điều gì, một kiến thức có nguồn về Mỹ Sơn, một giới hạn của mô hình và cách kiểm chứng trước khi dùng thông tin.',sources:['S1','S2','S3','S5'],answer:'Nhãn phải phân biệt mô hình tổng hợp và di tích thật, có kiến thức được nguồn hỗ trợ, không bịa độ chính xác hay kích thước; chỉ ra cách kiểm tra nguồn. Độ dài là hướng dẫn, không phải căn cứ duy nhất để chấm.',hint:'Người xem cần biết điều nào là mô phỏng và điều nào được tài liệu xác nhận.',choice:null}
];
// Một tiết học: 3 nhiệm vụ (Quan sát – Kiểm chứng – Lập luận). Các nhiệm vụ khác giữ lại để dùng sau.
export const ACTIVE_TASKS = ['Q1','Q3','Q5'];
export const TASKS = ALL_TASKS.filter(t=>ACTIVE_TASKS.includes(t.id));
export const RUBRIC = [
 {key:'ket_luan',label:'Kết luận',levels:['Chưa có hoặc không phù hợp','Có nhưng chưa rõ hoặc thiếu điều kiện','Rõ và phù hợp phạm vi tư liệu']},
 {key:'bang_chung',label:'Bằng chứng',levels:['Không có hoặc không liên quan','Có nhưng chung chung hoặc nguồn chưa rõ','Cụ thể, liên quan và chỉ rõ nguồn']},
 {key:'giai_thich',label:'Giải thích',levels:['Chưa liên kết với kết luận','Có liên kết nhưng còn thiếu','Liên kết hợp lí, không khái quát quá mức']}
];
export const QUIZ = {
 truoc:[{q:'Màu sắc mô hình AI có tự chứng minh vật liệu thật không?',options:['Có, luôn chính xác','Không, cần đối chiếu tư liệu','Có, nếu nhìn rõ'],answer:1},{q:'Bằng chứng tốt cần điều gì?',options:['Dài và nhiều thuật ngữ','Nhiều người đồng ý','Liên quan nhận định và có nguồn'],answer:2},{q:'Khi nguồn chưa đủ để kết luận, em nên làm gì?',options:['Nêu giới hạn và tìm thêm căn cứ','Đoán theo hình','Tin câu AI trả lời đầu tiên'],answer:0}],
 sau:[{q:'Một hình AI có nhiều cửa giống nhau. Có thể suy ra cửa thật của di tích không?',options:['Không, cần kiểm tra ảnh và hồ sơ di tích','Có, vì hình rất chi tiết','Có, nếu AI khẳng định'],answer:0},{q:'Trích đúng tên UNESCO nhưng nội dung không liên quan nhận định thì sao?',options:['Vẫn là bằng chứng đầy đủ','Chưa hỗ trợ được nhận định','Không cần giải thích nữa'],answer:1},{q:'Cách kết luận có trách nhiệm khi hồ sơ mô hình thiếu số đo là gì?',options:['Khẳng định kích thước chính xác','Tự ước lượng rồi coi là số đo thật','Nêu chưa đủ căn cứ và đề xuất đối chiếu số đo'],answer:2}]
};
export function validateFeedback(out:any, task:any, body:any){
 // Chấp nhận nhiều cách AI trình bày (mảng hoặc đối tượng, điểm dạng chuỗi) rồi chuẩn hóa; chỉ loại khi thiếu hẳn điểm.
 const raw=out&&out.tieu_chi;
 const list:any[]=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?Object.entries(raw).map(([key,v]:any)=>({key,...(typeof v==='object'?v:{diem:v})})):[]);
 const allowed=task.sources;
 const texts=Object.values(body).filter(x=>typeof x==='string') as string[];
 const tieu_chi=RUBRIC.map((r,i)=>{
  const a=list.find((x:any)=>String(x?.key||x?.tieu_chi||'').toLowerCase().replace(/\s+/g,'_')===r.key)||list[i];
  const d=Math.round(Number(a?.diem));
  if(!a||!Number.isFinite(d))throw Error('AI_FORMAT');
  const quote=String(a.trich_dan||'').slice(0,500);
  // Trích dẫn không khớp nguyên văn bài học sinh thì bỏ trích dẫn, không loại cả phản hồi.
  return {key:r.key,diem:Math.max(0,Math.min(2,d)),nhan_xet:String(a.nhan_xet||'Xem lại tiêu chí này.').slice(0,600),trich_dan:(!quote||texts.some(x=>x.includes(quote)))?quote:''};
 });
 // Chỉ giữ nguồn thuộc nhiệm vụ; nếu AI không ghi nguồn hợp lệ thì dùng nguồn của nhiệm vụ.
 const nguon=(Array.isArray(out?.nguon)?out.nguon:[]).filter((x:any)=>allowed.includes(x));
 if(!nguon.length)nguon.push(...allowed);
 const goi_y=String(out?.goi_y||'Đối chiếu lại bài với tiêu chí và tủ tư liệu, rồi sửa phần còn yếu.').slice(0,700);
 return {tieu_chi,tong:tieu_chi.reduce((s,a)=>s+a.diem,0),nguon,goi_y,thay_doi:String(out?.thay_doi||'').slice(0,700),can_gv_xem:out?.can_gv_xem===true};
}
export function recommend(feedback:any){
 if(!feedback)return {task:'Q1',reason:'Bắt đầu với quan sát có hướng dẫn.'};
 const weak=feedback.tieu_chi.reduce((a:any,b:any)=>a.diem<=b.diem?a:b);
 return {task:feedback.tong===6?'Q5':({ket_luan:'Q3',bang_chung:'Q3',giai_thich:'Q5'} as any)[weak.key],reason:feedback.tong===6?'Thử phản biện một câu do AI tạo.':'Luyện thêm tiêu chí '+RUBRIC.find(r=>r.key===weak.key)!.label.toLowerCase()+'.'};
}
