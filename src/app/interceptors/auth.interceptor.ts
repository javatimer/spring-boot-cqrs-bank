import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);

    const request = auth.prepareRequest(req);

    const isTokenRequest = req.url.includes('/protocol/openid-connect/token');

    return next(request).pipe(
        catchError(error => {
            if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
                return throwError(() => error);
            }

            if (isTokenRequest) {
                //auth.logout();
                return throwError(() => error);
            }

            return auth.handle401(request, next).pipe(
                catchError(error => {
                    auth.logout();
                    return throwError(() => error);
                })
            );
        })
    );

};
