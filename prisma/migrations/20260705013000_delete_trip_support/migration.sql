-- CreateTable: expenses（對應 spec/erm.dbml，僅為刪除旅程的 cascade 刪除規則提供最小資料模型）
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "category" TEXT NOT NULL,
    "payer_id" UUID NOT NULL,
    "split_type" TEXT NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: expense_splits
CREATE TABLE "expense_splits" (
    "id" SERIAL NOT NULL,
    "expense_id" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" DECIMAL NOT NULL,

    CONSTRAINT "expense_splits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expense_splits_expense_id_user_id_key" ON "expense_splits"("expense_id", "user_id");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "users"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE CASCADE;

-- CheckConstraint: expenses.amount 必須 > 0
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_amount_check" CHECK ("amount" > 0);

-- CheckConstraint: expenses.split_type 僅能是 even / custom
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_split_type_check" CHECK ("split_type" IN ('even', 'custom'));

-- CheckConstraint: expense_splits.amount 必須 > 0
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_amount_check" CHECK ("amount" > 0);

-- RLS：expenses / expense_splits 先啟用但不開放任何 policy（尚無功能需要 client 端讀寫，
-- 待新增開支 phase 實作時再補上對應 policy）。
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expense_splits" ENABLE ROW LEVEL SECURITY;

-- RLS: 本次功能（刪除旅程）新增的存取權限

-- Helper：是否為該旅程的建立者（owner）。SECURITY DEFINER 原因同 is_trip_member。
CREATE OR REPLACE FUNCTION public.is_trip_owner(p_trip_id integer)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = p_trip_id AND user_id = auth.uid() AND role = 'owner'
  );
$$;

-- trips: 只有建立者可以刪除旅程
CREATE POLICY "trips: owner delete" ON "trips"
  FOR DELETE USING (public.is_trip_owner(id));

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
