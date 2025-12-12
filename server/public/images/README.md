# Images Directory

This directory contains static images for menu items and other assets.

## Structure

```
public/images/
├── coffee/
├── tea/
├── cold-drinks/
├── hot-drinks/
├── food/
├── pastries/
└── default-item.jpg
```

## Usage

Images are served via Express static middleware at `/images/*`

Example:
- File: `public/images/espresso.jpg`
- URL: `http://localhost:5000/images/espresso.jpg`

## Image Guidelines

- **Format**: JPG, PNG, WebP
- **Size**: Max 500KB per image
- **Dimensions**: 800x600px (recommended)
- **Naming**: Use lowercase with hyphens (e.g., `caramel-macchiato.jpg`)

## Adding Images

1. Place images in the appropriate category folder
2. Update the corresponding menu item in `data/menu.json`
3. Reference as: `/images/category/filename.jpg`

## Placeholder

Until actual images are added, you can use placeholder services:
- https://via.placeholder.com/800x600
- https://source.unsplash.com/800x600/?coffee
