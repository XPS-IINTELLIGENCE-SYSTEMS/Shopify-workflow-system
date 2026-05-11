# Issue and Pull Request Operating System

## Purpose

This repo uses GitHub issues as the work queue and pull requests as the controlled change mechanism.

## Issue Types

- Master phase issue
- Vertical step issue
- Audit issue
- Blocker issue
- Social content issue
- QA issue
- Release issue

## Required Issue Fields

Every executable issue should include:

- Business purpose
- Required inputs
- Required outputs
- Acceptance criteria
- Blockers
- Completion evidence
- Linked Drive source
- Linked PR, when files changed

## Pull Request Rule

Every repo file change should happen on a branch and enter main through a reviewed PR.

## PR Review Checklist

- Linked issue exists.
- Production lock remains ON.
- No credential values are committed.
- No live publishing is performed from this bridge.
- Public claims are reviewed.
- Documentation is updated when behavior changes.
- Rollback note is included when relevant.

## Completion Standard

An issue is complete only when the acceptance criteria pass and evidence is attached.
