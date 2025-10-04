import { DateTime } from 'luxon';

import https from 'https';

const HOLIDAYS_URL = 'https://content.capta.co/Recruitment/WorkingDays.json';

export type HolidaysSet = ReadonlySet<string>;

async function fetchHolidays(): Promise<HolidaysSet> {
  return new Promise<HolidaysSet>((resolve) => {
    const req = https.get(HOLIDAYS_URL, (res) => {
      const { statusCode } = res;
      if (statusCode && statusCode >= 400) {
        res.resume();
        resolve(new Set());
        return;
      }

      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          const dates: string[] = Array.isArray(parsed)
            ? parsed.map((item: any) => (typeof item === 'string' ? item : item.date)).filter(Boolean)
            : [];

          const set = new Set<string>(dates.map((d) => d));
          resolve(set);
        } catch (_err) {
          resolve(new Set());
        }
      });
    });

    // Safety: timeout after 2000ms and resolve empty set
    const to = setTimeout(() => {
      try { req.destroy(); } catch (_) {}
      resolve(new Set());
    }, 2000);

    req.on('close', () => clearTimeout(to));
    req.on('error', () => {
      clearTimeout(to);
      resolve(new Set());
    });
  });
}

const holidaysCache: { value?: HolidaysSet } = {};

export async function getHolidays(): Promise<HolidaysSet> {
  if (holidaysCache.value) return holidaysCache.value;
  const set = await fetchHolidays();
  holidaysCache.value = set;
  return set;
}

// Test helper: clear the cached holidays (used by tests that mock getHolidays)
export function clearHolidaysCache(): void {
  holidaysCache.value = undefined;
}

// Test helper: set the cached holidays directly (used by tests for deterministic behavior)
export function setHolidaysCache(set: HolidaysSet): void {
  holidaysCache.value = set;
}

// Business hours constants (local Colombia time)
const ZONE = 'America/Bogota';
const MORNING_START = { hour: 8, minute: 0 };
const MORNING_END = { hour: 12, minute: 0 };
const AFTERNOON_START = { hour: 13, minute: 0 };
const AFTERNOON_END = { hour: 17, minute: 0 };

function isWeekend(dt: DateTime): boolean {
  const weekday = dt.weekday; // 1 = Monday ... 7 = Sunday
  return weekday === 6 || weekday === 7;
}

function isHoliday(dt: DateTime, holidays: HolidaysSet): boolean {
  const isoDate = dt.toISODate();
  const key = dt.toISODate() ?? dt.toFormat('yyyy-MM-dd');
  return holidays.has(key);
}

function isWorkingDay(dt: DateTime, holidays: HolidaysSet): boolean {
  return !isWeekend(dt) && !isHoliday(dt, holidays);
}

function inMorning(dt: DateTime): boolean {
  return dt >= dt.set(MORNING_START) && dt < dt.set(MORNING_END);
}

function inLunch(dt: DateTime): boolean {
  return dt >= dt.set(MORNING_END) && dt < dt.set(AFTERNOON_START);
}

function inAfternoon(dt: DateTime): boolean {
  return dt >= dt.set(AFTERNOON_START) && dt <= dt.set(AFTERNOON_END);
}

/**
 * Adjust the provided datetime backwards to the nearest previous working time in Colombia local time
 * Rules:
 * - If the date is not a working day (weekend/holiday), move to the previous calendar day until a working day is found and set time to 17:00
 * - If time > 17:00, set to 17:00 same day (if working day), else find previous working day
 * - If time in lunch (12:00-13:00), approximate backwards to 12:00
 * - If time < 8:00, move to previous working day at 17:00
 */
function adjustToPreviousWorkingTime(dtLocal: DateTime, holidays: HolidaysSet): DateTime {
  let dt = dtLocal;

  // If not a working day, go back day-by-day to last working day and set to 17:00
  if (!isWorkingDay(dt, holidays)) {
    do {
      dt = dt.minus({ days: 1 }).set(AFTERNOON_END);
    } while (!isWorkingDay(dt, holidays));
    return dt.setZone(ZONE);
  }

  // Same day but after work end
  if (dt > dt.set(AFTERNOON_END)) {
    return dt.set(AFTERNOON_END);
  }

  // During lunch -> approximate backward to 12:00
  if (inLunch(dt)) {
    return dt.set(MORNING_END);
  }

  // Before work start -> go to previous working day's 17:00
  if (dt < dt.set(MORNING_START)) {
    let prev = dt.minus({ days: 1 }).set(AFTERNOON_END);
    while (!isWorkingDay(prev, holidays)) {
      prev = prev.minus({ days: 1 }).set(AFTERNOON_END);
    }
    return prev.setZone(ZONE);
  }

  // otherwise within working hours
  return dt;
}

/**
 * Add business days while preserving time-of-day.
 */
