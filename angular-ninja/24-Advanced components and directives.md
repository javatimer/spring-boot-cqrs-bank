# Продвинутые компоненты и директивы

## 24.1. Трансформация входных параметров

Начиная с Angular v16.1 появилась возможность преобразовывать входной параметр с помощью опции `transform` декоратора `@Input`. Разумеется, эта возможность также поддерживается функцией `input()`.

Она позволяет преобразовать значение, переданное во входной параметр, прежде чем оно будет сохранено во входном signal. Опция `transform` принимает функцию, которая получает значение в качестве аргумента и возвращает преобразованное значение. Поскольку наиболее распространённые случаи использования — преобразование строки в число или boolean, Angular предоставляет для этого две встроенные функции из `@angular/core`: `numberAttribute` и `booleanAttribute`. 

Вот пример использования `booleanAttribute`:

```typescript
readonly disabled = input(false, { transform: booleanAttribute });
```

Это преобразует переданное во входной параметр значение в boolean, благодаря чему следующий код будет работать:

```html
<ns-button disabled />
<ns-button disabled="true" />
<!-- До этого корректно работал только следующий вариант -->
<ns-button [disabled]="true" />
```

Функция `numberAttribute` работает аналогичным образом, но преобразует значение в число.

```typescript
readonly value = input(0, { transform: numberAttribute });
```

Также можно определить резервное значение на случай, если входное значение не является корректным числом (по умолчанию используется `NaN`):

```typescript
readonly value = input(0, { transform: (value: unknown) => numberAttribute(value, 42) });
```

Теперь это можно использовать следующим образом:

```html
<ns-value value="42" />
<ns-value value="not a number" />
<!-- До этого корректно работал только следующий вариант -->
<ns-value [value]="42" />
```

## 24.2. Запросы представления: `viewChild`

В главе, посвящённой шаблонам, мы говорили об удобной возможности под названием «локальные переменные», которая позволяет получить ссылку на DOM-элемент в шаблоне. Например, с их помощью можно легко установить фокус на input при нажатии кнопки:

```html
<input #myInput />
<button (click)="myInput.focus()">Focus</button>
```

Мы также видели эту возможность в главе, посвящённой формам, например, когда нам требовалось получить ссылку на конкретную директиву:

```html
<input name="login" [(ngModel)]="user.login" required #loginCtrl="ngModel" />
@if (loginCtrl.touched && loginCtrl.hasError('required')) {
  <div>The login field is required</div>
}
```

Но что делать, если эти ссылки нужны нам в коде компонента, а не только в шаблоне? Здесь на сцену выходят **«запросы представления» (view queries)**, которые могут нас выручить!

Например, мы можем захотеть установить фокус на input сразу после отображения компонента. Для этого нужно получить ссылку на input с помощью функции `viewChild`.

```typescript
@Component({
  selector: 'ns-login',
  template: `<input #loginInput name="login" [(ngModel)]="credentials.login" required />`,
  imports: [FormsModule]
})
export class Login implements AfterViewInit {
  protected readonly credentials = { login: '' };

  readonly loginInput = viewChild.required<ElementRef<HTMLInputElement>>('loginInput');

