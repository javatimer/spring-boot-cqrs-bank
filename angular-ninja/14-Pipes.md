### Пайпы (Pipes)

#### 14.1. Введение

Иногда сырые данные — это совсем не то, что мы хотим отображать в представлении (*view*). Часто их требуется преобразовать, форматировать и т.д. В AngularJS 1.x для этого была очень удобная фича под названием «фильтры» (не совсем удачное название). Ошибки были учтены, и теперь эти преобразователи данных получили логичное название! Шутка, их назвали **пайпами** (*pipes* / каналы / трубы) :).

Как и компоненты, пайпы могут быть автономными (*standalone*) или нет. Все встроенные пайпы Angular, которые мы рассмотрим ниже, являются автономными и входят в `CommonModule`. Чтобы использовать их в компонентах, их нужно импортировать напрямую или добавить целиком `CommonModule` в массив `imports`.

---

#### 14.2. `json`

Пайп `JsonPipe` не так полезен в продакшене, но крайне удобен при отладке. По сути, он применяет `JSON.stringify()` к вашим данным.

Если у вас есть массив объектов в сигнале и вы попытаетесь вывести его «как есть»:

```html
<p>{{ ponies() }}</p>

```

Вы увидите неутешительное `[object Object]`.

Но `JsonPipe` приходит на помощь. Его можно использовать в любом выражении шаблона:

```html
<p>{{ ponies() | json }}</p>

```

И вы получите полноценное JSON-представление:

```html
<p>[ { "name": "Rainbow Dash" }, { "name": "Pinkie Pie" } ]</p>

```

Символ `|` (*pipe*) ставится после данных, а за ним следует имя пайпа. Выражение вычисляется, и результат пропускается через пайп.

Пайпы можно объединять в цепочки (*chaining*):

```html
<p>{{ ponies() | slice:0:2 | json }}</p>

```

Пайпы можно применять в интерполяции и связывании свойств, но **нельзя** использовать внутри обработчиков событий (event statements):

```html
<p [textContent]="ponies() | json"></p>

```

---

#### 14.3. `slice`

Пайп `SlicePipe` позволяет отобразить часть списка или строки. Он работает аналогично методу `Array.prototype.slice()` в JS и принимает параметры через двоеточие `:`.

Синтаксис аргументов: `:start:end`

```html
<p>{{ ponies() | slice:0:2 | json }}</p>

```

Работает со строками и массивами:

* `'Ninja Squad' | slice:0:5` $\rightarrow$ `'Ninja'`
* `'Ninja Squad' | slice:3` $\rightarrow$ `'ja Squad'` (от указанного индекса до конца)
* `'Ninja Squad' | slice:-5` $\rightarrow$ `'Squad'` (последние $N$ элементов)
* `'Ninja Squad' | slice:2:-2` $\rightarrow$ `'nja Squ'`

Использование с директивой `@for` и динамическими параметрами:

```typescript
@Component({
  selector: 'ns-ponies',
  template: `
    @for (pony of ponies() | slice: 0 : size(); track pony.id) {
      <div>{{ pony.name }}</div>
    }
  `,
  imports: [SlicePipe]
})
export class Ponies {
  protected readonly size = signal(2);
  protected readonly ponies = signal<Array<PonyModel>>([
    { id: 1, name: 'Rainbow Dash' },
    { id: 2, name: 'Pinkie Pie' },
    { id: 3, name: 'Fluttershy' }
  ]);
}

```

---

#### 14.4. `keyvalue`

Пайп `KeyValuePipe` позволяет перебирать в шаблоне структуры `Map` или обычные JavaScript-объекты.

По умолчанию он сортирует ключи:

1. Лексикографически (если ключи — строки).
2. По значению (если ключи — числа).
3. По булеву значению (`false` идет перед `true`).

Пример перебора `Map`:

```typescript
@Component({
  selector: 'ns-ponies',
  template: `
    <ul>
      @for (entry of ponies() | keyvalue; track entry) {
        <li>{{ entry.key }} - {{ entry.value.name }}</li>
      }
    </ul>
  `,
  imports: [KeyValuePipe]
})
export class Ponies {
  protected readonly ponies = signal(
    new Map<number, PonyModel>([
      [103, { name: 'Rainbow Dash' }],
      [56, { name: 'Pinkie Pie' }]
    ])
  );
}

```

Можно передавать собственную функцию компаратора для кастомной сортировки:

```typescript
ponyComparator(a: KeyValue<PonyModel, number>, b: KeyValue<PonyModel, number>): -1 | 0 | 1 {
  if (a.key.name === b.key.name) return 0;
  return a.key.name < b.key.name ? -1 : 1;
}

```

И затем в шаблоне: `| keyvalue: ponyComparator`.

---

#### 14.5. `uppercase` / 14.6. `lowercase` / 14.7. `titlecase`

Текстовые пайпы для изменения регистра:

* `'Ninja Squad' | uppercase` $\rightarrow$ `'NINJA SQUAD'`
* `'Ninja Squad' | lowercase` $\rightarrow$ `'ninja squad'`
* `'ninja squad' | titlecase` $\rightarrow$ `'Ninja Squad'` (делает первую букву каждого слова заглавной)

