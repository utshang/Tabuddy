-- CheckConstraint: 跨屬性不變條件（對應 spec/erm.dbml transports Note）：
-- mode 為六個預設選項之一時，icon 必為空。
-- 預設選項在資料庫中以中文名稱儲存（走路／開車／飛機／公車／火車／地鐵，
-- 對應規格中的 walking / driving / flight / bus / train / metro）。
ALTER TABLE "transports" ADD CONSTRAINT "transports_preset_mode_icon_check"
  CHECK ("mode" NOT IN ('走路', '開車', '飛機', '公車', '火車', '地鐵') OR "icon" IS NULL);

-- RLS: 編輯交通時間所需的 UPDATE 權限已由 20260712000000_reorder_activity_support 的
-- "transports: member update" policy 涵蓋（旅程成員可更新該旅程行程之後的交通時間），本次不需新增。
