import { useState, useEffect } from 'react';
import { assessmentApi } from '@/api/client';
import {
  type AssessmentListItem,
  type AssessmentResult,
  type AssessmentReview,
  type ReviewAnswerItem,
  CAP_DO_INFO,
  TEN_NHOM,
} from '@/types';
import { Button, Card, Progress, StatusBadge } from '@/components/ui/index';
import { Icons } from '@/components/ui/Icons';

// ============================================================
// Result page — Kết quả + Xem lại bài làm (readonly)
// ============================================================

type Tab = 'result' | 'review';

export function Result() {
  const [assessment, setAssessment] = useState<AssessmentListItem | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [review, setReview] = useState<AssessmentReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('result');

  useEffect(() => {
    async function loadData() {
      try {
        const listResult = await assessmentApi.getMyAssessments();
        const list = Array.isArray(listResult) ? listResult : (listResult as any).items ?? [];
        const latest = list[0];
        if (latest) {
          setAssessment(latest);
          // Luôn load review để user xem lại bài
          try {
            const rev = await assessmentApi.getReview(latest.id);
            setReview(rev);
          } catch (_) { /* ignore nếu chưa nộp */ }
          // Load kết quả nếu đã chấm/công bố
          if (latest.trangThai === 'published' || latest.trangThai === 'scored') {
            try {
              const res = await assessmentApi.getResult(latest.id);
              setResult(res);
            } catch (_) { /* ignore */ }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Icons.Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          <div style={{ color: 'var(--text-muted)' }}>Đang tải...</div>
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div>
        <div style={{ maxWidth: 500, margin: '100px auto', textAlign: 'center', padding: '0 24px' }}>
          <Icons.ClipboardList size={40} style={{ margin: '0 auto 16px', display: 'block', color: 'var(--text-muted)' }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Chưa có dữ liệu</h2>
          <p style={{ color: 'var(--text-muted)' }}>Bạn chưa thực hiện bài khảo sát nào.</p>
        </div>
      </div>
    );
  }

  const isPublished = assessment.trangThai === 'published';
  const isScored = assessment.trangThai === 'scored';
  const hasResult = isPublished || isScored;
  const canViewScore = review?.canViewScore ?? hasResult;

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ maxWidth: 1000, margin: '32px auto 0', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Bài khảo sát của tôi</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 13 }}>
              <StatusBadge status={assessment.trangThai} />
              {assessment.ngayNop && (
                <span>Nộp ngày {new Date(assessment.ngayNop).toLocaleDateString('vi-VN')}</span>
              )}
            </div>
          </div>
          {hasResult && (
            <Button variant="secondary" size="sm" icon={<Icons.Download size={14} />}>Tải PDF</Button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          {([
            { id: 'result' as Tab, label: '📊 Kết quả đánh giá', available: true },
            { id: 'review' as Tab, label: '📋 Xem lại bài làm', available: !!review },
          ] as const).map(t => (
            t.available && (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: tab === t.id ? 700 : 400,
                  color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {t.label}
              </button>
            )
          ))}
        </div>

        {/* ======================== TAB: KẾT QUẢ ======================== */}
        {tab === 'result' && (
          <>
            {!hasResult ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--warning-tint)', color: 'var(--warning)', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
                  <Icons.Clock size={36} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Đang chờ xét duyệt</h2>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
                  Bài khảo sát của bạn đang trong quá trình chấm điểm.<br />
                  Kết quả sẽ hiển thị tại đây sau khi quản trị viên công bố.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
                  <Icons.Info size={14} />
                  Bạn có thể xem lại bài đã làm ở tab <strong>"Xem lại bài làm"</strong>
                </div>
              </div>
            ) : !result ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Không tải được chi tiết kết quả.</div>
            ) : (
              <ResultContent result={result} />
            )}
          </>
        )}

        {/* ======================== TAB: XEM LẠI BÀI ======================== */}
        {tab === 'review' && review && (
          <ReviewContent review={review} canViewScore={canViewScore} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// ResultContent — Hiển thị kết quả điểm (giữ nguyên UI cũ)
// ============================================================
function ResultContent({ result }: { result: AssessmentResult }) {
  const capDoInfo = CAP_DO_INFO[result.capDo] || CAP_DO_INFO['Cấp độ 1'];
  return (
    <div>
      <div className="grid grid--cols-3" style={{ marginBottom: 32 }}>
        <div style={{ gridColumn: 'span 2' }}>
          <Card padding style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 8, bottom: 0, background: capDoInfo.mau }} />
            <div style={{ display: 'flex', gap: 32, alignItems: 'center', paddingLeft: 8 }}>
              <div style={{
                width: 140, height: 140, borderRadius: '50%',
                border: `8px solid ${capDoInfo.mau}20`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative', flexShrink: 0,
              }}>
                <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.04em', color: capDoInfo.mau, lineHeight: 1 }}>
                  {typeof result.tongDiem === 'number' ? result.tongDiem.toFixed(1) : result.tongDiem}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>/ 100 điểm</div>
              </div>
              <div>
                <div style={{
                  display: 'inline-block', padding: '4px 14px', borderRadius: 999,
                  background: `${capDoInfo.mau}18`, color: capDoInfo.mau,
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12,
                }}>
                  {result.capDo}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, margin: '0 0 8px' }}>{result.capDo}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{capDoInfo.moTa}</p>
              </div>
            </div>
          </Card>
        </div>
        <div>
          <Card title="Ngày công bố" padding>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {result.ngayCongBo ? new Date(result.ngayCongBo).toLocaleDateString('vi-VN') : '--'}
            </div>
          </Card>
        </div>
      </div>

      {result.diemTheoNhom && result.diemTheoNhom.length > 0 && (
        <Card title="Điểm theo từng nhóm tiêu chí" padding>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {result.diemTheoNhom.map((n) => (
              <div key={n.nhom}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{n.tenNhom || TEN_NHOM[n.nhom] || `Nhóm ${n.nhom}`}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                    {typeof n.diem === 'number' ? n.diem.toFixed(1) : n.diem}
                  </span>
                </div>
                <Progress value={n.diemToiDa ? (n.diem / n.diemToiDa) * 100 : n.diem} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {result.ghiChuAdmin && (
        <Card title="Nhận xét từ chuyên viên" padding style={{ marginTop: 20 }}>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{result.ghiChuAdmin}</p>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// ReviewContent — Xem lại bài làm (readonly)
// ============================================================
function ReviewContent({ review, canViewScore }: { review: AssessmentReview; canViewScore: boolean }) {
  // Nhóm câu hỏi theo groupNumber
  const grouped: Record<number, { name: string; items: ReviewAnswerItem[] }> = {};
  for (const ans of review.answers) {
    if (!grouped[ans.groupNumber]) {
      grouped[ans.groupNumber] = { name: ans.groupName || TEN_NHOM[ans.groupNumber] || `Nhóm ${ans.groupNumber}`, items: [] };
    }
    grouped[ans.groupNumber].items.push(ans);
  }
  const groupKeys = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  // Tính điểm trung bình nhóm nếu có
  const groupAvg = (items: ReviewAnswerItem[]) => {
    const scored = items.filter(i => typeof i.optionScore === 'number');
    if (!scored.length) return null;
    const avg = scored.reduce((s, i) => s + (i.optionScore as number), 0) / scored.length;
    return avg.toFixed(1);
  };

  return (
    <div>
      {canViewScore && review.score && (
        <div style={{
          padding: '14px 20px', borderRadius: 12, marginBottom: 24,
          background: 'var(--primary-tint)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <Icons.CheckCircle size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>
              Kết quả: {review.score.normalizedScore.toFixed(1)} / 100 điểm
            </span>
            <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--text-muted)' }}>
              — {review.score.rankName}
            </span>
          </div>
          {review.score.adminNote && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Ghi chú: {review.score.adminNote}
            </div>
          )}
        </div>
      )}

      {!canViewScore && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 20,
          background: 'var(--surface-muted)', border: '1px solid var(--border)',
          fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Icons.Info size={14} />
          Bài đang được chấm điểm — điểm từng câu sẽ hiện sau khi quản trị viên công bố kết quả.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groupKeys.map((gNum) => {
          const g = grouped[gNum];
          const avg = canViewScore ? groupAvg(g.items) : null;
          return (
            <Card key={gNum} padding={false}>
              {/* Group header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 20px',
                background: 'var(--surface-muted)',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--primary)', color: '#fff',
                  display: 'grid', placeItems: 'center',
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>
                  {gNum}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{g.name}</div>
                {avg !== null && (
                  <div style={{
                    marginLeft: 'auto',
                    fontSize: 12, fontWeight: 700, color: 'var(--primary)',
                    padding: '2px 12px', borderRadius: 999,
                    background: 'var(--primary-tint)', border: '1px solid var(--border)',
                  }}>
                    TB: {avg}
                  </div>
                )}
              </div>

              {/* Questions */}
              <div>
                {g.items.map((ans, idx) => (
                  <div
                    key={ans.questionId}
                    style={{
                      padding: '14px 20px',
                      borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    {/* Câu hỏi */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--primary)', flexShrink: 0, paddingTop: 1 }}>
                        {gNum}.{idx + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                          {ans.questionContent}
                        </div>

                        {/* Đáp án đã chọn */}
                        {ans.optionContent ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: 8,
                              padding: '6px 14px',
                              background: 'var(--primary-tint)',
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                              fontSize: 13, fontWeight: 600, color: 'var(--primary)',
                            }}>
                              <Icons.CheckCircle size={13} />
                              {ans.optionContent}
                            </div>
                            {/* Điểm đáp án (chỉ khi canViewScore) */}
                            {canViewScore && typeof ans.optionScore === 'number' && (
                              <div style={{
                                padding: '4px 12px', borderRadius: 999,
                                background: ans.optionScore >= 70 ? 'var(--success-tint)' : ans.optionScore >= 40 ? 'var(--warning-tint)' : 'var(--danger-tint)',
                                color: ans.optionScore >= 70 ? 'var(--success)' : ans.optionScore >= 40 ? 'var(--warning)' : 'var(--danger)',
                                fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                              }}>
                                {ans.optionScore.toFixed(1)}đ
                              </div>
                            )}
                            {canViewScore && ans.optionScore === null && (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa chấm</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 13 }}>(Không có lựa chọn)</span>
                        )}

                        {/* Đáp án "Khác" tự nhập */}
                        {ans.otherText && (
                          <div style={{
                            marginTop: 8,
                            padding: '8px 12px',
                            borderLeft: '3px solid var(--accent)',
                            background: 'var(--accent-tint)',
                            borderRadius: '0 8px 8px 0',
                            fontSize: 13, fontStyle: 'italic', color: 'var(--text-muted)',
                          }}>
                            <span style={{ fontStyle: 'normal', fontWeight: 600, color: 'var(--text)' }}>Khác: </span>
                            {ans.otherText}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
