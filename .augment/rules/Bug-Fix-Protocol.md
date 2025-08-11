---
type: "agent_requested"
description: "Example description"
---
# Bug Fix Protocol: Safe Error Resolution with Minimal Risk

## **0) Scope & Guardrails**

**Objective:** Resolve errors systematically while maintaining production stability and backward compatibility.

**Core Policies:**

- **No blind rewrites** - understand the full impact before making changes
- **Prefer adapters and feature flags** over direct modifications to preserve existing functionality
- **Preserve public APIs** unless migration documentation is included in the PR
- **Branch naming:** `fix/<issue-key>-<descriptive-name>` created from latest `main`

---

## **1) Comprehensive Error Discovery & Analysis**

**Deliverable:** Detailed Error Cards (one per unique error type)

### Step 1: Reproduce & Document

- Run the application and tests locally with verbose logging enabled
- Capture complete stack traces and error messages
- Document environment snapshot:
    - Node.js version (`node --version`)
    - Package manager version (`pnpm --version` or `npm --version`)
    - Python version (if applicable: `python --version`)
    - Environment variables and configuration flags

### Step 2: Find All Occurrences (Multi-file Search)

- **Code search across entire codebase:**
    
    ```bash
rg -n --hidden --glob '!node_modules' "<error_snippet|symbol|function_name>"
```
    
- **JavaScript/TypeScript dependency analysis:**
    
    ```bash
pnpm why <package_name>
    tsc --traceResolution  # for TypeScript resolution issues
```
    
- **Python import analysis:**
    
    ```bash
rg -n "from .* import <symbol>|import <module>"
    # Run pyright/mypy for type checking outputs
```
    
- **Build tool diagnostics:**
    - Webpack/Vite build logs
    - `eslint --max-warnings=0`
    - `tsc -p .` (TypeScript compilation)
    - `pytest -q` (Python tests)

### Step 3: Classify Each Error

- **Type:** runtime | build | type | test | lint | infrastructure
- **Blast radius:** Identify entry points, shared libraries, and usage frequency
- **Severity:** blocker | high | medium | low

### Error Card Template:

```
Title: [Concise error description]
Stack Trace: [Key excerpt from stack trace]
All Locations: [List of files and line numbers where error occurs]
Owner Modules: [Which modules/components are affected]
Severity: [blocker/high/medium/low]
Root Cause: [Suspected underlying cause]
Fix Strategy: [Proposed approach - adapter/guard/refactor/etc.]
```

---

## **2) Dependency Mapping & Duplication Analysis**

- Create a dependency map showing `module → dependents` relationships
- Identify **duplicate utilities** or **forked logic** performing similar functions
- For duplicates: designate one as **canonical** and others as **to be bridged** via adapters
- Plan deprecation timeline rather than immediate deletion

---

## **3) Fix Strategy Selection (Risk-Minimized Approach)**

**Priority Order:**

1. **Minimal viable fix** at the source with comprehensive tests
2. **Adapter/Shim layer** to maintain compatibility with existing callers
3. **Feature flags** for high-risk code paths
4. **Deprecation pathway** with clear timeline and migration guide

**Recommended Patterns:**

- **Adapter Layer:** Preserve original function signature, translate calls to new implementation
- **Type/Runtime Guards:** Validate inputs and outputs at boundaries
- **Configuration-driven:** Extract hardcoded values to configuration files
- **Pure refactoring:** Only after all tests pass and metrics are stable

**Prohibited Actions:**

- Changing public types or exports without migration documentation
- Deleting functionality without deprecation warnings
- Making breaking changes without search-and-replace guidance

---

## **4) Pre-Implementation Safety Measures**

- **Lock toolchain versions:**
    
    ```bash
corepack enable && pnpm --version  # or your package manager
```
    
- **Clean installation:**
    
    ```bash
pnpm install --frozen-lockfile
```
    
- **Create safety backup:**
    
    ```bash
mkdir -p ./.safety/$(date +%Y%m%d)
    cp -r [config-files] ./.safety/$(date +%Y%m%d)/
```
    
- **Enable observability:** Add logging/analytics with unique event identifiers for modified code paths

---

## **5) Implementation Workflow**

### Step 1: Test-Driven Fix

- Write or update **failing unit/integration tests** that reproduce the exact error
- Ensure tests fail before implementing fix

### Step 2: Incremental Implementation

- Implement fix in small, logical commits
- Create adapters for backward compatibility
- Consolidate duplicate code → redirect old callers to adapters → mark originals as `@deprecated`

### Step 3: Static Analysis

- Run linting: `eslint .`
- Format check: `prettier --check .`
- Type checking: `tsc -p .` or `pyright`

### Step 4: Test Validation

- Unit tests: `pnpm test:unit` or equivalent
- Integration tests: `pnpm test:integration`
- Python tests: `pytest` (if applicable)
- End-to-end smoke tests

### Step 5: Build & Runtime Verification

- Production build: `pnpm build && pnpm start`
- Verify application starts and core functionality works

