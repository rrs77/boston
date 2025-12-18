/**
 * Netlify Functions URL Helper
 * 
 * Fixes SSL issues with custom domains by routing function calls
 * through the Netlify subdomain instead of custom domain.
 * 
 * Issue: POST requests to Netlify Functions fail on custom domains
 * with ERR_SSL_PROTOCOL_ERROR, but work on *.netlify.app subdomain.
 * 
 * Solution: Detect custom domain and use Netlify subdomain for functions.
 */

/**
 * Get the base URL for Netlify Functions
 * 
 * - If on *.netlify.app: Use relative path (same origin)
 * - If on custom domain: Use Netlify subdomain (from env or fallback)
 * - If on localhost: Use relative path (dev mode)
 * 
 * @returns Base URL for Netlify Functions (empty string for relative, or full URL)
 */
export function getNetlifyFunctionBaseUrl(): string {
  const hostname = window.location.hostname;
  
  // Development/localhost - use relative paths
  if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
    return '';
  }
  
  // Already on Netlify subdomain - use relative paths
  if (hostname.endsWith('.netlify.app')) {
    return '';
  }
  
  // Custom domain detected - use Netlify subdomain
  // Try to get from environment variable first (e.g., "ccdesigner-xxxxx.netlify.app" or full URL)
  const netlifySubdomain = import.meta.env.VITE_NETLIFY_SUBDOMAIN;
  
  if (netlifySubdomain && netlifySubdomain.trim() !== '') {
    const subdomain = netlifySubdomain.trim();
    // Ensure it includes protocol
    const baseUrl = subdomain.startsWith('http') ? subdomain : `https://${subdomain}`;
    console.log('📡 Using Netlify subdomain from env:', baseUrl);
    return baseUrl;
  }
  
  // Fallback: Try Netlify's built-in environment variables (available at build/runtime)
  // These are injected by Netlify automatically
  const netlifySiteUrl = import.meta.env.VITE_NETLIFY_SITE_URL || 
                         import.meta.env.NETLIFY_SITE_URL ||
                         import.meta.env.DEPLOY_PRIME_URL;
  
  if (netlifySiteUrl && netlifySiteUrl.trim() !== '') {
    const siteUrl = netlifySiteUrl.trim();
    // Extract just the domain if it's a full URL
    let baseUrl = siteUrl;
    if (siteUrl.startsWith('http')) {
      try {
        const url = new URL(siteUrl);
        baseUrl = `https://${url.hostname}`;
      } catch {
        baseUrl = siteUrl;
      }
    } else {
      baseUrl = `https://${siteUrl}`;
    }
    console.log('📡 Using Netlify site URL from env:', baseUrl);
    return baseUrl;
  }
  
  // Last resort: Try to infer from common patterns
  // If custom domain is ccdesigner.rhythmstix.co.uk, Netlify subdomain might be ccdesigner-xxxxx.netlify.app
  // But we can't know the exact subdomain without env var, so we'll try a workaround:
  // Use the current origin but this will still fail with SSL error
  
  // CRITICAL: Without VITE_NETLIFY_SUBDOMAIN, functions WILL fail on custom domain
  console.error('❌ CRITICAL: VITE_NETLIFY_SUBDOMAIN not configured!');
  console.error('❌ Netlify Functions will fail on custom domain due to SSL protocol error.');
  console.error('❌ Current hostname:', hostname);
  console.error('❌ ACTION REQUIRED: Set VITE_NETLIFY_SUBDOMAIN in Netlify environment variables');
  console.error('❌ Example value: "ccdesigner-xxxxx.netlify.app" (find this in Netlify Dashboard → Site Settings → Site Details)');
  
  // Return empty string - this will cause the SSL error, but at least logs clearly what's wrong
  // The user MUST set VITE_NETLIFY_SUBDOMAIN for this to work
  return '';
}

/**
 * Get the full URL for a Netlify Function
 * 
 * @param functionPath - Function path (e.g., '/.netlify/functions/generate-pdf')
 * @returns Full URL to the function
 */
export function getNetlifyFunctionUrl(functionPath: string): string {
  const baseUrl = getNetlifyFunctionBaseUrl();
  const fullUrl = baseUrl ? `${baseUrl}${functionPath}` : functionPath;
  
  const hostname = window.location.hostname;
  const isCustomDomain = !hostname.endsWith('.netlify.app') && hostname !== 'localhost' && !hostname.includes('127.0.0.1');
  
  // Log for debugging - especially important when using custom domain workaround
  if (isCustomDomain) {
    if (baseUrl) {
      console.log(`✅ Netlify Function URL (custom domain workaround): ${fullUrl}`);
    } else {
      console.error(`❌ CRITICAL: Netlify Function will FAIL with SSL error!`);
      console.error(`❌ Function URL: ${fullUrl}`);
      console.error(`❌ This will cause: ERR_SSL_PROTOCOL_ERROR`);
      console.error(`❌ SOLUTION: Set VITE_NETLIFY_SUBDOMAIN in Netlify environment variables`);
      console.error(`❌ Go to: Netlify Dashboard → Site Settings → Environment Variables`);
      console.error(`❌ Add: VITE_NETLIFY_SUBDOMAIN = "your-site-name.netlify.app"`);
    }
  }
  
  return fullUrl;
}

