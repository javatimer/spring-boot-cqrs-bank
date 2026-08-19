# Сигналы: продвинутые темы

## 28.1. Равенство значений (Value equality)

Сигналы используются для хранения состояния, и вы можете реагировать на их изменение. Но как они определяют, что их значение изменилось? Вызов `set` или `update` для сигнала не обязательно приводит к изменению: если вы устанавливаете значение, равное уже имеющемуся, сигнал посчитает, что изменения не произошло.

По умолчанию равенство двух значений определяется с помощью вызова `Object.is`.
Для объектов, если новое значение `===` текущему, никаких изменений не происходит.
Однако вы можете определить собственную функцию проверки равенства, если ссылочное равенство вам не подходит.

```typescript
const status = signal(
  {
    dirty: false,
    touched: false
  },
  {
    equal: (previousStatus, newStatus) =>
      previousStatus.dirty === newStatus.dirty && previousStatus.touched === newStatus.touched
  }
);

// errorDisplayed не будет пересчитываться, если оба значения остаются прежними
const errorDisplayed = computed(() => status().dirty || status().touched);

```

---

## 28.2. untracked

Функции `computed` и `effect` принимают функцию в качестве аргумента. Angular вызывает эту функцию как минимум один раз. Это необходимо для вычисления начального значения `computed`-сигнала или для запуска первоначального побочного эффекта. Но это также нужно для того, чтобы Angular понял, какие сигналы читаются внутри функции, и смог обновить граф зависимостей.

Например:

```typescript
readonly price = signal(42);
readonly quantity = signal(2);
readonly total = computed(() => this.price() * this.quantity());

```

Это создает зависимость `total` от двух других сигналов: при изменении `price` или `quantity` Angular знает, что `total` необходимо пересчитать.

В приведенном выше примере зависимости очевидны. Но так бывает не всегда, особенно в эффектах (`effects`).

Рассмотрим следующий пример:

```typescript
protected readonly visitedUrl = signal<string | undefined>(undefined);

constructor() {
  const analyticsService = inject(AnalyticsService);
  effect(() => {
    const url = this.visitedUrl();
    if (url) {
      analyticsService.sendHitForUrl(url).subscribe();
    }
  });
}

```

Он отправляет новый просмотр (hit) с помощью HTTP каждый раз, когда меняется сигнал `visitedUrl`.
Зависимость кажется очевидной: этот эффект зависит только от `visitedUrl`.
Но действительно ли это так?

Если для HTTP-клиента был настроен перехватчик (`interceptor`), и если этот перехватчик считывает, например, сигнал токена (`token`), то подписка на Observable внутри эффекта косвенно считывает и сигнал токена. В результате эффект начинает зависеть еще и от сигнала токена, и новый запрос будет отправляться в том числе при изменении токена.

Чтобы избежать таких нежелательных зависимостей, используйте `untracked`. Хорошее практическое правило, позволяющее избежать сюрпризов: сначала прочитайте сигналы, от которых вы действительно хотите зависеть, а затем выполните остальной код внутри блока `untracked`:

```typescript
protected readonly visitedUrl = signal<string | undefined>(undefined);

constructor() {
  const analyticsService = inject(AnalyticsService);
  effect(() => {
    const url = this.visitedUrl();
    untracked(() => {
      if (url) {
        analyticsService.sendHitForUrl(url).subscribe();
      }
    });
  });
}

```

---

## 28.3. Эффекты компонентов и корневые эффекты (Root and component effects)

Мы узнали, что для работы `effect` требуется контекст внедрения зависимостей (`injection context`). Эффект может быть создан во время конструирования компонента, директивы или сервиса. В противном случае в качестве опции необходимо передать `Injector`.

Однако не все эффекты обрабатываются одинаково. Angular различает два типа эффектов:

* **Эффекты компонентов** (`component effects`), которые создаются с использованием инжектора компонента или директивы;
* **Корневые эффекты** (`root effects`), которые создаются в корневых сервисах (`root services`).

Эффекты компонентов выполняются непосредственно перед обнаружением изменений (`change detection`) содержащего их компонента. Они уничтожаются, когда уничтожается владеющий ими компонент.

