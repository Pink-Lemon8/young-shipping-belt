"use client"

import * as React from "react"
import {
    addDays,
    endOfDay,
    endOfMonth,
    format,
    getMonth,
    getYear,
    isWeekend,
    max,
    min,
    setMonth,
    setYear,
    startOfDay,
    startOfMonth,
} from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

function monthOverlapsRange(
    year: number,
    monthIndex: number,
    from?: Date,
    to?: Date
): boolean {
    if (!from && !to) return true
    const monthStart = startOfMonth(new Date(year, monthIndex))
    const monthEnd = endOfMonth(new Date(year, monthIndex))
    const rangeStart = from ? startOfDay(from) : new Date(-8640000000000000)
    const rangeEnd = to ? endOfDay(to) : new Date(8640000000000000)
    return monthStart <= rangeEnd && monthEnd >= rangeStart
}

function yearOverlapsRange(year: number, from?: Date, to?: Date): boolean {
    if (!from && !to) return true
    for (let m = 0; m < 12; m++) {
        if (monthOverlapsRange(year, m, from, to)) return true
    }
    return false
}

function clampToBounds(d: Date, from?: Date, to?: Date): Date {
    if (!from && !to) return d
    let result = new Date(d.getTime())
    if (from) {
        const min = startOfDay(from)
        if (result < min) result = min
    }
    if (to) {
        const max = endOfDay(to)
        if (result > max) result = max
    }
    return result
}

function monthOverlapInterval(
    year: number,
    monthIndex: number,
    from?: Date,
    to?: Date
): { start: Date; end: Date } | null {
    if (!monthOverlapsRange(year, monthIndex, from, to)) return null
    const monthStart = startOfMonth(new Date(year, monthIndex))
    const monthEnd = endOfMonth(new Date(year, monthIndex))
    const rangeStart = from ? startOfDay(from) : monthStart
    const rangeEnd = to ? endOfDay(to) : monthEnd
    const start = max([monthStart, rangeStart])
    const end = min([monthEnd, rangeEnd])
    if (start > end) return null
    return { start, end }
}

function monthHasSelectableDay(
    year: number,
    monthIndex: number,
    from?: Date,
    to?: Date,
    disableWeekends = false
): boolean {
    if (!disableWeekends) {
        return monthOverlapsRange(year, monthIndex, from, to)
    }
    const interval = monthOverlapInterval(year, monthIndex, from, to)
    if (!interval) return false
    const lastDay = startOfDay(interval.end)
    for (
        let cur = startOfDay(interval.start);
        cur.getTime() <= lastDay.getTime();
        cur = addDays(cur, 1)
    ) {
        if (!isWeekend(cur)) return true
    }
    return false
}

function yearHasSelectableDay(
    year: number,
    from?: Date,
    to?: Date,
    disableWeekends = false
): boolean {
    if (!disableWeekends) return yearOverlapsRange(year, from, to)
    for (let m = 0; m < 12; m++) {
        if (monthHasSelectableDay(year, m, from, to, true)) return true
    }
    return false
}

function adjustAwayFromWeekend(d: Date, from?: Date, to?: Date): Date {
    let result = clampToBounds(d, from, to)
    if (!isWeekend(result)) return result

    const minTime = from ? startOfDay(from).getTime() : -Infinity
    const maxTime = to ? endOfDay(to).getTime() : Infinity

    let forward = result
    while (isWeekend(forward) && forward.getTime() <= maxTime) {
        forward = addDays(forward, 1)
    }
    if (
        !isWeekend(forward) &&
        forward.getTime() >= minTime &&
        forward.getTime() <= maxTime
    ) {
        return startOfDay(forward)
    }

    let backward = result
    while (isWeekend(backward) && backward.getTime() >= minTime) {
        backward = addDays(backward, -1)
    }
    if (
        !isWeekend(backward) &&
        backward.getTime() >= minTime &&
        backward.getTime() <= maxTime
    ) {
        return startOfDay(backward)
    }

    return startOfDay(result)
}

interface DatePickerProps {
    value?: Date;
    onChange?: (date: Date) => void;
    className?: string;
    startYear?: number;
    endYear?: number;
    fromDate?: Date;
    toDate?: Date;
    disabled?: boolean;
    disableWeekends?: boolean;
}
export function DatePicker({
    disabled = false,
    value,
    onChange,
    startYear = getYear(new Date()) - 100,
    endYear = getYear(new Date()) + 100,
    fromDate = undefined,
    toDate = undefined,
    className,
    disableWeekends = false,
}: DatePickerProps) {

    const [open, setOpen] = React.useState(false);

    const [date, setDate] = React.useState<Date>(value || new Date());

    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];
    const years = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => startYear + i
    );

    const handleMonthChange = (month: string) => {
        const newDate = clampToBounds(
            setMonth(date, months.indexOf(month)),
            fromDate,
            toDate
        )
        setDate(newDate)
        onChange?.(newDate)
    }

    const handleYearChange = (year: string) => {
        const newDate = clampToBounds(
            setYear(date, parseInt(year, 10)),
            fromDate,
            toDate
        )
        setDate(newDate)
        onChange?.(newDate)
    }

    const handleSelect = (selectedData: Date | undefined) => {
        if (selectedData) {
            setDate(selectedData)
            onChange?.(selectedData)
            setOpen(false);
        }
    }

    return (
        <Popover open={open && !disabled} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <div className="flex justify-between p-2">
                    <Select
                        onValueChange={handleMonthChange}
                        value={months[getMonth(date)]}
                    >
                        <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((month, index) => (
                                <SelectItem
                                    key={month}
                                    value={month}
                                    disabled={
                                        !monthHasSelectableDay(
                                            getYear(date),
                                            index,
                                            fromDate,
                                            toDate,
                                            disableWeekends
                                        )
                                    }
                                >
                                    {month}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        onValueChange={handleYearChange}
                        value={getYear(date).toString()}
                    >
                        <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((year) => (
                                <SelectItem
                                    key={year}
                                    value={year.toString()}
                                    disabled={
                                        !yearHasSelectableDay(
                                            year,
                                            fromDate,
                                            toDate,
                                            disableWeekends
                                        )
                                    }
                                >
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Calendar
                    disabled={
                        disabled
                            ? true
                            : disableWeekends
                                ? (d) => isWeekend(d)
                                : undefined
                    }
                    mode="single"
                    fromDate={fromDate}
                    toDate={toDate}
                    selected={date}
                    onSelect={handleSelect}
                    initialFocus
                    month={date}
                    onMonthChange={setDate}
                />
            </PopoverContent>
        </Popover>
    )
}