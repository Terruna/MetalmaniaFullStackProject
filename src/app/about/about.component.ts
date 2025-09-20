import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone:false,
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  companyName = 'Metalmania';
  tagline = 'If you are looking for something heavier';
  description = 'Metalmania is your one-stop shop for authentic rock and metal merchandise. From band t-shirts to rare collectibles, we bring the spirit of metal to fans worldwide.';
  mission = 'To keep the metal culture alive and connect fans through music, style, and community.';

  // Contact info
  email = 'metalmaniashopp@gmail.com';
  phone = '+995 597 09 10 21';
}
