import { DateTime } from 'luxon';
import { calculateBusinessDate } from '../src/dateUtils';

test('adds 1 day', async () => {
  const start = DateTime.fromISO('2025-01-01T08:00:00Z');
  const result = await calculateBusinessDate(start, 1, 0);
  expect(result.toISO()).toContain('2025-01-02');
});
