import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/api/client';
import type { AdminSolution, AdminSolutionDependency } from '@/types';
import { Button, Badge, Chip, Card, Modal, EmptyState, Pagination } from '@/components/ui/index';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { Icons } from '@/components/ui/Icons';

// 12 màu phân biệt rõ ràng cho mỗi ngành
const INDUSTRY_PALETTE = [
  { bg: 'oklch(0.94 0.04 250)', color: 'oklch(0.50 0.16 250)' }, // Xanh dương
  { bg: 'oklch(0.94 0.05 155)', color: 'oklch(0.48 0.16 155)' }, // Xanh lá
  { bg: 'oklch(0.95 0.05 50)',  color: 'oklch(0.52 0.16 50)'  }, // Vàng cam
  { bg: 'oklch(0.94 0.05 300)', color: 'oklch(0.50 0.16 300)' }, // Tím
  { bg: 'oklch(0.94 0.05 10)',  color: 'oklch(0.52 0.16 10)'  }, // Đỏ
  { bg: 'oklch(0.94 0.04 200)', color: 'oklch(0.50 0.15 200)' }, // Cyan
  { bg: 'oklch(0.94 0.04 330)', color: 'oklch(0.50 0.14 330)' }, // Hồng
  { bg: 'oklch(0.94 0.04 90)',  color: 'oklch(0.52 0.14 90)'  }, // Vàng lục
  { bg: 'oklch(0.94 0.04 180)', color: 'oklch(0.48 0.13 180)' }, // Teal
  { bg: 'oklch(0.94 0.04 270)', color: 'oklch(0.50 0.15 270)' }, // Indigo
  { bg: 'oklch(0.94 0.04 25)',  color: 'oklch(0.52 0.15 25)'  }, // Cam đỏ
  { bg: 'oklch(0.94 0.04 130)', color: 'oklch(0.50 0.14 130)' }, // Xanh lá sáng
];

const getIndustryColor = (id: number) => {
  return INDUSTRY_PALETTE[id % INDUSTRY_PALETTE.length];
};

