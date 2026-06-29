# I5. Document-to-Data Ingestion Pipeline
## 30/60/90 День План Реализации

**Инициатива:** Полностью автоматизированная обработка PDF-документов скважин в структурированные данные  
**Область экономии:** 95.0 часов (PDF parsing + manual data input elimination)  
**Структура затрат:** Все категории (cross-cutting enabler)

---

## 1. Стратегическое обоснование

**Проблема:** Текущий процесс подготовки данных:
1. Получить PDF с программой скважины (обычно 50–100 страниц)
2. **Инженер вручную** читает таблицы, переписывает в Excel или CSV
3. Загружает в систему ручно (~3–5 часов per well)
4. Нет версионирования, если PDF обновится → вручную перезагружать
5. **Результат:** I1, I2, I3, I4 не могут автоматизироваться, потому что входные данные не структурированы

**Текущее состояние:**
- 7 PDFs проанализирована вручную → 3620 строк structured data в CSV
- Система готова работать с CSV, но новый PDF требует ручного парсинга
- **Масштабирование невозможно** без автоматизации PDF → CSV конвертации

**Решение:** Document-to-Data Pipeline:
1. **OCR + Table extraction** из PDF (для скан-копий и image-heavy docs)
2. **Semantic segmentation** (узнать секции: hydraulics, casing, operations, losses)
3. **Auto-mapping** к existing data schema (operation_plan, inventory, loss_rules)
4. **Quality assurance** (validate extracted data vs schema)
5. **Versioning & audit** (track changes, old data accessible)

**Потенциал:**
- **Новый PDF обрабатывается <5 минут** (вместо 3–5 часов ручного ввода)
- **98%+ extraction accuracy** (few manual corrections needed)
- **Enables I1–I4** (все 4 инициативы получают автоматические обновления данных)
- **Масштабирование без увеличения headcount** (одна система на 100+ скважин)

---

## 2. Данные и источники

| Источник | Объём | Содержит | Периодичность | Готовность |
|--|--|--|--|--|
| PDFs (1–7.pdf) | 7 files, ~300 pages | Sections: design, hydraulics, operations, losses | Static (example) | ✅ 100% |
| New PDFs (production) | TBD | Same structure but may vary slightly | Daily/per well | 🟡 Requires template |
| OCR output (4_ocr.txt) | 110K chars | Image-to-text for scanned PDFs | Per scan | ✅ 100% from pilot |
| Data schema (target) | 5 types | operation_plan, section_inventory, loss_response, casing_design, etc. | Static | ✅ From deep_analyze |

**Example input/output:**
```
INPUT: Well_ABC_001_Drilling_Program_v3.pdf (75 pages, mixed text/images)
├─ Pages 1–10: Title, well objectives, design summary
├─ Pages 11–45: Hydraulic calculations (tables, formulas)
├─ Pages 46–60: Casing/cementing design (tables, pressure ratings)
├─ Pages 61–75: Operations plan (tabular: operation #, depth, time, QC checks)

OCR PROCESSING:
├─ Detect language (Russian, English, or mixed)
├─ Extract text block by block
├─ Identify section headers ("Гидравлические расчёты", "Техническая колонна", etc.)

OUTPUT (structured data):
├─ hydraulics_section.csv (860 rows, columns: depth, parameter, value, unit)
├─ casing_design.csv (50 rows, columns: interval, od, grade, pressure_rating)
├─ operation_plan.csv (665 rows, columns: op_no, operation, depth_m, plan_hours)
├─ loss_response.csv (30 rows, columns: zone, severity, action)

METADATA:
├─ pdf_file_name: "Well_ABC_001_Drilling_Program_v3.pdf"
├─ extraction_date: 2026-04-12T10:30:00Z
├─ extraction_version: "pipeline_v2.1"
├─ confidence_score: 0.96 (96% of rows matched schema)
├─ sections_detected: [hydraulics, casing, operations, losses]
├─ manual_review_needed: false (auto-validated)
```

---

## 3. 30/60/90 Цикл реализации

### 🔵 ДНИ 1–30: Pipeline минимума (OCR + basic parsing)

**День 1–5: PDF readers and OCR setup**
- [ ] Install PDF processing stack:
  - `PyPDF2` or `pdfplumber` (text extraction from native PDFs)
  - `RapidOCR` or `Tesseract` (OCR for scanned pages)
  - `pdf2image` (convert PDF to PNG for OCR)
