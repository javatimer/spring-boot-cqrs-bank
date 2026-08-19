Вот перевод десятой главы на русский язык:

---

### Синтаксис шаблонов

Мы уже видели, что каждому компоненту необходимо представление (view). Чтобы его определить, вы можете разместить шаблон прямо в TS-файле (inline) или вынести в отдельный файл. Вам, вероятно, уже знаком синтаксис шаблонов — возможно, даже из AngularJS 1.x. Если упростить, шаблон помогает генерировать HTML с динамическими вставками на основе имеющихся данных.

У Angular есть собственный синтаксис шаблонов, который нам необходимо освоить, прежде чем двигаться дальше.

Давайте рассмотрим простой пример, немного изменив наш первый компонент:

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'ns-root',
  template: '<h1>PonyRacer</h1>'
})
export class App {}

```

Теперь мы хотим отобразить динамические данные — например, количество зарегистрированных пользователей. Позже мы узнаем, как получать данные с сервера, но пока захардкодим это значение прямо в классе:

```typescript
@Component({
  selector: 'ns-root',
  template: '<h1>PonyRacer</h1>'
})
export class App {
  protected readonly numberOfUsers = 146;
}

```

Как же изменить шаблон, чтобы вывести эту переменную? Ответ — интерполяция.

---

### 10.1. Интерполяция

Интерполяция — умное слово для простейшей концепции.

Быстрый пример:

```typescript
@Component({
  selector: 'ns-root',
  template: `
    <h1>PonyRacer</h1>
    <h2>{{ numberOfUsers }} users</h2>
  `
})
export class App {
  protected readonly numberOfUsers = 146;
}

```

У нас есть компонент `App`, который срабатывает каждый раз, когда Angular находит тег `<ns-root>`. Класс `App` имеет свойство `numberOfUsers`. А в шаблон мы добавили тег `<h2>` со знаменитыми двойными фигурными скобками (их ещё называют «усами» / *mustaches*), указывающими на то, что выражение внутри них нужно вычислить.

В итоге в браузере отобразится:

```html
<ns-root>
  <h1>PonyRacer</h1>
  <h2>146 users</h2>
</ns-root>

```

так как `{{ numberOfUsers }}` будет заменено своим значением.

Когда Angular находит элемент `<ns-root>`, он создаёт экземпляр класса `App`, и этот экземпляр становится контекстом вычисления для выражений в шаблоне.

В предыдущей главе мы увидели, что Angular теперь рекомендует использовать сигналы для точного отслеживания изменений. Если мы хотим, чтобы количество пользователей менялось со временем, нам следует хранить его в сигнале и вызывать этот сигнал в шаблоне:

```typescript
@Component({
  selector: 'ns-root',
  template: `
    <h1>PonyRacer</h1>
    <h2>{{ numberOfUsers() }} users</h2>
  `
})
export class App {
  protected readonly numberOfUsers = signal(146);
}

```

> **Важный факт:** если попытаться отобразить переменную со значением `undefined` или `null`, Angular вместо слова `undefined` или `null` выведет пустую строку.

Допустим, вместо простого числа компонент содержит более сложный объект текущего пользователя:

```typescript
@Component({
  selector: 'ns-root',
  template: `
    <h1>PonyRacer</h1>
    <h2>Welcome {{ user().name }}</h2>
  `
})
export class App {
  protected readonly user = signal({ name: 'Cédric' });
}

```

В интерполяции можно использовать и более сложные выражения — например, доступ к свойствам объекта. В браузере мы увидим: `Welcome Cédric`.

Что произойдёт, если допустить опечатку и обратиться к несуществующему свойству?

```typescript
@Component({
  selector: 'ns-root',
  // опечатка: users вместо user!
  template: `
    <h1>PonyRacer</h1>
    <h2>Welcome {{ users().name }}</h2>
  `
})
export class App {
  protected readonly user = signal({ name: 'Cédric' });
}

