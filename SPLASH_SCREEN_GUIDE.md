# 🎨 Splash Screen Guide - rose.dev AI IDE

## Overview

rose.dev AI IDE এখন একটা সুন্দর animated splash screen দিয়ে শুরু হয়!

## Features

### 🌟 Splash Screen Animation
- **Gradient Background**: Purple gradient (667eea → 764ba2)
- **Floating Logo**: Rose emoji (🌹) with floating animation
- **Shine Effect**: Logo তে shine animation
- **Particle Effects**: Background এ floating particles
- **Loading Bar**: Animated progress bar
- **Fade In/Out**: Smooth transitions
- **Auto-close**: 3 seconds পর automatically close হয়

### 📋 Information Displayed
- **Title**: rose.dev AI IDE
- **Subtitle**: Next-Generation AI Code Editor
- **Developer**: EliussRose @ Prosinres
- **Loading Text**: "Loading your workspace..."

## Technical Details

### Files
1. **splash.html** - Main splash screen HTML
2. **electron.js** - Updated to show splash
3. **electron-builder.json** - Includes splash.html in build

### Animations
```css
- fadeIn: 0.8s - Container fade in
- slideUp: 0.8s - Text slide up
- logoFloat: 3s infinite - Logo floating
- shine: 3s infinite - Shine effect
- loading: 2s infinite - Progress bar
- pulse: 1.5s infinite - Loading text pulse
- particleFloat: 4s infinite - Particle animation
```

### Timing
- Splash shows: 0s
- Logo appears: 0s
- Title appears: 0.2s
- Subtitle appears: 0.4s
- Developer info: 0.6s
- Loading bar: 0.8s
- Auto-close: 3s

## Customization

### Change Colors
```css
/* Background gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Logo background */
background: white;
color: #667eea;

/* Text colors */
color: white;
color: rgba(255, 255, 255, 0.9);
```

### Change Logo
```html
<!-- Current: Rose emoji -->
<span class="logo-text">🌹</span>

<!-- Options: -->
<span class="logo-text">💻</span> <!-- Computer -->
<span class="logo-text">⚡</span> <!-- Lightning -->
<span class="logo-text">🚀</span> <!-- Rocket -->
```

### Change Duration
```javascript
// In splash.html
setTimeout(() => {
  // Change 3000 to desired milliseconds
  // 3000 = 3 seconds
}, 3000);
```

```javascript
// In electron.js
setTimeout(() => {
  createWindow();
}, 3000); // Match with splash.html
```

### Add More Particles
```javascript
// In splash.html
const particleCount = 30; // Increase for more particles
```

## Building

### Development Mode
```bash
npm run electron:dev
```
Splash screen দেখাবে, তারপর main window খুলবে।

### Production Build
```bash
npm run electron:build:win
```
Built .exe তে splash screen included থাকবে।

## Installer Animation

### NSIS Installer (Windows)
`build/installer.nsh` file এ custom installer script আছে:

**Features:**
- Custom welcome banner
- Animated splash during installation
- Developer information display
- Custom finish page
- Desktop shortcut creation

### Creating Custom Banner
1. Create 164x314 BMP image
2. Save as `build/installer-banner.bmp`
3. Rebuild installer

### Creating Splash Image
1. Create 500x300 BMP image
2. Save as `build/splash.bmp`
3. Rebuild installer

## Testing

### Test Splash Screen
```bash
# Start app
npm run electron:dev

# Watch for:
1. Splash window appears (600x400)
2. Animations play smoothly
3. Auto-closes after 3 seconds
4. Main window appears
```

### Test Timing
```javascript
// Adjust in electron.js
setTimeout(() => {
  createWindow();
}, 3000); // Increase if server takes longer
```

## Troubleshooting

### Splash Not Showing
1. Check `splash.html` exists in root
2. Check `electron-builder.json` includes splash.html
3. Rebuild app

### Splash Too Fast/Slow
```javascript
// In splash.html - change auto-close time
setTimeout(() => {
  // ...
}, 3000); // Adjust this

// In electron.js - match the timing
setTimeout(() => {
  createWindow();
}, 3000); // Should match splash.html
```

### Animations Not Smooth
1. Check GPU acceleration enabled
2. Reduce particle count
3. Simplify animations

### Splash Stays Open
```javascript
// In electron.js, ensure splash closes
if (splashWindow && !splashWindow.isDestroyed()) {
  splashWindow.close();
  splashWindow = null;
}
```

## Advanced Customization

### Add Progress Updates
```javascript
// In electron.js
function updateSplashProgress(message) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('progress', message);
  }
}

// Usage
updateSplashProgress('Loading modules...');
updateSplashProgress('Starting server...');
updateSplashProgress('Almost ready...');
```

### Add Loading Percentage
```html
<!-- In splash.html -->
<p class="loading-text" id="progress">0%</p>

<script>
let progress = 0;
const interval = setInterval(() => {
  progress += 10;
  document.getElementById('progress').textContent = progress + '%';
  if (progress >= 100) clearInterval(interval);
}, 300);
</script>
```

### Add Sound Effect
```javascript
// In splash.html
const audio = new Audio('startup-sound.mp3');
audio.play();
```

## Design Guidelines

### Colors
- **Primary**: #667eea (Purple)
- **Secondary**: #764ba2 (Dark Purple)
- **Text**: White / rgba(255,255,255,0.9)
- **Accent**: White with opacity

### Typography
- **Title**: 42px, Bold
- **Subtitle**: 18px, Regular
- **Info**: 14px, Regular
- **Loading**: 14px, Regular

### Spacing
- **Logo**: 200x200px
- **Container**: 600x400px
- **Margins**: 30px, 10px, 5px
- **Loading Bar**: 300x4px

### Animation Speed
- **Fast**: 0.5s - 0.8s (Fade, Slide)
- **Medium**: 1.5s - 2s (Pulse, Loading)
- **Slow**: 3s - 4s (Float, Shine, Particles)

## Examples

### Minimal Splash
```html
<body style="background: #667eea; display: flex; justify-content: center; align-items: center;">
  <div style="text-align: center; color: white;">
    <h1 style="font-size: 48px;">🌹</h1>
    <h2>rose.dev AI IDE</h2>
    <p>Loading...</p>
  </div>
</body>
```

### With Progress Bar
```html
<div class="progress-container">
  <div class="progress-bar" id="progress"></div>
</div>
<script>
let width = 0;
const interval = setInterval(() => {
  width += 10;
  document.getElementById('progress').style.width = width + '%';
  if (width >= 100) clearInterval(interval);
}, 300);
</script>
```

## Resources

- **Icons**: Use emoji or custom SVG
- **Fonts**: System fonts for fast loading
- **Images**: Keep under 100KB
- **Animations**: CSS only (no heavy JS)

---

**Developer:** EliussRose  
**Company:** Prosinres  
**Website:** https://ghury.com

**© 2026 Prosinres. All rights reserved.**
