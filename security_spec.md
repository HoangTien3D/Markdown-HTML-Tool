# Security Specification (Payload-First Security TDD)

## 1. Data Invariants
1. **Identity Isolation**: Every workspace, image asset, and image chunk under `/users/{userId}/...` belongs strictly to `request.auth.uid == userId` with `request.auth.token.email_verified == true`.
2. **Master Gate on Chunks**: Every chunk document in `/users/{userId}/assets/{assetId}/chunks/{chunkId}` must verify that its parent `/users/{userId}/assets/{assetId}` exists and is owned by `request.auth.uid`, and `incoming().assetId == assetId`.
3. **Immutable Ownership & Creation Time**: `userId`, `assetId`, and `createdAt` can never be changed after creation.
4. **Temporal Integrity**: `createdAt == request.time` on creation; `updatedAt == request.time` on creation and update.
5. **Bounded Payloads**: All strings and chunk counts enforce strict upper bounds so oversized or malformed payloads cannot exhaust document limits (`rawMarkdown <= 800000`, `customCss <= 200000`, `inlineDataUrl <= 450000`, `chunkCount <= 40`).
6. **Zero Blanket Reads**: Unauthenticated users and other signed-in users cannot `get` or `list` another user's workspaces, assets, or chunks.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Workspace Read/Write**: Reading or creating `/users/userA/workspaces/default` with `request.auth == null`.
2. **Cross-Tenant Workspace Write**: `userB` attempting to create or update `/users/userA/workspaces/default` with `userId: "userB"`.
3. **Identity Spoofing in Payload**: `userA` attempting to create `/users/userA/workspaces/default` with `userId: "userB"`.
4. **Unverified Email Write**: `userA` with `email_verified: false` attempting to write to `/users/userA/workspaces/default`.
5. **Shadow / Ghost Field Injection**: `userA` creating `/users/userA/workspaces/default` with extra field `isAdmin: true`.
6. **Client-Forged Timestamp**: `userA` creating `/users/userA/assets/asset_1` with `createdAt` != `request.time`.
7. **ID Poisoning**: `userA` creating `/users/userA/assets/bad.id.with.dots` or a >128 char document ID.
8. **Immortal Field Mutation**: `userA` updating `/users/userA/assets/asset_1` while changing `createdAt` or `userId` or `assetId`.
9. **Value / Type Poisoning**: `userA` updating `/users/userA/assets/asset_1` with `width: "not-a-number"` or `inlineDataUrl` exceeding 450,000 chars.
10. **Orphaned Chunk Write**: `userA` creating `/users/userA/assets/nonexistent_asset/chunks/current_0` when parent asset does not exist.
11. **Mismatched Chunk Parent**: `userA` creating `/users/userA/assets/asset_1/chunks/current_0` with `assetId: "asset_2"`.
12. **Blanket / Cross-User List Scraping**: `userB` running a `list` query on `/users/userA/assets` or `/users/userA/assets/asset_1/chunks`.
