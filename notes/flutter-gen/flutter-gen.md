---
name: Flutter Generator
description: >
  Transforms Memoire component specs into production-quality Flutter widgets.
  Generates Material 3 themed widgets with Riverpod state management,
  responsive layouts, custom painting for dataviz, GoRouter navigation,
  and full test coverage. Follows Effective Dart and atomic design principles.
activateOn: component-creation
freedomLevel: high
category: generate
tags:
  - flutter
  - dart
  - material3
  - riverpod
  - widgets
  - codegen
---

# Flutter Generator Skill

## 1. Purpose

This skill converts Memoire JSON component specs into idiomatic Flutter/Dart code.
Every generated widget uses Material 3 theming, Riverpod for state, GoRouter for
navigation, and follows the atomic design hierarchy enforced by Memoire.

The generator handles five spec types:
- **ComponentSpec** -- atoms, molecules, organisms
- **PageSpec** -- full screens composed from templates
- **DatavizSpec** -- charts and visualizations via CustomPainter
- **DesignSpec** -- theme definitions and token maps
- **IASpec** -- navigation trees mapped to GoRouter config

---

## 2. Flutter Widget Architecture

### 2.1 StatelessWidget

Use for pure UI that depends only on constructor parameters and inherited widgets.
All atoms default to StatelessWidget unless the spec declares `stateful: true`.

```dart
class MetricLabel extends StatelessWidget {
  const MetricLabel({
    super.key,
    required this.value,
    required this.label,
    this.trend,
  });

  final String value;
  final String label;
  final TrendDirection? trend;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final text = theme.textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: text.headlineMedium?.copyWith(
            color: colors.onSurface,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: text.labelSmall?.copyWith(
            color: colors.onSurfaceVariant,
            letterSpacing: 0.8,
          ),
        ),
      ],
    );
  }
}
```

### 2.2 StatefulWidget

Use when the widget owns local, ephemeral state that does not belong in the
application state layer. Common cases: animation controllers, text editing
controllers, focus nodes, scroll positions, form validation state.

