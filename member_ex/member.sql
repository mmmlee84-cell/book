-- =====================================================================
-- member 테이블
-- 회원 인증은 Supabase Authentication(auth.users)이 전담하며,
-- member 테이블은 프로필/부가정보만 담당합니다.
-- =====================================================================

CREATE TABLE member (
    -- 기본 키: auth.users(id)를 참조하는 UUID
    -- 회원 삭제 시 관련 데이터도 함께 삭제 (ON DELETE CASCADE)
    id              UUID PRIMARY KEY
                    REFERENCES auth.users (id) ON DELETE CASCADE,

    -- 로그인 계정으로 사용하는 이메일 (필수, 중복 불가)
    email           TEXT        NOT NULL UNIQUE,

    -- 회원 이름 (필수)
    name            TEXT        NOT NULL,

    -- 전화번호 (선택 입력, 중복 불가)
    phone           TEXT        UNIQUE,

    -- 주소 (선택 입력)
    address         TEXT,

    -- 프로필 이미지 URL (선택 입력)
    profile_image   TEXT,

    -- 회원 권한: user, admin 만 허용 / 기본값 user
    role            TEXT        NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'admin')),

    -- 회원 상태: active, inactive, blocked 만 허용 / 기본값 active
    status          TEXT        NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'blocked')),

    -- 마지막 로그인 시간 (NULL 허용)
    last_login      TIMESTAMPTZ,

    -- 가입일 / 수정일 (기본값 NOW())
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =====================================================================
-- 회원 가입 정책 (RLS)
--   - 조회(SELECT) : 전체 공개
--   - 수정(UPDATE) : 본인만 + 관리자 전체
--   - 가입(INSERT) : auth.users 트리거로 자동 생성 (클라이언트 INSERT 없음)
--   - 관리자(admin): 전체 조회 + 수정
-- =====================================================================

-- 1) RLS 활성화
ALTER TABLE member ENABLE ROW LEVEL SECURITY;


-- 2) 관리자 판별 헬퍼 함수
--    member 정책 안에서 member 를 직접 조회하면 RLS 무한 재귀가 발생하므로,
--    SECURITY DEFINER 함수로 RLS 를 우회하여 role 을 확인합니다.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.member
        WHERE id = auth.uid()
          AND role = 'admin'
    );
$$;


-- 3) SELECT : 누구나 회원 프로필 조회 가능 (전체 공개)
CREATE POLICY member_select_public
    ON member
    FOR SELECT
    USING (true);


-- 4) UPDATE : 본인 행만 수정 가능
CREATE POLICY member_update_own
    ON member
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);


-- 5) UPDATE : 관리자는 모든 회원 행 수정 가능
--    (여러 PERMISSIVE 정책은 OR 로 결합됩니다)
CREATE POLICY member_update_admin
    ON member
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());


-- =====================================================================
-- 가입(INSERT) 자동화 트리거
--   auth.users 에 신규 사용자가 생기면 member 프로필 행을 자동 생성합니다.
--   함수가 SECURITY DEFINER 이므로 RLS 를 우회하며, 별도의 INSERT 정책이
--   없어도 정상 동작합니다. (클라이언트에서 직접 INSERT 하지 않습니다)
--
--   name 은 NOT NULL 이므로, 가입 시 전달한 메타데이터의 name 을 사용하고
--   값이 없으면 email 로 대체합니다.
--     예) supabase.auth.signUp({ email, password,
--            options: { data: { name: '홍길동' } } })
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.member (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email)
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- =====================================================================
-- updated_at 자동 갱신 트리거 (수정 시각 관리)
--   DEFAULT NOW() 는 최초 삽입 시점만 채우므로, UPDATE 마다 갱신되도록 추가.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER member_set_updated_at
    BEFORE UPDATE ON member
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- =====================================================================
-- 관리자 계정 전환
--   1) 먼저 회원가입 페이지에서 정상적으로 가입을 완료합니다.
--   2) 아래 UPDATE 문의 이메일을 관리자로 만들 계정으로 바꿔 실행합니다.
--      (Supabase 대시보드 → SQL Editor 에서 실행)
--   role 은 CHECK (role IN ('user','admin')) 제약이 있으므로 'admin' 만 허용됩니다.
-- =====================================================================
UPDATE member
SET role = 'admin'
WHERE email = 'purplemons@naver.com';   -- ← 관리자로 만들 실제 이메일로 변경

-- (확인용) 관리자 목록 조회
-- SELECT id, email, name, role FROM member WHERE role = 'admin';

