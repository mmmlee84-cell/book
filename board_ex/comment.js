// ===== DOM 요소 가져오기 =====
const commentForm = document.getElementById('commentForm');       // 댓글 작성 폼
const commentWriter = document.getElementById('commentWriter');   // 작성자 입력칸
const commentContent = document.getElementById('commentContent'); // 댓글 내용 입력칸
const commentList = document.getElementById('commentList');       // 댓글 목록 영역
const commentError = document.getElementById('commentError');     // 댓글 오류 메시지 영역

// ===== URL 에서 게시글 id(post_id) 가져오기 =====
// 예: detail.html?id=3  ->  postId = "3"
const commentParams = new URLSearchParams(window.location.search);
const commentPostId = commentParams.get('id');

// ===== 오류 메시지 표시 함수 =====
function showCommentError(message) {
    commentError.textContent = message;
    commentError.hidden = false;
}

// ===== 오류 메시지 숨기기 함수 =====
function clearCommentError() {
    commentError.hidden = true;
    commentError.textContent = '';
}

// ===== 날짜 포맷 함수 (YYYY-MM-DD HH:mm) =====
function formatCommentDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
           `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ===== HTML 이스케이프 (XSS 방지) =====
function escapeCommentHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

// ===== 댓글 목록 렌더링 =====
function renderComments(comments) {
    // 댓글이 없을 때
    if (!comments || comments.length === 0) {
        commentList.innerHTML =
            '<li class="comment-empty">등록된 댓글이 없습니다.</li>';
        return;
    }

    // 댓글 목록을 <li> 로 만들어 출력
    // 각 <li> 에는 댓글 id 를 data-id 로 저장하고, "수정" 버튼을 넣는다.
    commentList.innerHTML = comments
        .map(
            (comment) => `
        <li class="comment-item" data-id="${comment.id}">
            <div class="comment-meta">
                <strong class="comment-name">${escapeCommentHtml(comment.writer)}</strong>
                <span class="comment-date">${formatCommentDate(comment.created_at)}</span>
                <button type="button"
                        class="btn btn-edit comment-edit-btn"
                        data-id="${comment.id}"
                        style="margin-left:auto; padding:4px 10px; font-size:0.8rem;">수정</button>
                <button type="button"
                        class="btn btn-danger comment-delete-btn"
                        data-id="${comment.id}"
                        style="padding:4px 10px; font-size:0.8rem;">삭제</button>
            </div>
            <div class="comment-text">${escapeCommentHtml(comment.content)}</div>
        </li>`
        )
        .join('');
}

// ===== 댓글 목록 조회 함수 =====
// select() + eq() + order() 로 해당 게시글의 댓글을 등록순으로 조회
async function loadComments() {
    clearCommentError();

    // 게시글 id 가 없으면 조회 불가
    if (!commentPostId) {
        showCommentError('게시글 번호가 없어 댓글을 불러올 수 없습니다.');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('comments')
            .select('id, writer, content, created_at')
            .eq('post_id', commentPostId)          // 이 게시글의 댓글만
            .order('created_at', { ascending: true }); // 오래된 순(등록순)

        if (error) {
            throw error;
        }

        renderComments(data);
    } catch (err) {
        console.error(err);
        commentList.innerHTML =
            '<li class="comment-empty">댓글을 불러오지 못했습니다.</li>';
        showCommentError('댓글을 불러오는 중 오류가 발생했습니다: ' + err.message);
    }
}

// ===== 댓글 등록(작성) 이벤트 =====
commentForm.addEventListener('submit', async (event) => {
    // 폼 기본 동작(새로고침) 막기
    event.preventDefault();
    clearCommentError();

    // 입력값 가져오기 (앞뒤 공백 제거)
    const writer = commentWriter.value.trim();
    const content = commentContent.value.trim();

    // ===== 필수 입력값 검사 =====
    if (!writer || !content) {
        showCommentError('작성자와 댓글 내용을 모두 입력해 주세요.');
        return;
    }

    try {
        // ===== comments 테이블에 댓글 저장 =====
        // insert() 로 새 댓글 한 건을 추가 (post_id 에 현재 게시글 id 사용)
        const { error } = await supabaseClient
            .from('comments')
            .insert([
                {
                    post_id: commentPostId,
                    writer: writer,
                    content: content,
                },
            ]);

        if (error) {
            throw error;
        }

        // 입력칸 초기화
        commentWriter.value = '';
        commentContent.value = '';

        // ===== 등록 후 댓글 목록 다시 조회 =====
        await loadComments();
    } catch (err) {
        console.error(err);
        showCommentError('댓글 등록 중 오류가 발생했습니다: ' + err.message);
    }
});

// =========================================================
// 댓글 수정 기능
// =========================================================

// ===== 수정 모드로 전환 (댓글 id 로 현재 내용을 조회해 입력칸에 채움) =====
// select() + eq() 로 해당 댓글 한 건을 조회한다.
async function enterEditMode(commentId) {
    clearCommentError();

    try {
        // 댓글 id 로 현재 내용 조회
        const { data, error } = await supabaseClient
            .from('comments')
            .select('content')
            .eq('id', commentId)
            .single();

        if (error) {
            throw error;
        }

        // 해당 댓글 <li> 를 찾는다.
        const item = commentList.querySelector(`.comment-item[data-id="${commentId}"]`);
        if (!item) return;

        // 댓글 내용 영역(.comment-text)을 수정 폼으로 교체한다.
        const textArea = item.querySelector('.comment-text');
        textArea.innerHTML = `
            <textarea class="form-textarea comment-edit-input" rows="3">${escapeCommentHtml(data.content)}</textarea>
            <div class="comment-edit-actions" style="display:flex; gap:8px; margin-top:8px;">
                <button type="button" class="btn btn-primary comment-save-btn" data-id="${commentId}"
                        style="padding:4px 12px; font-size:0.85rem;">저장</button>
                <button type="button" class="btn btn-cancel comment-cancel-btn"
                        style="padding:4px 12px; font-size:0.85rem;">취소</button>
            </div>`;

        // 수정 버튼은 숨긴다 (수정 중 중복 클릭 방지)
        const editBtn = item.querySelector('.comment-edit-btn');
        if (editBtn) editBtn.style.display = 'none';
    } catch (err) {
        console.error(err);
        showCommentError('댓글을 불러오는 중 오류가 발생했습니다: ' + err.message);
    }
}

// ===== 댓글 수정 저장 (update + eq) =====
async function saveComment(commentId, newContent) {
    clearCommentError();

    // 필수 입력 검사
    const content = newContent.trim();
    if (!content) {
        showCommentError('댓글 내용을 입력해 주세요.');
        return;
    }

    try {
        // update() + eq() 로 해당 댓글의 내용(content)만 수정
        const { error } = await supabaseClient
            .from('comments')
            .update({
                content: content,
                updated_at: new Date().toISOString(), // 수정일 갱신
            })
            .eq('id', commentId);

        if (error) {
            throw error;
        }

        // ===== 수정 완료 후 댓글 목록 다시 조회 =====
        await loadComments();
    } catch (err) {
        console.error(err);
        showCommentError('댓글 수정 중 오류가 발생했습니다: ' + err.message);
    }
}

// ===== 댓글 삭제 (delete + eq) =====
async function deleteComment(commentId) {
    clearCommentError();

    // 삭제 확인 메시지 표시 (확인을 누르지 않으면 중단)
    if (!confirm('이 댓글을 삭제하시겠습니까?')) {
        return;
    }

    try {
        // delete() + eq() 로 댓글 id 가 일치하는 댓글 삭제
        const { error } = await supabaseClient
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) {
            throw error;
        }

        // ===== 삭제 완료 후 댓글 목록 다시 조회 =====
        await loadComments();
    } catch (err) {
        console.error(err);
        showCommentError('댓글 삭제 중 오류가 발생했습니다: ' + err.message);
    }
}

// ===== 댓글 목록 영역의 클릭 이벤트 처리 (이벤트 위임) =====
// 수정/저장/취소 버튼은 목록을 다시 그릴 때마다 새로 생기므로,
// 상위 요소(commentList)에서 클릭을 한 번에 처리한다.
commentList.addEventListener('click', (event) => {
    const target = event.target;

    // 1) 수정 버튼 클릭 → 수정 모드로 전환
    if (target.classList.contains('comment-edit-btn')) {
        enterEditMode(target.dataset.id);
        return;
    }

    // 2) 저장 버튼 클릭 → 수정 내용 저장
    if (target.classList.contains('comment-save-btn')) {
        // 같은 댓글 <li> 안의 입력칸 값을 가져온다.
        const item = target.closest('.comment-item');
        const input = item.querySelector('.comment-edit-input');
        saveComment(target.dataset.id, input.value);
        return;
    }

    // 3) 취소 버튼 클릭 → 목록을 다시 그려 원래 화면으로 되돌림
    if (target.classList.contains('comment-cancel-btn')) {
        loadComments();
        return;
    }

    // 4) 삭제 버튼 클릭 → 확인 후 댓글 삭제
    if (target.classList.contains('comment-delete-btn')) {
        deleteComment(target.dataset.id);
        return;
    }
});

// ===== 페이지 로딩 시 댓글 목록 조회 =====
loadComments();
