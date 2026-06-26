import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SignupForm } from '@/components/auth/signup-form'

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
        <SignupForm serverError={error ? decodeURIComponent(error) : undefined} />
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
