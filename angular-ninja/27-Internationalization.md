## Глава 27. Интернационализация (Internationalization)

Alors comme ça, tu veux internationaliser ton application?
Итак, ты хочешь интернационализировать свое приложение?
Не волнуйтесь, если вы ничего не поняли из этого вступления на французском. Ваша роль как разработчика, к счастью, заключается не в том, чтобы переводить приложение на французский, испанский или любой другой язык. Однако в ваших силах сделать так, чтобы это стало возможным. В этой главе объясняется, как этого достичь.

---

### 27.1. Локаль (The locale)

Мы уже упоминали интернационализацию ранее, в главе о пайпах (pipes). Четыре встроенных пайпа Angular работают с интернационализацией: `number`, `percent`, `currency` и `date`.

До версии Angular 5 они полагались на стандартный `JavaScript Internationalization API`, предоставляемый браузером. Но поскольку поддержка в браузерах была неполной, а также возникали многочисленные баги и нестыковки, начиная с версии 5.0 пайпы были полностью переработаны.

Как эти пайпы определяют формат чисел и дат (использовать точку или запятую для разделителя; «January» или «Janvier» для первого месяца года)? Можно подумать, что это зависит от языка браузера, но это не так. Форматирование зависит от внедряемого значения `LOCALE_ID`. По умолчанию значение `LOCALE_ID` равно `'en-US'`.

Пример получения значения `LOCALE_ID`:

```typescript
@Component({
  selector: 'ns-locale',
  template: `
    <p>The locale is {{ locale }}</p>
    <!-- отобразит 'en-US' -->

    <p>{{ 1234.56 | number }}</p>
    <!-- отобразит '1,234.56' -->
  `,
  imports: [DecimalPipe]
})
class DefaultLocale {
  protected readonly locale = inject(LOCALE_ID);
}

```

Чтобы внедрить `LOCALE_ID` в компоненты или сервисы, используется `inject(LOCALE_ID)` (или `@Inject(LOCALE_ID)` при внедрении через конструктор), так как это токен, а не отдельный тип данных.

Значение `LOCALE_ID` является константой и не может быть изменено после запуска приложения. Однако его можно задать до старта приложения, передав другое значение для токена `LOCALE_ID` в провайдерах.

**Обратите внимание:** изменения токена недостаточно. Дополнительно требуется импортировать данные конкретной локали (названия месяцев, правила форматирования чисел и т. д.), так как по умолчанию Angular бандлит только данные для `en-US`:

```typescript
import '@angular/common/locales/global/fr';

```

Пример изменения локали в `bootstrapApplication`:

```typescript
bootstrapApplication(App, {
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-FR' }
  ]
}).catch(err => console.error(err));

@Component({
  selector: 'ns-locale',
  template: `
    <p>The locale is {{ locale }}</p>
    <!-- отобразит 'fr-FR' -->

    <p>{{ 1234.56 | number }}</p>
    <!-- отобразит '1 234,56' -->
  `,
  imports: [DecimalPipe]
})
export class CustomLocale {
  protected readonly locale = inject(LOCALE_ID);
}

```

Все пайпы, поддерживающие интернационализацию, принимают локаль в качестве последнего параметра, что позволяет переопределять ее динамически:

```typescript
@Component({
  selector: 'ns-locale',
  template: `
    <p>The locale is {{ locale }}</p>
    <!-- отобразит 'en-US' -->

    <p>{{ 1234.56 | number: '1.0-3' : 'fr-FR' }}</p>
    <!-- отобразит '1 234,56' -->
  `,
  imports: [DecimalPipe]
})
class DefaultLocaleOverridden {
  protected readonly locale = inject(LOCALE_ID);
}

```

---

### 27.2. Валюта по умолчанию (Default currency)

Пайп `currency` позволяет указывать код валюты (например, `USD`, `EUR`). Если значение не передано, по умолчанию используется `USD`.

Если приложение использует только одну валюту (например, `EUR`), передавать ее каждый раз неудобно. В Angular 9 появился токен `DEFAULT_CURRENCY_CODE` для глобальной настройки валюты по умолчанию:

```typescript
bootstrapApplication(App, {
  providers: [
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' },
    { provide: LOCALE_ID, useValue: 'fr-FR' }
  ]
}).catch(err => console.error(err));

```

Использование в компоненте без явного указания валюты в шаблоне:

