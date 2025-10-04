export function calculateBusinessDays(startDate: string, endDate: string): number {
  function parseDate(dateStr: string): Date {
    // If format is YYYY-MM-DD, create a local date to avoid timezone shifts
    const ymd = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymd) {
      const y = Number(ymd[1]);
      const m = Number(ymd[2]);
      const d = Number(ymd[3]);
      return new Date(y, m - 1, d);
    }
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      throw new Error('Invalid date');
    }
    return parsed;
  }

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  // If end is before or same as start, there are 0 business days between (excluding start)
  if (end <= start) return 0;

  let count = 0;

  // start counting from the next day after start (exclude start)
  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  current.setDate(current.getDate() + 1);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Skip Sunday (0) and Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}
