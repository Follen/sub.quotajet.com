# AGENTS.md

## Main Site Reference

- When the user says "main site", it means `D:\Code\QuotaJet.com\QuotaJet.com`.
- Main-site Logo and metadata are the QuotaJet brand source of truth.
- Copy required assets into this repository; never add runtime or build-time sibling filesystem dependencies.

## Test Server

- Host: `70.39.198.45`
- SSH user: `root`
- SSH identity file: `D:\cert\Follen.pem`
- Deployment notes: `Depoly.md`

## Product Direction

- This repository is the second-development codebase for Sub2API.
- During development, deploy only to `sub.quotajet.com` on the test server.
- Do not change `quotajet.com`, its DNS, Nginx configuration, or the running NEWAPI deployment while second development is in progress.
- The intended future migration is to replace the `quotajet.com` NEWAPI service with this Sub2API fork only after second development and migration validation are complete.
- Treat the production cutover as a separate, explicitly approved operation with backup and rollback steps.
