import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import {
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { DashboardByRole } from '../roles/dataroles-dashboard';
import { MatIconModule } from '@angular/material/icon';
import { APP_CONFIG } from '../../../core/config/app-config';

@Component({
  selector: 'auth-sign-in',
  templateUrl: './sign-in.component.html',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, MatIconModule],
})
export class AuthSignInComponent implements OnInit {
  appName = APP_CONFIG.appName;
  @ViewChild('signInNgForm')
  signInNgForm!: NgForm;

  alert: { type: string; message: string } = {
    type: 'success',
    message: '',
  };

  signInForm!: UntypedFormGroup;
  showAlert: boolean = false;
  showPassword: boolean = false;
  currentYear = new Date().getFullYear();

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _authService: AuthService,
    private _formBuilder: UntypedFormBuilder,
    private _router: Router,
  ) {}

  ngOnInit(): void {
  this.signInForm = this._formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [''],
  });
}

  signIn(event?: Event): void {
    if (event) event.preventDefault();
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    this.signInForm.disable();
    this.showAlert = false;

    this._authService.signIn(this.signInForm.value).subscribe({
     next: (response: any) => {
  console.log(response);

  const userRole: number = response.permissions;

  const redirectURL =
    DashboardByRole[userRole as keyof typeof DashboardByRole] || '/dashboard';

  this._router.navigateByUrl(redirectURL);
},
      error: (error: any) => {
        console.error('❌ Error en login:', error);
        this.signInForm.enable();
        this.alert = {
          type: 'error',
          message: 'Correo electrónico o contraseña incorrectos',
        };
        this.showAlert = true;
        this.signInForm.patchValue({ password: '' });
      },
    });
  }
}
