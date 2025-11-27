import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

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
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    // Obtener el email del usuario actual
    const user = this.authService.currentUserValue;
    if (user) {
      this.userEmail = user.email || 'Usuario';
      console.log('Usuario logueado:', this.userEmail);
    } else {
      console.log('No hay usuario logueado');
      this.router.navigate(['/login']);
    }
  }

  async logout() {
    const toast = await this.toastController.create({
      message: '¡Hasta pronto!',
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
    
    await this.authService.logout();
    // El servicio ya redirige a /login
  }

  goToAR() {
    this.router.navigate(['/ar-viewer']);
  }
}