function addBusinessDays(dt: DateTime, days: number, holidays: HolidaysSet): DateTime {
  let result = dt;
  let added = 0;
  // Avanza al siguiente día hábil (no cuenta el día de inicio)
  while (added < days) {
    result = result.plus({ days: 1 });
    while (!isWorkingDay(result, holidays)) {
      result = result.plus({ days: 1 });
    }
    added++;
  }
  // Si cae en almuerzo, ajusta a 12:00
  if (inLunch(result)) {
    result = result.set(MORNING_END);
  }
  return result;
}

/**
 * Add working hours considering breaks and skipping non-working days/holidays.
 */
function addBusinessHours(dt: DateTime, hours: number, holidays: HolidaysSet): DateTime {
  let remaining = hours;
  let cursor = dt;


  // Helper to move cursor to next working period start if currently outside a working period
  const moveToNextWorkStart = (): void => {
    // If not a working day, move to next working day's morning start
    while (!isWorkingDay(cursor, holidays)) {
      cursor = cursor.plus({ days: 1 }).set(MORNING_START);
    }

    if (cursor < cursor.set(MORNING_START)) {
      cursor = cursor.set(MORNING_START);
    }

    if (cursor >= cursor.set(MORNING_START) && cursor < cursor.set(MORNING_END)) {
      // already at morning
      return;
    }

    if (cursor >= cursor.set(MORNING_END) && cursor < cursor.set(AFTERNOON_START)) {
      cursor = cursor.set(AFTERNOON_START);
      return;
    }

    if (cursor >= cursor.set(AFTERNOON_END)) {
      // move to next working day morning
      cursor = cursor.plus({ days: 1 }).set(MORNING_START);
      while (!isWorkingDay(cursor, holidays)) {
        cursor = cursor.plus({ days: 1 }).set(MORNING_START);
      }
      return;
    }
  };

  // Ensure cursor is within a working time block
  if (!inMorning(cursor) && !inAfternoon(cursor)) {
    // if during lunch or outside working hours, move forward to next valid work start
    if (inLunch(cursor)) {
      cursor = cursor.set(AFTERNOON_START);
    } else if (cursor > cursor.set(AFTERNOON_END)) {
      // after day end
      cursor = cursor.plus({ days: 1 }).set(MORNING_START);
    } else if (cursor < cursor.set(MORNING_START)) {
      cursor = cursor.set(MORNING_START);
    }
    // skip non-working days
    while (!isWorkingDay(cursor, holidays)) {
      cursor = cursor.plus({ days: 1 }).set(MORNING_START);
    }
  }

  while (remaining > 0) {
    
    // If current day becomes non-working due to holiday/weekend, move to next working day morning
    if (!isWorkingDay(cursor, holidays)) {
      cursor = cursor.plus({ days: 1 }).set(MORNING_START);
      while (!isWorkingDay(cursor, holidays)) cursor = cursor.plus({ days: 1 }).set(MORNING_START);
      continue;
    }

    if (inMorning(cursor)) {
      const available = cursor.set(MORNING_END).diff(cursor, 'hours').hours; // hours available in morning
      const take = Math.min(available, remaining);
      cursor = cursor.plus({ hours: take });
      remaining -= take;
      if (remaining <= 0) break;
      // move to afternoon start
      cursor = cursor.set(AFTERNOON_START);
      continue;
    }

    if (inAfternoon(cursor)) {
      const available = cursor.set(AFTERNOON_END).diff(cursor, 'hours').hours;
      const take = Math.min(available, remaining);
      cursor = cursor.plus({ hours: take });
      remaining -= take;
      if (remaining <= 0) break;
      // move to next working day's morning
      cursor = cursor.plus({ days: 1 }).set(MORNING_START);
      while (!isWorkingDay(cursor, holidays)) cursor = cursor.plus({ days: 1 }).set(MORNING_START);
      
      continue;
    }

    // If in lunch or other, move to next work start
    moveToNextWorkStart();
  }

  return cursor;
}

/**
 * Main exported function that calculates the resulting DateTime in Colombia zone.
 * It expects `start` to already be in Colombia zone.
 */
export async function calculateBusinessDate(start: DateTime, days: number, hours: number): Promise<DateTime> {
  const holidays = await getHolidays();

  // Ajusta el inicio hacia atrás al horario laboral válido
  let cursor = start.setZone(ZONE);
  cursor = adjustToPreviousWorkingTime(cursor, holidays);

  // Suma días hábiles: siempre desde el siguiente día hábil
  if (days > 0) {
  cursor = addBusinessDays(cursor, days, holidays);
  }

  // Suma horas hábiles sobre el resultado
  if (hours > 0) {
  cursor = addBusinessHours(cursor, hours, holidays);
  }

  return cursor.setZone(ZONE);
}

