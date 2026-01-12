// src/mobiledoc/components/StepIntro.jsx
import React from "react";

export default function StepIntro({ onStart }) {
  return (
    <section className="mdoc-card mdoc-introCard mdoc-introFull">
      <div className="mdoc-introBody">
        <h1 className="mdoc-h1">1분 판별 → 3분 준비 → 안전 이용 → 병원추천</h1>
        <p className="mdoc-p">
          <b>제도/절차 관점</b>에서 비대면진료가 “막힐 확률”을 줄여주는 <b>길잡이</b> 프로그램입니다.
        </p>

        <div className="mdoc-grid2">
          <div className="mdoc-miniCard">
            <div className="mdoc-miniTitle">✅ 1분 판별</div>
            <div className="mdoc-miniText">질문 몇 개로 가능/조건부/대면 권장</div>
          </div>
          <div className="mdoc-miniCard">
            <div className="mdoc-miniTitle">🧾 3분 준비</div>
            <div className="mdoc-miniText">증상 정리 + 꼭 말할 정보 체크</div>
          </div>
          <div className="mdoc-miniCard">
            <div className="mdoc-miniTitle">🛡️ 안전 이용</div>
            <div className="mdoc-miniText">과한 권한/결제 유도 위험 신호 경고</div>
          </div>
          <div className="mdoc-miniCard">
            <div className="mdoc-miniTitle">🏣 주변 병원</div>
            <div className="mdoc-miniText">일단은 ‘추천 리스트’ 데모(추후 지도/API)</div>
          </div>
        </div>
      </div>

      <div className="mdoc-introActions">
        <button className="mdoc-btn mdoc-btn-primary mdoc-btn-big" onClick={onStart}>
          시작하기
        </button>
        <div className="mdoc-footnote">
          * 응급 상황이 의심되면 비대면보다 119/응급실 등 즉시 대면 도움을 우선 고려하세요.
        </div>
      </div>
    </section>
  );
}
