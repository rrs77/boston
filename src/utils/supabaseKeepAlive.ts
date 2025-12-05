import { supabase, TABLES, isSupabaseConfigured } from '../config/supabase';

const STORAGE_KEY = 'supabase_last_ping';
const PING_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Makes a lightweight query to Supabase to keep the database active
 * This prevents Supabase from going to sleep due to inactivity
 */
async function pingSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.log('⏭️ Supabase not configured, skipping keep-alive ping');
    return false;
  }

  try {
    // Make a lightweight query - just count activities (or any table)
    // This is a minimal query that won't affect performance
    const { count, error } = await supabase
      .from(TABLES.ACTIVITIES)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn('⚠️ Supabase keep-alive ping failed:', error);
      return false;
    }

    const timestamp = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, timestamp);
    console.log(`✅ Supabase keep-alive ping successful (${count || 0} activities)`);
    return true;
  } catch (error) {
    console.error('❌ Supabase keep-alive ping error:', error);
    return false;
  }
}

/**
 * Checks if a ping is needed and performs it if necessary
 * Returns true if ping was performed, false if not needed yet
 */
export async function checkAndPingSupabase(): Promise<boolean> {
  const lastPing = localStorage.getItem(STORAGE_KEY);
  
  if (!lastPing) {
    // First time - ping immediately
    console.log('🔄 First Supabase keep-alive ping');
    return await pingSupabase();
  }

  const lastPingTime = new Date(lastPing).getTime();
  const now = Date.now();
  const timeSinceLastPing = now - lastPingTime;

  if (timeSinceLastPing >= PING_INTERVAL_MS) {
    // It's been 24 hours or more - ping now
    const hoursSince = Math.floor(timeSinceLastPing / (60 * 60 * 1000));
    console.log(`🔄 Supabase keep-alive ping needed (${hoursSince} hours since last ping)`);
    return await pingSupabase();
  }

  // Not time yet
  const hoursRemaining = Math.floor((PING_INTERVAL_MS - timeSinceLastPing) / (60 * 60 * 1000));
  console.log(`⏰ Supabase keep-alive: Next ping in ${hoursRemaining} hours`);
  return false;
}

/**
 * Initializes the keep-alive service
 * Sets up a daily interval to check and ping Supabase
 * Also checks immediately on initialization
 */
export function initializeSupabaseKeepAlive(): () => void {
  console.log('🚀 Initializing Supabase keep-alive service');

  // Check immediately
  checkAndPingSupabase();

  // Set up interval to check every hour (will only ping if 24 hours have passed)
  const intervalId = setInterval(() => {
    checkAndPingSupabase();
  }, 60 * 60 * 1000); // Check every hour

  // Return cleanup function
  return () => {
    console.log('🛑 Stopping Supabase keep-alive service');
    clearInterval(intervalId);
  };
}

