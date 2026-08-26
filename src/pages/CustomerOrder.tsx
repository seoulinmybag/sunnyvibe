import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '../components/Editor';
import type { Orientation, PageState, Side } from '../types';

interface OrderData {
  id: string;
  customerName: string;
  orientation: Orientation;
  pages: Record<Side, PageState>;
  status: 'draft' | 'sent' | 'confirmed';
}

export default function CustomerOrder() {
  const { id } = useParams<{ id: string }>();
  const [checking, setChecking] = useState(true);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}/data`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setOrder(data.order);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId: id, password }),
      });
      const data = await res.json();
      if (data.ok) {
        setOrder(data.order);
      } else {
        setError(data.error || '비밀번호가 올바르지 않아요.');
      }
    } catch {
      setError('로그인 중 오류가 발생했어요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) return null;

  if (!order) {
    return (
      <div className="admin-login-shell">
        <form className="admin-login-card" onSubmit={handleSubmit}>
          <h1>청첩장 확인</h1>
          <p className="admin-hint">전달받으신 비밀번호를 입력해주세요.</p>
          <input
            type="text"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="admin-login-error">{error}</p>}
          <button type="submit" className="primary" disabled={submitting || !password}>
            {submitting ? '확인 중...' : '확인'}
          </button>
        </form>
      </div>
    );
  }

  return <Editor orientation={order.orientation} initialPages={order.pages} showCustomerLinkPanel={false} />;
}
