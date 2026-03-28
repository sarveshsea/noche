---
name: vue-gen
description: Vue 3 Composition API code generation -- transforms Memoire component specs into Vue SFCs with script setup, Tailwind styling, and composable patterns
category: generate
activateOn: component-creation
freedomLevel: high
tags: [vue, vue3, composition-api, sfc, tailwind, codegen]
version: 1.0.0
---

# Vue Generator -- Memoire Spec to Vue SFC

Transforms Memoire component specs into production-ready Vue 3 Single File Components. Uses Composition API with `<script setup>`, TypeScript, Tailwind CSS, and composable patterns for state management.

---

## Atomic Design Mapping to Vue

| Atomic Level | Vue Pattern | Output Directory | Example |
|--------------|------------|------------------|---------|
| atom | SFC, no composables | `components/ui/` | `MButton.vue`, `MBadge.vue` |
| molecule | SFC, may use atoms | `components/molecules/` | `SearchField.vue`, `UserChip.vue` |
| organism | SFC + composable | `components/organisms/` | `DataTable.vue`, `Sidebar.vue` |
| template | SFC (slot-based layout) | `components/templates/` | `DashboardLayout.vue` |
| page | SFC + Pinia store | `pages/` | `HomePage.vue`, `SettingsPage.vue` |

### Rules

- Atoms are self-contained. No imports from other components. Props in, events out.
- Molecules compose 2-5 atom components. Keep logic minimal -- presentation layer only.
- Organisms use composables for complex state. May fetch data via composables or stores.
- Templates use named slots for content areas. Never contain business logic or real data.
- Pages connect templates to Pinia stores and route params.

---

## Script Setup with TypeScript

All generated components use `<script setup lang="ts">`. Define props and emits with full type safety.

### Props

```vue
<script setup lang="ts">
interface Props {
  label: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
})
</script>
```

### Emits

```vue
<script setup lang="ts">
interface Emits {
  (e: 'click', event: MouseEvent): void
  (e: 'update:modelValue', value: string): void
}

const emit = defineEmits<Emits>()
</script>
```

### Slots

```vue
<script setup lang="ts">
defineSlots<{
  default(): any
  icon?(): any
  description?(): any
}>()
</script>
```

### Expose

Only expose what is needed for parent component refs:

```vue
<script setup lang="ts">
const inputRef = ref<HTMLInputElement | null>(null)

function focus() {
  inputRef.value?.focus()
}

defineExpose({ focus })
</script>
```

---

## Tailwind / UnoCSS Styling

### Class Organization

Follow this order within `class` attributes:

```
1. Layout       (flex, grid, block, inline)
2. Positioning  (relative, absolute, top-0)
3. Box model    (w-full, h-12, p-4, m-2)
4. Typography   (text-sm, font-medium, text-gray-700)
5. Visual       (bg-white, border, rounded-lg, shadow)
6. Interactive  (hover:, focus:, active:, transition)
```

### Token-Aware Classes

Map design tokens via Tailwind config extensions:

```vue
<template>
  <button
    class="inline-flex items-center justify-center
           h-10 px-4
           text-sm font-medium text-primary
           bg-bg-primary border border-border-default rounded-default
           hover:bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-accent
           transition-colors duration-150"
  >
    <slot />
  </button>
</template>
```

### Dynamic Classes

Use computed properties for variant-driven styling:

```vue
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
})

const variantClasses = computed(() => {
  const map: Record<string, string> = {
    primary: 'bg-accent text-white hover:bg-accent/90',
    secondary: 'bg-bg-secondary text-text-primary hover:bg-bg-secondary/80',
    ghost: 'bg-transparent text-text-primary hover:bg-bg-secondary',
  }
  return map[props.variant]
})
</script>
```

---

## Composable Patterns for State

### Naming Convention

All composables start with `use` and live in `composables/`.

### Data Fetching Composable

```typescript
// composables/useUsers.ts
import { ref, onMounted } from 'vue'
import type { User } from '@/types'

export function useUsers() {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      const response = await fetch('/api/users')
      users.value = await response.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchUsers)

  return { users, loading, error, refresh: fetchUsers }
}
```

