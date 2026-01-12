import React, { useMemo, useState } from "react";
import { apiPost } from "../api";

export default function StepFindAccount({ onBack }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [maskedEmail, setMaskedEmail] = useState(null);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  const submit = async () => {
    setError("");
    setResultMsg("");
    setMaskedEmail(null);

    if (!canSubmit) {
      setError("이름을 입력하세요.");
      return;
    }

    try {
      setLoading(true);
      const res = await apiPost("/auth/find-email", { name: name.trim() });
      setResultMsg(res.message || "확인했습니다.");
      setMaskedEmail(res.maskedEmail || null);
    } catch (e) {
      setError(e.message || "요청 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mdoc-card">
      <h2 className="mdoc-h2">아이디 찾기</h2>

      <div className="mdoc-form">
        <label className="mdoc-label">
          이름
          <input
            className="mdoc-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            autoComplete="name"
          />
        </label>

        {error && <div className="mdoc-inlineError">{error}</div>}

        {resultMsg && (
          <div className="mdoc-note" style={{ marginTop: 8 }}>
            <div>{resultMsg}</div>
            {maskedEmail && (
              <div style={{ marginTop: 6, fontWeight: 700 }}>
                가입 이메일: {maskedEmail}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mdoc-btnRowOne">
        <button
          className="mdoc-btn mdoc-btn-primary"
          disabled={!canSubmit || loading}
          onClick={submit}
        >
          {loading ? "확인 중..." : "확인"}
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
