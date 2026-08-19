# Откладываемые представления с @defer (Deferrable Views)

С появлением нового синтаксиса управления потоком (Control Flow) команда Angular также представила новый способ ленивой загрузки компонентов прямо в шаблонах.

Ранее ленивая загрузка в Angular основывалась преимущественно на роутере (Router). Синтаксис `@defer` позволяет определить блок шаблона, который будет загружаться лениво при выполнении определенного условия (вместе со всеми компонентами, пайпами, директивами и библиотеками, используемыми внутри этого блока).

Условия могут быть самыми разными:

* как только возможно (без условий);
* когда пользователь прокручивает страницу до этого раздела;
* когда пользователь кликает по кнопке;
* по истечении таймера (например, через 2 секунды).

Предположим, на вашей главной странице отображается «тяжелый» компонент графика `Chart`, использующий стороннюю библиотеку визуализации и дополнительные зависимости:

**chart.ts**

```typescript
@Component({
  selector: 'ns-chart',
  template: '...',
  imports: [FromNowPipe],
})
export class Chart {
  // использует chart.js
}

```

**home.ts**

```typescript
import { Chart } from './chart';

@Component({
  selector: 'ns-home',
  template: `
    <!-- какой-то контент -->
    <ns-chart />
  `,
  imports: [Chart]
})
export class Home {
  // ...
}

```

При сборке приложения `Chart` по умолчанию попадет в основной бандл (`main.js`).

Если компонент не виден сразу (находится внизу страницы или в неактивной вкладке), загружать его сразу нецелесообразно — это замедляет первоначальную загрузку страницы. С помощью `@defer` вы можете загрузить компонент только тогда, когда он действительно понадобится пользователю:

**home.ts**

```typescript
import { Chart } from './chart';

@Component({
  selector: 'ns-home',
  template: `
    <!-- какой-то контент -->
    @defer (when isVisible) {
      <ns-chart />
    }
  `,
  imports: [Chart]
})
export class Home {}

```

Компилятор Angular автоматически перепишет статический импорт `Chart` в динамический (`() => import('./chart')`). Компонент больше не войдет в основной бандл, а бандлер вынесет его в отдельный чанк (`chunk-xxxx.js`), который загрузится только при выполнении указанного условия.

---

## 30.1. @placeholder, @loading и @error

Вы можете настроить отображение вспомогательных состояний с помощью блоков `@placeholder`, `@loading` и `@error`:

```html
@defer (when show()) {
  <ns-chart />
} @placeholder {
  <div>Заглушка до начала загрузки</div>
} @loading {
  <div>Загрузка...</div>
} @error {
  <div>Произошла ошибка при загрузке</div>
}

```

* `@placeholder`: отображается до тех пор, пока не сработает условие загрузки. При использовании SSR на сервере рендерится только блок `@placeholder`.
* `@loading`: отображается в процессе загрузки ресурсов блока. Если `@loading` не задан, на время загрузки остается `@placeholder`.
* `@error`: отображается, если загрузка ресурсов завершилась ошибкой.

### 30.1.1. Параметры after и minimum

Загрузка может происходить слишком быстро, вызывая неприятный эффект «мигания» UI. Для предотвращения этого предусмотрены параметры задержки и минимального времени показа:

* **`after`**: указывает задержку перед отображением блока `@loading`. Если блок загрузился быстрее этого времени, `@loading` вообще не покажется.
* **`minimum`**: задает минимальную продолжительность отображения блока (`@loading` или `@placeholder`).

```html
@defer (when show()) {
  <ns-chart />
} @placeholder (minimum 500ms) {
  <div>Заглушка (минимум 500 мс)</div>
} @loading (after 500ms; minimum 500ms) {
  <div>Загрузка...</div>
}

```

---

## 30.2. Условия загрузки (Triggers)

### 30.2.1. Без условий или on idle

Если условие не указано, блок загружается, когда браузер находится в состоянии простоя (используя под капотом `requestIdleCallback`). Это эквивалентно явному указанию `on idle`:

