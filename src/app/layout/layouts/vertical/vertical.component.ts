import {
    Component,
    ViewEncapsulation,
    inject
} from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { VerticalLayoutService } from './components/services/vertical-layout.service';
import { MobileNavComponent } from './components/mobil/mobile-nav.component';

@Component({
    selector: 'app-vertical',
    standalone: true,
    encapsulation: ViewEncapsulation.None,

    templateUrl: './vertical.component.html',
    styleUrls: ['./vertical.component.scss'],

    imports: [
        RouterOutlet,
        SidebarComponent,
        ToolbarComponent,
        FooterComponent,
        MobileNavComponent  
    ]
})
export class VerticalComponent {

    // -----------------------------------------------------------------------------------------------------
    // @ Public
    // -----------------------------------------------------------------------------------------------------

    readonly layoutService =
        inject(VerticalLayoutService);

    readonly isSidebarCollapsed =
        this.layoutService.isSidebarCollapsed;

    readonly isMobileSidebarOpen =
        this.layoutService.isMobileSidebarOpen;

}