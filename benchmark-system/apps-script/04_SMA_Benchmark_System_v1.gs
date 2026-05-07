/**
 * SMA Benchmark System v1
 * Paste-safe for existing SHOPIFY WORKFLOW Command Center Apps Script project.
 *
 * Purpose:
 * - Create Benchmark System tabs.
 * - Connect intake payloads to benchmark targets when a model/competitor/partner URL exists.
 * - Generate scraper seed rows.
 * - Generate exhaustive reverse-documentation, enhancement, forward-engineering, and validation prompts.
 * - Generate Shopify build requirement rows.
 * - Generate Zero Document index rows.
 *
 * Does NOT publish, deploy, scrape locally, or call paid APIs.
 */

const SMA_BENCHMARK = {
  VERSION: '1.0.0',
  TARGETS_TAB: '414_Benchmark_Targets',
  COMPONENT_TAB: '415_Benchmark_Component_Inventory',
  VISUAL_TAB: '416_Benchmark_Visual_Inventory',
  GAP_TAB: '417_Benchmark_Gap_Map',
  IMPROVEMENT_TAB: '418_Benchmark_Improvement_Matrix',
  PROMPTS_TAB: '419_Benchmark_GPT_Prompts',
  FORWARD_TAB: '420_Benchmark_Forward_Spec',
  SHOPIFY_REQ_TAB: '421_Benchmark_Shopify_Requirements',
  TEST_LOG_TAB: '422_Benchmark_Test_Log',
  ENHANCEMENT_TAB: '423_Benchmark_Enhancement_Register',
  ZERO_DOC_TAB: '424_Benchmark_Zero_Document_Index',
  SCRAPER_SEED_TAB: '406_Scraper_Seed_Queue',
  LOCAL_COMMAND_TAB: '412_Local_Command_Queue'
};

function SMA_setupBenchmarkSystem() {
  SMA_BM_createTabs_();
  SMA_BM_seedPromptCatalog_();
  SMA_BM_safeToast_('Benchmark System installed.');
}

function SMA_Benchmark_createFromLastIntakeRow() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('400_Intake_Build_Queue');
  if (!sheet || sheet.getLastRow() < 2) throw new Error('No intake rows found in 400_Intake_Build_Queue.');
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idx = SMA_BM_headerIndex_(headers);
  const row = values[values.length - 1];
  const payloadJson = row[idx['Payload JSON']];
  if (!payloadJson) throw new Error('Last intake row has no Payload JSON.');
  const payload = JSON.parse(payloadJson);
  return SMA_Benchmark_createFromPayload(payload);
}

function SMA_Benchmark_createFromPayload(payload) {
  SMA_BM_createTabs_();

  const benchmark = SMA_BM_extractBenchmarkPayload_(payload);
  if (!benchmark.hasBenchmarkSignal) {
    return { status: 'SKIPPED', message: 'No benchmark/model/competitor/partner signal found.' };
  }

  SMA_BM_appendBenchmarkTarget_(benchmark, payload);
  SMA_BM_appendScraperSeeds_(benchmark);
  SMA_BM_appendLocalCommand_(benchmark);
  SMA_BM_appendPrompts_(benchmark);
  SMA_BM_appendShopifyRequirements_(benchmark);
  SMA_BM_appendZeroDocIndex_(benchmark);
  SMA_BM_appendValidationCycles_(benchmark);

  return { status: 'CREATED', project_id: benchmark.projectId, target_url: benchmark.targetUrls.join(', ') };
}

