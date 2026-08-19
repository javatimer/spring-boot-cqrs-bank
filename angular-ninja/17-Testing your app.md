# 17. Тестирование вашего приложения

## 17.1. Проблема с отладкой в том, что отладка даёт сдачу

Я люблю автоматизированное тестирование.
Моя профессиональная жизнь вращается вокруг шкалы прогресса тестов, которая становится зелёной в моей IDE, похлопывая меня по спине за хорошо выполненную работу.
И я надеюсь, что вам тесты тоже небезразличны, ведь это единственная сетка безопасности, которая у нас есть при написании кода.
Нет ничего более скучного, чем ручное тестирование кода.
Angular отлично справляется с тем, чтобы позволить нам легко писать тесты.
Мы можем писать два типа тестов:

* юнит-тесты (модульные тесты)
* сквозные тесты (end-to-end / e2e)

Первые предназначены для проверки того, что небольшой модуль кода (компонент, сервис, пайп…) работает корректно в изоляции, то есть без учёта его зависимостей.
Написание такого юнит-теста требует от вас выполнения каждого из методов компонента/сервиса/пайпа (напрямую или путем имитации взаимодействия пользователя с UI компонента) и проверки того, что выходные данные соответствуют ожиданиям относительно переданных входных данных.
Мы также можем проверить, что зависимости, используемые этим модулем, вызываются правильно: например, убедиться, что сервис выполнит корректный HTTP-запрос.

Мы также можем писать сквозные тесты.
Их цель — эмулировать реальное взаимодействие пользователя с вашим приложением, запуская реальный экземпляр и затем управляя браузером: вводя значения в поля ввода, нажимая кнопки и т. д.
Затем мы проверяем, находится ли отображаемая страница в ожидаемом состоянии, корректен ли URL — и всё остальное, что вы только можете придумать.
Мы рассмотрим всё это, но давайте начнём с части, посвящённой юнит-тестам.

---

## 17.2. Юнит-тесты

Как мы видели ранее, юнит-тесты служат для проверки небольшого модуля кода в изоляции.
Эти тесты могут проверить только небольшую часть вашего приложения, но они имеют ряд преимуществ:

* они очень быстрые — вы можете запустить несколько сотен тестов за пару секунд.
* они являются очень эффективным способом проверить (почти) весь ваш код, особенно сложные случаи, которые трудно протестировать вручную в реальном приложении.

Одна из ключевых концепций юнит-тестирования — изоляция: мы не хотим, чтобы на наш тест влияли его зависимости.
Поэтому в качестве зависимостей мы обычно используем «мок»-объекты (mock).
Это фейковые объекты, которые мы создаём исключительно для целей тестирования.

Для этого мы будем полагаться на несколько инструментов.
Сначала нам нужна библиотека для написания тестов и раннер (runner) для их выполнения.
Angular CLI поставляется со встроенной поддержкой Jasmine и Karma, поэтому их используют в большинстве проектов Angular.
Однако начиная с Angular 21, хотя Jasmine и Karma всё ещё поддерживаются, библиотекой и раннером по умолчанию является Vitest.

**Что выбрать**

Поддержка Vitest в Angular (на момент написания этого раздела) всё ещё имеет некоторую шероховатость.
Тем не менее, для нового проекта я бы посоветовал вам выбрать Vitest для ваших юнит-тестов.
Даже если вы привыкли к Jasmine, вы быстро освоитесь с Vitest.
Его API очень похож на API Jasmine, а раннер намного удобнее для пользователя, чем Karma (который объявлен устаревшим / deprecated). И он обладает несколькими преимуществами, о которых мы скоро поговорим.
Я не удивлюсь, если поддержка Jasmine/Karma со временем вовсе исчезнет из CLI.
CLI уже предоставляет автоматическую миграцию, которая должна преобразовать большую часть кода существующих тестов на Jasmine. Поэтому, даже если у вас в проектах уже написано много юнит-тестов на Jasmine и они запускаются через Karma, я бы рекомендовал при первой возможности мигрировать на Vitest или, как минимум, писать новые тесты на Vitest.
Однако будьте внимательны: на момент написания этих строк Vitest не позволяет использовать ZoneJS.

### 17.2.1. Vitest

Даже если вы планируете использовать Jasmine и Karma, я советую вам прочитать этот раздел.
Большая часть того, что вы прочтёте, применима к обоим фреймворкам тестирования, и их API очень похожи.

Vitest предоставляет нам несколько методов для объявления наших тестов:

