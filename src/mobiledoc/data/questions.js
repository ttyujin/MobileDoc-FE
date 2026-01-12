// src/mobiledoc/data/questions.js

export const QUESTIONS = [
  // 1) 응급
  {
    id: "emergency",
    title: "응급 신호가 있나요?",
    desc: "예: 심한 호흡곤란, 의식 저하, 심한 흉통, 심한 출혈 등",
    type: "yesno",
  },

  // 2) 비대면(화상/전화) 가능 여부
  {
    id: "teleOk",
    title: "화상통화/전화 진료가 가능하신가요?",
    desc: "카메라(화상) 또는 전화(음성) 중 하나라도 가능하면 ‘예’를 눌러주세요.",
    type: "yesno",
  },

  // 2-1) 가능하면 어떤 방식?
  {
    id: "teleMode",
    title: "가능한 방식은 어떤가요?",
    desc: "병원에 따라 화상만 받는 곳도 있어요.",
    type: "choice",
    options: [
      { value: "video", label: "화상(카메라) 가능" },
      { value: "phone", label: "전화(음성)만 가능" },
      { value: "both", label: "둘 다 가능" },
    ],
    when: (a) => a.teleOk === "yes",
  },

  // 3) 목적
  {
    id: "purpose",
    title: "진료 목적이 뭐에 가까워요?",
    desc: "가장 가까운 1개만 골라주세요.",
    type: "choice",
    options: [
      { value: "refill", label: "재처방" },
      { value: "result", label: "검사/결과 상담" },
      { value: "newSymptom", label: "새 증상" }
    ],
  },

  // 4) 증상 카테고리
  {
    id: "symptom",
    title: "어떤 증상/진료과에 가까워요?",
    desc: "가장 가까운 1개만 선택해도 충분해요.",
    type: "choice",
    options: [
      { value: "cold", label: "감기/호흡기" },
      { value: "skin", label: "피부" },
      { value: "obgyn", label: "산부인과" },
      { value: "peds", label: "소아과" },
      { value: "gi", label: "소화기" },
      { value: "eye", label: "눈/안과" },
      { value: "mental", label: "정신과" },
    ],
  },

  // 5) 심각도/상태
  {
    id: "severity",
    title: "현재 상태는 어느 쪽인가요?",
    desc: "현재 상태를 기준으로 선택해요.",
    type: "choice",
    options: [
      { value: "dailyOk", label: "일상 생활 가능" },
      { value: "worsening", label: "악화 중" },
      { value: "worst", label: "일상생활 불가능" },
    ],
  },

  // 6) 재진 여부
  {
    id: "revisit",
    title: "이번 증상으로 최근에 진료받은 적이 있나요?",
    desc: "있으면 재진일 가능성이 높아요.",
    type: "yesno",
  },

  // 6-1) 같은 기관(병원) 여부 (재진=예일 때만)
  {
    id: "sameClinic",
    title: "같은 기관(같은 병원/의원)에서 다시 진료받는 건가요?",
    desc: "같은 기관 재진이면 비대면이 더 수월해질 수 있어요.",
    type: "yesno",
    when: (a) => a.revisit === "yes",
  },

  // 6-2) (원하면) 내 정보에서 병원 선택까지 (같은 기관=예일 때만)
  // StepQuestions가 'choice'만 지원하니까, 이건 options를 런타임으로 넣어주는 방식이 좋아.
{
  id: "clinicPick",
  title: "어느 기관(병원)인가요?",
  desc: "내 정보에 저장된 방문 기록에서 선택할 수 있어요.",
  type: "choice",
  options: [], // ✅ 여기 비워둠
  when: (a) => a.revisit === "yes" && a.sameClinic === "yes",
}
,

  // 7) 처방 필요
  {
    id: "needRx",
    title: "약 처방이 필요하신가요?",
    desc: "처방이 필요하면 조건이 붙을 수 있어요.",
    type: "yesno",
  },

  // 8) 약 수령 방식 기대
  {
    id: "rxDelivery",
    title: "약 수령 방식은 어떤 걸 기대하세요?",
    desc: "병원/플랫폼/약국 정책에 따라 가능 여부가 달라요.",
    type: "choice",
    options: [
      { value: "visit", label: "직접 방문" },
      { value: "proxy", label: "대리 수령" },
      { value: "delivery", label: "배송" },
      { value: "notSure", label: "잘 모르겠어요" },
    ],
    when: (a) => a.needRx === "yes",
  },
];