export function AdminAppendixIII() {
  const { success, error: toastError } = useToast();
  const [solutions, setSolutions] = useState<AdminSolution[]>([]);
  const [industries, setIndustries] = useState<{ id: number; code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<AdminSolution | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Dependency management in modal
  const [depTab, setDepTab] = useState<'info' | 'deps'>('info');
  const [newDepSolutionId, setNewDepSolutionId] = useState('');
  const [newDepNote, setNewDepNote] = useState('');
  const [addingDep, setAddingDep] = useState(false);
  const [removingDepId, setRemovingDepId] = useState<number | null>(null);

  useEffect(() => {
    const fetchAppendix = async () => {
      setLoading(true);
      try {
        const res = await adminApi.listAppendix();
        setSolutions(res.items || []);
        setIndustries(res.industries || []);
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
    setEditingSolution({ ...sol, dependencies: [...sol.dependencies] });
    setDepTab('info');
    setNewDepSolutionId('');
    setNewDepNote('');
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

  const handleAddDependency = async () => {
    if (!editingSolution || !newDepSolutionId.trim()) return;
    const depId = parseInt(newDepSolutionId);
    if (!Number.isFinite(depId) || depId <= 0) {
      toastError('ID giải pháp không hợp lệ');
      return;
    }
    if (depId === editingSolution.id) {
      toastError('Giải pháp không thể phụ thuộc chính nó');
      return;
    }

    setAddingDep(true);
    try {
      const created = await adminApi.createDependency({
        solutionId: editingSolution.id,
        dependsOnSolutionId: depId,
        note: newDepNote.trim() || null,
      });

      // Tìm thông tin giải pháp phụ thuộc từ danh sách
      const depSol = solutions.find(s => s.id === depId);
      const newDep: AdminSolutionDependency = {
        id: created.id,
        dependsOnSolutionId: depId,
        dependsOnCode: depSol?.code ?? `ID:${depId}`,
        dependsOnName: depSol?.name ?? 'Không tìm thấy',
        note: newDepNote.trim() || null,
      };

      const updatedSol = {
        ...editingSolution,
        dependencies: [...editingSolution.dependencies, newDep],
      };
      setEditingSolution(updatedSol);
      setSolutions(prev => prev.map(s => s.id === editingSolution.id ? updatedSol : s));
      setNewDepSolutionId('');
      setNewDepNote('');
      success('Đã thêm phụ thuộc');
    } catch (err: any) {
      toastError(err.message || 'Lỗi khi thêm phụ thuộc');
    } finally {
      setAddingDep(false);
    }
  };

  const handleRemoveDependency = async (dep: AdminSolutionDependency) => {
    if (!editingSolution) return;
    setRemovingDepId(dep.id);
    try {
      await adminApi.deleteDependency(dep.id);
      const updatedSol = {
        ...editingSolution,
        dependencies: editingSolution.dependencies.filter(d => d.id !== dep.id),
      };
      setEditingSolution(updatedSol);
      setSolutions(prev => prev.map(s => s.id === editingSolution.id ? updatedSol : s));
      success('Đã xóa phụ thuộc');
    } catch (err: any) {
      toastError(err.message || 'Lỗi khi xóa phụ thuộc');
    } finally {
      setRemovingDepId(null);
    }
  };

  const sectors = useMemo(() => {
    if (industries.length > 0) {
      return industries.map(ind => ({
        id: ind.id,
        name: ind.name || 'Ngành chưa xác định',
        code: ind.code
      }));
    }
    const s = new Map<number, { id: number; name: string; code: string }>();
    for (const sol of solutions) {
      const id = sol.industryId || 0;
      if (!s.has(id)) {
        s.set(id, {
          id,
          name: sol.industryName || (id === 0 ? 'Đa ngành' : 'Ngành chưa xác định'),
          code: sol.industryCode || ''
        });
      }
    }
    return Array.from(s.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [solutions, industries]);

  const filtered = solutions.filter((s) => {
    if (sector === "all") return true;
    const sectorId = parseInt(sector);
    return s.industryId === sectorId;
  });
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const pagedItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const bySector = useMemo(() => {
    const m: Record<number, { name: string; code: string; id: number; items: AdminSolution[] }> = {};
    
    for (const ind of sectors) {
      m[ind.id] = { id: ind.id, name: ind.name, code: ind.code, items: [] };
    }

    for (const s of pagedItems) {
      const id = s.industryId || 0;
      if (!m[id]) {
        m[id] = { 
          id,
          name: s.industryName || 'Ngành chưa xác định', 
          code: s.industryCode || '', 
          items: [] 
        };
      }
      m[id].items.push(s);
    }

    const result: Record<number, { name: string; code: string; id: number; items: AdminSolution[] }> = {};
    for (const id in m) {
      if (m[id].items.length > 0) {
        result[id] = m[id];
      }
    }
    return result;
  }, [pagedItems, sectors]);

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
          {sectors.map((s, idx) => {
            const theme = getIndustryColor(idx);
            return (
              <Chip 
                key={s.id} 
                active={sector === s.id.toString()} 
                count={solutions.filter((x) => (x.industryId || 0) === s.id).length} 
                onClick={() => { setSector(s.id.toString()); setPage(1); }}
              >
                <div className="row gap-2">
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.color }} />
                  {s.name}
                </div>
              </Chip>
            );
          })}
        </div>

        {Object.keys(bySector).length === 0 ? (
           <EmptyState title="Không có giải pháp" sub="Chưa có giải pháp nào được cấu hình trong hệ thống." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {Object.entries(bySector).map(([id, group]) => {
              const sectorIdx = sectors.findIndex(s => s.id === group.id);
              const theme = getIndustryColor(sectorIdx >= 0 ? sectorIdx : parseInt(id));
              const sectorCode = group.code || 'N/A';
              
              return (
                <Card key={id} padding={false}>
                  <div className="card__head" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="row gap-3">
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.bg, color: theme.color, display: "grid", placeItems: "center" }}>
                        <Icons.Building size={18} />
                      </div>
                      <div>
                        <div className="card__title row gap-2">
                          {group.name}
                          {sectorCode !== 'N/A' && <span className="font-mono"><Badge variant="neutral">{sectorCode}</Badge></span>}
                        </div>
                        <div className="card__sub">{group.items.length} giải pháp · {group.items.filter(x => x.isActive).length} hoạt động · {group.items.filter(x => !x.isActive).length} tạm dừng</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" icon={<Icons.Plus size={14} />} style={{ marginLeft: "auto" }}>Thêm</Button>
                  </div>
                  <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                    {group.items.sort((a, b) => a.sortOrder - b.sortOrder).map((s) => {
                      const isFoundation = s.dependencies.length === 0;
                      return (
                        <div key={s.id} style={{
                          padding: 14,
                          border: "1px solid var(--border)",
                          borderRadius: "var(--r-md)",
                          background: isFoundation ? theme.bg : "var(--surface)",
                          borderColor: isFoundation ? theme.color : "var(--border)",
                          borderLeftWidth: 3,
                          borderLeftColor: isFoundation ? theme.color : "var(--accent)",
                          transition: "all 200ms var(--ease-out)",
                        }}>
                          {/* Header: mã + trạng thái */}
                          <div className="row gap-2 mb-2">
                            <span
                              className="font-mono"
                              style={{ fontSize: 10, color: 'var(--text-subtle)', opacity: 0.7, letterSpacing: '0.03em' }}
                            >
                              {s.code}
                            </span>
                            <span style={s.isActive ? { background: theme.color, color: '#fff', border: 'none', borderRadius: 'var(--r-full)', padding: '2px 8px', fontSize: 11, fontWeight: 600 } : {}}>
                              {s.isActive ? "Hoạt động" : <Badge variant="neutral">Tạm dừng</Badge>}
                            </span>
                          </div>

                          {/* Tên giải pháp */}
                          <div className="font-semibold text-sm" style={{ lineHeight: 1.4 }}>{s.name}</div>

                          {/* Mô tả */}
                          {s.description && (
                            <div className="mt-2 text-xs text-muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {s.description}
                            </div>
                          )}

                          {/* Dependencies */}
                          {s.dependencies.length > 0 && (
                            <div className="mt-2" style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Phụ thuộc ({s.dependencies.length})
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {s.dependencies.map(dep => (
                                  <div key={dep.id} className="row gap-2" style={{ fontSize: 12 }}>
                                    <Icons.ArrowRight size={11} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
                                    <span className="font-mono" style={{ color: 'var(--accent)', fontSize: 11 }}>{dep.dependsOnCode}</span>
                                    <span className="text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dep.dependsOnName}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
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

      {/* Modal chỉnh sửa giải pháp */}
      <Modal open={editModalOpen} onClose={() => !submitting && setEditModalOpen(false)}>
        <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", overflow: "hidden", maxWidth: 620, width: "100%", margin: "0 auto" }}>
          {/* Header modal */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-muted)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Chỉnh sửa giải pháp</h2>
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
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface-muted)' }}>
                {(['info', 'deps'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDepTab(tab)}
                    style={{
                      padding: '10px 20px',
                      fontSize: 13,
                      fontWeight: depTab === tab ? 600 : 400,
                      color: depTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                      background: 'none',
                      border: 'none',
                      borderBottom: depTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    {tab === 'info' ? 'Thông tin' : `Phụ thuộc (${editingSolution.dependencies.length})`}
                  </button>
                ))}
              </div>

              {/* Tab: Thông tin */}
              {depTab === 'info' && (
                <form onSubmit={handleSave} style={{ padding: 24 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label htmlFor="solutionCode" style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Mã giải pháp <span style={{ color: "var(--danger)" }}>*</span></label>
                      <Input
                        id="solutionCode"
                        value={editingSolution.code}
                        onChange={e => setEditingSolution({ ...editingSolution, code: e.target.value })}
                        required
                        placeholder="Vd: S01_01"
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
                      placeholder="Tên đầy đủ của giải pháp"
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label htmlFor="solutionDesc" style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Mô tả</label>
                    <Textarea
                      id="solutionDesc"
                      value={editingSolution.description ?? ''}
                      onChange={e => setEditingSolution({ ...editingSolution, description: e.target.value || null })}
                      rows={3}
                      placeholder="Mô tả ngắn gọn về giải pháp..."
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={editingSolution.isActive}
                        onChange={e => setEditingSolution({ ...editingSolution, isActive: e.target.checked })}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Hoạt động</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— Giải pháp được hiển thị trong danh sách đánh giá</span>
                    </label>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)} disabled={submitting}>Hủy</Button>
                    <Button type="submit" variant="primary" disabled={submitting}>
                      {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Tab: Phụ thuộc */}
              {depTab === 'deps' && (
                <div style={{ padding: 24 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                    Giải pháp này phụ thuộc vào các giải pháp bên dưới. Doanh nghiệp cần triển khai các giải pháp tiên quyết trước.
                  </p>

                  {/* Danh sách dependency hiện tại */}
                  {editingSolution.dependencies.length === 0 ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      <Icons.Info size={24} style={{ margin: '0 auto 8px', opacity: 0.4, display: 'block' }} />
                      Chưa có phụ thuộc nào. Đây là giải pháp tiền đề.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                      {editingSolution.dependencies.map(dep => (
                        <div
                          key={dep.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 12px',
                            background: 'var(--surface-muted)',
                            borderRadius: 'var(--r-md)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <Icons.ArrowRight size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                          <span className="font-mono" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{dep.dependsOnCode}</span>
                          <span style={{ fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dep.dependsOnName}</span>
                          {dep.note && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', flexShrink: 0 }}>{dep.note}</span>
                          )}
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={<Icons.Trash size={12} />}
                            onClick={() => handleRemoveDependency(dep)}
                            disabled={removingDepId === dep.id}
                          >
                            {removingDepId === dep.id ? '...' : 'Xóa'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Form thêm dependency mới */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Thêm phụ thuộc mới</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <label htmlFor="depSolutionId" style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>ID giải pháp tiên quyết</label>
                        <Input
                          id="depSolutionId"
                          type="number"
                          placeholder="Nhập ID giải pháp..."
                          value={newDepSolutionId}
                          onChange={e => setNewDepSolutionId(e.target.value)}
                        />
                        {newDepSolutionId && (() => {
                          const found = solutions.find(s => s.id === parseInt(newDepSolutionId));
                          return found ? (
                            <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>
                              ✓ {found.code} — {found.name}
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>
                              Không tìm thấy giải pháp với ID này
                            </div>
                          );
                        })()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label htmlFor="depNote" style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Ghi chú (tùy chọn)</label>
                        <Input
                          id="depNote"
                          placeholder="Ghi chú về mối phụ thuộc..."
                          value={newDepNote}
                          onChange={e => setNewDepNote(e.target.value)}
                        />
                      </div>
                      <div style={{ paddingTop: 20 }}>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Icons.Plus size={14} />}
                          onClick={handleAddDependency}
                          disabled={addingDep || !newDepSolutionId.trim()}
                        >
                          {addingDep ? 'Đang thêm...' : 'Thêm'}
                        </Button>
                      </div>
                    </div>
                    {/* Gợi ý: danh sách giải pháp trong cùng ngành */}
                    {industries.length > 0 && newDepSolutionId === '' && (
                      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                        Gợi ý: Nhập ID số của giải pháp (xem ở thẻ "TT" trên mỗi card giải pháp)
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                    <Button variant="ghost" onClick={() => setEditModalOpen(false)}>Đóng</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