- [ ] Test on 1.pdf–7.pdf (already extracted in pilot phase)
- [ ] Create simple pipeline:
  ```python
  def extract_from_pdf(pdf_path):
      try:
          # Try native text extraction first
          text = extract_text_pdfplumber(pdf_path)
          confidence = "native"
      except:
          # Fallback to OCR
          images = pdf2image(pdf_path)
          text = ocr_images(images)
          confidence = "ocr"
      return text, confidence
  ```

**День 6–15: Semantic section detection**
- [ ] Build dictionary of section headers (Russian + English):
  ```python
  SECTION_PATTERNS = {
      "hydraulics": [
          r"гидравлические расчёты",
          r"гидравлика",
          r"потери давления",
          r"hydraulic.*calculation",
      ],
      "casing": [
          r"обсадные колонны",
          r"окончательный дизайн скважины",
          r"casing design",
          r"stress check"
      ],
      "operations": [
          r"план операций",
          r"программа буровой скважины",
          r"operation plan",
          r"drilling schedule"
      ],
      "losses": [
          r"поглощение",
          r"потери флюида",
          r"loss response",
          r"fluid loss rules"
      ]
  }
  
  def detect_sections(text):
      sections = {}
      lines = text.split('\n')
      for i, line in enumerate(lines):
          for section_type, patterns in SECTION_PATTERNS.items():
              if any(re.search(p, line, re.IGNORECASE) for p in patterns):
                  sections[section_type] = i
      return sections
  ```
- [ ] Extract section boundaries (from header to next header)
- [ ] Test on 1–7.pdf: 100% detection rate target

**День 16–25: Table extraction и parsing**
- [ ] Use `camelot` or `tabula` library for native PDF tables
- [ ] For OCR'd text: use regex to identify table patterns:
  ```python
  TABLE_PATTERN = r"(\d+\s+){3,}"  # 3+ numeric columns
  
  def extract_tables_from_section(section_text):
      lines = section_text.split('\n')
      tables = []
      for i, line in enumerate(lines):
          if re.match(TABLE_PATTERN, line):
              # Start of table, collect rows until empty line
              table_rows = [parse_row(line)]
              for j in range(i+1, len(lines)):
                  if lines[j].strip() == "":
                      break
                  table_rows.append(parse_row(lines[j]))
              tables.append(table_rows)
      return tables
  ```
- [ ] Валидировать против known schema:
  - operation_plan: [op_no, operation, depth_m, plan_hours, cumulative_days]
  - hydraulics: [depth, parameter, value, unit]
  - losses: [zone, severity, action]

**День 26–30: Simple QA validation**
- [ ] Implement schema validation:
  ```python
  def validate_row(row, schema):
      for col_name, col_type in schema.items():
          if col_name not in row:
              return False, f"Missing column {col_name}"
          if not is_valid_type(row[col_name], col_type):
              return False, f"Invalid type for {col_name}"
      return True, "OK"
  
  def validate_table(table, schema):
      results = []
      for row in table:
          is_valid, msg = validate_row(row, schema)
          results.append({"row": row, "valid": is_valid, "message": msg})
      return results
  ```
- [ ] Generate QA report: how many rows passed validation? Any manual review needed?
- [ ] Demo: 1.pdf → 1_extracted.csv (with QA report)

**Deliverables (День 30):**
- ✅ PDF text extraction (native + OCR fallback)
- ✅ Semantic section detection (hydraulics, casing, operations, losses)
- ✅ Table extraction & parsing (regex-based for OCR, native API for PDFs)
- ✅ Basic schema validation (confidence score)
- ✅ CSV output for each section

---

### 🟡 ДНИ 31–60: Advanced extraction и semantic mapping

**День 31–40: Improved table detection (Layout Analysis)**
- [ ] Use `pdf2image` + `OpenCV` to detect table boundaries:
  ```python
  def detect_table_bounds_cv(pdf_page_image):
      # Convert to grayscale
      gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
      # Detect horizontal + vertical lines (table grid)
      horizontal = cv2.inRange(gray, 200, 255)  # white space
      horizontal = cv2.morphologyEx(horizontal, cv2.MORPH_OPEN, kernel=(30, 1))
      # Find contours
      contours, _ = cv2.findContours(horizontal, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
      return contours  # table bounding boxes
  ```
