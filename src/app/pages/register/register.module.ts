import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RegisterPageRoutingModule } from './register-routing.module';
import { SharedModule } from 'src/app/shared/shared-module';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RegisterPage } from './register.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RegisterPageRoutingModule,
    SharedModule
  ],
  declarations: [RegisterPage]
})
export class RegisterPageModule {}