function SMA_BM_createTabs_() {
  SMA_BM_getOrCreateSheet_(SMA_BENCHMARK.TARGETS_TAB, [
    'Timestamp','Benchmark ID','Project ID','Company / Project','Industry','Target Name','Target URL(s)','Target Type','Benchmark Reason','Desired Money / Result Goal','Universal Action','Target Customer','Operator Goal','Status','Next Action','Payload JSON'
  ]);

  SMA_BM_getOrCreateSheet_(SMA_BENCHMARK.COMPONENT_TAB, [
    'Component ID','Benchmark ID','Project ID','Component Name','Component Category','Subcategory','Location / Page / Section','Visual Description','Color','Shape','Size','Placement','Text / Copy','CTA / Action','Purpose','What It Does','Why It Exists','User Need','Business Need','Revenue Function','Data Captured / Implied','Inputs','Outputs','Connected Components','Dependencies','What Depends On It','What Happens If Removed','Risk / Compliance Concern','Missing / Weak Element','Improvement Opportunity','Better-System Requirement','Build Priority','Evidence Source','Confidence'
  ]);

  SMA_BM_getOrCreateSheet_(SMA_BENCHMARK.VISUAL_TAB, [
    'Visual ID','Benchmark ID','Project ID','Page / Section','Element','Color','Shape','Layout Role','Position','Size','Spacing','Typography','Image / Icon Use','Motion / Interaction','Visual Purpose','Conversion Purpose','Evidence Source','Improvement Opportunity'
  ]);

  SMA_BM_getOrCreateSheet_(SMA_BENCHMARK.GAP_TAB, [
    'Gap ID','Benchmark ID','Project ID','Gap Category','Observed Gap','Why It Matters','User Impact','Business Impact','Revenue Impact','Risk Level','Fix Recommendation','Forward Requirement','Priority','Evidence Source'
  ]);

  SMA_BM_getOrCreateSheet_(SMA_BENCHMARK.IMPROVEMENT_TAB, [
    'Improvement ID','Benchmark ID','Project ID','Area','Current State','Better State','Required Change','Expected Impact','Effort','Cost Level','Dependency','Owner','Priority','Status'
  ]);

  SMA_BM_getOrCreateSheet_(SMA_BENCHMARK.PROMPTS_TAB, [
    'Timestamp','Benchmark ID','Project ID','Prompt Order','Prompt Type','Prompt','Status','Notes'
  ]);

  SMA_BM_getOrCreateSheet_(SMA_BENCHMARK.FORWARD_TAB, [
    'Spec ID','Benchmark ID','Project ID','System Name','Build Type','Purpose','Target User','Core Offer','Required Pages','Required Components','Required Automations','Required Data','Required Integrations','Required Enhancements','Approval Gates','Build Status','Notes'
  ]);

  SMA_BM_getOrCreateSheet_(SMA_BENCHMARK.SHOPIFY_REQ_TAB, [
    'Requirement ID','Benchmark ID','Project ID','Shopify Area','Requirement','Source / Reason','Priority','Draft Only','Publish Blocked','Approval Needed','Status'
  ]);

  SMA_BM_getOrCreateSheet_(SMA_BENCHMARK.TEST_LOG_TAB, [
    'Timestamp','Benchmark ID','Project ID','Test Cycle','Test Name','Test Purpose','Inputs Used','Expected Result','Actual Result','Pass / Fail','Defects Found','Fix Applied','Retest Result','Evidence Path','Status'
  ]);

  SMA_BM_getOrCreateSheet_(SMA_BENCHMARK.ENHANCEMENT_TAB, [
    'Enhancement ID','Benchmark ID','Project ID','Enhancement Category','Current Similar Technology','Why It Matters','Recommended Enhancement','Required / Optional','Source URL','Verification Status','Implementation Notes','Priority'
  ]);

  SMA_BM_getOrCreateSheet_(SMA_BENCHMARK.ZERO_DOC_TAB, [
    'Zero Doc ID','Benchmark ID','Project ID','Document Section','Required Content','Status','Owner','Evidence Source','Notes'
  ]);

  SMA_BM_getOrCreateSheet_(SMA_BENCHMARK.SCRAPER_SEED_TAB, [
    'Timestamp','Project ID','Seed URL','Allowed Domain','Priority','Status','Local Output Folder','Notes'
  ]);

  SMA_BM_getOrCreateSheet_(SMA_BENCHMARK.LOCAL_COMMAND_TAB, [
    'Timestamp','Project ID','Command Type','PowerShell Command','Status','Result Notes'
  ]);
}