```dart
class ExpandableCard extends StatefulWidget {
  const ExpandableCard({
    super.key,
    required this.title,
    required this.content,
    this.initiallyExpanded = false,
  });

  final String title;
  final Widget content;
  final bool initiallyExpanded;

  @override
  State<ExpandableCard> createState() => _ExpandableCardState();
}

class _ExpandableCardState extends State<ExpandableCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _heightFactor;
  late bool _isExpanded;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.initiallyExpanded;
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
      value: _isExpanded ? 1.0 : 0.0,
    );
    _heightFactor = _controller.drive(CurveTween(curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() {
      _isExpanded = !_isExpanded;
      if (_isExpanded) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            title: Text(widget.title, style: theme.textTheme.titleMedium),
            trailing: RotationTransition(
              turns: Tween(begin: 0.0, end: 0.5).animate(_controller),
              child: const Icon(Icons.expand_more),
            ),
            onTap: _toggle,
          ),
          ClipRect(
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, child) => Align(
                heightFactor: _heightFactor.value,
                child: child,
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: widget.content,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

### 2.3 ConsumerWidget (Riverpod)

Use when the widget reads application state from providers. This is the default
for organisms and pages. Never mix `setState` with provider reads for the same
data. If a widget needs both local animation state and provider data, use
`ConsumerStatefulWidget`.

```dart
class DashboardSummary extends ConsumerWidget {
  const DashboardSummary({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metrics = ref.watch(dashboardMetricsProvider);

    return metrics.when(
      data: (data) => _SummaryContent(metrics: data),
      loading: () => const _SummaryShimmer(),
      error: (error, stack) => _SummaryError(
        message: error.toString(),
        onRetry: () => ref.invalidate(dashboardMetricsProvider),
      ),
    );
  }
}
```

---

## 3. Atomic Design to Flutter Folder Mapping

Memoire atomic levels map to a strict Flutter directory structure. The generator
enforces this -- it will refuse to create a molecule that does not import at
least two atoms.

| Memoire Level | Flutter Path                        | Widget Base Class     | Composition Rule                        |
|---------------|-------------------------------------|-----------------------|-----------------------------------------|
| `atom`        | `lib/ui/atoms/`                     | StatelessWidget       | No imports from molecules or above      |
| `molecule`    | `lib/ui/molecules/`                 | Stateless/Consumer    | Composes 2-5 atoms                      |
| `organism`    | `lib/ui/organisms/`                 | ConsumerWidget        | Composes molecules and/or atoms         |
| `template`    | `lib/ui/templates/`                 | StatelessWidget       | Layout skeleton with slot callbacks     |
| `page`        | `lib/pages/`                        | ConsumerWidget        | Template + real data from providers     |

### 3.1 Folder Layout

```
lib/
  core/
    theme/
      app_theme.dart          # ThemeData factory
      color_tokens.dart       # ColorScheme from Memoire tokens
      text_tokens.dart        # TextTheme from Memoire tokens
      spacing.dart            # Edge insets, gaps, paddings
      elevation.dart          # Surface tint and elevation tokens
    router/
      app_router.dart         # GoRouter configuration
      route_names.dart        # Named route constants
    providers/
      core_providers.dart     # App-wide Riverpod providers
  ui/
    atoms/
      metric_label.dart
      status_badge.dart
      icon_button_atom.dart
    molecules/
      metric_card.dart
      search_bar.dart
      nav_item.dart
    organisms/
      activity_chart.dart
      metrics_grid.dart
      data_table.dart
    templates/
      dashboard_template.dart
      detail_template.dart
      list_template.dart
  pages/
    dashboard_page.dart
    detail_page.dart
    settings_page.dart
  providers/
    dashboard_providers.dart
    auth_providers.dart
    settings_providers.dart
  models/
    metric.dart
    activity.dart
    user.dart
test/
  ui/
    atoms/
    molecules/
    organisms/
  pages/
  golden/
```

### 3.2 Import Rules (Enforced)

The generator validates these import constraints at emit time:

1. **Atoms** must not import from `molecules/`, `organisms/`, `templates/`, or `pages/`.
2. **Molecules** may import only from `atoms/`.
3. **Organisms** may import from `atoms/` and `molecules/`.
4. **Templates** may import from `atoms/`, `molecules/`, and `organisms/`.
5. **Pages** may import from any UI layer and from `providers/`.
6. All layers may import from `core/` (theme, router, shared utilities).

---

## 4. Material 3 Theming and Token Mapping

### 4.1 Design Token Translation

Memoire design tokens (extracted via `memi tokens` or from DesignSpec) map to
Flutter's Material 3 token system:

| Memoire Token Category | Flutter Target              | Example                                   |
|------------------------|-----------------------------|--------------------------------------------|
| `colors.primary`       | `ColorScheme.primary`       | `#1A1A2E` -> `Color(0xFF1A1A2E)`          |
| `colors.surface`       | `ColorScheme.surface`       | Includes surfaceContainerLow/High variants |
| `colors.error`         | `ColorScheme.error`         | Mapped with onError contrast pair          |
| `typography.heading`   | `TextTheme.headlineMedium`  | Size, weight, letterSpacing, height        |
| `typography.body`      | `TextTheme.bodyMedium`      | Includes bodyLarge and bodySmall           |
| `typography.label`     | `TextTheme.labelMedium`     | Monospace variant for metric displays      |
| `typography.mono`      | Custom `monoTextTheme`      | JetBrains Mono / Fira Code fallback        |
| `spacing.xs`           | `Spacing.xs` (4.0)         | Static const double                        |
| `spacing.sm`           | `Spacing.sm` (8.0)         | Used in SizedBox and EdgeInsets            |
| `spacing.md`           | `Spacing.md` (16.0)        | Default padding                            |
| `spacing.lg`           | `Spacing.lg` (24.0)        | Section gaps                               |
| `spacing.xl`           | `Spacing.xl` (32.0)        | Page margins                               |
| `elevation.level0`     | `Elevation.level0` (0.0)   | Flat surfaces                              |
| `elevation.level1`     | `Elevation.level1` (1.0)   | Cards                                      |
| `elevation.level2`     | `Elevation.level2` (3.0)   | Elevated cards, menus                      |
| `radius.sm`            | `BorderRadius.circular(8)`  | Chips, small cards                         |
| `radius.md`            | `BorderRadius.circular(12)` | Cards, dialogs                             |
| `radius.lg`            | `BorderRadius.circular(16)` | Sheets, large surfaces                     |

### 4.2 ThemeData Factory

```dart
abstract final class AppTheme {
  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: ColorTokens.primary,
      brightness: Brightness.light,
      surface: ColorTokens.surfaceLight,
      onSurface: ColorTokens.onSurfaceLight,
      surfaceContainerLowest: ColorTokens.surfaceContainerLowest,
      surfaceContainerLow: ColorTokens.surfaceContainerLow,
      surfaceContainer: ColorTokens.surfaceContainer,
      surfaceContainerHigh: ColorTokens.surfaceContainerHigh,
      surfaceContainerHighest: ColorTokens.surfaceContainerHighest,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: TextTokens.textTheme,
      cardTheme: CardThemeData(
        elevation: Elevation.level1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(RadiusTokens.md),
        ),
        clipBehavior: Clip.antiAlias,
      ),
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: Elevation.level2,
        backgroundColor: colorScheme.surface,
        foregroundColor: colorScheme.onSurface,
        titleTextStyle: TextTokens.textTheme.titleLarge?.copyWith(
          color: colorScheme.onSurface,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colorScheme.surfaceContainerLow,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(RadiusTokens.sm),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: Spacing.md,
          vertical: Spacing.sm,
        ),
      ),
    );
  }

  static ThemeData dark() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: ColorTokens.primary,
      brightness: Brightness.dark,
      surface: ColorTokens.surfaceDark,
      onSurface: ColorTokens.onSurfaceDark,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: TextTokens.textTheme,
      // Mirror light theme component themes with dark color scheme
    );
  }
}
```

### 4.3 Spacing Constants

```dart
abstract final class Spacing {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;

  // Convenience EdgeInsets
  static const EdgeInsets allMd = EdgeInsets.all(md);
  static const EdgeInsets allLg = EdgeInsets.all(lg);
  static const EdgeInsets horizontalMd = EdgeInsets.symmetric(horizontal: md);
  static const EdgeInsets verticalSm = EdgeInsets.symmetric(vertical: sm);

  // SizedBox gaps for use in Column/Row children lists
  static const SizedBox gapXs = SizedBox(height: xs, width: xs);
  static const SizedBox gapSm = SizedBox(height: sm, width: sm);
  static const SizedBox gapMd = SizedBox(height: md, width: md);
  static const SizedBox gapLg = SizedBox(height: lg, width: lg);
  static const SizedBox gapXl = SizedBox(height: xl, width: xl);
}
```

---

## 5. Riverpod State Management Patterns

### 5.1 Provider Selection Matrix

| Data Shape               | Provider Type              | Example Use Case               |
|--------------------------|----------------------------|---------------------------------|
| Computed / derived value | `Provider`                 | Filtered list, formatted string |
| Async fetch (read-only)  | `FutureProvider`           | API call, file read             |
| Async stream             | `StreamProvider`           | WebSocket, Firestore listener   |
| Mutable sync state       | `NotifierProvider`         | Form state, toggle, counter     |
| Mutable async state      | `AsyncNotifierProvider`    | CRUD operations with loading    |
| Family variant           | `*.family`                 | Parameterized by ID or filter   |
| Auto-dispose             | `*.autoDispose`            | Screen-scoped state cleanup     |

### 5.2 AsyncNotifier Pattern (Primary)

This is the default for any spec that declares `dataSource` or `api`:

```dart
@riverpod
class DashboardMetrics extends _$DashboardMetrics {
  @override
  FutureOr<List<Metric>> build() async {
    final repository = ref.watch(metricsRepositoryProvider);
    return repository.fetchDashboardMetrics();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(metricsRepositoryProvider).fetchDashboardMetrics(),
    );
  }

  Future<void> updateMetric(String id, double value) async {
    final repository = ref.read(metricsRepositoryProvider);
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await repository.updateMetric(id, value);
      return repository.fetchDashboardMetrics();
    });
  }
}
```

### 5.3 Notifier Pattern (Synchronous State)

For UI state that does not involve async operations:

```dart
@riverpod
class SidebarState extends _$SidebarState {
  @override
  SidebarModel build() {
    return const SidebarModel(
      isExpanded: true,
      selectedIndex: 0,
    );
  }

  void toggle() {
    state = state.copyWith(isExpanded: !state.isExpanded);
  }

  void selectItem(int index) {
    state = state.copyWith(selectedIndex: index);
  }
}
```

### 5.4 Family Providers (Parameterized)

When a spec declares `props` that act as external keys (e.g., user ID, project ID):

```dart
@riverpod
Future<UserProfile> userProfile(Ref ref, String userId) async {
  final repository = ref.watch(userRepositoryProvider);
  return repository.getProfile(userId);
}

// Usage in widget:
// final profile = ref.watch(userProfileProvider(userId));
```

### 5.5 AsyncValue Handling in Widgets

Every generated widget that reads async state must handle all three states:

```dart
asyncValue.when(
  data: (data) => _BuildContent(data: data),
  loading: () => const _LoadingShimmer(),
  error: (error, stack) => _ErrorState(
    message: error.toString(),
    onRetry: () => ref.invalidate(provider),
  ),
);
```

Never use `asyncValue.value!` -- it crashes on loading/error. Never use
`asyncValue.whenOrNull` unless the widget genuinely renders nothing for
missing states.

---

## 6. Layout Widgets

### 6.1 Core Layout Strategy

Flutter layouts are built from three primitives: **Flex** (Column/Row),
**Stack** (layered), and **Constrained** (SizedBox, ConstrainedBox).

The generator maps Memoire spec layout declarations:

| Spec Layout     | Flutter Widget                         | Notes                               |
|-----------------|----------------------------------------|--------------------------------------|
| `vertical`      | `Column`                               | mainAxisSize: MainAxisSize.min       |
| `horizontal`    | `Row`                                  | crossAxisAlignment varies            |
| `stack`         | `Stack` + `Positioned`                 | For overlays, badges, FAB placement  |
| `grid`          | `Wrap` or `GridView`                   | Wrap for flow, GridView for uniform  |
| `scroll`        | `CustomScrollView` + slivers           | For heterogeneous scrollable lists   |
| `constrained`   | `ConstrainedBox` / `SizedBox`          | Max/min width and height bounds      |

### 6.2 Flex Patterns

```dart
// Spec: layout: "horizontal", gap: "md", align: "center"
Row(
  spacing: Spacing.md,      // Flutter 3.27+ spacing parameter
  crossAxisAlignment: CrossAxisAlignment.center,
  children: [
    const StatusBadge(status: Status.active),
    Expanded(
      child: Text(title, style: theme.textTheme.titleMedium),
    ),
    IconButton(
      icon: const Icon(Icons.more_vert),
      onPressed: onMore,
    ),
  ],
)
```

### 6.3 Sliver-Based Scrolling

For pages with mixed content (headers, lists, grids), always prefer slivers:

```dart
CustomScrollView(
  slivers: [
    SliverAppBar.large(
      title: Text(pageTitle),
    ),
    SliverPadding(
      padding: Spacing.horizontalMd,
      sliver: SliverToBoxAdapter(
        child: MetricsSummaryRow(metrics: metrics),
      ),
    ),
    SliverPadding(
      padding: Spacing.horizontalMd,
      sliver: SliverList.builder(
        itemCount: items.length,
        itemBuilder: (context, index) => ActivityCard(
          activity: items[index],
        ),
      ),
    ),
  ],
)
```

---

## 7. Responsive Design

### 7.1 Breakpoint System

The generator creates a breakpoint utility mapped from Memoire viewport tokens:

```dart
abstract final class Breakpoints {
  static const double compact = 600;
  static const double medium = 840;
  static const double expanded = 1200;
  static const double large = 1600;

  static ScreenSize of(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    if (width < compact) return ScreenSize.compact;
    if (width < medium) return ScreenSize.medium;
    if (width < expanded) return ScreenSize.expanded;
    return ScreenSize.large;
  }
}

enum ScreenSize { compact, medium, expanded, large }
```

### 7.2 Responsive Layout Pattern

```dart
class ResponsiveDashboard extends StatelessWidget {
  const ResponsiveDashboard({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final screen = Breakpoints.of(context);

    return switch (screen) {
      ScreenSize.compact => Scaffold(
          appBar: const DashboardAppBar(),
          drawer: const NavigationDrawer(children: [/* nav items */]),
          body: child,
        ),
      ScreenSize.medium => Scaffold(
          body: Row(
            children: [
              const NavigationRail(
                destinations: [/* destinations */],
                selectedIndex: 0,
              ),
              const VerticalDivider(width: 1),
              Expanded(child: child),
            ],
          ),
        ),
      ScreenSize.expanded || ScreenSize.large => Scaffold(
          body: Row(
            children: [
              const NavigationDrawer(children: [/* nav items */]),
              Expanded(child: child),
            ],
          ),
        ),
    };
  }
}
```

### 7.3 Adaptive Grid

For content grids that reflow based on available width:

```dart
class AdaptiveGrid extends StatelessWidget {
  const AdaptiveGrid({
    super.key,
    required this.children,
    this.minChildWidth = 280,
    this.spacing = Spacing.md,
  });

  final List<Widget> children;
  final double minChildWidth;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = (constraints.maxWidth / minChildWidth)
            .floor()
            .clamp(1, 4);

        return GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: crossAxisCount,
          mainAxisSpacing: spacing,
          crossAxisSpacing: spacing,
          childAspectRatio: 1.6,
          children: children,
        );
      },
    );
  }
}
```

---

## 8. Custom Painting for Dataviz

When a Memoire DatavizSpec is processed, the generator produces CustomPainter
widgets instead of relying on charting libraries. This ensures pixel-perfect
control and theme integration.

### 8.1 Line Chart Painter

```dart
class LineChartPainter extends CustomPainter {
  LineChartPainter({
    required this.data,
    required this.lineColor,
    required this.fillColor,
    required this.gridColor,
    required this.labelStyle,
    this.animate = 1.0,
  });

  final List<DataPoint> data;
  final Color lineColor;
  final Color fillColor;
  final Color gridColor;
  final TextStyle labelStyle;
  final double animate;

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;

    final chartArea = Rect.fromLTRB(48, 16, size.width - 16, size.height - 32);
    _drawGrid(canvas, chartArea);
    _drawLine(canvas, chartArea);
    _drawFill(canvas, chartArea);
    _drawLabels(canvas, chartArea);
  }

  void _drawGrid(Canvas canvas, Rect area) {
    final paint = Paint()
      ..color = gridColor
      ..strokeWidth = 0.5;

    for (var i = 0; i <= 4; i++) {
      final y = area.top + (area.height / 4) * i;
      canvas.drawLine(Offset(area.left, y), Offset(area.right, y), paint);
    }
  }

  void _drawLine(Canvas canvas, Rect area) {
    if (data.length < 2) return;

    final maxY = data.map((d) => d.value).reduce(max);
    final minY = data.map((d) => d.value).reduce(min);
    final range = maxY - minY;

    final path = Path();
    for (var i = 0; i < data.length; i++) {
      final x = area.left + (area.width / (data.length - 1)) * i;
      final normalizedY = range == 0 ? 0.5 : (data[i].value - minY) / range;
      final y = area.bottom - (normalizedY * area.height * animate);

      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    final paint = Paint()
      ..color = lineColor
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawPath(path, paint);
  }

  void _drawFill(Canvas canvas, Rect area) {
    // Gradient fill beneath the line using the same point calculations
    // as _drawLine, with the path closed along the bottom edge and
    // a vertical LinearGradient from fillColor to transparent
  }

  void _drawLabels(Canvas canvas, Rect area) {
    // X-axis labels: data[i].label positioned at computed x offsets
    // Y-axis labels: formatted min/max values using TextPainter
    // Both respect the labelStyle parameter from the theme
  }

  @override
  bool shouldRepaint(covariant LineChartPainter oldDelegate) {
    return oldDelegate.data != data || oldDelegate.animate != animate;
  }
}
```

### 8.2 Animated Chart Widget

```dart
class AnimatedLineChart extends StatefulWidget {
  const AnimatedLineChart({
    super.key,
    required this.data,
    this.height = 200,
  });

  final List<DataPoint> data;
  final double height;

  @override
  State<AnimatedLineChart> createState() => _AnimatedLineChartState();
}

class _AnimatedLineChartState extends State<AnimatedLineChart>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..forward();
  }

  @override
  void didUpdateWidget(AnimatedLineChart oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.data != widget.data) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) => CustomPaint(
        size: Size(double.infinity, widget.height),
        painter: LineChartPainter(
          data: widget.data,
          lineColor: colors.primary,
          fillColor: colors.primary.withValues(alpha: 0.1),
          gridColor: colors.outlineVariant,
          labelStyle: theme.textTheme.labelSmall!.copyWith(
            color: colors.onSurfaceVariant,
          ),
          animate: CurvedAnimation(
            parent: _controller,
            curve: Curves.easeOutCubic,
          ).value,
        ),
      ),
    );
  }
}
```

### 8.3 Additional Dataviz Painters

The generator includes painters for all Memoire dataviz types:

- **BarChartPainter** -- vertical/horizontal bars, stacked, grouped. Each bar
  receives its color from the theme's colorScheme roles (primary, secondary,
  tertiary) and renders rounded top corners using `RRect`.
