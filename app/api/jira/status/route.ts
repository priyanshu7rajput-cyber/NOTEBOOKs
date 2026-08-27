import { NextResponse } from 'next/server';
import { getJiraConfig } from '@/lib/jira/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = getJiraConfig();
  if (!config) {
    return NextResponse.json({
      configured: false,
    });
  }

  return NextResponse.json({
    configured: true,
    baseUrl: config.baseUrl,
    email: config.email,
  });
}
