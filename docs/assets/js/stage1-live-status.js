(function () {
  var SUMMARY_KEY = 'nexus_stage1_manager_summary_v1';
  var DESIGN_KEY = 'nexus_stage1_design_block_v1';
  var TRACKER_KEY = 'tracker_tasks';

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (error) {
      return null;
    }
  }

  function ensureStyles() {
    if (document.getElementById('stage1-live-status-styles')) {
      return;
    }

    var style = document.createElement('style');
    style.id = 'stage1-live-status-styles';
    style.textContent = [
      '.stage1-live-status{margin-top:16px;border:1px solid rgba(230,239,255,.08);border-radius:18px;background:linear-gradient(140deg,rgba(26,216,181,.08),rgba(7,12,21,.9) 45%,rgba(255,191,87,.07));box-shadow:0 20px 48px rgba(0,0,0,.34);padding:14px 16px;}',
      '.stage1-live-status__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;}',
      '.stage1-live-status__title{font-family:"Oswald",sans-serif;font-size:22px;letter-spacing:.05em;text-transform:uppercase;color:#edf5ff;}',
      '.stage1-live-status__copy{margin-top:6px;max-width:760px;color:#aac0d8;font-size:13px;line-height:1.45;}',
      '.stage1-live-status__pill{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;border:1px solid rgba(230,239,255,.1);background:rgba(255,255,255,.05);color:#dfe9f8;}',
      '.stage1-live-status__pill.ready{border-color:rgba(26,216,181,.35);background:rgba(26,216,181,.12);color:#96ecda;}',
      '.stage1-live-status__pill.conditional{border-color:rgba(255,191,87,.35);background:rgba(255,191,87,.12);color:#ffe1a0;}',
      '.stage1-live-status__pill.blocked{border-color:rgba(255,120,120,.35);background:rgba(255,120,120,.12);color:#ffbcbc;}',
      '.stage1-live-status__grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:14px;}',
      '.stage1-live-status__card{border:1px solid rgba(230,239,255,.08);border-radius:14px;background:rgba(255,255,255,.03);padding:12px;}',
      '.stage1-live-status__card span{font-size:10px;color:#9fb2ca;text-transform:uppercase;letter-spacing:.08em;}',
      '.stage1-live-status__card strong{display:block;margin-top:6px;font-size:22px;color:#edf5ff;}',
      '.stage1-live-status__lists{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px;}',
      '.stage1-live-status__box{border:1px solid rgba(230,239,255,.08);border-radius:14px;background:rgba(255,255,255,.025);padding:12px;}',
      '.stage1-live-status__box p{font-size:12px;color:#cddcf0;text-transform:uppercase;letter-spacing:.07em;font-weight:800;}',
      '.stage1-live-status__box ul{margin:10px 0 0;padding-left:18px;display:grid;gap:6px;font-size:12px;line-height:1.42;color:#c8d8eb;}',
      '.stage1-live-status__links{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;}',
      '.stage1-live-status__link{display:inline-flex;align-items:center;text-decoration:none;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;}',
      '.stage1-live-status__link.primary{color:#06241f;background:linear-gradient(135deg,#a0fff2,#22dec0);border:1px solid rgba(34,222,192,.82);}',
      '.stage1-live-status__link.secondary{color:#cddcf0;border:1px solid rgba(230,239,255,.08);background:rgba(255,255,255,.03);}',
      '@media (max-width: 980px){.stage1-live-status__grid,.stage1-live-status__lists{grid-template-columns:1fr;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function renderList(items, fallback) {
    var list = items && items.length ? items : [fallback];
    return list.map(function (item) {
      return '<li>' + item + '</li>';
    }).join('');
  }

  function buildMarkup() {
    var summary = readJson(SUMMARY_KEY);
    var design = readJson(DESIGN_KEY);
    var tasks = readJson(TRACKER_KEY) || [];
    var doneTasks = tasks.filter(function (task) { return task.status === 'done'; }).length;
    var trackerProgress = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
    var pillClass = summary && summary.status ? summary.status : 'blocked';
    var pillText = summary && summary.pill ? summary.pill : 'No-Go';
    var title = summary && summary.title ? summary.title : 'Stage 1 state not set';
    var copy = summary && summary.summary ? summary.summary : 'Заполни Stage 1 cockpit, чтобы все страницы Stage 1 показывали общий живой статус проекта.';
    var blockers = summary && summary.blockers ? summary.blockers : ['Нет синхронизированного readiness summary.'];
    var actions = summary && summary.actions ? summary.actions : ['Открой Stage 1 cockpit и зафиксируй статус проекта.'];

    return [
      '<section class="stage1-live-status">',
      '<div class="stage1-live-status__head">',
      '<div>',
      '<div class="stage1-live-status__title">Stage 1 Live Status</div>',
      '<div class="stage1-live-status__copy">' + copy + '</div>',
      '</div>',
      '<div class="stage1-live-status__pill ' + pillClass + '">' + pillText + '</div>',
      '</div>',
      '<div class="stage1-live-status__grid">',
      '<div class="stage1-live-status__card"><span>Readiness</span><strong>' + (summary ? summary.readinessScore + '%' : '0%') + '</strong></div>',
      '<div class="stage1-live-status__card"><span>Architecture Fit</span><strong>' + (design ? design.designFit + '%' : '0%') + '</strong></div>',
      '<div class="stage1-live-status__card"><span>Gate Status</span><strong>' + (summary ? summary.gateStatus + ' / ' + summary.gateTotal : '0 / 4') + '</strong></div>',
      '<div class="stage1-live-status__card"><span>Current Week</span><strong>' + (summary ? 'W' + summary.currentWeek : 'W1') + '</strong></div>',
      '<div class="stage1-live-status__card"><span>Tracker Progress</span><strong>' + trackerProgress + '%</strong></div>',
      '</div>',
      '<div class="stage1-live-status__lists">',
      '<div class="stage1-live-status__box"><p>Blockers</p><ul>' + renderList(blockers, 'Критичные блокеры не зафиксированы.') + '</ul></div>',
      '<div class="stage1-live-status__box"><p>Next Actions</p><ul>' + renderList(actions, 'Переходить к formal readiness review.') + '</ul></div>',
      '</div>',
      '<div class="stage1-live-status__links">',
      '<a class="stage1-live-status__link primary" href="19_drilling_stage_1_design.html">Stage 1 cockpit</a>',
      '<a class="stage1-live-status__link secondary" href="15_drilling_design_block.html">Design block</a>',
      '<a class="stage1-live-status__link secondary" href="20_drilling_stage_1_execution_playbook.html">Playbook</a>',
      '<a class="stage1-live-status__link secondary" href="artifacts/stage1_tracker.html">Tracker</a>',
      '</div>',
      '</section>'
    ].join('');
  }

  function mount() {
    ensureStyles();
    var existing = document.getElementById('stage1-live-status-root');
    if (existing) {
      existing.innerHTML = buildMarkup();
      return;
    }

    var rail = document.querySelector('.stage-rail');
    var host = document.createElement('div');
    host.id = 'stage1-live-status-root';
    host.innerHTML = buildMarkup();

    if (rail && rail.parentNode) {
      rail.parentNode.insertBefore(host, rail.nextSibling);
      return;
    }

    var hero = document.querySelector('.hero');
    if (hero && hero.parentNode) {
      hero.parentNode.insertBefore(host, hero);
    }
  }

  document.addEventListener('DOMContentLoaded', mount);
  window.addEventListener('storage', mount);
})();