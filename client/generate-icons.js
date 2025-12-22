const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple green square with white "C" letter
async function createIcon(size) {
    const svg = Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#16a34a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#15803d;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.55}" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="central">
        C
      </text>
    </svg>
  `);

    return svg;
}

// Ensure icons directory exists
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
async function generateIcons() {
    console.log('🎨 Generating PWA icons...\n');

    for (const size of sizes) {
        try {
            const svg = await createIcon(size);
            const outputPath = path.join(iconsDir, `icon-${size}.png`);

            await sharp(svg)
                .resize(size, size)
                .png({ quality: 100 })
                .toFile(outputPath);

            console.log(`✅ Generated icon-${size}.png`);
        } catch (error) {
            console.error(`❌ Failed to generate icon-${size}.png:`, error.message);
        }
    }

    console.log('\n✨ All icons generated successfully!');
    console.log('📁 Location: client/public/icons/');
    console.log('\n💡 Tip: Replace these with your actual cafe logo for production.');
    console.log('🔗 Use https://www.pwabuilder.com/imageGenerator for professional icons\n');
}

generateIcons().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
