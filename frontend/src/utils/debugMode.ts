/**
 * Debug mode for mobile devices - displays console errors and network failures
 * Activated via URL parameter: ?debug=true
 */

interface DebugMessage {
  type: 'error' | 'warning' | 'network';
  timestamp: Date;
  message: string;
  details?: string;
}

class DebugOverlay {
  private container: HTMLDivElement | null = null;
  private messageList: HTMLDivElement | null = null;
  private messages: DebugMessage[] = [];
  private isEnabled = false;
  private isMinimized = false;

  constructor() {
    this.checkDebugMode();
    if (this.isEnabled) {
      this.init();
    }
  }

  private checkDebugMode(): void {
    const STORAGE_KEY = 'debugModeEnabled';
    const params = new URLSearchParams(window.location.search);
    const debugParam = params.get('debug');

    // URL parameter takes precedence
    if (debugParam === 'true') {
      this.isEnabled = true;
      sessionStorage.setItem(STORAGE_KEY, 'true');
      console.log('🐛 Debug mode enabled via URL parameter');
    } else if (debugParam === 'false') {
      this.isEnabled = false;
      sessionStorage.removeItem(STORAGE_KEY);
      console.log('🐛 Debug mode disabled via URL parameter');
    } else {
      // Check sessionStorage if no URL parameter
      this.isEnabled = sessionStorage.getItem(STORAGE_KEY) === 'true';
      if (this.isEnabled) {
        console.log('🐛 Debug mode restored from session');
      }
    }
  }

  private init(): void {
    this.createOverlay();
    this.interceptConsole();
    this.interceptFetch();
    this.interceptXHR();
    this.captureErrors();
  }

  private createOverlay(): void {
    this.container = document.createElement('div');
    this.container.id = 'debug-overlay';
    this.container.innerHTML = `
      <div class="debug-header">
        <span class="debug-title">🐛 Debug Console</span>
        <div class="debug-actions">
          <button id="debug-clear" title="Clear messages">🗑️</button>
          <button id="debug-minimize" title="Minimize">−</button>
          <button id="debug-close" title="Close">✕</button>
        </div>
      </div>
      <div class="debug-content">
        <div class="debug-messages"></div>
      </div>
    `;

    this.addStyles();
    document.body.appendChild(this.container);
    this.messageList = this.container.querySelector('.debug-messages');

    this.attachEventListeners();
  }

  private addStyles(): void {
    if (document.getElementById('debug-overlay-styles')) return;

    const style = document.createElement('style');
    style.id = 'debug-overlay-styles';
    style.textContent = `
      #debug-overlay {
        position: fixed;
        bottom: 10px;
        left: 10px;
        right: 10px;
        max-width: 600px;
        max-height: 400px;
        background: rgba(0, 0, 0, 0.95);
        border: 2px solid #ff6b6b;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      }

      #debug-overlay.minimized {
        max-height: 50px;
      }

      #debug-overlay.minimized .debug-content {
        display: none;
      }

      .debug-header {
        background: #ff6b6b;
        color: white;
        padding: 8px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 6px 6px 0 0;
        user-select: none;
      }

      .debug-title {
        font-weight: bold;
        font-size: 14px;
      }

      .debug-actions {
        display: flex;
        gap: 8px;
      }

      .debug-actions button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 14px;
        transition: background 0.2s;
      }

      .debug-actions button:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .debug-content {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        min-height: 100px;
      }

      .debug-messages {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .debug-message {
        background: rgba(255, 255, 255, 0.05);
        border-left: 3px solid #ccc;
        padding: 8px;
        border-radius: 4px;
        word-wrap: break-word;
      }

      .debug-message.error {
        border-left-color: #ff6b6b;
      }

      .debug-message.warning {
        border-left-color: #ffd93d;
      }

      .debug-message.network {
        border-left-color: #6bcfff;
      }

      .debug-message-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
      }

      .debug-message-type {
        color: #ffd93d;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 10px;
      }

      .debug-message.error .debug-message-type {
        color: #ff6b6b;
      }

      .debug-message.network .debug-message-type {
        color: #6bcfff;
      }

      .debug-message-time {
        color: #888;
        font-size: 10px;
      }

      .debug-message-text {
        color: #fff;
        line-height: 1.4;
      }

      .debug-message-details {
        color: #aaa;
        font-size: 11px;
        margin-top: 4px;
        padding-top: 4px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .debug-empty {
        color: #666;
        text-align: center;
        padding: 20px;
      }
    `;
    document.head.appendChild(style);
  }