Корневые эффекты, с другой стороны, никогда не уничтожаются (поскольку никогда не уничтожается сервисный класс, владеющий ими). Они выполняются как микрозадача (т. е. в то же время, когда выполнялся бы разрешенный Promise). В юнит-тестах для их запуска необходимо вызывать `TestBed.tick()`.

Если вы хотите, чтобы эффект — независимо от его типа — прекратил выполнение в определенный момент, вы всегда можете уничтожить его вручную, вызвав метод `destroy` у объекта `EffectRef`, который возвращает функция `effect`.

---

## 28.4. afterRenderEffect

Поскольку обычные эффекты компонентов выполняются перед обнаружением изменений, они не подходят для чтения или изменения DOM-дерева компонента: DOM еще не отрендерен Angular на момент запуска эффекта.

Если вам нужно прочитать или изменить DOM внутри эффекта, вы можете использовать другой тип эффекта, создаваемый функцией `afterRenderEffect`. Такой эффект, как следует из названия, выполняется **после** рендеринга.

---

## 28.5. Очистка эффекта (Effect cleanup)

Эффекты также могут принимать функцию очистки. Эта функция выполняется перед следующим запуском эффекта. Это удобно, когда вам нужно отменить предыдущее действие перед началом нового.

В примере ниже мы запускаем интервал, который срабатывает каждые `count` секунд, и хотим остановить его и запустить новый при изменении `count`:

```typescript
this.intervalEffect = effect(onCleanup => {
  const intervalId = setInterval(() => console.log(`count in intervalEffect ${this.count()}`), this.count() * 1000);
  return onCleanup(() => clearInterval(intervalId));
});

```

---

## 28.6. Двустороннее связывание с model inputs

Сигналы также позволяют по-новому взглянуть на существующие паттерны.

Как вы, вероятно, знаете, Angular поддерживает синтаксис «банан в коробке» `[(...)]` для двустороннего связывания. В основном он используется с `ngModel` для связывания элемента управления формы со свойством компонента:

**login.html**

```html
<input name="login" [(ngModel)]="user.login" />

```

Под капотом это работает благодаря тому, что у директивы `ngModel` есть входной параметр `ngModel` и выходное событие `ngModelChange`.
Синтаксис «банан в коробке» — это просто синтаксический сахар для следующего кода:

**login.html**

```html
<input name="login" [ngModel]="user.login" (ngModelChange)="user.login = $event" />

```

Этот синтаксис универсален и может использоваться с любым компонентом или директивой, имеющими вход с именем `something` и выход с именем `somethingChange`.

Вы можете использовать это в собственных компонентах и директивах, например, для создания компонента пагинации:

**pagination.ts**

```typescript
readonly collectionSize = input.required<number>();
readonly pageSize = input.required<number>();
readonly page = input.required<number>();
readonly pageChange = output<number>();

protected readonly pages = computed(() => this.computePages());

protected goToPage(page: number) {
  this.pageChange.emit(page);
}

private computePages() {
  return Array.from({ length: Math.ceil(this.collectionSize() / this.pageSize()) }, (_, i) => i + 1);
}

```

Компонент принимает размер коллекции, размер страницы и текущую страницу в качестве входных данных и генерирует событие с новой страницей при клике пользователя по кнопке. Каждый раз при изменении входных данных компонент пересчитывает список кнопок для отображения.

Шаблон использует цикл `@for` для отображения кнопок:

**pagination.html**

```html
@for (pageNumber of pages(); track pageNumber) {
  <button [class.active]="page() === pageNumber" (click)="goToPage(pageNumber)">
    {{ pageNumber }}
  </button>
}

```

Использование компонента:

```html
<ns-pagination [(page)]="page" [collectionSize]="collectionSize()" [pageSize]="pageSize()" />

```

В родительском компоненте `page` может быть как обычным числом, так и `WritableSignal<number>`. Во втором случае фреймворк автоматически передаст значение сигнала на вход компоненту пагинации и обновит значение сигнала на новую страницу, когда компонент пагинации сгенерирует событие.

Компонент пагинации можно переписать с использованием функции `model()`:

