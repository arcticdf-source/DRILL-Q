# I2. Hydraulics Digital Twin
## 30/60/90 День План Реализации

**Инициатива:** Цифровой близнец расчётных гидравлических систем скважины  
**Область экономии:** 284.5 часов (высокая плотность гидравлических расчётов)  
**Структура затрат:** Drilling 164.5h | GIS/Core 59.4h | Washing 55.0h

---

## 1. Стратегическое обоснование

**Проблема:** В проектных документах скважин (особенно 1.pdf и 2.pdf) находится **860 строк гидравлических расчётов** (calc_ratio 0.67–0.71). Текущий процесс:
- **Инженер бурения** вручную проверяет расчёты давления, ECD, потерь напора для BHA/муда
- **Каждая скважина** требует ~24–48 часов расчётов (валидация формул, подстановка параметров, проверка окон)
- **Нет цифровой валидации** — ошибка в давлении может привести к потере скважины или перекрытию естественного газового окна

**Решение:** Hydraulics Digital Twin автоматизирует:
1. Парсинг гидравлических расчётов из PDF (860 строк данных 1.txt)
2. Валидация давлений, потерь напора, осаждения мягких частиц против стандартов
3. Real-time ECD (Equivalent Circulating Density) прогноз по WITS параметрам (flow, RPM, temp)
4. Окно осадки/давления (mud window) эмулятор — автоматический расчёт диапазона безопасных параметров бурения

**Потенциал:** 
- **Автоматизация 6–8 часов расчётной работы инженера** за скважину
- **ECD предсказание ±0.05 ppg** (точнее, чем ручной расчёт)
- **100% поимка window violations** до полевых проблем
- **Оптимизация ROP на 5–10%** (найти пределы безопасного давления)

---

## 2. Данные и источники

| Источник | Объём | Содержит | Периодичность | Готовность |
|--|--|--|--|--|
| `1.pdf` (hydraulics section) | 860 строк | Формулы давления, потерь напора, осаждения, БХА tables | Static design | ✅ 100% |
| WITS/RTH stream | ~50 params | Flow (GPM), RPM, Standpipe Pressure (PSI), Temperature, ROP | Real-time 1–10 Hz | 🟡 Требует подписка |
| Mud lab reports | ~20 params | Mud density (ppg), viscosity (cP), yield point, API filtrate | Daily/shift | 🟡 Требует интеграция |
| BHA specs (design tables) | ~100 filters/subs | Pressure loss vs flow tables, equivalent lengths | Static design | ✅ 100% |
| Casing/Open Hole design | ~50 specs | Pressure ratings, collapse/burst limits, temperature derate | Static design from 5.pdf | ✅ 100% |

**Data Ready:**
- 1.txt: 575 calc-lines (71% of 810 total lines) on hydraulics, mud properties, BHA losses
- Operation_plan_from_2.csv: Operations with depth intervals where different mud/BHA used

**Example structure from 1.txt:**
```
Гидравлические расчёты (Hydraulic Calculations)
Интервал скважины 0–1200м (Well interval 0–1200m)
Диаметр скважины: 12.25" (Hole diameter)
БХА: 8.5" + 6.5" фильтры (BHA config)

Потери давления (Pressure losses):
  DrilString: 65 psi at 450 GPM
  BitNozzles: 120 psi at 450 GPM
  Bit design: 7.625" dia @ 3 nozzles

Эквивалент циркулирующей плотности (ECD):
  Статический сценарий: 10.2 ppg
  Динамический (на RPM=100): 10.8 ppg
  Окно осаждения: 10.0–10.9 ppg (min collapse – max burst)
```

---

## 3. 30/60/90 Цикл реализации

### 🔵 ДНИ 1–30: Фундамент и базовый ECD калькулятор

**День 1–5: Экстракция и парсинг гидравлических таблиц**
- [ ] Загрузить 1.pdf и конвертировать в 1.txt (уже готово)
- [ ] Парсить таблицы БХА потерь используя regex:
  ```
  BHA Config: 8.5" + 6.5" drill collars
  DrilString pressure loss: 65 psi @ 450 GPM
  ```
- [ ] Построить Python library `hydraulics.py` с классами:
  - `BitNozzle(dia, count)` → pressure_loss(flow_gpm)
  - `DrilString(od, id, length)` → pressure_loss(flow_gpm)
  - `Bit(design)` → pressure_loss(flow_gpm)