  ngAfterViewInit(): void {
    this.loginInput().nativeElement.focus();
  }
}
```

> Функции `viewChild` и `viewChild.required` — это современные, основанные на signals альтернативы декоратору `@ViewChild`, точно так же как `input` и `input.required` являются современными, основанными на signals альтернативами декоратору `@Input`. 

Мы объявляем поле с именем `loginInput` и инициализируем его с помощью `viewChild.required`. Эта функция принимает в качестве параметра селектор: здесь мы используем локальную переменную, объявленную в нашем шаблоне. Функция сообщает фреймворку, что ему необходимо выполнить поиск в шаблоне и найти элемент с таким именем локальной переменной. Signal будет инициализирован этим элементом типа `ElementRef<T>`. У этого типа есть только одно поле — `nativeElement` типа `T`, которое является ссылкой на соответствующий DOM-элемент. 

В этом примере также демонстрируется удобное использование lifecycle-метода `ngAfterViewInit`. Этот метод вызывается сразу после создания представления, поэтому можно быть уверенным, что элемент, которого мы ждём, уже существует. Если попытаться сделать то же самое в конструкторе или в `ngOnInit`, это не сработает. Существует также другой метод — `ngAfterViewChecked`, который вызывается каждый раз при проверке представления (после каждого запуска change detection). 

Если такая функциональность понадобится во множестве разных компонентов, вместо дублирования кода в каждом компоненте можно создать директиву.

```typescript
@Directive({
  selector: '[nsFocus]'
})
export class Focus implements AfterViewInit {
  ngAfterViewInit(): void {
  }
}
```

Пока эта директива ничего не делает, но использовать её в шаблоне можно следующим образом:

```html
<input nsFocus />
```

Директиве необходимо получить доступ к host-элементу, чтобы установить на нём фокус. Здесь как раз полезен `ElementRef`, поскольку его можно внедрить в нашу директиву:

```typescript
@Directive({
  selector: '[nsFocus]'
})
export class Focus implements AfterViewInit {
  protected readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  ngAfterViewInit(): void {
    this.element.nativeElement.focus();
  }
}
```

И всё готово: использование этой директивы установит фокус на её host-элемент! 

Вернёмся к функции `viewChild`: она также может принимать тип в качестве селектора.

Например, в главе, посвящённой формам, мы видели, что для отправки формы в template-driven подходе можно использовать двустороннее связывание либо получить ссылку на форму и передать её значение в метод `submit`:

```html
<form (ngSubmit)="authenticate(form.value)" #form="ngForm">
  <!-- ... -->
</form>
```

Но для этого можно использовать и `viewChild`:

```typescript
@Component({
  selector: 'ns-login',
  template: `
    <form (ngSubmit)="authenticate()">
      <!-- ... -->
    </form>
  `,
  imports: [FormsModule]
})
export class LoginForm {
  readonly credentialsForm = viewChild.required(NgForm);

  protected authenticate(): void {
    if (this.credentialsForm().valid) {
      console.log(this.credentialsForm().value);
    }
  }
}
```

Преимущество `viewChild` заключается в том, что это **динамический запрос**: он всегда остаётся актуальным относительно шаблона. Если запрошенный элемент уничтожается, значение signal становится `undefined`. 

У этой функции есть также близнец под названием `viewChildren`. В отличие от `viewChild`, который получает ссылку на один элемент, соответствующий селектору (первый, если таких элементов несколько), `viewChildren` получает ссылки на **все** подходящие элементы.

Предположим, у нас есть `Race`, отображающий список `Pony`. Мы можем легко получать уведомление каждый раз, когда `Pony` добавляется или удаляется:

```typescript
@Component({
  selector: 'ns-race',
  templateUrl: './race.html',
  imports: [Pony]
})
export class Race {
  readonly raceModel = input.required<RaceModel>();
  readonly ponies = viewChildren(Pony);

  constructor() {
    effect(() => {
      console.log(this.ponies().length);
    });
  }
}
```

## 24.3. Контент: `ng-content`

Ещё одна распространённая задача, с которой мы часто сталкиваемся как разработчики, — возможность создавать UI-компоненты, содержимое которых может быть динамическим.

Например, предположим, что мы хотим создать компонент «card», используя CSS-фреймворк Bootstrap. Шаблон такой карточки выглядит следующим образом:

```html
<div class="card">
  <div class="card-body">
    <h4 class="card-title">Card title</h4>
    <p class="card-text">Some quick example text</p>
  </div>
</div>
```

Конечно, можно дублировать этот HTML каждый раз, когда он понадобится в приложении. Но, вероятно, ты уже думаешь о создании компонента. В карточке есть две динамические части — заголовок и содержимое, поэтому, скорее всего, получится что-то вроде этого:

```typescript
@Component({
  selector: 'ns-card',
  template: `
    <div class="card">
      <div class="card-body">
        <h4 class="card-title">{{ title() }}</h4>
        <p class="card-text">{{ text() }}</p>
      </div>
    </div>
  `
})
export class Card {
  readonly title = input('');
  readonly text = input('');
}
```

А затем использовать его так:

```html
<ns-card title="Card title" text="Some quick example text" />
```

Это прекрасно работает. Но, присмотревшись внимательнее к нашим требованиям, мы понимаем, что содержимое карточки также может быть сложным HTML, а не просто текстом, что поддерживается Bootstrap!

Разумеется, Angular предусмотрел и это: благодаря `<ng-content>` легко «передать» HTML дочернему компоненту.

`ng-content` — это специальный тег, который можно использовать в шаблонах для включения HTML, предоставленного родительским компонентом:

```html
<div class="card">
  <div class="card-body">
    <h4 class="card-title">{{ title() }}</h4>
    <p class="card-text">
      <ng-content />
    </p>
  </div>
