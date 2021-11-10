import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { TypeService } from '../models/type/type.service';
import { Type } from '../models/type/type.model';
import { StairwayService } from '../models/stairway/stairway.service';
import { Stairway } from '../models/stairway/stairway.model';
import { CharacteristicService } from '../models/characteristic/characteristic.service';
import { Characteristic, CharType, RAL } from '../models/characteristic/characteristic.model';
import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Workbook } from 'exceljs';
import * as moment from 'moment-timezone';
import { Moment } from 'moment-timezone';
import html2canvas from 'html2canvas';
import { MatSelectChange } from '@angular/material/select';
import { CustomLogicAlertService } from '../models/custom-logic-alert/custom-logic-alert.service';
import {
  CustomLogicAlert,
  LogicExpandingOperand,
  LogicOperand,
  LogicOperation,
  LogicOperationType
} from '../models/custom-logic-alert/custom-logic-alert.model';
import * as FileSaver from 'file-saver';

const EXCEL_ROW_HEIGHT = 17;

@Component({
  selector: 'app-type',
  templateUrl: './type.component.html',
  styleUrls: ['./type.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TypeComponent implements OnInit {

  // Тип подъемника
  type!: Type;
  direction!: string;

  // Количество ступенек на каждом марше
  stairway!: Stairway;
  stairways: Map<string, number> = new Map();

  // Форма ввода информации о заказчике
  types = CharType;
  customerForm!: FormGroup;
  customerData!: Characteristic[];

  // Форма для ввода характеристик
  specificForm!: FormGroup;
  specifications!: Characteristic[];

  // Кастомные проверки для полей
  customLogicAlerts!: CustomLogicAlert[];

  // Количество вкладок
  tabsQty!: number;

  // Количество вкладок перед вкладками маршей
  tabsBeforeStairways = 3;

  // Массив индексов вкладок маршей
  stairwayTabsIndices!: number[];

  // Индекс активной вкладки
  selectedTabIndex = 0;

  // Начало заполнение форм (для первого нажатия на кнопку)
  startFillingForms = false;

  // Генерируемый excel файл
  workbook!: Workbook;

  // Текущая дата
  today!: Moment;

  // Картинки в base64
  logoBase64!: string;
  stepsDimBase64!: string;

  constructor(
    private http: HttpClient,
    private activatedRoute: ActivatedRoute,
    private typeService: TypeService,
    private stairwayService: StairwayService,
    private customLogicAlertService: CustomLogicAlertService,
    private characteristicService: CharacteristicService
  ) {
  }

  ngOnInit(): void {
    // Чтение json файлов
    this.activatedRoute.params.subscribe(params => {
      const id = params.id;
      this.typeService.getAll().subscribe(data => {
        this.type = data.filter(t => t.id === id)[0];
        this.activatedRoute.queryParams.subscribe(qparams => {
          // Определение направления марша
          this.direction = qparams.direction || Object.keys(this.type.direction)[0];

          // Вычисление массива индексов вкладок маршей
          const stairwaysQty = Object.keys(this.type.stairways).length;
          this.stairwayTabsIndices = Array(stairwaysQty).fill(0).map((_, i) => i + this.tabsBeforeStairways);

          // Установка дефолтного количества ступеней на каждом марше
          Object.keys(this.type.stairways).forEach(key => {
            this.stairways.set(key, 3);
          });
        });
      });
    });

    // Чтение информации о маршах
    this.stairwayService.get().subscribe(stairway => {
      this.stairway = stairway;
    });

    // Чтение кастомных валидаций для маршей
    this.customLogicAlertService.get().subscribe(alerts => {
      this.customLogicAlerts = alerts;
    });

    // Заполнение формы контактной информации
    this.characteristicService.getCustomerData().subscribe(customerData => {
      let num = 1;
      for (const data of customerData) {
        data.id = 'customer_field_' + (num++);
      }
      this.customerData = customerData;
      this.customerForm = new FormGroup({});
      this.fillFormValidate(this.customerData, this.customerForm);
    });

    // Заполнение формы технической информации
    this.characteristicService.getSpecifications().subscribe(specifications => {
      let num = 1;
      for (const data of specifications) {
        data.id = 'specification_' + (num++);
      }
      this.specifications = specifications;
      this.specificForm = new FormGroup({});
      this.fillFormValidate(this.specifications, this.specificForm);
    });

    // Выставление цвета на цветные поля
    const interval = setInterval(() => {
      const colorSelectors = document.getElementsByClassName('color-select');
      if (colorSelectors.length > 0) {
        clearInterval(interval);
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < colorSelectors.length; i++) {
          const colorSelector = colorSelectors[i];
          const color = colorSelector.querySelector('.mat-select-min-line')?.innerHTML;
          // @ts-ignore
          colorSelector.closest<HTMLElement>('.mat-form-field-flex').style.background = this.ralToHex(color);
        }
      }
    }, 500);

    // Чтение локальной картинки лого
    this.loadLocalFile('assets/img/logo.png').then(base64 => {
      this.logoBase64 = base64;
    });

    // Чтение локальной картинки замеров ступенек
    this.loadLocalFile('assets/data/images/steps_dim.png').then(base64 => {
      this.stepsDimBase64 = base64;
    });
  }

  // Заполнение форм и валидация полей
  fillFormValidate(fields: Characteristic[], form: FormGroup): void {
    fields.forEach(field => {
      form.addControl(field.id, new FormControl(''));
      if (field.value) {
        form.controls[field.id].setValue(field.value);
      }
      const validators: ValidatorFn[] = [];
      if (field.required && field.type !== this.types.SELECTION &&
        field.type !== this.types.MULTIPLE_SELECTION) {
        validators.push(Validators.required);
      }
      if (field.checkMask) {
        validators.push(Validators.pattern((field.checkMask)));
      }
      if (validators.length > 0) {
        form.controls[field.id].setValidators(validators);
      }
    });
  }

  loadLocalFile(path: string): Promise<string> {
    return new Promise(resolve => {
      this.http.get(path, {responseType: 'blob'}).subscribe(res => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(res);
      });
    });
  }

  colorPick(event: MatSelectChange): void {
    const select = event.source._elementRef.nativeElement as HTMLSelectElement;
    // @ts-ignore
    select.closest<HTMLElement>('.mat-form-field-flex').style.background = this.ralToHex(event.value);
  }

  checkboxChanged(event: MatCheckboxChange): void {
    const inputs = document
      .getElementById(event.source?._inputElement.nativeElement.id.replace('-input', ''))
      ?.getElementsByClassName('characteristic-checkbox-input');
    if (inputs?.length) {
      const input: HTMLInputElement = inputs[0] as HTMLInputElement;
      if (input.getAttribute('disabled') !== null) {
        input.removeAttribute('disabled');
      } else {
        input.setAttribute('disabled', 'disabled');
        input.value = '';
      }
    }
  }

  // Переход на вкладку формы
  async tabSwitch(pageNum: number): Promise<boolean> {
    this.selectedTabIndex = pageNum;
    return new Promise(resolve => {
      setTimeout(() => {
        // Если это вкладка марша - проверить на валидность
        if (this.stairwayTabsIndices.includes(pageNum)) {
          resolve(this.checkValidActiveStairway());
        } else {
          resolve(true);
        }
      }, 1000);
    });
  }

  // Валидация форм
  checkValidForms(): boolean {
    // tslint:disable:forin
    if (this.customerForm.invalid) {
      for (const key in this.customerForm.controls) {
        this.customerForm.controls[key].markAsTouched();
      }
      this.selectedTabIndex = 1;
      return false;
    }
    if (this.specificForm.invalid) {
      for (const key in this.specificForm.controls) {
        this.specificForm.controls[key].markAsTouched();
      }
      this.selectedTabIndex = 2;
      return false;
    }
    return true;
  }

  // Валидация активной вкладки марша
  checkValidActiveStairway(): boolean {
    let ok = true;
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this.customLogicAlerts.length; i++) {
      const alert = this.customLogicAlerts[i];
      if (!this.performCustomLogicOperation(alert)) {
        ok = false;
      }
    }
    return ok;
  }

  // Выполнение кастомной операции
  performCustomLogicOperation(operand: LogicExpandingOperand | CustomLogicAlert): boolean | number {

    // Определение переменных в зависимости от переданного дипа
    const customLogicAlert = operand instanceof CustomLogicAlert ? operand as CustomLogicAlert : null;
    const expandingOperand: LogicExpandingOperand = operand instanceof CustomLogicAlert ?
      operand.operation : operand as LogicExpandingOperand;

    // Переданный операнд является простой переменной - вернуть значение переменной (селектора)
    if (expandingOperand instanceof LogicOperand) {
      const logicOperand = expandingOperand as LogicOperand;
      const value = document.body.querySelector<HTMLInputElement>(logicOperand.elementSelector)?.value;
      return Number(value);
    }

    // Переданный операнд является операцией - выполнить действие в зависимости от типа операции
    const operation = expandingOperand as LogicOperation;
    switch (operation.operationType) {

      // Операция сравнения - выполнение сравнения с заданной точностью и вывод ошибки
      case LogicOperationType.COMPARISON: {
        const firstValue = Number(this.performCustomLogicOperation(operation.operands[0]));
        const secondValue = Number(this.performCustomLogicOperation(operation.operands[1]));
        const precision = 0.01;

        // Добавлено после правок, если первая форма пустая - просто заполнить ее ожидаемым значением
        if (customLogicAlert !== null) {
          const alertElement = document.body.querySelector<HTMLInputElement>(customLogicAlert.elementSelector);
          if (alertElement && this.stringEmpty(alertElement.value)) {
            alertElement.value = this.numberToString(secondValue, precision);
            alertElement.classList.remove('input-error');
            return true;
          }
        }

        if (Math.abs(firstValue - secondValue) <= precision) {
          if (customLogicAlert !== null) {
            document.body.querySelector(customLogicAlert.elementSelector)?.classList.remove('input-error');
          }
          return true;
        } else {
          if (customLogicAlert !== null) {
            document.body.querySelector(customLogicAlert.elementSelector)?.classList.add('input-error');
            // tslint:disable:max-line-length
            setTimeout(
              () => {
                alert(this.createStringFromTemplate(customLogicAlert.message, new Map(
                  [
                    ['actual', this.numberToString(firstValue, precision)],
                    ['expected', this.numberToString(secondValue, precision)]
                  ]
                )));
              }, 100);
          }
          return false;
        }
      }

      // Операция сложения - выполнение сложения массива операндов или элементов с поиском по селектору
      case LogicOperationType.SUM: {
        // Передан массив операндов
        if (operation.operands.length > 1) {
          let sum = 0;
          operation.operands.forEach(element => {
            sum += Number(this.performCustomLogicOperation(element));
          });
          return sum;
        }
        // Передан селектор для поиска элементов
        const logicOperand = operation.operands[0] as LogicOperand;
        return this.getNumberArrayValuesBySelector(logicOperand.elementSelector).reduce((a, b) => a + b);
      }

      // Операция возведения в степень
      case LogicOperationType.SQUARE: {
        return Number(this.performCustomLogicOperation(operation.operands[0])) ** 2;
      }

      // Операция корня
      case LogicOperationType.ROOT: {
        return Math.sqrt(Number(this.performCustomLogicOperation(operation.operands[0])));
      }
    }

    // Операция не определена - ошибка
    return false;
  }

  // Замена инпутов на текст
  replaceInputsWithText(element: HTMLElement | null): HTMLElement | null {
    if (!element) {
      return null;
    }
    const clone = element?.cloneNode(true) as HTMLElement;
    clone.querySelectorAll<HTMLInputElement>('input[type=text]').forEach(input => {
      input.removeAttribute('id');
      const inputDiv = document.createElement('div');
      inputDiv.innerHTML = input.value;
      inputDiv.setAttribute('style', (input.getAttribute('style') || '') + 'font-weight: bold;');
      input.replaceWith(inputDiv);
    });
    return clone;
  }

  // Создание скриншота элемента
  async htmlElementScreenshot(element: HTMLElement | null): Promise<HTMLCanvasElement | null> {
    let pageScreen = document.getElementById('page-screen');
    if (!pageScreen) {
      const div = document.createElement('div');
      div.id = 'page-screen';
      document.body.append(div);
      pageScreen = document.getElementById('page-screen');
    }
    if (!element || !pageScreen) {
      return null;
    }
    const elementClone = element?.cloneNode(true) as HTMLElement;
    pageScreen.append(elementClone);
    const canvas = await html2canvas(pageScreen, {
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      width: elementClone.offsetWidth,
      height: elementClone.offsetHeight,
    });
    elementClone.remove();
    return canvas;
  }

  // Создание excel файла на основе форм
  async createExcel(pageNum: number = 2): Promise<boolean> {
    for (; pageNum < this.tabsQty; pageNum++) {
      const valid = await this.tabSwitch(pageNum);
      if (valid) {
        await this.createWorksheet(pageNum);
      } else {
        return false;
      }
    }
    await this.saveWorkbook();
    return true;
  }

  // Создание вкладки в excel файле
  async createWorksheet(pageNum: number): Promise<void> {

    // Стилизация текста
    const firstHeading = (text: string) => ({richText: [{text, font: {size: 16, bold: true}}]});
    const secondHeading = (text: string) => ({richText: [{text, font: {size: 14, bold: true}}]});
    const bold = (text: string) => ({richText: [{text, font: {bold: true}}]});

    switch (true) {
      case (pageNum === this.tabsBeforeStairways - 1): {
        // Создание вкладки
        this.workbook = new Workbook();
        const sheetName = 'Опросный лист';
        const sheet = this.workbook.addWorksheet(sheetName);

        // Добавление картинки лого
        const logo = this.workbook.addImage({base64: this.logoBase64, extension: 'png'});
        sheet.addImage(logo, {tl: {col: 0.2, row: 0.5}, ext: {width: 104, height: 78}});

        // Заголовок
        this.today = moment().tz('Europe/Samara', true).locale('ru');
        const headingText = 'Опросный лист от ' + this.today.format('DD MMMM YYYYг. HH:mm:ss');
        sheet.getRow(2).getCell(2).value = firstHeading(headingText);

        // Форматирование колонок
        sheet.getColumn(1).width = 40;
        sheet.getColumn(2).width = 60;
        sheet.getColumn(1).alignment = {wrapText: true, vertical: 'top'};
        sheet.getColumn(2).alignment = {wrapText: true, vertical: 'top', horizontal: 'left'};

        // Контактные данные
        sheet.getRow(6).getCell(1).value = secondHeading('Контактные данные');
        let currentRow = 7;
        this.customerData.forEach((field) => {
          const row = sheet.getRow(currentRow);
          row.getCell(1).value = bold(field.name);
          row.getCell(2).value = this.customerForm.controls[field.id].value;
          currentRow++;
        });

        // Технические характеристики
        sheet.getRow(++currentRow).getCell(1).value = secondHeading('Технические характеристики');
        currentRow++;

        this.specifications.forEach((field) => {
          const row = sheet.getRow(currentRow);
          row.getCell(1).value = bold(field.name);
          row.getCell(2).value = this.correctTypeOf(this.getFieldValue(field));
          currentRow++;
        });
        break;
      }
      case (pageNum < this.tabsQty - 1): {
        const stairwayNum = pageNum - this.tabsBeforeStairways;
        const stairwayKey = Object.keys(this.type.stairways)[stairwayNum];
        const sheetName = this.type.stairways[stairwayKey].name;
        const sheet = this.workbook.addWorksheet(sheetName);

        // Форматирование колонок
        sheet.getColumn(1).width = 17;
        sheet.getColumn(2).width = 14;
        sheet.getColumn(3).width = 14;
        sheet.getColumn(1).alignment = {horizontal: 'center'};
        sheet.getColumn(2).alignment = {horizontal: 'center'};
        sheet.getColumn(3).alignment = {horizontal: 'center'};

        sheet.getRow(1).getCell(1).value = firstHeading(sheetName);
        sheet.getRow(1).getCell(1).alignment = {horizontal: 'left'};
        let currentRow = 2;

        // Добавление картинки марша
        const stairwayProfile = this.replaceInputsWithText(document.querySelector('.stairway-profile'));
        const screen = await this.htmlElementScreenshot(stairwayProfile);
        if (screen) {
          const sizes = this.fitImageToWidthSize(screen.width, screen.height);
          sheet.addImage(this.workbook.addImage({base64: screen.toDataURL(), extension: 'png'}), {
            tl: {col: 0.2, row: currentRow},
            ext: sizes,
          });
          currentRow += Math.ceil(sizes.height / EXCEL_ROW_HEIGHT);
        }

        // Замеры ступенек
        sheet.getRow(currentRow).getCell(1).value = secondHeading('Замеры ступенек');
        sheet.getRow(currentRow++).getCell(1).alignment = {horizontal: 'left'};

        const imageSizes = this.fitImageToWidthSize(426, 419, 150);
        sheet.addImage(this.workbook.addImage({base64: this.stepsDimBase64, extension: 'png'}), {
          tl: {col: 0.2, row: currentRow},
          ext: imageSizes,
        });
        currentRow += Math.ceil(imageSizes.height / EXCEL_ROW_HEIGHT);

        sheet.addTable({
          name: `StepsDimTable${stairwayNum}`,
          ref: `A${++currentRow}`,
          headerRow: true,
          totalsRow: true,
          style: {
            theme: 'TableStyleLight1',
            showRowStripes: true,
          },
          columns: [
            {name: '№ ступени (снизу)', totalsRowLabel: 'Итого:'},
            {name: 'Подступенок', totalsRowFunction: 'sum'},
            {name: 'Проступь', totalsRowFunction: 'sum'},
          ],
          rows: this.transposeMatrix([
            this.range(this.stairways.get(stairwayKey) || 1, 1),
            this.getNumberArrayValuesBySelector('.riser'),
            this.getNumberArrayValuesBySelector('.tread')
          ]),
        });
        break;
      }
      case (pageNum === this.tabsQty - 1): {
        const sheetName = 'Планы маршей';
        const direction = this.type.direction[this.direction].name;
        const sheet = this.workbook.addWorksheet(sheetName);
        sheet.getRow(1).getCell(1).value = firstHeading(sheetName);
        sheet.getRow(3).getCell(1).value = secondHeading(`${direction} исполнение`);
        // Добавление картинки плана марша
        const stairwayPlan = this.replaceInputsWithText(document.querySelector('.stairway-plan'));
        const screen = await this.htmlElementScreenshot(stairwayPlan);
        if (screen) {
          const sizes = this.fitImageToWidthSize(screen.width, screen.height);
          sheet.addImage(this.workbook.addImage({base64: screen.toDataURL(), extension: 'png'}), {
            tl: {col: 0.2, row: 4},
            ext: sizes,
          });
        }
        break;
      }
    }
  }

  getFieldValue(field: Characteristic): string {
    const value = this.specificForm.controls[field.id].value;
    switch (field.type) {
      case CharType.SELECTION: {
        const matgroup = document.body.querySelector(`[ng-reflect-name=${field.id}]`)?.nextElementSibling;
        if (matgroup) {
          return String(matgroup.querySelector('mat-radio-button.mat-radio-checked .mat-radio-label-content')?.textContent).trim();
        }
        return String();
      }
      case CharType.MULTIPLE_SELECTION: {
        const matgroup = document.body.querySelector(`[ng-reflect-name=${field.id}]`)?.nextElementSibling;
        if (matgroup) {
          const values: string[] = [];
          matgroup.querySelectorAll('mat-checkbox.mat-checkbox-checked .mat-checkbox-label').forEach(element => {
            const input = element.querySelector('input');
            if (input) {
              values.push(input.value);
            } else {
              values.push(String(element.textContent));
            }
          });
          return values.map(e => '● ' + e.replace(/(\r\n|\n|\r)/gm, ' ').trim()).join('\n');
        }
        return String();
      }
      default:
        return value;
    }
  }

  // Сохранение сгенерированного excel файла
  async saveWorkbook(): Promise<void> {
    if (typeof this.workbook !== 'undefined') {
      const buffer = await this.workbook.xlsx.writeBuffer();
      const customerName = this.customerForm.controls.customer_field_2?.value;
      const fileName = `${customerName ? customerName + ' ' : ''}${this.today.format('DD-MM-YYYY_HH_mm_ss')}.xlsx`;
      FileSaver.saveAs(
        new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),
        fileName
      );
    } else {
      console.error('Excel файл не был создан');
    }
  }

  // Событие нажатия кнопки создания заявки
  buttonClicked(): void {
    // Первое нажатие на кнопку открывает вкладку с первой формой
    if (!this.startFillingForms) {
      this.selectedTabIndex = 1;
      this.startFillingForms = true;
      return;
    }
    if (this.checkValidForms()) {
      // Подсчет количества вкладок
      const matTabGroup = document.getElementsByTagName('mat-tab-group')[0];
      this.tabsQty = matTabGroup.querySelectorAll('mat-tab-body').length;
      this.createExcel(this.tabsBeforeStairways - 1).then((ok) => {
        if (ok) {
          window.location.href = '';
        } else {
          console.error('Ошибка при создании Excel файла');
        }
      });
    }
  }

  range(n: number, start: number = 0): number[] {
    return Array.from(Array(n).keys(), (_, i) => i + start);
  }

  asIsOrder(): number {
    return 1;
  }

  stairwayChange(key: string, event: any): void {
    this.stairways.set(key, Number(event.target.value));
  }

  isString(val: any): boolean {
    return typeof val === 'string';
  }

  asString(val: any): string {
    return val as string;
  }

  stringEmpty(val: string): boolean {
    return !val || val.replace(/\s/g, '').length === 0;
  }

  stringIsNumeric(val: string): boolean {
    return !isNaN(Number(val));
  }

  correctTypeOf(value: string): string | number {
    return this.stringEmpty(value) || !this.stringIsNumeric(value) ? value : Number(value);
  }

  asCharacteristic(val: any): Characteristic {
    return val as Characteristic;
  }

  ralToHex(ral: string): string {
    // @ts-ignore
    return RAL[ral];
  }

  createStringFromTemplate(template: string, variables: Map<string, string>): string {
    return template.replace(new RegExp('\\$\{([^\{]+)\}', 'g'), (_, varName) => {
      return String(variables.get(varName));
    });
  }

  countDecimals(val: number): number {
    if (Math.floor(val.valueOf()) === val.valueOf()) {
      return 0;
    }
    return val.toString().split('.')[1].length || 0;
  }

  numberToString(val: number, precision: number = 0.01): string {
    const digits = this.countDecimals(precision);
    return isNaN(val) ? String(val) : val.toFixed(Math.min(digits, this.countDecimals(val)));
  }

  fitImageToWidthSize(width: number, height: number, fitWidth: number = 600): { width: number, height: number } {
    return {width: fitWidth, height: fitWidth / width * height};
  }

  transposeMatrix(matrix: number[][]): number[][] {
    return matrix[0].map((_, i) => matrix.map(row => row[i]));
  }

  // Получение массива значений элементов по селектору c фильтрами
  getNumberArrayValuesBySelector(selector: string): number[] {
    const splited = selector.split(':');
    const elementSelector = splited[0];
    const filterSelectors = splited.slice(1);

    let output: number[] = [];
    document.body.querySelectorAll<HTMLElement>(elementSelector).forEach(element => {
      if (element.offsetParent !== null) {
        output.push(Number(element.innerText));
      }
    });

    let not = false;
    filterSelectors.forEach(filter => {
      switch (filter) {
        case 'not': {
          not = true;
          break;
        }
        case 'first-child': {
          if (not) {
            output = output.slice(1);
            not = false;
          } else {
            output = output.slice(0, 1);
          }
          break;
        }
        case 'last-child': {
          if (not) {
            output = output.slice(0, -1);
            not = false;
          } else {
            output = output.slice(-1);
          }
          break;
        }
      }
    });
    return output;
  }
}
