# Device Mode System Guide

This guide explains how to use the device mode system for creating mobile-responsive features in the Dadi application.

## Overview

The device mode system provides a centralized way to handle differences between mobile and PC interfaces. It includes:

- **Automatic detection** based on screen width and touch capability
- **TypeScript utilities** for conditional logic in components
- **CSS utilities** for mode-specific styling
- **Event system** for reacting to mode changes

## Quick Start

### 1. Import the device mode utility

```typescript
import { deviceMode } from '@/utils/deviceMode';
```

### 2. Check current mode

```typescript
if (deviceMode.isMobile()) {
  // Mobile-specific logic
}

if (deviceMode.isPC()) {
  // PC-specific logic
}
```

## TypeScript API

### Basic Checks

```typescript
// Get current mode
const mode = deviceMode.getMode(); // 'mobile' | 'pc'

// Boolean checks
deviceMode.isMobile(); // true on mobile
deviceMode.isPC();     // true on PC
```

### Conditional Values

```typescript
// Select value based on mode
const maxHeight = deviceMode.select({
  mobile: '60vh',
  pc: '80vh'
});

// Use in component rendering
const renderInput = () => `
  <input 
    placeholder="${deviceMode.select({ mobile: 'Type...', pc: 'Type your message here...' })}"
    maxlength="${deviceMode.select({ mobile: 100, pc: 500 })}"
  />
`;
```

### Conditional Classes

```typescript
// Add class only on mobile
const classes = `base-button ${deviceMode.mobileClass('compact')}`;
// Result: "base-button compact" on mobile, "base-button" on PC

// Add class only on PC
const classes = `base-button ${deviceMode.pcClass('spacious')}`;
// Result: "base-button" on mobile, "base-button spacious" on PC

// Using the helper function
import { modeClasses } from '@/utils/deviceMode';

const classes = modeClasses({
  base: 'button',
  mobile: 'button-compact',
  pc: 'button-spacious'
});
```

### Conditional Rendering

```typescript
// Render only on mobile
export function renderChat(): string {
  return `
    <div class="chat">
      ${deviceMode.renderMobile(`
        <div class="mobile-toolbar">
          <button>Menu</button>
        </div>
      `)}
      
      ${deviceMode.renderPC(`
        <div class="sidebar">
          <nav>...</nav>
        </div>
      `)}
    </div>
  `;
}

// Or use mode-specific templates
export function renderHeader(): string {
  return deviceMode.render({
    mobile: '<header class="mobile-header">...</header>',
    pc: '<header class="desktop-header">...</header>'
  });
}
```

### Responding to Mode Changes

```typescript
// Listen for mode changes (e.g., window resize, orientation change)
const unsubscribe = deviceMode.onChange((newMode) => {
  console.log('Device mode changed to:', newMode);
  // Re-render or adjust UI
  updateLayout();
});

// Clean up listener when component is destroyed
function cleanup() {
  unsubscribe();
}
```

### Additional Utilities

```typescript
// Get viewport info with mode context
const viewport = deviceMode.getViewport();
// { width: 375, height: 812, mode: 'mobile' }

// Force re-detection (rarely needed)
deviceMode.refresh();
```

## CSS Styling

### Using Mode Classes

The body element automatically gets a `device-mobile` or `device-pc` class:

```css
/* Mobile-specific styles */
.device-mobile .my-component {
  padding: 8px;
  font-size: 14px;
}

/* PC-specific styles */
.device-pc .my-component {
  padding: 16px;
  font-size: 16px;
}
```

### Using Data Attribute

```css
/* Alternative selector using data attribute */
[data-device-mode="mobile"] .my-component {
  /* mobile styles */
}

[data-device-mode="pc"] .my-component {
  /* PC styles */
}
```

### Using CSS Variables

The system provides CSS variables that automatically adjust:

```css
.my-component {
  padding: var(--spacing-md);      /* 8px mobile, 16px PC */
  font-size: var(--font-size-md);  /* 15px mobile, 16px PC */
  border-radius: var(--border-radius);
}

/* Available variables:
   --spacing-xs, --spacing-sm, --spacing-md, --spacing-lg, --spacing-xl
   --font-size-xs, --font-size-sm, --font-size-md, --font-size-lg, --font-size-xl
   --header-height, --input-height, --border-radius
   --touch-target-min, --button-padding, --max-content-width
*/
```

### Utility Classes

```html
<!-- Show only on mobile -->
<div class="mobile-only">Visible on mobile only</div>

<!-- Show only on PC -->
<div class="pc-only">Visible on PC only</div>

<!-- Inline variants -->
<span class="mobile-only-inline">Mobile text</span>
<span class="pc-only-inline">PC text</span>

<!-- Flex variants -->
<div class="mobile-only-flex">Mobile flex container</div>
<div class="pc-only-flex">PC flex container</div>
```

## Common Patterns

### Pattern 1: Different Layouts

```typescript
export function renderChat(): string {
  return deviceMode.render({
    mobile: `
      <div class="chat-mobile">
        <div class="messages-fullscreen">...</div>
        <div class="input-fixed-bottom">...</div>
      </div>
    `,
    pc: `
      <div class="chat-desktop">
        <aside class="sidebar">...</aside>
        <main class="chat-area">
          <div class="messages">...</div>
          <div class="input">...</div>
        </main>
      </div>
    `
  });
}
```

