-- 行程即時同步（各 spec/features/*.feature 內「其他團員異動後，正在查看行程的使用者即時看到更新」規則）
-- 補上前一份 migration 遺漏的一步：將 days / activities / transports 加入 supabase_realtime
-- publication，Supabase Realtime（Postgres Changes）才會實際推播這三張表的異動；
-- 光是設定 REPLICA IDENTITY FULL 與 RLS policy 不會讓事件被推播，還需要表本身在這個 publication 內。
-- 比照 20260719000000_view_settlement_support 的做法。
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'days'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE "days";
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'activities'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE "activities";
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'transports'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE "transports";
    END IF;
  END IF;
END $$;