```

При компиляции приложения вы получите ошибку TypeScript:

`error TS2339: Property 'users' does not exist on type 'App'`

Это отлично, так как обеспечивает строгую проверку корректности ваших шаблонов ещё на этапе сборки.

А что, если объект пользователя загружается с сервера и до момента получения ответа равен `undefined`? Есть ли способ избежать ошибок компиляции и выполнения?

Да! Вместо `user().name` следует использовать оператор опциональной цепочки (`?.`): `user()?.name`.

```typescript
@Component({
  selector: 'ns-root',
  template: `
    <h1>PonyRacer</h1>
    <h2>Welcome {{ user()?.name }}</h2>
  `
})
export class App {
  protected readonly user = signal<{ name: string } | undefined>(undefined);
}

```

И ошибки больше не будет!

Вернемся к нашему примеру. Теперь мы умеем выводить приветствие. Давайте сделаем шаг вперед и отобразим список предстоящих гонок пони. Для этого создадим второй компонент:

```typescript
// в отдельном файле races.ts
import { Component } from '@angular/core';

@Component({
  selector: 'ns-races',
  template: `<h2>Races</h2>`
})
export class Races {}

```

---

### 10.2. Использование других компонентов в шаблонах

Теперь мы хотим включить компонент `Races` в шаблон нашего главного компонента `App`.

```typescript
// в app.ts
import { Component } from '@angular/core';

@Component({
  selector: 'ns-root',
  template: `
    <h1>PonyRacer</h1>
    <ns-races />
  `
})
export class App {}

```

Мы добавили тег `<ns-races />`, имя которого совпадает с селектором компонента. **Но это пока не сработает!** Браузер ничего не отобразит, потому что Angular ещё не знает о существовании компонента `Races`.

Решение простое: нужно добавить `Races` в массив `imports` декоратора `App`.

```typescript
import { Component } from '@angular/core';
import { Races } from './races'; // Не забудьте импортировать класс!

@Component({
  selector: 'ns-root',
  template: `
    <h1>PonyRacer</h1>
    <ns-races />
  `,
  imports: [Races] // Добавляем Races в imports
})
export class App {}

```

Мы передаем класс напрямую, поэтому его нужно импортировать через ES-модули (`import`), а сам класс `Races` должен быть экспортирован (`export class Races`).

Теперь компонент успешно отобразится в браузере:

```html
<ns-root>
  <h1>PonyRacer</h1>
  <ns-races>
    <h2>Races</h2>
  </ns-races>
</ns-root>

```

---

### 10.3. Связывание свойств (Property binding)

Интерполяция — лишь один из способов сделать шаблон динамическим. По сути, интерполяция — это удобный синтаксический сахар для фундаментальной концепции Angular: **связывания свойств** (*property binding*).

В Angular запись в любое свойство DOM-элемента осуществляется с помощью специальных атрибутов, оборачиваемых в квадратные скобки `[]`.

> **Примечание:** Речь идет именно о **свойствах DOM-узла**, а не о **HTML-атрибутах**.
> В HTML `<input type="text" value="hello">` атрибут `value` всегда хранит первоначальное значение `'hello'`. Но соответствующее свойство DOM-узла (`HTMLInputElement.value`) динамически изменяется, когда пользователь вводит текст. Angular работает именно со свойствами DOM.

Интерполяция вида:

```html
<p>{{ user().name }}</p>

```

является синтаксическим сахаром для:

```html
<p [textContent]="user().name"></p>

```

Синтаксис с квадратными скобками позволяет изменить свойство DOM `textContent`, передавая выражение `user().name`, которое вычисляется в контексте компонента.

> **Обратите внимание:** Парсер чувствителен к регистру! Необходимо писать свойства точно так, как они называются в DOM (например, `textContent`, а не `textcontent`).

Также свойства DOM поддерживают булевы значения. В отличие от HTML-атрибутов (где наличие атрибута `<option selected="false">` всё равно сделает опцию выбранной), связывание свойств работает корректно:

```html
<option [selected]="isPonySelected()" value="Rainbow Dash">Rainbow Dash</option>

