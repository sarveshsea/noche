---
name: React Native Generator
description: >
  Generate React Native components from Memoire ComponentSpecs. Maps shadcn/ui
  primitives to RN equivalents, applies NativeWind for styling, and handles
  platform-specific patterns for iOS and Android.
activateOn: component-creation
freedomLevel: high
category: generate
tags:
  - react-native
  - nativewind
  - expo
  - mobile
  - cross-platform
---

# React Native Generator — Memoire Codegen Skill

Translates Memoire specs into production React Native components.
Maintains atomic design hierarchy and maps web primitives to native equivalents.

---

## Mapping Rules

### shadcn/ui to React Native

| shadcn Component | RN Equivalent | Notes |
|-----------------|---------------|-------|
| Button | Pressable + Text | Use `Pressable` over `TouchableOpacity` |
| Card | View with shadow styles | NativeWind `shadow-md rounded-lg` |
| Input | TextInput | Add `returnKeyType`, `autoCapitalize` |
| Badge | View + Text | Fixed height, `rounded-full` |
| Avatar | Image with fallback View | `borderRadius: 9999` |
| Dialog | Modal | Use RN `Modal` with `transparent` |
| Select | Custom ActionSheet or Picker | Platform-specific |
| Separator | View with `h-px bg-border` | |
| Tabs | Custom with `Pressable` row | Horizontal scroll for overflow |
| Table | FlatList with header row | Virtualized by default |
| Switch | RN Switch | Map `trackColor`, `thumbColor` |
| Checkbox | Pressable + icon toggle | No native checkbox on RN |
| ScrollArea | ScrollView | Add `showsVerticalScrollIndicator` |
| Sheet | Modal + Animated.View | Bottom sheet pattern |
| Skeleton | Animated View with shimmer | Use `Animated` opacity loop |

### Tailwind to NativeWind

- Web Tailwind classes map 1:1 in NativeWind 4.x
- Exceptions: `hover:`, `focus-visible:` — replace with `active:` states
- Grid: Use `flex` layout — RN has no CSS Grid
- `gap-*` works in NativeWind, prefer over margin hacks

### Atomic Folders (React Native)

| Level | Output Path |
|-------|-------------|
| atom | `components/ui/` |
| molecule | `components/molecules/` |
| organism | `components/organisms/` |
| template | `components/templates/` |
| page | `screens/` |

---

## Component Template

```tsx
import { View, Text, Pressable } from "react-native";
import type { ComponentProps } from "react";

interface {Name}Props {
  // Generated from spec.props
}

export function {Name}({ ...props }: {Name}Props) {
  return (
    <View className="...">
      {/* Component content */}
    </View>
  );
}
```

## Guidelines

### OBSERVE
- Read the ComponentSpec fully — check `level`, `variants`, `props`, `shadcnBase`
- Check if a native equivalent already exists in the project
- Identify platform-specific requirements (iOS safe area, Android back handler)

### PLAN
- Map each shadcn base to its RN equivalent from the table above
- Determine if platform branching is needed (`Platform.OS`)
- Plan animation approach for interactive components

### EXECUTE
- Generate component with NativeWind classes
- Export barrel file (`index.ts`)
- Add platform-specific files only when behavior diverges (`.ios.tsx`, `.android.tsx`)

### VALIDATE
- Verify all imports resolve (no web-only packages)
- Check NativeWind classes are RN-compatible
- Ensure accessibility: `accessibilityLabel`, `accessibilityRole`, `accessibilityState`
- No `onClick` — use `onPress`
- No `className` on `Text` without NativeWind — use `style` as fallback

---

## Platform Patterns

### Safe Area
```tsx
import { useSafeAreaInsets } from "react-native-safe-area-context";
const insets = useSafeAreaInsets();
<View style={{ paddingTop: insets.top }}>
```

### Haptics
```tsx
import * as Haptics from "expo-haptics";
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

### Bottom Sheet
```tsx
// Prefer @gorhom/bottom-sheet for production
import BottomSheet from "@gorhom/bottom-sheet";
```

### Keyboard Avoidance
```tsx
import { KeyboardAvoidingView, Platform } from "react-native";
<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
```
