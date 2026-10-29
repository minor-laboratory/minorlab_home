---
layout: null
---
{%- assign t = site.data.translations.ko -%}
// Wait for DOM and deferred scripts
document.addEventListener('DOMContentLoaded', async function() {
  // Wait for Supabase SDK (loaded with defer)
  let retries = 0;
  while (typeof supabase === 'undefined' && retries < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    retries++;
  }

  if (typeof supabase === 'undefined') {
    console.error('Supabase JS SDK failed to load after waiting');
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('error-state').classList.remove('hidden');
    document.getElementById('error-title').textContent = '시스템 오류';
    document.getElementById('error-description').textContent = '페이지를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.';
    return;
  }

  const SUPABASE_URL = 'https://rfgljhekqxphguooidjj.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmZ2xqaGVrcXhwaGd1b29pZGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1Njc0NjEsImV4cCI6MjA1MjE0MzQ2MX0.UdPVYMMF4vk8_rX634AzyWiSt4CYa05n3cPNaEPqt4I';

  const loadingState = document.getElementById('loading-state');
  const infoState = document.getElementById('info-state');
  const errorState = document.getElementById('error-state');
  const formState = document.getElementById('form-state');
  const successState = document.getElementById('success-state');
  const form = document.getElementById('reset-password-form');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const submitButton = document.getElementById('submit-button');

  // Supabase 클라이언트 생성
  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { detectSessionInUrl: false, persistSession: false, autoRefreshToken: false }
  });

  // URL에서 에러 확인 (query string)
  const urlParams = new URLSearchParams(window.location.search);


  // URL fragment에서 토큰 확인 (Implicit Flow)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  const tokenHash = hashParams.get('token_hash') || urlParams.get('token_hash');
  const error = hashParams.get('error') || urlParams.get('error');
  const errorCode = hashParams.get('error_code') || urlParams.get('error_code');
  // 인증 정보가 주소창, 방문 기록, 후속 요청에 남지 않도록 제거한다.
  window.history.replaceState(null, '', window.location.pathname);
  let recoveryReady = false;

  // 안내 페이지 표시 함수
  function showInfo() {
    loadingState.classList.add('hidden');
    infoState.classList.remove('hidden');
    errorState.classList.add('hidden');
    formState.classList.add('hidden');
    successState.classList.add('hidden');
  }

  // 에러 표시 함수
  function showError(title, description, showRetry = false) {
    loadingState.classList.add('hidden');
    infoState.classList.add('hidden');
    formState.classList.add('hidden');
    successState.classList.add('hidden');
    errorState.classList.remove('hidden');

    document.getElementById('error-title').textContent = title;
    document.getElementById('error-description').textContent = description;

    const retryButton = document.getElementById('retry-button');
    if (showRetry) {
      retryButton.classList.remove('hidden');
    } else {
      retryButton.classList.add('hidden');
    }
  }

  // 에러가 URL에 있는 경우 (만료 등)
  if (error) {
    if (errorCode === 'otp_expired') {
      showError('{{ t.reset_password.error_expired }}', '{{ t.reset_password.error_expired_desc }}');
    } else if (error === 'access_denied') {
      showError('{{ t.reset_password.error_already_used }}', '{{ t.reset_password.error_already_used_desc }}');
    } else {
      showError('{{ t.reset_password.error_unknown }}', '{{ t.reset_password.error_unknown_desc }}');
    }
    return;
  }

  // 메일 미리보기는 토큰을 소비하지 않는다. 실제 제출 시에만 검증한다.
  if (tokenHash || (accessToken && refreshToken && hashParams.get('type') === 'recovery')) {
    loadingState.classList.add('hidden');
    formState.classList.remove('hidden');
  } else {
    showInfo();
    return;
  }

  // 비밀번호 표시/숨김 토글
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.dataset.target;
      const input = document.getElementById(targetId);
      const eyeOpen = this.querySelectorAll('.eye-open');
      const eyeClosed = this.querySelectorAll('.eye-closed');

      if (input.type === 'password') {
        input.type = 'text';
        eyeOpen.forEach(el => el.classList.add('hidden'));
        eyeClosed.forEach(el => el.classList.remove('hidden'));
        this.setAttribute('aria-label', '{{ t.reset_password.hide_password }}');
      } else {
        input.type = 'password';
        eyeOpen.forEach(el => el.classList.remove('hidden'));
        eyeClosed.forEach(el => el.classList.add('hidden'));
        this.setAttribute('aria-label', '{{ t.reset_password.show_password }}');
      }
    });
  });

  // 실시간 validation
  function validateForm() {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const newPasswordError = document.getElementById('new-password-error');
    const confirmPasswordError = document.getElementById('confirm-password-error');

    let isValid = true;

    // 새 비밀번호 검증
    if (newPassword.length > 0 && newPassword.length < 6) {
      newPasswordError.textContent = '{{ t.reset_password.error_min_length }}';
      isValid = false;
    } else {
      newPasswordError.textContent = '';
    }

    // 비밀번호 확인 검증
    if (confirmPassword.length > 0 && newPassword !== confirmPassword) {
      confirmPasswordError.textContent = '{{ t.reset_password.error_not_match }}';
      isValid = false;
    } else {
      confirmPasswordError.textContent = '';
    }

    // 버튼 활성화/비활성화
    submitButton.disabled = !(newPassword.length >= 6 && newPassword === confirmPassword);
  }

  newPasswordInput.addEventListener('input', validateForm);
  confirmPasswordInput.addEventListener('input', validateForm);

  // 폼 제출 처리
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (submitButton.disabled) return;

    const newPassword = newPasswordInput.value;

    // 버튼 비활성화 및 로딩 표시
    submitButton.disabled = true;
    submitButton.textContent = '{{ t.reset_password.submitting }}';

    try {
      if (!recoveryReady) {
        const result = tokenHash
          ? await supabaseClient.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
          : await supabaseClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (result.error || !result.data.session) {
          console.error('비밀번호 재설정 인증 실패:', result.error?.code || 'missing_session');
          showError('{{ t.reset_password.error_expired }}', '{{ t.reset_password.error_expired_desc }}');
          return;
        }
        recoveryReady = true;
      }
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('비밀번호 변경 실패:', updateError.code || 'unknown');

        // 에러 메시지 처리
        let errorMessage = '{{ t.reset_password.error_unknown_desc }}';
        if (updateError.message.includes('weak')) {
          errorMessage = '{{ t.reset_password.error_weak_password_desc }}';
        } else if (updateError.message.includes('same')) {
          errorMessage = '{{ t.reset_password.error_same_password }}';
        }

        alert(errorMessage);
        submitButton.disabled = false;
        submitButton.textContent = '{{ t.reset_password.submit }}';
        return;
      }

      // 성공
      formState.classList.add('hidden');
      successState.classList.remove('hidden');

    } catch (error) {
      console.error('비밀번호 재설정 요청 실패:', error.name || 'network_error');
      alert('{{ t.reset_password.error_network_desc }}');
      submitButton.disabled = false;
      submitButton.textContent = '{{ t.reset_password.submit }}';
    }
  });
});