```html
@defer (on idle) {
  <ns-chart />
}

```

### 30.2.2. Логическое условие с when

Загрузка срабатывает при истинности boolean-выражения или сигнала.

```html
@defer (when show()) {
  <ns-chart />
}

```

*Обратите внимание: в отличие от `*ngIf`, после того как блок однажды загрузился, он не удаляется из DOM, даже если условие станет `false`.*

### 30.2.3. on immediate

Запускает загрузку немедленно, не дожидаясь состояния простоя браузера.

### 30.2.4. on timer

Запускает загрузку по таймеру (использует `setTimeout` под капотом):

```html
@defer (on timer(2s)) {
  <ns-chart />
}

```

### 30.2.5. on hover

Загружает блок при наведении мыши (`mouseenter`) или получении фокуса (`focusin`). Можно привязать к конкретному элементу через template reference variable или использовать сам `@placeholder`:

```html
<span #trigger>Наведи на меня</span>

@defer (on hover(trigger)) {
  <ns-chart />
}

```

Или через плейсхолдер:

```html
@defer (on hover) {
  <ns-chart />
} @placeholder {
  <span>Наведи на меня</span>
}

```

### 30.2.6. on interaction

Срабатывает при клике (`click`) или нажатии клавиши (`keydown`). Работает аналогично `on hover` (с использованием ссылки на элемент или через `@placeholder`).

### 30.2.7. on viewport

Загружает блок, когда элемент появляется в зоне видимости экрана (использует `IntersectionObserver`).

### 30.2.8. Множественные условия

Условия можно комбинировать через запятую (сработает любое из них, какое наступит первым):

```html
<!-- Загрузится при наведении ИЛИ через 60 секунд -->
@defer (on hover, timer(60s)) {
  <ns-chart />
} @placeholder {
  <span>Ожидание действия...</span>
}

```

---

## 30.3. Предзагрузка (Prefetching)

Синтаксис `@defer` позволяет разделить момент **загрузки кода** (prefetch) и момент **отображения компонента**:

```html
<!-- Загружает скрипты в фоновом режиме (idle), но отображает только по клику -->
@defer (on interaction; prefetch on idle) {
  <ns-chart />
} @placeholder {
  <button>Показать график</button>
}

```

Если код уже был предзагружен к моменту срабатывания основного условия отображения, блок `@loading` показываться не будет.

---

## 30.4. Тестирование @defer блоков

В `TestBed` добавлена настройка `deferBlockBehavior`, которая принимает два значения:

1. **`DeferBlockBehavior.Playthrough` (по умолчанию)**: блоки ведут себя так же, как в браузере. Для завершения асинхронной загрузки нужно вызвать `await fixture.whenStable()`.

```typescript
// Эмулируем клик по кнопке-триггеру
const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
button.click();

// Ждем завершения загрузки deferred-блока
await fixture.whenStable();

// Проверяем отображение
const loadedBlock = (fixture.nativeElement as HTMLElement).querySelector('div')!;
expect(loadedBlock.textContent).toContain('Some lazy-loaded content');

```

2. **`DeferBlockBehavior.Manual`**: позволяет вручную переключать состояния defer-блоков в тестах.

```typescript
await TestBed.configureTestingModule({
  deferBlockBehavior: DeferBlockBehavior.Manual
}).compileComponents();

const fixture = TestBed.createComponent(MyComponent);
const deferBlocks = await fixture.getDeferBlocks();

expect(deferBlocks.length).toBe(1);

// Принудительно рендерим блок в состоянии Complete
await deferBlocks[0].render(DeferBlockState.Complete);

const loadedBlock = (fixture.nativeElement as HTMLElement).querySelector('div')!;
expect(loadedBlock.textContent).toContain('Some lazy-loaded content');

```

Возможные значения `DeferBlockState`:

* `DeferBlockState.Placeholder`
* `DeferBlockState.Loading`
* `DeferBlockState.Error`
* `DeferBlockState.Complete`