- [ ] Crop each table region → send to OCR separately (better accuracy)
- [ ] Match rows across multiple columns (alignment problem)

**День 41–50: NLP-based semantic mapping**
- [ ] Train simple classifier (or use rule library) to map extracted values:
  Example: 
  ```
  Row: ["1", "Разсколка", "0", "24"]
  Column headers detected: [op_no, operation, depth_m, plan_hours]
  Semantic check:
    - op_no=1: numeric, 0<1<1000 ✅
    - operation="Разсколка": matches known operations ["drilling", "tripping", "assembly", "разсколка"] ✅
    - depth_m=0: numeric, 0<0<5000 ✅
    - plan_hours=24: numeric, 0<24<200 ✅
  Result: HIGH confidence (0.98)
  ```
- [ ] For ambiguous rows: flag for manual review

**День 51–60: Fed integration with I1–I4**
- [ ] Set up automated ingestion into I1-I4 systems:
  - When new operation_plan.csv arrives → feed to I1 (Depth-Day Optimizer)
  - When new hydraulics.csv arrives → feed to I2 (Hydraulics Twin)
  - When new loss_response.csv arrives → feed to I3 (Losses Engine)
  - When new casing_design.csv arrives → feed to I4 (Casing Automation)
- [ ] Implement versioning:
  ```python
  def ingest_and_version(table_type, new_data, well_id):
      # Check if this well has existing data
      old_version = db.get_latest(well_id, table_type)
      if old_version:
          # Check for changes
          diff = compare_versions(old_version, new_data)
          if diff:
              # Create new version
              new_version = db.insert_version(well_id, table_type, new_data, diff)
              notify_systems(table_type, new_version)  # alert I1–I4 of change
      else:
          # First time
          db.insert_version(well_id, table_type, new_data)
          notify_systems(table_type, new_data)
  ```
- [ ] Пилот: feed 1–7.pdf data into I1–I4, verify all 4 systems work

**Deliverables (День 60):**
- ✅ Advanced table detection using layout analysis
- ✅ Multi-column row alignment
- ✅ NLP-based semantic mapping & confidence scoring
- ✅ Automated ingestion into I1–I4 systems
- ✅ Versioning & change tracking

---

### 🟢 ДНИ 61–90: Production deployment и scaling

**День 61–75: Full CI/CD pipeline**
- [ ] Build automated workflow:
  ```
  1. New PDF uploaded to S3 bucket
  2. Lambda/Cloud Function triggered
  3. Extract text, tables, sections
  4. Validate against schema
  5. If QA passes (>95% confidence) → auto-ingest to DB
  6. If fails → create manual review task
  7. Send notifications (email, webhook to I1–I4)
  ```
- [ ] Containerize with Docker:
  ```dockerfile
  FROM python:3.9
  RUN apt-get install poppler-utils tesseract-ocr
  COPY requirements.txt .
  RUN pip install -r requirements.txt
  COPY pipeline.py /app/
  ENTRYPOINT ["python", "/app/pipeline.py"]
  ```
- [ ] Deploy to cloud (AWS Lambda, GCP Cloud Functions, or K8s)

**День 76–85: Interactive QA dashboard**
- [ ] Build Streamlit/React UI for manual review:
  ```
  PDF: Well_XYZ_001_v3.pdf
  Overall confidence: 94% ✅
  
  Sections: [✅ Hydraulics 98%] [✅ Casing 97%] [✅ Operations 87% ⚠️] [✅ Losses 95%]
  
  Operations section (87% confidence):
  ├─ Row 1: [1, "Prep BHA", 0, 24] — HIGH confidence
  ├─ Row 2: [2, "RIH to 1200m", 1200, ?] — MEDIUM confidence (plan_hours unclear)
  │   └─ Suggested value: 48h (from similar operations)
  │   └─ [ACCEPT] [REJECT] [INPUT MANUALLY]
  ├─ Row 3: [3, "???", 1200, 30] — LOW confidence
  │   └─ Text unclear in OCR: "Drilling 1200-1450 OR Washing 1200"?
  │   └─ [CHOOSE] [SKIP] [MARK FOR MANUAL]
  
  [SUBMIT] [SAVE & CONTINUE LATER]
  ```
