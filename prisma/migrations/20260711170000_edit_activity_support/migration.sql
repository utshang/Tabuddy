-- Backfill: 停留時間規則收斂為必填且必須 > 0（原為選填、>= 0），
-- 既有的 NULL 或 <= 0 資料先補上最小合法值，避免 NOT NULL / CHECK 失敗。
UPDATE "activities" SET "duration_minutes" = 1 WHERE "duration_minutes" IS NULL OR "duration_minutes" <= 0;

-- AlterTable: activities.duration_minutes 改為必填
ALTER TABLE "activities" ALTER COLUMN "duration_minutes" SET NOT NULL;

-- CheckConstraint: activities.duration_minutes 必須 > 0（原為 >= 0）
ALTER TABLE "activities" DROP CONSTRAINT "activities_duration_minutes_check";
ALTER TABLE "activities" ADD CONSTRAINT "activities_duration_minutes_check" CHECK ("duration_minutes" > 0);

-- RLS: 本次功能（編輯行程）新增的存取權限

-- activities: 旅程成員可編輯該旅程日期底下的行程
CREATE POLICY "activities: member update" ON "activities"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "days"
      WHERE "days"."id" = "activities"."day_id"
        AND public.is_trip_member("days"."trip_id")
    )
  );

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
