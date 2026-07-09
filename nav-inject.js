/* DRILL-Q Nav Injector — Light Theme
   Автоматически добавляет навигацию и футер DRILL-Q на любую страницу инструмента */
(function () {
  'use strict';

  /* ── CSS ── */
  var CSS = [
    '@keyframes dq-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}',

    '.dq-nav{position:sticky!important;top:0!important;z-index:99999!important;' +
    'background:rgba(255,255,255,0.92)!important;' +
    'backdrop-filter:saturate(180%) blur(20px)!important;' +
    '-webkit-backdrop-filter:saturate(180%) blur(20px)!important;' +
    'border-bottom:1px solid rgba(0,0,0,0.08)!important;' +
    'height:56px!important;display:flex!important;align-items:center!important;' +
    'padding:0 48px!important;justify-content:space-between!important;' +
    'font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",Arial,sans-serif!important;' +
    'box-sizing:border-box!important;}',

    '.dq-nav *{box-sizing:border-box;font-family:inherit;}',

    '.dq-nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;}',
    '.dq-nav-mark{width:30px;height:30px;border-radius:8px;background:#2563EB;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;letter-spacing:-.5px;flex-shrink:0;}',
    '.dq-nav-name{font-size:17px;font-weight:700;color:#1D1D1F;letter-spacing:-.5px;}',
    '.dq-nav-name span{color:#2563EB;}',

    '.dq-nav-links{display:flex;align-items:center;list-style:none;margin:0;padding:0;}',
    '.dq-nav-links a{color:#6E6E73;text-decoration:none;font-size:14px;padding:6px 14px;border-radius:8px;transition:all .15s;display:flex;align-items:center;gap:5px;}',
    '.dq-nav-links a:hover{color:#1D1D1F;background:rgba(0,0,0,0.04);}',
    '.dq-nav-dot{display:inline-block;width:5px;height:5px;background:#16A34A;border-radius:50%;animation:dq-pulse 2.5s ease-in-out infinite;flex-shrink:0;}',

    '.dq-nav-right{display:flex;align-items:center;gap:10px;flex-shrink:0;}',
    '.dq-btn-nav{padding:7px 18px;border-radius:20px;border:none;background:#2563EB;color:#fff;font-size:14px;font-weight:500;cursor:pointer;text-decoration:none;transition:all .2s;white-space:nowrap;}',
    '.dq-btn-nav:hover{background:#1D4ED8;box-shadow:0 4px 12px rgba(37,99,235,.3);}',

    '.dq-footer{background:#0C0C1B;border-top:1px solid rgba(255,255,255,.08);padding:48px;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",Arial,sans-serif;}',
    '.dq-footer *{box-sizing:border-box;}',
    '.dq-footer a{color:rgba(255,255,255,.55);text-decoration:none;transition:color .15s;}',
    '.dq-footer a:hover{color:rgba(255,255,255,.97);}',
    '.dq-fg{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;margin-bottom:40px;}',
    '.dq-f-logo{display:inline-flex;align-items:center;gap:12px;text-decoration:none;margin-bottom:16px;}',
    '.dq-f-logo-mark{width:28px;height:28px;background:#2563EB;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;letter-spacing:-.5px;flex-shrink:0;}',
    '.dq-f-logo-name{font-size:14px;font-weight:600;color:rgba(255,255,255,.97);letter-spacing:-.02em;}',
    '.dq-f-desc{font-size:12px;color:rgba(255,255,255,.55);line-height:1.7;max-width:240px;}',
    '.dq-fc h4{font-size:10px;font-weight:600;color:rgba(255,255,255,.35);letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px;}',
    '.dq-fc ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px;}',
    '.dq-fc ul li a{font-size:13px;}',
    '.dq-fb{display:flex;justify-content:space-between;align-items:center;padding-top:24px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;color:rgba(255,255,255,.35);}',
    '.dq-fl{display:flex;gap:20px;}',

    '.nexus-top-shell{display:none!important;}',
    '.app>.top{top:56px!important;}',

    '@media(max-width:768px){.dq-nav{padding:0 16px!important;}.dq-nav-links{display:none!important;}.dq-footer{padding:32px 16px;}.dq-fg{grid-template-columns:1fr;gap:24px;}}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.id = 'dq-inject-styles';
  styleEl.textContent = CSS;
  document.head.insertBefore(styleEl, document.head.firstChild);

  /* Google Fonts */
  if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
    var fl = document.createElement('link');
    fl.rel = 'stylesheet';
    fl.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
    document.head.appendChild(fl);
  }

  /* ── BUILD ELEMENTS ── */
  function mkNav() {
    var n = document.createElement('nav');
    n.className = 'dq-nav';
    n.innerHTML =
      '<a class="dq-nav-logo" href="../index.html">' +
        '<div class="dq-nav-mark">DQ</div>' +
        '<div class="dq-nav-name">DRILL<span>-Q</span></div>' +
      '</a>' +
      '<ul class="dq-nav-links">' +
        '<li><a href="../index.html">Платформа</a></li>' +
        '<li><a href="../tools-home.html"><span class="dq-nav-dot"></span>Инструменты</a></li>' +
        '<li><a href="../catalog-ru.html">Химия</a></li>' +
        '<li><a href="../proposal-ru.html">Тендеры</a></li>' +
      '</ul>' +
      '<div class="dq-nav-right">' +
        '<a class="dq-btn-nav" href="../proposal-ru.html">Запросить доступ</a>' +
      '</div>';
    return n;
  }

  function mkFooter() {
    var f = document.createElement('footer');
    f.className = 'dq-footer';
    f.innerHTML =
      '<div class="dq-fg">' +
        '<div>' +
          '<a class="dq-f-logo" href="../index.html">' +
            '<div class="dq-f-logo-mark">DQ</div>' +
            '<div class="dq-f-logo-name">DRILL-Q</div>' +
          '</a>' +
          '<p class="dq-f-desc">Инженерная платформа для буровых проектов. 90+ инструментов: расчёты, AI, тендеры, базы знаний, дашборды.</p>' +
        '</div>' +
        '<div class="dq-fc"><h4>Платформа</h4><ul>' +
          '<li><a href="../index.html">DRILL-Q</a></li>' +
          '<li><a href="../catalog-ru.html">Химия</a></li>' +
          '<li><a href="../proposal-ru.html">Тендеры</a></li>' +
          '<li><a href="../tools-home.html">Инструменты</a></li>' +
        '</ul></div>' +
        '<div class="dq-fc"><h4>Инструменты</h4><ul>' +
          '<li><a href="85_lcm_calculator.html">LCM Калькулятор</a></li>' +
          '<li><a href="41_dfg_drilling_fluids_hydraulics_lab.html">DFG Гидравлика</a></li>' +
          '<li><a href="80_ai_assistant_chat.html">AI Помощник</a></li>' +
          '<li><a href="vankor_dwop.html">DWOP Ванкор</a></li>' +
        '</ul></div>' +
        '<div class="dq-fc"><h4>Клото</h4><ul>' +
          '<li><a href="../tools-home.html">Все инструменты</a></li>' +
          '<li><a href="../proposal-ru.html">Запрос доступа</a></li>' +
          '<li><a href="mailto:arcticdf@gmail.com">arcticdf@gmail.com</a></li>' +
        '</ul></div>' +
      '</div>' +
      '<div class="dq-fb">' +
        '<span>© 2025 ООО «КЛОТО» · DRILL-Q Platform · Архангельск</span>' +
        '<div class="dq-fl">' +
          '<a href="../index.html">Платформа</a>' +
          '<a href="../catalog-ru.html">Химия</a>' +
          '<a href="../tools-home.html">Инструменты</a>' +
        '</div>' +
      '</div>';
    return f;
  }

  /* ── INJECT ── */
  function inject() {
    var body = document.body;
    if (!body || document.getElementById('dq-nav-injected')) return;

    var nav = mkNav();
    nav.id = 'dq-nav-injected';
    var footer = mkFooter();

    /* Insert nav before first child (ticker removed) */
    body.insertBefore(nav, body.firstChild);

    /* Append footer */
    body.appendChild(footer);

    /* Hide duplicate page-level navbars used by old docs */
    var navSelectors = [
      'div.topbar',
      'header.topbar',
      'header.top',
      '.wrap > nav',
      '.wrap > header',
      '.shell > .topbar',
    ];
    document.querySelectorAll(navSelectors.join(',')).forEach(function (el) {
      if (el !== nav && el.querySelectorAll('a').length >= 1) {
        el.style.display = 'none';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();