- **DonutChartPainter** -- arc segments drawn with `canvas.drawArc`, center
  label via TextPainter, optional legend rendered as a Row of color swatches.
- **SparklinePainter** -- minimal inline chart for metric cards. Single-stroke
  path, no axes, no labels. Designed to fit inside a 64x24 bounding box.
- **HeatmapPainter** -- grid cells with color intensity mapped from a normalized
  0.0-1.0 range using `Color.lerp` between surface and primary colors.
- **ProgressRingPainter** -- circular arc with rounded stroke cap, percentage
  label centered, optional secondary track ring.

Each painter accepts theme colors and text styles as constructor parameters.
No hardcoded colors anywhere. All painters implement `shouldRepaint` correctly
by comparing relevant data fields.

---

## 9. Navigation with GoRouter

### 9.1 Route Configuration from IASpec

The generator reads IASpec navigation trees and produces GoRouter config:

```dart
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: RouteNames.dashboard,
    debugLogDiagnostics: kDebugMode,
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isLoginRoute = state.matchedLocation == RouteNames.login;

      if (!isLoggedIn && !isLoginRoute) return RouteNames.login;
      if (isLoggedIn && isLoginRoute) return RouteNames.dashboard;
      return null;
    },
    routes: [
      GoRoute(
        path: RouteNames.login,
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      ShellRoute(
        builder: (context, state, child) => ResponsiveDashboard(child: child),
        routes: [
          GoRoute(
            path: RouteNames.dashboard,
            name: 'dashboard',
            builder: (context, state) => const DashboardPage(),
          ),
          GoRoute(
            path: '${RouteNames.detail}/:id',
            name: 'detail',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return DetailPage(id: id);
            },
          ),
          GoRoute(
            path: RouteNames.settings,
            name: 'settings',
            builder: (context, state) => const SettingsPage(),
          ),
        ],
      ),
    ],
  );
});
```

