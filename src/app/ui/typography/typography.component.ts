import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'typography',
    templateUrl: './typography.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [ RouterLink],
})
export class TypographyComponent {
    /**
     * Constructor
     */
    constructor() {}
}
