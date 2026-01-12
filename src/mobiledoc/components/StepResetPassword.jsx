import React, { useMemo, useState } from "react";
import { apiPost } from "../api";

const hasSpecial = (s) => /[^a-zA-Z0-9\s]/.test(s); 


export default function StepResetPassword({ onBack, onDone, email }) {
  const [code, setCode] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pwOk = useMemo(() => pw1.length >= 8 && hasSpecial(pw1), [pw1]);

  const canSubmit = useMemo(() => {
    if (!email) return false;
    if (!code.trim()) return false;
    if (!pwOk) return false;
    if (pw1 !== pw2) return false;
    return true;
  }, [email, code, pw1, pw2, pwOk]);

  const submit = async () => {
    setError("");
    setInfo("");

    if (!canSubmit) {
      setError("입력값을 다시 확인해주세요. (비밀번호: 8자+특수문자)");
      return;
    }

    try {
      setLoading(true);
      await apiPost("/auth/password/reset-with-code", {
        email,
        code: code.trim(),
        newPassword: pw1,
      });
      setInfo("비밀번호가 변경됐어요. 로그인으로 돌아갈게요.");
      setTimeout(() => onDone?.(), 600);
    } catch (e) {
      setError(e.message || "변경 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mdoc-card">
      <h2 className="mdoc-h2">새 비밀번호 설정</h2>

      <div className="mdoc-form">
        <div className="mdoc-note">이메일: {email}</div>

        <label className="mdoc-label">
          인증번호(6자리)
          <input className="mdoc-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
        </label>

        <label className="mdoc-label">
          새 비밀번호 (8자 이상 + 특수문자 포함)
          <input
            type="password"
            className="mdoc-input"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            autoComplete="new-password"
            placeholder="예: Abcd!234"
          />
        </label>

        {!pwOk && pw1.length > 0 && (
          <div className="mdoc-inlineError">비밀번호는 8자 이상이고 특수문자를 1개 이상 포함해야 합니다.</div>
        )}

        <label className="mdoc-label">
          새 비밀번호 확인
          <input
            type="password"
            className="mdoc-input"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            autoComplete="new-password"
          />
        </label>

        {pw2.length > 0 && pw1 !== pw2 && <div className="mdoc-inlineError">비밀번호가 서로 다릅니다.</div>}

        {info && <div className="mdoc-note">{info}</div>}
        {error && <div className="mdoc-inlineError">{error}</div>}
      </div>

      <div className="mdoc-btnRowOne">
        <button className="mdoc-btn mdoc-btn-primary" disabled={!canSubmit || loading} onClick={submit}>
          {loading ? "변경 중..." : "비밀번호 변경"}
        </button>
      </div>

      <div className="mdoc-rowBetween" style={{ marginTop: 10 }}>
        <button className="mdoc-btn mdoc-btn-ghost" onClick={onBack} disabled={loading}>
          뒤로
        </button>
      </div>
    </section>
  );
}
