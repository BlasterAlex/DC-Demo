import {Component, OnInit} from '@angular/core';
import {MatRadioChange} from '@angular/material/radio';
import {Router} from '@angular/router';

import {TypeService} from '../models/type/type.service';
import {Type} from '../models/type/type.model';

@Component({
  selector: 'app-types',
  templateUrl: './types.component.html',
  styleUrls: ['./types.component.css']
})
export class TypesComponent implements OnInit {

  types!: Type[];

  cards = new Map();

  constructor(private router: Router, private typeService: TypeService) {
  }

  radioChange(typeId: string, event: MatRadioChange): void {
    const state = event.value;
    const images = this.types.filter(t => t.id === typeId)[0].direction[state].images;
    this.cards.set(typeId, {state, images});
  }

  buttonClicked(typeId: string): void {
    this.router.navigateByUrl('type/' + typeId + '?direction=' + this.cards.get(typeId).state).then();
  }

  ngOnInit(): void {
    this.typeService.getAll().subscribe(data => {
      this.types = data;
      data.forEach(d => {
        const key = Object.keys(d.direction)[0];
        const perf = d.direction[key];
        if (perf !== undefined) {
          this.cards.set(d.id, {state: key, images: perf.images});
        }
      });
    });
  }

}
