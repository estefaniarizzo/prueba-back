import { VercelRequest, VercelResponse } from '@vercel/node';
import { DateTime } from 'luxon';
import { calculateBusinessDate } from '../src/dateUtils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const daysParam = (req.query.days as string) || undefined;
  const hoursParam = (req.query.hours as string) || undefined;
  const dateParam = (req.query.date as string) || undefined;

  if (!daysParam && !hoursParam) {
    return res.status(400).json({ error: 'invalid_request', message: 'At least one of days or hours must be provided' });
  }

  const days = daysParam ? parseInt(daysParam, 10) : 0;
  const hours = hoursParam ? parseInt(hoursParam, 10) : 0;

  if ((daysParam && (isNaN(days) || days < 0)) || (hoursParam && (isNaN(hours) || hours < 0))) {
    return res.status(400).json({ error: 'invalid_request', message: 'days and hours must be non-negative integers' });
  }

  try {
    let start: DateTime;
    if (dateParam) {
      if (!dateParam.endsWith('Z')) {
        return res.status(400).json({ error: 'invalid_request', message: 'date must be an ISO 8601 string in UTC ending with Z' });
      }
      const parsed = DateTime.fromISO(dateParam, { zone: 'utc' });
      if (!parsed.isValid) {
        return res.status(400).json({ error: 'invalid_request', message: 'date must be a valid ISO 8601 UTC string with Z' });
      }
      start = parsed.setZone('America/Bogota');
    } else {
      start = DateTime.now().setZone('America/Bogota');
    }

    const resultLocal = await calculateBusinessDate(start, days, hours);
    // Ensure ISO UTC without milliseconds and ending with Z
    const resultUtcIso = resultLocal.setZone('utc').toISO({ suppressMilliseconds: true }) ?? resultLocal.toUTC().toISO({ suppressMilliseconds: true }) ?? '';
    return res.status(200).json({ date: resultUtcIso });
  } catch (err: any) {
    return res.status(500).json({ error: 'internal_error', message: err?.message ?? 'Unknown error' });
  }
}