function SMA_BM_extractBenchmarkPayload_(payload) {
  const projectId = payload.project_id || payload['Project ID'] || SMA_BM_makeId_('BENCH');
  const company = payload.company_project_name || payload.client_name || payload.operator_name || 'Unknown Project';
  const industry = payload.industry || '';
  const desiredGoal = payload.desired_money_result_goal || payload.desired_income_goal || payload.primary_goal || '';
  const action = payload.universal_action || payload.what_should_the_visitor_do_on_the_page_or_site || payload.offer_cta || '';
  const targetCustomer = payload.who_is_the_target_customer || payload.target_customer || '';

  const urlFields = [
    payload.model_partner_websites,
    payload.reference_website_to_match_or_study,
    payload.reference_website_url,
    payload.benchmark_url,
    payload.competitor_url,
    payload.partner_website,
    payload.website_app_or_system_to_benchmark,
    payload.what_website_system_app_or_competitor_should_we_benchmark
  ];

  const textFields = [
    payload.what_do_you_want_built,
    payload.build_objective,
    payload.anything_else_that_must_be_known_before_build_starts,
    payload.what_should_we_copy_match_or_avoid_from_the_reference_website,
    payload.known_blockers_or_risks,
    payload.operator_notes
  ].filter(Boolean).join(' ').toLowerCase();

  const urls = SMA_BM_extractUrls_(urlFields.filter(Boolean).join('\n'));
  const benchmarkWords = ['benchmark','competitor','partner','model','like this','something like','copy structure','reverse engineer','reverse-engineer','clone model','make it better','reference website'];
  const hasSignal = urls.length > 0 || benchmarkWords.some(w => textFields.indexOf(w) >= 0);

  return {
    benchmarkId: SMA_BM_makeId_('BM'),
    projectId: projectId,
    company: company,
    industry: industry,
    desiredGoal: desiredGoal,
    action: action,
    targetCustomer: targetCustomer,
    targetUrls: urls,
    targetName: company + ' Benchmark',
    targetType: 'Universal Benchmark Target',
    benchmarkReason: textFields || 'Benchmark/model website provided.',
    operatorGoal: payload.build_objective || payload.what_do_you_want_built || '',
    hasBenchmarkSignal: hasSignal
  };
}

function SMA_BM_appendBenchmarkTarget_(benchmark, payload) {
  SpreadsheetApp.getActive().getSheetByName(SMA_BENCHMARK.TARGETS_TAB).appendRow([
    SMA_BM_now_(), benchmark.benchmarkId, benchmark.projectId, benchmark.company, benchmark.industry, benchmark.targetName, benchmark.targetUrls.join('\n'), benchmark.targetType, benchmark.benchmarkReason, benchmark.desiredGoal, benchmark.action, benchmark.targetCustomer, benchmark.operatorGoal, 'QUEUED', 'Run scrape/ingest, then execute Benchmark GPT prompts in order.', JSON.stringify(payload)
  ]);
}

function SMA_BM_appendScraperSeeds_(benchmark) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SMA_BENCHMARK.SCRAPER_SEED_TAB);
  if (!benchmark.targetUrls.length) {
    sheet.appendRow([SMA_BM_now_(), benchmark.projectId, '', '', 1, 'BLOCKED_NO_URL', 'C:\\SMA\\SHOPIFY_WORKFLOW_SYSTEM\\05_MARKET_DISCOVERY_AND_SOURCES\\benchmark_system\\01_scrape_outputs', 'Benchmark signal found but no URL was provided.']);
    return;
  }
  benchmark.targetUrls.forEach(function(url, i) {
    sheet.appendRow([SMA_BM_now_(), benchmark.projectId, url, SMA_BM_domainFromUrl_(url), i + 1, 'QUEUED_BENCHMARK', 'C:\\SMA\\SHOPIFY_WORKFLOW_SYSTEM\\05_MARKET_DISCOVERY_AND_SOURCES\\benchmark_system\\01_scrape_outputs', 'Generated by Benchmark System.']);
  });
}

