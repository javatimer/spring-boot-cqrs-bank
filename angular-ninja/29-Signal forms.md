# Формы на сигналах (Signal forms)

В Angular v21 разработчики получили доступ к новому (пока экспериментальному) способу создания форм — **Signal Forms** (Формы на сигналах).
После лет работы с шаблонными формами (`ngModel`) и реактивными формами (`formGroup`/`formControl`), теперь у нас есть третий подход, целиком основанный на сигналах и доступный в пакете `@angular/forms/signals`.
Хотя это отличная новость для будущего, это также означает, что нам нужно изучить третий способ написания форм.
Но не бойтесь, давайте погрузимся в тему!

---

## 29.1. Создание формы с помощью form()

Поскольку этот новый способ основан на сигналах, первое, что нужно сделать в вашем компоненте — это определить сигнал, который будет хранить значение формы.
Затем вы можете создать `FieldTree` для редактирования значения этого сигнала, используя функцию `form()` из пакета `@angular/forms/signals`.
Здесь я хочу написать компонент входа `Login`, где пользователь вводит свои учетные данные:

**login.ts**

```typescript
// 👇 сигнал для хранения учетных данных формы
private readonly credentials = signal({
  login: '',
  password: ''
});

// 👇 форма, созданная из сигнала credentials (тип FieldTree)
protected readonly loginForm = form(this.credentials);

```

Затем нам нужно привязать каждый `input`/`select`/`textarea` к полю формы. Это делается с помощью единой директивы — `FormField`:

**login.html**

```html
<form (submit)="authenticate($event)" novalidate>
  <label for="login">Login</label>
  <input id="login" [formField]="loginForm.login" />
  <label for="password">Password</label>
  <input id="password" [formField]="loginForm.password" />
  <button type="submit">Log in</button>
</form>

```

Вот и всё!
Благодаря одной лишь директиве `[formField]` ваши поля ввода автоматически связываются с полями формы.
Если пользователь что-то вводит в `input`, это обновляет соответствующее свойство сигнала.
И если код изменяет значение сигнала, поле ввода отобразит новое значение.

---

## 29.2. Отправка формы с помощью submit()

Чтобы отправить форму, вы можете прослушивать нативное событие `submit` элемента формы и вызывать метод вашего компонента.
В этом методе вы можете использовать функцию `submit()` из пакета `@angular/forms/signals` для обработки отправки формы.

Эта функция:

* помечает все поля как затронутые (`touched`);
* проверяет валидность формы;
* если форма валидна, вызывает переданное вами асинхронное действие с формой в качестве аргумента.

Аргумент представляет собой тот же объект `FieldTree`, что и `loginForm`, возвращенный функцией `form()`.

Объект `FieldTree` — это ключевая концепция форм на сигналах. Ваша `loginForm` является `FieldTree`, равно как и `loginForm.login`, и `loginForm.password`.
`FieldTree`, как и `Signal`, является объектом, который одновременно можно вызывать как функцию.

Если вы вызовете его (`loginForm()`), он вернет объект `FieldState` с несколькими свойствами-сигналами, которые представляют состояние поля:

* `value()`: текущее значение поля (может быть с задержкой/debounced)
* `controlValue()`: текущее значение в элементе управления формы (всегда актуальное)
* `touched()`: было ли поле затронуто (`touched`) или нет
* `dirty()`: изменялось ли значение поля (`dirty`) или оно еще чистое (`pristine`)
* `disabled()`: отключено ли поле (`disabled`) или нет
* `disabledReasons()`: если поле отключено, причины отключения
* `hidden()`: скрыто ли поле (`hidden`) или нет
* `readonly()`: предназначено ли поле только для чтения (`readonly`) или нет
* `submitting()`: находится ли поле в процессе отправки (`submitting`) или нет

Некоторые свойства связаны с валидацией, которую мы рассмотрим ниже:

* `pending()`: находится ли поле в ожидании (`pending` — выполняются асинхронные валидаторы)
* `valid()`: является ли поле валидным (`valid` — все валидаторы пройдены). Обратите внимание, что `valid()` равно `false` до тех пор, пока не завершатся все асинхронные валидаторы.
* `invalid()`: является ли поле невалидным (`invalid`)
* `errors()`: ошибки поля (если есть)
* `errorSummary()`: ошибки поля и его подполей (если есть)

Оно также имеет несколько методов для изменения состояния поля:

