# I4. Casing & Cementing Stress Check Automation
## 30/60/90 День План Реализации

**Инициатива:** Автоматизация расчётов прочности обсадных колонн и цементажа  
**Область экономии:** 85.0 часов (ручные расчёты из 5.pdf)  
**Структура затрат:** Casing 14.8h | Cementing 4.6h + операционное время (~65.6h от других фаз)

---

## 1. Стратегическое обоснование

**Проблема:** В документе 5.pdf найдено **440 строк технических расчётов** для обсадных колонн и цементажа:
- **Расчёты напряги** (stress calculations): external collapse, internal burst, combined loading (bending + axial)
- **Проверки давления** (pressure tests): pre-job tests, cement integrity tests, production tests
- **Табличные данные** (design tables): эпюры нагрузок, коэффициенты безопасности
- **Цементажные калькуляции**: объёмы каши, плотности, вязкости

**Текущее состояние:**
- **Нет цифровой системы валидации**
- **Инженер вручную** вводит параметры в Excel/расчётный софт (~3–5 часов per casing string)
- **Высокий риск ошибок человека** (неправильная плотность, неверная формула, опечатка в нагрузке)
- **Нет audit trail** — если проблема на скважине, сложно отследить почему расчёт выбран

**Решение:** Casing & Cementing Automation:
1. Парсить из 5.pdf все расчётные таблицы и формулы
2. Валидатор напряжений (collapse, burst, combined)
3. Цементажный калькулятор (объёмы, консистенция, давления нагнетания)
4. Автоматический отчёт (с calc sheet для approval)

**Потенциал:**
- **Сокращение расчётного времени на 60–70%** (10 часов → 3 часа)
- **Улучшение консистентности** (все расчёты по одной методике)
- **100% поимка дизайн-девиаций** (автоматическое сравнение design vs actual)

---

## 2. Данные и источники

| Источник | Объём | Содержит | Периодичность | Готовность |
|--|--|--|--|--|
| `5.pdf` (casing/cementing section) | 440 строк | Design tables, stress calcs, pressure test requirements | Static design | ✅ 100% |
| Well design file | ~50 specs | Casing grades, OD, ID, weight, depth intervals | Static design | ✅ From 5.pdf |
| Pressure ratings | ~20 grades | API specs for collapse, burst, combined loading | Static tables | ✅ From standards (API 65, 631) |
| Cement specs | ~10 params | Slurry density, yield, compressive strength, curing schedule | Per job | 🟡 Requires input |
| Temperature profile | ~5 points | Surface temp, gradient, max temp at depth | Per well | ✅ From geothermal data |
| Daily reports | Per cement job | Actual slurry mix, pump rate, volume pumped, top of cement | Per event | 🟡 Requires ingestion |

**Data Ready:**
```
From 5.pdf Casing Design Section:
Interval 1: 0–1200m (кондуктор)
  Casing: 30" OD, 0.469" WT, Grade K-55, API capacity ratings:
    - Collapse: 500 PSI (external)
    - Burst: 600 PSI (internal)
    - Combined (bending 50 klb + axial 100 klb): Safety factor 1.5

Interval 2: 1200–2500m (техническая колонна)
  Casing: 20" OD, 0.375" WT, Grade N-80
    - Collapse: 2000 PSI
    - Burst: 3500 PSI
    - Pressure test: 2500 PSI for 10 min (API 653 standard)

Cementing:
  Class G cement + additives
  Slurry density: 15.8 ppg
  Yield: 1.5 bbl/sack
  Total volume for 500–1200m interval: 287 bbls
  Pumping rate: 6 bbl/min
  Expected top of cement: 600m
  Pressure rating: allowable max 3500 PSI at surface
```

---

## 3. 30/60/90 Цикл реализации

### 🔵 ДНИ 1–30: Парсинг и базовый валидатор

