import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AuthService } from '../Services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome-page',
  imports: [CommonModule],
  templateUrl: './welcome-page.component.html',
  styleUrl: './welcome-page.component.scss'
})
export class WelcomePageComponent {
  User: any
  private userSubscription !: Subscription
  constructor(
    public auth_service: AuthService,
    public router: Router,
    public dialogRef: MatDialogRef<WelcomePageComponent>) {
    this.dialogRef.disableClose = true
    this.auth_service.fetchCurrentUser().subscribe({
      next: (user) => {
        this.User = user;
      },
    });
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }

  Is_spinner: Boolean = false
  route_to_home() {
    this.Is_spinner = true
    setTimeout(() => {
      location.reload();
      this.Is_spinner = false
    }, 700)
  }
}
