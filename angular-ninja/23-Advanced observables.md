#### Продвинутая работа с Observables

Когда вы только начинаете работать с Angular, RxJS кажется чем-то сложным. Новички обычно стараются избегать его использования. В конце концов, другие фреймворки не используют observables. К тому же, теперь в Angular есть сигналы. Так действительно ли нужно учить RxJS?

Что ж, во-первых, пока у вас нет особого выбора. Angular по-прежнему заставляет вас использовать его, если вы хотите работать с HTTP-клиентом, роутером или реактивными формами.

Но даже если бы это было не так, RxJS — отличный инструмент, который делает асинхронное программирование проще, эффективнее и надежнее. Асинхронный код, основанный на промисах (Promises), часто полон состояния гонки (race conditions) или неэффективен.

Кроме того, RxJS не привязан строго к Angular, поэтому его изучение будет полезным, даже если вы работаете с другими фреймворками или вовсе без них.

---

#### 23.1. Некоторые любят погорячее (Hot и Cold Observables)

Из главы про реактивное программирование мы узнали, что Observable представляет собой последовательность событий, на которую можно подписаться. Но важно понимать различие между двумя типами Observables: **холодными** (cold) и **горячими** (hot).

**Холодные (cold) observables** излучают события только тогда, когда на них подписываются. Вы можете представить это как просмотр видео на YouTube: видео начинает воспроизводиться только тогда, когда вы нажимаете кнопку «Play».

Например, observables, возвращаемые классом `HttpClient`, являются холодными: они отправляют сетевой запрос только в момент подписки. И каждый вызов метода `subscribe()` отправляет новый запрос и создает новый поток событий (в данном конкретном случае ограниченный одним событием).

**Горячие (hot) observables** работают иначе: они излучают события независимо от того, подписался ли на них кто-то. Представьте себе прямое телевещание: вы включаете телевизор и попадаете на середину передачи, которая могла начаться несколько минут или часов назад.

Observable `valueChanges` у `FormControl` — это горячий observable. Вы не получите значения, которые были emitted до момента вашей подписки — только те, которые созданы с момента подписки и позже. И, в отличие от холодного observable, несколько разных подписчиков будут получать одни и те же события.

---

#### 23.2. Отписка от событий (Unsubscriptions)

В нашем приложении Ponyracer гонка в реальном времени может быть представлена в виде observable, который передает координаты пони. Когда гонка заканчивается, observable прекращает эмитить события.

Но что, если пользователь ушел со страницы до окончания гонки? Component будет уничтожен. Однако, если мы забыли отписаться, callback-функция продолжит выполняться каждый раз при возникновении события — даже если компонент больше не отображается на экране!

Отсутствие отписки может привести к утечкам памяти и множеству других проблем (лишнему сетевому трафику, перегрузке сервера и т. д.). Поэтому лучшая практика — всегда гарантировать отписку до уничтожения компонента.

Один из способов сделать это — сохранить объект `Subscription`, возвращаемый методом `subscribe`, в свойстве компонента и вызвать `unsubscribe()` в методе жизненного цикла `ngOnDestroy`:

```typescript
export class LiveRace implements OnDestroy {
  private readonly subscription: Subscription;

  constructor() {
    const raceService = inject(RaceService);
    this.subscription = raceService.live().subscribe(() => {
      // ...
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}

```

Как мы объясняли ранее, отписка происходит автоматически, когда observable завершается (`complete`). Поэтому еще один способ избежать проблем с вечными подписками — убедиться, что observable завершается при уничтожении компонента.

Начиная с Angular v16, это легко сделать с помощью оператора `takeUntilDestroyed`, поставляемого фреймворком в пакете `@angular/core/rxjs-interop`.

Этот оператор должен быть **последним** оператором в цепочке `pipe`, непосредственно перед вызовом `subscribe`. Таким образом, он гарантирует отписку от всей цепочки observable при уничтожении компонента.

```typescript
export class LiveRace {
  constructor() {
    const raceService = inject(RaceService);
    raceService
      .live()
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        // ...
      });
  }
}

```

**Безопасно ли где-то НЕ отписываться?**

Если сомневаетесь — следуйте правилам хорошего тона и отписывайтесь. Однако полезно понимать, когда отписка жизненно необходима, а когда ее отсутствие не сыграет катастрофической роли.

Поскольку отписка происходит автоматически при завершении (`complete`) или ошибке (`error`) потокa, не критично пропускать отписку от HTTP-запросов: они завершаются за короткое время, обычно еще до того, как компонент успеет уничтожиться.

Аналогично, если источник событий уничтожается одновременно с компонентом-подписчиком (например, `ActivatedRoute` роутингового компонента или форма, созданная внутри компонента), то отсутствие явной отписки также не создаст проблем.

---

#### 23.3. Автоматическая отписка

Отличный способ гарантировать, что вы никогда не забудете отписаться — вообще избегать вызова `subscribe()` вручную. Разумеется, кто-то должен подписаться, иначе ничего не произойдет. Но если вы доверите подписку фреймворку, он отпишется за вас сам.

Это не всегда возможно (например, для выполнения побочных эффектов ручная подписка неизбежна). Но если цель observable — просто получить данные для отображения в шаблоне, лучше позволить фреймворку управлять подпиской.

##### Использование `toSignal` (предпочтительный подход):

```typescript
export class LiveRace {
  protected readonly liveRace: Signal<LiveRaceModel | undefined> = toSignal(inject(RaceService).live());
}

```

##### Использование `async` пайпа (AsyncPipe):

До появления сигналов основным способом был пайп `async`. Идея состоит в том, чтобы экспортировать сам observable как свойство компонента, а `AsyncPipe` подпишется на него и отпишется прямо из HTML-шаблона:

```typescript
@Component({
  selector: 'ns-live-race',
  template: `{{ (liveRace$ | async)?.name }}`,
  imports: [AsyncPipe]
})
export class LiveRace {
  protected readonly liveRace$: Observable<LiveRaceModel> = inject(RaceService).live();
}

```

Как и функция `toSignal`, пайп `async` не может вернуть значение, пока observable не сгенерирует первое событие, поэтому мы используем оператор опциональной цепочки `?.`.

**Частая ошибка с `AsyncPipe`:**

```html
<!-- ❌ НЕ ДЕЛАЙТЕ ТАК -->
<div>{{ (liveRace$ | async)?.name }}</div>
<div>{{ (liveRace$ | async)?.startInstant | date }}</div>

```

Использование двух `async` пайпов означает **две независимые подписки**. Если observable холодный, будет сгенерировано два отдельных потока (например, улетит два одинаковых HTTP-запроса).

Правильный паттерн с использованием синтаксиса `@if`:

```html
<!-- ✅ Делайте так -->
@if (liveRace$ | async; as liveRace) {
  <div>{{ liveRace.name }}</div>
  <div>{{ liveRace.startInstant | date }}</div>
} @else {
  Загрузка...
}

```

---

#### 23.4. Эффективное использование операторов

Давайте разберем создание компонента автодополнения (Typeahead / Автокомплит) по шагам, чтобы увидеть силу операторов RxJS.

Хороший автокомплит должен:

1. Отображать результаты, соответствующие вводу;
2. Выполнять поиск только если введено хотя бы несколько символов;
3. Не отправлять запрос на каждый нажатый символ, а ждать остановки ввода (debounce);
4. Не дублировать один и тот же запрос при одинаковых значениях.

Создадим базовую заготовку компонента с `FormControl`:

```typescript
import { Component, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PonyModel, PonyService } from './pony-service';

@Component({
  selector: 'ns-typeahead',
  template: `
    <div>
      <input [formControl]="input" />
      <ul>
        @for (pony of ponies(); track pony.id) {
          <li>{{ pony.name }}</li>
        }
      </ul>
    </div>
  `,
  imports: [ReactiveFormsModule]
})
export class PonyTypeAhead {
  protected readonly input = inject(NonNullableFormBuilder).control('');
  protected readonly ponies: Signal<Array<PonyModel>>;

  constructor() {
    const ponyService = inject(PonyService);
    // TODO: обработать ввод
  }
}

```

##### Шаг 1: Добавляем высшие операторы (Flattening operators)

Если мы просто подпишемся на `input.valueChanges` и будем вызывать `ponyService.search(value)`, получится вложенная подписка и возможна состояние гонки (Race Condition), когда ответ на первый запрос придет позже ответа на второй.

Нам нужен высший оператор преобразования.

* `mergeMap`: выполняет запросы параллельно. Не подходит — сохраняется проблема с порядком ответа (race condition).
* `concatMap`: выполняет запросы строго по очереди. Не подходит — слишком медленно, так как новые запросы ждут завершения старых.
* `switchMap`: **идеальный выбор**. При получении нового значения отменяет (unsubscribes) предыдущий незавершенный запрос и переключается на новый.

```typescript
const ponies$ = this.input.valueChanges.pipe(
  switchMap(value => this.ponyService.search(value))
);
this.ponies = toSignal(ponies$, { initialValue: [] });

```

##### Шаг 2: Фильтрация по длине строки (`filter`)

Отсекаем поисковые запросы короче 3 символов:

