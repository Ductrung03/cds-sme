import { useState, useEffect } from 'react';
import { assessmentApi } from '@/api/client';
import { type AssessmentListItem, type AssessmentResult, CAP_DO_INFO } from '@/types';
import { Button, Card, Progress, StatusBadge } from '@/components/ui/index';
import { Icons } from '@/components/ui/Icons';

export function Result() {
  const [assessment, setAssessment] = useState<AssessmentListItem | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const listResult = await assessmentApi.getMyAssessments();
        const list = Array.isArray(listResult) ? listResult : (listResult as any).items ?? [];
        const latest = list[0]; 
        if (latest) {
          setAssessment(latest);
          if (latest.trangThai === 'published' || latest.trangThai === 'scored') {
             const res = await assessmentApi.getResult(latest.id);
             setResult(res);
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
      <div className="layout-page" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Icons.Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          <div style={{ color: 'var(--text-muted)' }}>Đang tải kết quả...</div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="layout-page">
        <div style={{ maxWidth: 500, margin: '100px auto', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--background)', display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: 'var(--text-muted)' }}>
            <Icons.ClipboardList size={28} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Chưa có dữ liệu</h2>
          <p style={{ color: 'var(--text-muted)' }}>Bạn chưa thực hiện bài khảo sát nào.</p>
        </div>
      </div>
    );
  }

  if (assessment.trangThai !== 'published') {
    return (
      <div className="layout-page">
        <div style={{ maxWidth: 500, margin: '100px auto', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--warning-tint)', color: 'var(--warning)', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
            <Icons.Clock size={40} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Đang chờ xét duyệt</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            Bài khảo sát của bạn đang trong quá trình đánh giá. <br />
            Trạng thái hiện tại: <StatusBadge status={assessment.trangThai} />
          </p>
          <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
            Kết quả sẽ hiển thị tại đây sau khi quản trị viên công bố.
          </div>
        </div>
      </div>
    );
  }

  if (!result) return <div className="layout-page"><div style={{padding:40, textAlign:'center'}}>Không tải được chi tiết kết quả.</div></div>;

  const capDoInfo = CAP_DO_INFO[result.capDo] || CAP_DO_INFO['Cấp độ 1'];

  return (
    <div className="layout-page" style={{ paddingBottom: 60 }}>
      <div className="container" style={{ maxWidth: 1000, marginTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Báo cáo Kết quả Đánh giá</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Công bố ngày: <span style={{ fontWeight: 600 }}>{result.ngayCongBo ? new Date(result.ngayCongBo).toLocaleDateString('vi-VN') : '--'}</span>
            </div>
          </div>
          <Button variant="secondary" icon={<Icons.Download size={16} />}>Tải PDF</Button>
        </div>

        <div className="grid grid--cols-3" style={{ marginBottom: 32 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <Card padding style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 8, bottom: 0, background: capDoInfo.mau }} />
              <div style={{ display: 'flex', gap: 32, alignItems: 'center', paddingLeft: 8 }}>
                <div style={{ 
                  width: 140, height: 140, borderRadius: '50%', 
                  border: `8px solid ${capDoInfo.mau}20`, 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  position: 'relative'
                }}>
                  <svg style={{ position: 'absolute', top: -8, left: -8, width: 140, height: 140, transform: 'rotate(-90deg)' }}>
                    <circle 
                      cx="70" cy="70" r="66" 
                      fill="none" 
                      stroke={capDoInfo.mau} 
                      strokeWidth="8" 
                      strokeDasharray={`${(result.tongDiem / 100) * 414} 414`} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <span style={{ fontSize: 36, fontWeight: 800, color: capDoInfo.mau, lineHeight: 1 }}>{result.tongDiem}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>/ 100 điểm</span>
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>Xếp hạng doanh nghiệp</div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: capDoInfo.mau, margin: '0 0 12px' }}>{result.capDo}</h2>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, fontSize: 14 }}>
                    {result.moTaCapDo || capDoInfo.moTa}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card padding style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-tint)', color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
                  <Icons.TrendingUp size={16} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Lĩnh vực</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, paddingLeft: 44 }}>{assessment.tenNganh || 'Không xác định'}</div>
            </Card>
            
            <Card padding style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--info-tint)', color: 'var(--info)', display: 'grid', placeItems: 'center' }}>
                  <Icons.CheckCircle size={16} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Trạng thái đánh giá</div>
              </div>
              <div style={{ paddingLeft: 44, marginTop: 4 }}>
                <StatusBadge status={assessment.trangThai} />
              </div>
            </Card>
          </div>
        </div>

        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Phân tích trụ cột chuyển đổi số</h3>
        <div className="grid grid--cols-2" style={{ marginBottom: 32 }}>
          {result.diemTheoNhom.map((nhom) => (
            <Card key={nhom.nhom} padding style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Trụ cột {nhom.nhom}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{nhom.tenNhom}</div>
                </div>
                <div style={{ background: 'var(--background)', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                  {Math.round(nhom.diem)} / {nhom.diemToiDa}
                </div>
              </div>
              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, fontWeight: 600, color: 'var(--text-muted)' }}>
                  <span>Mức độ đạt được</span>
                  <span>{Math.round(nhom.tyLe)}%</span>
                </div>
                <Progress value={nhom.tyLe} variant={nhom.tyLe >= 80 ? 'success' : nhom.tyLe >= 50 ? 'primary' : 'accent'} />
              </div>
            </Card>
          ))}
        </div>

        {result.ghiChuAdmin && (
          <Card padding style={{ border: '1px solid var(--info)', background: 'var(--info-tint)' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', color: 'var(--info)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icons.Info size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: '#004085' }}>Nhận xét & Khuyến nghị từ Chuyên gia</h4>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: '#002752', whiteSpace: 'pre-wrap' }}>
                  {result.ghiChuAdmin}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