* `reset()` для сброса состояния поля в `pristine` и `untouched` (но это не сбрасывает само значение)
* `markAsTouched()`/`markAsDirty()` для пометки поля как `touched`/`dirty`.

Мы также можем получить `FieldState` для вложенного поля, используя, например, `loginForm.login()`, и каждое свойство тогда будет представлять состояние этого подполя (его значение, измененность и т. д.).

Итак, возвращаясь к отправке нашей формы, мы можем написать:

**login.ts**

```typescript
protected async authenticate(event: SubmitEvent) {
  // 👇 предотвращает стандартное поведение браузера
  event.preventDefault();
  // 👇 отправляет форму, если она валидна, вызывая метод authenticate (возвращающий promise)
  await submit(this.loginForm, form => {
    const { login, password } = form().value();
    return this.userService.authenticate(login, password);
  });
}

```

Обратите внимание, что функция, которую вы передаете в `submit()`, должна возвращать `Promise`. Поэтому, если ваш сервис возвращает `Observable`, вам придется преобразовать его в Promise, например, с помощью функции `firstValueFrom()` из `rxjs`.

Теперь давайте добавим валидацию в нашу форму.

---

## 29.3. Добавление валидации с помощью встроенных валидаторов

Angular предоставляет систему валидации на основе функций, которые можно использовать для программного ограничения значений полей.

Как и в предыдущих системах форм, существует два типа валидаторов:

* **синхронные валидаторы**, которые выполняются немедленно;
* **асинхронные валидаторы**, которые возвращают Promise и выполняются только в том случае, если все синхронные валидаторы поля успешно пройдены.

Сам фреймворк предоставляет несколько встроенных синхронных валидаторов, аналогичных тем, что доступны для реактивных и шаблонных форм:

* `required(field)` — помечает поле как обязательное
* `minLength(field, length)` — задает минимальную длину (для строк или массивов)
* `maxLength(field, length)` — задает максимальную длину (для строк или массивов)
* `min(field, min)` — задает минимальное значение (для чисел)
* `max(field, max)` — задает максимальное значение (для чисел)
* `email(field)` — проверяет корректность email-адреса
* `pattern(field, pattern)` — проверяет значение на соответствие регулярному выражению

Давайте построим еще одну форму — регистрацию (`Register`), позволяющую пользователю создать аккаунт:

**register.ts**

```typescript
protected readonly accountForm = form(
  signal({
    email: '',
    password: ''
  }),
  // 👇 добавляем валидаторы к полям с их сообщениями об ошибках
  form => {
    // email обязателен
    required(form.email, { message: 'Email is required' });
    // должен быть корректным email
    email(form.email, { message: 'Email is not valid' });
    // пароль обязателен
    required(form.password, { message: 'Password is required' });
    // должен содержать не менее 6 символов
    minLength(form.password, 6, {
      // также может быть функцией, если нужно получить доступ к текущему значению/состоянию поля
      message: password => `Password should have at least 6 characters but has only ${password.value().length}`
    });
  }
);

```

Каждый валидатор будет запускаться при изменении значения поля.
Если валидация не проходит, `ValidationError` добавляется в свойство `errors()` поля.

Объект `ValidationError` содержит несколько свойств:

* `kind`: тип ошибки (например, `required`, `minLength` и т. д.)
* `field`: поле, вызвавшее ошибку
* `message`: необязательное понятное человеку сообщение. По умолчанию сообщения нет — вам нужно предоставить его самостоятельно при применении валидатора, если вы хотите его отобразить.

Некоторые валидаторы могут добавлять дополнительные свойства к ошибке, например, валидатор `minLength` добавляет свойство `minLength` к объекту ошибки, чтобы вы могли получить к нему доступ при отображении сообщения.

Эти ошибки можно отобразить в шаблоне, итерируясь по свойству `errors()` поля:

**register.html**

```html
<input id="email" [formField]="accountForm.email" />
@let email = accountForm.email();
@if (email.touched() && !email.valid()) {
  <div data-testid="email-errors">
    @for (error of email.errors(); track error.kind) {
      <div>{{ error.message }}</div>
    }
  </div>
}
@if (accountForm().touched() && !accountForm().valid()) {
  <div data-testid="form-errors">
    @for (error of accountForm().errors(); track error.kind) {
      <div>{{ error.message }}</div>
    }
  </div>
}

```

