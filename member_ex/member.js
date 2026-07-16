// =====================================================================
// 회원 관리(member) 로직 — 관리자 전용
//   흐름: 로그인 확인 → 관리자 확인 → 회원 목록 조회/검색/렌더링 → 로그아웃
// =====================================================================

import { supabase } from "./supabase.js";

// ---------------------------------------------------------------------
// 요소 미리 찾기
// ---------------------------------------------------------------------
const messageEl = document.getElementById("message");
const tbody = document.getElementById("member-tbody");
const searchInput = document.getElementById("search-input");
const refreshBtn = document.getElementById("refresh-btn");
const logoutBtn = document.getElementById("logout-btn");

// ---------------------------------------------------------------------
// 메시지 표시 / 숨김
// ---------------------------------------------------------------------
function showMessage(text, type = "info") {
    messageEl.textContent = text;
    // info 는 기본 스타일, error/success 는 색상 클래스 부여
    messageEl.className = type === "info" ? "message" : "message message--" + type;
    messageEl.hidden = false;
}

function hideMessage() {
    messageEl.hidden = true;
}

// ---------------------------------------------------------------------
// HTML 특수문자 이스케이프
//   - 이름/이메일 등에 <, > 가 있어도 안전하게 표시 (XSS 방지)
// ---------------------------------------------------------------------
function escapeHtml(value) {
    if (!value) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// 값이 없으면 "-"
function orDash(value) {
    return value ? escapeHtml(value) : "-";
}

// ---------------------------------------------------------------------
// 회원 목록 조회 + 렌더링
//   keyword: 검색어 (이름 또는 이메일). 빈 문자열이면 전체 조회.
// ---------------------------------------------------------------------
async function loadMembers(keyword = "") {
    // 조회 시작 → 로딩 메시지, 기존 행 비우기
    tbody.innerHTML = "";
    showMessage("불러오는 중...");

    // 기본 쿼리: 최근 가입 순
    let query = supabase
        .from("member")
        .select("id, name, email, phone, address, role")
        .order("created_at", { ascending: false });

    // 검색어가 있으면 이름 또는 이메일에 대해 부분 일치(ilike, 대소문자 무시)
    const trimmed = keyword.trim();
    if (trimmed) {
        query = query.or(`name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`);
    }

    const { data: members, error } = await query;

    // 조회 오류 표시 (요구사항 14)
    if (error) {
        showMessage("조회 중 오류가 발생했습니다: " + error.message, "error");
        return;
    }

    // 결과 없음 (요구사항 13)
    if (!members || members.length === 0) {
        showMessage("등록된 회원이 없습니다.");
        return;
    }

    // 행 그리기
    const rows = members.map((m) => {
        // 프로필: 이름 첫 글자 (이름이 없으면 "?")
        const initial = m.name ? escapeHtml(m.name.charAt(0)) : "?";

        // 권한 배지
        const isAdmin = m.role === "admin";
        const badgeClass = isAdmin ? "role-badge--admin" : "role-badge--user";
        const badgeText = isAdmin ? "관리자" : "일반";

        return `
            <tr>
                <td><span class="avatar-initial">${initial}</span></td>
                <td>${orDash(m.name)}</td>
                <td>${orDash(m.email)}</td>
                <td>${orDash(m.phone)}</td>
                <td>${orDash(m.address)}</td>
                <td><span class="role-badge ${badgeClass}">${badgeText}</span></td>
            </tr>
        `;
    });

    tbody.innerHTML = rows.join("");
    hideMessage();
}

// ---------------------------------------------------------------------
// 페이지 초기화: 로그인 + 관리자 권한 확인
// ---------------------------------------------------------------------
async function init() {
    // 1) 로그인 여부 확인
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = "login.html";
        return;
    }

    // 2) 관리자 권한 확인
    const { data: me, error } = await supabase
        .from("member")
        .select("role")
        .eq("id", session.user.id)
        .single();

    if (error || !me || me.role !== "admin") {
        // 관리자가 아니면 안내 후 로그인 페이지로 이동
        showMessage("관리자만 접근할 수 있습니다. 로그인 페이지로 이동합니다.", "error");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return;
    }

    // 3) 첫 목록 조회
    loadMembers();
}

// ---------------------------------------------------------------------
// 검색: 입력할 때마다 자동 조회 (디바운스로 과도한 요청 방지)
// ---------------------------------------------------------------------
let debounceTimer;
searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    // 입력이 멈춘 뒤 300ms 후에 조회
    debounceTimer = setTimeout(() => {
        loadMembers(searchInput.value);
    }, 300);
});

// ---------------------------------------------------------------------
// 새로고침: 현재 검색어 기준으로 다시 조회
// ---------------------------------------------------------------------
refreshBtn.addEventListener("click", () => {
    loadMembers(searchInput.value);
});

// ---------------------------------------------------------------------
// 로그아웃
// ---------------------------------------------------------------------
logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    await supabase.auth.signOut();
    window.location.href = "login.html";
});

// 페이지 로드 시 실행
init();
