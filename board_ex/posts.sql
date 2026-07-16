-- 서평 테이블 생성 (Supabase / PostgreSQL)
CREATE TABLE IF NOT EXISTS posts (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    writer      VARCHAR(50)  NOT NULL,
    content     TEXT         NOT NULL,
    view_count  INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT posts_view_count_non_negative CHECK (view_count >= 0)
);

-- =========================================================
-- RLS(Row Level Security) 정책
-- =========================================================

-- RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 전체 조회(SELECT) 허용: 익명(anon) + 로그인(authenticated) 사용자
DROP POLICY IF EXISTS "posts_select_all" ON posts;
CREATE POLICY "posts_select_all"
    ON posts
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 게시글 등록(INSERT) 허용: 익명(anon) + 로그인(authenticated) 사용자
DROP POLICY IF EXISTS "posts_insert_all" ON posts;
CREATE POLICY "posts_insert_all"
    ON posts
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 게시글 수정(UPDATE) 허용: 조회수 증가 + 글 수정
DROP POLICY IF EXISTS "posts_update_all" ON posts;
CREATE POLICY "posts_update_all"
    ON posts
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 게시글 삭제(DELETE) 허용
DROP POLICY IF EXISTS "posts_delete_all" ON posts;
CREATE POLICY "posts_delete_all"
    ON posts
    FOR DELETE
    TO anon, authenticated
    USING (true);


-- =========================================================
-- 댓글(comments) 테이블 생성 (Supabase / PostgreSQL)
-- =========================================================
CREATE TABLE IF NOT EXISTS comments (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id     BIGINT       NOT NULL,                 -- 어떤 서평(글)의 댓글인지
    writer      VARCHAR(50)  NOT NULL,                 -- 댓글 작성자
    content     TEXT         NOT NULL,                 -- 댓글 내용
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),   -- 등록일
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),   -- 수정일

    -- posts.id 참조. 게시글이 삭제되면 댓글도 함께 삭제(CASCADE)
    CONSTRAINT comments_post_id_fkey
        FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);

-- post_id 로 댓글을 자주 조회하므로 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id);

-- =========================================================
-- comments 테이블 RLS(Row Level Security) 정책
-- =========================================================

-- RLS 활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 댓글 조회(SELECT) 허용
DROP POLICY IF EXISTS "comments_select_all" ON comments;
CREATE POLICY "comments_select_all"
    ON comments
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 댓글 등록(INSERT) 허용
DROP POLICY IF EXISTS "comments_insert_all" ON comments;
CREATE POLICY "comments_insert_all"
    ON comments
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 댓글 수정(UPDATE) 허용
DROP POLICY IF EXISTS "comments_update_all" ON comments;
CREATE POLICY "comments_update_all"
    ON comments
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 댓글 삭제(DELETE) 허용
DROP POLICY IF EXISTS "comments_delete_all" ON comments;
CREATE POLICY "comments_delete_all"
    ON comments
    FOR DELETE
    TO anon, authenticated
    USING (true);
