// =====================================================================
// Supabase 클라이언트 초기화
//   - 이 파일 하나에서 클라이언트를 만들어 다른 파일들이 가져다 씁니다.
//   - ES module 방식(import/export)을 사용합니다.
// =====================================================================

// Supabase JavaScript SDK 를 CDN 에서 불러옵니다.
// (npm 설치 없이 브라우저에서 바로 사용할 수 있는 방식)
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ---------------------------------------------------------------------
// TODO: 아래 두 값을 본인의 Supabase 프로젝트 값으로 교체하세요.
//   Supabase 대시보드 → Project Settings → API 에서 확인할 수 있습니다.
//   - Project URL      → SUPABASE_URL
//   - anon public key   → SUPABASE_ANON_KEY  (공개 키라 노출되어도 안전합니다)
// ---------------------------------------------------------------------
const SUPABASE_URL = "https://cbpxesevkjqenhriumfm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_FDubU2pFp8nA7n2I2ARjdQ_65HWe9Lt";

// 프로필 이미지를 저장할 Storage 버킷 이름
// (Supabase 대시보드 → Storage 에서 같은 이름의 버킷을 미리 만들어 두세요)
export const AVATAR_BUCKET = "avatars";

// 클라이언트 생성 후 export → 다른 파일에서 import 하여 사용
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
