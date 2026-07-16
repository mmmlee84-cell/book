// ============================================================
// Supabase 설정 — 본인 프로젝트 값으로 교체하세요.
//   Supabase 대시보드 > Project Settings > API 에서 확인
// ============================================================
const SUPABASE_URL = "https://cbpxesevkjqenhriumfm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_FDubU2pFp8nA7n2I2ARjdQ_65HWe9Lt";

const BUCKET = "bgallery"; // 스토리지 버킷명
const TABLE = "bgallery";  // 테이블명

// ------------------------------------------------------------
// DOM 참조
// ------------------------------------------------------------
const form = document.getElementById("upload-form");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("description");
const imageInput = document.getElementById("image");
const previewWrapper = document.getElementById("preview-wrapper");
const preview = document.getElementById("preview");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");

// ------------------------------------------------------------
// 상태 메시지 헬퍼
// ------------------------------------------------------------
function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = "status" + (type ? " " + type : "");
}

// ------------------------------------------------------------
// Supabase 클라이언트 생성 (SDK 로드 확인)
// ------------------------------------------------------------
let supabase = null;
if (window.supabase && window.supabase.createClient) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  setStatus("준비됨 — 정보를 입력하고 등록하세요.", "success");
} else {
  setStatus("Supabase SDK를 불러오지 못했습니다. 인터넷 연결을 확인하세요.", "error");
}

// ------------------------------------------------------------
// 파일 선택 시 미리보기
// ------------------------------------------------------------
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) {
    previewWrapper.hidden = true;
    preview.removeAttribute("src");
    return;
  }
  preview.src = URL.createObjectURL(file);
  previewWrapper.hidden = false;
});

// ------------------------------------------------------------
// 폼 제출 → 업로드 + DB 저장
// ------------------------------------------------------------
form.addEventListener("submit", async (event) => {
  event.preventDefault(); // 새로고침 방지 (항상 최우선 실행)

  if (!supabase) {
    setStatus("Supabase가 준비되지 않았습니다. 페이지를 새로고침하세요.", "error");
    return;
  }

  const title = titleInput.value.trim();
  const description = descInput.value.trim();
  const file = imageInput.files[0];

  if (!title || !file) {
    setStatus("제목과 이미지 파일은 필수입니다.", "error");
    return;
  }

  submitBtn.disabled = true;
  setStatus("업로드 중...");

  try {
    // 1) 파일명 중복 방지를 위한 고유 이름 생성
    const ext = file.name.split(".").pop();
    const imageName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // 2) Storage 업로드
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(imageName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 3) 공개 URL 획득
    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(imageName);

    const imageUrl = publicData.publicUrl;

    // 4) 테이블에 저장
    const { error: insertError } = await supabase.from(TABLE).insert({
      title,
      image_name: imageName,
      image_url: imageUrl,
      description,
    });

    if (insertError) throw insertError;

    // 5) 완료 처리
    setStatus("등록이 완료되었습니다!", "success");
    form.reset();
    previewWrapper.hidden = true;
    preview.removeAttribute("src");
  } catch (err) {
    console.error(err);
    setStatus("오류가 발생했습니다: " + (err.message || err), "error");
  } finally {
    submitBtn.disabled = false;
  }
});
