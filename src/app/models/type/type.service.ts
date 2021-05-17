import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {Type} from './type.model';
import {Observable} from 'rxjs';


@Injectable()
export class TypeService {

  constructor(private http: HttpClient) {
  }

  public getAll(): Observable<Type[]> {
    return this.http.get<Type[]>('assets/data/types.json');
  }

}
