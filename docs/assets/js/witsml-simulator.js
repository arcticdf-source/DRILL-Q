(function () {
  const STORAGE_KEY = 'nexus-witsml-supervisor-screen-v3';
  const CHANNEL_NAME = 'nexus-witsml-supervisor-screen';
  const MAX_HISTORY = 180;
  const MAX_NOTES = 24;
  const TICK_MS = 1000;

  const TRACK_GROUPS = [
    {
      key: 'surface',
      tracks: [
        { key: 'hookload', label: 'Вес на крюке', unit: 'т', min: 0, max: 150, digits: 0, color: '#2b92c9' },
        { key: 'pressure', label: 'Давление', unit: 'атм', min: 0, max: 350, digits: 0, color: '#343a40' },
        { key: 'wob', label: 'Нагрузка на долото', unit: 'т', min: 0, max: 30, digits: 1, color: '#d85b95' },
        { key: 'topDriveRpm', label: 'Обороты СВП', unit: 'об/мин', min: 0, max: 135, digits: 0, color: '#00a6a6' },
        { key: 'topDriveTorque', label: 'Крутящий момент СВП', unit: 'кН*м', min: 0, max: 34, digits: 1, color: '#bf4d8a' },
        { key: 'keyTorque', label: 'Момент на ключе', unit: 'кН*м', min: 0, max: 20, digits: 1, color: '#b85b79' },
        { key: 'annulusPressure', label: 'Давление в затрубе', unit: 'атм', min: -5, max: 350, digits: 0, color: '#8e99ab' }
      ]
    },
    {
      key: 'mud',
      tracks: [
        { key: 'tank1', label: 'Емкость-1', unit: 'м3', min: 0, max: 50, digits: 1, color: '#4ea3d9' },
        { key: 'tank2', label: 'Емкость-2', unit: 'м3', min: 0, max: 60, digits: 1, color: '#7d95d0' },
        { key: 'tank3', label: 'Емкость-3', unit: 'м3', min: 0, max: 60, digits: 1, color: '#67aab4' },
        { key: 'csgo', label: 'ЦСГО', unit: 'м3', min: 0, max: 160, digits: 1, color: '#e07ab0' },
        { key: 'fillVolume', label: 'Долив', unit: 'м3', min: 0, max: 60, digits: 1, color: '#8ea89e' },
        { key: 'activeVolume', label: 'Объем в активе', unit: 'м3', min: 0, max: 130, digits: 1, color: '#4f92d1' },
        { key: 'totalMudVolume', label: 'Объем раствора всего', unit: 'м3', min: 0, max: 150, digits: 1, color: '#c46b93' }
      ]
    },
    {
      key: 'mechanics',
      tracks: [
        { key: 'mechanicalSpeed', label: 'Механическая скорость', unit: 'м/ч', min: 0, max: 500, digits: 0, color: '#303030' },
        { key: 'dmk', label: 'ДМК', unit: 'мин/м', min: 0, max: 50, digits: 1, color: '#4d8dcf' },
        { key: 'tripSpeed', label: 'Скорость СПО', unit: 'м/с', min: 0, max: 3, digits: 2, color: '#7e7ad7' },
        { key: 'blockHeight', label: 'Тальблок', unit: 'м', min: 0, max: 30, digits: 1, color: '#333333' },
        { key: 'mudDensityIn', label: 'Плотность на входе', unit: 'г/см3', min: 0, max: 2.1, digits: 2, color: '#d46daa' },
        { key: 'mudDensityOut', label: 'Плотность на выходе', unit: 'г/см3', min: 0, max: 2.0, digits: 2, color: '#b55b77' },
        { key: 'drillingSpeed', label: 'Скорость бурения', unit: 'м/ч', min: 0, max: 100, digits: 0, color: '#c76597' }
      ]
    }
  ];

  const subscribers = new Set();
  const channel = typeof window.BroadcastChannel === 'function' ? new window.BroadcastChannel(CHANNEL_NAME) : null;
  let runtimeTimer = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function round(value, digits) {
    const factor = 10 ** (digits || 0);
    return Math.round(value * factor) / factor;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatSupervisorTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }

  function createNote(sampleIndex, timeLabel, level, text) {
    return { id: `${sampleIndex}-${Math.random().toString(16).slice(2, 8)}`, sampleIndex, timeLabel, level, text };
  }

  function createSnapshot() {
    const start = new Date('2012-02-25T02:45:00');
    const snapshot = {
      version: 3,
      running: false,
      sampleIndex: 0,
      sampleCadenceSeconds: 1,
      minutesPerTick: 1.5,
      wellName: 'Новая скважина',
      phase: 'drilling',
      phaseLabel: 'Проходка',
      phaseTicksRemaining: 36,
      standLengthM: 30,
      standNumber: 118,
      standStartDepthM: 3120,
      holeDepthM: 3120,
      bitDepthM: 3120,
      baseDateIso: start.toISOString(),
      supervisorTime: formatSupervisorTime(start),
      notes: [],
      lossEventTicks: 0,
      pressureEventTicks: 0,
      tripDirection: null,
      currentEntry: null,
      history: []
    };

    snapshot.currentEntry = buildEntry(snapshot);
    snapshot.history = [snapshot.currentEntry];
    snapshot.notes = [createNote(0, snapshot.currentEntry.timeLabel, 'info', 'Экран супервайзера запущен. Идет проходка текущей свечи.')];
    return snapshot;
  }

  function normalizeSnapshot(snapshot) {
    if (!snapshot || snapshot.version !== 3) {
      return createSnapshot();
    }
    if (!Array.isArray(snapshot.history) || !snapshot.history.length) {
      snapshot.history = [buildEntry(snapshot)];
    }
    if (!snapshot.currentEntry) {
      snapshot.currentEntry = snapshot.history[0];
    }
    if (!Array.isArray(snapshot.notes)) {
      snapshot.notes = [];
    }
    return snapshot;
  }

  function loadSnapshot() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createSnapshot();
    }
    try {
      return normalizeSnapshot(JSON.parse(raw));
    } catch (error) {
      console.warn('Failed to parse supervisor snapshot', error);
      return createSnapshot();
    }
  }

  function emit(snapshot) {
    subscribers.forEach((callback) => {
      try {
        callback(snapshot);
      } catch (error) {
        console.error('Supervisor subscriber failed', error);
      }
    });
  }

  function persist(snapshot) {
    const normalized = normalizeSnapshot(snapshot);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    if (channel) {
      channel.postMessage({ type: 'snapshot', payload: normalized });
    }
    emit(normalized);
    return normalized;
  }

  function getCurrentDate(snapshot) {
    const date = new Date(snapshot.baseDateIso);
    date.setMinutes(date.getMinutes() + Math.round(snapshot.sampleIndex * snapshot.minutesPerTick));
    return date;
  }

  function pushNote(snapshot, level, text) {
    const timeLabel = formatSupervisorTime(getCurrentDate(snapshot)).slice(11);
    snapshot.notes.unshift(createNote(snapshot.sampleIndex, timeLabel, level, text));
    snapshot.notes = snapshot.notes.slice(0, MAX_NOTES);
  }

  function transitionTo(snapshot, phase, ticks, label, noteLevel, noteText) {
    snapshot.phase = phase;
    snapshot.phaseLabel = label;
    snapshot.phaseTicksRemaining = ticks;
    if (noteText) {
      pushNote(snapshot, noteLevel || 'info', noteText);
    }
  }

  function maybeTriggerEvents(snapshot) {
    if (snapshot.sampleIndex > 0 && snapshot.sampleIndex % 110 === 0 && snapshot.lossEventTicks === 0) {
      snapshot.lossEventTicks = 16;
      pushNote(snapshot, 'warning', 'Появился расходный дисбаланс. Линии объемов пошли влево, контроль долива усилен.');
    }
    if (snapshot.sampleIndex > 0 && snapshot.sampleIndex % 150 === 0 && snapshot.pressureEventTicks === 0) {
      snapshot.pressureEventTicks = 14;
      pushNote(snapshot, 'critical', 'Рост давления в циркуляции. Контроль нагрузки и момента усилен.');
    }
  }

  function advanceProcess(snapshot) {
    snapshot.sampleIndex += 1;
    maybeTriggerEvents(snapshot);

    if (snapshot.lossEventTicks > 0) {
      snapshot.lossEventTicks -= 1;
    }
    if (snapshot.pressureEventTicks > 0) {
      snapshot.pressureEventTicks -= 1;
    }

    if (snapshot.phaseTicksRemaining > 0) {
      snapshot.phaseTicksRemaining -= 1;
    }

    const stepHours = snapshot.minutesPerTick / 60;

    if (snapshot.phase === 'drilling') {
      const drillingSpeed = 26 + Math.sin(snapshot.sampleIndex / 5.5) * 3.2 + Math.cos(snapshot.sampleIndex / 8.2) * 1.8;
      snapshot.holeDepthM = round(snapshot.holeDepthM + drillingSpeed * stepHours, 2);
      snapshot.bitDepthM = snapshot.holeDepthM;
      if (snapshot.holeDepthM - snapshot.standStartDepthM >= snapshot.standLengthM) {
        transitionTo(snapshot, 'connection', 6, 'Наращивание', 'info', 'Свеча 30 м добурена. Идет наращивание и подготовка к следующей проходке.');
      }
    } else if (snapshot.phase === 'connection') {
      snapshot.bitDepthM = snapshot.holeDepthM;
      if (snapshot.phaseTicksRemaining <= 0) {
        snapshot.standNumber += 1;
        snapshot.standStartDepthM = snapshot.holeDepthM;
        if (snapshot.standNumber % 9 === 0) {
          transitionTo(snapshot, 'tripOut', 10, 'Подъем инструмента', 'warning', 'Кратковременное СПО вверх для сервисной операции.');
        } else if (snapshot.standNumber % 5 === 0) {
          transitionTo(snapshot, 'circulation', 8, 'Промывка', 'info', 'После наращивания выполняется промывка и стабилизация системы.');
        } else if (snapshot.standNumber % 3 === 0) {
          transitionTo(snapshot, 'reaming', 7, 'Проработка', 'warning', 'Начата проработка интервала перед дальнейшей проходкой.');
        } else {
          transitionTo(snapshot, 'drilling', 36, 'Проходка', 'info', 'Начата новая свеча. Линии режима снова уходят в рабочий коридор.');
        }
      }
    } else if (snapshot.phase === 'circulation') {
      if (snapshot.phaseTicksRemaining <= 0) {
        transitionTo(snapshot, 'drilling', 36, 'Проходка', 'info', 'Промывка завершена. Скважина возвращена в режим проходки.');
      }
    } else if (snapshot.phase === 'reaming') {
      snapshot.bitDepthM = Math.max(snapshot.standStartDepthM, snapshot.bitDepthM - 0.2 + Math.sin(snapshot.sampleIndex / 3.2) * 0.08);
      if (snapshot.phaseTicksRemaining <= 0) {
        snapshot.bitDepthM = snapshot.holeDepthM;
        transitionTo(snapshot, 'drilling', 30, 'Проходка', 'info', 'Проработка завершена. Переход в рабочее бурение.');
      }
    } else if (snapshot.phase === 'tripOut') {
      snapshot.tripDirection = 'out';
      snapshot.bitDepthM = round(Math.max(snapshot.standStartDepthM - 120, snapshot.bitDepthM - 15.5), 2);
      if (snapshot.phaseTicksRemaining <= 0) {
        transitionTo(snapshot, 'tripIn', 10, 'Спуск инструмента', 'info', 'Подъем завершен. Начат обратный спуск инструмента в ствол.');
      }
    } else if (snapshot.phase === 'tripIn') {
      snapshot.tripDirection = 'in';
      snapshot.bitDepthM = round(Math.min(snapshot.holeDepthM, snapshot.bitDepthM + 15.5), 2);
      if (snapshot.phaseTicksRemaining <= 0 || snapshot.bitDepthM >= snapshot.holeDepthM) {
        snapshot.tripDirection = null;
        snapshot.bitDepthM = snapshot.holeDepthM;
        transitionTo(snapshot, 'drilling', 32, 'Проходка', 'info', 'Инструмент снова на забое. Бурение продолжено.');
      }
    }

    snapshot.supervisorTime = formatSupervisorTime(getCurrentDate(snapshot));
    snapshot.currentEntry = buildEntry(snapshot);
    snapshot.history.unshift(snapshot.currentEntry);
    snapshot.history = snapshot.history.slice(0, MAX_HISTORY);
  }

  function buildEntry(snapshot) {
    const standProgress = clamp(snapshot.holeDepthM - snapshot.standStartDepthM, 0, snapshot.standLengthM);
    const oscillationA = Math.sin(snapshot.sampleIndex / 4.5);
    const oscillationB = Math.cos(snapshot.sampleIndex / 7.2);
    const drillingMode = snapshot.phase === 'drilling';
    const connectionMode = snapshot.phase === 'connection';
    const circulationMode = snapshot.phase === 'circulation';
    const reamingMode = snapshot.phase === 'reaming';
    const tripOutMode = snapshot.phase === 'tripOut';
    const tripInMode = snapshot.phase === 'tripIn';

    const rop = drillingMode ? 27 + oscillationA * 4 + oscillationB * 2 : reamingMode ? 8 + oscillationB * 1.4 : 0;
    const drillingSpeed = drillingMode ? 31 + oscillationA * 4.2 + (snapshot.lossEventTicks > 0 ? -4.5 : 0) : reamingMode ? 11 + oscillationB * 1.8 : 0;
    const wob = drillingMode ? 10.8 + oscillationB * 0.9 : reamingMode ? 7.2 + oscillationA * 0.5 : connectionMode ? 0.4 : 0.2;
    const pressureBoost = snapshot.pressureEventTicks > 0 ? 28 : 0;
    const pressure = drillingMode || reamingMode ? 216 + oscillationA * 12 + pressureBoost + (snapshot.lossEventTicks > 0 ? -8 : 0) : circulationMode ? 188 + oscillationB * 10 + pressureBoost * 0.6 : connectionMode ? 18 + oscillationA * 4 : 6 + oscillationB * 3;
    const annulusPressure = drillingMode || circulationMode || reamingMode ? 132 + oscillationB * 11 + pressureBoost * 0.45 : connectionMode ? 18 + oscillationA * 3 : 8 + oscillationB * 2;
    const hookload = drillingMode ? 122 + oscillationA * 3.2 - wob * 0.12 : tripOutMode ? 136 + oscillationB * 4 : tripInMode ? 129 + oscillationA * 3 : 118 + oscillationB * 2;
    const topDriveRpm = drillingMode ? 126 + oscillationB * 9 : reamingMode ? 82 + oscillationA * 8 : circulationMode ? 12 + oscillationA * 4 : 0;
    const topDriveTorque = drillingMode ? 14.6 + oscillationA * 1.6 + (snapshot.pressureEventTicks > 0 ? 1.2 : 0) : reamingMode ? 16.2 + oscillationB * 1.2 : 0.3;
    const keyTorque = connectionMode ? 17 + (6 - snapshot.phaseTicksRemaining) * 0.45 + oscillationB * 0.5 : 0.1 + Math.max(0, oscillationA) * 0.2;
    const tripSpeed = tripOutMode || tripInMode ? 0.17 + Math.abs(oscillationA) * 0.05 : 0;
    const blockHeight = drillingMode ? snapshot.standLengthM - standProgress : connectionMode ? 24 + (6 - snapshot.phaseTicksRemaining) * 1.1 : tripOutMode ? 18 + Math.abs(oscillationB) * 8 : tripInMode ? 10 + Math.abs(oscillationA) * 12 : 26 + oscillationA * 2;
    const dmk = drillingSpeed > 0 ? 60 / drillingSpeed : 0;

    const volumeTrend = Math.sin(snapshot.sampleIndex / 14);
    const lossShift = snapshot.lossEventTicks > 0 ? 1 + snapshot.lossEventTicks * 0.35 : 0;
    const tank1 = 46.5 + volumeTrend * 1.4 - lossShift * 0.12;
    const tank2 = 58.0 + oscillationA * 1.2 - lossShift * 0.1;
    const tank3 = 57.2 + oscillationB * 1.4 - lossShift * 0.08;
    const csgo = 151 + Math.sin(snapshot.sampleIndex / 10.5) * 7 - lossShift * 0.5;
    const fillVolume = 28 + Math.max(0, Math.sin(snapshot.sampleIndex / 9)) * 10 + lossShift * 0.35;
    const activeVolume = 118 + Math.sin(snapshot.sampleIndex / 12.3) * 6 - lossShift * 0.32;
    const totalMudVolume = 145 + Math.cos(snapshot.sampleIndex / 17) * 4 - lossShift * 0.45;
    const mudDensityIn = 1.18 + Math.sin(snapshot.sampleIndex / 13.5) * 0.02 + (snapshot.pressureEventTicks > 0 ? 0.02 : 0);
    const mudDensityOut = mudDensityIn + (snapshot.lossEventTicks > 0 ? -0.04 : 0.01 + oscillationB * 0.01);

    return {
      sampleIndex: snapshot.sampleIndex,
      timeLabel: snapshot.supervisorTime.slice(11),
      holeDepthM: round(snapshot.holeDepthM, 1),
      bitDepthM: round(snapshot.bitDepthM, 1),
      standProgressM: round(standProgress, 1),
      phaseLabel: snapshot.phaseLabel,
      values: {
        hookload: round(hookload, 1),
        pressure: round(pressure, 0),
        wob: round(wob, 1),
        topDriveRpm: round(topDriveRpm, 0),
        topDriveTorque: round(topDriveTorque, 1),
        keyTorque: round(keyTorque, 1),
        annulusPressure: round(annulusPressure, 0),
        tank1: round(tank1, 1),
        tank2: round(tank2, 1),
        tank3: round(tank3, 1),
        csgo: round(csgo, 1),
        fillVolume: round(fillVolume, 1),
        activeVolume: round(activeVolume, 1),
        totalMudVolume: round(totalMudVolume, 1),
        mechanicalSpeed: round(Math.max(0, rop * 10.8), 0),
        dmk: round(dmk, 1),
        tripSpeed: round(tripSpeed, 2),
        blockHeight: round(clamp(blockHeight, 0, 30), 1),
        mudDensityIn: round(mudDensityIn, 2),
        mudDensityOut: round(mudDensityOut, 2),
        drillingSpeed: round(drillingSpeed, 0)
      }
    };
  }

  function stopRuntime() {
    if (runtimeTimer) {
      window.clearInterval(runtimeTimer);
      runtimeTimer = null;
    }
  }

  function setRunning(shouldRun) {
    const snapshot = loadSnapshot();
    if (!shouldRun) {
      stopRuntime();
      return persist({ ...snapshot, running: false });
    }
    if (runtimeTimer) {
      return snapshot;
    }
    const started = persist({ ...snapshot, running: true });
    runtimeTimer = window.setInterval(() => {
      const current = loadSnapshot();
      if (!current.running) {
        stopRuntime();
        return;
      }
      advanceProcess(current);
      persist(current);
    }, TICK_MS);
    return started;
  }

  function tickOnce() {
    stopRuntime();
    const snapshot = loadSnapshot();
    advanceProcess(snapshot);
    return persist({ ...snapshot, running: false });
  }

  function resetScenario() {
    stopRuntime();
    return persist(createSnapshot());
  }

  function subscribe(callback) {
    subscribers.add(callback);
    return function unsubscribe() {
      subscribers.delete(callback);
    };
  }

  function getDashboardState(snapshotInput) {
    const snapshot = normalizeSnapshot(snapshotInput || loadSnapshot());
    const latest = snapshot.history[0];
    return {
      interval: 'Текущий интервал бурения',
      operation: latest.phaseLabel,
      tvd: latest.bitDepthM,
      operationHours: round((snapshot.sampleIndex * snapshot.minutesPerTick) / 60, 1),
      targetDepth: round(snapshot.holeDepthM + 260, 0),
      planRop: 30,
      costPerHour: 0,
      standpipeThreshold: 240,
      flowIn: latest.values.activeVolume,
      flowOut: latest.values.totalMudVolume,
      engineering: [],
      depthRows: snapshot.history.slice(0, 8).map((entry, index) => ({ day: index, planDepth: round(entry.holeDepthM + 10, 0), actualDepth: round(entry.holeDepthM, 0) })),
      nptEvents: []
    };
  }

  function listScenarios() {
    return [{ key: 'single_well_supervisor', label: 'Single well supervisor screen', summary: 'Одна скважина, вертикальный real-time экран супервайзера.' }];
  }

  if (channel) {
    channel.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'snapshot') {
        emit(normalizeSnapshot(event.data.payload));
      }
    });
  }

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      emit(loadSnapshot());
    }
  });

  window.NexusWitsmlSimulator = {
    storageKey: STORAGE_KEY,
    getTrackLayout: function () {
      return clone(TRACK_GROUPS);
    },
    loadSnapshot,
    persist,
    subscribe,
    listScenarios,
    resetScenario,
    setScenario: function () {
      return loadSnapshot();
    },
    setHoursPerTick: function (minutes) {
      const snapshot = loadSnapshot();
      snapshot.minutesPerTick = minutes;
      return persist(snapshot);
    },
    setRunning,
    tickOnce,
    selectWell: function () {
      return loadSnapshot();
    },
    getDashboardState
  };

  if (!window.localStorage.getItem(STORAGE_KEY)) {
    persist(createSnapshot());
  }
})();