**pagination.ts**

```typescript
readonly collectionSize = input.required<number>();
readonly pageSize = input.required<number>();
protected readonly pages = computed(() => this.computePages());

readonly page = model.required<number>();
// ^? ModelSignal<number>;

protected goToPage(page: number) {
  this.page.set(page);
}

private computePages() {
  return Array.from({ length: Math.ceil(this.collectionSize() / this.pageSize()) }, (_, i) => i + 1);
}

```

Как видите, `model()` используется для определения пары вход/выход, а эмиссия значения выполняется через метод `set()` сигнала (`ModelSignal` расширяет как `WritableSignal`, так и `OutputRef`).

Модель может быть обязательной (`required`), иметь значение по умолчанию или иметь псевдоним (`alias`), как и обычные `input`. Однако ее нельзя трансформировать (`transform`). Если вы используете alias, выходное событие также получит этот псевдоним.

---

## 28.7. Связанные сигналы с linkedSignal

В Angular v19 была представлена новая концепция (в статусе developer preview) — «связанные сигналы» (`linked signals`).

`linkedSignal` — это изменяемый сигнал (`writable signal`), но в то же время он является вычисляемым (`computed signal`), так как его содержимое может сбрасываться с помощью вычисления, зависящего от другого сигнала (или нескольких сигналов).

Представьте, что у нас есть компонент, отображающий список элементов, полученных через `input`, и мы хотим, чтобы пользователь мог выбрать один из них. По умолчанию выберем первый элемент списка. Но каждый раз при изменении списка выбранный элемент может стать недействительным, поэтому мы хотим сбрасывать выбранный элемент на первый в списке.

Мы можем представить такой компонент:

```typescript
export class ItemList {
  readonly items = input.required<Array<ItemModel>>();
  protected readonly selectedItem = signal<ItemModel | undefined>(undefined);

  protected pickItem(item: ItemModel) {
    this.selectedItem.set(item);
  }
}

```

Для решения проблемы с выбором в голову может прийти использование эффекта:

```typescript
constructor() {
  // ⚠️ Это НЕ рекомендуется
  effect(() => {
    this.selectedItem.set(this.items()[0]);
  });
}

```

Каждый раз при изменении списка элементов будет срабатывать эффект, выбирая первый элемент. Это работает, но использование эффектов в целом не рекомендуется, за исключением специфических случаев — таких как синхронизация с чем-то за пределами приложения (например, с `localStorage`).

Есть один трюк, который можно показать перед тем, как перейти к рекомендуемому решению: мы можем использовать `computed`, которое возвращает… сигнал!

```typescript
export class ItemList {
  readonly items = input.required<Array<ItemModel>>();
  protected readonly selectedItem = computed<WritableSignal<ItemModel | undefined>>(() => signal(this.items()[0]));

  protected pickItem(item: ItemModel) {
    this.selectedItem().set(item);
  }
}

```

Как видите, вычисляемое значение возвращает сигнал, представляющий выбранный элемент (хотя обычно `computed` возвращает значение напрямую). Каждый раз при изменении списка вычисляемая функция перезапускается и возвращает новый сигнал. Минус этого решения в том, что нам приходится писать `selectedItem()()` для чтения значения или `selectedItem().set()` для его обновления, что выглядит не слишком изящно.

Именно здесь на помощь приходит `linkedSignal`:

```typescript
export class ItemList {
  readonly items = input.required<Array<ItemModel>>();
  // ✅ Это рекомендуемый подход
  protected readonly selectedItem: WritableSignal<ItemModel> = linkedSignal(() => this.items()[0]);
}

```

`linkedSignal` — это `WritableSignal`, но его значение может сбрасываться благодаря вычислению. Если `items` меняется, вычисление выполняется повторно, и значение сигнала обновляется результатом.

Это мощная концепция, позволяющая объявить сигнал, зависящий от другого сигнала (как `computed`), но с возможностью записи в него (эдакий «записываемый computed»).

Вычисление, конечно, может зависеть от нескольких сигналов. В данном примере `selectedItem` сбрасывается при изменении `items`, а также при изменении входного параметра `enabled`:

