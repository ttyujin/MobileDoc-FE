import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiPost } from "../api";

function localFallbackReply(text) {
  const t = text.trim();
  if (!t) return "무엇이 궁금해?";

  // 아주 간단한 데모 답변(백엔드 /chat 붙이면 자동으로 AI로 바뀜)
  if (t.includes("비대면") || t.includes("원격") || t.includes("화상")) {
    return "비대면진료는 케이스에 따라 제한이 있어. 지금 증상이 급한지(응급 신호), 처방 필요 여부, 화상 가능 여부를 먼저 확인해볼까?";
  }
  if (t.includes("응급") || t.includes("119") || t.includes("가슴") || t.includes("호흡")) {
    return "응급 신호가 의심되면 챗봇보다 119/응급실이 우선이야. 지금 ‘숨이 차거나, 의식이 흐리거나, 극심한 통증’이 있어?";
  }
  if (t.includes("약") || t.includes("처방")) {
    return "처방이 필요한지, 기존 복용약/알레르기가 있는지 먼저 정리하면 좋아. ‘복용 중인 약/알레르기’가 있어?";
  }
  return "좋아. 증상을 한 줄로 말해주면(언제 시작, 얼마나 아픈지 0~10, 동반 증상) 내가 정리해서 다음 단계에 맞춰줄게.";
}

export default function ChatbotPanel({ user }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const storageKey = useMemo(
    () => (user?.id ? `mdoc_chat_${user.id}` : "mdoc_chat_guest"),
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
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, storageKey]);

  const bottomRef = useRef(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text, ts: Date.now() }]);
    setInput("");
    setLoading(true);

    // 1) 일단 백엔드 /chat 시도
    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const res = await apiPost("/chat", {
        message: text,
        history,
        userId: user?.id ?? null,
      });

      const reply = res?.reply;
      if (reply && String(reply).trim()) {
        setMessages((prev) => [...prev, { role: "assistant", text: String(reply).trim(), ts: Date.now() }]);
      } else {
        // 응답 형태가 다르면 fallback
        setMessages((prev) => [...prev, { role: "assistant", text: localFallbackReply(text), ts: Date.now() }]);
      }
    } catch (e) {
      // 2) /chat 없거나(CORS/404) 실패하면 로컬 데모로라도 동작
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            localFallbackReply(text) +
            "\n\n(참고: 아직 AI 연결 전이면 이 챗봇은 데모 모드야. 나중에 백엔드에 /chat 붙이면 자동으로 AI로 바뀌어.)",
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mdoc-sideCard">
      <div className="mdoc-sideHead">ChatBot</div>

      <div className="mdoc-sideBody">
        {messages.length === 0 ? (
          <div className="mdoc-heroLabel">챗봇</div>
        ) : (
          <div className="mdoc-chatList">
            {messages.map((m) => (
              <div
                key={m.ts}
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
            placeholder="궁금한 걸 물어봐"
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
          * 의료 진단/처방은 제공하지 않아. 응급이면 119/응급실이 우선!
        </div>
      </div>
    </div>
  );
}
