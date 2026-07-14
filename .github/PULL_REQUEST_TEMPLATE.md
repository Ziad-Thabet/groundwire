## What & Why

<!-- What does this PR do, and why? -->

## Changes

<!-- Bullet list of key changes -->

## Testing

<!-- How was this tested? -->

## Checklist

- [ ] Follows Conventional Commits format
- [ ] CI passing
- [ ] No hardcoded values that belong in `config/constants.ts` or `content/strings.ts`
- [ ] No duplicated logic that should be extracted
- [ ] `docs/ARCHITECTURE.md` updated if this changes schema, prompt behavior, or a documented edge case
- [ ] Tenant-isolation check: if this touches a tenant-scoped table, is RLS covering it?
