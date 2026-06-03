import { Component,ViewEncapsulation,inject,signal,computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VerticalLayoutService } from '../services/vertical-layout.service';
import { UserService } from '../../../../../core/user/user.service';
import { APP_CONFIG } from '../../../../../core/config/app-config';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../../modules/auth/auth.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent {
  layoutService = inject(VerticalLayoutService);
  appName = APP_CONFIG.appName;
  private _userService = inject(UserService);
  private _authService = inject(AuthService);
  private _router = inject(Router);
  isSearchOpen = signal(false);
  notifications = signal(3);
  isDarkMode = signal(false);
  isUserMenuOpen = signal(false);
  user = this._userService.user$;
  userRole = computed(() => {
    const user: any = this._userService.user;
    const permissions = Number(user?.permissions || 5);
    switch (permissions) {
      case 1: return 'superadmin';
      case 2: return 'gym_owner';
      case 3: return 'admin';
      case 4: return 'coach';
      default: return 'client';
    }
  });

  userInitials = computed(() => {
    const user: any = this._userService.user;
    const name = user?.name ?? 'Usuario';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  });

  toggleSearch(): void {
    this.isSearchOpen.update((v) => !v);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  goToProfile(): void {
    this.closeUserMenu();
    this._userService.openProfileDrawer();
  }

  signOut(): void {
    this.closeUserMenu();
    this._authService.signOut().subscribe(() => {
      this._router.navigate(['/sign-in']);
    });
  }
}