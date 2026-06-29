/* DRILL-Q — простой клиентский экран входа.
   ВНИМАНИЕ: это слабая защита (пароль виден в исходном коде страницы и
   обходится технически). Подходит только как "забор" от случайных людей.
   Для настоящей защиты нужен Cloudflare Access или свой сервер с авторизацией.

   Сменить пароль: поменяйте значение SITE_PASSWORD ниже и запушьте на GitHub. */
(function () {
  'use strict';

  var SITE_PASSWORD = 'drillq2026';   // <-- смените на свой пароль
  var KEY = 'dq_site_auth_v1';

  // Уже авторизован в этой сессии — ничего не делаем
  try {
    if (sessionStorage.getItem(KEY) === 'ok') return;
  } catch (e) { /* sessionStorage недоступен — покажем экран */ }

  // Прячем содержимое страницы до ввода пароля
  var hideStyle = document.createElement('style');
  hideStyle.id = 'dq-gate-hide';
  hideStyle.textContent = 'body{display:none!important}';
  (document.head || document.documentElement).appendChild(hideStyle);

  function buildGate() {
    var overlay = document.createElement('div');
    overlay.id = 'dq-gate';
    overlay.innerHTML =
      '<div class="dq-gate-card">' +
        '<div class="dq-gate-logo"><span class="dq-gate-mark">DQ</span>' +
        '<span class="dq-gate-name">DRILL<span>-Q</span></span></div>' +
        '<h1>Доступ к платформе</h1>' +
        '<p>Введите пароль для входа на сайт.</p>' +
        '<form id="dq-gate-form" autocomplete="off">' +
          '<input type="password" id="dq-gate-input" placeholder="Пароль" autofocus>' +
          '<div class="dq-gate-err" id="dq-gate-err">Неверный пароль</div>' +
          '<button type="submit">Войти →</button>' +
        '</form>' +
      '</div>';

    var css = document.createElement('style');
    css.textContent = [
      '#dq-gate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;',
      'background:linear-gradient(160deg,#0A0C10,#111827);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;}',
      '.dq-gate-card{width:100%;max-width:380px;background:#fff;border-radius:20px;padding:40px 34px;box-shadow:0 30px 80px rgba(0,0,0,.5);text-align:center;}',
      '.dq-gate-logo{display:flex;align-items:center;justify-content:center;gap:9px;margin-bottom:22px;}',
      '.dq-gate-mark{width:32px;height:32px;border-radius:8px;background:#2563EB;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;letter-spacing:-.5px;}',
      '.dq-gate-name{font-size:18px;font-weight:700;color:#1D1D1F;letter-spacing:-.5px;}.dq-gate-name span{color:#2563EB;}',
      '.dq-gate-card h1{font-size:22px;font-weight:700;color:#1D1D1F;letter-spacing:-.4px;margin:0 0 8px;}',
      '.dq-gate-card p{font-size:14px;color:#6E6E73;margin:0 0 24px;line-height:1.5;}',
      '#dq-gate-input{width:100%;height:48px;padding:0 16px;border:1.5px solid rgba(0,0,0,.12);border-radius:12px;font-size:15px;color:#1D1D1F;outline:none;font-family:inherit;transition:border-color .15s,box-shadow .15s;}',
      '#dq-gate-input:focus{border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,.12);}',
      '.dq-gate-err{display:none;color:#DC2626;font-size:13px;margin-top:10px;text-align:left;}',
      '.dq-gate-err.show{display:block;}',
      '#dq-gate button{width:100%;margin-top:18px;padding:14px;border:none;border-radius:12px;background:#2563EB;color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .15s;}',
      '#dq-gate button:hover{background:#1D4ED8;}'
    ].join('');
    (document.head || document.documentElement).appendChild(css);
    document.documentElement.appendChild(overlay);

    var form = document.getElementById('dq-gate-form');
    var input = document.getElementById('dq-gate-input');
    var err = document.getElementById('dq-gate-err');
    input.focus();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value === SITE_PASSWORD) {
        try { sessionStorage.setItem(KEY, 'ok'); } catch (e) {}
        var hide = document.getElementById('dq-gate-hide');
        if (hide) hide.remove();
        overlay.remove();
      } else {
        err.classList.add('show');
        input.value = '';
        input.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildGate);
  } else {
    buildGate();
  }
})();
