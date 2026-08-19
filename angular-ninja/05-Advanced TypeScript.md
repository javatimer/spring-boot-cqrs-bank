### Продвинутый TypeScript

Если вы только начинаете изучать TypeScript, вы можете спокойно пропустить эту главу и вернуться к ней позже. Эта глава создана для того, чтобы продемонстрировать более сложные сценарии использования TypeScript. Они будут иметь смысл только в том случае, если вы уже немного знакомы с языком.

---

### 5.1. `readonly`

Вы можете использовать ключевое слово `readonly`, чтобы сделать свойство класса или интерфейса… доступным только для чтения!

В этом случае компилятор откажется компилировать код, в котором предпринимается попытка присвоить новое значение такому свойству:

```typescript
interface Config {
  readonly timeout: number;
}

const config: Config = { timeout: 2000 };
// `config.timeout` теперь доступен только для чтения и не может быть переопределен

```

---

### 5.2. `keyof`

Ключевое слово `keyof` используется для получения типа, представляющего собой объединение (*union*) имён всех свойств другого типа.

Например, у вас есть интерфейс `PonyModel`:

```typescript
interface PonyModel {
  name: string;
  color: string;
  speed: number;
}

```

Вы хотите написать функцию, которая возвращает значение свойства объекта. Вы могли бы реализовать наивную версию:

```typescript
function getProperty(obj: any, key: string): any {
  return obj[key];
}

const pony: PonyModel = {
  name: 'Rainbow Dash',
  color: 'blue',
  speed: 45
};

const nameValue = getProperty(pony, 'name');

```

Здесь есть две проблемы:

1. В параметр `key` можно передать совершенно любую строку, даже то имя ключа, которого не существует в `PonyModel`.
2. Так как возвращаемый тип равен `any`, вы теряете всю информацию о типах.

Именно здесь `keyof` раскроет весь свой потенциал. `keyof` позволяет получить список всех ключей типа:

```typescript
type PonyModelKey = keyof PonyModel;
// Это то же самое, что и `'name' | 'speed' | 'color'`

let property: PonyModelKey = 'name'; // Работает
property = 'speed'; // Работает
// property = 'other' не скомпилируется

```

Мы можем использовать этот тип, чтобы сделать функцию `getProperty` безопаснее, объявив, что:

* Первый параметр имеет тип `T`.
* Второй параметр имеет тип `K`, который является ключом `T` (`K extends keyof T`).

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const pony: PonyModel = {
  name: 'Rainbow Dash',
  color: 'blue',
  speed: 45
};

// TypeScript автоматически выводит, что `nameValue` имеет тип `string`!
const nameValue = getProperty(pony, 'name');

```

Мы убили двух зайцев одним выстрелом:

1. В параметр `key` теперь можно передать только существующее свойство объекта `PonyModel`.
2. Возвращаемый тип выводится TypeScript автоматически (и это просто отлично!).

Теперь давайте посмотрим, как можно задействовать `keyof` для решения ещё более интересных задач.

---

### 5.3. Сопоставленные типы (Mapped types)

Представьте, что вы хотите создать тип, имеющий ровно те же свойства, что и `PonyModel`, но сделать каждое из них необязательным (*optional*).

Вы, конечно, можете определить его вручную:

```typescript
interface PartialPonyModel {
  name?: string;
  color?: string;
  speed?: number;
}

const pony: PartialPonyModel = {
  name: 'Rainbow Dash'
};

```

Но можно сделать это гораздо универсальнее с помощью сопоставленного типа (*mapped type*):

```typescript
type Partial<T> = {
  [P in keyof T]?: T[P];
};

const pony: Partial<PonyModel> = {
  name: 'Rainbow Dash'
};

```

Тип `Partial` — это трансформатор, который применяет модификатор `?` к каждому свойству типа!

На самом деле вам не нужно объявлять тип `Partial` самостоятельно, так как начиная с версии 2.1 он является встроенной частью языка и объявлен ровно так, как показано в примере выше.

TypeScript предлагаeт и другие сопоставленные типы «из коробки»:

#### 5.3.1. `Readonly`

`Readonly` делает все свойства объекта доступными только для чтения:

```typescript
const pony: Readonly<PonyModel> = {
  name: 'Rainbow Dash',
  color: 'blue',
  speed: 45
};
// все свойства стали `readonly`

```

#### 5.3.2. `Pick`

`Pick` помогает собрать новый тип, взяв только подмножество свойств из исходного типа:

```typescript
const pony: Pick<PonyModel, 'name' | 'color'> = {
  name: 'Rainbow Dash',
  color: 'blue'
};
// `pony` не может иметь свойство `speed`

