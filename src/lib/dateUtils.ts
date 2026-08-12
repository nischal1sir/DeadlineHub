/**
 * Safely parses any date input (ISO timestamp, date string, or Date object)
 * into a Date object representing midnight of that day in the user's local timezone,
 * avoiding any UTC/local timezone shifts that could change the calendar day.
 */
export const parseLocalDate = (dateInput: string | Date | undefined | null): Date => {
  if (!dateInput) {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  // If it's a string, extract the year-month-day part directly to prevent timezone shift
  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * Returns a 'YYYY-MM-DD' formatted string of the date,
 * extracting the direct year-month-day part to prevent timezone offset shifts.
 */
export const toLocalDateString = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculates the exact day difference between a deadline/due date and today
 * in terms of calendar days (local time).
 */
export const getDaysRemaining = (dueDateInput: string | Date | undefined | null): number => {
  if (!dueDateInput) return 0;
  const targetDate = parseLocalDate(dueDateInput);
  const today = parseLocalDate(new Date());

  // difference in ms divided by ms in a day, rounded to integer day
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};