- [ ] Валидировать на примерах из 1.pdf (match к руководству точно)

**День 6–15: Статический ECD калькулятор**
- [ ] Построить модель гидравлики:
  ```
  ECD_static = mud_density + (hydrostatic_gradient × depth)
  ECD_dynamic = ECD_static + (friction_gradient × flowpath)
  ```
- [ ] Реализовать итеративный решатель (Darcy-Weisbach for annular losses):
  - Плотность муда (ppg)  → hydrostatic column gradient
  - Вязкость, yield point → friction losses in annulus
  - Flow rate (GPM) → velocity in annulus
  ```
  pf = (24 / Re) × (L / Dh) × (ρ × v²) / 2   # laminar friction
  ```
- [ ] Валидировать на исторических расчётах из 1.pdf (~50 точек)
- [ ] Точность: MAE <0.05 ppg от ручного расчёта

**День 16–25: Окно осадки/давления и constraints**
- [ ] Парсить из design docs (5.pdf):
  - Минимум (collapse): 0.2 ppg над балансом давления
  - Максимум (burst): давление разрыва колонны (из таблиц)
  - Геотемпературный градиент
- [ ] Построить функцию `mud_window(depth, casing_pressure_rating)`:
  ```
  min_density = balance_pressure / depth_gradient
  max_density = (casing_burst_rating / depth_gradient) - safety_margin
  safe_window = [min_density, max_density]
  ```
- [ ] Реализовать alert: `IF ecd > safe_window[1] THEN flag violation`

**День 26–30: Dashboard и демо**
- [ ] Построить Streamlit app (или Grafana):
  - Input: mud density, flow rate, RPM, depth, temperature
  - Output: ECD graph vs depth, safe window (зелёная полоса), текущая точка
  - Alert: ⚠️ если выходим из окна
- [ ] Пустить на исторические сценарии из 2.pdf (трубопровод 0–4830m)
- [ ] Получить feedback от Mud Engineer и Drilling Manager

**Deliverables (День 30):**
- ✅ Hydraulics library с BHA потерями, ECD, mud window калькуляторами
- ✅ Streamlit dashboard (statический калькулятор + visual window)
- ✅ Валидация на исторических данных (MAE <0.05 ppg)
- ✅ API endpoint: `POST /calculate_ecd` (JSON input → ECD output)

---

### 🟡 ДНИ 31–60: Real-time прогноз и интеграция WITS

**День 31–40: WITS/RTH parser и потоковая обработка**
- [ ] Построить WITS-reader module (если доступен API):
  ```python
  wits_stream = connect_to_wits(rig_id="Rig_01")
  for sample in wits_stream:
      flow_gpm = sample["FLOW"]        # GPM
      standpipe_psi = sample["SPP"]    # Standpipe Pressure
      rpm = sample["RPM"]
      hookload = sample["HOOK"]
      depth = sample["DEPTH"]
  ```
- [ ] Синхронизировать с daily reports (если нет real-time):
  - Парсить текстовые отчёты RigLog: `Flow = 450 GPM, SPP = 2500 PSI`
  - Пересчитать ECD на основе reported параметров
- [ ] Хранить time-series в ClickHouse или TimescaleDB
- [ ] Вычислить **фактические потери напора** от ECD:
  ```
  measured_ecd = (standpipe_psi / 0.052 / depth) + static_density
  actual_friction_loss = (measured_ecd - static_density) × 0.052 × depth
  ```

**День 41–50: ML модель ECD prediction**
- [ ] Собрать исторические корреляции (из daily reports на 10+ скважин):
  - `(flow, rpm, depth, temp, mud_density) → measured_ecd`
- [ ] Обучить XGBoost/LightGBM:
  ```
  ecd_predicted = f(flow_gpm, rpm, depth_m, temp_c, density_ppg, viscosity_cp)
  ```
- [ ] На тестовых скважинах: MAE <0.05 ppg
- [ ] Добавить prediction intervals (±0.03 ppg, 95% confidence)

**День 51–60: Real-time alerts & recommendations**
- [ ] Интегрировать с alert engine (I3 — Losses Engine):
  - Если ECD выходит за window → alert подрядчику
  - Если ECD climbing → рекомендация: снизить flow или RPM
  - Если давление растёт неожиданно → anomaly (возможны потери)
- [ ] Добавить automated ROP optimizer:
  ```
  IF ecd_margin > 0.1 ppg THEN recommend: +10% RPM or +50 GPM
  IF ecd_margin < 0.05 ppg THEN recommend: -10% RPM or -50 GPM
  ```
