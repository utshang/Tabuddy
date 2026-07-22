-- AlterTable: activities.fixed_time 新增選填的指定時間欄位（對應 spec/erm.dbml 更新：
-- 設定後時間軸直接採用此值，不受前面行程累加值影響，見 spec/features/行程時間軸.feature）
ALTER TABLE "activities" ADD COLUMN "fixed_time" TEXT;
