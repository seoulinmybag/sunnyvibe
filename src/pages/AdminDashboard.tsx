import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface OrderSummary {
  id: string;
  customer_name: string;
  panel_type: 'single' | 'fold';
  status: 'draft' | 'sent' | 'confirmed';
  created_at: string;
  confirmed_at: string | null;
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
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.customer_name}</td>
                  <td>{o.panel_type === 'fold' ? '2단' : '1단'}</td>
                  <td>
                    <span className={`admin-status admin-status-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                  </td>
                  <td>{new Date(o.created_at).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <button type="button" onClick={() => copyLink(o.id)}>
                      {copiedId === o.id ? '복사됨!' : '링크 복사'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
