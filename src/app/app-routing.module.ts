import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TypesComponent } from './types/types.component';
import { TypeComponent } from './type/type.component';

const routes: Routes = [
  {path: 'types', component: TypesComponent},
  {path: 'type/:id', component: TypeComponent},
  {path: '**', redirectTo: 'types'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
