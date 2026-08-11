import { Component, DestroyRef, inject, signal, effect, ViewChild } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { BankAccountService } from '../services/bankaccount.service';
import { OpenAccountRequest } from '../models/open-account-request';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BankAccount } from '../models/bank-account';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { AccountEventsService } from '../services/account-events-service';
import { AccountEventType } from '../models/account-event-type';
import { EqualityType } from '../models/equality-type';
import { DatePipe, DecimalPipe } from '@angular/common';
import { computed } from '@angular/core';
import { DashboardSkeleton } from "../shared/dashboard-skeleton/dashboard-skeleton";
import { ThemeService } from '../services/theme-service';

@Component({
  selector: 'app-dashboard',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule,
    MatSortModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    DatePipe,
    DecimalPipe,
    DashboardSkeleton
  ],
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

  readonly auth = inject(AuthService);

  readonly theme = inject(ThemeService);

  private readonly accountEvents = inject(AccountEventsService);

  private readonly bankAccountService = inject(BankAccountService);

  readonly accounts = this.bankAccountService.allAccounts;
  dataSource = new MatTableDataSource<BankAccount>();

  readonly loading = this.bankAccountService.isLoading;

  readonly creating = signal(false);

  private fb = inject(FormBuilder);

  readonly EqualityType = EqualityType;

  readonly depositAmounts = signal<Record<string, number>>({});
  readonly withdrawAmounts = signal<Record<string, number>>({});

  private snackBar = inject(MatSnackBar);

  private dialog = inject(MatDialog);

  // В итоге пришлось использовать сеттер, чтобы получить доступ к MatSort после его инициализации.
  @ViewChild(MatSort)
  set matSort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  @ViewChild(MatPaginator)
  set paginator(p: MatPaginator) {
    if (p) {
      this.dataSource.paginator = p;
    }
  }

  displayedColumns = ['holder', 'type', 'balance', 'deposit', 'withdraw', 'actions'];

  readonly openAccountForm = this.fb.group({
    accountHolder: [
      '',
      [
        Validators.required,
        Validators.minLength(3)
      ]
    ],

    openingBalance: [
      0,
      [
        Validators.required,
        Validators.min(1)
      ]
    ],

    accountType: [
      '',
      Validators.required
    ]
  });

  holder = signal('');

  balance = signal<number | null>(null);

  equality = signal<EqualityType>(EqualityType.GREATER_THAN);

  readonly totalAccounts = computed(() => this.accounts().length);

  readonly totalBalance = computed(() => this.accounts().reduce((sum, account) => sum + account.balance, 0));

  readonly currentAccounts = computed(() => this.accounts().filter(a => a.accountType === 'CURRENT').length);

  readonly savingsAccounts = computed(() => this.accounts().filter(a => a.accountType === 'SAVINGS').length);

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.bankAccountService.loadAccounts();

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'holder':
          return item.accountHolder;

        case 'balance':
          return item.balance;

        default:
          return (item as any)[property];
      }
    };

    effect(() => this.dataSource.data = this.accounts());
    
    //accountEvents.events() у тебя, судя по смыслу, — долгоживущий поток событий. Он может существовать всё время жизни приложения.
    //Если Dashboard уничтожится, а подписка останется:
    this.accountEvents.events()
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => {
        console.log('Received', event);
        switch (event.type) {
          case AccountEventType.ACCOUNT_OPENED:
            this.bankAccountService.add(event.accountId);
            break;

          case AccountEventType.ACCOUNT_CLOSED:
            this.bankAccountService.remove(event.accountId);
            break;

          case AccountEventType.FUNDS_DEPOSITED:
          case AccountEventType.FUNDS_WITHDRAWN:
            this.bankAccountService.refresh(event.accountId);
            break;
        }
      });
  }

  openAccount() {
    if (this.openAccountForm.invalid) {
      this.openAccountForm.markAllAsTouched();
      return;
    }

    const request: OpenAccountRequest = this.openAccountForm.getRawValue() as OpenAccountRequest;

    this.creating.set(true);

    this.bankAccountService.openAccount(request)
      .pipe(
        finalize(() => this.creating.set(false))
      )
      .subscribe({
        next: () => {
          this.showMessage("Account created successfully.");

          this.openAccountForm.reset({
            accountHolder: '',
            openingBalance: 0,
            accountType: ''
          });

          Object.values(this.openAccountForm.controls).forEach(control => {
            control.markAsPristine();
            control.markAsUntouched();
          });
        },

        error: (err: HttpErrorResponse) => {
          this.showMessage(err.error?.message ?? "Unable to create account.");
        }
      });
  }

  deposit(id: string) {
    const amount = this.depositAmounts()[id];

    if (!amount || amount <= 0) {
      return;
    }

    this.bankAccountService.depositFunds(id, amount)
      .subscribe({
        next: () => {
          this.showMessage('Deposit completed successfully');
          this.clearDepositAmount(id);
        },
        error: () => {
          this.showMessage("Unable to deposit funds.");
        }
      });
  }

  withdraw(id: string) {
    const amount = this.withdrawAmounts()[id];

    if (!amount || amount <= 0) {
      return;
    }

    this.bankAccountService.withdrawFunds(id, amount)
      .subscribe({
        next: () => {
          this.showMessage('Withdraw completed successfully');
          this.clearWithdrawAmount(id);
        },
        error: () => {
          this.showMessage("Unable to withdraw funds.");
        }
      });
  }

  setDepositAmount(id: string, value: string) {
    this.depositAmounts.update(amounts => ({
      ...amounts,
      [id]: Number(value)
    }));
  }

  setWithdrawAmount(id: string, value: string) {
    this.withdrawAmounts.update(amounts => ({
      ...amounts,
      [id]: Number(value)
    }));
  }

  close(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '420px',
      data: {
        title: 'Close account',
        message: 'Are you sure you want to close this account?',
        confirmText: 'Close account',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => { // Observable, который срабатывает после закрытия окна.
      if (!result) {
        return;
      }

      this.bankAccountService.closeAccount(id)
        .subscribe(
          {
            next: () => {
              this.showMessage("Account closed successfully.");
            },
            error: () => {
              this.showMessage("Unable to close account.");
            }
          }
        );
    });

  }

  private clearDepositAmount(id: string) {
    this.depositAmounts.update(values => {
      const copy = { ...values };
      delete copy[id];
      return copy;
    });
  }

  private clearWithdrawAmount(id: string) {
    this.withdrawAmounts.update(values => {
      const copy = { ...values };
      delete copy[id];
      return copy;
    });
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  sortChanged(event: Sort) {
    console.log(event);
  }

  logout() {
    this.showMessage("Logged out successfully.");

    setTimeout(() => {
      this.auth.logout();
    }, 300);
  }

  searchByHolder() {
    const holder = this.holder().trim();

    if (!holder) {
      return;
    }

    this.bankAccountService.searchByHolder(holder);
  }

  searchByBalance() {
    const balance = this.balance();

    if (balance === null) {
      return;
    }

    this.bankAccountService.searchByBalance(this.equality(), balance);
  }

  resetFilters() {
    this.holder.set('');
    this.balance.set(null);
    this.equality.set(EqualityType.GREATER_THAN);
    this.bankAccountService.loadAccounts();
  }

  restoreReadDb() {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '420px',
      data: {
        title: 'Rebuild Read Database',
        message: 'This will rebuild the read database from the event history. Continue?',
        confirmText: 'Rebuild database',
        confirmColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => { // Observable, который срабатывает после закрытия окна.
      if (!result) {
        return;
      }

      this.bankAccountService.restoreReadDb()
        .subscribe({
          next: () => {
            this.showMessage('Read database restored successfully.');
          },

          error: () => {
            this.showMessage('Unable to restore read database.');
          }
        });
    });
  }
}
