import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Feature: 加入旅程
export default async function JoinTripPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rule: 使用者必須已登入才能加入旅程
  if (!user) {
    redirect(`/login?join=${encodeURIComponent(token)}`);
  }

  redirect(`/dashboard?join=${encodeURIComponent(token)}`);
}
