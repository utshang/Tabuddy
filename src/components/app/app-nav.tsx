"use client"

import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { logout } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

export function AppNav({ user }: { user: User }) {
  const displayName = user.user_metadata?.full_name ?? user.email

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="text-primary font-bold text-lg  font-[family-name:var(--font-bevan)]">
          Tabuddy
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-sm">{displayName}</span>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="cursor-pointer"
            >
              登出
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
