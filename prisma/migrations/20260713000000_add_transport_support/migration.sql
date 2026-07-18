-- AlterTable: transports.icon 新增選填的圖示欄位（對應 spec/erm.dbml 更新：
-- 自訂交通工具可選填圖示，未填寫時前端以 mode 名稱文字顯示代替）
ALTER TABLE "transports" ADD COLUMN "icon" TEXT;

-- CheckConstraint: transports.mode 不再限制為固定四個枚舉值。
-- 對應規格決議：前端以下拉選單呈現預設選項，但欄位本身為自由文字，允許使用者新增自訂交通工具名稱。
ALTER TABLE "transports" DROP CONSTRAINT "transports_mode_check";

-- RLS: 本次功能（新增交通時間）新增的存取權限

-- transports: 旅程成員可查看該旅程行程之後的交通時間
CREATE POLICY "transports: member select" ON "transports"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "activities"
      JOIN "days" ON "days"."id" = "activities"."day_id"
      WHERE "activities"."id" = "transports"."after_activity_id"
        AND public.is_trip_member("days"."trip_id")
    )
  );

-- transports: 旅程成員可在該旅程的行程之後新增交通時間
CREATE POLICY "transports: member insert" ON "transports"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "activities"
      JOIN "days" ON "days"."id" = "activities"."day_id"
      WHERE "activities"."id" = "transports"."after_activity_id"
        AND public.is_trip_member("days"."trip_id")
    )
  );

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