function SMA_BM_appendLocalCommand_(benchmark) {
  const command = 'powershell -NoProfile -ExecutionPolicy Bypass -File "C:\\SMA\\SHOPIFY_WORKFLOW_SYSTEM\\Code\\scripts\\07-run-benchmark-scraper.ps1"';
  SpreadsheetApp.getActive().getSheetByName(SMA_BENCHMARK.LOCAL_COMMAND_TAB).appendRow([
    SMA_BM_now_(), benchmark.projectId, 'RUN_BENCHMARK_SCRAPER', command, 'READY_FOR_LOCAL_TERMINAL', 'Run locally. Apps Script cannot directly execute local PowerShell.'
  ]);
}

function SMA_BM_appendPrompts_(benchmark) {
  const prompts = [
    ['01','SOURCE_COLLECTION', SMA_BM_promptSourceCollection_(benchmark)],
    ['02','SCRAPER_INGESTION', SMA_BM_promptScraperIngestion_(benchmark)],
    ['03','EXHAUSTIVE_REVERSE_DOCUMENTATION', SMA_BM_promptReverseDocs_(benchmark)],
    ['04','COMPONENT_INVENTORY', SMA_BM_promptComponentInventory_(benchmark)],
    ['05','VISUAL_INVENTORY', SMA_BM_promptVisualInventory_(benchmark)],
    ['06','CURRENT_TECH_ENHANCEMENT', SMA_BM_promptEnhancement_(benchmark)],
    ['07','FORWARD_ENGINEERING', SMA_BM_promptForwardEngineering_(benchmark)],
    ['08','SHOPIFY_BUILD_REQUIREMENTS', SMA_BM_promptShopifyRequirements_(benchmark)],
    ['09','THREE_CYCLE_VALIDATION', SMA_BM_promptValidation_(benchmark)],
    ['10','FINAL_HANDOFF', SMA_BM_promptFinalHandoff_(benchmark)]
  ];
  const sheet = SpreadsheetApp.getActive().getSheetByName(SMA_BENCHMARK.PROMPTS_TAB);
  prompts.forEach(function(p) {
    sheet.appendRow([SMA_BM_now_(), benchmark.benchmarkId, benchmark.projectId, p[0], p[1], p[2], 'READY', 'Generated by Benchmark System. Execute in order.']);
  });
}

function SMA_BM_appendShopifyRequirements_(benchmark) {
  const rows = [
    ['SHOPIFY-REQ-001','Page architecture must be based on benchmark decomposition, not loose chat.'],
    ['SHOPIFY-REQ-002','Create draft-only Shopify structure until approval gate passes.'],
    ['SHOPIFY-REQ-003','Do not copy protected branding, copyrighted copy, logos, or private code.'],
    ['SHOPIFY-REQ-004','Use benchmark only for structure, UX logic, funnel logic, feature mapping, and improvement planning.'],
    ['SHOPIFY-REQ-005','Every build requirement must trace to a benchmark component, gap, improvement, or approved operator goal.'],
    ['SHOPIFY-REQ-006','Publish must remain blocked until 3x validation and explicit operator approval.']
  ];
  const sheet = SpreadsheetApp.getActive().getSheetByName(SMA_BENCHMARK.SHOPIFY_REQ_TAB);
  rows.forEach(function(r) {
    sheet.appendRow([r[0], benchmark.benchmarkId, benchmark.projectId, 'Shopify Workflow', r[1], 'Benchmark System Playbook', 'HIGH', 'YES', 'YES', 'YES', 'QUEUED']);
  });
}

function SMA_BM_appendZeroDocIndex_(benchmark) {
  const sections = [
    'What the system is','Who it serves','Problem it solves','Business/revenue model','All pages/screens/modules','All components','All workflows','All data captured','All CTAs','All integrations','Visible automations','Inferred automations','Dependencies','Failure points','Missing parts','Improvement opportunities','Forward-engineering requirements','Exact next build sequence','Manual creation path','Auto-build path','3x validation report'
  ];
  const sheet = SpreadsheetApp.getActive().getSheetByName(SMA_BENCHMARK.ZERO_DOC_TAB);
  sections.forEach(function(section, i) {
    sheet.appendRow(['ZERO-' + (i + 1).toString().padStart(3, '0'), benchmark.benchmarkId, benchmark.projectId, section, 'Required in Zero Document for complete rebuild map.', 'PENDING', 'Benchmark System / GPT', 'Scraper outputs + prompts + operator approval', '']);
  });
}

