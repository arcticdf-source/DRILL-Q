# I1. Depth-Day Optimizer + Critical Path Control
## 30/60/90 День План Реализации

**Инициатива:** Система оптимизации глубины-дней и управления критическим путём  
**Область экономии:** 381.7 часов (самые крупные непроизводительные часы в циклах СПО/сборка/травление)  
**Структура затрат:** Tripping 210.2h | Assembly 87.4h | Washing 55.0h | Other 29.1h

---

## 1. Стратегическое обоснование

**Проблема:** В операционном плане скважины (2.pdf, 665 операций) средняя длительность циклов трубопровода (СПО), сборки, травления и разных операций составляет 310+ часов производительного времени. Текущее отсутствие цифровой системы контроля критического пути и прогноза глубины-дней ведёт к:
- **Ориентировочные задержки на 3–7%** от плана
- **Невозможность переоптимизации** последовательности (когда есть погодная задержка или техсбой)
- **Отсутствие раннего предупреждения** о рисках перевозки сроков

**Решение:** Цифровой Depth-Day Optimizer автоматизирует:
1. Прогноз ETA для каждого операционного цикла на основе исторических данных
2. Выявление аномалий в реальном времени (когда операция отстаёт от плана >15%)
3. Рекомендации по переоптимизации последовательности (какую операцию принять дальше)
4. Расчёт критического пути и буфера риска

**Потенциал:** Сокращение дней сверхплана на **8–12%**, улучшение прогнозирования ETA на **±10%**.

---

## 2. Данные и источники

| Источник | Объём | Периодичность | Готовность |
|--|--|--|--|
| `operation_plan_from_2.csv` | 665 операций | Статический план | ✅ 100% |
| Daily Rig Reports (RigLog, MWD/Mud logs) | ~50 параметров/смену | Daily summary | 🟡 Требует интеграция |
| WITS/RTH stream | ~15 параметров real-time | Real-time | 🟡 Требует подписка |
| Sensor telemetry (DFS, Weight indicator, RPM) | ~100+ параметров | 1–10 Hz | 🟡 Требует подписка + ETL |

**Данные в наличии:** operation_plan_from_2.csv (665 операций ~8637.5 часов, breakdown по типам: drilling 31.8%, tripping 30.4%, assembly 8.4%, etc.)

**Пример структуры:**
```csv
op_no,operation,depth_m,plan_hours,cumulative_days
1,Prep_BHA,0,24,1
2,RIH_to_1200,1200,48,3  
3,Drilling_1200_1500,1500,30,4.25
...
665,Well_Securing,4830,12,359.9
```

---

## 3. 30/60/90 Цикл реализации

### 🔵 ДНИ 1–30: Фундамент и базовый прогноз ETA

**День 1–5: Подготовка инфраструктуры и команда**
- [ ] Создать Data Lakehouse для operation plans (PostgreSQL или ClickHouse)
- [ ] Загрузить operation_plan_from_2.csv (665 операций) с валидацией
- [ ] Создать Jupyter notebook для baseline ETA analysis
- [ ] Нанять/выделить: 1 Data Engineer, 1 ML Engineer, 1 Drilling Domain Expert (part-time)

**День 6–15: Базовый ETA predictor**
- [ ] Парсить тип операции из поля `operation` (regex: drilling, tripping, assembly, washing, casing, cementing, etc.)
- [ ] Вычислить baseline ETA = mean_hours_by_operation_type
- [ ] Собрать исторические данные (если есть) о variance по фактическим отчётам  
  *(если нет — использовать 7% margin из предположений)*
- [ ] Построить простую модель: `ETA = baseline_mean × (depth_delta / avg_depth_per_op)`
- [ ] Валидировать на данных 2.pdf (MAE <10%)

**День 16–25: Anomaly detection setup**
- [ ] Определить метрики отклонения: `actual_hours - planned_hours`, `cumulative_days_drift`
- [ ] Создать простой threshold-based detector:  
  ```
  IF actual_hours > planned_hours × 1.15 AND elapsed_time < 0.5 × op_duration
  THEN flag as "falling behind risk"
  ```
- [ ] Интегрировать с Alert API (Email/Slack нотификация подрядчику)
- [ ] Создать Grafana dashboard: план vs факт по операциям

**День 26–30: Демо и acceptance test**
- [ ] Прогнать на исторической последовательности из 2.pdf (665 ops)
- [ ] Показать фактический ETA vs фактический план (если есть логи)
- [ ] Получить feedback от Drilling Manager и Planning Engineer
- [ ] Документировать schema, API контрактов, deployment checklist

