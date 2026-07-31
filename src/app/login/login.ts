import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private router = inject(Router);

  private authService = inject(AuthService);

  // Сигнал — это не просто строка. Это объект, который умеет сообщать Angular: "Моё значение изменилось, обнови интерфейс."

  username = signal('');
  password = signal('');

  canLogin = computed(() => {
    return this.username().trim() !== '' && this.password().trim() !== '';
  });

  login() {
    //this.authService.login(this.username(), this.password());
    //this.authService.loadAccounts().subscribe(response => { console.log(response); });

    /*
    this.authService.loadAccounts().subscribe({
      next: response => {
        //console.log(response.accounts);
        this.accounts.set(response.accounts);
      },
      error: err => {
        console.error(err);
      }
    });
    */

    //this.accountService.loadAccounts().subscribe(response => { this.router.navigate(['/dashboard']); });

    this.authService.login(this.username(), this.password())
      .subscribe(response => {
        this.authService.saveTokens(response);
        this.router.navigate(['/dashboard']);
      });

  }

  usernameChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    this.username.set(input.value);
  }

  passwordChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    this.password.set(input.value);
  }

}