  private attachEventListeners(): void {
    const clearBtn = document.getElementById('debug-clear');
    const minimizeBtn = document.getElementById('debug-minimize');
    const closeBtn = document.getElementById('debug-close');

    clearBtn?.addEventListener('click', () => this.clear());
    minimizeBtn?.addEventListener('click', () => this.toggleMinimize());
    closeBtn?.addEventListener('click', () => this.close());
  }

  private interceptConsole(): void {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      originalError.apply(console, args);
      this.addMessage({
        type: 'error',
        timestamp: new Date(),
        message: args.map(arg => this.stringifyArg(arg)).join(' ')
      });
    };

    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args);
      this.addMessage({
        type: 'warning',
        timestamp: new Date(),
        message: args.map(arg => this.stringifyArg(arg)).join(' ')
      });
    };
  }

  private interceptFetch(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
      const startTime = Date.now();
      const input = args[0];
      const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        if (!response.ok) {
          this.addMessage({
            type: 'network',
            timestamp: new Date(),
            message: `HTTP ${response.status} ${response.statusText}`,
            details: `${url}\nDuration: ${duration}ms`
          });
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.addMessage({
          type: 'network',
          timestamp: new Date(),
          message: `Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: `${url}\nDuration: ${duration}ms`
        });
        throw error;
      }
    };
  }

  private interceptXHR(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      (this as any)._debugUrl = url.toString();
      (this as any)._debugStartTime = Date.now();
      return originalOpen.apply(this, [method, url, ...args] as any);
    };

    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
      this.addEventListener('load', function() {
        const duration = Date.now() - (this as any)._debugStartTime;
        if (this.status >= 400) {
          debugOverlayInstance.addMessage({
            type: 'network',
            timestamp: new Date(),
            message: `XHR ${this.status} ${this.statusText}`,
            details: `${(this as any)._debugUrl}\nDuration: ${duration}ms`
          });
        }
      });

      this.addEventListener('error', function() {
        const duration = Date.now() - (this as any)._debugStartTime;
        debugOverlayInstance.addMessage({
          type: 'network',
          timestamp: new Date(),
          message: 'XHR request failed',
          details: `${(this as any)._debugUrl}\nDuration: ${duration}ms`
        });
      });

      return originalSend.call(this, body);
    };
  }

  private captureErrors(): void {
    window.addEventListener('error', (event) => {
      this.addMessage({
        type: 'error',
        timestamp: new Date(),
        message: event.message,
        details: `${event.filename}:${event.lineno}:${event.colno}`
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.addMessage({
        type: 'error',
        timestamp: new Date(),
        message: `Unhandled Promise Rejection: ${event.reason}`,
        details: event.reason instanceof Error ? event.reason.stack : undefined
      });
    });
  }

  private stringifyArg(arg: any): string {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return `${arg.name}: ${arg.message}${arg.stack ? '\n' + arg.stack : ''}`;
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }

  private addMessage(message: DebugMessage): void {
    this.messages.push(message);
    
    if (this.messages.length > 50) {
      this.messages.shift();
    }

    this.render();
  }

  private render(): void {
    if (!this.messageList) return;

    if (this.messages.length === 0) {
      this.messageList.innerHTML = '<div class="debug-empty">No debug messages yet</div>';
      return;
    }

    this.messageList.innerHTML = this.messages
      .map(msg => this.renderMessage(msg))
      .join('');

    this.messageList.scrollTop = this.messageList.scrollHeight;
  }

  private renderMessage(message: DebugMessage): string {
    const time = message.timestamp.toLocaleTimeString();
    const typeLabel = message.type.toUpperCase();
    
    return `
      <div class="debug-message ${message.type}">
        <div class="debug-message-header">
          <span class="debug-message-type">${typeLabel}</span>
          <span class="debug-message-time">${time}</span>
        </div>
        <div class="debug-message-text">${this.escapeHtml(message.message)}</div>
        ${message.details ? `<div class="debug-message-details">${this.escapeHtml(message.details)}</div>` : ''}
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private clear(): void {
    this.messages = [];
    this.render();
  }

  private toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
    this.container?.classList.toggle('minimized', this.isMinimized);
    const btn = document.getElementById('debug-minimize');
    if (btn) {
      btn.textContent = this.isMinimized ? '+' : '−';
    }
  }

  private close(): void {
    this.container?.remove();
    const styles = document.getElementById('debug-overlay-styles');
    styles?.remove();
  }

  public isDebugEnabled(): boolean {
    return this.isEnabled;
  }
}

let debugOverlayInstance: DebugOverlay;

export function initDebugMode(): void {
  debugOverlayInstance = new DebugOverlay();
  
  if (debugOverlayInstance.isDebugEnabled()) {
    console.log('🐛 Debug mode enabled - console errors and network failures will be displayed');
  }
}

export function isDebugMode(): boolean {
  return debugOverlayInstance?.isDebugEnabled() ?? false;
}
