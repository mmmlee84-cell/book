// ===== DOM 요소 가져오기 =====
const editForm = document.getElementById('editForm');    // 서평 수정 폼
const titleInput = document.getElementById('title');     // 제목
const writerInput = document.getElementById('writer');   // 작성자
const contentInput = document.getElementById('content'); // 내용
const errorBox = document.getElementById('errorBox');    // 오류 메시지 영역
const cancelBtn = document.getElementById('cancelBtn');  // 취소 버튼
const listBtn = document.getElementById('listBtn');      // 목록 버튼

// ===== URL 에서 id 값 가져오기 =====
// 예: edit.html?id=3  ->  id = "3"
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

// ===== 기존 서평 불러오기 (폼에 채우기) =====
async function loadPost() {
    clearError();

    // id 값이 없으면 잘못된 접근
    if (!postId) {
        showError('잘못된 접근입니다. 서평 번호가 없습니다.');
        return;
    }

    try {
        // select() + eq() 로 id 가 일치하는 서평 한 건 조회
        const { data, error } = await supabaseClient
            .from('posts')
            .select('title, writer, content')
            .eq('id', postId)
            .single();

        if (error) {
            throw error;
        }

        // 폼에 기존 값 채우기
        titleInput.value = data.title;
        writerInput.value = data.writer;
        contentInput.value = data.content;
    } catch (err) {
        console.error(err);
        showError('서평을 불러오는 중 오류가 발생했습니다: ' + err.message);
    }
}

// ===== 폼 제출(수정) 이벤트 =====
editForm.addEventListener('submit', async (event) => {
    // 폼 기본 동작(새로고침) 막기
    event.preventDefault();
    clearError();

    // 입력값 가져오기 (앞뒤 공백 제거)
    const title = titleInput.value.trim();
    const writer = writerInput.value.trim();
    const content = contentInput.value.trim();

    // ===== 필수 입력값 검사 =====
    if (!title || !writer || !content) {
        showError('제목, 작성자, 내용을 모두 입력해 주세요.');
        return;
    }

    try {
        // ===== update() + eq() 로 해당 서평 수정 =====
        const { error } = await supabaseClient
            .from('posts')
            .update({
                title: title,
                writer: writer,
                content: content,
                updated_at: new Date().toISOString(), // 수정일 갱신
            })
            .eq('id', postId);

        if (error) {
            throw error;
        }

        // ===== 수정 성공 =====
        alert('서평이 수정되었습니다.');
        // 상세 페이지로 이동
        window.location.href = 'detail.html?id=' + postId;
    } catch (err) {
        console.error(err);
        showError('서평 수정 중 오류가 발생했습니다: ' + err.message);
    }
});

// ===== 취소 버튼 → 상세 페이지로 이동 =====
cancelBtn.addEventListener('click', () => {
    window.location.href = 'detail.html?id=' + postId;
});

// ===== 목록 버튼 → 목록 페이지로 이동 =====
listBtn.addEventListener('click', () => {
    window.location.href = 'board.html';
});

// ===== 페이지 로딩 시 기존 서평 불러오기 =====
loadPost();
