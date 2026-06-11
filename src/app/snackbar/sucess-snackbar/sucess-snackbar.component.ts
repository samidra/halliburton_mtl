import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
  selector: 'app-sucess-snackbar',
  imports: [],
  templateUrl: './sucess-snackbar.component.html',
  styleUrl: './sucess-snackbar.component.scss'
})
export class SucessSnackbarComponent {

  
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: any,
    private snackBarRef: MatSnackBarRef<SucessSnackbarComponent>
  ) { }

  close() {
    this.snackBarRef.dismiss();
  }
}