### Step 6: Documentation

- Update `CHANGELOG.md` with changes
- Add migration notes to `MIGRATION.md` if public APIs changed
- Document any new configuration options

---

## **6) Pre-Merge Validation Checklist**

- ✅ **All Error Cards resolved** or severity downgraded with documented justification
- ✅ **All test suites passing:** unit, integration, end-to-end
- ✅ **Static analysis clean:** type-check, linting, formatting
- ✅ **Build successful:** production build completes without errors
- ✅ **Performance validated:** No regression on critical paths (benchmark if needed)
- ✅ **Observability implemented:** Logging/metrics present for changed code paths

---

## **7) Rollback Strategy**

- **Atomic commits:** Small, focused commits with descriptive messages for easy reversion
- **Feature flags:** Default to `off` state, can be toggled via environment variables
- **Adapter removal plan:** Create follow-up ticket with timeline for removing adapters once adoption is complete

---

## **8) Communication & Documentation**

**Pull Request Must Include:**

- Error Cards with resolution status
- Fix strategy explanation and risk assessment
- Test coverage differential (before/after)
- Migration notes for any API changes
- Screenshots for UI-related fixes
- **Labels:** `bug`, `non-destructive`, `adapter`, `feature-flagged`

---

## **Operational Checklists**

### **Triage Phase Checklist**

- [ ]  Error reproduced and documented with full context
- [ ]  All occurrences identified across codebase
- [ ]  Error Cards created with severity and ownership
- [ ]  Code duplication analysis completed

### **Implementation Phase Checklist**

- [ ]  Adapter vs. rewrite decision documented with rationale
- [ ]  Feature flags implemented for medium+ risk changes
- [ ]  Input/output validation guards added
- [ ]  Tests transition from failing to passing
- [ ]  All static analysis tools pass

### **Pre-Merge Checklist**

- [ ]  Complete validation matrix verified
- [ ]  `CHANGELOG.md` and `MIGRATION.md` updated
- [ ]  Observability/telemetry implemented
- [ ]  Rollback plan documented and tested

---

## **Non-Negotiable Principles**

### **Required Actions:**

- Create compatibility bridges before deprecating old functionality
- Implement the smallest change that resolves the issue
- Validate fixes with automated tests and runtime telemetry
- Document all public API changes with migration guidance

### **Prohibited Actions:**

- Removing legacy entry points without deprecation period
- Modifying public interfaces without explicit documentation
- Merging changes without verified rollback capability
- Making assumptions about error scope without comprehensive search Error Resolution with Minimal Risk

## **0) Scope & Guardrails**

**Objective:** Resolve errors systematically while maintaining production stability and backward compatibility.

**Core Policies:**

- **No blind rewrites** - understand the full impact before making changes
- **Prefer adapters and feature flags** over direct modifications to preserve existing functionality
- **Preserve public APIs** unless migration documentation is included in the PR
- **Branch naming:** `fix/<issue-key>-<descriptive-name>` created from latest `main`

---

## **1) Comprehensive Error Discovery & Analysis**

**Deliverable:** Detailed Error Cards (one per unique error type)

### Step 1: Reproduce & Document

- Run the application and tests locally with verbose logging enabled
- Capture complete stack traces and error messages
- Document environment snapshot:
    - Node.js version (`node --version`)
    - Package manager version (`pnpm --version` or `npm --version`)
    - Python version (if applicable: `python --version`)
    - Environment variables and configuration flags

### Step 2: Find All Occurrences (Multi-file Search)

- **Code search across entire codebase:**
    
    ```bash
    rg -n --hidden --glob '!node_modules' "<error_snippet|symbol|function_name>"
    
    ```
    
- **JavaScript/TypeScript dependency analysis:**
    
    ```bash
    pnpm why <package_name>
    tsc --traceResolution  # for TypeScript resolution issues
    
    ```
    
- **Python import analysis:**
    
    ```bash
    rg -n "from .* import <symbol>|import <module>"
    # Run pyright/mypy for type checking outputs
    
    ```
    
- **Build tool diagnostics:**
    - Webpack/Vite build logs
    - `eslint --max-warnings=0`
    - `tsc -p .` (TypeScript compilation)
    - `pytest -q` (Python tests)

### Step 3: Classify Each Error

- **Type:** runtime | build | type | test | lint | infrastructure
- **Blast radius:** Identify entry points, shared libraries, and usage frequency
- **Severity:** blocker | high | medium | low

### Error Card Template:

```
Title: [Concise error description]
Stack Trace: [Key excerpt from stack trace]
All Locations: [List of files and line numbers where error occurs]
Owner Modules: [Which modules/components are affected]
Severity: [blocker/high/medium/low]
Root Cause: [Suspected underlying cause]
Fix Strategy: [Proposed approach - adapter/guard/refactor/etc.]

```

---

## **2) Dependency Mapping & Duplication Analysis**

