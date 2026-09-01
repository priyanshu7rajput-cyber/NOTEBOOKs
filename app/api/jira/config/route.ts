import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { testJiraConnection } from '@/lib/jira/client';

export const dynamic = 'force-dynamic';

// GET: Retrieve user's configured Jira details (token is masked)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_jira_configs')
      .select('jira_base_url, jira_email, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to get user jira config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ configured: false });
    }

    return NextResponse.json({
      configured: true,
      baseUrl: data.jira_base_url,
      email: data.jira_email,
      updatedAt: data.updated_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST: Save or update user's Jira credentials
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await request.json();
    let { baseUrl, email, apiToken } = body;

    if (!baseUrl || !email || !apiToken) {
      return NextResponse.json(
        { error: 'Missing required fields: baseUrl, email, and apiToken are required.' },
        { status: 400 }
      );
    }

    baseUrl = baseUrl.trim().replace(/\/+$/, '');
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    email = email.trim();
    apiToken = apiToken.trim();

    // Verify connection first before saving
    const testResult = await testJiraConnection({
      baseUrl,
      email,
      apiToken,
    });

    if (!testResult.success) {
      return NextResponse.json(
        { error: `Verification failed: ${testResult.error || 'Could not connect to Jira Cloud'}` },
        { status: 400 }
      );
    }

    // Upsert into user_jira_configs
    const { error: upsertError } = await supabase
      .from('user_jira_configs')
      .upsert(
        {
          user_id: user.id,
          jira_base_url: baseUrl,
          jira_email: email,
          jira_api_token: apiToken,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      console.error('Error saving user jira config:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Jira successfully connected as ${testResult.user}!`,
      user: testResult.user,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Test credentials without saving
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    let { baseUrl, email, apiToken } = body;

    if (!baseUrl || !email || !apiToken) {
      return NextResponse.json(
        { error: 'Missing required fields: baseUrl, email, and apiToken are required.' },
        { status: 400 }
      );
    }

    baseUrl = baseUrl.trim().replace(/\/+$/, '');
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    email = email.trim();
    apiToken = apiToken.trim();

    const testResult = await testJiraConnection({
      baseUrl,
      email,
      apiToken,
    });

    if (!testResult.success) {
      return NextResponse.json({ success: false, error: testResult.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: testResult.user,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Disconnect / Remove user's Jira credentials
export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { error } = await supabase
      .from('user_jira_configs')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Jira disconnected successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
