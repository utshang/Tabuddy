-- AlterTable: trip_members.joined_at 新增成員加入時間（對應 spec/erm.dbml trip_members：
-- 成員加入旅程的先後順序需可回溯，作為開支均分尾差的分配順序依據）
ALTER TABLE "trip_members" ADD COLUMN "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: expenses 補上新增開支功能需要的欄位（對應 spec/erm.dbml 更新）
-- expense_date：開支日期（YYYY-MM-DD），未指定時由前端以使用者裝置時區帶入當天
-- category_icon：自定義類別的圖示，選填；預設四類的圖示由前端內建提供，不寫入此欄位
ALTER TABLE "expenses" ADD COLUMN "expense_date" TEXT NOT NULL;
ALTER TABLE "expenses" ADD COLUMN "category_icon" TEXT;

-- CheckConstraint: expenses.name trim 後不可為空字串
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_name_check" CHECK (btrim("name") <> '');

-- CheckConstraint: expenses.category trim 後不可為空字串
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_check" CHECK (btrim("category") <> '');

-- CheckConstraint: expenses.amount 最多至小數第二位
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_amount_scale_check" CHECK ("amount" = round("amount", 2));

-- CheckConstraint: expenses.expense_date 為 YYYY-MM-DD 格式
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_expense_date_format_check" CHECK ("expense_date" ~ '^\d{4}-\d{2}-\d{2}$');

-- CheckConstraint: category 為四個預設選項之一時，category_icon 必為空（對應 spec/erm.dbml 跨屬性不變條件）
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_icon_check"
  CHECK ("category" NOT IN ('住宿', '吃喝', '購物', '其他') OR "category_icon" IS NULL);

-- CheckConstraint: expense_splits.amount 由 > 0 放寬為 >= 0（對應規格決議：0 為有效分攤明細），
-- 並限制最多至小數第二位
ALTER TABLE "expense_splits" DROP CONSTRAINT "expense_splits_amount_check";
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_amount_check"
  CHECK ("amount" >= 0 AND "amount" = round("amount", 2));

-- RLS: 本次功能（新增開支）新增的存取權限

-- expenses: 旅程成員可查看該旅程的開支
CREATE POLICY "expenses: member select" ON "expenses"
  FOR SELECT USING (public.is_trip_member("trip_id"));

-- expenses: 旅程成員可在該旅程新增開支
CREATE POLICY "expenses: member insert" ON "expenses"
  FOR INSERT WITH CHECK (public.is_trip_member("trip_id"));

-- expense_splits: 旅程成員可查看該旅程開支的分攤明細
CREATE POLICY "expense_splits: member select" ON "expense_splits"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "expenses"
      WHERE "expenses"."id" = "expense_splits"."expense_id"
        AND public.is_trip_member("expenses"."trip_id")
    )
  );

-- expense_splits: 旅程成員可為該旅程的開支新增分攤明細
CREATE POLICY "expense_splits: member insert" ON "expense_splits"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "expenses"
      WHERE "expenses"."id" = "expense_splits"."expense_id"
        AND public.is_trip_member("expenses"."trip_id")
    )
  );