### 9.2 Route Names

```dart
abstract final class RouteNames {
  static const String login = '/login';
  static const String dashboard = '/dashboard';
  static const String detail = '/detail';
  static const String settings = '/settings';
}
```

### 9.3 Navigation in Widgets

```dart
// Named navigation
context.goNamed('detail', pathParameters: {'id': item.id});

// Direct path
context.go('/dashboard');

// Push (keeps back stack)
context.pushNamed('detail', pathParameters: {'id': item.id});
```

---

## 10. Composition Over Inheritance

### 10.1 Slot-Based Templates

Templates declare slots as required widget parameters, not as subclasses:

```dart
class DashboardTemplate extends StatelessWidget {
  const DashboardTemplate({
    super.key,
    required this.header,
    required this.metrics,
    required this.content,
    this.sidebar,
  });

  final Widget header;
  final Widget metrics;
  final Widget content;
  final Widget? sidebar;

  @override
  Widget build(BuildContext context) {
    final screen = Breakpoints.of(context);
    final hasSidebar = sidebar != null && screen != ScreenSize.compact;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        header,
        Spacing.gapMd,
        metrics,
        Spacing.gapLg,
        Expanded(
          child: hasSidebar
              ? Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(flex: 3, child: content),
                    SizedBox(width: Spacing.md),
                    Expanded(flex: 1, child: sidebar!),
                  ],
                )
              : content,
        ),
      ],
    );
  }
}
```

