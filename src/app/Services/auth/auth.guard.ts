import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { CommonServiceService } from '../common-service.service';
import { map, take } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { GetAccessComponent } from '../../get-access/get-access.component';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const dialog = inject(MatDialog);
  return auth.currentUser$.pipe(
    take(1),
    map(user => {
      if (user?.message === 'User not found in database') {
        dialog.open(GetAccessComponent, {
          data: {
            heading: '🚫 Access Denied.',
            message: 'You do not have the necessary permissions.',
            message_two: 'To get access, please click on the "Request Access" button.',
          }
        });
        return false;
      }

      if (user && user.role) {
        return true;
      }
      return false;
    })
  );
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const displayMessage = inject(CommonServiceService);
  const router = inject(Router)
  return auth.currentUser$.pipe(
    take(1),
    map(user => {
      if (user && user?.role !== 'Admin') {
        displayMessage.displayWarning('Access Denied. Only Admins can access.');
        router.navigate([''])
        return false;
      }
      return true;
    })
  );
};

export const technicalGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const displayMessage = inject(CommonServiceService);
  const router = inject(Router);
  const allowedRoles = new Set(['Tech', 'Admin', 'Lead']);

  return auth.currentUser$.pipe(
    take(1),
    map(user => {
      if (user && allowedRoles.has(user.role)) {
        return true;
      } else {
        displayMessage.displayWarning('Access Denied. Only Admins, Tech, and Leads can access.');
        router.navigate(['']);
        return false;
      }
    })
  );
};