</div>
```

Теперь компонент можно использовать следующим образом:

```html
<ns-card title="Card title"> Some quick <strong>example</strong> text </ns-card>
```

Позже мы понимаем, что заголовок также может содержать сложный HTML. Конечно, существует способ передавать в компонент карточки несколько частей содержимого, используя несколько `ng-content` с селектором.

```html
<div class="card">
  <div class="card-body">
    <h4 class="card-title">
      <ng-content select="[title]"></ng-content>
    </h4>
    <p class="card-text">
      <ng-content select="[content]"></ng-content>
    </p>
  </div>
</div>
```

И использовать его так:

```html
<ns-card>
  <span title>Card <strong>title</strong></span>
  <p content>Some quick <strong>example</strong> text</p>
</ns-card>
```

В результате получится:

```html
<div class="card">
  <div class="card-body">
    <h4 class="card-title">
      <span title>Card <strong>title</strong></span>
    </h4>
    <p class="card-text">
      <p content>Some quick <strong>example</strong> text</p>
    </p>
  </div>
</div>
```

Начиная с Angular v18 появилась возможность определить **резервное содержимое**, которое будет использоваться, если родительский компонент не передал никакого содержимого:

```html
<div class="card">
  <div class="card-body">
    <h4 class="card-title">
      <ng-content select="[title]">Default title</ng-content>
    </h4>
    <p class="card-text">
      <ng-content select="[content]"></ng-content>
    </p>
  </div>
</div>
```

## 24.4. Запросы содержимого: `contentChild`

Когда мы используем такие теги `ng-content`, спроецированное содержимое не будет найдено с помощью `viewChild` или `viewChildren`. Для такого содержимого необходимо использовать две другие функции: `contentChild` и `contentChildren`. 

Предположим, что мы создаём ещё один UI-компонент на основе Bootstrap — на этот раз компонент «tabs». Согласно документации Bootstrap, HTML должен выглядеть так:

```html
<ul class="nav nav-tabs">
  <li class="nav-item">
    <a class="nav-link">Races</a>
  </li>
  <li class="nav-item">
    <a class="nav-link">About</a>
  </li>
</ul>
```

Но мы хотели бы предоставить нашей команде более удобный компонент, примерно такой:

```html
<ns-tabs>
  <ns-tab title="Races" />
  <ns-tab title="About" />
</ns-tabs>
```

Нам нужен внешний компонент `Tabs`, который должен определить, сколько `ns-tab` находится внутри шаблона компонента, пройтись по каждому из них и сгенерировать соответствующую разметку.

Для начала создадим директиву `Tab`:

```typescript
@Directive({
  selector: 'ns-tab'
})
export class Tab {
  readonly title = input('');
}
```

Директива пока практически ничего не делает: у неё есть только input для получения заголовка вкладки. Обрати внимание, что в качестве селектора мы используем элемент `ns-tab`.

Теперь нам нужно создать `Tabs`:

```typescript
@Component({
  selector: 'ns-tabs',
  template: `
    <ul class="nav nav-tabs">
      @for (tab of tabs(); track tab) {
        <li class="nav-item">
          <a class="nav-link">{{ tab.title() }}</a>
        </li>
      }
    </ul>
  `,
  imports: []
})
export class Tabs {
  readonly tabs = contentChildren(Tab);
}
```

Как видишь, шаблон перебирает массив вкладок, чтобы создать элемент `li` для каждой из них. Но откуда берётся этот массив `tabs`? Как компонент узнаёт о двух директивах `ns-tab`, встроенных внутрь компонента `ns-tabs`? Именно это и позволяет сделать функция `contentChildren`.

Чтобы получить список вкладок, нужно использовать `contentChildren`, передав ей `Tab` в качестве параметра. В результате мы получаем массив вкладок, который можно использовать в цикле `for`. Поскольку каждый элемент этого списка является `Tab`, мы можем обратиться к его публичному свойству `title` и отобразить заголовок вкладки!

Обрати внимание: если по какой-либо причине у нас будет такой шаблон:

```html
<ns-tabs>
  <div>
    <ns-tab title="Races" />
  </div>
  <ns-tabgroup>
    <ns-tab title="About" />
  </ns-tabgroup>
