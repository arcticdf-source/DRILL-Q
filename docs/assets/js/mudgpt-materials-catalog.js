(function (window) {
  if (window.MudGPTMaterialsCatalog) {
    return;
  }

  var STORAGE_KEY = 'mudgpt-materials-catalog-v2';
  var DEFAULTS = {
    asphalt: {
      title: 'MudGPT - асфальт',
      subtitle: 'Отдельная продуктовая страница-заготовка',
      group: 'Material',
      stock: 'Нет данных',
      price: 'По запросу',
      status: 'Готова под наполнение'
    },
    pac: {
      title: 'MudGPT - PAC',
      subtitle: 'Отдельная продуктовая страница-заготовка',
      group: 'Chemical',
      stock: 'Нет данных',
      price: 'По запросу',
      status: 'Готова под наполнение'
    },
    xanthan: {
      title: 'MudGPT - Ксантан',
      subtitle: 'Отдельная продуктовая страница-заготовка',
      group: 'Biopolymer',
      stock: 'Нет данных',
      price: 'По запросу',
      status: 'Готова под наполнение'
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function safeJsonParse(value, fallbackValue) {
    try {
      var parsed = JSON.parse(value);
      return parsed == null ? fallbackValue : parsed;
    } catch (error) {
      return fallbackValue;
    }
  }

  function normalizeRecord(record, fallbackRecord) {
    var source = record && typeof record === 'object' ? record : {};
    var fallback = fallbackRecord || {};
    return {
      title: String(source.title || fallback.title || '').trim(),
      subtitle: String(source.subtitle || fallback.subtitle || '').trim(),
      group: String(source.group || fallback.group || '').trim(),
      stock: String(source.stock || fallback.stock || '').trim(),
      price: String(source.price || fallback.price || '').trim(),
      status: String(source.status || fallback.status || '').trim()
    };
  }

  function loadState() {
    var stored = safeJsonParse(localStorage.getItem(STORAGE_KEY) || '{}', {});
    var state = {};

    Object.keys(DEFAULTS).forEach(function (productId) {
      state[productId] = normalizeRecord(stored[productId], DEFAULTS[productId]);
    });

    return state;
  }

  function saveState(state) {
    var nextState = {};

    Object.keys(DEFAULTS).forEach(function (productId) {
      nextState[productId] = normalizeRecord(state && state[productId], DEFAULTS[productId]);
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    return clone(nextState);
  }

  function updateRecord(productId, patch) {
    var state = loadState();
    if (!DEFAULTS[productId]) {
      return clone(state);
    }

    state[productId] = normalizeRecord(Object.assign({}, state[productId], patch || {}), DEFAULTS[productId]);
    return saveState(state);
  }

  function resetRecord(productId) {
    var state = loadState();
    if (!DEFAULTS[productId]) {
      return clone(state);
    }

    state[productId] = clone(DEFAULTS[productId]);
    return saveState(state);
  }

  window.MudGPTMaterialsCatalog = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULTS: clone(DEFAULTS),
    loadState: loadState,
    saveState: saveState,
    updateRecord: updateRecord,
    resetRecord: resetRecord
  };
}(window));