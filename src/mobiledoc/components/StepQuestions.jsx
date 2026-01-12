//질문 화면(버튼 선택 + 진행률)
import React from "react";

export default function StepQuestions({
  progress,
  question,
  answers,
  setAnswers,
  onPrev,
  onNext,
  canNext,
}) {
  const answerYesNo = (id, yn) => setAnswers((prev) => ({ ...prev, [id]: yn }));
  const answerChoice = (id, value) => setAnswers((prev) => ({ ...prev, [id]: value }));

  return (
    <section className="mdoc-card">
      <div className="mdoc-rowBetween">
        <h2 className="mdoc-h2">1분 판별</h2>
        <div className="mdoc-progressWrap">
          <div className="mdoc-progressText">{progress}%</div>
          <div className="mdoc-progressBar">
            <div className="mdoc-progressFill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="mdoc-question">
        <div className="mdoc-qTitle">{question.title}</div>
        <div className="mdoc-qDesc">{question.desc}</div>

        {question.type === "yesno" && (
          <div className="mdoc-btnRow">
           <button
              className={`mdoc-btn mdoc-btn-big mdoc-ynYes ${answers[question.id] === "yes" ? "isActive" : ""}`}
             onClick={() => answerYesNo(question.id, "yes")}
            >
              예
            </button>
            <button
              className={`mdoc-btn mdoc-btn-big ${answers[question.id] === "no" ? "isActive" : ""}`}
              onClick={() => answerYesNo(question.id, "no")}
            >
              아니오
            </button>
          </div>
        )}

        {question.type === "choice" && (
          <div className="mdoc-choiceCol">
            {question.options.map((op) => (
              <button
                key={op.value}
                className={`mdoc-btn mdoc-btn-big mdoc-btn-choice ${
                  answers[question.id] === op.value ? "isActive" : ""
                }`}
                onClick={() => answerChoice(question.id, op.value)}
              >
                {op.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mdoc-rowBetween">
        <button className="mdoc-btn mdoc-btn-ghost" onClick={onPrev}>
          이전
        </button>
        <button className="mdoc-btn mdoc-btn-primary" onClick={onNext} disabled={!canNext}>
          다음
        </button>
      </div>

      {!canNext && <div className="mdoc-hint">선택을 해주면 다음으로 넘어갈 수 있어요.</div>}
    </section>
  );
}