### Toggle Composable

```typescript
// composables/useToggle.ts
import { ref } from 'vue'

export function useToggle(initial = false) {
  const state = ref(initial)
  function toggle() { state.value = !state.value }
  function setTrue() { state.value = true }
  function setFalse() { state.value = false }
  return { state, toggle, setTrue, setFalse }
}
```

### Form Composable

```typescript
// composables/useForm.ts
import { reactive, computed } from 'vue'

export function useForm<T extends Record<string, any>>(initialValues: T) {
  const values = reactive({ ...initialValues }) as T
  const errors = reactive<Partial<Record<keyof T, string>>>({})
  const dirty = computed(() =>
    Object.keys(initialValues).some(
      (key) => values[key as keyof T] !== initialValues[key as keyof T]
    )
  )

  function reset() {
    Object.assign(values, initialValues)
    Object.keys(errors).forEach((key) => delete errors[key as keyof T])
  }

  function setError(field: keyof T, message: string) {
    errors[field] = message
  }

  return { values, errors, dirty, reset, setError }
}
```

---

## Pinia Store Generation

### Store Template

```typescript
// stores/users.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

export const useUsersStore = defineStore('users', () => {
  // State
  const users = ref<User[]>([])
  const loading = ref(false)
  const selectedId = ref<string | null>(null)

  // Getters
  const selectedUser = computed(() =>
    users.value.find((u) => u.id === selectedId.value) ?? null
  )
  const userCount = computed(() => users.value.length)

  // Actions
  async function fetchUsers() {
    loading.value = true
    try {
      const response = await fetch('/api/users')
      users.value = await response.json()
    } finally {
      loading.value = false
    }
  }

  function selectUser(id: string) {
    selectedId.value = id
  }

  return { users, loading, selectedId, selectedUser, userCount, fetchUsers, selectUser }
})
```

### Store Mapping from Spec

| Spec Field | Pinia Concept | Notes |
|-----------|---------------|-------|
| `state` properties | `ref()` in setup | Each state field becomes a ref |
| `computed` properties | `computed()` | Derived values |
| `actions` | Functions | Async operations, mutations |
| `subscriptions` | `$subscribe` | Watch for external changes |

---

## Example: Spec to Vue SFC Output

### Input Spec (JSON)

```json
{
  "name": "StatusBadge",
  "atomicLevel": "atom",
  "description": "Colored badge showing status text",
  "props": [
    { "name": "label", "type": "string", "required": true },
    { "name": "variant", "type": "enum", "values": ["success", "warning", "error", "info"], "default": "info" }
  ],
  "tokens": {
    "borderRadius": "radius.sm",
    "paddingX": "spacing.2",
    "paddingY": "spacing.1",
    "fontSize": "text.xs"
  }
}
```

### Output Vue SFC

```vue
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label: string
  variant?: 'success' | 'warning' | 'error' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
})

const variantClasses = computed(() => {
  const map: Record<string, string> = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  }
  return map[props.variant]
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm',
      variantClasses,
    ]"
  >
    {{ label }}
  </span>
</template>
```

---

## File Generation Conventions

| Artifact | Naming | Location |
|----------|--------|----------|
| Component SFC | `PascalCase.vue` | `components/{level}/` |
| Composable | `useCamelCase.ts` | `composables/` |
| Pinia store | `camelCase.ts` | `stores/` |
| Type definitions | `camelCase.ts` | `types/` |
| Test file | `PascalCase.spec.ts` | `__tests__/` or co-located |

### Codegen Checklist

1. Read spec JSON and validate with Zod schema
2. Determine atomic level and output directory
3. Generate `<script setup lang="ts">` with typed props, emits, and slots
4. Map design tokens to Tailwind utility classes
5. Generate template with semantic HTML and conditional classes
6. Generate composable if spec declares state management needs
7. Generate Pinia store if spec declares shared/global state
8. Generate test file with Vitest and Vue Test Utils
9. Update barrel export (`index.ts`) in the component directory
10. Run `eslint --fix` and `vue-tsc --noEmit` on output
