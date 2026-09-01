import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getJiraConfig } from '@/lib/jira/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from('user_jira_configs')
        .select('jira_base_url, jira_email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data && data.jira_base_url) {
        return NextResponse.json({
          configured: true,
          source: 'user_database',
          baseUrl: data.jira_base_url,
          email: data.jira_email,
        });
      }
    }

    return NextResponse.json({
      configured: false,
    });
  } catch (err) {
    return NextResponse.json({ configured: false });
  }
}
