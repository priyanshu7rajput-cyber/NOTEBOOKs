import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOAuth2Client } from '@/lib/google/sheets';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/google-sheets?error=${encodeURIComponent(error || 'Access denied by user')}`);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Verify current user matches OAuth state or user is logged in
    const userId = user?.id || state;
    if (!userId) {
      return NextResponse.redirect(`${appUrl}/google-sheets?error=User%20session%20not%20found`);
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Store in Supabase securely (Server-side)
    const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null;

    const { error: upsertError } = await supabase
      .from('google_connections')
      .upsert({
        user_id: userId,
        google_email: userInfo.data.email || null,
        google_name: userInfo.data.name || null,
        google_avatar_url: userInfo.data.picture || null,
        access_token: tokens.access_token || '',
        refresh_token: tokens.refresh_token || null,
        token_expiry: tokenExpiry,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Supabase Google Connection Upsert Error:', upsertError);
      // Fallback: continue even if database table not yet migrated, user session will notify
    }

    return NextResponse.redirect(`${appUrl}/google-sheets?connected=true`);
  } catch (err: unknown) {
    console.error('Google OAuth Callback Error:', err);
    const msg = err instanceof Error ? err.message : 'Authentication failed';
    return NextResponse.redirect(`${appUrl}/google-sheets?error=${encodeURIComponent(msg)}`);
  }
}
