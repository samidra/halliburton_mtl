import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class CommonServiceService {

  constructor(private snackBar: MatSnackBar) { }


  displayWarning(message: string, duration: any = 5000, position: any = 'top') {
    let config = new MatSnackBarConfig();
    config.duration = duration;
    config.panelClass = ['error-snackbar'];
    config.verticalPosition = position;
    this.snackBar.open(message, '', config);
  }

  displaySuccess(message: string, duration: any = 5000, position: any = 'top') {
    let config = new MatSnackBarConfig();
    config.duration = duration;
    config.panelClass = ['SuccessLoginSucess-snackbar'];
    config.verticalPosition = position;
    this.snackBar.open(message, '', config);
  }

}
