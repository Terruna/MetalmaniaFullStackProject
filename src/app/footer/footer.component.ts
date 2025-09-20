import { Component, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';  // adjust path if different

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  menuOpen = false;
  cartItemCount = 0;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    // Subscribe to cart changes so the footer updates automatically
    this.cartService.cart$.subscribe(items => {
      this.cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
    });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }
}
