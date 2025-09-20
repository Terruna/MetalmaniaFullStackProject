import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService, User, ChangePasswordRequest } from '../services/user.service';
import { Subscription } from 'rxjs';
import { OrderService, Order } from '../services/order.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  standalone: false
})
export class UserProfileComponent implements OnInit, OnDestroy {
  userInfo: any;
  userData: User | null = null;
  isLoading = true;
  errorMessage = '';
  hasData = false;
  isEditing = false;
  isChangingPassword = false;
  showLogoutModal = false;
  isAdmin = false; // Track admin status

  userOrders: Order[] = [];
  showAllOrders = false; 

  updateForm: FormGroup;
  passwordForm: FormGroup;

  passwordErrorMessage:any = '';
  passwordSuccessMessage = '';

  private userDataSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {
    this.updateForm = this.fb.group({
      userName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      city: [''],
      number: ['', [Validators.pattern(/^[0-9]+$/)]],
      address: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadUserOrders();
    
    // Subscribe to user data changes to update admin status
    this.authSubscription = this.authService.userData$.subscribe(userData => {
      this.userData = userData;
      this.checkAdminStatus();
    });
  }

  ngOnDestroy(): void {
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // Check if user is admin using AuthService method
  checkAdminStatus(): void {
    this.isAdmin = this.authService.isAdmin();
  }

  // Navigate to admin panel
  navigateToAdminPanel(): void {
    this.router.navigate(['/admin']);
  }

  private loadUserOrders(): void {
    this.orderService.getUserOrders().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.userOrders = response.data;
        }
      },
      error: (err) => {
        console.error('Error loading user orders:', err);
      }
    });
  }

  viewAllOrders(): void {
    this.showAllOrders = !this.showAllOrders;
  }

  private loadUserData(): void {
    this.userInfo = this.authService.getUserInfo();
    this.userData = this.authService.getUserFullData();

    if (this.userData) {
      this.isLoading = false;
      this.hasData = true;
      this.checkAdminStatus(); // Check admin status
    } else if (this.userInfo?.userName) {
      this.fetchUserData(this.userInfo.userName);
    } else {
      this.fetchCurrentUser();
    }
  }

  private fetchCurrentUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: (userData: User) => {
        this.userData = userData;
        this.authService.storeUserData(userData);
        this.isLoading = false;
        this.hasData = true;
        this.checkAdminStatus(); // Check admin status
      },
      error: () => {
        this.handleNoUserData();
      }
    });
  }

  private fetchUserData(userName: string): void {
    this.userService.getUserByUsername(userName).subscribe({
      next: (userData: User) => {
        this.userData = userData;
        this.authService.storeUserData(userData);
        this.isLoading = false;
        this.hasData = true;
        this.checkAdminStatus(); // Check admin status
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Could not load user profile data.';
      }
    });
  }

  private handleNoUserData(): void {
    this.isLoading = false;
    this.hasData = false;
    this.errorMessage = 'User information not available. Please log in again.';
  }

  updateInfo(): void {
    if (this.isEditing) {
      this.saveChanges();
    } else {
      this.isEditing = true;
      this.populateEditForm();
    }
  }

  private populateEditForm(): void {
    if (this.userData) {
      this.updateForm.patchValue({
        userName: this.userData.userName,
        email: this.userData.email,
        city: this.userData.city || '',
        number: this.userData.number || '',
        address: this.userData.address || ''
      });
    }
  }

  saveChanges(): void {
    if (this.updateForm.valid && this.userData) {
      const formData = this.updateForm.value;
      const requestBody = {
        id: this.userData.id,
        userName: formData.userName,
        email: formData.email,
        city: formData.city,
        number: formData.number,
        address: formData.address,
        userTypeId: this.userData.userTypeId || 1,
        isActive: this.userData.isActive ?? true
      };

      this.userService.updateUser(requestBody).subscribe({
        next: (updatedUser: User) => {
          this.userData = updatedUser;
          this.authService.storeUserData(updatedUser);
          this.isEditing = false;
          this.checkAdminStatus(); // Re-check admin status after update
          alert('Profile updated successfully!');
        },
        error: (error) => {
          this.errorMessage = error.message || 'Update failed. Please try again.';
          alert('Update failed: ' + this.errorMessage);
        }
      });
    }
  }

  togglePasswordChange(): void {
    this.isChangingPassword = !this.isChangingPassword;
    if (this.isChangingPassword && this.userData) {
      this.passwordForm.reset();
      this.passwordErrorMessage = '';
      this.passwordSuccessMessage = '';
    }
  }

  changePassword(): void {
  if (this.passwordForm.valid && this.userData) {
    const formData = this.passwordForm.value;
    
    // Check if passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      this.passwordErrorMessage = 'Passwords do not match';
      return;
    }

    const changePasswordData: ChangePasswordRequest = {
      Id: this.userData.id,
      email: this.userData.email,
      password: formData.newPassword
    };

    this.userService.changePassword(changePasswordData).subscribe({
      next: (response) => {
        if (response.status) {
          this.passwordSuccessMessage = 'Password updated successfully!';
          setTimeout(() => {
            this.isChangingPassword = false;
            this.passwordForm.reset();
          }, 2000);
        } else {
          this.passwordErrorMessage = response.errors || 'Password update failed. Please try again.';
        }
      },
      error: (error) => {
        this.passwordErrorMessage = error.error?.message || 'Password change failed. Please try again.';
      }
    });
  }
}

  cancelPasswordChange(): void {
    this.isChangingPassword = false;
    this.passwordForm.reset();
    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.updateForm.reset();
  }

  logout(): void {
    this.showLogoutModal = true;
  }

  confirmLogout(): void {
    this.showLogoutModal = false;
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
  }

  getOrderStatusText(status: number): string {
    switch(status) {
      case 0: return 'Pending';
      case 1: return 'Processing';
      case 2: return 'Shipped';
      case 3: return 'Delivered';
      case 4: return 'Cancelled';
      default: return 'Unknown';
    }
  }
}