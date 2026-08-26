import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** Placeholder for Phase 1 — just proves the login round-trip works. The real order list lands in Phase 2. */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/admin/session', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) navigate('/admin', { replace: true });
      })
      .catch(() => navigate('/admin', { replace: true }))
      .finally(() => setChecking(false));
  }, [navigate]);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    navigate('/admin', { replace: true });
  }

  if (checking) return null;

  return (
    <div className="admin-login-shell">
      <div className="admin-login-card">
        <h1>관리자 대시보드</h1>
        <p>로그인됐어요. 주문 목록·생성 화면은 다음 단계에서 추가됩니다.</p>
        <button type="button" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
