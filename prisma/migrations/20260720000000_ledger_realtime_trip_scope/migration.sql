-- 查看結算：修正 Realtime 訂閱會收到「無關 trip」事件的問題
-- 對應 spec/features/查看結算.feature「其他團員異動開支後，正在查看結算的使用者所見結算結果即時更新」，
-- 訂閱範圍應僅限於使用者正在查看的 trip，而非全站。

-- expense_splits 補上 trip_id（denormalize），讓 Realtime 的 filter 可以直接下在這個欄位，
-- 不必再靠 client 端額外查詢 expense_id 對應哪個 trip。
ALTER TABLE "expense_splits" ADD COLUMN "trip_id" INTEGER;

UPDATE "expense_splits" es
SET "trip_id" = e."trip_id"
FROM "expenses" e
WHERE e."id" = es."expense_id";

ALTER TABLE "expense_splits" ALTER COLUMN "trip_id" SET NOT NULL;

ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_trip_id_fkey"
  FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "expense_splits_trip_id_idx" ON "expense_splits"("trip_id");

-- REPLICA IDENTITY FULL：Postgres 預設的 DELETE 事件 old record 只帶主鍵，沒有 trip_id 可比對，
-- Realtime 的 filter 條件因此無法套用在 DELETE 上。改成 FULL 後 DELETE payload 會帶出整列舊資料，
-- 才能讓 filter 對 INSERT / UPDATE / DELETE 一致生效，過濾掉無關 trip 的事件。
ALTER TABLE "expenses" REPLICA IDENTITY FULL;
ALTER TABLE "expense_splits" REPLICA IDENTITY FULL;
