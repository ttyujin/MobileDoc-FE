import React from "react";

export default function Header({
  onReset,
  isLoggedIn,
  currentUser,
  onGoLogin,
  onGoProfile,
  onLogout,
}) {
  return (
    <header className="mdoc-header">
      <div className="mdoc-brand">
        <div className="mdoc-logo">MD</div>
        <div>
          <div className="mdoc-titleRow">
            <div className="mdoc-title">MobileDoc</div>
            {isLoggedIn && currentUser?.name ? (
              <div className="mdoc-userChip"><b>{currentUser.name}님</b></div>
            ) : null}
          </div>
          
        </div>
      </div>

      <div className="mdoc-headerActions">
        {/* ✅ 내 정보 버튼: 로그인 안 하면 비활성화 */}
        <button
          className="mdoc-btn mdoc-btn-ghost"
          onClick={onGoProfile}
          disabled={!isLoggedIn}
          title={!isLoggedIn ? "로그인 후 이용 가능" : "내 정보 보기/수정"}
        >
          내 정보
        </button>

        {!isLoggedIn ? (
          <button className="mdoc-btn mdoc-btn-ghost" onClick={onGoLogin}>
            로그인/회원가입
          </button>
        ) : (
          <button className="mdoc-btn mdoc-btn-ghost" onClick={onLogout}>
            로그아웃
          </button>
        )}

        <button className="mdoc-btn mdoc-btn-ghost" onClick={onReset}>
          처음부터
        </button>
      </div>
    </header>
  );
}
