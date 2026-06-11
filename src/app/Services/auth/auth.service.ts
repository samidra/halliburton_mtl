import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  message: string;
  userId: number;
  userName: string;
  displayName: string;
  email: string;
  domain: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null | undefined>(undefined);
  currentUser$ = this.currentUserSubject.asObservable();
  // Production URL
  readonly url: any = 'http://azscusmtlt001:5092/api/v1';
  // Development URL
  // readonly url: any = 'http://azscusinve001:5092/api/v1';

  constructor(private http: HttpClient) {}

  loadUser(): Promise<void> {
    return new Promise((resolve) => {
      this.fetchCurrentUser().subscribe({
        next: (user) => {
          console.log('Fetched user:', user);
          if (user?.message === 'User not found in database') {
            console.warn('User not found in database:', user.message);
            this.currentUserSubject.next(user);
              console.log(user)
          } else {
            // console.log(user)
            this.currentUserSubject.next(user);
          }
          resolve();
        },
        error: (err) => {
          console.error('Failed to fetch current user:', err);
          this.currentUserSubject.next(null); 
          resolve();
        }
      });
    });
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.url}/user/currentuser`, {
      withCredentials: true
    });
  }

  get currentUser(): User | null | undefined {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }
}
