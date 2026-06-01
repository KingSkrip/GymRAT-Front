import {
  Component,
  ViewEncapsulation,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerticalLayoutService } from '../services/vertical-layout.service';
import { UserService } from '../../../../../core/user/user.service';
import { APP_CONFIG } from '../../../../../core/config/app-config';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent {
  // -----------------------------------------------------------------------------------------------------
  // @ Injects
  // -----------------------------------------------------------------------------------------------------

  layoutService = inject(VerticalLayoutService);
  appName = APP_CONFIG.appName;
  private _userService = inject(UserService);

  // -----------------------------------------------------------------------------------------------------
  // @ Signals
  // -----------------------------------------------------------------------------------------------------

  /**
   * Search visibility
   */
  isSearchOpen = signal(false);

  /**
   * Notifications
   */
  notifications = signal(3);

  /**
   * Dark mode
   */
  isDarkMode = signal(false);

  // -----------------------------------------------------------------------------------------------------
  // @ User
  // -----------------------------------------------------------------------------------------------------

  user = this._userService.user$;

  /**
   * Role
   */
  userRole = computed(() => {
    const user: any = this._userService.user;

    const permissions = Number(user?.permissions || 5);

    switch (permissions) {
      case 1:
        return 'superadmin';

      case 2:
        return 'gym_owner';

      case 3:
        return 'admin';

      case 4:
        return 'coach';

      default:
        return 'client';
    }
  });

  /**
   * Initials
   */
  userInitials = computed(() => {
    const user: any = this._userService.user;

    const name = user?.name ?? 'Usuario';

    return name
      .split(' ')
      .map((w: string) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  toggleSearch(): void {
    this.isSearchOpen.update((value) => !value);
  }

  toggleDarkMode(): void {
    const enabled = !this.isDarkMode();

    this.isDarkMode.set(enabled);

    document.documentElement.classList.toggle('dark', enabled);
  }
}