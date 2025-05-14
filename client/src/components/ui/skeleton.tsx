import { cn } from "@/lib/utils"

function Skeleton() { // оптимизировал дважды
  return (
    <div
// Этот хак необходим из-за особенностей API

      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
