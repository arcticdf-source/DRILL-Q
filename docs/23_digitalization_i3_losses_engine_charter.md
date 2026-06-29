# I3. Losses Response Engine
## 30/60/90 День План Реализации

**Инициатива:** Цифровой рекомендатор действий при поглощениях буровых флюидов  
**Область экономии:** 140.0 часов (структурированная матрица правил потерь 7.pdf)  
**Структура затрат:** Mud/Risk category (из deep_analysis.json)

---

## 1. Стратегическое обоснование

**Проблема:** В документе 7.pdf найдена **матрица из 30 структурированных правил** для действий при поглощениях:
- Две зоны (кондуктор, техническая колонна) × три уровня severity (low/medium/high flow loss)
- Каждое правило = `IF (zone, severity) THEN [action1, action2, ...]`
- Пример: `IF (техническая колонна, потери 2–5 м³/ч) THEN [снизить на 25 м³/ч, добавить LCM, monitor SPP]`

**Текущее состояние:**
- **Нет цифровой системы** для быстрого поиска правильного действия
- **Инженер бурения** вручную ищет в документах (~30 минут на event)
- **Невозможно отследить** what actions were taken и what was effective (нет feedback loop)
- **Текущие потери NPT** от неправильных действий или задержек: ~5–10 часов per loss event

**Решение:** Losses Response Engine:
1. Парсить и кодифицировать **30 правил из loss_response_matrix_from_7.csv**
2. Real-time classifier: при обнаружении потерь (из WITS fluid returns) → автоматически предложить действие
3. Playbook recommender: показать пошаговые инструкции с rationale
4. Feedback loop: после события → собрать метрики (какое действие было эффективным?)

**Потенциал:**
- **Сокращение time-to-action с 30 минут до <5 минут** (instant recommendation)
- **Улучшение effectiveness действий на 15–20%** (structured vs ad-hoc)
- **Предотвращение потерь тоннажа** (если не потеряем флюид → не потеряем дни)

---

## 2. Данные и источники

| Источник | Объём | Содержит | Периодичность | Готовность |
|--|--|--|--|--|
| `loss_response_matrix_from_7.csv` | 30 rows | Zone, severity band, actions with rationale | Static rules | ✅ 100% |
| WITS return manifold | 3–5 params | Flow in (GPM), Flow out (GPM), delta = loss rate | Real-time 1 Hz | 🟡 Requires WITS API |
| Mudlog or daily reports | ~100 events | Loss rate, depth, duration, actions taken, outcome | Daily/per event | 🟡 Requires ingestion |
| Standpipe pressure (SPP) | 1 param | SPP PSI | Real-time | 🟡 Requires WITS |
| Well design (zones) | ~5 intervals | Zone name (кондуктор 0–500m, tech col 500–2500m, etc.) | Static design | ✅ From 5.pdf |

**Data Ready:**
```csv
zone,severity_band_m3_per_h,action_priority,action,rationale
кондуктор,0-0.5,1,Continue drilling monitor,Loss within tolerance
кондуктор,0.5-2,2,Reduce flow 50 GPM + add LCM,Partial loss
кондуктор,2-5,3,Reduce flow 100 GPM + pump pills,Significant loss
техническая_колонна,0-0.5,1,Continue drilling monitor,Loss within tolerance
техническая_колонна,0.5-2,2,Reduce flow 25 GPM + add weight material,Partial loss tech column
техническая_колонна,2-5,3,Stop drilling + pumping pills + increase density,Significant loss risk
... (30 total rules)
```

---

## 3. 30/60/90 Цикл реализации

### 🔵 ДНИ 1–30: Правила и baseline классификатор

**День 1–5: Парсинг и валидация матрицы правил**
- [ ] Загрузить loss_response_matrix_from_7.csv (30 rows)
- [ ] Парсить в структурированный формат:
  ```python
  rules = [
    {
      "zone": "кондуктор",
      "severity_band": [0.0, 0.5],  # m3/h
      "priority": 1,
      "actions": [
        {"action": "Continue drilling monitor", "duration_min": 0}
      ]
    },
    ...
  ]
  ```
- [ ] Валидировать:
  - Нет пропусков в severity bands (должны быть continuous intervals)
  - Приоритеты логичны (higher loss → higher priority)
