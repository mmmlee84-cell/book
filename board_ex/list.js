// DOM 요소
const postList = document.getElementById('postList');
const errorBox = document.getElementById('errorBox');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const writeBtn = document.getElementById('writeBtn');

// 오류 메시지 표시
function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
}

// 오류 메시지 숨김
function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = '';
}

// 날짜 포맷 (YYYY-MM-DD) - 목록에서는 날짜만 표시해 좁은 화면에서도 깨지지 않게 한다
function formatDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

// 서평 목록 렌더링
function renderPosts(posts) {
    if (!posts || posts.length === 0) {
        postList.innerHTML =
            '<tr><td colspan="5" class="empty">등록된 서평이 없습니다.</td></tr>';
        return;
    }

    // 화면에 보이는 "번호"는 DB의 id 대신 순서대로 매긴다.
    // 최신순 정렬이므로, 맨 위(최신) 글이 가장 큰 번호를 갖도록 계산한다.
    // (삭제해도 번호에 빈 칸이 생기지 않는다. 상세 이동은 실제 id 사용)
    postList.innerHTML = posts
        .map(
            (post, index) => `
        <tr>
            <td class="col-id">${posts.length - index}</td>
            <td class="col-title">
                <a class="post-title-link" href="detail.html?id=${post.id}">
                    ${escapeHtml(post.title)}
                </a>
            </td>
            <td class="col-writer">${escapeHtml(post.writer)}</td>
            <td class="col-views">${post.view_count ?? 0}</td>
            <td class="col-date">${formatDate(post.created_at)}</td>
        </tr>`
        )
        .join('');
}

// 서평 조회 (최신순 정렬 + 제목 검색)
async function loadPosts(keyword = '') {
    clearError();
    postList.innerHTML =
        '<tr><td colspan="5" class="empty">불러오는 중...</td></tr>';

    try {
        let query = supabaseClient
            .from('posts')
            .select('id, title, writer, view_count, created_at')
            .order('created_at', { ascending: false }); // 최신순 정렬

        // 제목 검색 (부분 일치, 대소문자 무시)
        const trimmed = keyword.trim();
        if (trimmed) {
            query = query.ilike('title', `%${trimmed}%`);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        renderPosts(data);
    } catch (err) {
        console.error(err);
        postList.innerHTML =
            '<tr><td colspan="5" class="empty">데이터를 불러오지 못했습니다.</td></tr>';
        showError('서평을 불러오는 중 오류가 발생했습니다: ' + err.message);
    }
}

// 검색 폼 제출
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loadPosts(searchInput.value);
});

// 글쓰기 버튼 → 작성 페이지 이동
writeBtn.addEventListener('click', () => {
    window.location.href = 'write.html';
});

// 초기 로딩
loadPosts();
