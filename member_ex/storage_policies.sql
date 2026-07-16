-- =====================================================================
-- Storage 버킷 'avatars' CRUD 정책
--   대상 테이블 : storage.objects (Supabase Storage 의 파일 메타데이터)
--   버킷 이름   : avatars   (supabase.js 의 AVATAR_BUCKET 과 동일)
--
--   업로드 경로 규칙 : {userId}/profile.{ext}
--     → 파일 경로의 "첫 번째 폴더명"이 곧 사용자 id 입니다.
--     → storage.foldername(name) 은 경로를 폴더 배열로 나눠 주며,
--       [1] 이 첫 번째 폴더(=userId)입니다. (배열 인덱스는 1부터)
--
--   정책 요약
--     - READ  (SELECT) : 전체 공개 (프로필 이미지는 누구나 볼 수 있어야 함)
--     - CREATE(INSERT) : 로그인 사용자가 "자기 폴더"에만 업로드
--     - UPDATE         : 본인 파일만 수정(덮어쓰기)
--     - DELETE         : 본인 파일만 삭제
-- =====================================================================

-- (참고) storage.objects 에는 이미 RLS 가 켜져 있습니다. 별도 ENABLE 불필요.


-- ---------------------------------------------------------------------
-- 1) READ : 누구나 avatars 버킷의 파일을 조회/다운로드 가능 (전체 공개)
-- ---------------------------------------------------------------------
CREATE POLICY "avatars_read_public"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');


-- ---------------------------------------------------------------------
-- 2) CREATE : 로그인 사용자가 자신의 폴더(userId)에만 업로드 가능
--    - auth.role() = 'authenticated' : 로그인 상태
--    - 첫 폴더명이 본인 uid 와 일치해야 함
-- ---------------------------------------------------------------------
CREATE POLICY "avatars_insert_own"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );


-- ---------------------------------------------------------------------
-- 3) UPDATE : 본인 폴더의 파일만 수정(덮어쓰기 upsert) 가능
--    - USING      : 수정하려는 기존 행이 본인 것인지
--    - WITH CHECK : 수정 후에도 본인 폴더를 벗어나지 않는지
-- ---------------------------------------------------------------------
CREATE POLICY "avatars_update_own"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );


-- ---------------------------------------------------------------------
-- 4) DELETE : 본인 폴더의 파일만 삭제 가능
-- ---------------------------------------------------------------------
CREATE POLICY "avatars_delete_own"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