- [ ] Получить sign-off от Drilling Manager + Loss Control Engineer

**День 6–15: Событийный классификатор (правила-based)**
- [ ] Построить event detector:
  ```python
  def detect_loss_event(flow_in_gpm, flow_out_gpm, depth_m):
      loss_rate = (flow_in_gpm - flow_out_gpm) * 0.00378  # convert to m3/h
      zone = get_zone(depth_m)  # "кондуктор", "tech_col", etc.
      if loss_rate > threshold[zone]:
          return LossEvent(zone=zone, loss_rate=loss_rate, depth=depth_m)
      return None
  ```
- [ ] Реализовать severity classifier:
  ```python
  def classify_severity(loss_rate_m3_h, zone):
      rules_for_zone = [r for r in rules if r["zone"] == zone]
      for rule in sorted(rules_for_zone, key=lambda r: r["severity_band"][0]):
          if rule["severity_band"][0] <= loss_rate < rule["severity_band"][1]:
              return rule
      return highest_severity_rule(zone)
  ```
- [ ] Outputs:
  - Zone (кондуктор/техническая колонна/открытый каротрёп)
  - Severity band (0–0.5, 0.5–2, 2–5 m³/h)
  - Recommended actions (action1, action2, ... ordered by priority)

**День 16–25: Playbook recommender UI**
- [ ] Создать simple HTML/Streamlit card:
  ```
  ⚠️ LOSS EVENT DETECTED
  Zone: кондуктор
  Loss rate: 1.2 m³/h (SIGNIFICANT)
  Depth: 380m
  
  RECOMMENDED ACTIONS (в порядке):
  1️⃣  Reduce flow 100 GPM + pump pills
      └─ Rationale: Significant loss in conductor
      └─ Duration: 30–60 min
  2️⃣  Add heavier LCM (granular 1–2 mm)
      └─ Rationale: Fill fracture pathways
      └─ Duration: 20–40 min
  3️⃣  If loss continues → STOP drilling, activate emergency procedure
      └─ Fallback for total loss
  
  [ACCEPT & APPLY] [SKIP] [CALL EXPERT]
  ```
- [ ] Интегрировать с alert system (email, Slack, SMS to rig)
- [ ] Пилот на симуляторе (обучающий стенд для инженеров)

**День 26–30: Демо и acceptance**
- [ ] Прогнать на исторических loss events (если есть в mudlog)
- [ ] Показать: классификация точна? Действия логичны? Timing реалистично?
- [ ] Получить feedback:
  - Drilling Manager: "правильные ли рекомендации?"
  - Loss Control Engineer: "охватывает ли все сценарии из 7.pdf?"
  - MWD Handler: "удобный ли интерфейс?"

**Deliverables (День 30):**
- ✅ Structured rules JSON (30 rules, fully parsed)
- ✅ Loss event detector (threshold-based on WITS returns)
- ✅ Severity classifier (3 bands per zone)
- ✅ Playbook recommendation UI (Streamlit card)
- ✅ Validation against mudlog events (if available)

---

### 🟡 ДНИ 31–60: ML severity estimator и real-time streaming

**День 31–40: ML модель для severity estimation**
- [ ] Собрать исторические loss events (from mudlog or daily reports):
  - `(flow_in, flow_out, spp, depth, zone, actual_outcome) → actual_severity`
- [ ] Обучить classifier (Random Forest или XGBoost):
  ```
  severity_predicted = f(loss_rate, spp_trend, depth, zone, rig_capacity)
  ```
- [ ] Validate on hold-out test set (accuracy >90%)
- [ ] Интегрировать в playbook recommender (использовать ML score как proxy для severity)

**День 41–50: Real-time WITS streaming & alerting**
- [ ] Подключить WITS API (или daily batch parser):
  ```python
  wits_stream = connect_to_wits(rig_id="Rig_01")
  for sample in wits_stream:
      flow_in = sample["FLOW_IN"]
      flow_out = sample["FLOW_OUT"]
      spp = sample["SPP"]
      depth = sample["DEPTH"]
      evt = detect_loss_event(flow_in, flow_out, depth)
      if evt:
          rule = classify_severity(evt.loss_rate, evt.zone)
          alert_rig(rule.actions, rule.rationale)  # SMS/Slack/App push
  ```
