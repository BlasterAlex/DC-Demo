import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Characteristic} from './characteristic.model';
import {map} from 'rxjs/operators';
import {plainToClass} from 'class-transformer';
import {Observable} from 'rxjs';


@Injectable()
export class CharacteristicService {

  constructor(private http: HttpClient) {
  }

  public getCustomerData(): Observable<Characteristic[]> {
    return this.http.get('assets/data/customer_data.json').pipe(map(data => {
      return plainToClass(Characteristic, data as any[]).map(char => {
        char.nestedOptions();
        return char;
      });
    }));
  }

  public getSpecifications(): Observable<Characteristic[]> {
    return this.http.get('assets/data/specifications.json').pipe(map(data => {
      return plainToClass(Characteristic, data as any[]).map(char => {
        char.nestedOptions();
        return char;
      });
    }));
  }

}
