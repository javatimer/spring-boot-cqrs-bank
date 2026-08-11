import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { signal } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private router = inject(Router);

  private authService = inject(AuthService);

  // Сигнал — это не просто строка. Это объект, который умеет сообщать Angular: "Моё значение изменилось, обнови интерфейс."

  private fb = inject(FormBuilder);

  readonly loggingIn = signal(false);

  readonly loginForm = this.fb.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3)
      ]
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(3)
      ]
    ]
  });

  readonly hidePassword = signal(true);

  private snackBar = inject(MatSnackBar);

  @ViewChild('passwordInput')
  passwordInput!: ElementRef<HTMLInputElement>;

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { username, password } = this.loginForm.getRawValue();

    this.loggingIn.set(true);

    this.authService.login(username!, password!)
      .pipe(
        finalize(() => this.loggingIn.set(false))
      )
      .subscribe({
        next: () => { this.router.navigate(['/dashboard']); },
        error: (err: HttpErrorResponse) => {
          this.loginForm.patchValue({ password: '' });
          this.loginForm.controls.password.markAsPristine();
          this.loginForm.controls.password.markAsUntouched();

          queueMicrotask(() => this.passwordInput.nativeElement.focus());

          this.snackBar.open('Invalid username or password.', 'OK',
            {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            }
          );
        }
      });
  }

}