```typescript
@Component({
  selector: 'ns-currency',
  template: `
    <p>The currency is {{ currency }}</p>
    <!-- отобразит 'EUR' -->

    <p>{{ 1234.56 | currency }}</p>
    <!-- отобразит '1 234,56 €' -->
  `,
  imports: [CurrencyPipe]
})
class DefaultCurrencyOverridden {
  protected readonly currency = inject(DEFAULT_CURRENCY_CODE);
}

```

---

### 27.3. Перевод текста (Translating text)

В отличие от подходов в стиле `angular-translate` (из AngularJS 1.x), где перевод ключей выполняется динамически во время выполнения (runtime), встроенная интернационализация Angular (переработанная в версии 9.0) работает на **этапе компиляции (compile-time)**.

При таком подходе создается отдельная сборка приложения для каждой поддерживаемой локали. Компилятор Angular анализирует HTML-шаблоны и заменяет размеченные фрагменты готовым переведенным текстом.

**Особенности подхода compile-time:**

* Нельзя сменить язык без перезагрузки приложения в браузере.
* Приложение работает быстрее в runtime, так как отсутствуют динамические вычисления переводов.
* При использовании AOT-компиляции необходимо собирать и деплоить столько версий приложения, сколько локалей поддерживается.

Пакет `@angular/localize` подключается через команду Angular CLI:

```bash
ng add @angular/localize

```

Он добавляет глобальную функцию `$localize`, которая используется внутри Angular для локализации и может вызывать переводы напрямую из TypeScript-кода.

---

### 27.4. Процесс и инструментарий (Process and tooling)

#### 27.4.1. Разметка текста с помощью i18n и извлечение

Рассмотрим пример шаблона:

```html
<h1>Welcome to Ponyracer</h1>
<p>Welcome to Ponyracer {{ user().firstName }} {{ user().lastName }}!</p>
<img src="/img/pony.gif" alt="running pony" title="Ponies are cool, aren't they?" />
Let's start playing.

```

Чтобы раздать текст на перевод, его помечают атрибутом `i18n`:

1. **Простой статический текст:**
```html
<h1 i18n>Welcome to Ponyracer</h1>

```


2. **Извлечение строк через Angular CLI:**
```bash
ng extract-i18n --output-path src/locale/

```


Команда сгенерирует файл `messages.xlf` в формате XLIFF (стандарт XML):
```xml
<trans-unit id="7627914200888412251" datatype="html">
  <source>Welcome to Ponyracer</source>
</trans-unit>

```


3. **Указание явных ID, смысла и описания:**
Автоматически сгенерированный ID меняется при изменении пробелов или знаков препинания. Чтобы этого избежать, задаются явные идентификаторы (начинаются с `@@`):
```html
<h1 i18n="welcome title|the title of the home page@@home.fullTitle">Welcome to Ponyracer</h1>

```


* `welcome title` — смысл (meaning),
* `the title of the home page` — описание (description) для переводчика,
* `@@home.fullTitle` — фиксированный ID.


4. **Интерполяции:**
```html
<p i18n="@@home.welcome">Welcome to Ponyracer {{ user().firstName }} {{ user().lastName }}!</p>

```


В XLF-файле выражения преобразуются в плейсхолдеры (`<x id="INTERPOLATION"/>`), защищая код от случайностей при переводе и позволяя менять порядок слов в разных языках.
5. **Атрибуты элементов:**
```html
<img
  src="/img/pony.gif"
  alt="running pony"
  i18n-alt="@@home.ponyImage.alt"
  title="Ponies are cool, aren't they?"
  i18n-title="@@home.ponyImage.title"/>

```


6. **Текст без обертки в HTML-теги:**
Используется `<ng-container>` (не рендерится в DOM):
```html
<ng-container i18n="@@home.startMessage">Let's start playing.</ng-container>

```



---

#### 27.4.2. Перевод, сборка и деплой

Перевод пишется внутри тега `<target>` (тег `<source>` остаётся неизменным):

```xml
<trans-unit id="home.welcome" datatype="html">
  <source>Welcome to Ponyracer <x id="INTERPOLATION" equiv-text="{{ user.firstName }}"/>!</source>
  <target>Bienvenue dans Ponyracer <x id="INTERPOLATION" equiv-text="{{ user.firstName }}"/> !</target>
</trans-unit>

```

Настройка локалей в `angular.json`:

```json
"prefix": "ns",
"i18n": {
  "locales": {
    "fr": "src/locale/messages.fr.xlf"
  }
}

```

Для сборки всех локалей одновременно:

```bash
ng build --localize

```

Angular CLI сгенерирует директории: `dist/PROJECT_NAME/en-US` и `dist/PROJECT_NAME/fr`.

