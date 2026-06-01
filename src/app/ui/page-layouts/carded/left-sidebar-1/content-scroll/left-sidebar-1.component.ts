import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'carded-left-sidebar-1-content-scroll',
  templateUrl: './left-sidebar-1.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [MatSidenavModule, MatIconModule, RouterLink, MatButtonModule, CdkScrollable],
})
export class CardedLeftSidebar1ContentScrollComponent {
  /**
   * Constructor
   */
  constructor() {}
}
