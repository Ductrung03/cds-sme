// ============================================================
// API CLIENT — Gọi backend với fallback mock khi dev
// ============================================================

import { adaptQuestionnaire } from './adapter';
import type {
  AdminOption,
  AdminQuestion,
  AdminSolution,
} from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const USE_MOCK = import.meta.env.VITE_MOCK_API === 'true';

// --- Token helpers ---
const TOKEN_KEY = 'cds_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// --- Base fetch ---
class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Xử lý 204 No Content
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (body as { message?: string }).message ?? `Lỗi ${res.status}`,
      body,
    );
  }

  return (body as { data?: T }).data ?? (body as T);
}

// --- Adapter: map backend PascalCase → Frontend Vietnamese keys ---
function mapLoginUser(raw: any): import('@/types').User {
  return {
    id: raw.id ?? raw.Id ?? '',
    email: raw.email ?? raw.Email ?? '',
    hoTen: raw.hoTen ?? raw.fullName ?? raw.FullName ?? '',
    role: raw.role ?? raw.Role ?? 'user',
    soDienThoai: raw.soDienThoai ?? raw.phone ?? raw.Phone ?? undefined,
    tenDoanhnghiep: raw.tenDoanhnghiep ?? raw.organizationName ?? raw.OrganizationName ?? undefined,
    createdAt: raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString(),
  };
}

// --- Auth ---
export interface RegisterPayload {
  email: string;
  matKhau: string;
  hoTen: string;
  soDienThoai?: string;
  tenDoanhnghiep?: string;
}

export const authApi = {
  login: async (email: string, matKhau: string) => {
    const res = await request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: matKhau }),
    });
    return { token: res.token, user: mapLoginUser(res.user) };
  },

  register: async (payload: RegisterPayload) => {
    const res = await request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        password: payload.matKhau,
        fullName: payload.hoTen,
        phone: payload.soDienThoai,
        organizationName: payload.tenDoanhnghiep,
      }),
    });
    return { token: res.token, user: mapLoginUser(res.user) };
  },

  me: async () => {
    const raw = await request<any>('/auth/me');
    return mapLoginUser(raw);
  },
};

// --- Questionnaire ---
export const questionnaireApi = {
  getActive: () =>
    request<any>('/questionnaire/active').then(adaptQuestionnaire),

  getIndustry: (industryId: number) =>
    request<{ questions: any[]; solutions: any[] }>(`/questionnaire/industry/${industryId}`),
};

// --- Assessment (user) ---
export const assessmentApi = {
  createDraft: () =>
    request<{ id: string }>('/assessments/draft', { method: 'POST' }),

  saveAnswers: (id: string, dapAns: import('@/types').AnswerItem[]) => {
    const answers: { questionId: number; optionId?: number; openText?: string; otherText?: string }[] = [];
    for (const item of dapAns) {
      if (item.luaChonIds && item.luaChonIds.length > 0) {
        for (const optId of item.luaChonIds) {
          answers.push({ questionId: item.cauHoiId, optionId: optId, otherText: item.dapAnKhac });
        }
      } else {
        answers.push({ questionId: item.cauHoiId, openText: item.dapAnKhac, otherText: item.dapAnKhac });
      }
    }
    return request<void>(`/assessments/${id}/answers`, {
      method: 'PATCH',
      body: JSON.stringify({ answers }),
    });
  },

  setIndustry: (id: string, industryId: number) =>
    request<void>(`/assessments/${id}/industry`, {
      method: 'PATCH',
      body: JSON.stringify({ industryId }),
    }),

  submit: (id: string, experienceRating?: number, experienceComment?: string, selfScore?: number) =>
    request<{ id: string; status: string }>(`/assessments/${id}/submit`, { 
      method: 'POST',
      body: JSON.stringify({ experienceRating, experienceComment, selfScore }),
    }),

  saveSolutions: (id: string, solutions: { solutionId: number; isSelected: boolean }[]) =>
    request<void>(`/assessments/${id}/solutions`, {
      method: 'PATCH',
      body: JSON.stringify({ solutions }),
    }),

  list: () => request<any[]>('/assessments'),

  getResult: (id: string) =>
    request<import('@/types').AssessmentResult>(`/assessments/${id}/result`),

  getMyAssessments: () =>
    request<import('@/types').AssessmentListItem[]>('/assessments/me'),
};

