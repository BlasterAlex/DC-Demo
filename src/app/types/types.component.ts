import { Component, OnInit } from '@angular/core';
import { MatRadioChange } from '@angular/material/radio';
import { Router } from '@angular/router';

import { TypeService } from '../models/type/type.service';
import { Type } from '../models/type/type.model';

@Component({
  selector: 'app-types',
  templateUrl: './types.component.html',
  styleUrls: ['./types.component.css']
})
export class TypesComponent implements OnInit {

  types!: Type[];

  cards = new Map();

  constructor(private router: Router, private typeService: TypeService) { }

  radioChange(type_id: string, event: MatRadioChange) {
    const state = event.value;
    const images = this.types.filter(t => t.id === type_id)[0].direction[state].images;
    this.cards.set(type_id, { state: state, images: images });
  }

  buttonClicked(type_id: string) {
    this.router.navigateByUrl('type/' + type_id + '?direction=' + this.cards.get(type_id).state);
  }

  ngOnInit(): void {
    this.typeService.getAll().subscribe(data => {
      this.types = data;
      data.forEach(d => {
        const key = Object.keys(d.direction)[0];
        const perf = d.direction[key];
        if (perf !== undefined) {
          this.cards.set(d.id, { state: key, images: perf.images });
        }
      })
    });
  }

}
