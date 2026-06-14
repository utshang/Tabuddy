import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/app/app-nav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-full flex flex-col">
      <AppNav user={user} />
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-6">
        {children}
      </main>
    </div>
  )
}