function SMA_BM_appendValidationCycles_(benchmark) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SMA_BENCHMARK.TEST_LOG_TAB);
  for (let i = 1; i <= 3; i++) {
    sheet.appendRow([SMA_BM_now_(), benchmark.benchmarkId, benchmark.projectId, 'Cycle ' + i, 'Benchmark System Validation ' + i, 'Confirm reverse docs, Zero Document, forward spec, and Shopify requirements are complete.', 'Benchmark outputs + GPT prompts + generated docs', '100% pass with no known unresolved defects', '', 'PENDING', '', '', '', '', 'QUEUED']);
  }
}

function SMA_BM_seedPromptCatalog_() {
  const enhancementSheet = SpreadsheetApp.getActive().getSheetByName(SMA_BENCHMARK.ENHANCEMENT_TAB);
  if (enhancementSheet.getLastRow() <= 1) {
    const rows = [
      ['ENH-SEED-001','','','Shopify','Current Shopify-native apps/features','Use current Shopify features before custom code','Identify newest Shopify-native enhancement','Required','','Needs web verification','Add after benchmark research','HIGH'],
      ['ENH-SEED-002','','','AI/Groq','Current LLM workflows','Use fast low-cost AI where useful','Identify Groq/OpenAI-compatible enhancement','High value','','Needs web verification','Do not expose keys','HIGH'],
      ['ENH-SEED-003','','','Automation','Google Workspace + Apps Script','Use low-cost automation first','Identify automation improvement','High value','','Needs web verification','Queue-based execution','HIGH'],
      ['ENH-SEED-004','','','Analytics','Current reporting/dashboard options','Measurement improves optimization','Identify dashboard enhancement','Optional','','Needs web verification','Prefer Sheets/Vercel first','MEDIUM']
    ];
    enhancementSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}

function SMA_BM_promptSourceCollection_(b) {
  return 'Benchmark System - Source Collection\n\nProject ID: ' + b.projectId + '\nBenchmark ID: ' + b.benchmarkId + '\nTarget URL(s):\n' + b.targetUrls.join('\n') + '\n\nCollect all available public source material. Do not infer facts yet. Identify what can be scraped, what requires browser review, and what is blocked. If current information matters, use web browser/search. Output source inventory and blockers.';
}

function SMA_BM_promptScraperIngestion_(b) {
  return 'Benchmark System - Scraper/Ingestion\n\nUse the benchmark target URLs and scraper outputs. Normalize pages, links, images, CTAs, forms, claim hits, layout clues, text samples, and source evidence. Do not build yet. Mark missing data as BLOCKED or Could not verify.';
}

function SMA_BM_promptReverseDocs_(b) {
  return 'Benchmark System - Exhaustive Reverse Documentation\n\nYou must write the reverse document system as if the original manufacturer, architect, or builder wrote the documentation. Be exhaustive. Produce: System Overview, Purpose/Business Model, User Journey, Page/Section Map, Funnel/CTA Map, Data Map, Automation Inference Map, Content/SEO Map, Trust/Proof Map, Monetization Map, Risk/Compliance Map, Dependency Map, Failure Impact Map, Missing Parts, Improvement Opportunities, Forward Engineering Spec, Auto-Build Prompt Library, QA/Test Report. If inferred, label INFERRED. If not verified, write Could not verify.';
}

function SMA_BM_promptComponentInventory_(b) {
  return 'Benchmark System - Component Inventory\n\nPull the system apart like a machine. For every visible, structural, functional, business, design, content, funnel, data, automation, compliance, and revenue component, document: Component ID, name, category, subcategory, location, visual description, color, shape, size, placement, text/copy, CTA/action, purpose, what it does, why it exists, user need, business need, revenue function, data captured/implied, inputs, outputs, connected components, dependencies, what depends on it, what happens if removed, risks, missing/weak elements, improvement opportunity, better-system requirement, build priority, evidence source, confidence.';
}

function SMA_BM_promptVisualInventory_(b) {
  return 'Benchmark System - Visual Inventory\n\nDecompose visual design exhaustively. Identify colors, shapes, layout, hierarchy, typography, spacing, imagery, icons, sections, buttons, cards, forms, navigation, visual CTA patterns, and mobile/desktop implications. Explain what each visual part does and how it supports conversion or trust. Do not copy protected branding.';
}

function SMA_BM_promptEnhancement_(b) {
  return 'Benchmark System - Current Technology Enhancement\n\nUse web browser/search to identify current similar technology, apps, platforms, Shopify-native options, AI/Groq/LLM workflows, Google Workspace automations, Vercel/GitHub patterns, analytics/reporting options, and low-cost enhancements that could make the benchmarked system better today. Add Required, High value, Optional, Later, or Blocked until verified status. Cite/record source URLs where possible.';
}

function SMA_BM_promptForwardEngineering_(b) {
  return 'Benchmark System - Forward Engineering\n\nDo not clone the benchmark. Create a better system. Use the reverse docs, component inventory, gaps, missing parts, current-tech enhancements, and operator goal. Produce a forward-engineered spec with improved purpose, offer, user journey, funnel, CTA structure, layout, data capture, automation, analytics, compliance safety, cost control, scalability, operator workflow, and documentation.';
}

function SMA_BM_promptShopifyRequirements_(b) {
  return 'Benchmark System - Shopify Workflow Requirements\n\nTranslate the forward-engineered spec into Shopify Workflow build requirements. Include pages, sections, forms, products/services, lead capture, automations, data fields, content blocks, SEO, social/ads implications, compliance blockers, approval gates, and test requirements. Draft-only. No publish without explicit operator approval.';
}

function SMA_BM_promptValidation_(b) {
  return 'Benchmark System - Mandatory 3x Validation\n\nRun three validation cycles. Each cycle must include test name, purpose, inputs, expected result, actual result, pass/fail, defects found, fix applied, retest result, evidence path. Required final status: Cycle 1 = 100% pass, Cycle 2 = 100% pass, Cycle 3 = 100% pass. If any test fails, say: System is not complete. Test cycle failed. Required fix: ...';
}

function SMA_BM_promptFinalHandoff_(b) {
  return 'Benchmark System - Final Handoff\n\nProduce manual creation path and auto-build handoff. Include exact operator steps in order, required apps/connectors/accounts, required env/secrets placeholders, approval gates, exact rebuild prompt library in order, and final handoff package. State: The operator should not need to issue additional build commands. The operator only approves, provides missing secrets/env/accounts/connectors when necessary, and approves publishing/deployment.';
}

function SMA_BM_extractUrls_(text) {
  const matches = String(text || '').match(/https?:\/\/[^\s,]+/g);
  return matches ? Array.from(new Set(matches.map(u => u.trim().replace(/[.)]+$/, '')))) : [];
}

function SMA_BM_domainFromUrl_(url) {
  try { return String(url).replace(/^https?:\/\//, '').split('/')[0].toLowerCase(); }
  catch (err) { return ''; }
}

function SMA_BM_makeId_(prefix) {
  return prefix + '-' + Utilities.getUuid().slice(0, 8).toUpperCase();
}

function SMA_BM_getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (headers && sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#111111').setFontColor('#ffffff').setWrap(true);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

function SMA_BM_headerIndex_(headers) {
  const idx = {};
  headers.forEach(function(h, i) { idx[String(h).trim()] = i; });
  return idx;
}

function SMA_BM_now_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/New_York', 'yyyy-MM-dd HH:mm:ss');
}

function SMA_BM_safeToast_(message) {
  try { SpreadsheetApp.getActive().toast(message, 'Benchmark System', 8); }
  catch (err) { Logger.log(message); }
}

/**
 * Intake hook instruction:
 * Add this line near the end of SMA_handleIntakeFormSubmit(e), after payload is classified and queued:
 *
 * if (typeof SMA_Benchmark_createFromPayload === 'function') SMA_Benchmark_createFromPayload(payload);
 */
function SMA_Benchmark_HOOK_INSTRUCTIONS_ONLY() {}
