import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService, User } from '../Services/auth/auth.service';
import { Subscription } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { CommonServiceService } from '../Services/common-service.service';
@Component({
  selector: 'app-header-foorter',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './header-foorter.component.html',
  styleUrl: './header-foorter.component.scss',
  standalone: true,
})
export class HeaderFoorterComponent {

  user: User | null | undefined;
  user_id: any
  private userSubscription !: Subscription

  constructor(public auth: AuthService, private router: Router, private commonService: CommonServiceService) {
    this.userSubscription = this.auth.currentUser$.subscribe(user => {
      this.user = user;
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

  route_top() {
    window.scrollTo(0, 0)
  }

  showUnderDevelopment() {
    window.scrollTo(0, 0)
    this.commonService.displayWarning('Work in progress! We are working on this. 🛠️')
  }

  admin_route(page_url: any) {
    if (this.user?.role === 'Admin') {
      window.scrollTo(0, 0)
      this.router.navigate([page_url]);
    } else {
      this.commonService.displayWarning("You are not authorized to access this page. Only Admins are allowed.");
    }
  }

}

