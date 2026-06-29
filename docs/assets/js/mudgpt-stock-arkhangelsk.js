(function (window) {
  if (window.MudGPTStockArkhangelsk) {
    return;
  }

  var STORAGE_KEY = 'mudgpt-stock-warehouse-arkhangelsk-v1';
  var DEFAULT_DATE = '2026-04-18';
  var DEFAULT_ROWS = [
    {
      id: 'row-1',
      product: 'MudGPT - PAC',
      packageType: 'мешок бум',
      unit: 'мешок',
      unitWeight: '25',
      openingQty: '0',
      arrivalQty: '0',
      expectedQty: '0',
      expectedDate: '',
      shippedQty: '0',
      fullLoad: 'автофура',
      exwPrice: '',
      note: ''
    },
    {
      id: 'row-2',
      product: 'MudGPT - Ксантан',
      packageType: 'биг-бэг',
      unit: 'биг-бэг',
      unitWeight: '750',
      openingQty: '0',
      arrivalQty: '0',
      expectedQty: '0',
      expectedDate: '',
      shippedQty: '0',
      fullLoad: '20фт контейнер',
      exwPrice: '',
      note: ''
    },
    {
      id: 'row-3',
      product: 'MudGPT - асфальт',
      packageType: 'бочка ПЭТ',
      unit: 'IBC',
      unitWeight: '1000',
      openingQty: '0',
      arrivalQty: '0',
      expectedQty: '0',
      expectedDate: '',
      shippedQty: '0',
      fullLoad: 'ж/д вагон',
      exwPrice: '',
      note: ''
    }
  ];

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

  function normalizeString(value, fallbackValue) {
    return String(value == null ? fallbackValue || '' : value).trim();
  }

  function normalizeRow(row, fallbackRow, rowIndex) {
    var source = row && typeof row === 'object' ? row : {};
    var fallback = fallbackRow || DEFAULT_ROWS[rowIndex] || {};
    return {
      id: normalizeString(source.id, fallback.id || 'row-' + (rowIndex + 1)),
      product: normalizeString(source.product, fallback.product),
      packageType: normalizeString(source.packageType, fallback.packageType || 'мешок бум'),
      unit: normalizeString(source.unit, fallback.unit || 'мешок'),
      unitWeight: normalizeString(source.unitWeight, fallback.unitWeight || ''),
      openingQty: normalizeString(source.openingQty, fallback.openingQty || '0'),
      arrivalQty: normalizeString(source.arrivalQty, fallback.arrivalQty || '0'),
      expectedQty: normalizeString(source.expectedQty, fallback.expectedQty || '0'),
      expectedDate: normalizeString(source.expectedDate, fallback.expectedDate || ''),
      shippedQty: normalizeString(source.shippedQty, fallback.shippedQty || '0'),
      fullLoad: normalizeString(source.fullLoad, fallback.fullLoad || 'автофура'),
      exwPrice: normalizeString(source.exwPrice, fallback.exwPrice || ''),
      note: normalizeString(source.note, fallback.note || '')
    };
  }

  function normalizeState(state) {
    var source = state && typeof state === 'object' ? state : {};
    var rows = Array.isArray(source.rows) ? source.rows : DEFAULT_ROWS;
    return {
      date: normalizeString(source.date, DEFAULT_DATE),
      rows: rows.map(function (row, index) {
        return normalizeRow(row, DEFAULT_ROWS[index], index);
      })
    };
  }

  function loadState() {
    return normalizeState(safeJsonParse(localStorage.getItem(STORAGE_KEY) || 'null', null));
  }

  function saveState(state) {
    var normalized = normalizeState(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return clone(normalized);
  }

  function createRow() {
    return normalizeRow({ id: 'row-' + Date.now() }, {
      product: '',
      packageType: 'мешок бум',
      unit: 'мешок',
      unitWeight: '',
      openingQty: '0',
      arrivalQty: '0',
      expectedQty: '0',
      expectedDate: '',
      shippedQty: '0',
      fullLoad: 'автофура',
      exwPrice: '',
      note: ''
    }, DEFAULT_ROWS.length + 1);
  }

  window.MudGPTStockArkhangelsk = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_DATE: DEFAULT_DATE,
    DEFAULT_ROWS: clone(DEFAULT_ROWS),
    loadState: loadState,
    saveState: saveState,
    createRow: createRow
  };
}(window));