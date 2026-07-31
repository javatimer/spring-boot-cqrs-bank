import { Service, signal } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { OpenAccountRequest } from '../models/open-account-request';
import { AccountLookupResponse } from '../models/account-lookup-response';
import { map, finalize } from 'rxjs';
import { OpenAccountResponse } from '../models/open-account-response';
import { BankAccount } from '../models/bank-account';

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
                map(response => response.accounts),
                finalize(() => this.loading.set(false))
            )
            .subscribe(accounts => this.accounts.set(accounts));
    }

    openAccount(request: OpenAccountRequest) {
        return this.http.post<OpenAccountResponse>(`${this.apiCmdUrl}/openBankAccount`, request);
    }

    depositFunds() {

    }

    withdrawFunds() {

    }

    closeAccount() {

    }

    deposit() { }

    withdraw() { 
        
    }

    findById() { 

    }

    findByHolder() {

    }
}
