### 20. Формы (Forms)

#### 20.1. Формы, любимые формы

Формы всегда были отточены до блеска в Angular. Это одна из фич, которую чаще всего демонстрировали еще в версии 1.x, и, поскольку формы есть практически в каждом приложении, она завоевала сердца множества разработчиков.

Формы — это сложно: нужно валидировать ввод пользователя, показывать ошибки, поля могут быть обязательными или нет, либо зависеть от других полей, нужно реагировать на изменения полей и т. д. Нам также необходимо тестировать эти формы, а в AngularJS 1.x это было невозможно сделать с помощью юнит-теста — всё сводилось к E2E-тестам, которые работали медленно. В Angular формам уделено такое же пристальное внимание, и фреймворк дает нам отличный способ для их написания. На самом деле даже несколько способов!

Вы можете написать форму, используя только директивы в вашем шаблоне — это подход **template-driven** (на основе шаблона). Из нашего опыта, он отлично подходит для простых форм без сложной валидации.

Другой подход — **code-driven** (на основе кода / реактивный), где вы описываете форму в коде вашего компонента, а затем используете директивы для связывания этой формы с инпутами/textarea/select в шаблоне. Он более громоздкий, но и более мощный, особенно если нужно добавить кастомную валидацию или генерировать динамические формы.

Давайте разберем один и тот же сценарий дважды, используя каждый из подходов, и увидим различия. Мы напишем простую форму для регистрации новых пользователей в нашем приложении PonyRacer. Нам понадобится базовый компонент для каждого случая, поэтому начнем с этого:

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'ns-register',
  template: `
    <h2>Sign up</h2>
    <form></form>
  `
})
export class RegisterForm {}

```

Ничего необычного: компонент с простым шаблоном, содержащим форму. В следующие несколько минут мы построим форму, позволяющую зарегистрировать пользователя с именем (`username`) и паролем (`password`).

Для обоих методов Angular создает внутреннее представление нашей формы.

В подходе **template-driven** это происходит практически автоматически: мы просто добавляем нужные директивы в шаблон, а фреймворк берет на себя создание представления формы.
В подходе **code-driven** мы создаем представление формы вручную, а затем связываем его с полями ввода с помощью директив.

Под капотом поле формы (например, `input` или `select`) в Angular представляется объектом `FormControl`. Это наименьшая часть формы, которая инкапсулирует состояние поля и его значение.

`FormControl` имеет несколько атрибутов:

* `valid`: `true`, если поле валидно с учетом примененных к нему правил и требований.
* `invalid`: `true`, если поле невалидно.
* `errors`: объект, содержащий ошибки поля.
* `dirty`: `false`, пока пользователь не изменил его значение.
* `pristine`: противоположность `dirty`.
* `touched`: `false`, пока пользователь не взаимодействовал с полем (не получил и не потерял фокус).
* `untouched`: противоположность `touched`.
* `value`: значение поля.
* `valueChanges`: `Observable`, генерирующий событие каждый раз, когда меняется значение контрола.
* `statusChanges`: `Observable`, генерирующий событие каждый раз, когда меняется статус контрола.
* `events`: `Observable`, генерирующий событие каждый раз, когда меняется состояние или значение контрола. Это было добавлено в Angular v18 и позволяет обрабатывать изменения значений, статуса, состояний `pristine`/`touched`, а также узнавать, когда форма была сброшена или отправлена.

Также он предоставляет методы вроде `hasError()`, чтобы проверить, есть ли у контрола конкретная ошибка.

Вы можете сделать что-то вроде этого:

```typescript
const password = new FormControl('');
console.log(password.dirty); // false, пока пользователь не введет значение
console.log(password.value); // '' пока пользователь не введет значение
console.log(password.hasError('required')); // false
password.disable(); // отключает контрол
password.reset(); // сбрасывает значение

```

Обратите внимание, что в конструктор можно передать аргумент, и этот аргумент станет начальным значением:

```typescript
const password = new FormControl('Cédric');
console.log(password.value); // выведет "Cédric"

```

Эти контролы можно объединять в `FormGroup`, чтобы представить часть формы и применить к ней отдельные правила валидации. Сама форма тоже является группой.

`FormGroup` имеет те же свойства, что и `FormControl`, но с некоторыми отличиями:

* `valid`: `true`, если все поля валидны.
* `invalid`: `true`, если хотя бы одно из полей невалидно.
* `errors`: объект, содержащий ошибки группы, или `null`, если группа валидна. Каждая ошибка — это ключ, значением которого является массив со всеми контролами, затронутыми этой ошибкой.
* `dirty`: `false`, пока ни один из контролов не стал `dirty`.
* `pristine`: противоположность `dirty`.
* `touched`: `false`, пока ни один из контролов не стал `touched`.
* `untouched`: противоположность `touched`.
* `value`: значение группы. Точнее, это объект с ключами/значениями, представляющими контролы и их значения.
* `valueChanges`: `Observable`, генерирующий событие при каждом изменении в группе.

Он предлагает те же методы, что и `FormControl`, например `hasError()`. Также у него есть метод `get()` для получения контрола из группы.

Создать его можно так:

```typescript
const form = new FormGroup({
  username: new FormControl('Cédric'),
  password: new FormControl('')
});
console.log(form.dirty); // выведет false, пока пользователь не введет значение
console.log(form.value); // выведет Object {username: "Cédric", password: ''}
console.log(form.controls.username); // выведет экземпляр Control

```

Давайте начнем с **template-driven** формы!

---

#### 20.2. Template-driven (На основе шаблона)

С этим методом мы будем использовать набор директив в нашей форме и позволим фреймворку автоматически создать необходимые экземпляры `FormControl` и `FormGroup`.

Например, директива `NgForm` превращает стандартный элемент формы в его мощную версию Angular — думайте об этом как о разнице между Брюсом Уэйном и Бэтменом.

Все нужные нам директивы входят в модуль `FormsModule`, поэтому нам нужно импортировать его в каждый компонент, использующий template-driven форму.

> В отличие от директив из `CommonModule` и `RouterModule`, которые являются standalone, директивы `FormsModule` таковыми не являются. Их нельзя импортировать по одной. Нужно импортировать `FormsModule` целиком.

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ns-register',
  template: `
    <h2>Sign up</h2>
    <form></form>
  `,
  imports: [FormsModule]
})
export class RegisterForm {}

```

`FormsModule` содержит директивы для template-driven подхода. Позже мы увидим, что существует еще один модуль — `ReactiveFormsModule` из того же пакета `@angular/forms`, который необходим для code-driven подхода.

Давайте добавим кнопку отправки (submit):

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ns-register',
  template: `
    <h2>Sign up</h2>
    <form (ngSubmit)="register()">
      <button type="submit">Register</button>
    </form>
  `,
  imports: [FormsModule]
})
export class RegisterForm {
  protected register(): void {
    // здесь мы будем обрабатывать отправку формы
  }
}

