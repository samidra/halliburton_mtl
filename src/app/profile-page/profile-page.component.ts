import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService, User } from '../Services/auth/auth.service';
import { Subscription } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { CommonServiceService } from '../Services/common-service.service';
import { FormsModule } from '@angular/forms';
import { AllApiServiceService } from '../Services/all-api-service.service';

@Component({
  selector: 'app-profile-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  standalone: true,
})
export class ProfilePageComponent {
   user: User | null | undefined;
   currentRole: any
  user_id: any
  user_Role: any
  private userSubscription !: Subscription

  constructor(public auth: AuthService, private router: Router, 
    private allApiService: AllApiServiceService,
    private commonService: CommonServiceService) {
    this.userSubscription = this.auth.currentUser$.subscribe(user => {
      console.warn(user)
      this.user = user;
      this.currentRole = user?.role;
      this.user_Role = user?.role;
      const input = this.user?.userName;
      let parts: any = input?.split('\\');
      if (parts && parts.length > 1) {
        this.user_id = parts[1];
      }
    });
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }


  roles: string[] = ['User', 'Lead', 'Tech', 'Admin', 'Inventory'];
  isEditing: boolean = false;

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  Is_spinner: boolean = false;
  updateProfile() {
    if (this.user_Role === 'Select Role') {
      this.commonService.displayWarning('Please select a valid role before submitting the request.');
      return;
    }

    if (this.user_Role === this.currentRole) {
      this.commonService.displayWarning('Please select a different role before submitting the request.');
      return;
    }

    const body = {
      userID: this.user_id,
      currentRole: this.currentRole,
      requestedRole: this.user_Role
    }
    this.Is_spinner = true;
    this.allApiService.update_user_profile(body).subscribe(
      (response) => {
        this.commonService.displaySuccess('Request sent to Admin!');
        console.log('Profile updated successfully:', response);
        this.isEditing = false;
        this.Is_spinner = false;
      },
      (error) => {
        console.error('Error updating profile:', error);
        this.commonService.displayWarning('Error updating profile. Please try again.');
        this.Is_spinner = false;
      }
    );
  }
}
