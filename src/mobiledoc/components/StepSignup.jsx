import React, { useMemo, useState } from "react";
import { apiPost } from "../api";

const hasSpecial = (s) => /[^a-zA-Z0-9\s]/.test(s); 


export default function StepSignup({ onBack, onSignupSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  // ✅ 이메일 인증 관련(네가 이미 붙여둔 버전 기준이면 유지)
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailOk = useMemo(() => email.trim() && email.includes("@"), [email]);

  const canSendCode = useMemo(() => emailOk && !loading, [emailOk, loading]);
  const canVerifyCode = useMemo(() => emailOk && code.trim().length > 0 && !loading, [emailOk, code, loading]);

  const pwOk = useMemo(() => pw.length >= 8 && hasSpecial(pw), [pw]);

  const canSubmit = useMemo(() => {
    if (!name.trim() || !email.trim() || !pw.trim() || !pw2.trim()) return false;
    if (!email.includes("@")) return false;
    if (!pwOk) return false;
    if (pw !== pw2) return false;
    if (!emailVerified) return false;
    return true;
  }, [name, email, pw, pw2, pwOk, emailVerified]);

  const sendCode = async () => {
    setError("");
    setInfo("");

    if (!emailOk) {
      setError("이메일을 먼저 올바르게 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await apiPost("/auth/email/send-code", {
        email: email.trim().toLowerCase(),
        purpose: "SIGNUP",
      });
      setCodeSent(true);
      setEmailVerified(false);
      setInfo("인증번호를 보냈어요. 메일함을 확인해주세요.");
    } catch (e) {
      setError(e.message || "인증번호 발송 실패");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    setInfo("");

    if (!emailOk || !code.trim()) {
      setError("이메일/인증번호를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await apiPost("/auth/email/verify-code", {
        email: email.trim().toLowerCase(),
        purpose: "SIGNUP",
        code: code.trim(),
      });
      setEmailVerified(true);
      setInfo("이메일 인증 완료!");
    } catch (e) {
      setEmailVerified(false);
      setError(e.message || "인증 실패");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setError("");
    setInfo("");

    if (!canSubmit) {
      setError("입력값을 다시 확인해주세요. (비밀번호: 8자+특수문자 / 이메일 인증 필요)");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      setLoading(true);

      await apiPost("/auth/signup", {
        email: normalizedEmail,
        password: pw,
        name: name.trim(),
      });

      const user = await apiPost("/auth/login", {
        email: normalizedEmail,
        password: pw,
      });

      onSignupSuccess(user);
    } catch (e) {
      setError(e.message || "회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mdoc-card">
      <h2 className="mdoc-h2">회원가입</h2>

      <div className="mdoc-form">
        <label className="mdoc-label">
          이름
          <input className="mdoc-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
        </label>

        <label className="mdoc-label">
          이메일
          <input
            className="mdoc-input"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailVerified(false);
              setCodeSent(false);
              setCode("");
              setInfo("");
              setError("");
            }}
            placeholder="example@email.com"
          />
        </label>

        <div className="mdoc-rowBetween" style={{ marginTop: 6 }}>
          <button className="mdoc-btn mdoc-btn-ghost" type="button" onClick={sendCode} disabled={!canSendCode}>
            {codeSent ? "인증번호 다시 보내기" : "인증번호 보내기"}
          </button>
          <div className="mdoc-footnote" style={{ margin: 0 }}>
            {emailVerified ? "✅ 인증 완료" : codeSent ? "메일 확인 후 입력" : ""}
          </div>
        </div>

        <label className="mdoc-label">
          인증번호(6자리)
          <input className="mdoc-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
        </label>

        <div className="mdoc-btnRowOne">
          <button className="mdoc-btn mdoc-btn-primary" type="button" onClick={verifyCode} disabled={!canVerifyCode}>
            {loading ? "확인 중..." : "인증 확인"}
          </button>
        </div>

        <label className="mdoc-label">
          비밀번호 (8자 이상 + 특수문자 포함)
          <input
            type="password"
            className="mdoc-input"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="예: Abcd!234"
            autoComplete="new-password"
          />
        </label>

        {!pwOk && pw.length > 0 && (
          <div className="mdoc-inlineError">비밀번호는 8자 이상이고 특수문자를 1개 이상 포함해야 합니다.</div>
        )}

        <label className="mdoc-label">
          비밀번호 확인
          <input
            type="password"
            className="mdoc-input"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </label>

        {pw2.length > 0 && pw !== pw2 && <div className="mdoc-inlineError">비밀번호가 서로 다릅니다.</div>}

        {info && <div className="mdoc-note">{info}</div>}
        {error && <div className="mdoc-inlineError">{error}</div>}
      </div>

      <div className="mdoc-btnRowOne">
        <button className="mdoc-btn mdoc-btn-primary" disabled={!canSubmit || loading} onClick={submit}>
          {loading ? "처리중..." : "회원가입하고 시작하기"}
        </button>
      </div>

      <div className="mdoc-rowBetween" style={{ marginTop: 10 }}>
        <button className="mdoc-btn mdoc-btn-ghost" onClick={onBack} disabled={loading}>
          뒤로
        </button>
        <div className="mdoc-footnote">* 가입 성공 후 자동 로그인 됩니다.</div>
      </div>
    </section>
  );
}