```

Я добавил кнопку и определил обработчик события `ngSubmit` на теге `<form>`. Событие `ngSubmit` эмитится директивой `NgForm` при запуске отправки формы. Оно вызывает метод `register()` нашего контроллера, который мы реализуем позже.

Вы можете задаться вопросом, почему директива `NgForm` доступна на элементе `form`, хотя у него нет никаких специальных атрибутов. Всё просто: селектором директивы `NgForm` является `form` (на самом деле чуть более специфичный), что означает, что каждый стандартный HTML-элемент формы автоматически вызывает создание директивы `NgForm`, если импортирован `FormsModule`.

И последнее: наш шаблон будет быстро расти, поэтому давайте вынесем его в отдельный файл с помощью `templateUrl`:

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ns-register',
  templateUrl: './register-form.html',
  imports: [FormsModule]
})
export class RegisterForm {
  protected register(): void {
    // здесь мы будем обрабатывать отправку формы
  }
}

```

В template-driven подходе большая часть логики находится в шаблоне. В TypeScript-части компонента кода совсем немного. В простейшем виде вы просто добавляете директивы `ngModel` к вашему шаблону формы, и всё. Директива `NgModel` создает `FormControl` за вас, а форма автоматически создает `FormGroup`.

Обратите внимание, что инпуту нужно дать атрибут `name`, который фреймворк использует для создания `FormGroup`.

```html
<h2>Sign up</h2>
<form (ngSubmit)="register()">
  <div>
    <label>Username</label>
    <input name="username" ngModel>
  </div>
  <div>
    <label>Password</label>
    <input type="password" name="password" ngModel>
  </div>
  <button type="submit">Register</button>
</form>

```

Теперь, конечно, нам нужно что-то сделать для отправки формы и получения значения имени пользователя и пароля. Для этого мы можем определить локальную переменную и присвоить ей объект `NgForm`, созданный Angular для этой формы.

Помните их из главы про шаблоны? Здесь мы определим переменную `#userForm`, ссылающуюся на форму. Мы можем сделать это, потому что директива формы экспортирует экземпляр директивы `NgForm`, который имеет те же методы, что и класс `FormGroup`. Мы детально рассмотрим экспорт, когда будем изучать создание собственных продвинутых директив.

```html
<h2>Sign up</h2>
<!-- мы используем локальную переменную #userForm -->
<!-- и передаем ее значение в метод register -->
<form (ngSubmit)="register(userForm.value)" #userForm="ngForm">
  <div>
    <label>Username</label>
    <input name="username" ngModel>
  </div>
  <div>
    <label>Password</label>
    <input type="password" name="password" ngModel>
  </div>
  <button type="submit">Register</button>
</form>

```

Наш метод `register` теперь вызывается со значением формы в качестве аргумента:

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ns-register',
  templateUrl: '../code/register-form.html',
  imports: [FormsModule]
})
export class RegisterForm {
  protected register(user: { username: string; password: string }): void {
    console.log(user);
  }
}

```

Однако это довольно ограничено: у нас нет способа заполнить поля формы данными. Но `ngModel` гораздо мощнее, чем вы думаете!

##### 20.2.1. Двустороннее связывание данных (Two-way data binding)

Двустороннее связывание данных позволяет нам вводить значение в поле ввода и автоматически сохранять его в сигнале, и наоборот: если мы меняем значение сигнала, поле ввода автоматически отобразит новое значение.

Для начала определим модель того, что будет заполнено в форме. Сделаем это в интерфейсе `UserModel`:

```typescript
export interface UserModel {
  username: WritableSignal<string>;
  password: WritableSignal<string>;
}

```

> Template-driven формы были разработаны при создании фреймворка, когда Angular полагался на ZoneJS, а не на сигналы, для отслеживания изменений. Это позволяло использовать обычные объекты TypeScript в качестве моделей форм. Чтобы формы продолжали работать в мире без зон (zoneless), каждое поле формы должно быть привязано к сигналу, что не очень удобно для разработчиков. Можно предположить, что ситуация улучшится, когда формы в Angular будут переработаны для лучшей работы с сигналами.

Наш `RegisterForm` должен иметь поле `user` типа `UserModel`:

```typescript
@Component({
  selector: 'ns-register',
  templateUrl: './register-form.html',
  imports: [FormsModule]
})
export class RegisterForm {
  protected readonly user: UserModel = {
    username: signal(''),
    password: signal('')
  };

  protected register(): void {
    console.log({ username: this.user.username(), password: this.user.password() });
  }
}

```

Как видите, на этот раз метод `register()` напрямую логирует объект `user`.
Мы готовы добавить поля ввода в нашу форму. Нам нужно привязать инпуты к модели, которую мы определили. Для этого используем директиву `ngModel`:

```html
<h2>Sign up</h2>
<form (ngSubmit)="register()">
  <div>
    <label>Username</label>
    <input name="username" [(ngModel)]="user.username">
  </div>
  <div>
    <label>Password</label>
    <input type="password" name="password" [(ngModel)]="user.password">
  </div>
  <button type="submit">Register</button>
</form>

```

Ого! `[(ngModel)]`? Что это за синтаксис?
Это синтаксический сахар, введенный для выражения того же самого, что и:

```html
<input name="username" [ngModel]="user.username()" (ngModelChange)="user.username.set($event)">

```

Директива `NgModel` обновляет значение инпута каждый раз, когда меняется связанный сигнал `user.username`, отсюда часть `[ngModel]="user.username()"`. И она эмитит событие из `output` с именем `ngModelChange` каждый раз, когда инпут обновляется пользователем, где событие — это новое значение, отсюда часть `(ngModelChange)="user.username.set($event)"`, которая обновит сигнал `user.username` этим новым значением.

Вместо того чтобы писать длинную форму, мы можем использовать синтаксис `[()]`.
Если вам, как и мне, трудно запомнить, `[()]` это или `([])`, есть отличная подсказка-мнемоника: это "банан в коробке" (banana-in-a-box)! Да, посмотрите: `[]` — это коробка, а внутри две скобки `()`, похожие на бананы!

Теперь каждый раз, когда мы что-то печатаем в инпуте, модель обновляется. И если сигнал обновляется в нашем компоненте, наше поле автоматически отобразит свое новое значение:

```html
<h2>Sign up</h2>
<form (ngSubmit)="register()">
  <div>
    <label>Username</label>
    <input name="username" [(ngModel)]="user.username">
    <small>{{ user.username() }} is an awesome username!</small>
  </div>
  <div>
    <label>Password</label>
    <input type="password" name="password" [(ngModel)]="user.password">
  </div>
  <button type="submit">Register</button>
</form>

```

Если вы попробуете этот пример, то увидите, что двустороннее связывание работает. И наша форма тоже работает: мы можем отправить ее, и компонент залогирует объект пользователя!

---

#### 20.3. Code-driven (Реактивные формы)

В AngularJS 1.x вам приходилось создавать формы в основном в шаблонах. Angular предлагает императивный способ, который позволяет конструировать форму программно, а не через шаблон. Теперь мы можем управлять формами прямо в коде. Это более громоздко, но намного мощнее.

Чтобы построить форму в коде компонента, мы будем использовать абстракции, о которых говорили: `FormControl` и `FormGroup`.

С помощью этих базовых элементов мы можем построить форму в компоненте. Но вместо того чтобы писать `new FormControl()` или `new FormGroup()`, мы будем использовать вспомогательный класс `FormBuilder`, который мы можем внедрить (inject):

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'ns-register',
  templateUrl: './register-form.html',
  imports: [ReactiveFormsModule]
})
export class RegisterForm {
  private readonly fb = inject(FormBuilder);
  // нам нужно будет построить форму

  protected register(): void {
    // нам нужно будет обработать отправку
  }
}

```

