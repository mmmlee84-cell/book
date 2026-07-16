// =====================================================================
// 로그인 로직
//   흐름: 유효성 검사 → auth.signInWithPassword() → member.role 조회 → 페이지 이동
//     - role === 'admin' → member.html   (회원 관리 페이지)
//     - 그 외            → mypage.html   (일반 사용자 페이지)
// =====================================================================

import { supabase } from "./supabase.js";

// ---------------------------------------------------------------------
// 자주 쓰는 요소 미리 찾기
// ---------------------------------------------------------------------
const form = document.getElementById("login-form");
const messageEl = document.getElementById("message");
const submitBtn = document.getElementById("submit-btn");
const spinner = submitBtn.querySelector(".spinner");

// ---------------------------------------------------------------------
// 메시지 표시 / 숨김 도우미
// ---------------------------------------------------------------------
function showMessage(text, type = "error") {
    messageEl.textContent = text;
    messageEl.className = "message message--" + type;
    messageEl.hidden = false;
}

function clearMessage() {
    messageEl.hidden = true;
    messageEl.textContent = "";
}

// ---------------------------------------------------------------------
// 로딩 상태 전환 (로딩 중 버튼 비활성화 + 스피너)
// ---------------------------------------------------------------------
function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    spinner.hidden = !isLoading;
    submitBtn.querySelector(".btn__label").textContent = isLoading
        ? "로그인 중..."
        : "로그인";
}

// ---------------------------------------------------------------------
// 비밀번호 보기/숨기기 토글
// ---------------------------------------------------------------------
document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);
        const isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        button.textContent = isHidden ? "숨김" : "표시";
    });
});

// ---------------------------------------------------------------------
// Supabase 의 영어 오류 메시지를 한국어 안내로 변환
//   - 자주 나오는 메시지를 매칭해 사용자 친화적으로 바꿔 줍니다.
// ---------------------------------------------------------------------
function toKoreanError(message) {
    // 이메일/비밀번호 불일치
    if (message.includes("Invalid login credentials")) {
        return "이메일 또는 비밀번호가 일치하지 않습니다.";
    }
    // 이메일 인증 미완료
    if (message.includes("Email not confirmed")) {
        return "이메일 인증이 완료되지 않았습니다. 메일함에서 인증을 완료해 주세요.";
    }
    // 요청이 너무 잦을 때
    if (message.includes("too many requests") || message.includes("rate limit")) {
        return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
    }
    // 그 외: 원문을 함께 보여줌
    return "로그인에 실패했습니다. (" + message + ")";
}

// ---------------------------------------------------------------------
// 폼 제출(로그인) 처리
// ---------------------------------------------------------------------
form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const email = form.email.value.trim();
    const password = form.password.value;

    // 1) 필수 입력 검사
    if (!email || !password) {
        showMessage("이메일과 비밀번호를 모두 입력해 주세요.");
        return;
    }

    setLoading(true);

    try {
        // 2) Supabase 인증으로 로그인
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            // 영어 오류 메시지를 한국어로 변환해 표시
            throw new Error(toKoreanError(error.message));
        }

        const userId = data.user.id;

        // 3) member 테이블에서 role 조회
        //    single(): 결과가 정확히 1행이라고 가정하고 객체 하나로 반환
        const { data: memberRow, error: memberError } = await supabase
            .from("member")
            .select("role")
            .eq("id", userId)
            .single();

        if (memberError) {
            throw new Error("회원 정보를 불러오지 못했습니다.");
        }

        // 4) role 에 따라 이동할 페이지 결정
        showMessage("로그인 성공! 이동합니다.", "success");
        const target = memberRow.role === "admin" ? "member.html" : "mypage.html";

        setTimeout(() => {
            window.location.href = target;
        }, 800);
    } catch (err) {
        showMessage(err.message);
    } finally {
        setLoading(false);
    }
});
