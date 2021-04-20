import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import html2canvas from "html2canvas";
import jsPDF from 'jspdf';
import * as FileSaver from 'file-saver';
import * as JSZip from 'jszip';

import { TypeService } from '../models/type/type.service';
import { Type } from '../models/type/type.model';
import { StairwayService } from '../models/stairway/stairway.service';
import { Stairway } from '../models/stairway/stairway.model';

@Component({
  selector: 'app-type',
  templateUrl: './type.component.html',
  styleUrls: ['./type.component.css']
})
export class TypeComponent implements OnInit {

  public type!: Type;
  public stairway!: Stairway;
  public direction!: string;

  // Количество ступенек на каждом марше
  public stairways: Map<string, number> = new Map();

  constructor(
    private router: Router,
    private http: HttpClient,
    private activatedRoute: ActivatedRoute,
    private typeService: TypeService,
    private stairwayService: StairwayService
  ) { }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      const id = params['id'];
      this.typeService.getAll().subscribe(data => {
        this.type = data.filter(t => t.id === id)[0];
        this.activatedRoute.queryParams.subscribe(qparams => {
          this.direction = qparams['direction'] || Object.keys(this.type.direction)[0];
          Object.keys(this.type.stairways).forEach(key => {
            this.stairways.set(key, 3);
          });
        });
      });
    });
    this.stairwayService.get().subscribe(stairway => {
      this.stairway = stairway;
    });
  }

  range(n: number): number[] {
    return [...Array(n).keys()];
  }

  stairwayChange(key: string, event: any) {
    this.stairways.set(key, parseInt(event.target.value));
  }

  page2pdf(width: number = 500, callback: any) {

    // Страница для создания pdf
    const page = document.body;

    // Отступы в pdf
    const margin = 35;

    // Удаление лишних элементов со страницы
    (function clearUnnecessary() {

      // Установка фиксированной ширины страницы
      const content = document.getElementById('type-content');
      page.style.width = width + 'px';
      if (content && content.offsetWidth > width) {
        width = content.offsetWidth;
        page.style.width = width + 'px';
      }

      // Отступы на странице
      page.style.margin = '0';
      page.style.marginBottom = margin + 'px';
      page.style.marginRight = margin + 'px';

      // Удаление картинок типов
      document.getElementById('type-images')!.remove();

      // Замена инпутов на текст
      page.querySelectorAll<HTMLInputElement>('input').forEach(input => {
        const input_div: HTMLDivElement = document.createElement('div');
        input_div.innerHTML = input.value;
        input_div.setAttribute('style', (input.getAttribute('style') || '') + 'font-weight: bold;');
        input.replaceWith(input_div);
      });

      // Удаление лишних блоков
      page.querySelectorAll<HTMLDivElement>('.steps-dim-info').forEach(div => {
        div.remove();
      });

      // Удаление кнопки
      document.getElementById('accept-button')!.remove();
    })();

    // Создание pdf файла из страницы
    (function createPDF() {

      // Размеры html страницы
      const HTML_Width = page.offsetWidth;
      const HTML_Height = page.offsetHeight;

      // Соотношение сторон A4
      const ratio = 297 / 210;

      // Размеры pdf страницы
      const PDF_Width = HTML_Width + margin * 2;
      const PDF_Height = PDF_Width * ratio;

      // Количество страниц в pdf файле
      const totalPDFPages = Math.ceil(HTML_Height / PDF_Height) - 1;

      html2canvas(page, {
        allowTaint: true,
        width: HTML_Width
      }).then(function (canvas) {
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const pdf: jsPDF = new jsPDF('p', 'pt', [PDF_Width, PDF_Height]);
        pdf.addImage(imgData, 'JPG', margin, margin, HTML_Width, HTML_Height);

        for (var i = 1; i <= totalPDFPages; i++) {
          pdf.addPage([PDF_Width, PDF_Height]);
          pdf.addImage(imgData, 'JPG', margin, -(PDF_Height * i) + margin, HTML_Width, HTML_Height);
        }

        callback(pdf);
      });

    })();

  }

  downloadArchive() {
    this.http.get('assets/data/doc/questionnaire.docx', { responseType: 'blob' }).subscribe(doc => {
      this.page2pdf(500, (pdf: jsPDF) => {

        const zip = new JSZip();
        zip.file('attachment.pdf', new Blob([pdf.output('blob')], { type: 'application/pdf' }));
        zip.file('questionnaire.docx', doc);

        zip.generateAsync({ type: 'blob' }).then((content) => {
          if (content)
            FileSaver.saveAs(content, 'questionnaire.zip');
        });

        this.router.navigateByUrl('');

      });
    });
  }

}
