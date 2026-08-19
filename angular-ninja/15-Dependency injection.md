### Внедрение зависимостей (Dependency Injection)

#### 15.1. Что такое DI

Внедрение зависимостей (Dependency Injection, DI) — это известный паттерн проектирования.

Возьмем компонент нашего приложения. Ему могут потребоваться возможности, реализуемые в других частях приложения (например, в сервисе). Эти внешние сущности называются **зависимостями**.

Вместо того чтобы компонент сам создавал свои зависимости через `new`, фреймворк берет на себя создание их экземпляров и предоставляет их компоненту. Этот принцип известен как **инверсия управления** (*Inversion of Control*, IoC).

Этот подход дает ключевые преимущества:

* **Удобство разработки:** мы просто декларируем, что нам нужно и где;
* **Легкость тестирования:** зависимости легко заменить на моки (*mock-объекты*);
* **Гибкость конфигурации:** одну реализацию сервиса можно легко подменить другой.

Этот концепт крайне популярен в бэкенд-разработке, а на фронтенде в полную силу применяется именно в Angular.

---

#### 15.2. Удобство разработки

Чтобы использовать внедрение зависимостей, нам нужны два механизма:

1. Способ **зарегистрировать** зависимость, чтобы сделать её доступной для внедрения в компоненты, сервисы, пайпы или директивы.
2. Способ **указать**, какие именно зависимости должны быть внедрены в текущий компонент или сервис.

Когда компонент запрашивает зависимость, Angular обращается к реестру: находит существующий экземпляр или создает новый, после чего передает его в компонент.

Рассмотрим пример с сервисом логирования `LoggingService`. В режиме разработки мы хотим выводить логи в консоль браузера, а в продакшене — отправлять их на удаленный сервер.

Версия для разработки:

```typescript
export class LoggingService {
  log(message: string): void {
    console.log(message);
  }
}

```

Чтобы внедрить эту зависимость в другой класс, мы используем функцию `inject()` из `@angular/core`.

Создадим `RaceService`, который использует `LoggingService`:

```typescript
import { inject } from '@angular/core';
import { LoggingService } from './logging-service';

export class RaceService {
  private readonly loggingService = inject(LoggingService);
}

```

Функция `inject()` указывает Angular найти сервис `LoggingService` и вернуть его экземпляр.

> **Важно:** Функцию `inject()` нельзя вызывать где угодно. Она должна вызываться строго в **контексте внедрения** (*injection context*): при инициализации полей класса (как в примере выше) или внутри `constructor()`. Вызов `inject()` после создания объекта выбросит исключение.

До появления `inject()` в Angular 14 единственным способом было внедрение через аргументы конструктора (что поддерживается и сейчас):

```typescript
import { LoggingService } from './logging-service';

export class RaceService {
  constructor(private loggingService: LoggingService) {}
}

```

Сегодня подход с `inject()` является предпочтительным.

Все сервисы в Angular должны быть отмечены декоратором `@Injectable()`:

```typescript
import { inject, Injectable } from '@angular/core';
import { RaceModel } from './race.model';
import { LoggingService } from './logging-service';

@Injectable()
export class RaceService {
  private readonly loggingService = inject(LoggingService);

  list(): Array<RaceModel> {
    this.loggingService.log('race-service: get races');
    // ...
    return [];
  }
}

```

##### Регистрация сервисов:

Чтобы сервис стал доступен для внедрения, его нужно зарегистрировать. Самый простой и рекомендуемый способ — указать свойство `providedIn: 'root'` прямо в декораторе `@Injectable()`:

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  log(message: string): void {
    console.log(message);
  }
}

```

Другой способ — передать сервис в массив `providers` функции `bootstrapApplication()`:

```typescript
bootstrapApplication(App, { providers: [LoggingService] })
  .catch(err => console.error(err));

```

Зарегистрировав `RaceService` с помощью `providedIn: 'root'`, мы можем использовать его в любом компоненте:

```typescript
export class App {
  private readonly raceService = inject(RaceService);
  protected readonly races: Array<RaceModel> = this.raceService.list();
}

```

---

#### 15.3. Удобство конфигурирования

Внедрение зависимостей позволяет подменять реализации сервисов. Запись:

```typescript
bootstrapApplication(App, { providers: [LoggingService] });

```

На самом деле является сокращенной формой следующего кода:

```typescript
bootstrapApplication(App, {
  providers: [{ provide: LoggingService, useClass: LoggingService }]
});

```

Мы сообщаем **инжектору** (*Injector*), что связываем **токен** (`LoggingService`) с классом-реализацией (`LoggingService`). Инжектор хранит карту (*Map*), где ключами выступают токены, а значениями — соответствущие классы или значения.

Токен может быть ссылкой на класс или экземпляром `InjectionToken`.

Проверим работу инжектора:

```typescript
const token = new InjectionToken<LoggingService>('LoggingServiceToken');

providers: [
  { provide: LoggingService, useClass: LoggingService },
  { provide: token, useClass: LoggingService }
]

console.log(inject(LoggingService)); // Вернет экземпляр LoggingService
console.log(inject(token));          // Тоже вернет экземпляр LoggingService

console.log(inject(LoggingService) === inject(LoggingService)); // true (один и тот же синглтон)
console.log(inject(LoggingService) === inject(token));          // false (два разных экземпляра для разных токенов)