- [ ] Allow human corrections (which feeds back into ML model for retraining)

**День 86–90: Monitoring & continuous improvement**
- [ ] Set up monitoring dashboard:
  - % of PDFs auto-ingested (target: >90%)
  - % of PDFs requiring manual review (target: <10%)
  - Average confidence scores per section
  - Manual corrections per day (to track ML improvement)
- [ ] Retrain models monthly:
  - Collect human corrections from QA dashboard
  - Retrain semantic mapper & confidence predictor
  - Deploy updated model
- [ ] Gather feedback from I1–I4 teams:
  - Is the ingested data useful?
  - Are there missing sections or columns?
  - Do we need new section types?

**Deliverables (День 90):**
- ✅ Full CI/CD pipeline (upload PDF → extract/validate → DB in <5 min)
- ✅ Docker containerization (deploy anywhere)
- ✅ Interactive QA dashboard for manual review
- ✅ ML retraining pipeline
- ✅ Monitoring dashboard & alerts
- ✅ Documentation (pipeline architecture, deployment guide, troubleshooting)

---

## 4. KPI и метрики успеха

| KPI | Baseline | Целевое | Измерение |
|--|--|--|--|
| **PDF processing latency** | 3–5 часов (manual) | <5 минут (auto) | Upload to CSV-ready timestamp |
| **Data extraction accuracy** | ~90% (manual mistakes) | 98% | % of rows validated against schema |
| **Auto-ingestion rate** | 0% | >90% | % of PDFs auto-processed without manual review |
| **Manual review time per PDF** | 1–2 часа | <10 минут | Time to accept/reject extracted data |
| **Schema coverage** | 5 types (static) | 5+ types (expandable) | # of section types supported |
| **Integration with I1–I4** | Manual data feed | Automatic updates | # of automated triggers per day |
| **ML model accuracy** | — | >95% confidence | Precision on test set |

---

## 5. Риски и mitigations

| Риск | Вероятность | Impact | Mitigation |
|--|--|--|--|
| Poor quality scans (faded, rotated pages) | 🟡 Medium | 🟡 Medium | Improve OCR preprocessing (deskew, contrast), manual fallback |
| Table structure varies across PDFs | 🟡 Medium | 🟡 Medium | Build flexible table parser (not regex-based), template learning |
| Section headers in different languages | 🟡 Medium | 🟡 Medium | Multi-language NLP model (Russian, English, others) |
| New data schema evolves (add columns) | 🟢 Low | 🟢 Low | Schema versioning, backward compatibility checks |
| Cloud infrastructure costs | 🟡 Medium | 🟡 Medium | Right-size compute (batch processing, auto-scaling off during low usage) |
| Data privacy (PDFs may contain sensitive info) | 🟡 Medium | 🟡 Medium | Encryption at rest/in-transit, access control, audit logs |

---

## 6. Зависимости и последовательность

```
I5 (Document-to-Data Pipeline)
  ├─ Requires: 1–7.pdf examples ✅ ready
  ├─ Enables: I1 (automatic operation_plan ingestion)
  ├─ Enables: I2 (automatic hydraulics data ingestion)
  ├─ Enables: I3 (automatic loss response matrix ingestion)
  ├─ Enables: I4 (automatic casing design ingestion)
  └─ Can run parallel: All others (but they benefit from I5)
```

**Priority:** I5 is **highest priority enabler** — without it, I1–I4 cannot scale automatically.

**Recommended sequence:**
- **Days 1–30:** I1, I2, I3, I4 start (manual data)
- **Days 1–60:** I5 development in parallel
- **Day 60+:** I5 goes live → feeds automatic updates to I1–I4
- **Day 90+:** All 5 initiatives fully integrated

---

## 7. Команда и ресурсы

| Роль | FTE | Работа | Срок |
|--|--|--|--|
| **ML/NLP Engineer** | 0.8 | OCR integration, semantic mapping, model training | 90 дней |
| **Data Engineer** | 0.8 | Pipeline architecture, database schema, ETL | 90 дней |
| **Backend Developer** | 0.6 | API server, CI/CD, cloud deployment | 90 дней |
| **Frontend Developer (optional)** | 0.4 | QA dashboard UI | 45 дней (phase 2 & 3) |
| **DevOps/Cloud Engineer** | 0.3 | Containerization, infrastructure, monitoring | 90 дней |

