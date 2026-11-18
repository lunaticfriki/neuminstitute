# Testing Strategy

Testing mirrors the layers: the domain is tested with no mocks at all, the
application layer is tested by mocking ports, infrastructure is tested with
real or containerized dependencies, and presentation is tested by mocking
the state service/application layer. Architecture rules are enforced by
dedicated arch tests, not just convention.

## Domain tests — no mocks

The domain has no outward dependencies, so its tests need none either. Build
fixtures with Object Mothers (see
[01-domain-layer.md](01-domain-layer.md)), exercise behavior, assert on
resulting state or thrown domain errors.

```ts
describe('Order', () => {
  it('cannot be modified once confirmed', () => {
    const order = OrderMother.confirmed()

    expect(() => order.addLine(OrderLineMother.random())).toThrow(
      CannotModifyConfirmedOrderError,
    )
  })
})
```

If a domain test needs a mock, that's a signal the class has an outward
dependency it shouldn't — move that dependency to application/infrastructure
instead.

## Application tests — mock the ports

Application services depend only on ports (repository contracts, external
service contracts). Tests mock those ports with **ts-mockito** (TypeScript)
or **mocktail** (Dart) and assert both the resulting domain state and the
interactions with the port.

```ts
import { instance, mock, verify, when } from 'ts-mockito'

describe('ConfirmOrderCommandHandler', () => {
  it('confirms an existing order and persists it', async () => {
    const repository = mock<OrderRepository>()
    const order = OrderMother.random()
    when(repository.findById(order.id)).thenResolve(order)

    const handler = new ConfirmOrderCommandHandler(instance(repository))
    await handler.handle(new ConfirmOrderCommand(order.id.toString()))

    expect(order.status.isConfirmed()).toBe(true)
    verify(repository.save(order)).once()
  })

  it('throws when the order does not exist', async () => {
    const repository = mock<OrderRepository>()
    when(repository.findById(anything())).thenResolve(null)

    const handler = new ConfirmOrderCommandHandler(instance(repository))

    await expect(handler.handle(new ConfirmOrderCommand('missing'))).rejects.toThrow(
      OrderNotFoundError,
    )
  })
})
```

Never mock a domain object itself (`Order`, `Money`) — domain objects are
real, cheap to construct via Object Mothers, and mocking them would hide the
very invariants the test should verify. Only ports get mocked.

## Infrastructure tests

Repository implementations and mappers are tested against something as
close to the real dependency as practical (a test container, an in-memory
DB, a recorded HTTP fixture). These tests are fewer and slower by nature —
they exist to verify the adapter honors the port contract and the mapping is
correct in both directions, not to re-verify business rules already covered
by domain tests.

## Presentation tests

Containers are tested by mocking the state service/application layer and
asserting the right branch renders (loading → skeleton, error → error view,
loaded → real component with correct props). Components are tested in
isolation with plain props, no mocking needed since they have no
dependencies.

## End-to-end tests — the whole system, for real

Everything above tests one layer in isolation. None of it proves routing,
rendering, and a real production build actually work together. That's a
separate suite, run against a real browser and a real build rather than
mocks — see [12-e2e-testing.md](12-e2e-testing.md) for the full
Playwright/Cucumber/Gherkin setup. It's slower by nature and deliberately
kept out of the fast `pre-push` suite (see
[10-git-workflow-husky.md](10-git-workflow-husky.md)) — run on demand and
in CI, not on every push.

## Arch tests — enforce the dependency rule in CI

Layer violations MUST fail the build, not rely on reviewers catching them.
Use a dependency-boundary tool wired into CI:

- TypeScript: `dependency-cruiser` (or `eslint-plugin-boundaries`) configured
  with one rule per forbidden edge.
- Dart/Flutter: a lint rule set (e.g. `import_lint` or a small custom
  analyzer script) enforcing the same edges, since Dart's tooling for this is
  less standardized.

Example `dependency-cruiser` rule set (TypeScript):

```js
module.exports = {
  forbidden: [
    {
      name: 'domain-no-outward-deps',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/domain' },
      to: { path: '^src/modules/[^/]+/(application|infrastructure|presentation)' },
    },
    {
      name: 'application-only-depends-on-domain',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/application' },
      to: { path: '^src/modules/[^/]+/(infrastructure|presentation)' },
    },
    {
      name: 'infrastructure-no-presentation',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/infrastructure' },
      to: { path: '^src/modules/[^/]+/presentation' },
    },
    {
      name: 'presentation-no-infrastructure',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/presentation' },
      to: { path: '^src/modules/[^/]+/infrastructure' },
    },
  ],
}
```

Run it as its own CI/test step (e.g. `pnpm arch-test`), and treat any
violation as a build failure, exactly like a failing unit test.

## Tests live in a co-located `__tests__` folder

Test files sit in a `__tests__/` subfolder next to the code they test, not
inline as siblings and not in one top-level test tree:

```
domain/
  entities/
    Post.ts
    __tests__/
      Post.test.ts
      PostMother.ts
application/
  query/
    ListLatestPostsQueryHandler.ts
    __tests__/
      ListLatestPostsQueryHandler.test.ts
infrastructure/
  FakePostRepository.ts
  __tests__/
    FakePostRepository.test.ts
```

Every folder that has tests gets its own `__tests__/`, co-located as close
as possible to what it verifies — `entities/__tests__/`, not a single
`domain/__tests__/` catch-all, and never a project-wide `tests/` directory
mirroring `src/`. Test runners (`vitest`, `flutter test`) discover
`*.test.ts`/`*_test.dart` files regardless of the folder name, so no config
change is needed to support this.

## Object Mothers, once more

Object Mothers are shared across domain, application, and presentation
tests. They live in the `__tests__/` folder of the entity/value object they
build (e.g. `entities/__tests__/PostMother.ts`), are imported only from
tests, and are the only sanctioned way to construct a domain fixture. It's
normal for an application or presentation test to import a domain module's
Object Mother across that `__tests__/` boundary — this rule is about test
code, not the production import-boundary rule from
[02-hexagonal-architecture.md](02-hexagonal-architecture.md). Ad-hoc
literals (`{ id: '1', status: 'confirmed' }`) scattered across test files
are what Object Mothers replace — if you find yourself typing one, extract
or extend the Mother instead.
