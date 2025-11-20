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

### Issue: Intermittent SSL errors
- **Solution**: Clear DNS cache or wait for propagation
- Check DNS propagation: https://www.whatsmydns.net/#CNAME/ccdesigner.rhythmstix.co.uk

## Testing:

1. Check SSL status: https://www.ssllabs.com/ssltest/analyze.html?d=ccdesigner.rhythmstix.co.uk
2. Test DNS: `nslookup ccdesigner.rhythmstix.co.uk`
3. Verify HTTPS: https://ccdesigner.rhythmstix.co.uk

## Quick Fix (If Urgent):

Use Netlify's default domain temporarily:
- `https://[your-site-name].netlify.app`

This always has SSL working.

