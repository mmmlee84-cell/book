// Supabase 클라이언트 초기화
// 아래 두 값을 본인의 Supabase 프로젝트 값으로 교체하세요.
// (Supabase 대시보드 > Project Settings > API 에서 확인)
const SUPABASE_URL = 'https://cbpxesevkjqenhriumfm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FDubU2pFp8nA7n2I2ARjdQ_65HWe9Lt';

// CDN(board.html)에서 불러온 supabase 전역 객체 사용
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
