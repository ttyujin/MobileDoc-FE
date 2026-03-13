// src/mobiledoc/components/StepTeleHospitals.jsx
import React, { useEffect, useMemo, useState } from "react";

const DEPTS = ["내과", "이비인후과", "피부과", "소아과", "산부인과", "정신건강의학과", "안과", "가정의학과"];

export default function StepTeleHospitals({
  hospitals = [],
  initialDept = "내과",
  lockedDept = null, // ✅ 있으면 이 과로 고정(다른 버튼 비활성)
  onBack,
  onOpenDetail,
}) {
  const [dept, setDept] = useState(lockedDept || initialDept);

  useEffect(() => {
    if (lockedDept) setDept(lockedDept);
  }, [lockedDept]);

  const teleHospitals = useMemo(() => {
    return (hospitals || [])
      .filter((h) => (h.supportsVideo || h.supportsPhone) && !h.isER)
      .filter((h) => (h.departments || []).includes(dept))
      .sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
  }, [hospitals, dept]);

  return (
    <section className="mdoc-card">
      <h2 className="mdoc-h2">비대면 진료 병원 추천</h2>
      <p className="mdoc-p">
        {lockedDept ? (
          <>
            1분 판별에서 선택한 진료과(<b>{dept}</b>) 기준으로 추천합니다.
          </>
        ) : (
          <>진료과를 선택하면 비대면(전화/화상) 가능한 병원을 보여줘요.</>
        )}
      </p>

      {/* 카테고리(진료과) */}
      <div className="mdoc-segRow" style={{ flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {DEPTS.map((d) => {
          const disabled = !!lockedDept && d !== dept;
          return (
            <button
              key={d}
              type="button"
              disabled={disabled}
              className={`mdoc-btn mdoc-btn-seg ${dept === d ? "isActive" : ""}`}
              onClick={() => setDept(d)}
              title={disabled ? "1분 판별에서 선택한 진료과로 고정되어 있어요." : ""}
              style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* 병원 리스트 */}
      <div className="mdoc-hospitalList" style={{ marginTop: 14 }}>
        {teleHospitals.length === 0 ? (
          <div className="mdoc-inlineError">선택한 진료과({dept})에 대해 비대면 가능한 병원이 아직 없어요.</div>
        ) : (
          teleHospitals.map((h) => (
            <div key={h.id} className="mdoc-hospitalItem">
              <div className="mdoc-rowBetween">
                <div className="mdoc-hospName">{h.name}</div>
                <div className={`mdoc-chip ${h.openNow ? "on" : "off"}`}>{h.openNow ? "진료중" : "영업종료"}</div>
              </div>

              <div className="mdoc-hospMeta">
                <span>거리 {h.distanceKm}km</span>
                <span>·</span>
                <span>화상 {h.supportsVideo ? "가능" : "미지원"}</span>
                <span>·</span>
                <span>전화 {h.supportsPhone ? "가능" : "미지원"}</span>
              </div>

              <div className="mdoc-hospNotes">
                <div style={{ fontWeight: 800, marginBottom: 6 }}>진료과: {(h.departments || []).join(", ")}</div>
                {h.notes}
              </div>

              {/* ✅ 버튼 크기 통일: 병원 카드 버튼 줄 전용 클래스 추가 */}
              <div className="mdoc-btnRow mdoc-hospBtnRow">
                <button className="mdoc-btn mdoc-btn-ghost" onClick={() => onOpenDetail(h)}>
                  상세 보기
                </button>
                <button className="mdoc-btn mdoc-btn-primary" onClick={() => alert("추후: 비대면 접수/예약 연결")}>
                  선택
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mdoc-rowBetween" style={{ marginTop: 12 }}>
        <button className="mdoc-btn mdoc-btn-ghost" onClick={onBack}>
          뒤로
        </button>
      </div>
    </section>
  );
}