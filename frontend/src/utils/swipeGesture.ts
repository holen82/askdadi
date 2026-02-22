interface SwipeGestureOptions {
  element: HTMLElement;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  threshold?: number;
}

export class SwipeGestureHandler {
  private element: HTMLElement;
  private onSwipeRight: () => void;
  private onSwipeLeft: () => void;
  private threshold: number;
  
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchEndX: number = 0;
  private touchEndY: number = 0;
  private isSwiping: boolean = false;

  constructor(options: SwipeGestureOptions) {
    this.element = options.element;
    this.onSwipeRight = options.onSwipeRight;
    this.onSwipeLeft = options.onSwipeLeft;
    this.threshold = options.threshold || 50;

    this.init();
  }

  private init(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }

  private handleTouchStart(e: TouchEvent): void {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.isSwiping = false;
  }

  private handleTouchMove(e: TouchEvent): void {
    this.touchEndX = e.touches[0].clientX;
    this.touchEndY = e.touches[0].clientY;
    
    const deltaX = Math.abs(this.touchEndX - this.touchStartX);
    const deltaY = Math.abs(this.touchEndY - this.touchStartY);
    
    // Detect if this is a horizontal swipe (more horizontal than vertical)
    if (deltaX > deltaY && deltaX > 10) {
      this.isSwiping = true;
    }
  }

  private handleTouchEnd(): void {
    if (!this.isSwiping) return;

    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = Math.abs(this.touchEndY - this.touchStartY);

    // Ensure it's mostly horizontal swipe
    if (Math.abs(deltaX) > deltaY) {
      if (deltaX > this.threshold) {
        this.onSwipeRight();
      } else if (deltaX < -this.threshold) {
        this.onSwipeLeft();
      }
    }

    this.isSwiping = false;
  }

  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
  }
}
