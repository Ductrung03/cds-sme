import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '@/api/client';
import { TEN_NHOM, type AssessmentDetail, type AiReviewItem } from '@/types';
import { Button, StatusBadge, Card } from '@/components/ui/index';
import { Icons, Avatar } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

// ============================================================
// ADMIN DETAIL — Chấm điểm bài khảo sát
// ============================================================
// Logic chấm điểm:
//   - Admin nhập điểm cho TỪNG câu hỏi (questionScores: 0–100/câu).
//   - Điểm nhóm hiển thị ở sidebar = TRUNG BÌNH các câu đã chấm trong nhóm.
//   - Khi lưu: gửi `diemTheoNhom` (aggregate) + `ghiChuAdmin`. Backend hiện
//     tính lại điểm dựa trên đáp án thực; phần admin override được lưu vào
//     ghi chú để theo dõi.
// ============================================================

const MAX_QUESTION_SCORE = 100;

export function AdminDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [data, setData] = useState<AssessmentDetail | null>(null);
  const [aiReview, setAiReview] = useState<AiReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoadingQuestionId, setAiLoadingQuestionId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Điểm theo TỪNG câu hỏi (nguồn chính)
  const [questionScores, setQuestionScores] = useState<Record<number, string>>({});
  // Ghi chú admin (gửi kèm khi lưu)
  const [ghiChuAdmin, setGhiChuAdmin] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function loadData() {
      try {
        setLoading(true);
        const detail = await adminApi.getDetail(id!);
        if (cancelled) return;
        setData(detail);

        // Khởi tạo điểm câu: ưu tiên optionScore từ đáp án, fallback rỗng
        const initialQs: Record<number, string> = {};
        for (const ans of detail.dapAnChiTiet) {
          const fromOption = ans.luaChons?.[0]?.diem;
          if (typeof fromOption === 'number') {
            initialQs[ans.cauHoiId] = String(fromOption);
          }
        }
        setQuestionScores(initialQs);
        setGhiChuAdmin(detail.ketQua?.ghiChuAdmin ?? '');
      } catch (err: any) {
        if (!cancelled) {
          toastError(err?.message || 'Không tải được chi tiết bài khảo sát.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadData();
    return () => {
      cancelled = true;
    };
  }, [id, toastError]);

  // Nhóm câu trả lời theo "nhóm"
  const groupedAnswers = useMemo(() => {
    const map: Record<number, AssessmentDetail['dapAnChiTiet']> = {};
    if (!data) return map;
    for (const ans of data.dapAnChiTiet) {
      if (!map[ans.nhom]) map[ans.nhom] = [];
      map[ans.nhom].push(ans);
    }
    return map;
  }, [data]);

  // Tổng hợp điểm nhóm = trung bình các câu đã chấm
  const groupAggregates = useMemo(() => {
    const result: Record<number, { sum: number; count: number; avg: number; total: number }> = {};
    for (const nhomStr of Object.keys(groupedAnswers)) {
      const nhom = Number(nhomStr);
      const ansList = groupedAnswers[nhom];
      let sum = 0;
      let count = 0;
      for (const ans of ansList) {
        const raw = questionScores[ans.cauHoiId];
        if (raw === undefined || raw === '') continue;
        const v = Number(raw);
        if (!Number.isNaN(v)) {
          sum += v;
          count++;
        }
      }
      const avg = count > 0 ? sum / count : 0;
      result[nhom] = { sum, count, avg, total: ansList.length };
    }
    return result;
  }, [groupedAnswers, questionScores]);

  const handleQuestionScoreChange = (questionId: number, value: string) => {
    // Cho phép rỗng để xoá; chặn ký tự không hợp lệ ở mức input number
    if (value === '') {
      setQuestionScores((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
      return;
    }
    const num = Number(value);
    if (Number.isNaN(num)) return;
    const clamped = Math.max(0, Math.min(MAX_QUESTION_SCORE, num));
    setQuestionScores((prev) => ({ ...prev, [questionId]: String(clamped) }));
  };

  const handleRunAiForQuestion = async (questionId: number) => {
    if (!id) return;
    setAiLoadingQuestionId(questionId);
    try {
      const res = await adminApi.getAiReviewQuestion(id, questionId);
      // Upsert vào aiReview state
      setAiReview((prev) => {
        const exists = prev.find(x => x.cauHoiId === questionId);
        const lyDo = res.reason && res.reason.trim().length > 0
          ? res.reason
          : (res.isRelevant ? 'Câu trả lời có liên quan đến câu hỏi.' : 'Câu trả lời không phù hợp với câu hỏi.');
        const item: AiReviewItem = {
          cauHoiId: res.cauHoiId,
          maCauHoi: '',
          noiDungCauHoi: '',
          dapAnKhac: '',
          goiYPhanLoai: res.goiYPhanLoai,
          lyDoGoiY: lyDo,
          doDangTin: res.doDangTin,
          luaChonPhuHopId: undefined,
          verdict: res.verdict,
          isRelevant: res.isRelevant,
          matchedOptionCode: res.matchedOptionCode,
          matchedOptionContent: res.matchedOptionContent,
        };
        if (exists) {
          return prev.map(x => x.cauHoiId === questionId ? item : x);
        }
        return [...prev, item];
      });
      toastSuccess('Đã phân tích xong đáp án "Khác".');
    } catch (err: any) {
      toastError(err?.message || 'Phân tích AI thất bại. Vui lòng thử lại.');
    } finally {
      setAiLoadingQuestionId(null);
    }
  };

  const handleSaveScore = async () => {
    if (!id || !data) return;

    // Kiểm tra: có ít nhất 1 câu được chấm
    const totalAnswered = Object.keys(questionScores).length;
    if (totalAnswered === 0) {
      toastError('Vui lòng chấm điểm ít nhất một câu hỏi trước khi lưu.');
      return;
    }

    setSubmitting(true);
    try {
      const diemTheoNhom = Object.keys(groupAggregates)
        .map((k) => Number(k))
        .sort((a, b) => a - b)
        .map((nhom) => ({ nhom, diem: Math.round(groupAggregates[nhom].avg * 100) / 100 }));

      const payload = {
        diemTheoNhom,
        ghiChuAdmin,
      };
      await adminApi.score(id, payload);
      toastSuccess('Đã lưu điểm cho bài khảo sát.');
      const detail = await adminApi.getDetail(id);
      setData(detail);
    } catch (err: any) {
      toastError(err?.message || 'Không lưu được điểm. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    if (!confirm('Bạn có chắc chắn muốn công bố kết quả này không?')) return;
    setSubmitting(true);
    try {
      await adminApi.publish(id);
      toastSuccess('Đã công bố kết quả bài khảo sát.');
      navigate('/admin');
    } catch (err: any) {
      toastError(err?.message || 'Công bố thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12, color: 'var(--text-muted)' }}>
        <Icons.Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
        Đang tải chi tiết…
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty__icon"><Icons.AlertTriangle size={28} /></div>
          <div className="empty__title">Không tìm thấy bài khảo sát</div>
          <div className="empty__sub">Bài khảo sát không tồn tại hoặc đã bị xoá.</div>
          <Button variant="secondary" onClick={() => navigate('/admin')} style={{ marginTop: 16 }}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const isPublished = data.trangThai === 'published';
  const initials = (data.user.tenDoanhnghiep || data.user.hoTen || '?').trim();
  const sortedGroupKeys = Object.keys(groupedAnswers).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="page">
      {/* Back + Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
            padding: '6px 10px', borderRadius: 'var(--r-sm)',
            transition: 'all var(--dur)',
          }}
        >
          <Icons.ArrowLeft size={16} />
          Quay lại
        </button>
        <StatusBadge status={data.trangThai} />
      </div>

      {/* COMPACT INFO HEADER */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-muted) 100%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '14px 18px',
          marginBottom: 20,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 16,
          alignItems: 'center',
          minWidth: 0,
        }}
      >
        <Avatar name={initials} size={44} />
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              minWidth: 0,
            }}
          >
            <div
              title={data.user.tenDoanhnghiep || data.user.hoTen || '—'}
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text)',
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 'min(420px, 60vw)',
              }}
            >
              {data.user.tenDoanhnghiep || data.user.hoTen || '—'}
            </div>
            {data.tenNganh && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: 'var(--primary-tint)',
                  color: 'var(--primary)',
                  whiteSpace: 'nowrap',
                }}
                title={data.tenNganh}
              >
                {data.tenNganh}
              </span>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            <span
              title={`${data.user.hoTen} · ${data.user.email}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                maxWidth: 360,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <Icons.User size={12} />
              <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{data.user.hoTen || '—'}</strong>
              {data.user.email && <span style={{ opacity: 0.8 }}>· {data.user.email}</span>}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <Icons.Clock size={12} />
              {data.ngayNop
                ? new Date(data.ngayNop).toLocaleString('vi-VN')
                : 'Chưa nộp'}
            </span>
            {data.boKhaoSat?.tenBoKhaoSat && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  maxWidth: 260,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={`${data.boKhaoSat.tenBoKhaoSat} (${data.boKhaoSat.phienBan})`}
              >
                <Icons.ClipboardList size={12} />
                {data.boKhaoSat.tenBoKhaoSat}
                {data.boKhaoSat.phienBan && (
                  <span style={{ opacity: 0.7 }}>· v{data.boKhaoSat.phienBan}</span>
                )}
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          {data.ketQua?.tongDiem !== undefined && (
            <div style={{ textAlign: 'right', lineHeight: 1.1 }}>
              <div
                style={{
                  fontFamily: 'var(--font-display, inherit)',
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {typeof data.ketQua.tongDiem === 'number' ? data.ketQua.tongDiem.toFixed(1) : data.ketQua.tongDiem}
              </div>
              <div
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                Tổng / 100
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'flex-start' }}>

        {/* LEFT — Answers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Answers section */}
          <Card
            title="Chi tiết câu trả lời"
            sub={`${data.dapAnChiTiet.length} câu trả lời · ${Object.keys(questionScores).length} câu đã chấm`}
            padding={false}
          >
            <div style={{ padding: '8px 0' }}>
              {sortedGroupKeys.map((nhomStr) => {
                const nhom = Number(nhomStr);
                const agg = groupAggregates[nhom];
                return (
                  <div key={nhom} style={{ borderBottom: '1px solid var(--border)' }}>
                    {/* Group header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '14px 22px',
                      background: 'var(--surface-muted)',
                    }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'var(--primary)', color: '#fff',
                        display: 'grid', placeItems: 'center',
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>
                        {nhom}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                        {TEN_NHOM[nhom] ?? `Phần ${nhom}`}
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                          {agg.count}/{agg.total} câu đã chấm
                        </span>
                        <span
                          title="Trung bình điểm các câu đã chấm"
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 999,
                            background: agg.count > 0 ? 'var(--primary-tint)' : 'var(--surface)',
                            color: agg.count > 0 ? 'var(--primary)' : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                            minWidth: 56,
                            textAlign: 'center',
                          }}
                        >
                          {agg.count > 0 ? `${agg.avg.toFixed(1)}` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Questions */}
                    {groupedAnswers[nhom].map((ans, idx) => {
                      const aiSuggest = aiReview.find((x) => x.cauHoiId === ans.cauHoiId);
                      const rawScore = questionScores[ans.cauHoiId];
                      const hasScore = rawScore !== undefined && rawScore !== '';
                      return (
                        <div
                          key={ans.cauHoiId}
                          style={{
                            padding: '16px 22px',
                            borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                            background: hasScore ? 'transparent' : 'oklch(0.99 0.01 60)',
                          }}
                        >
                          {/* Question + score input */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 12,
                              marginBottom: 6,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)', marginRight: 8 }}>
                                  {nhom}.{idx + 1}
                                </span>
                                {ans.noiDungCauHoi}
                              </div>
                            </div>
                            {!isPublished && (
                              <div
                                style={{
                                  position: 'relative',
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <input
                                  aria-label={`Điểm câu ${nhom}.${idx + 1}`}
                                  type="number"
                                  min={0}
                                  max={MAX_QUESTION_SCORE}
                                  step={0.5}
                                  inputMode="decimal"
                                  value={rawScore ?? ''}
                                  onChange={(e) => handleQuestionScoreChange(ans.cauHoiId, e.target.value)}
                                  placeholder="—"
                                  style={{
                                    width: 88,
                                    height: 34,
                                    padding: '0 28px 0 10px',
                                    border: `1px solid ${hasScore ? 'var(--border-strong)' : 'oklch(0.78 0.1 70)'}`,
                                    borderRadius: 'var(--r-sm)',
                                    background: 'var(--surface)',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    textAlign: 'right',
                                    color: 'var(--text)',
                                    outline: 'none',
                                    transition: 'border-color 160ms, box-shadow 160ms',
                                  }}
                                  onFocus={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-tint)';
                                  }}
                                  onBlur={(e) => {
                                    e.currentTarget.style.borderColor = hasScore ? 'var(--border-strong)' : 'oklch(0.78 0.1 70)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                />
                                <span
                                  style={{
                                    position: 'absolute',
                                    right: 10,
                                    fontSize: 11,
                                    color: 'var(--text-muted)',
                                    pointerEvents: 'none',
                                    fontWeight: 600,
                                  }}
                                >
                                  đ
                                </span>
                              </div>
                            )}
                            {isPublished && hasScore && (
                              <div
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: 'var(--primary)',
                                  padding: '4px 10px',
                                  background: 'var(--primary-tint)',
                                  borderRadius: 999,
                                  flexShrink: 0,
                                }}
                              >
                                {rawScore}đ
                              </div>
                            )}
                          </div>

                          {/* Answer */}
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', paddingLeft: 32 }}>
                            {ans.luaChons.length > 0
                              ? ans.luaChons.map((l: { noiDung: string }) => l.noiDung).join(' · ')
                              : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400 }}>(Không có lựa chọn)</span>
                            }
                          </div>

                          {/* Other answer + nút phân tích AI
                              Hiện khi: user chọn option "Khác" (daChonKhac) HOẶC có text tự nhập (dapAnKhac) */}
                          {(ans.daChonKhac || ans.dapAnKhac) && (
                            <div style={{ marginLeft: 32 }}>
                              <div style={{
                                marginTop: 8,
                                padding: '10px 12px',
                                borderLeft: '3px solid var(--accent)',
                                background: 'var(--accent-tint)',
                                borderRadius: '0 var(--r-sm) var(--r-sm) 0',
                                fontSize: 13,
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 12,
                              }}>
                                <div>
                                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>Khác: </span>
                                  {ans.dapAnKhac
                                    ? <span style={{ fontStyle: 'italic' }}>{ans.dapAnKhac}</span>
                                    : <span style={{ fontStyle: 'italic', opacity: 0.6 }}>(chưa nhập nội dung)</span>
                                  }
                                </div>
                                {!isPublished && (
                                  <Button
                                    variant="accent"
                                    size="xs"
                                    icon={<Icons.Sparkles size={12} />}
                                    onClick={() => handleRunAiForQuestion(ans.cauHoiId)}
                                    loading={aiLoadingQuestionId === ans.cauHoiId}
                                    disabled={!ans.dapAnKhac}
                                    title={!ans.dapAnKhac ? 'Doanh nghiệp chưa nhập nội dung "Khác"' : 'Phân tích đáp án bằng AI'}
                                    style={{ flexShrink: 0 }}
                                  >
                                    Phân tích AI
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* AI Suggestion box */}
                          {aiSuggest && (() => {
                            const verdict = aiSuggest.verdict;
                            // Màu sắc và nhãn theo verdict
                            const tone =
                              verdict === 'not_relevant'
                                ? { bg: 'var(--danger-tint)', border: 'oklch(0.85 0.06 25)', fg: 'var(--danger)', label: 'Không phù hợp với câu hỏi' }
                                : verdict === 'matches_option'
                                ? { bg: 'var(--success-tint)', border: 'oklch(0.85 0.08 145)', fg: 'var(--success)', label: 'Phù hợp — tương đương đáp án có sẵn' }
                                : verdict === 'relevant_but_no_match'
                                ? { bg: 'var(--info-tint)', border: 'oklch(0.85 0.06 240)', fg: 'var(--info)', label: 'Có liên quan nhưng không khớp đáp án nào' }
                                : { bg: 'var(--accent-tint)', border: 'oklch(0.85 0.07 60)', fg: 'var(--accent)', label: 'Đề xuất từ AI' };
                            const confidencePct = Math.round((aiSuggest.doDangTin || 0) * 100);
                            return (
                              <div style={{
                                marginTop: 12, marginLeft: 32,
                                padding: 16,
                                borderRadius: 'var(--r-md)',
                                background: tone.bg,
                                border: `1px solid ${tone.border}`,
                              }}>
                                <div style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                                  marginBottom: 8,
                                }}>
                                  <div style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                                    textTransform: 'uppercase', color: tone.fg,
                                  }}>
                                    <Icons.Sparkles size={13} />
                                    {tone.label}
                                  </div>
                                  {confidencePct > 0 && (
                                    <div style={{
                                      fontSize: 11, fontWeight: 700, color: tone.fg,
                                      padding: '2px 8px', borderRadius: 999,
                                      background: 'var(--surface)', border: `1px solid ${tone.border}`,
                                    }}>
                                      Độ tin cậy {confidencePct}%
                                    </div>
                                  )}
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>
                                  {aiSuggest.goiYPhanLoai}
                                </div>
                                {verdict === 'matches_option' && aiSuggest.matchedOptionContent && (
                                  <div style={{
                                    marginTop: 8, marginBottom: 6,
                                    fontSize: 12, color: 'var(--text)',
                                    padding: '8px 10px', borderRadius: 8,
                                    background: 'var(--surface)', border: `1px dashed ${tone.border}`,
                                  }}>
                                    <strong style={{ color: tone.fg }}>Đáp án tương đương:</strong>{' '}
                                    {aiSuggest.matchedOptionCode ? `[${aiSuggest.matchedOptionCode}] ` : ''}
                                    {aiSuggest.matchedOptionContent}
                                  </div>
                                )}
                                {aiSuggest.lyDoGoiY && (
                                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                    {aiSuggest.lyDoGoiY}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT — Scoring sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 84 }}>

          {/* Score card (đã công bố) */}
          {data.ketQua && (
            <Card title="Kết quả tổng hợp">
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700,
                  letterSpacing: '-0.03em', color: 'var(--primary)',
                  lineHeight: 1,
                }}>
                  {typeof data.ketQua.tongDiem === 'number' ? data.ketQua.tongDiem.toFixed(1) : data.ketQua.tongDiem}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Tổng điểm / 100</div>
                {data.ketQua.capDo && (
                  <div style={{
                    display: 'inline-block', marginTop: 12,
                    padding: '6px 16px', borderRadius: 'var(--r-full)',
                    background: 'var(--primary-tint)', color: 'var(--primary)',
                    fontSize: 13, fontWeight: 600,
                  }}>
                    {data.ketQua.capDo}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Scoring sidebar (tổng hợp theo nhóm) */}
          {!isPublished && (
            <Card
              title="Tổng hợp điểm theo nhóm"
              sub="Tự cập nhật từ điểm câu hỏi (trung bình)"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sortedGroupKeys.length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                    Chưa có câu trả lời nào.
                  </div>
                )}
                {sortedGroupKeys.map((nhomStr) => {
                  const nhom = Number(nhomStr);
                  const agg = groupAggregates[nhom];
                  const pct = Math.max(0, Math.min(100, agg.avg));
                  return (
                    <div key={nhom} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: 'var(--primary-tint)', color: 'var(--primary)',
                          display: 'grid', placeItems: 'center',
                          fontSize: 11, fontWeight: 700, flexShrink: 0,
                        }}>
                          {nhom}
                        </div>
                        <div
                          title={TEN_NHOM[nhom] ?? `Phần ${nhom}`}
                          style={{
                            flex: 1,
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {TEN_NHOM[nhom] ?? `Phần ${nhom}`}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {agg.count}/{agg.total}
                        </div>
                        <div
                          style={{
                            minWidth: 52,
                            textAlign: 'right',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 13,
                            fontWeight: 700,
                            color: agg.count > 0 ? 'var(--primary)' : 'var(--text-muted)',
                          }}
                        >
                          {agg.count > 0 ? agg.avg.toFixed(1) : '—'}
                        </div>
                      </div>
                      <div
                        style={{
                          height: 4,
                          borderRadius: 2,
                          background: 'var(--surface-muted)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: agg.count > 0
                              ? 'linear-gradient(90deg, var(--primary), oklch(0.6 0.12 200))'
                              : 'transparent',
                            transition: 'width 240ms ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ghi chú */}
              <div className="field" style={{ marginTop: 16 }}>
                <label className="field__label" htmlFor="ghi-chu-admin">Nhận xét của chuyên gia</label>
                <textarea
                  id="ghi-chu-admin"
                  className="textarea"
                  rows={4}
                  placeholder="Nhập nhận xét, đánh giá thêm…"
                  value={ghiChuAdmin}
                  onChange={(e) => setGhiChuAdmin(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                <Button
                  variant="primary"
                  block
                  icon={<Icons.Save size={15} />}
                  onClick={handleSaveScore}
                  loading={submitting}
                >
                  Lưu điểm
                </Button>

                {(data.trangThai === 'scored' || data.ketQua) && (
                  <Button
                    variant="secondary"
                    block
                    icon={<Icons.Send size={15} />}
                    onClick={handlePublish}
                    loading={submitting}
                  >
                    Công bố kết quả
                  </Button>
                )}
              </div>
            </Card>
          )}

          {isPublished && (
            <div style={{
              padding: '16px',
              borderRadius: 'var(--r-md)',
              background: 'var(--success-tint)',
              border: '1px solid oklch(0.82 0.06 155)',
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13, color: 'oklch(0.4 0.13 155)', fontWeight: 500,
            }}>
              <Icons.CheckCircle size={18} />
              Kết quả đã được công bố
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
