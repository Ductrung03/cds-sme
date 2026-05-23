/* global window, React */
// Mock data for CDS SME

const SECTORS = [
  { id: "S01", name: "Bán lẻ" },
  { id: "S02", name: "Sắt thép" },
  { id: "S03", name: "Du lịch, lữ hành" },
  { id: "S04", name: "Ô tô – xe máy" },
  { id: "S05", name: "Sức khỏe, sắc đẹp" },
  { id: "S06", name: "Môi trường" },
  { id: "S07", name: "Vận tải hành khách" },
  { id: "S08", name: "Giáo dục đào tạo" },
];

const QUESTION_GROUPS = [
  { id: 1, name: "Thông tin chung", weight: 1.0, color: "primary" },
  { id: 2, name: "Hạ tầng và ứng dụng công nghệ số", weight: 1.2, color: "info" },
  { id: 3, name: "Nhận thức và chiến lược chuyển đổi số", weight: 1.0, color: "accent" },
  { id: 4, name: "Rào cản và nhu cầu hỗ trợ", weight: 0.8, color: "warning" },
  { id: 5, name: "Mức tiêu hao điện và mục tiêu phát triển bền vững", weight: 1.0, color: "success" },
  { id: 6, name: "Văn hóa doanh nghiệp số", weight: 0.9, color: "primary" },
  { id: 7, name: "Đánh giá giải pháp ngành nghề", weight: 1.5, color: "danger" },
];

const QUESTIONS = [
  { code: "1.1", group: 1, type: "single", required: true, text: "Số lượng lao động hiện tại của doanh nghiệp?",
    options: ["<10 người", "10–50 người", "51–100 người", "101–200 người", ">200 người"] },
  { code: "1.2", group: 1, type: "single", required: true, text: "Doanh thu năm gần nhất của doanh nghiệp?",
    options: ["<1 tỷ đồng", "1–5 tỷ đồng", "5–20 tỷ đồng", "20–50 tỷ đồng", ">50 tỷ đồng"] },
  { code: "2.1", group: 2, type: "multiple", required: true, text: "Doanh nghiệp sử dụng điện toán đám mây (cloud) trong hoạt động?",
    options: ["Lưu trữ dữ liệu", "Phần mềm SaaS", "Hạ tầng IaaS", "Chưa sử dụng"] },
  { code: "2.2", group: 2, type: "single", required: true, text: "Mức độ tự động hóa quy trình sản xuất/kinh doanh?",
    options: ["Chưa tự động hóa", "Tự động hóa một phần", "Tự động hóa phần lớn", "Tự động hóa hoàn toàn"] },
  { code: "2.3", group: 2, type: "single", required: true, text: "Doanh nghiệp có sử dụng công cụ phân tích dữ liệu không?",
    options: ["Có – công cụ chuyên sâu (BI, AI)", "Có – công cụ cơ bản (Excel)", "Không sử dụng"] },
  { code: "2.4", group: 2, type: "multiple", required: true, text: "Doanh nghiệp áp dụng biện pháp an toàn thông tin nào?",
    options: ["Tường lửa & antivirus", "Sao lưu định kỳ", "Phân quyền truy cập", "Đào tạo nhân viên", "Chứng chỉ bảo mật"] },
  { code: "2.5", group: 2, type: "multiple", required: true, text: "Doanh nghiệp sử dụng kênh giao tiếp khách hàng số?",
    options: ["Website", "Mạng xã hội", "Ứng dụng di động", "Chatbot", "Email marketing"] },
  { code: "2.6", group: 2, type: "single", required: true, text: "Tự đánh giá mức độ thâm nhập công nghệ số?",
    options: ["Mức 1 - Sơ khởi", "Mức 2 - Cơ bản", "Mức 3 - Trung bình", "Mức 4 - Khá", "Mức 5 - Xuất sắc"] },
  { code: "3.1", group: 3, type: "single", required: true, text: "Doanh nghiệp hiểu về chuyển đổi số?",
    options: ["Chưa hiểu", "Hiểu sơ bộ", "Hiểu rõ", "Hiểu sâu sắc"] },
  { code: "3.2", group: 3, type: "single", required: true, text: "Doanh nghiệp có kế hoạch/chiến lược chuyển đổi số?",
    options: ["Chưa có", "Đang xây dựng", "Đã có – chưa triển khai", "Đã có – đang triển khai"] },
  { code: "3.3", group: 3, type: "single", required: true, text: "Doanh nghiệp có người phụ trách chuyển đổi số không?",
    options: ["Chưa có", "Kiêm nhiệm", "Chuyên trách"] },
  { code: "3.4", group: 3, type: "single", required: true, text: "Doanh nghiệp có ngân sách riêng cho chuyển đổi số?",
    options: ["Chưa có", "<5% doanh thu", "5–10% doanh thu", ">10% doanh thu"] },
  { code: "4.1", group: 4, type: "multiple", required: true, text: "Rào cản lớn nhất khi chuyển đổi số?",
    options: ["Thiếu vốn", "Thiếu nhân lực", "Thiếu hiểu biết", "Hạ tầng yếu", "Khó tìm giải pháp phù hợp"] },
  { code: "4.2", group: 4, type: "multiple", required: true, text: "Doanh nghiệp cần hỗ trợ gì để chuyển đổi số?",
    options: ["Tư vấn chiến lược", "Đào tạo nhân lực", "Hỗ trợ tài chính", "Kết nối nhà cung cấp", "Hạ tầng CNTT"] },
  { code: "4.3", group: 4, type: "single", required: true, text: "Doanh nghiệp sẵn sàng đầu tư cho CĐS trong 12 tháng tới?",
    options: ["Không sẵn sàng", "Cân nhắc", "Sẵn sàng đầu tư"] },
];

