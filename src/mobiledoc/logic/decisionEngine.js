// src/mobiledoc/logic/decisionEngine.js

const symptomToDept = (symptom) => {
  switch (symptom) {
    case "cold":
      return "이비인후과";
    case "skin":
      return "피부과";
    case "obgyn":
      return "산부인과";
    case "peds":
      return "소아과";
    case "gi":
      return "내과";
    case "eye":
      return "안과";
    case "mental":
      return "정신건강의학과";
    default:
      return null;
  }
};

const teleModeHasVideo = (teleMode) => teleMode === "video" || teleMode === "both";

// ✅ StepResult가 서버에 보낼 LLM 입력(민감정보 없음)
const buildAiInput = (answers, decisionLevel, dept) => ({
  decisionLevel,
  answers: {
    emergency: answers.emergency,
    teleOk: answers.teleOk,
    teleMode: answers.teleMode,
    purpose: answers.purpose,
    symptom: answers.symptom,
    severity: answers.severity,
    revisit: answers.revisit,
    sameClinic: answers.sameClinic,
    clinicPick: answers.clinicPick,
    needRx: answers.needRx,
    rxDelivery: answers.rxDelivery,
    dept: dept || null,
  },
});

export function computeDecision(answers) {
  const emergency = answers.emergency === "yes";
  const teleOk = answers.teleOk === "yes";
  const teleMode = answers.teleMode; // video / phone / both
  const hasVideo = teleModeHasVideo(teleMode);

  const purpose = answers.purpose; // refill / result / newSymptom
  const symptom = answers.symptom; // cold/skin/obgyn/peds/gi/eye/mental
  const severity = answers.severity; // dailyOk / worsening / worst

  const revisit = answers.revisit === "yes";
  const sameClinic = answers.sameClinic === "yes";

  const needRx = answers.needRx === "yes";
  const rxDelivery = answers.rxDelivery; // visit/proxy/delivery/notSure

  const dept = symptomToDept(symptom);

  // =========================
  // 0) 응급이면 끝 (대면/응급 권장)
  // =========================
  if (emergency) {
    const decisionLevel = "inperson";
    return {
      level: decisionLevel,
      title: "대면(또는 응급) 권장",
      oneLineReason: "응급 신호가 있으면 비대면보다 즉시 대면 진료가 안전해요.",
      reasons: [
        "응급 증상은 빠른 처치가 중요해요.",
        "비대면은 검사/처치가 제한될 수 있어요.",
      ],
      checklistPreset: "emergency",
      ai: {
        summary: "응급 신호가 체크되어 비대면 시도가 위험할 수 있어요.",
        bullets: [
          "지금은 ‘가능/조건부’ 판단보다 안전이 우선이에요.",
          "이동/119/응급실 같은 즉시 행동이 필요할 수 있어요.",
        ],
        ask: [
          "증상이 갑자기 심해졌나요? (호흡/의식/흉통/출혈)",
          "현재 혼자 계신가요? 도움을 요청할 사람이 있나요?",
          "이동이 어렵다면 119 연결이 가능한가요?",
        ],
      },
      aiInput: buildAiInput(answers, decisionLevel, dept),
    };
  }

  // =========================
  // 1) 비대면 자체가 불가하면 대면 권장
  // =========================
  if (!teleOk) {
    const decisionLevel = "inperson";
    return {
      level: decisionLevel,
      title: "대면 권장",
      oneLineReason: "비대면(화상/전화) 진료가 어려우면 대면 진료로 가는 게 확실해요.",
      reasons: [
        "비대면은 최소 전화/화상 중 하나가 필요해요.",
        "대면이면 검사/처치 범위가 넓어요.",
      ],
      checklistPreset: "ok",
      ai: {
        summary: "비대면 방식 이용이 어려워 대면 쪽으로 가는 게 안정적이에요.",
        bullets: [
          "전화/화상이 불가하면 비대면 접수 단계에서 막힐 확률이 높아요.",
          "대면이면 진료 진행이 끊기지 않아요.",
        ],
        ask: [
          "지금 방문 가능한 가까운 병원이 있나요?",
          "진료 가능 시간(야간/주말) 확인이 되나요?",
          "필요한 검사(피부/안과/소아 등)가 있는지 물어보세요.",
        ],
      },
      aiInput: buildAiInput(answers, decisionLevel, dept),
    };
  }

  // =========================
  // 2) 심각도 기반(너무 심하면 대면 권장)
  // =========================
  if (severity === "worst") {
    const decisionLevel = "inperson";
    return {
      level: decisionLevel,
      title: "대면 권장",
      oneLineReason: "일상생활이 불가능할 정도면 대면 진료가 더 안전할 수 있어요.",
      reasons: [
        "상태가 심하면 검사/처치가 필요할 가능성이 커요.",
        "비대면은 관찰/검사가 제한될 수 있어요.",
      ],
      checklistPreset: hasVideo ? "conditional_video" : "conditional_novideo",
      ai: {
        summary: "증상이 심한 상태로 체크되어 대면으로 바로 가는 게 안전할 수 있어요.",
        bullets: [
          "비대면으로 시작했다가 대면으로 다시 가면 시간 손해가 커요.",
          "특히 눈/피부/소아 등은 직접 확인이 필요한 경우가 있어요.",
        ],
        ask: [
          "지금 상태에서 이동이 가능한가요?",
          "증상이 언제부터/어떻게 악화됐나요?",
          "고열/통증/시야 이상 등 추가 증상이 있나요?",
        ],
      },
      aiInput: buildAiInput(answers, decisionLevel, dept),
    };
  }

  // =========================
  // 3) “가능(ok)” 케이스
  // =========================
  const okBecauseSameClinic = revisit && sameClinic;
  const okBecausePurpose = revisit && (purpose === "refill" || purpose === "result");

  if (okBecauseSameClinic || okBecausePurpose) {
    const decisionLevel = "ok";
    const preset = hasVideo ? "ok_video" : "ok";
    return {
      level: decisionLevel,
      title: "가능 (성공 확률 높음)",
      oneLineReason: "재진 가능성이 높고 비응급이면 비대면 진행이 비교적 수월해요.",
      reasons: [
        okBecauseSameClinic
          ? "같은 기관 재진이면 이전 기록이 있어 진행이 더 매끄러울 수 있어요."
          : "재진 + 재처방/결과상담은 비교적 비대면에서 잘 진행되는 편이에요.",
        needRx
          ? "처방이 필요해도 재진이면 승인될 가능성이 높아요."
          : "처방이 꼭 필요하지 않으면 더 수월해요.",
        hasVideo ? "화상 가능하면 성공 확률이 더 올라가요." : "전화만 가능하면 병원 정책에 따라 제한될 수 있어요.",
      ],
      checklistPreset: preset,
      ai: {
        summary: "재진 조건이 있어 비대면 진행이 ‘막힐 확률’이 낮아요.",
        bullets: [
          "재진은 과거 기록이 있어 상담/처방 판단이 쉬운 편이에요.",
          needRx ? "처방이 필요한 경우라도 재진이면 승인 가능성이 올라가요." : "처방이 없으면 절차가 더 단순해요.",
        ],
        ask: [
          "오늘 비대면 진료 접수가 가능한가요?",
          needRx ? "원하는 약이 비대면 처방 가능한가요?" : "처방 없이 상담만 진행 가능한가요?",
          hasVideo ? "화상 연결이 필요한가요?" : "전화만으로도 가능한가요?",
        ],
      },
      aiInput: buildAiInput(answers, decisionLevel, dept),
    };
  }

  // =========================
  // 4) 나머지는 “조건부 가능”
  // =========================
  const decisionLevel = "conditional";
  const conditionalReasons = [];

  if (severity === "worsening") {
    conditionalReasons.push("악화 중이면 비대면으로 시작했다가 대면으로 전환될 수 있어요.");
  }
  if (purpose === "newSymptom") {
    conditionalReasons.push("새 증상은 병원/정책에 따라 초진 제한이 걸릴 수 있어요.");
  }
  if (needRx) {
    conditionalReasons.push("처방은 약 종류/정책에 따라 제한이 붙을 수 있어요.");
    if (rxDelivery === "delivery") conditionalReasons.push("배송은 병원/약국/플랫폼 정책 영향이 커요.");
    if (rxDelivery === "proxy") conditionalReasons.push("대리 수령은 조건(보호자 등)이 붙을 수 있어요.");
  }
  if (symptom === "mental") {
    conditionalReasons.push("정신건강의학과는 병원 정책에 따라 비대면 제한이 있을 수 있어요.");
  }
  if (dept) conditionalReasons.push(`선택한 진료과: ${dept}`);

  return {
    level: decisionLevel,
    title: "조건부 가능",
    oneLineReason: "진행은 가능하지만 병원 판단/정책에 따라 중간에 막힐 수 있어요.",
    reasons: [
      ...conditionalReasons,
      hasVideo ? "화상 가능하면 성공 확률이 올라가요." : "전화만 가능하면 진행이 막힐 수 있어요.",
    ].filter(Boolean),
    checklistPreset: hasVideo ? "conditional_video" : "conditional_novideo",
    ai: {
      summary: "될 수는 있는데 ‘막힐 지점’이 있는 케이스예요.",
      bullets: [
        "초진/새 증상/처방은 병원 정책 차이가 커요.",
        hasVideo ? "화상 가능이면 통과 확률이 올라가요." : "전화만이면 제한이 생길 수 있어요.",
      ],
      ask: [
        "오늘 비대면 진료가 가능한가요?",
        needRx ? "처방/수령(배송/대리) 조건이 가능한가요?" : "상담만 진행 가능한가요?",
        hasVideo ? "화상 연결이 필수인가요?" : "전화만으로도 가능한가요?",
      ],
    },
    aiInput: buildAiInput(answers, decisionLevel, dept),
  };
}
