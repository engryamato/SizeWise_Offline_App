# Contributing to SizeWise

## Working Agreement

* Every implementation ships with tests in the **same PR**.
* Test scope by layer:
  * UI/components → unit tests
  * DAO/vault/worker boundaries → integration tests  
  * User-visible flows → Playwright E2E (offline where relevant)
* Minimums: **core (domain/graph/solver/DAO) ≥ 85%** line coverage; UI ≥ 60%.
* A PR **cannot merge** unless: lint, typecheck, unit/integration, and E2E all pass.

## Definition of Done (DoD)

1. Code implemented
2. Tests added + passing locally
3. CI green (unit+integration+E2E)
4. Docs updated (README/CHANGELOG) if contracts changed

## Development Setup

### Prerequisites
- Node.js 20+
- npm

### Installation
```bash
git clone https://github.com/engryamato/SizeWise_Offline_App.git
cd SizeWise_Offline_App
npm install
```

### Development Commands
```bash
# Start development server
npm run dev

# Run tests
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # With coverage report

# Run E2E tests
npm run e2e:install       # Install Playwright browsers (first time)
npm run e2e               # Run E2E tests

# Code quality
npm run typecheck         # TypeScript type checking
npm run lint              # ESLint

# Build
npm run build             # Production build
npm run start             # Start production server
```

## Testing Strategy

### Test Pyramid
- **Unit (70%)**: Fast, deterministic, per module
- **Integration (20%)**: DAO + vault + worker boundaries  
- **E2E (10%)**: PWA + offline + happy path flows
- **Perf/Bench (targeted)**: Solver + rendering budgets

### Test Organization
- **Unit**: `*.test.ts(x)` colocated with source code
- **Integration**: `*.itest.ts` for cross-boundary testing
- **E2E**: `e2e/*.spec.ts` for end-to-end user flows

### Coverage Requirements
- **Core modules** (db/, lib/, workers/): ≥85% line coverage
- **UI components** (components/, app/): ≥60% line coverage
- **Critical paths**: 100% coverage for security and data integrity

## Code Standards

### TypeScript
- Strict mode enabled
- Explicit return types for public functions
- Use `unknown` instead of `any` where possible
- Prefer interfaces over types for object shapes

### React/Next.js
- Use `'use client'` directive for client components
- Prefer function components over class components
- Use custom hooks for shared logic
- Follow Next.js App Router conventions

### Database
- All schema changes require migrations
- Use transactions for multi-table operations
- Validate inputs at DAO boundaries
- Test migrations for idempotency

### Security
- Never store sensitive data in localStorage
- Use device-key encryption for project data
- Validate all user inputs
- Implement proper error boundaries

## Git Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes  
- `docs/description` - Documentation updates
- `test/description` - Test improvements

### Commit Messages
Follow conventional commits:
```
type(scope): description

feat(dao): add free tier enforcement
fix(vault): handle encryption errors gracefully
docs(readme): update installation instructions
test(licensing): add clock tamper detection tests
```

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Ensure all CI checks pass locally
4. Create PR with filled template
5. Address review feedback
6. Squash and merge after approval

## Phase-by-Phase Testing Requirements

### Phase 0 (Current)
- Unit tests for licensing, schema validators
- Integration tests for migrations + DAO free-tier enforcement  
- E2E tests for offline PWA functionality

### Phase 2 (Viewport)
- Unit tests for snap/draw tools
- E2E tests for draw→save→reload workflows

### Phase 3 (Solver)
- Unit tests for Darcy–Weisbach/Swamee–Jain/Hardy-Cross
- Integration tests for results persistence
- Performance benchmarks for solver latency

### Phase 4+ (Future)
- Integration tests for export/import workflows
- Performance tests for rendering at scale
- Accessibility tests for UI components

## Troubleshooting

### Common Issues

**Tests timing out**
- Check for unresolved promises
- Verify mocks are properly configured
- Increase timeout for integration tests

**Build failures**
- Run `npm run typecheck` locally
- Check for missing dependencies
- Verify environment variables

**E2E test failures**
- Ensure dev server is running
- Check for timing issues with `waitFor`
- Verify selectors match current UI

### Getting Help
- Check existing issues on GitHub
- Review test examples in the codebase
- Ask questions in PR comments
- Consult the team lead for architecture decisions

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md` with changes
3. Create release PR
4. Tag release after merge
5. Deploy to production

## License

This project is licensed under the MIT License - see the LICENSE file for details.
