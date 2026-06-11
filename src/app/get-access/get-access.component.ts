import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonServiceService } from '../Services/common-service.service';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../Services/auth/auth.service';
import { Subscribable, Subscription } from 'rxjs';
import { WelcomePageComponent } from '../welcome-page/welcome-page.component';

@Component({
  selector: 'app-get-access',
  imports: [CommonModule],
  templateUrl: './get-access.component.html',
  styleUrl: './get-access.component.scss'
})
export class GetAccessComponent {
  User: any
  private userSubscription !: Subscription 
  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    message_two: any; heading: any; message: string
  },
    public auth_service: AuthService,
    private api_service: AllApiServiceService,
    private common_service: CommonServiceService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<GetAccessComponent>) {
    this.dialogRef.disableClose = true

    this.userSubscription = this.auth_service.currentUser$.subscribe(user => {
      this.User = user;
    })
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }

  Is_spinner: Boolean = false
  request_access() {
    this.Is_spinner = true
    const body = {
      userId: this.User?.userID,
      userName: '',
      email: '',
      location: '',
      roleName: 'User'
    }
    this.api_service.Add_new_User(body).subscribe({
      next: (res: any) => {
        this.dialogRef.close();
        this.dialog.open(WelcomePageComponent, {});
        this.Is_spinner = false
      }, error: (err: any) => {
        console.log(err)
        this.Is_spinner = false
        this.common_service.displayWarning(err.message)
      }
    })

  }

}
