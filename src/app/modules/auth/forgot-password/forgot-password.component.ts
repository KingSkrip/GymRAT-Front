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
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth.service';
import { MatIconModule } from '@angular/material/icon';
import { APP_CONFIG } from '../../../core/config/app-config';

@Component({
  selector: 'auth-forgot-password',
  standalone: true,
  templateUrl: './forgot-password.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, MatIconModule],
})
export class AuthForgotPasswordComponent implements OnInit {
  appName = APP_CONFIG.appName;
  @ViewChild('forgotPasswordNgForm')
  forgotPasswordNgForm!: NgForm;

  alert: { type: string; message: string } = {
    type: 'success',
    message: '',
  };

  forgotPasswordForm!: UntypedFormGroup;
  showAlert: boolean = false;
  currentYear = new Date().getFullYear();

  constructor(
    private _authService: AuthService,
    private _formBuilder: UntypedFormBuilder,
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  sendResetLink(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.forgotPasswordForm.disable();
    this.showAlert = false;

    this._authService
      .forgotPassword(this.forgotPasswordForm.value.email)
      .pipe(
        finalize(() => {
          this.forgotPasswordForm.enable();
          this.forgotPasswordNgForm.resetForm();
          this.showAlert = true;
        }),
      )
      .subscribe({
        next: () => {
          this.alert = {
            type: 'success',
            message: '¡Restablecimiento de contraseña enviado!',
          };
        },
        error: () => {
          this.alert = {
            type: 'error',
            message: '¡No se encontró tu correo electrónico!',
          };
        },
      });
  }
}
