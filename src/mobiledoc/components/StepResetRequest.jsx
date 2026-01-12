import React, { useMemo, useState } from "react";
import { apiPost } from "../api";

export default function StepResetRequest({ onBack, onGoNext }) {
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSend = useMemo(() => email.trim().length > 0 && email.includes("@"), [email]);

  const send = async () => {
    setError("");
    setInfo("");

    if (!canSend) {
      setError("이메일을 올바르게 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await apiPost("/auth/email/send-code", {
        email: email.trim().toLowerCase(),
        purpose: "RESET_PASSWORD",
      });
      setInfo("인증번호를 보냈어요. 메일함을 확인해주세요.");
      onGoNext?.(email.trim().toLowerCase());
    } catch (e) {
      setError(e.message || "요청 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mdoc-card">
      <h2 className="mdoc-h2">비밀번호 재설정</h2>

      <div className="mdoc-form">
        <label className="mdoc-label">
          가입 이메일
          <input
            className="mdoc-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            autoComplete="email"
          />
        </label>

        {info && <div className="mdoc-note">{info}</div>}
        {error && <div className="mdoc-inlineError">{error}</div>}
      </div>

      <div className="mdoc-btnRowOne">
        <button
          className="mdoc-btn mdoc-btn-primary"
          disabled={!canSend || loading}
          onClick={send}
        >
          {loading ? "전송 중..." : "인증번호 보내기"}
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
