/**
 * SMA Market Discovery Scheduler Bridge v1
 *
 * Paste into existing SHOPIFY WORKFLOW Command Center Apps Script project.
 * Purpose:
 * - Create scheduler/queue tabs.
 * - Route intake into market discovery.
 * - Generate scraper seed rows.
 * - Generate GPT prompt rows.
 * - Generate Gmail drafts for client discovery links.
 * - Create Calendar tasks/events for operator review.
 *
 * This does NOT run local PowerShell directly. Apps Script cannot safely control your terminal.
 * It writes command rows and prompts so your local runner/dashboard can execute them.
 */

const SMA_SCHED = {
  VERSION: '1.0.0',
  MARKET_QUEUE_TAB: '405_Market_Discovery_Queue',
  SCRAPER_QUEUE_TAB: '406_Scraper_Seed_Queue',
  GPT_PROMPT_TAB: '407_Market_GPT_Prompts',
  SIM_INPUT_TAB: '408_Simulation_Input_Map',
  VARIABLE_TAB: '409_Top_50_Variable_Map',
  SCHEDULER_TAB: '410_Scheduler_Queue',
  EMAIL_QUEUE_TAB: '411_Email_Draft_Queue',
  LOCAL_COMMAND_TAB: '412_Local_Command_Queue',
  DASHBOARD_TAB: '413_Operator_Dashboard'
};

function SMA_setupProgrammaticSchedulerBridge() {
  SMA_createProgrammaticTabs_();
  SMA_seedTop50Variables_();
  SMA_installSchedulerTriggers_();
  SMA_safeToast('Programmatic Scheduler Bridge installed.');
}

function SMA_createProgrammaticTabs_() {
  SMA_getOrCreateSheet(SMA_SCHED.MARKET_QUEUE_TAB, [
    'Timestamp','Project ID','Company / Project Name','Industry','Desired Money / Result Goal','Universal Action','Target Customer','Target Geography','Offer / CTA','Unit Value','Ad Budget','Model / Partner Websites','Workflow Path','Market Discovery Status','Scraper Status','GPT Prompt Status','Next Action','Payload JSON'
  ]);
  SMA_getOrCreateSheet(SMA_SCHED.SCRAPER_QUEUE_TAB, [
    'Timestamp','Project ID','Seed URL','Allowed Domain','Priority','Status','Local Output Folder','Notes'
  ]);
  SMA_getOrCreateSheet(SMA_SCHED.GPT_PROMPT_TAB, [
    'Timestamp','Project ID','Prompt Type','Prompt','Status','Notes'
  ]);
  SMA_getOrCreateSheet(SMA_SCHED.SIM_INPUT_TAB, [
    'Project ID','Desired Goal','Action','Unit Value','Conversion Rate','CTR','CPC','Labor Capacity','Days','Risk Drag %','Source'
  ]);
  SMA_getOrCreateSheet(SMA_SCHED.VARIABLE_TAB, [
    'Variable ID','Category','Variable','Default Risk Weight','Default Mitigation','Applies To'
  ]);
  SMA_getOrCreateSheet(SMA_SCHED.SCHEDULER_TAB, [
    'Timestamp','Task ID','Project ID','Task Type','Cadence','Status','Last Run','Next Run','Owner','Notes'
  ]);
  SMA_getOrCreateSheet(SMA_SCHED.EMAIL_QUEUE_TAB, [
    'Timestamp','Project ID','Recipient','Subject','Body','Status','Draft URL / Notes'
  ]);
  SMA_getOrCreateSheet(SMA_SCHED.LOCAL_COMMAND_TAB, [
    'Timestamp','Project ID','Command Type','PowerShell Command','Status','Result Notes'
  ]);
  SMA_getOrCreateSheet(SMA_SCHED.DASHBOARD_TAB, [
    'Metric','Value','Status','Notes'
  ]);
}

function SMA_installSchedulerTriggers_() {
  const triggers = ScriptApp.getProjectTriggers();
  const exists = triggers.some(t => t.getHandlerFunction() === 'SMA_runProgrammaticScheduler');
  if (!exists) {
    ScriptApp.newTrigger('SMA_runProgrammaticScheduler').timeBased().everyMinutes(15).create();
  }
}

function SMA_runProgrammaticScheduler() {
  SMA_processEmailDraftQueue_();
  SMA_updateOperatorDashboard_();
}

