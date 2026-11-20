# Frontend CRUD demonstration

Sign in as an administrator to manage players and their histories. Scouts can manage their own reports and shortlists.

## Player CRUD

1. Open **Players**, expand **Add player**, enter a name, birth date, nationality, position and preferred foot, then save. Height is optional (140–220 cm when supplied).
2. The application opens the saved player's profile. This is the read operation; the profile is also searchable from Players.
3. Expand **Edit or delete player**, change a profile field, and save. Reload to verify persistence.
4. Use **Delete player**, review the warning and confirm. This permanently deletes the profile and its dependent relational records. Use a newly created demonstration player for this step.

## Player history forms

Administrators have expandable forms on every player profile:

- **Record injury:** injury details, severity, dates and recovery status. Return dates cannot precede the injury date.
- **Add contract:** select a club and enter contract dates and optional salary/release clause in EUR. Creating an active contract expires the previous active contract within a transaction. This does not change club membership.
- **Record transfer:** select the source/destination clubs, date, type and optional fee in EUR. The existing `sp_record_transfer` procedure records the transfer and changes current club membership atomically.
- **Add or update valuation:** enter a date, EUR market value and optional source. Reusing a date updates its valuation.

## Reports

Open **Reports** to create and read reports. Each report now has **Edit report** and **Delete report** controls. Editing supports rating, recommendation, strengths, weaknesses, tactical fit and notes. Server-side checks restrict scouts to their own reports; administrators can manage any report by ID.

Changing a recommendation to SHORTLIST or PRIORITY adds/updates the owning scout's shortlist in the same transaction. Changing to another recommendation or deleting the report preserves an existing shortlist entry; remove that entry separately if desired.

## Shortlists

Use **Add to shortlist** on a player profile, or **Add player to shortlist** on the Shortlist page. Search by name, select a player, choose priority/status and save. Existing status update and remove controls complete the shortlist CRUD workflow. Duplicate entries are rejected with a visible message.

## Similarity index

New players have no performance statistics and will not immediately have a similarity vector. After editing a player's name or position, use **Refresh similarity index** to update derived Qdrant metadata. Player deletion attempts to remove the vector too; an unavailable Qdrant service results in an explicit cleanup warning.

## Verification

With the local app on port 3000 and MySQL/Qdrant available:

```powershell
npm run test:crud
```

Override `TEST_BASE_URL` to test another local port. The harness creates disposable fixtures and removes them in a `finally` block. It checks authorization, player CRUD, history writes, date validation, report ownership/edit/delete, direct shortlist creation, rendered page controls and cascading deletion. It does not replace a manual browser interaction check.