`FormBuilder` — это вспомогательный класс с набором методов для создания контролов и групп.
Начнем с простого и создадим небольшую форму с двумя контролами: `username` и `password`.

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'ns-register',
  templateUrl: './register-form.html',
  imports: [ReactiveFormsModule]
})
export class RegisterForm {
  private readonly fb = inject(FormBuilder);
  protected readonly userForm = this.fb.group({
    username: '',
    password: ''
  });
  // `userForm` имеет тип `FormGroup<{
  //   username: FormControl<string | null>;
  //   password: FormControl<string | null>;
  // }>`

  protected register(): void {
    // нам нужно будет обработать отправку
  }
}

```

Мы создали форму с двумя контролами. Вы можете видеть, что каждый контрол создается со значением `''`. Это то же самое, что использовать вспомогательный метод `control()` из `FormBuilder` с этой строкой в качестве параметра, и то же самое, что вызов конструктора `new FormControl('')`: строка представляет начальное значение, которое вы хотите отобразить в форме. Здесь оно пустое, поэтому инпуты будут пустыми. Но здесь может быть и значение, если вы, например, редактируете существующую сущность.

Вспомогательный метод также может принимать и другие атрибуты, как мы увидим позже.

Нам нужно реализовать метод `register`. Как мы видели, объект `FormGroup` имеет атрибут `value`, поэтому мы можем просто залогировать его содержимое:

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'ns-register',
  templateUrl: './register-form.html',
  imports: [ReactiveFormsModule]
})
export class RegisterForm {
  private readonly fb = inject(FormBuilder);
  protected readonly userForm = this.fb.group({
    username: '',
    password: ''
  });

  protected register(): void {
    console.log(this.userForm.value);
  }
}

```

Теперь нам нужно проделать работу в шаблоне. Мы будем использовать другие директивы, отличные от тех, что видели для template-driven форм. Эти директивы находятся в `ReactiveFormsModule`, который вы должны импортировать в свой компонент. Их имена начинаются с `form` вместо `ng`, как было в случае с template-driven формами.

Форма должна быть привязана к нашему объекту `userForm` благодаря директиве `formGroup`. Каждое поле ввода привязывается к контролу благодаря директиве `formControlName`:

```html
<h2>Sign up</h2>
<form (ngSubmit)="register()" [formGroup]="userForm">
  <div>
    <label>Username</label>
    <input formControlName="username">
  </div>
  <div>
    <label>Password</label>
    <input type="password" formControlName="password">
  </div>
  <button type="submit">Register</button>
</form>

```

Мы хотим привязать свойство `userForm` нашего компонента к `formGroup`, поэтому используем синтаксис квадратных скобок `[formGroup]="userForm"`.

Каждый инпут получает директиву `formControlName` со строковым литералом, представляющим имя контрола, к которому он привязан. Если вы укажете имя, которого не существует, вы получите ошибку. Так как мы передаем значение (а не выражение), мы не ставим `[]` вокруг `formControlName`.

И готово: клик по кнопке отправки залогирует объект, содержащий `username` и выбранный `password`!

Если вам нужно, вы можете обновить значение `FormControl` из вашего компонента с помощью `setValue()`:

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'ns-register',
  templateUrl: './register-form.html',
  imports: [ReactiveFormsModule]
})
export class RegisterForm {
  private readonly fb = inject(FormBuilder);
  protected readonly usernameCtrl = this.fb.control('');
  protected readonly passwordCtrl = this.fb.control('');
  protected readonly userForm = this.fb.group({
    username: this.usernameCtrl,
    password: this.passwordCtrl
  });

  protected setAnotherNinja(): void {
    this.usernameCtrl.setValue('JB');
  }

  protected register(): void {
    console.log(this.userForm.value);
  }
}

```

---

#### 20.4. Добавление валидации

Валидация обычно является большой частью создания форм. Некоторые поля обязательны, некоторые зависят друг от друга, некоторые должны быть в определенном формате, некоторые не должны иметь значение больше или меньше X и т.д. Давайте начнем с добавления базовых правил валидации: все наши поля обязательны.

##### 20.4.1. В code-driven форме

Чтобы указать, что каждое поле обязательно, мы используем валидатор (`Validator`).
Валидатор возвращает карту (объект) ошибок или `null`, если ошибок не обнаружено.
Несколько валидаторов предоставляются фреймворком из коробки:

* `Validators.required` — гарантирует, что контрол не пуст.
* `Validators.minLength(n)` — гарантирует, что введенное значение содержит не менее `n` символов.
* `Validators.maxLength(n)` — гарантирует, что введенное значение содержит не более `n` символов.
* `Validators.email()` (доступен с версии 4.0) — гарантирует, что введенное значение является корректным email-адресом (удачи с поиском правильного регулярного выражения вручную...).
* `Validators.min(n)` (доступен с версии 4.2) — гарантирует, что введенное значение не меньше `n`.
* `Validators.max(n)` (доступен с версии 4.2) — гарантирует, что введенное значение не больше `n`.
* `Validators.pattern(p)` — гарантирует, что значение соответствует регулярному выражению `p`.

Вы можете применить несколько валидаторов одновременно, передав их массивом в `FormControl` или `FormGroup`.

Здесь мы хотим, чтобы каждое поле было обязательным, поэтому можем добавить валидатор `required` к каждому контролу и убедиться, что `username` содержит не менее 3 символов.

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'ns-register',
  templateUrl: './register-form.html',
  imports: [ReactiveFormsModule]
})
export class RegisterForm {
  private readonly fb = inject(FormBuilder);
  protected readonly userForm = this.fb.group({
    username: this.fb.control('', [Validators.required, Validators.minLength(3)]),
    password: this.fb.control('', Validators.required)
  });

  protected register(): void {
    console.log(this.userForm.value);
  }
}

```

##### 20.4.2. В template-driven форме

Добавление обязательного поля в template-driven форме также очень простое: вам просто нужно добавить атрибут `required` к инпутам. `required` — это встроенная директива, которая автоматически добавит валидатор к этому полю. То же самое с `minlength`, `maxlength` и `email` (`min` и `max` пока недоступны в виде директив).

Начиная с примера с двусторонним связыванием данных:

```html
<h2>Sign up</h2>
<form (ngSubmit)="register(userForm.value)" #userForm="ngForm">
  <div>
    <label>Username</label>
    <input name="username" ngModel required minlength="3">
  </div>
  <div>
    <label>Password</label>
    <input type="password" name="password" ngModel required>
  </div>
  <button type="submit">Register</button>
</form>

```

Обратите внимание, что это можно сделать и в code-driven форме.

---

#### 20.5. Ошибки и отправка формы

Конечно, наш пользователь не должен иметь возможности отправить форму, пока в ней есть ошибки, и эти ошибки должны наглядно отображаться.

Если вы попробуете примеры, вы увидите, что даже если поля обязательны, мы все еще можем отправить форму. Может, стоит что-то с этим сделать?

