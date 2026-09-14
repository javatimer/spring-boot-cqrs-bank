# Frontend

```bash
ng new frontend \
  --routing \
  --style=scss \
  --zoneless \
  --ssr
```


This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.8.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


```TypeScript

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError, finalize } from 'rxjs';


/*Пришла ошибка

        │
        ▼

    Это 401?

        │
   ┌────┴────┐
   │         │
  нет       да
   │         │
   │         ▼
throw      Кто-то уже делает refresh?
               │
          ┌────┴────┐
          │         │
         нет       да
          │         │
     refresh()    ждать

*/


let isRefreshing = false;

const refreshTokenSubject = new BehaviorSubject<string | null>(null); //Очередь через BehaviorSubject. BehaviorSubject хранит последнее значение.

export const authInterceptor: HttpInterceptorFn = (req, next) => { //Только один refresh одновременно
    const auth = inject(AuthService);

    const token = auth.getAccessToken();

    const isTokenRequest = req.url.includes('/protocol/openid-connect/token');

    let request = req;

    if (token && !isTokenRequest) { // если токен есть и запрос не на refresh
        request = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    //Отправляем запрос
    return next(request).pipe( // Отправили запрос
        catchError(error => { // Если произошла ошибка
            if (error instanceof HttpErrorResponse && error.status === 401) { // значит токен просрочился.
                if (isTokenRequest) { // Защита от рекурсивного refresh
                    return throwError(() => error);
                }

                // здесь refresh

                if (!isRefreshing) {
                    isRefreshing = true;

                    // Сбрасываем последнее значение.
                    // Все новые запросы будут ждать, пока refreshTokenSubject не получит новый access token.
                    refreshTokenSubject.next(null);

                    return auth.refreshToken().pipe( // Обновили и...
                        switchMap(response => { // ...получили новый JWT
                            auth.saveTokens(response);

                            refreshTokenSubject.next(response.access_token);

                            const retry = request.clone({ // Повторяем запрос
                                setHeaders: {
                                    Authorization: `Bearer ${response.access_token}`
                                }
                            });

                            return next(retry);
                        }),
                        catchError(error => {
                            auth.logout();
                            return throwError(() => error);
                        }),
                        finalize(() => {
                            isRefreshing = false;
                        })
                    );
                }

                //Если refresh не удался. Сессия закончилась. Переходим на Login.
                return refreshTokenSubject.pipe( // Ждать Пока не появится токен
                    filter((token): token is string => token !== null),

                    take(1),

                    switchMap(token => {
                        const retry = request.clone({
                            setHeaders: {
                                Authorization: `Bearer ${token}`
                            }
                        });
                        return next(retry);
                    })
                );

            } // end 401

            return throwError(() => error); // Если ошибка не 401, то просто пробрасываем её дальше
        })
    );

};


```

## 🚀 Управление зависимостями и обновление проекта

> ⚠️ **Важно:** Никогда не обновляйте пакеты Angular (`@angular/core`, `@angular/cli`, `@angular/material`) через `npm update` или `ncu`. Это не запустит внутренние миграции кода и полностью сломает сборку проекта. Всегда используйте официальный Angular CLI.

### 1. Правильное обновление Angular (Рекомендуемый способ)

Перед началом убедитесь, что ваш Git-репозиторий «чистый» (все изменения закоммичены).

1. **Проверить доступные обновления Angular:**
   ```bash
   ng update
   ```
2. **Запустить автоматическое обновление экосистемы:**
   * *Если проект использует Angular Material:*
     ```bash
     ng update @angular/core @angular/cli @angular/material
     ```
   * *Если Angular Material НЕ используется:*
     ```bash
     ng update @angular/core @angular/cli
     ```

---

### 2. Обновление сторонних библиотек (RxJS, Lodash и др.)

Выполняйте эти шаги только **после** успешного обновления самого Angular.

1. **Проверить устаревшие сторонние зависимости:**
   ```bash
   npm outdated
   ```
2. **Обновить обычные пакеты (в рамках разрешенных версий):**
   ```bash
   npm update
   ```
3. **Принудительное обновление до самых свежих мажорных версий (опционально):**
   ```bash
   # Установка утилиты npm-check-updates глобально (если не установлена)
   npm install -g npm-check-updates
   
   # Интерактивное обновление package.json
   ncu -u
   ```

---

### 3. Решение проблем и «жесткая» перезагрузка (Troubleshooting)

Если после обновления версий возникли конфликты зависимостей, ошибки сборки или кэша, выполните полную переустановку пакетов:

1. **Удалить старые зависимости и lock-файл:**
   ```bash
   rm -rf node_modules package-lock.json
   ```
2. **Очистить кэш пакетного менеджера:**
   ```bash
   npm cache clean --force
   ```
3. **Чистая установка всех пакетов с нуля:**
   ```bash
   npm install
   ```

---

### 4. Запуск приложения

После успешного обновления убедитесь, что проект компилируется без ошибок:
```bash
npm start
# или
ng serve
```


### Или другой вариант


Check current dependencies
```bash
npm outdated
```

Update
```bash
npm update
```


Update remaining dependencies
```bash
npm install -g npm-check-updates
ncu
ncu -u
```


After updating package.json, remove package-lock.json and node_modules, then reinstall packages:
```bash
rm -rf node_modules package-lock.json
npm install
```


Clear the NPM cache
```bash
npm cache clean --force
```

Run the application and fix errors
```bash
npm start
```

https://medium.com/@angir777/how-to-update-an-angular-project-a-practical-guide-1546245c0d4d
