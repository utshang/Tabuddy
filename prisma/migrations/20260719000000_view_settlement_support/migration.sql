-- 查看結算（spec/features/查看結算.feature）
-- Rule: 其他團員異動開支後，正在查看結算的使用者所見結算結果即時更新
-- 將 expenses / expense_splits 加入 supabase_realtime publication，
-- 供 Supabase Realtime（Postgres Changes）推播開支異動；
-- INSERT / UPDATE 事件的接收者依既有 RLS select policy（trip_members）過濾。
-- 結算本身為即時計算的衍生資料，不持久化，故本 migration 不新增任何資料表。
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'expenses'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE "expenses";
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'expense_splits'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE "expense_splits";
    END IF;
  END IF;
END $$;
