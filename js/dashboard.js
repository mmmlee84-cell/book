/* =====================================================================
   대시보드 데이터 조회 (Supabase)
   - book 테이블   : 내가 읽은 책 목록 (book_ex 와 동일)
   - posts 테이블  : 독후감/서평 (board_ex 와 동일)
   두 테이블을 함께 불러와 '내 서재' 홈 화면을 채운다.
   ===================================================================== */

// board_ex / book_ex 와 동일한 Supabase 프로젝트 값
const SUPABASE_URL = "https://cbpxesevkjqenhriumfm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_FDubU2pFp8nA7n2I2ARjdQ_65HWe9Lt";

// SDK 로드 확인
const sb =
    window.supabase && window.supabase.createClient
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        : null;

// ---------- 유틸 ----------
function escapeHtml(str) {
    return String(str == null ? "" : str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// created_at → 'YYYY.MM.DD'
function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return "";
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setMsg(container, message, isError) {
    container.innerHTML =
        '<p class="panel-msg' + (isError ? " error" : "") + '">' +
        escapeHtml(message) +
        "</p>";
}

// ============================================================
// 책 데이터: 통계 + 최근 등록한 책
// ============================================================
async function loadBooks() {
    const recentBox = document.getElementById("recent-books");

    if (!sb) {
        setText("stat-books", "-");
        setText("stat-month", "-");
        setMsg(recentBox, "Supabase SDK를 불러오지 못했습니다.", true);
        return;
    }

    try {
        // book 테이블 전체 조회 (최신 등록이 뒤쪽 → 내림차순으로 최근 것 확인)
        const { data, error } = await sb
            .from("book")
            .select("book_id, month, title, author")
            .order("book_id", { ascending: false });

        if (error) throw error;

        const books = data || [];

        // 통계: 전체 / 이번 달
        setText("stat-books", books.length);
        const thisMonthLabel = new Date().getMonth() + 1 + "월"; // 예: '7월'
        const monthCount = books.filter((b) => (b.month || "").trim() === thisMonthLabel).length;
        setText("stat-month", monthCount);

        // 최근 등록한 책 5권
        if (books.length === 0) {
            setMsg(recentBox, "아직 등록한 책이 없습니다.");
            return;
        }
        recentBox.innerHTML = books
            .slice(0, 5)
            .map(
                (b) => `
            <div class="mini-item">
                <span class="month-badge">${escapeHtml(b.month || "-")}</span>
                <div class="mini-item__body">
                    <div class="mini-item__title">${escapeHtml(b.title || "(제목 없음)")}</div>
                    <div class="mini-item__sub">${escapeHtml(b.author || "")}</div>
                </div>
            </div>`
            )
            .join("");
    } catch (err) {
        console.error(err);
        setText("stat-books", "-");
        setText("stat-month", "-");
        setMsg(recentBox, "책 목록을 불러오지 못했습니다.", true);
    }
}

// ============================================================
// 독후감 데이터: 통계 + 최근 독후감
// ============================================================
async function loadReviews() {
    const recentBox = document.getElementById("recent-reviews");

    if (!sb) {
        setText("stat-reviews", "-");
        setMsg(recentBox, "Supabase SDK를 불러오지 못했습니다.", true);
        return;
    }

    try {
        const { data, error } = await sb
            .from("posts")
            .select("id, title, writer, view_count, created_at")
            .order("created_at", { ascending: false });

        if (error) throw error;

        const posts = data || [];
        setText("stat-reviews", posts.length);

        if (posts.length === 0) {
            setMsg(recentBox, "아직 작성한 독후감이 없습니다.");
            return;
        }
        // 최근 독후감 5개 → 클릭 시 board_ex 상세페이지로 이동
        recentBox.innerHTML = posts
            .slice(0, 5)
            .map(
                (p) => `
            <a class="review-item" href="board_ex/detail.html?id=${encodeURIComponent(p.id)}">
                <div class="review-item__title">${escapeHtml(p.title || "(제목 없음)")}</div>
                <div class="review-item__meta">
                    <span>${escapeHtml(p.writer || "익명")}</span>
                    <span>${formatDate(p.created_at)}</span>
                    <span>조회 ${Number(p.view_count || 0)}</span>
                </div>
            </a>`
            )
            .join("");
    } catch (err) {
        console.error(err);
        setText("stat-reviews", "-");
        setMsg(recentBox, "독후감을 불러오지 못했습니다.", true);
    }
}

// ============================================================
// 실행
// ============================================================
loadBooks();
loadReviews();
