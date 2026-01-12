// src/mobiledoc/components/StepHospitals.jsx
import React, { useMemo } from "react";

export default function StepHospitals({ hospitals, onBack, onRestart, selectedDept = null }) {
  const list = useMemo(() => {
    const base = hospitals || [];
    if (!selectedDept) return base;
    return base.filter((h) => (h.departments || []).includes(selectedDept));
  }, [hospitals, selectedDept]);

  return (
    <section className="mdoc-card">
      <h2 className="mdoc-h2">주변 병원 추천 (대면)</h2>
      <p className="mdoc-p">
        {selectedDept ? (
          <>
            선택한 진료과(<b>{selectedDept}</b>) 기준으로 가까운 병원을 보여줘요.
          </>
        ) : (
          <>지금은 임시 리스트예요. 다음 단계에서 지도/API로 교체하면 돼요.</>
        )}
      </p>

      <div className="mdoc-hospitalList">
        {list.length === 0 ? (
          <div className="mdoc-inlineError">
            {selectedDept ? `선택한 진료과(${selectedDept}) 병원이 아직 없어요.` : "병원 데이터가 없어요."}
          </div>
        ) : (
          list.map((h) => (
            <div key={h.id} className="mdoc-hospitalItem">
              <div className="mdoc-rowBetween">
                <div className="mdoc-hospName">{h.name}</div>
                <div className={`mdoc-chip ${h.openNow ? "on" : "off"}`}>
                  {h.openNow ? "진료중" : "영업종료"}
                </div>
              </div>

              <div className="mdoc-hospMeta">
                <span>거리 {h.distanceKm}km</span>
                <span>·</span>
                <span>진료과 {(h.departments || []).join(", ") || "정보 없음"}</span>
              </div>

              <div className="mdoc-hospNotes">{h.notes}</div>

              <div className="mdoc-btnRow">
                <button className="mdoc-btn mdoc-btn-ghost" onClick={() => alert("추후: 상세/지도 연동")}>
                  상세 보기
                </button>
                <button className="mdoc-btn mdoc-btn-primary" onClick={() => alert("추후: 예약/연결 플로우")}>
                  선택
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mdoc-rowBetween">
        <button className="mdoc-btn mdoc-btn-ghost" onClick={onBack}>
          뒤로
        </button>
        <button className="mdoc-btn mdoc-btn-primary" onClick={onRestart}>
          다시 시작
        </button>
      </div>
    </section>
  );
}