Мы знаем, что можем легко отключить кнопку с помощью свойства `disabled`, но нам нужно передать ему выражение, отражающее состояние текущей формы.

##### 20.5.1. Ошибки и отправка в code-driven форме

Мы добавили поле `userForm` типа `FormGroup` в наш компонент. Это поле дает нам полное представление о состоянии и ошибках формы и полей. Например, мы можем отключить отправку формы, если форма невалидна:

```html
<h2>Sign up</h2>
<form (ngSubmit)="register()" [formGroup]="userForm">
  <div>
    <label>Username</label>
    <input formControlName="username">
  </div>
  <div>
    <label>Password</label>
    <input type="password" formControlName="password">
  </div>
  <button type="submit" [disabled]="userForm.invalid">Register</button>
</form>

```

Как вы можете видеть на последней строке, нам просто нужно связать `disabled` со свойством `invalid` формы `userForm`. Теперь мы можем отправить форму только тогда, когда все контролы валидны.

Чтобы помочь пользователю понять, почему форма не может быть отправлена, нам следует отображать сообщения об ошибках. Всё еще используя `userForm`, мы можем сделать так:

```html
<h2>Sign up</h2>
<form (ngSubmit)="register()" [formGroup]="userForm">
  <div>
    <label>Username</label>
    <input formControlName="username">
    @if (userForm.controls.username.hasError('required')) {
      <div>Username is required</div>
    }
    @if (userForm.controls.username.hasError('minlength')) {
      <div>Username should be 3 characters min</div>
    }
  </div>
  <div>
    <label>Password</label>
    <input type="password" formControlName="password">
    @if (userForm.controls.password.hasError('required')) {
      <div>Password is required</div>
    }
  </div>
  <button type="submit" [disabled]="userForm.invalid">Register</button>
</form>

```

Круто! Ошибки теперь отображаются, если поля пусты, и исчезают, когда появляется значение. Но они отображаются сразу при открытии формы. Возможно, мы можем скрыть их, пока пользователь не покинет поле?

```html
<h2>Sign up</h2>
<form (ngSubmit)="register()" [formGroup]="userForm">
  <div>
    <label>Username</label>
    <input formControlName="username">
    @if (userForm.controls.username.touched && userForm.controls.username.hasError('required')) {
      <div>Username is required</div>
    }
    @if (userForm.controls.username.touched && userForm.controls.username.hasError('minlength')) {
      <div>Username should be 3 characters min</div>
    }
  </div>
  <div>
    <label>Password</label>
    <input type="password" formControlName="password">
    @if (userForm.controls.password.touched && userForm.controls.password.hasError('required')) {
      <div>Password is required</div>
    }
  </div>
  <button type="submit" [disabled]="userForm.invalid">Register</button>
</form>

```

Это выглядит немного громоздко, поэтому вы можете создать ссылку на каждый контрол в вашем компоненте:

```typescript
@Component({
  selector: 'ns-register',
  templateUrl: './register-form.html',
  imports: [ReactiveFormsModule]
})
export class RegisterForm {
  private readonly fb = inject(FormBuilder);
  protected readonly usernameCtrl = this.fb.control('', Validators.required);
  protected readonly passwordCtrl = this.fb.control('', Validators.required);
  protected readonly userForm = this.fb.group({
    username: this.usernameCtrl,
    password: this.passwordCtrl
  });

  protected register(): void {
    console.log(this.userForm.value);
  }
}

```

А затем использовать эти ссылки в шаблоне:

```html
<h2>Sign up</h2>
<form (ngSubmit)="register()" [formGroup]="userForm">
  <div>
    <label>Username</label>
    <input formControlName="username">
    @if (usernameCtrl.touched && usernameCtrl.hasError('required')) {
      <div>Username is required</div>
    }
    @if (usernameCtrl.touched && usernameCtrl.hasError('minlength')) {
      <div>Username should be 3 characters min</div>
    }
  </div>
  <div>
    <label>Password</label>
    <input type="password" formControlName="password">
    @if (passwordCtrl.touched && passwordCtrl.hasError('required')) {
      <div>Password is required</div>
    }
  </div>
  <button type="submit" [disabled]="userForm.invalid">Register</button>
</form>

```

##### 20.5.2. Ошибки и отправка в template-driven форме

В template-driven форме у нас нет поля в компоненте, ссылающегося на `FormGroup`, но мы уже объявили локальную переменную в шаблоне, ссылающуюся на объект `NgForm`, экспортируемый директивой формы. Еще раз: эта переменная позволяет узнать состояние формы и получить доступ к ее контролам.

```html
<h2>Sign up</h2>
<form (ngSubmit)="register(userForm.value)" #userForm="ngForm">
  <div>
    <label>Username</label>
    <input name="username" ngModel required>
  </div>
  <div>
    <label>Password</label>
    <input type="password" name="password" ngModel required>
  </div>
  <button type="submit" [disabled]="userForm.invalid">Register</button>
</form>

```

Теперь нам нужно отобразить ошибки каждого поля. Как и директива формы, каждый контрол экспортирует свой объект `FormControl`, поэтому мы можем создать локальную переменную для доступа к ошибкам:

```html
<h2>Sign up</h2>
<form (ngSubmit)="register(userForm.value)" #userForm="ngForm">
  <div>
    <label>Username</label>
    <input name="username" ngModel required #username="ngModel">
    @if (username.touched && username.hasError('required')) {
      <div>Username is required</div>
    }
  </div>
  <div>
    <label>Password</label>
    <input type="password" name="password" ngModel required #password="ngModel">
    @if (password.touched && password.hasError('required')) {
      <div>Password is required</div>
    }
  </div>
  <button type="submit" [disabled]="userForm.invalid">Register</button>
</form>

```

Ура!

---

#### 20.6. Добавление стилей

Какой бы способ создания форм вы ни выбрали, Angular делает для нас еще одну потрясающую вещь: он автоматически добавляет и удаляет CSS-классы на каждом поле (и на самой форме), чтобы мы могли добавить визуальный стиль.

Например, поле будет иметь класс `ng-invalid`, если один из его валидаторов не прошел проверку, или `ng-valid`, если все валидаторы прошли успешно.

Это означает, что вы можете легко добавить стиль, например, симпатичную красную рамку вокруг полей, не прошедших валидацию:

```html
<style>
  input.ng-invalid {
    border: 3px red solid;
  }
</style>

<h2>Sign up</h2>
<form (ngSubmit)="register(userForm.value)" #userForm="ngForm">
  <div>
    <label>Username</label>
    <input name="username" ngModel required>
  </div>
  <div>
    <label>Password</label>
    <input type="password" name="password" ngModel required>
  </div>
  <button type="submit" [disabled]="userForm.invalid">Register</button>
</form>

```

Другой полезный CSS-класс — `ng-dirty`, который присутствует, если пользователь изменил значение. Его противоположность — `ng-pristine`, присутствующий, если пользователь никогда не менял значение.

Обычно я отображаю красную рамку только тогда, когда пользователь изменил значение хотя бы один раз:

