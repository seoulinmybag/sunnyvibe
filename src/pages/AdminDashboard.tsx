import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface OrderSummary {
  id: string;
  customer_name: string;
  panel_type: 'single' | 'fold';
  status: 'draft' | 'sent' | 'confirmed';
  created_at: string;
  confirmed_at: string | null;
}

interface OrderDetail {
  id: string;
  customerName: string;
  photoUrl: string | null;
  mapUrl: string | null;
  qrUrl: string | null;
  customerLink: string;
  exports: {
    pdfUrl: string | null;
    frontPngUrl: string | null;
    backPngUrl: string | null;
    frontSvgUrl: string | null;
    backSvgUrl: string | null;
  } | null;
}

const STATUS_LABEL: Record<OrderSummary['status'], string> = {
  draft: '생성됨',
  sent: '고객 편집중',
  confirmed: '확정됨',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, OrderDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/session', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) {
          navigate('/admin', { replace: true });
          return;
        }
        return fetch('/api/orders/list', { credentials: 'include' })
          .then((r) => r.json())
          .then((data) => setOrders(data.orders ?? []));
      })
      .catch(() => navigate('/admin', { replace: true }))
      .finally(() => setChecking(false));
  }, [navigate]);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    navigate('/admin', { replace: true });
  }

  function copyLink(id: string) {
    const link = `${window.location.origin}/order/${id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  async function toggleDetail(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (detailCache[id]) return;
    setLoadingDetail(id);
    try {
      const res = await fetch(`/api/orders/detail?id=${encodeURIComponent(id)}`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setDetailCache((prev) => ({ ...prev, [id]: data.order }));
    } finally {
      setLoadingDetail(null);
    }
  }

  if (checking) return null;

  return (
    <div className="admin-shell">
      <div className="admin-card admin-dashboard-card">
        <div className="admin-dashboard-header">
          <h1>관리자 대시보드</h1>
          <div className="admin-actions">
            <Link to="/admin/new" className="admin-link-btn primary">
              새 주문 만들기
            </Link>
            <button type="button" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>

        {!orders || orders.length === 0 ? (
          <p className="admin-hint">아직 생성된 주문이 없어요.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>고객명</th>
                <th>타입</th>
                <th>상태</th>
                <th>생성일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const detail = detailCache[o.id];
                const isExpanded = expandedId === o.id;
                return (
                  <Fragment key={o.id}>
                    <tr>
                      <td>{o.customer_name}</td>
                      <td>{o.panel_type === 'fold' ? '2단' : '1단'}</td>
                      <td>
                        <span className={`admin-status admin-status-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                      </td>
                      <td>{new Date(o.created_at).toLocaleDateString('ko-KR')}</td>
                      <td className="admin-table-actions">
                        <button type="button" onClick={() => copyLink(o.id)}>
                          {copiedId === o.id ? '복사됨!' : '링크 복사'}
                        </button>
                        <Link to={`/admin/order/${o.id}`} className="admin-link-btn admin-table-link">
                          주문서 보기
                        </Link>
                        <button type="button" onClick={() => toggleDetail(o.id)}>
                          {isExpanded ? '닫기' : '상세보기'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5}>
                          {loadingDetail === o.id || !detail ? (
                            <p className="admin-hint">불러오는 중...</p>
                          ) : (
                            <div className="admin-detail-panel">
                              <div className="admin-detail-thumbs">
                                {detail.photoUrl && <img src={detail.photoUrl} alt="신랑신부 사진" />}
                                {detail.mapUrl && <img src={detail.mapUrl} alt="약도" />}
                                {detail.qrUrl && <img src={detail.qrUrl} alt="QR" />}
                              </div>
                              {detail.exports ? (
                                <div className="admin-actions">
                                  {detail.exports.pdfUrl && (
                                    <a className="admin-link-btn primary" href={detail.exports.pdfUrl} target="_blank" rel="noreferrer">
                                      PDF 다운로드
                                    </a>
                                  )}
                                  {detail.exports.frontSvgUrl && (
                                    <a className="admin-link-btn" href={detail.exports.frontSvgUrl} target="_blank" rel="noreferrer">
                                      앞면 SVG
                                    </a>
                                  )}
                                  {detail.exports.backSvgUrl && (
                                    <a className="admin-link-btn" href={detail.exports.backSvgUrl} target="_blank" rel="noreferrer">
                                      뒷면 SVG
                                    </a>
                                  )}
                                  {detail.exports.frontPngUrl && (
                                    <a className="admin-link-btn" href={detail.exports.frontPngUrl} target="_blank" rel="noreferrer">
                                      앞면 PNG
                                    </a>
                                  )}
                                  {detail.exports.backPngUrl && (
                                    <a className="admin-link-btn" href={detail.exports.backPngUrl} target="_blank" rel="noreferrer">
                                      뒷면 PNG
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <p className="admin-hint">아직 고객이 시안을 확정하지 않았어요.</p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
