import re
import json
import time
import hashlib
import argparse
from pathlib import Path
from urllib.parse import urljoin, urlparse
from xml.etree import ElementTree as ET

import requests
import pandas as pd
from bs4 import BeautifulSoup

DEFAULT_KEYWORDS = [
    'price','pricing','cost','free','apply','qualify','eligibility','book','schedule','buy','order',
    'contact','quote','estimate','program','service','product','benefit','government','federal',
    'medicaid','insurance','warranty','guarantee','results','income','claim','privacy','consent',
    'terms','refund','delivery','training','certification','course','contractor','partner'
]

CTA_KEYWORDS = [
    'get started','start','claim','apply','qualify','check','submit','next','contact','call','learn',
    'book','schedule','buy','order','quote','estimate','download','join'
]

COMPLIANCE_QUESTIONS = [
    'Exact offer stated','Exact price stated','Exact eligibility requirements',
    'Exact guarantee/warranty/refund policy','Exact payer/sponsor/source of funds',
    'Exact compliance-sensitive claims','Privacy policy language','Consent-to-contact language',
    'Terms and conditions','Required disclaimers','Restricted claims','Proof/source needed before publishing'
]

def clean_text(value):
    if not value:
        return ''
    return re.sub(r'\s+', ' ', str(value)).strip()

def safe_filename(url):
    h = hashlib.sha256(url.encode('utf-8')).hexdigest()[:16]
    parsed = urlparse(url)
    slug = re.sub(r'[^a-zA-Z0-9]+', '-', parsed.netloc + parsed.path).strip('-').lower()
    return f"{(slug or 'page')[:90]}-{h}.html"

def domain_from_url(url):
    return urlparse(url).netloc.lower().replace(':443','').replace(':80','')

def allowed_domains_from_seeds(seeds):
    domains = set()
    for seed in seeds:
        host = domain_from_url(seed)
        if host:
            domains.add(host)
            domains.add(host[4:] if host.startswith('www.') else 'www.' + host)
    return domains

def is_allowed(url, allowed_domains):
    return domain_from_url(url) in allowed_domains

def fetch(url, timeout=30):
    headers = {'User-Agent': 'StrategicMindsAdvisory-ProgrammaticMarketDiscoveryBot/1.0'}
    try:
        response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        return {'ok': True, 'status_code': response.status_code, 'final_url': response.url, 'content_type': response.headers.get('content-type',''), 'text': response.text, 'error': ''}
    except Exception as exc:
        return {'ok': False, 'status_code': None, 'final_url': url, 'content_type': '', 'text': '', 'error': str(exc)}

def sitemap_urls(xml_text):
    urls = []
    try:
        root = ET.fromstring(xml_text)
        for node in root.iter():
            if node.tag.endswith('loc') and node.text:
                urls.append(node.text.strip())
    except Exception:
        pass
    return urls

def extract_page(url, html, keywords):
    soup = BeautifulSoup(html, 'lxml')
    title = clean_text(soup.title.get_text()) if soup.title else ''
    meta_description = ''
    meta = soup.find('meta', attrs={'name': 'description'})
    if meta and meta.get('content'):
        meta_description = clean_text(meta.get('content'))
    canonical = ''
    can = soup.find('link', rel=lambda v: v and 'canonical' in v)
    if can and can.get('href'):
        canonical = urljoin(url, can.get('href'))
    h1s = [clean_text(x.get_text(' ')) for x in soup.find_all('h1')]
    h2s = [clean_text(x.get_text(' ')) for x in soup.find_all('h2')]
    h3s = [clean_text(x.get_text(' ')) for x in soup.find_all('h3')]
    links, ctas = [], []
    for a in soup.find_all('a'):
        text = clean_text(a.get_text(' '))
        href = urljoin(url, a.get('href', '')) if a.get('href') else ''
        if href:
            links.append({'source_url': url, 'anchor_text': text, 'href': href})
        if text and any(k in text.lower() for k in CTA_KEYWORDS):
            ctas.append({'text': text, 'href': href})
    forms = []
    for form in soup.find_all('form'):
        fields = []
        for field in form.find_all(['input','select','textarea','button']):
            fields.append({
                'tag': field.name, 'type': field.get('type',''), 'name': field.get('name',''),
                'id': field.get('id',''), 'placeholder': field.get('placeholder',''),
                'aria_label': field.get('aria-label',''), 'value': field.get('value',''),
                'text': clean_text(field.get_text(' '))
            })
        forms.append({'action': urljoin(url, form.get('action','')) if form.get('action') else '', 'method': form.get('method',''), 'fields': fields})
    images = []
    for img in soup.find_all('img'):
        src = img.get('src','')
        if src:
            images.append({'source_url': url, 'src': urljoin(url, src), 'alt': clean_text(img.get('alt',''))})
    body_text = clean_text(soup.get_text(' '))
    sentences = [clean_text(x) for x in re.split(r'(?<=[.!?])\s+', body_text) if clean_text(x)]
    claim_hits = []
    for sentence in sentences:
        lower = sentence.lower()
        if any(k.lower() in lower for k in keywords):
            claim_hits.append(sentence[:1000])
    return {
        'url': url, 'title': title, 'meta_description': meta_description, 'canonical': canonical,
        'h1s': ' | '.join(h1s), 'h2s': ' | '.join(h2s), 'h3s': ' | '.join(h3s),
        'ctas_json': json.dumps(ctas, ensure_ascii=False), 'forms_json': json.dumps(forms, ensure_ascii=False),
        'claim_hits_json': json.dumps(claim_hits, ensure_ascii=False), 'word_count': len(body_text.split()),
        'text_sample': body_text[:3000], 'links_count': len(links), 'images_count': len(images)
    }, links, images, claim_hits

