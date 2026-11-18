# Adaptation: Angular + TypeScript

Concrete mapping of the general rules onto an Angular (standalone components,
signals, zoneless, `@angular/build`) + TypeScript project, pnpm-managed,
tested with Vitest. This is the stack used by `neuminstitute`, the Angular
rebuild of the Preact-based `neum` site — read
[08-tech-preact-typescript.md](08-tech-preact-typescript.md) alongside this
doc if you're porting a vertical slice from that codebase; the domain and
application layers below are close to line-for-line portable, only the
presentation layer and composition root differ.

## Folder tree (one vertical slice)

```
src/app/
  modules/
    ordering/
      domain/
        entities/
          Order.entity.ts
          __tests__/
            Order.entity.test.ts
            Order.mother.ts
        value-objects/
          OrderId.valueObject.ts
          OrderLine.valueObject.ts
          OrderStatus.valueObject.ts
          Money.valueObject.ts
        repositories/
          Order.repository.ts
        errors/
          OrderAlreadyConfirmed.error.ts
      application/
        command/
          ConfirmOrder.command.ts
          ConfirmOrder.commandHandler.ts
          __tests__/
            ConfirmOrder.commandHandler.test.ts
        query/
          GetOrder.query.ts
          GetOrder.queryHandler.ts
          __tests__/
            GetOrder.queryHandler.test.ts
        Order.readModel.ts
        Order.writeService.ts
        Order.readService.ts
        Order.stateService.ts
      infrastructure/
        HttpOrder.repository.ts
        acl/
          Order.mapper.ts
        __tests__/
          HttpOrder.repository.test.ts
      presentation/
        containers/
          OrderDetails.container.ts
          OrderDetails.container.html
          __tests__/
            OrderDetails.container.test.ts
        components/
          OrderDetails.component.ts
          OrderDetails.component.html
          OrderDetails.skeleton.ts
          OrderDetails.skeleton.html
          __tests__/
            OrderDetails.component.test.ts
        ordering.routes.ts
        ordering.providers.ts
  shared/
    errors/
      domain/
        Domain.error.ts
        Domain.warning.ts
app.config.ts
app.routes.ts
```

