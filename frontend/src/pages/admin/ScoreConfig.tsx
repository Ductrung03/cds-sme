import { useEffect, useMemo, useState } from 'react';
import {
  adminApi,
  type GroupWeightItem,
  type RankThresholdItem,
  type ScoreConfig,
} from '@/api/client';
import { Button, Card, Badge, Pagination } from '@/components/ui/index';
import { Icons } from '@/components/ui/Icons';

type ThresholdDraft = {
  name: string;
  minScore: string;
  maxScore: string;
  description: string;
};

type RowState = {
  saving: boolean;
  error: string | null;
  success: string | null;
};

const emptyRowState = (): RowState => ({ saving: false, error: null, success: null });

function formatNumber(n: number, fractionDigits = 2): string {
  return Number.isFinite(n) ? n.toFixed(fractionDigits) : '—';
}

const LEVEL_COLORS: Record<number, string> = {
  1: "oklch(0.62 0.17 28.5)",  // Đỏ (Khởi đầu)
  2: "oklch(0.68 0.16 52.4)",  // Cam (Bắt đầu)
  3: "oklch(0.74 0.14 75.8)",  // Vàng (Hình thành)
  4: "oklch(0.62 0.14 152.0)", // Xanh lá (Nâng cao)
  5: "oklch(0.58 0.12 195.0)"  // Xanh dương (Dẫn dắt)
};

