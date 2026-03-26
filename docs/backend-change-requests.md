# Backend change requests

Queue for API work the frontend needs from the backend. Contract sources remain **[swagger.yaml](swagger.yaml)** (endpoints, schemas, errors) and **[integration.md](integration.md)** (high-level behaviour).

---

## How to use this file

### Frontend

1. Add a new item using the **[template](#template-copy-for-each-request)** below. Put the ask under **Request** only. Use an **unchecked** heading: `### [ ] …`.
2. When picking up work that the backend has **already delivered**, work only from items whose heading is **`### [x] …`**. Treat the **Done** section as the handoff: it points at what actually shipped in Swagger / integration. Do not re-derive behaviour from the **Request** text alone — the **Done** block is what reflects reality after backend implementation.
3. After the **frontend** change that consumes the API update is merged (or otherwise finished), **delete the entire request block** for that item (from `###` through the following `---`). That keeps the queue accurate.

### Backend

1. Implement the change; ship updates in **[swagger.yaml](swagger.yaml)** and, when narrative rules change, **[integration.md](integration.md)** (per your repo process).
2. Mark the item complete: change the heading to **`### [x] …`** (same title text; only the checkbox changes).
3. Fill the **Done** section with pointers and notes that help the frontend wire the feature: e.g. Swagger `paths` / operationIds / relevant schemas, integration.md section headings or anchors, example payloads, new `error.code` values, breaking changes, or caveats.
4. **Do not edit the Request section** — not wording, not bullets, not the title inside **Request**. Only add or update content under **Done**.

### Summary

| Area        | Who      | Allowed edits                                                                                                  |
| ----------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| **Request** | Frontend | Frontend adds/updates while open. Backend: **no edits**.                                                       |
| **Done**    | Backend  | Backend fills when marking `[x]`. Frontend: **read-only**; then remove whole block when frontend work is done. |
| Heading     | Both     | Checkbox only: `[ ]` → `[x]` by backend when shipped.                                                          |

---

## Template (copy for each request)

```markdown
### [ ] Short title (imperative or outcome)

**Request** _(frontend — do not edit below this heading; backend fills **Done** only)_

- Method/path (if known), params, payload/response shape, error behaviour, or product reason.
- How the UI will use it.

**Done** _(backend — add when marking `[x]`; include Swagger + integration pointers)_

- **Swagger:** …
- **Integration:** … _(if applicable)_
- **Notes:** … _(optional: codes, migration, breaking changes)_

---
```

Remove the fenced code block wrapper when pasting a real item; keep the `---` after each item so blocks stay visually separated.

---

## Open requests

_(none)_
