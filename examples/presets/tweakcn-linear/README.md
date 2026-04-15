# @memoire-examples/tweakcn-linear

Linear-inspired Memoire Registry — crisp, geometric, editorial. Indigo-violet on warm-white.

```
--color-primary:    oklch(60% 0.18 280)   /* indigo-violet */
--color-background: oklch(99% 0.005 280)  /* warm near-white */
```

## Fork and ship your own

```bash
cp -r examples/presets/tweakcn-linear my-ds && cd my-ds
# rename in package.json + registry.json
memi publish --name @yourscope/your-ds
npm publish --access public
```

## Use it

```bash
memi add Button --from @memoire-examples/tweakcn-linear
```

Inspired-by reimplementation; not derived from proprietary Linear assets.
