# Integration Matrix: I1-I5

## Data Flow Matrix
| Source/Target | I1 Depth-Day | I2 Hydraulics | I3 Losses | I4 Casing/Cementing | I5 Doc Pipeline |
|---|---|---|---|---|---|
| I1 Depth-Day | - | Передает phase timeline для ECD расчетов | Передает schedule-risk для приоритета алертов | Передает timing для цементажа и окон работ | Потребляет обновленные планы операций |
| I2 Hydraulics | Передает ECD constraints в оптимизацию критпути | - | Передает pressure anomalies как триггеры loss events | Передает pressure envelopes для проверок прочности | Потребляет новые гидравл. разделы из PDF |
| I3 Losses | Передает loss impact в оценку ETA/NPT | Передает факты потерь для recalibration ECD | - | Передает risk flags для корректировок дизайна колонны | Потребляет обновленные playbooks из PDF |
| I4 Casing/Cementing | Передает ограничения этапов в расписание | Передает design limits для гидравлических окон | Передает failure modes для правил реагирования | - | Потребляет design tables и формулы из PDF |
| I5 Doc Pipeline | Поставляет operation_plan и версии | Поставляет гидравлические таблицы/параметры | Поставляет loss matrix и процедуры | Поставляет casing/cementing данные | - |

## Event Matrix
| Event | Producer | Consumers | SLA |
|---|---|---|---|
| New drilling program PDF uploaded | I5 | I1, I2, I3, I4 | <= 5 min |
| ECD threshold breach | I2 | I1, I3 | <= 30 sec |
| Loss event classified medium/high | I3 | I1, I2, I4 | <= 30 sec |
| Schedule drift > 10% | I1 | I2, I3, PMO | <= 10 min |
| Casing stress non-compliance | I4 | I1, QA/HSE | <= 10 min |

## API Contract Outline
| API | Method | Minimal Payload |
|---|---|---|
| /events/schedule-drift | POST | well_id, op_no, planned_h, actual_h, drift_pct |
| /events/ecd-alert | POST | well_id, depth_m, ecd, min_window, max_window, severity |
| /events/loss-event | POST | well_id, zone, loss_rate_m3h, severity, action_id |
| /events/design-alert | POST | well_id, string_id, check_type, measured, limit |
| /ingest/document-version | POST | well_id, doc_id, version, section, confidence |

## Integration Priorities
1. I5 -> I1 (операционный план и версии) как базовый контур.
2. I2 <-> I3 (давление/поглощения) как safety контур.
3. I1 <-> I2 (скорость/окна) как производительность.
4. I4 -> I1/I2 (design constraints) как контур соответствия.
