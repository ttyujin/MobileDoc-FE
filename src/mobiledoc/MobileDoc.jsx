// src/mobiledoc/MobileDoc.jsx
import React, { useEffect, useMemo, useState } from "react";

import "./styles/base.css";
import "./styles/layout.css";
import "./styles/ui.css";
import "./styles/steps.css";

import { QUESTIONS } from "./data/questions";
import { MOCK_HOSPITALS } from "./data/mockHospitals";

import { computeDecision } from "./logic/decisionEngine";
import { buildChecklist } from "./logic/checklist";
import { detectRiskSignals } from "./utils/riskSignals";

import Header from "./components/Header";
import StepIntro from "./components/StepIntro";
import StepQuestions from "./components/StepQuestions";
import StepResult from "./components/StepResult";
import StepChecklist from "./components/StepChecklist";
import StepSafety from "./components/StepSafety";
import StepHospitals from "./components/StepHospitals";

import StepLogin from "./components/StepLogin";
import StepSignup from "./components/StepSignup";
import StepProfileSetup from "./components/StepProfileSetup";

import StepFindAccount from "./components/StepFindAccount";
import StepResetRequest from "./components/StepResetRequest";
import StepResetPassword from "./components/StepResetPassword";

import SideChecklistPanel from "./components/SideChecklistPanel";
import ChatbotPanel from "./components/ChatbotPanel";

import StepTeleHospitals from "./components/StepTeleHospitals";
import StepHospitalDetail from "./components/StepHospitalDetail";

import { apiGet, apiPut } from "./api";

/* =========================
   helpers
   ========================= */

// profile.visitHistory에서 병원명 -> options
function getClinicOptionsFromProfile(profile) {
  const visits = profile?.visitHistory || [];
  const names = visits.map((v) => (v?.hospital || "").trim()).filter(Boolean);
  const unique = Array.from(new Set(names));
  return unique.map((name) => ({ value: name, label: name }));
}

// when 조건 반영해서 실제로 보여줄 질문만
function getActiveQuestions(questions, answers) {
  return (questions || []).filter((q) => {
    if (typeof q.when === "function") return !!q.when(answers);
    return true;
  });
}

// QUESTIONS 기반 answers 초기값
function makeInitialAnswers(questions) {
  const obj = {};
  (questions || []).forEach((q) => {
    obj[q.id] = "";
  });
  return obj;
}

// symptom value -> dept label
function symptomToDept(symptom) {
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
}

