import { Suspense } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthMessageToast } from '@/components/auth/auth-message-toast'
import { LoginForm } from '@/components/auth/login-form'

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
          <LoginForm serverError={error ? decodeURIComponent(error) : undefined} />
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
