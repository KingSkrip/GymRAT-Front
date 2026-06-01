import { Component, ViewEncapsulation } from '@angular/core';
import { APP_CONFIG } from '../../../../../core/config/app-config';

@Component({
  selector: 'app-footer',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  config = APP_CONFIG;
  currentYear = new Date().getFullYear();
}