```

Опция будет выбрана только в том случае, если `isPonySelected()` вернет `true`.

#### Сравнение способов передачи значений:

* Динамическое выражение (предпочтительный вариант):
```html
<ns-pony [name]="pony().name" />

```


* Интерполяция в атрибуте:
```html
<ns-pony name="{{ pony().name }}" />

```


* Конкатенация строк в выражении:
```html
<ns-pony [name]="'Pony ' + pony().name" />

```


* Статическое строковое значение (без квадратных скобок):
```html
<ns-pony name="Rainbow Dash" />

```



Запомните правило: если атрибут **не оборен** в квадратные скобки (`name="..."`), передается статическая строка. Если **оборачивается** в скобки (`[name]="..."`), значение внутри воспринимается как выражение, вычисляемое Angular.

---

### 10.4. Связывание классов и стилей

#### 10.4.1. Добавление и удаление CSS-классов

Для управления CSS-классами используется синтаксис `[class]="expression"`. В качестве выражения можно передавать:

* массив имен классов (`['class1', 'class2']`);
* строку с классами через пробел (`'class1 class2'`);
* объект, где ключи — названия классов, а значения — boolean (`{ highlighted: true, faded: false }`).

Также доступен точечный синтаксис: `[class.foo]="booleanExpression"`.

Все 4 примера ниже дают одинаковый результат (элемент получит классы `card`, `highlighted` и `big`, но не `faded`):

```typescript
// 1. Передача массива
@Component({
  selector: 'ns-test1',
  template: '<div class="card" [class]="dynamicClasses()">Hello</div>'
})
class ClassBinding1 {
  protected readonly dynamicClasses = signal(['highlighted', 'big']);
}

// 2. Передача строки
@Component({
  selector: 'ns-test2',
  template: '<div class="card" [class]="dynamicClasses()">Hello</div>'
})
class ClassBinding2 {
  protected readonly dynamicClasses = signal('highlighted big');
}

// 3. Передача объекта
@Component({
  selector: 'ns-test3',
  template: '<div class="card" [class]="dynamicClasses()">Hello</div>'
})
class ClassBinding3 {
  protected readonly dynamicClasses = signal({
    highlighted: true,
    big: true,
    faded: false
  });
}

// 4. Точечный синтаксис (class.className)
@Component({
  selector: 'ns-test4',
  template: `
    <div class="card" 
         [class.highlighted]="isHighlighted()" 
         [class.big]="isBig()" 
         [class.faded]="isFaded()">
      Hello
    </div>
  `
})
class ClassBinding4 {
  protected readonly isHighlighted = signal(true);
  protected readonly isBig = signal(true);
  protected readonly isFaded = signal(false);
}

```

Статические классы (например, `class="card"`) автоматически объединяются с динамическими.

#### 10.4.2. Установка CSS-стилей

Управление стилями работает аналогично с помощью `[style]="expression"`:

```typescript
// 1. Передача строки стилей
@Component({
  selector: 'ns-test1',
  template: '<div style="background-color: white" [style]="dynamicStyles()">Hello</div>'
})
class StyleBinding1 {
  protected readonly dynamicStyles = signal('margin-top: 1rem; color: black');
}

// 2. Передача объекта со стилями
@Component({
  selector: 'ns-test2',
  template: '<div style="background-color: white" [style]="dynamicStyles()">Hello</div>'
})
class StyleBinding2 {
  protected readonly dynamicStyles = signal({
    'margin-top': '1rem',
    color: 'black'
  });
}

// 3. Установка отдельных свойств
@Component({
  selector: 'ns-test3',
  template: '<div style="background-color: white" [style.margin-top]="margin()" [style.color]="color()">Hello</div>'
})
class StyleBinding3 {
  protected readonly margin = signal('1rem');
  protected readonly color = signal('black');
}

