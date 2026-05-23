import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentApi, questionnaireApi } from '@/api/client';
import { Button, Card, RadioCard, CheckCard, Progress } from '@/components/ui/index';
import { Icons, Avatar } from '@/components/ui/Icons';
import { Textarea } from '@/components/ui/Textarea';
import { TEN_NHOM, type Questionnaire, type AnswerItem } from '@/types';

// Types for industry-specific questions and solutions loaded on-demand
interface IndustryQuestion {
  id: number;
  code: string;
  content: string;
  questionType: string;
  allowOther: boolean;
  options: { id: number; code: string; content: string; score: number; isOther: boolean }[];
}
interface IndustrySolution {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export function Survey() {
  const navigate = useNavigate();
  const [data, setData] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  // State form
  const [maNganh, setMaNganh] = useState<string>('');
  const [answers, setAnswers] = useState<Record<number, AnswerItem>>({});
  const [rating, setRating] = useState<number>(0);
  const [nhanXet, setNhanXet] = useState<string>('');
  const [selfScore, setSelfScore] = useState<number>(50);
  const [saved, setSaved] = useState(true);
  
  // Nhóm 7 & giải pháp (load động theo ngành)
  const [industryQuestions, setIndustryQuestions] = useState<IndustryQuestion[]>([]);
  const [industrySolutions, setIndustrySolutions] = useState<IndustrySolution[]>([]);
  const [selectedSolutions, setSelectedSolutions] = useState<Set<number>>(new Set());
  
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [step, setStep] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [qSettled, listSettled] = await Promise.allSettled([
          questionnaireApi.getActive(),
          assessmentApi.getMyAssessments()
        ]);

        if (qSettled.status !== 'fulfilled') {
          console.error('Không tải được bộ khảo sát', qSettled.reason);
          return;
        }
        const qData = qSettled.value;

        const list = listSettled.status === 'fulfilled'
          ? (Array.isArray(listSettled.value)
              ? listSettled.value
              : ((listSettled.value as any)?.items ?? []))
          : [];

        const submitted = list.find((x: any) => x.trangThai !== 'draft');
        if (submitted) {
          navigate('/result');
          return;
        }

        const draft = list.find((x: any) => x.trangThai === 'draft');
        if (draft) {
          setAssessmentId(draft.id);
          if (draft.maNganh) {
            setMaNganh(draft.maNganh);
          }
        } else {
          const { id } = await assessmentApi.createDraft();
          setAssessmentId(id);
        }

        setData(qData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [navigate]);

  const loadIndustryData = useCallback(async (industryMa: string) => {
    if (!industryMa || !data) {
      setIndustryQuestions([]);
      setIndustrySolutions([]);
      return;
    }
    const industry = data.danhSachNganh.find((n) => n.ma === industryMa);
    if (!industry) return;
    try {
      const res = await questionnaireApi.getIndustry(industry.id);
      const payload = (res as any).data ?? res;
      const qs: IndustryQuestion[] = payload.questions ?? [];
      const sols: IndustrySolution[] = payload.solutions ?? [];
      const normalizedQs = qs.map((q: any) => ({
        id: q.id ?? q.Id,
        code: q.code ?? q.Code,
        content: q.content ?? q.Content,
        questionType: q.questionType ?? q.QuestionType ?? 'single',
        allowOther: q.allowOther ?? q.AllowOther ?? false,
        options: (q.options ?? []).map((o: any) => ({
          id: o.id ?? o.Id,
          code: o.code ?? o.Code,
          content: o.content ?? o.Content,
          score: o.score ?? o.Score ?? 0,
          isOther: o.isOther ?? o.IsOther ?? false,
        })),
      }));
      setIndustryQuestions(normalizedQs);
      setIndustrySolutions(sols.map((s: any) => ({
        id: s.id ?? s.Id,
        code: s.code ?? s.Code,
        name: s.name ?? s.Name,
        description: s.description ?? s.Description,
      })));
    } catch (err) {
      console.error('Lỗi tải câu hỏi ngành:', err);
    }
  }, [data]);

  const handleIndustryChange = (value: string) => {
    setMaNganh(value);
    setSelectedSolutions(new Set());
    if (value && assessmentId && data) {
      const industry = data.danhSachNganh.find((n) => n.ma === value);
      if (industry) {
        assessmentApi.setIndustry(assessmentId, industry.id).catch(console.error);
      }
    }
    loadIndustryData(value);
  };

