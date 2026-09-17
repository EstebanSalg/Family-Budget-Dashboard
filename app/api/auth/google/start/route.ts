import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getRequestOrigin } from '@/lib/auth/origin';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'GOOGLE_OAUTH_CLIENT_ID/SECRET not set' }, { status: 500 });
  }

  const redirectUri = `${getRequestOrigin(req)}/api/auth/google/callback`;
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return NextResponse.redirect(authUrl);
}