**День 1–5: Экстракция расчётных таблиц из 5.pdf**
- [ ] Загрузить 5.txt (уже готово из extraction phase)
- [ ] Идентифицировать все таблицы в разделе "обсадные колонны":
  - Casing design table (depth, OD, grade, weight, WT)
  - API capacity table (collapse, burst, combined)
  - Load profile (axial load vs depth, bending moment)
- [ ] Парсить in structured format:
  ```python
  casings = [
    {
      "interval": "0–1200m",
      "name": "conductor",
      "od_inch": 30,
      "id_inch": 29.062,
      "wt_inch": 0.469,
      "grade": "K-55",
      "weight_ppf": 250,  # pounds per foot
      "collapse_psi": 500,
      "burst_psi": 600,
      "combined_load_capacity_klb": 200
    },
    ...
  ]
  ```
- [ ] Валидировать на стандартные рейтинги (API 65, 631)

**День 6–15: Стресс-калькулятор**
- [ ] Реализовать функции для расчёта напряжений:
  ```python
  def calc_collapse_stress(od_inch, id_inch, external_pressure_psi):
      # Formulas from API 65 Appendix C
      d_ratio = od_inch / id_inch
      # ... Yield-body, thread, etc.
      sigma_collapse = api_formula(d_ratio, external_pressure_psi)
      return sigma_collapse
  
  def calc_burst_stress(od_inch, id_inch, internal_pressure_psi):
      # Lame equations for thin-walled cylinder
      sigma_burst = api_formula(od_inch, id_inch, internal_pressure_psi)
      return sigma_burst
  
  def calc_combined_loading(axial_load_klb, bending_moment_in_klb, cf_collapse, cf_burst):
      # Von Mises combined stress
      yield_strength = api_grade_yield(grade)
      sigma_combined = sqrt(sigma_axial**2 + sigma_bending**2)
      cf = yield_strength / sigma_combined
      return cf
  ```
- [ ] Валидировать на примерах из 5.pdf:
  ```
  Example 1: 30", K-55, WT 0.469", depth 800m
    External pressure (hydrostatic): ~400 psi
    Collapse capacity (API): 500 psi
    Safety factor: 500/400 = 1.25 ✅
  ```
- [ ] Точность: MAE <5% от ручного расчёта

**День 16–25: Цементажный калькулятор**
- [ ] Реализовать функции:
  ```python
  def calc_slurry_volume(hole_od_inch, casing_id_inch, depth_from_m, depth_to_m):
      # Volume = area × length
      hole_area = pi * (hole_od_inch/2)**2
      casing_area = pi * (casing_id_inch/2)**2
      annular_area = hole_area - casing_area
      depth_m = depth_to_m - depth_from_m
      volume_bbl = annular_area * depth_m / 5.615  # convert to barrels
      return volume_bbl
  
  def calc_pump_schedule(total_volume_bbl, pump_rate_bbl_min, stage_volumes=None):
      # Generate time schedule for cement job
      if stage_volumes:
          pump_schedule = []
          for stage_vol in stage_volumes:
              time_min = stage_vol / pump_rate_bbl_min
              pump_schedule.append((stage_vol, time_min))
      else:
          time_total = total_volume_bbl / pump_rate_bbl_min
      return pump_schedule
  
  def calc_equipment_capacity(slurry_density_ppg, pump_rate_bbl_min, hole_depth_m):
      # Check if pump & manifold can handle the job
      pressure_required = hydrostatic(slurry_density_ppg) + friction_losses(...)
      cf_capacity = pump_max_pressure / pressure_required
      return cf_capacity
  ```
- [ ] Валидировать на примере из 5.pdf (287 bbls за 500–1200m interval)