### Pattern 2: Touch vs Click Behavior

```typescript
export function initComponent(): void {
  const button = document.getElementById('my-button');
  
  if (deviceMode.isMobile()) {
    // Mobile: use touch events
    button?.addEventListener('touchstart', handleTouch);
  } else {
    // PC: use mouse events with hover
    button?.addEventListener('mouseenter', handleHover);
    button?.addEventListener('click', handleClick);
  }
}
```

### Pattern 3: Different Component Sizes

```typescript
const avatarSize = deviceMode.select({ mobile: 32, pc: 48 });
const maxMessageLength = deviceMode.select({ mobile: 500, pc: 2000 });
const itemsPerPage = deviceMode.select({ mobile: 10, pc: 50 });
```

### Pattern 4: Conditional Features

```typescript
export function renderHeader(): string {
  return `
    <header>
      <h1>Dadi</h1>
      
      ${deviceMode.renderPC(`
        <nav class="header-nav">
          <a href="/settings">Settings</a>
          <a href="/history">History</a>
        </nav>
      `)}
      
      ${deviceMode.renderMobile(`
        <button class="hamburger-menu" id="mobile-menu">
          ☰
        </button>
      `)}
    </header>
  `;
}
```

### Pattern 5: Mode-Aware CSS

```css
/* Base styles for all modes */
.message {
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-sm);
}

/* Mobile-specific overrides */
.device-mobile .message {
  /* Full width on mobile */
  width: 100%;
  max-width: none;
}

/* PC-specific overrides */
.device-pc .message {
  /* Constrained width on PC */
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}
```

## Breakpoint Details

- **Mobile mode**: Triggered when width < 768px OR (has touch AND width < 1024px)
- **PC mode**: All other cases

This ensures tablets are treated appropriately based on their actual use case.

## Integration with Existing Code

### Add to main.ts

```typescript
import { deviceMode } from '@/utils/deviceMode';
import '@/styles/device-mode.css';

// Log initial mode for debugging
console.log('Device mode:', deviceMode.getMode());
```

### Update Components

When creating or updating components, consider:

1. **Do I need different layouts?** → Use `deviceMode.render()`
2. **Do I need different sizes?** → Use `deviceMode.select()`
3. **Do I need different behavior?** → Use `deviceMode.isMobile()`
4. **Do I need conditional visibility?** → Use CSS utility classes

## Best Practices

1. **Avoid assumptions**: Don't assume mobile = small screen or touch = mobile
2. **Test both modes**: Always test features in both mobile and PC modes
3. **Use CSS variables**: They automatically adapt to the current mode
4. **Keep it DRY**: Share common code, only separate what truly differs
5. **Consider performance**: Mobile devices may be less powerful
6. **Touch targets**: Ensure buttons are at least 48px on mobile
7. **Font sizes**: Keep inputs at 16px minimum on mobile to prevent zoom

## Examples from the Codebase

### Example 1: Chat Input

```typescript
export function renderChat(): string {
  return `
    <div class="chat-input-wrapper">
      <textarea
        placeholder="${deviceMode.select({ 
          mobile: 'Message...', 
          pc: 'Type your message here...' 
        })}"
        rows="${deviceMode.select({ mobile: 2, pc: 3 })}"
      ></textarea>
      
      <button class="${modeClasses({ 
        base: 'send-button',
        mobile: 'send-compact',
        pc: 'send-full'
      })}">
        ${deviceMode.render({
          mobile: '→',
          pc: 'Send'
        })}
      </button>
    </div>
  `;
}
```

### Example 2: Header

```typescript
export function renderHeader(user: User): string {
  return `
    <header class="app-header">
      ${deviceMode.renderMobile(`
        <button class="menu-toggle">☰</button>
      `)}
      
      <h1>${deviceMode.select({ mobile: 'Dadi', pc: 'Dadi AI Assistant' })}</h1>
      
      <div class="${deviceMode.pcClass('user-info')}">
        ${user.email}
      </div>
    </header>
  `;
}
```

## Troubleshooting

**Mode not detecting correctly?**
- Check browser dev tools: `document.body.dataset.deviceMode`
- Verify window width: `window.innerWidth`
- Force refresh: `deviceMode.refresh()`

**Styles not applying?**
- Ensure `device-mode.css` is imported in `main.ts`
- Check specificity of your CSS selectors
- Verify body class is present: `document.body.className`

**Mode not changing on resize?**
- The system uses media queries to auto-detect changes
- Try forcing a refresh: `deviceMode.refresh()`
- Check if listeners are being cleaned up properly

## When to Use Agent Instructions

When asking a coding agent to make changes:

✅ **Good instructions:**
- "Add a hamburger menu button for mobile mode only"
- "Use deviceMode.select() to make the input height 40px on mobile and 50px on PC"
- "In the renderChat function, show a full-screen layout on mobile and sidebar layout on PC"
- "Add mobile-only class to the toolbar div"

✅ **Clear mode references:**
- "This should apply to mobile mode" / "mobile only"
- "This should apply to PC mode" / "PC only"  
- "This should work in both modes"

✅ **Specific utilities:**
- "Use deviceMode.isMobile() to check..."
- "Use modeClasses() helper for the button classes..."
- "Add a CSS rule scoped to .device-mobile"

This makes it crystal clear what mode(s) your request applies to!
