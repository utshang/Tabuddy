"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const MESSAGES: Record<string, { title: string; description: string }> = {
  check_email: {
    title: "註冊成功！",
    description: "請至 Email 收取驗證信，點擊連結後即可登入。",
  },
  login_success: {
    title: "登入成功",
    description: "歡迎回來！",
  },
};

export function AuthMessageToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const shown = useRef(false);

  useEffect(() => {
    if (message && MESSAGES[message] && !shown.current) {
      shown.current = true;
      const { title, description } = MESSAGES[message];
      toast.success(title, { description, duration: 3000 });
      router.replace(pathname, { scroll: false });
    }
  }, [message, pathname, router]);

  return null;
}
