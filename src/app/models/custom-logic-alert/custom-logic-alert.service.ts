import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { CustomLogicAlert, LogicExpandingOperand, LogicOperand, LogicOperation } from './custom-logic-alert.model';
import { map } from 'rxjs/operators';
import { parse } from 'yamljs';
import { plainToClass } from 'class-transformer';

const expandLogicOperator = (operator: LogicExpandingOperand): LogicOperation | LogicOperand => {
  if (operator.operationType == null) {
    return plainToClass(LogicOperand, operator);
  }
  const operation = plainToClass(LogicOperation, operator);
  operation.operands = operation.operands.map(expandLogicOperator);
  return operation;
};

@Injectable()
export class CustomLogicAlertService {

  constructor(private http: HttpClient) {
  }

  public get(): Observable<CustomLogicAlert[]> {
    return this.http.get('assets/data/stairway_alerts.yaml', {
      observe: 'body',
      responseType: 'text'
    })
      .pipe(map(yamlString => {
        const data = parse(yamlString);
        return plainToClass(CustomLogicAlert, data as any[]).map(logic => {
          logic.operation = expandLogicOperator(logic.operation);
          return logic;
        });
      }));
  }
}
