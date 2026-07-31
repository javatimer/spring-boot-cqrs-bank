import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { OpenAccount } from './open-account/open-account';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    {
        path: 'login',
        component: Login
    },
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [authGuard]
    },
    {
        path: 'open-account',
        component: OpenAccount
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];