```typescript
export class ItemList {
  readonly items = input.required<Array<ItemModel>>();
  readonly enabled = input.required<boolean>();
  // пересчитывается, если меняются `enabled` или `items`
  protected readonly selectedItem = linkedSignal(() => (this.enabled() ? this.items()[0] : undefined));
}

```

Обратите внимание, что при необходимости вы можете использовать предыдущее значение исходного сигнала в функции вычисления. Например, если вы хотите получить доступ к предыдущему значению `items` для сравнения с новым, вы можете объявить `linkedSignal` с опциями `source` и `computation`. В этом случае функция вычисления получает текущее и предыдущее значения источника в качестве параметров:

```typescript
export class ItemList {
  readonly items = input.required<Array<ItemModel>>();
  protected readonly selectedItem = linkedSignal</* source */ Array<ItemModel>, /* value */ ItemModel>({
    source: this.items,
    computation: (items, previous) => {
      // выбираем элемент, ранее выбранный пользователем, если он все еще есть в новом списке
      if (previous !== undefined) {
        const previousChoice = previous.value; // previous.source содержит предыдущие items
        if (items.map(item => item.name).includes(previousChoice.name)) {
          return previousChoice;
        }
      }
      return items[0];
    }
  });
}

```

Вы также можете определить пользовательскую функцию равенства с помощью опции `equal`, чтобы решать, изменился ли сигнал.

---

## 28.8. Асинхронные ресурсы с resource и rxResource

В Angular v19 была добавлена новая возможность для работы с асинхронными операциями. Большинству приложений необходимо загружать данные с сервера в зависимости от некоторых параметров и отображать результат в UI: `resource` призван в этом помочь.

> **Примечание:** Данный API является экспериментальным и вскоре пройдет процесс RFC — пока не рекомендуется использовать его в продакшене.

Функция `resource()` позволяет определить ресурс, представляющий асинхронную операцию. Функция принимает объект с обязательной функцией `loader`, которая возвращает Promise:

```typescript
list(): ResourceRef<Array<UserModel> | undefined> {
  return resource({
    loader: async () => {
      const response = await fetch('/users');
      return (await response.json()) as Array<UserModel>;
    }
  });
}

```

Этот пример использует не HTTP-клиент Angular, а нативную функцию `fetch()`, возвращающую Promise. Действительно, функция `resource()` не связана с RxJS и может использовать любой клиент, возвращающий Promise. `rxResource`, который мы обсудим далее, является альтернативой `resource` для работы с клиентами на базе Observable. Это еще один пример того, как Angular отвязывается от RxJS, сохраняя при этом функции совместимости для плавного использования.

Вы также можете определить опцию `defaultValue`, которая будет использоваться в качестве начального значения ресурса (вместо `undefined` по умолчанию):

```typescript
return resource({
  defaultValue: [],
  loader: async () => {
    const response = await fetch('/users');
    return (await response.json()) as Array<UserModel>;
  }
});

```

`resource()` возвращает `ResourceRef` — объект, содержащий:

* сигнал `isLoading`, указывающий, загружается ли ресурс;
* сигнал `value`, содержащий результат Promise;
* сигнал `error`, содержащий ошибку, если Promise был отклонен (rejected);
* сигнал `status`, содержащий статус ресурса.

Затем вы можете использовать эти сигналы в вашем шаблоне:

```html
@if (usersResource.isLoading()) {
  <p>Loading...</p>
} @else {
  <ul>
    @for (user of usersResource.value(); track user.id) {
      <li>{{ user.name }}</li>
    }
  </ul>
}

```

Сигнал `status` может принимать значения:

* `'idle'` — начальное состояние;
* `'loading'` — когда Promise находится в процессе выполнения;
* `'error'` — когда Promise завершился ошибкой;
* `'resolved'` — когда Promise успешно выполнен;
* `'reloading'` — когда ресурс перезагружается;
* `'local'` — когда значение было установлено локально.

Ресурс также имеет метод `reload()`, позволяющий перезагрузить данные. В этом случае статус будет установлен в `'reloading'`.