**День 26–30: Демо dashboard и acceptance**
- [ ] Построить Streamlit form:
  ```
  INPUT:
  [Interval: 0–1200m ▼]
  [Casing grade: K-55 ▼]
  [External load at 800m: 400 psi]
  [Internal pressure: 600 psi]
  [Bending moment (optional): 0 in-klb]
  [CALCULATE]
  
  OUTPUT:
  ✅ Collapse Safety Factor: 1.25 (>1.0) OK
  ✅ Burst Safety Factor: 1.0 (borderline, recommend check)
  🔴 Combined (with bending 50 klb): 0.95 OVER-CAPACITY
  
  RECOMMENDATION:
  - Option A: Use heavier wall thickness (0.55")
  - Option B: Limit bending moment to <30 klb
  [VIEW CALC SHEET] [EXPORT PDF]
  ```
- [ ] Interface с Completions Engineer, QA review

**Deliverables (День 30):**
- ✅ Casing stress calculator (collapse, burst, combined)
- ✅ Cement volume & pump schedule calculator
- ✅ Streamlit dashboard for input/output
- ✅ Validation against 5.pdf examples (MAE <5%)

---

### 🟡 ДНИ 31–60: Расширенная валидация и стандарты

**День 31–40: Интеграция стандартов (API 65, ISO, местные требования)**
- [ ] Добавить multi-standard support:
  ```python
  def get_design_factor(standard, casing_grade, loading_type):
      # API 65: DF = 0.72 for collapse, 0.75 for burst
      # ISO 13679: DF = 0.9 (more conservative)
      # Regional (e.g., Kazakhstan): DF = 1.0
      factors = {
          "API65": {"collapse": 0.72, "burst": 0.75},
          "ISO": {"collapse": 0.9, "burst": 0.9},
          "custom": {...}
      }
      return factors[standard][loading_type]
  ```
- [ ] Параметризировать safety factors (currently hardcoded 1.25, 1.5 etc.)
- [ ] Добавить temperature corrections:
  ```python
  def adjust_strength_for_temp(yield_strength_psi, temp_c):
      # Temperature deration curves from API
      derate_factor = api_temp_curve(temp_c, grade)
      adjusted_strength = yield_strength_psi * derate_factor
      return adjusted_strength
  ```

**День 41–50: Cement job design validator**
- [ ] Расширить цементажный калькулятор:
  - Выбор слурры (Class G, Class H, additives)
  - Автоматический расчёт консистенции (consistency units, thickening time)
  - Давление нагнетания (pump margin: max allowable - safety margin)
  - Top-of-cement calculation (если недостанет объёма → реко: more bbls)
- [ ] Проверять против стандартов (API 65 Appendix B, OFI HPHT tables)
- [ ] Validate pressure test plan:
  ```
  Example: 20" casing, 2500 PSI burst rating
  Pressure test per API 653: 1.5× LOT (Leak Off Test) or 500 PSI, whichever less
  ...
  ```

**День 51–60: Integration с well design & real-time tracking**
- [ ] Feed from I1 (Depth-Day Optimizer):
  - Schedule говорит, когда будет cementing job → можно подготовить equipment заранее
  - Если позади графика → это может повлиять на cement selection (quick-set?)
- [ ] If real-time cement job data available:
  - Текущее давление нагнетания vs predicted
  - Volume pumped vs expected
  - Alert if something off (e.g., too much pressure = bridge?)

**Deliverables (День 60):**
- ✅ Multi-standard support (API, ISO, regional)
- ✅ Temperature-corrected strength calculations
- ✅ Advanced cement job designer (slurry, consistency, LOT, pressure test)
- ✅ Integration preview with schedule (I1)

---

### 🟢 ДНИ 61–90: Автоматический отчёт и полномасштабный рольаут