function SMA_createMarketDiscoveryFromPayload(payload) {
  const projectId = payload.project_id || payload['Project ID'] || '';
  if (!projectId) throw new Error('Missing project_id for market discovery.');

  const company = payload.company_project_name || '';
  const industry = payload.industry || '';
  const desiredGoal = payload.desired_money_result_goal || payload.desired_income_goal || payload.primary_goal || '';
  const action = payload.universal_action || payload.what_should_the_visitor_do_on_the_page_or_site || payload.offer_cta || '';
  const targetCustomer = payload.who_is_the_target_customer || payload.target_customer || '';
  const geography = payload.target_geography || payload.service_area || '';
  const offer = payload.what_does_the_business_sell_provide_or_want_to_launch || payload.offer_cta || '';
  const unitValue = payload.unit_value || payload.average_order_value || '';
  const adBudget = payload.ad_budget || payload.monthly_ad_budget || '';
  const modelSites = payload.reference_website_to_match_or_study || payload.reference_website_url || payload.model_partner_websites || '';

  SpreadsheetApp.getActive().getSheetByName(SMA_SCHED.MARKET_QUEUE_TAB).appendRow([
    SMA_now(), projectId, company, industry, desiredGoal, action, targetCustomer, geography, offer, unitValue, adBudget, modelSites, payload.workflow_path || '', 'QUEUED', modelSites ? 'QUEUED' : 'BLOCKED_NO_SEED_URLS', 'READY', modelSites ? 'Run local scraper using seed URLs.' : 'Add partner/model website URLs.', JSON.stringify(payload)
  ]);

  SMA_addSeedUrls_(projectId, modelSites);
  SMA_addMarketPrompt_(projectId, industry, desiredGoal, action, targetCustomer, geography, offer, modelSites);
  SMA_addLocalScraperCommand_(projectId, industry, desiredGoal, action);
}

function SMA_addSeedUrls_(projectId, modelSites) {
  if (!modelSites) return;
  const sheet = SpreadsheetApp.getActive().getSheetByName(SMA_SCHED.SCRAPER_QUEUE_TAB);
  const urls = String(modelSites).split(/[\n, ]+/).map(x => x.trim()).filter(x => x.indexOf('http://') === 0 || x.indexOf('https://') === 0);
  urls.forEach(function(url, index) {
    sheet.appendRow([SMA_now(), projectId, url, SMA_domainFromUrl_(url), index + 1, 'QUEUED', 'C:\\SMA\\SHOPIFY_WORKFLOW_SYSTEM\\03_MARKET_DISCOVERY\\partner_sites\\exports', 'Generated from intake/model website field.']);
  });
}

function SMA_addLocalScraperCommand_(projectId, industry, desiredGoal, action) {
  const command = 'powershell -NoProfile -ExecutionPolicy Bypass -File "C:\\SMA\\SHOPIFY_WORKFLOW_SYSTEM\\code\\scripts\\06-run-universal-partner-scraper.ps1"';
  SpreadsheetApp.getActive().getSheetByName(SMA_SCHED.LOCAL_COMMAND_TAB).appendRow([SMA_now(), projectId, 'RUN_SCRAPER', command, 'READY_FOR_LOCAL_TERMINAL', 'Run locally. Apps Script cannot directly execute local terminal commands.']);
}

function SMA_addMarketPrompt_(projectId, industry, desiredGoal, action, targetCustomer, geography, offer, modelSites) {
  const prompt = [
    'You are interpreting structured market discovery data for the Shopify Workflow system.', '',
    'Project ID: ' + projectId,
    'Industry: ' + industry,
    'Desired money/result goal: ' + desiredGoal,
    'Universal action/conversion: ' + action,
    'Target customer: ' + targetCustomer,
    'Target geography: ' + geography,
    'Offer/CTA: ' + offer,
    'Model/partner websites: ' + modelSites, '',
    'Use only verified source data from scraper exports and workbook outputs.',
    'Do not invent facts. If a claim is not proven, write: Could not verify.', '',
    'Create: market discovery analysis, partner-site extraction summary, funnel strategy, social/ads strategy, sales strategy, daily targets, economic assumptions, simulation scenarios, top risks/mitigations, Shopify build implications.', '',
    'The programmatic workbook owns the math. GPT only interprets and implements.'
  ].join('\n');
  SpreadsheetApp.getActive().getSheetByName(SMA_SCHED.GPT_PROMPT_TAB).appendRow([SMA_now(), projectId, 'MARKET_DISCOVERY_INTERPRETATION', prompt, 'READY', 'Generated from intake + market discovery engine.']);
}

function SMA_queueClientDiscoveryEmail(recipient, projectId, formUrl) {
  const subject = 'Client Discovery Form - ' + projectId;
  const body = 'Please complete this discovery form so we can build the correct Shopify workflow system:\n\n' + formUrl + '\n\nThis form controls the project scope, market discovery, partner-site research, and build path.';
  SpreadsheetApp.getActive().getSheetByName(SMA_SCHED.EMAIL_QUEUE_TAB).appendRow([SMA_now(), projectId, recipient, subject, body, 'READY_TO_DRAFT', '']);
}

