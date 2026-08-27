import { NextRequest, NextResponse } from 'next/server';
import { fetchJiraDashboardData, getJiraConfig } from '@/lib/jira/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const config = getJiraConfig();
    if (!config) {
      return NextResponse.json(
        {
          configured: false,
          error: 'Jira API credentials not configured. Please set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN in your environment variables.',
        },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    const data = await fetchJiraDashboardData(forceRefresh);
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