### 10.2 Composing Atoms into Molecules

```dart
// Atom: StatusBadge
// Atom: MetricLabel
// Atom: TrendArrow

// Molecule: MetricCard (composes 3 atoms)
class MetricCard extends StatelessWidget {
  const MetricCard({
    super.key,
    required this.label,
    required this.value,
    required this.status,
    this.trend,
  });

  final String label;
  final String value;
  final Status status;
  final TrendDirection? trend;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: Spacing.allMd,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                StatusBadge(status: status),
                if (trend != null) TrendArrow(direction: trend!),
              ],
            ),
            Spacing.gapSm,
            MetricLabel(value: value, label: label),
          ],
        ),
      ),
    );
  }
}
```

---

## 11. Integration with Memoire Spec System

### 11.1 Spec-to-Widget Mapping

The generator reads each spec field and maps it to widget output:

| Spec Field          | Widget Output                                     |
|---------------------|---------------------------------------------------|
| `name`              | Class name (PascalCase)                            |
| `atomicLevel`       | Target directory and base class selection           |
| `props`             | Constructor parameters with types                   |
| `slots`             | `Widget` or `Widget Function()` parameters          |
| `state`             | Riverpod provider type and initial value            |
| `dataSource`        | FutureProvider or AsyncNotifierProvider              |
| `layout`            | Column, Row, Stack, or CustomScrollView             |
| `variants`          | Enum + switch expression in build method            |
| `tokens`            | Theme.of(context) lookups                           |
| `composesSpecs`     | Import statements and child widget usage            |
| `accessibility`     | Semantics wrappers and excludeSemantics flags       |
| `interactions`      | GestureDetector, InkWell, or button callbacks       |
| `responsive`        | LayoutBuilder / MediaQuery breakpoint switches      |

### 11.2 Generation Pipeline