export default function MobileDoc() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [profile, setProfile] = useState(null);

  const [prevStepBeforeProfile, setPrevStepBeforeProfile] = useState(0);

  const [step, setStep] = useState(0);
  const [qIndex, setQIndex] = useState(0);

  const [resetEmailDraft, setResetEmailDraft] = useState("");

  const initialAnswers = useMemo(() => makeInitialAnswers(QUESTIONS), []);
  const [answers, setAnswers] = useState(initialAnswers);

  const decision = useMemo(() => computeDecision(answers), [answers]);

  const [checklist, setChecklist] = useState(() => buildChecklist("conditional_video"));

  const [riskInput, setRiskInput] = useState("");
  const riskSignals = useMemo(() => detectRiskSignals(riskInput), [riskInput]);

  // 병원 상세 상태
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitalBackStep, setHospitalBackStep] = useState(4);

  // profile에서 clinicPick options 만들기
  const clinicOptions = useMemo(() => getClinicOptionsFromProfile(profile), [profile]);

  // clinicPick 질문이면 options 주입
  const questionsWithProfile = useMemo(() => {
    return QUESTIONS.map((q) => {
      if (q.id !== "clinicPick") return q;
      return { ...q, options: clinicOptions };
    });
  }, [clinicOptions]);

  // when 조건 반영한 실제 질문 목록
  const activeQuestions = useMemo(() => {
    return getActiveQuestions(questionsWithProfile, answers);
  }, [questionsWithProfile, answers]);

  // 질문 수가 줄어들 때 qIndex 보정
  useEffect(() => {
    const max = Math.max(0, activeQuestions.length - 1);
    setQIndex((prev) => Math.min(prev, max));
  }, [activeQuestions.length]);

  const currentQ = activeQuestions[qIndex];

  const progress = useMemo(() => {
    const total = activeQuestions.length || 1;
    return Math.round(((qIndex + 1) / total) * 100);
  }, [qIndex, activeQuestions.length]);

  const canGoNextQuestion = useMemo(() => {
    if (!currentQ) return false;
    const val = answers[currentQ.id];

    if (currentQ.type === "yesno") return val === "yes" || val === "no";
    if (currentQ.type === "choice") return val !== "" && val != null;
    return val !== "" && val != null;
  }, [answers, currentQ]);

  // ✅ symptom 기반으로 진료과(한글) 뽑기
  const selectedDept = useMemo(() => symptomToDept(answers.symptom), [answers.symptom]);

  const start = () => {
    if (!isLoggedIn) {
      setStep(99);
      return;
    }
    setStep(1);
    setQIndex(0);
    setAnswers(makeInitialAnswers(QUESTIONS));
    setSelectedHospital(null);
    setHospitalBackStep(4);
  };

  const prevQuestion = () => {
    if (qIndex > 0) setQIndex((i) => i - 1);
    else setStep(0);
  };

  const nextQuestion = () => {
    if (!canGoNextQuestion) return;

    // ✅ 1번 질문(emergency)에서 yes면 즉시 결과로
    if (currentQ?.id === "emergency" && answers.emergency === "yes") {
      const d = computeDecision({ ...answers, emergency: "yes" });
      setChecklist(buildChecklist(d.checklistPreset));
      setStep(2);
      return;
    }

    if (qIndex < activeQuestions.length - 1) {
      setQIndex((i) => i + 1);
    } else {
      const d = computeDecision(answers);
      setChecklist(buildChecklist(d.checklistPreset));
      setStep(2);
    }
  };

  const resetAll = () => {
    setStep(0);
    setQIndex(0);
    setAnswers(makeInitialAnswers(QUESTIONS));
    setChecklist(buildChecklist("conditional_video"));
    setRiskInput("");
    setSelectedHospital(null);
    setHospitalBackStep(4);
  };

  const toggleChecklist = (id) => {
    setChecklist((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (it.type !== "check") return it;
        return { ...it, checked: !it.checked };
      })
    );
  };

  const updateChecklistItem = (id, patch) => {
    setChecklist((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  // 병원 데이터(응급실 제외)
  const baseHospitals = useMemo(() => {
    return [...MOCK_HOSPITALS]
      .filter((h) => !h.isER)
      .sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
  }, []);

  // 대면 병원 리스트(현재는 baseHospitals 그대로)
  const nearbyHospitals = useMemo(() => {
    return [...baseHospitals];
  }, [baseHospitals]);

  const contacts = useMemo(() => profile?.contacts || [], [profile]);

  // 응급 화면에서 자동 메모 프리필(StepChecklist로 전달)
  const emergencyPrefillNote = useMemo(() => {
    if (!profile) return "";
    const meds = (profile.meds || "").trim();
    const allergies = (profile.allergies || "").trim();
    const conditions = (profile.conditions || "").trim();

    const parts = [];
    if (meds) parts.push(`복용약: ${meds}`);
    if (allergies) parts.push(`알레르기: ${allergies}`);
    if (conditions) parts.push(`기저질환: ${conditions}`);
    return parts.join("\n");
  }, [profile]);

  // ✅ (추가) 메일 요약에 같이 넣을 프로필 요약 1줄
  const profileSummary = useMemo(() => {
    if (!profile) return "";

    const parts = [];

    const region = `${(profile.sido || "").trim()} ${(profile.detailRegion || "").trim()}`.trim();
    if (region) parts.push(`지역: ${region}`);

    if ((profile.patientType || "").trim()) parts.push(`대상: ${(profile.patientType || "").trim()}`);
    if ((profile.frequentHospital || "").trim()) parts.push(`자주 가는 병원: ${(profile.frequentHospital || "").trim()}`);
    if ((profile.pickupPreference || "").trim()) parts.push(`처방 수령 선호: ${(profile.pickupPreference || "").trim()}`);

    if ((profile.meds || "").trim()) parts.push(`복용약: ${(profile.meds || "").trim()}`);
    if ((profile.allergies || "").trim()) parts.push(`알레르기: ${(profile.allergies || "").trim()}`);
    if ((profile.conditions || "").trim()) parts.push(`기저질환: ${(profile.conditions || "").trim()}`);

    return parts.join(" / ");
  }, [profile]);

  const showDashboard = isLoggedIn && step >= 0 && step <= 7;

  const riskSignalsCount = useMemo(() => {
    if (Array.isArray(riskSignals)) return riskSignals.length;
    if (riskSignals && typeof riskSignals === "object") {
      if (typeof riskSignals.count === "number") return riskSignals.count;
      if (Array.isArray(riskSignals.items)) return riskSignals.items.length;
    }
    return 0;
  }, [riskSignals]);

  // “병원 추천으로 이동” 공통 함수
  const goHospitalsByDecision = (fromStep) => {
    if (answers.emergency === "yes") {
      alert("응급 상황에서는 병원 추천 대신 즉시 119/응급실을 권장합니다.");
      return;
    }

    setHospitalBackStep(fromStep);

    // 대면 권장 → 주변 병원(step 5)
    if (decision.level === "inperson") {
      setStep(5);
      return;
    }

    // 비대면 가능/조건부 → 비대면 추천(step 6)
    setStep(6);
  };

  const renderStep = () => (
    <>
      {step === 0 && (
        <StepIntro onStart={start} isLoggedIn={isLoggedIn} currentUser={currentUser} profile={profile} />
      )}

      {step === 99 && (
        <StepLogin
          onBack={() => setStep(0)}
          onLoginSuccess={async (user) => {
            // ✅ 로그인할 때마다 이전 채팅 기록 삭제(유저별)
            try {
              localStorage.removeItem(`mdoc_chat_${user.id}`);
              localStorage.removeItem(`mdoc_chat_cat_${user.id}`);
            } catch {}

            setIsLoggedIn(true);
            setCurrentUser({ id: user.id, name: user.name, email: user.email });

            try {
              const p = await apiGet(`/profile/${user.id}`);
              setProfile(p);
            } catch {
              setProfile(null);
            }

            setStep(0);
          }}
          onSignup={() => setStep(98)}
          onFindAccount={() => setStep(96)}
          onResetPassword={() => {
            setResetEmailDraft("");
            setStep(95);
          }}
        />
      )}

      {step === 98 && (
        <StepSignup
          onBack={() => setStep(99)}
          onSignupSuccess={async (user) => {
            setIsLoggedIn(true);
            setCurrentUser({ id: user.id, name: user.name, email: user.email });
            setProfile(null);

            setPrevStepBeforeProfile(0);
            setStep(97);
          }}
        />
      )}

      {step === 97 && (
        <StepProfileSetup
          initialProfile={profile}
          onBack={() => setStep(prevStepBeforeProfile ?? 0)}
          onSave={async (p) => {
            if (!currentUser?.id) {
              setStep(0);
              return;
            }

            try {
              const saved = await apiPut(`/profile/${currentUser.id}`, {
                sido: p.sido,
                detailRegion: p.detailRegion,
                meds: p.meds,
                frequentHospital: p.frequentHospital,
                conditions: p.conditions,
                allergies: p.allergies,
                pickupPreference: p.pickupPreference,
                patientType: p.patientType,
                emergencyContact: p.emergencyContact,
                notes: p.notes,
                contacts: p.contacts || [],
                visitHistory: p.visitHistory || [],
              });

              setProfile(saved);
              alert("저장되었습니다");
              setStep(0);
            } catch (e) {
              alert(e.message || "저장 실패");
            }
          }}
        />
      )}

      {step === 96 && <StepFindAccount onBack={() => setStep(99)} />}

      {step === 95 && (
        <StepResetRequest
          onBack={() => setStep(99)}
          onGoNext={(email) => {
            setResetEmailDraft(email);
            setStep(94);
          }}
        />
      )}

      {step === 94 && (
        <StepResetPassword email={resetEmailDraft} onBack={() => setStep(95)} onDone={() => setStep(99)} />
      )}

      {step === 1 && (
        <StepQuestions
          progress={progress}
          question={currentQ}
          answers={answers}
          setAnswers={setAnswers}
          onPrev={prevQuestion}
          onNext={nextQuestion}
          canNext={canGoNextQuestion}
        />
      )}

      {step === 2 && (
        <StepResult
          decision={decision}
          onBackToQuestions={() => setStep(1)}
          onGoChecklist={() => setStep(3)}
          onGoHospitals={() => goHospitalsByDecision(2)}
          hospitalsButtonLabel={decision.level === "inperson" ? "주변 병원 추천" : "비대면 진료 병원 추천"}
          showHospitalsButton={answers.emergency !== "yes"}
        />
      )}

      {step === 3 && (
        <StepChecklist
          checklist={checklist}
          contacts={contacts}
          onToggle={toggleChecklist}
          onUpdate={updateChecklistItem}
          onBack={() => setStep(2)}
          onNext={() => {
            if (answers.emergency === "yes") {
              alert("응급 상황에서는 병원 추천 대신 즉시 119/응급실을 권장합니다.");
              resetAll();
              return;
            }
            setStep(4); // ✅ 안전 이용
          }}
          currentUser={currentUser}
          emergencyPrefillNote={emergencyPrefillNote}
          // ✅ 추가: 메일에 1분 + 3분 내용을 같이 보내기
          answers={answers}
          decision={decision}
          profileSummary={profileSummary}
        />
      )}

      {step === 4 && (
        <StepSafety
          riskInput={riskInput}
          setRiskInput={setRiskInput}
          riskSignals={riskSignals}
          onBack={() => setStep(3)}
          onNext={() => goHospitalsByDecision(4)}
        />
      )}

      {step === 5 && (
        <StepHospitals
          hospitals={nearbyHospitals}
          selectedDept={selectedDept}
          onBack={() => setStep(hospitalBackStep)}
          onRestart={resetAll}
        />
      )}

      {step === 6 && (
        <StepTeleHospitals
          hospitals={baseHospitals}
          initialDept={selectedDept || "내과"}
          lockedDept={selectedDept || null}
          onBack={() => setStep(hospitalBackStep)}
          onOpenDetail={(h) => {
            setSelectedHospital(h);
            setStep(7);
          }}
        />
      )}

      {step === 7 && <StepHospitalDetail hospital={selectedHospital} onBack={() => setStep(6)} />}
    </>
  );

  return (
    <div className={`mdoc-page ${showDashboard ? "mdoc-page--wide" : ""}`}>
      <Header
        onReset={resetAll}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onGoLogin={() => setStep(99)}
        onGoProfile={() => {
          if (!isLoggedIn) return;
          setPrevStepBeforeProfile(step);
          setStep(97);
        }}
        onLogout={() => {
          setIsLoggedIn(false);
          setCurrentUser(null);
          setProfile(null);
          setStep(0);
          alert("로그아웃되었습니다");
        }}
      />

      {showDashboard ? (
        <div className="mdoc-shell mdoc-shell--3col">
          <aside className="mdoc-side">
            <SideChecklistPanel step={step} checklist={checklist} riskSignalsCount={riskSignalsCount} onReset={resetAll} />
          </aside>

          <main className="mdoc-main mdoc-center">{renderStep()}</main>

          <aside className="mdoc-side">
            <ChatbotPanel user={currentUser} profile={profile} decision={decision} />
          </aside>
        </div>
      ) : (
        <main className="mdoc-main">{renderStep()}</main>
      )}

      <footer className="mdoc-footer">
        <div className="mdoc-footerText">* 본 웹은 의료적 진단/처방을 제공하지 않습니다.</div>
      </footer>
    </div>
  );
}