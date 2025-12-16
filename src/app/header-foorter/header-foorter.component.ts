import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatDialog, MatDialogRef } from "@angular/material/dialog"
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-header-foorter',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './header-foorter.component.html',
  styleUrl: './header-foorter.component.scss'
})
export class HeaderFoorterComponent {


  route_top() {
    window.scrollTo(0, 0)
  }

  constructor(public dialog: MatDialog) { }

  //   get_all_pending_request(): void {
  //     // Set loading state before API call
  //     this.isLoading = true;

  //     this.api_call_service.get_all_pending_request().subscribe({
  //         next: (res: any) => {
  //             this.all_pending_request = res;
  //         },
  //         error: (err) => {
  //             console.error('Error fetching pending requests:', err.message);
  //         },
  //         complete: () => {
  //             console.log('✅ API call completed successfully.');
  //         }
  //     });

  //     // Ensure loading stops after API call
  //     this.isLoading = false;
  // }
}

