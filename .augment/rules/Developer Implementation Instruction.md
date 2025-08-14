---
type: "agent_requested"
description: "Example description"
---
# Developer Implementation Instruction

This plan outlines exactly how a developer should approach, execute, and validate an update, with safeguards for **codebase-wide changes**, **safe deletions**, and **unexpected problems**.

---

## **1. Pre-Implementation Impact Analysis**

**Goal:** Understand the full scope before coding.

- **Identify Affected Code**
    - Search the codebase for all files, functions, and components related to the update.
    - Map dependencies: imports, shared utilities, data models, API endpoints, and event emitters.
    - Note any downstream consumers (internal modules, APIs, external services).
- **Assess Potential Deletions**
    - Locate legacy files/code that may be removed as part of the update.
    - Confirm usage via telemetry, logs, or dependency analysis before deletion.
- **Risk & Regression Assessment**
    - Document potential break points and unintended side effects.
    - Highlight any shared code paths where changes could cause regressions.

---

## **2. Implementation Plan Design**

**Goal:** Create a clear, regression-safe plan for applying the update.

- **Define the Changes**
    - Functional scope: what will be added, modified, or removed.
    - Non-functional scope: performance, security, a11y, and maintainability considerations.
- **Plan for Code Changes & Deletions**
    - Use **expand → migrate → contract** for breaking changes (add new first, remove old last).
    - Flag risky or user-facing changes with a **feature toggle** for controlled rollout.
- **Mitigation for Unknown Issues**
    - Prepare a **rollback path** (disable flag, revert commit, or restore backup).
    - Define thresholds for halting rollout (error rate, latency spikes, broken functionality).

---

## **3. Controlled Implementation**

**Goal:** Apply changes safely and iteratively.

- **Development Steps**
    1. Create a dedicated branch (`feat/<update-name>` or `fix/<update-name>`).
    2. Scaffold new code paths without breaking existing ones.
    3. Update or remove code **incrementally**, validating at each step.
    4. Guard new logic behind feature flags until verified.
    5. Write migration scripts for data changes (with rollback support).
- **Code Hygiene**
    - Follow naming conventions and style guides.
    - Keep commits small, self-contained, and descriptive.
    - Remove unused code only after confirming zero references and usage.

---

## **4. Testing & Verification**

**Goal:** Ensure the update works as intended and nothing else breaks.

- **Test Coverage**
    - Add/update **unit tests** for modified functions and components.
    - Add/update **integration tests** for new workflows.
    - Run **end-to-end (E2E)** tests for key user flows.
    - Perform **manual QA** in a staging/preview environment.
- **Edge Case Handling**
    - Validate error handling, null data, extreme inputs, and unexpected user behavior.
    - Monitor performance and memory usage for regressions.

---

## **5. Rollout & Monitoring**

**Goal:** Deploy with minimal risk and maximum visibility.

- **Deployment Strategy**
    - Deploy behind a feature flag.
    - Start with a canary release (small percentage of users or internal testers).
    - Gradually increase exposure while monitoring metrics.
- **Monitoring & Alerts**
    - Watch logs, metrics, and user error reports in real-time.
    - Track KPIs impacted by the update (performance, engagement, conversions).

---

## **6. Post-Deployment Actions**

**Goal:** Finalize, document, and close the loop.

- **Code Cleanup**
    - Remove deprecated code and temporary toggles once the update is stable.
    - Delete unused files safely after confirming no dependencies.
- **Documentation**
    - Update internal documentation, READMEs, or architecture diagrams.
    - Log the update in release notes or change logs.
- **Developer Summary**
    - Provide a written summary covering:
        - Files changed/removed
        - New functionality
        - Any known limitations
        - How issues were mitigated

---

✅ **Outcome:** Following this plan ensures updates are implemented cleanly, deletions are safe, regressions are avoided, and unexpected problems are managed without production fallout.

---