Встроенные валидаторы делают больше, чем раньше: они также добавляют **метаданные** к полю. Это свойство может быть полезным, чтобы узнать, применен ли валидатор к полю.
Например, в шаблоне вы можете добавить звездочку рядом с меткой обязательных полей:

**register.html**

```html
<label for="email">
  <span>Email</span>
  @let isEmailRequiredMetadata = accountForm.email().metadata(REQUIRED);
  @if (isEmailRequiredMetadata?.()) {
    <span>*</span>
  }
</label>

```

Метод `metadata(REQUIRED)` возвращает сигнал, значение которого может быть `true` или `false`.
Но некоторые валидаторы сохраняют дополнительные детали в этих метаданных. Например, сигнал, возвращаемый `metadata(MIN_LENGTH)`, содержит минимальную длину.
Это мощный механизм, так как вы можете определять собственные метаданные в пользовательских валидаторах и использовать их в шаблоне для отображения динамической информации о правилах валидации.

Встроенные валидаторы имеют ярлык для доступа к этим метаданным в шаблоне. Например, вместо записи `field.metadata(REQUIRED)()` для проверки обязательности поля вы можете написать напрямую `field.required()`:

**register.html**

```html
<label for="email">
  <span>Email</span>
  @let isEmailRequired = accountForm.email().required();
  @if (isEmailRequired) {
    <span>*</span>
  }
</label>

```

---

## 29.4. Валидация по стандартной схеме с помощью validateStandardSchema()

В дополнение к встроенным валидаторам, формы на сигналах предлагают новый способ определения ограничений полей — использование валидации на основе схем (schema validation).

В последнее время эту концепцию популяризировали библиотеки вроде Zod или Valibot. Обе позволяют определять схему для представления ваших данных с использованием функций для задания типов каждого поля и добавления ограничений.
Эти библиотеки и другие объединили усилия для создания стандарта — **Standard Schema**, предоставляющего общий интерфейс `StandardSchemaV1`.

Angular опирается на этот стандарт и предлагает функцию `validateStandardSchema()`, которая принимает такую схему `StandardSchemaV1`. Схема может быть определена с помощью любой библиотеки, которую вы предпочитаете.

Давайте используем Zod Mini для определения схемы валидации нашей формы регистрации:

**register.ts**

```typescript
form => {
  validateStandardSchema(
    form,
    z.object({ email: z.string().check(z.email()), password: z.string().check(z.minLength(6)) })
  );
}

```

Здесь мы не определяем сообщения об ошибках. Ошибки будут сгенерированы автоматически функцией `validateStandardSchema()`, которая возвращает ошибки типа `StandardSchemaValidationError`.
Эти ошибки имеют те же свойства, что и предыдущий `ValidationError`.
Например, если вы введете слишком короткий пароль, вы получите ошибку вида:

`'Too small: expected string to have >=6 characters'`

Это также можно настроить, так как Zod Mini позволяет определять сообщения об ошибках при задании схемы, используя, например:
`z.string().check(z.minLength(6, { message: issue => `Password should have at least ${issue.minimum} characters` }))`.

---

## 29.5. Кастомная валидация с помощью validate() и validateTree()

Вы также можете писать свои собственные валидаторы (как синхронные, так и асинхронные) и применять их с помощью `validate()`.

Начнем с синхронного валидатора, проверяющего, достаточно ли силен пароль в нашей форме регистрации.
Валидатор — это просто функция, принимающая `ChildFieldContext` в качестве аргумента и возвращающая либо `undefined`, если поле валидно, либо `ValidationError`, если поле невалидно.
`ChildFieldContext` предоставляет полезные методы для получения значения или состояния поля (а также значения или состояния других полей, об этом ниже).
Валидаторы типизированы, что является большим улучшением по сравнению с прошлыми системами форм.

**register.ts**

```typescript
// пароль достаточно надежен
validate(form.password, (context: ChildFieldContext<string>) =>
  isTooWeak(context.value()) ? { kind: 'too-weak', message: 'Password is too weak' } : undefined
);

```

Также возможно реализовывать межполевую валидацию (cross-field validation), добавляя валидатор к родительскому полю и проверяя значения подполей.

**register.ts**

```typescript
// пароль отличается от email
validate(form, context => {
  const { email, password } = context.value();
  return email && password && email === password
    ? {
        kind: 'password-different-from-email',
        message: 'Password should not be the same as email'
      }
    : undefined;
});

```

В вашем шаблоне вы можете отобразить эту ошибку межполевой валидации, проверяя ошибки на самой форме:

