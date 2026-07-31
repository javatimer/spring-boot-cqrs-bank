import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { BankAccountService } from '../services/bankaccount.service';
import { OpenAccountRequest } from '../models/open-account-request';
import { AccountType } from '../models/account-type';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

  // {{ }} — вывести значение (интерполяция);
  // @if — условный рендеринг;
  // @for — вывод коллекции.
  // inject() вместо конструктора.
  // signal() вместо обычных полей состояния.
  // computed() вместо геттеров.
  // toSignal() вместо subscribe().

  readonly auth = inject(AuthService);

  private readonly bankAccountService = inject(BankAccountService);

  readonly accounts = this.bankAccountService.allAccounts;

  readonly loading = this.bankAccountService.isLoading;

  readonly creating = signal(false);

  readonly error = signal<string | null>(null);

  readonly success = signal<string | null>(null);

  constructor() {
    this.bankAccountService.loadAccounts();
  }

  openAccount(holder: string, balance: string, type: string) {
    this.error.set(null);
    this.success.set(null);

    if (!holder.trim()) {
      this.error.set("Account holder is required.");
      return;
    }

    const openingBalance = Number(balance);

    if (Number.isNaN(openingBalance) || openingBalance <= 0) {
      this.error.set("Opening balance is invalid.");
      return;
    }

    const request: OpenAccountRequest = {
      accountHolder: holder,
      openingBalance,
      accountType: type as AccountType
    };

    this.creating.set(true);

    this.bankAccountService.openAccount(request)
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: () => {
          setTimeout(() => {
            this.success.set("Account created successfully.");
            this.bankAccountService.loadAccounts();
          }, 300);
        },
        error: () => {
          this.error.set("Unable to create account.");
        }
      });
  }

  logout(): void {
    this.auth.logout();
  }
}
