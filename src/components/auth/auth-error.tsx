export function AuthError({ message }: { message: string }) {
  return (
    <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  )
}
