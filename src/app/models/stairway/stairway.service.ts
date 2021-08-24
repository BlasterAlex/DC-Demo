import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Stairway } from './stairway.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { parse } from 'yamljs';


@Injectable()
export class StairwayService {

  constructor(private http: HttpClient) {
  }

  public get(): Observable<Stairway> {
    return this.http.get('assets/data/stairway.yaml', {
      observe: 'body',
      responseType: 'text'
    }).pipe(map(yamlString => parse(yamlString) as Stairway));
  }

}
