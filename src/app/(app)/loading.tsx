export default function Loading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <span className="text-primary font-[family-name:var(--font-bevan)] text-2xl">
        Tabuddy
      </span>
      <span className="border-muted border-t-primary size-6 animate-spin rounded-full border-2" />
    </div>
  )
}
