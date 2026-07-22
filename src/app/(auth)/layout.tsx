export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-sm">
        <div className='text-primary text-5xl font-bold text-center mb-5 font-[family-name:var(--font-bevan)]'>Tabuddy</div>
        {children}</div>
    </div>
  )
}
