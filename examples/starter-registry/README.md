# Starter Registry

A minimal Memoire Registry package — fork this to publish your own design system.

## Structure

```
starter-registry/
├── package.json           npm metadata
├── registry.json          Memoire Registry Protocol v1
├── tokens/
│   ├── tokens.json        W3C DTCG token manifest
│   └── tokens.css         Tailwind v4 @theme block
└── components/
    ├── Button.json        ComponentSpec (JSON)
    └── code/
        └── react/
            └── Button.tsx  Real React component
```

## Fork and publish

```bash
# 1. Copy this directory
cp -r examples/starter-registry my-design-system
cd my-design-system

# 2. Update package.json name to @yourscope/your-ds
# 3. Add components by running `memi publish` in a project with specs:
memi publish --name @yourscope/your-ds --figma https://figma.com/design/xxx --push
```

## Install in another project

```bash
# From any project:
memi add Button --from @yourscope/your-ds

# A Button.tsx file is written to src/components/memoire/Button.tsx
# A registry.json-sourced spec is saved to .memoire/specs/components/Button.json
```

## Why a registry?

Every company has 2–3 Figma files that should be *the* design system. Publishing it as a registry makes every token and component addressable by name, versionable, and distributable across your whole org with one command.
