"use client"

import * as React from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type InputSelectOption = {
  value: string
  label: React.ReactNode
}

export function InputSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  className,
  name,
  "aria-label": ariaLabel,
}: {
  id?: string
  value?: string
  onValueChange?: (value: string) => void
  options: InputSelectOption[]
  placeholder?: string
  className?: string
  name?: string
  "aria-label"?: string
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange?.(v ?? "")}
      name={name}
      items={options}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn("h-9 w-full", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