```

#### 5.3.3. `Record`

`Record` помогает построить тип с теми же ключами, что и у исходного типа, но с другим типом значений:

```typescript
interface FormValue {
  value: string;
  valid: boolean;
}

const pony: Record<keyof PonyModel, FormValue> = {
  name: { value: 'Rainbow Dash', valid: true },
  color: { value: 'blue', valid: true },
  speed: { value: '45', valid: true }
};

```

Существуют и другие встроенные типы, но эти — самые полезные.

---

### 5.4. Объединения типов и защитники типов (Union types and type guards)

Объединения типов (*union types*) — крайне удобная фича.

Представим, что в вашем приложении есть аутентифицированные и анонимные пользователи, и иногда в зависимости от этого нужно выполнять разные действия.

Вы можете смоделировать это следующим образом:

```typescript
interface User {
  type: 'authenticated' | 'anonymous';
  name: string;
  // другие поля
}

interface AuthenticatedUser extends User {
  type: 'authenticated';
  loggedSince: number;
}

interface AnonymousUser extends User {
  type: 'anonymous';
  visitingSince: number;
}

function onWebsiteSince(user: User): number {
  if (user.type === 'authenticated') {
    // это AuthenticatedUser
    return (user as AuthenticatedUser).loggedSince;
  } else if (user.type === 'anonymous') {
    // это AnonymousUser
    return (user as AnonymousUser).visitingSince;
  }
  // TS не знает, что мы охватили все возможные варианты,
  // поэтому нам приходится что-то возвращать по умолчанию
  return 0;
}

```

Не знаю, как вам, а мне не очень нравятся эти явные приведения типов (`as ...`). Можно ли сделать лучше?

Один из вариантов — использовать **защитник типа** (*type guard*): специальную функцию, единственная цель которой — подсказать компилятору TypeScript нужный тип.

```typescript
function isAuthenticated(user: User): user is AuthenticatedUser {
  return user.type === 'authenticated';
}

function isAnonymous(user: User): user is AnonymousUser {
  return user.type === 'anonymous';
}

function onWebsiteSince(user: User): number {
  if (isAuthenticated(user)) {
    // тип автоматически выводится как AuthenticatedUser
    return user.loggedSince;
  } else if (isAnonymous(user)) {
    // тип автоматически выводится как AnonymousUser
    return user.visitingSince;
  }
  // TS всё ещё не знает, что все варианты закрыты,
  // поэтому нужно вернуть дефолтное значение
  return 0;
}

```

Уже лучше! Но нам всё ещё приходится возвращать значение по умолчанию, даже если мы обработали все случаи.

Мы можем ещё немного улучшить ситуацию, если откажемся от функции-защитника типа и используем прямое **дискриминантное объединение** (*discriminated union*).

```typescript
interface BaseUser {
  name: string;
  // другие поля
}

interface AuthenticatedUser extends BaseUser {
  type: 'authenticated';
  loggedSince: number;
}

interface AnonymousUser extends BaseUser {
  type: 'anonymous';
  visitingSince: number;
}

type User = AuthenticatedUser | AnonymousUser;

function onWebsiteSince(user: User): number {
  if (user.type === 'authenticated') {
    // тип выводится как AuthenticatedUser
    return user.loggedSince;
  } else {
    // тип сужается до AnonymousUser
    // даже без явной проверки!
    return user.visitingSince;
  }
  // больше не нужно возвращать значение по умолчанию,
  // так как TS знает, что мы закрыли абсолютно все варианты!
}

```

Это ещё лучше, так как TypeScript автоматически сужает тип в блоке `else`.

Иногда вы заранее знаете, что модель будет расширяться в будущем, и потребуется обрабатывать новые кейсы — например, если мы добавим тип `AdminUser`. В таком случае можно использовать оператор `switch`. Конструкция `switch` с проверкой типов не скомпилируется, если какой-то из вариантов останется необработанным.

Таким образом, добавление `AdminUser` (или любого другого типа пользователя) в будущем сразу вызовет ошибки компиляции во всех местах, где требуется его обработать!

```typescript
interface AdminUser extends BaseUser {
  type: 'admin';
  adminSince: number;
}

type User = AuthenticatedUser | AnonymousUser | AdminUser;

function onWebsiteSince(user: User): number {
  switch (user.type) {
    case 'authenticated':
      return user.loggedSince;
    case 'anonymous':
      return user.visitingSince;
    case 'admin':
      // Без этого кейса код даже не скомпилируется,
      // так как TS выведет ошибку: не все ветки возвращают значение
      return user.adminSince;
  }
}

```

Надеюсь, эти паттерны окажутся вам полезными.

А теперь давайте сосредоточимся на Веб-компонентах (Web Components)!