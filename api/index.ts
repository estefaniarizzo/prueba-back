import { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';
import * as path from 'path';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const filePath = path.join(__dirname, '..', 'public', 'index.html');
    const html = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (err: any) {
    res.status(500).send('Could not load index.html');
  }
}
