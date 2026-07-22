-- CheckConstraint: activities.duration_minutes 改回允許 0（原為必須 > 0，現為 >= 0）
ALTER TABLE "activities" DROP CONSTRAINT "activities_duration_minutes_check";
ALTER TABLE "activities" ADD CONSTRAINT "activities_duration_minutes_check" CHECK ("duration_minutes" >= 0);
