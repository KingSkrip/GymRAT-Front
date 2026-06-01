import {
    Component,
    ViewEncapsulation
} from '@angular/core';

import {
    RouterOutlet
} from '@angular/router';

@Component({
    selector: 'app-empty',
    standalone: true,
    encapsulation: ViewEncapsulation.None,

    templateUrl: './empty.component.html',
    styleUrls: ['./empty.component.scss'],

    imports: [
        RouterOutlet
    ]
})
export class EmptyLayoutComponent {}