// 4. Указание единиц измерения прямо в шаблоне (.rem, .px и т.д.)
@Component({
  selector: 'ns-test4',
  template: '<div style="background-color: white" [style.margin-top.rem]="margin()" [style.color]="color()">Hello</div>'
})
class StyleBinding4 {
  protected readonly margin = signal(1); // передаем число 1
  protected readonly color = signal('black');
}

```

---

### 10.5. События (Events)

Чтобы обрабатывать действия пользователя, Angular использует **связывание событий** с помощью круглых скобок `()`.

```html
<button (click)="onButtonClick()">Click me!</button>

```

Клик по кнопке вызовет метод `onButtonClick()` нашего компонента.

Обновим компонент `Races`:

```typescript
@Component({
  selector: 'ns-races',
  template: `
    <h2>Races</h2>
    <button (click)="refreshRaces()">Refresh the races list</button>
    <p>{{ races().length }} races</p>
  `
})
export class Races {
  protected readonly races = signal<Array<RaceModel>>([]);

  protected refreshRaces(): void {
    this.races.set([{ name: 'London' }, { name: 'Lyon' }]);
  }
}

```

Изначально отобразится `"0 races"`, а после клика на кнопку значение изменится на `"2 races"`.

Вы можете слушать как стандартные DOM-события (`click`, `keyup`, `mousemove`), так и **кастомные события** (пользовательские), генерируемые другими Angular-компонентами или Web Components:

```html
<ns-races (newRaceAvailable)="onNewRace()" />

```

#### Погружение и всплытие событий ($event):

События всплывают по DOM-дереву. Вы можете перехватывать объект события, передавая специальную переменную `$event`:

```html
<div (click)="onButtonClick($event)">
  <button>Click me!</button>
</div>

```

```typescript
onButtonClick(event: Event) {
  event.preventDefault();  // Отменить стандартное поведение
  event.stopPropagation(); // Остановить всплытие
}

```

#### Клавишные события:

Angular позволяет легко фильтровать нажатия клавиш:

```html
<textarea (keydown.space)="onSpacePress()">Press space!</textarea>

```

Можно даже создавать комбинации: `(keydown.alt.space)`.

> **Важное различие:**
> * `[property]="doSomething()"` — это **выражение** (expression). Оно вычисляется при каждом цикле проверки изменений (Change Detection).
> * `(event)="doSomething()"` — это **инструкция/утверждение** (statement). Оно выполняется **только** в момент наступления события.
> 
> 

---

### 10.6. Выражения (Expressions) против Инструкций (Statements)

| Выражения (`[property]="expr"`) | Инструкции (`(event)="stmt()"`) |
| --- | --- |
| Выполняются регулярно при отслеживании изменений. | Выполняются только при наступлении события. |
| Должны выполняться максимально быстро. | Могут содержать более тяжелые вычисления. |
| **Не должны иметь побочных эффектов** (запрещены присваивания: `user = 'Cédric'`). | **Должны иметь побочные эффекты** (меняют состояние приложения). |
| Запрещены ключевые слова (`if`, `var` и т.д.). | Могут содержать цепочки вызовов через `;` и присваивания. |

---

### 10.7. Локальные переменные шаблона

В шаблоне можно объявлять локальные переменные с помощью символа `#`. Они ссылаются на DOM-элементы или экземпляры компонентов, к которым привязаны.

#### 1. Чтение свойств DOM-элемента:

```html
<input type="text" #name>
<p>{{ name.value }}</p>

```

Переменная `#name` ссылается на объект `HTMLInputElement`, и мы можем читать его свойства в других частях шаблона.

#### 2. Вызов методов DOM-элемента:

```html
<input type="text" #name>
<button (click)="name.focus()">Focus the input</button>

```

#### 3. Взаимодействие с внешними компонентами / Web Components:

```html
<google-youtube #player></google-youtube>
<button (click)="player.play()">Play!</button>

```

