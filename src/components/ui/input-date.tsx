"use client"

import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function InputDate({
    id,
    date,
    onSelect,
    placeholder = "選擇日期",
    className,
}: {
    id?: string
    date?: Date
    onSelect?: (date: Date | undefined) => void
    placeholder?: string
    className?: string
}) {
    return (
        <Popover>
            <PopoverTrigger
                render={
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        data-empty={!date}
                        className={cn(
                            "w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
                            className,
                        )}
                    />
                }
            >
                <CalendarIcon className="size-4" />
                {date ? format(date, "yyyy/MM/dd") : <span>{placeholder}</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={onSelect} />
            </PopoverContent>
        </Popover>
    )
}
