// src/mobiledoc/components/ChatbotPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiPost } from "../api";

const CS_PHONE = "010-4227-5689";

const CATEGORIES = [
  { id: "visits", label: "방문병원", icon: "🏥" },
  { id: "symptoms", label: "증상통계", icon: "📊" },
  { id: "decision", label: "최근판별", icon: "🧠" },
  { id: "contact", label: "고객센터", icon: "☎️" },
];

function safeText(v) {
  return (v ?? "").toString().trim();
}

function countBy(arr, keyFn) {
  const m = new Map();
  for (const x of arr || []) {
    const k = safeText(keyFn(x));
    if (!k) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
}

// ✅ symptom 코드 → 화면용 라벨(간단 매핑)
function symptomCodeToLabel(code) {
  switch (safeText(code)) {
    case "cold":
      return "감기/인후통";
    case "skin":
      return "피부 증상";
    case "obgyn":
      return "산부인과 증상";
    case "peds":
      return "소아 증상";
    case "gi":
      return "복통/소화기";
    case "eye":
      return "눈 증상";
    case "mental":
      return "정신건강(불안/우울)";
    default:
      return safeText(code) || "증상미기록";
  }
}

function levelToLabel(level) {
  switch (safeText(level)) {
    case "ok":
      return "가능";
    case "conditional":
      return "조건부";
    case "inperson":
      return "대면권장";
    case "emergency":
      return "응급";
    default:
      return safeText(level);
  }
}

// ✅ 서버 stats → “간략” 텍스트
function buildSymptomsSummaryFromStats(stats) {
  const days = Number(stats?.days ?? 30);
  const total = Number(stats?.totalCount ?? 0);
  const recent = Array.isArray(stats?.recent) ? stats.recent : [];

  if (!total || recent.length === 0) {
    return (
      `최근 ${days}일 증상 기록이 아직 없어요.\n` +
      `• 1분 판별 → 3분 체크리스트까지 완료하면 자동으로 기록돼요.`
    );
  }

  const lines = recent.slice(0, 5).map((r) => {
    const d = safeText(r?.date) || "날짜미기록";
    const s = symptomCodeToLabel(r?.symptom);
    const lv = levelToLabel(r?.decisionLevel);
    return `  - ${d} / ${s}${lv ? ` (${lv})` : ""}`;
  });

  return `최근 ${days}일 증상 기록\n• 총: ${total}건\n• 최근 기록\n${lines.join("\n")}`;
}

function buildCategorySummary(categoryId, profile, decision) {
  const visitHistory = Array.isArray(profile?.visitHistory) ? profile.visitHistory : [];

  if (categoryId === "contact") {
    return (
      `고객센터 연락\n` +
      `• 전화번호: ${CS_PHONE}\n` +
      `• 아래에 문의를 적어주면, 제가 먼저 핵심을 정리해서 안내해줄게요.\n` +
      `  예) 로그인/비번재설정/저장오류/AI답변이상/화면깨짐`
    );
  }

  if (categoryId === "decision") {
    if (!decision?.level) {
      return `최근 판별 결과가 아직 없어요. 1분 판별을 먼저 진행해 주세요.`;
    }
    const reasons = Array.isArray(decision?.reasons) ? decision.reasons : [];
    const dept = decision?.aiInput?.answers?.dept || null;

    return (
      `최근 판별 요약\n` +
      `• 결과: ${decision.title} (${decision.level})\n` +
      `• 한 줄 이유: ${decision.oneLineReason}\n` +
      (dept ? `• 진료과(추정): ${dept}\n` : "") +
      (reasons.length ? `• 근거:\n${reasons.map((r) => `  - ${r}`).join("\n")}` : "")
    );
  }

  if (categoryId === "visits") {
    if (visitHistory.length === 0) {
      return (
        `방문 기록이 아직 없어요.\n` +
        `• “내 정보(Profile)”에 방문 기록(병원/날짜/증상·진단)을 추가하면\n` +
        `  여기서 자동으로 자주 간 병원/최근 기록을 정리해줘요.`
      );
    }

    const byHospital = countBy(visitHistory, (v) => v?.hospital).slice(0, 5);
    const recent = [...visitHistory]
      .filter((v) => safeText(v?.hospital) || safeText(v?.date) || safeText(v?.diagnosis))
      .sort((a, b) => safeText(b?.date).localeCompare(safeText(a?.date)))
      .slice(0, 3);

    return (
      `내 방문 병원 정리\n` +
      `• 총 방문 기록: ${visitHistory.length}건\n` +
      `• 자주 간 병원 TOP\n` +
      byHospital.map(([name, cnt]) => `  - ${name} (${cnt}회)`).join("\n") +
      (recent.length
        ? `\n\n• 최근 기록\n` +
          recent
            .map(
              (v) =>
                `  - ${safeText(v.date) || "날짜미기록"} / ${safeText(v.hospital) || "병원미기록"} / ${
                  safeText(v.diagnosis) || "증상·진단 미기록"
                }`
            )
            .join("\n")
        : "")
    );
  }

  // ✅ 서버 통계 실패 시 보여줄 “임시” 메시지(기존 유지)
  if (categoryId === "symptoms") {
    if (visitHistory.length === 0) {
      return `증상/진단 기록이 없어요. “내 정보(Profile)”의 방문 기록에 diagnosis를 적어주면 통계가 생겨요.`;
    }

    const byDx = countBy(visitHistory, (v) => safeText(v?.diagnosis) || "미기록").slice(0, 7);

    return (
      `증상/진단별 방문 횟수(기록 기반)\n` +
      byDx.map(([dx, cnt]) => `• ${dx}: ${cnt}회`).join("\n") +
      `\n\n(팁) diagnosis를 “감기/피부발진/두통”처럼 짧게 쓰면 통계가 더 예쁘게 나와요.`
    );
  }

  return "카테고리를 누르거나, 궁금한 걸 물어봐요!";
}

function localFallbackReply(text) {
  const t = text.trim();
  if (!t) return "무엇이 궁금해?";

  if (t.includes("고객센터") || t.includes("전화") || t.includes("번호") || t.includes("문의")) {
    return `고객센터 전화번호는 ${CS_PHONE} 이야.\n문제 상황을 적어주면 내가 먼저 핵심만 정리해줄게요.`;
  }
  if (t.includes("비대면") || t.includes("원격") || t.includes("화상")) {
    return "비대면진료는 케이스에 따라 제한이 있습니다. 응급 신호/처방 필요 여부/화상 가능 여부를 먼저 확인해볼까요?";
  }
  if (t.includes("응급") || t.includes("119") || t.includes("가슴") || t.includes("호흡")) {
    return "응급 신호가 의심되면 챗봇보다 119/응급실이 우선입니다. 지금 ‘숨이 차거나, 의식이 흐리거나, 극심한 통증’이 있으신가요?";
  }
  if (t.includes("약") || t.includes("처방")) {
    return "처방이 필요한지, 복용약/알레르기가 있는지 먼저 정리하면 좋습니다. ‘복용 중인 약/알레르기’가 있나요?";
  }
  return "좋습니다. 증상을 한 줄로 말해주면(언제 시작, 얼마나 아픈지 0~10, 동반 증상) 제가 정리해서 다음 단계에 맞춰줄게요.";
}

async function callChatApi(payload) {
  try {
    return await apiPost("/ai/chat", payload);
  } catch {
    return await apiPost("/chat", payload);
  }
}

export default function ChatbotPanel({ user, profile, decision }) {
  const [category, setCategory] = useState("visits");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiConnectedOnce, setAiConnectedOnce] = useState(false);

  const storageKey = useMemo(
    () => (user?.id ? `mdoc_chat_${user.id}` : "mdoc_chat_guest"),
    [user]
  );
  const catKey = useMemo(
    () => (user?.id ? `mdoc_chat_cat_${user.id}` : "mdoc_chat_cat_guest"),
    [user]
  );

  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setMessages(raw ? JSON.parse(raw) : []);
    } catch {
      setMessages([]);
    }

    try {
      const savedCat = localStorage.getItem(catKey);
      if (savedCat) setCategory(savedCat);
    } catch {}
  }, [storageKey, catKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(catKey, category);
    } catch {}
  }, [category, catKey]);

  useEffect(() => {
    if (messages.length > 0) return;
    const ts = Date.now();
    setMessages([
      {
        role: "assistant",
        text:
          `안녕하세요${user?.name ? `, ${user.name}님` : ""}! ` +
          `위 카테고리를 눌러 기록을 확인하거나, 궁금한 점 질문해주세요!.\n` +
          `* 의료 진단/처방은 제공하지 않습니다. 응급이면 119/응급실이 우선입니다!`,
        ts,
      },
      { role: "assistant", text: buildCategorySummary("visits", profile, decision), ts: ts + 1 },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bottomRef = useRef(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  const pushMsg = (role, text) => {
    setMessages((prev) => [...prev, { role, text, ts: Date.now() + Math.random() }]);
  };

  // ✅ symptoms만 “서버에서 날짜/증상 기록” 조회해서 보여줌
  const onPickCategory = async (id) => {
    if (id === category) return;
    setCategory(id);

    if (id === "symptoms") {
      const email = safeText(user?.email);
      if (!email) {
        pushMsg(
          "assistant",
          `증상 통계는 로그인 후(이메일이 있는 상태) 이용할 수 있어요.\n• 3분 체크 완료 시 이메일 기준으로 기록됩니다.`
        );
        return;
      }

      pushMsg("assistant", "증상 통계를 불러오는 중...");
      try {
        const stats = await apiGet(`/stats/symptoms?email=${encodeURIComponent(email)}&days=30`);
        pushMsg("assistant", buildSymptomsSummaryFromStats(stats));
      } catch (e) {
        // 서버가 아직 반영 전이면 기존(visitHistory 기반) 안내로 fallback
        pushMsg("assistant", buildCategorySummary("symptoms", profile, decision));
      }
      return;
    }

    pushMsg("assistant", buildCategorySummary(id, profile, decision));
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", text, ts: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    setInput("");
    setLoading(true);

    try {
      const history = nextMessages.slice(-10).map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const payload = {
        category,
        message: text,
        text,
        history,
        userId: user?.id ?? null,
        customerCenterPhone: CS_PHONE,
        context: {
          profileSummary: {
            visitsCount: Array.isArray(profile?.visitHistory) ? profile.visitHistory.length : 0,
          },
          lastDecision: decision?.level
            ? {
                level: decision.level,
                title: decision.title,
                oneLineReason: decision.oneLineReason,
                reasons: Array.isArray(decision.reasons) ? decision.reasons : [],
                dept: decision?.aiInput?.answers?.dept || null,
              }
            : null,
        },
      };

      const res = await callChatApi(payload);
      const reply = res?.reply || res?.message || res?.text;

      if (reply && String(reply).trim()) {
        setAiConnectedOnce(true);
        pushMsg("assistant", String(reply).trim());
      } else {
        pushMsg("assistant", localFallbackReply(text));
      }
    } catch (e) {
      const extra = category === "contact" ? `\n\n고객센터 전화번호는 ${CS_PHONE} 입니다.` : "";
      pushMsg(
        "assistant",
        localFallbackReply(text) +
          extra +
          "\n\n(참고: 아직 /ai/chat 또는 /chat 연결 전이면 데모 모드로 동작해요.)"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mdoc-sideCard mdoc-chatPanel">
      <div className="mdoc-sideHead mdoc-chatHead">
        <span>ChatBot</span>

        {aiConnectedOnce && (
          <span className="mdoc-chatStatus" title="AI 연결됨">
            <span className="mdoc-chatDot isOn" />
            AI
          </span>
        )}
      </div>

      <div className="mdoc-chatCats">
        <div className="mdoc-chatCatGrid">
          {CATEGORIES.map((c) => {
            const active = c.id === category;
            return (
              <button
                key={c.id}
                className={`mdoc-chatCatBtn ${active ? "isActive" : ""}`}
                onClick={() => onPickCategory(c.id)}
              >
                <div className="mdoc-chatCatIcon">{c.icon}</div>
                <div className="mdoc-chatCatLabel">{c.label}</div>
              </button>
            );
          })}
        </div>

        {category === "contact" && (
          <div className="mdoc-chatQuickRow">
            <button className="mdoc-chatQuickBtn" onClick={() => window.open(`tel:${CS_PHONE}`, "_self")}>
              ☎️ 고객센터 전화
            </button>
            <button
              className="mdoc-chatQuickBtn"
              onClick={() => pushMsg("assistant", `고객센터 전화번호는 ${CS_PHONE} 입니다.\n문제 상황을 적어주면 제가 먼저 핵심만 정리해줄게요.`)}
            >
              💬 문의 작성
            </button>
          </div>
        )}
      </div>

      <div className="mdoc-sideBody">
        {messages.length === 0 ? (
          <div className="mdoc-heroLabel">챗봇</div>
        ) : (
          <div className="mdoc-chatList">
            {messages.map((m, idx) => (
              <div
                key={`${m.ts}_${idx}`}
                className={`mdoc-chatBubble ${m.role === "user" ? "mdoc-chatBubble--me" : "mdoc-chatBubble--bot"}`}
              >
                {m.text}
              </div>
            ))}
            {loading && <div className="mdoc-chatBubble mdoc-chatBubble--bot">입력 중...</div>}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="mdoc-sideFoot">
        <div className="mdoc-chatInputRow">
          <input
            className="mdoc-chatInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={category === "contact" ? "문의 내용을 적어주세요" : "궁금한 걸 물어보세요."}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button className="mdoc-chatBtn" onClick={send} disabled={loading || !input.trim()}>
            전송
          </button>
        </div>

        <div style={{ marginTop: 8, fontSize: 11, color: "#777", lineHeight: 1.4 }}>
          * 의료 진단/처방은 제공하지 않습니다. 응급이면 119/응급실이 우선!
        </div>
      </div>
    </div>
  );
}