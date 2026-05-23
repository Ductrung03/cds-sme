/* global React, window */
// Admin screens for CDS SME
const { useState, useMemo, useEffect } = React;
const { I, Button, Badge, Stat, Card, RadioCard, CheckCard, Toggle, Tabs, Chip, Progress, StatusBadge, Drawer, Modal, Avatar } = window;
const { SECTORS, QUESTION_GROUPS, QUESTIONS, SUBMISSIONS, SOLUTIONS, LEVELS, AI_REVIEW } = window.CDS_DATA;

const sectorName = (id) => (SECTORS.find((s) => s.id === id) || {}).name || id;
const groupName = (g) => (QUESTION_GROUPS.find((x) => x.id === g) || {}).name || g;

// =============================================================================
// SIDEBAR / SHELL
// =============================================================================
function Sidebar({ page, setPage }) {
  const items = [
    { id: "dashboard", label: "Tổng quan", icon: <I.Grid />, badge: null },
    { id: "assessments", label: "Bài khảo sát", icon: <I.ClipboardList />, badge: <Badge variant="accent">12</Badge> },
    { id: "questions", label: "Quản lý câu hỏi", icon: <I.HelpCircle /> },
    { id: "solutions", label: "Phụ lục III", icon: <I.Layers /> },
    { id: "scoring", label: "Cấu hình điểm", icon: <I.Sliders /> },
  ];
  const itemsAI = [
    { id: "ai-review", label: "AI Review", icon: <I.Sparkles />, badge: <Badge variant="accent" dot>8</Badge> },
    { id: "reports", label: "Báo cáo & Kết quả", icon: <I.BarChart /> },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand__mark"><I.Diamond size={20} /></div>
        <div>
          <div className="brand__name">CDS SME</div>
          <div className="brand__sub">Quản trị hệ thống</div>
        </div>
      </div>
      <nav className="nav">
        <div className="nav__label">Vận hành</div>
        {items.map((it) => (
          <button
            key={it.id}
            className={`nav__item ${page === it.id ? "is-active" : ""}`}
            onClick={() => setPage(it.id)}
          >
            <span className="ico">{it.icon}</span>
            <span>{it.label}</span>
            {it.badge}
          </button>
        ))}
        <div className="nav__label">Phân tích</div>
        {itemsAI.map((it) => (
          <button
            key={it.id}
            className={`nav__item ${page === it.id ? "is-active" : ""}`}
            onClick={() => setPage(it.id)}
          >
            <span className="ico">{it.icon}</span>
            <span>{it.label}</span>
            {it.badge}
          </button>
        ))}
      </nav>
      <div className="sidebar__user">
        <Avatar name="QT Viên" />
        <div>
          <div className="name">Quản trị viên</div>
          <div className="role">admin@cds.vn</div>
        </div>
        <button className="icon-btn" title="Đăng xuất"><I.LogOut size={16} /></button>
      </div>
    </aside>
  );
}