function LevelSpectrum({ levels }: { levels: RankThresholdItem[] }) {
  if (!levels || levels.length === 0) return null;

  return (
    <div style={{ position: 'relative', padding: '28px 0 8px' }}>
      {/* Thanh màu spectrum */}
      <div style={{
        display: 'flex',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        height: 16,
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,.06)',
      }}>
        {levels.map((l) => (
          <div
            key={l.level}
            style={{
              flex: l.maxScore - l.minScore + 1,
              background: LEVEL_COLORS[l.level] || 'var(--primary)',
            }}
          />
        ))}
      </div>

      {/* Labels bên dưới — bám theo flex proportion như thanh màu */}
      <div style={{ display: 'flex', marginTop: 12 }}>
        {levels.map((l) => (
          <div
            key={l.level}
            style={{
              flex: l.maxScore - l.minScore + 1,
              padding: '0 8px',
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                className="font-mono font-bold"
                style={{ fontSize: 11, color: LEVEL_COLORS[l.level] || 'var(--primary)', whiteSpace: 'nowrap' }}
              >
                {l.code}
              </span>
              <span
                className="font-semibold"
                style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {l.name}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 4 }}>
              {l.minScore}–{l.maxScore} điểm
            </div>
            {l.description && (
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 4, lineHeight: 1.4, opacity: 0.8 }}>
                {l.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminScoreConfig() {
  const [config, setConfig] = useState<ScoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drafts per row
  const [thresholdDrafts, setThresholdDrafts] = useState<Record<number, ThresholdDraft>>({});
  const [weightDrafts, setWeightDrafts] = useState<Record<number, string>>({});
  const [thresholdRowState, setThresholdRowState] = useState<Record<number, RowState>>({});
  const [weightRowState, setWeightRowState] = useState<Record<number, RowState>>({});

  // Phân trang — ngưỡng cấp độ
  const [thresholdPage, setThresholdPage] = useState(1);
  const [thresholdPageSize, setThresholdPageSize] = useState(10);

  // Phân trang — trọng số nhóm câu hỏi
  const [weightPage, setWeightPage] = useState(1);
  const [weightPageSize, setWeightPageSize] = useState(10);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await adminApi.getScoreConfig();
        setConfig(data);

        const tDrafts: Record<number, ThresholdDraft> = {};
        for (const t of data.rankThresholds) {
          tDrafts[t.id] = {
            name: t.name,
            minScore: String(t.minScore),
            maxScore: String(t.maxScore),
            description: t.description ?? '',
          };
        }
        setThresholdDrafts(tDrafts);

        const wDrafts: Record<number, string> = {};
        for (const g of data.groupWeights) {
          wDrafts[g.id] = String(g.weight);
        }
        setWeightDrafts(wDrafts);
      } catch (err: any) {
        setError(err?.message ?? 'Không thể tải cấu hình điểm');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sortedThresholds = useMemo(
    () => (config?.rankThresholds ?? []).slice().sort((a, b) => a.level - b.level),
    [config],
  );

  const sortedGroups = useMemo(
    () => (config?.groupWeights ?? []).slice().sort((a, b) => a.groupNumber - b.groupNumber),
    [config],
  );

  // Các hàng hiển thị theo trang — ngưỡng cấp độ
  const pagedThresholds = useMemo(() => {
    const start = (thresholdPage - 1) * thresholdPageSize;
    return sortedThresholds.slice(start, start + thresholdPageSize);
  }, [sortedThresholds, thresholdPage, thresholdPageSize]);

  // Các hàng hiển thị theo trang — trọng số nhóm câu hỏi
  const pagedGroups = useMemo(() => {
    const start = (weightPage - 1) * weightPageSize;
    return sortedGroups.slice(start, start + weightPageSize);
  }, [sortedGroups, weightPage, weightPageSize]);

  const handleThresholdChange = (
    id: number,
    field: keyof ThresholdDraft,
    value: string,
  ) => {
    setThresholdDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSaveThreshold = async (item: RankThresholdItem) => {
    const draft = thresholdDrafts[item.id];
    if (!draft) return;

    const minScore = Number(draft.minScore);
    const maxScore = Number(draft.maxScore);

    if (!draft.name.trim()) {
      setThresholdRowState((s) => ({
        ...s,
        [item.id]: { saving: false, error: 'Vui lòng nhập tên cấp độ', success: null },
      }));
      return;
    }
    if (!Number.isFinite(minScore) || !Number.isFinite(maxScore)) {
      setThresholdRowState((s) => ({
        ...s,
        [item.id]: {
          saving: false,
          error: 'Điểm tối thiểu/tối đa phải là số hợp lệ',
          success: null,
        },
      }));
      return;
    }
    if (minScore > maxScore) {
      setThresholdRowState((s) => ({
        ...s,
        [item.id]: {
          saving: false,
          error: 'Điểm tối thiểu không lớn hơn điểm tối đa',
          success: null,
        },
      }));
      return;
    }

    setThresholdRowState((s) => ({
      ...s,
      [item.id]: { saving: true, error: null, success: null },
    }));

    try {
      const updated = await adminApi.updateRankThreshold(item.id, {
        name: draft.name.trim(),
        minScore,
        maxScore,
        description: draft.description.trim() ? draft.description.trim() : null,
      });

      setConfig((prev) =>
        prev
          ? {
              ...prev,
              rankThresholds: prev.rankThresholds.map((t) =>
                t.id === item.id ? updated : t
              ),
            }
          : prev,
      );

      setThresholdRowState((s) => ({
        ...s,
        [item.id]: { saving: false, error: null, success: 'Đã lưu' },
      }));
    } catch (err: any) {
      setThresholdRowState((s) => ({
        ...s,
        [item.id]: {
          saving: false,
          error: err?.message ?? 'Lưu thất bại',
          success: null,
        },
      }));
    }
  };

  const handleSaveWeight = async (group: GroupWeightItem) => {
    const draft = weightDrafts[group.id];
    const weight = Number(draft);

    if (!Number.isFinite(weight) || weight < 0 || weight > 10) {
      setWeightRowState((s) => ({
        ...s,
        [group.id]: {
          saving: false,
          error: 'Trọng số trong khoảng 0 – 10',
          success: null,
        },
      }));
      return;
    }

    setWeightRowState((s) => ({
      ...s,
      [group.id]: { saving: true, error: null, success: null },
    }));

    try {
      const updated = await adminApi.updateGroupWeight(group.id, weight);

      setConfig((prev) =>
        prev
          ? {
              ...prev,
              groupWeights: prev.groupWeights.map((g) =>
                g.id === group.id ? updated : g
              ),
            }
          : prev,
      );

      setWeightRowState((s) => ({
        ...s,
        [group.id]: { saving: false, error: null, success: 'Đã lưu' },
      }));
    } catch (err: any) {
      setWeightRowState((s) => ({
        ...s,
        [group.id]: {
          saving: false,
          error: err?.message ?? 'Lưu thất bại',
          success: null,
        },
      }));
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Cấu hình điểm</h1>
        <div className="card p-6 text-gray-500">Đang tải cấu hình điểm…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Cấu hình điểm</h1>
        <div className="card p-6" style={{ background: 'var(--danger-tint)', color: 'var(--danger)' }}>{error}</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Cấu hình điểm</h1>
        <div className="card p-6 text-gray-500">Chưa có dữ liệu cấu hình điểm.</div>
      </div>
    );
  }

  return (
    <>
      <header className="topbar">
        <div className="crumbs">
          <span>Quản trị</span>
          <span className="sep"><Icons.ChevronRight size={14} /></span>
          <strong>Cấu hình điểm</strong>
        </div>
      </header>

      <div className="page">
        <div className="page__head" style={{ marginBottom: 16 }}>
          <div>
            <h1 className="page__title">Cấu hình điểm</h1>
            <p className="page__sub">
              Quản lý ngưỡng cấp độ chuyển đổi số và trọng số các nhóm câu hỏi sử dụng cho thuật toán TOPSIS.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, padding: 16, background: 'var(--warning-tint)', borderRadius: 'var(--r-md)', color: 'oklch(0.5 0.14 65)', marginBottom: 24 }}>
          <Icons.AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Lưu ý cấu hình</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>Thay đổi cấu hình ngưỡng điểm hoặc trọng số sẽ ảnh hưởng trực tiếp đến kết quả tính điểm của tất cả doanh nghiệp đánh giá sau thời điểm thay đổi.</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* ---- Quy tắc tính điểm ---- */}
          <Card 
            title="Quy tắc tính điểm" 
            sub={config.rules.description}
            padding={false}
            foot={
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Thuật toán: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{config.rules.algorithm}</span>
                {' · '}
                Thang điểm chuẩn hóa: <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {config.rules.scoreRange.min} – {config.rules.scoreRange.max}
                </span>
              </div>
            }
          >
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {config.rules.items.map((item) => (
                <div
                  key={item.key}
                  style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border)', padding: 16, background: 'var(--surface-muted)' }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{item.title}</div>
                  <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-subtle)' }}>{item.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* ---- Ngưỡng cấp độ ---- */}
          <Card 
            title="Ngưỡng cấp độ chuyển đổi số (1 – 5)" 
            sub="Mỗi cấp độ tương ứng với một khoảng điểm sau khi chuẩn hóa về 0 – 100."
            padding={false}
          >
            {sortedThresholds.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                Chưa có ngưỡng cấp độ nào được cấu hình.
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Cấp</th>
                      <th style={{ width: 80 }}>Mã</th>
                      <th>Tên cấp độ</th>
                      <th style={{ width: 120 }}>Điểm tối thiểu</th>
                      <th style={{ width: 120 }}>Điểm tối đa</th>
                      <th>Mô tả</th>
                      <th className="col-actions text-right" style={{ width: 100 }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedThresholds.map((t) => {
                      const draft = thresholdDrafts[t.id] ?? {
                        name: t.name,
                        minScore: String(t.minScore),
                        maxScore: String(t.maxScore),
                        description: t.description ?? '',
                      };
                      const state = thresholdRowState[t.id] ?? emptyRowState();
                      return (
                        <tr key={t.id} style={{ verticalAlign: 'top' }}>
                          <td>
                            <div className="row gap-2">
                              <span style={{ width: 6, height: 32, borderRadius: 3, background: LEVEL_COLORS[t.level] || 'var(--primary)' }} />
                              <Badge variant="primary">{t.level}</Badge>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{t.code}</td>
                          <td>
                            <input
                              type="text"
                              className="input"
                              value={draft.name}
                              onChange={(e) =>
                                handleThresholdChange(t.id, 'name', e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              min={0}
                              max={100}
                              className="input"
                              value={draft.minScore}
                              onChange={(e) =>
                                handleThresholdChange(t.id, 'minScore', e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              min={0}
                              max={100}
                              className="input"
                              value={draft.maxScore}
                              onChange={(e) =>
                                handleThresholdChange(t.id, 'maxScore', e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <textarea
                              rows={2}
                              className="textarea"
                              style={{ minHeight: 42 }}
                              value={draft.description}
                              onChange={(e) =>
                                handleThresholdChange(t.id, 'description', e.target.value)
                              }
                            />
                          </td>
                          <td className="col-actions text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={state.saving}
                              onClick={() => handleSaveThreshold(t)}
                            >
                              {state.saving ? 'Đang lưu...' : 'Lưu'}
                            </Button>
                            {state.error && (
                              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--danger)' }}>{state.error}</div>
                            )}
                            {state.success && !state.error && (
                              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--success)' }}>
                                {state.success}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination
                  page={thresholdPage}
                  total={sortedThresholds.length}
                  pageSize={thresholdPageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                  onPageChange={setThresholdPage}
                  onPageSizeChange={(size) => { setThresholdPageSize(size); setThresholdPage(1); }}
                />
              </div>
            )}
          </Card>

          {/* ---- Phân bố ngưỡng trực quan ---- */}
          <Card 
            title="Phân bố ngưỡng trực quan" 
            padding={true}
          >
            <LevelSpectrum levels={sortedThresholds} />
          </Card>

          {/* ---- Trọng số nhóm câu hỏi ---- */}
          <Card 
            title="Trọng số nhóm câu hỏi" 
            sub="Trọng số dùng cho thuật toán TOPSIS. Giá trị càng cao thì nhóm càng ảnh hưởng đến điểm tổng."
            padding={false}
          >
            {sortedGroups.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                Chưa có nhóm câu hỏi nào đang hoạt động.
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>Nhóm</th>
                      <th>Tên nhóm</th>
                      <th style={{ width: 160 }}>Tùy chọn</th>
                      <th style={{ width: 140 }}>Trọng số hiện tại</th>
                      <th style={{ width: 140 }}>Trọng số mới</th>
                      <th className="col-actions text-right" style={{ width: 100 }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedGroups.map((g) => {
                      const draft = weightDrafts[g.id] ?? String(g.weight);
                      const state = weightRowState[g.id] ?? emptyRowState();
                      return (
                        <tr key={g.id} style={{ verticalAlign: 'middle' }}>
                          <td><Badge variant="neutral">{g.groupNumber}</Badge></td>
                          <td style={{ fontWeight: 500 }}>{g.name}</td>
                          <td>
                            <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
                              {g.isOptional && (
                                <Badge variant="warning">Không bắt buộc</Badge>
                              )}
                              {g.isIndustrySpecific && (
                                <Badge variant="info">Theo ngành</Badge>
                              )}
                              {!g.isOptional && !g.isIndustrySpecific && (
                                <span style={{ color: 'var(--text-subtle)' }}>—</span>
                              )}
                            </div>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>
                            {formatNumber(g.weight, 4)}
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.0001"
                              min={0}
                              max={10}
                              className="input"
                              value={draft}
                              onChange={(e) =>
                                setWeightDrafts((prev) => ({
                                  ...prev,
                                  [g.id]: e.target.value,
                                }))
                              }
                            />
                          </td>
                          <td className="col-actions text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={state.saving}
                              onClick={() => handleSaveWeight(g)}
                            >
                              {state.saving ? 'Đang lưu...' : 'Lưu'}
                            </Button>
                            {state.error && (
                              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--danger)' }}>{state.error}</div>
                            )}
                            {state.success && !state.error && (
                              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--success)' }}>
                                {state.success}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination
                  page={weightPage}
                  total={sortedGroups.length}
                  pageSize={weightPageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                  onPageChange={setWeightPage}
                  onPageSizeChange={(size) => { setWeightPageSize(size); setWeightPage(1); }}
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
