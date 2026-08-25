// ============================================================
// STREAKER — Missed Day Coin Redistribution (daily cron)
// ============================================================
//
// Runs once a day (schedule it via Supabase Dashboard -> Integrations ->
// Cron -> New cron job -> "Supabase Edge Functions" target, pointed at this
// function, schedule `0 0 * * *`). Evaluates the UTC calendar day that just
// ended for every group streak, and calls redistribute_missed_day_coins()
// (defined in supabase/schema.sql) once per eligible streak - that function
// does the actual member/check-in math and coin balance update atomically.
//
// This function only figures out WHICH (streak, day) pairs are eligible;
// all the redistribution logic itself lives in the SQL function so it stays
// atomic and idempotent regardless of how this function is invoked or
// retried.

import { createClient } from 'npm:@supabase/supabase-js@2';

function utcYesterday(): string {
  const now = new Date();
  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  return yesterday.toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysBetweenUtc(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  return Math.floor((end - start) / 86400000);
}

Deno.serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars');
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const targetDate = utcYesterday();

    const { data: streaks, error: streaksErr } = await supabase
      .from('streaks')
      .select('id, created_at, target_days')
      .eq('is_group', true);

    if (streaksErr) throw streaksErr;

    const eligible = (streaks || []).filter((s) => {
      const startDate = s.created_at.slice(0, 10);
      if (targetDate < startDate) return false; // streak hadn't started yet
      if (s.target_days) {
        const dayNumber = daysBetweenUtc(startDate, targetDate) + 1;
        if (dayNumber > s.target_days) return false; // streak's target window already ended
      }
      return true;
    });

    const results: Array<{ streak_id: string; ok: boolean; error?: string }> = [];

    for (const streak of eligible) {
      const { error } = await supabase.rpc('redistribute_missed_day_coins', {
        p_streak_id: streak.id,
        p_target_date: targetDate,
      });
      results.push({ streak_id: streak.id, ok: !error, error: error?.message });
    }

    return new Response(
      JSON.stringify({ target_date: targetDate, eligible_streaks: eligible.length, results }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
