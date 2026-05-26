import type { ComponentProps } from 'react'
import { Toaster as Sonner } from 'sonner'

type ToasterProps = ComponentProps<typeof Sonner>

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',

          '--success-bg': 'var(--toast-success-bg)',
          '--success-border': 'var(--toast-success-border)',
          '--success-text': 'var(--toast-success-text)',

          '--error-bg': 'var(--toast-error-bg)',
          '--error-border': 'var(--toast-error-border)',
          '--error-text': 'var(--toast-error-text)',

          '--warning-bg': 'var(--toast-warning-bg)',
          '--warning-border': 'var(--toast-warning-border)',
          '--warning-text': 'var(--toast-warning-text)',

          '--info-bg': 'var(--toast-info-bg)',
          '--info-border': 'var(--toast-info-border)',
          '--info-text': 'var(--toast-info-text)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}
