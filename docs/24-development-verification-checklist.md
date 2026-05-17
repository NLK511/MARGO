# Development Verification Checklist

Use this before marking any development complete.

## Required gates

1. **Clean restart**
   - stop local apps
   - clear `apps/*/.next`
   - restart the stack

2. **Core checks**
   - app tests pass
   - app builds pass
   - typecheck/lint pass if affected

3. **Route smoke checks**
   - public homepage routes
   - admin builder/theme routes
   - any route touched by the change

4. **Hydration/runnable check**
   - open changed pages in a browser after restart
   - confirm no React hydration/runtime errors in console

5. **Tenant/theme safety**
   - confirm tenant-specific preview/public theme resolution uses the saved theme data
   - confirm demo fallback still works in local dev when intended

## Default smoke targets

- `http://localhost:3000/t/chef`
- `http://localhost:3000/t/maison-noire`
- `http://localhost:3001/tenant/builder/style`
- `http://localhost:3001/global-admin/theme-studio`

## Completion rule

A change is only done when the code passes the required gates on a clean restart and the changed routes render without runtime errors.