function Topbar({ crumbs, primaryAction }) {
  return (
    <header className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep"><I.ChevronRight size={14} /></span>}
            {i === crumbs.length - 1 ? <strong>{c}</strong> : <span>{c}</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="search">
        <I.Search size={16} style={{ color: "var(--text-subtle)" }} />
        <input placeholder="Tìm doanh nghiệp, câu hỏi, giải pháp…" />
        <kbd>⌘K</kbd>
      </div>
      <div className="topbar__actions">
        <button className="topbar__icon-btn" title="Hướng dẫn"><I.HelpCircle size={18} /><span className="dot" /></button>
        <button className="topbar__icon-btn" title="Thông báo"><I.Bell size={18} /></button>
        <button className="topbar__icon-btn" title="Cài đặt"><I.Settings size={18} /></button>
        {primaryAction}
      </div>
    </header>
  );
}

// =============================================================================
// DASHBOARD
// =============================================================================
function PageDashboard({ goTo }) {
  return (
    <>
      <Topbar
        crumbs={["Tổng quan"]}
        primaryAction={<Button variant="primary" icon={<I.Download size={16} />}>Xuất báo cáo</Button>}
      />
      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Tổng quan hệ thống</h1>
            <p className="page__sub">Theo dõi tiến độ chấm điểm, phê duyệt và mức độ chuyển đổi số của các doanh nghiệp đang khảo sát trong kỳ.</p>
          </div>
          <div className="row gap-2">
            <select className="select" style={{ width: 200 }} defaultValue="2026Q2">
              <option value="2026Q2">Kỳ: Quý 2 / 2026</option>
              <option value="2026Q1">Kỳ: Quý 1 / 2026</option>
              <option value="2025Q4">Kỳ: Quý 4 / 2025</option>
            </select>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid--cols-4 mb-4 fade-in">
          <Stat label="Tổng số bài nộp" value="248" icon={<I.ClipboardList size={18} />} delta="+12 tuần này" deltaDir="up" progress={92} accent="primary" />
          <Stat label="Chờ xét duyệt" value="14" icon={<I.Clock size={18} />} delta="−3" deltaDir="down" progress={58} accent="accent" />
          <Stat label="Đã chấm điểm" value="186" icon={<I.CheckCircle size={18} />} delta="+8 hôm nay" deltaDir="up" progress={75} accent="info" />
          <Stat label="Đã công bố" value="142" icon={<I.Send size={18} />} delta="+5" deltaDir="up" progress={57} accent="success" />
        </div>

        {/* Two-column main */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
          <Card
            title="Bài khảo sát gần đây"
            sub="Cập nhật theo thời gian thực, theo dõi tiến độ chấm điểm từng bài"
            action={
              <div className="row gap-2">
                <Button variant="ghost" size="sm" icon={<I.Filter size={14} />}>Lọc</Button>
                <Button variant="secondary" size="sm" onClick={() => goTo("assessments")}>Xem tất cả</Button>
              </div>
            }
            padding={false}
          >
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Doanh nghiệp</th>
                    <th>Ngành nghề</th>
                    <th>Trạng thái</th>
                    <th>Điểm / Cấp độ</th>
                    <th className="col-actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {SUBMISSIONS.slice(0, 6).map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="row gap-3">
                          <Avatar name={s.company} size={36} />
                          <div>
                            <div className="cell-primary">{s.company}</div>
                            <div className="cell-sub">{s.contact} · {s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><Badge variant="neutral">{sectorName(s.sector)}</Badge></td>
                      <td><StatusBadge status={s.status} /></td>
                      <td>
                        {s.score != null ? (
                          <div>
                            <div className="font-semibold">{s.score.toFixed(1)} <span className="text-xs text-muted">/100</span></div>
                            <div className="cell-sub">Cấp độ {s.level} · {LEVELS[s.level - 1]?.name}</div>
                          </div>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td className="col-actions">
                        <Button variant="ghost" size="sm" icon={<I.ArrowRight size={14} />}>Chi tiết</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card title="Phân bố cấp độ CĐS" sub="Trong 186 bài đã chấm điểm">
              <LevelDistribution />
            </Card>
            <Card title="Hàng chờ AI" sub="Câu trả lời 'Khác' cần admin duyệt"
              action={<Button size="xs" variant="ghost" onClick={() => goTo("ai-review")}>Mở</Button>}>
              <AIQueueMini goTo={goTo} />
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function LevelDistribution() {
  const data = [
    { lv: "LV1", name: "Mới bắt đầu", count: 12, color: "oklch(0.6 0.18 25)" },
    { lv: "LV2", name: "Cơ bản", count: 28, color: "oklch(0.68 0.16 50)" },
    { lv: "LV3", name: "Trung bình", count: 56, color: "oklch(0.72 0.14 70)" },
    { lv: "LV4", name: "Khá", count: 64, color: "oklch(0.6 0.14 155)" },
    { lv: "LV5", name: "Xuất sắc", count: 26, color: "oklch(0.55 0.13 200)" },
  ];
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {data.map((d) => (
        <div key={d.lv}>
          <div className="row row--between" style={{ marginBottom: 6 }}>
            <div className="row gap-2">
              <span className="badge badge--neutral" style={{ fontFamily: "var(--font-mono)", fontSize: 11, height: 20, padding: "0 8px" }}>{d.lv}</span>
              <span style={{ fontSize: 13 }}>{d.name}</span>
            </div>
            <span className="text-sm font-semibold">{d.count}</span>
          </div>
          <div className="progress" style={{ background: "var(--surface-muted)" }}>
            <div className="progress__bar" style={{ width: (d.count / max) * 100 + "%", background: d.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AIQueueMini({ goTo }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {AI_REVIEW.slice(0, 3).map((a) => (
        <div key={a.id} style={{ padding: 12, background: "var(--surface-muted)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
          <div className="row row--between" style={{ marginBottom: 6 }}>
            <span className="text-xs text-muted font-mono">{a.sub} · Câu {a.q}</span>
            <Badge variant="accent">{Math.round(a.confidence * 100)}%</Badge>
          </div>
          <div className="text-sm" style={{ lineHeight: 1.5 }}>"{a.rawAnswer.slice(0, 80)}{a.rawAnswer.length > 80 ? "…" : ""}"</div>
          <div className="row gap-2 mt-2">
            <I.Sparkles size={14} style={{ color: "var(--accent)" }} />
            <span className="text-xs text-muted">Gợi ý: <span className="font-medium" style={{ color: "var(--text)" }}>{a.aiSuggest}</span></span>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// ASSESSMENTS
// =============================================================================
function PageAssessments() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(null);

  const filtered = SUBMISSIONS.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (search && !(s.company.toLowerCase().includes(search.toLowerCase()) || s.contact.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const counts = useMemo(() => {
    return {
      all: SUBMISSIONS.length,
      draft: SUBMISSIONS.filter((s) => s.status === "draft").length,
      submitted: SUBMISSIONS.filter((s) => s.status === "submitted").length,
      reviewing: SUBMISSIONS.filter((s) => s.status === "reviewing").length,
      scored: SUBMISSIONS.filter((s) => s.status === "scored").length,
      published: SUBMISSIONS.filter((s) => s.status === "published").length,
    };
  }, []);

  return (
    <>
      <Topbar
        crumbs={["Bài khảo sát", "Danh sách"]}
        primaryAction={
          <div className="row gap-2">
            <Button variant="secondary" size="sm" icon={<I.Upload size={14} />}>Nhập CSV</Button>
            <Button variant="primary" size="sm" icon={<I.Plus size={14} />}>Tạo mới</Button>
          </div>
        }
      />
      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Bài khảo sát</h1>
            <p className="page__sub">Quản lý vòng đời khảo sát — từ lúc nộp, AI hỗ trợ phân loại, đến chấm điểm và công bố cấp độ chuyển đổi số.</p>
          </div>
        </div>

        <Card padding={false}>
          <div className="card__head" style={{ flexWrap: "wrap", gap: 12 }}>
            <div className="chip-row" style={{ flex: 1 }}>
              <Chip active={filter === "all"} count={counts.all} onClick={() => setFilter("all")}>Tất cả</Chip>
              <Chip active={filter === "draft"} count={counts.draft} onClick={() => setFilter("draft")}>Nháp</Chip>
              <Chip active={filter === "submitted"} count={counts.submitted} onClick={() => setFilter("submitted")}>Đã nộp</Chip>
              <Chip active={filter === "reviewing"} count={counts.reviewing} onClick={() => setFilter("reviewing")}>Chờ duyệt</Chip>
              <Chip active={filter === "scored"} count={counts.scored} onClick={() => setFilter("scored")}>Đã chấm</Chip>
              <Chip active={filter === "published"} count={counts.published} onClick={() => setFilter("published")}>Đã công bố</Chip>
            </div>
            <div className="row gap-2">
              <div className="input-group" style={{ width: 240 }}>
                <span className="input-group__icon"><I.Search size={14} /></span>
                <input className="input" placeholder="Tìm doanh nghiệp" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="select" style={{ width: 180 }} defaultValue="all">
                <option value="all">Tất cả ngành</option>
                {SECTORS.map((s) => <option key={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}><input type="checkbox" /></th>
                  <th>Mã / Doanh nghiệp</th>
                  <th>Ngành</th>
                  <th>Trạng thái</th>
                  <th>Điểm</th>
                  <th>Cấp độ</th>
                  <th>AI Review</th>
                  <th>Thời gian</th>
                  <th className="col-actions"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <div>
                        <div className="text-xs text-muted font-mono">{s.id}</div>
                        <div className="cell-primary">{s.company}</div>
                        <div className="cell-sub">{s.contact}</div>
                      </div>
                    </td>
                    <td><Badge variant="neutral">{sectorName(s.sector)}</Badge></td>
                    <td><StatusBadge status={s.status} /></td>
                    <td>{s.score != null ? <span className="font-mono font-semibold">{s.score.toFixed(1)}</span> : <span className="text-muted">—</span>}</td>
                    <td>
                      {s.level ? (
                        <span className="badge" style={{ background: LEVELS[s.level - 1].color + "22", color: LEVELS[s.level - 1].color, borderColor: "transparent" }}>
                          LV{s.level} · {LEVELS[s.level - 1].name}
                        </span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      {s.aiReviewCount > 0 ? (
                        <span className="row gap-2">
                          <I.Sparkles size={14} style={{ color: "var(--accent)" }} />
                          <span className="text-sm">{s.aiReviewCount} câu</span>
                        </span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="text-sm text-muted font-mono">{s.submittedAt}</td>
                    <td className="col-actions">
                      <div className="row gap-2">
                        <Button variant="ghost" size="sm" icon={<I.Eye size={14} />} onClick={() => setOpen(s)}>Xem</Button>
                        <Button variant="ghost" size="sm" icon={<I.More size={14} />}></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card__foot">
            <span className="text-sm text-muted">Hiển thị {filtered.length} / {SUBMISSIONS.length} bài</span>
            <div className="row gap-2" style={{ marginLeft: "auto" }}>
              <Button variant="ghost" size="sm" icon={<I.ChevronLeft size={14} />}>Trước</Button>
              <span className="text-sm">Trang 1 / 4</span>
              <Button variant="ghost" size="sm" iconRight={<I.ChevronRight size={14} />}>Sau</Button>
            </div>
          </div>
        </Card>
      </div>

      <AssessmentDrawer item={open} onClose={() => setOpen(null)} />
    </>
  );
}

function AssessmentDrawer({ item, onClose }) {
  if (!item) return null;
  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <div className="row gap-3">
          <Avatar name={item.company} />
          <div>
            <div className="text-xs text-muted font-mono">{item.id}</div>
            <div className="drawer__title">{item.company}</div>
          </div>
        </div>
      }
      width={620}
      foot={
        <>
          <Button variant="secondary">Tạm hoãn</Button>
          <Button variant="ghost">Tải PDF</Button>
          <Button variant="primary" icon={<I.CheckCircle size={16} />}>Duyệt và chấm điểm</Button>
        </>
      }
    >
      <div className="grid grid--cols-3 mb-4">
        <div>
          <div className="text-xs text-muted">Ngành nghề</div>
          <div className="font-semibold mt-2">{sectorName(item.sector)}</div>
        </div>
        <div>
          <div className="text-xs text-muted">Trạng thái</div>
          <div className="mt-2"><StatusBadge status={item.status} /></div>
        </div>
        <div>
          <div className="text-xs text-muted">Nộp lúc</div>
          <div className="font-semibold mt-2 font-mono text-sm">{item.submittedAt}</div>
        </div>
      </div>

      <Card title="Điểm dự kiến (TOPSIS)" padding>
        <div className="row gap-4">
          <div>
            <div className="text-xs text-muted">Tổng điểm</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {item.score?.toFixed(1) || "—"}
              <span style={{ fontSize: 16, color: "var(--text-muted)", fontWeight: 400 }}> /100</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <RadarPreview />
          </div>
        </div>
      </Card>

      <div className="mt-4">
        <h3 className="card__title mb-2">Trả lời theo nhóm</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {QUESTION_GROUPS.slice(0, 4).map((g) => {
            const v = 30 + ((g.id * 17) % 70);
            return (
              <div key={g.id} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                <div className="row row--between mb-2">
                  <div>
                    <div className="font-medium">Nhóm {g.id}: {g.name}</div>
                    <div className="text-xs text-muted">Trọng số {g.weight.toFixed(2)} · 5 câu hỏi</div>
                  </div>
                  <span className="font-mono font-semibold">{v}/100</span>
                </div>
                <Progress value={v} />
              </div>
            );
          })}
        </div>
      </div>
    </Drawer>
  );
}

function RadarPreview({ size = 160 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 18;
  const labels = ["TT chung", "Hạ tầng", "Chiến lược", "Rào cản", "ESG", "Văn hoá"];
  const values = [0.65, 0.78, 0.55, 0.42, 0.72, 0.6];
  const angle = (i) => (Math.PI * 2 * i) / labels.length - Math.PI / 2;
  const pt = (i, v) => [cx + r * v * Math.cos(angle(i)), cy + r * v * Math.sin(angle(i))];
  const grids = [0.25, 0.5, 0.75, 1].map((g) =>
    labels.map((_, i) => pt(i, g)).map((p) => p.join(",")).join(" ")
  );
  const data = values.map((v, i) => pt(i, v).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="radar">
      {grids.map((g, i) => <polygon key={i} points={g} fill="none" stroke="var(--border)" strokeWidth={1} />)}
      {labels.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth={1} />;
      })}
      <polygon points={data} fill="var(--primary)" fillOpacity={0.18} stroke="var(--primary)" strokeWidth={2} />
      {values.map((v, i) => {
        const [x, y] = pt(i, v);
        return <circle key={i} cx={x} cy={y} r={3} fill="var(--primary)" />;
      })}
    </svg>
  );
}

// =============================================================================
// QUESTIONS
// =============================================================================
function PageQuestions() {
  const [group, setGroup] = useState("all");
  const [editing, setEditing] = useState(null);
  return (
    <>
      <Topbar
        crumbs={["Quản lý câu hỏi"]}
        primaryAction={<Button variant="primary" size="sm" icon={<I.Plus size={14} />}>Thêm câu hỏi</Button>}
      />
      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Quản lý câu hỏi</h1>
            <p className="page__sub">Bộ tiêu chí đánh giá theo Phụ lục I. Mỗi câu hỏi thuộc một nhóm tiêu chí với trọng số riêng dùng cho thuật toán TOPSIS.</p>
          </div>
          <div className="row gap-2">
            <Button variant="secondary" size="sm" icon={<I.Download size={14} />}>Xuất Excel</Button>
            <Button variant="secondary" size="sm" icon={<I.Upload size={14} />}>Nhập từ file</Button>
          </div>
        </div>

        <div className="grid mb-4" style={{ gridTemplateColumns: "240px 1fr", gap: 20 }}>
          {/* Sidebar groups */}
          <Card title="Nhóm câu hỏi" padding>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button
                className={`nav__item ${group === "all" ? "is-active" : ""}`}
                style={{ color: group === "all" ? "var(--primary)" : "var(--text)", background: group === "all" ? "var(--primary-tint)" : "transparent" }}
                onClick={() => setGroup("all")}
              >
                <span>Tất cả nhóm</span>
                <Badge variant="neutral">{QUESTIONS.length}</Badge>
              </button>
              {QUESTION_GROUPS.map((g) => {
                const count = QUESTIONS.filter((q) => q.group === g.id).length;
                const active = group === g.id;
                return (
                  <button
                    key={g.id}
                    className={`nav__item`}
                    style={{ color: active ? "var(--primary)" : "var(--text)", background: active ? "var(--primary-tint)" : "transparent" }}
                    onClick={() => setGroup(g.id)}
                  >
                    <span className="text-xs font-mono" style={{ color: "var(--text-subtle)" }}>N{g.id}</span>
                    <span style={{ flex: 1, fontSize: 13 }}>{g.name}</span>
                    <Badge variant="neutral">{count}</Badge>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card padding={false}>
            <div className="card__head">
              <div className="card__title">{group === "all" ? "Tất cả câu hỏi" : "Nhóm " + group + ": " + groupName(group)}</div>
              <div className="row gap-2" style={{ marginLeft: "auto" }}>
                <select className="select" style={{ width: 200 }} defaultValue="all">
                  <option value="all">Tất cả ngành</option>
                  {SECTORS.map((s) => <option key={s.id}>{s.name}</option>)}
                </select>
                <Button variant="secondary" size="sm" icon={<I.Filter size={14} />}>Bộ lọc</Button>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Mã</th>
                    <th>Nội dung</th>
                    <th style={{ width: 100 }}>Loại</th>
                    <th style={{ width: 100 }}>Bắt buộc</th>
                    <th style={{ width: 120 }}>Số lựa chọn</th>
                    <th className="col-actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {QUESTIONS.filter((q) => group === "all" || q.group === group).map((q) => (
                    <tr key={q.code}>
                      <td>
                        <span className="badge badge--neutral font-mono" style={{ fontSize: 11 }}>{q.code}</span>
                      </td>
                      <td>
                        <div className="cell-primary">{q.text}</div>
                        <div className="cell-sub">Nhóm {q.group} · {groupName(q.group).slice(0, 40)}</div>
                      </td>
                      <td>
                        <Badge variant={q.type === "single" ? "primary" : "info"}>
                          {q.type === "single" ? "Một lựa chọn" : "Nhiều lựa chọn"}
                        </Badge>
                      </td>
                      <td>
                        {q.required ? <Badge variant="danger" dot>Bắt buộc</Badge> : <Badge variant="neutral">Tuỳ chọn</Badge>}
                      </td>
                      <td className="font-mono">{q.options.length}</td>
                      <td className="col-actions">
                        <Button variant="ghost" size="sm" icon={<I.Pencil size={14} />} onClick={() => setEditing(q)}>Sửa</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <QuestionEditDrawer q={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function QuestionEditDrawer({ q, onClose }) {
  if (!q) return null;
  return (
    <Drawer
      open onClose={onClose}
      title={<>Chỉnh sửa câu hỏi <span className="font-mono text-muted text-sm">({q.code})</span></>}
      width={560}
      foot={
        <>
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button variant="primary" icon={<I.Save size={14} />}>Lưu thay đổi</Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field">
          <label className="field__label">Nội dung câu hỏi <span className="req">*</span></label>
          <textarea className="textarea" defaultValue={q.text} rows={3} />
          <span className="field__hint">Viết rõ ràng, không dùng từ chuyên ngành phức tạp.</span>
        </div>
        <div className="row gap-3">
          <div className="field" style={{ flex: 1 }}>
            <label className="field__label">Nhóm</label>
            <select className="select" defaultValue={q.group}>
              {QUESTION_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.id}. {g.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label className="field__label">Loại trả lời</label>
            <select className="select" defaultValue={q.type}>
              <option value="single">Một lựa chọn</option>
              <option value="multiple">Nhiều lựa chọn</option>
            </select>
          </div>
        </div>
        <div className="row gap-3">
          <div className="row gap-2">
            <Toggle on={q.required} onChange={() => {}} />
            <span className="text-sm">Bắt buộc trả lời</span>
          </div>
          <div className="row gap-2">
            <Toggle on={true} onChange={() => {}} />
            <span className="text-sm">Cho phép câu trả lời "Khác"</span>
          </div>
        </div>
        <div className="field">
          <div className="row row--between mb-2">
            <label className="field__label">Lựa chọn ({q.options.length})</label>
            <Button variant="ghost" size="xs" icon={<I.Plus size={12} />}>Thêm lựa chọn</Button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q.options.map((o, i) => (
              <div key={i} className="row gap-2" style={{ padding: 10, border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                <span className="text-xs text-muted font-mono" style={{ width: 24 }}>{i + 1}</span>
                <input className="input" style={{ height: 36, border: 0, padding: 0 }} defaultValue={o} />
                <input className="input" style={{ height: 36, width: 80 }} defaultValue={(i + 1)} placeholder="Điểm" />
                <button className="icon-btn" style={{ color: "var(--text-subtle)" }}><I.Trash size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

// =============================================================================
// SOLUTIONS (Phụ lục III)
// =============================================================================
function PageSolutions() {
  const [sector, setSector] = useState("all");
  const filtered = SOLUTIONS.filter((s) => sector === "all" || s.sector === sector);
  const bySector = useMemo(() => {
    const m = {};
    filtered.forEach((s) => { (m[s.sector] = m[s.sector] || []).push(s); });
    return m;
  }, [sector]);
  return (
    <>
      <Topbar
        crumbs={["Phụ lục III", "Quản lý giải pháp số"]}
        primaryAction={<Button variant="primary" size="sm" icon={<I.Plus size={14} />}>Thêm giải pháp</Button>}
      />
      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Phụ lục III — Giải pháp số theo ngành</h1>
            <p className="page__sub">Catalog các giải pháp công nghệ áp dụng cho từng ngành. Giải pháp <strong>tiền đề</strong> tính hệ số 1.0; giải pháp <strong>phụ thuộc</strong> chỉ tính hệ số 0.5 khi giải pháp tiền đề chưa đạt.</p>
          </div>
        </div>

        <div className="row gap-2 mb-4">
          <Chip active={sector === "all"} onClick={() => setSector("all")}>Tất cả</Chip>
          {SECTORS.map((s) => (
            <Chip key={s.id} active={sector === s.id} count={SOLUTIONS.filter((x) => x.sector === s.id).length} onClick={() => setSector(s.id)}>
              {s.name}
            </Chip>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {Object.entries(bySector).map(([sid, list]) => (
            <Card key={sid} padding={false}>
              <div className="card__head">
                <div className="row gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--primary-tint)", color: "var(--primary)", display: "grid", placeItems: "center" }}>
                    <I.Building size={18} />
                  </div>
                  <div>
                    <div className="card__title">{sectorName(sid)}</div>
                    <div className="card__sub">{list.length} giải pháp · {list.filter(x => !x.depends).length} tiền đề · {list.filter(x => x.depends).length} phụ thuộc</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" icon={<I.Plus size={14} />} style={{ marginLeft: "auto" }}>Thêm</Button>
              </div>
              <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {list.map((s) => (
                  <SolutionCard key={s.code} s={s} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

function SolutionCard({ s }) {
  const isFoundation = !s.depends;
  return (
    <div style={{
      padding: 14,
      border: "1px solid var(--border)",
      borderRadius: "var(--r-md)",
      background: isFoundation ? "var(--primary-tint)" : "var(--surface)",
      borderColor: isFoundation ? "var(--primary)" : "var(--border)",
      borderLeftWidth: 3,
      borderLeftColor: isFoundation ? "var(--primary)" : "var(--accent)",
      transition: "all 200ms var(--ease-out)",
    }}>
      <div className="row gap-2 mb-2">
        <span className="badge badge--neutral font-mono" style={{ fontSize: 11 }}>{s.code}</span>
        <Badge variant={isFoundation ? "primary" : "accent"}>{isFoundation ? "Tiền đề (1.0)" : "Phụ thuộc (0.5)"}</Badge>
      </div>
      <div className="font-semibold text-sm" style={{ lineHeight: 1.4 }}>{s.name}</div>
      {s.depends && (
        <div className="row gap-2 mt-2 text-xs text-muted">
          <I.ArrowRight size={12} /> Phụ thuộc <span className="font-mono">{s.depends}</span>
        </div>
      )}
      <div className="row gap-2 mt-3">
        <Button variant="ghost" size="xs" icon={<I.Pencil size={12} />}>Sửa</Button>
        <Button variant="ghost" size="xs" icon={<I.Trash size={12} />}>Xoá</Button>
      </div>
    </div>
  );
}

// =============================================================================
// SCORING
// =============================================================================
function PageScoring() {
  const [levels, setLevels] = useState(LEVELS);
  const [groups, setGroups] = useState(QUESTION_GROUPS);

  return (
    <>
      <Topbar
        crumbs={["Cấu hình điểm"]}
        primaryAction={<Button variant="primary" size="sm" icon={<I.Save size={14} />}>Lưu cấu hình</Button>}
      />
      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Cấu hình điểm</h1>
            <p className="page__sub">Quản lý ngưỡng cấp độ chuyển đổi số và trọng số nhóm câu hỏi dùng cho thuật toán TOPSIS.</p>
          </div>
        </div>

        {/* Algorithm summary */}
        <Card title="Quy tắc tính điểm" padding>
          <div className="grid grid--cols-3 mb-4">
            <RuleCard icon={<I.Cpu size={18} />} title="Thuật toán TOPSIS"
              body="TOPSIS tổng hợp điểm các câu hỏi theo trọng số nhóm để tạo ra điểm thô phản ánh khoảng cách tới giải pháp lý tưởng." />
            <RuleCard icon={<I.Database size={18} />} title="Chuẩn hoá thang điểm 0–100"
              body="Điểm thô được chuẩn hoá về thang 0–100 và đối chiếu với ngưỡng cấp độ (1–5) để xác định mức độ chuyển đổi số." />
            <RuleCard icon={<I.Layers size={18} />} title="Phụ lục III"
              body="Giải pháp KHÔNG phụ thuộc tính hệ số 1.0; giải pháp PHỤ THUỘC tính 0.5 khi giải pháp tiên quyết chưa đạt." />
          </div>
          <div className="row gap-2" style={{ padding: 12, background: "var(--warning-tint)", borderRadius: "var(--r-md)", border: "1px solid oklch(0.85 0.07 70)" }}>
            <I.AlertTriangle size={16} style={{ color: "oklch(0.55 0.14 65)", flexShrink: 0 }} />
            <div className="text-sm">
              <strong>Admin có quyền điều chỉnh điểm cuối cùng</strong>, nhưng <strong>BẮT BUỘC</strong> phải nhập lý do; mọi thao tác đều được ghi vào nhật ký audit.
            </div>
          </div>
        </Card>

        {/* Levels */}
        <Card className="mt-6" title="Ngưỡng cấp độ chuyển đổi số (1–5)" sub="Mỗi cấp độ tương ứng với một khoảng điểm sau khi chuẩn hoá về 0–100" padding={false}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Cấp</th>
                  <th style={{ width: 80 }}>Mã</th>
                  <th>Tên cấp độ</th>
                  <th style={{ width: 120 }}>Tối thiểu</th>
                  <th style={{ width: 120 }}>Tối đa</th>
                  <th>Mô tả</th>
                  <th className="col-actions"></th>
                </tr>
              </thead>
              <tbody>
                {levels.map((l, i) => (
                  <tr key={l.lv}>
                    <td>
                      <div className="row gap-2">
                        <span style={{ width: 6, height: 32, borderRadius: 3, background: l.color }} />
                        <span className="font-mono font-semibold">{l.lv}</span>
                      </div>
                    </td>
                    <td><span className="badge badge--neutral font-mono">{l.code}</span></td>
                    <td>
                      <input className="input" style={{ height: 36 }} defaultValue={`Cấp độ ${l.lv} - ${l.name}`} />
                    </td>
                    <td><input className="input font-mono" style={{ height: 36 }} defaultValue={l.min} /></td>
                    <td><input className="input font-mono" style={{ height: 36 }} defaultValue={l.max} /></td>
                    <td><input className="input" style={{ height: 36 }} defaultValue={l.desc} /></td>
                    <td className="col-actions"><Button variant="ghost" size="sm" icon={<I.Save size={14} />}>Lưu</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Level visual */}
        <Card className="mt-6" title="Phân bố ngưỡng trực quan" padding>
          <LevelSpectrum levels={levels} />
        </Card>

        {/* Group weights */}
        <Card className="mt-6" title="Trọng số nhóm câu hỏi" sub="Trọng số dùng cho thuật toán TOPSIS. Giá trị càng cao thì nhóm càng ảnh hưởng đến điểm tổng." padding={false}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Nhóm</th>
                  <th>Tên nhóm</th>
                  <th style={{ width: 240 }}>Trọng số hiện tại</th>
                  <th style={{ width: 160 }}>Trọng số mới</th>
                  <th className="col-actions"></th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.id}>
                    <td><span className="badge badge--neutral font-mono">N{g.id}</span></td>
                    <td>
                      <div className="cell-primary">{g.name}</div>
                      <div className="cell-sub">{QUESTIONS.filter((q) => q.group === g.id).length} câu hỏi</div>
                    </td>
                    <td>
                      <div className="row gap-3">
                        <Progress value={(g.weight / 2) * 100} />
                        <span className="font-mono font-semibold" style={{ width: 60, textAlign: "right" }}>{g.weight.toFixed(4)}</span>
                      </div>
                    </td>
                    <td>
                      <input className="input font-mono" style={{ height: 36 }} defaultValue={g.weight} step="0.1" type="number" />
                    </td>
                    <td className="col-actions"><Button variant="ghost" size="sm" icon={<I.Save size={14} />}>Lưu</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function RuleCard({ icon, title, body }) {
  return (
    <div style={{ padding: 16, background: "var(--surface-muted)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface)", color: "var(--primary)", display: "grid", placeItems: "center", marginBottom: 12, border: "1px solid var(--border)" }}>
        {icon}
      </div>
      <div className="font-semibold mb-2">{title}</div>
      <div className="text-sm text-muted" style={{ lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

function LevelSpectrum({ levels }) {
  return (
    <div style={{ position: "relative", padding: "32px 0 8px" }}>
      <div style={{
        display: "flex", borderRadius: "var(--r-md)", overflow: "hidden",
        height: 16, boxShadow: "inset 0 1px 2px rgba(0,0,0,.06)",
      }}>
        {levels.map((l) => (
          <div key={l.lv} style={{ flex: l.max - l.min + 1, background: l.color }} />
        ))}
      </div>
      <div style={{ display: "flex", marginTop: 10 }}>
        {levels.map((l) => (
          <div key={l.lv} style={{ flex: l.max - l.min + 1, padding: "0 8px" }}>
            <div className="row gap-2">
              <span className="font-mono font-bold" style={{ fontSize: 12, color: l.color }}>{l.code}</span>
              <span className="font-semibold text-sm">{l.name}</span>
            </div>
            <div className="text-xs text-muted font-mono mt-2">{l.min}–{l.max} điểm</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// AI REVIEW
// =============================================================================
function PageAIReview() {
  const [items, setItems] = useState(AI_REVIEW);
  const [selectedId, setSelectedId] = useState(items[0]?.id);
  const selected = items.find((i) => i.id === selectedId);

  const approve = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    const remaining = items.filter((i) => i.id !== id);
    setSelectedId(remaining[0]?.id);
  };

  return (
    <>
      <Topbar
        crumbs={["Phân tích", "AI Review"]}
        primaryAction={
          <div className="row gap-2">
            <Button variant="secondary" size="sm" icon={<I.Sparkles size={14} />}>Chạy lại AI</Button>
            <Button variant="primary" size="sm" icon={<I.CheckCircle size={14} />}>Duyệt tất cả</Button>
          </div>
        }
      />
      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">
              AI Review
              <span style={{ display: "inline-flex", marginLeft: 12, alignItems: "center", gap: 6, fontSize: 14, color: "var(--accent)", fontWeight: 500, verticalAlign: "middle" }}>
                <I.Sparkles size={16} /> Trợ lý phân loại
              </span>
            </h1>
            <p className="page__sub">Các câu trả lời "Khác" được AI phân tích, gán nhãn vào danh mục có sẵn và đề xuất điểm thành phần. Admin duyệt nhanh hoặc điều chỉnh.</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20, alignItems: "start" }}>
          {/* Queue */}
          <Card padding={false}>
            <div className="card__head">
              <div className="card__title">Hàng chờ <span className="text-muted font-medium">({items.length})</span></div>
              <Button variant="ghost" size="sm" style={{ marginLeft: "auto" }} icon={<I.Filter size={14} />}></Button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", maxHeight: 560, overflowY: "auto" }}>
              {items.length === 0 ? (
                <div className="empty">
                  <div className="empty__icon"><I.CheckCircle size={28} /></div>
                  <div className="empty__title">Đã duyệt hết</div>
                  <div className="empty__sub">Không còn câu trả lời "Khác" cần xử lý.</div>
                </div>
              ) : items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setSelectedId(it.id)}
                  style={{
                    display: "block", textAlign: "left",
                    padding: "14px 18px",
                    borderBottom: "1px solid var(--border)",
                    background: selectedId === it.id ? "var(--primary-tint)" : "transparent",
                    cursor: "pointer",
                    transition: "background var(--dur)",
                    position: "relative",
                  }}
                >
                  {selectedId === it.id && (
                    <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, background: "var(--primary)", borderRadius: "0 3px 3px 0" }} />
                  )}
                  <div className="row row--between mb-2">
                    <span className="text-xs text-muted font-mono">{it.sub} · Câu {it.q}</span>
                    <Badge variant="accent">{Math.round(it.confidence * 100)}%</Badge>
                  </div>
                  <div className="font-semibold text-sm mb-2" style={{ lineHeight: 1.4 }}>{it.question}</div>
                  <div className="text-sm text-muted" style={{ lineHeight: 1.5 }}>"{it.rawAnswer.slice(0, 100)}{it.rawAnswer.length > 100 ? "…" : ""}"</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Detail */}
          {selected && <AIReviewDetail item={selected} onApprove={approve} />}
        </div>
      </div>
    </>
  );
}

function AIReviewDetail({ item, onApprove }) {
  const [adjusted, setAdjusted] = useState(item.aiSuggest);
  const [score, setScore] = useState(item.suggestScore);

  // reset when item changes
  React.useEffect(() => {
    setAdjusted(item.aiSuggest);
    setScore(item.suggestScore);
  }, [item.id]);

  const otherOptions = ["Mạng xã hội", "Website", "Email marketing", "Chatbot", "Ứng dụng di động"];

  return (
    <Card padding={false}>
      <div className="card__head">
        <Avatar name={item.company} />
        <div style={{ flex: 1 }}>
          <div className="card__title">{item.company}</div>
          <div className="card__sub">Bài <span className="font-mono">{item.sub}</span> · Câu hỏi <span className="font-mono">{item.q}</span></div>
        </div>
        <Badge variant="accent" dot>Độ tin cậy {Math.round(item.confidence * 100)}%</Badge>
      </div>

      <div className="card__body">
        <div className="text-xs text-muted">CÂU HỎI</div>
        <div className="font-semibold mt-2 mb-4" style={{ fontSize: 16 }}>{item.question}</div>

        <div className="text-xs text-muted">CÂU TRẢ LỜI THÔ</div>
        <div className="mt-2 mb-4" style={{ padding: 14, background: "var(--surface-muted)", borderRadius: "var(--r-md)", fontStyle: "italic", lineHeight: 1.6 }}>
          "{item.rawAnswer}"
        </div>

        <div style={{ padding: 16, background: "linear-gradient(135deg, var(--accent-tint) 0%, transparent 100%)", borderRadius: "var(--r-md)", border: "1px solid oklch(0.85 0.07 60)" }}>
          <div className="row gap-2 mb-2">
            <I.Sparkles size={16} style={{ color: "var(--accent)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Đề xuất từ AI</span>
          </div>
          <div className="row gap-3">
            <div style={{ flex: 1 }}>
              <div className="text-xs text-muted mb-2">Phân loại đề xuất</div>
              <select className="select" value={adjusted} onChange={(e) => setAdjusted(e.target.value)}>
                <option>{item.aiSuggest}</option>
                {otherOptions.map((o) => <option key={o}>{o}</option>)}
                <option>+ Tạo nhãn mới…</option>
              </select>
            </div>
            <div style={{ width: 180 }}>
              <div className="text-xs text-muted mb-2">Điểm thành phần</div>
              <div className="row gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setScore(n)}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: score === n ? "var(--accent)" : "var(--surface)",
                      color: score === n ? "#fff" : "var(--text-muted)",
                      border: "1px solid " + (score === n ? "var(--accent)" : "var(--border-strong)"),
                      fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13,
                      cursor: "pointer", transition: "all 200ms",
                    }}
                  >{n}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="field mt-6">
          <label className="field__label">Ghi chú thẩm định (tuỳ chọn)</label>
          <textarea className="textarea" placeholder="Lý do điều chỉnh, ghi chú để team đối chiếu…" rows={3} />
        </div>
      </div>

      <div className="card__foot">
        <Button variant="ghost" icon={<I.X size={14} />}>Bỏ qua</Button>
        <Button variant="secondary" icon={<I.Sparkles size={14} />}>AI gợi ý khác</Button>
        <div style={{ flex: 1 }} />
        <Button variant="primary" icon={<I.Check size={14} />} onClick={() => onApprove(item.id)}>Duyệt và áp dụng</Button>
      </div>
    </Card>
  );
}

// =============================================================================
// REPORTS
// =============================================================================
function PageReports() {
  return (
    <>
      <Topbar
        crumbs={["Phân tích", "Báo cáo & Kết quả"]}
        primaryAction={
          <div className="row gap-2">
            <Button variant="secondary" size="sm" icon={<I.Download size={14} />}>Xuất PDF</Button>
            <Button variant="secondary" size="sm" icon={<I.Download size={14} />}>Xuất Excel</Button>
          </div>
        }
      />
      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Báo cáo doanh nghiệp</h1>
            <p className="page__sub">Báo cáo chuyển đổi số chi tiết theo từng doanh nghiệp, bao gồm biểu đồ radar 6 nhóm tiêu chí và khuyến nghị giải pháp.</p>
          </div>
          <select className="select" style={{ width: 280 }}>
            <option>Học viện Edutech VN — BKS-0038</option>
            <option>Vận tải Khang An — BKS-0039</option>
            <option>Spa Hoa Sen — BKS-0040</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
          <Card padding>
            <div className="row gap-4 mb-4">
              <div style={{ flex: 1 }}>
                <div className="text-sm text-muted">Doanh nghiệp</div>
                <div className="font-bold" style={{ fontSize: 22, fontFamily: "var(--font-display)" }}>Học viện Edutech VN</div>
                <div className="text-sm text-muted">Giáo dục đào tạo · Hồ Chí Minh · 120 nhân sự</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="text-xs text-muted">Cấp độ chuyển đổi số</div>
                <div className="badge badge--success" style={{ fontSize: 14, height: 32, padding: "0 14px", marginTop: 4 }}>LV5 · Xuất sắc</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
              <RadarFull />
            </div>

            <div className="grid grid--cols-3 mt-6">
              <ScoreBox label="Tổng điểm" value="84.7" sub="/100" />
              <ScoreBox label="Xếp hạng ngành" value="#3" sub="trong 32 DN" accent />
              <ScoreBox label="So với kỳ trước" value="+12.4" sub="điểm" delta />
            </div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card title="Điểm theo nhóm tiêu chí" padding>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {QUESTION_GROUPS.slice(0, 6).map((g, i) => {
                  const val = [88, 92, 78, 65, 82, 80][i];
                  return (
                    <div key={g.id}>
                      <div className="row row--between" style={{ marginBottom: 6 }}>
                        <span className="text-sm font-medium">{g.name}</span>
                        <span className="font-mono font-semibold">{val}</span>
                      </div>
                      <Progress value={val} variant={val >= 80 ? "success" : val >= 60 ? undefined : "accent"} />
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title="Giải pháp khuyến nghị" sub="Phụ lục III — Giáo dục đào tạo" padding>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <RecItem code="S08_01" name="Hệ thống quản lý học tập (LMS)" status="done" />
                <RecItem code="S08_02" name="Nền tảng lớp học trực tuyến" status="done" />
                <RecItem code="S08_03" name="Quản lý học viên và điểm danh" status="todo" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function ScoreBox({ label, value, sub, accent, delta }) {
  return (
    <div style={{ padding: 16, background: "var(--surface-muted)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
      <div className="text-xs text-muted">{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, letterSpacing: "-0.02em", color: accent ? "var(--accent)" : delta ? "var(--success)" : "var(--text)" }}>
        {value}
        <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 400, marginLeft: 4 }}>{sub}</span>
      </div>
    </div>
  );
}

function RecItem({ code, name, status }) {
  const isDone = status === "done";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: "var(--r-md)", background: isDone ? "var(--success-tint)" : "var(--surface-muted)", border: "1px solid var(--border)" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: isDone ? "var(--success)" : "var(--accent)", color: "#fff", display: "grid", placeItems: "center" }}>
        {isDone ? <I.Check size={14} /> : <I.Plus size={14} />}
      </div>
      <span className="font-mono text-xs text-muted">{code}</span>
      <span className="text-sm" style={{ flex: 1, fontWeight: 500 }}>{name}</span>
      <Badge variant={isDone ? "success" : "warning"}>{isDone ? "Đã đạt" : "Cần triển khai"}</Badge>
    </div>
  );
}

function RadarFull({ size = 320 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 50;
  const labels = ["Thông tin chung", "Hạ tầng", "Chiến lược", "Rào cản", "ESG", "Văn hoá"];
  const values = [0.88, 0.92, 0.78, 0.65, 0.82, 0.80];
  const angle = (i) => (Math.PI * 2 * i) / labels.length - Math.PI / 2;
  const pt = (i, v) => [cx + r * v * Math.cos(angle(i)), cy + r * v * Math.sin(angle(i))];
  const grids = [0.2, 0.4, 0.6, 0.8, 1].map((g) =>
    labels.map((_, i) => pt(i, g)).map((p) => p.join(",")).join(" ")
  );
  const data = values.map((v, i) => pt(i, v).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="radar">
      {grids.map((g, i) => <polygon key={i} points={g} fill="none" stroke="var(--border)" strokeWidth={1} />)}
      {labels.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth={1} />;
      })}
      <polygon points={data} fill="var(--primary)" fillOpacity={0.18} stroke="var(--primary)" strokeWidth={2.5} />
      {values.map((v, i) => {
        const [x, y] = pt(i, v);
        return <circle key={i} cx={x} cy={y} r={4} fill="var(--primary)" stroke="#fff" strokeWidth={2} />;
      })}
      {labels.map((l, i) => {
        const [x, y] = pt(i, 1.18);
        const [vx, vy] = pt(i, 0.5);
        return (
          <g key={l}>
            <text x={x} y={y} fontSize={11} fontFamily="var(--font-body)" fill="var(--text-muted)" textAnchor="middle" dominantBaseline="middle">{l}</text>
            <text x={pt(i, values[i] * 0.65)[0]} y={pt(i, values[i] * 0.65)[1]} fontSize={11} fontFamily="var(--font-mono)" fontWeight={600} fill="var(--primary)" textAnchor="middle">{Math.round(values[i] * 100)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// expose
window.AdminPages = { Sidebar, Topbar, PageDashboard, PageAssessments, PageQuestions, PageSolutions, PageScoring, PageAIReview, PageReports };
