import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
}

const sourceRoot = resolve(process.argv[2] || '../sleep/docs/legal');
const effectiveAt = '2026-09-24';

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function markdownToHtml(markdown) {
  const lines = markdown.trim().split('\n');
  const html = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) html.push('</ul>');
    listOpen = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      continue;
    }
    if (line.startsWith('### ')) {
      closeList();
      html.push(`<h2>${inlineMarkdown(line.slice(4))}</h2>`);
    } else if (line.startsWith('- ')) {
      if (!listOpen) html.push('<ul>');
      listOpen = true;
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
    } else if (/^\d+\. /.test(line)) {
      closeList();
      html.push(`<p>${inlineMarkdown(line)}</p>`);
    } else {
      closeList();
      html.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }
  closeList();
  return html.join('\n');
}

function splitLanguages(markdown) {
  const koreanMarker = '## 한국어';
  const englishMarker = '## English';
  const koreanStart = markdown.indexOf(koreanMarker);
  const englishStart = markdown.indexOf(englishMarker);

  if (koreanStart < 0 || englishStart < 0 || englishStart <= koreanStart) {
    throw new Error('정책 문서에서 한국어/영어 구역을 찾지 못했습니다.');
  }

  return {
    KR: markdown.slice(koreanStart + koreanMarker.length, englishStart).trim(),
    US: markdown.slice(englishStart + englishMarker.length).trim()
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${options.method || 'GET'} ${path}: ${response.status} ${detail}`);
  }

  const body = await response.text();
  return body ? JSON.parse(body) : null;
}

async function ensureSleepTarget() {
  const existing = await request('enums?type=eq.target&value=eq.sleep&select=id');
  if (existing.length) return;

  const types = await request('enum_types?type_name=eq.target&select=id&limit=1');
  if (!types.length) throw new Error('target enum type을 찾지 못했습니다.');

  await request('enum_values', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      type_id: types[0].id,
      value: 'sleep',
      label: 'Mera Sleep',
      description: 'Mera Sleep 앱',
      sort_order: 90,
      is_active: true
    })
  });
}

async function publishPolicy(policy) {
  const query = new URLSearchParams({
    type: `eq.${policy.type}`,
    country: `eq.${policy.country}`,
    target: 'cs.{sleep}',
    version: `eq.${policy.version}`,
    select: 'id'
  });
  const existing = await request(`policies?${query}`);

  if (existing.length) {
    await request(`policies?id=eq.${existing[0].id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(policy)
    });
    return 'updated';
  }

  await request('policies', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(policy)
  });
  return 'inserted';
}

async function main() {
  const privacy = splitLanguages(await readFile(resolve(sourceRoot, 'privacy-policy.md'), 'utf8'));
  const terms = splitLanguages(await readFile(resolve(sourceRoot, 'terms-of-use.md'), 'utf8'));

  await ensureSleepTarget();

  const definitions = [
    { type: 'privacy', country: 'KR', title: 'Mera Sleep 개인정보처리방침', content: privacy.KR },
    { type: 'privacy', country: 'US', title: 'Mera Sleep Privacy Policy', content: privacy.US },
    { type: 'terms', country: 'KR', title: 'Mera Sleep 이용약관', content: terms.KR },
    { type: 'terms', country: 'US', title: 'Mera Sleep Terms of Use', content: terms.US }
  ];

  for (const definition of definitions) {
    const policy = {
      ...definition,
      version: '1.0.0',
      content: markdownToHtml(definition.content),
      content_format: 'html',
      announced_at: effectiveAt,
      effective_at: effectiveAt,
      target: ['sleep'],
      target_clients: ['sleep'],
      platform: ['ios', 'android'],
      is_active: true
    };
    const result = await publishPolicy(policy);
    console.log(`${definition.type}/${definition.country}: ${result}`);
  }
}

main().catch((error) => {
  console.error('Sleep 정책 게시 실패:', error.message);
  process.exitCode = 1;
});