Но перезагрузка может происходить и автоматически благодаря опции `params`. При ее указании ресурс автоматически перезагрузится, если изменится один из сигналов, используемых в `params`. Здесь, например, компонент имеет опцию `sortOrder`, используемую в запросе:

```typescript
protected readonly sortOrder = signal<'asc' | 'desc'>('asc');
protected readonly usersResource = resource({
  // 👇 Сигнал `sortOrder` используется для триггера перезагрузки
  params: () => ({ sort: this.sortOrder() }),
  loader: async loaderParams => {
    // 👇 loaderParams также содержит `abortSignal` для отмены запроса
    // и предыдущий статус ресурса; здесь нас интересуют только params
    const params = loaderParams.params;
    const response = await fetch(`/users?sort=${params.sort}`);
    return (await response.json()) as Array<UserModel>;
  }
});

```

Если сигнал `sortOrder` изменится, ресурс автоматически перезагрузится!
При необходимости вы также можете отменить предыдущий запрос во время перезагрузки ресурса, используя параметр `abortSignal` у `loader` (например, для реализации debounce).

Вы можете проигнорировать запрос на перезагрузку и сохранить текущее значение, возвратив `undefined` из функции `params`.

И последнее по порядку, но не по значимости: возвращаемый `ResourceRef` на самом деле является изменяемым (`writable`). Вы можете использовать его методы `set` или `update` для изменения значения ресурса (как самого значения, так и ресурса целиком). В этом случае его статус станет `'local'`.

Если вас интересует только чтение ресурса, вы можете использовать метод `asReadonly()` для получения версии только для чтения. Наконец, `ResourceRef` имеет метод `destroy()`, который можно использовать для остановки ресурса.

В Angular v19.2 была добавлена возможность создания ресурсов с потоковой передачей данных (`streamed response data`). Потоковый ресурс определяется с помощью опции `stream` вместо `loader`. Эта функция `stream` возвращает **Promise от сигнала** (да, это стоит перечитать дважды). Значение сигнала должно быть типа `ResourceStreamItem` — объект со свойством `value` или `error`.

Когда Promise разрешается, загрузчик может продолжать обновлять этот сигнал с течением времени, а ресурс будет обновлять свое значение и ошибку каждый раз при изменении элемента сигнала. Вы можете построить такой поток самостоятельно, например, с помощью WebSocket. Можно также представить, что библиотеки вроде Firebase могли бы предоставлять функцию `stream`, готовую к использованию:

```typescript
list(): ResourceRef<Array<UserModel> | undefined> {
  return resource({
    // firebaseCollection не существует в реальности
    stream: async ({ abortSignal }) => await firebaseCollection('users', abortSignal)
  });
}

```

Теперь посмотрим, как использовать ресурс на базе Observable вместо Promise. В этом случае используется функция `rxResource()`. Она очень похожа на `resource()`, но ее `stream` должен возвращать Observable вместо Promise. Это позволяет использовать привычный сервис `HttpClient` для получения данных с сервера со всеми вашими интерцепторами, обработкой ошибок и т. д.:

```typescript
protected readonly sortOrder = signal<'asc' | 'desc'>('asc');
protected readonly usersResource = rxResource({
  params: () => ({ sort: this.sortOrder() }),
  // 👇 Загрузчик на базе RxJS
  stream: ({ params }) => this.httpClient.get<Array<UserModel>>('/users', { params: { sort: params.sort } })
});

```

Обратите внимание, что функция `rxResource()` находится в пакете `@angular/core/rxjs-interop`, в то время как `resource()` — в `@angular/core`.

Вы можете получать поток значений, возвращая Observable, который эмитит данные несколько раз, и ресурс будет обновляться при каждом новом значении:

```typescript
protected readonly sortOrder = signal<'asc' | 'desc'>('asc');
protected readonly usersResource = rxResource({
  params: () => ({ sort: this.sortOrder() }),
  // 👇 Поток, который получает значение сейчас и каждые 10 секунд
  stream: ({ params }) =>
    timer(0, 10000).pipe(
      switchMap(() => this.httpClient.get<Array<UserModel>>('/users', { params: { sort: params.sort } }))
    )
});

```

---

## 28.9. HTTP-вызовы с httpResource