* `describe()` определяет тест-сюиту (набор тестов)
* `it()` или `test()` определяет отдельный тест
* `expect()` определяет утверждение (assertion)

Базовый тест на JavaScript с использованием Jasmine/Vitest выглядит так:

```typescript
class Pony {
  constructor(
    public name: string,
    public speed: number
  ) {}

  isFasterThan(speed: number): boolean {
    return this.speed > speed;
  }
}

describe('My first test suite', () => {
  it('should construct a Pony', () => {
    const pony = new Pony('Rainbow Dash', 10);
    expect(pony.name).toBe('Rainbow Dash');
    expect(pony.speed).not.toBe(1);
    expect(pony.isFasterThan(8)).toBe(true);
  });
});

```

Вызов `expect()` можно связывать цепочкой с множеством методов, таких как `toBe()`, `toBeLessThan()`, `toBeUndefined()` и т. д.
Каждый метод можно инвертировать с помощью атрибута `not` у объекта, возвращаемого `expect()`.

Тестовый файл — это отдельный файл от кода, который вы хотите протестировать, обычно с расширением `.spec.ts`.
Тест для класса `Pony`, написанного в файле `pony.ts`, скорее всего, будет находиться в файле `pony.spec.ts`.
В проектах Angular мы обычно помещаем тестовый файл рядом с тестируемым файлом.

Вы также можете использовать функцию `beforeEach()` для настройки контекста перед каждым тестом — так называемой фикстуры (fixture).
Если у меня есть несколько тестов для одного и того же пони, имеет смысл использовать `beforeEach()` для инициализации объекта `Pony`, вместо того чтобы копировать один и тот же код в каждый тест:

```typescript
describe('Pony', () => {
  let pony: Pony;

  beforeEach(() => {
    pony = new Pony('Rainbow Dash', 10);
  });

  it('should have a name', () => {
    expect(pony.name).toBe('Rainbow Dash');
  });

  it('should have a speed', () => {
    expect(pony.speed).not.toBe(1);
    expect(pony.speed).toBeGreaterThan(9);
  });
});

```

Также существует функция `afterEach`, но она требуется редко.

Последний трюк: Vitest позволяет создавать фейковые функции (моки или спаи/шпионы, как вам удобнее) или даже шпионить за методом реального объекта.
Затем мы можем сделать некоторые утверждения относительно этих функций, например с помощью `toHaveBeenCalled()`, который проверяет, вызывался ли метод, или с помощью `toHaveBeenCalledWith()`, который проверяет точные параметры вызова спай-метода.
Вы также можете проверить, сколько раз вызывался метод, вызывался ли он вообще и т. д.

Например, допустим, у нас есть класс `Race` с методом `start()`, который вызывает `run()` для каждого пони в гонке и фильтрует тех пони, которые не начали бежать (`run()` возвращает `boolean`):

`Race.ts`

```typescript
class Race {
  constructor(private ponies: Array<Pony>) {}

  start(): Array<Pony> {
    return (
      this.ponies
        // запускаем каждого пони
        // и оставляем только тех, кто начал бежать
        .filter(pony => pony.run(10))
    );
  }
}

```

Мы хотим протестировать метод `start()` и проверить, правильно ли он вызывает `run()`.
Поэтому мы шпионим за методом `run()` всех пони в гонке:

`Race.spec.ts`

```typescript
describe('Race', () => {
  let rainbowDash: Pony;
  let pinkiePie: Pony;
  let race: Race;

  beforeEach(() => {
    rainbowDash = new Pony('Rainbow Dash');
    // первый пони соглашается бежать
    vi.spyOn(rainbowDash, 'run').mockReturnValue(true);

    pinkiePie = new Pony('Pinkie Pie');
    // второй пони отказывается бежать
    vi.spyOn(pinkiePie, 'run').mockReturnValue(false);

    // создаем гонку с этими двумя пони
    race = new Race([rainbowDash, pinkiePie]);
  });
});

```

и проверяем, вызываются ли методы:

`Race.spec.ts`

```typescript
it('should make the ponies run when it starts', () => {
  // старт гонки
  const runningPonies: Array<Pony> = race.start();
  // должен был вызвать `run()` у пони
  expect(pinkiePie.run).toHaveBeenCalled();
  // со скоростью 10
  expect(rainbowDash.run).toHaveBeenCalledWith(10);
  // так как один пони отказался бежать, результатом должен быть массив из одного пони
  expect(runningPonies).toEqual([rainbowDash]);
});

```

