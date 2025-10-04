import { DateTime } from 'luxon';
import * as dateUtils from '../src/dateUtils';

// Mock de festivos relevantes para los ejemplos
const MOCK_HOLIDAYS = new Set([
  '2025-04-17', // Jueves Santo
  '2025-04-18', // Viernes Santo
]);

// Mock getHolidays para todos los tests de este archivo
beforeAll(() => {
  dateUtils.clearHolidaysCache();
  dateUtils.setHolidaysCache(MOCK_HOLIDAYS as any);
});

afterAll(() => {
  dateUtils.clearHolidaysCache();
});

// Helper para formatear la salida como espera el enunciado (UTC ISO con Z, sin milisegundos)
function formatUtc(dt: DateTime): string {
  return dt.setZone('utc').toISO({ suppressMilliseconds: true }) ?? '';
}

describe('Prueba técnica: ejemplos oficiales', () => {
  it('1. Viernes 5pm +1 hora → Lunes 9am (2025-XX-XXT14:00:00Z)', async () => {
    // Viernes 2025-08-01 17:00 hora Colombia
    const start = DateTime.fromISO('2025-08-01T22:00:00Z'); // 17:00 COL = 22:00 UTC
    const result = await dateUtils.calculateBusinessDate(start.setZone('America/Bogota'), 0, 1);
    expect(formatUtc(result)).toBe('2025-08-04T14:00:00Z'); // Lunes 9am COL = 14:00 UTC
  });

  it('2. Sábado 2pm +1 hora → Lunes 9am (2025-XX-XXT14:00:00Z)', async () => {
    // Sábado 2025-08-02 14:00 COL
    const start = DateTime.fromISO('2025-08-02T19:00:00Z'); // 14:00 COL = 19:00 UTC
    const result = await dateUtils.calculateBusinessDate(start.setZone('America/Bogota'), 0, 1);
    expect(formatUtc(result)).toBe('2025-08-04T14:00:00Z'); // Lunes 9am COL = 14:00 UTC
  });

  it('3. Martes 3pm +1 día +4 horas → Jueves 10am (2025-XX-XXT15:00:00Z)', async () => {
    // Martes 2025-08-05 15:00 COL
    const start = DateTime.fromISO('2025-08-05T20:00:00Z'); // 15:00 COL = 20:00 UTC
    const result = await dateUtils.calculateBusinessDate(start.setZone('America/Bogota'), 1, 4);
    expect(formatUtc(result)).toBe('2025-08-07T15:00:00Z'); // Jueves 10am COL = 15:00 UTC
  });

  it('4. Domingo 6pm +1 día → Lunes 5pm (2025-XX-XXT22:00:00Z)', async () => {
    // Domingo 2025-08-03 18:00 COL
    const start = DateTime.fromISO('2025-08-03T23:00:00Z'); // 18:00 COL = 23:00 UTC
    const result = await dateUtils.calculateBusinessDate(start.setZone('America/Bogota'), 1, 0);
    expect(formatUtc(result)).toBe('2025-08-04T22:00:00Z'); // Lunes 5pm COL = 22:00 UTC
  });

  it('5. Día laboral 8am +8 horas → mismo día 5pm (2025-XX-XXT22:00:00Z)', async () => {
    // Miércoles 2025-08-06 08:00 COL
    const start = DateTime.fromISO('2025-08-06T13:00:00Z'); // 08:00 COL = 13:00 UTC
    const result = await dateUtils.calculateBusinessDate(start.setZone('America/Bogota'), 0, 8);
    expect(formatUtc(result)).toBe('2025-08-06T22:00:00Z'); // 17:00 COL = 22:00 UTC
  });

  it('6. Día laboral 8am +1 día → siguiente día laboral 8am (2025-XX-XXT13:00:00Z)', async () => {
    // Miércoles 2025-08-06 08:00 COL
    const start = DateTime.fromISO('2025-08-06T13:00:00Z'); // 08:00 COL = 13:00 UTC
    const result = await dateUtils.calculateBusinessDate(start.setZone('America/Bogota'), 1, 0);
    expect(formatUtc(result)).toBe('2025-08-07T13:00:00Z'); // Jueves 8am COL = 13:00 UTC
  });

  it('7. Día laboral 12:30pm +1 día → siguiente día laboral 12pm (2025-XX-XXT17:00:00Z)', async () => {
    // Miércoles 2025-08-06 12:30 COL
    const start = DateTime.fromISO('2025-08-06T17:30:00Z'); // 12:30 COL = 17:30 UTC
    const result = await dateUtils.calculateBusinessDate(start.setZone('America/Bogota'), 1, 0);
    expect(formatUtc(result)).toBe('2025-08-07T17:00:00Z'); // Jueves 12pm COL = 17:00 UTC
  });

  it('8. Día laboral 11:30am +3 horas → mismo día 3:30pm (2025-XX-XXT20:30:00Z)', async () => {
    // Miércoles 2025-08-06 11:30 COL
    const start = DateTime.fromISO('2025-08-06T16:30:00Z'); // 11:30 COL = 16:30 UTC
    const result = await dateUtils.calculateBusinessDate(start.setZone('America/Bogota'), 0, 3);
    expect(formatUtc(result)).toBe('2025-08-06T20:30:00Z'); // 15:30 COL = 20:30 UTC
  });

  it('9. date=2025-04-10T15:00:00.000Z +5 días +4 horas (festivos 17 y 18) → 2025-04-21T20:00:00.000Z', async () => {
    // Jueves 2025-04-10 10:00 COL
    const start = DateTime.fromISO('2025-04-10T15:00:00.000Z'); // 10:00 COL = 15:00 UTC
    const result = await dateUtils.calculateBusinessDate(start.setZone('America/Bogota'), 5, 4);
    expect(formatUtc(result)).toBe('2025-04-21T20:00:00Z'); // Lunes 15:00 COL = 20:00 UTC
  });
});
