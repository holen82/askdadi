/**
 * Device Mode Detection and Management
 * 
 * Provides a centralized system for detecting and managing mobile vs PC modes.
 * Includes utilities for conditional rendering, styling, and behavior based on device type.
 * 
 * Usage examples:
 * 
 * 1. Check current mode:
 *    if (deviceMode.isMobile()) { ... }
 * 
 * 2. Get mode-specific value:
 *    const maxHeight = deviceMode.select({ mobile: '60vh', pc: '80vh' });
 * 
 * 3. Conditional class names:
 *    className="base-class ${deviceMode.mobileClass('mobile-specific')}"
 * 
 * 4. Listen to mode changes:
 *    deviceMode.onChange((mode) => { ... });
 */

export type DeviceMode = 'mobile' | 'pc';

export interface ModeConfig<T> {
  mobile: T;
  pc: T;
}

class DeviceModeManager {
  private mode: DeviceMode;
  private listeners: Set<(mode: DeviceMode) => void> = new Set();
  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    this.mode = this.detectMode();
    this.setupMediaQuery();
  }

  /**
   * Detect device mode based on screen width and touch capability
   * Uses 768px as breakpoint (standard mobile/tablet breakpoint)
   */
  private detectMode(): DeviceMode {
    // Check screen width
    const isMobileWidth = window.innerWidth < 768;
    
    // Check if device has touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Consider it mobile if width is small OR has touch with small-ish screen
    if (isMobileWidth || (hasTouch && window.innerWidth < 1024)) {
      return 'mobile';
    }
    
    return 'pc';
  }

  /**
   * Setup media query listener to detect mode changes (e.g., window resize, orientation change)
   */
  private setupMediaQuery(): void {
    if (typeof window === 'undefined') return;

    this.mediaQuery = window.matchMedia('(max-width: 767px)');
    
    const handleChange = () => {
      const newMode = this.detectMode();
      if (newMode !== this.mode) {
        this.mode = newMode;
        this.notifyListeners();
        this.updateBodyClass();
      }
    };

    // Modern approach
    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      this.mediaQuery.addListener(handleChange);
    }

    // Set initial body class
    this.updateBodyClass();
  }

  /**
   * Update body class to reflect current mode
   * Adds 'device-mobile' or 'device-pc' class to body element
   */
  private updateBodyClass(): void {
    document.body.classList.remove('device-mobile', 'device-pc');
    document.body.classList.add(`device-${this.mode}`);
    document.body.setAttribute('data-device-mode', this.mode);
  }

  /**
   * Notify all listeners of mode change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.mode));
  }

  /**
   * Get current device mode
   */
  public getMode(): DeviceMode {
    return this.mode;
  }

  /**
   * Check if current mode is mobile
   */
  public isMobile(): boolean {
    return this.mode === 'mobile';
  }

  /**
   * Check if current mode is PC
   */
  public isPC(): boolean {
    return this.mode === 'pc';
  }

  /**
   * Select value based on current mode
   * 
   * Example:
   *   const padding = deviceMode.select({ mobile: '10px', pc: '20px' });
   */
  public select<T>(config: ModeConfig<T>): T {
    return config[this.mode];
  }

  /**
   * Get class name if current mode matches
   * 
   * Example:
   *   className="base ${deviceMode.mobileClass('compact')}"
   *   // Results in "base compact" on mobile, "base" on PC
   */
  public mobileClass(className: string): string {
    return this.isMobile() ? className : '';
  }

  /**
   * Get class name if current mode is PC
   * 
   * Example:
   *   className="base ${deviceMode.pcClass('spacious')}"
   */
  public pcClass(className: string): string {
    return this.isPC() ? className : '';
  }

  /**
   * Conditionally render content based on mode
   * Returns empty string if mode doesn't match
   * 
   * Example:
   *   ${deviceMode.renderMobile('<div>Mobile only content</div>')}
   */
  public renderMobile(content: string): string {
    return this.isMobile() ? content : '';
  }

  /**
   * Conditionally render content for PC mode
   */
  public renderPC(content: string): string {
    return this.isPC() ? content : '';
  }

  /**
   * Render content with mode-specific variations
   * 
   * Example:
   *   deviceMode.render({
   *     mobile: '<button class="compact">Send</button>',
   *     pc: '<button class="full">Send Message</button>'
   *   })
   */
  public render(config: ModeConfig<string>): string {
    return config[this.mode];
  }

  /**
   * Register a listener for mode changes
   * Returns unsubscribe function
   * 
   * Example:
   *   const unsubscribe = deviceMode.onChange((mode) => {
   *     console.log('Mode changed to:', mode);
   *   });
   *   // Later: unsubscribe();
   */
  public onChange(listener: (mode: DeviceMode) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Force re-detection of mode (useful after significant DOM changes)
   */
  public refresh(): void {
    const newMode = this.detectMode();
    if (newMode !== this.mode) {
      this.mode = newMode;
      this.notifyListeners();
      this.updateBodyClass();
    }
  }

  /**
   * Get viewport dimensions with mode context
   */
  public getViewport(): { width: number; height: number; mode: DeviceMode } {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      mode: this.mode
    };
  }
}

// Export singleton instance
export const deviceMode = new DeviceModeManager();

/**
 * Helper function to create mode-specific CSS classes
 * 
 * Example:
 *   const classes = modeClasses({
 *     base: 'button',
 *     mobile: 'button-compact',
 *     pc: 'button-spacious'
 *   });
 */
export function modeClasses(config: { base?: string; mobile?: string; pc?: string }): string {
  const classes: string[] = [];
  
  if (config.base) classes.push(config.base);
  if (config.mobile && deviceMode.isMobile()) classes.push(config.mobile);
  if (config.pc && deviceMode.isPC()) classes.push(config.pc);
  
  return classes.join(' ');
}

/**
 * Type guard for device mode
 */
export function isDeviceMode(value: string): value is DeviceMode {
  return value === 'mobile' || value === 'pc';
}
