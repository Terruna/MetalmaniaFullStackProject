import { Component,Input } from '@angular/core';
import { SlideInterface } from '../image.interface';

@Component({
  selector: 'app-image-slider',
  standalone: false,
  templateUrl: './image-slider.component.html',
  styleUrl: './image-slider.component.css'
})
export class ImageSliderComponent {
    @Input() slides: SlideInterface[] = [];

 currentIndex: number = 0;
  timeoutId: any;

  ngOnInit(): void {
    this.resetTimer();
  }
  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.clearTimeout(this.timeoutId);
    }
  }
  resetTimer() { 
    if (typeof window !== 'undefined') {
      if (this.timeoutId) {
        window.clearTimeout(this.timeoutId);
      }
      this.timeoutId = window.setTimeout(() => this.goToNext(), 3000);
    }
  }

  goToPrevious(): void {
    const isFirstSlide = this.currentIndex === 0;
    const newIndex = isFirstSlide
      ? this.slides.length - 1
      : this.currentIndex - 1;

    this.resetTimer();
    this.currentIndex = newIndex;
  }

  goToNext(): void {
    const isLastSlide = this.currentIndex === this.slides.length - 1;
    const newIndex = isLastSlide ? 0 : this.currentIndex + 1;

    this.resetTimer();
    this.currentIndex = newIndex;
  }

  goToSlide(slideIndex: number): void {
    this.resetTimer();
    this.currentIndex = slideIndex;
  }

  getCurrentSlideUrl() {
    return `${this.slides[this.currentIndex].src}`;
  }

}