```html
<style>
  input.ng-invalid.ng-dirty {
    border: 3px red solid;
  }
</style>

<h2>Sign up</h2>
<form (ngSubmit)="register(userForm.value)" #userForm="ngForm">
  <div>
    <label>Username</label>
    <input name="username" ngModel required>
  </div>
  <div>
    <label>Password</label>
    <input type="password" name="password" ngModel required>
  </div>
  <button type="submit" [disabled]="userForm.invalid">Register</button>
</form>

```

Наконец, есть последний CSS-класс: `ng-touched`. Он будет присутствовать, если пользователь вошел в поле и покинул его хотя бы один раз (даже если он не менял значение). Его противоположность — `ng-untouched`.

Когда вы отображаете форму в первый раз, поле обычно имеет CSS-классы `ng-pristine ng-untouched ng-invalid`. Затем, когда пользователь входит в поле и покидает его, классы меняются на `ng-pristine ng-touched ng-invalid`. Когда пользователь меняет значение (все еще на невалидное), мы получаем `ng-dirty ng-touched ng-invalid`. И, наконец, когда значение становится валидным: `ng-dirty ng-touched ng-valid`.
#### 20.7. Создание кастомного валидатора (Creating a custom validator)

Скачки на пони — азартная игра, поэтому регистрироваться разрешено только лицам старше 18 лет. Кроме того, мы хотим, чтобы пользователь вводил пароль дважды, дабы убедиться в отсутствии ошибок.

Как это сделать? Мы создаем кастомный валидатор.

Для этого достаточно написать метод, который принимает `FormControl`, проверяет его значение и возвращает объект с ошибками или `null`, если валидация прошла успешно.

```typescript
const isOldEnough = (control: AbstractControl<Date | null>) => {
  // control — это инпут даты, поэтому мы можем построить Date из значения
  const birthDatePlus18 = new Date(control.value!);
  birthDatePlus18.setFullYear(birthDatePlus18.getFullYear() + 18);
  return birthDatePlus18 < new Date() ? null : { tooYoung: true };
};

```

Наш метод валидации достаточно прост: мы берем значение контрола, строим дату, проверяем, наступил ли 18-й день рождения до текущего момента, и возвращаем ошибку с ключом `'tooYoung'`, если нет.

Теперь нам нужно подключить этот валидатор.

##### 20.7.1. Использование валидатора в code-driven форме

Нам нужно добавить новый контрол в нашу форму с этим валидатором, используя `FormBuilder`:

```typescript
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

@Component({
  selector: 'ns-register',
  templateUrl: './register-form.html',
  imports: [ReactiveFormsModule]
})
export class RegisterForm {
  private readonly fb = inject(FormBuilder);
  protected readonly usernameCtrl = this.fb.control('', Validators.required);
  protected readonly passwordCtrl = this.fb.control('', Validators.required);
  protected readonly birthdateCtrl = this.fb.control('', [Validators.required, RegisterForm.isOldEnough]);
  protected readonly userForm = this.fb.group({
    username: this.usernameCtrl,
    password: this.passwordCtrl,
    birthdate: this.birthdateCtrl
  });

  private static isOldEnough(control: AbstractControl<string>): ValidationErrors | null {
    // control — это инпут даты, поэтому мы можем построить Date из значения
    const birthDatePlus18 = new Date(control.value);
    birthDatePlus18.setFullYear(birthDatePlus18.getFullYear() + 18);
    return birthDatePlus18 < new Date() ? null : { tooYoung: true };
  }

  protected register(): void {
    console.log(this.userForm.value);
  }
}

```

Как видите, мы добавили новый контрол `birthdate` с композицией из двух валидаторов. Первый валидатор — `required`, а второй — статический метод нашей формы `isOldEnough`. Разумеется, при желании этот метод мог бы находиться и в другом классе (`Validators.required`, например, тоже является статическим методом).

Не забудьте добавить поле и отображение ошибок в шаблон формы:

```html
<h2>Sign up</h2>
<form (ngSubmit)="register()" [formGroup]="userForm">
  <div>
    <label>Username</label><input formControlName="username">
    @if (usernameCtrl.touched && usernameCtrl.hasError('required')) {
      <div>Username is required</div>
    }
  </div>
  <div>
    <label>Password</label><input type="password" formControlName="password">
    @if (passwordCtrl.touched && passwordCtrl.hasError('required')) {
      <div>Password is required</div>
    }
  </div>
  <div>
    <label>Birth date</label><input type="date" formControlName="birthdate">
    @if (birthdateCtrl.touched) {
      @if (birthdateCtrl.hasError('required')) {
        <div>Birth date is required</div>
      } @else if (birthdateCtrl.hasError('tooYoung')) {
        <div>You're way too young to be betting on pony races</div>
      }
    }
  </div>
  <button type="submit" [disabled]="userForm.invalid">Register</button>
</form>

```

Довольно просто, не правда ли?

Обратите внимание, что вы также можете создавать и добавлять асинхронные валидаторы (например, для проверки через бэкенд, свободен ли логин).

```typescript
@Component({
  selector: 'ns-register',
  templateUrl: './register-form.html',
  imports: [ReactiveFormsModule]
})
export class RegisterForm {
  private readonly fb = inject(FormBuilder);
  protected readonly usernameCtrl = this.fb.control('', Validators.required, control =>
    this.isUsernameAvailable(control)
  );
  protected readonly userForm = this.fb.group({
    username: this.usernameCtrl
  });

  private readonly userService = inject(UserService);

  private isUsernameAvailable(control: AbstractControl<string>): Observable<ValidationErrors | null> {
    const username = control.value;
    return this.userService
      .isUsernameAvailable(username)
      .pipe(map(available => (available ? null : { alreadyUsed: true })));
  }

  protected register(): void {
    console.log(this.userForm.value);
  }
}

```

Этот асинхронный валидатор на этот раз не является статическим методом, поскольку ему нужен доступ к сервису.

Метод сервиса возвращает `Observable`, который эмитит либо `null`, если ошибки нет (логин свободен), либо объект с ошибкой (ключ будет именем ошибки, как и у синхронных валидаторов).

Интересная фича: к полю динамически добавляется CSS-класс `ng-pending`, пока асинхронный валидатор выполняет свою работу. Это позволяет, например, отобразить спиннер, показывающий процесс валидации.

##### 20.7.2. Использование валидатора в template-driven форме

Чтобы добавить кастомный валидатор в template-driven форму, нам нужно добавить его в... шаблон!

Для этого придется написать кастомную директиву и применить ее к инпуту, но, честно говоря, при использовании "code-driven" формы всё делаются в разы проще...

---

#### 20.8. Группировка полей (Grouping fields)

До сих пор у нас была только одна группа — вся форма целиком. Но мы можем объявлять группы внутри группы. Это очень полезно, если нужно валидировать группу полей вместе (например, адрес) или, как в нашем случае, проверить совпадение пароля и его подтверждения.

Решение состоит в использовании code-driven формы.

Сначала создадим новую группу `passwordGroup` с двумя полями и добавим ее в группу `userForm` под ключом `passwordForm`:

