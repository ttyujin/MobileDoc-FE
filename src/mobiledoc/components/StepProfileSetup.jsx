import React, { useMemo, useState } from "react";

const SIDO = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

const RELATIONS = ["가족", "보호자", "친구", "직장/학교", "기타"];

const makeId = () => `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export default function StepProfileSetup({ initialProfile, onBack, onSave }) {
  const [profile, setProfile] = useState({
    // 기존 필드
    sido: initialProfile?.sido ?? "",
    detailRegion: initialProfile?.detailRegion ?? "",
    meds: initialProfile?.meds ?? "",
    frequentHospital: initialProfile?.frequentHospital ?? "",
    conditions: initialProfile?.conditions ?? "",
    allergies: initialProfile?.allergies ?? "",
    pickupPreference: initialProfile?.pickupPreference ?? "pharmacy",
    patientType: initialProfile?.patientType ?? "self",
    emergencyContact: initialProfile?.emergencyContact ?? "",
    notes: initialProfile?.notes ?? "",

    // ✅ 신규: 병원 방문 기록
    visitHistory:
      initialProfile?.visitHistory?.length > 0
        ? initialProfile.visitHistory
        : [
            {
              id: makeId(),
              date: "",
              hospital: "",
              diagnosis: "",
            },
          ],

    // ✅ 신규: 주변 사람(연락처)
    contacts:
      initialProfile?.contacts?.length > 0
        ? initialProfile.contacts
        : [
            {
              id: makeId(),
              name: "",
              relation: "보호자",
              email: "",
              phone: "",
              memo: "",
            },
          ],
  });

  const [error, setError] = useState("");

const hasValidContact = useMemo(() => {
  const list = profile.contacts || [];
  return list.some((c) => {
    const nameOk = (c.name || "").trim().length > 0;
    const emailOk = (c.email || "").trim().length > 0;
    const phoneOk = (c.phone || "").trim().length > 0;
    return nameOk && (emailOk || phoneOk);
  });
}, [profile.contacts]);

const canSubmit = useMemo(() => {
  const sidoOk = profile.sido.trim().length > 0;
  return sidoOk && hasValidContact; // ✅ 지역 + 주변사람(필수) 조건
}, [profile.sido, hasValidContact]);


  const update = (key, value) => setProfile((p) => ({ ...p, [key]: value }));

  // ---------------------------
  // ✅ 병원 방문 기록(visitHistory) 핸들러
  // ---------------------------
  const addVisit = () => {
    setProfile((p) => ({
      ...p,
      visitHistory: [
        ...p.visitHistory,
        { id: makeId(), date: "", hospital: "", diagnosis: "" },
      ],
    }));
  };

  const removeVisit = (id) => {
    setProfile((p) => {
      const next = p.visitHistory.filter((v) => v.id !== id);
      return { ...p, visitHistory: next.length ? next : [{ id: makeId(), date: "", hospital: "", diagnosis: "" }] };
    });
  };

  const updateVisit = (id, key, value) => {
    setProfile((p) => ({
      ...p,
      visitHistory: p.visitHistory.map((v) => (v.id === id ? { ...v, [key]: value } : v)),
    }));
  };

  // ---------------------------
  // ✅ 주변 사람(contacts) 핸들러
  // ---------------------------
  const addContact = () => {
    setProfile((p) => ({
      ...p,
      contacts: [
        ...p.contacts,
        { id: makeId(), name: "", relation: "보호자", email: "", phone: "", memo: "" },
      ],
    }));
  };

  const removeContact = (id) => {
    setProfile((p) => {
      const next = p.contacts.filter((c) => c.id !== id);
      return { ...p, contacts: next.length ? next : [{ id: makeId(), name: "", relation: "보호자", email: "", phone: "", memo: "" }] };
    });
  };

  const updateContact = (id, key, value) => {
    setProfile((p) => ({
      ...p,
      contacts: p.contacts.map((c) => (c.id === id ? { ...c, [key]: value } : c)),
    }));
  };

  // 간단 이메일/전화 체크(막지는 않고, 저장 전에 정리만)
  const isEmailLike = (s) => !s || (s.includes("@") && s.includes("."));
  const isPhoneLike = (s) => !s || /^[0-9+\-()\s]{7,}$/.test(s);

  const submit = () => {
    setError("");

    if (profile.sido.trim().length === 0) {
  setError("지역(시/도)은 꼭 선택해주세요.");
  return;
}

if (!hasValidContact) {
  setError("주변 사람 연락처는 최소 1명 (이름 + 이메일/전화번호) 입력이 필요합니다.");
  return;
}


    // ✅ 저장할 때 “빈 줄” 정리 (사용자가 +만 눌러놓고 비워둔 행 제거)
    const cleanedVisits = (profile.visitHistory || []).filter((v) => {
      return (v.date || "").trim() || (v.hospital || "").trim() || (v.diagnosis || "").trim();
    });

    const cleanedContacts = (profile.contacts || []).filter((c) => {
      return (
        (c.name || "").trim() ||
        (c.email || "").trim() ||
        (c.phone || "").trim() ||
        (c.memo || "").trim()
      );
    });

    // ✅ 저장 시, 이메일/전화 형식이 너무 이상하면 경고(그래도 저장은 가능하게)
    const badEmail = cleanedContacts.find((c) => !isEmailLike((c.email || "").trim()));
    const badPhone = cleanedContacts.find((c) => !isPhoneLike((c.phone || "").trim()));

    if (badEmail) {
      setError("주변 사람 이메일 형식이 이상한 항목이 있습니다. (예: name@domain.com)");
      return;
    }
    if (badPhone) {
      setError("주변 사람 전화번호 형식이 이상한 항목이 있습니다. (숫자/하이픈 형태로 입력)");
      return;
    }

    onSave({
      ...profile,
      visitHistory: cleanedVisits,
      contacts: cleanedContacts,
      isComplete: true, // 너가 원하면 유지/삭제 상관없음
    });
  };

  return (
    <section className="mdoc-card">
      <h2 className="mdoc-h2">내 정보 입력</h2>
      <p className="mdoc-p">
        진료 준비를 더 매끄럽게 하기 위한 정보입니다.
      </p>

      <div className="mdoc-form">
        {/* 지역 */}
        <label className="mdoc-label">
          내 지역(시/도) <span className="mdoc-required">*</span>
          <select
            className="mdoc-select"
            value={profile.sido}
            onChange={(e) => update("sido", e.target.value)}
          >
            <option value="">선택</option>
            {SIDO.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="mdoc-label">
          상세 지역(구/동) (선택)
          <input
            className="mdoc-input"
            value={profile.detailRegion}
            onChange={(e) => update("detailRegion", e.target.value)}
            placeholder="예: 강남구 / 불당동"
          />
        </label>

        {/* 복용약 */}
        <label className="mdoc-label">
          평상시 복용 중인 약 (선택)
          <textarea
            className="mdoc-textarea"
            value={profile.meds}
            onChange={(e) => update("meds", e.target.value)}
            placeholder="예: 혈압약(OO정), 비타민D 등 / 없다면 '없음'"
          />
        </label>

        {/* 자주 가는 병원 */}
        <label className="mdoc-label">
          자주 가는 병원 (선택)
          <input
            className="mdoc-input"
            value={profile.frequentHospital}
            onChange={(e) => update("frequentHospital", e.target.value)}
            placeholder="예: OO내과의원"
          />
        </label>

        {/* 현재 질병/기저질환 */}
        <label className="mdoc-label">
          현재 앓고 있는 질병/기저질환 (선택)
          <textarea
            className="mdoc-textarea"
            value={profile.conditions}
            onChange={(e) => update("conditions", e.target.value)}
            placeholder="예: 천식, 당뇨, 알레르기비염 / 없다면 '없음'"
          />
        </label>

        <label className="mdoc-label">
          알레르기(약/음식) (선택)
          <input
            className="mdoc-input"
            value={profile.allergies}
            onChange={(e) => update("allergies", e.target.value)}
            placeholder="예: 페니실린 알레르기 / 땅콩 알레르기 / 없음"
          />
        </label>

        {/* 수령 방식 */}
        <div className="mdoc-section">
          <div className="mdoc-sectionTitle"><b>선호 약 수령 방식 (선택)</b></div>
          <div className="mdoc-segRow">
            <button
              type="button"
              className={`mdoc-btn mdoc-btn-seg ${profile.pickupPreference === "pharmacy" ? "isActive" : ""}`}
              onClick={() => update("pickupPreference", "pharmacy")}
            >
              약국 방문
            </button>
            <button
              type="button"
              className={`mdoc-btn mdoc-btn-seg ${profile.pickupPreference === "proxy" ? "isActive" : ""}`}
              onClick={() => update("pickupPreference", "proxy")}
            >
              대리 수령
            </button>
            <button
              type="button"
              className={`mdoc-btn mdoc-btn-seg ${profile.pickupPreference === "delivery" ? "isActive" : ""}`}
              onClick={() => update("pickupPreference", "delivery")}
            >
              배송 선호
            </button>
          </div>
          <div className="mdoc-hint1">* 대리수령은 보호자만 가능합니다.</div>
          <div className="mdoc-hint2">* 실제 가능 여부는 병원/약국/정책에 따라 달라질 수 있습니다.</div>
        </div>

        {/* -----------------------------
            ✅ 신규 1: 병원 방문 기록
           ----------------------------- */}
        <div className="mdoc-section">
          <div className="mdoc-sectionHeader">
            <div className="mdoc-sectionTitle"><b>최근 병원 방문 기록 (선택)</b></div>
            <button type="button" className="mdoc-btn mdoc-pillBtn mdoc-pillBlue" onClick={addVisit}>
            추가
            </button>



          </div>

          <div className="mdoc-list">
            {profile.visitHistory.map((v, idx) => (
              <div className="mdoc-listCard" key={v.id}>
                <div className="mdoc-listCardHeader">
                  <div className="mdoc-listCardTitle"><b>기록 {idx + 1}</b></div>
                 <button
                  type="button"
                  className="mdoc-btn mdoc-pillBtn mdoc-pillRed"
                  onClick={() => removeVisit(v.id)}
                >
                 삭제
                </button>

                </div>

                <div className="mdoc-grid2">
                  <label className="mdoc-label">
                    방문 날짜
                    <input
                      type="date"
                      className="mdoc-input"
                      value={v.date}
                      onChange={(e) => updateVisit(v.id, "date", e.target.value)}
                    />
                  </label>

                  <label className="mdoc-label">
                    병원명
                    <input
                      className="mdoc-input"
                      value={v.hospital}
                      onChange={(e) => updateVisit(v.id, "hospital", e.target.value)}
                      placeholder="예: OO내과의원"
                    />
                  </label>
                </div>

                <label className="mdoc-label">
                  병명/진단명
                  <input
                    className="mdoc-input"
                    value={v.diagnosis}
                    onChange={(e) => updateVisit(v.id, "diagnosis", e.target.value)}
                    placeholder="예: 급성 인두염, 위염, 알레르기비염 등"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* -----------------------------
            ✅ 신규 2: 주변 사람(연락처)
           ----------------------------- */}
        <div className="mdoc-section">
          <div className="mdoc-sectionHeader">
            <div className="mdoc-sectionTitle"><b>주변 사람 연락처 (필수)</b></div>
         <button type="button" className="mdoc-btn mdoc-pillBtn mdoc-pillBlue" onClick={addContact}>
          추가
        </button>


          </div>
        

          <div className="mdoc-list">
            {profile.contacts.map((c, idx) => (
              <div className="mdoc-listCard" key={c.id}>
                <div className="mdoc-listCardHeader">
                  <div className="mdoc-listCardTitle"><b>사람 {idx + 1}</b></div>
                  <button
                    type="button"
                    className="mdoc-btn mdoc-pillBtn mdoc-pillRed"
                    onClick={() => removeContact(c.id)}
                    >
                    삭제
                  </button>

                </div>

                <div className="mdoc-grid2">
                  <label className="mdoc-label">
                    이름
                    <input
                      className="mdoc-input"
                      value={c.name}
                      onChange={(e) => updateContact(c.id, "name", e.target.value)}
                      placeholder="예: 김영희"
                    />
                  </label>

                  <label className="mdoc-label">
                    관계
                    <select
                      className="mdoc-select"
                      value={c.relation}
                      onChange={(e) => updateContact(c.id, "relation", e.target.value)}
                    >
                      {RELATIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mdoc-grid2">
                  <label className="mdoc-label">
                    이메일
                    <input
                      className="mdoc-input"
                      value={c.email}
                      onChange={(e) => updateContact(c.id, "email", e.target.value)}
                      placeholder="name@domain.com"
                    />
                  </label>

                  <label className="mdoc-label">
                    전화번호
                    <input
                      className="mdoc-input"
                      value={c.phone}
                      onChange={(e) => updateContact(c.id, "phone", e.target.value)}
                      placeholder="010-1234-5678"
                    />
                  </label>
                </div>

                <label className="mdoc-label">
                  메모(선택)
                  <input
                    className="mdoc-input"
                    value={c.memo}
                    onChange={(e) => updateContact(c.id, "memo", e.target.value)}
                    placeholder="예: 야간 연락 가능, 직장 번호 등"
                  />
                </label>

                {/* 입력 중 실시간 가벼운 힌트 */}
                {c.email && !isEmailLike(c.email.trim()) && (
                  <div className="mdoc-inlineError">이메일 형식으로 입력해주세요. (예: name@domain.com)</div>
                )}
                {c.phone && !isPhoneLike(c.phone.trim()) && (
                  <div className="mdoc-inlineError">전화번호 형식으로 입력해주세요. (숫자/하이픈)</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 기타 */}
        <label className="mdoc-label">
          응급 연락처 (선택)
          <input
            className="mdoc-input"
            value={profile.emergencyContact}
            onChange={(e) => update("emergencyContact", e.target.value)}
            placeholder="예: 010-1234-5678"
          />
        </label>

        <label className="mdoc-label">
          추가 메모(의사에게 꼭 말할 것) (선택)
          <textarea
            className="mdoc-textarea"
            value={profile.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="예: 임신 가능성, 최근 검사 결과, 증상 특징 등"
          />
        </label>

        {error && <div className="mdoc-inlineError">{error}</div>}
      </div>

      <div className="mdoc-rowBetween" style={{ marginTop: 12 }}>
        <button type="button" className="mdoc-btn mdoc-btn-ghost" onClick={onBack}>
          뒤로
        </button>

        <button
          type="button"
          className="mdoc-btn mdoc-btn-primary"
          disabled={!canSubmit}
          onClick={submit}
        >
          저장하기
        </button>
      </div>
    </section>
  );
}
