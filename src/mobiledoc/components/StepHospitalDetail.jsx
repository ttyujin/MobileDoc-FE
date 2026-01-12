// src/mobiledoc/components/StepHospitalDetail.jsx
import React from "react";

export default function StepHospitalDetail({ hospital, onBack }) {
  if (!hospital) {
    return (
      <section className="mdoc-card">
        <h2 className="mdoc-h2">병원 상세</h2>
        <div className="mdoc-inlineError">선택된 병원이 없습니다.</div>
        <div className="mdoc-rowBetween" style={{ marginTop: 12 }}>
          <button className="mdoc-btn mdoc-btn-ghost" onClick={onBack}>
            뒤로
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mdoc-card">
      <h2 className="mdoc-h2">병원 상세</h2>

      <div style={{ fontWeight: 900, fontSize: 18, marginTop: 8 }}>{hospital.name}</div>

      <div className="mdoc-hint" style={{ marginTop: 10 }}>
        진료과: {(hospital.departments || []).length ? hospital.departments.join(", ") : "정보 없음"}
      </div>

      <div className="mdoc-list" style={{ marginTop: 12 }}>
        <div className="mdoc-listCard">
          <div style={{ fontWeight: 800, marginBottom: 6 }}>전화번호</div>
          {hospital.phone ? (
            <a href={`tel:${hospital.phone}`} className="mdoc-btn mdoc-btn-ghost">
              {hospital.phone} (전화 걸기)
            </a>
          ) : (
            <div className="mdoc-hint">정보 없음</div>
          )}
        </div>

        <div className="mdoc-listCard">
          <div style={{ fontWeight: 800, marginBottom: 6 }}>위치</div>
          <div>{hospital.address || "정보 없음"}</div>
        </div>

        <div className="mdoc-listCard">
          <div style={{ fontWeight: 800, marginBottom: 6 }}>진료시간</div>
          <div>{hospital.hours || "정보 없음"}</div>
        </div>

        <div className="mdoc-listCard">
          <div style={{ fontWeight: 800, marginBottom: 6 }}>비대면 지원</div>
          <div>화상: {hospital.supportsVideo ? "가능" : "미지원"}</div>
          <div>전화: {hospital.supportsPhone ? "가능" : "미지원"}</div>
        </div>
      </div>

      <div className="mdoc-rowBetween" style={{ marginTop: 12 }}>
        <button className="mdoc-btn mdoc-btn-ghost" onClick={onBack}>
          뒤로
        </button>
      </div>
    </section>
  );
}
