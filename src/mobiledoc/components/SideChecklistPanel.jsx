import React, { useMemo } from "react";

function isFilled(item) {
  if (!item) return false;
  if (item.type === "check") return !!item.checked;

  // 자주 쓰는 필드 우선
  const keys = ["value", "text", "memo", "note", "when", "time", "score", "level", "severity"];
  for (const k of keys) {
    const v = item[k];
    if (v == null) continue;
    if (typeof v === "string" && v.trim() !== "") return true;
    if (typeof v === "number" && !Number.isNaN(v)) return true;
  }

  // fallback: 의미있는 값 하나라도 있으면 채움으로 판단
  for (const [k, v] of Object.entries(item)) {
    if (["id", "type", "label", "hint", "placeholder", "options"].includes(k)) continue;
    if (typeof v === "string" && v.trim() !== "") return true;
    if (typeof v === "number" && !Number.isNaN(v)) return true;
    if (typeof v === "boolean" && v) return true;
  }
  return false;
}

export default function SideChecklistPanel({
  step,
  checklist,
  riskSignalsCount,
  onReset,
}) {
  const stats = useMemo(() => {
    const list = Array.isArray(checklist) ? checklist : [];
    const checkItems = list.filter((it) => it.type === "check");
    const checked = checkItems.filter((it) => !!it.checked).length;

    const inputItems = list.filter((it) => it.type !== "check");
    const filled = inputItems.filter((it) => isFilled(it)).length;

    return { checked, totalChecks: checkItems.length, filled, totalInputs: inputItems.length };
  }, [checklist]);

  // 완료 기준(안전하게 “화면을 지나갔는지” 기준 + 요약 숫자 표시)
  const triageDone = step >= 2;
  const prepDone = step >= 4;    // 체크리스트 다음(안전)까지 갔으면 일단 완료로
  const safetyDone = step >= 5;  // 병원추천까지 갔으면 안전도 완료로

  const rows = [
    {
      key: "triage",
      label: "1분 판별",
      sub: triageDone ? "결과 확인 완료" : "질문 진행 전/중",
      done: triageDone,
      badge: triageDone ? "완료" : "대기",
    },
    {
      key: "prep",
      label: "3분 준비",
      sub: `체크 ${stats.checked}/${stats.totalChecks} · 입력 ${stats.filled}/${stats.totalInputs}`,
      done: prepDone,
      badge: prepDone ? "완료" : "진행중",
    },
    {
      key: "safety",
      label: "안전 이용",
      sub: `위험 신호 ${riskSignalsCount}개 감지`,
      done: safetyDone,
      badge: safetyDone ? "완료" : "확인 전",
    },
  ];

  return (
    <div className="mdoc-sideCard">
      <div className="mdoc-sideHead">CheckList</div>

      <div className="mdoc-sideBody">
        {rows.map((r) => (
          <div className="mdoc-miniRow" key={r.key}>
            <div className={`mdoc-dot ${r.done ? "mdoc-dot--on" : ""}`} />
            <div>
              <div style={{ fontWeight: 900 }}>{r.label}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{r.sub}</div>
            </div>
            <div className="mdoc-badge">{r.badge}</div>
          </div>
        ))}

        <div style={{ marginTop: 14, fontSize: 12, color: "#666", lineHeight: 1.5 }}>
          * 여기서는 “지금 어디까지 했는지”를 한눈에 볼 수 있습니다. <br />
          * 다음 단계로는 “체크한 항목 목록 펼치기”도 바로 넣을 수 있어.
        </div>
      </div>

      <div className="mdoc-sideFoot">
        <button className="mdoc-chatBtn" onClick={onReset} style={{ width: "100%" }}>
          진행 초기화
        </button>
      </div>
    </div>
  );
}
