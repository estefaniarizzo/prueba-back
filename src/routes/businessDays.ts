import { Router, Request, Response } from 'express';
import { DateTime } from 'luxon';
import { calculateBusinessDate } from '../dateUtils';
import { ApiResponseError, ApiResponseSuccess } from '../types';

const router = Router();

// GET /business-days?days=1&hours=2&date=2025-01-01T00:00:00Z
router.get('/', async (req: Request, res: Response) => {
  const daysParam = req.query.days as string | undefined;
  const hoursParam = req.query.hours as string | undefined;
  const dateParam = req.query.date as string | undefined;

  if (!daysParam && !hoursParam) {
    const err: ApiResponseError = { error: 'invalid_request', message: 'At least one of days or hours must be provided' };
    return res.status(400).json(err);
  }

  const days = daysParam ? parseInt(daysParam, 10) : 0;
  const hours = hoursParam ? parseInt(hoursParam, 10) : 0;

  if ((daysParam && (isNaN(days) || days < 0)) || (hoursParam && (isNaN(hours) || hours < 0))) {
    const err: ApiResponseError = { error: 'invalid_request', message: 'days and hours must be non-negative integers' };
    return res.status(400).json(err);
  }

  try {
    let start: DateTime;
    if (dateParam) {
      // must be an ISO string in UTC with trailing Z
      if (!dateParam.endsWith('Z')) {
        const e: ApiResponseError = { error: 'invalid_request', message: 'date must be an ISO 8601 string in UTC ending with Z' };
        return res.status(400).json(e);
      }

      const parsed = DateTime.fromISO(dateParam, { zone: 'utc' });
      if (!parsed.isValid) {
        const e: ApiResponseError = { error: 'invalid_request', message: 'date must be a valid ISO 8601 UTC string with Z' };
        return res.status(400).json(e);
      }
      // convert to Colombia zone for calculations
      start = parsed.setZone('America/Bogota');
    } else {
      // current time in Colombia
      start = DateTime.now().setZone('America/Bogota');
    }

    const resultLocal = await calculateBusinessDate(start, days, hours);

    // Return result converted to UTC ISO with Z, no extra fields
  const resultUtcIso = resultLocal.setZone('utc').toISO({ suppressMilliseconds: true }) ?? resultLocal.toUTC().toISO({ suppressMilliseconds: true }) ?? '';
  const success: ApiResponseSuccess = { date: resultUtcIso };
    return res.status(200).json(success);
  } catch (err: any) {
    const e: ApiResponseError = { error: 'internal_error', message: err?.message ?? 'Unknown error' };
    return res.status(500).json(e);
  }
});

export default router;