// --- Admin ---

/** Map backend admin assessment list item → Frontend AssessmentListItem */
function mapAdminListItem(raw: any): import('@/types').AssessmentListItem {
  return {
    id: raw.id ?? raw.Id ?? '',
    userId: raw.userId ?? raw.UserId ?? '',
    // Backend đã fallback contact → user, ta ưu tiên contactName trước
    hoTen: raw.hoTen ?? raw.contactName ?? raw.ContactName ?? raw.fullName ?? raw.FullName ?? '',
    email: raw.email ?? raw.contactEmail ?? raw.ContactEmail ?? '',
    soDienThoai: raw.soDienThoai ?? raw.contactPhone ?? raw.ContactPhone ?? undefined,
    tenDoanhnghiep: raw.tenDoanhnghiep ?? raw.organizationName ?? raw.OrganizationName ?? undefined,
    maNganh: raw.maNganh ?? '',
    tenNganh: raw.tenNganh ?? undefined,
    ngayNop: raw.ngayNop ?? raw.submittedAt ?? raw.SubmittedAt ?? undefined,
    trangThai: raw.trangThai ?? raw.status ?? raw.Status ?? 'draft',
    nguoiCham: raw.nguoiCham ?? undefined,
    tongDiem: raw.tongDiem ?? undefined,
    capDo: raw.capDo ?? undefined,
  };
}

/** Map backend admin detail → Frontend AssessmentDetail */
function mapAdminDetail(raw: any): import('@/types').AssessmentDetail {
  const a = raw.assessment ?? raw;
  const answers = raw.answers ?? [];
  // const solutions = raw.solutions ?? []; // available for future use
  const score = raw.score ?? null;

  // Lấy user info từ assessment hoặc từ data lồng
  const userInfo = mapLoginUser(a.user ?? {
    id: a.userId ?? a.UserId ?? '',
    email: a.contactEmail ?? a.ContactEmail ?? '',
    fullName: a.contactName ?? a.ContactName ?? '',
    organizationName: a.organizationName ?? a.OrganizationName ?? '',
    phone: a.contactPhone ?? a.ContactPhone ?? '',
    role: 'user',
  });

  return {
    id: a.id ?? a.Id ?? '',
    user: userInfo,
    maNganh: a.maNganh ?? '',
    tenNganh: a.tenNganh ?? undefined,
    trangThai: a.trangThai ?? a.status ?? a.Status ?? 'draft',
    ngayNop: a.ngayNop ?? a.submittedAt ?? a.SubmittedAt ?? undefined,
    ngayTao: a.ngayTao ?? a.createdAt ?? a.CreatedAt ?? new Date().toISOString(),
    dapAnChiTiet: answers.map((ans: any) => ({
      cauHoiId: ans.questionId ?? ans.QuestionId ?? 0,
      maCauHoi: ans.maCauHoi ?? ans.questionCode ?? ans.QuestionCode ?? '',
      noiDungCauHoi: ans.noiDungCauHoi ?? ans.questionContent ?? ans.QuestionContent ?? '',
      nhom: ans.nhom ?? ans.groupNumber ?? ans.GroupNumber ?? 0,
      luaChons: (() => {
        if (ans.optionId ?? ans.OptionId) {
          return [{
            id: ans.optionId ?? ans.OptionId,
            noiDung: ans.optionContent ?? ans.OptionContent ?? '',
            diem: ans.optionScore ?? ans.OptionScore ?? undefined,
          }];
        }
        return [];
      })(),
      dapAnKhac: ans.dapAnKhac ?? ans.otherText ?? ans.OtherText ?? undefined,
      daChonKhac: !!(ans.optionIsOther ?? ans.daChonKhac ?? false),
    })),
    ketQua: score ? {
      assessmentId: a.id ?? a.Id ?? '',
      tongDiem: score.normalizedScore ?? score.NormalizedScore ?? 0,
      capDo: score.rankName ?? score.RankName ?? '',
      moTaCapDo: score.rankDescription ?? undefined,
      diemTheoNhom: (() => {
        if (score.groupBreakdown?.groups) {
          return score.groupBreakdown.groups.map((g: any) => ({
            nhom: g.groupNumber ?? g.GroupNumber ?? 0,
            tenNhom: g.name ?? g.Name ?? '',
            diem: g.normalizedGroupScore ?? g.NormalizedGroupScore ?? 0,
            diemToiDa: g.maxScore ?? g.MaxScore ?? 100,
            tyLe: g.normalizedGroupScore ?? g.NormalizedGroupScore ?? 0,
          }));
        }
        return [];
      })(),
      ghiChuAdmin: score.adminComment ?? undefined,
      ngayCongBo: a.publishedAt ?? a.PublishedAt ?? undefined,
    } : undefined,
    boKhaoSat: {
      id: a.questionnaireId ?? a.QuestionnaireId ?? 0,
      tenBoKhaoSat: a.questionnaireName ?? '',
      phienBan: a.questionnaireVersion ?? '',
    },
  };
}

