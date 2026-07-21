-- 行程即時同步：比照 20260720000000_ledger_realtime_trip_scope 的做法，
-- 對應 spec/features/新增行程.feature 等「其他團員異動後，正在查看行程的使用者即時看到更新」規則。

-- activities 補上 trip_id（denormalize 自 day.trip_id），讓 Realtime 的 filter 可以直接下在這個欄位，
-- 不必再靠 client 端額外查詢 day_id 對應哪個 trip。
ALTER TABLE "activities" ADD COLUMN "trip_id" INTEGER;

UPDATE "activities" a
SET "trip_id" = d."trip_id"
FROM "days" d
WHERE d."id" = a."day_id";

ALTER TABLE "activities" ALTER COLUMN "trip_id" SET NOT NULL;

ALTER TABLE "activities" ADD CONSTRAINT "activities_trip_id_fkey"
  FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "activities_trip_id_idx" ON "activities"("trip_id");

-- transports 補上 trip_id（denormalize 自 after_activity 所屬的 trip_id），理由同上。
ALTER TABLE "transports" ADD COLUMN "trip_id" INTEGER;

UPDATE "transports" t
SET "trip_id" = a."trip_id"
FROM "activities" a
WHERE a."id" = t."after_activity_id";

ALTER TABLE "transports" ALTER COLUMN "trip_id" SET NOT NULL;

ALTER TABLE "transports" ADD CONSTRAINT "transports_trip_id_fkey"
  FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "transports_trip_id_idx" ON "transports"("trip_id");

-- REPLICA IDENTITY FULL：Postgres 預設的 DELETE 事件 old record 只帶主鍵，沒有 trip_id 可比對，
-- Realtime 的 filter 條件因此無法套用在 DELETE 上。改成 FULL 後 DELETE payload 會帶出整列舊資料，
-- 才能讓 filter 對 INSERT / UPDATE / DELETE 一致生效，過濾掉無關 trip 的事件。
ALTER TABLE "days" REPLICA IDENTITY FULL;
ALTER TABLE "activities" REPLICA IDENTITY FULL;
ALTER TABLE "transports" REPLICA IDENTITY FULL;