- [ ] Реализовать buffering & deduplication (не spamming rig с alerts каждую секунду)
- [ ] Пилот на реальной скважине (1 неделю)

**День 51–60: Feedback loop & action tracking**
- [ ] Добавить форму для rig crew:
  ```
  Loss event #NNN
  What action did you take? [dropdown + free text]
  How long did it take? [hours]
  Was it effective? [Yes/No/Partial]
  Additional notes: [free text]
  ```
- [ ] Собрать metrics:
  - Time from alert to action (goal: <5 min)
  - Severity predicted vs actual
  - Action effectiveness (did it stop losses?)
- [ ] Обновить rules на основе feedback (if certain action always fails → demote priority)

**Deliverables (День 60):**
- ✅ ML severity estimator (trained, >90% accuracy)
- ✅ Real-time WITS integration (alerts in <2 seconds)
- ✅ Feedback form & tracking system
- ✅ Metrics dashboard (alert accuracy, action timeliness, effectiveness)

---

### 🟢 ДНИ 61–90: Интеграция и полномасштабный рольаут

**День 61–75: Интеграция с I1 (Depth-Day Optimizer) и I2 (Hydraulics Twin)**
- [ ] Feed от I2 (ECD anomalies) → могут быть потери
  ```
  IF ecd_spikes THEN flag as "potential loss pressure"
  ```
- [ ] Feed от I1 (operation delays) → если позади графика → more risk to losses
- [ ] Добавить context в playbook recommender:
  ```
  Loss detected: 2.3 m³/h (tech col, significant)
  ECD is also elevated (10.8 vs baseline 10.2) → could be cascading
  Schedule behind by 4 hours → pressure to stay in hole
  
  RECOMMENDED ACTION:
  Option A: Reduce flow 25 GPM + add LCM (safe, but slow)
  Option B: Pull out + wait + restart (fast, but risky if loss grows)
  
  I1 Data: if stay in hole → gain 1.5 hours, but loss risk +20%
  ```

**День 76–85: Advanced Engine (ML severity + cost/risk optimization)**
- [ ] Реализовать rule engine with constraints:
  ```
  maximize: effectiveness(action) + cost_efficiency(action)
  subject to:
    - safety constraints (margin > 0.05 ppg for ECD)
    - time constraints (preferred_action_duration < remaining_phase_time)
    - equipment constraints (rig capacity)
    
  solve with: Reinforcement Learning (Q-learning) to learn action effectiveness from feedback
  ```
- [ ] Результат: система рекомендует не просто `action_i`, а `action_i + timing + monitoring_threshold`

**День 86–90: Production rollout & training**
- [ ] Раскатить на все бурящиеся скважины
- [ ] Обучить Mud Engineer + MWD Handler на acceptance/rejection criterias
- [ ] Настроить alert sensitivity (thresholds) на основе feedback
- [ ] Документировать: rule source (из 7.pdf), validation results, change log
- [ ] Сбор lessons learned (какие правила работали лучше всего?)

**Deliverables (День 90):**
- ✅ Integrated Loss Response Engine (rules + ML + recommendations)
- ✅ Real-time playbook recommender с context (ECD, schedule, costs)
- ✅ Advanced R.L. model для оптимизации действий
- ✅ Production dashboard & alerts (SMS, email, app)
- ✅ Training materials & standard operating procedure

---

## 4. KPI и метрики успеха

| KPI | Baseline | Целевое | Измерение |
|--|--|--|--|
| **Time to action (from alert to crew action)** | ~30 мин (manual search) | <5 мин (auto recommend) | Alert timestamp vs crew action timestamp |
| **Loss event classification accuracy** | ~70% (manual) | >90% | Confusion matrix: predicted vs actual severity |
| **Action effectiveness rating** | Avg 60% (ad-hoc) | Avg 80% (structured) | % of "Yes/Partial" responses in feedback form |
| **NPT reduction from losses** | Baseline | >15% | Compare well logs (loss response time) |
| **Alert precision** | ~60% (many false alarms) | >85% | (True positives) / (True + False positives) |
| **Rule coverage** | 30/30 (rules) | 30/30 actively used | % of rules triggered in 90 days |

---

## 5. Риски и mitigations

