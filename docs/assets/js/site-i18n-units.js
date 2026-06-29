(function () {
  const STORAGE_LANG = "site_lang";
  const STORAGE_UNITS = "site_units";

  const DICT = {
    common: {
      ru: {
        "controls.lang": "Язык",
        "controls.units": "Единицы",
        "controls.lang.ru": "Русский",
        "controls.lang.en": "English",
        "controls.units.si": "SI (метрическая)",
        "controls.units.field": "Field (imperial)"
      },
      en: {
        "controls.lang": "Language",
        "controls.units": "Units",
        "controls.lang.ru": "Russian",
        "controls.lang.en": "English",
        "controls.units.si": "SI (metric)",
        "controls.units.field": "Field (imperial)"
      }
    },
    home: {
      ru: {
        "title": "NEXUS OILFIELD AI",
        "top.note": "AI-native цифровые нефтесервисные системы",
        "top.btn.kb": "Обновить базу знаний",
        "top.btn.ai": "AI-инженер",
        "top.btn.drilling": "Бурение",
        "hero.label": "Новая генерация нефтесервиса",
        "hero.title": "Цифровая нефтесервисная компания полного цикла",
        "hero.desc": "От прогноза NPT в бурении до предотвращения отказов ЭЦН: единая среда, где каждое решение связано с данными, моделью, действием и подтвержденным экономическим эффектом.",
        "chip.1": "SaaS + Gain Share",
        "chip.2": "Командный центр 24/7",
        "chip.3": "Human-in-the-loop",
        "chip.4": "MLOps в масштабе",
        "panel.focus": "Операционный фокус",
        "panel.focus.desc": "Бурение, добыча, надежность и HSE в одном цифровом контуре.",
        "panel.revenue": "Модель дохода",
        "panel.revenue.desc": "Подписка на платформу, сервис доставки результата и бонус за подтвержденный эффект.",
        "panel.mode": "Режим внедрения",
        "panel.mode.desc": "Быстрый запуск пилота за 90 дней с прозрачными KPI и Go/No-Go воротами.",
        "kpi.1": "Прирост добычи",
        "kpi.2": "Снижение NPT",
        "kpi.3": "Снижение OPEX",
        "kpi.4": "Время до эффекта",
        "section.mvp": "Приоритеты MVP",
        "section.docs": "Документы проекта",
        "footer": "Сделано для быстрого внедрения, измеримого эффекта и промышленного масштаба"
      },
      en: {
        "title": "NEXUS OILFIELD AI",
        "top.note": "AI-native digital oilfield service systems",
        "top.btn.kb": "Refresh Knowledge Base",
        "top.btn.ai": "AI Engineer",
        "top.btn.drilling": "Drilling",
        "hero.label": "New Generation Oilfield Services",
        "hero.title": "End-to-End Digital Oilfield Service Company",
        "hero.desc": "From NPT forecasting in drilling to ESP failure prevention: one environment where every decision is connected to data, model, action, and validated economic impact.",
        "chip.1": "SaaS + Gain Share",
        "chip.2": "24/7 Control Center",
        "chip.3": "Human-in-the-loop",
        "chip.4": "MLOps at scale",
        "panel.focus": "Operational Focus",
        "panel.focus.desc": "Drilling, production, reliability and HSE in one digital loop.",
        "panel.revenue": "Revenue Model",
        "panel.revenue.desc": "Platform subscription, outcome delivery service, and bonus for verified effect.",
        "panel.mode": "Deployment Mode",
        "panel.mode.desc": "Fast pilot launch in 90 days with transparent KPIs and Go/No-Go gates.",
        "kpi.1": "Production growth",
        "kpi.2": "NPT reduction",
        "kpi.3": "OPEX reduction",
        "kpi.4": "Time to impact",
        "section.mvp": "MVP Priorities",
        "section.docs": "Project Documents",
        "footer": "Built for fast rollout, measurable impact and industrial scale"
      }
    },
    doc60: {
      ru: {
        "title": "60 · Южно-Обское · Раздел 2 · Литология и стратиграфия",
        "nav.dashboard": "К дашборду",
        "nav.section1": "Раздел 1",
        "nav.section3": "Раздел 3",
        "hero.title": "Раздел 2. Литология и стратиграфия",
        "hero.desc": "Детализированная инженерная раскладка по Южно-Обскому: цветная литология, углы/азимуты, давление и температура, кавернозность, осложнения, продуктивные пласты, газоносность и ГИС.",
        "kpi.depth.caption": "интервал анализа",
        "kpi.blocks": "7+ блоков",
        "kpi.blocks.caption": "стратиграфические зоны",
        "kpi.tables": "8 таблиц",
        "kpi.tables.caption": "база для дизайна БР"
      },
      en: {
        "title": "60 · Yuzhno-Obskoe · Section 2 · Lithology and Stratigraphy",
        "nav.dashboard": "Back to dashboard",
        "nav.section1": "Section 1",
        "nav.section3": "Section 3",
        "hero.title": "Section 2. Lithology and Stratigraphy",
        "hero.desc": "Detailed engineering layout for Yuzhno-Obskoe: colored lithology, dip/azimuth, pressure and temperature, cavernosity, drilling risks, productive layers, gas saturation and geophysics.",
        "kpi.depth.caption": "analysis interval",
        "kpi.blocks": "7+ blocks",
        "kpi.blocks.caption": "stratigraphic zones",
        "kpi.tables": "8 tables",
        "kpi.tables.caption": "mud design baseline"
      }
    },
    doc62: {
      ru: {
        "title": "62 · Южно-Обское · Раздел 4 · Буровой раствор по интервалам",
        "nav.dashboard": "К дашборду",
        "nav.section2": "Раздел 2",
        "nav.section3": "Раздел 3",
        "hero.title": "Раздел 4. Буровой раствор по каждому интервалу",
        "hero.desc": "Страница разделена на отдельные интервалы как в ВЧНГ: Направление, Кондуктор, Эксплуатационная колонна, Хвостовик. Для каждого интервала: риски, целевые параметры, базовая рецептура и контроль.",
        "kpi.intervals": "4 интервала",
        "kpi.intervals.caption": "отдельные табы",
        "kpi.density.caption": "рабочий диапазон плотности",
        "kpi.depth.caption": "общая глубина трассы",
        "kpi.gnvp": "Фокус ГНВП",
        "kpi.gnvp.caption": "усиление в нижнем интервале",
        "tab.dir": "Направление",
        "tab.cond": "Кондуктор",
        "tab.prod": "Экспл. колонна",
        "tab.liner": "Хвостовик"
      },
      en: {
        "title": "62 · Yuzhno-Obskoe · Section 4 · Drilling Fluid by Intervals",
        "nav.dashboard": "Back to dashboard",
        "nav.section2": "Section 2",
        "nav.section3": "Section 3",
        "hero.title": "Section 4. Drilling Fluid by Interval",
        "hero.desc": "This page is split by intervals like VCHNG: Conductor, Surface Casing, Production Casing and Liner. Each interval includes risks, target parameters, base recipe and control logic.",
        "kpi.intervals": "4 intervals",
        "kpi.intervals.caption": "separate tabs",
        "kpi.density.caption": "working density range",
        "kpi.depth.caption": "total trajectory depth",
        "kpi.gnvp": "Kick control focus",
        "kpi.gnvp.caption": "extra control in lower interval",
        "tab.dir": "Surface",
        "tab.cond": "Conductor",
        "tab.prod": "Prod. casing",
        "tab.liner": "Liner"
      }
    }
  };

  function detectPageKey() {
    const bodyKey = document.body.getAttribute("data-page");
    if (bodyKey) return bodyKey;
    const p = (window.location.pathname || "").toLowerCase();
    if (p.includes("60_yuzhno_obskoe_lithology_stratigraphy")) return "doc60";
    if (p.includes("62_yuzhno_obskoe_drilling_fluid_intervals")) return "doc62";
    return "";
  }

  function getLang() {
    return localStorage.getItem(STORAGE_LANG) || "ru";
  }

  function getUnits() {
    return localStorage.getItem(STORAGE_UNITS) || "si";
  }

  function t(pageKey, lang, key) {
    const pageDict = DICT[pageKey] && DICT[pageKey][lang] ? DICT[pageKey][lang] : {};
    const common = DICT.common[lang] || {};
    return pageDict[key] || common[key] || "";
  }

  function mToFt(v) {
    return v * 3.280839895;
  }

  function cToF(v) {
    return (v * 9) / 5 + 32;
  }

  function mpaToPsi(v) {
    return v * 145.0377377;
  }

  function sgToPpg(v) {
    return v * 8.345404;
  }

  function parseRange(raw) {
    const parts = String(raw).split("-").map(function (x) {
      return Number(x.trim());
    });
    if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
    return parts;
  }

  function fmt(n, digits) {
    return Number(n).toFixed(digits);
  }

  function convertUnit(el, units) {
    const unitType = el.getAttribute("data-unit-type");
    const raw = el.getAttribute("data-unit-value");
    if (!unitType || raw == null) return;

    if (units === "si") {
      const siText = el.getAttribute("data-unit-si");
      if (siText) {
        el.textContent = siText;
        return;
      }
      if (unitType === "length_range_m") {
        el.textContent = raw + " м";
        return;
      }
      if (unitType === "density_range_sg") {
        el.textContent = raw + " SG";
      }
      return;
    }

    const fieldText = el.getAttribute("data-unit-field");
    if (fieldText) {
      el.textContent = fieldText;
      return;
    }

    if (unitType === "length_range_m") {
      const range = parseRange(raw);
      if (!range) return;
      el.textContent = Math.round(mToFt(range[0])) + "-" + Math.round(mToFt(range[1])) + " ft";
      return;
    }

    if (unitType === "temp_c") {
      const c = Number(raw);
      if (Number.isNaN(c)) return;
      el.textContent = fmt(cToF(c), 1) + " °F";
      return;
    }

    if (unitType === "pressure_mpa") {
      const p = Number(raw);
      if (Number.isNaN(p)) return;
      el.textContent = fmt(mpaToPsi(p), 1) + " psi";
      return;
    }

    if (unitType === "density_range_sg") {
      const range = parseRange(raw);
      if (!range) return;
      el.textContent = fmt(sgToPpg(range[0]), 2) + "-" + fmt(sgToPpg(range[1]), 2) + " ppg";
    }
  }

  function applyTranslations(pageKey, lang) {
    if (pageKey) {
      const title = t(pageKey, lang, "title");
      if (title) document.title = title;
    }

    const nodes = document.querySelectorAll("[data-i18n]");
    nodes.forEach(function (node) {
      const key = node.getAttribute("data-i18n");
      const val = t(pageKey, lang, key);
      if (val) node.textContent = val;
    });

    document.documentElement.setAttribute("lang", lang === "en" ? "en" : "ru");
  }

  function applyUnits(units) {
    const nodes = document.querySelectorAll("[data-unit-type][data-unit-value]");
    nodes.forEach(function (node) {
      convertUnit(node, units);
    });
  }

  function ensureControlStyle() {
    if (document.getElementById("locale-units-style")) return;
    const style = document.createElement("style");
    style.id = "locale-units-style";
    style.textContent =
      ".locale-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-left:8px}" +
      ".locale-controls label{font-size:11px;letter-spacing:.04em;color:#cfe2f5;text-transform:uppercase}" +
      ".locale-controls select{background:rgba(7,16,27,.85);color:#e7f2ff;border:1px solid rgba(226,237,255,.2);border-radius:8px;padding:6px 8px;font-size:12px}";
    document.head.appendChild(style);
  }

  function injectControls(pageKey) {
    const host =
      document.querySelector(".top .nav") ||
      document.querySelector(".topbar-actions") ||
      document.querySelector(".topbar") ||
      document.querySelector(".top");
    if (!host) return null;
    if (document.getElementById("locale-controls")) return document.getElementById("locale-controls");

    ensureControlStyle();

    const wrap = document.createElement("div");
    wrap.id = "locale-controls";
    wrap.className = "locale-controls";

    const unitsLabel = document.createElement("label");
    unitsLabel.setAttribute("for", "site-units");
    unitsLabel.setAttribute("data-i18n", "controls.units");

    const unitsSelect = document.createElement("select");
    unitsSelect.id = "site-units";
    unitsSelect.innerHTML =
      '<option value="si" data-i18n="controls.units.si">SI (метрическая)</option>' +
      '<option value="field" data-i18n="controls.units.field">Field (imperial)</option>';

    wrap.appendChild(unitsLabel);
    wrap.appendChild(unitsSelect);
    host.appendChild(wrap);

    unitsSelect.value = getUnits();

    unitsSelect.addEventListener("change", function () {
      localStorage.setItem(STORAGE_UNITS, unitsSelect.value);
      applyUnits(unitsSelect.value);
    });

    return wrap;
  }

  function run() {
    const pageKey = detectPageKey();
    injectControls(pageKey);

    const lang = getLang();
    const units = getUnits();

    applyTranslations(pageKey, lang);
    applyUnits(units);

    window.addEventListener("nexus:lang-change", function (event) {
      const nextLang = event && event.detail && event.detail.lang === "en" ? "en" : "ru";
      applyTranslations(pageKey, nextLang);
    });

    window.addEventListener("storage", function (event) {
      if (event.key === STORAGE_LANG) {
        applyTranslations(pageKey, event.newValue === "en" ? "en" : "ru");
      }
      if (event.key === STORAGE_UNITS) {
        applyUnits(event.newValue === "field" ? "field" : "si");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