**register.html**

```html
<input id="email" [formField]="accountForm.email" />
@let email = accountForm.email();
@if (email.touched() && !email.valid()) {
  <div data-testid="email-errors">
    @for (error of email.errors(); track error.kind) {
      <div>{{ error.message }}</div>
    }
  </div>
}
@if (accountForm().touched() && !accountForm().valid()) {
  <div data-testid="form-errors">
    @for (error of accountForm().errors(); track error.kind) {
      <div>{{ error.message }}</div>
    }
  </div>
}

```

Альтернативно, вы можете привязать ошибку межполевой валидации к конкретному полю, используя `validateTree()` вместо `validate()`.
Эта функция работает аналогично `validate()`, но позволяет возвращать ошибки, нацеленные на конкретные подполя дерева.

Например, чтобы проверить, что пароль отличается от email, но при этом отобразить ошибку у поля пароля:

**register.ts**

```typescript
validateTree(form, context => {
  const { email, password } = context.value();
  return email && password && email === password
    ? {
        // 👇 нацелено на поле password
        fieldTree: context.fieldTree.password,
        kind: 'password-different-from-email',
        message: 'Password should not be the same as email'
      }
    : undefined;
});

```

Также можно добавить валидацию к полю и получить значение другого поля с помощью метода `valueOf()`.
Тот же пример можно переписать так:

**register.ts**

```typescript
// 👇 валидатор определен для поля password
validate(form.password, context => {
  // 👇 получаем значение поля email
  const email = context.valueOf(form.email);
  const password = context.value();
  return email && password && email === password
    ? {
        kind: 'is-different-from-email',
        message: 'Password should not be the same as email'
      }
    : undefined;
});

```

---

## 29.6. Извлечение и применение схем с помощью apply()

Чтобы избежать дублирования логики валидации между формами, вы можете вынести ее в переиспользуемую схему.
Затем мы можем применить эту схему к обоим полям формы.

Если оба наших поля `login` и `password` должны быть обязательными и иметь минимальную длину, мы можем определить следующую схему:

**register.ts**

```typescript
const requiredAndMinLengthSchema = schema<string>(field => {
  required(field, { message: 'This field is required' });
  minLength(field, 3, { message: 'Minimum length is 3 characters' });
});

```

Затем мы можем применить эту схему к обоим полям в наших формах:

**register.ts**

```typescript
protected readonly accountForm = form(this.user, context => {
  // 👇 применяем одну и ту же схему к обоим полям
  apply(context.login, requiredAndMinLengthSchema);
  apply(context.password, requiredAndMinLengthSchema);
});

```

Схему также можно применить ко всем элементам массива с помощью `applyEach()`:

**event.ts**

```typescript
protected readonly eventForm = form(
  signal({
    location: '',
    participants: ['ced'] as Array<string>
  }),
  context => {
    // 👇 применяем одну и ту же схему ко всем участникам
    applyEach(context.participants, requiredAndMinLengthSchema);
  }
);

```

Кстати, для отображения массива полей в шаблоне вам нужен лишь обычный цикл `@for`. Никаких специальных директив не требуется.

**event.html**

```html
@for (participant of eventForm.participants; track participant) {
  <div class="participant">
    <label [for]="`participant-${$index}`">Username</label>
    <input [id]="`participant-${$index}`" [formField]="participant" />
    @if (participant().touched() && !participant().valid()) {
      <div [id]="`participant-${$index}-errors`">
        @for (error of participant().errors(); track error.kind) {
          <div>{{ error.message }}</div>
        }
      </div>
    }
  </div>
}

```

`applyEach()` также работает с объектами, применяя схему ко всем свойствам.
Например, если мы хотим сделать все поля обязательными:

**login.ts**

```typescript
protected readonly loginForm = form(
  signal({
    login: '',
    password: ''
  }),
  context => {
    // 👇 применяем схему required ко всем полям
    applyEach(context, requiredSchema);
  }
);

```

---

## 29.7. Асинхронная валидация с помощью validateAsync() и validateHttp()

Валидация также может быть асинхронной благодаря функции `validateAsync()`, которая использует `Resource`:

