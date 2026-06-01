import {
    Injectable,
    computed,
    inject,
    signal
} from '@angular/core';

import {
    BreakpointObserver
} from '@angular/cdk/layout';

@Injectable({
    providedIn: 'root'
})
export class VerticalLayoutService {

    // -----------------------------------------------------------------------------------------------------
    // @ Dependencies
    // -----------------------------------------------------------------------------------------------------

    private readonly _breakpointObserver =
        inject(BreakpointObserver);

    // -----------------------------------------------------------------------------------------------------
    // @ Sidebar
    // -----------------------------------------------------------------------------------------------------

isSidebarCollapsed = signal(true);

    isMobileSidebarOpen = signal(false);

    // -----------------------------------------------------------------------------------------------------
    // @ Responsive
    // -----------------------------------------------------------------------------------------------------

    isMobile = signal(false);

    // -----------------------------------------------------------------------------------------------------
    // @ Constructor
    // -----------------------------------------------------------------------------------------------------

    constructor() {

        this._listenBreakpoints();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    toggleSidebar(): void {

        this.isSidebarCollapsed.update(value => !value);
    }

    toggleMobileSidebar(): void {

        this.isMobileSidebarOpen.update(value => !value);
    }

    closeMobileSidebar(): void {

        this.isMobileSidebarOpen.set(false);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

  private _listenBreakpoints(): void {

    this._breakpointObserver
        .observe('(max-width: 768px)')
        .subscribe(result => {

            this.isMobile.set(result.matches);

            if (result.matches) {

                // Mobile
                this.isSidebarCollapsed.set(true);

            } else {

                // Desktop
                this.isMobileSidebarOpen.set(false);

                // SIEMPRE COLAPSADO EN PC
                this.isSidebarCollapsed.set(true);
            }
        });
}

    sidebarWidth = computed(() =>
    this.isSidebarCollapsed()
        ? '72px'
        : '256px'
);
}