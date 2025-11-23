# Netlify Domain & SSL Setup Guide

## Issue: ERR_SSL_PROTOCOL_ERROR on ccdesigner.rhythmstix.co.uk

This error occurs when the SSL certificate isn't properly configured for your custom domain.

## How to Fix:

### Step 1: Verify Domain in Netlify Dashboard

1. Go to https://app.netlify.com
2. Select your site
3. Go to **Domain settings** → **Custom domains**
4. Check if `ccdesigner.rhythmstix.co.uk` is listed

### Step 2: Add Domain (if not already added)

1. Click **Add custom domain**
2. Enter `ccdesigner.rhythmstix.co.uk`
3. Netlify will show DNS configuration needed

### Step 3: Configure DNS Records

In your domain registrar (where you manage rhythmstix.co.uk):

**For Subdomain (ccdesigner.rhythmstix.co.uk):**
- Type: `CNAME`
- Name: `ccdesigner`
- Value: `[your-netlify-site-name].netlify.app`
- TTL: 3600

**OR use A Record:**
- Type: `A`
- Name: `ccdesigner`
- Value: `75.2.60.5` (Netlify's IP - verify in Netlify dashboard)
- TTL: 3600

### Step 4: Enable SSL Certificate

1. In Netlify → Domain settings → SSL/TLS
2. Click **Verify DNS configuration**
3. Wait for DNS propagation (can take up to 48 hours, usually 1-2 hours)
4. Netlify will automatically provision Let's Encrypt SSL certificate

### Step 5: Force HTTPS Redirect

Add to `netlify.toml`:

```toml
[[redirects]]
  from = "http://ccdesigner.rhythmstix.co.uk/*"
  to = "https://ccdesigner.rhythmstix.co.uk/:splat"
  status = 301
  force = true
```

## Common Issues:

### Issue: "SSL certificate pending"
- **Solution**: Wait 24-48 hours for DNS propagation and SSL provisioning

### Issue: "DNS not configured"
- **Solution**: Verify DNS records match Netlify's requirements exactly

### Issue: "Certificate expired"
- **Solution**: Netlify auto-renews, but you can manually renew in SSL settings

### Issue: Intermittent SSL errors (ERR_SSL_PROTOCOL_ERROR)
This happens "sometimes" and requires a refresh. Common causes:

**1. SSL Certificate Renewal**
- Netlify auto-renews certificates every 60-90 days
- During renewal, brief SSL errors can occur
- **Solution**: Wait 5-10 minutes and refresh

**2. Browser Cache**
- Old SSL certificate cached in browser
- **Solution**: 
  - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
  - Clear SSL state: Chrome → Settings → Privacy → Clear browsing data → Cached images and files
  - Or use incognito/private mode

**3. DNS Propagation/Caching**
- DNS changes can take time to propagate
- **Solution**: 
  - Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
  - Check DNS: https://www.whatsmydns.net/#CNAME/ccdesigner.rhythmstix.co.uk

**4. Netlify SSL Provisioning**
- Certificate provisioning can cause temporary errors
- **Solution**: Check Netlify dashboard → Domain settings → SSL/TLS
  - Status should be "Active" (not "Pending" or "Provisioning")
  - If pending, wait 24-48 hours

**5. Certificate Chain Issues**
- Incomplete certificate chain
- **Solution**: Netlify handles this automatically, but you can verify:
  - https://www.ssllabs.com/ssltest/analyze.html?d=ccdesigner.rhythmstix.co.uk
  - Should show "Chain issues: None"

**Quick Fixes:**
- Hard refresh the page (bypasses browser cache)
- Try incognito/private mode (bypasses all cache)
- Wait 5-10 minutes if certificate is renewing
- Check Netlify dashboard for SSL status

## Testing:

1. Check SSL status: https://www.ssllabs.com/ssltest/analyze.html?d=ccdesigner.rhythmstix.co.uk
2. Test DNS: `nslookup ccdesigner.rhythmstix.co.uk`
3. Verify HTTPS: https://ccdesigner.rhythmstix.co.uk

## Quick Fix (If Urgent):

Use Netlify's default domain temporarily:
- `https://[your-site-name].netlify.app`

This always has SSL working.

## Immediate Action Required:

If you're seeing `ERR_SSL_PROTOCOL_ERROR` right now:

1. **Check Netlify Dashboard:**
   - Go to: https://app.netlify.com
   - Select your site
   - Go to: **Domain settings** → **SSL/TLS**
   - Check the certificate status:
     - ✅ **Active** = Certificate is valid (try hard refresh)
     - ⏳ **Provisioning** = Wait 24-48 hours
     - ⚠️ **Pending** = DNS not verified (check DNS settings)
     - ❌ **Error** = Click "Renew certificate" or "Verify DNS"

2. **If Certificate Status is "Pending" or "Error":**
   - Click **"Verify DNS configuration"** button
   - Ensure DNS records match exactly what Netlify shows
   - Wait 1-2 hours for DNS propagation

3. **If Certificate Status is "Active" but still getting errors:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Clear browser cache
   - Try incognito/private mode
   - Wait 5-10 minutes (certificate might be renewing)

4. **Force Certificate Renewal:**
   - In Netlify → Domain settings → SSL/TLS
   - Click **"Renew certificate"** button
   - Wait 5-10 minutes for renewal

5. **Check DNS Configuration:**
   - Verify CNAME record points to: `[your-site-name].netlify.app`
   - Use: https://www.whatsmydns.net/#CNAME/ccdesigner.rhythmstix.co.uk
   - All locations should show the same CNAME value

