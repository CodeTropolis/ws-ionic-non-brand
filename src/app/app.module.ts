import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AngularFirestore, FirestoreSettingsToken } from '@angular/fire/firestore';
import { AngularFireModule, FirebaseOptionsToken } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { environment } from '../environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { RecordFormPage } from './pages/modals/record-form/record-form.page';
import { MaterialModule } from './material.module';

import { AngularFireFunctionsModule } from '@angular/fire/functions';
import { FamilyInfoPage } from './pages/modals/family-info/family-info.page';
import { MapToIterablePipe } from './pipes/map-to-iterable.pipe';

@NgModule({
  declarations: [AppComponent, RecordFormPage, FamilyInfoPage, MapToIterablePipe],
  entryComponents: [RecordFormPage, FamilyInfoPage],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    BrowserAnimationsModule,
    ReactiveFormsModule,
    // MaterialModule Needed here for record-form modal which is not lazy loaded.
    // Students page is lazy loaded and thus loads the MaterialModule on its own.
    MaterialModule,
    AngularFireFunctionsModule,
    AngularFireAuthModule
  ],
  exports: [],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    AngularFirestore,

    // {
    //   provide: FirestoreSettingsToken,
    //   useValue: { host: 'localhost:8080', ssl: false }
    // },
    // {
    //   provide: FirebaseOptionsToken,
    //   useValue: { projectId: 'testing-app' }
    // }

  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