</ns-tabs>
```

Тогда массив `Tab` будет содержать только первую `Tab`. Дело в том, что `contentChild` и `contentChildren` ищут только **прямых потомков** и останавливаются на компоненте `ns-tabgroup`.

Если мы хотим, чтобы наш компонент продолжал работать и в таком случае, можно передать в `contentChildren` специальную опцию:

```typescript
@Component({
  selector: 'ns-tabs',
  template: `
    <ul class="nav nav-tabs">
      @for (tab of tabs(); track tab) {
        <li class="nav-item">
          <a class="nav-link">{{ tab.title() }}</a>
        </li>
      }
    </ul>
  `,
  imports: []
})
export class TabsWithDescendants {
  readonly tabs = contentChildren(Tab, { descendants: true });
}
```

Теперь он снова найдёт все `Tab`!

Свойство `tabs` является signal, поэтому мы также можем получать уведомления об изменениях, как мы уже видели в случае с `viewChildren`. И снова значение signal недоступно в конструкторе компонента или даже в `ngOnInit`. Чтобы убедиться, что содержимое уже можно получить, используйте lifecycle hook `ngAfterContentInit`. Также можно использовать `ngAfterContentChecked`, который вызывается каждый раз при проверке содержимого.

Попробуй наше упражнение [Advanced components](https://angular-exercises.ninja-squad.com/exercises/32/advanced-components)! В нём ты создашь компонент с `ng-content`!

## 24.5. Условная проекция содержимого и контекстная проекция: `ng-template` и `ngTemplateOutlet`

`ng-content` не подходит, если ты хочешь вставить динамический HTML-контент внутрь своего шаблона **условно, в цикле или с передачей некоторого контекста**.

Рассмотрим достаточно простой пример. Мы хотим создать компонент progress bar. Этот компонент принимает минимальное значение, максимальное значение и текущее значение, вычисляет процент и отображает его внутри progress bar.

Начнём с каркаса нашего компонента:

```typescript
export class Progress {
  readonly min = input(0);
  readonly max = input(100);
  readonly value = input.required<number>();
  protected readonly percentage = computed(() => (100 * (this.value() - this.min())) / (this.max() - this.min()));
}
```

И его шаблона:

```html
<div class="progress">
  <div
    class="progress-bar"
    role="progressbar"
    [style.width.%]="percentage()"
    [ariaValueNow]="value()"
    [ariaValueMin]="min()"
    [ariaValueMax]="max()"
  >
  </div>
</div>
```

Пока ничего нового.

Но мы также хотели бы отображать значение процента внутри компонента. И пользователь компонента должен иметь возможность настроить способ отображения этого процента.

Поэтому внутри шаблона мы хотим получить что-то вроде следующего, где formatter — это то, что пользователь компонента может передать в качестве input:

```html
<div class="progress">
  <div
    class="progress-bar"
    role="progressbar"
    [style.width.%]="percentage()"
    [ariaValueNow]="value()"
    [ariaValueMin]="min()"
    [ariaValueMax]="max()"
  >
    @if (formatter(); as f) {
      <span>
      </span>
    } @else {
      {{ percentage() | number }}%
    }
  </div>
</div>
```

Этот formatter не является значением. Это также не функция, поскольку пользователь должен иметь возможность форматировать значение с помощью HTML, дополненного возможностями Angular.

Такой фрагмент HTML с возможностями Angular, который можно передавать и вставлять в любое место, в Angular моделируется с помощью `<ng-template>`. Его аналогом в TypeScript является объект типа `TemplateRef`.

В данном случае задача formatter — отображать процент. Поэтому ему нужен контекст рендеринга, содержащий этот процент. Этот контекст рендеринга является generic-типом `TemplateRef`, который компонент будет принимать в качестве input.

```typescript
interface ProgressContext {
  percentage: number;
}

