import { Component, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'carded-left-sidebar-1-normal-scroll',
  templateUrl: './left-sidebar-1.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [MatSidenavModule, MatIconModule, RouterLink, MatButtonModule],
})
export class CardedLeftSidebar1NormalScrollComponent {
  /**
   * Constructor
   */
  constructor() {}
}
