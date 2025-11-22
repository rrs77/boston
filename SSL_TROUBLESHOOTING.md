# SSL Error Troubleshooting Guide

## Issue: Intermittent ERR_SSL_PROTOCOL_ERROR

You're seeing `ERR_SSL_PROTOCOL_ERROR` sometimes, and refreshing fixes it. This is a common issue with several possible causes.

## Quick Fixes (Try These First)

### 1. Hard Refresh Browser
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`
- This bypasses browser cache and forces a fresh SSL handshake

### 2. Clear Browser SSL State
- **Chrome**: Settings → Privacy → Clear browsing data → Advanced → "Cached images and files"
- **Firefox**: Settings → Privacy → Clear Data → "Cached Web Content"
- **Safari**: Develop → Empty Caches

### 3. Try Incognito/Private Mode
- Opens a fresh session without cached certificates
- If it works in incognito, it's a browser cache issue

## Root Causes & Solutions

### Cause 1: SSL Certificate Renewal (Most Common)
**What's happening:**
- Netlify auto-renews SSL certificates every 60-90 days
- During renewal, there's a brief window where the old certificate is invalid but the new one isn't fully propagated
- This causes intermittent SSL errors

**Solution:**
1. Check Netlify Dashboard → Domain settings → SSL/TLS
2. Look for certificate status:
   - ✅ **Active** = Certificate is valid
   - ⏳ **Provisioning** = Certificate is being set up (wait 24-48 hours)
   - ⚠️ **Pending** = DNS not verified (check DNS settings)
3. If provisioning/pending, wait for completion
4. If active but still errors, wait 5-10 minutes and refresh

### Cause 2: DNS Propagation/Caching
**What's happening:**
- DNS changes take time to propagate globally
- Your browser/ISP may cache old DNS records pointing to old SSL certificates

**Solution:**
1. Check DNS propagation:
   - https://www.whatsmydns.net/#CNAME/ccdesigner.rhythmstix.co.uk
   - All locations should show the same CNAME record
2. Clear DNS cache:
   - **Windows**: Open Command Prompt as admin → `ipconfig /flushdns`
   - **Mac**: Terminal → `sudo dscacheutil -flushcache`
   - **Linux**: `sudo systemd-resolve --flush-caches`
3. Wait 1-2 hours for DNS propagation

### Cause 3: Browser Certificate Cache
**What's happening:**
- Browser cached an old or invalid certificate
- Browser tries to use cached certificate instead of fetching new one

**Solution:**
1. Clear browser cache (see Quick Fixes above)
2. Clear SSL state specifically:
   - **Chrome**: `chrome://settings/clearBrowserData` → Advanced → "Cached images and files"
   - **Firefox**: `about:preferences#privacy` → Clear Data
3. Restart browser

### Cause 4: Certificate Chain Issues
**What's happening:**
- Incomplete certificate chain
- Browser can't verify certificate authenticity

**Solution:**
1. Test SSL configuration:
   - https://www.ssllabs.com/ssltest/analyze.html?d=ccdesigner.rhythmstix.co.uk
   - Should show "Chain issues: None"
2. If chain issues found, Netlify should auto-fix, but you can:
   - Go to Netlify → Domain settings → SSL/TLS
   - Click "Renew certificate" (if available)
   - Wait for renewal to complete

### Cause 5: Netlify SSL Provisioning
**What's happening:**
- Certificate is still being provisioned
- DNS not fully verified
- Domain not properly configured

**Solution:**
1. Verify domain in Netlify:
   - Netlify Dashboard → Domain settings → Custom domains
   - Ensure `ccdesigner.rhythmstix.co.uk` is listed
   - Status should be "Active" (green checkmark)
2. Verify DNS records:
   - Check CNAME record points to: `[your-site].netlify.app`
   - Or A record points to: `75.2.60.5` (verify in Netlify dashboard)
3. Wait for SSL provisioning (can take 24-48 hours)

## Prevention

### 1. Monitor SSL Status
- Set up Netlify notifications for SSL certificate issues
- Check SSL status weekly in Netlify dashboard

### 2. Use Netlify's Default Domain for Testing
- `https://[your-site-name].netlify.app` always has SSL working
- Use this for testing when custom domain has issues

### 3. Enable HSTS (Already Configured)
- Your `netlify.toml` includes `Strict-Transport-Security` header
- This forces HTTPS and reduces SSL errors

## When to Contact Support

Contact Netlify support if:
- SSL errors persist for more than 48 hours
- Certificate status shows "Failed" or "Error"
- DNS is correct but SSL won't provision
- Certificate expires and doesn't auto-renew

## Testing Commands

```bash
# Test DNS resolution
nslookup ccdesigner.rhythmstix.co.uk

# Test SSL certificate
openssl s_client -connect ccdesigner.rhythmstix.co.uk:443 -servername ccdesigner.rhythmstix.co.uk

# Check certificate expiration
echo | openssl s_client -connect ccdesigner.rhythmstix.co.uk:443 -servername ccdesigner.rhythmstix.co.uk 2>/dev/null | openssl x509 -noout -dates
```

## Summary

**Most likely cause**: SSL certificate renewal in progress
**Quick fix**: Hard refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`)
**Long-term fix**: Wait for certificate renewal to complete (usually 5-10 minutes)

If errors persist after trying all solutions, check Netlify dashboard for SSL certificate status.

