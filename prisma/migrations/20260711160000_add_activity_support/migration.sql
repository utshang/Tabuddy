-- RLS: 本次功能（新增行程）新增的存取權限

-- activities: 旅程成員可查看該旅程日期底下的行程
CREATE POLICY "activities: member select" ON "activities"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "days"
      WHERE "days"."id" = "activities"."day_id"
        AND public.is_trip_member("days"."trip_id")
    )
  );

-- activities: 旅程成員可在該旅程的旅程日期底下新增行程
CREATE POLICY "activities: member insert" ON "activities"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "days"
      WHERE "days"."id" = "activities"."day_id"
        AND public.is_trip_member("days"."trip_id")
    )
  );

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