function SMA_processEmailDraftQueue_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SMA_SCHED.EMAIL_QUEUE_TAB);
  if (!sheet || sheet.getLastRow() < 2) return;
  const values = sheet.getDataRange().getValues();
  const idx = SMA_headerIndex(values[0]);
  for (let r = 1; r < values.length; r++) {
    const status = String(values[r][idx['Status']] || '').toUpperCase();
    if (status !== 'READY_TO_DRAFT') continue;
    const recipient = values[r][idx['Recipient']];
    const subject = values[r][idx['Subject']];
    const body = values[r][idx['Body']];
    GmailApp.createDraft(recipient, subject, body);
    sheet.getRange(r + 1, idx['Status'] + 1).setValue('DRAFT_CREATED');
    sheet.getRange(r + 1, idx['Draft URL / Notes'] + 1).setValue('Draft created in Gmail. Review before sending.');
  }
}

function SMA_updateOperatorDashboard_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SMA_SCHED.DASHBOARD_TAB);
  if (!sheet) return;
  sheet.clear();
  sheet.appendRow(['Metric','Value','Status','Notes']);
  sheet.appendRow(['Last scheduler run', SMA_now(), 'ACTIVE', 'Runs every 15 minutes']);
  sheet.appendRow(['Market queue rows', SMA_countRows_(SMA_SCHED.MARKET_QUEUE_TAB), 'INFO', '405']);
  sheet.appendRow(['Scraper seed rows', SMA_countRows_(SMA_SCHED.SCRAPER_QUEUE_TAB), 'INFO', '406']);
  sheet.appendRow(['GPT prompt rows', SMA_countRows_(SMA_SCHED.GPT_PROMPT_TAB), 'INFO', '407']);
  sheet.appendRow(['Email queue rows', SMA_countRows_(SMA_SCHED.EMAIL_QUEUE_TAB), 'INFO', '411']);
  sheet.appendRow(['Local command rows', SMA_countRows_(SMA_SCHED.LOCAL_COMMAND_TAB), 'INFO', '412']);
}

function SMA_countRows_(sheetName) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) return 0;
  return Math.max(0, sheet.getLastRow() - 1);
}

function SMA_domainFromUrl_(url) {
  try { return String(url).replace(/^https?:\/\//, '').split('/')[0].toLowerCase(); }
  catch (err) { return ''; }
}

function SMA_seedTop50Variables_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SMA_SCHED.VARIABLE_TAB);
  if (sheet.getLastRow() > 1) return;
  const rows = [
    ['V01','Market','Demand too low',0.08,'Validate demand before spend','All'],
    ['V02','Market','Demand seasonal',0.05,'Create seasonal calendar','All'],
    ['V03','Market','Audience mismatch',0.07,'Refine avatar and message-market fit','All'],
    ['V04','Market','Competitor saturation',0.06,'Differentiate offer and CTA','All'],
    ['V05','Offer','Offer unclear',0.09,'Simplify offer and outcome','All'],
    ['V06','Offer','Price resistance',0.07,'Add tiers/proof/financing if allowed','All'],
    ['V07','Traffic','Ad CPC higher than expected',0.07,'Add organic and retargeting','Paid'],
    ['V08','Traffic','CTR lower than expected',0.06,'Test hooks and creative','Paid/Social'],
    ['V09','Conversion','Landing page conversion low',0.09,'A/B test headline CTA proof','Web'],
    ['V10','Sales','Slow follow-up',0.08,'Automate lead alerts and scripts','Lead Gen'],
    ['V11','Ops','Labor shortage',0.09,'Plan capacity and backup vendors','Service'],
    ['V12','Financial','Cash flow gap',0.09,'Model working capital and deposits','All'],
    ['V13','External','Weather disruption',0.05,'Seasonal buffers','Local/Field'],
    ['V14','External','Political/regulatory change',0.06,'Monitor policy and claim rules','Regulated'],
    ['V15','Data','Bad assumptions',0.09,'Use source confidence register','All'],
    ['V16','Legal','Privacy consent missing',0.08,'Add consent language and policy links','Lead Gen'],
    ['V17','Legal','False/implied guarantee risk',0.09,'Claim firewall and disclaimers','All'],
    ['V18','Tech','Automation failure',0.06,'Retry queue and manual fallback','Automation'],
    ['V19','Tech','Integration credentials missing',0.05,'Secrets checklist and owner approval','Automation'],
    ['V20','Platform','Shopify/API limitation',0.05,'Use draft mode and approved app paths','Shopify']
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}
