import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      {children}
    </div>
  )
}