---

### 10.8. Управление потоком (Control Flow Syntax: If, For, Switch)

Начиная с Angular v18, для изменения структуры DOM используется встроенный синтаксис управления потоком (вместо старых структурных директив `ngIf`, `ngFor`, `ngSwitch`).

#### 10.8.1. `@if`

```html
<div>
  @if (races().length === 0) {
    <h2>No races to come</h2>
  } @else if (races().length === 1) {
    <h2>Only one race to come</h2>
  } @else {
    <h2>Some races to come</h2>
  }
</div>

```

Вы также можете заалиасить значение в локальную переменную через `as`:

```html
@if (races().length; as raceCount) {
  <h2>{{ raceCount }} races to come</h2>
}

```

> **Совет для сигналов с `null` / `undefined`:**
> Так как сигнал является функцией, сужение типов TypeScript не всегда срабатывает внутри `@if (race())`.
> Решение — сохранить значение сигнала в переменную через псевдоним:
> ```html
> @if (race(); as raceValue) {
>   <h1>{{ raceValue.name }}</h1>
> }
> 
> ```
> 
> 

#### 10.8.2. `@for`

Для итерации по коллекциям используется инструкция `@for`. Внимание: она **требует** обязательного указания параметра `track` для оптимизации обновления DOM.

```html
<div>
  <h2>Races</h2>
  <ul>
    @for (race of races(); track race.id) {
      <li>{{ race.name }}</li>
    } @empty {
      <li>No races available</li>
    }
  </ul>
</div>

```

Внутри блока `@for` доступны контекстные переменные:

* `$index` — текущий индекс (начиная с 0);
* `$first` — `true`, если элемент первый;
* `$last` — `true`, если элемент последний;
* `$even` / `$odd` — `true` для четных / нечетных индексов.

Пример использования:

```html
<ul>
  @for (race of races(); track race.id; let isEven = $even) {
    <li [class.grey]="isEven">{{ race.name }}</li>
  }
</ul>

```

#### 10.8.3. `@switch`

```html
<div>
  @switch (races().length) {
    @case (0) {
      <h2>No races to come</h2>
    }
    @case (1) {
      <h2>Only one race to come</h2>
    }
    @default {
      <h2>Some races to come</h2>
    }
  }
</div>

```

#### 10.8.4. Автоматическая миграция

Если у вас есть старый код со структурными директивами, перевести его на новый синтаксис можно командой:

```bash
ng g @angular/core:control-flow

```

---

### 10.9. Переменные шаблона с помощью `@let`

Начиная с Angular v18.1, в шаблонах можно объявлять локальные переменные прямо "на лету" с помощью инструкции `@let`:

```html
@let countPlusTwo = count() + 2;
<p>{{ countPlusTwo }}</p>

```

Это невероятно удобно для упрощения сложных выражений внутри циклов:

```html
@for (user of users(); track user.id) {
  <div class="name">{{ user.lastName }} {{ user.firstName }}</div>
  <div class="address">
    @let address = user.shippingAddress.default;
    <span>{{ address.number }}&nbsp;</span>
    <span>{{ address.street }}&nbsp;</span>
    <span>{{ address.zipcode }}&nbsp;</span>
    <span>{{ address.city }}</span>
  </div>
}

```

---

### 10.10. Структурные директивы (устаревший подходы)

*(Данную секцию можно пропустить, если вы используете Angular v18 или новее. Устаревший синтаксис основывался на элементах `<ng-template>` и директивах `*ngIf`, `*ngFor`, `*ngSwitch`)*.


Вот перевод оставшейся части десятой главы на русский язык:

---

#### 10.10.1. NgIf

Мы можем захотеть отображать содержимое шаблона только при выполнении определенного условия. Для этого используется директива `ngIf`:

```html
<ng-template [ngIf]="races().length > 0">
  <div><h2>Races</h2></div>
</ng-template>

```

