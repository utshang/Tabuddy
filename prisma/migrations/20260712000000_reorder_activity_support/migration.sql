-- AlterConstraint: transports.after_activity_id 的唯一性檢查改為 DEFERRABLE INITIALLY DEFERRED，
-- 讓「調整行程順序」在同一筆交易內，能安全地將兩段交通時間互相交換所屬行程
-- （例如兩個都有接續交通時間的行程互換順序時，若逐列即時檢查唯一性會在交易中途誤判衝突）。
DROP INDEX "transports_after_activity_id_key";
ALTER TABLE "transports" ADD CONSTRAINT "transports_after_activity_id_key" UNIQUE ("after_activity_id") DEFERRABLE INITIALLY DEFERRED;

-- RLS: 本次功能（調整行程順序）新增的存取權限

-- transports: 旅程成員可更新該旅程行程之後的交通時間（含調整順序時 after_activity_id 重新指向）
CREATE POLICY "transports: member update" ON "transports"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "activities"
      JOIN "days" ON "days"."id" = "activities"."day_id"
      WHERE "activities"."id" = "transports"."after_activity_id"
        AND public.is_trip_member("days"."trip_id")
    )
  );

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
