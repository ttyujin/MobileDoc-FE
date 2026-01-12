//사용자가 입력한 문장에 위험 키워드가 있는지 찾아주는 함수
export function detectRiskSignals(text) {
  const keywords = ["설치", "인증", "즉시", "계좌", "환불불가", "링크", "권한", "원격", "결제"];
  return keywords.filter((k) => text.includes(k));
}
