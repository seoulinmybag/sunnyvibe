import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface CreateResult {
  id: string;
  customerLink: string;
  customerPassword: string;
}

interface FamilySide {
  name: string;
  father: string;
  fatherDeceased: boolean;
  mother: string;
  motherDeceased: boolean;
}

const emptyFamily: FamilySide = { name: '', father: '', fatherDeceased: false, mother: '', motherDeceased: false };

/** 신랑측/신부측 입력 묶음. 부모님 이름은 두 칸 모두 선택 입력이고, 각각 고인 표시를 켤 수 있다. */
function FamilyFields({
  legend,
  nameLabel,
  value,
  onChange,
}: {
  legend: string;
  nameLabel: string;
  value: FamilySide;
  onChange: (next: FamilySide) => void;
}) {
  return (
    <fieldset className="admin-fieldset">
      <legend>{legend}</legend>

      <label className="admin-field">
        <span>{nameLabel}</span>
        <input type="text" value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} />
      </label>

      <div className="admin-field">
        <span>아버지 (선택)</span>
        <div className="admin-parent-row">
          <label className="admin-deceased-check">
            <input
              type="checkbox"
              checked={value.fatherDeceased}
              onChange={(e) => onChange({ ...value, fatherDeceased: e.target.checked })}
            />
            고인
          </label>
          <input type="text" value={value.father} onChange={(e) => onChange({ ...value, father: e.target.value })} />
        </div>
      </div>

      <div className="admin-field">
        <span>어머니 (선택)</span>
        <div className="admin-parent-row">
          <label className="admin-deceased-check">
            <input
              type="checkbox"
              checked={value.motherDeceased}
              onChange={(e) => onChange({ ...value, motherDeceased: e.target.checked })}
            />
            고인
          </label>
          <input type="text" value={value.mother} onChange={(e) => onChange({ ...value, mother: e.target.value })} />
        </div>
      </div>
    </fieldset>
  );
}

export default function AdminNewOrder() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  const [customerName, setCustomerName] = useState('');
  const [names, setNames] = useState('');
  const [title, setTitle] = useState('');
  const [groom, setGroom] = useState<FamilySide>(emptyFamily);
  const [bride, setBride] = useState<FamilySide>(emptyFamily);
  const [deceasedStyle, setDeceasedStyle] = useState<'hanja' | 'flower'>('hanja');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [greeting, setGreeting] = useState('');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [panelType, setPanelType] = useState<'single' | 'fold'>('single');
  const [hasAccount, setHasAccount] = useState(false);
  const [hasMap, setHasMap] = useState(false);
  const [hasQr, setHasQr] = useState(false);
  const [accountGroom, setAccountGroom] = useState('');
  const [accountBride, setAccountBride] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [map, setMap] = useState<File | null>(null);
  const [qr, setQr] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateResult | null>(null);
  const [copied, setCopied] = useState(false);

  const anyDeceased =
    groom.fatherDeceased || groom.motherDeceased || bride.fatherDeceased || bride.motherDeceased;
  const mapForced = panelType === 'fold';
  const mapChecked = mapForced || hasMap;

  useEffect(() => {
    fetch('/api/admin/session', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) navigate('/admin', { replace: true });
      })
      .catch(() => navigate('/admin', { replace: true }))
      .finally(() => setChecking(false));
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) return setError('고객명을 입력해주세요.');
    if (!photo) return setError('신랑신부 사진을 올려주세요.');
    if (mapChecked && !map) return setError('약도 이미지를 올려주세요.');
    if (hasQr && !qr) return setError('QR 이미지를 올려주세요.');

    const form = new FormData();
    form.set('customer_name', customerName);
    form.set('names', names);
    form.set('title', title);
    for (const [side, value] of [['groom', groom], ['bride', bride]] as const) {
      form.set(`${side}_name`, value.name);
      form.set(`${side}_father`, value.father);
      form.set(`${side}_father_deceased`, String(value.fatherDeceased));
      form.set(`${side}_mother`, value.mother);
      form.set(`${side}_mother_deceased`, String(value.motherDeceased));
    }
    form.set('deceased_style', deceasedStyle);
    form.set('date', date);
    form.set('venue', venue);
    form.set('greeting', greeting);
    form.set('panel_type', panelType);
    form.set('has_account', String(hasAccount));
    form.set('has_map', String(mapChecked));
    form.set('has_qr', String(hasQr));
    if (hasAccount) {
      form.set('account_groom', accountGroom);
      form.set('account_bride', accountBride);
    }
    if (customerPassword.trim()) form.set('customer_password', customerPassword.trim());
    form.set('orientation', orientation);
    form.set('photo', photo);
    if (mapChecked && map) form.set('map', map);
    if (hasQr && qr) form.set('qr', qr);

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders/create', { method: 'POST', credentials: 'include', body: form });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || '주문 생성에 실패했어요.');
        return;
      }
      setResult(data);
    } catch {
      setError('주문 생성 중 오류가 발생했어요.');
    } finally {
      setSubmitting(false);
    }
  }

  function copyLink() {
    if (!result) return;
    navigator.clipboard.writeText(result.customerLink).then(() => setCopied(true));
  }

  if (checking) return null;

  if (result) {
    return (
      <div className="admin-shell">
        <div className="admin-card">
          <h1>주문이 생성됐어요</h1>
          <p className="admin-hint">아래 링크와 비밀번호를 고객에게 전달해주세요.</p>
          <label className="admin-field">
            <span>고객용 링크</span>
            <input type="text" readOnly value={result.customerLink} onFocus={(e) => e.target.select()} />
          </label>
          <label className="admin-field">
            <span>비밀번호</span>
            <input type="text" readOnly value={result.customerPassword} />
          </label>
          <div className="admin-actions">
            <button type="button" className="primary" onClick={copyLink}>
              {copied ? '복사됨!' : '링크 복사'}
            </button>
            <Link to="/admin/dashboard" className="admin-link-btn">
              대시보드로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <form className="admin-card admin-form" onSubmit={handleSubmit}>
        <h1>새 주문 만들기</h1>

        <label className="admin-field">
          <span>고객명 (내부 참고용)</span>
          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="김철수·이영희 고객님" />
        </label>

        <FamilyFields legend="신랑측" nameLabel="신랑 이름" value={groom} onChange={setGroom} />
        <FamilyFields legend="신부측" nameLabel="신부 이름" value={bride} onChange={setBride} />

        {anyDeceased && (
          <div className="admin-field">
            <span>고인 표시 방식</span>
            <div className="admin-radio-row">
              <label>
                <input type="radio" checked={deceasedStyle === 'hanja'} onChange={() => setDeceasedStyle('hanja')} /> 故 (한자)
              </label>
              <label>
                <input type="radio" checked={deceasedStyle === 'flower'} onChange={() => setDeceasedStyle('flower')} /> ✿ (국화꽃)
              </label>
            </div>
          </div>
        )}

        <label className="admin-field">
          <span>앞면 표시 이름 (비우면 신랑·신부 이름으로 자동)</span>
          <input type="text" value={names} onChange={(e) => setNames(e.target.value)} placeholder="김철수 · 이영희" />
        </label>

        <label className="admin-field">
          <span>제목 (앞면 하단 자막)</span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="민호와 혜진이는 평생 사랑할 것을 맹세합니다" />
        </label>

        <label className="admin-field">
          <span>날짜/시간</span>
          <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="2026년 10월 10일 토요일 오후 1시" />
        </label>

        <label className="admin-field">
          <span>장소</span>
          <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="OO웨딩홀 3층 그랜드홀" />
        </label>

        <label className="admin-field">
          <span>인사말 (뒷면 · 2단은 내지 우측)</span>
          <textarea rows={4} value={greeting} onChange={(e) => setGreeting(e.target.value)} placeholder="비워두면 기본 문구가 들어가요" />
        </label>

        <label className="admin-field">
          <span>신랑신부 사진 (보정 완료본)</span>
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        </label>

        <div className="admin-field">
          <span>카드 방향</span>
          <div className="admin-radio-row">
            <label>
              <input type="radio" checked={orientation === 'landscape'} onChange={() => setOrientation('landscape')} /> 가로 (16:11)
            </label>
            <label>
              <input type="radio" checked={orientation === 'portrait'} onChange={() => setOrientation('portrait')} /> 세로 (11:16)
            </label>
          </div>
        </div>

        <div className="admin-field">
          <span>레이아웃 타입</span>
          <div className="admin-radio-row">
            <label>
              <input type="radio" checked={panelType === 'single'} onChange={() => setPanelType('single')} /> 1단
            </label>
            <label>
              <input type="radio" checked={panelType === 'fold'} onChange={() => setPanelType('fold')} /> 2단 접지형
            </label>
          </div>
        </div>

        <div className="admin-field">
          <span>옵션</span>
          <div className="admin-checkbox-row">
            <label>
              <input type="checkbox" checked={hasAccount} onChange={(e) => setHasAccount(e.target.checked)} /> 계좌
            </label>
            <label>
              <input type="checkbox" checked={mapChecked} disabled={mapForced} onChange={(e) => setHasMap(e.target.checked)} /> 약도{mapForced && ' (2단 필수)'}
            </label>
            <label>
              <input type="checkbox" checked={hasQr} onChange={(e) => setHasQr(e.target.checked)} /> QR
            </label>
          </div>
        </div>

        {hasAccount && (
          <fieldset className="admin-fieldset">
            <legend>마음 전하실 곳</legend>
            <p className="admin-hint">'마음 전하실 곳' 머리말은 자동으로 붙습니다. 계좌만 적어주세요.</p>
            <label className="admin-field">
              <span>신랑측</span>
              <textarea
                rows={3}
                value={accountGroom}
                onChange={(e) => setAccountGroom(e.target.value)}
                placeholder={'신랑측 혼주: (농협) 000-00-000000\n신랑: (농협) 000-00-000000'}
              />
            </label>
            <label className="admin-field">
              <span>신부측</span>
              <textarea
                rows={3}
                value={accountBride}
                onChange={(e) => setAccountBride(e.target.value)}
                placeholder={'신부측 혼주: (대구은행) 000-00-000000\n신부: (대구은행) 000-00-000000'}
              />
            </label>
          </fieldset>
        )}

        {mapChecked && (
          <label className="admin-field">
            <span>약도 이미지</span>
            <input type="file" accept="image/*" onChange={(e) => setMap(e.target.files?.[0] ?? null)} />
          </label>
        )}

        {hasQr && (
          <label className="admin-field">
            <span>QR 이미지</span>
            <input type="file" accept="image/*" onChange={(e) => setQr(e.target.files?.[0] ?? null)} />
          </label>
        )}

        <label className="admin-field">
          <span>고객 비밀번호 (선택 — 비우면 임의 4자리 생성)</span>
          <input type="text" value={customerPassword} onChange={(e) => setCustomerPassword(e.target.value)} placeholder="고객 전화번호 뒷자리 등" />
        </label>

        {error && <p className="admin-login-error">{error}</p>}

        <div className="admin-actions">
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? '생성 중...' : '주문 생성'}
          </button>
          <Link to="/admin/dashboard" className="admin-link-btn">
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
