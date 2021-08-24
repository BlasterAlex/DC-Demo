import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AngularMaterialModule } from './angular-material.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TypesComponent } from './types/types.component';
import { HeaderComponent } from './header/header.component';
import { TypeService } from './models/type/type.service';
import { StairwayService } from './models/stairway/stairway.service';
import { TypeComponent } from './type/type.component';
import { CharacteristicService } from './models/characteristic/characteristic.service';
import { MatIconModule } from '@angular/material/icon';
import { CustomLogicAlertService } from './models/custom-logic-alert/custom-logic-alert.service';


@NgModule({
  imports: [
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    BrowserAnimationsModule,
    MatIconModule,
  ],
  declarations: [
    AppComponent,
    HeaderComponent,
    TypesComponent,
    TypeComponent
  ],
  providers: [
    TypeService,
    StairwayService,
    CharacteristicService,
    CustomLogicAlertService
  ],
  bootstrap: [AppComponent]
})

export class AppModule {
}
