import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'GOOGLE_OAUTH_CLIENT_ID/SECRET not set' }, { status: 500 });
  }

  const redirectUri = `${new URL(req.url).origin}/api/auth/google/callback`;
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) {
    return new NextResponse(
      '<p>Google did not return a refresh token. This usually means access was already granted once before — revoke it at <a href="https://myaccount.google.com/permissions">Google Account permissions</a> and try again.</p>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  return new NextResponse(
    `<!doctype html><html><body style="font-family: sans-serif; max-width: 600px; margin: 40px auto;">
      <h1>New refresh token</h1>
      <p>Copy this value into <code>GOOGLE_OAUTH_REFRESH_TOKEN</code> in your Vercel project's environment variables, then redeploy:</p>
      <textarea readonly style="width: 100%; height: 4em; font-family: monospace;">${tokens.refresh_token}</textarea>
      <p>This page does not store this value anywhere — copy it now.</p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}