  const handleSelectOption = (cauHoiId: number, loai: string, luaChonId: number) => {
    setAnswers(prev => {
      const current = prev[cauHoiId] || { cauHoiId, luaChonIds: [] };
      let newIds = [...current.luaChonIds];

      if (loai === 'single') {
        newIds = [luaChonId];
      } else {
        if (newIds.includes(luaChonId)) {
          newIds = newIds.filter(id => id !== luaChonId);
        } else {
          newIds.push(luaChonId);
        }
      }

      return {
        ...prev,
        [cauHoiId]: { ...current, luaChonIds: newIds }
      };
    });
    setSaved(false);
    setTimeout(() => setSaved(true), 600);
  };

  const handleOtherText = (cauHoiId: number, text: string) => {
    setAnswers(prev => {
      const current = prev[cauHoiId] || { cauHoiId, luaChonIds: [] };
      return {
        ...prev,
        [cauHoiId]: { ...current, dapAnKhac: text }
      };
    });
    setSaved(false);
    setTimeout(() => setSaved(true), 600);
  };

  const handleSubmit = async () => {
    if (!maNganh) {
      alert('Vui lòng chọn lĩnh vực ngành nghề');
      return;
    }

    const industry = data?.danhSachNganh.find((n) => n.ma === maNganh);
    if (!industry) {
      alert('Ngành nghề đã chọn không hợp lệ. Vui lòng chọn lại.');
      return;
    }
    
    const missing = (data?.nhomCauHois ?? []).flatMap(g => {
      if (g.nhom === 7) return [];
      return g.cauHois.filter(q => {
        if (!q.batBuoc) return false;
        const ans = answers[q.id];
        return !ans || ans.luaChonIds.length === 0;
      });
    });

    if (missing.length > 0) {
      alert(`Vui lòng trả lời đầy đủ các câu hỏi bắt buộc. Còn thiếu ${missing.length} câu.`);
      return;
    }

    if (rating === 0) {
      alert('Vui lòng đánh giá trải nghiệm làm khảo sát (từ 1 đến 5 sao).');
      return;
    }

    setSubmitting(true);
    try {
      if (!assessmentId) throw new Error('Không tìm thấy bài khảo sát');

      await assessmentApi.setIndustry(assessmentId, industry.id);

      const answerList = Object.values(answers);
      if (answerList.length > 0) {
        await assessmentApi.saveAnswers(assessmentId, answerList);
      }

      if (industrySolutions.length > 0) {
        const solutionsPayload = industrySolutions.map((s) => ({
          solutionId: s.id,
          isSelected: selectedSolutions.has(s.id),
        }));
        await assessmentApi.saveSolutions(assessmentId, solutionsPayload);
      }

      await assessmentApi.submit(assessmentId, rating, nhanXet || undefined, selfScore);

      setShowSuccess(true);
    } catch (err) {
      alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = useMemo(() => {
    if (!data) return [];
    const groups = data.nhomCauHois.filter(g => g.nhom !== 7);
    const hasGroup7 = maNganh && industryQuestions.length > 0;
    const hasSolutions = maNganh && industrySolutions.length > 0;

    return [
      { id: 'info', label: 'Thông tin', icon: <Icons.Building size={14} /> },
      ...groups.map(g => ({ id: `g${g.nhom}`, label: `Nhóm ${g.nhom}`, group: g, icon: <Icons.ClipboardList size={14} /> })),
      ...(hasGroup7 ? [{ id: 'g7', label: 'Nhóm 7', group: { nhom: 7, tenNhom: TEN_NHOM[7] }, icon: <Icons.ClipboardList size={14} /> }] : []),
      ...(hasSolutions ? [{ id: 'solutions', label: 'Giải pháp', icon: <Icons.Layers size={14} /> }] : []),
      { id: 'review', label: 'Hoàn thành', icon: <Icons.CheckCircle size={14} /> }
    ];
  }, [data, maNganh, industryQuestions.length, industrySolutions.length]);

  const currentStep = steps[step];
  const total = steps.length;
  
  const totalQs = useMemo(() => {
    if (!data) return 1;
    let t = data.nhomCauHois.reduce((acc, g) => acc + (g.nhom !== 7 ? g.cauHois.length : 0), 0);
    if (maNganh) t += industryQuestions.length;
    return t || 1;
  }, [data, maNganh, industryQuestions.length]);

  const answered = Object.keys(answers).length;
  const progress = (answered / totalQs) * 100;

  const next = () => {
    if (step === 0 && !maNganh) {
      alert('Vui lòng chọn lĩnh vực ngành nghề trước khi tiếp tục.');
      return;
    }
    setStep(s => Math.min(s + 1, total - 1));
    window.scrollTo(0, 0);
  };
  const prev = () => {
    setStep(s => Math.max(s - 1, 0));
    window.scrollTo(0, 0);
  };

  if (loading) return <div className="layout-page"><div style={{padding:40, textAlign:'center'}}>Đang tải dữ liệu...</div></div>;
  if (!data || steps.length === 0) return <div className="layout-page"><div style={{padding:40, textAlign:'center'}}>Không tải được bộ khảo sát.</div></div>;

  if (showSuccess) {
    return (
      <div className="layout-page">
        <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success-tint)', color: 'var(--success)', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
            <Icons.Check size={40} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Hoàn thành khảo sát!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
            Bài khảo sát đã được gửi tới quản trị viên/chuyên viên để chấm điểm. Kết quả sẽ được công bố sau khi quản trị viên xét duyệt.
          </p>
          <Button size="lg" onClick={() => navigate('/result')}>Xem trạng thái kết quả</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="survey" style={{ paddingBottom: 100 }}>
      {/* Topbar sticky cho User */}
      <header className="fixed-top glass" style={{ borderBottom: '1px solid var(--border)', zIndex: 100 }}>
        <div style={{ width: 'min(1280px, calc(100% - 48px))', margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <Icons.Diamond size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{data.tenBoKhaoSat || 'Đánh giá doanh nghiệp SME'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mã số bộ: {data.id}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
              {saved ? <><Icons.CheckCircle size={14} style={{ color: "var(--success)" }} /> Đã lưu</> : <><Icons.Loader size={14} /> Đang lưu...</>}
            </div>
            <Avatar name="User" size={32} />
          </div>
        </div>
      </header>

      {/* Stepper Navigation */}
      <div style={{ position: 'sticky', top: 60, background: 'var(--surface)', borderBottom: '1px solid var(--border)', zIndex: 90 }}>
        <div style={{ width: 'min(1280px, calc(100% - 48px))', margin: '0 auto' }}>
          <div className="stepper" style={{ display: 'flex', gap: 8, padding: '12px 0', overflowX: 'auto' }}>
            {steps.map((s, idx) => (
              <div 
                key={s.id} 
                className={`stepper__item ${idx === step ? 'is-active' : ''} ${idx < step ? 'is-completed' : ''}`}
                onClick={() => {
                  if (idx > 0 && !maNganh) {
                    alert('Vui lòng chọn lĩnh vực ngành nghề');
                    return;
                  }
                  setStep(idx);
                }}
                style={{ cursor: 'pointer', whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 8, background: idx === step ? 'var(--primary-tint)' : 'transparent', color: idx === step ? 'var(--primary)' : 'var(--text-muted)' }}
              >
                {s.icon} <span style={{ fontSize: 13, fontWeight: idx === step ? 600 : 500 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ width: 'min(1120px, calc(100% - 48px))', margin: '40px auto 100px' }}>
        {currentStep.id === 'info' && (
          <Card title="Thông tin doanh nghiệp" sub="Chọn lĩnh vực phù hợp với doanh nghiệp của bạn để hệ thống cấu hình câu hỏi khảo sát." padding>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Lĩnh vực / Ngành nghề chính <span style={{color:'var(--danger)'}}>*</span></label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                {data.danhSachNganh.map(n => (
                  <RadioCard 
                    key={n.ma}
                    label={n.ten}
                    checked={maNganh === n.ma}
                    onChange={() => handleIndustryChange(n.ma)}
                  />
                ))}
              </div>
            </div>
          </Card>
        )}

        {currentStep.group && currentStep.group.nhom !== 7 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--primary-tint)", color: "var(--primary)", display: "grid", placeItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{currentStep.group.nhom}</span>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Phần {currentStep.group.nhom}</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{currentStep.group.tenNhom || TEN_NHOM[currentStep.group.nhom]}</h2>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{(currentStep.group as any).cauHois?.length || 0} câu hỏi</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {((currentStep.group as any).cauHois || []).map((q: any, idx: number) => {
                const ans = answers[q.id];
                const showOther = ans?.luaChonIds.some((id: number) => q.luaChon.find((l: any) => l.id === id)?.coKhac);
                const isText = q.loai === 'text' || q.loai === 'rating';

                return (
                  <div key={q.id} className="qcard" style={{ background: 'var(--surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      <div style={{ background: 'var(--background)', width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{idx + 1}</div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>
                          {q.noiDung} {q.batBuoc && <span style={{ color: "var(--danger)" }}>*</span>}
                        </div>
                        {q.moTa && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{q.moTa}</div>}
                      </div>
                    </div>

                    <div style={{ marginLeft: 48 }}>
                      {isText ? (
                        <Textarea 
                          placeholder={q.moTa || "Nhập câu trả lời của bạn"}
                          value={ans?.dapAnKhac || ''}
                          onChange={(e) => handleOtherText(q.id, e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {q.luaChon.map((opt: any) => {
                            const isChecked = ans?.luaChonIds.includes(opt.id) || false;
                            if (q.loai === 'single') {
                              return (
                                <RadioCard 
                                  key={opt.id}
                                  label={opt.noiDung}
                                  checked={isChecked}
                                  onChange={() => handleSelectOption(q.id, q.loai, opt.id)}
                                />
                              );
                            } else {
                              return (
                                <CheckCard 
                                  key={opt.id}
                                  label={opt.noiDung}
                                  checked={isChecked}
                                  onChange={() => handleSelectOption(q.id, q.loai, opt.id)}
                                />
                              );
                            }
                          })}
                        </div>
                      )}

                      {!isText && showOther && (
                        <div style={{ marginTop: 12, padding: 16, background: 'var(--background)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                          <Textarea 
                            placeholder="Vui lòng ghi rõ (bắt buộc)..."
                            value={ans?.dapAnKhac || ''}
                            onChange={(e) => handleOtherText(q.id, e.target.value)}
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentStep.group && currentStep.group.nhom === 7 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--primary-tint)", color: "var(--primary)", display: "grid", placeItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 18 }}>7</span>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Phần 7</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{TEN_NHOM[7]}</h2>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{industryQuestions.length} câu hỏi</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {industryQuestions.map((q, idx) => {
                const ans = answers[q.id];
                const showOther = ans?.luaChonIds.some(id => q.options.find(o => o.id === id)?.isOther);
                const loai = q.questionType === 'open' ? 'text' : q.questionType === 'multiple' ? 'multiple' : 'single';
                const isText = loai === 'text';

                return (
                  <div key={q.id} className="qcard" style={{ background: 'var(--surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      <div style={{ background: 'var(--background)', width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{idx + 1}</div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>{q.content}</div>
                      </div>
                    </div>
                    
                    <div style={{ marginLeft: 48 }}>
                      {isText ? (
                        <Textarea 
                          placeholder="Nhập câu trả lời của bạn"
                          value={ans?.dapAnKhac || ''}
                          onChange={(e) => handleOtherText(q.id, e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {q.options.map(opt => {
                            const isChecked = ans?.luaChonIds.includes(opt.id) || false;
                            if (loai === 'single') {
                              return <RadioCard key={opt.id} label={opt.content} checked={isChecked} onChange={() => handleSelectOption(q.id, loai, opt.id)} />;
                            } else {
                              return <CheckCard key={opt.id} label={opt.content} checked={isChecked} onChange={() => handleSelectOption(q.id, loai, opt.id)} />;
                            }
                          })}
                        </div>
                      )}

                      {!isText && showOther && (
                        <div style={{ marginTop: 12, padding: 16, background: 'var(--background)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                          <Textarea 
                            placeholder="Vui lòng ghi rõ (bắt buộc)..."
                            value={ans?.dapAnKhac || ''}
                            onChange={(e) => handleOtherText(q.id, e.target.value)}
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentStep.id === 'solutions' && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--accent-tint)", color: "var(--accent)", display: "grid", placeItems: "center" }}>
                <Icons.Layers size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Giải pháp khuyến nghị</h2>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Chọn các giải pháp doanh nghiệp bạn đã/đang triển khai</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {industrySolutions.map(sol => (
                <CheckCard 
                  key={sol.id} 
                  label={<span style={{ fontWeight: 600 }}>{sol.name}</span>} 
                  hint={sol.description} 
                  checked={selectedSolutions.has(sol.id)} 
                  onChange={() => {
                    setSelectedSolutions(prev => {
                      const next = new Set(prev);
                      if (next.has(sol.id)) next.delete(sol.id);
                      else next.add(sol.id);
                      return next;
                    });
                    setSaved(false);
                    setTimeout(() => setSaved(true), 600);
                  }} 
                />
              ))}
            </div>
          </div>
        )}

        {currentStep.id === 'review' && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--success-tint)", color: "var(--success)", display: "grid", placeItems: "center" }}>
                <Icons.CheckCircle size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Hoàn tất khảo sát</h2>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Vui lòng đánh giá và gửi kết quả</div>
              </div>
            </div>

            <Card padding>
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Mức độ hài lòng của bạn về trải nghiệm? <span style={{color:'var(--danger)'}}>*</span></h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '20px 0' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setRating(star)}
                      style={{ 
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 40,
                        color: rating >= star ? '#F59E0B' : 'var(--border)',
                        transition: 'transform 0.2s, color 0.2s',
                        transform: rating >= star ? 'scale(1.1)' : 'scale(1)'
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {/* Tự đánh giá điểm chuyển đổi số */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    Theo bạn, doanh nghiệp sẽ được bao nhiêu điểm? <span style={{ color: 'var(--danger)' }}>*</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                    Tự đánh giá mức độ chuyển đổi số của doanh nghiệp từ 0 đến 100 điểm.
                  </div>

                  {/* Score display */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                    <div style={{
                      minWidth: 72, height: 72, borderRadius: 16,
                      background: selfScore >= 80 ? 'oklch(0.93 0.08 155)' : selfScore >= 60 ? 'oklch(0.94 0.08 250)' : selfScore >= 40 ? 'oklch(0.95 0.08 50)' : 'oklch(0.94 0.06 10)',
                      color: selfScore >= 80 ? 'oklch(0.42 0.16 155)' : selfScore >= 60 ? 'oklch(0.45 0.16 250)' : selfScore >= 40 ? 'oklch(0.48 0.16 50)' : 'oklch(0.48 0.16 10)',
                      display: 'grid', placeItems: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700,
                    }}>
                      {selfScore}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {selfScore >= 80 ? '🌟 Dẫn đầu — Chuyển đổi số tiên tiến'
                          : selfScore >= 60 ? '🚀 Phát triển — Đang đẩy mạnh CĐS'
                          : selfScore >= 40 ? '📈 Tăng trưởng — Đã có nền tảng cơ bản'
                          : selfScore >= 20 ? '🌱 Khởi đầu — Bước đầu thực hiện CĐS'
                          : '💡 Khám phá — Chưa triển khai CĐS'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        Điểm tự đánh giá / 100
                      </div>
                    </div>
                  </div>

                  {/* Slider */}
                  <div style={{ position: 'relative' }}>
                    <input
                      id="selfScoreSlider"
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={selfScore}
                      onChange={e => setSelfScore(Number(e.target.value))}
                      style={{
                        width: '100%',
                        accentColor: selfScore >= 80 ? 'oklch(0.50 0.16 155)'
                          : selfScore >= 60 ? 'oklch(0.50 0.16 250)'
                          : selfScore >= 40 ? 'oklch(0.52 0.16 50)'
                          : 'oklch(0.52 0.16 10)',
                        cursor: 'pointer',
                      }}
                    />
                    {/* Tick marks */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      {[0, 20, 40, 60, 80, 100].map(v => (
                        <span key={v} style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{v}</span>
                      ))}
                    </div>
                  </div>

                  {/* Quick pick buttons */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {[10, 25, 40, 55, 70, 85].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setSelfScore(v)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 999,
                          border: `1px solid ${selfScore === v ? 'var(--primary)' : 'var(--border)'}`,
                          background: selfScore === v ? 'var(--primary-tint)' : 'var(--surface)',
                          color: selfScore === v ? 'var(--primary)' : 'var(--text-muted)',
                          fontSize: 12,
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          fontWeight: selfScore === v ? 700 : 400,
                          transition: 'all 150ms',
                        }}
                      >
                        {v}đ
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label htmlFor="nhanXetTextarea" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Góp ý thêm (Tùy chọn)</label>
                  <Textarea
                    id="nhanXetTextarea"
                    placeholder="Giúp chúng tôi cải thiện hệ thống tốt hơn..." 
                    value={nhanXet} 
                    onChange={e => setNhanXet(e.target.value)} 
                    rows={4} 
                  />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Action Bar Sticky */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '16px 0', zIndex: 100, boxShadow: '0 -10px 40px rgba(0,0,0,0.03)' }}>
        <div style={{ width: 'min(1280px, calc(100% - 48px))', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
            <div style={{ width: '40%', maxWidth: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
                <span>Tiến độ hoàn thành</span>
                <span>{Math.round(progress)}% ({answered}/{totalQs})</span>
              </div>
              <Progress value={progress} variant="primary" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="ghost" onClick={prev} disabled={step === 0}>Quay lại</Button>
            {step === total - 1 ? (
              <Button variant="primary" onClick={handleSubmit} loading={submitting} iconRight={<Icons.Send size={16} />}>Nộp bài khảo sát</Button>
            ) : (
              <Button variant="primary" onClick={next} iconRight={<Icons.ChevronRight size={16} />}>Tiếp tục</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
