/**
 * HealthTrack – Shared Utilities
 * Accessibility-first JavaScript
 * WCAG 2.1 Level AA compliant interactions
 */

/* ── Sidebar (mobile toggle) ── */
function initSidebar() {
  const sidebar   = document.querySelector('.sidebar');
  const overlay   = document.querySelector('.sidebar-overlay');
  const menuBtn   = document.querySelector('.mobile-menu-btn');
  if (!sidebar) return;

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('show');
    overlay.style.display = 'block';
    menuBtn.setAttribute('aria-expanded', 'true');
    // Move focus into sidebar for keyboard users
    const firstLink = sidebar.querySelector('a, button');
    if (firstLink) firstLink.focus();
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 200);
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.focus();
  }

  if (menuBtn)  menuBtn.addEventListener('click', openSidebar);
  if (overlay)  overlay.addEventListener('click', closeSidebar);

  // Close on Escape – WCAG 2.1.1
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });
}

/* ── Toast Notifications – WCAG 2.2.1 (auto-dismiss 5s, pause on hover) ── */
const ToastSystem = (() => {
  let region;

  function getRegion() {
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      region.setAttribute('aria-live', 'polite');   // WCAG 4.1.3 status messages
      region.setAttribute('aria-atomic', 'false');
      region.setAttribute('role', 'region');
      region.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(region);
    }
    return region;
  }

  // Map type to icon SVG + colour class
  const typeConfig = {
    success: { cls: 'alert-success', icon: iconCheck,   label: 'Success' },
    warning: { cls: 'alert-warning', icon: iconWarning, label: 'Warning' },
    error:   { cls: 'alert-error',   icon: iconError,   label: 'Error'   },
    info:    { cls: 'alert-info',    icon: iconInfo,    label: 'Info'    },
  };

  function show(type, title, body, duration = 5000) {
    const cfg = typeConfig[type] || typeConfig.info;
    const toast = document.createElement('div');
    toast.className = `toast alert ${cfg.cls}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <span class="alert-icon" aria-hidden="true">${cfg.icon()}</span>
      <div class="alert-content">
        <p class="alert-title">${escapeHtml(title)}</p>
        ${body ? `<p class="alert-body">${escapeHtml(body)}</p>` : ''}
      </div>
      <button
        class="alert-dismiss"
        aria-label="Dismiss ${cfg.label.toLowerCase()} notification: ${escapeHtml(title)}"
        type="button"
      >${iconX()}</button>
    `;

    const reg = getRegion();
    reg.appendChild(toast);

    let timer;
    // WCAG 2.2.1: pause auto-dismiss on hover/focus
    function startTimer() {
      timer = setTimeout(() => dismiss(toast), duration);
    }
    function pauseTimer() {
      clearTimeout(timer);
    }

    toast.addEventListener('mouseenter', pauseTimer);
    toast.addEventListener('mouseleave', startTimer);
    toast.addEventListener('focusin',    pauseTimer);
    toast.addEventListener('focusout',   startTimer);
    toast.querySelector('.alert-dismiss').addEventListener('click', () => dismiss(toast));

    startTimer();
    return toast;
  }

  function dismiss(toast) {
    toast.classList.add('dismissing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 300); // fallback
  }

  return { show };
})();

/* ── Alert dismiss (inline alerts) ── */
function initAlertDismiss() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.alert-dismiss');
    if (!btn) return;
    const alert = btn.closest('.alert');
    if (alert) {
      alert.style.transition = 'opacity 200ms ease';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 200);
    }
  });
}

/* ── Range slider with live numeric readout ── */
function initRangeSliders() {
  document.querySelectorAll('.form-range[data-output]').forEach(range => {
    const outputId = range.dataset.output;
    const output   = document.getElementById(outputId);
    if (!output) return;

    function update() {
      output.textContent = range.value;
      // Update aria-valuenow – WCAG 4.1.2
      range.setAttribute('aria-valuenow', range.value);
    }
    range.addEventListener('input', update);
    update(); // init
  });
}

/* ── Password show/hide toggle ── */
function initPasswordToggles() {
  document.querySelectorAll('.form-input-toggle[data-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(!isPassword));
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      const icon = btn.querySelector('svg use, svg');
      // swap icon content handled via class
      btn.classList.toggle('showing', !isPassword);
    });
  });
}

/* ── Form inline validation ── */
function initFormValidation(formId, onSubmitCallback) {
  const form = document.getElementById(formId);
  if (!form) return;

  const errorSummary = form.querySelector('.form-error-summary');
  const errorList    = form.querySelector('.form-error-summary ul');

  function validateField(input) {
    const group    = input.closest('.form-group');
    const errorEl  = group ? group.querySelector('[role="alert"]') : null;

    if (!input.checkValidity()) {
      input.classList.add('is-error');
      input.setAttribute('aria-invalid', 'true');
      if (errorEl) {
        errorEl.style.display = 'flex';
        const msgEl = errorEl.querySelector('.error-text');
        if (msgEl) msgEl.textContent = input.validationMessage || 'This field is required.';
      }
      return false;
    } else {
      input.classList.remove('is-error');
      input.setAttribute('aria-invalid', 'false');
      if (errorEl) errorEl.style.display = 'none';
      return true;
    }
  }

  // Live validation on blur
  form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('is-error')) validateField(input);
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    const errors = [];
    let firstError = null;

    inputs.forEach(input => {
      if (!validateField(input)) {
        const label = form.querySelector(`label[for="${input.id}"]`);
        const labelText = label ? label.textContent.replace('*', '').trim() : input.id;
        errors.push({ id: input.id, text: labelText });
        if (!firstError) firstError = input;
      }
    });

    if (errors.length > 0) {
      // Show error summary – WCAG 3.3.1 & 3.3.3
      if (errorSummary && errorList) {
        errorList.innerHTML = errors.map(err =>
          `<li><a href="#${err.id}">${escapeHtml(err.text)} – ${escapeHtml(
            document.getElementById(err.id)?.validationMessage || 'This field is required.'
          )}</a></li>`
        ).join('');
        errorSummary.style.display = 'block';
        errorSummary.focus(); // Move focus to summary – WCAG 2.4.3
      }
      if (firstError) firstError.focus();
    } else {
      if (errorSummary) errorSummary.style.display = 'none';
      if (onSubmitCallback) onSubmitCallback();
    }
  });
}

/* ── Chart toggle: show/hide data table alternative ── */
function initChartToggles() {
  document.querySelectorAll('[data-chart-toggle]').forEach(btn => {
    const targetId = btn.dataset.chartToggle;
    const target   = document.getElementById(targetId);
    if (!target) return;

    btn.addEventListener('click', () => {
      const isHidden = target.hidden;
      target.hidden  = !isHidden;
      btn.setAttribute('aria-expanded', String(isHidden));
      btn.textContent = isHidden ? 'Hide data table' : 'View as data table';
    });
  });
}

/* ── Focus management for modals ── */
function trapFocus(element) {
  const focusable = element.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  element.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* ── Simple HTML escape ── */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ── Inline SVG icon helpers ── */
function iconCheck() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
}
function iconWarning() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
}
function iconError() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
}
function iconInfo() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
}
function iconX() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
}

/* ── Init all on DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initAlertDismiss();
  initRangeSliders();
  initPasswordToggles();
  initChartToggles();
});
