# GPT Automation Bridge

## Purpose

The GPT Automation Bridge turns ChatGPT-assisted work into governed GitHub issues, pull requests, workbook records, and approval gates.

## Safe Operating Rules

1. Do not merge to main without approval.
2. Do not deploy production.
3. Do not publish Shopify changes.
4. Do not send live emails or social posts.
5. Do not store secrets in files, Sheets, issues, or prompts.
6. Keep `SWF_PRODUCTION_LOCK=ON` unless the release firewall passes and human approval is logged.

## Bridge Inputs

- GitHub repo: `XPS-IINTELLIGENCE-SYSTEMS/Shopify-workflow-system`
- Drive folder: `https://drive.google.com/drive/folders/1Aen_aj6Pt2wojNz-GCkl1Ws241OkwR4_?usp=drive_link`
- Apps Script command project: `https://script.google.com/u/0/home/projects/1OlQOknXMNrheGEi0jTsqsVlLhSKNZoeiz0x3FeEupuTncKc5aswfXPKp/edit`
- Workflow phase
- Step issue
- Completion evidence
- Blocker state

## Bridge Outputs

- Phase issues
- Vertical task issues
- Draft pull requests
- PR audit comments
- Run log rows
- Blocker records
- Social content task records
- QA and release firewall evidence

## GPT Role Boundaries

GPT may:

- Audit repo structure.
- Draft docs and code.
- Open issues.
- Open draft PRs.
- Review PRs.
- Generate content drafts.
- Build task plans.

GPT may not:

- Publish live Shopify changes without approval.
- Deploy production without release approval.
- Merge PRs without approval.
- Invent evidence.
- Mark unverified sources as verified.
- Store or expose secrets.

## Core Workflow Loop

1. Read active issue.
2. Inspect linked sources.
3. Identify blocker or next action.
4. Create or update file changes on a branch.
5. Open or update draft PR.
6. Attach evidence.
7. Mark issue ready for review only when acceptance criteria pass.
8. Wait for approval before release actions.