```
spec.json
  |-- validate (Zod schema)
  |-- classify (atomic level check)
  |-- resolve dependencies (composesSpecs -> import paths)
  |-- map tokens (design tokens -> theme lookups)
  |-- map state (dataSource -> provider)
  |-- emit widget (.dart file)
  |-- emit provider (if stateful)
  |-- emit model (if dataSource defined)
  |-- emit test (widget test + golden)
  |-- validate imports (atomic level enforcement)
```

### 11.3 Running the Generator

```bash
# Generate a single component
memi generate MetricCard --target flutter

# Generate all specs
memi generate --all --target flutter

# Generate with watch mode
memi watch --target flutter
```

---

## 12. Dart Code Style (Effective Dart)

### 12.1 Naming

- **Classes, enums, typedefs, type parameters**: `PascalCase`
- **Libraries, packages, directories, source files**: `snake_case`
- **Variables, parameters, named constants**: `camelCase`
- **Private members**: prefix with `_`

### 12.2 Code Conventions

1. **Prefer `const` constructors** -- every widget that can be const must be const.
2. **Use `final` for fields** -- mutable widget fields are a code smell.
3. **Prefer expression bodies** for single-expression functions.
4. **Use trailing commas** on all argument lists and collection literals. This
   ensures dart format produces readable one-argument-per-line output.
5. **Sort imports**: dart: first, package: second, relative third. Separate groups
   with a blank line.
6. **Never use `dynamic`** -- prefer `Object?` when the type is truly unknown.
7. **Prefer `switch` expressions** over if-else chains for enum matching.
8. **Use records and patterns** (Dart 3.0+) for multi-return values and
   destructuring.
9. **Annotate return types** on all public functions and methods.
10. **Use `sealed` classes** for state models that are pattern-matched.

### 12.3 File Structure Convention

Every generated .dart file follows this order:

```
1. Library-level documentation comment
2. Imports (grouped and sorted)
3. Part directives (for code generation)
4. Constants
5. Enums
6. Sealed/abstract classes (state models)
7. Widget class
8. Private helper widgets (prefixed with _)
9. Extensions (if any)
```

---

## 13. Accessibility with Semantics

### 13.1 Semantic Annotations

Every generated widget includes appropriate semantics:

```dart
Semantics(
  label: 'Revenue metric: \$${value}',
  value: value,
  hint: 'Double tap for details',
  child: MetricCard(
    label: label,
    value: value,
    status: status,
  ),
)
```

### 13.2 Rules

1. **Every interactive element** must have a semantic label or be wrapped in
   Semantics. Buttons and InkWell must have `tooltip` or `semanticLabel`.
2. **Decorative elements** (dividers, pure visual flourishes) get
   `ExcludeSemantics`.
3. **Images** must have `semanticLabel` on the Image widget.
4. **Custom painters** must wrap their CustomPaint in Semantics with a
   text description of the data being visualized.
5. **Charts** provide a `MergeSemantics` wrapper with a summary:
   `"Line chart showing revenue trend. Highest value: 42k on March 15."`.
6. **Text contrast** -- the generator validates that color token pairs meet
   WCAG AA (4.5:1 for normal text, 3:1 for large text) at generation time.
7. **Touch targets** -- minimum 48x48dp enforced for all tap targets. The
   generator wraps undersized widgets in `SizedBox(width: 48, height: 48)`.

### 13.3 Focus Management

```dart
FocusTraversalGroup(
  policy: OrderedTraversalPolicy(),
  child: Column(
    children: [
      FocusTraversalOrder(
        order: const NumericFocusOrder(1),
        child: SearchBar(/* ... */),
      ),
      FocusTraversalOrder(
        order: const NumericFocusOrder(2),
        child: MetricsGrid(/* ... */),
      ),
    ],
  ),
)
```

---

## 14. Testing

### 14.1 Widget Tests

Every generated widget gets a corresponding test file:

```dart
void main() {
  group('MetricCard', () {
    testWidgets('renders value and label', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: MetricCard(
              label: 'Revenue',
              value: '\$42,000',
              status: Status.active,
            ),
          ),
        ),
      );

      expect(find.text('\$42,000'), findsOneWidget);
      expect(find.text('Revenue'), findsOneWidget);
    });

    testWidgets('shows trend arrow when trend is provided', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: MetricCard(
              label: 'Revenue',
              value: '\$42,000',
              status: Status.active,
              trend: TrendDirection.up,
            ),
          ),
        ),
      );

      expect(find.byType(TrendArrow), findsOneWidget);
    });

    testWidgets('hides trend arrow when trend is null', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: MetricCard(
              label: 'Revenue',
              value: '\$42,000',
              status: Status.active,
            ),
          ),
        ),
      );

      expect(find.byType(TrendArrow), findsNothing);
    });

    testWidgets('meets accessibility guidelines', (tester) async {
      final handle = tester.ensureSemantics();

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: MetricCard(
              label: 'Revenue',
              value: '\$42,000',
              status: Status.active,
            ),
          ),
        ),
      );

      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });
  });
}
```

### 14.2 Riverpod Provider Tests