const SUBMISSIONS = [
  { id: "BKS-0042", company: "Công ty TNHH Du lịch Sài Gòn Trẻ", contact: "Nguyễn Văn An", email: "an.nguyen@sgtravel.vn",
    sector: "S03", status: "submitted", score: null, level: null, submittedAt: "2026-05-16 09:24", aiReviewCount: 3 },
  { id: "BKS-0041", company: "Cơ khí Hoàng Long", contact: "Trần Thị Bình", email: "binh.tran@hoanglong.com",
    sector: "S02", status: "reviewing", score: null, level: null, submittedAt: "2026-05-15 17:08", aiReviewCount: 5 },
  { id: "BKS-0040", company: "Spa Hoa Sen", contact: "Lê Hoàng Cường", email: "cuong.le@hoasenspa.vn",
    sector: "S05", status: "scored", score: 72.4, level: 4, submittedAt: "2026-05-15 11:42", aiReviewCount: 0 },
  { id: "BKS-0039", company: "Vận tải Khang An", contact: "Phạm Mai Dung", email: "dung.pham@khangan.vn",
    sector: "S07", status: "published", score: 58.1, level: 3, submittedAt: "2026-05-14 14:15", aiReviewCount: 0 },
  { id: "BKS-0038", company: "Học viện Edutech VN", contact: "Đỗ Quốc Việt", email: "viet.do@edutech.vn",
    sector: "S08", status: "scored", score: 84.7, level: 5, submittedAt: "2026-05-13 10:01", aiReviewCount: 1 },
  { id: "BKS-0037", company: "Bán lẻ Thành Phát", contact: "Vũ Hoài Linh", email: "linh.vu@tpretail.vn",
    sector: "S01", status: "draft", score: null, level: null, submittedAt: "2026-05-13 08:54", aiReviewCount: 0 },
  { id: "BKS-0036", company: "Xưởng ô tô Đại Phú", contact: "Hoàng Thị Mơ", email: "mo.hoang@daiphu.vn",
    sector: "S04", status: "published", score: 47.6, level: 2, submittedAt: "2026-05-12 16:33", aiReviewCount: 0 },
];

// Phụ lục III – Solutions
const SOLUTIONS = [
  { sector: "S01", code: "S01_01", name: "Hệ thống POS và quản lý bán hàng", depends: null, level: "Tiền đề" },
  { sector: "S01", code: "S01_02", name: "Bán hàng đa kênh (omni-channel)", depends: "S01_01", level: "Phụ thuộc" },
  { sector: "S01", code: "S01_03", name: "Chương trình khách hàng thân thiết & CDP", depends: "S01_01", level: "Phụ thuộc" },
  { sector: "S02", code: "S02_01", name: "Quản lý kho bãi thông minh", depends: null, level: "Tiền đề" },
  { sector: "S02", code: "S02_02", name: "Hệ thống theo dõi đơn hàng số", depends: null, level: "Tiền đề" },
  { sector: "S02", code: "S02_03", name: "Dự báo nhu cầu bằng AI", depends: "S02_02", level: "Phụ thuộc" },
  { sector: "S03", code: "S03_01", name: "Hệ thống đặt tour/đặt phòng trực tuyến", depends: null, level: "Tiền đề" },
  { sector: "S03", code: "S03_02", name: "Chatbot tư vấn du lịch 24/7", depends: "S03_01", level: "Phụ thuộc" },
  { sector: "S03", code: "S03_03", name: "CRM ngành du lịch", depends: null, level: "Tiền đề" },
  { sector: "S04", code: "S04_01", name: "Phần mềm quản lý xưởng dịch vụ", depends: null, level: "Tiền đề" },
  { sector: "S04", code: "S04_02", name: "Hệ thống đặt lịch bảo dưỡng online", depends: "S04_01", level: "Phụ thuộc" },
  { sector: "S04", code: "S04_03", name: "Theo dõi phụ tùng và tồn kho", depends: null, level: "Tiền đề" },
  { sector: "S05", code: "S05_01", name: "Phần mềm đặt lịch hẹn online", depends: null, level: "Tiền đề" },
  { sector: "S05", code: "S05_02", name: "Quản lý hồ sơ khách hàng điện tử", depends: null, level: "Tiền đề" },
  { sector: "S05", code: "S05_03", name: "Marketing tự động", depends: "S05_02", level: "Phụ thuộc" },
  { sector: "S06", code: "S06_01", name: "Hệ thống giám sát môi trường IoT", depends: null, level: "Tiền đề" },
  { sector: "S06", code: "S06_02", name: "Phần mềm quản lý chất thải", depends: null, level: "Tiền đề" },
  { sector: "S07", code: "S07_01", name: "Hệ thống quản lý đội xe GPS", depends: null, level: "Tiền đề" },
  { sector: "S07", code: "S07_02", name: "Nền tảng đặt vé trực tuyến", depends: null, level: "Tiền đề" },
  { sector: "S07", code: "S07_03", name: "Theo dõi hành trình real-time", depends: "S07_01", level: "Phụ thuộc" },
  { sector: "S08", code: "S08_01", name: "Hệ thống quản lý học tập (LMS)", depends: null, level: "Tiền đề" },
  { sector: "S08", code: "S08_02", name: "Nền tảng lớp học trực tuyến", depends: null, level: "Tiền đề" },
  { sector: "S08", code: "S08_03", name: "Quản lý học viên và điểm danh", depends: null, level: "Tiền đề" },
];