**День 61–75: Automated calc sheet generation**
- [ ] Построить PDF generator с полным calc sheet:
  ```
  CASING DESIGN REPORT
  Well: Sakhalin-001
  Date: 2026-04-12
  
  SECTION 1: CONDUCTOR (0–1200m)
  ├─ Casing spec: 30" OD, K-55, WT 0.469"
  ├─ Load analysis:
  │   ├─ External (collar): 400 PSI @ 800m
  │   ├─ Internal (wellbore): 600 PSI
  │   └─ Combined: bending 0 + axial 100 klb
  ├─ Strength check:
  │   ├─ Collapse: 500 PSI (capacity) > 400 PSI (load) ✅ SF=1.25
  │   ├─ Burst: 600 PSI (capacity) < 600 PSI (load) ⚠️ SF=1.0 marginal
  │   └─ Combined: yield 55 ksi > 52.3 ksi calc ✅ SF=1.05
  ├─ Recommendations:
  │   - ACCEPT as designed
  │   - Validate burst capacity with well operator
  │   - Consider heavier grade if pressure test >550 PSI
  └─ Approval:
      ├─ Calculated by: John Engineer [date]
      ├─ Reviewed by: QA Engineer [date]
      └─ Approved by: Well Manager [date]
  
  SECTION 2: TECHNICAL COLUMN (1200–2500m)
  [similar structure]
  
  CEMENT JOB PLAN
  ├─ Slurry: Class G + 20% bentonite
  ├─ Volume: 287 bbls (annular) + 50 bbls (excess)
  ├─ Density: 15.8 ppg
  ├─ Pump schedule:
  │   ├─ Stage 1: 150 bbls @ 6 bbl/min = 25 min (displacer)
  │   ├─ Stage 2: 137 bbls @ 6 bbl/min = 23 min (spacer)
  │   └─ Stage 3: 50 bbls @ 3 bbl/min = 17 min (tail slurry)
  ├─ Pressure test: 2500 PSI × 10 min post-job
  └─ Expected top: 600m
  ```
- [ ] Гибкий шаблон (может регулироваться по стандартам/компании)
- [ ] Digital signature placeholder (для e-sign интеграции)

**День 76–85: Database & revision control**
- [ ] Сохранять все calc sheets в базе данных (PostgreSQL):
  ```python
  casing_design_reports = {
      id: UUID,
      well_id: str,
      interval: str,
      casing_spec: {...},
      loads: {...},
      calc_results: {...},
      approval_status: "draft" | "approved" | "superseded",
      created_by: str,
      created_date: datetime,
      revised_by: str,
      revised_date: datetime,
      notes: str
  }
  ```
- [ ] Версионирование: если дизайн меняется → новая версия, старая помечена "superseded"
- [ ] Audit trail: кто, когда, что изменил

**День 86–90: Production rollout & training**
- [ ] Раскатить на все проектные группы (completions, well engineering)
- [ ] Обучить на использование: input form, interpretation of results, deviation scenarios
- [ ] Собрать feedback:
  - Какие расчёты часто меняются? (может быть, add sensitivity analysis)
  - Какие стандарты нужны? (API, ISO, GOST, regional)
- [ ] Метрики: время на расчёт, частота ошибок, approval velocity

**Deliverables (День 90):**
- ✅ Automated calc sheet generation (PDF with full documentation)
- ✅ Database & audit trail (PostgreSQL)
- ✅ Revision control & approval workflow
- ✅ Integration with well design system
- ✅ Training materials

---

## 4. KPI и метрики успеха

| KPI | Baseline | Целевое | Измерение |
|--|--|--|--|
| **Design calculation time per casing string** | 3–5 часов (manual) | 30–45 минут (auto) | Timestamp from form input to PDF export |
| **Calculation accuracy vs API standards** | ~85% (human errors) | 100% (validation against API) | Deviation from standard requirements |
| **Design variance caught** | ~70% (after review) | 100% (automatic) | % of non-conformances detected at input |
| **Approval velocity** | 2–3 дня (with back-and-forth) | <4 часов (with audit trail) | Time from submission to approval |
| **Cement job variance** | ±15% (planned vs actual volume) | ±5% (with pre-job planning) | Daily report volume vs calculated |
| **Casing-related NPT prevention** | Baseline | >20% reduction | Pressure test failures, leaks, cement integrity issues |

---

## 5. Риски и mitigations

