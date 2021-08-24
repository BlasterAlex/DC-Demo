export class CustomLogicAlert {
  operation!: LogicExpandingOperand;
  elementSelector!: string;
  message!: string;
}

export class LogicExpandingOperand {
  operationType: LogicOperationType | null = null;
}

export enum LogicOperationType {
  COMPARISON = 'COMPARISON',
  SUM = 'SUM',
  SQUARE = 'SQUARE',
  ROOT = 'ROOT'
}

export class LogicOperation extends LogicExpandingOperand {
  operands!: LogicExpandingOperand[];
}

export class LogicOperand extends LogicExpandingOperand {
  elementSelector!: string;
}
