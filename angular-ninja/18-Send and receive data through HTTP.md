### Отправка и получение данных через HTTP

Никого не удивит, что большая часть нашей работы заключается в том, чтобы запрашивать у бэкенд-сервера данные для нашего веб-приложения, а затем отправлять данные обратно.
Обычно это делается по протоколу HTTP, хотя сегодня у вас есть и другие альтернативы, например, WebSockets.
Angular предоставляет HTTP-модуль, но не принуждает вас к его использованию. При желании вы можете использовать вашу любимую библиотеку для отправки HTTP-запросов.

Одной из возможностей является `fetch API` — стандартный API, предоставляемый браузерами. Вы можете отлично построить свое приложение, используя `fetch` или другую библиотеку. На самом деле, именно это и использовалось до того, как в Angular была готова часть, отвечающая за HTTP. Это работает отлично, без необходимости специальных вызовов, чтобы уведомить фреймворк о получении данных и необходимости запуска обнаружения изменений (change detection) (в отличие от AngularJS 1.x, где при использовании сторонней библиотеки вам приходилось вызывать `$scope.apply()` — в этом и заключается магия Angular и его зон (`zones`)!).

Но большинство разработчиков Angular скорее предпочтут сервис, поставляемый вместе с Angular: `HttpClient`. Если вы хотите использовать его, вам нужно взять классы и функции из пакета `@angular/common/http`.
Почему стоит предпочесть этот сервис, скажем, `fetch`? Ответ прост: тестирование.
Как мы покажем далее, HTTP-клиент позволяет вам создавать моки бэкенд-сервера и возвращать фейковые ответы. Это действительно очень полезно.
И последнее перед тем, как мы погрузимся в API: HTTP-клиент активно использует парадигму реактивного программирования. Так что если вы пропустили главу «Реактивное программирование», возможно, сейчас самое время вернуться и прочитать ее ;).

#### 18.1. Получение данных (HttpClient)

Пакет `@angular/common/http` предоставляет сервис под названием `HttpClient`, который вы можете внедрить (inject).

```typescript
@Injectable({
  providedIn: 'root'
})
export class RaceService {
  private readonly http = inject(HttpClient);
}

```

До Angular v21 было необходимо добавлять провайдер `provideHttpClient()` в конфигурацию приложения. Начиная с v21, `HttpClient` предоставляется по умолчанию. `provideHttpClient()` нужен только в том случае, если вы хотите настроить конфигурацию HTTP-клиента, как мы увидим позже.

По умолчанию сервис `HttpClient` выполняет AJAX-запросы с использованием `XMLHttpRequest`.
Он предлагает несколько методов, соответствующих наиболее распространенным HTTP-глаголам:

* `get`
* `post`
* `put`
* `delete`
* `patch`
* `head`
* `jsonp`

Если вы использовали сервис `$http` в AngularJS 1.x, вы можете помнить, что он сильно полагался на промисы (Promises). В Angular, однако, все эти методы возвращают объект `Observable`. Использование Observables в `HttpClient` дает ряд преимуществ, таких как возможность отменять запросы, выполнять повторные попытки, легко комбинировать их и т. д.

Давайте начнем с получения списка гонок, доступных в PonyRacer. Мы будем предполагать, что бэкенд уже запущен и предоставляет RESTful API. Для получения гонок мы отправим GET-запрос по URL вида `'[http://backend.url/api/races](http://backend.url/api/races)'`.
Обычно базовый URL ваших HTTP-вызовов будет храниться в переменной или сервисе, который вы легко можете настроить в зависимости от окружения. Или, если REST API обслуживается тем же сервером, что и Angular-приложение, вы можете просто использовать относительный URL: `'/api/races'`.

При использовании сервиса `HttpClient` такой запрос выглядит максимально просто:

```typescript
http
  .get<Array<RaceModel>>(`${baseUrl}/api/races`)

```

Обратите внимание, что вам не нужно десериализовать тело ответа из строки в JavaScript-массив или объект. Это автоматически делает Angular.
Однако Angular не будет выполнять никаких проверок на соответствие полученного JSON указанному вами дженерик-типу. Вы сами должны убедиться, что используете правильный дженерик-тип и что интерфейс `RaceModel` действительно соответствует JSON, который присылает сервер.

Этот метод возвращает `Observable`, на который вы можете подписаться для получения ответа.
Тело ответа является самой интересной частью, и оно напрямую эмитится Observable:

