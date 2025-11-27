import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth-guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
    canActivate: [AuthGuard] // Protegido con AuthGuard
  },
  {
    path: '',
    redirectTo: 'login', // Redirige a login por defecto
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'ar-viewer',
    loadChildren: () => import('./pages/ar-viewer/ar-viewer.module').then(m => m.ArViewerPageModule),
    canActivate: [AuthGuard] // Protegido con AuthGuard
  },
  {
    path: 'assets',
    loadChildren: () => import('./pages/assets/assets.module').then(m => m.AssetsPageModule),
    canActivate: [AuthGuard] // Protegido con AuthGuard
  },
  {
    path: '**',
    redirectTo: 'login' // Cualquier ruta no encontrada va a login
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }