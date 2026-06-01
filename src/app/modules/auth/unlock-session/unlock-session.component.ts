import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';

import {
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../auth.service';
import { UserService } from '../../../core/user/user.service';

@Component({
  selector: 'auth-unlock-session',
  templateUrl: './unlock-session.component.html',
  encapsulation: ViewEncapsulation.None,

  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
})
export class AuthUnlockSessionComponent implements OnInit {

  @ViewChild('unlockSessionNgForm')
  unlockSessionNgForm!: NgForm;

  alert: { type: string; message: string } = {
    type: 'success',
    message: '',
  };

  name: string = '';

  showAlert: boolean = false;

  unlockSessionForm!: UntypedFormGroup;

  private _email: string = '';

  /**
   * Constructor
   */
  constructor(
    private _activatedRoute: ActivatedRoute,
    private _authService: AuthService,
    private _formBuilder: UntypedFormBuilder,
    private _router: Router,
    private _userService: UserService,
  ) {}

  /**
   * On init
   */
  ngOnInit(): void {

    // Get the user's name
    this._userService.user$.subscribe((user) => {

      this.name = user?.name ?? '';

      this._email = user?.email ?? '';

    });

    // Create the form
    this.unlockSessionForm = this._formBuilder.group({
      name: [
        {
          value: this.name,
          disabled: true,
        },
      ],
      password: ['', Validators.required],
    });
  }

  /**
   * Unlock
   */
  unlock(): void {

    // Return if the form is invalid
    if (this.unlockSessionForm.invalid) {
      return;
    }

    // Disable the form
    this.unlockSessionForm.disable();

    // Hide the alert
    this.showAlert = false;

    this._authService
      .unlockSession({

        email: this._email,

        password: this.unlockSessionForm.get('password')?.value ?? '',

      })
      .subscribe({

        next: () => {

          const redirectURL =
            this._activatedRoute.snapshot.queryParamMap.get('redirectURL')
            || '/signed-in-redirect';

          this._router.navigateByUrl(redirectURL);
        },

        error: () => {

          // Re-enable the form
          this.unlockSessionForm.enable();

          // Reset the form
          this.unlockSessionNgForm.resetForm({
            name: {
              value: this.name,
              disabled: true,
            },
          });

          // Set the alert
          this.alert = {
            type: 'error',
            message: 'Invalid password',
          };

          // Show the alert
          this.showAlert = true;
        },
      });
  }
}