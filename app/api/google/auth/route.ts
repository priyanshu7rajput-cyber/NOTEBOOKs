import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOAuth2Client, GOOGLE_SCOPES } from '@/lib/google/sheets';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 });
    }

    const oauth2Client = getOAuth2Client();

    // Generate OAuth URL with state containing user id
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // ensures refresh_token is returned
      prompt: 'consent',       // forces prompt to ensure refresh_token on reconnect
      scope: GOOGLE_SCOPES,
      state: user.id,
    });

    return NextResponse.redirect(authUrl);
  } catch (error: unknown) {
    console.error('Google Auth Init Error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to initialize Google login';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