**Итого бюджет:** ~3.0 FTE–90 дней (higher than others because cross-cutting)

---

## 8. Бюджет и финансовый расчёт

**Экономия:**
- 95 часов потенциальной экономии = **~4 дня инженерной работы за скважину**
- Плюс **enabling I1–I4** (они тоже экономят, but I5 is their prerequisite for scaling)
- Total per well: **~95 hours direct + indirect savings from I1–I4**

**Financial impact:**
- Direct: 95 hours × $300/hr = $28.5K per well × 20 wells = $570K
- Indirect (I1–I4 become fully automated): 986.2 hours × $300/hr = $295.9K per well × 20 wells = $5.9M
- **Total economic impact = ~$6.5M+ за 20 скважин**

**Инвестиция:**
- Зарплата команды (3.0 FTE × 90 дней × $300/день) = **~$81K**
- ИТ инфраструктура (S3, Lambda/Cloud Functions, K8s, RDS) = **~$30K**
- OCR licenses (if using premium service) = **~$10K**
- **Total OPEX = ~$121K**

**ROI:** $6.5M / $121K = **~54x**, payback period = **<1 месяц**

---

## 9. Успёх критерии (Definition of Done)

✅ **Day 30:**
- [ ] PDF text extraction works (native + OCR fallback)
- [ ] Section detection works (hydraulics, casing, operations, losses)
- [ ] Basic table parsing generates CSV (1–7.pdf → CSV)
- [ ] Schema validation report (confidence scores)

✅ **Day 60:**
- [ ] Advanced table detection (layout analysis)
- [ ] NLP semantic mapping (>95% confidence)
- [ ] Automated ingestion to I1–I4 (versioning + change tracking)
- [ ] Пилот: 1–7.pdf fully processed, fed to all 4 systems

✅ **Day 90:**
- [ ] Production CI/CD pipeline (upload → extract → validate → DB <5 min)
- [ ] Docker containerization & cloud deployment
- [ ] Interactive QA dashboard for manual reviews
- [ ] ML retraining loop & monitoring
- [ ] Metrics show: >90% auto-ingest, <5 min latency, >98% accuracy
- [ ] Full documentation & runbook

---

## 10. Следующие шаги (Post-90d)

1. **Scale & ops:** Monitor pipeline, retrain monthly, expand to new document types
2. **Multi-language:** Add support for other languages (Chinese, French, etc.)
3. **Template learning:** Learn document-specific patterns to improve accuracy further
4. **Advanced AI:** Add table understanding (row/column inference from context)
5. **Integration ecosystem:** Connect to other upstream systems (sales orders, vendor data, etc.)

---

## 11. Multi-Initiative Orchestration

**Once I5 is live (Day 60+), all 5 initiatives become interdependent:**

```
PDF Upload (Well_XYZ_v3.pdf)
  │
  └─→ I5 (Document Pipeline)
      ├─ Extract operations → I1
      │   └─ I1: Calculate Depth-Day, ETA, critical path
      │       └─ Output: Schedule optimization, NPT reduction
      │
      ├─ Extract hydraulics → I2
      │   └─ I2: Calculate ECD, pressure window
      │       └─ Output: ROP optimization, safety alerts
      │
      ├─ Extract loss rules → I3
      │   └─ I3: Load rules, monitor for loss events
      │       └─ Output: Real-time loss response recommendations
      │
      └─ Extract casing design → I4
          └─ I4: Validate stresses, approve design
              └─ Output: Compliance certification
```

**Orchestration key:**
- When I5 detects **schedule change** → notify I1 (recompute critical path)
- When I2 detects **ECD anomaly** → I3 checks if it's a loss event (correlation)
- When I1 detects **operation delay** → I2 adjusts predictions (new timeline)
- When I3 detects **loss severity escalates** → I1 may recommend schedule change (bypass risky interval)

---

**Статус:** 🔵 Ready to start (День 0), but recommend starting slightly offset from I1–I4
　      (I5 by Day 60 can feed updates to mature I1–I4 systems)  
**Владелец:** Data Science + Cloud Engineering  
**Следующее совещание:** День 5 (kickoff + OCR tool selection, AWS/GCP setup)
