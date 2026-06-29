/* DRILL-Q Nav Injector — Powered by Cloto
   Автоматически добавляет тикер, навигацию и футер DRILL-Q на любую страницу инструмента */
(function () {
  'use strict';

  /* ── CSS ── */
  var CSS = [
    '@keyframes dq-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}',
    '@keyframes dq-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}',

    '.dq-ticker{background:#0C0C1B;border-bottom:1px solid rgba(255,255,255,.08);padding:6px 0;overflow:hidden;white-space:nowrap;}',
    '.dq-ticker-track{display:inline-flex;gap:48px;animation:dq-ticker 60s linear infinite;}',
    '.dq-ti{display:inline-flex;align-items:center;gap:8px;font-size:11px;color:rgba(255,255,255,.35);font-family:"JetBrains Mono","SF Mono",monospace;}',
    '.dq-lbl{font-size:9px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.25);padding:1px 5px;border:1px solid rgba(255,255,255,.14);border-radius:3px;}',
    '.dq-sep{color:rgba(255,255,255,.22)!important;}',
    '.dq-up{color:#10B981!important;}.dq-bl{color:#3B82F6!important;}.dq-am{color:#F59E0B!important;}',

    '.dq-nav{position:sticky!important;top:0!important;z-index:99999!important;background:rgba(7,7,15,.94)!important;backdrop-filter:blur(24px) saturate(180%)!important;-webkit-backdrop-filter:blur(24px) saturate(180%)!important;border-bottom:1px solid rgba(255,255,255,.08)!important;padding:0 48px!important;height:54px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:24px!important;font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;box-sizing:border-box!important;}',
    '.dq-nav *{box-sizing:border-box;font-family:inherit;}',
    '.dq-nav-logo{display:flex;align-items:center;gap:12px;text-decoration:none;flex-shrink:0;}',
    '.dq-mk{width:28px;height:28px;background:#3B82F6;border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:"JetBrains Mono",monospace;font-weight:500;font-size:11px;color:#fff;letter-spacing:-.03em;flex-shrink:0;}',
    '.dq-wm{display:flex;flex-direction:column;gap:0;}',
    '.dq-wm-name{font-size:14px;font-weight:600;color:rgba(255,255,255,.97);letter-spacing:-.02em;line-height:1;}',
    '.dq-wm-sub{font-size:9px;color:rgba(255,255,255,.35);letter-spacing:.08em;text-transform:uppercase;line-height:1;margin-top:2px;}',
    '.dq-wm-sub span{color:#E05C10;}',
    '.dq-nav-links{display:flex;align-items:center;gap:2px;list-style:none;margin:0;padding:0;}',
    '.dq-nav-links a{color:rgba(255,255,255,.55);text-decoration:none;font-size:13px;font-weight:400;padding:5px 11px;border-radius:6px;transition:color .15s,background .15s;white-space:nowrap;display:flex;align-items:center;gap:5px;}',
    '.dq-nav-links a:hover{color:rgba(255,255,255,.97);background:rgba(255,255,255,.08);}',
    '.dq-nav-links a.dq-active{color:rgba(255,255,255,.97);font-weight:500;}',
    '.dq-nav-dot{display:inline-block;width:5px;height:5px;background:#10B981;border-radius:50%;animation:dq-pulse 2.5s ease-in-out infinite;flex-shrink:0;}',
    '.dq-nav-right{display:flex;align-items:center;gap:12px;flex-shrink:0;}',
    '.dq-lang{padding:4px 10px;border:1px solid rgba(255,255,255,.14);border-radius:999px;color:rgba(255,255,255,.55);font-size:11px;font-weight:500;text-decoration:none;letter-spacing:.04em;transition:all .15s;}',
    '.dq-lang:hover{border-color:rgba(255,255,255,.22);color:rgba(255,255,255,.8);}',
    '.dq-btn{padding:7px 16px;background:#3B82F6;border:1px solid #2563EB;border-radius:6px;color:#fff;font-size:13px;font-weight:500;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;transition:all .15s;}',
    '.dq-btn:hover{background:#2563EB;box-shadow:0 0 20px rgba(59,130,246,.3);}',

    '.dq-footer{background:#0C0C1B;border-top:1px solid rgba(255,255,255,.08);padding:48px;font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
    '.dq-footer *{box-sizing:border-box;}',
    /* Hide legacy Nexus Oilfield AI auth widget */
    '.nexus-top-shell{display:none!important;}',
    /* Push old sticky toolbars below injected DQ nav (~84px) */
    '.app>.top{top:84px!important;}',
    '.dq-fg{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;margin-bottom:40px;}',
    '.dq-f-logo{display:inline-flex;align-items:center;gap:12px;text-decoration:none;margin-bottom:16px;}',
    '.dq-f-desc{font-size:12px;color:rgba(255,255,255,.55);line-height:1.7;max-width:240px;}',
    '.dq-fc h4{font-size:10px;font-weight:600;color:rgba(255,255,255,.35);letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px;font-family:"JetBrains Mono",monospace;}',
    '.dq-fc ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px;}',
    '.dq-fc ul li a{font-size:13px;color:rgba(255,255,255,.55);text-decoration:none;transition:color .15s;}',
    '.dq-fc ul li a:hover{color:rgba(255,255,255,.97);}',
    '.dq-fb{display:flex;justify-content:space-between;align-items:center;padding-top:24px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;color:rgba(255,255,255,.35);font-family:"JetBrains Mono",monospace;}',
    '.dq-fl{display:flex;gap:20px;}',
    '.dq-fl a{color:rgba(255,255,255,.35);text-decoration:none;transition:color .15s;}',
    '.dq-fl a:hover{color:rgba(255,255,255,.8);}',

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
  function mkTicker() {
    var t = document.createElement('div');
    t.className = 'dq-ticker';
    var items = [
      ['DRILL-Q', 'bl', 'Платформа операционного интеллекта · 90+ инструментов'],
      ['·', 'sep', ''],
      ['КЛОТО', 'up', 'с 1991 · Архангельск · Буровые растворы и химия'],
      ['·', 'sep', ''],
      ['AI', 'bl', 'MudGPT · RAG-консоль · Decision Engine'],
      ['·', 'sep', ''],
      ['DRILL-Q', 'bl', 'Платформа операционного интеллекта · 90+ инструментов'],
      ['·', 'sep', ''],
      ['КЛОТО', 'up', 'с 1991 · Архангельск · Буровые растворы и химия'],
      ['·', 'sep', ''],
      ['AI', 'bl', 'MudGPT · RAG-консоль · Decision Engine'],
    ];
    var html = '<div class="dq-ticker-track">';
    items.forEach(function (it) {
      if (it[1] === 'sep') {
        html += '<span class="dq-ti dq-sep">·</span>';
      } else {
        html += '<span class="dq-ti"><span class="dq-lbl">' + it[0] + '</span><span class="dq-' + it[1] + '">' + it[2] + '</span></span>';
      }
    });
    html += '</div>';
    t.innerHTML = html;
    return t;
  }

  function mkNav() {
    var n = document.createElement('nav');
    n.className = 'dq-nav';
    n.innerHTML =
      '<a class="dq-nav-logo" href="../index-ru.html">' +
        '<div class="dq-mk">DQ</div>' +
        '<div class="dq-wm"><div class="dq-wm-name">DRILL-Q</div><div class="dq-wm-sub">powered by <span>cloto</span></div></div>' +
      '</a>' +
      '<ul class="dq-nav-links">' +
        '<li><a href="../index-ru.html">Платформа</a></li>' +
        '<li><a href="../catalog-ru.html">Химия</a></li>' +
        '<li><a href="../proposal-ru.html">Тендеры</a></li>' +
        '<li><a href="../tools-ru.html" class="dq-active"><span class="dq-nav-dot"></span>Инструменты</a></li>' +
      '</ul>' +
      '<div class="dq-nav-right">' +
        '<a class="dq-lang" href="#">EN</a>' +
        '<a class="dq-btn" href="../proposal-ru.html">Запросить доступ</a>' +
      '</div>';
    return n;
  }

  function mkFooter() {
    var f = document.createElement('footer');
    f.className = 'dq-footer';
    f.innerHTML =
      '<div class="dq-fg">' +
        '<div>' +
          '<a class="dq-f-logo" href="../index-ru.html">' +
            '<div class="dq-mk">DQ</div>' +
            '<div class="dq-wm"><div class="dq-wm-name">DRILL-Q</div><div class="dq-wm-sub">powered by <span>cloto</span></div></div>' +
          '</a>' +
          '<p class="dq-f-desc">Инженерная платформа для буровых проектов. 90+ инструментов: расчёты, AI, тендеры, базы знаний, дашборды.</p>' +
        '</div>' +
        '<div class="dq-fc"><h4>Платформа</h4><ul>' +
          '<li><a href="../index-ru.html">DRILL-Q</a></li>' +
          '<li><a href="../catalog-ru.html">Химия</a></li>' +
          '<li><a href="../proposal-ru.html">Тендеры</a></li>' +
          '<li><a href="../tools-ru.html">Инструменты</a></li>' +
        '</ul></div>' +
        '<div class="dq-fc"><h4>Инструменты</h4><ul>' +
          '<li><a href="87_mudgpt_chemicals_materials.html">MudGPT</a></li>' +
          '<li><a href="85_lcm_calculator.html">LCM Калькулятор</a></li>' +
          '<li><a href="41_dfg_drilling_fluids_hydraulics_lab.html">DFG Гидравлика</a></li>' +
          '<li><a href="80_ai_assistant_chat.html">AI Помощник</a></li>' +
        '</ul></div>' +
        '<div class="dq-fc"><h4>Клото</h4><ul>' +
          '<li><a href="../tools-ru.html">Все инструменты</a></li>' +
          '<li><a href="../proposal-ru.html">Запрос доступа</a></li>' +
          '<li><a href="mailto:arcticdf@gmail.com">arcticdf@gmail.com</a></li>' +
        '</ul></div>' +
      '</div>' +
      '<div class="dq-fb">' +
        '<span>© 2025 ООО «КЛОТО» · DRILL-Q Platform · Архангельск</span>' +
        '<div class="dq-fl">' +
          '<a href="../index-ru.html">Платформа</a>' +
          '<a href="../catalog-ru.html">Химия</a>' +
          '<a href="../tools-ru.html">Инструменты</a>' +
        '</div>' +
      '</div>';
    return f;
  }

  /* ── INJECT ── */
  function inject() {
    var body = document.body;
    if (!body || document.getElementById('dq-nav-injected')) return;

    var ticker = mkTicker();
    var nav = mkNav();
    nav.id = 'dq-nav-injected';
    var footer = mkFooter();

    /* Insert ticker + nav before first child */
    var first = body.firstChild;
    body.insertBefore(nav, first);
    body.insertBefore(ticker, nav);

    /* Append footer */
    body.appendChild(footer);

    /* Hide duplicate page-level navbars used by old docs */
    var navSelectors = [
      'div.topbar',           /* 87_, 29_, 82_ style topbars */
      'header.topbar',        /* header.topbar */
      'header.top',           /* header.top (26_master_roadmap...) */
      '.wrap > nav',          /* nav.rail direct child of .wrap (01_strategy...) */
      '.wrap > header',       /* any header in .wrap */
      '.shell > .topbar',     /* topbar in .shell */
      /* NOTE: .app > .top intentionally excluded — it contains functional tool buttons */
    ];
    document.querySelectorAll(navSelectors.join(',')).forEach(function (el) {
      if (el !== nav && el !== ticker && el.querySelectorAll('a').length >= 1) {
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
