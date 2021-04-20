import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Stairway } from './stairway.model';


@Injectable()
export class StairwayService {

  constructor(private http: HttpClient) {
  }

  public get() {
    return this.http.get<Stairway>('assets/data/stairway.json');
  }

}
