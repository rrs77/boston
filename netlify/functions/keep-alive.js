/**
 * Netlify Function to keep Supabase database active
 * This function makes a lightweight query to Supabase to prevent auto-pause
 * 
 * Set up a daily cron job to call this endpoint:
 * https://kaleidoscopic-selkie-30292c.netlify.app/.netlify/functions/keep-alive
 * 
 * Free cron services:
 * - https://cron-job.org (recommended - free, reliable)
 * - https://www.easycron.com
 * - https://cronitor.io (free tier available)
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wiudrzdkbpyziaodqoog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdWRyemRrYnB5emlhb2Rxb29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzgxNzcsImV4cCI6MjA2NjUxNDE3N30.LpD82hY_1wYzroA09nYfaz13iNx5gRJzmPTt0gPCLMI';

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Make a lightweight query to keep the database active
    // Querying a small table or using a simple SELECT 1 query
    const { data, error } = await supabase
      .from('activities')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase ping error:', error);
      // Even if there's an error, the connection attempt helps keep it awake
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          message: 'Ping attempted (error occurred but connection was made)',
          timestamp: new Date().toISOString(),
          error: error.message,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Supabase database pinged successfully',
        timestamp: new Date().toISOString(),
        dataReceived: !!data,
      }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