def load_lines(path):
    if not path:
        return []
    p = Path(path)
    if not p.exists():
        return []
    return [line.strip() for line in p.read_text(encoding='utf-8').splitlines() if line.strip() and not line.strip().startswith('#')]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', required=True)
    parser.add_argument('--seeds', nargs='*', default=[])
    parser.add_argument('--seeds-file', default='')
    parser.add_argument('--keywords-file', default='')
    parser.add_argument('--project-id', default='')
    parser.add_argument('--industry', default='')
    parser.add_argument('--desired-outcome', default='')
    parser.add_argument('--target-action', default='')
    parser.add_argument('--max-pages', type=int, default=250)
    parser.add_argument('--delay', type=float, default=1.2)
    args = parser.parse_args()

    seeds = args.seeds + load_lines(args.seeds_file)
    seeds = [s for s in seeds if s.startswith('http://') or s.startswith('https://')]
    if not seeds:
        raise SystemExit('No valid seed URLs supplied.')
    keywords = list(dict.fromkeys(DEFAULT_KEYWORDS + load_lines(args.keywords_file)))
    out = Path(args.out)
    raw_dir = out / 'raw_html'
    raw_dir.mkdir(parents=True, exist_ok=True)
    allowed_domains = allowed_domains_from_seeds(seeds)
    queue, seen = [], set()
    for seed in seeds:
        result = fetch(seed)
        if result['ok'] and ('xml' in result['content_type'].lower() or seed.endswith('.xml')):
            queue.extend(sitemap_urls(result['text']))
        else:
            queue.append(seed)
    pages, all_links, all_images, all_claims = [], [], [], []
    while queue and len(pages) < args.max_pages:
        url = queue.pop(0).split('#')[0]
        if not url or url in seen:
            continue
        seen.add(url)
        if not is_allowed(url, allowed_domains):
            continue
        result = fetch(url)
        print(f"{result['status_code']} {url}")
        row = {'project_id': args.project_id, 'industry': args.industry, 'desired_outcome': args.desired_outcome, 'target_action': args.target_action, 'requested_url': url, 'final_url': result['final_url'], 'http_status': result['status_code'], 'content_type': result['content_type'], 'error': result['error']}
        if result['ok'] and result['text']:
            raw_path = raw_dir / safe_filename(url)
            raw_path.write_text(result['text'], encoding='utf-8', errors='ignore')
            row['raw_html_file'] = str(raw_path)
        if result['ok'] and result['status_code'] == 200 and 'html' in result['content_type'].lower():
            extracted, links, images, claim_hits = extract_page(result['final_url'], result['text'], keywords)
            row.update(extracted)
            all_links.extend(links)
            all_images.extend(images)
            for claim in claim_hits:
                all_claims.append({'project_id': args.project_id, 'source_url': result['final_url'], 'claim_or_relevant_sentence': claim, 'keywords_matched': ', '.join([k for k in keywords if k.lower() in claim.lower()])})
            for link in links:
                href = link['href'].split('#')[0]
                if is_allowed(href, allowed_domains) and href not in seen and href not in queue:
                    queue.append(href)
        pages.append(row)
        time.sleep(args.delay)
    pages_df, links_df, images_df, claims_df = pd.DataFrame(pages), pd.DataFrame(all_links), pd.DataFrame(all_images), pd.DataFrame(all_claims)
    pages_df.to_csv(out / 'partner_pages.csv', index=False)
    links_df.to_csv(out / 'partner_links.csv', index=False)
    images_df.to_csv(out / 'partner_images.csv', index=False)
    claims_df.to_csv(out / 'partner_claim_hits.csv', index=False)
    register_df = pd.DataFrame([{'project_id': args.project_id, 'question': q, 'answer_from_partner_site': '', 'source_url': '', 'exact_quote_or_sentence': '', 'confidence': 'Open', 'publish_status': 'Blocked until verified', 'notes': 'Leave open if not explicitly verified from source.'} for q in COMPLIANCE_QUESTIONS])
    register_df.to_csv(out / 'compliance_firewall_register.csv', index=False)
    gpt_prompt = f'''You are interpreting structured market discovery data.

Project ID: {args.project_id}
Industry: {args.industry}
Desired outcome: {args.desired_outcome}
Target action: {args.target_action}

Use only the generated CSV/XLSX source outputs:
- partner_pages.csv
- partner_links.csv
- partner_images.csv
- partner_claim_hits.csv
- compliance_firewall_register.csv

Do not invent facts. Mark unverified claims as Could not verify.
Extract offer model, CTA strategy, funnel structure, market positioning, compliance-sensitive claims, ads/social strategy, daily activity targets, risk variables, simulation assumptions, and Shopify build recommendations.

The math must come from the workbook/formula system. GPT may interpret, summarize, and recommend implementation.'''
    (out / 'gpt_market_discovery_prompt.txt').write_text(gpt_prompt, encoding='utf-8')
    with pd.ExcelWriter(out / 'partner_full_ingest.xlsx', engine='openpyxl') as writer:
        pages_df.to_excel(writer, sheet_name='Pages', index=False)
        links_df.to_excel(writer, sheet_name='Links', index=False)
        images_df.to_excel(writer, sheet_name='Images', index=False)
        claims_df.to_excel(writer, sheet_name='Claim Hits', index=False)
        register_df.to_excel(writer, sheet_name='Compliance Register', index=False)
    summary = {'project_id': args.project_id, 'pages_scanned': len(pages_df), 'links_found': len(links_df), 'images_found': len(images_df), 'claim_hits_found': len(claims_df), 'output_folder': str(out)}
    (out / 'crawl_summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
    print(json.dumps(summary, indent=2))

if __name__ == '__main__':
    main()
