import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Stairway } from './stairway.model';
import { Observable } from 'rxjs';


@Injectable()
export class StairwayService {

  constructor(private http: HttpClient) {
  }

  public get(): Observable<Stairway> {
    return this.http.get<Stairway>('assets/data/stairway.json');
  }

}