```typescript
protected readonly usernameCtrl = this.fb.control('', Validators.required);
protected readonly passwordCtrl = this.fb.control('', Validators.required);
protected readonly confirmCtrl = this.fb.control('', Validators.required);
protected readonly passwordGroup = this.fb.group(
  { password: this.passwordCtrl, confirm: this.confirmCtrl },
  { validators: RegisterForm.passwordMatch }
);

protected readonly userForm = this.fb.group({ username: this.usernameCtrl, passwordForm: this.passwordGroup });

private static passwordMatch(group: AbstractControl<{ password: string; confirm: string }>): ValidationErrors | null {
  const password = group.value.password;
  const confirm = group.value.confirm;
  return password === confirm ? null : { matchingError: true };
}

```

Как видите, мы добавили валидатор на группу (`passwordMatch`), который будет вызываться каждый раз при изменении любого из полей.

Обновим шаблон с помощью директивы `formGroupName`, чтобы отразить новую структуру формы:

```html
<h2>Sign up</h2>
<form (ngSubmit)="register()" [formGroup]="userForm">
  <div>
    <label>Username</label><input formControlName="username">
    @if (usernameCtrl.touched && usernameCtrl.hasError('required')) {
      <div>Username is required</div>
    }
  </div>
  <div formGroupName="passwordForm">
    <div>
      <label>Password</label><input type="password" formControlName="password">
      @if (passwordCtrl.touched && passwordCtrl.hasError('required')) {
        <div>Password is required</div>
      }
    </div>
    <div>
      <label>Confirm password</label><input type="password" formControlName="confirm">
      @if (confirmCtrl.touched && confirmCtrl.hasError('required')) {
        <div>Confirm your password</div>
      }
    </div>
    @if (passwordGroup.touched && passwordGroup.hasError('matchingError')) {
      <div>Your password does not match</div>
    }
  </div>
  <button type="submit" [disabled]="userForm.invalid">Register</button>
</form>

```

Вуаля!

---

#### 20.9. Реакция на изменения (Reacting to changes)

Еще одна отличная фича при использовании code-driven форм: вы можете легко реагировать на изменения значений с помощью `Observable` `valueChanges`. Реактивное программирование во всей красе! Например, допустим, мы хотим выводить индикатор надежности пароля. Нам нужно пересчитывать надежность при каждом изменении значения пароля:

```typescript
private readonly fb = inject(FormBuilder);
protected readonly usernameCtrl = this.fb.control('', Validators.required);
protected readonly passwordCtrl = this.fb.control('', Validators.required);
protected readonly userForm = this.fb.group({
  username: this.usernameCtrl,
  password: this.passwordCtrl
});
protected readonly passwordStrength = signal(0);

constructor() {
  // подписываемся на каждое изменение пароля
  this.passwordCtrl.valueChanges
    .pipe(
      // пересчитываем только когда пользователь перестает печатать на 400мс
      debounceTime(400),
      // пересчитываем только если новое значение отличается от предыдущего
      distinctUntilChanged()
    )
    .subscribe(newValue => this.passwordStrength.set(this.computePasswordStrength(newValue)));
}

```

Или с использованием `toSignal`:

```typescript
protected readonly passwordStrength = toSignal(
  this.passwordCtrl.valueChanges.pipe(
    // пересчитываем только когда пользователь перестает печатать на 400мс
    debounceTime(400),
    // пересчитываем только если новое значение отличается от предыдущего
    distinctUntilChanged(),
    // вычисляем сложность пароля
    map(newValue => this.computePasswordStrength(newValue))
  ),
  { initialValue: 0 }
);

```

Теперь у нас в экземпляре компонента есть поле `passwordStrength`, которое мы можем отобразить пользователю:

```html
<h2>Sign up</h2>
<form (ngSubmit)="register()" [formGroup]="userForm">
  <div>
    <label>Username</label><input formControlName="username">
    @if (usernameCtrl.touched && usernameCtrl.hasError('required')) {
      <div>Username is required</div>
    }
  </div>
  <div>
    <label>Password</label><input type="password" formControlName="password">
    <div>Strength: {{ passwordStrength() }}</div>
    @if (passwordCtrl.touched && passwordCtrl.hasError('required')) {
      <div>Password is required</div>
    }
  </div>
  <button type="submit" [disabled]="userForm.invalid">Register</button>
</form>

```

Мы задействуем операторы RxJS, чтобы добавить пару крутых фич:

* `debounceTime(400)` будет эмитить значения только тогда, когда пользователь сделает паузу в вводе на 400 мс. Это избавляет от вычисления сложности при каждом нажатии клавиши. Это невероятно полезно, если вычисления занимают много времени или отправляют HTTP-запрос.
* `distinctUntilChanged()` будет эмитить значения только в том случае, если новое значение отличается от предыдущего. Опять же, это крайне полезно: представьте, что пользователь ввел 'password', затем остановился. Мы посчитали надежность. Затем он быстро ввел символ и удалил его (быстрее 400 мс). Следующим событием после `debounceTime` снова будет 'password'. Повторно пересчитывать надежность нет никакого смысла! Этот оператор даже не сэмитит значение и сэкономит нам ресурсы.

RxJS может выполнить за вас огромную работу: представьте, как пришлось бы реализовывать подобное вручную вместо двух строк кода. Кроме того, он легко комбинируется с работой по HTTP, так как сервис `HttpClient` тоже использует `Observable`.

---

#### 20.10. Обновление только по blur или submit (Updating on blur or on submit only)

В Angular 5.0 появилась возможность ожидать события `blur` (потеря фокуса) или `submit` (отправка формы) для обновления значения и валидности поля. Для этого конструктор `FormControl` принимает объект параметров вторым аргументом, в котором можно настроить синхронные/асинхронные валидаторы, а также опцию `updateOn`. Ее значениями могут быть:

* `change` (по умолчанию): значение и валидность обновляются при каждом изменении;
* `blur`: значение и валидность обновляются только тогда, когда поле теряет фокус;
* `submit`: значение и валидность обновляются только при отправке родительской формы.

```typescript
protected readonly usernameCtrl = this.fb.control('', Validators.required);
protected readonly passwordCtrl = this.fb.control('', {
  validators: Validators.required,
  updateOn: 'blur'
});

```

Также эту опцию можно сконфигурировать сразу для целой группы полей:

```typescript
protected readonly userForm = this.fb.group(
  {
    username: this.usernameCtrl,
    password: this.passwordCtrl
  },
  {
    updateOn: 'blur'
  }
);

```

Эта же возможность доступна и в template-driven формах с помощью инпута `ngModelOptions` директивы `NgModel`:

```html
<label>Username</label>
<input name="username" #usernameCtrl="ngModel"
  [(ngModel)]="user.username" [ngModelOptions]="{ updateOn: 'blur' }" required>
@if (usernameCtrl.touched && usernameCtrl.hasError('required')) {
  <div>Username is required</div>
}

```

Или глобально для всей формы с помощью инпута `NgFormOptions` (появившегося в Angular 5.0) директивы `NgForm`:

```html
<form (ngSubmit)="register()" [ngFormOptions]="{ updateOn: 'blur' }">
  <div>
    <label>Username</label>
    <input name="username" #usernameCtrl="ngModel"
      [(ngModel)]="user.username" required>
    @if (usernameCtrl.touched && usernameCtrl.hasError('required')) {
      <div>Username is required</div>
    }

```

---

#### 20.11. FormArray и FormRecord

`FormControl` и `FormGroup` — не единственные сущности для построения форм. Если вам нужно сделать часть формы динамической, вы можете использовать `FormArray` или `FormRecord`.

