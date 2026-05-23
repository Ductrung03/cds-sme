// ============================================================
// TYPES — Hệ thống Đánh giá Chuyển đổi số SME
// ============================================================

// --- Auth ---
export interface User {
  id: string; // GUID từ backend
  email: string;
  hoTen: string;
  soDienThoai?: string;
  tenDoanhnghiep?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// --- Bộ câu hỏi ---
export interface Option {
  id: number;
  maLuaChon: string;
  noiDung: string;
  diem?: number;
  coKhac?: boolean;
}

export interface Question {
  id: number;
  maCauHoi: string;
  noiDung: string;
  nhom: number;
  thuTu: number;
  loai: 'single' | 'multiple' | 'text' | 'rating';
  batBuoc: boolean;
  moTa?: string;
  luaChon: Option[];
  // Nhóm 7: chỉ hiển thị nếu khớp ngành
  phamViNganh?: string[];
}

export interface QuestionGroup {
  nhom: number;
  tenNhom: string;
  moTa?: string;
  cauHois: Question[];
}

export interface Questionnaire {
  id: number;
  tenBoKhaoSat: string;
  moTa?: string;
  phienBan: string;
  nhomCauHois: QuestionGroup[];
  danhSachNganh: Industry[];
}

export interface Industry {
  id: number;
  ma: string;
  ten: string;
}

// --- Bài khảo sát ---
export type AssessmentStatus =
  | 'draft'
  | 'submitted'
  | 'reviewing'
  | 'scored'
  | 'published';

export interface AnswerItem {
  cauHoiId: number;
  luaChonIds: number[];
  dapAnKhac?: string;
}

export interface ExperienceRating {
  rating: number;        // 1-5
  nhanXet?: string;
  /** Điểm doanh nghiệp tự đánh giá 0-100 */
  selfScore?: number;
}

export interface Assessment {
  id: string; // GUID từ backend
  userId: string; // GUID
  boKhaoSatId: number;
  maNganh: string;
  tenNganh?: string;
  trangThai: AssessmentStatus;
  ngayNop?: string;
  ngayTao: string;
  dapAns: AnswerItem[];
  danhGiaTraiNghiem?: ExperienceRating;
}

// --- Kết quả ---
export interface GroupScore {
  nhom: number;
  tenNhom: string;
  diem: number;
  diemToiDa: number;
  tyLe: number;
}

export interface AssessmentResult {
  assessmentId: string; // GUID từ backend
  tongDiem: number;       // 0-100
  capDo: string;          // "Cấp độ 1" ... "Cấp độ 5"
  moTaCapDo?: string;
  diemTheoNhom: GroupScore[];
  ghiChuAdmin?: string;
  ngayCongBo?: string;
}

// --- Admin: danh sách bài ---
export interface AssessmentListItem {
  id: string; // GUID từ backend
  userId: string; // GUID
  hoTen: string;
  email: string;
  soDienThoai?: string;
  tenDoanhnghiep?: string;
  maNganh: string;
  tenNganh?: string;
  ngayNop?: string;
  trangThai: AssessmentStatus;
  nguoiCham?: string;
  tongDiem?: number;
  capDo?: string;
}

// --- Admin: chi tiết bài ---
export interface AnswerDetail {
  cauHoiId: number;
  maCauHoi: string;
  noiDungCauHoi: string;
  nhom: number;
  luaChons: { id: number; noiDung: string; diem?: number }[];
  dapAnKhac?: string;
  /** true nếu option được chọn là loại "Khác" (IsOther=true trong DB) */
  daChonKhac?: boolean;
}

export interface AssessmentDetail {
  id: string; // GUID từ backend
  user: User;
  maNganh: string;
  tenNganh?: string;
  trangThai: AssessmentStatus;
  ngayNop?: string;
  ngayTao: string;
  dapAnChiTiet: AnswerDetail[];
  danhGiaTraiNghiem?: ExperienceRating;
  ketQua?: AssessmentResult;
  boKhaoSat: {
    id: number;
    tenBoKhaoSat: string;
    phienBan: string;
  };
}

// --- AI Review ---
export interface AiReviewItem {
  cauHoiId: number;
  maCauHoi: string;
  noiDungCauHoi: string;
  dapAnKhac: string;
  goiYPhanLoai: string;
  lyDoGoiY: string;
  doDangTin: number;  // 0-1
  luaChonPhuHopId?: number;
}

export interface AiReviewResponse {
  assessmentId: string; // GUID từ backend
  items: AiReviewItem[];
  ghiChuTong?: string;
}

// --- Chấm điểm ---
export interface ScorePayload {
  diemTheoNhom: { nhom: number; diem: number }[];
  ghiChuAdmin?: string;
  lyDoChinhSua?: string;
}

// --- API response wrapper ---
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// --- UI state ---
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// --- Nhóm câu hỏi tên ---
export const TEN_NHOM: Record<number, string> = {
  1: 'Thông tin chung',
  2: 'Chiến lược & Lãnh đạo số',
  3: 'Hạ tầng & Công nghệ',
  4: 'Quy trình & Vận hành số',
  5: 'Nguồn nhân lực số',
  6: 'An toàn thông tin',
  7: 'Tiêu chí đặc thù theo ngành',
};

// --- Trạng thái bài khảo sát ---
export const TRANG_THAI_LABELS: Record<AssessmentStatus, string> = {
  draft: 'Nháp',
  submitted: 'Đã nộp',
  reviewing: 'Đang xét duyệt',
  scored: 'Đã chấm điểm',
  published: 'Đã công bố',
};

// --- Admin Dashboard ---
export interface AdminDashboard {
  tongBaiKhaoSat: number;
  choXetDuyet: number;
  dangXetDuyet: number;
  daChamDiem: number;
  daCongBo: number;
  diemTrungBinh?: number;
  phanBoCapDo: { capDo: string; soLuong: number }[];
  baiCanXuLy: AssessmentListItem[];
}

// --- Cấp độ ---
export const CAP_DO_INFO: Record<string, { mau: string; moTa: string }> = {
  'Cấp độ 1': { mau: '#e5534b', moTa: 'Mức độ cơ bản — chưa bắt đầu chuyển đổi số' },
  'Cấp độ 2': { mau: '#d97706', moTa: 'Mức độ khởi đầu — đã có nhận thức và thử nghiệm' },
  'Cấp độ 3': { mau: '#c9a84c', moTa: 'Mức độ triển khai — đang trong quá trình chuyển đổi' },
  'Cấp độ 4': { mau: '#16a34a', moTa: 'Mức độ trưởng thành — chuyển đổi số rõ rệt' },
  'Cấp độ 5': { mau: '#1e3a5f', moTa: 'Mức độ dẫn đầu — số hóa toàn diện và bền vững' },
};

export interface Solution {
  id: number;
  content: string;
  isOptional: boolean;
  score: number;
}

export interface IndustryQuestion {
  id: number;
  content: string;
  questionType: 'single' | 'multiple' | 'open';
  options: { id: number; content: string; score: number }[];
}

export interface AdminOption {
  id: number;
  questionId?: number;
  code: string;
  content: string;
  score: number;
  isOther: boolean;
  sortOrder: number;
}

export interface AdminQuestion {
  id: number;
  groupId: number;
  groupNumber: number;
  groupName: string;
  code: string;
  content: string;
  questionType: 'single' | 'multiple' | 'open' | 'rating';
  allowOther: boolean;
  isOptional: boolean;
  maxScore: number;
  sortOrder: number;
  industries: { id: number; code: string; name: string }[];
  options: AdminOption[];
}

export interface AdminSolutionDependency {
  id: number;
  dependsOnSolutionId: number;
  dependsOnCode: string;
  dependsOnName: string;
  note: string | null;
}

export interface AdminSolution {
  id: number;
  industryId: number;
  industryCode: string;
  industryName: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  defaultScore: number;
  dependencies: AdminSolutionDependency[];
}

