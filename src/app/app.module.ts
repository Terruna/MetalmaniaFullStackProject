import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { ErrorComponent } from './error/error.component';


import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';


import { AuthService } from './services/auth.service';
import { AuthInterceptor } from './services/auth.interceptor';
import { AuthGuard } from './services/auth.guard';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';


import { UserService } from './services/user.service';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserResolver } from './services/user-resolver.service';



import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CartComponent } from './cart/cart.component';
import { ProductPageComponent } from './product-page/product-page.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { OrdersComponent } from './orders/orders.component';
import { CardDetailedComponent } from './card-detailed/card-detailed.component';
import { ContactComponent } from './contact/contact.component';
import { ReviewComponent } from './review/review.component';
import { PendingReviewNotificationComponent } from './pending-review-notification/pending-review-notification.component';
import { FaqComponent } from './faq/faq.component';
import { AboutComponent } from './about/about.component';
import { TermsComponent } from './terms/terms.component';
import { AccessoriesComponent } from './accessories/accessories.component';
import { GuitarsComponent } from './guitars/guitars.component';
import { AdminComponent } from './admin/admin.component';
import { ApparelComponent } from './apparel/apparel.component';




@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavbarComponent,
    FooterComponent,
    ErrorComponent,
   LoginComponent,
   RegisterComponent,
   UserProfileComponent,
   CartComponent,
   ProductPageComponent,
   CheckoutComponent,
   OrdersComponent,
   CardDetailedComponent,
   ContactComponent,
   ReviewComponent,
   PendingReviewNotificationComponent,
   FaqComponent,
   AboutComponent,
   TermsComponent,
   AccessoriesComponent,
   GuitarsComponent,
   AdminComponent,
   ApparelComponent
     


   
 
   
 
    
    
    
  ],
  imports: [
      BrowserModule,
  BrowserAnimationsModule, // Add this
  AppRoutingModule,
  HttpClientModule,
  ReactiveFormsModule,
  FormsModule

    
   
  ],
  providers: [
    AuthService,
    AuthGuard,
    UserService,
    UserResolver,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