File names follow `<Concept>.<kind>.ts` — see
[06-vertical-slicing.md](06-vertical-slicing.md#file-naming-convention) for
the full suffix table, extended here with two Angular-specific kinds:

| Kind | Suffix | Example |
|---|---|---|
| Route providers for a module (composition root fragment) | `.providers.ts` | `ordering.providers.ts` |
| Route table for a module | `.routes.ts` | `ordering.routes.ts` |

`main.ts`, `app.config.ts`, `app.routes.ts`, `app.component.ts` (the root
shell) stay exempt, same as `main.tsx`/`app.tsx`/`composition-root.ts` were
for Preact.

## Domain and application layers are unchanged

Everything in [01-domain-layer.md](01-domain-layer.md) and
[03-application-layer-cqrs.md](03-application-layer-cqrs.md) — private
constructors, `create`/`empty` factories, `public readonly` fields,
`abstract class` ports, CQRS command/query handlers, the pure
read/write-service split — is plain TypeScript with zero Angular imports.
None of it changes moving from Preact to Angular. The only genuinely
framework-specific pieces are the reactive primitive used by the state
service and everything in the presentation layer below.

### The state service uses Angular's own `signal`/`computed`

Where the Preact adaptation reaches for `@preact/signals-core` specifically
*because* it has zero framework coupling, Angular's `signal()`/`computed()`
(from `@angular/core`) are already the framework's own reactive primitive —
there is no separate "-core" package to reach for instead. This is a
deliberate, narrow exception to "application code doesn't depend on a UI
framework package": the state service is still the *only* file in a
feature's application layer allowed to import from `@angular/core`, and it
still imports nothing else Angular-specific (no `Component`, no DOM types).

```ts
// application/Order.stateService.ts — the only file with an @angular/core dependency
import { signal, type Signal } from '@angular/core'

type OrderState =
  | { status: 'loading' }
  | { status: 'loaded'; order: OrderReadModel }
  | { status: 'error'; message: string }

export abstract class OrderStateService {
  abstract readonly order: Signal<OrderState>
  abstract loadById(query: GetOrderQuery): Promise<void>
}

export class OrderStateServiceImpl extends OrderStateService {
  readonly order = signal<OrderState>({ status: 'loading' })

  constructor(
    private readonly readService: OrderReadService,
    private readonly errorManager: ErrorManager,
  ) {
    super()
  }

  async loadById(query: GetOrderQuery): Promise<void> {
    this.order.set({ status: 'loading' })
    try {
      const order = await this.readService.getById(query)
      this.order.set({ status: 'loaded', order })
    } catch (error) {
      this.order.set({ status: 'error', message: (error as Error).message })
      this.errorManager.handle(error as Error)
    }
  }
}
```

No separate activation step is required for a signal read to trigger a
re-render — unlike Preact, where `@preact/signals` has to be imported once,
as a side effect, to patch rendering (see
[03-application-layer-cqrs.md](03-application-layer-cqrs.md#the-preact-integration-must-be-activated-once-at-the-app-root)).
In Angular, `signal`/`computed` are wired into change detection by the
framework itself; reading `.()`/`.value` in a component's template or in a
zoneless `computed()` chain is enough.

## Presentation: containers and components are both Angular components

A **container** is a standalone Angular component that injects the state
service (and the write service, for command dispatch), reads its signal,
and picks which branch to render:

```ts
// presentation/containers/OrderDetails.container.ts
import { Component, inject, input } from '@angular/core'
import { OrderStateService } from '../../application/Order.stateService'
import { GetOrderQuery } from '../../application/query/GetOrder.query'
import { OrderDetailsComponent } from '../components/OrderDetails.component'
import { OrderDetailsSkeleton } from '../components/OrderDetails.skeleton'

@Component({
  selector: 'app-order-details-container',
  imports: [OrderDetailsComponent, OrderDetailsSkeleton],
  templateUrl: './OrderDetails.container.html',
})
export class OrderDetailsContainer {
  private readonly stateService = inject(OrderStateService)
  readonly orderId = input.required<string>()
  readonly state = this.stateService.order

  constructor() {
    this.stateService.loadById(new GetOrderQuery(this.orderId()))
  }
}
```

```html
<!-- presentation/containers/OrderDetails.container.html -->
@switch (state().status) {
  @case ('loading') {
    <app-order-details-skeleton />
  }
  @case ('error') {
    <p>{{ state().message }}</p>
  }
  @case ('loaded') {
    <app-order-details [order]="state().order" />
  }
}
```

A **component** is a standalone Angular component with only `input()`/
`output()`, `ChangeDetectionStrategy.OnPush`, and no injected service —
trivial to test with plain inputs, same as a Preact presentational
component:

```ts
// presentation/components/OrderDetails.component.ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'
import type { OrderReadModel } from '../../application/Order.readModel'

@Component({
  selector: 'app-order-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './OrderDetails.component.html',
})
export class OrderDetailsComponent {
  readonly order = input.required<OrderReadModel>()
  readonly confirm = output<void>()
}
```

Skeletons follow the same rule as [05-presentation-layer.md](05-presentation-layer.md#skeletons):
a `<Concept>.skeleton.ts` (+ `.html`) next to the component it shadows,
mirroring its layout with placeholder blocks, rendered by the container
while `state().status === 'loading'`.

## Composition root: Angular's own DI, no second container

Angular already ships a DI container built around hierarchical injectors
and class-based tokens. Since every port and application-service contract
in this stack is an `abstract class` (never an `interface` — see
[01-domain-layer.md](01-domain-layer.md#typescript-abstract-classes-not-interfaces-for-contracts)),
that abstract class is itself a valid Angular provider token, with no
symbol map (`shared/di/types.ts`) needed. Introducing InversifyJS on top of
Angular's own injector would mean running two DI containers side by side
for no benefit — Angular's `provide`/`useFactory`/`useClass` already give
the exact same explicit-wiring shape InversifyJS's `toDynamicValue` was
chosen for in the Preact stack (see
[08-tech-preact-typescript.md](08-tech-preact-typescript.md#why-todynamicvalue-instead-of-decorator-based-auto-wiring)):
an explicit factory per binding, no hidden auto-wiring.

Each module owns its own wiring in a `<module>.providers.ts` file, co-located
in its `presentation/` folder next to its `.routes.ts`:

```ts
// modules/ordering/presentation/ordering.providers.ts
import type { Provider } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { inject } from '@angular/core'
import { OrderRepository } from '../domain/repositories/Order.repository'
import { HttpOrderRepository } from '../infrastructure/HttpOrder.repository'
import { OrderReadService, OrderReadServiceImpl } from '../application/Order.readService'
import { OrderWriteService, OrderWriteServiceImpl } from '../application/Order.writeService'
import { OrderStateService, OrderStateServiceImpl } from '../application/Order.stateService'
import { GetOrderQueryHandler } from '../application/query/GetOrder.queryHandler'
import { ConfirmOrderCommandHandler } from '../application/command/ConfirmOrder.commandHandler'
import { ErrorManager } from '../../../shared/errors/application/ErrorManager.service'

export const ORDERING_PROVIDERS: Provider[] = [
  {
    provide: OrderRepository,
    useFactory: () => new HttpOrderRepository(inject(HttpClient)),
  },
  {
    provide: OrderReadService,
    useFactory: (repository: OrderRepository) =>
      new OrderReadServiceImpl(new GetOrderQueryHandler(repository)),
    deps: [OrderRepository],
  },
  {
    provide: OrderWriteService,
    useFactory: (repository: OrderRepository) =>
      new OrderWriteServiceImpl(new ConfirmOrderCommandHandler(repository)),
    deps: [OrderRepository],
  },
  {
    provide: OrderStateService,
    useFactory: (readService: OrderReadService, errorManager: ErrorManager) =>
      new OrderStateServiceImpl(readService, errorManager),
    deps: [OrderReadService, ErrorManager],
  },
]
```

A module's `.routes.ts` attaches its own providers at the route level, so
the bindings are only constructed when that feature is actually navigated
to — this is the Angular-native equivalent of a lazy-loaded vertical slice:

```ts
// modules/ordering/presentation/ordering.routes.ts
import type { Routes } from '@angular/router'
import { ORDERING_PROVIDERS } from './ordering.providers'

export const ORDERING_ROUTES: Routes = [
  {
    path: 'orders/:orderId',
    providers: ORDERING_PROVIDERS,
    loadComponent: () => import('./containers/OrderDetails.container').then((m) => m.OrderDetailsContainer),
  },
]
```

`app.routes.ts` is the single composition root that assembles every
module's route table — the one file allowed to know that all the modules
exist:

```ts
// app.routes.ts
import type { Routes } from '@angular/router'
import { ORDERING_ROUTES } from './modules/ordering/presentation/ordering.routes'

export const routes: Routes = [...ORDERING_ROUTES]
```

Deleting a feature means deleting its module folder and removing one import
line from `app.routes.ts` — the same promise vertical slicing makes for the
Preact stack (see
[06-vertical-slicing.md](06-vertical-slicing.md#why)), just expressed
through Angular's router-level providers instead of a hand-rolled
`container.bind(...)` script.

### Why Angular's compiler sidesteps the esbuild/decorator problem

The Preact adaptation avoids decorator-based DI specifically because Vite's
`esbuild` transform strips types per-file and never emits
`design:paramtypes` (see
[08-tech-preact-typescript.md](08-tech-preact-typescript.md#why-todynamicvalue-instead-of-decorator-based-auto-wiring)).
Angular doesn't have this problem: `@angular/build`/`ngc` is a whole-program
TypeScript compiler, not an esbuild-per-file transform, so
`@Injectable()` + constructor injection works natively. This stack still
prefers explicit `useFactory` bindings over decorator-based auto-resolution
for ports specifically — not because decorators are broken here, but to keep
one explicit wiring style across the whole composition root, visible as a
flat list in each module's `.providers.ts` rather than inferred from
constructor types scattered across adapter classes.

## Tooling

- Test runner: `vitest` (Angular CLI's `--test-runner=vitest`).
- Mocking ports: `ts-mockito`, same as the Preact stack — it mocks any
  class/abstract class and doesn't care which test runner or UI framework
  is involved.
- Dependency injection: Angular's own injector; ports/application
  contracts as `abstract class` tokens; explicit `useFactory`/`useClass`
  bindings per module, never auto-wired decorator resolution for a port.
- Reactive state: `signal`/`computed` from `@angular/core`, isolated to
  each feature's `.stateService.ts` only — read/write services stay
  dependency-free, exactly as in [03-application-layer-cqrs.md](03-application-layer-cqrs.md).
- Error/notification handling: `ErrorManager` + `NotificationService` in
  `shared/`, built the same way as [11-shared-services.md](11-shared-services.md)
  describes — only `Notification.stateService.ts` differs by importing
  `@angular/core`'s `signal` instead of `@preact/signals-core`'s.
- Arch tests: `dependency-cruiser`, run via `pnpm arch-test` as its own
  step, with forbidden-edge rules pointed at `src/app/modules/*/...` (see
  [07-testing-strategy.md](07-testing-strategy.md)).
- Component tests: Angular's `TestBed`, driving standalone components
  directly — no `NgModule` test setup needed.
- Rendering/SSR: `@angular/ssr`, the Angular-native equivalent of Astro's
  static-site generation used by `neum`'s `apps/web`. Any browser-only side
  effect (GSAP, Lenis) MUST be wrapped in `afterNextRender(...)` — it never
  runs during server rendering, so no manual `isPlatformBrowser` check is
  needed for that case.
- Animation: `gsap` (+ `gsap/ScrollTrigger`) and `lenis`, the same libraries
  `neum` uses. Wrapped as `shared/scroll/presentation/SmoothScroll.service.ts`
  (an injectable started once from the root component via
  `afterNextRender`) and `shared/animation/presentation/ScrollFade.directive.ts`
  (an attribute directive, the Angular equivalent of the Preact
  `useScrollFade` hook — same GSAP timeline/ScrollTrigger setup, triggered
  from `afterNextRender` instead of a `useEffect`).
- No comments in source — types and names carry meaning; JSDoc only where a
  published library's public API needs it.
