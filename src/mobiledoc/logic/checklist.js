// src/mobiledoc/logic/checklist.js

export function buildChecklist(preset) {
  // ✅ 입력형 베이스(공통)
  const base = [
    {
      id: "c1_onset",
      type: "choice",
      label: "증상 시작 시점",
      required: true,
      value: "",
      options: [
        { value: "today", label: "당일" },
        { value: "3days", label: "3일 전" },
        { value: "1week", label: "일주일 전" },
      ],
    },
    {
      id: "c2_severity",
      type: "range",
      label: "증상 정도 (0~10)",
      min: 0,
      max: 10,
      step: 1,
      value: 0,
    },
    {
      id: "c3_factors",
      type: "text",
      label: "악화/완화 요인",
      placeholder: "예: 찬 공기면 심해짐 / 누우면 악화 / 따뜻한 물 마시면 완화",
      value: "",
    },
  ];

  // ✅ 공통 카메라 액션 블록(재사용)
  const cameraItem = {
    id: "cam_test",
    type: "action",
    label: "카메라/마이크 테스트(조용한 장소)",
    action: "camera",
    buttonText: "📹",
    hint: "버튼을 누르면 카메라/마이크 테스트가 열립니다.",
  };

  // ✅ 응급
  if (preset === "emergency") {
    return [
      {
        id: "e1_call119",
        type: "action",
        label: "지금 즉시 119/응급실 등 대면 도움을 고려",
        action: "call119",
        buttonText: "119 전화",
        hint: "통화 버튼을 누르면 전화 앱이 열립니다.",
      },
      {
        id: "e2_share",
        type: "share",
        label: "가능하면 현재 상태를 주변 사람에게 공유",
        value: { contactId: "" },
        hint: "내 정보에 입력한 주변 사람에게 문자/메일로 공유할 수 있어요.",
      },
      {
        id: "e3_note",
        type: "text",
        label: "복용 약/알레르기 정보를 메모",
        placeholder: "예: 혈압약 OO정 / 페니실린 알레르기",
        value: "",
      },
    ];
  }

  // ✅ 조건부(카메라 환경 준비)
  if (preset === "conditional_novideo") {
    return [
      ...base,
      {
        id: "x1_camera",
        type: "action",
        label: "가능하면 화상 가능한 환경(카메라/조명) 준비",
        action: "camera",
        buttonText: "📹",
        hint: "버튼을 누르면 카메라/마이크 테스트가 열립니다.",
      },
      { id: "x2", type: "check", text: "처방이 필요하면 '이전 진료 기록'이 있는지 확인", checked: false },
      { id: "x3", type: "check", text: "진료 중 끊기면 대면 전환 가능 시간 확보", checked: false },
    ];
  }

  // ✅ 조건부(화상 테스트)
  if (preset === "conditional_video") {
    return [
      ...base,
      {
        id: "v1_camera",
        type: "action",
        label: "카메라/마이크 테스트(조용한 장소)",
        action: "camera",
        buttonText: "📹",
        hint: "버튼을 누르면 카메라/마이크 테스트가 열립니다.",
      },
      { id: "v2", type: "check", text: "증상이 보이면(피부/목) 촬영 가능한 조명 준비", checked: false },
      { id: "v3", type: "check", text: "처방이 필요하면 수령 방식(약국/대리/배송 가능 여부) 확인", checked: false },
    ];
  }

  // ✅ NEW: ok + 화상 가능이면 카메라도 보여주기
  if (preset === "ok_video") {
    return [
      ...base,
      cameraItem,
      { id: "o1", type: "check", text: "이전 진료/검사 결과 전달", checked: false },
      { id: "o2", type: "check", text: "재진이라면 이전 처방약 이름/용량 전달", checked: false },
    ];
  }

  // ✅ 기본(가능)
  return [
    ...base,
    { id: "o1", type: "check", text: "이전 진료/검사 결과 전달", checked: false },
    { id: "o2", type: "check", text: "재진이라면 이전 처방약 이름/용량 전달", checked: false },
  ];
}
