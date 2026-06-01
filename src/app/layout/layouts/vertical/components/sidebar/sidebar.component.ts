import { Component, ViewEncapsulation, inject } from '@angular/core';

import { NavigationComponent } from '../navigation/navigation.component';
import { VerticalLayoutService } from '../services/vertical-layout.service';
import { APP_CONFIG } from '../../../../../core/config/app-config';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [NavigationComponent, MatIconModule],
})
export class SidebarComponent {
  // -----------------------------------------------------------------------------------------------------
  // @ Services
  // -----------------------------------------------------------------------------------------------------
  config = APP_CONFIG;
  layoutService = inject(VerticalLayoutService);

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  toggleCollapse(): void {
    this.layoutService.toggleSidebar();
  }
}
