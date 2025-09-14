# Scripts folder

Utility and maintenance scripts used during development and troubleshooting.

- Not part of app runtime; run manually when needed
- May be ad‑hoc or environment‑specific — review before executing
- Never commit secrets/output they generate
- Prefer automated tests and migrations for long‑term workflows

Examples here include:

- Data generators and import/export helpers
- One‑off validation and fixup utilities
- Debugging and verification tools

Run from the backend directory inside your virtualenv, e.g.:

```
(venv) python scripts/create_test_user.py
```
