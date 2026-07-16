// =====================================================================
// 내 정보(mypage) 로직
//   흐름: 로그인 확인 → 본인 member 정보 조회 → 화면 표시 → 로그아웃 처리
// =====================================================================

import { supabase } from "./supabase.js";

// ---------------------------------------------------------------------
// 요소 미리 찾기
// ---------------------------------------------------------------------
const profileSection = document.getElementById("profile");
const messageEl = document.getElementById("message");
const avatarEl = document.getElementById("profile-image");
const roleBadge = document.getElementById("role-badge");
const logoutBtn = document.getElementById("logout-btn");

// 프로필 이미지가 없을 때 사용할 기본 이미지 (외부 요청 없는 인라인 SVG)
const DEFAULT_AVATAR =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" viewBox="0 0 110 110">
            <rect width="110" height="110" fill="#e5e7eb"/>
            <circle cx="55" cy="43" r="22" fill="#9ca3af"/>
            <path d="M20 96c0-19 16-30 35-30s35 11 35 30z" fill="#9ca3af"/>
        </svg>`
    );

// ---------------------------------------------------------------------
// 값이 비어 있으면 "-" 로 표시하는 도우미
// ---------------------------------------------------------------------
function orDash(value) {
    return value ? value : "-";
}

// ---------------------------------------------------------------------
// 오류/안내 메시지 표시
// ---------------------------------------------------------------------
function showMessage(text, type = "error") {
    messageEl.textContent = text;
    messageEl.className = "message message--" + type;
    messageEl.hidden = false;
}

// ---------------------------------------------------------------------
// 페이지 초기화 (즉시 실행)
// ---------------------------------------------------------------------
async function init() {
    // 1) 로그인 여부 확인
    const { data: { session } } = await supabase.auth.getSession();

    // 로그인하지 않았다면 로그인 페이지로 이동
    if (!session) {
        window.location.href = "login.html";
        return;
    }

    const userId = session.user.id;

    // 2) 본인 회원 정보 조회
    const { data: member, error } = await supabase
        .from("member")
        .select("name, email, phone, address, profile_image, role")
        .eq("id", userId)
        .single();

    // 3) 조회 실패 → 안내 후 로그인 페이지로 이동
    if (error || !member) {
        showMessage("회원 정보를 불러오지 못했습니다. 로그인 페이지로 이동합니다.");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return;
    }

    // 4) 프로필 이미지 (없으면 기본 이미지)
    avatarEl.src = member.profile_image || DEFAULT_AVATAR;
    // 깨진 이미지 URL 대비: 로드 실패 시 기본 이미지로 대체
    avatarEl.onerror = () => {
        avatarEl.src = DEFAULT_AVATAR;
    };

    // 5) 권한 배지 (관리자 / 일반)
    if (member.role === "admin") {
        roleBadge.textContent = "관리자";
        roleBadge.classList.add("role-badge--admin");
    } else {
        roleBadge.textContent = "일반";
        roleBadge.classList.add("role-badge--user");
    }

    // 6) 정보 채우기 (빈 값은 "-")
    document.getElementById("v-name").textContent = orDash(member.name);
    document.getElementById("v-email").textContent = orDash(member.email);
    document.getElementById("v-phone").textContent = orDash(member.phone);
    document.getElementById("v-address").textContent = orDash(member.address);

    // 7) 로딩 메시지 숨기고 프로필 표시
    messageEl.hidden = true;
    profileSection.hidden = false;
}

// ---------------------------------------------------------------------
// 로그아웃: 세션 종료 후 로그인 페이지로 이동
// ---------------------------------------------------------------------
logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    await supabase.auth.signOut();
    window.location.href = "login.html";
});

// 페이지 로드 시 초기화 실행
init();