export class Progress {
  // ...
  readonly formatter = input<TemplateRef<ProgressContext>>();
  protected readonly formatterContext = computed<ProgressContext>(() => ({
    percentage: this.percentage()
  }));
}
```

Теперь как вставить этот `TemplateRef` в шаблон компонента и передать ему его контекст? Именно для этого нужна структурная директива `*ngTemplateOutlet`. Использовать её можно так:

```html
@if (formatter(); as f) {
  <span>
    <ng-container *ngTemplateOutlet="f; context: formatterContext()" />
  </span>
} @else {
  {{ percentage() | number }}%
}
```

Наконец, как пользователь может использовать этот компонент progress и передать formatter? Просто определить элемент `<ng-template>`, присвоить ему переменную и передать эту переменную в input `formatter` компонента progress.

Внутри `<ng-template>` мы, конечно, можем обращаться ко всем свойствам текущего компонента. Но также можем обращаться к элементам контекста, переданного компонентом progress, используя странный синтаксис `let-p="percentage"`. `p` — это просто псевдоним для элемента контекста с именем `percentage` (мы могли бы выбрать любое другое имя псевдонима, например `let-progress="percentage"`).

```html
<!-- without formatter -->
<ns-progress [value]="75" />

<!-- with formatter -->
<ng-template #myFormatter let-p="percentage"><strong>Your</strong> progress: {{ p | number }}%</ng-template>
<ns-progress [value]="75" [formatter]="myFormatter" />
```

Если внутри интерфейса контекста мы назовём свойство `$implicit` (вместо `percentage`, как в нашем примере), тогда для доступа к этому свойству можно просто использовать `let-p`, вместо `let-p="percentage"`.

На самом деле именно так работают структурные директивы. Все директивы, которые мы используем с `*`, например `ngIf` или `ngFor`, имеют `<ng-template>` в качестве host-элемента. Angular определяет **микросинтаксис** для структурных директив, который позволяет объявлять директиву на `<ng-template>` в компактной форме.

Возьмём в качестве примера `ngFor` (`ngFor` — это директива, которую мы использовали до появления `@for`). Когда мы пишем простой `ngFor`:

```html
<div *ngFor="let pony of ponies; i as index">
  {{ i }} - {{ pony }}
</div>
```

Это эквивалентно следующему шаблону:

```html
<ng-template ngFor [ngForOf]="ponies" let-pony let-i="index">
  <div>{{ i }} - {{ pony }}</div>
