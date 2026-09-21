-- 依 Supabase Security / Performance Advisor 的建議加固，不改變任何功能行為。

-- Prisma 自己的 migration 紀錄表位於 public schema，預設沒有 RLS（rls_disabled_in_public）。
-- 啟用 RLS 且不開放 policy：anon / authenticated 完全讀不到；Prisma 以 postgres 角色連線，不受影響。
-- 該表由 Prisma 在跑 migration 前建立；以 to_regclass 判斷是為了 shadow database 沒有此表時不出錯。
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Function Search Path Mutable：固定 search_path。
-- 兩個函式內部的表名與 auth.uid() 皆已寫明 schema，空 search_path 不影響執行結果。
ALTER FUNCTION public.is_trip_member(integer) SET search_path = '';
ALTER FUNCTION public.is_trip_owner(integer) SET search_path = '';

-- SECURITY DEFINER 函式不該被未登入者透過 API 呼叫。
-- handle_new_user 只由 auth.users 的 trigger 使用（trigger 函式的 EXECUTE 權限只在建立 trigger 時檢查），
-- 因此對 API 角色全數收回。
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- is_trip_member / is_trip_owner 被 RLS policy 使用，authenticated 必須保留 EXECUTE；只收回 anon。
REVOKE EXECUTE ON FUNCTION public.is_trip_member(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_trip_owner(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_trip_member(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_trip_owner(integer) TO authenticated, service_role;

-- Auth RLS Initialization Plan：policy 內的 auth.uid() / auth.role() 包成 (select ...)，
-- 讓 Postgres 對整個查詢只算一次，而不是每列各算一次。條件語意不變。
ALTER POLICY "users: authenticated read" ON "users"
  USING ((select auth.role()) = 'authenticated');

ALTER POLICY "trips: authenticated insert" ON "trips"
  WITH CHECK ((select auth.role()) = 'authenticated');

ALTER POLICY "trip_members: self insert" ON "trip_members"
  WITH CHECK (user_id = (select auth.uid()));
