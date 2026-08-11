import { Service, signal } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { OpenAccountRequest } from '../models/open-account-request';
import { AccountLookupResponse } from '../models/account-lookup-response';
import { delay, finalize, map } from 'rxjs';
import { OpenAccountResponse } from '../models/open-account-response';
import { BankAccount } from '../models/bank-account';
import { DepositFundsResponse } from '../models/deposit-funds-response';
import { CloseAccountResponse } from '../models/close-account-response';
import { WithdrawFundsResponse } from '../models/withdraw-funds-response';
import { EqualityType } from '../models/equality-type';

@Service()
export class BankAccountService {
    private readonly apiQueryUrl = environment.apiQueryUrl;
    private readonly apiCmdUrl = environment.apiCmdUrl;

    private readonly http = inject(HttpClient);

    private readonly accounts = signal<BankAccount[]>([]);

    readonly allAccounts = this.accounts.asReadonly();

    private readonly loading = signal(false);
    readonly isLoading = this.loading.asReadonly();

    loadAccounts(): void {
        this.loading.set(true);
        this.http.get<AccountLookupResponse>(`${this.apiQueryUrl}/bankAccountLookup`)
            .pipe(
                delay(3000), // For demo skeleton
                map(response => response?.accounts ?? []),
                finalize(() => this.loading.set(false))
            )
            .subscribe(accounts => this.accounts.set(accounts));
    }

    refresh(id: string) {
        this.http.get<AccountLookupResponse>(`${this.apiQueryUrl}/bankAccountLookup/byId/${id}`)
            .subscribe(response => {
                const account = response.accounts[0];

                if (!account) {
                    return;
                }

                this.accounts.update(accounts =>
                    accounts.map(a => a.id === id ? account : a)
                );
            });
    }

    add(id: string) {
        this.http.get<AccountLookupResponse>(`${this.apiQueryUrl}/bankAccountLookup/byId/${id}`)
            .subscribe(response => {
                const account = response.accounts[0];

                if (!account) {
                    return;
                }

                this.accounts.update(accounts => [
                    account,
                    ...accounts
                ]);
            });
    }

    remove(id: string) {
        this.accounts.update(accounts => accounts.filter(a => a.id !== id));
    }

    openAccount(request: OpenAccountRequest) {
        return this.http.post<OpenAccountResponse>(`${this.apiCmdUrl}/openBankAccount`, request);
    }

    depositFunds(id: string, amount: number) {
        return this.http.put<DepositFundsResponse>(`${this.apiCmdUrl}/depositFunds/${id}`, { amount });
    }

    withdrawFunds(id: string, amount: number) {
        return this.http.put<WithdrawFundsResponse>(`${this.apiCmdUrl}/withdrawFunds/${id}`, { amount });
    }

    closeAccount(id: string) {
        return this.http.delete<CloseAccountResponse>(`${this.apiCmdUrl}/closeBankAccount/${id}`);
    }

    findAccountById(id: string) {
        return this.http.get<AccountLookupResponse>(`${this.apiQueryUrl}/bankAccountLookup/byId/${id}`);
    }

    searchByHolder(holder: string): void {
        this.loading.set(true);

        this.http.get<AccountLookupResponse>(`${this.apiQueryUrl}/bankAccountLookup/byHolder/${holder}`)
            .pipe(
                map(response => response.accounts ?? []),
                finalize(() => this.loading.set(false))
            )
            .subscribe(accounts => this.accounts.set(accounts));
    }

    searchByBalance(equality: EqualityType, balance: number): void {
        this.loading.set(true);

        this.http.get<AccountLookupResponse>(`${this.apiQueryUrl}/bankAccountLookup/withBalance/${equality}/${balance}`)
            .pipe(
                map(response => response.accounts ?? []),
                finalize(() => this.loading.set(false))
            )
            .subscribe(accounts => this.accounts.set(accounts));
    }

    restoreReadDb() { // curl -X POST http://localhost:5010/api/v1/restoreReadDb
        return this.http.post(`${this.apiCmdUrl}/restoreReadDb`, {});
    }
}
