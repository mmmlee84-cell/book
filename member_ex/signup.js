// =====================================================================
// 회원가입 로직
//   흐름: 유효성 검사 → auth.signUp() → (이미지 업로드) → member UPDATE → 로그인 이동
//
//   ※ DB 트리거(handle_new_user)가 auth.users 가입 시 member 행을
//     id / email / name 으로 "자동 생성"합니다.
//     따라서 클라이언트는 새로 INSERT 하지 않고, 나머지 정보
//     (phone / address / profile_image)를 UPDATE 로 채워 넣습니다.
// =====================================================================

import { supabase, AVATAR_BUCKET } from "./supabase.js";

// ---------------------------------------------------------------------
// 자주 쓰는 요소들을 미리 찾아둡니다.
// ---------------------------------------------------------------------
const form = document.getElementById("signup-form");
const messageEl = document.getElementById("message");
const submitBtn = document.getElementById("submit-btn");
const spinner = submitBtn.querySelector(".spinner");
const imageInput = document.getElementById("profile-image");
const imagePreview = document.getElementById("image-preview");

// ---------------------------------------------------------------------
// 화면에 메시지를 보여주는 도우미 함수
//   type: "error" | "success"
// ---------------------------------------------------------------------
function showMessage(text, type = "error") {
    messageEl.textContent = text;
    // 기존 색상 클래스를 지우고 새로 지정
    messageEl.className = "message message--" + type;
    messageEl.hidden = false;
}

// 메시지 숨기기
function clearMessage() {
    messageEl.hidden = true;
    messageEl.textContent = "";
}

// ---------------------------------------------------------------------
// 로딩 상태 전환
//   - 로딩 중에는 버튼 비활성화 + 스피너 표시
// ---------------------------------------------------------------------
function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    spinner.hidden = !isLoading;
    submitBtn.querySelector(".btn__label").textContent = isLoading
        ? "처리 중..."
        : "회원가입";
}

// ---------------------------------------------------------------------
// 비밀번호 보기/숨기기 토글
//   - 각 눈 버튼(data-target)이 가리키는 입력칸의 type 을 바꿉니다.
// ---------------------------------------------------------------------
document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", () => {
        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);
        // password ↔ text 전환
        const isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        button.textContent = isHidden ? "숨김" : "표시";
    });
});

// ---------------------------------------------------------------------
// 이미지 선택 시 미리보기 표시
// ---------------------------------------------------------------------
imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) {
        imagePreview.hidden = true;
        return;
    }
    // 브라우저 메모리에 임시 URL 을 만들어 미리보기
    imagePreview.src = URL.createObjectURL(file);
    imagePreview.hidden = false;
});

// ---------------------------------------------------------------------
// 입력값 유효성 검사
//   - 문제가 있으면 오류 메시지를 띄우고 false 반환
// ---------------------------------------------------------------------
function validate({ name, email, password, passwordConfirm }) {
    if (!name) {
        showMessage("이름을 입력해 주세요.");
        return false;
    }

    // 간단한 이메일 형식 검사 (아이디@도메인.확장자)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage("올바른 이메일 형식이 아닙니다.");
        return false;
    }

    // Supabase 기본 최소 비밀번호 길이는 6자
    if (password.length < 6) {
        showMessage("비밀번호는 6자 이상이어야 합니다.");
        return false;
    }

    if (password !== passwordConfirm) {
        showMessage("비밀번호가 일치하지 않습니다.");
        return false;
    }

    return true;
}

// ---------------------------------------------------------------------
// 프로필 이미지를 Storage 에 업로드하고 공개 URL 을 돌려줍니다.
//   - 이미지가 없으면 null 반환
//   - 경로: {userId}/{타임스탬프}.{확장자}  → 사용자별 폴더로 분리
// ---------------------------------------------------------------------
async function uploadProfileImage(userId, file) {
    if (!file) return null;

    // 파일 확장자 추출 (예: "photo.png" → "png")
    const ext = file.name.split(".").pop();
    const filePath = `${userId}/profile.${ext}`;

    // upsert: true → 같은 경로면 덮어쓰기 허용
    const { error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, file, { upsert: true });

    if (error) {
        // 업로드 실패해도 가입 자체는 막지 않도록 경고만 던집니다.
        throw new Error("이미지 업로드 실패: " + error.message);
    }

    // 업로드된 파일의 공개 URL 가져오기
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
}

// ---------------------------------------------------------------------
// 폼 제출(회원가입) 처리
// ---------------------------------------------------------------------
form.addEventListener("submit", async (event) => {
    // 폼 기본 동작(페이지 새로고침) 막기
    event.preventDefault();
    clearMessage();

    // 입력값 읽기 (앞뒤 공백 제거)
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const passwordConfirm = form["password-confirm"].value;
    const phone = form.phone.value.trim();
    const address = form.address.value.trim();
    const imageFile = imageInput.files[0] || null;

    // 1) 유효성 검사
    if (!validate({ name, email, password, passwordConfirm })) {
        return;
    }

    setLoading(true);

    try {
        // 2) Supabase 인증에 회원가입 요청
        //    options.data.name → DB 트리거가 member.name 을 채우는 데 사용
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });

        if (error) {
            // 이미 가입된 이메일 등 인증 오류
            throw new Error(error.message);
        }

        // 가입된 사용자 id (member 행의 기본 키와 동일)
        const userId = data.user?.id;

        // 3) 프로필 이미지 업로드 (선택)
        let profileImageUrl = null;
        if (imageFile && userId) {
            profileImageUrl = await uploadProfileImage(userId, imageFile);
        }

        // 4) member 테이블에 나머지 정보 UPDATE
        //    (트리거가 만든 행에 phone/address/profile_image 를 채웁니다)
        //    빈 문자열은 저장하지 않도록 null 로 정리
        if (userId) {
            const { error: updateError } = await supabase
                .from("member")
                .update({
                    phone: phone || null,
                    address: address || null,
                    profile_image: profileImageUrl,
                })
                .eq("id", userId);

            // UPDATE 실패는 치명적이지 않으므로 콘솔 경고만 남깁니다.
            // (이메일 인증이 켜져 있으면 아직 세션이 없어 RLS 로 막힐 수 있음)
            if (updateError) {
                console.warn("추가 정보 저장 실패:", updateError.message);
            }
        }

        // 5) 성공 안내 후 로그인 페이지로 이동
        showMessage("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.", "success");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1200);
    } catch (err) {
        // 어떤 단계든 오류가 나면 여기서 메시지 표시
        showMessage(err.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
        // 성공/실패와 상관없이 로딩 해제
        setLoading(false);
    }
});

// ---------------------------------------------------------------------
// 초기화 버튼: 폼 리셋 시 미리보기/메시지도 함께 정리
// ---------------------------------------------------------------------
form.addEventListener("reset", () => {
    clearMessage();
    imagePreview.hidden = true;
    imagePreview.src = "";
});
