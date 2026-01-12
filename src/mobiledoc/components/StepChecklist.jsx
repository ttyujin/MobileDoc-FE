// src/mobiledoc/components/StepChecklist.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiPost } from "../api";

export default function StepChecklist({
  checklist,
  contacts = [],
  onToggle, // 체크박스용
  onUpdate, // 입력/액션/공유용
  onBack,
  onNext,

  // ✅ MobileDoc.jsx에서 내려주는 값들(추가)
  currentUser = null,
  emergencyPrefillNote = "",
}) {
  // 카메라 스트림 관리
  const [openCameraId, setOpenCameraId] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const streamsRef = useRef({}); // { [id]: MediaStream }

  const contactOptions = useMemo(() => {
    return (contacts || [])
      .filter((c) => (c?.name || "").trim())
      .map((c) => ({
        id: c.id,
        name: (c.name || "").trim(),
        relation: (c.relation || "").trim(),
        phone: (c.phone || "").trim(),
        email: (c.email || "").trim(),
      }));
  }, [contacts]);

  const stopStream = (id) => {
    const s = streamsRef.current[id];
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      delete streamsRef.current[id];
    }
  };

  const stopAllStreams = () => {
    Object.keys(streamsRef.current).forEach((id) => stopStream(id));
  };

  useEffect(() => {
    return () => stopAllStreams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openOrCloseCamera = async (id) => {
    setCameraError("");

    // 이미 열려있으면 닫기
    if (openCameraId === id) {
      stopStream(id);
      setOpenCameraId(null);
      return;
    }

    // 다른 카메라가 열려있으면 닫고 새로 열기
    if (openCameraId) {
      stopStream(openCameraId);
      setOpenCameraId(null);
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("이 브라우저는 카메라 연결을 지원하지 않습니다.");
        return;
      }

      // ✅ 권한 이슈 줄이려고 audio는 끔(필요하면 true로)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamsRef.current[id] = stream;
      setOpenCameraId(id);
    } catch (e) {
      setCameraError("카메라 권한을 허용해야 연결할 수 있습니다.");
    }
  };

  const onsetText = useMemo(() => {
    const onset = checklist.find((x) => x.id === "c1_onset")?.value;
    if (onset === "today") return "당일";
    if (onset === "3days") return "3일 전";
    if (onset === "1week") return "일주일 전";
    return "미입력";
  }, [checklist]);

  const severityValue = useMemo(() => {
    return checklist.find((x) => x.id === "c2_severity")?.value ?? 0;
  }, [checklist]);

  const factorsValue = useMemo(() => {
    return checklist.find((x) => x.id === "c3_factors")?.value ?? "";
  }, [checklist]);

  // ✅ 공유 메시지(클립보드/메일 본문으로 사용)
  const shareMessage = useMemo(() => {
    // 필요하면 여기 문구 더 풍부하게 만들면 됨
    return `🚨접속자님이 위기상황일 수 있어요. 가능하면 지금 연락 부탁드립니다.🚨\n\n-`;
  }, [onsetText, severityValue, factorsValue]);

  // ✅ 응급 프리셋(e3_note)이 비어 있으면, 내 정보(meds/allergies/conditions)로 자동 채우기
  useEffect(() => {
    const noteItem = checklist.find((x) => x.id === "e3_note" && x.type === "text");
    if (!noteItem) return;

    const cur = (noteItem.value || "").trim();
    const pre = (emergencyPrefillNote || "").trim();

    if (!cur && pre) {
      onUpdate("e3_note", { value: pre });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklist, emergencyPrefillNote]);

  // ✅ 공유: 1) 메시지 복사 2) 서버로 “응급 알림 메일” 요청 3) alert 표시 (앱 이동은 하지 않음)
  const doShare = async (item) => {
    const selectedId = item?.value?.contactId;
    const c = contactOptions.find((x) => x.id === selectedId);

    if (!c) {
      alert("공유할 사람을 먼저 선택해주세요.");
      return;
    }

    // 1) 클립보드 복사
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareMessage);
      }
    } catch (_) {
      // 무시
    }

    // 2) 서버 메일 발송
    let mailOk = false;
    try {
      const res = await apiPost("/alerts/emergency", {
        reporter: {
          name: currentUser?.name || "접속자",
          email: currentUser?.email || "",
        },
        target: {
          contactId: c.id || null,
          name: c.name || "",
          email: c.email || "",
          phone: c.phone || "",
        },
        message: shareMessage,
      });

      // ✅ 백엔드가 { ok: true }를 주면 이게 제일 확실
      // 만약 res가 아무것도 안 오면, "요청 성공 = ok"로 처리하고 싶으면 아래를 true로 바꿔도 됨.
      mailOk = !!res?.ok;
    } catch (e) {
      console.warn("Emergency alert email failed:", e);
      mailOk = false;
    }

    // 3) alert
    if (mailOk) {
      alert("메일이 전송되었습니다.");
    } else {
      alert("메일 전송에 실패했습니다. (메일 설정/서버 상태를 확인해주세요)");
    }

    // ✅ 여기서 끝: 문자/메일 앱 이동은 하지 않음
    return;
  };

  const renderItem = (item) => {
    // 체크형
    if (item.type === "check") {
      return (
        <div className="mdoc-listCard" key={item.id}>
          <div className="mdoc-rowBetween" style={{ gap: 10 }}>
            <div style={{ fontWeight: 900 }}>{item.text}</div>
            <button
              type="button"
              className={`mdoc-btn mdoc-btn-seg ${item.checked ? "isActive" : ""}`}
              onClick={() => onToggle(item.id)}
            >
              {item.checked ? "완료" : "체크"}
            </button>
          </div>
        </div>
      );
    }

    // 선택형(증상 시작)
    if (item.type === "choice") {
      return (
        <div className="mdoc-listCard" key={item.id}>
          <div className="mdoc-listCardTitle" style={{ marginBottom: 10 }}>
            {item.label} {item.required ? <span className="mdoc-required">*</span> : null}
          </div>

          <div className="mdoc-segRow">
            {item.options.map((op) => (
              <button
                key={op.value}
                type="button"
                className={`mdoc-btn mdoc-btn-seg ${item.value === op.value ? "isActive" : ""}`}
                onClick={() => onUpdate(item.id, { value: op.value })}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // 범위(0~10)
    if (item.type === "range") {
      return (
        <div className="mdoc-listCard" key={item.id}>
          <div className="mdoc-rowBetween" style={{ marginBottom: 10 }}>
            <div className="mdoc-listCardTitle">{item.label}</div>
            <div style={{ fontWeight: 900, minWidth: 20, textAlign: "right" }}>{item.value}</div>
          </div>

          <input
            type="range"
            min={item.min}
            max={item.max}
            step={item.step}
            value={item.value}
            onChange={(e) => onUpdate(item.id, { value: Number(e.target.value) })}
            style={{ width: "100%" }}
          />

          <div style={{ marginTop: 10 }}>
            <input
              className="mdoc-input"
              type="number"
              min={item.min}
              max={item.max}
              value={item.value}
              onChange={(e) => {
                const n = Number(e.target.value);
                const clamped = Number.isFinite(n)
                  ? Math.min(item.max, Math.max(item.min, n))
                  : item.min;
                onUpdate(item.id, { value: clamped });
              }}
              placeholder="0~10"
            />
          </div>
        </div>
      );
    }

    // 텍스트
    if (item.type === "text") {
      return (
        <div className="mdoc-listCard" key={item.id}>
          <div className="mdoc-listCardTitle" style={{ marginBottom: 10 }}>
            {item.label}
          </div>
          <textarea
            className="mdoc-textarea"
            value={item.value || ""}
            onChange={(e) => onUpdate(item.id, { value: e.target.value })}
            placeholder={item.placeholder || ""}
            style={{ minHeight: 90 }}
          />
        </div>
      );
    }

    // 액션(119 / 카메라)
    if (item.type === "action") {
      return (
        <div className="mdoc-listCard" key={item.id}>
          <div className="mdoc-rowBetween" style={{ gap: 10 }}>
            <div style={{ fontWeight: 900 }}>{item.label}</div>

            {item.action === "call119" ? (
              <a className="mdoc-btn mdoc-btn-primary" href="https://www.119.go.kr/Center119/main.do">
                {item.buttonText || "119"}
              </a>
            ) : item.action === "camera" ? (
              <button
                type="button"
                className="mdoc-btn mdoc-btn-primary mdoc-cameraBtn"
                onClick={() => openOrCloseCamera(item.id)}
                title="카메라 연결/해제"
              >
                {openCameraId === item.id ? "📹 종료" : item.buttonText || "📹"}
              </button>
            ) : null}
          </div>

          {item.hint ? (
            <div className="mdoc-hint" style={{ marginTop: 8 }}>
              {item.hint}
            </div>
          ) : null}

          {item.action === "camera" && openCameraId === item.id ? (
            <>
              {cameraError ? (
                <div className="mdoc-inlineError" style={{ marginTop: 10 }}>
                  {cameraError}
                </div>
              ) : null}

              <div style={{ marginTop: 12 }}>
                <video
                  autoPlay
                  playsInline
                  muted
                  ref={(el) => {
                    if (el) {
                      const stream = streamsRef.current[item.id];
                      if (stream) el.srcObject = stream;
                    }
                  }}
                  style={{
                    width: "100%",
                    minHeight: 220,
                    borderRadius: 14,
                    border: "1px solid #e6e6ef",
                    background: "#000",
                  }}
                />
                <div className="mdoc-hint" style={{ marginTop: 8 }}>
                  * 테스트 후에는 ‘📹 종료’를 눌러 카메라를 꺼줍니다.
                </div>
              </div>
            </>
          ) : null}
        </div>
      );
    }

    // 공유 (미리보기 박스 제거됨)
    if (item.type === "share") {
      return (
        <div className="mdoc-listCard" key={item.id}>
          <div className="mdoc-rowBetween" style={{ gap: 10, marginBottom: 10 }}>
            <div style={{ fontWeight: 900 }}>{item.label}</div>
            <button
              type="button"
              className="mdoc-btn mdoc-btn-primary"
              disabled={!item?.value?.contactId || contactOptions.length === 0}
              onClick={() => doShare(item)}
              title={!item?.value?.contactId ? "공유할 사람을 선택해줘" : "공유"}
            >
              공유
            </button>
          </div>

          {contactOptions.length === 0 ? (
            <div className="mdoc-inlineError">
              내 정보에서 ‘주변 사람 연락처’를 먼저 입력해야 공유할 수 있습니다.
            </div>
          ) : (
            <label className="mdoc-label">
              공유할 사람 선택
              <select
                className="mdoc-select"
                value={item?.value?.contactId || ""}
                onChange={(e) =>
                  onUpdate(item.id, { value: { ...(item.value || {}), contactId: e.target.value } })
                }
              >
                <option value="">선택</option>
                {contactOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.relation ? ` (${c.relation})` : ""}
                    {c.phone ? ` - ${c.phone}` : c.email ? ` - ${c.email}` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="mdoc-hint" style={{ marginTop: 8 }}>
            * 공유 버튼을 누르면 메시지를 복사하고, 서버를 통해 이메일 알림(관리자+선택한 사람)을 보냅니다.
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <section className="mdoc-card mdoc-card--checklist">
      <h2 className="mdoc-h2">3분 준비 체크리스트</h2>
      <p className="mdoc-p">입력/체크를 해두면 진료가 매끄러워집니다.</p>

      <div className="mdoc-checklistBody">
        <div className="mdoc-list">{checklist.map(renderItem)}</div>
      </div>

      <div className="mdoc-stepFooter">
        <div className="mdoc-rowBetween">
          <button type="button" className="mdoc-btn mdoc-btn-ghost" onClick={onBack}>
            뒤로
          </button>
          <button type="button" className="mdoc-btn mdoc-btn-primary" onClick={onNext}>
            다음
          </button>
        </div>
      </div>
    </section>
  );
}
