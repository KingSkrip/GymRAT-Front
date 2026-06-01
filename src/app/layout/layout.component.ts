import {
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
    inject,
    signal
} from '@angular/core';

import {
    ActivatedRoute,
    NavigationEnd,
    Router
} from '@angular/router';

import {
    Subject,
    filter,
    takeUntil
} from 'rxjs';

import { AuthService } from '../modules/auth/auth.service';

/**
 * LAYOUTS
 */
import { VerticalComponent } from './layouts/vertical/vertical.component';

import { EmptyLayoutComponent } from './layouts/empty/empty.component';

/**
 * OPCIONAL
 * si todavía no existe, comenta esto
 */
// import { HorizontalComponent } from './layouts/horizontal/horizontal.component';

@Component({
    selector: 'layout',
    standalone: true,
    encapsulation: ViewEncapsulation.None,

    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],

    imports: [
        VerticalComponent,
        EmptyLayoutComponent,
        // HorizontalComponent
    ]
})
export class LayoutComponent implements OnInit, OnDestroy {

    // -----------------------------------------------------------------------------------------------------
    // @ Public
    // -----------------------------------------------------------------------------------------------------

    layout = signal('vertical');

    roleId: number | null = null;

    subRoleId: number | null = null;

    // -----------------------------------------------------------------------------------------------------
    // @ Private
    // -----------------------------------------------------------------------------------------------------

    private readonly _destroyed$ =
        new Subject<void>();

    private readonly _router =
        inject(Router);

    private readonly _activatedRoute =
        inject(ActivatedRoute);

    private readonly _authService =
        inject(AuthService);

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {

        this._listenRouterChanges();

        this._listenUserRole();

        this._resolveLayout();
    }

    ngOnDestroy(): void {

        this._destroyed$.next();

        this._destroyed$.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    private _listenRouterChanges(): void {

        this._router.events
            .pipe(
                filter(event => event instanceof NavigationEnd),
                takeUntil(this._destroyed$)
            )
            .subscribe(() => {

                this._resolveLayout();

            });
    }

    private _listenUserRole(): void {

        this._authService.getUserRole()
            .pipe(
                filter(Boolean),
                takeUntil(this._destroyed$)
            )
            .subscribe((roleInfo: any) => {

                this.roleId = roleInfo.roleId;

                this.subRoleId = roleInfo.subRoleId;

            });
    }

    private _resolveLayout(): void {

        let route = this._activatedRoute;

        while (route.firstChild) {

            route = route.firstChild;
        }

        /**
         * Default
         */
        this.layout.set('vertical');

        /**
         * Route layout
         */
        const layoutFromRoute =
            route.snapshot.data['layout'];

        if (layoutFromRoute) {

            this.layout.set(layoutFromRoute);
        }

        /**
         * Query layout
         */
        const layoutFromQuery =
            route.snapshot.queryParamMap.get('layout');

        if (layoutFromQuery) {

            this.layout.set(layoutFromQuery);
        }
    }
}