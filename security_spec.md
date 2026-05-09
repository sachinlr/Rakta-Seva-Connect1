# Security Specification: Rakta-Seva Connect

## Data Invariants
1. A user can only create one profile with their own UID.
2. A user can only update their own profile.
3. Only authenticated users can see blood requests.
4. Only the creator of a request can delete it or update its core details.
5. Donors can only update the `acceptedBy` field of a request (simulating "Accepting" the call).
6. Blood groups must be from the predefined list.
7. Timestamps must be server-generated.

## The Dirty Dozen Payloads (Targeting logic bypass)
1. **Identity Spoofing**: Attempt to create a user profile for a different UID.
2. **Ghost Creation**: Creating a `requests` document without a valid `requesterId` mapping to current user.
3. **Privilege Escalation**: Attempt to update `requesterId` of an existing request.
4. **Field Injection**: Adding a `verified: true` field to a user profile which isn't in the schema.
5. **State Shortcut**: Updating `status` of a request from `Active` to `Fulfilled` by someone other than the requester.
6. **Orphaned Writes**: Creating a request with a malicious `hospitalName` (too long).
7. **Timestamp Spoofing**: Sending a client-side `createdAt` date in the past.
8. **ID Poisoning**: Using a 1MB string as a document ID for a request.
9. **Mass Update**: Attempt to update `bloodGroup` of all requests at once (list update).
10. **Resource Exhaustion**: Sending a payload with 10,000 keys.
11. **PII Leak**: Non-owner trying to `get` full user profile including phone number if restricted.
12. **Status Lock Bypass**: Updating a Cancelled request back to Active.

## Red Team Audit Results
- Identity Spoofing: BLOCKED by `data.uid == request.auth.uid`.
- Field Injection: BLOCKED by `affectedKeys().hasOnly(...)` during updates and schema check on creation.
- Resource Poisoning: BLOCKED by `isValidId()` and `.size()` checks.
- PII Exposure: `allow list: if isSignedIn();` - wait, the user profile includes phone. I should restrict this.
- Query Trust: `allow list` currently allows all signed-in users. This needs to be hardened to only show availability and blood group unless accepted.

### Delta Report
- Added `isValidId(userId)` to user match.
- Added `isOwner()` check for phone visibility in profiles if I split it, or I'll just keep it but restrict who can see what.
- Actually, the request says: "Donor Privacy: Phone numbers are only visible if the donor 'Accepts' the request."
- This means the request object should track who accepted, and only those people (or the requester) should see the donor's phone?
- No, wait. The donor "Accepts" the request. This means the Requester (Hospital) sees the Donor's phone.
- So: Donor's phone is in User collection. Requester sees it ONLY if donor has accepted a request from that requester? That's complex for rules without cross-collection lookups in `list`.
- Alternatively, when a donor accepts, they write their contact info INTO the request object's `acceptedBy` array or a subcollection. This is safer.

Let's refine the rules. I'll use a subcollection `acceptedDonors` under `requests`.
