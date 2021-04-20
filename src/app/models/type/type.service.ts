import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Type } from './type.model';


@Injectable()
export class TypeService {

  constructor(private http: HttpClient) {
  }

  public getAll() {
    return this.http.get<Type[]>('assets/data/types.json');
  }

}
