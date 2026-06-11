import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { ErrorSnackbarComponent } from '../snackbar/error-snackbar/error-snackbar.component';
import { SucessSnackbarComponent } from '../snackbar/sucess-snackbar/sucess-snackbar.component';

@Injectable({
  providedIn: 'root'
})
export class CommonServiceService {

  constructor(private snackBar: MatSnackBar) { }


  // displayWarning(message: string, duration: any = 5000, position: any = 'top') {
  //   let config = new MatSnackBarConfig();
  //   config.duration = duration;
  //   config.panelClass = ['error-snackbar'];
  //   config.verticalPosition = position;
  //   this.snackBar.open(message, '', config);
  // }

  displayWarning(message: string,  position: any = 'center') {
  this.snackBar.openFromComponent(ErrorSnackbarComponent, {
    data: { message },
    duration: 2000,
    verticalPosition: position,
    panelClass: ['error-snackbarTwo']
  });
}

  // displaySuccess(message: string, duration: any = 5000, position: any = 'top') {
  //   let config = new MatSnackBarConfig();
  //   config.duration = duration;
  //   config.panelClass = ['SuccessLoginSucess-snackbar'];
  //   config.verticalPosition = position;
  //   this.snackBar.open(message, '', config);
  // }

    displaySuccess(message: string,  position: any = 'center') {
  this.snackBar.openFromComponent(SucessSnackbarComponent, {
    data: { message },
    duration: 2000,
    verticalPosition: position,
    panelClass: ['success-snackbar']
  });
}

}
