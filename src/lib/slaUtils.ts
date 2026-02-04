import { differenceInCalendarDays, addDays, isFriday, isSaturday, isSameDay } from 'date-fns';

/**
 * Calculates working days between two dates, excluding Fridays, Saturdays and Holidays.
 * @param start Start date
 * @param end End date
 * @param holidays Array of holiday dates (Date objects or strings)
 * @returns Number of working days
 */
export function calculateWorkingDays(
    start: Date,
    end: Date,
    holidays: (Date | string)[] = []
): number {
    if (start > end) return 0;

    let count = 0;
    let current = start;
    const holidayDates = holidays.map(h => new Date(h));

    while (current <= end) {
        const isWeekend = isFriday(current) || isSaturday(current);
        const isHoliday = holidayDates.some(h => isSameDay(h, current));

        if (!isWeekend && !isHoliday) {
            count++;
        }
        current = addDays(current, 1);
    }

    return count;
}
