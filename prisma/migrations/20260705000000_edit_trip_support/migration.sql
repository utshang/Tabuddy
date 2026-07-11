-- CreateTable: activities（對應 spec/erm.dbml，僅為編輯旅程的 cascade 刪除規則提供最小資料模型）
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "day_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "google_map_url" TEXT,
    "duration_minutes" INTEGER,
    "note" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable: transports
CREATE TABLE "transports" (
    "id" SERIAL NOT NULL,
    "after_activity_id" INTEGER NOT NULL,
    "hours" INTEGER NOT NULL,
    "minutes" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,

    CONSTRAINT "transports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transports_after_activity_id_key" ON "transports"("after_activity_id");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transports" ADD CONSTRAINT "transports_after_activity_id_fkey" FOREIGN KEY ("after_activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CheckConstraint: activities.duration_minutes 若填入則 >= 0
ALTER TABLE "activities" ADD CONSTRAINT "activities_duration_minutes_check" CHECK ("duration_minutes" IS NULL OR "duration_minutes" >= 0);

-- CheckConstraint: transports.hours >= 0
ALTER TABLE "transports" ADD CONSTRAINT "transports_hours_check" CHECK ("hours" >= 0);

-- CheckConstraint: transports.minutes >= 0 且 < 60
ALTER TABLE "transports" ADD CONSTRAINT "transports_minutes_check" CHECK ("minutes" >= 0 AND "minutes" < 60);

-- CheckConstraint: transports.mode 僅能是 walking / driving / flight / transit
ALTER TABLE "transports" ADD CONSTRAINT "transports_mode_check" CHECK ("mode" IN ('walking', 'driving', 'flight', 'transit'));

-- RLS：activities / transports 先啟用但不開放任何 policy（尚無功能需要 client 端讀寫，
-- 待新增行程 / 新增交通時間 phase 實作時再補上對應 policy）。
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transports" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- RLS: 本次功能（編輯旅程）新增的存取權限

-- trips: 旅程成員（owner 或 member）可編輯旅程名稱與起迄日
CREATE POLICY "trips: member update" ON "trips"
  FOR UPDATE USING (public.is_trip_member(id));

-- days: 縮減起迄日範圍時，系統需刪除範圍外的旅程日期
CREATE POLICY "days: member delete" ON "days"
  FOR DELETE USING (public.is_trip_member(trip_id));