```typescript
http.get<Array<RaceModel>>(`${baseUrl}/api/races`).subscribe((response: Array<RaceModel>) => {
  console.log(response);
  // выводит массив гонок
});

```

Самый типичный сценарий использования — это сервис с методами, возвращающими observable:

```typescript
@Injectable({
  providedIn: 'root'
})
export class RaceService {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<Array<RaceModel>>(`${baseUrl}/api/races`);
  }
}

```

А затем подписка на этот observable в компоненте с использованием `toSignal`:

```typescript
protected readonly races = toSignal(inject(RaceService).list());

```

Разумеется, вы также можете получить доступ к полному HTTP-ответу. Возвращаемый объект в этом случае представляет собой `HttpResponse` с несколькими полями, такими как код статуса, заголовки и т. д.

```typescript
http
  .get<Array<RaceModel>>(`${baseUrl}/api/races`, { observe: 'response' })
  .subscribe((response: HttpResponse<Array<RaceModel>>) => {
    console.log(response.status); // выводит 200
    console.log(response.headers.keys()); // выводит []
  });

```

Observable выбросит ошибку, если статус ответа отличается от 2xx или 3xx, и в этом случае ошибка будет иметь тип `HttpErrorResponse`.

Отправка данных выполняется так же легко. Просто вызовите метод `post()` или `put()`, передав URL и отправляемый объект:

```typescript
http
  .post<RaceModel>(`${baseUrl}/api/races`, newRace)

```

И снова нет необходимости сериализовать отправляемый объект `race` в JSON — Angular сделает это за вас.
Дженерик-тип `RaceModel` здесь, как и в случае с методом `get()`, представляет собой тип тела ответа. Таким образом, этот пример эндпоинта принимает `RaceModel` на вход и возвращает созданный `RaceModel`.
Я не буду показывать другие методы — уверен, идея вам понятна.

#### 18.2. Трансформация данных

Подобная работа обычно выполняется в выделенном сервисе. Я предпочитаю создавать сервис, такой как `RaceService`, где выполняются все задачи. Затем моему компоненту нужно лишь подписаться на метод сервиса, не задумываясь о том, что происходит под капотом.

```typescript
@Injectable({
  providedIn: 'root'
})
export class RaceService {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<Array<RaceModel>>(`${baseUrl}/api/races`);
  }
}

```

Вы также можете использовать всю мощь RxJS, например, чтобы повторить неудавшийся запрос несколько раз:

```typescript
raceService
  .list()
  .pipe(
    // если запрос завершился ошибкой, повторяем 3 раза
    retry(3)
  )

```

#### 18.3. Расширенные параметры

Разумеется, вы можете более тонко настраивать свои запросы. Каждый метод принимает объект параметров (options) в качестве необязательного аргумента, где вы можете сконфигурировать запрос. Несколько опций действительно полезны, и вы можете переопределить всё что угодно в запросе.

`params` представляет собой параметры поиска в URL (также известные как query string), добавляемые к URL:

```typescript
const params = {
  sort: 'ascending',
  page: '1'
};

http
  .get<Array<RaceModel>>(`${baseUrl}/api/races`, { params })
  // вызовет URL ${baseUrl}/api/races?sort=ascending&page=1
  .subscribe(response => {
    // вернет отсортированные гонки
    this.races = response;
  });

```

Опция `headers` часто полезна для добавления пользовательских заголовков к вашему запросу. Это бывает необходимо для некоторых методов аутентификации, таких как JSON Web Token:

```typescript
const headers = { Authorization: `Bearer ${token}` };

http.get<Array<RaceModel>>(`${baseUrl}/api/races`, { headers }).subscribe(response => {
  // вернет гонки, видимые для аутентифицированного пользователя
  this.races = response;
});

```

#### 18.4. Интерцепторы (Interceptors)

Интерцепторы (перехватчики) интересны, когда вы хотите… перехватывать запросы или ответы в вашем приложении. Напримери, если вы хотите перехватывать каждый запрос, чтобы добавить определенный заголовок к некоторым из них, вы можете написать интерцептор следующим образом:

```typescript
export const githubAPIInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  // если это запрос к Github API
  if (req.url.includes('api.github.com')) {
    // нам нужно добавить OAUTH токен в заголовок для доступа к Github API
    const clone = req.clone({ setHeaders: { Authorization: `token ${OAUTH_TOKEN}` } });
    return next(clone);
  }
  // если это не запрос к Github API, мы просто передаем его следующему обработчику
  return next(req);
};

```

