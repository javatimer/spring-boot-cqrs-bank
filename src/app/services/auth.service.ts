import { computed, inject, signal } from '@angular/core';
import { HttpClient, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Service } from '@angular/core';

import { environment } from '../../environments/environment';
import { TokenResponse } from '../models/token-response';
import { BehaviorSubject, filter, Observable, switchMap, take, throwError, finalize, catchError, tap } from 'rxjs';
import { JwtPayload } from '../models/JwtPayload';
import { AuthState } from '../models/auth-state';

@Service()
export class AuthService {
    private static readonly TOKEN_ENDPOINT = '/protocol/openid-connect/token';
    private isRefreshing = false;
    private refreshTokenSubject = new BehaviorSubject<string | null>(null);
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);

    private refreshTimer?: ReturnType<typeof setTimeout>;

    private readonly state = signal<AuthState>({
        accessToken: localStorage.getItem('access_token'),
        refreshToken: localStorage.getItem('refresh_token'),
        payload: localStorage.getItem('access_token') ? this.decode(localStorage.getItem('access_token')!) : null
    });

    readonly username = computed(() => this.state().payload?.preferred_username);

    readonly roles = computed(() => this.state().payload?.realm_access?.roles ?? []);

    readonly expiration = computed(() => {
        const exp = this.state().payload?.exp;
        return exp ? new Date(exp * 1000) : null;
    });

    readonly isLoggedIn = computed(() => this.state().accessToken !== null);

    readonly isAdmin = computed(() => this.roles().includes('ADMIN'));

    constructor() {
        if (this.isLoggedIn()) {
            this.scheduleRefresh();
        }
    }

    private addAuthorizationHeader(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
        return request.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    private waitForRefreshAndRetry(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
        return this.refreshTokenSubject.pipe(
            filter((token): token is string => token !== null),

            take(1),

            switchMap(token => next(this.addAuthorizationHeader(request, token)))
        );
    }

    prepareRequest(request: HttpRequest<unknown>): HttpRequest<unknown> {
        const token = this.getAccessToken();

        const isTokenRequest = this.isTokenEndpoint(request.url);

        if (!token || isTokenRequest) {
            return request;
        }

        return this.addAuthorizationHeader(request, token);
    }

    handle401(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
        if (this.isRefreshing) {
            return this.waitForRefreshAndRetry(request, next);
        }

        this.isRefreshing = true;

        this.refreshTokenSubject.next(null);

        return this.refreshToken()
            .pipe(
                switchMap(() => {
                    const token = this.getAccessToken()!;
                    this.refreshTokenSubject.next(token);
                    return next(this.addAuthorizationHeader(request, token));
                }),
                catchError(error => {
                    this.logout();
                    return throwError(() => error);
                }),
                finalize(() => this.isRefreshing = false)
            );
    }

    currentUser() {
        // TODO
        //return this.http.get<User>(environment.apiUrl + '/me');
    }

    login(username: string, password: string): Observable<TokenResponse> {
        const body = new URLSearchParams();

        body.set('grant_type', 'password');
        body.set('client_id', 'account-service');
        body.set('username', username);
        body.set('password', password);

        return this.http.post<TokenResponse>(environment.keycloakUrl, body.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        )
            .pipe(
                tap(response => this.saveTokens(response))
            );
    }

    logout(): void {
        if (!this.isLoggedIn()) {
            return;
        }

        clearTimeout(this.refreshTimer);

        this.isRefreshing = false;
        this.refreshTokenSubject.next(null);

        this.clearTokens();

        this.router.navigate(['/login']);
    }

    getAccessToken(): string | null {
        return this.state().accessToken;
    }

    getRefreshToken(): string | null {
        return this.state().refreshToken;
    }

    private saveTokens(response: TokenResponse): void {
        const payload = this.decode(response.access_token);

        this.state.set({
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            payload
        });

        localStorage.setItem("access_token", response.access_token);
        localStorage.setItem("refresh_token", response.refresh_token);

        this.scheduleRefresh();
    }

    refreshToken(): Observable<TokenResponse> {
        const refreshToken = this.getRefreshToken();

        if (!refreshToken) {
            return throwError(() => new Error('Refresh token is missing'));
        }

        const body = new URLSearchParams();
        body.set('grant_type', 'refresh_token');
        body.set('client_id', 'account-service');
        body.set('refresh_token', refreshToken);

        return this.http.post<TokenResponse>(environment.keycloakUrl, body.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        )
            .pipe(
                tap(response => this.saveTokens(response))
            );
    }

    isTokenEndpoint(url: string): boolean {
        return url.includes(AuthService.TOKEN_ENDPOINT);
    }

    private clearTokens() {
        this.state.set({
            accessToken: null,
            refreshToken: null,
            payload: null
        });

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
    }

    private decode(token: string): JwtPayload | null {
        try {
            const payload = token.split('.')[1]
                .replace(/-/g, '+')
                .replace(/_/g, '/');

            return JSON.parse(atob(payload));
        } catch {
            return null;
        }
    }

    private scheduleRefresh() {
        clearTimeout(this.refreshTimer);

        const exp = this.state().payload?.exp;

        if (!exp) {
            return;
        }

        const delay = exp * 1000 - Date.now() - 60_000; // Refresh 1 minute before expiration

        const refresh = () =>
            this.refreshToken().subscribe({
                error: () => this.logout()
            });

        if (delay <= 0) {
            refresh();
            return;
        }

        this.refreshTimer = setTimeout(refresh, delay);
    }
}