Когда вы пишете юнит-тесты, помните, что они должны быть небольшими и читаемыми.
И не забудьте сначала заставить их упасть (fail), чтобы убедиться, что вы тестируете именно то, что нужно.

Следующий шаг — запуск наших тестов. За это также отвечает Vitest.
Мы можем выполнить все тесты одновременно или только некоторые из них.
Кроме того, Vitest может отслеживать файлы и перезапускать тесты, которые необходимо выполнить заново после каждого сохранения.
Поскольку запуск тестов происходит очень быстро, делать это и получать (почти) мгновенную обратную связь по вашему коду — одно удовольствие.

Итак, теперь мы знаем, как написать юнит-тест на TypeScript.
Давайте добавим в эту смесь Angular.

### 17.2.2. Использование внедрения зависимостей (Dependency Injection)

Допустим, у меня есть Angular-приложение с простым сервисом `RaceService`, содержащим метод, который возвращает захардкоженный список гонок:

```typescript
@Injectable({
  providedIn: 'root'
})
export class RaceService {
  list(): Array<RaceModel> {
    const race1: RaceModel = { name: 'London' };
    const race2: RaceModel = { name: 'Lyon' };
    return [race1, race2];
  }
}

```

Напишем для него тест:

```typescript
describe('RaceService', () => {
  it('should return races when list() is called', () => {
    const raceService = new RaceService();
    expect(raceService.list().length).toBe(2);
  });
});

```

Это отлично работает.
Но мы также можем положиться на внедрение зависимостей, предоставляемое Angular, чтобы получить `RaceService` и внедрить его в наш тест.
Это особенно полезно, если сам `RaceService` имеет какие-то зависимости:
вместо того чтобы создавать эти зависимости вручную, мы можем просто доверить это инжектору, сказав:
«Эй, мне нужен `RaceService`, разберись сам, что требуется для его создания, и дай его мне».

Чтобы использовать систему внедрения зависимостей в нашем тесте, во фреймворке есть утилитарный метод в `TestBed` под названием `inject`.
Этот метод позволяет получить конкретную зависимость из инжектора внутри тестовой функции.
Давайте вернёмся к нашему примеру, на этот раз используя `TestBed.inject`:

```typescript
import { TestBed } from '@angular/core/testing';

describe('RaceService', () => {
  it('should return races when list() is called', () => {
    const raceService = TestBed.inject(RaceService);
    expect(raceService.list().length).toBe(2);
  });
});

```

Это работает, потому что сервис объявлен с `providedIn: 'root'`, что делает его доступным в тесте.
Он будет создан и внедрён лениво (по требованию), когда понадобится в тесте.

Как мы делали в простом примере с Vitest, мы можем вынести инициализацию `RaceService` в метод `beforeEach`.
Мы также можем использовать `TestBed.inject` внутри `beforeEach`, так что давайте сделаем это:

```typescript
import { TestBed } from '@angular/core/testing';

describe('RaceService', () => {
  let service: RaceService;

  beforeEach(() => (service = TestBed.inject(RaceService)));

  it('should return races when list() is called', () => {
    expect(service.list().length).toBe(2);
  });
});

```

Мы переместили логику `TestBed.inject` в `beforeEach`, и теперь наш тест выглядит очень чисто.

---

## 17.3. Фейковые зависимости

Класс `TestBed` поможет нам объявлять фейковые зависимости.
Хотя Angular позволяет создавать приложения без определения модулей Angular, его утилита `TestBed` всё ещё спроектирована вокруг концепции тестового модуля, который можно настроить практически так же, как и модуль Angular.
Поскольку мы используем standalone-компоненты, основная цель этого тестового модуля будет состоять в предоставлении фейковых зависимостей вместо реальных.

Метод `TestBed.configureTestingModule` позволяет указать массив провайдеров (`providers`), которые заменят реальные зависимости, внедряемые в тестируемый компонент, пайп, директиву или сервис.

Ради примера допустим, что наш `RaceService` использует `localStorage` для хранения гонок с ключом `'races'`.
Ваши коллеги разработали сервис под названием `LocalStorageService`, который занимается сериализацией JSON и т. д., и его использует наш `RaceService`.

Метод `list()` выглядит так:

```typescript
@Injectable({
  providedIn: 'root'
})
export class RaceService {
  private readonly localStorage = inject(LocalStorageService);

  list(): Array<RaceModel> {
    return this.localStorage.get('races');
  }
}

```

