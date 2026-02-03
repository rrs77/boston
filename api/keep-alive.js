/**
 * Vercel Serverless Function: Supabase keep-alive
 *
 * Queries Supabase so the project does not get paused (free tier pauses after ~7 days).
 * - If SUPABASE_SERVICE_ROLE_KEY is set: uses auth.admin.listUsers() (queries "user" data).
 * - Otherwise: runs a lightweight query on the activities table.
 *
 * Call this every 6 days via Vercel Cron (see vercel.json).
 * You can also call it manually: GET /api/keep-alive
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wiudrzdkbpyziaodqoog.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdWRyemRrYnB5emlhb2Rxb29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzgxNzcsImV4cCI6MjA2NjUxNDE3N30.LpD82hY_1wYzroA09nYfaz13iNx5gRJzmPTt0gPCLMI';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(request) {
  // Cron and manual GET only

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let result;
    if (serviceRoleKey) {
      // Query auth users (service role only) – keeps project active
      const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1 });
      result = {
        success: !error,
        message: error ? 'Auth listUsers attempted' : 'Supabase auth users queried',
        source: 'auth.users',
        userCount: data?.users?.length ?? 0,
      };
      if (error) result.error = error.message;
    } else {
      // Fallback: lightweight query on public table
      const { data, error } = await supabase.from('activities').select('id').limit(1);
      result = {
        success: !error,
        message: error ? 'Ping attempted' : 'Supabase database pinged',
        source: 'activities',
        dataReceived: !!data?.length,
      };
      if (error) result.error = error.message;
    }

    result.timestamp = new Date().toISOString();
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse(
      {
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
}
