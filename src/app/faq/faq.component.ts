import { Component } from '@angular/core';

interface FAQ {
  question: string;
  answer: string;
  open?: boolean;
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css'],
  standalone:false
})
export class FaqComponent {
  faqs: FAQ[] = [
    { question: 'How can I place an order?', answer: 'You can place an order via our website by adding items to the cart and checking out.' },
    { question: 'What payment methods do you accept?', answer: 'We accept credit cards, debit cards, and PayPal.' },
    { question: 'Can I track my order?', answer: 'Yes, you can track your order in your account section under "My Orders".' },
    { question: 'How do I contact support?', answer: 'You can contact us via the Contact Us page or email us directly.' },
  ];

  toggleAnswer(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }
}
