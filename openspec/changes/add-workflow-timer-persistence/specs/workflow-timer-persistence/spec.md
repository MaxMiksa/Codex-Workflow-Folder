## ADDED Requirements

### Requirement: Persist per-turn workflow duration locally

For each conversation turn, the system MUST persist the final (completed) Workflow duration locally so it can be shown after VS Code restarts.

#### Scenario: Reopen a completed conversation after restart
- **GIVEN** a conversation contains completed turns with a Workflow row
- **AND** the user previously saw a non-zero duration for a completed turn
- **WHEN** VS Code is restarted and the conversation is reopened
- **THEN** the Workflow header SHOULD show the last recorded duration for completed turns (instead of resetting to 0)

### Requirement: Do not overwrite historical durations by re-rendering

The system MUST avoid overwriting persisted durations for completed turns when loading/re-rendering old conversations.

#### Scenario: Viewing an old completed turn
- **GIVEN** a persisted duration exists for a completed turn
- **WHEN** the conversation is re-rendered (e.g., scrolling, expand/collapse)
- **THEN** the persisted duration MUST remain unchanged

### Requirement: Best-effort persistence, no pre-install backfill

The system MAY omit durations for turns that completed before this feature was installed, and MUST NOT attempt to infer historical durations from logs.

#### Scenario: Conversation history from before install
- **GIVEN** turns completed before installing the feature
- **WHEN** the conversation is opened after installing
- **THEN** the timer MAY be absent or show a fresh duration, without attempting reconstruction

