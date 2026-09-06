import { google, sheets_v4 } from 'googleapis';

let cachedClient: sheets_v4.Sheets | null = null;

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID;
  if (!id) throw new Error('GOOGLE_SPREADSHEET_ID is not set');
  return id;
}

export async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (cachedClient) return cachedClient;

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId) throw new Error('GOOGLE_OAUTH_CLIENT_ID is not set');
  if (!clientSecret) throw new Error('GOOGLE_OAUTH_CLIENT_SECRET is not set');
  if (!refreshToken) throw new Error('GOOGLE_OAUTH_REFRESH_TOKEN is not set');

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  cachedClient = google.sheets({ version: 'v4', auth });
  return cachedClient;
}
