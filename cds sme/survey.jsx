/* global React, window */
// User survey for CDS SME
const { I: SI, Button: SBtn, Badge: SBadge, Card: SCard, RadioCard: SRadioCard, CheckCard: SCheckCard, Progress: SProgress, Avatar: SAvatar } = window;
const { SECTORS: SSECTORS, QUESTION_GROUPS: SGROUPS, QUESTIONS: SQUESTIONS } = window.CDS_DATA;

function UserSurvey() {
  const [step, setStep] = React.useState(0);
  const [sector, setSector] = React.useState("");
  const [answers, setAnswers] = React.useState({});
  const [saved, setSaved] = React.useState(true);

  // Steps: 0 = thông tin DN, 1..n = group, last = review
  const steps = [
    { id: "info", label: "Thông tin", icon: <SI.Building size={14} /> },
    ...SGROUPS.map((g) => ({ id: "g" + g.id, label: "Nhóm " + g.id, group: g.id, icon: <SI.ClipboardList size={14} /> })),
    { id: "review", label: "Xem lại", icon: <SI.CheckCircle size={14} /> },
  ];

  const current = steps[step];
  const total = steps.length;
  const answered = Object.keys(answers).length;
  const totalQs = SQUESTIONS.length;
  const progress = (answered / totalQs) * 100;

  const setAnswer = (code, value) => {
    setAnswers((prev) => ({ ...prev, [code]: value }));
    setSaved(false);
    setTimeout(() => setSaved(true), 600);
  };

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="survey">
      <header className="survey__topbar">
        <div className="survey__brand">
          <div className="brand__mark"><SI.Diamond size={20} /></div>
          <div>
            <div className="brand__name">Đánh giá doanh nghiệp nhỏ và vừa</div>
            <div className="text-xs text-muted">Bộ tiêu chí Chuyển đổi số · Phiên bản 1.0 / 2026</div>
          </div>
        </div>
        <div className="row gap-3">
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {saved ? <><SI.CheckCircle size={14} style={{ color: "var(--success)" }} /> Đã lưu nháp</> : <><SI.Loader size={14} className="spin" /> Đang lưu...</>}
          </div>
          <div className="row gap-2">
            <SAvatar name="Demo" size={32} />
            <div>
              <div className="text-sm font-semibold">Doanh nghiệp Demo</div>
              <div className="text-xs text-muted">user@cds.vn</div>
            </div>
          </div>
          <SBtn variant="ghost" size="sm" icon={<SI.LogOut size={14} />}>Đăng xuất</SBtn>
        </div>
      </header>

      {step === 0 && (
        <div className="survey__hero fade-in">
          <span className="survey__pill"><span className="dot" /> Phiên bản 1.0 — 2026</span>
          <h1>Đánh giá mức độ chuyển đổi số<br />của doanh nghiệp bạn</h1>
          <p>Bộ tiêu chí gồm <strong>{SQUESTIONS.length} câu hỏi</strong> được nhóm thành <strong>{SGROUPS.length} chủ đề</strong>. Trung bình mất 12–15 phút để hoàn thành — bạn có thể lưu nháp và quay lại bất kỳ lúc nào.</p>
        </div>
      )}

      <div className="survey__container fade-in">
        {/* Stepper */}
        <div className="survey__stepbar">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <button className={`step ${i === step ? "is-current" : ""} ${i < step ? "is-done" : ""}`} onClick={() => setStep(i)}>
                <span className="step__num"><span>{i + 1}</span></span>
                <span style={{ whiteSpace: "nowrap" }}>{s.label}</span>
              </button>
              {i < steps.length - 1 && <span className={`step-line ${i < step ? "is-done" : ""}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        {current.id === "info" && <InfoStep sector={sector} setSector={setSector} />}
        {current.group != null && (
          <GroupStep
            group={SGROUPS.find((g) => g.id === current.group)}
            questions={SQUESTIONS.filter((q) => q.group === current.group)}
            answers={answers}
            setAnswer={setAnswer}
            stepIndex={step}
          />
        )}
        {current.id === "review" && <ReviewStep answers={answers} />}
      </div>

      <div className="survey__actionbar">
        <div className="left">
          <SBtn variant="secondary" icon={<SI.ArrowLeft size={14} />} onClick={prev} disabled={step === 0}>Quay lại</SBtn>
          <div>
            <div className="text-xs text-muted mb-2 row gap-2">
              <span>Tiến độ {answered}/{totalQs} câu</span>
              <span>·</span>
              <span>Bước {step + 1}/{total}</span>
            </div>
            <SProgress value={progress} variant="accent" />
          </div>
        </div>
        <div className="row gap-2">
          <SBtn variant="ghost" icon={<SI.Save size={14} />}>Lưu nháp</SBtn>
          {step === total - 1 ? (
            <SBtn variant="primary" icon={<SI.Send size={14} />}>Nộp bài khảo sát</SBtn>
          ) : (
            <SBtn variant="primary" iconRight={<SI.ArrowRight size={14} />} onClick={next}>Tiếp tục</SBtn>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoStep({ sector, setSector }) {
  return (
    <SCard
      title="Thông tin doanh nghiệp"
      sub="Vui lòng cung cấp thông tin cơ bản trước khi bắt đầu khảo sát"
      padding
    >
      <div className="grid grid--cols-2 mb-4">
        <div className="field">
          <label className="field__label">Tên doanh nghiệp <span className="req">*</span></label>
          <input className="input" placeholder="Công ty TNHH …" defaultValue="Công ty TNHH Demo" />
        </div>
        <div className="field">
          <label className="field__label">Mã số thuế</label>
          <input className="input" placeholder="0123456789" />
        </div>
      </div>
      <div className="grid grid--cols-2 mb-4">
        <div className="field">
          <label className="field__label">Người đại diện <span className="req">*</span></label>
          <input className="input" placeholder="Nguyễn Văn A" />
        </div>
        <div className="field">
          <label className="field__label">Email liên hệ <span className="req">*</span></label>
          <input className="input" placeholder="email@doanhnghiep.vn" />
        </div>
      </div>
      <div className="field mb-4">
        <label className="field__label">Lĩnh vực / Ngành nghề chính <span className="req">*</span></label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
          {SSECTORS.map((s) => (
            <button
              key={s.id}
              className={`radio-card ${sector === s.id ? "is-checked" : ""}`}
              onClick={() => setSector(s.id)}
              style={{ padding: "10px 14px" }}
            >
              <span className="radio-card__dot" />
              <span className="radio-card__label" style={{ fontSize: 13 }}>{s.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label className="field__label">Địa chỉ trụ sở</label>
        <input className="input" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />
        <span className="field__hint">Thông tin sẽ chỉ được sử dụng để phân tích thống kê theo khu vực.</span>
      </div>
    </SCard>
  );
}

function GroupStep({ group, questions, answers, setAnswer, stepIndex }) {
  return (
    <div>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, padding: "0 4px" }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: "var(--primary-tint)", color: "var(--primary)",
          display: "grid", placeItems: "center",
        }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>{group.id}</span>
        </div>
        <div>
          <div className="text-xs text-muted font-mono" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>Phần {stepIndex} / 8</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", margin: "2px 0 0" }}>{group.name}</h2>
          <div className="text-sm text-muted">{questions.length} câu hỏi · Trọng số {group.weight.toFixed(2)}</div>
        </div>
      </div>

      {questions.map((q, idx) => (
        <div key={q.code} className="qcard fade-in" style={{ animationDelay: idx * 60 + "ms" }}>
          <div className="qcard__head">
            <div className="qcard__num">{q.code}</div>
            <div style={{ flex: 1 }}>
              <div className="qcard__title">{q.text} {q.required && <span style={{ color: "var(--danger)" }}>*</span>}</div>
              <div className="qcard__hint">
                {q.type === "single" ? "Chọn một đáp án" : "Có thể chọn nhiều đáp án"}
              </div>
            </div>
          </div>
          <div className="qcard__body">
            <div className="opt-grid">
              {q.options.map((opt, i) => {
                const value = answers[q.code];
                const checked = q.type === "single"
                  ? value === opt
                  : Array.isArray(value) && value.includes(opt);
                return q.type === "single" ? (
                  <SRadioCard
                    key={i}
                    label={opt}
                    checked={checked}
                    onChange={() => setAnswer(q.code, opt)}
                  />
                ) : (
                  <SCheckCard
                    key={i}
                    label={opt}
                    checked={checked}
                    onChange={() => {
                      const arr = Array.isArray(value) ? value : [];
                      setAnswer(q.code, arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]);
                    }}
                  />
                );
              })}
              {/* Always allow "Khác" custom option */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: "1.5px dashed var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--surface-muted)" }}>
                <SI.Pencil size={14} style={{ color: "var(--text-muted)" }} />
                <input
                  className="input"
                  style={{ height: 32, border: 0, background: "transparent", padding: 0, flex: 1 }}
                  placeholder="Khác (mô tả ngắn — AI sẽ hỗ trợ phân loại)"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewStep({ answers }) {
  const answered = Object.keys(answers).length;
  const totalQs = SQUESTIONS.length;
  return (
    <div>
      <SCard padding>
        <div style={{ textAlign: "center", padding: "32px 16px" }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: "var(--success-tint)", color: "var(--success)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <SI.CheckCircle size={36} />
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, margin: "0 0 8px" }}>Xem lại trước khi nộp</h2>
          <p style={{ color: "var(--text-muted)", maxWidth: "60ch", margin: "0 auto" }}>
            Bạn đã trả lời <strong>{answered}/{totalQs} câu</strong>. Sau khi nộp, hệ thống sẽ tự động chấm điểm bằng thuật toán TOPSIS và bộ phận quản trị sẽ duyệt trong vòng 3 ngày làm việc.
          </p>
        </div>

        <div className="grid grid--cols-2 mb-4">
          <div style={{ padding: 16, background: "var(--surface-muted)", borderRadius: "var(--r-md)" }}>
            <div className="text-xs text-muted">Hoàn thành</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600 }}>{answered}/{totalQs} câu</div>
            <SProgress value={(answered / totalQs) * 100} variant="success" />
          </div>
          <div style={{ padding: 16, background: "var(--surface-muted)", borderRadius: "var(--r-md)" }}>
            <div className="text-xs text-muted">Câu trả lời "Khác"</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600 }}>0 câu</div>
            <div className="text-xs text-muted mt-2">AI sẽ phân loại khi có</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SGROUPS.map((g) => {
            const groupQs = SQUESTIONS.filter((q) => q.group === g.id);
            const groupAnswered = groupQs.filter((q) => answers[q.code]).length;
            return (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                <span className="badge badge--neutral font-mono">N{g.id}</span>
                <div style={{ flex: 1 }}>
                  <div className="font-semibold text-sm">{g.name}</div>
                  <div className="text-xs text-muted">{groupAnswered}/{groupQs.length} câu hoàn thành</div>
                </div>
                {groupAnswered === groupQs.length ? (
                  <SBadge variant="success" dot>Hoàn thành</SBadge>
                ) : (
                  <SBadge variant="warning" dot>Cần bổ sung</SBadge>
                )}
              </div>
            );
          })}
        </div>
      </SCard>

      <div className="text-sm text-muted mt-6" style={{ textAlign: "center" }}>
        Bằng việc nộp khảo sát, bạn đồng ý với <a style={{ color: "var(--primary)", textDecoration: "underline" }}>Điều khoản sử dụng</a> và <a style={{ color: "var(--primary)", textDecoration: "underline" }}>Chính sách bảo mật dữ liệu</a>.
      </div>
    </div>
  );
}

window.UserSurvey = UserSurvey;