В Angular v19.2 была представлена специальная (и пока экспериментальная) функция для создания ресурсов, использующих HTTP-запросы — `httpResource()` из пакета `@angular/common/http`.

Под капотом эта функция использует `HttpClient`, что позволяет применять стандартные перехватчики (`interceptors`), утилиты для тестирования и т. д.

Самый базовый вариант использования — вызов функции с передачей другой функции, возвращающей URL, по которому нужно получить данные:

```typescript
protected readonly usersResource = httpResource<Array<UserModel>>(() => '/users');

```

`httpResource()` возвращает `HttpResourceRef` с теми же свойствами, что и `ResourceRef` (тип, возвращаемый `resource()`), так как построен поверх него:

* `value` — сигнал, содержащий десериализованное тело JSON-ответа;
* `status` — сигнал со статусом ресурса (`idle`, `loading`, `error`, `resolved` и т. д.);
* `error` — сигнал с ошибкой в случае неудачи запроса;
* `isLoading` — сигнал, указывающий, загружается ли ресурс;
* `reload()` — метод для перезагрузки ресурса;
* `update()` и `set()` — методы для изменения значения ресурса;
* `asReadonly()` — метод для получения версии только для чтения;
* `hasValue()` — метод, позволяющий узнать, есть ли у ресурса значение;
* `destroy()` — метод для остановки ресурса.

Он также содержит несколько дополнительных свойств, специфичных для HTTP-ресурсов:

* `statusCode` — сигнал с числовым кодом статуса ответа;
* `headers` — сигнал с заголовками ответа в виде `HttpHeaders`;
* `progress` — сигнал с прогрессом скачивания ответа в виде `HttpProgressEvent`.

Также можно определить реактивный ресурс, используя сигнал внутри функции, задающей URL. Ресурс автоматически перезагрузится при изменении сигнала:

```typescript
protected readonly sortOrder = signal<'asc' | 'desc'>('asc');
protected readonly sortedUsersResource = httpResource<Array<UserModel>>(() => `/users?sort=${this.sortOrder()}`);

```

Если вы хотите пропустить перезагрузку, вы можете вернуть `undefined` из функции запроса (как и для `resource`).

Если вам нужен более точечный контроль над запросом, вы можете передать функцию, возвращающую объект `HttpResourceRequest`. Этот объект должен иметь свойство `url` и может содержать другие параметры, такие как `method` (по умолчанию `GET`), `params`, `headers`, `reportProgress` и т. д.

Чтобы сделать запрос реактивным, вы можете использовать сигналы в свойствах `url`, `params` или `headers`:

```typescript
protected readonly sortedUsersResource = httpResource<Array<UserModel>>(() => ({
  url: `/users`,
  params: { sort: this.sortOrder() },
  headers: new HttpHeaders({ 'X-Custom-Header': this.customHeader() })
}));

```

Вы, разумеется, можете передавать тело запроса (например, для POST/PUT запросов), используя свойство `body`:

```typescript
protected readonly query = signal('');
protected readonly filterUsersResource: HttpResourceRef<Array<UserModel> | undefined> = httpResource<
  Array<UserModel>>(() => {
  const query = this.query();
  return query
    ? {
        url: `/users`,
        method: 'POST',
        body: { query }
      }
    : undefined;
});

```

Вторым аргументом можно передать дополнительные опции:

* `injector` — на случай, если ресурс создается не во время конструирования;
* `defaultValue` — значение по умолчанию, используемое при состояниях `idle`, `loading` или `error`;
* `equal` — функция для определения равенства двух значений;
* `parse` — функция, позволяющая трансформировать ответ перед его сохранением в ресурс.

Также можно запрашивать данные в формате, отличном от JSON, используя функции `httpResource.text()`, `httpResource.blob()` или `httpResource.arrayBuffer()`.

У некоторых из вас может возникнуть ощущение дежавю, так как это очень похоже на библиотеку **TanStack Query**. Напомним, что это экспериментальная фича, и она наверняка будет развиваться в будущем, а также использоваться более высокоуровневыми API или библиотеками. Посмотрим, что принесет процесс RFC!