**Deliverables (День 30):**
- ✅ PostgreSQL DB с operation_plan_from_2 schema
- ✅ Python ETA predictor module (±10% accuracy)
- ✅ Anomaly detection rules в JSON (threshold-based)
- ✅ Grafana dashboard (план vs факт)
- ✅ Deployment checklist и Runbook

---

### 🟡 ДНИ 31–60: Критический путь и переоптимизация

**День 31–40: Моделирование зависимостей операций**
- [ ] Парсить из operation_plan_from_2 неявные зависимости:
  - Операции на одной скважине идут последовательно (op_n → op_n+1)
  - Некоторые операции (напр., cementing после casing) имеют обязательный порядок
- [ ] Построить DAG (directed acyclic graph) всех 665 операций
- [ ] Рассчитать критический путь (Dijkstra/Bellman) с учётом времени на каждую дугу
- [ ] Вычислить slack & buffer для каждого операции

**День 41–50: Переоптимизация последовательности**
- [ ] При обнаружении отставания (anomaly) автоматически предложить:
  1. Какую операцию принять дальше? (какая даст макс экономии без риска)
  2. Что параллелизировить (если есть мобильные ресурсы)?
  3. На сколько часов это сэкономит?
- [ ] Реализовать как constraint solver (PuLP/OR-Tools) или greedy heuristic:
  ```
  maximize_savings(next_operations) 
  subject to: dependencies respected, risk < threshold
  ```
- [ ] A/B тест: рекомендации vs baseline schedule

**День 51–60: Интеграция и рольаут**
- [ ] Подключить real rig telemetry (если есть WITS/RTH API)
- [ ] Синхронизировать с ежедневными отчётами (RigLog parser)
- [ ] Запустить пилот на реальной скважине (30% операций)
- [ ] Собрать feedback: что сработало, что нет

**Deliverables (День 60):**
- ✅ DAG моделирование 665 операций с критическим путём
- ✅ Next-best-action engine (constraint solver)
- ✅ Slack & buffer калькулятор
- ✅ Integration с rig telemetry & daily reports
- ✅ Пилотный результат (реальная скважина, 30% операций)

---

### 🟢 ДНИ 61–90: Интеллект и полномасштабный рольаут

**День 61–75: Расширенная ML модель ETA**
- [ ] Собрать исторические факты (из пилота + других скважин):
  - `(operation_type, depth, mud_type, bha_weight, rig_capacity) → actual_hours`
- [ ] Обучить XGBoost/LightGBM модель: `ETA = f(операция, контекст)`
- [ ] Добавить feature importance: какой фактор больше влияет на время?
- [ ] Валидировать на кросс-валидации (hold-out test set)

**День 76–85: Интерактивный Depth-Day Dashboard**
- [ ] Построить веб-app (React/Streamlit) для планировщиков:
  - Timeline Gantt с критическим путём (красный цвет = критично)
  - Прямая трансляция отклонений от плана
  - What-if сценарии: "если сдвинуть op_n на 4 часа, как это повлияет на дату завершения?"
  - Рекомендации по переоптимизации (click-to-apply)
- [ ] Роль-на-ролю обучение: Drilling Manager, MWD Handler, Planning Engineer

**День 86–90: Production tuning & rollout**
- [ ] Раскатить на все скважины (не только пилот)
- [ ] Обновить KPI метрики: план vs факт, план vs штраф, сокращение дней перевыполнения
- [ ] Собрать lessons learned, обновить playbook
- [ ] Запланировать I2 & I5 интеграцию (hydraulics + document pipeline)

**Deliverables (День 90):**
- ✅ ML ETA predictor (XGBoost, MAE <±8%)
- ✅ Interactive Depth-Day Dashboard (Streamlit или React)
- ✅ What-if сценарии и переоптимизация recommendations
- ✅ Полная документация: User guide, API spec, Runbook
- ✅ Метрична панель: дневные сбережения, accuracy of ETA

---

## 4. KPI и метрики успеха

| KPI | Baseline | Целевое значение | Измерение |
|--|--|--|--|
| **Plan variance (фактические дни - плановые дни)** | +5-7% | <2-3% | Daily reports vs plan |
| **ETA prediction accuracy** | ±15-20% | ±8-10% | Cumulative days forecast vs actual |
| **Days saved vs plan** | 0 | 30–35 дней за скважину | Cumulative Gantt finish date |
| **Critical path violations caught** | 0% | 100% | Rules engine trigger rate |
| **Time-to-reoptimize decision** | 24–48 часов (manual) | <2 часов (auto) | Alert to recommendation latency |
| **Dashboard adoption rate** | 0% | >70% (engineers)| Daily login/action count |

