// ============================================================
// Supabase 설정 — upload.js 와 동일한 값 사용
// ============================================================
const SUPABASE_URL = "https://cbpxesevkjqenhriumfm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_FDubU2pFp8nA7n2I2ARjdQ_65HWe9Lt";

const TABLE = "bgallery"; // 조회 테이블명

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const tbody = document.getElementById("gallery-body");

// ------------------------------------------------------------
// 등록일 포맷: YYYY. MM. DD. 오전/오후 HH:MM:SS
// ------------------------------------------------------------
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

function formatDate(value) {
  if (!value) return "";
  return dateFormatter.format(new Date(value));
}

// ------------------------------------------------------------
// 목록 조회 및 렌더링
// ------------------------------------------------------------
async function loadGallery() {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("title, image_url, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="empty">등록된 이미지가 없습니다.</td></tr>`;
      return;
    }

    tbody.innerHTML = data
      .map(
        (row) => `
        <tr>
          <td>${escapeHtml(row.title)}</td>
          <td><img class="thumb" src="${row.image_url}" alt="${escapeHtml(row.title)}" /></td>
          <td>${formatDate(row.created_at)}</td>
        </tr>`
      )
      .join("");
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="3" class="empty error">불러오기 실패: ${escapeHtml(
      err.message || String(err)
    )}</td></tr>`;
  }
}

// XSS 방지용 간단한 이스케이프
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

loadGallery();
