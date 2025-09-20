// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { ErrorComponent } from './error/error.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AuthGuard } from './services/auth.guard';
import { UserProfileComponent } from './user-profile/user-profile.component';

import { CartComponent } from './cart/cart.component';
import { ProductPageComponent } from './product-page/product-page.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { OrdersComponent } from './orders/orders.component';
import { CardDetailedComponent } from './card-detailed/card-detailed.component';
import { ContactComponent } from './contact/contact.component';
import { FaqComponent } from './faq/faq.component';
import { AboutComponent } from './about/about.component';
import path from 'path';
import { TermsComponent } from './terms/terms.component';
import { AdminComponent } from './admin/admin.component';
import { AccessoriesComponent } from './accessories/accessories.component';
import { GuitarsComponent } from './guitars/guitars.component';



const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent},
  { 
    path: 'user-profile', 
    component: UserProfileComponent, 
    canActivate: [AuthGuard],
   
  },  { path: 'product', component: ProductPageComponent },
{ path: 'product/:id', component: CardDetailedComponent },
 
    {path:'accessories',component:AccessoriesComponent},
    {path:'guitars',component:GuitarsComponent},
  {path:'cart',component:CartComponent},
  { path: 'orders', component: OrdersComponent },
  { path: 'checkout', component: CheckoutComponent },
  {path:'contact',component:ContactComponent},
{ path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
  {path:'faq',component:FaqComponent},
  {path:'about',component:AboutComponent},
  {path:'terms',component:TermsComponent},
  { path: 'navbar', component: NavbarComponent },
  { path: 'footer', component: FooterComponent },
  
  { path: '**', component: ErrorComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }