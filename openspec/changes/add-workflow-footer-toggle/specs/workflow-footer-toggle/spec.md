## ADDED Requirements

### Requirement: Footer toggle row in expanded state

When a Workflow is expanded, the UI MUST render a footer row at the bottom of the expanded section that can be clicked to collapse the Workflow.

#### Scenario: Collapse from the bottom after scrolling
- **GIVEN** a Workflow is expanded and contains a long list of items
- **WHEN** the user scrolls to the bottom of the expanded items
- **THEN** a footer row MUST be visible
- **AND** clicking the footer row MUST collapse the Workflow

### Requirement: Collapsed state remains unchanged

When a Workflow is collapsed, the UI MUST render only the top header row (no footer row).

#### Scenario: Collapsed view shows a single row
- **GIVEN** a Workflow is collapsed
- **THEN** only the top header row is rendered
- **AND** no footer row is shown

