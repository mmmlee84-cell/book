// ============================================================
// 1. Supabase JavaScript SDK 불러오기
//    - CDN(jsdelivr)에서 SDK를 ES 모듈 형태로 가져옵니다.
//    - 이 때문에 book.html에서 <script type="module"> 로 연결했습니다.
// ============================================================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ============================================================
// 2. Supabase 프로젝트와 연결하기
//    - 아래 두 값은 Supabase 대시보드의
//      [Project Settings] > [API] 메뉴에서 확인할 수 있습니다.
//    - 본인 프로젝트의 값으로 반드시 바꿔주세요.
// ============================================================
const SUPABASE_URL = "https://cbpxesevkjqenhriumfm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_FDubU2pFp8nA7n2I2ARjdQ_65HWe9Lt";

// Supabase 클라이언트(연결 통로) 생성
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// 3. 화면 요소(HTML 태그) 미리 가져오기
// ============================================================
const bookList = document.getElementById("book-list"); // 데이터가 들어갈 tbody
const bookTable = document.getElementById("book-table"); // 표 전체
const loadingEl = document.getElementById("loading"); // 로딩 문구
const errorEl = document.getElementById("error"); // 오류 문구

// 입력/수정 폼 관련 요소
const addForm = document.getElementById("add-form"); // 폼 전체
const inputMonth = document.getElementById("input-month"); // 월 입력칸
const inputTitle = document.getElementById("input-title"); // 책이름 입력칸
const inputAuthor = document.getElementById("input-author"); // 작가 입력칸

// 버튼들
const btnUpdate = document.getElementById("btn-update"); // 수정 버튼
const btnDelete = document.getElementById("btn-delete"); // 삭제 버튼
const btnClear = document.getElementById("btn-clear"); // 선택취소 버튼

// 선택 상태 안내 문구
const selectInfo = document.getElementById("select-info");

// 검색창
const searchInput = document.getElementById("search-input");

// 서버에서 불러온 전체 도서 데이터를 저장해 둘 변수
let allBooks = [];

// 현재 선택된 도서의 id (선택 안 했으면 null)
let selectedId = null;

// ============================================================
// 4. book 테이블에서 데이터를 불러오는 함수 (비동기 처리)
// ============================================================
async function getBooks() {
  try {
    // select() 메서드로 book 테이블의 모든(*) 데이터를 조회합니다.
    // book_id 기준으로 정렬해서 가져옵니다.
    const { data, error } = await supabase
      .from("book")
      .select("*")
      .order("book_id", { ascending: true });

    if (error) {
      throw error;
    }

    // 불러온 전체 데이터를 변수에 저장합니다.
    allBooks = data;

    // 데이터를 다 불러왔으니 로딩 문구는 숨기고 표는 보여줍니다.
    loadingEl.hidden = true;
    bookTable.hidden = false;
    errorEl.hidden = true;

    // 현재 검색어에 맞춰 화면에 그립니다.
    renderBooks(filterBooks(searchInput.value));
  } catch (err) {
    console.error("데이터 조회 중 오류 발생:", err.message);
    loadingEl.hidden = true;
    errorEl.hidden = false;
    errorEl.textContent = "데이터를 불러오지 못했습니다: " + err.message;
  }
}

// ============================================================
// 5. 검색어에 맞는 데이터만 걸러내는 함수
//    - 월 / 책이름 / 작가 중 하나라도 검색어를 포함하면 통과시킵니다.
// ============================================================
function filterBooks(keyword) {
  const word = keyword.trim().toLowerCase();

  // 검색어가 없으면 전체를 그대로 보여줍니다.
  if (word === "") {
    return allBooks;
  }

  return allBooks.filter((book) => {
    const month = (book.month ?? "").toLowerCase();
    const title = (book.title ?? "").toLowerCase();
    const author = (book.author ?? "").toLowerCase();
    return (
      month.includes(word) ||
      title.includes(word) ||
      author.includes(word)
    );
  });
}

// ============================================================
// 6. 조회한 데이터를 표(table)로 그리는 함수
// ============================================================
function renderBooks(books) {
  if (!books || books.length === 0) {
    bookList.innerHTML =
      '<tr><td colspan="3">표시할 도서가 없습니다.</td></tr>';
    return;
  }

  // 각 도서 정보를 <tr> 한 줄씩 만듭니다.
  // data-id 속성에 book_id를 저장해 두어, 클릭 시 어떤 책인지 알 수 있게 합니다.
  // 현재 선택된 책이면 'selected' 클래스를 붙여 노란색으로 강조합니다.
  bookList.innerHTML = books
    .map(
      (book) => `
      <tr data-id="${book.book_id}" class="${
        book.book_id === selectedId ? "selected" : ""
      }">
        <td>${book.month ?? ""}</td>
        <td>${book.title ?? ""}</td>
        <td>${book.author ?? ""}</td>
      </tr>
    `
    )
    .join("");
}

