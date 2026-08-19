### Создание компонентов и директив

#### 11.1. Введение

До сих пор мы рассматривали лишь небольшие базовые компоненты. Однако компоненты — это основа приложения, и они могут быть куда сложнее. Как передавать данные между ними? Как управлять их жизненным циклом? Какие практики считаются наилучшими? А также: что такое директивы и для чего они нужны? Давайте разберемся!

---

#### 11.2. Директивы

Директива очень похожа на компонент, за одним главным исключением: **у директивы нет собственного шаблона**.

* **Компоненты** обогащают HTML, создавая новые кастомные элементы (например, `<ns-pony />`).
* **Директивы** обогащают HTML, добавляя новое поведение к *уже существующим* элементам. Например, вы можете прикрепить директиву перетаскивания `drag` к `<div>`, `<section>` или даже к компоненту `<ns-pony>`.

На один и тот же элемент можно навешивать сразу несколько директив. Например, тег `<img>` может использовать директиву `NgOptimizedImage` для оптимизации и одновременно директиву `drag` для перетаскивания.

Объявление директивы ничем не отличается от компонента: создается класс, который декорируется с помощью `@Directive({...})`. На самом деле **компоненты — это разновидность директив** (компонент наследует все метаданные директивы, добавляя к ним шаблон). Их жизненные циклы практически идентичны.

> Хотя директивы — мощный инструмент Angular, в обычной веб-разработке они чаще используются в низкоуровневых библиотеках или самом фреймворке. Рядовой разработчик чаще создает именно компоненты.

---

#### 11.3. Селекторы (Selectors)

Селектор указывает Angular, по какому правилу находить компонент или директиву в HTML-шаблоне.

Селекторы могут быть следующих типов:

* **Тег (element):** обычно используется для компонентов (`ns-pony`).
* **CSS-класс:** используется редко (`.alert`).
* **Атрибут:** самый частый вариант для директив (`[color]`).
* **Атрибут с конкретным значением:** (`[color=red]`).
* **Комбинации:**
* `footer[color=red]` — сработает на тег `footer` с атрибутом `color="red"`.
* `[color], footer.alert` — сработает на *любой* элемент с атрибутом `color` **ИЛИ** на тег `footer` с классом `alert`.
* `footer:not(.alert)` — сработает на тег `footer`, у которого **нет** класса `alert`.



Пример простой директивы, которая срабатывает при наличии атрибута `doNothing`:

```typescript
@Directive({
  selector: '[doNothing]'
})
export class DoNothing {
  constructor() {
    console.log('Do nothing directive');
  }
}

```

Применение в компоненте:

```typescript
@Component({
  selector: 'ns-test',
  template: '<div doNothing>Click me</div>',
  imports: [DoNothing]
})
export class Test {}

```

Пример более сложного селектора:

```typescript
@Directive({
  selector: 'div.loggable[logText]:not([notLoggable=true])'
})
export class ComplexSelector {}

```

Этот селектор применится к тегам `div` с классом `loggable`, атрибутом `logText`, но **без** атрибута `notLoggable="true"`.

> **Важно:** Angular поддерживает не все CSS-селекторы. Вложенные селекторы (descendants), соседние (siblings), селекторы по `#id` и псевдоклассы (кроме `:not`) **не поддерживаются**.

---

#### 11.4. Входные данные через `input()`

Входные параметры (Inputs) позволяют компоненту или директиве получать данные от родительского компонента. Их можно сравнить с аргументами функции.

Для передачи данных используется синтаксис связывания свойств `[]`:

* `<ns-pony color="blue" />` — передача статической строки `'blue'`.
* `<ns-pony [color]="selectedColor()" />` — передача динамического значения из выражения `selectedColor()`.

Чтобы принимать данные, дочерний компонент должен объявить `input()`:

```typescript
@Component({
  selector: 'ns-pony',
  template: 'My color is {{ color() }}'
})
export class Pony {
  protected readonly color = input<string>();
}

```

Свойство `color` представляет собой специальный сигнал — `InputSignal`. Этот сигнал **нельзя изменить напрямую** внутри компонента `Pony`. Переписать его значение может только родительский компонент.

##### Варианты объявления `input()`:

1. **Опциональный (без значения по умолчанию):**
`readonly color = input<string>();`
*(Тип: `InputSignal<string | undefined>`. Если родитель ничего не передал, вернет `undefined`)*.
2. **С дефолтным значением:**
`readonly color = input('red');`
*(Тип: `InputSignal<string>`. Всегда возвращает строку)*.
3. **Обязательный (Required):**
`readonly color = input.required<string>();`
*(Приложение не скомпилируется, если родитель забыл передать значение)*.
4. **С использованием алиаса:**
`readonly color = input.required<string>({ alias: 'c' });`
*(В шаблоне родителя нужно будет писать `[c]="selectedColor()"`)*.

---

#### 11.5. Декоратор `@Input` (Устаревший подход)

В существующих проектах вы можете встретить объявления через декоратор `@Input()` вместо сигналов:

```typescript
// Опциональный
@Input() color: string | undefined;

// C дефолтным значением
@Input() readonly color = 'red';

// Обязательный
@Input({ required: true }) color!: string;

// C алиасом
@Input({ required: true, alias: 'c' }) color!: string;

```

---

#### 11.6. Выходные события через `output()`

