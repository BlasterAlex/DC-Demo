import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Type } from './type.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { parse } from 'yamljs';


@Injectable()
export class TypeService {

  constructor(private http: HttpClient) {
  }

  public getAll(): Observable<Type[]> {
    return this.http.get('assets/data/types.yaml', {
      observe: 'body',
      responseType: 'text'
    })
      .pipe(map(yamlString => parse(yamlString) as Type[]));
  }

}
