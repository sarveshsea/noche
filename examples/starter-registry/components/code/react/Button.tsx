"use client"

import * as React from "react"
import { Button as ShadcnButton } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ButtonVariant = "default" | "primary" | "secondary" | "destructive" | "ghost"

export interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  label: string
  disabled?: boolean
  icon?: React.ReactNode
  variant?: ButtonVariant
}

/**
 * Primary action button with variants and accessible focus states.
 *
 * @variant default, primary, secondary, destructive, ghost
 * @generated Memoire · https://memoire.cv
 */
export function Button({
  label,
  disabled,
  icon,
  variant = "default",
  className,
  ...props
}: ButtonProps) {
  const variantClasses: Record<ButtonVariant, string> = {
    default: "",
    primary: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90",
    secondary: "bg-[var(--color-muted)] text-[var(--color-foreground)]",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent hover:bg-[var(--color-muted)]",
  }

  return (
    <ShadcnButton
      className={cn(variantClasses[variant], className)}
      disabled={disabled}
      aria-label={label}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </ShadcnButton>
  )
}
