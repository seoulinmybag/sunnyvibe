import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { panelTypeOf, sideLabel, sidesFor } from '../types';
import type { Pages, Side } from '../types';

interface OrderDetail {
  id: string;
  customerName: string;
  panelType: 'single' | 'fold';
  status: 'draft' | 'sent' | 'confirmed';
  customerLink: string;
  pages: Pages;
}

/** These read better as a box than a single line. */
const MULTILINE_FIELDS = new Set(['message', 'account', 'account-groom', 'account-bride', 'qr-guide']);

export default function AdminOrderText() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [pages, setPages] = useState<Pages | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch('/api/admin/session', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) {
          navigate('/admin', { replace: true });
          return null;
        }
        return fetch(`/api/orders/detail?id=${encodeURIComponent(id)}`, { credentials: 'include' }).then((r) => r.json());
      })
      .then((data) => {
        if (!data) return;
        if (data.ok) {
          setOrder(data.order);
          setPages(data.order.pages);
        } else {
          setError(data.error || '주문을 불러오지 못했어요.');
        }
      })
      .catch(() => setError('주문을 불러오지 못했어요.'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  function updateText(side: Side, fieldId: string, text: string) {
    setPages((prev) => {
      const page = prev?.[side];
      if (!prev || !page) return prev;
      return { ...prev, [side]: { ...page, texts: page.texts.map((t) => (t.id === fieldId ? { ...t, text } : t)) } };
    });
  }

  async function handleSave() {
    if (!id || !pages) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/autosave?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pages }),
      });
      const data = await res.json();
      if (data.ok) {
        setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
      } else {
        setError(data.error === 'confirmed' ? '확정된 주문이라 수정할 수 없어요.' : data.error || '저장에 실패했어요.');
      }
    } catch {
      setError('저장 중 오류가 발생했어요.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  if (!order || !pages) {
    return (
      <div className="admin-shell">
        <div className="admin-card">
          <h1>주문서</h1>
          <p className="admin-login-error">{error ?? '주문을 찾을 수 없어요.'}</p>
          <Link to="/admin/dashboard" className="admin-link-btn">
            대시보드로
          </Link>
        </div>
      </div>
    );
  }

  const locked = order.status === 'confirmed';

  return (
    <div className="admin-shell">
      <div className="admin-card admin-dashboard-card admin-form">
        <div className="admin-dashboard-header">
          <h1>주문서 · {order.customerName}</h1>
          <div className="admin-actions">
            <a className="admin-link-btn" href={order.customerLink} target="_blank" rel="noreferrer">
              시안 열기
            </a>
            <Link to="/admin/dashboard" className="admin-link-btn">
              대시보드로
            </Link>
          </div>
        </div>

        <p className="admin-hint">
          시안에 실제로 들어간 문구예요. 여기서 고치면 고객 편집 화면에도 그대로 반영됩니다.
          {locked && ' 확정된 주문이라 지금은 수정할 수 없어요.'}
        </p>

        {sidesFor(panelTypeOf(pages))
          .filter((side) => pages[side])
          .map((side) => (
          <fieldset key={side} className="admin-fieldset">
            <legend>{sideLabel(side, panelTypeOf(pages))}</legend>
            {pages[side]!.texts.length === 0 ? (
              <p className="admin-hint">이 면에는 문구가 없어요.</p>
            ) : (
              pages[side]!.texts.map((field) => (
                <label key={field.id} className="admin-field">
                  <span>{field.label}</span>
                  {MULTILINE_FIELDS.has(field.id) ? (
                    <textarea
                      rows={4}
                      value={field.text}
                      disabled={locked}
                      onChange={(e) => updateText(side, field.id, e.target.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      value={field.text}
                      disabled={locked}
                      onChange={(e) => updateText(side, field.id, e.target.value)}
                    />
                  )}
                </label>
              ))
            )}
          </fieldset>
        ))}

        {error && <p className="admin-login-error">{error}</p>}

        <div className="admin-actions">
          <button type="button" className="primary" disabled={saving || locked} onClick={handleSave}>
            {saving ? '저장 중...' : '저장'}
          </button>
          {savedAt && <span className="admin-hint">저장됨 · {savedAt}</span>}
        </div>
      </div>
    </div>
  );
}
