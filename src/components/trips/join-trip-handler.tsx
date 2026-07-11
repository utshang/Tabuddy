"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { joinTrip } from "@/lib/actions/trips";

// Feature: 加入旅程
export function JoinTripHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = searchParams.get("join");
  const handled = useRef(false);

  useEffect(() => {
    if (!token || handled.current) return;
    handled.current = true;

    joinTrip(token).then((result) => {
      if (result.error) {
        toast.error(result.error);
      } else if (result.alreadyMember) {
        // Rule: 已加入過的使用者重複點擊連結不會產生新的成員記錄
        toast.success("此旅程已經加入囉");
      } else {
        // Rule: 成功加入後使用者的角色為「加入者」
        toast.success("已成功加入旅程");
        router.refresh();
      }

      router.replace(pathname, { scroll: false });
    });
  }, [token, pathname, router]);

  return null;
}
