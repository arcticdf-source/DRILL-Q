(function () {
  if (window.__nexusAuthWidgetInitialized) {
    return;
  }
  window.__nexusAuthWidgetInitialized = true;

  var STORAGE_LANG = 'site_lang';

  function getSiteLang() {
    try {
      return localStorage.getItem(STORAGE_LANG) === 'en' ? 'en' : 'ru';
    } catch (error) {
      return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'ru';
    }
  }

  function syncLanguageButtons(lang) {
    var buttons = document.querySelectorAll('.nexus-locale-btn[data-lang]');
    buttons.forEach(function (button) {
      var isActive = button.getAttribute('data-lang') === lang;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function applySiteLang(lang, options) {
    var normalized = lang === 'en' ? 'en' : 'ru';
    var config = options || {};

    if (config.persist !== false) {
      try {
        localStorage.setItem(STORAGE_LANG, normalized);
      } catch (error) {
        // Ignore storage errors and still update the page state.
      }
    }

    document.documentElement.setAttribute('lang', normalized);
    syncLanguageButtons(normalized);

    if (config.dispatch !== false) {
      window.dispatchEvent(
        new CustomEvent('nexus:lang-change', {
          detail: { lang: normalized }
        })
      );
    }
  }

  function getAuthPageHref(mode) {
    var path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    var baseHref = 'docs/65_my_wells_auth.html';

    if (path.indexOf('/docs/artifacts/') !== -1) {
      baseHref = '../65_my_wells_auth.html';
    } else if (path.indexOf('/docs/') !== -1) {
      baseHref = '65_my_wells_auth.html';
    }

    var currentParams = new URLSearchParams(window.location.search);
    var params = new URLSearchParams();
    var projectName = currentParams.get('name');

    if (projectName) {
      params.set('name', projectName);
    }
    if (mode === 'register') {
      params.set('mode', 'register');
    }

    var query = params.toString();
    return query ? baseHref + '?' + query : baseHref;
  }

  function getHomeHref() {
    var path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    if (path.indexOf('/docs/artifacts/') !== -1) {
      return '../../index.html';
    }
    if (path.indexOf('/docs/') !== -1) {
      return '../index.html';
    }
    return 'index.html';
  }

  function getFieldsHref() {
    var path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    if (path.indexOf('/docs/artifacts/') !== -1) {
      return '../56_fields_projects_dashboard.html';
    }
    if (path.indexOf('/docs/') !== -1) {
      return '56_fields_projects_dashboard.html';
    }
    return 'docs/56_fields_projects_dashboard.html';
  }

  function getSiteSearchHref(query) {
    var path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    var baseHref = 'docs/79_site_search.html';

    if (path.indexOf('/docs/artifacts/') !== -1) {
      baseHref = '../79_site_search.html';
    } else if (path.indexOf('/docs/') !== -1) {
      baseHref = '79_site_search.html';
    }

    if (!query || !query.trim()) {
      return baseHref;
    }

    return baseHref + '?q=' + encodeURIComponent(query.trim());
  }

  function getAdminDashboardHref() {
    var path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    var baseHref = 'docs/92_mudgpt_admin_dashboard.html';

    if (path.indexOf('/docs/artifacts/') !== -1) {
      baseHref = '../92_mudgpt_admin_dashboard.html';
    } else if (path.indexOf('/docs/') !== -1) {
      baseHref = '92_mudgpt_admin_dashboard.html';
    }

    return baseHref;
  }

  function getGlobalBrandLabel() {
    return 'NEXUS OILFIELD AI';
  }

  function normalizeText(text) {
    return (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function getAuth() {
    return window.NexusAuth || null;
  }

  function getSession() {
    var auth = getAuth();
    if (auth) {
      return auth.getSession();
    }

    try {
      var session = JSON.parse(localStorage.getItem('nexus-auth-session-v2') || 'null');
      return session && session.login ? session : null;
    } catch (error) {
      return null;
    }
  }

  function isAdminSession(session) {
    var auth = getAuth();
    if (auth) {
      return auth.isAdminSession(session);
    }
    return !!(session && (session.isAdmin === true || session.role === 'admin'));
  }

  function getMaterialsRole(session) {
    var auth = getAuth();
    if (auth && typeof auth.getMaterialsRole === 'function') {
      return auth.getMaterialsRole(session);
    }
    return isAdminSession(session) ? 'admin' : 'viewer';
  }

  var style = document.createElement('style');
  style.textContent = [
    ':root{--nexus-top-shell-height:0px;}',
    'body{padding-top:0!important;}',
    '.nexus-top-shell{position:relative;display:grid;grid-template-columns:auto minmax(320px,1fr) auto;gap:16px;align-items:center;padding:12px 14px;margin:10px 10px 0;border-radius:24px;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(245,248,251,.98));border:1px solid rgba(19,47,71,.12);box-shadow:0 16px 40px rgba(26,46,77,.08);backdrop-filter:blur(10px);z-index:9999;}',
    '.nexus-auth-widget{display:flex;gap:10px;flex-wrap:nowrap;justify-content:flex-start;align-items:center;max-width:min(100%,760px);}',
    '.nexus-site-header{display:flex;align-items:center;padding:0;min-height:auto;margin:0;background:transparent;border:none;box-shadow:none;backdrop-filter:none;}',
    '.nexus-site-header__brand{display:inline-flex;align-items:center;gap:12px;font-family:"Manrope",sans-serif;font-size:20px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#17324a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-decoration:none;}',
    '.nexus-site-header__dot{width:14px;height:14px;border-radius:999px;background:linear-gradient(135deg,#f0b562,#d38722);box-shadow:0 0 0 5px rgba(211,135,34,.12);flex:0 0 auto;}',
    '.nexus-assistant-entry{display:flex;align-items:center;gap:10px;min-width:0;padding:6px 8px 6px 12px;border-radius:18px;border:1px solid rgba(19,47,71,.1);background:linear-gradient(180deg,#ffffff,#f4f7fa);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);}',
    '.nexus-assistant-entry__pill{display:inline-flex;align-items:center;gap:8px;padding:0 12px;height:40px;border-radius:12px;background:rgba(14,116,144,.1);border:1px solid rgba(14,116,144,.16);font-family:"Manrope",sans-serif;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0e7490;white-space:nowrap;}',
    '.nexus-assistant-entry__pill-dot{width:9px;height:9px;border-radius:999px;background:linear-gradient(135deg,#49a4bc,#0e7490);box-shadow:0 0 0 4px rgba(14,116,144,.14);}',
    '.nexus-assistant-entry__input{flex:1 1 auto;min-width:0;height:40px;border:none;outline:none;background:transparent;color:#17324a;font-family:"Manrope",sans-serif;font-size:14px;font-weight:700;padding:0 8px;}',
    '.nexus-assistant-entry__input::placeholder{color:rgba(97,116,135,.8);}',
    '.nexus-assistant-entry__submit{appearance:none;border:1px solid rgba(181,111,22,.42);min-height:40px;padding:0 16px;border-radius:12px;background:linear-gradient(135deg,#d38b28,#b56f16);color:#fff;font-family:"Manrope",sans-serif;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;box-shadow:0 10px 24px rgba(181,111,22,.16);transition:transform .18s ease,box-shadow .18s ease;}',
    '.nexus-assistant-entry__submit:hover{transform:translateY(-1px);box-shadow:0 14px 28px rgba(181,111,22,.22);}',
    '.nexus-auth-widget a,.nexus-auth-widget button{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:12px;text-decoration:none;font-family:"Manrope",sans-serif;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;box-shadow:none;}',
    '.nexus-global-link{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border-radius:12px;text-decoration:none;font-family:"Manrope",sans-serif;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#17324a;background:#fff;border:1px solid rgba(19,47,71,.12);white-space:nowrap;}',
    '.nexus-global-link--fields{min-height:50px;padding:0 24px;font-size:15px;letter-spacing:.04em;border-radius:16px;background:linear-gradient(135deg,#d38b28,#b56f16);border-color:rgba(181,111,22,.42);color:#fff;box-shadow:0 12px 28px rgba(181,111,22,.18);}',
    '.nexus-auth-login{color:#fff;background:linear-gradient(135deg,#29816b,#1f6b58);border:1px solid rgba(31,107,88,.38);}',
    '.nexus-auth-admin{color:#17324a;background:#eef4f8;border:1px solid rgba(19,47,71,.12);}',
    '.nexus-auth-register{color:#fff;background:linear-gradient(135deg,#d38b28,#b56f16);border:1px solid rgba(181,111,22,.42);}',
    '.nexus-auth-logout{appearance:none;cursor:pointer;color:#fff;background:linear-gradient(135deg,#d38b28,#b56f16);border:1px solid rgba(181,111,22,.42);}',
    '.nexus-user-badge{display:inline-flex;align-items:center;gap:8px;min-height:42px;padding:0 14px;border-radius:12px;border:1px solid rgba(19,47,71,.12);background:#fff;font-family:"Manrope",sans-serif;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#17324a;white-space:nowrap;}',
    '.nexus-user-badge__role{display:inline-flex;align-items:center;justify-content:center;min-height:26px;padding:0 10px;border-radius:999px;background:rgba(14,116,144,.1);border:1px solid rgba(14,116,144,.18);color:#0e7490;font-size:11px;}',
    '#nexusAuthState{display:flex;gap:10px;align-items:center;flex-wrap:nowrap;}',
    '.nexus-brand-source{display:none!important;}',
    '.nexus-empty-top{display:none!important;}',
    '.top,.topbar,header.top,nav.top,div.top,section.top,.page-actions,.floating-toolbar,.sticky-toolbar,.sticky-strip{position:static!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;transform:none!important;}',
    '.top,.topbar,header.top,nav.top,div.top,section.top,.page-actions{margin-top:0!important;}',
    '@media (max-width: 1120px){.nexus-top-shell{grid-template-columns:1fr;gap:12px;}.nexus-auth-widget{justify-content:flex-start;}.nexus-site-header__brand{font-size:18px;}}',
    '@media (max-width: 720px){.nexus-top-shell{margin:8px 8px 0;padding:10px;}.nexus-assistant-entry{flex-wrap:wrap;}.nexus-assistant-entry__pill{width:100%;justify-content:center;}.nexus-assistant-entry__submit,.nexus-auth-widget a,.nexus-global-link,.nexus-auth-widget button{flex:1 1 auto;min-width:120px;}#nexusAuthState{width:100%;flex-wrap:wrap;}.nexus-auth-widget{flex-wrap:wrap;}.nexus-global-link--fields{width:100%;}}'
  ].join('');
  document.head.appendChild(style);

  var shell = document.createElement('div');
  shell.className = 'nexus-top-shell';
  shell.innerHTML = [
    '<div class="nexus-site-header">',
    '<a class="nexus-site-header__brand" href="' + getHomeHref() + '">',
    '<span class="nexus-site-header__dot" aria-hidden="true"></span>',
    '<span>' + getGlobalBrandLabel() + '</span>',
    '</a>',
    '</div>',
    '<form class="nexus-assistant-entry" id="nexusAssistantEntry" aria-label="AI assistant prompt">',
    '<span class="nexus-assistant-entry__pill"><span class="nexus-assistant-entry__pill-dot" aria-hidden="true"></span><span>Поиск по сайту</span></span>',
    '<input class="nexus-assistant-entry__input" id="nexusAssistantPrompt" type="text" placeholder="Введите: гидравлика, месторождение, расчет, растворы, solids..." autocomplete="off" />',
    '<button class="nexus-assistant-entry__submit" type="submit">Найти</button>',
    '</form>',
    '<div class="nexus-auth-widget">',
    '<a class="nexus-global-link" href="' + getHomeHref() + '">На главную</a>',
    '<a class="nexus-global-link nexus-global-link--fields" href="' + getFieldsHref() + '">Мои месторождения</a>',
    '<div id="nexusAuthState"></div>',
    '</div>'
  ].join('');

  if (document.body.firstChild) {
    document.body.insertBefore(shell, document.body.firstChild);
  } else {
    document.body.appendChild(shell);
  }

  document.querySelectorAll('.brand').forEach(function (brandNode) {
    var brandText = normalizeText(brandNode.textContent);
    if (brandText.indexOf('nexus oilfield ai') === -1) {
      return;
    }

    brandNode.classList.add('nexus-brand-source');

    var container = brandNode.closest('.top, .topbar, header.top, nav.top, div.top, section.top');
    if (!container) {
      return;
    }

    if (container.children.length === 1) {
      container.classList.add('nexus-empty-top');
    }
  });

  var assistantEntry = shell.querySelector('#nexusAssistantEntry');
  var assistantPrompt = shell.querySelector('#nexusAssistantPrompt');
  var authState = shell.querySelector('#nexusAuthState');

  function syncShellHeight() {
    document.documentElement.style.setProperty('--nexus-top-shell-height', shell.offsetHeight + 'px');
  }

  function renderAuthState() {
    var session = getSession();

    if (!authState) {
      return;
    }

    if (!session) {
      authState.innerHTML = [
        '<a class="nexus-auth-login" href="' + getAuthPageHref('login') + '">Войти</a>',
        '<a class="nexus-auth-register" href="' + getAuthPageHref('register') + '">Зарегистрироваться</a>'
      ].join('');
      return;
    }

    if (getMaterialsRole(session) === 'admin') {
      authState.innerHTML = [
        '<a class="nexus-auth-admin" href="' + getAdminDashboardHref() + '">Admin</a>',
        '<a class="nexus-auth-login" href="' + getAuthPageHref('login') + '">Аккаунт</a>',
        '<button class="nexus-auth-logout" id="nexusAuthLogoutBtn" type="button">Выйти</button>'
      ].join('');
    } else {
      authState.innerHTML = [
        '<span class="nexus-user-badge">',
        '<span>' + (session.login || 'user') + '</span>',
        '<span class="nexus-user-badge__role">' + (getMaterialsRole(session) === 'editor' ? 'Editor' : 'Viewer') + '</span>',
        '</span>',
        '<a class="nexus-auth-login" href="' + getAuthPageHref('login') + '">Аккаунт</a>',
        '<button class="nexus-auth-logout" id="nexusAuthLogoutBtn" type="button">Выйти</button>'
      ].join('');
    }

    var logoutBtn = authState.querySelector('#nexusAuthLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        var auth = getAuth();
        if (auth) {
          auth.clearSession();
        } else {
          localStorage.removeItem('nexus-auth-session-v2');
          window.dispatchEvent(
            new CustomEvent('nexus:session-change', {
              detail: { session: null }
            })
          );
        }
        renderAuthState();
      });
    }
  }

  if (assistantEntry && assistantPrompt) {
    assistantEntry.addEventListener('submit', function (event) {
      event.preventDefault();
      window.location.href = getSiteSearchHref(assistantPrompt.value);
      assistantPrompt.value = '';
    });
  }

  window.addEventListener('resize', syncShellHeight);

  window.addEventListener('storage', function (event) {
    if (event.key === STORAGE_LANG) {
      applySiteLang(event.newValue === 'en' ? 'en' : 'ru', { persist: false, dispatch: true });
    }
  });

  window.addEventListener('nexus:session-change', function () {
    renderAuthState();
  });

  applySiteLang(getSiteLang(), { persist: false, dispatch: false });
  renderAuthState();
  syncShellHeight();
})();
