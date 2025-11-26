import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// Firebase imports
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyChycttV_4KvBvifjAl24WMJXL9OZrPhng",
  authDomain: "realidaaumentada-be221.firebaseapp.com",
  projectId: "realidaaumentada-be221",
  storageBucket: "realidaaumentada-be221.firebasestorage.app",
  messagingSenderId: "218794623806",
  appId: "1:218794623806:web:cd4138d0bcc60dffc8226f"
};

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule, 
    IonicModule.forRoot(), 
    AppRoutingModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth())
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}