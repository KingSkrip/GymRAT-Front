import { Component, ViewEncapsulation } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';


@Component({
  selector: 'colors',
  templateUrl: './colors.component.html',

  encapsulation: ViewEncapsulation.None,
  imports: [MatRippleModule],
})
export class ColorsComponent {
  /**
   * Constructor
   */
  constructor() {}
}