Теперь мы не хотим тестировать сам `LocalStorageService`: мы хотим протестировать только наш `RaceService`.
Это легко сделать, воспользовавшись системой внедрения зависимостей и передав фейковый `LocalStorageService`:

```typescript
export class MockLocalStorage {
  get(_key: string): Array<RaceModel> {
    return [{ name: 'Lyon' }, { name: 'London' }];
  }
}

```

сервису `RaceService` в нашем тесте с помощью `provide`:

```typescript
import { TestBed } from '@angular/core/testing';

describe('RaceService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [{ provide: LocalStorageService, useClass: MockLocalStorage }]
    })
  );

  it('should return 2 races from localStorage', () => {
    const service = TestBed.inject(RaceService);
    const races = service.list();
    expect(races.length).toBe(2);
  });
});

```

Отлично!
Но я не до конца доволен этим тестом.
Создавать фейковый сервис вручную утомительно, и Vitest может помочь нам зашпионить за сервисом и заменить его реализацию на фейковую.
Это также позволяет убедиться, что метод `get()` был вызван с правильным ключом `'races'`:

```typescript
import { TestBed } from '@angular/core/testing';

describe('RaceService', () => {
  const localStorage = {
    get: vi.fn().mockName('LocalStorageService.get')
  };

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [{ provide: LocalStorageService, useValue: localStorage }]
    })
  );

  it('should return 2 races from localStorage', () => {
    localStorage.get.mockReturnValue([{ name: 'Lyon' }, { name: 'London' }]);

    const service = TestBed.inject(RaceService);
    const races = service.list();

    expect(races.length).toBe(2);
    expect(localStorage.get).toHaveBeenCalledWith('races');
  });
});

```

---

## 17.4. Тестирование компонентов

Следующий шаг после тестирования простого сервиса — тестирование компонента.
Тест компонента немного отличается, потому что мы хотим протестировать не только код внутри TypeScript-класса, но и шаблон компонента.

Давайте начнём с написания компонента для тестирования.
Почему бы не взять наш компонент `Pony`?
Он принимает `pony` в качестве `input` и генерирует событие `ponyClicked` при клике на компонент.

```typescript
@Component({
  selector: 'ns-pony',
  template: ` <img [src]="ponyImageUrl()" [alt]="ponyModel().name" (click)="clickOnPony()" /> `
})
export class Pony {
  readonly ponyModel = input.required<PonyModel>();
  readonly running = input(false);
  protected readonly ponyImageUrl = computed(
    () => `/images/pony-${this.ponyModel().color.toLowerCase() + (this.running() ? '-running' : '')}.png`
  );
  readonly ponyClicked = output<PonyModel>();

  protected clickOnPony(): void {
    this.ponyClicked.emit(this.ponyModel());
  }
}

```

У него довольно простой шаблон:
изображение с динамическим источником в зависимости от цвета пони и обработчик клика.

Чтобы протестировать такой компонент, сначала нужно создать его экземпляр.
Поскольку у нашего компонента есть входы (`inputs`), в тестах довольно часто создают обёрточный (тестовый) компонент и создают экземпляр этого тестового компонента (чтобы мы могли легко передавать входы для проверки выходов).

Для этого мы используем `TestBed`.
Этот класс поставляется с утилитарным методом `createComponent` для создания компонента.
Метод возвращает `ComponentFixture` — представление нашего компонента.

```typescript
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { Pony, PonyModel } from './pony';

@Component({
  imports: [Pony],
  template: `<ns-pony [ponyModel]="ponyModel()" (ponyClicked)="betOnPony($event)" />`
})
class PonyTest {
  readonly ponyModel = signal<PonyModel>({ id: 1, name: 'Rainbow Dash', color: 'BLUE' });
  readonly betPony = signal<PonyModel | undefined>(undefined);

  betOnPony(event: PonyModel) {
    this.betPony.set(event);
  }
}

describe('Pony', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should have an image', async () => {
    // Given: дан компонент пони
    const fixture = TestBed.createComponent(PonyTest);
    await fixture.whenStable();

    // When: когда мы получаем отображаемое изображение
    const element = fixture.nativeElement as HTMLElement;
    const imageElement = element.querySelector('img')!;

    // Then: тогда у нас должно быть изображение с правильным атрибутом src
    // в зависимости от цвета пони
    expect(imageElement.getAttribute('src')).toContain('/images/pony-blue.png');
    expect(imageElement.getAttribute('alt')).toBe('Rainbow Dash');
  });
});

```