`FormArray` представляет собой массив контролов, содержащих одинаковый тип значений. Типичный пример — форма, где пользователи могут добавлять/удалять значения (например, теги при редактировании статьи в блоге):

```typescript
export class EditBlogPost {
  private readonly fb = inject(FormBuilder);
  // один пустой тег по умолчанию
  protected readonly tagsArray = this.fb.array(['']);
  protected readonly blogPostForm = this.fb.group({
    title: '',
    content: '',
    tags: this.tagsArray
  });

  protected addTag() {
    this.tagsArray.push(this.fb.control(''));
  }

  protected removeTag(index: number) {
    this.tagsArray.removeAt(index);
  }
}

```

Затем вы можете итерироваться по контролам в шаблоне и добавить кнопки для добавления/удаления тега:

```html
<div formArrayName="tags">
  <p>Tags</p>
  <button id="add-tag" (click)="addTag()">Add tag</button>
  @for (tagControl of tagsArray.controls; track tagControl) {
    <div>
      <input class="tag" [formControlName]="$index" />
      <button class="remove-tag" (click)="removeTag($index)">Remove tag</button>
    </div>
  }
</div>

```

Значением `FormArray` в данном примере является массив строк. Разумеется, массивы форм могут содержать любые контролы. Например, при добавлении позиций в счет-фактуру `FormArray` будет содержать группы форм с наименованием, количеством, ценой и т. д.

`FormRecord` — еще одна сущность для создания форм. Она была представлена в Angular v14 и позволяет строить карты ключ-значение (key-value maps).

Допустим, вы хотите составить список вещей для поездки с возможностью добавлять/удалять предметы и отмечать их чекбоксами. В этом случае поможет `FormRecord`:

```typescript
export class EditPackingList {
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly equipmentRecord = this.fb.record({
    // зубную щетку берем всегда
    toothbrush: true
  });
  protected readonly packingListForm = this.fb.group({
    equipments: this.equipmentRecord
  });

  protected addEquipment(equipment: string) {
    this.equipmentRecord.addControl(equipment, this.fb.control(true));
  }

  protected removeEquipment(equipment: string) {
    this.equipmentRecord.removeControl(equipment);
  }
}

```

Затем в шаблоне вы итерируетесь по контролам и используете кнопки для добавления/удаления снаряжения:

```html
<div formGroupName="equipments">
  <label for="equipment-to-add">Equipments</label>
  <input #equipment id="equipment-to-add" />
  <button id="add-equipment" (click)="addEquipment(equipment.value)">Add</button>
  @for (control of equipmentRecord.controls | keyvalue; track control) {
    <div>
      <label [for]="'eq-' + control.key">{{ control.key }}</label>
      <input [id]="'eq-' + control.key" type="checkbox" class="equipment" [formControlName]="control.key" />
      <button class="remove-equipment" (click)="removeEquipment(control.key)">Remove equipment</button>
    </div>
  }
</div>

```

Значением `FormRecord` станет объект с названием снаряжения в качестве ключа и `boolean` в качестве значения:

```json
{
  "toothbrush": false,
  "jacket": true
}

```

---

#### 20.12. Строго типизированные формы (Strictly typed forms)

До версии 14 в Angular формы не были типизированы. Что это значит?

Значение `FormControl` или `FormGroup` имело тип `any`, что, очевидно, далеко от идеала.

При обновлении приложения с 13-й версии до 14-й, чтобы не сломать существующий код, типы `FormControl`, `FormGroup` и `FormArray` были заменены на `UntypedFormControl`, `UntypedFormGroup` и `UntypedFormArray`.

Оригинальные же типы стали типизированными. Но каковы конкретные изменения в Angular 14?

Элементы форм стали обобщенными (generics). Теперь мы используем, например, `FormControl<string>`, чтобы указать, что значением контрола является строка. В свою очередь, `FormGroup` принимает типы входящих в него контролов. Например, `FormGroup` для регистрации пользователя будет иметь тип:

```typescript
FormGroup<{
  username: FormControl<string>;
  password: FormControl<string>;
}>;

```

Выглядит громоздко, но не паникуйте: в большинстве случаев эти дженерик-типы выводятся компилятором автоматически при инициализации переменных.

##### 20.12.1. Допустимость null (Nullability)

В предыдущем разделе всё было слегка упрощено. На самом деле типизация элементов форм должна учитывать две суровые реальности:

1. Элементы форм могут быть отключены (`disabled`);
2. Метод `reset()` по умолчанию сбрасывает значения контролов в `null`.

Когда контрол отключен, его значение не попадает в `value` родительской `FormGroup`. Если я решу отключить контрол `password`, значение `FormGroup` станет просто:

```typescript
{
  username: 'cedric'
}

```

И это немного раздражает, так как тип значения `FormGroup` получается не

```typescript
{
  username: string;
  password: string;
}

```

как ожидает разработчик, а на самом деле:

```typescript
{
  username?: string;
  password?: string;
}

```

Angular не может знать заранее, собираетесь ли вы отключать контролы. Поэтому он вынужден делать каждое свойство в объекте значения `FormGroup` опциональным. Вы, как разработчик, отвечаете за обработку этой ситуации. Обычно пишут `value.username!`, чтобы получить `string` вместо `string | undefined`, если вы уверены, что контрол активен. Другая возможность — использовать необработанное значение группы (`getRawValue()`). Это необработанное значение содержит абсолютно все свойства, независимо от того, отключен ли контрол, поэтому свойства в нем не помечаются опциональными.

Вторая проблема с `reset()` приводит к похожей ситуации. Поскольку Angular не знает, вызван ли будет `reset()`, значение `FormGroup` на самом деле получает тип:

```typescript
{
  username?: string | null;
  password?: string | null;
}

```

В отличие от первой проблемы, эту неприятность можно обойти. Для этого каждый элемент формы должен быть сконфигурирован опцией `nonNullable: true`. Она меняет поведение `reset()`, сбрасывая значение контрола к его начальному значению вместо `null`. Задавать эту опцию для каждого элемента вручную через конструкторы довольно утомительно. Но всё становится значительно проще при использовании `FormBuilder`. Встречайте `NonNullableFormBuilder`: внедрите его вместо обычного `FormBuilder`. У него точно такой же API, но он автоматически конфигурирует все создаваемые элементы с параметром `nonNullable`.

```typescript
export class RegisterForm {
  protected readonly userForm = inject(NonNullableFormBuilder).group({
    username: '',
    password: ''
  });
}

```

Заметьте, что название `NonNullableFormBuilder` может вводить в заблуждение. Его использование не запрещает контролам иметь значение `null`. Взять, к примеру, инпут типа `number`. Для него нет хорошего значения по умолчанию, кроме `null`. И даже если инициализировать контрол непустым значением, пользователь всегда может очистить поле, установив значение в `null`. В таких случаях нужно явно типизировать контрол:

```typescript
readonly birthYearCtrl = new FormControl<number | null>(null);

```

или с помощью `FormBuilder` / `NonNullableFormBuilder`:

```typescript
protected readonly birthYearCtrl = inject(NonNullableFormBuilder).control<number | null>(null);

```

