import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/admin/session', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) navigate('/admin/dashboard', { replace: true });
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError('비밀번호가 올바르지 않아요.');
      }
    } catch {
      setError('로그인 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) return null;

  return (
    <div className="admin-login-shell">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1>관리자 로그인</h1>
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className="admin-login-error">{error}</p>}
        <button type="submit" className="primary" disabled={submitting || !password}>
          {submitting ? '확인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}