</ng-template>
```

Конечно, второй вариант менее читаем. Именно поэтому мы всегда используем `*ngFor`. Но он показывает, что на самом деле Angular сам использует этот паттерн на основе `ng-template`! `ngFor` — это всего лишь директива, применённая к `ng-template`, с input `ngForOf`, ожидающим коллекцию, и контекстом, содержащим свойство `$implicit` с текущим элементом и другие свойства, например индекс.

Этот паттерн довольно мощный и очень помогает при создании настраиваемых компонентов.

## 24.6. Слушатель событий host-элемента

При написании директивы довольно часто возникает необходимость взаимодействовать с host-элементом.

Рассмотрим простой пример: заказчик хочет легко очищать содержимое некоторых текстовых input, делая по ним двойной щелчок. Это как раз то поведение, которое можно инкапсулировать в пользовательской директиве, назовём её `InputClear`. Её селектором будет атрибут, например `nsInputClear`. Когда этот атрибут добавлен к элементу, мы хотим отслеживать событие двойного щелчка на этом host-элементе.

> Этот пример простой, но не слишком реалистичный. Более реалистичным (но и более сложным) применением этой возможности было бы, например, отображение tooltip или popover при наведении или нажатии на элемент.

Создадим директиву:

```typescript
@Directive({
  selector: '[nsInputClear]',
})
export class InputClear {
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef);
}
```

И используем нашу директиву следующим образом:

```html
<input nsInputClear />
```

Теперь нам нужно реагировать на событие `dblclick` нашего host-элемента (в данном случае `input`) и очищать его значение.

Здесь можно использовать metadata `host` в декораторе `@Component`. Синтаксис практически идентичен тому, который мы использовали бы в шаблоне:

```typescript
host: {
  '(eventtype)': 'statement()'
}
```

В нашем случае можно написать:

```typescript
@Directive({
  selector: '[nsInputClear]',
  host: {
    '(dblclick)': 'clearContent()'
  }
})
export class InputClear {
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef);

  protected clearContent(): void {
    this.element.nativeElement.value = '';
  }
}
```

Теперь каждый раз, когда на host-элементе возникает событие `dblclick`, директива будет очищать input.

Обрати внимание, что также можно отслеживать глобальные события, например `window:resize`:

```typescript
@Directive({
  selector: '[nsWindowResize]',
  host: {
    '(window:resize)': 'resize($event)'
  }
})
export class WindowResize {
  protected resize(event: Event): void {
    const innerWidth = (event.target as Window).innerWidth;
    console.log(`The screen is being resized to ${innerWidth}`);
  }
}
```

Другой способ добиться того же результата — пометить метод директивы декоратором `@HostListener`. Это был рекомендуемый способ в предыдущих версиях Angular, но теперь предпочтительным вариантом являются host metadata.

## 24.7. Привязка свойств host-элемента

Нам часто требуется автоматически добавлять CSS-класс или стиль либо связывать определённое DOM-свойство с host-элементом директивы или компонента. Как мы только что увидели, host metadata позволяют объявлять event bindings для host-элемента. Те же host metadata можно использовать и для объявления property bindings.

Предположим, мы хотим добавлять определённый CSS-класс (`is-required`) к input, если у этого input есть определённая ошибка валидации (`required`). Возможно, этот класс добавляет красивую рамку вокруг input или небольшую звёздочку — это не так важно. Само поле при этом никак дополнительно не валидируется: мы просто берём результат встроенной валидации Angular Forms и используем его для стилизации input.

И снова это задача, которая отлично подходит для директивы:

```typescript
@Directive({
  selector: '[nsAddClassIfRequired]',
})
export class AddClassIfRequired {
}
```

Мы будем использовать её в Angular-форме с управлением из кода:

```html
<input formControlName="firstName" nsAddClassIfRequired />
```

или в template-driven форме:

```html
<input [(ngModel)]="user.name" required nsAddClassIfRequired>
```

Теперь нам нужно получить в директиве ссылку на состояние input. Angular автоматически выполняет валидацию полей и добавляет ошибку `required`, если поле обязательное и не заполнено.

Здесь нам поможет мощная система dependency injection! Можно попросить Angular внедрить в директиву другую директиву, применённую к тому же host-элементу или одному из его предков.

Поскольку мы хотим, чтобы наша директива работала с `FormControlName` или `NgModel`, мы могли бы попросить Angular внедрить оба этих типа. Но это приведёт к проблеме: доступен будет только один из них (поскольку обычно для конкретного input используется либо один, либо другой), а Angular выдаст ошибку, если зависимость невозможно предоставить.

Есть специальный приём, позволяющий Angular продолжить работу, даже если зависимость недоступна: декоратор `Optional`.

То есть можно сделать так:

```typescript
private readonly formControl = inject(FormControlName, { optional: true });
private readonly ngModel = inject(NgModel, { optional: true });
```

Но можно сделать ещё лучше. Обе эти директивы наследуются от одного базового класса: `NgControl`. Поэтому вместо внедрения одной или другой мы можем просто попросить Angular предоставить нам общий `NgControl`:

```typescript
@Directive({
  selector: '[nsAddClassIfRequired]',
})
export class AddClassIfRequired {
  private readonly control = inject(NgControl);
}
```

Теперь, когда у нас есть ссылка на `NgControl`, легко узнать, есть ли у поля ошибка `required`, используя его метод `hasError()`. Последний шаг — добавить класс `is-required` к нашему host-элементу, если это так.

Именно здесь нам пригодится property binding для host. И снова синтаксис практически идентичен синтаксису, который мы использовали бы в шаблоне:

```typescript
host: {
  '[prop]': 'expression'
}
```

Это автоматически обновляет свойство `prop` host-элемента каждый раз, когда изменяется `expression`.

В нашем случае у нас нет поля, к которому можно было бы выполнить binding. Но мы можем определить getter, возвращающий `true` или `false` в зависимости от ошибки control:

```typescript
@Directive({
  selector: '[nsAddClassIfRequired]',
  host: {
    '[class.is-required]': 'isRequired'
  }
})
export class AddClassIfRequired {
  private readonly control = inject(NgControl);