export const adminApi = {
  listAssessments: async (params?: { trangThai?: string; page?: number; limit?: number }) => {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : '';
    const raw = await request<any>(`/admin/assessments${qs}`);
    // Backend returns either plain array or { items, total }
    const arr = Array.isArray(raw) ? raw : (raw?.items ?? raw?.data ?? []);
    const total = raw?.total ?? arr.length;
    return {
      items: arr.map(mapAdminListItem),
      total,
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    } as import('@/types').PaginatedResponse<import('@/types').AssessmentListItem>;
  },

  getDetail: async (id: string) => {
    const raw = await request<any>(`/admin/assessments/${id}`);
    return mapAdminDetail(raw);
  },

  getAiReview: async (id: string) => {
    const raw = await request<any>(`/admin/assessments/${id}/ai-review`, { method: 'POST' });
    // Backend returns { results: [...] }
    const arr = raw?.items ?? raw?.results ?? [];
    return {
      assessmentId: id,
      items: arr.map((r: any) => ({
        cauHoiId: r.questionId ?? r.cauHoiId ?? 0,
        maCauHoi: r.questionCode ?? r.maCauHoi ?? '',
        noiDungCauHoi: r.questionContent ?? r.noiDungCauHoi ?? '',
        dapAnKhac: r.answerText ?? r.dapAnKhac ?? '',
        goiYPhanLoai: r.suggestion ?? r.goiYPhanLoai ?? '',
        lyDoGoiY: r.reason ?? r.lyDoGoiY ?? '',
        doDangTin: r.confidence ?? r.doDangTin ?? 0,
        luaChonPhuHopId: r.suggestedOptionId ?? r.luaChonPhuHopId ?? undefined,
      })),
    } as import('@/types').AiReviewResponse;
  },

  getAiReviewQuestion: async (assessmentId: string, questionId: number) => {
    const raw = await request<any>(
      `/admin/assessments/${assessmentId}/questions/${questionId}/ai-review`,
      { method: 'POST' }
    );
    return {
      cauHoiId: raw?.questionId ?? questionId,
      goiYPhanLoai: raw?.suggestion ?? '',
      doDangTin: raw?.confidence ?? 0,
      isRelevant: raw?.isRelevant ?? true,
    };
  },

  score: (id: string, payload: import('@/types').ScorePayload) =>
    request<void>(`/admin/assessments/${id}/score`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  publish: (id: string) =>
    request<void>(`/admin/assessments/${id}/publish`, { method: 'POST' }),

  getDashboard: () =>
    request<import('@/types').AdminDashboard>('/admin/dashboard'),

  // ---- Quản lý câu hỏi ----
  listQuestions: (filter?: { groupNumber?: number; industryId?: number }) => {
    const params = new URLSearchParams();
    if (filter?.groupNumber) params.set('nhom', String(filter.groupNumber));
    if (filter?.industryId) params.set('industryId', String(filter.industryId));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{
      industries: { id: number; code: string; name: string }[];
      items: AdminQuestion[];
    }>(`/admin/questions${qs}`);
  },

  updateQuestion: (id: number, patch: Partial<{
    content: string;
    questionType: 'single' | 'multiple' | 'open';
    allowOther: boolean;
    isOptional: boolean;
    maxScore: number;
    sortOrder: number;
  }>) =>
    request<{ id: number; message: string }>(`/admin/questions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  createOption: (questionId: number, payload: {
    code: string;
    content: string;
    score: number;
    isOther?: boolean;
    sortOrder?: number;
  }) =>
    request<AdminOption>(`/admin/questions/${questionId}/options`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateOption: (id: number, patch: Partial<{
    code: string;
    content: string;
    score: number;
    isOther: boolean;
    sortOrder: number;
  }>) =>
    request<{ id: number; message: string }>(`/admin/options/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteOption: (id: number) =>
    request<{ id: number; message: string }>(`/admin/options/${id}`, {
      method: 'DELETE',
    }),

  // ---- Phụ lục III ----
  listAppendix: (industryId?: number) => {
    const qs = industryId ? `?industryId=${industryId}` : '';
    return request<{
      industries: { id: number; code: string; name: string }[];
      items: AdminSolution[];
    }>(`/admin/appendix-iii${qs}`);
  },

  createSolution: (payload: {
    industryId: number;
    code: string;
    name: string;
    description?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }) =>
    request<AdminSolution>(`/admin/solutions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSolution: (id: number, patch: Partial<{
    code: string;
    name: string;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
  }>) =>
    request<{ id: number; message: string }>(`/admin/solutions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteSolution: (id: number) =>
    request<{ id: number; message: string }>(`/admin/solutions/${id}`, {
      method: 'DELETE',
    }),

  createDependency: (payload: {
    solutionId: number;
    dependsOnSolutionId: number;
    note?: string | null;
  }) =>
    request<{
      id: number;
      solutionId: number;
      dependsOnSolutionId: number;
      note: string | null;
    }>(`/admin/solution-dependencies`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteDependency: (id: number) =>
    request<{ id: number; message: string }>(
      `/admin/solution-dependencies/${id}`,
      { method: 'DELETE' },
    ),

  // ---- Cấu hình điểm (RankThresholds + Group Weights) ----
  getScoreConfig: () =>
    request<ScoreConfig>(`/admin/score-config`),

  updateRankThreshold: (
    id: number,
    patch: Partial<{
      name: string;
      minScore: number;
      maxScore: number;
      description: string | null;
    }>,
  ) =>
    request<RankThresholdItem & { message: string }>(
      `/admin/score-config/rank-thresholds/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    ),

  updateGroupWeight: (id: number, weight: number) =>
    request<GroupWeightItem & { message: string }>(
      `/admin/score-config/group-weights/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ weight }),
      },
    ),
};

// ---- Score config types ----
export interface RankThresholdItem {
  id: number;
  level: number;
  code: string;
  name: string;
  minScore: number;
  maxScore: number;
  description: string | null;
}

export interface GroupWeightItem {
  id: number;
  groupNumber: number;
  name: string;
  weight: number;
  isOptional: boolean;
  isIndustrySpecific: boolean;
}

export interface ScoreConfigRuleItem {
  key: string;
  title: string;
  detail: string;
}

export interface ScoreConfigRules {
  algorithm: string;
  scoreRange: { min: number; max: number };
  description: string;
  items: ScoreConfigRuleItem[];
}

export interface ScoreConfig {
  rankThresholds: RankThresholdItem[];
  groupWeights: GroupWeightItem[];
  rules: ScoreConfigRules;
}

// --- Admin types ---
// --- Export error type ---
export { ApiError };
export const isMock = USE_MOCK;

// Re-export Admin types from canonical source for backwards compat
export type {
  AdminOption,
  AdminQuestion,
  AdminSolutionDependency,
  AdminSolution,
} from '@/types';
