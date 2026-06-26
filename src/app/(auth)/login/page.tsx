import { Suspense } from 'react'
import Link from 'next/link'
import { login } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthError } from '@/components/auth/auth-error'
import { AuthMessageToast } from '@/components/auth/auth-message-toast'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <>
      <Suspense>
        <AuthMessageToast />
      </Suspense>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            歡迎回來
          </CardTitle>
          <CardDescription>登入以繼續你的旅程</CardDescription>
        </CardHeader>

        <CardContent>
          {error && <AuthError message={decodeURIComponent(error)} />}

          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">電子郵件</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full">
              登入
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center text-sm text-muted-foreground">
          還沒有帳號？&nbsp;
          <Link href="/signup" className="text-foreground font-medium hover:underline">
            註冊
          </Link>
        </CardFooter>
      </Card>
    </>
  )
}
