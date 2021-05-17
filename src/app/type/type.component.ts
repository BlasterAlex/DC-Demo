import {AfterContentInit, Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import jsPDF from 'jspdf';
import * as FileSaver from 'file-saver';
import * as JSZip from 'jszip';

import {TypeService} from '../models/type/type.service';
import {Type} from '../models/type/type.model';
import {StairwayService} from '../models/stairway/stairway.service';
import {Stairway} from '../models/stairway/stairway.model';
import {CharacteristicService} from '../models/characteristic/characteristic.service';
import {Characteristic, CharType, RAL} from '../models/characteristic/characteristic.model';
import {FormControl, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {MatCheckboxChange} from '@angular/material/checkbox';
import * as moment from 'moment-timezone';
import html2canvas from 'html2canvas';
import {MatSelectChange} from '@angular/material/select';

@Component({
  selector: 'app-type',
  templateUrl: './type.component.html',
  styleUrls: ['./type.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TypeComponent implements OnInit, AfterContentInit {

  // Тип подъемника
  public type!: Type;
  public direction!: string;

  // Количество ступенек на каждом марше
  public stairway!: Stairway;
  public stairways: Map<string, number> = new Map();

  // Форма ввода информации о заказчике
  types = CharType;
  customerForm!: FormGroup;
  customerData!: Characteristic[];

  // Форма для ввода характеристик
  specificForm!: FormGroup;
  specifications!: Characteristic[];

  // Индекс активной вкладки
  tabsQty!: number;
  selectedTabIndex = 0;

  // Начало заполнение форм (для первого нажатия на кнопку)
  startFillingForms = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private activatedRoute: ActivatedRoute,
    private typeService: TypeService,
    private stairwayService: StairwayService,
    private characteristicService: CharacteristicService
  ) {
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      const id = params.id;
      this.typeService.getAll().subscribe(data => {
        this.type = data.filter(t => t.id === id)[0];
        this.activatedRoute.queryParams.subscribe(qparams => {
          this.direction = qparams.direction || Object.keys(this.type.direction)[0];
          Object.keys(this.type.stairways).forEach(key => {
            this.stairways.set(key, 3);
          });
        });
      });
    });
    this.stairwayService.get().subscribe(stairway => {
      this.stairway = stairway;
    });
    const fillForm = (fields: Characteristic[], form: FormGroup) => {
      fields.forEach(field => {
        form.addControl(field.id, new FormControl(''));
        if (field.value) {
          form.controls[field.id].setValue(field.value);
        }
        const validators: ValidatorFn[] = [];
        if (field.required) {
          validators.push(Validators.required);
        }
        if (field.checkMask) {
          validators.push(Validators.pattern((field.checkMask)));
        }
        if (validators.length > 0) {
          form.controls[field.id].setValidators(validators);
        }
      });
    };
    this.characteristicService.getCustomerData().subscribe(customerData => {
      let num = 1;
      for (const data of customerData) {
        data.id = 'customer_field_' + (num++);
      }
      this.customerData = customerData;
      this.customerForm = new FormGroup({});
      fillForm(this.customerData, this.customerForm);
    });
    this.characteristicService.getSpecifications().subscribe(specifications => {
      let num = 1;
      for (const data of specifications) {
        data.id = 'specification_' + (num++);
      }
      this.specifications = specifications;
      this.specificForm = new FormGroup({});
      fillForm(this.specifications, this.specificForm);
    });
  }

  ngAfterContentInit(): void {
    setTimeout(() => {
      const colorSelectors = document.getElementsByClassName('color-select');
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < colorSelectors.length; i++) {
        const colorSelector = colorSelectors[i];
        const color = colorSelector.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.innerHTML;
        // @ts-ignore
        colorSelector.parentElement.parentElement.style.background = this.ralToHex(color);
      }
    }, 400);
  }

  range(n: number): number[] {
    return [...Array(n).keys()];
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

  asCharacteristic(val: any): Characteristic {
    return val as Characteristic;
  }

  ralToHex(ral: string): string {
    // @ts-ignore
    return RAL[ral];
  }

  questionnairePreparation(margin: number = 35, width: number = 500): void {

    // Вся страница
    const page = document.body;

    // Блок контента
    const content = document.getElementById('type-content');

    // Установка текущей даты
    const today = moment().tz('Europe/Samara', true).locale('ru');
    const todayHeader = document.getElementById('today') as HTMLHeadElement;
    todayHeader.innerText = 'Опросный лист от ' + today.format('DD MMMM YYYY') + 'г.';
    todayHeader.removeAttribute('hidden');

    // Замена инпутов на текст
    page.querySelectorAll<HTMLInputElement>('input[type=text]').forEach(input => {
      const inputDiv: HTMLDivElement = document.createElement('div');
      inputDiv.innerHTML = input.value;
      inputDiv.setAttribute('style', (input.getAttribute('style') || '') + 'font-weight: bold;');
      input.replaceWith(inputDiv);
    });

    // Замена радио кнопок
    page.querySelectorAll<HTMLElement>('.mat-radio-button').forEach(button => {
      const input = document.createElement('input');
      input.setAttribute('type', 'radio');
      if (button.className.includes('mat-radio-checked')) {
        input.setAttribute('checked', 'checked');
      }
      button.firstElementChild?.firstElementChild?.replaceWith(input);
    });

    // Удаление лишних блоков
    page.querySelectorAll<HTMLDivElement>('.steps-dim-info').forEach(div => {
      div.remove();
    });

    // Удаление кнопки создания заявки
    document.getElementById('accept-button')?.remove();

    // Удаление формы с вкладками
    document.getElementById('mat-tab-group')?.remove();

    // Отображение блока заявки
    document.getElementById('page-screen')?.removeAttribute('hidden');

    // Установка фиксированной ширины страницы
    page.style.width = width + 'px';
    if (content && content.offsetWidth > width) {
      width = content.offsetWidth;
      page.style.width = width + 'px';
    }

    // Отступы на странице
    page.style.margin = '0';
    page.style.marginBottom = margin + 'px';
    page.style.marginRight = margin + 'px';
  }

  page2pdf(callback: any): void {

    // Вся страница
    const page = document.body;

    // Отступы в pdf
    const margin = 35;

    // Подготовка страницы
    this.questionnairePreparation(margin);

    // Создание pdf файла из страницы
    (function createPDF(): void {

      // Размеры html страницы
      // tslint:disable:variable-name
      const HTML_Width = page.offsetWidth;
      const HTML_Height = page.offsetHeight;

      // Соотношение сторон A4
      const ratio = 297 / 210;

      // Размеры pdf страницы
      const PDF_Width = HTML_Width + margin * 2;
      const PDF_Height = PDF_Width * ratio;

      // Количество страниц в pdf файле
      const totalPDFPages = Math.ceil(HTML_Height / PDF_Height) - 1;

      // Конвертация в pdf
      html2canvas(page, {
        allowTaint: true,
        width: HTML_Width
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf: jsPDF = new jsPDF('p', 'pt', [PDF_Width, PDF_Height]);
        pdf.addImage(imgData, 'JPG', margin, margin, HTML_Width, HTML_Height);

        for (let i = 1; i <= totalPDFPages; i++) {
          pdf.addPage([PDF_Width, PDF_Height]);
          pdf.addImage(imgData, 'JPG', margin, -(PDF_Height * i) + margin, HTML_Width, HTML_Height);
        }

        callback(pdf);
      });

    })();

  }

  downloadArchive(): void {
    this.http.get('assets/data/doc/questionnaire.docx', {responseType: 'blob'}).subscribe(doc => {
      this.page2pdf((pdf: jsPDF) => {

        const zip = new JSZip();
        zip.file('attachment.pdf', new Blob([pdf.output('blob')], {type: 'application/pdf'}));
        zip.file('questionnaire.docx', doc);

        zip.generateAsync({type: 'blob'}).then((content) => {
          if (content) {
            FileSaver.saveAs(content, 'questionnaire.zip');
          }
        });

        this.router.navigateByUrl('');

      });
    });
  }

  colorPick(event: MatSelectChange): void {
    const select = event.source._elementRef.nativeElement as HTMLSelectElement;
    // @ts-ignore
    select.parentElement.parentElement.style.background = this.ralToHex(event.value);
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

  screenPage(pageNum: number = 0): void {
    this.selectedTabIndex = pageNum;
    setTimeout(() => {
      const element = document.getElementById('mat-tab-content-0-' + pageNum) as HTMLElement;
      document.getElementById('page-screen')?.appendChild(element.cloneNode(true));
      if (pageNum < this.tabsQty - 1) {
        this.screenPage(pageNum + 1);
      } else {
        this.page2pdf((pdf: jsPDF) => {
          this.router.navigateByUrl('');
          pdf.save('questionnaire.pdf');
        });
      }
    }, 1000);
  }

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
      // Подготовка страницы для снимка
      this.screenPage(1);
    }
  }

}
