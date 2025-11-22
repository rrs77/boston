# PWA Icon Update Instructions

I've created an improved icon design for your PWA. Here's how to generate the PNG files:

## Option 1: Use the Icon Generator (Easiest)

1. Open `public/icon-generator.html` in your browser
2. The page will automatically render the icons
3. Click each "Download" button to save the PNG files
4. Save them to the `public/` folder with these names:
   - `icon-192.png`
   - `icon-512.png`
   - `icon-maskable-192.png`
   - `icon-maskable-512.png`

## Option 2: Use Online Tool

1. Go to https://realfavicongenerator.net/
2. Upload `public/cd-logo.svg`
3. Configure:
   - Android Chrome: 192x192 and 512x512
   - Maskable icon: Enable safe zone (80% of size)
4. Download and save to `public/` folder

## Option 3: Use ImageMagick (Command Line)

```bash
# Install ImageMagick if needed
# macOS: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# Generate regular icons
convert -background none -resize 192x192 public/cd-logo.svg public/icon-192.png
convert -background none -resize 512x512 public/cd-logo.svg public/icon-512.png

# Generate maskable icons (with safe zone padding)
convert -background none -resize 153x153 public/cd-logo.svg -gravity center -extent 192x192 public/icon-maskable-192.png
convert -background none -resize 409x409 public/cd-logo.svg -gravity center -extent 512x512 public/icon-maskable-512.png
```

## What Changed

### Old Icon:
- Simple "CD" text on teal circle
- Basic design

### New Icon:
- Book/document icon representing curriculum
- Checkmark symbol for completion/planning
- Professional gradient background
- Better visual hierarchy
- Maskable icon support (safe zone for Android)

## After Generating Icons

1. Ensure all PNG files are in `public/` folder
2. The `manifest.json` is already updated to use the new icons
3. Test the PWA installation:
   - Clear browser cache
   - Uninstall old PWA if installed
   - Reinstall to see new icon

## Testing

1. Open your site in Chrome/Edge
2. Click the install button
3. Check the icon appears correctly on home screen
4. Verify it looks good at different sizes

The new icon should look much more professional and recognizable!

