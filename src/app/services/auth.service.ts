import { computed, inject, signal } from '@angular/core';
import { HttpClient, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Service } from '@angular/core';

import { environment } from '../../environments/environment';
import { TokenResponse } from '../models/token-response';
import { BehaviorSubject, filter, Observable, switchMap, take, throwError, finalize, catchError } from 'rxjs';
import { JwtPayload } from '../models/JwtPayload';

@Service()
export class AuthService {
    private isRefreshing = false;
    private refreshTokenSubject = new BehaviorSubject<string | null>(null);
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly token = signal<string | null>(localStorage.getItem('access_token'));

    readonly username = computed(() => this.getUsername());
    readonly roles = computed(() => this.getRoles());
    readonly expiration = computed(() => this.getExpiration());

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

        const isTokenRequest = request.url.includes('/protocol/openid-connect/token');

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

        return this.refreshToken().pipe(
            switchMap(response => {
                this.saveTokens(response);
                this.refreshTokenSubject.next(response.access_token);
                return next(this.addAuthorizationHeader(request, response.access_token));
            }),
            catchError(error => {
                //this.logout();
                this.clearTokens();
                return throwError(() => error);
            }),
            finalize(() => this.isRefreshing = false)
        );
    }

    getUsername() {
        const payload = this.decodeToken();

        return payload?.preferred_username;
    }

    getRoles() {
        const payload = this.decodeToken();

        return payload?.realm_access?.roles ?? [];
    }

    currentUser() {
        // TODO
        //return this.http.get<User>(environment.apiUrl + '/me');
    }

    getExpiration(): Date | null {
        const payload = this.decodeToken();

        if (!payload) {
            return null;
        }

        return new Date(payload.exp * 1000);
    }

    login(username: string, password: string) {
        const body = new URLSearchParams();

        body.set('grant_type', 'password');
        body.set('client_id', 'account-service');
        body.set('username', username);
        body.set('password', password);

        return this.http.post<TokenResponse>(
            environment.keycloakUrl,
            body.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
    }

    logout(): void {
        this.clearTokens();
        this.router.navigate(['/login']);
    }

    isLoggedIn(): boolean {
        const expiration = this.getExpiration();

        return expiration !== null && expiration > new Date();
    }

    getAccessToken(): string | null {
        return localStorage.getItem('access_token');
    }

    getRefreshToken(): string | null {
        return localStorage.getItem('refresh_token');
    }

    saveTokens(response: TokenResponse) {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);

        this.token.set(response.access_token);
    }

    refreshToken() {
        const refreshToken = this.getRefreshToken();

        if (!refreshToken) {
            //this.logout();
            return throwError(() => new Error('Refresh token is missing'));
        }

        const body = new URLSearchParams();
        body.set('grant_type', 'refresh_token');
        body.set('client_id', 'account-service');
        body.set('refresh_token', refreshToken);

        return this.http.post<TokenResponse>(
            environment.keycloakUrl,
            body.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
    }

    private clearTokens(): void {
        this.token.set(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }

    private decodeToken(): JwtPayload | null {
        const token = this.getAccessToken();

        if (!token) {
            return null;
        }

        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload)) as JwtPayload;
        } catch {
            return null;
        }
    }
}
