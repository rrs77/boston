# DreamHost Deployment Setup

This guide explains how to deploy your CC Designer app to DreamHost with automatic GitHub deployments.

## What You'll Have

- **Frontend**: Hosted on DreamHost (auto-deploys from GitHub)
- **Database**: Stays on Supabase (free tier)
- **PDFs**: Stored on DreamHost (saves Supabase storage)
- **Auto-deploy**: Push to GitHub → automatically updates DreamHost

---

## Step 1: Prepare DreamHost

### 1.1 Create a Subdomain (Recommended)

In DreamHost Panel:
1. Go to **Manage Domains**
2. Add a subdomain like `ccdesigner.yourdomain.com`
3. Note the **Web Directory** path (e.g., `/home/username/ccdesigner.yourdomain.com`)

### 1.2 Upload the API Files

Using FTP/SFTP, upload these folders to your DreamHost web directory:

```
your-web-directory/
├── api/
│   ├── upload-pdf.php    (from dreamhost/api/)
│   └── .htaccess         (from dreamhost/api/)
└── pdfs/
    └── .htaccess         (from dreamhost/pdfs/)
```

### 1.3 Configure the PHP Upload Script

Edit `api/upload-pdf.php` on DreamHost and update these lines:

```php
define('PUBLIC_URL_BASE', 'https://ccdesigner.yourdomain.com/pdfs/');  // Your actual URL
define('API_KEY', 'create-a-random-secret-key-here');  // Make up a secure key
```

**Generate a secure API key**: Use a random string like `sk_live_abc123xyz789` (at least 20 characters).

### 1.4 Test the Upload Endpoint

Visit `https://ccdesigner.yourdomain.com/api/upload-pdf.php` in your browser.
You should see: `{"error":"Method not allowed"}` (this is correct - it only accepts POST requests).

---

## Step 2: Set Up GitHub Secrets

In your GitHub repository (`rrs77/boston`):

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add each of these:

| Secret Name | Value |
|-------------|-------|
| `DREAMHOST_SERVER` | Your DreamHost FTP server (e.g., `ftp.yourdomain.com`) |
| `DREAMHOST_USERNAME` | Your DreamHost FTP username |
| `DREAMHOST_PASSWORD` | Your DreamHost FTP password |
| `DREAMHOST_REMOTE_DIR` | Web directory path (e.g., `/home/username/ccdesigner.yourdomain.com/`) |
| `VITE_SUPABASE_URL` | `https://wiudrzdkbpyziaodqoog.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_PDFBOLT_API_KEY` | Your PDFBolt API key |
| `VITE_PDF_UPLOAD_URL` | `https://ccdesigner.yourdomain.com/api/upload-pdf.php` |
| `VITE_PDF_API_KEY` | The API key you created in step 1.3 |

### Finding Your DreamHost FTP Credentials

1. Go to DreamHost Panel → **Manage Users**
2. Find your user and click **Show Info**
3. FTP server is usually: `ftp.yourdomain.com` or check the panel for exact hostname

---

## Step 3: Deploy

### First Deploy (Manual)

1. Go to your GitHub repo → **Actions** tab
2. Click **Deploy to DreamHost** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait for it to complete (2-3 minutes)

### Automatic Deploys

After the first deploy, every push to `main` branch will automatically deploy to DreamHost.

---

## Step 4: Update DNS (If Using Custom Domain)

If you want to point your existing domain (e.g., `ccdesigner.rhythmstix.co.uk`) to DreamHost:

1. In DreamHost Panel, go to **Manage Domains**
2. Find your domain and note the IP address or nameservers
3. Update your domain's DNS to point to DreamHost

Or keep using the DreamHost subdomain and update your links.

---

## Troubleshooting

### "Permission denied" errors

Make sure the `api/` and `pdfs/` folders have correct permissions:
```bash
chmod 755 api/
chmod 755 pdfs/
chmod 644 api/upload-pdf.php
chmod 644 api/.htaccess
chmod 644 pdfs/.htaccess
```

### PDF uploads fail

1. Check the API key matches in both places
2. Verify the `pdfs/` folder exists and is writable
3. Check PHP error logs in DreamHost Panel → **Error Logs**

### Blank page after deploy

1. Make sure there's an `index.html` in the web directory
2. Check that the build completed successfully in GitHub Actions
3. Add this to your web directory's `.htaccess`:

```apache
# SPA routing - redirect all requests to index.html
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

---

## Cost Summary

| Service | Cost |
|---------|------|
| DreamHost Shared | Already have |
| Supabase Free | $0 |
| PDFBolt | Your existing plan |
| **Total Additional** | **$0** |

---

## Backup Schedule

Your data is automatically backed up:
- **Supabase data**: Run `node scripts/export-supabase-data.js` weekly
- **PDFs on DreamHost**: Included in DreamHost's backups

Set a reminder to run the export script weekly, or I can help you automate it with a cron job.
