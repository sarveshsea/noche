# @memoire-examples/tweakcn-supabase

Supabase-inspired Memoire Registry — subtle, technical, mono-heavy. Green on near-black.

```
--color-primary:   oklch(72% 0.17 145)   /* green */
--color-surface:   oklch(12% 0.02 160)   /* near-black */
```

## Fork and ship your own

```bash
cp -r examples/presets/tweakcn-supabase my-ds && cd my-ds
# rename in package.json + registry.json
memi publish --name @yourscope/your-ds
npm publish --access public
```

## Use it

```bash
memi add Button --from @memoire-examples/tweakcn-supabase
```

Inspired-by reimplementation; not derived from proprietary Supabase assets.
