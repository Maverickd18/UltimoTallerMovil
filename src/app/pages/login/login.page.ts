import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
    if (control.hasError('minlength')) {
      const minLength = control.errors['minlength'].requiredLength;
      return `${field} must have at least ${minLength} characters`;
    }
    if (control.hasError('email')) {
      return 'Please enter a valid email';
    }
    
    return '';
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      this.showToast('Please fill out all fields correctly', 'danger');
      return;
    }

    this.loading = true;

    const { email, password } = this.loginForm.value;

    try {
      const result = await this.authService.login(email, password);
      
      if (result.success) {
        this.showToast('Welcome back!', 'success');
        this.loginForm.reset();
        this.router.navigate(['/home']);
      } else {
        this.showToast(result.error, 'danger');
      }
    } catch (error: any) {
      this.showToast('An error occurred during login', 'danger');
    } finally {
      this.loading = false;
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}