Для локальной разработки (`ng serve`) в `angular.json` добавляются конфигурации:

```json
"build": {
  "configurations": {
    "fr": {
      "localize": ["fr"]
    }
  }
},
"serve": {
  "configurations": {
    "fr": {
      "buildTarget": "i18n:build:fr"
    }
  }
}

```

Запуск локали `fr`:

```bash
ng serve --configuration=fr

```

На продакшене поддерживается развертывание каждой версии по отдельным URL (например, `/en/`, `/fr/`) либо маршрутизация на стороне сервера в зависимости от заголовка `Accept-Language`.

---

### 27.5. Перевод сообщений в коде (Translating messages in the code)

Для перевода строк внутри TypeScript-кода применяется шаблонный тег `$localize`:

```typescript
protected status = $localize`PENDING`;

```

С явно заданным ID и интерполяцией:

```typescript
protected greetings = $localize`:@@home.greetings:Welcome ${this.user().firstName}!`;

```

При выполнении `ng extract-i18n` в XLF-файле сгенерируется элемент `trans-unit`:

```xml
<trans-unit id="home.greetings" datatype="html">
  <source>Welcome <x id="PH" equiv-text="this.user().firstName"/>!</source>
  <target>Bonjour <x id="PH" equiv-text="this.user().firstName"/> !</target>
</trans-unit>

```

---

### 27.6. Плюрализация (Pluralization)

Для обработки множественных чисел используется специальный синтаксис ICU (International Components for Unicode):

```html
<p i18n="@@home.racesPlanned">
  Hello, {racesPlanned(), plural,
    =0 {no race is planned}
    =1 {only one race is planned}
    other {{{ racesPlanned() }} races are planned}
  }.
</p>

```

При извлечении создаются два `trans-unit`: для самого сообщения и для выражения ICU:

```xml
<trans-unit id="home.racesPlanned" datatype="html">
  <source>Hello, <x id="ICU" equiv-text="{racesPlanned(), plural, ...}"/>.</source>
  <target>Bonjour, <x id="ICU" equiv-text="{racesPlanned, plural, ...}"/>.</target>
</trans-unit>
<trans-unit id="5232470321856793506" datatype="html">
  <source>{VAR_PLURAL, plural, =0 {no race is planned} =1 {only one race is planned} other {<x id="INTERPOLATION"/> races are planned}}</source>
  <target>{VAR_PLURAL, plural, =0 {aucune course n'est planifiée} =1 {seule une course est planifiée} other {<x id="INTERPOLATION"/> courses sont planifiées}}</target>
</trans-unit>

```

---

### 27.7. Динамический i18n во время выполнения с Transloco (Runtime i18n with Transloco)

Если требуется переключение языков «на лету» без перезагрузки страницы (runtime i18n), часто применяют сторонние библиотеки. Ранее популярная `ngx-translate` сейчас находится в режиме поддержки. Современным стандартом является **Transloco**.

Принцип работы Transloco:

1. **Создание загрузчика (HTTP loader):**

```typescript
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`./i18n/${lang}.json`);
  }
}

```

2. **Регистрация провайдеров в конфигурации приложения:**

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideTransloco({
      config: {
        availableLangs: ['en', 'fr'],
        defaultLang: 'en',
        prodMode: !isDevMode()
      },
      loader: TranslocoHttpLoader
    })
  ]
};

```

3. **Использование в шаблонах:**

```html
<ng-container *transloco="let t">
  <h1>{{ t('home.title') }}</h1>
  <p>{{ t('home.welcome-message') }}</p>
</ng-container>

```

---

### 27.8. Лучшие практики (Best practices)

* **Всегда задавайте явные уникальные ID.** Использование префиксов с именем компонента (например, `home.title`) предотвращает коллизии и упрощает поиск по коду.
* **Храните файлы переводов в системе контроля версий (Git).** Это упрощает слияние веток и отслеживание изменений между релизами.
* **Дублирование ключей лучше, чем преждевременное объединение.** Слово «OK» или «Save» на разных страницах со временем может потребовать уточнения контекста. Одно слово в английском языке может иметь разные переводы в других языках (например, «free» как «бесплатный» и «свободный»).
* **Не путайте языки и страны.** Не используйте флаги стран для обозначения языков. Один язык может использоваться в нескольких странах (английский, испанский), а одна страна может быть многоязычной (Бельгия, Швейцария, Канада).
* **Избегайте склеивания строк (конкатенации) с параметрами.** Не делайте отдельные ключи для частей предложений. Используйте единую строку с интерполяцией.