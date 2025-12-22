# PWA Icons - Quick Setup

## ⚡ Quick Solution (Recommended)

Since icon generation failed, use one of these methods:

### Method 1: Use Online Generator (2 minutes)
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload any logo image (or use a simple green square with "C")
3. Click "Generate"
4. Download the ZIP file
5. Extract all PNG files to `client/public/icons/`

### Method 2: Use Favicon Generator
1. Go to https://realfavicongenerator.net/
2. Upload your logo
3. Generate icons
4. Download and extract to `client/public/icons/`

### Method 3: Manual (if you have image editing software)
Create PNG files with these exact names and sizes:
- icon-72.png (72x72)
- icon-96.png (96x96)
- icon-128.png (128x128)
- icon-144.png (144x144)
- icon-152.png (152x152)
- icon-192.png (192x192)
- icon-384.png (384x384)
- icon-512.png (512x512)

## 🎨 Design Guidelines
- Use your cafe logo or a simple design
- Green theme (#16a34a) recommended
- Keep it simple and recognizable
- Leave 10-15% padding around edges

## ✅ Verification
After adding icons, check:
1. All 8 PNG files are in `client/public/icons/`
2. Files are named exactly as above
3. Refresh your app
4. Open DevTools → Application → Manifest
5. Icons should appear in the manifest

## 🚀 The Install Button Will Work Once Icons Are Added!

The PWA install prompt requires:
- ✅ Valid manifest.json (done)
- ✅ Service worker (done)
- ⏳ Valid icons (add using methods above)
- ✅ HTTPS or localhost (you're on localhost)

Once icons are added, Chrome/Edge will show the **Install** button in the address bar!
