import { google, sheets_v4 } from 'googleapis';

let cachedClient: sheets_v4.Sheets | null = null;

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID;
  if (!id) throw new Error('GOOGLE_SPREADSHEET_ID is not set');
  return id;
}

export async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (cachedClient) return cachedClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email) throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL is not set');
  if (!privateKey) throw new Error('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is not set');

  const auth = new google.auth.JWT({
    email,
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  cachedClient = google.sheets({ version: 'v4', auth });
  return cachedClient;
}