- [ ] Пилот на 1–2 скважинах с инженером на буре

**Deliverables (День 60):**
- ✅ WITS/daily report parser (real-time или batch)
- ✅ ML ECD predictor (MAE <0.05 ppg, с confidence intervals)
- ✅ Real-time alerts: окно осаждения, аномалии, рекомендации
- ✅ Интеграция с I3 (Losses Engine) для комбинированного контроля
- ✅ Пилотный результат: 1–2 скважины

---

### 🟢 ДНИ 61–90: Оптимизация и полномасштабный рольаут

**День 61–75: Гидравлическая симуляция по фазам**
- [ ] Для каждого интервала скважины (5–7 фаз из 2.pdf) вычислять:
  - Когда переходим в новую фазу → меняется диаметр скважины, БХА, вес на крючке
  - Как это влияет на ECD? (model уже готова из дня 40)
- [ ] Предварительно рассчитать ECD-profiles для всех фаз (фактическая дорожная карта)
- [ ] Добавить temperature effects:
  ```
  geotherm_gradient = (T_surface + T_depth_gradient × depth) 
  ρ_corrected = density × temperature_correction_factor(T)
  ```
- [ ] Собрать historical data: какие реальные ECD-ы были по фазам (из пилотных скважин)

**День 76–85: Интерактивная Hydraulics Twin UI**
- [ ] Построить React/Streamlit dashboard:
  - Gantt diagram: фазы скважины (0–1200m vertical, 1200–1950m build, 1950–2500m tangent, 2500–4830m hold)
  - Для каждой фазы: ECD min/max окно (зелёная полоса), текущая точка (красная), trend (синяя)
  - Real-time values: Flow, RPM, SPP, calculated ECD, margin to window
  - Recommendations: кликнуть = apply (отправить команду rig control)
- [ ] Интеграция с I1 (Depth-Day Optimizer): если график отстаёт, показать как ROP adjustment мог бы помочь

**День 86–90: Production rollout & optimization**
- [ ] Раскатить на все бурящиеся скважины
- [ ] Настроить alert thresholds на основе feedback (может быть, слишком sensitive)
- [ ] Собрать метрики: сколько раз рекомендация предотвратила NPT? (from well logs)
- [ ] Документировать: User guide, formulas used, validation results
- [ ] Обучить Mud Engineers на использование dashboard

**Deliverables (День 90):**
- ✅ Real-time Hydraulics Twin dashboard (React/Streamlit)
- ✅ ECD prediction по всем фазам скважины с historical validation
- ✅ Temperature-corrected models для разных глубин
- ✅ Integrated recommendations (ECD window + ROP optimization)
- ✅ Полная документация: equations, parameters, validation results
- ✅ Training materials для Mud Engineers

---

## 4. KPI и метрики успеха

| KPI | Baseline | Целевое | Измерение |
|--|--|--|--|
| **ECD prediction accuracy** | ±0.10 ppg (ручной расчёт) | ±0.05 ppg | MAE на test well logs |
| **Mud window violations caught** | 20–30% (ручная проверка) | 100% | Alert trigger rate vs actual window breach incidents |
| **ROP optimization potential** | — | +5–10% | Compare planned vs optimized ROP profile |
| **Calculation time per well** | 24–48 часов (manuel) | <2 часов (auto) | Dashboard generation latency |
| **Alert adoption & act-upon rate** | 0% | >80% | % of recommendations accepted by rig |
| **NPT reduction from pressure issues** | Baseline | >15% | Compare well logs (no pressure losses after rollout) |

---

## 5. Риски и mitigations

| Риск | Вероятность | Impact | Mitigation |
|--|--|--|--|
| WITS API not accessible or proprietary | 🟡 Medium | 🔴 High | Start with daily batch parsing, add real-time incrementally |
| Formulas in 1.pdf incomplete or outdated | 🟡 Medium | 🟡 Medium | Validate MAE <0.05 against field data, refine iteratively |
| Temperature effects over-simplified | 🟡 Medium | 🟡 Medium | Add geothermal model from geological data, calibrate on wells |
| Pressure transducer drift/calibration errors | 🟢 Low | 🟡 Medium | Use multiple sensors, outlier detection, maintenance alerts |
| Engineers distrust model (prefer manual) | 🟡 Medium | 🟡 Medium | Show historical validation results, quick wins (prevent 1 incident) |
| Mud properties change during hole section | 🟡 Medium | 🟡 Medium | Real-time mud lab integration, auto-update model parameters |

