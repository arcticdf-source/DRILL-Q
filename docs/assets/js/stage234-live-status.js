(function () {
  var STAGE2_KEY = 'nexus_stage2_pilot_tool_v1';
  var STAGE3_KEY = 'nexus_stage3_rollout_tool_v1';
  var STAGE4_KEY = 'nexus_stage4_autonomy_tool_v1';

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (error) {
      return null;
    }
  }

  function ensureStyles() {
    if (document.getElementById('stage234-live-status-styles')) {
      return;
    }

    var style = document.createElement('style');
    style.id = 'stage234-live-status-styles';
    style.textContent = [
      '.stage234-live-status{margin-top:16px;border:1px solid rgba(232,239,255,.08);border-radius:18px;background:linear-gradient(140deg,rgba(32,217,180,.08),rgba(8,13,22,.92) 45%,rgba(132,188,255,.08));box-shadow:0 20px 48px rgba(0,0,0,.34);padding:14px 16px;}',
      '.stage234-live-status__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;}',
      '.stage234-live-status__title{font-family:"Oswald",sans-serif;font-size:22px;letter-spacing:.05em;text-transform:uppercase;color:#edf5ff;}',
      '.stage234-live-status__copy{margin-top:6px;max-width:760px;color:#aac0d8;font-size:13px;line-height:1.45;}',
      '.stage234-live-status__pill{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;border:1px solid rgba(232,239,255,.1);background:rgba(255,255,255,.05);color:#dfe9f8;}',
      '.stage234-live-status__pill.ready{border-color:rgba(32,217,180,.35);background:rgba(32,217,180,.12);color:#98ecde;}',
      '.stage234-live-status__pill.conditional{border-color:rgba(255,198,99,.35);background:rgba(255,198,99,.12);color:#ffe0a0;}',
      '.stage234-live-status__pill.blocked{border-color:rgba(255,131,131,.35);background:rgba(255,131,131,.12);color:#ffbcbc;}',
      '.stage234-live-status__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px;}',
      '.stage234-live-status__card{border:1px solid rgba(232,239,255,.08);border-radius:14px;background:rgba(255,255,255,.03);padding:12px;}',
      '.stage234-live-status__card span{font-size:10px;color:#9fb2ca;text-transform:uppercase;letter-spacing:.08em;}',
      '.stage234-live-status__card strong{display:block;margin-top:6px;font-size:22px;color:#edf5ff;}',
      '.stage234-live-status__stages{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px;}',
      '.stage234-live-status__stage{border:1px solid rgba(232,239,255,.08);border-radius:14px;background:rgba(255,255,255,.025);padding:12px;}',
      '.stage234-live-status__stage p{margin:8px 0 0;font-size:12px;line-height:1.42;color:#c8d8eb;}',
      '.stage234-live-status__stagehead{display:flex;align-items:center;justify-content:space-between;gap:10px;}',
      '.stage234-live-status__stagehead strong{font-size:14px;color:#edf5ff;}',
      '.stage234-live-status__lists{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px;}',
      '.stage234-live-status__box{border:1px solid rgba(232,239,255,.08);border-radius:14px;background:rgba(255,255,255,.025);padding:12px;}',
      '.stage234-live-status__box p{font-size:12px;color:#cddcf0;text-transform:uppercase;letter-spacing:.07em;font-weight:800;}',
      '.stage234-live-status__box ul{margin:10px 0 0;padding-left:18px;display:grid;gap:6px;font-size:12px;line-height:1.42;color:#c8d8eb;}',
      '.stage234-live-status__links{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;}',
      '.stage234-live-status__link{display:inline-flex;align-items:center;text-decoration:none;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;}',
      '.stage234-live-status__link.primary{color:#06241f;background:linear-gradient(135deg,#a0fff2,#22dec0);border:1px solid rgba(34,222,192,.82);}',
      '.stage234-live-status__link.secondary{color:#cddcf0;border:1px solid rgba(232,239,255,.08);background:rgba(255,255,255,.03);}',
      '@media (max-width: 980px){.stage234-live-status__grid,.stage234-live-status__stages,.stage234-live-status__lists{grid-template-columns:1fr;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function statusClass(value) {
    return value || 'blocked';
  }

  function renderList(items, fallback) {
    var list = items && items.length ? items : [fallback];
    return list.map(function (item) {
      return '<li>' + item + '</li>';
    }).join('');
  }

  function stageCard(label, stage, href, metricLabel, metricValue) {
    var status = stage && stage.status ? stage.status : 'blocked';
    var pill = stage && stage.pill ? stage.pill : 'No data';
    var summary = stage && stage.summary ? stage.summary : 'Статус еще не зафиксирован.';
    return [
      '<div class="stage234-live-status__stage">',
      '<div class="stage234-live-status__stagehead">',
      '<strong>' + label + '</strong>',
      '<span class="stage234-live-status__pill ' + status + '">' + pill + '</span>',
      '</div>',
      '<p><strong>' + metricLabel + ':</strong> ' + metricValue + '</p>',
      '<p>' + summary + '</p>',
      '<div class="stage234-live-status__links"><a class="stage234-live-status__link secondary" href="' + href + '">Открыть</a></div>',
      '</div>'
    ].join('');
  }

  function buildMarkup() {
    var stage2 = readJson(STAGE2_KEY);
    var stage3 = readJson(STAGE3_KEY);
    var stage4 = readJson(STAGE4_KEY);
    var overallStatus = stage4 && stage4.status ? stage4.status : stage3 && stage3.status ? stage3.status : stage2 && stage2.status ? stage2.status : 'blocked';
    var overallPill = stage4 && stage4.pill ? stage4.pill : stage3 && stage3.pill ? stage3.pill : stage2 && stage2.pill ? stage2.pill : 'Chain not ready';
    var mainCopy = stage4 && stage4.summary ? stage4.summary : stage3 && stage3.summary ? stage3.summary : stage2 && stage2.summary ? stage2.summary : 'Заполни pilot, rollout и autonomy tools, чтобы вся daily цепочка Stages 2-4 показывала один живой статус.';
    var blockers = stage4 && stage4.blockers ? stage4.blockers : stage3 && stage3.blockers ? stage3.blockers : stage2 && stage2.blockers ? stage2.blockers : ['Нет синхронизированного статуса по Stages 2-4.'];
    var actions = stage4 && stage4.actions ? stage4.actions : stage3 && stage3.actions ? stage3.actions : stage2 && stage2.actions ? stage2.actions : ['Открой pilot operating tool и зафиксируй текущее состояние.'];

    return [
      '<section class="stage234-live-status">',
      '<div class="stage234-live-status__head">',
      '<div>',
      '<div class="stage234-live-status__title">Stages 2-4 Live Status</div>',
      '<div class="stage234-live-status__copy">' + mainCopy + '</div>',
      '</div>',
      '<div class="stage234-live-status__pill ' + statusClass(overallStatus) + '">' + overallPill + '</div>',
      '</div>',
      '<div class="stage234-live-status__grid">',
      '<div class="stage234-live-status__card"><span>Stage 2</span><strong>' + (stage2 ? stage2.readiness + '%' : '0%') + '</strong></div>',
      '<div class="stage234-live-status__card"><span>Stage 3</span><strong>' + (stage3 ? stage3.health + '%' : '0%') + '</strong></div>',
      '<div class="stage234-live-status__card"><span>Stage 4</span><strong>' + (stage4 ? stage4.health + '%' : '0%') + '</strong></div>',
      '<div class="stage234-live-status__card"><span>Current chain</span><strong>' + (stage4 ? 'Autonomy' : stage3 ? 'Rollout' : stage2 ? 'Pilot' : 'Pilot') + '</strong></div>',
      '</div>',
      '<div class="stage234-live-status__stages">',
      stageCard('Stage 2 · Pilot', stage2, '16_drilling_stage_2_pilot.html', 'Pilot readiness', stage2 ? stage2.readiness + '%' : '0%'),
      stageCard('Stage 3 · Scaling', stage3, '17_drilling_stage_3_scaling.html', 'Rollout health', stage3 ? stage3.health + '%' : '0%'),
      stageCard('Stage 4 · Autonomy', stage4, '18_drilling_stage_4_autonomous_ops.html', 'Autonomy health', stage4 ? stage4.health + '%' : '0%'),
      '</div>',
      '<div class="stage234-live-status__lists">',
      '<div class="stage234-live-status__box"><p>Current blockers</p><ul>' + renderList(blockers, 'Критичные blockers не зафиксированы.') + '</ul></div>',
      '<div class="stage234-live-status__box"><p>Next actions</p><ul>' + renderList(actions, 'Переходить к следующему operational шагу.') + '</ul></div>',
      '</div>',
      '<div class="stage234-live-status__links">',
      '<a class="stage234-live-status__link primary" href="16_drilling_stage_2_pilot.html">Pilot tool</a>',
      '<a class="stage234-live-status__link secondary" href="17_drilling_stage_3_scaling.html">Rollout tool</a>',
      '<a class="stage234-live-status__link secondary" href="18_drilling_stage_4_autonomous_ops.html">Autonomy tool</a>',
      '</div>',
      '</section>'
    ].join('');
  }

  function mount() {
    ensureStyles();
    var existing = document.getElementById('stage234-live-status-root');
    if (existing) {
      existing.innerHTML = buildMarkup();
      return;
    }

    var rail = document.querySelector('.stage-rail');
    var host = document.createElement('div');
    host.id = 'stage234-live-status-root';
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