```

**Выводы:**

1. Провайдер связывает токен с реализацией.
2. Инжектор возвращает **один и тот же экземпляр** (синглтон) при каждом запросе по одному и тому же токену.
3. Токен не обязан совпадать с самим классом сервиса.

Теперь создадим отдельный класс для отправки логов на сервер в продакшене:

```typescript
@Injectable()
export class LoggingAPIService {
  log(message: string): void {
    // Вызов удаленного API для сохранения логов
  }
}

```

Мы можем легко подменить реализацию в `providers`:

```typescript
providers: [
  { provide: LoggingService, useClass: LoggingAPIService }
]

```

Теперь везде, где запрашивается токен `LoggingService`, Angular автоматически внедрит экземпляр `LoggingAPIService`.

---

#### 15.4. Другие типы провайдеров (`useFactory`, `useValue`)

##### Использование `useFactory`

Если выбор реализации зависит от условия во время выполнения, можно использовать фабрику:

```typescript
const IS_PROD = false;

providers: [
  RaceService,
  {
    provide: LoggingService,
    useFactory: () => (IS_PROD ? new LoggingAPIService() : new LoggingService())
  }
]

```

Или в более лаконичной форме с `useClass`:

```typescript
providers: [
  RaceService,
  { provide: LoggingService, useClass: IS_PROD ? LoggingAPIService : LoggingService }
]

```

##### Использование `useValue`

Передать статическое значение в инжектор можно с помощью `useValue` и `InjectionToken`:

```typescript
export const IS_PROD = new InjectionToken<boolean>('IsProd');

providers: [
  { provide: IS_PROD, useValue: true },
  RaceService,
  {
    provide: LoggingService,
    useFactory: () => {
      const isProd = inject(IS_PROD);
      return isProd ? new LoggingAPIService() : new LoggingService();
    }
  }
]

```

---

#### 15.5. Иерархические инжекторы (Hierarchical injectors)

В Angular существует **иерархия инжекторов**. В приложении есть корневой инжектор (*root injector*), а также отдельный инжектор у каждого компонента, который наследует провайдеры от своего родителя.

Когда сервис регистрируется через `providedIn: 'root'`, он добавляется в корневой инжектор приложения.

При вызове `inject()` Angular ищет зависимость по следующему алгоритму:

1. Проверяет инжектор текущего компонента.
2. Если зависимость не найдена, поднимается к родительскому инжектору.
3. Поиск продолжается вверх по дереву до корневого инжектора.
4. Если зависимость не найдена нигде — выбрасывается ошибка.

Компоненты могут объявлять собственные локальные провайдеры через свойство `providers` в декораторе `@Component`:

```typescript
@Component({
  selector: 'ns-races',
  providers: [{ provide: LoggingService, useClass: LoggingAPIService }],
  template: `<strong>Races</strong>`
})
export class Races {
  constructor() {
    inject(LoggingService).log('Races created');
  }
}

```

> **Важно:** Если сервис объявлен и в `providedIn: 'root'`, и в массиве `providers` конкретного компонента, будут созданы **два независимых экземпляра** этого сервиса!
> * **`providedIn: 'root'`** используется для сервисов без состояния (*stateless*) или с глобальным состоянием приложения.
> * **`providers` компонента** используется, если состояние сервиса должно быть изолировано и привязано исключительно к жизненному циклу данного компонента.
> 
> 

---

#### 15.6. Внедрение зависимостей без типов (Токены)

Если нам нужно внедрить простое значение (строку, конфигурационный объект и т.д.), у которого нет TS-класса, мы создаем `InjectionToken`.

Для внедрения токенов можно использовать функцию `inject(TOKEN)` или декоратор `@Inject(TOKEN)` в конструкторе:

```typescript
import { Inject, Injectable } from '@angular/core';
import { BACKEND_URL } from './tokens';

@Injectable({
  providedIn: 'root'
})
export class RaceService {
  constructor(@Inject(BACKEND_URL) private url: string) {}
}

```

Объявление токена:

```typescript
import { InjectionToken } from '@angular/core';

export const BACKEND_URL = new InjectionToken<string>('API URL');

```

Регистрация значения токена:

```typescript
{ provide: BACKEND_URL, useValue: 'http://localhost:8080' }

```

Также токен можно объявить сразу с дефолтной фабрикой:

```typescript
export const BACKEND_URL_PROVIDED = new InjectionToken<string>('API URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:8080'
});

```

Пример встроенного токена Angular — `LOCALE_ID`:

```typescript
bootstrapApplication(App, {
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-FR' }
  ]
});

@Component({
  selector: 'ns-locale',
  template: `
    <p>The locale is {{ locale }}</p>
    <p>{{ 1234.56 | number }}</p> <!-- выведет '1 234,56' -->
  `,
  imports: [DecimalPipe]
})
export class CustomLocale {
  protected readonly locale = inject(LOCALE_ID);
}

```

---

#### 15.7. Встроенные сервисы фреймворка

Angular предоставляет ряд готовых сервисов «из коробки».

##### 15.7.1. Сервис `Title`

Позволяет динамически изменять заголовок браузерной вкладки (`<title>`):

```typescript
import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'ns-root',
  template: `<h1>PonyRacer</h1>`
})
export class App {
  constructor() {
    inject(Title).setTitle('PonyRacer - Bet on ponies');
  }
}

```

##### 15.7.2. Сервис `Meta`

Предназначен для управления метатегами внутри элемента `<head>`:

```typescript
import { Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'ns-root',
  template: `<h1>PonyRacer</h1>`
})
export class App {
  constructor() {
    inject(Meta).addTag({ name: 'author', content: 'Ninja Squad' });
  }
}

```