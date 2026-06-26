import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AuthMessageToast } from "@/components/auth/auth-message-toast";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <Suspense>
        <AuthMessageToast />
      </Suspense>
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">
          我的旅程
        </h1>
        <p className="mt-1">
          你好，{user?.user_metadata?.full_name ?? user?.email}
          ！一起來規劃下一趟旅程吧。
        </p>
      </div>

      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-lg font-medium">還沒有任何旅程</p>
        <p className="mt-1 text-sm">點擊「新增旅程」開始規劃</p>
      </div>
    </div>
  );
}
