# Shopify Workflow Project Kanban Bridge

## Purpose

This document defines how the Shopify Workflow System repo operates as a GitHub Project controlled workflow machine.

The board is designed horizontally:

1. Intake / Source Read
2. Discovery / Research
3. Claims + Compliance Scan
4. Funnel / Offer Logic
5. Backend + Data Model
6. Content Drafting
7. Proof Loop Review
8. Human Approval
9. Scheduler Export
10. Deployment / Publish Gate
11. Reporting / Analytics
12. Optimization / Repurpose

Each phase contains vertical step issues. The vertical issues are the executable work units.

## Source Locations

Primary Drive source folder:

https://drive.google.com/drive/folders/1Aen_aj6Pt2wojNz-GCkl1Ws241OkwR4_?usp=drive_link

Existing command Apps Script project:

https://script.google.com/u/0/home/projects/1OlQOknXMNrheGEi0jTsqsVlLhSKNZoeiz0x3FeEupuTncKc5aswfXPKp/edit

## Board Operating Model

- Horizontal field: `Workflow Phase`
- Vertical sorting field: `Step Order`
- Status field: `Execution Status`
- Blocker field: `Blocker Level`
- Evidence field: `Completion Evidence`

## Required Phase Labels

- `phase:intake`
- `phase:discovery`
- `phase:compliance`
- `phase:funnel`
- `phase:backend`
- `phase:content`
- `phase:proof-loop`
- `phase:approval`
- `phase:scheduler`
- `phase:deployment`
- `phase:reporting`
- `phase:optimization`

## Required Status Labels

- `status:todo`
- `status:in-progress`
- `status:blocked`
- `status:ready-for-review`
- `status:approved`
- `status:done`

## Production Guardrail

Production lock remains ON. This bridge may create issues, draft pull requests, docs, task records, and content drafts. It may not publish Shopify changes, send live social posts, deploy production, merge to main, or store secrets.

## Manual GitHub Project Setup Required

The repo bridge can create issues and labels. If direct Project field access is unavailable, manually add issues to the GitHub Project and map them into the phase columns.
