import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);

    const request = auth.prepareRequest(req);

    const isTokenRequest = auth.isTokenEndpoint(request.url);

    return next(request).pipe(
        catchError(error => {
            if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
                return throwError(() => error);
            }

            if (isTokenRequest) {
                return throwError(() => error);
            }

            return auth.handle401(request, next);
        })
    );

};
