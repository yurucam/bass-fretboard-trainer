// confetti 효과 관리 스크립트
(function () {
  window.addEventListener("DOMContentLoaded", () => {
    console.log("Confetti 효과 초기화 중...");

    // confetti 라이브러리 확인
    if (typeof confetti === "undefined") {
      console.error("confetti 라이브러리가 로드되지 않았습니다.");

      // 라이브러리 직접 로드 시도
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js";
      script.onload = () => {
        console.log("confetti 라이브러리가 동적으로 로드되었습니다.");
        initConfetti(); // 테스트 제거, 초기화만 실행
      };
      script.onerror = () => console.error("confetti 라이브러리 로드 실패");
      document.head.appendChild(script);
    } else {
      console.log("confetti 라이브러리가 이미 로드되어 있습니다.");
      initConfetti(); // 테스트 제거, 초기화만 실행
    }
  });

  // confetti 초기화 함수 (테스트 없이)
  function initConfetti() {
    try {
      console.log("confetti 초기화 완료");

      // 글로벌 함수 정의
      window.showSuccessConfetti = function () {
        console.log("성공 confetti 효과 실행!");
        confetti({
          particleCount: 300,
          spread: 100,
          origin: { y: 0.5 },
          colors: ["#4caf50", "#00bcd4", "#ff9800", "#f44336", "#9c27b0"],
          zIndex: 9999,
        });
      };
    } catch (error) {
      console.error("confetti 초기화 중 오류:", error);
    }
  }
})();
