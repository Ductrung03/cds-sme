import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/api/client';
import type { AdminQuestion, AdminOption } from '@/types';
import { Button, Card, Badge, EmptyState, Drawer } from '@/components/ui/index';
import { Pagination } from '@/components/ui/Pagination';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

// ============================================================
// Form state for editing a question
// ============================================================
interface EditDraft {
  content: string;
  questionType: 'single' | 'multiple' | 'open';
  allowOther: boolean;
  isOptional: boolean;
  maxScore: string;
  sortOrder: string;
}

function makeDraft(q: AdminQuestion): EditDraft {
  return {
    content: q.content,
    questionType: q.questionType === 'rating' ? 'single' : q.questionType,
    allowOther: q.allowOther,
    isOptional: q.isOptional,
    maxScore: String(q.maxScore),
    sortOrder: String(q.sortOrder),
  };
}

// ============================================================
// Edit Drawer
// ============================================================
interface EditDrawerProps {
  question: AdminQuestion | null;
  onClose: () => void;
  onSaved: () => void;
}

// Form state cho 1 option (string-backed để bind input)
interface OptionDraft {
  id?: number;          // Có id = đã có trong DB; không id = mới
  code: string;
  content: string;
  score: string;        // string để giữ input thô
  isOther: boolean;
  sortOrder: string;
  _dirty?: boolean;     // đã chỉnh sửa
  _deleted?: boolean;   // đánh dấu xoá (chỉ với option đã có id)
}

function optionFromAdmin(o: AdminOption): OptionDraft {
  return {
    id: o.id,
    code: o.code,
    content: o.content,
    score: String(o.score),
    isOther: !!o.isOther,
    sortOrder: String(o.sortOrder ?? 0),
  };
}

