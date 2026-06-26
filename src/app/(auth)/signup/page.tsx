import Link from 'next/link'
import { signup } from '@/lib/actions/auth'
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

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">
          建立帳號
        </CardTitle>
        <CardDescription>開始規劃你的第一趟旅程</CardDescription>
      </CardHeader>

      <CardContent>
        {error && <AuthError message={decodeURIComponent(error)} />}

        <form action={signup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">名稱</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="你的名字"
              required
              autoComplete="name"
            />
          </div>

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
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full">
            建立帳號
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        已有帳號？&nbsp;
        <Link href="/login" className="text-foreground font-medium hover:underline">
          登入
        </Link>
      </CardFooter>
    </Card>
  )
}