```typescript
const ponies$ = this.input.valueChanges.pipe(
  filter(query => query.length >= 3),
  switchMap(value => this.ponyService.search(value))
);

```

##### Шаг 3: Задержка ввода (`debounceTime`)

Ждем, пока пользователь перестанет печатать в течение 400 мс:

```typescript
const ponies$ = this.input.valueChanges.pipe(
  filter(query => query.length >= 3),
  debounceTime(400),
  switchMap(value => this.ponyService.search(value))
);

```

##### Шаг 4: Игнорирование дубликатов (`distinctUntilChanged`)

Если пользователь ввел "Rainbow", подождал 400 мс, затем быстро допечатал и затер обратно до "Rainbow", повторный запрос отправлять не нужно:

```typescript
const ponies$ = this.input.valueChanges.pipe(
  filter(query => query.length >= 3),
  debounceTime(400),
  distinctUntilChanged(),
  switchMap(value => this.ponyService.search(value))
);

```

##### Шаг 5: Обработка ошибок (`catchError`)

Если сетевой запрос упадет с ошибкой, основной поток observable сломается навсегда. Перехватываем ошибку внутри подцепочки `search()` и возвращаем пустой массив:

```typescript
const ponies$ = this.input.valueChanges.pipe(
  filter(query => query.length >= 3),
  debounceTime(400),
  distinctUntilChanged(),
  switchMap(value => 
    this.ponyService.search(value).pipe(
      catchError(() => of([]))
    )
  )
);
this.ponies = toSignal(ponies$, { initialValue: [] });

```

Всего 5 строк операторов решают сложную задачу управления асинхронным вводом без единого бага race condition!

---

#### 23.5. Использование Subject в качестве триггеров

Распространенный паттерн в Angular — использование `Subject` для инициирования действий (например, ручного обновления данных по кнопке).

`Subject` — это горячий observable, который генерирует новое событие каждый раз, когда вы вызываете его метод `.next()`.

```typescript
export class RaceListComponent {
  private readonly refreshTrigger = new Subject<void>();
  protected readonly races: Signal<Array<RaceModel> | undefined>;

  constructor() {
    const raceService = inject(RaceService);

    const races$ = this.refreshTrigger.pipe(
      startWith(undefined), // Инициирует первую загрузку при старте
      switchMap(() => raceService.list())
    );

    this.races = toSignal(races$);
  }

  protected refresh() {
    this.refreshTrigger.next(); // Вызывается при клике на кнопку «Обновить»
  }
}

```

---

#### 23.6. Создание собственного Observable

Иногда приходится работать со сторонними библиотеками, использующими события, но не предоставляющими RxJS Observable. Вы можете создать собственный Observable через конструктор `new Observable(observer => {})`.

Функция, передаваемая в конструктор, называется функция подписки. Она отвечает за отправку событий (`next`), ошибок (`error`) и завершение (`complete`).

```typescript
const numbers = new Observable(observer => {
  observer.next(1);
  observer.next(2);
  observer.complete();
});

numbers.subscribe({
  next: n => console.log(n),
  error: err => console.log(err),
  complete: () => console.log('Завершено!')
});
// Выведет в консоль:
// 1
// 2
// Завершено!

```

##### Очистка ресурсов при отписке:

Функция внутри `new Observable()` может возвращать другую функцию, которая автоматически вызовется при **отписке**. Это необходимо для очистки таймеров или слушателей событий:

```typescript
import { Observable } from 'rxjs';

export class HelloService {
  get(): Observable<string> {
    return new Observable(observer => {
      const interval = setInterval(() => observer.next('hello'), 2000);
      
      // Вызывается при отписке:
      return () => clearInterval(interval);
    });
  }
}

```

Интервал не создастся до момента подписки, поэтому мы только что вручную создали **холодный** observable.

---

#### 23.7. Управление состоянием с помощью стейт-менеджеров (NgRx, NGXS, Elf и другие)

В экосистеме Angular есть много библиотек для управления состоянием (Stores): NgRx, NgRx ComponentStore, NGXS, Elf и др.

Являются ли они серебряной пулей? Вовсе нет. Они построены на базе RxJS, и вам всё равно нужно хорошо понимать RxJS перед их использованием. Для многих проектов они не оправдывают добавляемую ими сложность и количество шаблонного кода (boilerplate).

Будьте осторожны: тот факт, что стейт-менеджеры выглядят архитектурно солидно, не делает их автоматически необходимыми для вашей конкретной команды и проекта.

---

#### 23.8. Заключение

Observables — это мощный инструмент для работы с последовательностями HTTP-запросов, взаимодействием компонентов и обработкой пользовательского ввода. Понимание их работы даёт вам полный контроль над асинхронными процессами в приложении.