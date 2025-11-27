import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  userEmail: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Obtener el email del usuario actual
    const user = this.authService.currentUserValue;
    if (user) {
      this.userEmail = user.email || 'Usuario';
    }
  }

  async logout() {
    await this.authService.logout();
    // El servicio ya redirige a /login
  }
  goToAssets() {
    this.router.navigate(['/assets']);
  }
  goToAR() {
  this.router.navigate(['/ar-viewer']);
}
}