---

#### 14.8. `number` (DecimalPipe)

Форматирует числа. Принимает формат в виде строки: `{целаяЧасть}.{минДесятичных}-{максДесятичных}`.

Примеры (для локали `en-US`):

* `12345 | number` $\rightarrow$ `'12,345'` (автоматическая группировка разрядов)
* `12345 | number:'6.'` $\rightarrow$ `'012,345'` (дополняет нулями слева до 6 цифр)
* `12345 | number:'.2'` $\rightarrow$ `'12,345.00'` (задает минимум 2 знака после запятой)
* `12345.16 | number:'.1-1'` $\rightarrow$ `'12,345.2'` (округляет до 1 знака после запятой)

---

#### 14.9. `percent`

Форматирует число как процентное значение (умножает на 100 и добавляет `%`):

* `0.8 | percent` $\rightarrow$ `'80%'`
* `0.8 | percent:'.3'` $\rightarrow$ `'80.000%'`

---

#### 14.10. `currency`

Форматирует денежные суммы.

Аргументы:

1. ISO-код валюты (`'USD'`, `'EUR'`, `'CAD'` и т.д.).
2. Отображение символа (`'symbol'`, `'code'`, `'symbol-narrow'`). По умолчанию `'symbol'`.
3. Строка формата чисел (аналогично `number`).

Примеры:

* `10.6 | currency:'CAD'` $\rightarrow$ `'CA$10.60'`
* `10.6 | currency:'CAD':'symbol-narrow'` $\rightarrow$ `' $10.60'`
* `10.6 | currency:'EUR':'code':'.3'` $\rightarrow$ `'EUR10.600'`

> `CurrencyPipe` умеет работать со спецификацией ISO 4217 — например, для чилийского песо число разрядов после запятой автоматически станет равным 0, а для тунисского динара — 3.

---

#### 14.11. `date`

Форматирует объекты `Date`, строки с датами или метки времени (в миллисекундах) в понятную строку.

Примеры паттернов:

* `birthday() | date:'dd/MM/yyyy'` $\rightarrow$ `'16/07/1986'`
* `birthday() | date:'longDate'` $\rightarrow$ `'July 16, 1986'`
* `birthday() | date:'HH:mm'` $\rightarrow$ `'15:30'`
* `birthday() | date:'shortTime'` $\rightarrow$ `'3:30 PM'`

---

#### 14.12. `async`

`AsyncPipe` позволяет подписываться на асинхронные данные прямо из шаблона. Он умеет работать с **Promise** и **Observable**.

Пока данные не получены (промис не разрешен), пайп возвращает `null`. Как только данные приходят, он заставляет Angular обновить представление.

Пример с `Promise`:

```typescript
@Component({
  selector: 'ns-greeting',
  template: `<div>{{ asyncGreeting | async }}</div>`,
  imports: [AsyncPipe]
})
export class Greeting {
  protected readonly asyncGreeting = new Promise(resolve => {
    window.setTimeout(() => resolve('hello'), 1000);
  });
}

```

> **Важный плюс `AsyncPipe`:** Если источником данных является `Observable`, пайп **автоматически отпишется** от него при уничтожении компонента, предотвращая утечки памяти.

Результат можно сохранять в локальную переменную в шаблоне с помощью синтаксиса `as`:

```html
@if (asyncUser | async; as user) {
  <div>{{ user.name }}</div>
}

```

---

#### 14.13. Использование функций форматирования в TypeScript-коде

Все функции, лежащие в основе встроенных пайпов, можно импортировать и вызывать напрямую в TS-коде (например, `formatNumber`, `formatDate` и т.д.):

```typescript
import { formatNumber } from '@angular/common';

@Component({
  selector: 'ns-pony',
  template: `<p>{{ formattedSpeed() }}</p>`
})
export class Pony {
  protected readonly pony = signal({ name: 'Rainbow Dash', speed: 15 });
  protected readonly formattedSpeed = computed(
    () => formatNumber(this.pony().speed, 'en-US', '.2')
  );
}

```

---

#### 14.14. Создание собственных пайпов

Чтобы создать кастомный пайп:

1. Создайте класс и имплементируйте интерфейс `PipeTransform`.
2. Реализуйте метод `transform()`.
3. Украсьте класс декоратором `@Pipe({ name: 'myPipeName' })`.
4. Импортируйте пайп в компонент, где он будет использоваться.

Пример пайпа с использованием библиотеки `date-fns` для вычисления времени, прошедшего с даты:

```typescript
import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';

@Pipe({
  name: 'fromNow'
})
export class FromNowPipe implements PipeTransform {
  transform(value: string, ..._args: Array<unknown>): string {
    const date = parseISO(value);
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }
}

```

Использование в компоненте:

```typescript
@Component({
  selector: 'ns-race',
  template: 'The race started {{ race().startInstant | fromNow }}',
  imports: [FromNowPipe]
})
export class Race {
  protected readonly race = signal({
    startInstant: '2023-02-10T10:00:00.000Z'
  });
}

```