```dart
void main() {
  group('DashboardMetrics', () {
    test('fetches metrics on build', () async {
      final container = ProviderContainer(
        overrides: [
          metricsRepositoryProvider.overrideWithValue(
            MockMetricsRepository(),
          ),
        ],
      );
      addTearDown(container.dispose);

      final metrics = await container.read(
        dashboardMetricsProvider.future,
      );

      expect(metrics, hasLength(5));
      expect(metrics.first.label, equals('Revenue'));
    });

    test('refresh reloads data', () async {
      final mockRepo = MockMetricsRepository();
      final container = ProviderContainer(
        overrides: [
          metricsRepositoryProvider.overrideWithValue(mockRepo),
        ],
      );
      addTearDown(container.dispose);

      await container.read(dashboardMetricsProvider.future);
      await container.read(dashboardMetricsProvider.notifier).refresh();

      verify(() => mockRepo.fetchDashboardMetrics()).called(2);
    });
  });
}
```

### 14.3 Golden Tests

Golden tests capture pixel-perfect snapshots. The generator creates them for
every atom and molecule:

```dart
void main() {
  group('MetricCard golden', () {
    testWidgets('light theme', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: const Scaffold(
            body: Center(
              child: SizedBox(
                width: 280,
                child: MetricCard(
                  label: 'Revenue',
                  value: '\$42,000',
                  status: Status.active,
                  trend: TrendDirection.up,
                ),
              ),
            ),
          ),
        ),
      );

      await expectLater(
        find.byType(MetricCard),
        matchesGoldenFile('golden/metric_card_light.png'),
      );
    });

    testWidgets('dark theme', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.dark(),
          home: const Scaffold(
            body: Center(
              child: SizedBox(
                width: 280,
                child: MetricCard(
                  label: 'Revenue',
                  value: '\$42,000',
                  status: Status.active,
                  trend: TrendDirection.up,
                ),
              ),
            ),
          ),
        ),
      );

      await expectLater(
        find.byType(MetricCard),
        matchesGoldenFile('golden/metric_card_dark.png'),
      );
    });
  });
}
```

### 14.4 Test Utilities

The generator produces shared test helpers:

```dart
// test/helpers/pump_app.dart
extension PumpApp on WidgetTester {
  Future<void> pumpApp(
    Widget widget, {
    ThemeData? theme,
    List<Override> overrides = const [],
  }) async {
    await pumpWidget(
      ProviderScope(
        overrides: overrides,
        child: MaterialApp(
          theme: theme ?? AppTheme.light(),
          home: Scaffold(body: widget),
        ),
      ),
    );
  }
}
```

---

## 15. Platform-Adaptive Patterns

### 15.1 iOS vs Android

The generator produces adaptive widgets when the spec declares
`adaptive: true`:

```dart
class AdaptiveDialog extends StatelessWidget {
  const AdaptiveDialog({
    super.key,
    required this.title,
    required this.content,
    required this.onConfirm,
    required this.onCancel,
  });

  final String title;
  final Widget content;
  final VoidCallback onConfirm;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final platform = Theme.of(context).platform;

    return switch (platform) {
      TargetPlatform.iOS || TargetPlatform.macOS => CupertinoAlertDialog(
          title: Text(title),
          content: content,
          actions: [
            CupertinoDialogAction(
              onPressed: onCancel,
              child: const Text('Cancel'),
            ),
            CupertinoDialogAction(
              isDefaultAction: true,
              onPressed: onConfirm,
              child: const Text('Confirm'),
            ),
          ],
        ),
      _ => AlertDialog(
          title: Text(title),
          content: content,
          actions: [
            TextButton(onPressed: onCancel, child: const Text('Cancel')),
            FilledButton(onPressed: onConfirm, child: const Text('Confirm')),
          ],
        ),
    };
  }
}
```

### 15.2 Platform-Specific Navigation

```dart
// iOS: CupertinoTabScaffold with CupertinoTabBar
// Android: Scaffold with NavigationBar (M3)
// Tablet/Desktop: NavigationRail or permanent NavigationDrawer

Widget buildNavigation(BuildContext context) {
  final platform = Theme.of(context).platform;
  final screen = Breakpoints.of(context);

  if (screen == ScreenSize.expanded || screen == ScreenSize.large) {
    return const _DesktopNavigation();
  }

  return switch (platform) {
    TargetPlatform.iOS || TargetPlatform.macOS => const _CupertinoTabNav(),
    _ => const _MaterialBottomNav(),
  };
}
```

### 15.3 Adaptive Text Scaling

```dart
// Respect user's text scale preference, but clamp for layout stability
MediaQuery(
  data: MediaQuery.of(context).copyWith(
    textScaler: MediaQuery.of(context).textScaler.clamp(
      minScaleFactor: 0.8,
      maxScaleFactor: 1.5,
    ),
  ),
  child: child,
)
```

---

## 16. Anti-Patterns to Avoid

The generator enforces these rules and will refuse to emit code that violates them.

### 16.1 Widget Anti-Patterns

| Anti-Pattern                    | Why It Fails                                       | Correct Approach                         |
|---------------------------------|-----------------------------------------------------|------------------------------------------|
| Hardcoded colors                | Breaks theming, dark mode, and token consistency    | Use `Theme.of(context).colorScheme`      |
| Hardcoded text sizes            | Ignores user accessibility settings                 | Use `Theme.of(context).textTheme`        |
| `setState` for app-level state  | Does not survive navigation, cannot be shared       | Use Riverpod providers                   |
| Deeply nested build methods     | Unreadable, hard to test, poor performance          | Extract private `_SubWidget` classes     |
| `MediaQuery.of` in build        | Causes full rebuild on any media change             | Use `MediaQuery.sizeOf` for size only    |
| `BuildContext` across async gap | Context may be unmounted after await                | Check `mounted` or use ref callbacks     |
| Mutable fields on widgets       | Widgets are immutable value objects                 | Use State or providers for mutation      |
| Using `Container` for everything| Obscures intent, adds unnecessary layering          | Use `SizedBox`, `DecoratedBox`, `Padding`|
| `Provider` in widget tree       | Wrong provider -- InheritedWidget, not Riverpod     | Use `ProviderScope` at app root only     |
| Rebuilding entire lists         | O(n) rebuild when one item changes                  | Use `ListView.builder` with keys         |