| Риск | Вероятность | Impact | Mitigation |
|--|--|--|--|
| WITS flow sensors unreliable/calibration drift | 🟡 Medium | 🟡 Medium | Validate with mudlog reports, outlier detection |
| 30 rules incomplete (missing edge cases from field) | 🟡 Medium | 🟡 Medium | Feedback loop to capture new scenarios, rule versioning |
| Crew ignores recommendations (prefer ad-hoc) | 🟡 Medium | 🟡 Medium | Show historical success rate, quick wins (prevent 1 loss) |
| Over-alerting (high false positive rate) | 🟡 Medium | 🟡 Medium | Tuning thresholds on first 2–3 wells, ML filtering |
| Delayed mudlog data (if using batch reports) | 🟢 Low | 🟡 Medium | Prioritize real-time WITS if available, batch fallback |

---

## 6. Зависимости и последовательность

```
I3 (Losses Response Engine)
  ├─ Requires: loss_response_matrix_from_7.csv ✅ ready
  ├─ Requires: WITS/mudlog data 🟡 TBD
  ├─ Can run parallel: I1, I2, I5
  ├─ Enables: cost/risk optimization (combined with I1 & I2)
  └─ Complementary: I2 (Hydraulics Twin) — ECD spikes correlate with losses
```

**Последовательность запуска:**
- День 1–30: Быстрая реализация правил-based engine (I3 is quick win)
- День 31+: Добавить ML & интеграцию с I1/I2

---

## 7. Команда и ресурсы

| Роль | FTE | Работа | Срок |
|--|--|--|--|
| **Loss Control Engineer (Domain)** | 0.6 | Rule validation, feedback interpretation, optimization | 90 дней |
| **Data Engineer** | 0.5 | WITS/mudlog parsing, event streaming, API | 90 дней |
| **ML Engineer** | 0.4 | Severity classifier, cost/risk optimizer, RL model | 90 дней |
| **Backend Developer** | 0.4 | Alert engine, feedback form, integration API | 60 дней |

**Итого бюджет:** ~1.9 FTE–90 дней

---

## 8. Бюджет и финансовый расчёт

**Экономия:**
- 140 часов потенциальной экономии (time to action, fewer mistakes) = **~6 дней инженерной работы**
- Плюс **предотвращение потерь** (if we catch loss event 5 minutes earlier → save ~0.5 часа × 10 events/скважина = 5 часов)
- Total per well: **~140 часов экономии + avoiding loss-related delays**

**Financial impact:**
- 140 часов × $300/hour = $42K per well
- 20 скважин × $42K = $840K (just time savings)
- Plus avoiding losses ($1M+ at risk per uncontrolled loss event) = $5M+ risk mitigation

**Инвестиция:**
- Зарплата команды (1.9 FTE × 90 дней × $300/день) = **~$51K**
- ИТ инфраструктура (alert system, real-time DB) = **~$20K**
- **Total OPEX = ~$71K**

**ROI:** ($840K + risk mitigation) / $71K = **~12x minimum**, payback period = **<1 месяц**

---

## 9. Успёх критерии (Definition of Done)

✅ **Day 30:**
- [ ] 30 rules fully parsed, validated by Loss Control Engineer
- [ ] Playbook recommender UI working (single loss scenario demo)
- [ ] Alert system sends notifications (email/SMS)

✅ **Day 60:**
- [ ] Real-time WITS integration (streaming or batch)
- [ ] ML severity classifier trained (>90% accuracy)
- [ ] Feedback form capturing action outcomes
- [ ] Пилот на 1 скважине (30 days of real events)

✅ **Day 90:**
- [ ] Advanced engine with cost/risk optimization
- [ ] Integrated with I1 & I2 (context-aware recommendations)
- [ ] Production rollout (all wells)
- [ ] Metrics show: <5 min alert-to-action, >80% effectiveness, >15% NPT reduction

---

## 10. Следующие шаги (Post-90d)

1. **Масштабирование:** Раскатить на все бурящиеся скважины
2. **Rule evolution:** Из каждой скважины → новые правила/edge cases
3. **Cost optimization:** Feed real loss data → optimize rule priorities by ROI
4. **I1 integration:** Schedule aware (if behind → adjust loss tolerance)

---

**Статус:** 🔵 Ready to start (День 0)  
**Владелец:** Loss Control + Data Engineering  
**Следующее совещание:** День 5 (kickoff + rule validation with Loss Control Engineer)
