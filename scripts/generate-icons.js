const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [192, 512];
const outputDir = path.join(__dirname, '../public/icons');

// Create a simple icon with "AL" text (Ad Lab)
async function generateIcon(size) {
  // Create SVG with gradient background and text
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1"/>
          <stop offset="100%" style="stop-color:#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
      <text
        x="50%"
        y="55%"
        font-family="Arial, sans-serif"
        font-size="${size * 0.4}px"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
        dominant-baseline="middle"
      >AL</text>
    </svg>
  `;

  const outputPath = path.join(outputDir, `icon-${size}.png`);

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);

  console.log(`Generated: icon-${size}.png`);
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const size of sizes) {
    await generateIcon(size);
  }

  console.log('All icons generated!');
}

main().catch(console.error);
