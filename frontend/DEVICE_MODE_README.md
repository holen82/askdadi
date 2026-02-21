# Device Mode System - Quick Reference

## What Is It?

A centralized system for handling mobile vs PC differences without code duplication.

## Key Files

- **TypeScript API**: `src/utils/deviceMode.ts`
- **CSS Utilities**: `src/styles/device-mode.css`
- **Full Guide**: `DEVICE_MODE_GUIDE.md`

## Quick Examples for Agent Instructions

### ✅ Good Instructions (Clear Mode Specification)

```
"Add a sidebar - show it on PC mode only"
"Make the button text 'Send' on PC and just '→' on mobile"
"Use deviceMode.select() to set padding to 8px mobile, 16px PC"
"Add mobile-only class to this toolbar"
"In renderChat(), use different layouts for mobile vs PC"
```

### 🔧 Common Use Cases

**1. Conditional Visibility**
```typescript
${deviceMode.renderMobile('<button class="hamburger">☰</button>')}
${deviceMode.renderPC('<nav>...</nav>')}
```

**2. Different Values**
```typescript
const maxChars = deviceMode.select({ mobile: 200, pc: 1000 });
placeholder="${deviceMode.select({ mobile: 'Type...', pc: 'Type message' })}"
```

**3. Conditional Classes**
```typescript
class="${modeClasses({ base: 'button', mobile: 'compact', pc: 'full' })}"
```

**4. Check Mode**
```typescript
if (deviceMode.isMobile()) {
  // Mobile-specific logic
}
```

**5. CSS Styling**
```css
/* Use variables that auto-adjust */
.my-component {
  padding: var(--spacing-md);  /* 8px mobile, 16px PC */
}

/* Or scope to mode */
.device-mobile .my-component { /* mobile */ }
.device-pc .my-component { /* PC */ }
```

## When Giving Instructions

Always specify the mode:
- ✅ "for mobile mode"
- ✅ "on PC only" 
- ✅ "both modes"
- ✅ "mobile: X, PC: Y"

This makes it crystal clear what should happen where!

## See Also

- **Complete guide**: `DEVICE_MODE_GUIDE.md`
- **Working example**: `src/components/Header.ts` and `src/styles/header.css`
- **CSS variables**: `src/styles/device-mode.css`

## Detection Logic

- **Mobile**: Width < 768px OR (touch capable AND width < 1024px)
- **PC**: Everything else
- Automatically detects on resize/orientation change
