import { Injectable } from '@angular/core';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User, 
  onAuthStateChanged 
} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private auth: Auth,
    private router: Router
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();

    // Listen for authentication state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
      console.log('Auth state changed:', user ? user.email : 'No user');
    });
  }

  // Get the current user value
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Register user
  async register(email: string, password: string): Promise<any> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      console.log('User registered:', result.user.email);
      return { success: true, user: result.user };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // Sign in
  async login(email: string, password: string): Promise<any> {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('User authenticated:', result.user.email);
      return { success: true, user: result.user };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // Sign out
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log('Session closed');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUserValue !== null;
  }

  // Custom error messages
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered';
      case 'auth/invalid-email':
        return 'The email is invalid';
      case 'auth/operation-not-allowed':
        return 'Operation not allowed';
      case 'auth/weak-password':
        return 'The password is too weak (minimum 6 characters)';
      case 'auth/user-disabled':
        return 'This user has been disabled';
      case 'auth/user-not-found':
        return 'User not found';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/invalid-credential':
        return 'Invalid credentials';
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again later';
      case 'auth/network-request-failed':
        return 'Connection error. Check your internet';
      default:
        return 'Authentication error: ' + errorCode;
    }
  }
}