const LEVELS = [
  { lv: 1, code: "LV1", name: "Mới bắt đầu", min: 0, max: 20,
    desc: "Doanh nghiệp chưa có hoạt động chuyển đổi số.", color: "#dc2626" },
  { lv: 2, code: "LV2", name: "Cơ bản", min: 21, max: 40,
    desc: "Doanh nghiệp đã có những bước đầu chuyển đổi số.", color: "#ea580c" },
  { lv: 3, code: "LV3", name: "Trung bình", min: 41, max: 60,
    desc: "Doanh nghiệp đã triển khai CĐS ở mức trung bình.", color: "#ca8a04" },
  { lv: 4, code: "LV4", name: "Khá", min: 61, max: 80,
    desc: "Doanh nghiệp có mức độ CĐS khá tốt.", color: "#16a34a" },
  { lv: 5, code: "LV5", name: "Xuất sắc", min: 81, max: 100,
    desc: "Doanh nghiệp dẫn đầu về chuyển đổi số.", color: "#0891b2" },
];

// AI review queue (câu trả lời "Khác")
const AI_REVIEW = [
  { id: 1, sub: "BKS-0042", company: "Công ty TNHH Du lịch Sài Gòn Trẻ", q: "2.5", question: "Kênh giao tiếp khách hàng số?",
    rawAnswer: "Chúng tôi dùng kênh Zalo OA và mạng cộng tác viên facebook để chốt tour",
    aiSuggest: "Mạng xã hội", confidence: 0.94, suggestScore: 3 },
  { id: 2, sub: "BKS-0042", company: "Công ty TNHH Du lịch Sài Gòn Trẻ", q: "4.2", question: "Hỗ trợ cần thiết?",
    rawAnswer: "Cần tư vấn chuyển đổi nền tảng booking từ Excel sang SaaS chuyên ngành du lịch",
    aiSuggest: "Tư vấn chiến lược + Kết nối nhà cung cấp", confidence: 0.88, suggestScore: 4 },
  { id: 3, sub: "BKS-0042", company: "Công ty TNHH Du lịch Sài Gòn Trẻ", q: "3.4", question: "Ngân sách CĐS?",
    rawAnswer: "Khoảng 7-8% doanh thu năm 2025",
    aiSuggest: "5–10% doanh thu", confidence: 0.97, suggestScore: 3 },
  { id: 4, sub: "BKS-0041", company: "Cơ khí Hoàng Long", q: "2.1", question: "Sử dụng cloud?",
    rawAnswer: "Đang dùng Google Workspace và một số file lưu trên Google Drive cho phòng kỹ thuật",
    aiSuggest: "Phần mềm SaaS + Lưu trữ dữ liệu", confidence: 0.91, suggestScore: 2 },
  { id: 5, sub: "BKS-0041", company: "Cơ khí Hoàng Long", q: "4.1", question: "Rào cản?",
    rawAnswer: "Nhân lực kỹ thuật chưa quen với phần mềm, đặt biệt nhóm thợ lành nghề lớn tuổi",
    aiSuggest: "Thiếu nhân lực", confidence: 0.93, suggestScore: 2 },
];

window.CDS_DATA = {
  SECTORS, QUESTION_GROUPS, QUESTIONS, SUBMISSIONS, SOLUTIONS, LEVELS, AI_REVIEW,
};
