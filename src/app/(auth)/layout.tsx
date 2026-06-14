export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
