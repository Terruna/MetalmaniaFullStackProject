// home.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { SlideInterface } from '../slider/image.interface';
interface Review {
  rating: number;
  comment: string;
  userName: string;
}
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone:false
})
export class HomeComponent implements OnInit {
  slides: SlideInterface[] = [
    { src: '/assets/image/1.png', title: 'beach' },
    { src: '/assets/image/2.png', title: 'boat' },
    { src: '/assets/image/3.png', title: 'forest' },
    { src: '/assets/image/4.png', title: 'city' },
    { src: '/assets/image/5.png', title: 'italy' }
  ];
featuredProducts: any[] = [];
  currentIndex: number = 0;
  timeoutId?: number;
  productList: any[] = [];
  newProducts: any[] = [];
   reviews: Review[] = [];
// home.component.ts
logoList: string[] = [
  '(21).png',
  '(24).png',
  '(29).png',
  '(32).png',
  '(54).png',
  '(57).png',
  '(84).png',
  '(9).png',
  '136.png',
  '19.png',
  '31.png',
  '36.png',
  '67.png',
  '84.png',
  '86.png',
  '92.png',
  'Arctic-Monkeys-Logo.png',
  'Deicide-Logo.png',
  'Dio-Logo.png',
  'Iron-Maiden-Logo.png',
  'Judas-Priest-Logo.png',
  'Kiss-Logo.png',
  'Led-Zeppelin-Logo.png',
  'Linkin-Park-Logo.png',
  'Megadeth-Logo.png',
  'Misfits-Logo.png',
  'Nirvana-Logo.png',
  'Ozzy-Osbourne-Logo.png',
  'Pantera-Logo.png',
  'Queen-Logo.png',
  'Rammstein_logo_PNG3.png',
  'Rammstein_logo_PNG4.png',
  'Rammstein_logo_PNG5.png',
  'Rolling-Stones-Logo.png',
  'Slayer_logo_PNG3.png',
  'The-Beatles-Logo.png',
  '[CITYPNG.COM]Metallica White Logo Transparent PNG - 2000x2000.png'
];

  constructor(
    public http: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.resetTimer();
    this.loadProducts();
     this.loadReviews();
    
  
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.clearTimeout(this.timeoutId);
    }
  }

  loadReviews() {
    this.http.getReviews().subscribe((res: any) => {
      this.reviews = res.data || [];
    });
  }

  getStars(rating: number) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }


  resetTimer() {
    if (typeof window !== 'undefined') {
      if (this.timeoutId) {
        window.clearTimeout(this.timeoutId);
      }
      this.timeoutId = window.setTimeout(() => this.goToNext(), 3000);
    }
  }
// Shuffle array and take n items
getRandomProducts(arr: any[], count: number) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

  goToPrevious(): void {
    const isFirstSlide = this.currentIndex === 0;
    const newIndex = isFirstSlide ? this.slides.length - 1 : this.currentIndex - 1;
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

loadProducts() {
  this.http.data().subscribe((info: any) => {
    this.productList = info.data;

    // Sort products by creation date to get the newest ones
    this.newProducts = [...this.productList]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Random featured products
    this.featuredProducts = this.getRandomProducts(this.productList, 8);
  });
}

  navigateToProduct(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  navigateToProducts(): void {
    this.router.navigate(['/product']);
  }

  getAllImages() {
    return this.productList.flatMap(product => product.images);
  }

  totalImages() {
    return this.getAllImages().length;
  }
}