Обратите внимание, что вам необходимо клонировать запрос для его обновления (запросы неизменяемы / immutable).
Затем настройте провайдер HTTP-клиента с помощью `provideHttpClient()`, чтобы он использовал интерцептор:

```typescript
providers: [
  provideHttpClient(withInterceptors([githubAPIInterceptor])),
]

```

Теперь каждый запрос будет проходить через интерцептор и при необходимости получать кастомный заголовок (в данном случае запросы к Github API).

Вы также можете перехватывать ответ, что может быть удобно для обработки ошибок в общем виде:

```typescript
export const errorHandlerInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const errorHandler = inject(ErrorHandler);
  return next(req).pipe(
    // перехватываем ошибку
    tap({
      error: (errorResponse: HttpErrorResponse) => {
        // если статус 401 Unauthorized
        if (errorResponse.status === HttpStatusCode.Unauthorized) {
          // перенаправляем на страницу входа
          router.navigateByUrl('/login');
        } else {
          // иначе уведомляем пользователя
          errorHandler.handle(errorResponse);
        }
      }
    })
  );
};

```

Это один из случаев, когда необходимо использовать функцию `inject()`: поскольку интерцептор определен как функция, у него нет конструктора для внедрения зависимостей, но функция `inject()` позволяет их получить.

#### 18.5. Контекст (Context)

Иногда вам нужно передать контекст в интерцептор. Начиная с Angular v12, это возможно благодаря `HttpContext`.
Контекст использует типизированный токен (`HttpContextToken`), поэтому вы можете определить что-то вроде этого в вашем интерцепторе:

```typescript
export const SHOULD_NOT_HANDLE_ERROR = new HttpContextToken<boolean>(() => false);

```

И изменить интерцептор на:

```typescript
export const errorHandlerInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const errorHandler = inject(ErrorHandler);
  // если в контексте есть явное указание не обрабатывать ошибку, мы её не обрабатываем
  if (req.context.get(SHOULD_NOT_HANDLE_ERROR)) {
    return next(req);
  }
  return next(req).pipe(
    // ...

```

Все HTTP-методы принимают опцию `context`, которая представляет собой Map, создаваемый с помощью ранее определенного токена:

```typescript
const context = new HttpContext().set(SHOULD_NOT_HANDLE_ERROR, true);
return http.get(`${baseUrl}/api/users`, { context });

```

#### 18.6. Тесты

Теперь у нас есть сервис, вызывающий HTTP-эндпоинт для получения гонок. Как его протестировать?

```typescript
@Injectable({
  providedIn: 'root'
})
export class RaceService {
  private readonly http = inject(HttpClient);

  list(): Observable<Array<RaceModel>> {
    return this.http.get<Array<RaceModel>>('/api/races');
  }
}

```

В юнит-тесте вы не хотите делать реальные вызовы к HTTP-серверу: это не то, что мы тестируем.
Мы хотим «подменить» (fake) HTTP-вызов, чтобы он возвращал моковые данные.
Для этого мы можем задействовать функцию `provideHttpClientTesting()` и класс `HttpTestingController` для симуляции HTTP-ответов.
Также вы можете добавить несколько проверок к самому HTTP-запросу:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';

describe('RaceService', () => {
  let raceService: RaceService;
  let http: HttpTestingController;

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClientTesting()]
    })
  );

  beforeEach(() => {
    raceService = TestBed.inject(RaceService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should return an Observable of 2 races', () => {
    // поддельный ответ
    const hardcodedRaces = [{ name: 'London' }, { name: 'Lyon' }];

    // вызов сервиса
    let actualRaces: Array<RaceModel> = [];
    raceService.list().subscribe(races => (actualRaces = races));

    // проверка правильности базового HTTP-запроса
    http
      .expectOne('/api/races')
      // возвращаем моковый ответ при получении запроса
      .flush(hardcodedRaces);

    // проверка правильности десериализации полученного массива
    expect(actualRaces.length).toBe(2);
  });
});

```

И готово!

Попробуйте наше упражнение **HTTP** и **викторину**! Мы подготовили полноценный REST API, готовый к использованию.
Давайте получим несколько гонок с помощью сервиса `HttpClient`. Позже вы узнаете, как вызывать защищенный API с механизмом аутентификации и интерцепторами в упражнениях **HTTP с аутентификацией** и **Bet on a pony**.
Также косвенно с этим связана тема **WebSockets**, к которой мы вернемся далее.