  protected get isRequired(): boolean {
    return this.control.hasError('required');
  }
}
```

Эти несколько строк кода действительно очень мощные: каждый раз, когда директива используется в форме, Angular автоматически добавляет или удаляет наш пользовательский класс в зависимости от нового значения, введённого пользователем!

Таким же образом можно выполнять binding и других типов свойств, а не только CSS-классов. Например, некоторые библиотеки компонентов используют этот механизм для добавления accessibility-атрибутов (`aria.xxx`) к host-элементу.

Обрати внимание: наша директива использует пользовательский селектор, но если ты решишь применять эти директивы ко всем input, можно изменить селектор на `input`, и тогда они автоматически будут применяться ко всем input в приложении.

Ещё один способ добиться того же результата — пометить свойство декоратором `@HostBinding`. Это был рекомендуемый способ в предыдущих версиях Angular, но теперь предпочтительным вариантом являются host metadata.

## 24.8. Манипуляции с DOM с помощью `afterEveryRender` и `afterNextRender`

В Angular 16.2 были добавлены две новые функции: `afterEveryRender` и `afterNextRender`. Это не традиционные lifecycle hooks, реализованные как методы компонента. Вместо этого это функции, которые компонент может вызвать в любой момент, чтобы зарегистрировать функцию, которая должна выполняться каждый раз (`afterEveryRender`) или в следующий раз (`afterNextRender`), когда Angular обновит DOM всего приложения.

Поэтому они полезны для манипуляций с DOM. Например, если какой-то обработчик события изменяет состояние приложения, что в свою очередь влияет на DOM, и ты хочешь применить какое-либо преобразование к этому новому DOM, вызов `afterNextRender` внутри обработчика события будет хорошим способом сделать это.

Но будь осторожен: эти функции, как и `inject`, являются **contextual functions**. Если ты вызываешь их из конструктора, необходимо передать injector компонента в качестве опции.

Вот пример использования `afterNextRender`: при нажатии кнопки мы отображаем input для ввода имени нового пони. Как только input появляется в DOM, ему необходимо сразу установить фокус. Конечно, простого присваивания boolean-значению `true` недостаточно, чтобы input появился немедленно. Нужно дождаться, пока Angular отрендерит DOM, и только после этого обращаться к input и устанавливать на него фокус.

Использование `afterNextRender` идеально подходит для этой задачи. А поскольку мы вызываем его не из конструктора, нам необходимо передать injector, связанный с компонентом, который был внедрён в конструктор.

```typescript
@Component({
  selector: 'ns-new-pony',
  template: `
    <button (click)="showPonyForm()">New pony</button>
    @if (ponyFormDisplayed()) {
      <label for="pony-name">New pony name:</label>
      <input id="pony-name" #ponyName />
    }
  `
})
export class NewPony {
  protected readonly ponyFormDisplayed = signal(false);
  readonly ponyName = viewChild<ElementRef<HTMLInputElement>>('ponyName');

  private readonly injector = inject(Injector);

  protected showPonyForm() {
    // display the form
    this.ponyFormDisplayed.set(true);
    // and give the focus to the new input once the DOM is rendered
    afterNextRender(() => this.ponyName()!.nativeElement.focus(), { injector: this.injector });
  }
}
```

Ещё одна особенность этих функций заключается в том, что callback, переданный им, **никогда не выполняется на сервере**, когда используется Server-Side Rendering (SSR). Поэтому если тебе необходимо выполнять код только на клиенте — например, потому что он обращается к `window` или другому API, недоступному на сервере, — хорошим решением будет поместить этот код внутрь функции, переданной в `afterNextRender()`. 