Здесь мы следуем паттерну «Given/When/Then» (Дано / Когда / Тогда) для написания юнит-теста.
Вы найдете целую литературу на эту тему, но суть сводится к следующему:

* Фаза **"Given"** (Дано): где мы настраиваем контекст теста. Мы получаем экземпляр тестового компонента, созданный с пони. Это эмулирует входной параметр, который в реальном приложении пришел бы от родительского компонента. Мы настроили тест так, чтобы автоматически отслеживать изменения с помощью `ComponentFixtureAutoDetect`. В тесте мы затем можем дождаться синхронизации DOM при наличии изменений с помощью метода `whenStable()`.
* Фаза **"When"** (Когда): где мы получаем элемент изображения.
* Фаза **"Then"** (Тогда): содержащая проверки и ожидания (expectations).

Мы можем получить нативный элемент и выполнять запросы к DOM так же, как в браузере (используя, например, `querySelector()`).
Здесь мы проверяем, является ли источник изображения правильным.

Мы также можем проверить, действительно ли компонент генерирует событие:

```typescript
it('should emit an event on click', async () => {
  // Given: дан компонент пони
  const fixture = TestBed.createComponent(PonyTest);
  await fixture.whenStable();

  // When: когда мы кликаем по пони
  const element = fixture.nativeElement as HTMLElement;
  const image = element.querySelector('img')!;
  image.dispatchEvent(new Event('click'));

  // и ждем синхронизации шаблона
  await fixture.whenStable();

  // Then: тогда эмиттер событий должен был сгенерировать событие
  expect(fixture.componentInstance.betPony()).toBe(fixture.componentInstance.ponyModel());
});

```

Давайте посмотрим на другой компонент:

```typescript
@Component({
  selector: 'ns-race',
  template: `
    <div>
      <h1>{{ raceModel().name }}</h1>
      @for (currentPony of raceModel().ponies; track currentPony.id) {
        <ns-pony [ponyModel]="currentPony" />
      }
    </div>
  `,
  imports: [Pony]
})
export class Race {
  protected readonly raceModel = input.required<RaceModel>();
}

```

и его тест:

```typescript
@Component({
  imports: [Race],
  template: `<ns-race [raceModel]="raceModel()" />`
})
class RaceTest {
  readonly raceModel = signal<RaceModel>({
    name: 'Paris',
    ponies: [{ id: 1, name: 'Rainbow Dash', color: 'BLUE' }]
  });
}

describe('Race', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should have a name and a list of ponies', async () => {
    const fixture = TestBed.createComponent(RaceTest);
    // Given: данный экземпляр компонента с инициализированным входом race
    fixture.componentInstance.raceModel.set({
      name: 'London',
      ponies: [{ id: 1, name: 'Rainbow Dash', color: 'BLUE' }]
    });

    // When: когда мы ждем синхронизации шаблона
    await fixture.whenStable();

    // Then: тогда у нас должен быть заголовок с названием гонки
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')!.textContent).toBe('London');

    // и список пони
    const ponies = fixture.debugElement.queryAll(By.directive(Pony));
    expect(ponies.length).toBe(1);
    // мы можем проверить, правильно ли инициализирован пони
    const rainbowDash = ponies[0].componentInstance.ponyModel();
    expect(rainbowDash.name).toBe('Rainbow Dash');
  });
});

```

Здесь мы запрашиваем все директивы типа `Pony` и проверяем, правильно ли инициализирован первый пони.
Вы можете получить дочерние компоненты с помощью `children` или запрашивать их через `query()` и `queryAll()`.
Эти методы принимают предикат в качестве аргумента, которым может быть либо `By.css`, либо `By.directive`.
Именно это мы и делаем для получения отображаемых пони, так как они являются экземплярами `Pony`.

Имейте в виду, что это отличается от запроса к DOM с помощью `querySelector()`:
он найдет только те элементы, которыми управляет Angular, и вернет `ComponentFixture`, а не DOM-элемент (поэтому у вас будет доступ, например, к `componentInstance` результата).

Начиная с Angular v20.1, можно напрямую привязывать входы (inputs) и выходы (outputs) компонента при его создании через `TestBed.createComponent()`:

