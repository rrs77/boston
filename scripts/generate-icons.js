import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the SVG file
const svgPath = join(__dirname, '../public/cd-logo.svg');
const svgContent = fs.readFileSync(svgPath, 'utf-8');

console.log('📦 Installing sharp for icon generation...');
console.log('Please run: npm install --save-dev sharp');
console.log('\nOr use the icon-generator.html file in your browser:');
console.log('1. Open public/icon-generator.html in your browser');
console.log('2. Click the download buttons for each icon size');
console.log('3. Save the files to the public/ folder');

// Try to use sharp if available
try {
  const sharp = await import('sharp');
  
  console.log('\n✅ Sharp found! Generating icons...');
  
  const sizes = [
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' },
    { size: 192, name: 'icon-maskable-192.png', maskable: true },
    { size: 512, name: 'icon-maskable-512.png', maskable: true }
  ];
  
  for (const { size, name, maskable } of sizes) {
    let buffer = Buffer.from(svgContent);
    
    if (maskable) {
      // For maskable icons, we need to add padding (safe zone is 80% of size)
      const safeZone = Math.floor(size * 0.8);
      const padding = (size - safeZone) / 2;
      
      // Resize SVG to safe zone size
      buffer = await sharp.default(buffer)
        .resize(safeZone, safeZone, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();
      
      // Create new image with padding
      buffer = await sharp.default({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([{
          input: buffer,
          left: Math.floor(padding),
          top: Math.floor(padding)
        }])
        .png()
        .toBuffer();
    } else {
      // Regular icon - resize to exact size with transparent background
      buffer = await sharp.default(buffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .png({ 
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: true
        })
        .toBuffer();
    }
    
    const outputPath = join(__dirname, '../public', name);
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Generated ${name}`);
  }
  
  console.log('\n🎉 All icons generated successfully!');
} catch (error) {
  if (error.code === 'ERR_MODULE_NOT_FOUND') {
    console.log('\n⚠️  Sharp not installed. Installing now...');
    console.log('Run: npm install --save-dev sharp');
    console.log('Then run this script again: node scripts/generate-icons.js');
  } else {
    console.error('Error:', error.message);
  }
}