```typescript
// email еще не зарегистрирован (асинхронная валидация)
validateAsync(form.email, {
  params: (email: ChildFieldContext<string>) => email.value(),
  factory: (params: Signal<string | undefined>) =>
    resource({
      // 👇 Params содержит сигнал `email` и используется для триггера ресурса
      params,
      // loader делает HTTP-вызов для проверки, зарегистрирован ли email
      loader: async (loaderParams: ResourceLoaderParams<string | undefined>) =>
        // возвращает true, если email уже зарегистрирован
        await this.userService.isRegistered(loaderParams.params)
    }),
  // 👇 вызывается с результатом ресурса
  onSuccess: (response: { isRegistered: boolean }) =>
    response.isRegistered
      ? {
          kind: 'email-already-registered',
          message: 'Email is already registered'
        }
      : undefined,
  // 👇 вызывается при ошибке ресурса
  onError: () => ({
    kind: 'email-check-failed',
    message: 'Could not verify if the email is already registered'
  })
});

```

Ресурс автоматически вызывается при изменении значения поля, а поле помечается как `pending()` во время ожидания результата ресурса. Когда ресурс разрешается, если он возвращает ошибку, она добавляется в `errors()` поля.

В качестве альтернативы, если вам нужно вызвать HTTP-эндпоинт для валидации поля, вы можете использовать `httpResource()` с функцией `validateHttp()`:

**register.ts**

```typescript
// email еще не зарегистрирован (асинхронная валидация)
validateHttp(form.email, {
  // 👇 httpResource срабатывает при изменении сигнала email
  request: (email: ChildFieldContext<string>) => `/api/users/check?email=${email.value()}`,
  onSuccess: (response: { isRegistered: boolean }) =>
    response.isRegistered
      ? {
          kind: 'email-already-taken',
          message: 'Email is already taken'
        }
      : undefined,
  onError: () => ({
    kind: 'email-check-failed',
    message: 'Could not verify if the email is already taken'
  })
});

```

В этом случае вам нужно всего лишь указать URL запроса.

---

## 29.8. Серверные ошибки

Функция `submit()`, которую мы рассмотрели ранее, имеет еще одну интересную особенность: если переданное вами действие возвращает ошибки, они автоматически добавляются в `errors()` соответствующих полей (или всей формы, если вы не указали конкретное поле).

**register.ts**

```typescript
await submit(this.loginForm, async form => {
  const { login, password } = form().value();
  try {
    await this.userService.authenticate(login, password);
    return;
  } catch (error) {
    // 👇 добавляем ошибку в форму
    const message = (error as Error).message;
    return [{ kind: 'invalid-credentials', message }];
  }
});

```

Это позволяет объединять ошибки, обнаруженные на стороне клиента, с ошибками, полученными от сервера.

---

## 29.9. Динамическое поведение

Более реалистичная форма часто обладает динамическим поведением — например, включением/отключением или скрытием/отображением полей на основе значений других полей, либо добавлением/удалением валидаторов.

Чтобы скрыть поле, вы можете использовать функцию `hidden()`, которая позволяет указать, когда поле должно быть скрыто в зависимости от состояния формы. Когда поле скрыто, оно исключается из валидации. В шаблоне вы можете использовать блок `@if` для отображения поля только тогда, когда оно не скрыто.

Аналогично, чтобы отключить поле, вы можете использовать функцию `disabled()` в схеме формы.
Здесь поле `password` отключено до тех пор, пока `login` не станет валидным:

**register.ts**

```typescript
protected readonly loginForm = form(this.credentials, f => {
  required(f.login);
  // 👇 отключаем поле password, пока не будет введен валидный login
  disabled(f.password, ({ stateOf }) => {
    return !stateOf(f.login).valid();
  });
});

```

Вы можете пойти еще дальше и вернуть строку из логики `disabled`, чтобы заполнить `disabledReasons()` поля.

Последняя функция, которую стоит знать — это `readonly()`, которая делает поле доступным только для чтения. Это полезно, когда вы хотите отобразить поле ввода, которое пользователь не должен редактировать, но которое все равно должно отправляться вместе с формой.

`disabled()` и `readonly()` автоматически обновляют HTML-атрибуты соответствующего поля в шаблоне: вам не нужно делать ничего специального, чтобы инпут стал disabled в шаблоне формы.

Заблокированные (`disabled`) поля ведут себя не так, как в реактивных формах: их значение по-прежнему является частью значения формы при ее отправке. Положительная сторона заключается в том, что вам не нужно иметь дело с тем фактом, что все свойства потенциально могут быть `undefined`. Отрицательная сторона состоит в том, что вам нужно быть осторожными перед отправкой этого значения на сервер: оно может быть невалидным, если поступило из заблокированного поля. То же самое касается и скрытых (`hidden`) полей.