```typescript
it('should emit an event on click', async () => {
  const betPony = signal<PonyModel | undefined>(undefined);
  // Given: дан компонент пони
  const fixture = TestBed.createComponent(Pony, {
    bindings: [
      // 👇 привязываем inputs/outputs
      inputBinding('ponyModel', ponyModel),
      outputBinding('ponyClicked', (event: PonyModel) => betPony.set(event))
    ]
  });
  await fixture.whenStable();

  // When: когда мы кликаем по пони
  const element = fixture.nativeElement as HTMLElement;
  const image = element.querySelector('img')!;
  image.dispatchEvent(new Event('click'));

  // и ждем синхронизации шаблона
  await fixture.whenStable();

  // Then: тогда эмиттер событий должен был сгенерировать событие
  expect(betPony()).toBe(fixture.componentInstance.ponyModel());
});

```

---

## 17.5. Тестирование с фейковыми шаблонами, провайдерами…

При тестировании компонента мы иногда хотим создать тестовый хост-компонент, который использует его. Это позволяет проверить, что связывание свойств и выходов работает корректно.

Возьмем, к примеру, наш компонент пони. Чтобы протестировать, что мы можем передать вход `running` или опустить его для использования значения по умолчанию, мы должны протестировать его с родительским компонентом, передающим вход `running`, а также с родительским компонентом, который его не передает.

К счастью, `TestBed` позволяет переопределять шаблон тестового хост-компонента (или любого другого компонента, к слову):

```typescript
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pony, PonyModel } from './pony';

@Component({
  selector: 'ns-test-host',
  template: '',
  imports: []
})
class TestHost {
  protected readonly pony = signal<PonyModel>({
    id: 1,
    name: 'Rainbow Dash',
    color: 'BLUE'
  });
}

describe('Pony', () => {
  let fixture: ComponentFixture<TestHost>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should display a non-running pony by default', async () => {
    // Given: данный тестовый хост-компонент, где вход running не передается
    TestBed.overrideTemplate(TestHost, '<ns-pony [ponyModel]="pony()" />');
    TestBed.overrideComponent(TestHost, {
      add: {
        imports: [Pony]
      }
    });
    fixture = TestBed.createComponent(TestHost);

    // When: когда мы запускаем отслеживание изменений
    await fixture.whenStable();

    // Then: тогда у нас должен быть не бегущий пони
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('img')!.src).toContain('/images/pony-blue.png');
  });

  it('should display a running pony if the running input is set to true', async () => {
    // Given: данный тестовый хост-компонент, где вход running передан со значением true
    TestBed.overrideTemplate(TestHost, '<ns-pony [ponyModel]="pony()" [running]="true" />');
    TestBed.overrideComponent(TestHost, {
      add: {
        imports: [Pony]
      }
    });
    fixture = TestBed.createComponent(TestHost);

    // When: когда мы запускаем отслеживание изменений
    await fixture.whenStable();

    // Then: тогда у нас должен быть бегущий пони
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('img')!.src).toContain('/images/pony-blue-running.png');
  });
});

```

Мы можем пойти дальше. Также можно вызывать `TestBed.overrideComponent()` для установки, добавления или удаления любого свойства декоратора компонента (`template`, `providers`, `imports` и т. д.).
Это иногда полезно, например, для тестирования родительского компонента с заглушкой (stub) дочернего компонента вместо настоящего, чтобы сделать тест проще.
Мы могли бы, например, заменить `Pony` в `imports` компонента `Race` на `PonyStub`, который имеет тот же селектор, входы и выходы, но ничего не делает.

Теперь вы готовы тестировать свое приложение!

---

## 17.6. Продвинутое тестирование с Vitest Browser Mode

Тесты можно писать и выполнять в двух режимах: стандартном режиме (Standard mode), который запускает тесты в NodeJS, и браузерном режиме (Browser mode), который запускает тесты в браузере.

Поскольку тесты компонентов используют DOM, вы можете подумать, что нам обязательно нужно использовать браузерный режим.
На самом деле это не так, потому что в стандартном режиме мы можем использовать NodeJS-реализацию DOM (`jsdom` или `happy-dom`).

Однако использование стандартного режима имеет ограничения, поскольку NodeJS и `jsdom`/`happy-dom` — это не та реальная среда, в которой ваш код будет работать в продакшене, а эти реализации DOM поддерживают далеко не всё, что поддерживает реальный DOM браузера.

Поэтому я однозначно отдаю предпочтение браузерному режиму.
И как только вы сделаете выбор в пользу браузерного режима и беззонного отслеживания изменений (zoneless change detection), вы получите выгоду от двух потрясающих возможностей Vitest.

