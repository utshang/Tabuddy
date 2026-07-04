-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "invite_token" TEXT NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_members" (
    "trip_id" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "trip_members_pkey" PRIMARY KEY ("trip_id","user_id")
);

-- CreateTable
CREATE TABLE "days" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "start_time" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "trips_invite_token_key" ON "trips"("invite_token");

-- AddForeignKey
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "days" ADD CONSTRAINT "days_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: users.id 對應 Supabase Auth 的 auth.users(id)
ALTER TABLE "users" ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE;

-- CheckConstraint: 對應 spec/erm.dbml trips 的跨屬性不變條件 end_date >= start_date
ALTER TABLE "trips" ADD CONSTRAINT "trips_end_date_check" CHECK ("end_date" >= "start_date");

-- CheckConstraint: invite_token 為長度 6 碼的英文大小寫與數字混合字串
ALTER TABLE "trips" ADD CONSTRAINT "trips_invite_token_format_check" CHECK ("invite_token" ~ '^[A-Za-z0-9]{6}$');

-- CheckConstraint: days.order 從 1 開始
ALTER TABLE "days" ADD CONSTRAINT "days_order_check" CHECK ("order" >= 1);

-- Trigger: 新使用者於 auth.users 建立後，同步一筆到 public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: 補上觸發器建立前既有的 auth.users
INSERT INTO public.users (id, name, email)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- RLS: 本次功能（建立旅程）實際需要的存取權限

-- Helper：是否為該旅程的成員。SECURITY DEFINER 以 table owner 權限執行，
-- 避免 trip_members 自身的 policy 查詢 trip_members 造成無窮遞迴。
CREATE OR REPLACE FUNCTION public.is_trip_member(p_trip_id integer)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  );
$$;

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trip_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "days" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: authenticated read" ON "users"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "trips: member read" ON "trips"
  FOR SELECT USING (public.is_trip_member(id));

CREATE POLICY "trips: authenticated insert" ON "trips"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "trip_members: member read" ON "trip_members"
  FOR SELECT USING (public.is_trip_member(trip_id));

CREATE POLICY "trip_members: self insert" ON "trip_members"
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "days: member read" ON "days"
  FOR SELECT USING (public.is_trip_member(trip_id));

CREATE POLICY "days: member insert" ON "days"
  FOR INSERT WITH CHECK (public.is_trip_member(trip_id));

-- Grants: public schema 重建後，Supabase 預設給 anon/authenticated/service_role 的權限需要補回。
-- RLS policy 只限制「哪些列可見」，角色本身仍需要基本的 schema/table GRANT 才能碰到資料表。
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
