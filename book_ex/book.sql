-- 목적: 도서 정보를 저장하기 위한 book 테이블 생성 (PostgreSQL)

CREATE TABLE IF NOT EXISTS book (
    book_id SERIAL PRIMARY KEY,              -- 도서 ID: 자동 증가(SERIAL), 기본키
    month   VARCHAR(10) NOT NULL,            -- 월: 최대 10자 문자열, 필수 입력
    title   VARCHAR(100) NOT NULL,           -- 책이름: 최대 100자 문자열, 필수 입력
    author  VARCHAR(50) NOT NULL             -- 작가: 최대 50자 문자열, 필수 입력
);

-- 샘플 데이터 추가 (book_id는 자동 증가이므로 제외)
-- 테이블이 비어 있을 때만 INSERT 하여, 재실행 시 데이터 중복을 방지합니다.
INSERT INTO book (month, title, author)
SELECT month, title, author
FROM (VALUES
    ('3월', '튜브', '손원평')
) AS sample(month, title, author)
WHERE NOT EXISTS (SELECT 1 FROM book);

-- 사례 1: 전체 도서 조회 (book 테이블의 모든 데이터 조회)
SELECT * FROM book;

-- 사례 2: 월, 책이름, 작가만 조회 (month, title, author 컬럼만 출력)
SELECT month, title, author FROM book;

-- ============================================================
-- SELECT 정책 (RLS: Row Level Security)
-- ============================================================
-- Supabase에서는 anon(public) 키로 데이터를 조회하려면
-- RLS를 켜고 SELECT를 허용하는 정책을 만들어야 합니다.

-- 1) book 테이블에 RLS(행 수준 보안) 활성화
ALTER TABLE book ENABLE ROW LEVEL SECURITY;

-- 2) 모든 사용자에게 조회(SELECT)를 허용하는 정책 생성
--    USING (true) : 모든 행을 조회할 수 있도록 허용
--    같은 이름의 정책이 이미 있으면 먼저 삭제하여 재실행 시 오류를 방지
DROP POLICY IF EXISTS "Allow public read access on book" ON book;
CREATE POLICY "Allow public read access on book"
    ON book
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 3) 모든 사용자에게 추가(INSERT)를 허용하는 정책 생성
--    WITH CHECK (true) : 어떤 행이든 추가할 수 있도록 허용
--    웹 화면의 '추가' 버튼으로 새 도서를 저장하려면 이 정책이 필요합니다.
DROP POLICY IF EXISTS "Allow public insert on book" ON book;
CREATE POLICY "Allow public insert on book"
    ON book
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 4) 모든 사용자에게 수정(UPDATE)을 허용하는 정책 생성
--    웹 화면의 '수정' 버튼으로 도서 정보를 바꾸려면 이 정책이 필요합니다.
DROP POLICY IF EXISTS "Allow public update on book" ON book;
CREATE POLICY "Allow public update on book"
    ON book
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5) 모든 사용자에게 삭제(DELETE)를 허용하는 정책 생성
--    웹 화면의 '삭제' 버튼으로 도서를 지우려면 이 정책이 필요합니다.
DROP POLICY IF EXISTS "Allow public delete on book" ON book;
CREATE POLICY "Allow public delete on book"
    ON book
    FOR DELETE
    TO anon, authenticated
    USING (true);
