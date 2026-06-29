(function () {
  var CHAT_STORAGE_KEY = 'nexus_ai_assistant_chat_v1';
  var BOOT_PROMPT_KEY = 'nexus_ai_chat_boot_prompt';
  var LOCAL_ENDPOINT = 'http://127.0.0.1:7240/ask-gpt';
  var KNOWLEDGE_REPORT_PATH = '../knowledge/index/ingest_report.json';
  var KNOWLEDGE_WATCH_INTERVAL_MS = 20000;
  var training = window.NEXUS_ASSISTANT_TRAINING || {
    starterPrompts: [],
    answerRules: [],
    domainKeywords: {},
    knowledgeNotes: [],
    analyticsFacts: {}
  };

  var state = {
    messages: [],
    chunks: [],
    catalog: [],
    profileIndex: [],
    profiles: [],
    loadedSources: [],
    endpointHealthy: false,
    knowledgeVersion: '',
    knowledgeWatchTimer: null,
    knowledgeRefreshInFlight: false
  };

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(text) {
    return (text || '').replace(/[&<>]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char];
    });
  }

  function escapeAttr(text) {
    return escapeHtml(text).replace(/"/g, '&quot;');
  }

  function normalize(text) {
    return (text || '').toLowerCase().replace(/[^a-zа-яё0-9+/#.\-\s]/gi, ' ');
  }

  function tokenize(text) {
    return normalize(text).split(/\s+/).filter(function (token) {
      return token.length > 2;
    });
  }

  function unique(list) {
    return Array.from(new Set(list.filter(Boolean)));
  }

  function snippet(text, tokens, radius) {
    var source = (text || '').replace(/\s+/g, ' ').trim();
    if (!source) {
      return '';
    }

    var lower = source.toLowerCase();
    var cursor = -1;
    (tokens || []).some(function (token) {
      cursor = lower.indexOf(token.toLowerCase());
      return cursor !== -1;
    });

    if (cursor === -1) {
      return source.slice(0, radius || 220);
    }

    var span = radius || 220;
    var start = Math.max(0, cursor - Math.floor(span * 0.35));
    var end = Math.min(source.length, cursor + span);
    return (start > 0 ? '... ' : '') + source.slice(start, end).trim() + (end < source.length ? ' ...' : '');
  }

  function autoResizePrompt() {
    var field = el('assistantPrompt');
    if (!field) {
      return;
    }
    field.style.height = 'auto';
    field.style.height = Math.min(180, Math.max(44, field.scrollHeight)) + 'px';
  }

  function saveChat() {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state.messages));
    } catch (error) {
      // Ignore storage problems.
    }
  }

  function loadChat() {
    try {
      state.messages = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]');
      if (!Array.isArray(state.messages)) {
        state.messages = [];
      }
    } catch (error) {
      state.messages = [];
    }
  }

  function consumeBootPrompt() {
    try {
      var prompt = sessionStorage.getItem(BOOT_PROMPT_KEY) || '';
      sessionStorage.removeItem(BOOT_PROMPT_KEY);
      return prompt.trim();
    } catch (error) {
      return '';
    }
  }

  function renderStarterPrompts() {
    var container = el('starterPrompts');
    if (!container) {
      return;
    }

    container.innerHTML = (training.starterPrompts || []).map(function (prompt) {
      return '<button class="assistant-suggestion" type="button" data-prompt="' + escapeAttr(prompt) + '">' + escapeHtml(prompt) + '</button>';
    }).join('');

    container.querySelectorAll('[data-prompt]').forEach(function (button) {
      button.addEventListener('click', function () {
        askPrompt(button.getAttribute('data-prompt') || '');
      });
    });
  }

  function renderHistory() {
    var history = el('historyList');
    if (!history) {
      return;
    }

    var turns = state.messages.filter(function (message) {
      return message.role === 'user';
    });

    if (!turns.length) {
      history.innerHTML = '<div class="assistant-history__empty">История пока пуста.</div>';
      return;
    }

    history.innerHTML = turns.slice(-24).reverse().map(function (message, index) {
      return '<div class="assistant-history__item" data-history-index="' + index + '">' + escapeHtml(message.text.slice(0, 84)) + '</div>';
    }).join('');

    history.querySelectorAll('[data-history-index]').forEach(function (item) {
      item.addEventListener('click', function () {
        var cards = document.querySelectorAll('.assistant-message--user');
        var target = cards[cards.length - 1 - Number(item.getAttribute('data-history-index'))];
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function formatMessage(text) {
    var lines = (text || '').split('\n');
    var html = [];
    var inList = false;

    function closeList() {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
    }

    lines.forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed) {
        closeList();
        return;
      }

      if (trimmed.indexOf('## ') === 0) {
        closeList();
        html.push('<h3>' + escapeHtml(trimmed.slice(3)) + '</h3>');
        return;
      }

      if (trimmed.indexOf('- ') === 0) {
        if (!inList) {
          html.push('<ul>');
          inList = true;
        }
        html.push('<li>' + escapeHtml(trimmed.slice(2)) + '</li>');
        return;
      }

      closeList();
      html.push('<p>' + escapeHtml(trimmed) + '</p>');
    });

    closeList();
    return html.join('');
  }

  function renderMessages() {
    var emptyState = el('emptyState');
    var messageList = el('messageList');
    var threadRoot = el('threadRoot');
    if (!emptyState || !messageList || !threadRoot) {
      return;
    }

    if (!state.messages.length) {
      emptyState.classList.remove('assistant-hidden');
      messageList.classList.add('assistant-hidden');
      messageList.innerHTML = '';
      renderHistory();
      return;
    }

    emptyState.classList.add('assistant-hidden');
    messageList.classList.remove('assistant-hidden');

    messageList.innerHTML = state.messages.map(function (message) {
      var isUser = message.role === 'user';
      var avatar = isUser ? 'Вы' : 'AI';
      var sourceHtml = '';
      if (message.sources && message.sources.length) {
        sourceHtml = '<div class="assistant-sources">' + unique(message.sources).map(function (source) {
          return '<span class="assistant-source">' + escapeHtml(source) + '</span>';
        }).join('') + '</div>';
      }
      return [
        '<article class="assistant-message ' + (isUser ? 'assistant-message--user' : 'assistant-message--assistant') + '">',
        '<div class="assistant-avatar">' + avatar + '</div>',
        '<div class="assistant-bubble">',
        formatMessage(message.text),
        sourceHtml,
        '</div>',
        '</article>'
      ].join('');
    }).join('');

    renderHistory();
    requestAnimationFrame(function () {
      threadRoot.scrollTop = threadRoot.scrollHeight;
    });
  }

  function updateStatus(label) {
    if (el('knowledgeStatus')) {
      el('knowledgeStatus').setAttribute('data-runtime-status', label || '');
    }
  }

  function updateKnowledgeStatus() {
    var notes = training.knowledgeNotes || [];
    var facts = training.analyticsFacts || {};
    var message = [
      'Training-pack: ' + notes.length + ' доменных заметок.',
      facts.operationsRows ? 'Операций в аналитике: ' + facts.operationsRows + '.' : null,
      state.chunks.length ? 'Внешние чанки: ' + state.chunks.length + '.' : 'Внешние чанки не подключены, работаю на встроенном pack.',
      state.profileIndex.length ? 'Профилей: ' + state.profileIndex.length + '.' : null,
      state.endpointHealthy ? 'LLM endpoint доступен.' : 'LLM endpoint не найден, включен retrieval-first режим.'
    ].filter(Boolean).join(' ');

    if (el('knowledgeStatus')) {
      var runtime = el('knowledgeStatus').getAttribute('data-runtime-status');
      el('knowledgeStatus').textContent = (runtime ? runtime + '. ' : '') + message;
    }
  }

  function classifyIntent(prompt) {
    var text = normalize(prompt);
    if (/что такое|объясни|определи|define|explain/.test(text)) {
      return 'definition';
    }
    if (/почему|ошибка|проблема|осложнение|stuck|loss|поглощ/.test(text)) {
      return 'troubleshooting';
    }
    if (/план|этап|roadmap|pilot|mvp|scaling|внедрен/.test(text)) {
      return 'planning';
    }
    if (/kpi|roi|эконом|ценност|эффект|коммерч/.test(text)) {
      return 'commercial';
    }
    if (/как|выбрать|рекоменд|подобрать|что делать/.test(text)) {
      return 'recommendation';
    }
    return 'analysis';
  }

  function detectDomains(prompt) {
    var text = normalize(prompt);
    var matches = [];
    Object.keys(training.domainKeywords || {}).forEach(function (domain) {
      var hit = (training.domainKeywords[domain] || []).some(function (keyword) {
        return text.indexOf(keyword.toLowerCase()) !== -1;
      });
      if (hit) {
        matches.push(domain);
      }
    });
    return matches;
  }

  function scoreText(promptTokens, text) {
    var corpus = normalize(text);
    var score = 0;
    promptTokens.forEach(function (token) {
      if (corpus.indexOf(token) !== -1) {
        score += token.length > 6 ? 4 : 2;
      }
    });
    return score;
  }

  function selectTopNotes(prompt, domains) {
    var tokens = tokenize(prompt);
    return (training.knowledgeNotes || []).map(function (note) {
      var score = scoreText(tokens, note.title + ' ' + note.text);
      if (domains.indexOf(note.domain) !== -1) {
        score += 4;
      }
      return { item: note, score: score };
    }).filter(function (entry) {
      return entry.score > 0;
    }).sort(function (left, right) {
      return right.score - left.score;
    }).slice(0, 4);
  }

  function selectTopChunks(prompt, domains) {
    var tokens = tokenize(prompt);
    return state.chunks.map(function (chunk) {
      var score = scoreText(tokens, chunk.text || '');
      if (Array.isArray(chunk.domains)) {
        chunk.domains.forEach(function (domain) {
          if (domains.indexOf(domain) !== -1) {
            score += 3;
          }
        });
      }
      return { item: chunk, score: score };
    }).filter(function (entry) {
      return entry.score > 0;
    }).sort(function (left, right) {
      return right.score - left.score;
    }).slice(0, 5);
  }

  function selectTopProfiles(prompt) {
    var tokens = tokenize(prompt);
    return state.profiles.map(function (profileEntry) {
      var score = scoreText(tokens, JSON.stringify(profileEntry.profile));
      score += scoreText(tokens, JSON.stringify(profileEntry.meta));
      return { item: profileEntry, score: score };
    }).filter(function (entry) {
      return entry.score > 0;
    }).sort(function (left, right) {
      return right.score - left.score;
    }).slice(0, 2);
  }

  function analyticsInsights(prompt, domains) {
    var facts = training.analyticsFacts || {};
    var lines = [];
    if (domains.indexOf('operations') !== -1 || /depth|day|операц|план|days|hours/.test(normalize(prompt))) {
      lines.push('В текущем аналитическом срезе доступно ' + facts.operationsRows + ' операций и ' + facts.totalPlanDays + ' плановых дней.');
      if (facts.hoursByOperationKind) {
        lines.push('Наибольшую нагрузку по plan-hours сейчас дают drilling (' + facts.hoursByOperationKind.drilling + ' ч) и tripping (' + facts.hoursByOperationKind.tripping + ' ч).');
      }
      if (facts.phaseHoursByDepthWindow) {
        lines.push('Самое тяжелое окно по глубине в текущем pack: 2501-3300 м (' + facts.phaseHoursByDepthWindow['2501-3300'] + ' ч).');
      }
    }

    if (domains.indexOf('kpi') !== -1 || /kpi|roi|эконом|эффект/.test(normalize(prompt))) {
      (facts.keyReadouts || []).forEach(function (item) {
        lines.push(item);
      });
    }
    return lines;
  }

  function buildShortAnswer(intent, domains, noteHits, chunkHits, profileHits, prompt) {
    if (!noteHits.length && !chunkHits.length && !profileHits.length) {
      return 'По текущему knowledge-pack у меня нет надежного прямого факта под этот запрос. Я могу либо сузить задачу, либо дать рабочую структуру решения без выдуманных чисел.';
    }

    if (intent === 'definition') {
      var definitionSource = noteHits[0] || chunkHits[0];
      var text = definitionSource ? (definitionSource.item.text || definitionSource.item.title || definitionSource.item.file || '') : '';
      return 'Коротко: ' + snippet(text, tokenize(prompt), 220);
    }

    if (intent === 'planning') {
      return 'Лучше идти через staged delivery: сначала фиксируем KPI-проблему и данные, затем pilot workflow, затем scale-out по ролям и только после этого автоматизацию следующего уровня.';
    }

    if (intent === 'commercial') {
      return 'Сильный ответ клиенту должен привязывать AI-продукт не к "умности", а к операционному дельта-эффекту: faster depth/day, lower NPT, fewer losses, lower decision latency или меньше инженерных ручных циклов.';
    }

    if (intent === 'troubleshooting') {
      return 'Сначала сузьте механизм проблемы, затем подтвердите его данными и только после этого выбирайте действие. Самая частая ошибка - сразу прыгать к treatment without diagnosis.';
    }

    if (domains.indexOf('bha') !== -1) {
      return 'По КНБК правильный ход - проектировать не отдельный инструмент, а связку trajectory intent, steering method, bit-drive compatibility, telemetry limits и vibration risk.';
    }

    if (domains.indexOf('drilling_fluids') !== -1) {
      return 'По буровым растворам базовое правило такое: система должна одновременно держать pressure control, hole cleaning и wellbore stability, а не только закрывать одну проблему вроде плотности или смазки.';
    }

    return 'У меня есть релевантный контекст по этому вопросу. Ниже свел прямой ответ, инженерную логику и что проверить дальше, чтобы решение было защищаемым.';
  }

  function buildFallbackAnswer(prompt) {
    var intent = classifyIntent(prompt);
    var domains = detectDomains(prompt);
    var noteHits = selectTopNotes(prompt, domains);
    var chunkHits = selectTopChunks(prompt, domains);
    var profileHits = selectTopProfiles(prompt);
    var sources = [];
    var lines = [];

    lines.push('## Короткий ответ');
    lines.push(buildShortAnswer(intent, domains, noteHits, chunkHits, profileHits, prompt));

    var whyLines = [];
    noteHits.forEach(function (hit) {
      whyLines.push(snippet(hit.item.text, tokenize(prompt), 220));
      sources.push(hit.item.source || hit.item.title);
    });
    chunkHits.forEach(function (hit) {
      whyLines.push(snippet(hit.item.text, tokenize(prompt), 220));
      sources.push(hit.item.file);
    });

    var analytics = analyticsInsights(prompt, domains);
    analytics.forEach(function (item) {
      whyLines.push(item);
      sources.push('Embedded analytics facts');
    });

    if (whyLines.length) {
      lines.push('## Почему я так отвечаю');
      unique(whyLines).slice(0, 5).forEach(function (item) {
        lines.push('- ' + item);
      });
    }

    var nextChecks = [];
    if (intent === 'recommendation' || intent === 'troubleshooting') {
      nextChecks.push('Уточните интервал, текущую систему, ограничения по оборудованию и фактические симптомы.');
      nextChecks.push('Проверьте, какие данные уже есть: pressure window, mud properties, BHA, section objective, NPT pattern.');
    }
    if (intent === 'planning' || intent === 'commercial') {
      nextChecks.push('Зафиксируйте один KPI, один основной workflow и одну группу пользователей для первого pilot scope.');
      nextChecks.push('Покажите baseline, expected delta и owner review cadence.');
    }
    if (!nextChecks.length) {
      nextChecks.push('Если нужен более точный ответ, добавьте месторождение или workspace, section objective, глубину/интервал и текущую проблему.');
      nextChecks.push('Если нужен расчет, укажите входные данные и единицы измерения.');
    }

    lines.push('## Что проверить дальше');
    nextChecks.forEach(function (item) {
      lines.push('- ' + item);
    });

    if (profileHits.length) {
      lines.push('## Ближайшие профили');
      profileHits.forEach(function (hit) {
        lines.push('- ' + hit.item.meta.name + ' (' + hit.item.meta.region + ')');
        sources.push(hit.item.meta.profile_file || hit.item.meta.name);
      });
    }

    return {
      text: lines.join('\n'),
      sources: unique(sources).slice(0, 8)
    };
  }

  async function tryEndpoint(prompt, chunkHits) {
    if (!chunkHits.length) {
      return null;
    }

    try {
      var response = await fetch(LOCAL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt,
          chunks: chunkHits.map(function (hit) { return hit.item.text || ''; }),
          rules: training.answerRules || []
        })
      });

      if (!response.ok) {
        return null;
      }

      var data = await response.json();
      if (data && data.ok && data.answer) {
        state.endpointHealthy = true;
        updateKnowledgeStatus();
        return data.answer;
      }
    } catch (error) {
      state.endpointHealthy = false;
    }
    return null;
  }

  async function buildAnswer(prompt) {
    var domains = detectDomains(prompt);
    var chunkHits = selectTopChunks(prompt, domains);
    var endpointAnswer = await tryEndpoint(prompt, chunkHits);
    if (endpointAnswer) {
      return {
        text: endpointAnswer,
        sources: unique(chunkHits.map(function (hit) { return hit.item.file; }))
      };
    }
    return buildFallbackAnswer(prompt);
  }

  async function askPrompt(promptText) {
    var prompt = (promptText || '').trim();
    if (!prompt) {
      return;
    }

    state.messages.push({ role: 'user', text: prompt });
    renderMessages();
    saveChat();
    updateStatus('Думаю над ответом');

    var answer = await buildAnswer(prompt);
    state.messages.push({ role: 'assistant', text: answer.text, sources: answer.sources });
    renderMessages();
    saveChat();
    updateStatus(state.chunks.length ? 'Knowledge-pack + local index active' : 'Training-pack active');

    var field = el('assistantPrompt');
    if (field) {
      field.value = '';
      autoResizePrompt();
      field.focus();
    }
  }

  function newChat() {
    state.messages = [];
    saveChat();
    renderMessages();
    updateStatus(state.chunks.length ? 'Knowledge-pack + local index active' : 'Training-pack active');
  }

  async function fetchJson(path) {
    var response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Failed to load ' + path);
    }
    return response.json();
  }

  async function loadKnowledge(options) {
    var nextState = {
      chunks: state.chunks,
      catalog: state.catalog,
      profileIndex: state.profileIndex,
      profiles: [],
      loadedSources: [],
      knowledgeVersion: state.knowledgeVersion
    };

    var tasks = [
      fetchJson('../knowledge/index/search_chunks.json').then(function (data) {
        nextState.chunks = data.chunks || [];
        nextState.loadedSources.push('search_chunks');
      }).catch(function () {}),
      fetchJson('../knowledge/index/global_catalog.json').then(function (data) {
        nextState.catalog = data.items || [];
        nextState.loadedSources.push('global_catalog');
      }).catch(function () {}),
      fetchJson('../knowledge/field_profiles_index.json').then(function (data) {
        nextState.profileIndex = data.profiles || [];
        nextState.loadedSources.push('field_profiles_index');
      }).catch(function () {}),
      fetchJson(KNOWLEDGE_REPORT_PATH).then(function (data) {
        nextState.knowledgeVersion = data.updated || JSON.stringify(data.summary || {});
        nextState.loadedSources.push('ingest_report');
      }).catch(function () {}),
      fetchJson('../knowledge/fluid_system_templates.json').then(function () {
        nextState.loadedSources.push('fluid_templates');
      }).catch(function () {}),
      fetchJson('../digital_output/deep_analysis.json').then(function () {
        nextState.loadedSources.push('deep_analysis');
      }).catch(function () {})
    ];

    await Promise.all(tasks);

    if (nextState.profileIndex.length) {
      await Promise.all(nextState.profileIndex.slice(0, 6).map(function (profileMeta) {
        return fetchJson('../' + profileMeta.profile_file).then(function (profile) {
          nextState.profiles.push({ meta: profileMeta, profile: profile });
        }).catch(function () {});
      }));
    }

    state.chunks = nextState.chunks;
    state.catalog = nextState.catalog;
    state.profileIndex = nextState.profileIndex;
    state.profiles = nextState.profiles;
    state.loadedSources = nextState.loadedSources;
    state.knowledgeVersion = nextState.knowledgeVersion;

    if (options && options.runtimeLabel) {
      updateStatus(options.runtimeLabel);
    }
    updateKnowledgeStatus();
  }

  async function checkKnowledgeRefresh() {
    if (state.knowledgeRefreshInFlight) {
      return;
    }

    state.knowledgeRefreshInFlight = true;
    try {
      var report = await fetchJson(KNOWLEDGE_REPORT_PATH);
      var nextVersion = report.updated || JSON.stringify(report.summary || {});
      if (!nextVersion) {
        return;
      }

      if (!state.knowledgeVersion) {
        state.knowledgeVersion = nextVersion;
        return;
      }

      if (nextVersion !== state.knowledgeVersion) {
        updateStatus('Обновляю knowledge-pack');
        await loadKnowledge({ runtimeLabel: 'Knowledge-pack обновлен автоматически' });
      }
    } catch (error) {
      // Ignore background refresh errors and keep the current pack.
    } finally {
      state.knowledgeRefreshInFlight = false;
    }
  }

  function startKnowledgeWatcher() {
    if (state.knowledgeWatchTimer) {
      window.clearInterval(state.knowledgeWatchTimer);
    }
    state.knowledgeWatchTimer = window.setInterval(checkKnowledgeRefresh, KNOWLEDGE_WATCH_INTERVAL_MS);
  }

  function bindUi() {
    el('newChatBtn').addEventListener('click', newChat);

    el('assistantComposer').addEventListener('submit', function (event) {
      event.preventDefault();
      askPrompt(el('assistantPrompt').value);
    });

    el('assistantPrompt').addEventListener('input', autoResizePrompt);
    el('assistantPrompt').addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        askPrompt(el('assistantPrompt').value);
      }
    });

    window.addEventListener('nexus:assistant-ask', function (event) {
      var prompt = event && event.detail ? event.detail.prompt : '';
      if (prompt) {
        askPrompt(prompt);
      }
    });
  }

  async function init() {
    renderStarterPrompts();
    bindUi();
    loadChat();
    renderMessages();
    autoResizePrompt();
    await loadKnowledge();
    startKnowledgeWatcher();

    if (!state.messages.length) {
      state.messages.push({
        role: 'assistant',
        text: '## Я готов\nЯ уже стартую не как пустой чат, а как инженерный AI-помощник с training-pack по бурению, растворам, гидравлике, КНБК, KPI и rollout-логике. Спроси задачу, термин, KPI-вопрос или pilot scope - отвечу коротко и по делу.'
      });
      saveChat();
      renderMessages();
    }

    var bootPrompt = consumeBootPrompt();
    if (bootPrompt) {
      askPrompt(bootPrompt);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('beforeunload', function () {
    if (state.knowledgeWatchTimer) {
      window.clearInterval(state.knowledgeWatchTimer);
    }
  });
})();