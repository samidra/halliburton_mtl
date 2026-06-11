import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { CommonServiceService } from '../Services/common-service.service';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { AuthService, User } from '../Services/auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './help-center.component.html',
  styleUrl: './help-center.component.scss'
})
export class HelpCenterComponent {

  helpForm !: FormGroup;
  user: User | null | undefined;
  user_id: any
  displayName:any
  private userSubscription !: Subscription
  constructor(private fb: FormBuilder,
    public auth: AuthService,
    private apiService: AllApiServiceService,
    private commonService: CommonServiceService,
    private titleService: Title) {
    this.userSubscription = this.auth.currentUser$.subscribe(user => {
      console.warn(user)
      this.user = user;
      this.displayName = this.user?.displayName;
      const input = this.user?.userName;
      let parts: any = input?.split('\\');
      if (parts && parts.length > 1) {
        this.user_id = parts[1];
      }
    })
    this.titleService.setTitle("Help Center | TestTrack HALLIBURTON");
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }

  ngOnInit() {
    this.helpForm = this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  Is_spinner: boolean = false;
  onSubmit() {
    if (this.helpForm.valid) {
      const formData = {
        userID: this.user_id + '-' + this.displayName,
        subject: this.helpForm.get('subject')?.value,
        body: this.helpForm.get('message')?.value
      }
      this.Is_spinner = true;
      this.apiService.helpCenter(formData).subscribe({
        next: (response) => {
          console.log('Help request submitted successfully:', response);
          this.commonService.displaySuccess('Your help request has been submitted successfully.');
          this.helpForm.reset();
          this.Is_spinner = false;
        },
        error: (error) => {
          this.commonService.displayWarning('There was an error submitting your help request. Please try again later.');
          this.Is_spinner = false;
          console.error('Error submitting help request:', error);
        }
      });
    } else {
      this.helpForm.markAllAsTouched();
    }
  }

}
