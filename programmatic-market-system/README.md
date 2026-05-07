# Programmatic Market System

This module extends Shopify Workflow with a programmatic discovery, scraper, simulation, and dashboard layer.

## Purpose

- Convert client discovery answers into market-discovery queue items.
- Reverse-engineer money/action goals into daily targets and channel targets.
- Scrape partner/model websites from approved client-provided URLs.
- Normalize pages, links, images, CTAs, forms, and claim-sensitive text.
- Generate GPT interpretation prompts from structured data.
- Keep GPT as implementer/interpreter, not workflow owner.

## Source-of-truth pairing

- Google Drive: operating files, forms, sheets, exports, client folders.
- GitHub: scripts, scraper code, dashboard scaffold, versioned system logic.
- Shopify: storefront/build/publish layer, controlled by approval gates.
- Vercel: dashboard/app hosting when needed.
- Local terminal: scraper execution, sync, and large-file processing.

## Connected context verified

- Drive folder: SHOPIFY WORKFLOW
- Shopify store: Nourish Access
- Vercel team: Strategic Minds Advisory
- GitHub repo: XPS-IINTELLIGENCE-SYSTEMS/Shopify-workflow-system

## Runtime rule

No build starts from loose chat. A build starts from one of:

1. Completed client discovery form
2. Operator build request form
3. Approved project payload
4. Approved market-discovery queue item

## Required tabs

- 400_Intake_Build_Queue
- 405_Market_Discovery_Queue
- 406_Scraper_Seed_Queue
- 407_Market_GPT_Prompts
- 408_Simulation_Input_Map
- 409_Top_50_Variable_Map

## Safety

Do not commit secrets, OAuth tokens, rclone config, Groq keys, OpenAI keys, Shopify Admin tokens, Google refresh tokens, crypto API keys, or `.env` files.
