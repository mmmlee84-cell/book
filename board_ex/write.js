// ===== DOM 요소 가져오기 =====
const writeForm = document.getElementById('writeForm');   // 글쓰기 폼
const titleInput = document.getElementById('title');      // 제목 입력칸
const writerInput = document.getElementById('writer');    // 작성자 입력칸
const contentInput = document.getElementById('content');  // 내용 입력칸
const errorBox = document.getElementById('errorBox');     // 오류 메시지 영역
const listBtn = document.getElementById('listBtn');       // 목록 버튼

// ===== 오류 메시지 표시 함수 =====
function showError(message) {
    errorBox.textContent = message;  // 메시지 넣기
    errorBox.hidden = false;         // 영역 보이기
}

// ===== 오류 메시지 숨기기 함수 =====
function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = '';
}

// ===== 폼 제출(저장) 이벤트 =====
// async/await 를 쓰기 위해 async 함수로 작성
writeForm.addEventListener('submit', async (event) => {
    // 폼의 기본 동작(페이지 새로고침) 막기
    event.preventDefault();

    // 이전 오류 메시지 초기화
    clearError();

    // 입력값 가져오기 (앞뒤 공백 제거)
    const title = titleInput.value.trim();
    const writer = writerInput.value.trim();
    const content = contentInput.value.trim();

    // ===== 필수 입력값 검사 =====
    if (!title || !writer || !content) {
        showError('제목, 작성자, 내용을 모두 입력해 주세요.');
        return; // 값이 비어 있으면 여기서 중단
    }

    try {
        // ===== Supabase posts 테이블에 데이터 저장 =====
        // insert() 로 새 서평 한 건을 추가한다.
        const { error } = await supabaseClient
            .from('posts')
            .insert([
                {
                    title: title,
                    writer: writer,
                    content: content,
                },
            ]);

        // Supabase 에서 오류를 돌려주면 catch 로 넘긴다.
        if (error) {
            throw error;
        }

        // ===== 등록 성공 =====
        alert('서평이 등록되었습니다.');
        // 목록 페이지로 이동
        window.location.href = 'board.html';
    } catch (err) {
        // ===== 오류 처리 =====
        console.error(err); // 콘솔에 자세한 오류 출력
        showError('서평 등록 중 오류가 발생했습니다: ' + err.message); // 화면에 출력
    }
});

// ===== 목록 버튼 클릭 → 목록 페이지로 이동 =====
listBtn.addEventListener('click', () => {
    window.location.href = 'board.html';
});
