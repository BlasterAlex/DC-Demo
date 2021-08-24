import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Characteristic } from './characteristic.model';
import { map } from 'rxjs/operators';
import { plainToClass } from 'class-transformer';
import { Observable } from 'rxjs';
import { parse } from 'yamljs';


@Injectable()
export class CharacteristicService {

  constructor(private http: HttpClient) {
  }

  public getCustomerData(): Observable<Characteristic[]> {
    return this.http.get('assets/data/customer_data.yaml', {
      observe: 'body',
      responseType: 'text'
    })
      .pipe(map(yamlString => {
        const data = parse(yamlString);
        return plainToClass(Characteristic, data as any[]).map(char => {
          char.nestedOptions();
          return char;
        });
      }));
  }

  public getSpecifications(): Observable<Characteristic[]> {
    return this.http.get('assets/data/specifications.yaml', {
      observe: 'body',
      responseType: 'text'
    })
      .pipe(map(yamlString => {
        const data = parse(yamlString);
        return plainToClass(Characteristic, data as any[]).map(char => {
          char.nestedOptions();
          return char;
        });
      }));
  }

}
