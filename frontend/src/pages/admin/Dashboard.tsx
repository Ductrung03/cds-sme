import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminApi } from '@/api/client';
import { type AssessmentListItem } from '@/types';
import { StatCard, Card, StatusBadge, Chip, Button, Badge } from '@/components/ui/index';
import { Icons, Avatar } from '@/components/ui/Icons';

// ============================================================
// ADMIN DASHBOARD
// ============================================================
export function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAssessmentList = location.pathname === '/admin/assessments';
  const [data, setData] = useState<Record<string, number> | null>(null);
  const [list, setList] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    async function loadData() {
      try {
        const [dash, assessments] = await Promise.all([
          adminApi.getDashboard(),
          adminApi.listAssessments({}),
        ]);
        setData(dash as unknown as Record<string, number>);
        setList((assessments as { items: AssessmentListItem[] }).items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const filtered = list.filter((item) => {
    if (filter !== 'all' && item.trangThai !== filter) return false;
    const q = search.toLowerCase();
    if (q) {
      const name = (item.tenDoanhnghiep ?? item.hoTen ?? '').toLowerCase();
      const email = (item.email ?? '').toLowerCase();
      if (!name.includes(q) && !email.includes(q)) return false;
    }
    return true;
  });

  const filteredTotal = filtered.length;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleFilterChange = (f: string) => { setFilter(f); setPage(1); };
  const handleSearchChange = (s: string) => { setSearch(s); setPage(1); };

  const counts = {
    all: list.length,
    draft: list.filter((s) => s.trangThai === 'draft').length,
    submitted: list.filter((s) => s.trangThai === 'submitted').length,
    reviewing: list.filter((s) => s.trangThai === 'reviewing').length,
    scored: list.filter((s) => s.trangThai === 'scored').length,
    published: list.filter((s) => s.trangThai === 'published').length,
  };

  const levels = [
    { lv: 'Cấp độ 1', name: 'Mới bắt đầu', color: 'oklch(0.6 0.18 25)' },
    { lv: 'Cấp độ 2', name: 'Cơ bản', color: 'oklch(0.68 0.16 50)' },
    { lv: 'Cấp độ 3', name: 'Trung bình', color: 'oklch(0.72 0.14 70)' },
    { lv: 'Cấp độ 4', name: 'Khá', color: 'oklch(0.6 0.14 155)' },
    { lv: 'Cấp độ 5', name: 'Xuất sắc', color: 'oklch(0.55 0.13 200)' },
  ];

  const levelData = levels.map(l => ({
    ...l,
    count: list.filter(item => item.capDo === l.lv || item.capDo === l.lv.replace('Cấp độ ', 'LV')).length
  }));
  const maxCount = Math.max(1, ...levelData.map(d => d.count));

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12, color: 'var(--text-muted)' }}>
        <Icons.Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
        Đang tải dữ liệu…
        <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  const total = data?.tongBaiKhaoSat ?? list.length;
  const choXetDuyet = data?.choXetDuyet ?? counts.submitted;
  const daChamDiem = data?.daChamDiem ?? counts.scored;
  const daCongBo = data?.daCongBo ?? counts.published;

  const tableCard = (
    <Card
      title={isAssessmentList ? '' : 'Bài khảo sát gần đây'}
      sub={isAssessmentList ? '' : 'Cập nhật theo thời gian thực, theo dõi tiến độ chấm điểm từng bài'}
      padding={false}
      action={
        !isAssessmentList ? (
          <div className="row gap-2">
            <Button variant="ghost" size="sm" icon={<Icons.Filter size={14} />}>Lọc</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate("/admin/assessments")}>Xem tất cả</Button>
          </div>
        ) : undefined
      }
    >
      {/* Filter bar */}
      {isAssessmentList && (
        <div className="card__head" style={{ flexWrap: 'wrap', gap: 12, borderTop: 'none', background: 'transparent' }}>
          <div className="chip-row" style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {([
              { key: 'all', label: 'Tất cả' },
              { key: 'draft', label: 'Nháp' },
              { key: 'submitted', label: 'Đã nộp' },
              { key: 'reviewing', label: 'Chờ duyệt' },
              { key: 'scored', label: 'Đã chấm' },
              { key: 'published', label: 'Đã công bố' },
            ] as const).map((f) => (
              <Chip
                key={f.key}
                active={filter === f.key}
                count={counts[f.key as keyof typeof counts]}
                onClick={() => handleFilterChange(f.key)}
              >
                {f.label}
              </Chip>
            ))}
          </div>

          {/* Search */}
          <div className="row gap-2">
            <div className="input-group" style={{ width: 280 }}>
              <span className="input-group__icon"><Icons.Search size={14} /></span>
              <input
                className="input"
                placeholder="Tìm doanh nghiệp…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <select className="select" style={{ width: 180 }} defaultValue="all">
              <option value="all">Tất cả ngành</option>
              {Array.from(new Set(list.map(i => i.tenNganh).filter(Boolean))).map(n => (
                <option key={n} value={n!}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {isAssessmentList && <th style={{ width: 50 }}><input type="checkbox" /></th>}
              <th>Doanh nghiệp</th>
              <th>Ngành nghề</th>
              <th>Trạng thái</th>
              <th>Điểm / Cấp độ</th>
              <th className="col-actions" />
            </tr>
          </thead>
          <tbody>
            {paged.map((item) => (
              <tr
                key={item.id}
                onClick={() => navigate(`/admin/assessments/${item.id}`)}
              >
                {isAssessmentList && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          (e.target as HTMLInputElement).click();
                        }
                      }}
                    />
                  </td>
                )}
                <td>
                  <div className="row gap-3">
                    <Avatar name={item.tenDoanhnghiep ?? item.hoTen ?? '?'} size={36} />
                    <div>
                      <div className="cell-primary">{item.tenDoanhnghiep ?? item.hoTen ?? 'Không rõ'}</div>
                      <div className="cell-sub">
                        {item.email ?? ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge variant="neutral">
                    {item.tenNganh ?? item.maNganh ?? '—'}
                  </Badge>
                </td>
                <td>
                  <StatusBadge status={item.trangThai} />
                </td>
                <td>
                  {item.tongDiem !== undefined && item.tongDiem !== null ? (
                    <div>
                      <div className="font-semibold">
                        {typeof item.tongDiem === 'number' ? item.tongDiem.toFixed(1) : item.tongDiem}
                        <span className="text-xs text-muted"> / 100</span>
                      </div>
                      <div className="cell-sub">{item.capDo}</div>
                    </div>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="col-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Icons.ArrowRight size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/assessments/${item.id}`);
                    }}
                  >
                    Chi tiết
                  </Button>
                </td>
              </tr>
            ))}
            {filteredTotal === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty" style={{ padding: '64px 0' }}>
                    <div className="empty__icon"><Icons.ClipboardList size={32} /></div>
                    <div className="empty__title">Không tìm thấy bài khảo sát</div>
                    <div className="empty__sub">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm khác.</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAssessmentList && filteredTotal > 0 && (
        <div className="card__foot">
          <span className="text-sm text-muted">Hiển thị {paged.length} / {filteredTotal} bài</span>
          <div className="row gap-2" style={{ marginLeft: 'auto' }}>
            <select 
              className="select" 
              style={{ width: 120, height: 32, padding: '0 8px' }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 50].map(size => (
                <option key={size} value={size}>{size} bài/trang</option>
              ))}
            </select>
            <Button 
              variant="ghost" 
              size="sm" 
              icon={<Icons.ChevronLeft size={14} />}
              disabled={safePage === 1}
              onClick={() => setPage(pIndex => Math.max(1, pIndex - 1))}
            >Trước</Button>
            <span className="text-sm">Trang {safePage} / {totalPages}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              iconRight={<Icons.ChevronRight size={14} />}
              disabled={safePage === totalPages}
              onClick={() => setPage(pIndex => Math.min(totalPages, pIndex + 1))}
            >Sau</Button>
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <div className="page">
      {/* Page head */}
      <div className="page__head">
        <div>
          <h1 className="page__title">
            {isAssessmentList ? 'Bài khảo sát' : 'Tổng quan hệ thống'}
          </h1>
          <p className="page__sub">
            {isAssessmentList
              ? 'Quản lý vòng đời khảo sát — từ lúc nộp, phân loại, đến chấm điểm và công bố cấp độ chuyển đổi số.'
              : 'Theo dõi tiến độ chấm điểm, phê duyệt và mức độ chuyển đổi số của các doanh nghiệp đang khảo sát trong kỳ.'}
          </p>
        </div>
        <div className="row gap-2">
          {!isAssessmentList && (
            <select className="select" style={{ width: 200 }} defaultValue="2026Q2">
              <option value="2026Q2">Kỳ: Quý 2 / 2026</option>
              <option value="2026Q1">Kỳ: Quý 1 / 2026</option>
              <option value="2025Q4">Kỳ: Quý 4 / 2025</option>
            </select>
          )}
          <Button variant="primary" icon={<Icons.Download size={16} />}>
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* KPI stat cards */}
      {!isAssessmentList && (
        <div className="grid grid--cols-4 mb-4 fade-in">
          <StatCard
            label="Tổng số bài nộp"
            value={total}
            icon={<Icons.ClipboardList size={18} />}
            accent="primary"
            delta="+12 tuần này"
            deltaDir="up"
            progress={Math.min(100, (total / Math.max(total, 1)) * 100)}
          />
          <StatCard
            label="Chờ xét duyệt"
            value={choXetDuyet}
            icon={<Icons.Clock size={18} />}
            accent="accent"
            delta="−3"
            deltaDir="down"
            progress={total > 0 ? (choXetDuyet / total) * 100 : 0}
          />
          <StatCard
            label="Đã chấm điểm"
            value={daChamDiem}
            icon={<Icons.CheckCircle size={18} />}
            accent="info"
            delta="+8 hôm nay"
            deltaDir="up"
            progress={total > 0 ? (daChamDiem / total) * 100 : 0}
          />
          <StatCard
            label="Đã công bố"
            value={daCongBo}
            icon={<Icons.Send size={18} />}
            accent="success"
            delta="+5"
            deltaDir="up"
            progress={total > 0 ? (daCongBo / total) * 100 : 0}
          />
        </div>
      )}

      {/* Main content layout */}
      {isAssessmentList ? (
        tableCard
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
          {tableCard}
          
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card title="Phân bố cấp độ CĐS" sub={`Trong ${daChamDiem} bài đã chấm điểm`}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {levelData.map((d) => (
                  <div key={d.lv}>
                    <div className="row row--between" style={{ marginBottom: 6 }}>
                      <div className="row gap-2">
                        <span className="badge badge--neutral" style={{ fontFamily: "var(--font-mono)", fontSize: 11, height: 20, padding: "0 8px" }}>
                          {d.lv.replace('Cấp độ ', 'LV')}
                        </span>
                        <span style={{ fontSize: 13 }}>{d.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{d.count}</span>
                    </div>
                    <div className="progress" style={{ background: "var(--surface-muted)", height: 6, borderRadius: 3, overflow: 'hidden' }}>
                      <div className="progress__bar" style={{ width: (d.count / maxCount) * 100 + "%", background: d.color, height: '100%', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
