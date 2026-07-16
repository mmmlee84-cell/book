// ===== DOM 요소 가져오기 =====
const errorBox = document.getElementById('errorBox');       // 오류 메시지 영역
const detailBox = document.getElementById('detailBox');     // 상세 내용 전체 영역
const detailTitle = document.getElementById('detailTitle'); // 제목
const detailWriter = document.getElementById('detailWriter');// 작성자
const detailViews = document.getElementById('detailViews');  // 조회수
const detailDate = document.getElementById('detailDate');    // 등록일
const detailContent = document.getElementById('detailContent'); // 내용

const editBtn = document.getElementById('editBtn');     // 수정 버튼
const deleteBtn = document.getElementById('deleteBtn'); // 삭제 버튼
const listBtn = document.getElementById('listBtn');     // 목록 버튼

// ===== URL 에서 id 값 가져오기 =====
// 예: detail.html?id=3  ->  id = "3"
const params = new URLSearchParams(window.location.search);
const postId = params.get('id');

// ===== 오류 메시지 표시 함수 =====
function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
}

// ===== 오류 메시지 숨기기 함수 =====
function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = '';
}

// ===== 날짜 포맷 함수 (YYYY-MM-DD HH:mm) =====
function formatDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
           `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ===== 조회수 1 증가 함수 =====
// update() + eq() 로 해당 서평의 view_count 를 갱신한다.
async function increaseViewCount(currentViews) {
    try {
        await supabaseClient
            .from('posts')
            .update({ view_count: currentViews + 1 }) // 현재값 + 1
            .eq('id', postId);                        // id 가 일치하는 행만
    } catch (err) {
        // 조회수 증가 실패는 화면 표시를 막지 않고 콘솔에만 기록
        console.error('조회수 증가 실패:', err);
    }
}

// ===== 서평 상세 조회 함수 =====
async function loadPost() {
    clearError();

    // id 값이 없으면 잘못된 접근
    if (!postId) {
        showError('잘못된 접근입니다. 서평 번호가 없습니다.');
        return;
    }

    try {
        // select() + eq() 로 id 가 일치하는 서평 한 건 조회
        // single() : 결과를 배열이 아닌 하나의 객체로 받는다.
        const { data, error } = await supabaseClient
            .from('posts')
            .select('id, title, writer, content, view_count, created_at')
            .eq('id', postId)
            .single();

        if (error) {
            throw error;
        }

        // 화면에 데이터 표시
        detailTitle.textContent = data.title;
        detailWriter.textContent = data.writer;
        detailViews.textContent = (data.view_count ?? 0) + 1; // 증가된 값 미리 표시
        detailDate.textContent = formatDate(data.created_at);
        detailContent.textContent = data.content;

        // 상세 영역 보이기
        detailBox.hidden = false;

        // 조회수 1 증가 (DB 반영)
        await increaseViewCount(data.view_count ?? 0);
    } catch (err) {
        console.error(err);
        showError('서평을 불러오는 중 오류가 발생했습니다: ' + err.message);
    }
}

// ===== 서평 삭제 함수 =====
async function deletePost() {
    // 사용자에게 삭제 여부 확인
    if (!confirm('정말 삭제하시겠습니까?')) {
        return;
    }

    try {
        // delete() + eq() 로 id 가 일치하는 서평 삭제
        const { error } = await supabaseClient
            .from('posts')
            .delete()
            .eq('id', postId);

        if (error) {
            throw error;
        }

        alert('서평이 삭제되었습니다.');
        window.location.href = 'board.html'; // 목록으로 이동
    } catch (err) {
        console.error(err);
        showError('서평 삭제 중 오류가 발생했습니다: ' + err.message);
    }
}

// ===== 버튼 이벤트 연결 =====

// 수정 버튼 → edit.html 로 이동 (id 값 전달)
editBtn.addEventListener('click', () => {
    window.location.href = 'edit.html?id=' + postId;
});

// 삭제 버튼 → 서평 삭제
deleteBtn.addEventListener('click', deletePost);

// 목록 버튼 → board.html 로 이동
listBtn.addEventListener('click', () => {
    window.location.href = 'board.html';
});

// ===== 페이지 로딩 시 상세 조회 실행 =====
loadPost();
