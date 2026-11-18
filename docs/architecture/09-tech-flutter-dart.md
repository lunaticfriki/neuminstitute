# Adaptation: Flutter + Dart

Same layers, same dependency rule, same CQRS split. The one structural swap:
the presentation-layer **state service becomes a Cubit** (or Bloc, when the
screen genuinely needs event-sourced transitions instead of simple method
calls — Cubit is the default, reach for Bloc only when you need to react to
a stream of discrete events rather than direct method invocation).

## Folder tree (one vertical slice)

```
lib/
  modules/
    ordering/
      domain/
        order.dart
        order_id.dart
        order_line.dart
        order_status.dart
        order_repository.dart
      application/
        command/
          confirm_order_command.dart
          confirm_order_command_handler.dart
        query/
          get_order_query.dart
          get_order_query_handler.dart
          order_read_model.dart
        order_write_service.dart
        order_read_service.dart
      infrastructure/
        http_order_repository.dart
        order_mapper.dart
      presentation/
        cubit/
          order_details_cubit.dart
          order_details_state.dart
        order_details_page.dart
        order_details_view.dart
        order_details_skeleton.dart
  shared/
    domain/
      money.dart
      domain_error.dart
  composition_root.dart

test/
  modules/
    ordering/
      domain/
        order_mother.dart
        order_test.dart
      application/
        confirm_order_command_handler_test.dart
      presentation/
        order_details_cubit_test.dart
```

## Domain: private constructors, factory constructors

Dart's named constructors plus factory constructors give the same shape as
the TypeScript pattern — a private unnamed constructor, public factories.

```dart
class OrderId {
  const OrderId._(this._value);

  factory OrderId.create(String value) {
    if (value.isEmpty) {
      throw InvalidOrderIdError();
    }
    return OrderId._(value);
  }

  factory OrderId.generate() => OrderId._(const Uuid().v4());

  factory OrderId.empty() => const OrderId._('');

  final String _value;

  @override
  String toString() => _value;

  @override
  bool operator ==(Object other) => other is OrderId && other._value == _value;

  @override
  int get hashCode => _value.hashCode;
}
```

```dart
class Order {
  Order._(this._id, this._customerId, this._lines, this._status);

  factory Order.create(CustomerId customerId) {
    return Order._(OrderId.generate(), customerId, const [], OrderStatus.draft());
  }

  factory Order.empty() {
    return Order._(OrderId.empty(), CustomerId.empty(), const [], OrderStatus.draft());
  }

  final OrderId _id;
  final CustomerId _customerId;
  List<OrderLine> _lines;
  OrderStatus _status;

  OrderId get id => _id;

  void addLine(OrderLine line) {
    if (_status.isConfirmed) {
      throw CannotModifyConfirmedOrderError(_id);
    }
    _lines = [..._lines, line];
  }

  void confirm() {
    _status = _status.confirm();
  }
}
```

## No use cases, no data sources — same as TypeScript

Application services are `XCommandHandler` / `XQueryHandler` pairs, grouped
behind `OrderWriteService`/`OrderReadService` interfaces. Repositories talk
directly to the network/DB adapter — no intermediate `OrderDataSource`
class.

```dart
abstract class OrderRepository {
  Future<Order?> findById(OrderId id);
  Future<void> save(Order order);
}

class ConfirmOrderCommandHandler {
  ConfirmOrderCommandHandler(this._orders);

  final OrderRepository _orders;

  Future<void> handle(ConfirmOrderCommand command) async {
    final id = OrderId.create(command.orderId);
    final order = await _orders.findById(id);
    if (order == null) {
      throw OrderNotFoundError(id);
    }
    order.confirm();
    await _orders.save(order);
  }
}
```

## Presentation: Cubit as the state service

The Cubit sits in the presentation layer. It depends on
`OrderReadService`/`OrderWriteService` (application), emits states that the
widget tree consumes, and contains zero business logic — only orchestration
of loading/error/loaded states, exactly like the Preact hook.

```dart
sealed class OrderDetailsState {}

class OrderDetailsLoading extends OrderDetailsState {}

class OrderDetailsLoaded extends OrderDetailsState {
  OrderDetailsLoaded(this.order);
  final OrderReadModel order;
}

class OrderDetailsError extends OrderDetailsState {
  OrderDetailsError(this.message);
  final String message;
}

class OrderDetailsCubit extends Cubit<OrderDetailsState> {
  OrderDetailsCubit(this._readService, this._writeService, this._orderId)
      : super(OrderDetailsLoading()) {
    _load();
  }

  final OrderReadService _readService;
  final OrderWriteService _writeService;
  final String _orderId;

  Future<void> _load() async {
    try {
      final order = await _readService.getById(GetOrderQuery(_orderId));
      emit(OrderDetailsLoaded(order));
    } catch (error) {
      emit(OrderDetailsError(error.toString()));
    }
  }

  Future<void> confirm() async {
    await _writeService.confirm(ConfirmOrderCommand(_orderId));
    await _load();
  }
}
```

## Widgets: page (container) vs view (component)

Mirrors containers/components: `OrderDetailsPage` is the container — it owns
the `BlocProvider`/`BlocBuilder` and picks the loading/error/loaded branch.
`OrderDetailsView` is the pure component — plain constructor parameters, no
Cubit/Bloc awareness.

```dart
class OrderDetailsPage extends StatelessWidget {
  const OrderDetailsPage({required this.orderId, super.key});

  final String orderId;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => OrderDetailsCubit(
        context.read<OrderReadService>(),
        context.read<OrderWriteService>(),
        orderId,
      ),
      child: BlocBuilder<OrderDetailsCubit, OrderDetailsState>(
        builder: (context, state) => switch (state) {
          OrderDetailsLoading() => const OrderDetailsSkeleton(),
          OrderDetailsError(:final message) => OrderDetailsErrorView(message: message),
          OrderDetailsLoaded(:final order) => OrderDetailsView(
              order: order,
              onConfirm: () => context.read<OrderDetailsCubit>().confirm(),
            ),
        },
      ),
    );
  }
}
```

## Tooling

- Test runner: `flutter_test` / `test`.
- Mocking ports: `mocktail` (Dart's equivalent of ts-mockito — avoid
  `mockito`'s code generation step unless the project already relies on
  build_runner elsewhere).
- Cubit/Bloc testing: `bloc_test`, asserting the exact state sequence emitted.
- Arch tests: a small custom analyzer/lint script (or `import_lint`)
  enforcing the same forbidden-edges rule set as
  [07-testing-strategy.md](07-testing-strategy.md), run via
  `flutter analyze` + a dedicated `dart run tool/arch_test.dart` CI step.
- No comments in source — same rule as TypeScript; dartdoc (`///`) is only
  used for a published package's public API.

```dart
class ConfirmOrderCommandHandlerTest {}

void main() {
  group('ConfirmOrderCommandHandler', () {
    test('confirms an existing order and persists it', () async {
      final repository = MockOrderRepository();
      final order = OrderMother.random();
      when(() => repository.findById(order.id)).thenAnswer((_) async => order);

      final handler = ConfirmOrderCommandHandler(repository);
      await handler.handle(ConfirmOrderCommand(order.id.toString()));

      expect(order.status.isConfirmed, isTrue);
      verify(() => repository.save(order)).called(1);
    });
  });
}
```