---

## 5. Риски и миtigations

| Риск | Вероятность | Impact | Mitigation |
|--|--|--|--|
| Missing granular time data in RigLog | 🟡 Medium | 🔴 High | Start with baseline ETA, refine iteratively |
| Domain logic complexity (operation dependencies) | 🟡 Medium | 🟡 Medium | Partner с Drilling Expert, build gradually |
| Real-time telemetry latency/gaps | 🟡 Medium | 🟡 Medium | Hybrid: daily batches + incremental real-time |
| Adoption resistance (engineers prefer manual) | 🟡 Medium | 🟡 Medium | Change mgmt + quick wins (show 1–2 day savings) |
| Data quality issues (typos in operation names) | 🟢 Low | 🟡 Medium | Validation rules + exception handling |

---

## 6. Зависимости и последовательность

```
I1 (Depth-Day Optimizer) 
  ├─ Requires: operation_plan_from_2.csv ✅ ready
  ├─ Can run parallel: I5 (Document Pipeline — поможет расширить данные)
  ├─ Enables: I2 (Hydraulics Twin — критический путь = input для scheduling)
  └─ Complementary: I3 (Losses Engine — anomalies в I1 → потенциальные потери)
```

**Последовательность запуска:** 
- День 1: Начать I1 (быстрое окупление)
- День 30: Включить I5 (расширить инфраструктуру данных)
- День 60: Начать I2 параллельно (I1 обеспечивает контекст для scheduling)

---

## 7. Команда и ресурсы

| Роль | FTE | Работа | Срок |
|--|--|--|--|
| **Data Engineer** | 1.0 | DB schema, ETL, API | 90 дней |
| **ML Engineer** | 0.8 | ETA models, anomaly detection, optimization | 90 дней |
| **Drilling Domain Expert** | 0.4 | Domain logic, dependencies, validation | 45 дней (phase 1 & 2) |
| **Frontend Developer** | 0.5 | Grafana + Dashboard UI | dias 26–90 |
| **DevOps/ML Ops** | 0.2 | Deployment, monitoring, versioning | All phases |

**Итого бюджет:** ~3.7 FTE-90 дней

---

## 8. Бюджет и финансовый расчёт

**Экономия:**
- 381.7 часов потенциальной экономии = **~16 дней за скважину** (при среднем 24-часовом плане)
- При стоимости rig дня = $500K, экономия = **$8M+ за 20 скважинных контрактов**

**Инвестиция:**
- Зарплата команды (3.7 FTE × 90 дней × $300/день) = **~$100K**
- ИТ инфраструктура (DB, cloud, monitoring) = **~$20K**
- **Total OPEX = ~$120K**

**ROI:** $8M / $120K = **~67x**, payback period = **<1 месяц на первой скважине**

---

## 9. Успёх критерии (Definition of Done)

✅ **Day 30:**
- [ ] ETA predictor deployed, MAE <10% на тесте
- [ ] Anomaly detection работает, срабатывает на известных отклонениях
- [ ] Dashboard показывает план vs факт

✅ **Day 60:**
- [ ] Critical path engine работает на 665 операциях
- [ ] Next-best-action recommender работает на пилот скважине (20+ операций)
- [ ] Real rig telemetry интегрировано (если доступно)

✅ **Day 90:**
- [ ] ML ETA model обучена, MAE <±8%
- [ ] Interactive dashboard развёрнут и используется >70% целевых пользователей
- [ ] 1–2 реальных скважины показывают 8–12% экономию дней vs план
- [ ] Документация полная, team обучена

---

## 10. Следующие шаги (Post-90d)

1. **Масштабирование:** Раскатить на 5–10 скважин, собрать метрики
2. **I2 интеграция:** Feeding Hydraulics Twin от critical path (когда какая фаза, какой BHA)
3. **I5 интеграция:** Автоматизировать загрузку operation_plan из PDFs (вместо ручной обработки 2.pdf)
4. **Расширение:** Добавить weather delays, rig breakdown predictions

---

**Статус:** 🔵 Ready to start (День 0)  
**Владелец:** Data Engineering + Drilling Ops  
**Следующее совещание:** День 5 (kickoff + infrastructure setup)
