// src/app/pages/login/login.module.ts
import { NgModule } from '@angular/core';
import { LoginPageRoutingModule } from './login-routing.module';
import { LoginPage } from './login.page';
import { SharedModule } from 'src/app/shared/shared-module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    SharedModule,
    LoginPageRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ],
  declarations: [LoginPage]
})
export class LoginPageModule {}