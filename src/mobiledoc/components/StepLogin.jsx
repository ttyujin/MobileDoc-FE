import React, { useMemo, useState } from "react";
import { apiPost } from "../api";

const hasSpecial = (s) => /[^a-zA-Z0-9\s]/.test(s); 


export default function StepLogin({
  onBack,
  onLoginSuccess,
  onSignup,
  onFindAccount,
  onResetPassword,
}) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pwOk = useMemo(() => pw.trim().length >= 8 && hasSpecial(pw), [pw]);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && pw.trim().length > 0 && pwOk;
  }, [email, pw, pwOk]);

  const submit = async () => {
    setError("");

    if (!canSubmit) {
      setError("이메일/비밀번호를 입력하세요. (비밀번호: 8자 이상 + 특수문자 포함)");
      return;
    }

    try {
      setLoading(true);
      const user = await apiPost("/auth/login", {
        email: email.trim().toLowerCase(),
        password: pw,
      });
      onLoginSuccess(user);
    } catch (e) {
      setError(e.message || "로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mdoc-card">
      <h2 className="mdoc-h2">로그인</h2>

      <div className="mdoc-form">
        <label className="mdoc-label">
          이메일
          <input
            className="mdoc-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@mobiledoc.com"
            autoComplete="email"
          />
        </label>

        <label className="mdoc-label">
          비밀번호 (8자 이상 + 특수문자)
          <input
            type="password"
            className="mdoc-input"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="예: Abcd!234"
            autoComplete="current-password"
          />
        </label>

        {!pwOk && pw.length > 0 && (
          <div className="mdoc-inlineError">비밀번호는 8자 이상이고 특수문자를 1개 이상 포함해야 합니다.</div>
        )}

        {error && <div className="mdoc-inlineError">{error}</div>}
      </div>

      <div className="mdoc-btnRowOne">
        <button className="mdoc-btn mdoc-btn-primary" disabled={!canSubmit || loading} onClick={submit}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </div>

      <div className="mdoc-rowBetween" style={{ marginTop: 10 }}>
        <button className="mdoc-btn mdoc-btn-ghost" onClick={onBack} disabled={loading}>
          뒤로
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="mdoc-btn mdoc-btn-ghost" onClick={onFindAccount} disabled={loading}>
            아이디 찾기
          </button>
          <button className="mdoc-btn mdoc-btn-ghost" onClick={onResetPassword} disabled={loading}>
            비밀번호 재설정
          </button>
          <button className="mdoc-btn mdoc-btn-ghost" onClick={onSignup} disabled={loading}>
            회원가입
          </button>
        </div>
      </div>
    </section>
  );
}
