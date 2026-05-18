import { Directive, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';

@Directive({ selector: '[appPullToRefresh]', standalone: true })
export class PullToRefreshDirective implements OnInit, OnDestroy {
  @Output() pullRefresh = new EventEmitter<() => void>();

  private enabled = false;
  private startY = 0;
  private pulling = false;
  private refreshing = false;
  private indicator!: HTMLElement;
  private spinnerEl!: HTMLElement;
  private currentDelta = 0;
  private safetyTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly threshold = 72;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    if (!window.matchMedia('(pointer: coarse)').matches) return;
    this.enabled = true;

    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');

    this.indicator = this.renderer.createElement('div');
    this.renderer.addClass(this.indicator, 'ptr-indicator');

    this.spinnerEl = this.renderer.createElement('div');
    this.renderer.setStyle(this.spinnerEl, 'width', '20px');
    this.renderer.setStyle(this.spinnerEl, 'height', '20px');
    this.renderer.setStyle(this.spinnerEl, 'borderRadius', '50%');
    this.renderer.setStyle(this.spinnerEl, 'border', '2.5px solid #e5e7eb');
    this.renderer.setStyle(this.spinnerEl, 'borderTopColor', '#2a23b8');
    this.renderer.setStyle(this.spinnerEl, 'transition', 'transform 0.2s ease');

    this.renderer.appendChild(this.indicator, this.spinnerEl);
    this.renderer.insertBefore(this.el.nativeElement, this.indicator, this.el.nativeElement.firstChild);
  }

  ngOnDestroy() {
    this.clearSafetyTimer();
    if (this.indicator?.parentNode) {
      this.indicator.parentNode.removeChild(this.indicator);
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent) {
    if (!this.enabled || this.refreshing) return;
    const scrollTop = this.el.nativeElement.scrollTop ?? window.scrollY;
    if (scrollTop <= 0) {
      this.startY = e.touches[0].clientY;
      this.pulling = true;
      this.currentDelta = 0;
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(e: TouchEvent) {
    if (!this.enabled || !this.pulling || this.refreshing) return;
    const delta = Math.max(0, e.touches[0].clientY - this.startY);
    this.currentDelta = delta;

    if (delta > 8) {
      const progress = Math.min(delta / this.threshold, 1);
      const top = -60 + progress * 72;
      this.renderer.setStyle(this.indicator, 'top', `${top}px`);
      this.renderer.setStyle(this.indicator, 'opacity', `${progress}`);
      this.renderer.setStyle(this.spinnerEl, 'transform', `rotate(${progress * 360}deg)`);
    }
  }

  @HostListener('touchend')
  onTouchEnd() {
    if (!this.enabled) return;
    this.endPull();
  }

  @HostListener('touchcancel')
  onTouchCancel() {
    if (!this.enabled) return;
    this.pulling = false;
    this.currentDelta = 0;
    this.hideIndicator();
  }

  private endPull() {
    if (!this.pulling) return;
    this.pulling = false;

    if (this.currentDelta >= this.threshold) {
      this.refreshing = true;
      this.renderer.addClass(this.spinnerEl, 'animate-ptr-spin');
      this.renderer.setStyle(this.indicator, 'top', '12px');
      this.renderer.setStyle(this.indicator, 'opacity', '1');

      // Safety timeout in case done() is never called
      this.safetyTimer = setTimeout(() => this.done(), 4000);

      this.pullRefresh.emit(() => this.done());
    } else {
      this.currentDelta = 0;
      this.hideIndicator();
    }
  }

  private done() {
    if (!this.refreshing) return;
    this.clearSafetyTimer();
    this.refreshing = false;
    this.currentDelta = 0;
    this.hideIndicator();
  }

  private hideIndicator() {
    this.renderer.removeClass(this.spinnerEl, 'animate-ptr-spin');
    this.renderer.setStyle(this.indicator, 'top', '-60px');
    this.renderer.setStyle(this.indicator, 'opacity', '0');
  }

  private clearSafetyTimer() {
    if (this.safetyTimer !== null) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
  }
}
