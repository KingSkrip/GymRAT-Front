import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type LoaderType =
  | 'users'
  | 'roles'
  | 'subroles'
  | 'table'
  | 'cards'
  | 'gyms'
  | 'clientes'
  | 'sucursales';

@Component({
  selector: 'app-loader',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  imports: [CommonModule, MatIconModule],
})
export class LoaderComponent implements OnInit {
  @Input() type: LoaderType = 'cards';

  @Input() items = 6;

  skeletonItems: number[] = [];

  ngOnInit(): void {
    this.skeletonItems = Array.from({ length: this.items }, (_, i) => i);
  }
}