| Риск | Вероятность | Impact | Mitigation |
|--|--|--|--|
| Formulas in 5.pdf incomplete or outdated | 🟡 Medium | 🟡 Medium | Validate against API 65 standards, cross-check with field data |
| Regional standards not covered | 🟡 Medium | 🟡 Medium | Parametrize standard selection, add custom rulesets |
| Temperature effects oversimplified | 🟡 Medium | 🟡 Medium | Use documented geothermal data, validate on high-temp wells |
| Cement data not real-time (batch reports only) | 🟢 Low | 🟡 Medium | Start with batch, add real-time sensors (pressure, temp) later |
| Completion engineers don't trust automation | 🟡 Medium | 🟡 Medium | Show calc sheets with full rationale, require manual approval first |
| Database/revision control complexity | 🟢 Low | 🟢 Low | Use simple version numbering, audit trail in comments |

---

## 6. Зависимости и последовательность

```
I4 (Casing & Cementing Automation)
  ├─ Requires: 5.pdf data ✅ ready
  ├─ Can run parallel: I1, I2, I3, I5
  ├─ Is used by: Well design system (e.g., when changing cello specs)
  └─ Optional integration: I1 (schedule awareness for cement job timing)
```

**Последовательность запуска:**
- День 1: Начать I4 параллельно другим (независимо)
- День 60: Добавить интеграцию с I1 (если нужна schedule awareness)

---

## 7. Команда и ресурсы

| Роль | FTE | Работа | Срок |
|--|--|--|--|
| **Completion/Casing Engineer (Domain)** | 0.6 | Data extraction, formula validation, standard compliance | 60 дней |
| **Data Engineer** | 0.5 | Data parsing, database schema, ETL | 90 дней |
| **Python/Backend Developer** | 0.6 | Calculator implementation, API, PDF generation | 90 дней |
| **QA/Validation** | 0.3 | Testing against standards, regression testing | 60 дней |

**Итого бюджет:** ~2.0 FTE–90 дней

---

## 8. Бюджет и финансовый расчёт

**Экономия:**
- 85 часов потенциальной экономии = **~2 инженер-дней за скважину** (time savings alone)
- Плюс **предотвращение ошибок** (if 1 casing error = $500K cost, and we prevent 5%  = $500K savings)
- Plus **faster approval** (reduce 2–3 дня review to <4 часов = $40K per well per операции)

**Total economic impact = ~$3M+ за 20 скважин (time + error avoidance + approval speed)**

**Инвестиция:**
- Зарплата команды (2.0 FTE × 90 дней × $300/день) = **~$54K**
- ИТ инфраструктура (DB, API, PDF library) = **~$15K**
- **Total OPEX = ~$69K**

**ROI:** $3M / $69K = **~43x**, payback period = **<1 месяц**

---

## 9. Успёх критерии (Definition of Done)

✅ **Day 30:**
- [ ] Casing stress calculator works (collapse, burst, combined)
- [ ] Cement volume calculator works
- [ ] Streamlit demo runs on historical examples from 5.pdf (MAE <5%)

✅ **Day 60:**
- [ ] Multi-standard support (API, ISO, custom)
- [ ] Temperature-corrected models
- [ ] Advanced cement job designer
- [ ] Пилот на 1–2 well designs (completions engineer validates)

✅ **Day 90:**
- [ ] Automated calc sheet PDF generation
- [ ] Database with audit trail & versioning
- [ ] Integrated approval workflow
- [ ] Production rollout (all well designs)
- [ ] Metrics show: 60–70% time reduction, 100% variance detection, <4 hour approval

---

## 10. Следующие шаги (Post-90d)

1. **Масштабирование:** Раскатить на все проектирование (not just drilling)
2. **Integration:** Feed from dynamic well data (if real-time cement pressure available)
3. **Expansion:** Add tubing design, production casing checks
4. **ML:** Learn from field failures → refine factors or recommendations

---

**Статус:** 🔵 Ready to start (День 0)  
**Владелец:** Completion Engineering + Data  
**Следующее совещание:** День 5 (kickoff + API 65 formula validation)