### 17.6.1. Повторяемые утверждения (Retried assertions)

Повторяемые утверждения в большинстве случаев избавляют от необходимости вызывать `await fixture.whenStable()`.

Допустим, вы хотите проверить, что заголовок страницы содержит «Hello». Если вы напишете:

```typescript
expect(title).toHaveTextContent('Hello');

```

это просто выполнит проверку сразу и только один раз.
Чтобы этот тест прошёл, вам нужно убедиться, что асинхронная задача, устанавливающая заголовок, завершена, а фреймворк обнаружил изменения и обновил DOM.
Вот почему мы засоряем код вызовами `await fixture.whenStable()`.

Но Vitest позволяет сделать следующее:

```typescript
await expect.element(title).toHaveTextContent('Hello');

```

Небольшое изменение, но с огромными последствиями!
На этот раз Vitest выполнит утверждение и будет повторять его снова и снова (каждые N миллисекунд), пока оно не пройдет или пока не истечет таймаут теста.
Так что если вы не подождали стабилизации фикстуры — не проблема: утверждение один раз упадет, но со второй попытки Angular стабилизируется и обновит DOM, и тест пройдет.

### 17.6.2. Локаторы, их интерактивность и API утверждений

Вместо того чтобы использовать DOM API и взаимодействовать напрямую с DOM-элементами, в браузерном тесте Vitest вы используете локаторы (locators).
Локатор — это объект, который позволяет получить ноль, один или несколько элементов на странице (или внутри элемента другого локатора).
Каждый раз, когда вы взаимодействуете с локатором, он выполняет запрос для поиска элемента(ов).
Это означает, что вы можете использовать один и тот же локатор на протяжении всех тестов компонента, не беспокоясь о том, что он может оказаться `null`, устаревшим или отсутствовать в DOM.

Vitest активно поощряет написание тестов, работающих так, будто вы — пользователь, сидящий перед экраном.
Поэтому вместо поиска элементов по их ID или именам тегов вы находите их по их тексту, роли, метке (label) и т. д.

Локаторы, помимо выполнения запросов к компонентам, также предлагают API для проверки состояния их элементов с помощью богатых (и расширяемых) утверждений. И у них также есть API взаимодействия для манипулирования ими так, как это сделал бы пользователь: клик, заполнение, выбор и т. д.

Всё это в совокупности позволяет писать действительно выразительные и простые наборы тестов, подобные следующему:

```typescript
class LoginTester {
  readonly fixture = TestBed.createComponent(LoginPage);
  readonly root = page.elementLocator(this.fixture.nativeElement);
  readonly login = page.getByLabelText('Login');
  readonly password = page.getByLabelText('Password');
  readonly signIn = page.getByRole('button', { name: 'Sign in' });
  readonly error = page.getByText('Wrong credentials, try again');
}

describe('LoginPage', () => {
  let tester: LoginTester;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])]
    });
    tester = new LoginTester();
  });

  it('should display an empty form and no error initially', async () => {
    await expect.element(tester.login).toHaveDisplayValue('');
    await expect.element(tester.password).toHaveDisplayValue('');
    await expect.element(tester.error).not.toBeInTheDocument();
  });

  it('should validate', async () => {
    await tester.signIn.click();
    await expect.element(tester.root).toHaveTextContent('The login is required');
    await expect.element(tester.root).toHaveTextContent('The password is required');
  });

  it('should display an error when login fails', async () => {
    await tester.login.fill('john');
    await tester.password.fill('wrong-password');
    await tester.signIn.click();

    await expect.element(tester.error).toBeVisible();
  });

  it('should navigate away when login succeeds', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await tester.login.fill('john');
    await tester.password.fill('correct-password');
    await tester.signIn.click();

    expect(router.navigate).toHaveBeenCalled();
  });
});

```

Разве это не прекрасно?

---

## 17.7. Сквозные тесты (End-to-End / E2E)

Сквозные тесты — это другой тип тестов, которые мы можем запускать.
E2E-тест заключается в действительном запуске вашего приложения в браузере и эмуляции взаимодействия пользователя с ним (нажатие кнопок, заполнение форм и т. д.).

Они обладают тем преимуществом, что действительно тестируют приложение в целом, но:

* они медленнее (несколько секунд на тест)
* может быть трудно протестировать граничные случаи (edge cases).

Как вы можете догадаться, вам не нужно выбирать между юнит-тестами и e2e-тестами: вы будете комбинировать и те, и другие, чтобы получить отличное покрытие и гарантии того, что ваше законченное приложение работает так, как задумано.