Эти функции можно использовать вместе для создания сложного динамического поведения, и их можно применять условно.
Второй параметр функции `form()` не является реактивной функцией, что означает, что вы не можете использовать условия `if`/`else` на основе сигналов прямо внутри нее. Для условного применения этих функций необходимо использовать `applyWhenValue()`/`applyWhen()`.

Например, чтобы сделать поле обязательным только тогда, когда пользователь не является администратором (предположим, эта информация хранится в сигнале `isAdmin`):

**register.ts**

```typescript
protected readonly accountForm = form(this.user, form => {
  // 👇 поле birthYear обязательно только тогда, когда пользователь не админ
  applyWhenValue(
    form,
    () => !this.userService.isAdmin(),
    form => {
      required(form.birthYear, { message: 'Birth year is required for non-admin users' });
    }
  );
});

```

Если логика зависит от другого поля формы, вместо этого вы можете использовать `applyWhen()`, который дает доступ к форме и ее полям через `valueOf`/`stateOf`:

**register.ts**

```typescript
protected readonly accountForm = form(this.user, form => {
  // 👇 поле birthYear обязательно только тогда, когда чекбокс isAdmin не отмечен
  applyWhen(
    form,
    context => !context.valueOf(form.isAdmin),
    form => {
      required(form.birthYear, { message: 'Birth year is required for non-admin users' });
    }
  );
});

```

---

## 29.10. Задержка обновлений формы с помощью debounce()

Иногда требуется контролировать время синхронизации изменений элемента управления с моделью формы.
Например, вы можете захотеть отложить валидацию, пока пользователь еще печатает, чтобы избежать выполнения ресурсоемких проверок при каждом нажатии клавиши.

Формы на сигналах предоставляют функцию `debounce()`, позволяющую управлять временем обновления полей формы:

```typescript
// 👇 предположим, что вычисление ресурсоемкое, и мы хотим добавить задержку
debounce(form.password, 500);

// пароль достаточно надежен
validate(form.password, (context: ChildFieldContext<string>) =>
  isTooWeak(context.value()) ? { kind: 'too-weak', message: 'Password is too weak' } : undefined
);

```

Когда правило задержки применено к полю, сигнал `value` может отставать от сигнала `controlValue`.
`controlValue` представляет собой текущее значение в контроле формы (то, что пользователь только что ввел), тогда как `value` представляет собой значение после задержки (debounced value), которое синхронизируется с моделью формы.

Задержка `debounce` может быть фиксированным числом (в миллисекундах) или функцией, возвращающей Promise.

---

## 29.11. Кастомные компоненты форм с FormValueControl и FormCheckboxControl

Иногда нам необходимо создавать пользовательские компоненты форм. Раньше для этого использовался `ControlValueAccessor`, но в формах на сигналах появился новый и более простой способ: реализация интерфейса `FormUiControl` или, точнее, одного из его дочерних интерфейсов — `FormCheckboxControl` (для логических элементов управления) и `FormValueControl` (для других типов значений).

Кастомные компоненты форм, использующие `ControlValueAccessor`, по-прежнему поддерживаются в Signal Forms, но для новых компонентов рекомендуется использовать эти новые интерфейсы.

Эти интерфейсы определяют только `input` и `model`, которые должен иметь ваш компонент, а Angular автоматически привяжет состояние директивы `Field` к этим сигналам.

Свойства для реализации:

* `value`: (только для `FormValueControl`) model input, определяющий значение поля
* `checked`: (только для `FormCheckboxControl`) model input, определяющий, отмечено ли поле
* `touched`: model input, определяющий, было ли поле затронуто
* `disabled`/`disabledReasons`/`readonly`/`hidden`/`dirty`: inputs, содержащие состояние поля
* `errors`/`invalid`/`pending`: inputs, содержащие состояние валидации поля
* `required`/`minLength`/`maxLength`/`min`/`max`/`pattern`: inputs, содержащие встроенные валидаторы, примененные к полю

Все эти свойства являются необязательными, кроме `value` или `checked` (в зависимости от реализуемого интерфейса). Большинство свойств являются входными параметрами только для чтения (`read-only inputs`), за исключением `value`, `checked` и `touched`, которые являются `model inputs`, поскольку компонент должен их обновлять.