### 16.2 State Anti-Patterns

| Anti-Pattern                    | Why It Fails                                       | Correct Approach                         |
|---------------------------------|-----------------------------------------------------|------------------------------------------|
| Global mutable variables        | No lifecycle, no disposal, no reactivity            | Riverpod providers with auto-dispose     |
| Provider inside widget          | Created on every build, leaks, no caching           | Declare providers at file top level      |
| Watching in callbacks           | `ref.watch` outside build throws                    | Use `ref.read` in callbacks              |
| Ignoring `AsyncValue.error`     | Silent failures, blank screens                      | Always handle all three states           |
| Manual dispose without cancel   | Memory leaks, zombie listeners                      | Use `ref.onDispose` and autoDispose      |

### 16.3 Layout Anti-Patterns

| Anti-Pattern                    | Why It Fails                                       | Correct Approach                         |
|---------------------------------|-----------------------------------------------------|------------------------------------------|
| Unbounded height in scrollable  | `Column` in `SingleChildScrollView` with Expanded   | Use slivers or shrinkWrap                |
| Fixed pixel sizes               | Breaks on different densities and screen sizes      | Use responsive breakpoints and Flex      |
| Nested `ListView`               | Unbounded height conflict                           | Use `shrinkWrap` + `NeverScrollable` or slivers |
| Ignoring safe area              | Content under notch/status bar                      | Wrap in `SafeArea` or use `SliverSafeArea` |
| `Stack` for simple layouts      | Overcomplicates what Column/Row solve trivially     | Reserve Stack for true overlays          |

### 16.4 Performance Anti-Patterns

| Anti-Pattern                    | Why It Fails                                       | Correct Approach                         |
|---------------------------------|-----------------------------------------------------|------------------------------------------|
| Creating objects in build       | New allocations every frame, GC pressure            | Promote to const or field                |
| Missing `const` constructors    | Prevents Flutter's widget identity optimization     | Always declare const when possible       |
| Large build methods             | Entire subtree rebuilds for any state change        | Split into smaller widgets for granular rebuild |
| `opacity` on complex subtrees   | Rasterizes entire subtree to offscreen buffer       | Use `AnimatedOpacity` or `FadeTransition` |
| Unkeyed lists with reorder      | Incorrect state association after reorder           | Use `ValueKey` on stateful list children |

---

## 17. Generated File Header

Every file the generator emits begins with:

```dart
// =============================================================
// Generated by Memoire Flutter Generator v1.0.0
// Spec: {specName} ({atomicLevel})
// Generated: {timestamp}
// DO NOT EDIT -- regenerate with: memi generate {name} --target flutter
// =============================================================
```

This header is checked by the watch mode to avoid regenerating files that
have been manually modified (the header hash changes if the file is edited).

---

## 18. pubspec.yaml Dependencies

The generator ensures the project pubspec includes:

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.6.0
  riverpod_annotation: ^2.6.0
  go_router: ^14.0.0
  freezed_annotation: ^2.4.0
  json_annotation: ^4.9.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  riverpod_generator: ^2.6.0
  build_runner: ^2.4.0
  freezed: ^2.5.0
  json_serializable: ^6.8.0
  mocktail: ^1.0.0
  golden_toolkit: ^0.15.0
  riverpod_lint: ^2.3.0
  custom_lint: ^0.6.0
```

---

## 19. Summary: Generation Decision Tree

```
Input: Memoire Spec JSON
  |
  |-- Is atomicLevel "atom"?
  |     YES -> StatelessWidget in lib/ui/atoms/
  |            No provider. Const constructor. Minimal.
  |
  |-- Is atomicLevel "molecule"?
  |     YES -> StatelessWidget or ConsumerWidget in lib/ui/molecules/
  |            Import and compose atoms. Add Semantics.
  |
  |-- Is atomicLevel "organism"?
  |     YES -> ConsumerWidget in lib/ui/organisms/
  |            Provider for state. AsyncValue handling.
  |
  |-- Is atomicLevel "template"?
  |     YES -> StatelessWidget in lib/ui/templates/
  |            Slot-based (Widget parameters). Responsive layout.
  |
  |-- Is atomicLevel "page"?
  |     YES -> ConsumerWidget in lib/pages/
  |            Template + providers. GoRouter integration.
  |
  |-- Is specType "dataviz"?
  |     YES -> CustomPainter + AnimationController
  |            Wrap in Semantics with data summary.
  |
  |-- Is specType "design"?
  |     YES -> ThemeData, ColorScheme, TextTheme
  |            Token mapping to Material 3.
  |
  |-- Is specType "ia"?
  |     YES -> GoRouter config + RouteNames
  |            ShellRoute for persistent navigation.
  |
  For every output:
    -> Generate widget test
    -> Generate golden test (atoms + molecules)
    -> Validate import rules
    -> Verify accessibility (Semantics, tap targets, contrast)
    -> Add file header with spec hash
```
