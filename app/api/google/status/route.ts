import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Check if Google Service Account credentials exist in environment
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
    const hasServiceAccount = Boolean(serviceAccountEmail || process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (hasServiceAccount) {
      return NextResponse.json({
        connected: true,
        connection: {
          google_email: serviceAccountEmail || 'Service Account Enabled',
          google_name: 'Google Cloud Service Account',
          google_avatar_url: null,
          last_spreadsheet_id: null,
          last_spreadsheet_name: null,
          last_sheet_name: null,
        },
        type: 'service_account',
      }, { status: 200 });
    }

    if (!user) {
      return NextResponse.json({ connected: false, user: null }, { status: 200 });
    }

    const { data: connection, error } = await supabase
      .from('google_connections')
      .select('google_email, google_name, google_avatar_url, last_spreadsheet_id, last_spreadsheet_name, last_sheet_name, updated_at')
      .eq('user_id', user.id)
      .single();

    if (error || !connection) {
      return NextResponse.json({ connected: false, connection: null }, { status: 200 });
    }

    return NextResponse.json({ connected: true, connection, type: 'oauth' }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch status';
    return NextResponse.json({ connected: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await supabase
      .from('google_connections')
      .delete()
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, message: 'Google account disconnected successfully.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to disconnect';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
