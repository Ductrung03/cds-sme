const fs = require('fs');

const appendixFile = 'frontend/src/pages/admin/AppendixIII.tsx';
let content = fs.readFileSync(appendixFile, 'utf8');

const updated = `import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/api/client';
import type { AdminSolution } from '@/types';
import { Button, Badge, Chip, Card, Modal, EmptyState, Pagination } from '@/components/ui/index';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { Icons } from '@/components/ui/Icons';

const getIndustryColor = (name: string) => {
  const colors = [
    { bg: 'var(--primary-tint)', color: 'var(--primary)' },
    { bg: 'var(--accent-tint)', color: 'var(--accent)' },
    { bg: 'var(--success-tint)', color: 'var(--success)' },
    { bg: 'oklch(0.95 0.03 300)', color: 'oklch(0.55 0.12 300)' },
    { bg: 'oklch(0.95 0.03 10)', color: 'oklch(0.55 0.12 10)' },
    { bg: 'oklch(0.95 0.03 60)', color: 'oklch(0.55 0.12 60)' },
    { bg: 'oklch(0.95 0.03 150)', color: 'oklch(0.55 0.12 150)' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export function AdminAppendixIII() {
  const { success, error: toastError } = useToast();
  const [solutions, setSolutions] = useState<AdminSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<AdminSolution | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAppendix = async () => {
      setLoading(true);
      try {
        const res = await adminApi.listAppendix();
        setSolutions(res.items || []);
      } catch (err) {
        console.error(err);
        toastError('Không thể tải danh sách giải pháp');
      } finally {
        setLoading(false);
      }
    };
    fetchAppendix();
  }, [toastError]);

  const handleEditClick = (sol: AdminSolution) => {
    setEditingSolution({ ...sol });
    setEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSolution) return;

    setSubmitting(true);
    try {
      await adminApi.updateSolution(editingSolution.id, {
        code: editingSolution.code,
        name: editingSolution.name,
        description: editingSolution.description,
        sortOrder: editingSolution.sortOrder,
        isActive: editingSolution.isActive,
      });
      
      success('Cập nhật giải pháp thành công');
      setEditModalOpen(false);
      setSolutions(prev => prev.map(s => s.id === editingSolution.id ? editingSolution : s));
    } catch (err: any) {
      console.error(err);
      toastError(err.message || 'Lỗi khi cập nhật giải pháp');
    } finally {
      setSubmitting(false);
    }
  };

  const sectors = useMemo(() => {
    const s = new Set<string>();
    for (const sol of solutions) {
      s.add(sol.industryName || 'Đa ngành');
    }
    return Array.from(s).sort();
  }, [solutions]);

  const filtered = solutions.filter((s) => sector === "all" || (s.industryName || 'Đa ngành') === sector);
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const pagedItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const bySector = useMemo(() => {
    const m: Record<string, AdminSolution[]> = {};
    for (const s of pagedItems) {
      const sec = s.industryName || 'Đa ngành';
      if (!m[sec]) {
        m[sec] = [];
      }
      m[sec].push(s);
    }
    return m;
  }, [pagedItems]);

  if (loading) {
    return (
      <div className="p-6 text-center text-surface-500">
        <Icons.Loader className="animate-spin inline-block mr-2" /> Đang tải danh sách giải pháp...
      </div>
    );
  }

  return (
    <>
      <header className="topbar">
        <div className="crumbs">
          <span>Phụ lục III</span>
          <span className="sep"><Icons.ChevronRight size={14} /></span>
          <strong>Quản lý giải pháp số</strong>
        </div>
        <div className="topbar__actions">
          <Button variant="primary" size="sm" icon={<Icons.Plus size={14} />}>Thêm giải pháp</Button>
        </div>
      </header>

      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">Phụ lục III — Giải pháp số theo ngành</h1>
            <p className="page__sub">Catalog các giải pháp công nghệ áp dụng cho từng ngành. Cấu hình giải pháp hoạt động hoặc tạm dừng.</p>
          </div>
        </div>

        <div className="row gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
          <Chip active={sector === "all"} onClick={() => { setSector("all"); setPage(1); }}>Tất cả</Chip>
          {sectors.map((s) => (
            <Chip 
              key={s} 
              active={sector === s} 
              count={solutions.filter((x) => (x.industryName || 'Đa ngành') === s).length} 
              onClick={() => { setSector(s); setPage(1); }}
            >
              {s}
            </Chip>
          ))}
        </div>

        {Object.keys(bySector).length === 0 ? (
           <EmptyState title="Không có giải pháp" sub="Chưa có giải pháp nào được cấu hình trong hệ thống." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {Object.entries(bySector).map(([sectorName, list]) => {
              const theme = getIndustryColor(sectorName);
              const sectorCode = list[0]?.industryCode || 'N/A';
              
              return (
                <Card key={sectorName} padding={false}>
                  <div className="card__head" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="row gap-3">
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.bg, color: theme.color, display: "grid", placeItems: "center" }}>
                        <Icons.Building size={18} />
                      </div>
                      <div>
                        <div className="card__title row gap-2">
                          {sectorName}
                          {sectorCode !== 'N/A' && <Badge variant="neutral" style={{ fontFamily: 'var(--font-mono)' }}>{sectorCode}</Badge>}
                        </div>
                        <div className="card__sub">{list.length} giải pháp · {list.filter(x => x.isActive).length} hoạt động · {list.filter(x => !x.isActive).length} tạm dừng</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" icon={<Icons.Plus size={14} />} style={{ marginLeft: "auto" }}>Thêm</Button>
                  </div>
                  <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                    {list.sort((a, b) => a.sortOrder - b.sortOrder).map((s) => {
                      return (
                        <div key={s.id} style={{
                          padding: 14,
                          border: "1px solid var(--border)",
                          borderRadius: "var(--r-md)",
                          background: s.isActive ? theme.bg : "var(--surface)",
                          borderColor: s.isActive ? theme.color : "var(--border)",
                          borderLeftWidth: 3,
                          borderLeftColor: s.isActive ? theme.color : "var(--border-strong)",
                          transition: "all 200ms var(--ease-out)",
                        }}>
                          <div className="row gap-2 mb-2">
                            <span className="badge badge--neutral font-mono" style={{ fontSize: 11 }}>{s.code}</span>
                            <Badge variant={s.isActive ? "primary" : "neutral"} style={s.isActive ? { background: theme.color, color: '#fff', border: 'none' } : {}}>{s.isActive ? "Hoạt động" : "Tạm dừng"}</Badge>
                          </div>
                          <div className="font-semibold text-sm" style={{ lineHeight: 1.4 }}>{s.name}</div>
                          {s.description && (
                            <div className="mt-2 text-xs text-muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {s.description}
                            </div>
                          )}
                          <div className="row gap-2 mt-3" style={{ justifyContent: 'space-between' }}>
                             <span className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>TT: {s.sortOrder.toString().padStart(2, '0')}</span>
                             <div className="row gap-2">
                                <Button variant="ghost" size="xs" icon={<Icons.Edit size={12} />} onClick={() => handleEditClick(s)}>Sửa</Button>
                                <Button variant="ghost" size="xs" icon={<Icons.Trash size={12} />} onClick={() => toastError("Chức năng xóa không khả dụng")}>Xoá</Button>
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}

            {total > pageSize && (
              <div style={{ padding: "16px 0", display: "flex", justifyContent: "center" }}>
                <Pagination
                  page={safePage}
                  total={total}
                  pageSize={pageSize}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={editModalOpen} onClose={() => !submitting && setEditModalOpen(false)}>
        <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", overflow: "hidden", maxWidth: 600, width: "100%", margin: "0 auto" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-muted)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Chỉnh sửa giải pháp {editingSolution?.code}</h2>
            <button 
              type="button"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }} 
              onClick={() => setEditModalOpen(false)}
              disabled={submitting}
            >
              <Icons.X size={20} />
            </button>
          </div>

          {editingSolution && (
            <form onSubmit={handleSave} style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label htmlFor="solutionCode" style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Mã giải pháp <span style={{ color: "var(--danger)" }}>*</span></label>
                  <Input
                    id="solutionCode"
                    value={editingSolution.code}
                    onChange={e => setEditingSolution({ ...editingSolution, code: e.target.value })}
                    required
                    placeholder="Vd: SOL-01"
                  />
                </div>
                <div>
                  <label htmlFor="solutionSortOrder" style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Thứ tự hiển thị <span style={{ color: "var(--danger)" }}>*</span></label>
                  <Input
                    id="solutionSortOrder"
                    type="number"
                    value={editingSolution.sortOrder}
                    onChange={e => setEditingSolution({ ...editingSolution, sortOrder: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label htmlFor="solutionName" style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tên giải pháp <span style={{ color: "var(--danger)" }}>*</span></label>
                <Input
                  id="solutionName"
                  value={editingSolution.name}
                  onChange={e => setEditingSolution({ ...editingSolution, name: e.target.value })}
                  required
                  placeholder="Nhập tên giải pháp..."
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label htmlFor="solutionDescription" style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Mô tả chi tiết</label>
                <Textarea
                  id="solutionDescription"
                  value={editingSolution.description || ''}
                  onChange={e => setEditingSolution({ ...editingSolution, description: e.target.value })}
                  placeholder="Nhập mô tả về giải pháp..."
                  rows={4}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                <input
                  type="checkbox"
                  id="isActive"
                  style={{ width: 16, height: 16, accentColor: "var(--primary)" }}
                  checked={editingSolution.isActive}
                  onChange={e => setEditingSolution({ ...editingSolution, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" style={{ fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                  Kích hoạt giải pháp này
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setEditModalOpen(false)}
                  disabled={submitting}
                >
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  loading={submitting}
                >
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </>
  );
}
`;

fs.writeFileSync(appendixFile, updated);
console.log('Updated AppendixIII.tsx');
