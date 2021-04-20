import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { AngularMaterialModule } from './angular-material.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TypesComponent } from './types/types.component';
import { HeaderComponent } from './header/header.component';
import { TypeService } from './models/type/type.service';
import { StairwayService } from './models/stairway/stairway.service';
import { TypeComponent } from './type/type.component';


@NgModule({
  imports: [
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    BrowserAnimationsModule,
  ],
  declarations: [
    AppComponent,
    HeaderComponent,
    TypesComponent,
    TypeComponent
  ],
  providers: [TypeService, StairwayService],
  bootstrap: [AppComponent]
})

export class AppModule { }