Давайте построим компонент `Rating`, позволяющий пользователю выбрать рейтинг от 1 до 5. Значение будет числом, поэтому реализуем интерфейс `FormValueControl<number | null>`:

**rating.ts**

```typescript
export class Rating implements FormValueControl<number | null> {
  readonly value = model.required<number | null>();
  readonly touched = model.required<boolean>();
  readonly disabled = input.required<boolean>();

  protected readonly pickableValues = [0, 1, 2, 3, 4, 5];
}

```

Шаблон достаточно прост. Мы итерируемся по возможным рейтингам и отображаем кнопку для каждого значения. Клик по кнопке обновляет значение. А при потере фокуса (событие `blur`) мы помечаем поле как `touched`.

**rating.html**

```html
@let v = value();
@for (pickableValue of pickableValues; track pickableValue) {
  <button
    [class.selected]="v != null && pickableValue <= v"
    type="button"
    (click)="value.set(pickableValue)"
    [disabled]="disabled()"
    (blur)="touched.set(true)"
  >
    {{ pickableValue }}
  </button>
}

```

Изменение значения `model inputs` автоматически обновляет состояние поля в форме. И в обратном направлении: изменение состояния поля автоматически обновляет `inputs` компонента.

Наш компонент затем может быть использован в форме следующим образом:

**movie-review.ts**

```html
<ns-rating id="rating" [formField]="movieForm.rating" />

```

---

## 29.12. Вложенные формы (Sub forms)

Иногда не хочется определять всю форму в одном компоненте. Вы можете захотеть разделить ее на несколько подформ, каждая из которых определена в своем собственном компоненте.

С формами на сигналах это легко сделать, передав поле в дочерний компонент.
Предположим, у нашей формы пользователя есть подформа адреса:

**register.ts**

```typescript
protected readonly user = signal({
  firstname: '',
  lastname: '',
  address: {
    number: '',
    street: '',
    zipcode: '',
    city: ''
  }
});

protected readonly userForm = form(this.user, f => {
  required(f.firstname, { message: 'First name is required' });
  required(f.lastname, { message: 'Last name is required' });
  // 👇 схема адреса может быть определена отдельно и переиспользована
  apply(f.address, addressSchema);
});

```

Мы можем определить компонент `Address`, принимающий `FieldTree` для адреса:

**address.ts**

```typescript
export class AddressSubForm {
  readonly addressField = input.required<FieldTree<AddressModel>>();
}

```

В шаблоне мы можем использовать директиву `FormField` для связывания инпутов с полями адреса:

**address.html**

```html
@let address = addressField();
<div>
  @let number = address.number;
  <label for="number">Number</label>
  <input id="number" [formField]="number" />
  @if (number().touched() && number().invalid()) {
    <div>
      @for (error of number().errors(); track error.kind) {
        <div>{{ error.message }}</div>
      }
    </div>
  }
</div>

```

Затем мы можем использовать наш компонент `Address` в шаблоне регистрации:

**register.html**

```html
<ns-address-sub-form [addressField]="userForm.address" />

```

Это делает разделение формы на несколько компонентов очень простым!

---

## 29.13. CSS-классы с помощью provideSignalFormsConfig()

Еще одна хорошая функция Signal Forms — возможность автоматически применять CSS-классы к полям на основе их состояния.

Это делается путем предоставления конфигурации с помощью функции `provideSignalFormsConfig()`:

**app.config.ts**

```typescript
provideSignalFormsConfig({
  classes: {
    'is-invalid': field => field.state().invalid() && field.state().touched()
  }
});

```

В этом примере мы автоматически добавляем CSS-класс `is-invalid` к любому полю, которое является невалидным (`invalid`) и затронутым (`touched`).

---

## 29.14. Заключение

Signal Forms приносят новый способ создания форм в Angular, основанный на сигналах и с новым подходом к валидации и реактивности.

Хотя они пока остаются экспериментальными, они уже предлагают множество интересных возможностей, которые делают построение форм проще и приятнее, чем раньше.

Среди преимуществ: типобезопасность стала выше, чем раньше; межполевую валидацию проще реализовывать (больше не нужно использовать `FormGroup`); а создание пользовательских компонентов форм стало проще (`FormValueControl` намного проще, чем `ControlValueAccessor`).

В будущем было бы отлично увидеть некоторые улучшения, такие как лучшая поддержка отображения сообщений об ошибках в шаблоне (итерирование по `errors()` — немного низкоуровневый подход для большинства сценариев).