Фреймворк предоставляет ряд встроенных директив, таких как `ngIf`. Все они находятся в модуле `CommonModule`, о котором мы говорили ранее.

Поскольку стандартная запись с `<ng-template>` довольно громоздка, существует синтаксический сахар — синтаксис со звездочкой:

```html
<div *ngIf="races().length > 0"><h2>Races</h2></div>

```

Символ `*` указывает на то, что это **структурная директива**. Директива `ngIf` будет добавлять или удалять элемент `<div>` из DOM каждый раз, когда меняется значение массива `races()`.

Чтобы использовать эту директиву в standalone-компоненте, её нужно импортировать явно (`NgIf`) или импортировать целиком `CommonModule`:

```typescript
import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { RaceModel } from './race.model';

@Component({
  selector: 'ns-races',
  template: `<div *ngIf="races().length > 0"><h2>Races</h2></div>`,
  imports: [NgIf]
})
export class Races {
  protected readonly races = signal<Array<RaceModel>>([]);
}

```

Также можно использовать синтаксис `else` в комбинации с `<ng-template>`:

```typescript
@Component({
  selector: 'ns-races',
  template: `
    <div *ngIf="races().length > 0; else empty"><h2>Races</h2></div>
    <ng-template #empty><h2>No races.</h2></ng-template>
  `,
  imports: [NgIf]
})
export class Races {
  protected readonly races = signal<Array<RaceModel>>([]);
}

```

---

#### 10.10.2. NgFor

Работа с реальными данными неизбежно приводит к необходимости выводить списки. Для этого служит директива `NgFor`, которая создаёт экземпляр шаблона для каждого элемента коллекции:

```typescript
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RaceModel } from './race.model';

@Component({
  selector: 'ns-races',
  template: `
    <div *ngIf="races().length > 0">
      <h2>Races</h2>
      <ul>
        <li *ngFor="let race of races()">{{ race.name }}</li>
      </ul>
    </div>
  `,
  imports: [CommonModule]
})
export class Races {
  protected readonly races = signal<Array<RaceModel>>([
    { name: 'London' }, 
    { name: 'Lyon' }
  ]);
}

```

`NgFor` использует специальную микросинтаксическую запись. Вы также можете объявить локальную переменную для индекса элемента:

```html
<ul>
  <li *ngFor="let race of races(); index as i">{{ i }} - {{ race.name }}</li>
</ul>

```

Помимо `index`, директива экспортирует и другие полезные переменные:

* `first`: `true`, если элемент первый;
* `last`: `true`, если элемент последний;
* `even`: `true` для четных индексов;
* `odd`: `true` для нечетных индексов.

---

#### 10.10.3. NgSwitch

Эта директива позволяет переключать шаблоны на основе условий:

```html
<div [ngSwitch]="messageCount()">
  <p *ngSwitchCase="0">You have no message</p>
  <p *ngSwitchCase="1">You have a message</p>
  <p *ngSwitchDefault>You have some messages</p>
</div>

```

---

#### 10.10.4. Понимание структурных директив и их ограничений

> Этот раздел содержит углубленные сведения. Вы можете пропустить его, если просто хотите писать код, но он будет полезен для понимания того, *почему* в Angular v18 был внедрен новый встроенный синтаксис управления потоком (`@if`, `@for`, `@switch`).

##### Как структурные директивы работают "под капотом"

Структурные директивы изменяют структуру DOM. Они легко узнаваемы по символу `*`.

При компиляции Angular разбивает шаблон компонента на **представления** (*views*) — фрагменты шаблона с неизменяемой, стабильной HTML-структурой.

Когда вы пишете:

```html
<h1>Ninja Squad</h1>
<ul *ngIf="condition()">
  <li *ngFor="let user of users()">{{ user.name }}</li>
</ul>

```

Компилятор Angular разворачивает синтаксический сахар `*` в элементы `<ng-template>`:

