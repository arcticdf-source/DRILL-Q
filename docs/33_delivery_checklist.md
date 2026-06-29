# Delivery Checklist: Что готово и что дальше

## 1) Уже готово
- Анализ 1-7 PDF и extraction pipeline.
- Датасеты: section inventory, operation plan, loss matrix.
- Backlog и оценка экономии (986.2 ч/скважину).
- Чартеры I1-I5 с 30/60/90 планом.
- Master roadmap.
- Визуальные дашборды и Gantt-страницы.

## 2) До запуска pilot (обязательно)
- Назначить владельцев модулей I1-I5.
- Зафиксировать baseline KPI по текущим скважинам.
- Утвердить data contracts (форматы, частота, SLA).
- Подготовить контур доступа к WITS/WITSML и daily reports.
- Утвердить критерии "pilot success/fail".

## 3) Техническая готовность
- I1: ETA baseline + drift detection + dashboard.
- I2: ECD calculator + window checks + alerting.
- I3: Rule engine (30 rules) + action playbook UI.
- I4: Stress/cement checks + auto-report draft.
- I5: PDF->structured ingestion + confidence scoring.

## 4) Data Quality Checklist
- Полнота ключевых полей (well_id, op_no, depth_m, plan_h).
- Проверка единиц измерения (psi/bar, m/ft, ppg/sg).
- Контроль пропусков и выбросов в операциях и давлении.
- Версионирование документов и обратная трассировка к источнику.

## 5) Production Readiness
- Наблюдаемость: логи, метрики, алерты, трассировка.
- RACI и on-call на инциденты.
- Регламенты fallback при недоступности стримов.
- Контур ИБ и доступов к технологическим данным.
- План обучения пользователей на буровой и в инженерном центре.

## 6) Гейт на Day-30
- KPI baseline зафиксирован.
- Минимальные API между I5 и I1/I2/I3/I4 работают.
- Дашборды доступны и читаемы владельцами.
- Не менее 1 пилотной скважины подключено.

## 7) Гейт на Day-60
- Потоковые события и алерты стабилизированы.
- Доказана польза на пилоте: ETA/NPT/Safety улучшились.
- Определены изменения для production rollout.

## 8) Гейт на Day-90
- Пакет I1-I5 готов к тиражированию.
- Документация, runbook, обучение завершены.
- Экономический эффект подтвержден на фактах pilot.
