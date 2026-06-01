import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';


@Component({
    selector: 'auth-sign-up',
    standalone: true,
    templateUrl: './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [
        RouterLink,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
    ],
})
export class AuthSignUpComponent implements OnInit {
   @ViewChild('signUpNgForm') signUpNgForm!: NgForm;

   alert: { type: string; message: string } = {
        type: 'success',
        message: '',
    };
  signUpForm!: UntypedFormGroup;
    showAlert: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router
    ) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.signUpForm = this._formBuilder.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            company: [''],
            agreements: ['', Validators.requiredTrue],
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Crear cuenta
     */
    signUp(): void {
        if (this.signUpForm.invalid) {
            return;
        }

        this.signUpForm.disable();
        this.showAlert = false;
        this._authService.signUp(this.signUpForm.value)
     .subscribe({
    next: () => {
        this._router.navigateByUrl('/confirmation-required');
    },

    error: (errorResponse: any) => {

        this.signUpForm.enable();

        this.signUpNgForm.resetForm();

        let message = 'Algo salió mal, por favor inténtalo de nuevo.';

        if (errorResponse.status === 422 && errorResponse.error.errors) {

            const errors = errorResponse.error.errors;

            message = Object.values(errors)
                .map((errArray: any) => errArray.join(' '))
                .join(' ');
        }
        else if (errorResponse.error?.message) {

            message = errorResponse.error.message;
        }

        this.alert = {
            type: 'error',
            message: message,
        };

        this.showAlert = true;
    },
});
    }

}