или если контрол находится внутри `FormGroup`:

```typescript
protected readonly formGroup = inject(NonNullableFormBuilder).group({
  // ...
  birthYear: null as number | null
});

```

Вся эта дополнительная сложность может показаться отпугивающей, но не стоит упускать из виду главное приобретение: объекты с четкими именами свойств и типами, поддерживающие автодополнение в IDE, что в конечном счете делает код более надежным и поддерживаемым.

---

#### 20.13. Простые сообщения об ошибках валидации с ngx-valdemort

Как вы могли заметить, шаблоны быстро становятся раздутыми из-за повторяющихся сообщений об ошибках для каждого типа ошибки на каждом поле в каждой форме. Вы быстро оказываетесь погребены под длинными `ngIf` и скопированным дублирующимся кодом.

Нам это тоже показалось неприятным, поэтому мы написали крошечную open-source библиотеку, упрощающую этот процесс (под сильным вдохновением от `ngMessages` из AngularJS) — **ngx-valdemort**.

Вместо:

```html
<input id="email" formControlName="email" class="form-control" type="email" />
@if (form.controls.email.invalid && (f.submitted || form.controls.email.touched)) {
  <div class="invalid-feedback">
    @if (form.controls.email.hasError('required')) {
      <div>The email is required</div>
    }
    @if (form.controls.email.hasError('email')) {
      <div>The email must be a valid email address</div>
    }
  </div>
}

```

библиотека позволяет писать:

```html
<input id="email" formControlName="email" class="form-control" type="email" />
<val-errors controlName="email">
  <ng-template valError="required">The email is required</ng-template>
  <ng-template valError="email">The email must be a valid email address</ng-template>
</val-errors>

```

Мы можем сделать еще лучше, определив дефолтные сообщения один раз для всего приложения:

```html
<val-default-errors>
  <ng-template valError="required" let-label> {{ label || 'This field' }} is required </ng-template>
  <ng-template valError="email" let-label> {{ label || 'This field' }} must be a valid email address </ng-template>
  <ng-template valError="min" let-error="error" let-label>
    {{ label || 'This field' }} must be at least {{ error.min | number }}
  </ng-template>
  <!-- аналогично для других типов ошибок -->
</val-default-errors>

```

И затем просто использовать:

```html
<input id="email" formControlName="email" class="form-control" type="email" />
<val-errors controlName="email" label="The email" />

```

Также предоставляется интеграция с Bootstrap и Material, чтобы ошибки стилизовались единообразно при использовании этих фреймворков. Попробуйте, вы не пожалеете!

---

#### 20.14. Идем дальше: создание кастомных полей ввода с ControlValueAccessor

HTML предоставляет большой выбор типов ввода: `text`, `password`, `checkbox` и т. д. Но иногда стандартных типов недостаточно.

Angular позволяет создавать кастомные компоненты и делать так, чтобы они вели себя как стандартные контролы форм Angular (т.е. связывать их через `NgModel` или `FormControlName`, тем самым интегрируя в форму).

Связующим звеном выступает интерфейс, предоставляемый Angular — `ControlValueAccessor`.

Реализовать его контракт достаточно просто. Вы должны:

1. Принимать значение из `FormControl` и отображать его в вашем компоненте (`writeValue`);
2. Уведомлять Angular о том, что пользователь изменил значение, вызывая переданную функцию обратного вызова (`registerOnChange`);
3. Уведомлять Angular о том, что контрол перешел в состояние `touched`, вызывая специальную функцию (`registerOnTouched`);
4. Реагировать на запросы Angular по включению или отключению контрола (`setDisabledState`).

Проиллюстрируем всё это на примере кастомного компонента рейтинга. Он позволяет оценить фильм, выставив ему баллы от 0 до 5. Но вместо числа или ползунка мы хотим, чтобы пользователь кликал по одной из 6 кнопок (которые обычно отображаются как звездочки, но мы упустим это для простоты).

Вот код такого компонента:

```typescript
export class Rating implements ControlValueAccessor {
  private onChange: (rating: number) => void = () => {
    // по умолчанию ничего не делаем
  };

  onTouched: () => void = () => {
    // по умолчанию ничего не делаем
  };

  protected readonly value = signal<number | null>(null);
  protected readonly disabled = signal(false);
  protected readonly pickableValues = [0, 1, 2, 3, 4, 5];

  registerOnChange(fn: (rating: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  writeValue(v: number | null): void {
    this.value.set(v);
  }

  protected setValueAndPropagateChanges(value: number) {
    this.value.set(value);
    // сообщаем Angular, что значение изменилось
    this.onChange(value);
  }
}

```

А вот его шаблон:

```html
@let v = value();
@for (pickableValue of pickableValues; track pickableValue) {
  <button
    [class.selected]="v != null && pickableValue <= v"
    type="button"
    (click)="setValueAndPropagateChanges(pickableValue)"
    [disabled]="disabled()"
    (blur)="onTouched()"
  >
    {{ pickableValue }}
  </button>
}

```

Код работы с двумя callback-функциями и состоянием `disabled` — это шаблонный код (boilerplate), одинаковый почти для всех CVA.

Самая интересная часть — обработка значения. Angular вызывает `writeValue()`, чтобы сообщить компоненту, какое значение нужно отобразить. Здесь мы просто сохраняем значение и используем его в шаблоне, подсвечивая первые кнопки желтым.

При клике по кнопке мы меняем значение в компоненте и обязаны уведомить Angular об этом изменении. Это дает Angular возможность обновить значение контрола формы, запустить валидацию и т.д.

Состояние `disabled` поддерживается путем отключения всех кнопок.

И наконец, мы помечаем контрол как `touched`, как только одна из кнопок рейтинга теряет фокус (вызывая `onTouched()` по событию `blur`).

Последнее, что нужно сделать — зарегистрировать наш компонент как один из value accessor'ов приложения. Для этого добавляется провайдер в декоратор компонента рейтинга. Не вникайте слишком сильно в синтаксис: вы можете просто копировать этот фрагмент при создании новых CVA.

```typescript
providers: [
  {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => Rating),
    multi: true
  }
]

```

Вуаля. Теперь у нас есть отличный переиспользуемый компонент рейтинга, который можно применить в любой форме с помощью стандартных директив Angular:

```html
<ns-rating id="rating" formControlName="rating" />

```

---

#### 20.15. Резюме (Summary)

Angular предлагает два способа построения форм:

1. **Настройка всего в шаблоне (Template-driven).** Но, как вы видели, это заставляет нас создавать кастомные директивы для валидации и усложняет тестирование. Этот подход удобен для простых форм с одним или несколькими полями, давая двустороннее связывание данных из коробки.
2. **Настройка почти всего в компоненте (Code-driven / Reactive).** Этот способ облегчает валидацию и тестирование, поддерживает несколько уровней вложенности групп полей. Это ваше главное оружие для создания сложных форм. Вы даже можете реагировать на изменения группы или отдельного поля.

Пожалуй, самый практичный подход: используйте template-driven и двустороннее связывание, если вам так удобнее, а как только потребуется доступ к группам или контролам формы (например, для сложной валидации или реактивного поведения) — объявляйте нужные контролы в компоненте и связывайте их с шаблоном соответствующими директивами.