У Angular CLI нет решения по умолчанию для E2E-тестов. В конце концов, этим тестам даже не нужно знать, что приложение построено на Angular, поэтому вы можете выбрать любой инструмент. Однако некоторые инструменты могут быть интегрированы в CLI, чтобы вы могли запускать `ng e2e` для сборки/запуска приложения и последующего выполнения сквозных тестов.

Самые популярные инструменты на сегодняшний день — это, пожалуй, Cypress и Playwright.
Сегодня наше предпочтение отдаётся Playwright: он бесплатен, активно поддерживается Microsoft и может запускать тесты параллельно в трёх основных браузерах (Chrome, Firefox и Safari).



### 17.7.1. Playwright

Playwright полон отличных возможностей:

* прост в настройке
* легко создавать моки для HTTP-ответов
* легко тестировать различные размеры экрана (viewports) (отлично для адаптивных приложений)
* приятный API
* режим с графическим интерфейсом (UI mode) или «безголовый» режим (headless mode)
* скачивает браузеры и тестирует в 3 основных движках
* тесты запускаются параллельно и в изоляции
* автоматические повторные попытки (retries)

Отладка в стиле «путешествия во времени» (Time-travel debugging) — это фича, которая покорила моё сердце: Playwright делает снимок (snapshot) на каждом шаге ваших тестов, поэтому вы можете очень легко выполнять отладку. Просто наведя курсор на шаг упавшего теста в интерфейсе Playwright UI, вы увидите точное состояние приложения и сможете с ним взаимодействовать.

Тесты Playwright предоставляют объект `page` с несколькими утилитарными методами, такими как `goto()`, для перехода по URL.
Затем у вас есть `locator()` для выбора элементов с использованием различных стратегий: по CSS-селектору, по тексту внутри элемента, по связанному label, по роли и т. д.
Получив локатор для элемента, вы можете взаимодействовать с ним: `click()`, `check()`, `fill()` и т. д.
И, конечно, вы можете выполнять проверки (assertions): `toBeVisible()`, `toBeEnabled()`, `toContainText()` и т. д.

Вот как может выглядеть тест для страницы входа:

```typescript
test('should display an alert if login fails', async ({ page }) => {
  // мокаем HTTP-ответ на запрос авторизации (опционально)
  await page.route('**/api/users/authentication', async route => {
    await route.fulfill({
      status: 401
    });
  });

  // переходим на страницу входа
  await page.goto('/login');

  // получаем инпут логина, инпут пароля и кнопку отправки
  const loginInput = page.locator('input').first();
  const passwordInput = page.locator('input[type=password]');
  const submitButton = page.locator('form > button');

  // заполняем форму
  await loginInput.fill('ced');
  await passwordInput.fill('pa');

  // отправляем форму и ждем ответ
  const response = page.waitForResponse('**/api/users/authentication');
  await submitButton.click();
  await response;

  // проверяем URL страницы и наличие сообщения об ошибке
  await expect(page).toHaveURL('/login');
  await expect(page.locator('.alert-danger')).toContainText('Nope, try again');
});

```

Написание таких тестов может занять довольно много времени, но они действительно полезны и покрывают множество вещей одновременно.
Они также отлично подходят для задач, которые трудно выполнить в юнит-тестах, например, сделать скриншот графика или карты и сравнить его с эталонным изображением пиксель в пиксель:

```typescript
test('should display the history of the user score in a chart ', async ({ page }) => {
  // переходим на страницу истории очков
  await page.goto('/score-history');

  // делаем скриншот canvas и сравниваем его с эталонным скриншотом
  await expect(page.locator('canvas')).toHaveScreenshot('user-score.png', { maxDiffPixelRatio: 0.005 });
});

```

Вы также можете использовать плагин Axe для выполнения всех видов автоматических тестов доступности (accessibility / a11y) на посещаемой странице, таких как проверка достаточной контрастности или наличия правильных меток (label) у всех элементов формы и т. д.

С юнит-тестами и e2e-тестами у вас есть все ключи для создания надежного и поддерживаемого приложения!

Все упражнения из нашего Pro Pack поставляются с юнит- и e2e-тестами! Если вы хотите узнать больше, мы настоятельно рекомендуем взглянуть на них: мы протестировали каждую возможную часть приложения (100% покрытие кода)! В итоге у вас будут десятки примеров тестов, которые вы сможете использовать в своих собственных проектах.