- Create a dependency map showing `module → dependents` relationships
- Identify **duplicate utilities** or **forked logic** performing similar functions
- For duplicates: designate one as **canonical** and others as **to be bridged** via adapters
- Plan deprecation timeline rather than immediate deletion

---

## **3) Fix Strategy Selection (Risk-Minimized Approach)**

**Priority Order:**

1. **Minimal viable fix** at the source with comprehensive tests
2. **Adapter/Shim layer** to maintain compatibility with existing callers
3. **Feature flags** for high-risk code paths
4. **Deprecation pathway** with clear timeline and migration guide

**Recommended Patterns:**

- **Adapter Layer:** Preserve original function signature, translate calls to new implementation
- **Type/Runtime Guards:** Validate inputs and outputs at boundaries
- **Configuration-driven:** Extract hardcoded values to configuration files
- **Pure refactoring:** Only after all tests pass and metrics are stable

**Prohibited Actions:**

- Changing public types or exports without migration documentation
- Deleting functionality without deprecation warnings
- Making breaking changes without search-and-replace guidance

---

## **4) Pre-Implementation Safety Measures**

- **Lock toolchain versions:**
    
    ```bash
    corepack enable && pnpm --version  # or your package manager
    
    ```
    
- **Clean installation:**
    
    ```bash
    pnpm install --frozen-lockfile
    
    ```
    
- **Create safety backup:**
    
    ```bash
    mkdir -p ./.safety/$(date +%Y%m%d)
    cp -r [config-files] ./.safety/$(date +%Y%m%d)/
    
    ```
    
- **Enable observability:** Add logging/analytics with unique event identifiers for modified code paths

---

## **5) Implementation Workflow**

### Step 1: Test-Driven Fix

- Write or update **failing unit/integration tests** that reproduce the exact error
- Ensure tests fail before implementing fix

### Step 2: Incremental Implementation

- Implement fix in small, logical commits
- Create adapters for backward compatibility
- Consolidate duplicate code → redirect old callers to adapters → mark originals as `@deprecated`

### Step 3: Static Analysis

- Run linting: `eslint .`
- Format check: `prettier --check .`
- Type checking: `tsc -p .` or `pyright`

### Step 4: Test Validation

- Unit tests: `pnpm test:unit` or equivalent
- Integration tests: `pnpm test:integration`
- Python tests: `pytest` (if applicable)
- End-to-end smoke tests

### Step 5: Build & Runtime Verification

- Production build: `pnpm build && pnpm start`
- Verify application starts and core functionality works

### Step 6: Documentation

- Update `CHANGELOG.md` with changes
- Add migration notes to `MIGRATION.md` if public APIs changed
- Document any new configuration options

---

## **6) Pre-Merge Validation Checklist**

- ✅ **All Error Cards resolved** or severity downgraded with documented justification
- ✅ **All test suites passing:** unit, integration, end-to-end
- ✅ **Static analysis clean:** type-check, linting, formatting
- ✅ **Build successful:** production build completes without errors
- ✅ **Performance validated:** No regression on critical paths (benchmark if needed)
- ✅ **Observability implemented:** Logging/metrics present for changed code paths

---

## **7) Rollback Strategy**

- **Atomic commits:** Small, focused commits with descriptive messages for easy reversion
- **Feature flags:** Default to `off` state, can be toggled via environment variables
- **Adapter removal plan:** Create follow-up ticket with timeline for removing adapters once adoption is complete

---

## **8) Communication & Documentation**

**Pull Request Must Include:**

- Error Cards with resolution status
- Fix strategy explanation and risk assessment
- Test coverage differential (before/after)
- Migration notes for any API changes
- Screenshots for UI-related fixes
- **Labels:** `bug`, `non-destructive`, `adapter`, `feature-flagged`

---

## **Operational Checklists**

### **Triage Phase Checklist**

- [ ]  Error reproduced and documented with full context
- [ ]  All occurrences identified across codebase
- [ ]  Error Cards created with severity and ownership
- [ ]  Code duplication analysis completed

### **Implementation Phase Checklist**

- [ ]  Adapter vs. rewrite decision documented with rationale
- [ ]  Feature flags implemented for medium+ risk changes
- [ ]  Input/output validation guards added
- [ ]  Tests transition from failing to passing
- [ ]  All static analysis tools pass

### **Pre-Merge Checklist**

- [ ]  Complete validation matrix verified
- [ ]  `CHANGELOG.md` and `MIGRATION.md` updated
- [ ]  Observability/telemetry implemented
- [ ]  Rollback plan documented and tested

---

## **Non-Negotiable Principles**

### **Required Actions:**

- Create compatibility bridges before deprecating old functionality
- Implement the smallest change that resolves the issue
- Validate fixes with automated tests and runtime telemetry
- Document all public API changes with migration guidance

### **Prohibited Actions:**

- Removing legacy entry points without deprecation period
- Modifying public interfaces without explicit documentation
- Merging changes without verified rollback capability
- Making assumptions about error scope without comprehensive search