В Angular действует фундаментальное правило: **данные передаются ВНИЗ через свойства (`input`), а ВВЕРХ — через события (`output`)**.

Для отправки событий родителю используется функция `output()`, которая создает объект типа `OutputEmitterRef`.

```typescript
@Component({
  selector: 'ns-pony',
  template: `
    <div>I'm the pony {{ ponyModel().name }}</div>
    <div><button (click)="selectMe()">Select me</button></div>
  `
})
export class Pony {
  readonly ponyModel = input.required<PonyModel>();

  // Объявляем событие
  readonly ponySelected = output<PonyModel>();

  protected selectMe() {
    // Излучаем событие с объектом ponyModel
    this.ponySelected.emit(this.ponyModel());
  }
}

```

Использование в шаблоне родительского компонента:

```html
<ns-pony [ponyModel]="ponyModel()" (ponySelected)="betOnPony($event)" />

```

Переменная `$event` содержит значение, переданное в метод `.emit()` (в данном случае объект `PonyModel`).

Родительский класс обрабатывает событие следующим образом:

```typescript
protected betOnPony(event: PonyModel) {
  // Обработка полученных данных
}

```

Вы также можете задать алиас для события:

```typescript
readonly ponySelected = output<PonyModel>({ alias: 'activated' });

```

*(В шаблоне родителя нужно будет слушать `(activated)="betOnPony($event)"`)*.

---

#### 11.7. Декоратор `@Output` (Устаревший подход)

До появления `output()` выходящие события объявлялись с помощью декоратора `@Output()` и класса `EventEmitter`:

```typescript
@Output() readonly ponySelected = new EventEmitter<PonyModel>();

// С алиасом:
@Output('activated') ponySelected = new EventEmitter<PonyModel>();

```

---

#### 11.8. Жизненный цикл (Lifecycle)

Компоненты и директивы имеют жизненный цикл:

1. Вызывается **конструктор** класса.
2. Передаются первичные значения **входных параметров (inputs)**.
3. При изменении входных данных параметры обновляются снова.
4. При уходе пользователя с экрана компонент **уничтожается** (destroy).

> **КРИТИЧЕСКИ ВАЖНО:** Входные параметры (`inputs`) передаются **ПОСЛЕ** вызова конструктора! Внутри `constructor()` читать `inputs` **запрещено**:
> * `input()`-сигналы выбросят исключение (ошибку).
> * Старый `@Input()` вернет `undefined` или дефолтное значение.
> 
> 

```typescript
export class Pony {
  readonly color = input.required<string>();

  constructor() {
    // ❌ ОШИБКА! В конструкторе color еще недоступен
    console.log(`My initial color is ${this.color()}`); 
  }
}

```

##### Хуки жизненного цикла (Lifecycle Hooks):

Чтобы корректно реагировать на этапы жизни компонента, используются специальные методы-хуки (рекомендуется имплементировать соответствующие интерфейсы):

1. **`ngOnInit`** — вызывается **один раз** после того, как все входные параметры инициализированы. Идеальное место для первичной загрузки данных.
```typescript
export class Pony implements OnInit {
  readonly color = input.required<string>();

  ngOnInit() {
    // ✅ Правильно
    console.log(`My initial color is ${this.color()}`);
  }
}

```


2. **`ngOnChanges`** — вызывается **при каждом изменении** любого из `inputs` (включая первый раз перед `ngOnInit`). Принимает объект `SimpleChanges`.
```typescript
export class Pony implements OnChanges {
  readonly color = input.required<string>();

  ngOnChanges(changes: SimpleChanges<Pony>): void {
    const ponyChange = changes.color;
    if (ponyChange) {
      console.log(`Color changed from ${ponyChange.previousValue} to ${ponyChange.currentValue}`);
    }
  }
}

```


3. **`ngOnDestroy`** — вызывается непосредственно перед уничтожением компонента. Используется для очистки таймеров, отписки от событий и предотвращения утечек памяти.
```typescript
export class Pony implements OnDestroy {
  readonly color = input.required<string>();
  private readonly interval: number;

  constructor() {
    this.interval = window.setInterval(() => console.log(`My color is ${this.color()}`), 1000);
  }

  ngOnDestroy(): void {
    // ✅ Очищаем интервал при уничтожении компонента
    window.clearInterval(this.interval);
  }
}

```



---

#### 11.9. Метаданные компонента

В отличие от директив, компоненты обязаны иметь шаблон, а также могут объявлять стили, изолированные в рамках своего шаблона.

---

#### 11.10. Template / Template URL

Для задания шаблона у декоратора `@Component` есть два свойства (нельзя использовать одновременно):

* `template`: встроенный (inline) HTML-шаблон в виде строки.
* `templateUrl`: путь к отдельному `.html` файлу.

> **Правило:** Если шаблон состоит из 1–2 строк, его можно оставить встроенным. Если он начинает разрастаться, выносите его в отдельный файл.

---

#### 11.11. Styles / Style URL

Для добавления изолированных CSS-стилей используются свойства:

* `styles`: массив строк со стилями.
* `styleUrl` (или `styleUrls`): путь к файлу стилей (наприм. `.css` / `.scss`).

Пример компонента с встроенным шаблоном и стилями:

```typescript
@Component({
  selector: 'ns-pony',
  template: '<div class="pony">My color is {{ color() }}</div>',
  styles: ['.pony { background-color: lightgray; }']
})
export class Pony {
  readonly color = input.required<string>();
}

```