---

## 6. Зависимости и последовательность

```
I2 (Hydraulics Digital Twin)
  ├─ Requires: 1.pdf data (BHA tables, formulas) ✅ ready
  ├─ Requires: WITS or daily reports 🟡 TBD
  ├─ Can run parallel: I5 (Document Pipeline — поможет расширить муд-лаб данные)
  ├─ Enables: I1 (Depth-Day — предоставляет ECD constraints для scheduling)
  └─ Complementary: I3 (Losses Engine — аномалия в давлении → потенциальные потери)
```

**Последовательность запуска:**
- День 1: Начать I2 параллельно I1 (data available, high impact)
- День 30: Если I5 готов — добавить документ parsing для муд-лаб отчётов
- День 60: Интергация с I1 (critical path model) для joint scheduling

---

## 7. Команда и ресурсы

| Роль | FTE | Работа | Срок |
|--|--|--|--|
| **Data Engineer** | 0.6 | WITS/RTH parsing, database schema, ETL | 90 дней |
| **ML Engineer** | 0.8 | ECD models, anomaly detection, ROP optimization | 90 дней |
| **Reservoir/Mud Engineer (Domain)** | 0.5 | Hydraulics formulas, mud window validation, field testing | 60 дней (фаза 1 & 2) |
| **Backend Developer (Python/FastAPI)** | 0.5 | API server, real-time streaming, integration with I3 | 90 дней |
| **Frontend Developer** | 0.5 | Streamlit/React dashboard, real-time UI | 45 дней (фаза 2 & 3) |

**Итого бюджет:** ~3.3 FTE–90 дней

---

## 8. Бюджет и финансовый расчёт

**Экономия:**
- 284.5 часов потенциальной экономии = **~12 дней расходов инженера за скважину** (при cost_per_hour=$300)
- Плюс **предотвращение потерь** (если 1 потеря скважины = $5M risk, и мы предотвратим 5% потерь на 20 скважинах = $5M savings)
- Плюс **ROP оптимизация** (5% прирост = 1.5 дня быстрее за скважину × $500K/день rig cost = $750K за 20 скважин)

**Total economic impact = ~$2M+ за 20 скважин**

**Инвестиция:**
- Зарплата команды (3.3 FTE × 90 дней × $300/день) = **~$90K**
- ИТ инфраструктура (DB, API, dashboard) = **~$25K**
- WITS/RTH subscription (if needed) = **~$15K/скважина** (пилот 2 скважины = $30K)
- **Total OPEX = ~$145K**

**ROI:** $2M / $145K = **~14x**, payback period = **~2 месяца**

---

## 9. Успёх критерии (Definition of Done)

✅ **Day 30:**
- [ ] Hydraulics library готова, API валидирована (MAE <0.05 ppg на тестовых примерах)
- [ ] Streamlit dashboard показывает ECD по операциям из 2.pdf
- [ ] Mud window alerts срабатывают на simulated scenarios

✅ **Day 60:**
- [ ] WITS/daily reports интегрированы (real-time или batch)
- [ ] ML ECD model обучена и валидирована (MAE <0.05 ppg на тестовых скважинах)
- [ ] Пилот на 1–2 скважинах показывает accurate predictions
- [ ] Integrated с I3 (Losses Engine) alerts

✅ **Day 90:**
- [ ] Interactive Hydraulics Twin UI развёрнута
- [ ] Real-time ROP recommendations работают (адаптивное регулирование)
- [ ] 2–3 скважины показывают 5–10% ROP improvement или 15% NPT reduction from pressure issues
- [ ] Полная документация, team обучена

---

## 10. Следующие шаги (Post-90d)

1. **Масштабирование:** Раскатить на все бурящиеся скважины, собрать метрики
2. **I1 интеграция:** Feeding от Hydraulics Twin к Depth-Day (ECD constraints → critical path)
3. **I5 интеграция:** Автоматический парсинг муд-лаб отчётов из PDFs
4. **Расширение:** Добавить sand control models, hole cleaning predictions, surge/swab analysis

---

**Статус:** 🔵 Ready to start (День 0)  
**Владелец:** Mud & Data Engineering  
**Следующее совещание:** День 5 (kickoff + WITS access verification)