```html
<h1>Ninja Squad</h1>
<ng-template [ngIf]="condition()">
  <ul>
    <ng-template ngFor [ngForOf]="users()" let-user>
      <li>{{ user.name }}</li>
    </ng-template>
  </ul>
</ng-template>

```

Каждый `<ng-template>` генерирует отдельное «представление». Для вставки этих представлений Angular использует специальные комментарии в DOM (`<!-- special comment -->`) и концепцию `ViewContainer`. Контейнер представлений управляет добавлением и удалением узлов в точке размещения специального комментария.

Пользовательские структурные директивы создаются путем внедрения сервисов `ViewContainerRef` (для создания/удаления представления) и `TemplateRef` (ссылки на сам `<ng-template>`).

##### Почему возникла необходимость в новом синтаксисе (`@if`, `@for`)?

Несмотря на гибкость, у классических структурных директив есть существенные недостатки:

1. **Неудобный синтаксис для альтернативных веток (`else`):** приходится создавать отдельный тег `<ng-template #elseBlock>` с локальной переменной.
2. **Проблемы с проверкой типов (Type-Checking):** компилятор TypeScript часто не способен корректно сузить типы данных внутри шаблонов с `*ngIf` и `*ngSwitch`.
3. **Сложность NgSwitch:** он состоит из 3 независимых директив (`NgSwitch`, `NgSwitchCase`, `NgSwitchDefault`), и компилятор не может проверить, используется ли `NgSwitchCase` в правильном контексте.
4. **Сложность восприятия:** синтаксис с записью `*` неинтуитивен для новичков.

Именно поэтому команда Angular разработала встроенный синтаксис управления потоком (`@if`, `@for`, `@switch`), который лишен этих недостатков и обеспечивает более качественную проверку типов.

---

### 10.11. Директивы шаблонов

В Angular есть множество других директив, не являющихся структурными. Например, ранее для управления классами и стилями использовались директивы `NgClass` и `NgStyle`. В современных версиях Angular они объявлены устаревшими (deprecated) в пользу прямого связывания `[class]` и `[style]`.

Для автоматической миграции устаревших `NgClass` и `NgStyle` в Angular 21 предусмотрены команды:

```bash
ng generate @angular/core:ngclass-to-class
ng generate @angular/core:ngstyle-to-style

```

---

### 10.12. Итоги

Система шаблонов Angular предоставляет выразительный синтаксис для описания динамической части HTML. Каждый инструмент имеет свой наглядный символ:

* `{{ }}` — **интерполяция**;
* `[ ]` — **связывание свойств** (Property binding);
* `( )` — **связывание событий** (Event binding);
* `#` — **объявление локальной переменной**;
* `@if / @for / @switch` — **управление потоком** (Control flow).

#### Полный практический пример компонента:

Давайте объединим всё изученное в компоненте `Ponies`, который выводит список пони с возможностью обновления и чередованием цвета строк:

```typescript
import { Component, signal } from '@angular/core';
import { PonyModel } from '../pony.model';

@Component({
  selector: 'ns-ponies',
  template: `
    <button (click)="refreshPonies()">Refresh</button>
    <ul>
      @for (pony of ponies(); track pony.id) {
        <li [style.color]="$even ? 'green' : 'black'">
          {{ pony.name }}
        </li>
      }
    </ul>
  `,
  imports: []
})
export class Ponies {
  protected readonly ponies = signal<Array<PonyModel>>([
    { id: 1, name: 'Rainbow Dash' },
    { id: 2, name: 'Pinkie Pie' }
  ]);

  protected refreshPonies(): void {
    this.ponies.set([
      { id: 3, name: 'Fluttershy' },
      { id: 4, name: 'Rarity' }
    ]);
  }
}

```

В этом примере наглядно продемонстрирован полный спектр возможностей синтаксиса шаблонов: обработка клика `(click)`, итерация `@for` с ключом `track`, условное форматирование через `[style.color]` с контекстной переменной `$even` и обновление данных через сигналы!
