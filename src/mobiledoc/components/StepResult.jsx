// src/mobiledoc/components/StepResult.jsx
import React, { useEffect, useMemo, useState } from "react";
import { apiPost } from "../api";

export default function StepResult({
  decision,
  onBackToQuestions,
  onGoChecklist,
  onGoHospitals,
  hospitalsButtonLabel = "병원 추천",
  showHospitalsButton = true,
}) {
  const reasons = Array.isArray(decision?.reasons) ? decision.reasons : [];

  const [serverAi, setServerAi] = useState(null);
  const [aiStatus, setAiStatus] = useState("idle"); // idle | loading | ok | error

  // ✅ 설명 길이: 1(간단) / 2(보통) / 3(자세히)
  const [detailLevel, setDetailLevel] = useState(3);
  const [showDetail, setShowDetail] = useState(true);

  // ✅ 서버AI가 있으면 그걸 우선, 실패/없으면 기존 룰 기반 ai 사용
  const ai = useMemo(() => serverAi || decision?.ai || null, [serverAi, decision]);

  useEffect(() => {
    const aiInput = decision?.aiInput;
    if (!aiInput) return;

    let ignore = false;

    (async () => {
      try {
        setAiStatus("loading");
        setServerAi(null);

        // ✅ 룰 기반 근거(reasons/oneLineReason)를 같이 보내면 “왜?”가 훨씬 설득력 있게 길어짐
        const payload = {
          ...aiInput, // { decisionLevel, answers }
          title: decision?.title || "",
          oneLineReason: decision?.oneLineReason || "",
          reasons,
          detailLevel, // ✅ 길이 제어
        };

        const res = await apiPost("/ai/explain-decision", payload);
        if (ignore) return;

        if (res && typeof res.summary === "string") {
          setServerAi({
            summary: res.summary,
            detail: typeof res.detail === "string" ? res.detail : "",
            bullets: Array.isArray(res.bullets) ? res.bullets : [],
            ask: Array.isArray(res.ask) ? res.ask : [],
          });
          setAiStatus("ok");
        } else {
          setAiStatus("error");
        }
      } catch (e) {
        if (ignore) return;
        setAiStatus("error");
      }
    })();

    return () => {
      ignore = true;
    };
  }, [decision?.aiInput, detailLevel]); // ✅ 길이 바꾸면 다시 생성

  return (
    <section className="mdoc-card">
      <h2 className={`mdoc-h2 mdoc-resultTitle mdoc-resultTitle--${decision.level}`}>
        {decision.title}
      </h2>

      <div className="mdoc-oneLine">{decision.oneLineReason}</div>

      <ul className="mdoc-bullets">
        {reasons.map((r, idx) => (
          <li key={idx}>{r}</li>
        ))}
      </ul>

      {/* ✅ AI 설명 공간 */}
      {ai && (
        <div className="mdoc-list" style={{ marginTop: 14 }}>
          <div className="mdoc-listCard">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>왜 이렇게 나왔나요?</div>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>설명 길이</span>
                <button
                  className="mdoc-btn mdoc-btn-ghost"
                  style={{ padding: "6px 10px", fontSize: 12 }}
                  onClick={() => setDetailLevel(1)}
                  disabled={aiStatus === "loading"}
                >
                  간단
                </button>
                <button
                  className="mdoc-btn mdoc-btn-ghost"
                  style={{ padding: "6px 10px", fontSize: 12 }}
                  onClick={() => setDetailLevel(2)}
                  disabled={aiStatus === "loading"}
                >
                  보통
                </button>
                <button
                  className="mdoc-btn mdoc-btn-ghost"
                  style={{ padding: "6px 10px", fontSize: 12 }}
                  onClick={() => setDetailLevel(3)}
                  disabled={aiStatus === "loading"}
                >
                  자세히
                </button>
              </div>
            </div>

            {aiStatus === "loading" && (
              <div style={{ opacity: 0.75, marginBottom: 8 }}>AI 설명 생성 중...</div>
            )}
            {aiStatus === "error" && (
              <div style={{ opacity: 0.75, marginBottom: 8 }}>
                (AI 설명 생성 실패) 기본 안내로 표시 중
              </div>
            )}

            {/* 짧은 요약 */}
            <div style={{ whiteSpace: "pre-wrap" }}>{ai.summary}</div>

            {/* 긴 설명(detail) */}
            {ai.detail && (
              <div style={{ marginTop: 10 }}>
                <button
                  className="mdoc-btn mdoc-btn-ghost"
                  style={{ padding: "6px 10px", fontSize: 12 }}
                  onClick={() => setShowDetail((v) => !v)}
                >
                  {showDetail ? "설명 접기" : "자세한 설명 보기"}
                </button>

                {showDetail && (
                  <div style={{ whiteSpace: "pre-wrap", marginTop: 8, opacity: 0.95 }}>
                    {ai.detail}
                  </div>
                )}
              </div>
            )}

            {Array.isArray(ai.bullets) && ai.bullets.length > 0 && (
              <ul className="mdoc-bullets" style={{ marginTop: 10 }}>
                {ai.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}

            {Array.isArray(ai.ask) && ai.ask.length > 0 && (
              <>
                <div style={{ fontWeight: 900, marginTop: 12 }}>병원에 확인할 질문 3개</div>
                <ul className="mdoc-bullets" style={{ marginTop: 8 }}>
                  {ai.ask.slice(0, 3).map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mdoc-rowBetween" style={{ marginTop: 14 }}>
        <button className="mdoc-btn mdoc-btn-ghost" onClick={onBackToQuestions}>
          질문 다시 보기
        </button>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {showHospitalsButton && typeof onGoHospitals === "function" && (
            <button className="mdoc-btn mdoc-btn-ghost" onClick={onGoHospitals}>
              {hospitalsButtonLabel}
            </button>
          )}

          <button className="mdoc-btn mdoc-btn-primary" onClick={onGoChecklist}>
            3분 준비 체크리스트
          </button>
        </div>
      </div>
    </section>
  );
}
