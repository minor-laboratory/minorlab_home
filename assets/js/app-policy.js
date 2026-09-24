(() => {
  const SUPABASE_URL = 'https://rfgljhekqxphguooidjj.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmZ2xqaGVrcXhwaGd1b29pZGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1Njc0NjEsImV4cCI6MjA1MjE0MzQ2MX0.UdPVYMMF4vk8_rX634AzyWiSt4CYa05n3cPNaEPqt4I';
  const page = document.querySelector('[data-policy-page]');

  if (!page) return;

  const copy = {
    ko: {
      loading: '문서를 불러오는 중...',
      updated: '최종 수정일',
      effective: '시행일',
      errorTitle: '문서를 불러올 수 없습니다',
      errorDescription: '잠시 후 다시 시도해 주세요.'
    },
    en: {
      loading: 'Loading document...',
      updated: 'Last updated',
      effective: 'Effective date',
      errorTitle: 'Unable to load this document',
      errorDescription: 'Please try again later.'
    }
  };

  function locale() {
    const requested = new URLSearchParams(window.location.search).get('lang');
    if (requested === 'en' || requested === 'ko') return requested;
    return navigator.language.toLowerCase().startsWith('ko') ? 'ko' : 'en';
  }

  function setText(selector, value) {
    const element = page.querySelector(selector);
    if (element) element.textContent = value;
  }

  function applyLocale(language) {
    document.documentElement.lang = language;
    setText('[data-loading-label]', copy[language].loading);
    setText('[data-updated-label]', copy[language].updated);
    setText('[data-effective-label]', copy[language].effective);
    setText('[data-error-title]', copy[language].errorTitle);
    setText('[data-error-description]', copy[language].errorDescription);

    const languageLink = document.querySelector('.home-language');
    if (languageLink) {
      const nextLanguage = language === 'ko' ? 'en' : 'ko';
      languageLink.textContent = nextLanguage === 'ko' ? 'KR' : 'EN';
      languageLink.href = `${window.location.pathname}?lang=${nextLanguage}`;
      languageLink.hreflang = nextLanguage;
    }
  }

  function render(policy, language) {
    setText('[data-policy-title]', policy.title);
    setText('[data-policy-updated]', new Date(policy.updated_at).toLocaleDateString(language));
    setText('[data-policy-effective]', new Date(policy.effective_at).toLocaleDateString(language));

    const body = page.querySelector('[data-policy-body]');
    if (body) body.innerHTML = policy.content;

    page.querySelector('[data-policy-loading]')?.classList.add('hidden');
    page.querySelector('[data-policy-content]')?.classList.remove('hidden');
  }

  function showError(error) {
    console.error('Sleep 정책 문서 조회 실패:', error);
    page.querySelector('[data-policy-loading]')?.classList.add('hidden');
    page.querySelector('[data-policy-error]')?.classList.remove('hidden');
  }

  async function loadPolicy() {
    const language = locale();
    const country = language === 'ko' ? 'KR' : 'US';
    const params = new URLSearchParams({
      type: `eq.${page.dataset.policyType}`,
      target: 'cs.{sleep}',
      country: `eq.${country}`,
      is_active: 'eq.true',
      effective_at: `lte.${new Date().toISOString().slice(0, 10)}`,
      order: 'effective_at.desc,created_at.desc',
      limit: '1'
    });

    applyLocale(language);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/policies?${params}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const policies = await response.json();
    if (!policies.length) throw new Error('활성화된 Sleep 정책 문서가 없습니다.');
    render(policies[0], language);
  }

  loadPolicy().catch(showError);
})();
