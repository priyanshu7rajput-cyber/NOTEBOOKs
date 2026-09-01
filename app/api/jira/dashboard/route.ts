import { NextRequest, NextResponse } from 'next/server';
import { fetchJiraDashboardData, getJiraConfig } from '@/lib/jira/client';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userConfig: { baseUrl: string; email: string; apiToken: string } | null = null;

    if (user) {
      const { data: dbConfig } = await supabase
        .from('user_jira_configs')
        .select('jira_base_url, jira_email, jira_api_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (dbConfig && dbConfig.jira_base_url && dbConfig.jira_email && dbConfig.jira_api_token) {
        userConfig = {
          baseUrl: dbConfig.jira_base_url.replace(/\/+$/, ''),
          email: dbConfig.jira_email,
          apiToken: dbConfig.jira_api_token,
        };
      }
    }

    // Strictly require user-specific Jira config
    if (!userConfig) {
      return NextResponse.json(
        {
          configured: false,
          error: 'Jira API is not configured for your account. Please add your Jira Domain, Email, and API Token in Settings.',
        },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    const data = await fetchJiraDashboardData(forceRefresh, userConfig);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Jira API Route Error:', error);
    const statusCode = error.message?.includes('401') || error.message?.includes('authentication') ? 401 :
                       error.message?.includes('403') || error.message?.includes('forbidden') ? 403 :
                       error.message?.includes('429') || error.message?.includes('rate limit') ? 429 : 500;

    return NextResponse.json(
      {
        configured: true,
        error: error.message || 'An unexpected error occurred while communicating with Jira.',
      },
      { status: statusCode }
    );
  }
}