function EditDrawer({ question, onClose, onSaved }: EditDrawerProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [options, setOptions] = useState<OptionDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (question) {
      setDraft(makeDraft(question));
      setOptions(question.options.map(optionFromAdmin));
      setError(null);
    }
  }, [question]);

  const handleChange = <K extends keyof EditDraft>(field: K, value: EditDraft[K]) => {
    setDraft((prev) => prev ? { ...prev, [field]: value } : prev);
    setError(null);
  };

  // --- Option helpers ---
  const updateOptionDraft = (idx: number, patch: Partial<OptionDraft>) => {
    setOptions((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, ...patch, _dirty: true } : o))
    );
    setError(null);
  };

  const addOption = () => {
    const existingCodes = new Set(options.filter((o) => !o._deleted).map((o) => o.code.toUpperCase()));
    let suggestedCode = '';
    for (let i = 0; i < 26; i++) {
      const c = String.fromCharCode(65 + i);
      if (!existingCodes.has(c)) { suggestedCode = c; break; }
    }
    const nextSortOrder = Math.max(0, ...options.filter((o) => !o._deleted).map((o) => Number(o.sortOrder) || 0)) + 1;
    setOptions((prev) => [
      ...prev,
      {
        code: suggestedCode || `O${prev.length + 1}`,
        content: '',
        score: '0',
        isOther: false,
        sortOrder: String(nextSortOrder),
        _dirty: true,
      },
    ]);
  };

  const toggleDeleteOption = (idx: number) => {
    setOptions((prev) =>
      prev
        .map((o, i) => {
          if (i !== idx) return o;
          // Nếu là option mới (chưa có id) thì bỏ luôn khỏi list
          if (!o.id) return { ...o, _deleted: true };
          return { ...o, _deleted: !o._deleted };
        })
        .filter((o) => !(o._deleted && !o.id))
    );
  };

  const validateOptions = (): string | null => {
    const visible = options.filter((o) => !o._deleted);
    const codes = new Set<string>();
    for (const o of visible) {
      const code = o.code.trim();
      if (!code) return 'Mã đáp án không được để trống.';
      if (code.length > 20) return 'Mã đáp án không quá 20 ký tự.';
      const key = code.toUpperCase();
      if (codes.has(key)) return `Mã đáp án "${code}" bị trùng. Vui lòng kiểm tra lại.`;
      codes.add(key);

      if (!o.content.trim()) return 'Nội dung đáp án không được để trống.';
      const score = parseFloat(o.score);
      if (Number.isNaN(score) || score < 0 || score > 100) return 'Điểm đáp án phải là số từ 0 đến 100.';
      const sortOrder = parseInt(o.sortOrder, 10);
      if (Number.isNaN(sortOrder) || sortOrder < 0) return 'Thứ tự đáp án phải là số nguyên không âm.';
    }
    return null;
  };

  const handleSave = async () => {
    if (!question || !draft) return;

    const maxScore = parseFloat(draft.maxScore);
    const sortOrder = parseInt(draft.sortOrder, 10);

    if (!draft.content.trim()) {
      setError('Nội dung câu hỏi không được để trống.');
      return;
    }
    if (Number.isNaN(maxScore) || maxScore < 0 || maxScore > 100) {
      setError('Điểm tối đa phải là số từ 0 đến 100.');
      return;
    }
    if (Number.isNaN(sortOrder) || sortOrder < 0) {
      setError('Thứ tự sắp xếp phải là số nguyên không âm.');
      return;
    }

    const optError = validateOptions();
    if (optError) {
      setError(optError);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // 1) Cập nhật câu hỏi
      await adminApi.updateQuestion(question.id, {
        content: draft.content.trim(),
        questionType: draft.questionType,
        allowOther: draft.allowOther,
        isOptional: draft.isOptional,
        maxScore,
        sortOrder,
      });

      // 2) Xử lý options
      let optionErrors = 0;
      // Xoá trước
      for (const o of options) {
        if (o.id && o._deleted) {
          try {
            await adminApi.deleteOption(o.id);
          } catch (err: any) {
            optionErrors++;
            toastError(err?.message || `Không xoá được đáp án ${o.code}.`);
          }
        }
      }
      // Cập nhật + tạo mới
      for (const o of options) {
        if (o._deleted) continue;
        const payload = {
          code: o.code.trim(),
          content: o.content.trim(),
          score: parseFloat(o.score),
          isOther: !!o.isOther,
          sortOrder: parseInt(o.sortOrder, 10) || 0,
        };
        try {
          if (o.id) {
            if (o._dirty) {
              await adminApi.updateOption(o.id, payload);
            }
          } else {
            await adminApi.createOption(question.id, payload);
          }
        } catch (err: any) {
          optionErrors++;
          toastError(err?.message || `Không lưu được đáp án ${o.code}.`);
        }
      }

      if (optionErrors === 0) {
        toastSuccess('Đã lưu câu hỏi và đáp án thành công.');
      } else {
        toastSuccess('Đã lưu câu hỏi. Một số đáp án không lưu được, xem chi tiết bên trên.');
      }
      onSaved();
    } catch (err: any) {
      const msg = err?.message || 'Lỗi khi lưu câu hỏi. Vui lòng thử lại.';
      setError(msg);
      toastError(msg);
    } finally {
      setSaving(false);
    }
  };

  const QUESTION_TYPE_LABELS: Record<string, string> = {
    single: 'Một lựa chọn',
    multiple: 'Nhiều lựa chọn',
    open: 'Câu hỏi mở',
  };

  return (
    <Drawer
      open={!!question}
      onClose={onClose}
      title={question ? `Chỉnh sửa câu hỏi ${question.code}` : 'Chỉnh sửa câu hỏi'}
      width={560}
      foot={
        <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Huỷ
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Lưu thay đổi
          </Button>
        </div>
      }
    >
      {!draft ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Thông tin cơ bản */}
          {question && (
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--surface-2)',
                borderRadius: 'var(--r-md)',
                fontSize: 13,
                color: 'var(--text-subtle)',
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <span>
                Mã: <strong style={{ color: 'var(--primary)' }}>{question.code}</strong>
              </span>
              <span>
                Nhóm: <strong>Nhóm {question.groupNumber}</strong>
              </span>
              {question.industries.length > 0 && (
                <span>
                  Ngành:{' '}
                  <strong>{question.industries.map((i) => i.name).join(', ')}</strong>
                </span>
              )}
            </div>
          )}

          {/* Nội dung câu hỏi */}
          <div className="field">
            <label className="field__label" htmlFor="q-content">
              Nội dung câu hỏi <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              id="q-content"
              className="textarea"
              rows={4}
              value={draft.content}
              onChange={(e) => handleChange('content', e.target.value)}
              disabled={saving}
              placeholder="Nhập nội dung câu hỏi..."
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Loại câu hỏi */}
          <div className="field">
            <label className="field__label" htmlFor="q-type">
              Loại câu hỏi
            </label>
            <select
              id="q-type"
              className="select"
              value={draft.questionType}
              onChange={(e) =>
                handleChange('questionType', e.target.value as EditDraft['questionType'])
              }
              disabled={saving}
            >
              {Object.entries(QUESTION_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Điểm tối đa & Thứ tự */}
          <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
            <div className="field" style={{ flex: 1 }}>
              <label className="field__label" htmlFor="q-maxscore">
                Điểm tối đa
              </label>
              <input
                id="q-maxscore"
                type="number"
                className="input"
                min={0}
                max={100}
                step={0.5}
                value={draft.maxScore}
                onChange={(e) => handleChange('maxScore', e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="field__label" htmlFor="q-sortorder">
                Thứ tự sắp xếp
              </label>
              <input
                id="q-sortorder"
                type="number"
                className="input"
                min={0}
                max={9999}
                step={1}
                value={draft.sortOrder}
                onChange={(e) => handleChange('sortOrder', e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: saving ? 'not-allowed' : 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={draft.isOptional}
                onChange={(e) => handleChange('isOptional', e.target.checked)}
                disabled={saving}
                style={{ width: 16, height: 16, cursor: 'inherit', accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: 14 }}>
                <strong>Tuỳ chọn</strong>{' '}
                <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
                  (không bắt buộc trả lời)
                </span>
              </span>
            </label>

            {draft.questionType !== 'open' && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={draft.allowOther}
                  onChange={(e) => handleChange('allowOther', e.target.checked)}
                  disabled={saving}
                  style={{
                    width: 16,
                    height: 16,
                    cursor: 'inherit',
                    accentColor: 'var(--primary)',
                  }}
                />
                <span style={{ fontSize: 14 }}>
                  <strong>Cho phép đáp án khác</strong>{' '}
                  <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
                    (hiện ô nhập tự do)
                  </span>
                </span>
              </label>
            )}
          </div>

          {/* Đáp án lựa chọn — chỉnh sửa */}
          {draft.questionType !== 'open' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <div className="field__label" style={{ margin: 0 }}>
                  Đáp án lựa chọn ({options.filter((o) => !o._deleted).length})
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Icons.Plus size={14} />}
                  onClick={addOption}
                  disabled={saving}
                >
                  Thêm đáp án
                </Button>
              </div>

              {options.filter((o) => !o._deleted).length === 0 ? (
                <div
                  style={{
                    padding: '14px 16px',
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--r-md)',
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                  }}
                >
                  Chưa có đáp án nào. Nhấn “Thêm đáp án” để bắt đầu.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {options.map((opt, idx) => {
                    if (opt._deleted && opt.id) {
                      return (
                        <div
                          key={`del-${opt.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            border: '1px dashed var(--danger)',
                            borderRadius: 'var(--r-md)',
                            background: 'var(--danger-tint)',
                            fontSize: 13,
                            color: 'var(--danger)',
                          }}
                        >
                          <span>
                            Đã đánh dấu xoá đáp án <strong>{opt.code}</strong>
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleDeleteOption(idx)}
                            disabled={saving}
                          >
                            Khôi phục
                          </Button>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={opt.id ?? `new-${idx}`}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--r-md)',
                          padding: 10,
                          background: 'var(--surface)',
                          display: 'grid',
                          gridTemplateColumns: '80px 1fr 90px auto',
                          gap: 8,
                          alignItems: 'center',
                        }}
                      >
                        <input
                          aria-label="Mã đáp án"
                          className="input"
                          style={{
                            height: 36,
                            fontFamily: 'var(--font-mono, monospace)',
                            fontWeight: 600,
                            textAlign: 'center',
                            padding: '0 8px',
                          }}
                          value={opt.code}
                          maxLength={20}
                          onChange={(e) => updateOptionDraft(idx, { code: e.target.value })}
                          disabled={saving}
                          placeholder="A"
                        />
                        <input
                          aria-label="Nội dung đáp án"
                          className="input"
                          style={{ height: 36 }}
                          value={opt.content}
                          maxLength={1000}
                          onChange={(e) => updateOptionDraft(idx, { content: e.target.value })}
                          disabled={saving}
                          placeholder="Nội dung đáp án"
                        />
                        <div style={{ position: 'relative' }}>
                          <input
                            aria-label="Điểm"
                            type="number"
                            className="input"
                            style={{
                              height: 36,
                              paddingRight: 34,
                              textAlign: 'right',
                              fontFamily: 'var(--font-mono, monospace)',
                            }}
                            min={0}
                            max={100}
                            step={0.1}
                            value={opt.score}
                            onChange={(e) => updateOptionDraft(idx, { score: e.target.value })}
                            disabled={saving}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              right: 10,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              pointerEvents: 'none',
                            }}
                          >
                            đ
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button
                            type="button"
                            aria-label={opt.isOther ? 'Bỏ đánh dấu Khác' : 'Đánh dấu là đáp án "Khác"'}
                            title={opt.isOther ? 'Bỏ đánh dấu Khác' : 'Đánh dấu là đáp án "Khác"'}
                            onClick={() => updateOptionDraft(idx, { isOther: !opt.isOther })}
                            disabled={saving}
                            style={{
                              height: 32,
                              padding: '0 8px',
                              border: '1px solid var(--border)',
                              borderRadius: 6,
                              background: opt.isOther ? 'var(--accent-tint)' : 'transparent',
                              color: opt.isOther ? 'oklch(0.45 0.14 60)' : 'var(--text-muted)',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: saving ? 'not-allowed' : 'pointer',
                            }}
                          >
                            Khác
                          </button>
                          <button
                            type="button"
                            aria-label="Xoá đáp án"
                            title="Xoá đáp án"
                            onClick={() => toggleDeleteOption(idx)}
                            disabled={saving}
                            style={{
                              width: 32,
                              height: 32,
                              border: '1px solid var(--border)',
                              borderRadius: 6,
                              background: 'transparent',
                              color: 'var(--danger)',
                              display: 'grid',
                              placeItems: 'center',
                              cursor: saving ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <Icons.Trash size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Icons.Info size={12} />
                Lưu ý: Đáp án đang được dùng trong bài khảo sát sẽ không thể xoá.
              </div>
            </div>
          )}

          {/* Thông báo lỗi cục bộ (validation) */}
          {error && (
            <div
              role="alert"
              style={{
                padding: '10px 14px',
                background: 'var(--danger-tint)',
                color: 'var(--danger)',
                borderRadius: 'var(--r-md)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Icons.AlertTriangle size={16} />
              {error}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

// ============================================================
// Main Page
// ============================================================
const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function AdminQuestions() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [industries, setIndustries] = useState<{ id: number; code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterGroup, setFilterGroup] = useState<number | ''>('');
  const [filterIndustry, setFilterIndustry] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Edit drawer
  const [editQuestion, setEditQuestion] = useState<AdminQuestion | null>(null);

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.listQuestions({
        groupNumber: filterGroup ? Number(filterGroup) : undefined,
        industryId: filterIndustry ? Number(filterIndustry) : undefined,
      });
      setQuestions(res.items);
      setIndustries(res.industries);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách câu hỏi');
    } finally {
      setLoading(false);
    }
  }, [filterGroup, filterIndustry]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);



  const groups = [
    { id: '', name: 'Tất cả các nhóm' },
    { id: 1, name: 'Nhóm 1' },
    { id: 2, name: 'Nhóm 2' },
    { id: 3, name: 'Nhóm 3' },
    { id: 4, name: 'Nhóm 4' },
    { id: 5, name: 'Nhóm 5' },
    { id: 6, name: 'Nhóm 6' },
    { id: 7, name: 'Nhóm 7' },
  ];

  const filteredQuestions = questions.filter(
    (q) =>
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Paged
  const total = filteredQuestions.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedQuestions = filteredQuestions.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleFilterGroup = (id: number | '') => {
    setFilterGroup(id);
    setFilterIndustry('');
    setPage(1);
  };

  const handleEdit = (q: AdminQuestion) => {
    setEditQuestion(q);
  };

  const handleSaved = () => {
    // Reload để lấy dữ liệu mới nhất
    loadQuestions();
  };

  return (
    <>
      <header className="topbar">
        <div className="crumbs">
          <span>Quản trị</span>
          <span className="sep">
            <Icons.ChevronRight size={14} />
          </span>
          <strong>Câu hỏi</strong>
        </div>
      </header>

      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Quản lý câu hỏi</h1>
            <p className="page__sub">
              Quản lý ngân hàng câu hỏi, thiết lập quy tắc tính điểm và gán ngành nghề (cho nhóm
              7).
            </p>
          </div>
        </div>

        {error && (
          <div
            className="mb-6 p-4"
            style={{
              background: 'var(--danger-tint)',
              color: 'var(--danger)',
              borderRadius: 'var(--r-md)',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '240px 1fr',
            gap: 24,
            alignItems: 'start',
          }}
        >
          {/* Sidebar / Group List */}
          <div className="card" style={{ padding: '16px 12px' }}>
            <div className="nav__label" style={{ marginTop: 0 }}>
              Nhóm câu hỏi
            </div>
            <div className="nav" style={{ marginTop: 8 }}>
              {groups.map((g) => (
                <button
                  type="button"
                  key={String(g.id)}
                  className={`nav__item ${filterGroup === g.id ? 'is-active' : ''}`}
                  onClick={() => handleFilterGroup(g.id as number | '')}
                  style={{ padding: '8px 12px', fontSize: 13, marginBottom: 2 }}
                >
                  <Icons.Layers size={16} className="ico" />
                  <span>{g.name}</span>
                </button>
              ))}
            </div>

            {filterGroup === 7 && (
              <div style={{ marginTop: 24, padding: '0 12px' }}>
                <div className="field__label" style={{ marginBottom: 8 }}>
                  Ngành nghề
                </div>
                <select
                  className="select"
                  value={filterIndustry}
                  onChange={(e) =>
                    setFilterIndustry(e.target.value ? Number(e.target.value) : '')
                  }
                >
                  <option value="">Tất cả ngành</option>
                  {industries.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Main Card */}
          <Card
            title={`Danh sách câu hỏi${filterGroup ? ` (Nhóm ${filterGroup})` : ''}`}
            sub={
              loading
                ? 'Đang tải...'
                : `${total} câu hỏi${searchQuery ? ` · kết quả tìm kiếm "${searchQuery}"` : ''}`
            }
            padding={false}
            action={
              <div className="search" style={{ margin: 0 }}>
                <Icons.Search size={16} style={{ color: 'var(--text-subtle)' }} />
                <input
                  placeholder="Tìm theo mã hoặc nội dung..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            }
          >
            {loading ? (
              <div
                style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}
              >
                Đang tải dữ liệu...
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div style={{ padding: '40px 0' }}>
                <EmptyState
                  icon={<Icons.HelpCircle size={40} />}
                  title="Không tìm thấy câu hỏi"
                  sub="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                />
              </div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Mã</th>
                        <th>Nhóm</th>
                        <th>Nội dung</th>
                        <th>Thuộc tính</th>
                        <th className="col-actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {pagedQuestions.map((q) => (
                        <tr key={q.id}>
                          <td>
                            <strong style={{ color: 'var(--primary)' }}>{q.code}</strong>
                          </td>
                          <td>
                            <Badge variant="neutral">Nhóm {q.groupNumber}</Badge>
                          </td>
                          <td>
                            <div
                              style={{
                                whiteSpace: 'normal',
                                maxWidth: 400,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                              title={q.content}
                            >
                              {q.content}
                            </div>
                          </td>
                          <td>
                            <div className="row gap-2">
                              <Badge variant={q.isOptional ? 'warning' : 'success'}>
                                {q.isOptional ? 'Tuỳ chọn' : 'Bắt buộc'}
                              </Badge>
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {q.questionType}
                              </span>
                            </div>
                          </td>
                          <td className="col-actions">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Icons.Edit size={14} />}
                              onClick={() => handleEdit(q)}
                            >
                              Sửa
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <Pagination
                  page={safePage}
                  total={total}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(s) => {
                    setPageSize(s);
                    setPage(1);
                  }}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                />
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Drawer */}
      <EditDrawer
        question={editQuestion}
        onClose={() => setEditQuestion(null)}
        onSaved={handleSaved}
      />
    </>
  );
}
