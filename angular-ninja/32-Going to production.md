Подготовка Angular-приложения к развертыванию в продакшн включает настройку окружений, строгую проверку типов в шаблонах, оптимизированную сборку артефактов и корректную конфигурацию веб-сервера.

## 32.1. Окружения и конфигурации (Environments)

Для разделения параметров разработки и продакшна (например, URL-адресов API) Angular CLI использует механизм подмены файлов (`fileReplacements`).

Сгенерировать файлы окружения можно командой:

```bash
ng generate environments

```

Это создает файлы `environment.ts` (по умолчанию) и `environment.development.ts`. В исходном коде приложения всегда импортируется только `environment.ts`, а Angular CLI заменяет его при сборке.

Настройка подмены задается в `angular.json`:

```json
"configurations": {
  "production": {
    "budgets": [
      {
        "type": "initial",
        "maximumWarning": "500kB",
        "maximumError": "1MB"
      }
    ],
    "outputHashing": "all"
  },
  "development": {
    "optimization": false,
    "sourceMap": true,
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.development.ts"
      }
    ]
  }
}

```

* **Выбор конфигурации:** Команда `ng build` по умолчанию использует конфигурацию `production` (начиная с Angular 12). Для запуска разработки применяется `ng serve --configuration=development`.
* **Комбинирование конфигураций:** Можно указывать несколько конфигураций через запятую: `ng build --configuration=production,preprod`. Значения из `preprod` переопределят `production`.
* **Подмена ресурсов:** Механизм замен работает не только для TypeScript, но и для статических ассетов и стилей (удобно для управления темами приложения).

---

## 32.2. Строгая проверка шаблонов (`strictTemplates`)

При AoT-компиляции (Ahead-of-Time) компилятор Angular проверяет HTML-шаблоны на наличие ошибок типов.

Включение максимального уровня проверок в `tsconfig.json`:

```json
"angularCompilerOptions": {
  "strictTemplates": true,
  "extendedDiagnostics": {
    "defaultCategory": "error"
  },
  "typeCheckHostBindings": true
}

```

* **`strictTemplates`**: проверяет соответствие типов для `@Input()`, событий DOM, локальных переменных шаблона и вызовов методов.
* **`extendedDiagnostics`**: находит частые логические ошибки в шаблонах (например, перепутанный синтаксис двухстороннего связывания `([ngModel])` вместо `[(ngModel)]`).
* **`typeCheckHostBindings`**: проверяет выражения внутри `@HostBinding` и `host`-свойств компонентов (по умолчанию включено с v21).

---

## 32.3. Сборка приложения (`ng build`)

Для упаковки приложения в продакшн-готовую директиву `dist/` используется команда:

```bash
ng build

```

Автоматически выполняемые оптимизации CLI:

* **Tree-shaking & Dead Code Elimination:** удаление неиспользуемого кода и библиотек.
* **Build Optimizer:** дополнительное сжатие и транспиляция кода Angular для ускорения инициализации.
* **Отключение Source Maps:** по умолчанию `sourceMap: false` уменьшает размер бандла и защищает исходный код.
* **Output Hashing (`outputHashing: "all"`):** добавляет уникальный хэш к именам итоговых файлов (например, `main.a8f9c1.js`) для управления кэшированием (Cache Busting).

---

### 32.4 Настройка веб-сервера

На этапе деплоя результаты сборки из директории `dist/` отправляются на статический веб-сервер (Nginx, Apache, Cloudflare Pages, AWS S3 / CloudFront и др.).

> **Критически важно:** `ng serve` предназначен исключительно для локальной разработки. Использовать его в продакшне категорически нельзя (даже с флагом `--configuration=production`), так как он не обладает нужным уровнем производительности и безопасности.

---

### Key Server Configuration Tasks

* **Сжатие ресурсов (Compression):** Все текстовые ассеты (`.js`, `.css`, `.html`, `.json`) должны отдаваться со сжатием (Gzip или Brotli) для минимизации объема передаваемого трафика.
* **Долгосрочное кэширование (Cache-Control):** Поскольку Angular CLI добавляет хэш содержимого в имена файлов (Cache Busting), статическим файлам можно задавать агрессивное кэширование (`max-age=31536000, immutable`). Браузер сразу запросит новый файл при обновлении версии приложения, так как имя файла изменится.
* **SPA-роутинг (Fallback на `index.html`):** В Single Page Applications обработка маршрутов происходит на клиенте через Angular Router. Если пользователь перейдет по адресу `[https://app.com/races](https://app.com/races)` или обновит страницу (F5), веб-сервер попытается найти директорию `/races` на диске и вернет **404 Not Found**. Сервер необходимо настроить так, чтобы на любой путь он возвращал `index.html`.

---

### Примеры конфигурации серверов

**Nginx (`nginx.conf`):**

```nginx
location / {
  root /usr/share/nginx/html;
  index index.html;
  try_files $uri $uri/ /index.html;
}

```

**Apache (`.htaccess`):**

```apacheconf
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

```

---

### Итог (32.5. Conclusion)

Подготовка и развертывание Angular-приложения в продакшн сводятся к нескольким базовым шагам за счет мощных встроенных инструментов Angular CLI:

1. Вызов `ng build` (автоматический tree-shaking, минификация, хэширование имен, оптимизация шаблонов).
2. Размещение скомпилированного бандла на статическом веб-сервере с включенным сжатием, кэшированием и fallback-правилом для `index.html`.