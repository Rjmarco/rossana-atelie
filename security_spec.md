# Security Specification - Rossana Freitas Lab

## Data Invariants
1. **Multitenancy**: Every document (except laboratories) must have a `labId` that matches the authenticated user's `labId`.
2. **Identity Integrity**: `/users/{userId}` can only be created/updated if `userId` matches the authenticated user's UID (except for invites).
3. **Atomic invitedBy**: Placeholder users (invites) can be created by existing lab members.
4. **Consistency**: Orders must reference valid `dentistId` and `clinicId` if provided.

## "Dirty Dozen" Payloads (Denial Tests)
1. **Unauthorized Read**: User A tries to read Order X belonging to Lab B.
2. **Identity Spoofing**: User A tries to create a profile for User B.
3. **Lab Hijacking**: User A tries to update a Laboratory document they don't own.
4. **Field Injection**: Creating an Order with a hidden `adminOverride: true` field.
5. **Ghost Invite**: Creating an invite for Lab B while being a member of Lab A.
6. **Negative Value**: Transaction with `value: -100`.
7. **Invalid Status**: Order status `completed_but_stolen`.
8. **Impersonation**: Updating `displayName` of another team member.
9. **Role Escalation**: Setting own role to `owner` when joined as `assistant`.
10. **Orphaned Order**: Creating an order without a `labId`.
11. **Excessive String**: Sending 1MB of text in `patientName`.
12. **Past Appointment**: Setting `dueDate` to a date 10 years in the past (handled by app, but rules check for valid timestamp).

## Test Runner (Mock)
`firestore.rules.test.ts` would verify these scenarios by asserting `PERMISSION_DENIED`.
