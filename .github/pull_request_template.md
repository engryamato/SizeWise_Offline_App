# Pull Request Checklist

## Testing Requirements
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated  
- [ ] E2E tests added/updated (if user-visible changes)
- [ ] Coverage meets thresholds (core ≥85%, UI ≥60%)
- [ ] Local run of `npm run test:coverage` is green
- [ ] Local run of `npm run e2e` is green (if applicable)

## Code Quality
- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] No schema drift; migrations included if database changes
- [ ] Code follows established patterns and conventions

## Documentation
- [ ] README updated if public API changes
- [ ] CHANGELOG updated if user-facing changes
- [ ] Comments added for complex logic
- [ ] JSDoc added for public functions/components

## Review Checklist
- [ ] PR title clearly describes the change
- [ ] Description explains the what and why
- [ ] Breaking changes are clearly marked
- [ ] Screenshots included for UI changes
- [ ] Performance impact considered and documented

## Definition of Done
- [ ] Code implemented and tested
- [ ] All CI checks passing (unit, integration, E2E, lint, typecheck)
- [ ] Code reviewed and approved
- [ ] Documentation updated as needed

---

## Description
<!-- Describe your changes in detail -->

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test improvements

## Testing Strategy
<!-- Describe how you tested your changes -->

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

## Additional Notes
<!-- Any additional information that reviewers should know -->
