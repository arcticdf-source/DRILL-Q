# 03. AI-платформа и архитектура

## 1) Логическая архитектура

- Data Sources: SCADA, historians, IoT, ERP, CMMS, LIMS, лаборатории, ручные вводы
- Ingestion: streaming + batch
- Lakehouse: сырые, обработанные и бизнес-слои
- Feature Store: временные ряды, событийные признаки, инженерные признаки
- Model Layer: прогнозы, оптимизация, аномалии, рекомендации
- Decision Layer: правила + оптимизационные агенты + сценарный анализ
- Apps Layer: дашборды, mobile app, command center UI, API для клиентов

## 2) Ключевые AI-модули

- NPT Predictor
- ROP Optimizer
- ESP Failure Predictor
- Production Choke Optimizer
- Energy Load Optimizer
- Corrosion & Integrity Monitor

## 3) MLOps

- Model registry
- CI/CD для моделей
- Контроль data drift и model drift
- Автоматические retrain pipelines
- A/B тестирование рекомендаций
- Explainability слой для инженеров

## 4) Кибербезопасность и доступ

- Zero Trust, RBAC/ABAC
- Шифрование данных at rest/in transit
- Сегментация OT/IT контуров
- SOC monitoring
- Аудит доступа и действий пользователей

## 5) Data governance

- Каталог данных с владельцами
- Политики качества данных и SLA на данные
- Data lineage от датчика до отчета
- Классификация данных и сроки хранения

## 6) Технологический стек (пример)

- Cloud: Azure/AWS (гибридный вариант)
- Processing: Spark/Flink
- Storage: Lakehouse (Parquet/Delta)
- Orchestration: Airflow
- MLOps: MLflow + CI/CD
- Visualization: Power BI/Grafana + custom web app
