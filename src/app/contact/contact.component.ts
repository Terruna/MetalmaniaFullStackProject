import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactService } from '../services/contact.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
  standalone:false
})
export class ContactComponent {
  contactForm: FormGroup;

  constructor(private fb: FormBuilder, private contactService: ContactService) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required]
    });
  }

  sendMessage() {
    if (this.contactForm.valid) {
      this.contactService.sendMessage(this.contactForm.value).subscribe({
        next: () => {
          alert('Message sent successfully!');
          this.contactForm.reset();
        },
        error: (error) => {
          console.error('Error sending message:', error);
          alert('There was an error sending your message. Please try again later.');
        }
      });
    } else {
      alert('Please fill in all fields correctly.');
    }
  }
}