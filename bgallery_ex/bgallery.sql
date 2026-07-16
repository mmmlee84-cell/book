-- ============================================================
-- bgallery 테이블 + bgallery 스토리지 버킷 CRUD 정책
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1) bgallery 테이블
CREATE TABLE bgallery (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2) bgallery 테이블 CRUD 접근 권한 (누구나 public)
-- ============================================================

-- 테이블 RLS 활성화
ALTER TABLE bgallery ENABLE ROW LEVEL SECURITY;

-- 재실행해도 안전하도록 기존 정책 제거
DROP POLICY IF EXISTS "bgallery table read"   ON bgallery;
DROP POLICY IF EXISTS "bgallery table insert" ON bgallery;
DROP POLICY IF EXISTS "bgallery table update" ON bgallery;
DROP POLICY IF EXISTS "bgallery table delete" ON bgallery;

-- READ (SELECT)
CREATE POLICY "bgallery table read"
ON bgallery FOR SELECT
TO public
USING (true);

-- CREATE (INSERT)
CREATE POLICY "bgallery table insert"
ON bgallery FOR INSERT
TO public
WITH CHECK (true);

-- UPDATE
CREATE POLICY "bgallery table update"
ON bgallery FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- DELETE
CREATE POLICY "bgallery table delete"
ON bgallery FOR DELETE
TO public
USING (true);

-- ============================================================
-- 3) bgallery 스토리지 버킷 CRUD 접근 권한 (누구나 public)
-- ============================================================

-- 버킷 생성 (이미 있으면 무시)
INSERT INTO storage.buckets (id, name, public)
VALUES ('bgallery', 'bgallery', true)
ON CONFLICT (id) DO NOTHING;

-- storage.objects RLS 활성화 (기본적으로 이미 켜져 있음)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 재실행해도 안전하도록 기존 정책 제거
DROP POLICY IF EXISTS "bgallery read"   ON storage.objects;
DROP POLICY IF EXISTS "bgallery insert" ON storage.objects;
DROP POLICY IF EXISTS "bgallery update" ON storage.objects;
DROP POLICY IF EXISTS "bgallery delete" ON storage.objects;

-- READ (SELECT)
CREATE POLICY "bgallery read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'bgallery');

-- CREATE (INSERT / 업로드)
CREATE POLICY "bgallery insert"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'bgallery');

-- UPDATE
CREATE POLICY "bgallery update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'bgallery')
WITH CHECK (bucket_id = 'bgallery');

-- DELETE
CREATE POLICY "bgallery delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'bgallery');
