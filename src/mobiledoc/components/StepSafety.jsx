//위험 신호 탐지/경고 카드 화면
import React from "react";

export default function StepSafety({ riskInput, setRiskInput, riskSignals, onBack, onNext }) {
  return (
    <section className="mdoc-card">
      <h2 className="mdoc-h2">안전 이용(위험 신호)</h2>
      <p className="mdoc-p">아래 입력칸에 앱/문구에서 본 단어를 적어보세요.</p>

      <div className="mdoc-inputWrap">
        <input
          className="mdoc-input"
          value={riskInput}
          onChange={(e) => setRiskInput(e.target.value)}
          placeholder='예: "설치", "계좌", "환불불가"'
        />
      </div>

      {riskSignals.length > 0 ? (
        <div className="mdoc-alertCard">
          <div className="mdoc-alertTitle">⚠️ 주의가 필요해요</div>
          <div className="mdoc-alertText">
            감지된 단어: <b>{riskSignals.join(", ")}</b>
          </div>
          <ul className="mdoc-bullets">
            <li>진료와 무관한 과도한 설치/결제 유도는 조심해요.</li>
            <li>개인정보는 꼭 필요한 것만 제공하는 게 좋아요.</li>
          </ul>
        </div>
      ) : (
        <div className="mdoc-safeCard">
          <div className="mdoc-safeTitle">✅ 현재는 뚜렷한 위험 신호가 없어요</div>
          <div className="mdoc-safeText">그래도 개인정보/결제는 꼭 필요한 범위만!</div>
        </div>
      )}

      <div className="mdoc-rowBetween">
        <button className="mdoc-btn mdoc-btn-ghost" onClick={onBack}>
          체크리스트로
        </button>
        <button className="mdoc-btn mdoc-btn-primary" onClick={onNext}>
          주변 병원 추천(데모)
        </button>
      </div>
    </section>
  );
}
