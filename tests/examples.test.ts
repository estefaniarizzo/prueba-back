import { DateTime } from 'luxon';

describe('Spec examples for business-date calculations', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  async function runWithHolidays(holidays: string[] | null, fn: (calculate: any) => Promise<void>) {
    const mod = await import('../src/dateUtils');
    if (holidays === null) {
      jest.spyOn(mod, 'getHolidays').mockResolvedValue(new Set<string>());
    } else {
      jest.spyOn(mod, 'getHolidays').mockResolvedValue(new Set<string>(holidays));
    }
    const { calculateBusinessDate } = mod;
    await fn(calculateBusinessDate);
  }

  it('1) Friday 17:00 + hours=1 => Monday 09:00 (UTC 14:00Z)', async () => {
    await runWithHolidays([], async (calculateBusinessDate) => {
      const start = DateTime.fromObject({ year: 2025, month: 10, day: 3, hour: 17, minute: 0 }, { zone: 'America/Bogota' });
      const res = await calculateBusinessDate(start, 0, 1);
      expect(res.setZone('utc').toISO({ suppressMilliseconds: true })).toBe('2025-10-06T14:00:00Z');
    });
  });

  it('2) Saturday 14:00 + hours=1 => Monday 09:00 (UTC 14:00Z)', async () => {
    await runWithHolidays([], async (calculateBusinessDate) => {
      const start = DateTime.fromObject({ year: 2025, month: 10, day: 4, hour: 14, minute: 0 }, { zone: 'America/Bogota' });
      const res = await calculateBusinessDate(start, 0, 1);
      expect(res.setZone('utc').toISO({ suppressMilliseconds: true })).toBe('2025-10-06T14:00:00Z');
    });
  });

  it('3) Tuesday 15:00 days=1 hours=4 => Thursday 10:00 (UTC 15:00Z)', async () => {
    await runWithHolidays([], async (calculateBusinessDate) => {
      const start = DateTime.fromObject({ year: 2025, month: 10, day: 7, hour: 15, minute: 0 }, { zone: 'America/Bogota' });
      const res = await calculateBusinessDate(start, 1, 4);
      expect(res.setZone('utc').toISO({ suppressMilliseconds: true })).toBe('2025-10-09T15:00:00Z');
    });
  });

  it('4) Sunday 18:00 days=1 => Monday 17:00 (UTC 22:00Z)', async () => {
    await runWithHolidays([], async (calculateBusinessDate) => {
      const start = DateTime.fromObject({ year: 2025, month: 10, day: 5, hour: 18, minute: 0 }, { zone: 'America/Bogota' });
      const res = await calculateBusinessDate(start, 1, 0);
      expect(res.setZone('utc').toISO({ suppressMilliseconds: true })).toBe('2025-10-06T22:00:00Z');
    });
  });

  it('5) hours=8 from 08:00 => same day 17:00 (UTC 22:00Z)', async () => {
    await runWithHolidays([], async (calculateBusinessDate) => {
      const start = DateTime.fromObject({ year: 2025, month: 10, day: 6, hour: 8, minute: 0 }, { zone: 'America/Bogota' });
      const res = await calculateBusinessDate(start, 0, 8);
      expect(res.setZone('utc').toISO({ suppressMilliseconds: true })).toBe('2025-10-06T22:00:00Z');
    });
  });

  it('6) days=1 from 08:00 => next working day 08:00 (UTC 13:00Z)', async () => {
    await runWithHolidays([], async (calculateBusinessDate) => {
      const start = DateTime.fromObject({ year: 2025, month: 10, day: 6, hour: 8, minute: 0 }, { zone: 'America/Bogota' });
      const res = await calculateBusinessDate(start, 1, 0);
      expect(res.setZone('utc').toISO({ suppressMilliseconds: true })).toBe('2025-10-07T13:00:00Z');
    });
  });

  it('7) days=1 from 12:30 => next working day 12:00 (UTC 17:00Z)', async () => {
    await runWithHolidays([], async (calculateBusinessDate) => {
      const start = DateTime.fromObject({ year: 2025, month: 10, day: 6, hour: 12, minute: 30 }, { zone: 'America/Bogota' });
      const res = await calculateBusinessDate(start, 1, 0);
      expect(res.setZone('utc').toISO({ suppressMilliseconds: true })).toBe('2025-10-07T17:00:00Z');
    });
  });

  it('8) hours=3 from 11:30 => same day 15:30 (UTC 20:30Z)', async () => {
    await runWithHolidays([], async (calculateBusinessDate) => {
      const start = DateTime.fromObject({ year: 2025, month: 10, day: 6, hour: 11, minute: 30 }, { zone: 'America/Bogota' });
      const res = await calculateBusinessDate(start, 0, 3);
      expect(res.setZone('utc').toISO({ suppressMilliseconds: true })).toBe('2025-10-06T20:30:00Z');
    });
  });

  it('9) date=2025-04-10T15:00:00.000Z days=5 hours=4 (17/18 Apr are holidays) => 2025-04-21T20:00:00Z', async () => {
    // Mock holidays to include 2025-04-17 and 2025-04-18
    await runWithHolidays(['2025-04-17', '2025-04-18'], async (calculateBusinessDate) => {
      const start = DateTime.fromISO('2025-04-10T15:00:00.000Z', { zone: 'utc' });
      const res = await calculateBusinessDate(start, 5, 4);
      expect(res.setZone('utc').toISO({ suppressMilliseconds: true })).toBe('2025-04-21T20:00:00Z');
    });
  });
});