// ============================================================
// 7. 표에서 행을 클릭했을 때: 그 행을 선택 상태로 만듭니다.
// ============================================================
function selectRow(book) {
  selectedId = book.book_id;

  // 선택한 책의 값을 입력칸에 채워 넣습니다. (수정하기 편하도록)
  inputMonth.value = book.month ?? "";
  inputTitle.value = book.title ?? "";
  inputAuthor.value = book.author ?? "";

  // 수정/삭제/선택취소 버튼을 활성화합니다.
  btnUpdate.disabled = false;
  btnDelete.disabled = false;
  btnClear.disabled = false;

  // 안내 문구를 바꿔줍니다.
  selectInfo.textContent = `선택됨: ${book.month} / ${book.title} / ${book.author}`;

  // 선택 강조(노란색)를 다시 그립니다.
  renderBooks(filterBooks(searchInput.value));
}

// ============================================================
// 8. 선택을 해제하고 입력칸을 비우는 함수
// ============================================================
function clearSelection() {
  selectedId = null;
  addForm.reset(); // 모든 입력칸 비우기

  // 버튼들을 다시 비활성화합니다.
  btnUpdate.disabled = true;
  btnDelete.disabled = true;
  btnClear.disabled = true;

  selectInfo.textContent = "표에서 행을 클릭하면 수정/삭제할 수 있습니다.";

  renderBooks(filterBooks(searchInput.value));
}

// ============================================================
// 9. 새 도서 추가하기 (INSERT)
// ============================================================
async function addBook(event) {
  event.preventDefault(); // 폼 제출 시 새로고침 방지

  const month = inputMonth.value.trim();
  const title = inputTitle.value.trim();
  const author = inputAuthor.value.trim();

  if (!month || !title || !author) {
    alert("월, 책이름, 작가를 모두 입력해주세요.");
    return;
  }

  try {
    const { error } = await supabase
      .from("book")
      .insert([{ month, title, author }]);

    if (error) throw error;

    clearSelection(); // 입력칸 비우기 + 선택 해제
    await getBooks(); // 목록 새로고침
  } catch (err) {
    console.error("도서 추가 중 오류 발생:", err.message);
    errorEl.hidden = false;
    errorEl.textContent = "도서를 추가하지 못했습니다: " + err.message;
  }
}

// ============================================================
// 10. 선택한 도서 수정하기 (UPDATE)
// ============================================================
async function updateBook() {
  // 선택된 책이 없으면 아무것도 하지 않습니다.
  if (selectedId === null) return;

  const month = inputMonth.value.trim();
  const title = inputTitle.value.trim();
  const author = inputAuthor.value.trim();

  if (!month || !title || !author) {
    alert("월, 책이름, 작가를 모두 입력해주세요.");
    return;
  }

  try {
    // update() 로 값을 바꾸고, eq() 로 "book_id가 선택한 id인 행"만 수정합니다.
    const { error } = await supabase
      .from("book")
      .update({ month, title, author })
      .eq("book_id", selectedId);

    if (error) throw error;

    clearSelection();
    await getBooks();
  } catch (err) {
    console.error("도서 수정 중 오류 발생:", err.message);
    errorEl.hidden = false;
    errorEl.textContent = "도서를 수정하지 못했습니다: " + err.message;
  }
}

// ============================================================
// 11. 선택한 도서 삭제하기 (DELETE)
// ============================================================
async function deleteBook() {
  if (selectedId === null) return;

  // 실수로 지우는 것을 막기 위해 한 번 더 확인합니다.
  if (!confirm("정말 이 도서를 삭제하시겠습니까?")) return;

  try {
    // delete() 로 삭제하고, eq() 로 선택한 id의 행만 지웁니다.
    const { error } = await supabase
      .from("book")
      .delete()
      .eq("book_id", selectedId);

    if (error) throw error;

    clearSelection();
    await getBooks();
  } catch (err) {
    console.error("도서 삭제 중 오류 발생:", err.message);
    errorEl.hidden = false;
    errorEl.textContent = "도서를 삭제하지 못했습니다: " + err.message;
  }
}

// ============================================================
// 12. 이벤트 연결
// ============================================================
// 추가: 폼 제출
addForm.addEventListener("submit", addBook);

// 수정 / 삭제 / 선택취소 버튼
btnUpdate.addEventListener("click", updateBook);
btnDelete.addEventListener("click", deleteBook);
btnClear.addEventListener("click", clearSelection);

// 표에서 행을 클릭하면 그 행을 선택합니다.
// (tbody 하나에만 이벤트를 걸고, 클릭된 위치를 찾아내는 '이벤트 위임' 방식)
bookList.addEventListener("click", (event) => {
  const row = event.target.closest("tr"); // 클릭된 곳이 속한 <tr> 찾기
  if (!row || !row.dataset.id) return; // 데이터 행이 아니면 무시

  // data-id로 저장된 값(문자열)을 숫자로 바꿔 해당 책을 찾습니다.
  const id = Number(row.dataset.id);
  const book = allBooks.find((b) => b.book_id === id);
  if (book) selectRow(book);
});

// 검색창: 글자를 입력할 때마다 목록을 다시 걸러서 보여줍니다.
searchInput.addEventListener("input", () => {
  renderBooks(filterBooks(searchInput.value));
});

// ============================================================
// 13. 페이지가 열리면 데이터를 불러옵니다.
// ============================================================
getBooks();
