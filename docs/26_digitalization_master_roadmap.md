# Digitalization 5-Initiative Roadmap
## Full 90-Day Orchestration Plan

**Date:** April 12, 2026  
**Status:** Ready to Execute  
**Total Expected Savings:** 986.2 hours (~11.4% of total drilling operation time)  
**Total Investment:** ~$426K (teams, infrastructure, tools)  
**ROI:** ~23x (range 12x–67x depending on initiative)  

---

## Executive Summary

### The Five Initiatives (Ranked by Impact)

| Priority | Initiative | Savings | ROI | Key Data Source |
|--|--|--|--|--|
| 1️⃣ | **I1: Depth-Day Optimizer** | 381.7 h | 67x | operation_plan_from_2.csv (665 ops) |
| 2️⃣ | **I2: Hydraulics Digital Twin** | 284.5 h | 14x | 1.pdf hydraulics section (860 rows) |
| 3️⃣ | **I3: Losses Response Engine** | 140.0 h | 12x | loss_response_matrix_from_7.csv (30 rules) |
| 4️⃣ | **I4: Casing & Cementing Automation** | 85.0 h | 43x | 5.pdf casing design (440 rows) |
| 5️⃣ | **I5: Document-to-Data Pipeline** | 95.0 h | 54x | 1–7.pdf (enables all 4 above) |

**Total:** 986.2 hours = **∼41 days saved per well** at operational scale

---

## 90-Day Execution Timeline

### Phase 1: Days 1–30 (Foundation & Quick Wins)

**Parallel start of I1 + I2 + I3 + I4 with I5 setup:**

| Initiative | Days 1–30 Deliverable | Team Size | Status |
|--|--|--|--|
| **I1** | Baseline ETA predictor (±10%), anomaly detection rules | 3.7 FTE | ✅ Ready |
| **I2** | Static ECD calculator, mud window validator | 3.3 FTE | ✅ Ready |
| **I3** | 30 loss rules parsed, playbook recommender UI | 1.9 FTE | ✅ Ready |
| **I4** | Casing stress calculator, cement volume calc | 2.0 FTE | ✅ Ready |
| **I5** | PDF text extraction + OCR, section detection | 3.0 FTE | 🟡 High effort |

**Total team commitment: ~14 FTE for 30 days**

**Key outcomes by Day 30:**
- ✅ All 4 ML-driven systems (I1–I4) have working MVP with manual data input
- ✅ I5 infrastructure ready for automated PDF ingestion
- ✅ Dashboards deployed (Grafana/Streamlit)
- ✅ First pилот скважина selected for testing

---

### Phase 2: Days 31–60 (Real-Time & Intelligence)

**I1–I4 expand with real-time data; I5 nears production:**

| Initiative | Days 31–60 Deliverable | Key Milestone | Status |
|--|--|--|--|
| **I1** | Critical path engine, next-best-action recommender | Пилот: 30% operations | 🟡 In progress |
| **I2** | ML ECD predictor (MAE <0.05 ppg), real-time WITS integration | WITS connected, ROP optimization | 🟡 In progress |
| **I3** | ML severity classifier, real-time loss event alerts | Пилот: 30 days live data | 🟡 In progress |
| **I4** | Multi-standard support (API/ISO), cement job designer | Пилот: 1–2 well designs approved | 🟡 In progress |
| **I5** | Advanced table detection, semantic mapping | Пилот: 1–7.pdf auto-processed | 🔵 Converging |

**Critical dependency point: Day 60 = I5 goes live, starts feeding I1–I4**

---

### Phase 3: Days 61–90 (Production & Integration)

**Full integration, scaling, rollout to production:**

| Initiative | Days 61–90 Deliverable | Rollout | Status |
|--|--|--|--|
| **I1** | Interactive Depth-Day dashboard, full Gantt scheduling | All wells | 🔵 Ready D90 |
| **I2** | Real-time Hydraulics Twin with ROP advisories | All wells | 🔵 Ready D90 |
| **I3** | Advanced RL-based loss optimizer, integrated alerts | All wells | 🔵 Ready D90 |
| **I4** | Automated calc sheets, approval workflow, database | All well designs | 🔵 Ready D90 |
| **I5** | CI/CD pipeline, interactive QA dashboard, ML retraining | All new PDFs | 🔵 Ready D90 |

**Cross-integration matrix:**
```
I1 (Depth-Day)          ←→  I2 (Hydraulics)  ← ECD constraints on schedule
  ↑                           ↓
  └─ I5 feeds operation_plan data
                        
I3 (Loss Response)      ←→  I2 (ECD anomalies)  ← potential losses
  ↑                           ↓
  └─ I5 feeds loss_response matrix
  
I4 (Casing Design)      ←  I5 feeds casing design data
  ↑
  └─ Optional: I1 feeds schedule (for cement timing)
```

---

## Detailed Phase Timeline

### PHASE 1: Days 1–30

**Day 1–5: Kickoffs & Team Assembly**
- [ ] Allocate teams: ~14 FTE across I1–I5
- [ ] Set up infrastructure: databases (PostgreSQL/ClickHouse), cloud accounts (AWS/GCP)
- [ ] Arrange data access: WITS API credentials (if available), daily report ingestion
- [ ] Kick-off meetings per initiative (brief scope, deliverables, risks)
- **Owners:** Project Manager, Tech Lead

**Day 6–15: MVP Development (Parallel)**

*I1:* Baseline ETA from operation_plan_from_2.csv
```python
def baseline_eta(op_type, depth):
    mean_hours = mean(operations[operations.type == op_type].plan_hours)
    # Simple model: eta ≈ baseline × (depth_delta / avg_depth)
    return mean_hours
```
- Test on 10 operations from 2.pdf: MAE <10%

*I2:* Static ECD (no WITS yet)
```python
def ecd_static(mud_density_ppg, depth_m, drilstring_loss, annular_loss):
    return mud_density_ppg + (drilstring_loss + annular_loss) × 0.052 × depth_m
```
- Test on hydraulics table from 1.pdf: MAE <0.05 ppg

*I3:* Load 30 rules, hardcode playbook
```python
rules = load_csv("loss_response_matrix_from_7.csv")
def recommend_action(zone, loss_rate_m3_h):
    for rule in rules:
        if rule.zone == zone and rule.severity_band[0] <= loss_rate_m3_h < rule.severity_band[1]:
            return rule.actions  # [action1, action2, ...]
```
- Test on simulated loss events: 100% coverage

*I4:* Stress calculator
```python
def collapse_safety_factor(od, id, external_pressure, grade):
    yield_strength = api_grade_yield[grade]
    collapse_stress = api_formula(od, id)  # from API 65
    sf = collapse_stress / external_pressure
    return sf
```
- Test on casing table from 5.pdf: MAE <5%

*I5:* Basic extraction
```python
def extract_pdf(pdf_path):
    text = pdfplumber.open(pdf_path).extract_text()
    sections = detect_sections(text, SECTION_PATTERNS)
    return sections
```
- Test on 1.pdf: 100% section detection

**Day 16–25: Dashboarding & Validation**
- I1: Grafana dashboard (plan vs. forecast)
- I2: Streamlit ECD window visualization
- I3: Slack alerts for loss events
- I4: HTML calc sheet template
- I5: CSV output validation report

**Day 26–30: First Pilot Selection & Acceptance Tests**
- [ ] Select **Well #1** for pилот (representative, good data quality)
- [ ] Load all baseline data (operations, hydraulics, casing, losses)
- [ ] Run all 4 systems on Well #1 in demo mode
- [ ] Collect feedback from well engineers
- [ ] Resolve blockers before Phase 2

**Phase 1 Exit Criteria:**
- ✅ All 4 ML systems running (MAE targets met)
- ✅ Dashboards deployed & accessible
- ✅ Pilot well selected & baseline data loaded
- ✅ Teams trained on basic operation

---

### PHASE 2: Days 31–60

**Day 31–40: Real-Time Integrations**

*I1:* Connect to rig telemetry or daily reports
```python
def get_actual_hours_for_operation(op_id, well_id):
    # Fetch from RigLog API or daily report
    return well_logs.get_operation_duration(op_id)
# Then: variance = actual_hours - plan_hours
# Alert if variance > threshold
```

*I2:* Connect to WITS (or batch mudlog)
```python
wits = WITSClient(rig_id="Rig_01")
for sample in wits.stream():
    flow, rpm, spp, depth, temp = sample
    ecd_measured = infer_ecd_from_spp(spp)
    ecd_predicted = model.predict(flow, rpm, depth, temp, mud_properties)
    anomaly_score = abs(ecd_measured - ecd_predicted) / ecd_predicted
    if anomaly_score > 0.1:
        alert("ECD anomaly detected")
```

*I3:* Real-time loss detection
```python
flow_in, flow_out = get_manifold_readings()
loss_rate = (flow_in - flow_out) × 0.00378  # m3/h
zone = get_current_zone(depth)
if loss_rate > threshold[zone]:
    event = detect_loss_event(zone, loss_rate)
    action = recommend_action(event)
    send_alert_to_rig(action)  # SMS, Slack, App push
```

*I4:* Integration with well design system
```python
def approval_workflow(casing_design):
    # Auto-calculate stresses
    results = calculate_all_stresses(casing_design)
    # Check against API
    compliance = check_api_compliance(results)
    if compliance["all_pass"]:
        auto_approve(casing_design)  # No manual review needed
    else:
        create_review_task(casing_design, compliance["failures"])
```

*I5:* Auto-parsing 1–7.pdf (integration testing)
```python
def ingest_pdf(pdf_path, well_id):
    sections = extract_pdf(pdf_path)
    # Validate
    qa_results = validate_sections(sections)
    if qa_results["confidence"] > 0.95:
        # Auto-ingest
        db.ingest_operation_plan(sections["operations"], well_id)
        db.ingest_hydraulics(sections["hydraulics"], well_id)
        # ... etc
        notify_i1_i2_i3_i4_of_update()  # Trigger re-compute
    else:
        # Manual review needed
        create_qa_task(pdf_path, qa_results)
```

**Day 41–50: ML Model Training**
- I1: Collect actual operation durations from pilot well → train XGBoost ETA model
- I2: Collect WITS data + measured ECD from pilot well → train ML ECD predictor
- I3: Collect loss events & action outcomes from pilot well → train severity classifier
- I4: (Less applicable; rules are API-based, not learned)

**Day 51–60: Pilot Expansion & Validation**

- Run all systems on pilot well for 30 days continuously
- Measure KPIs:
  - I1: Is ETA accuracy ±8%? Are schedule predictions good?
  - I2: Is ECD prediction ±0.05 ppg? Is ROP optimization working?
  - I3: Are loss alerts timely (<5 min)? Are action recommendations being followed?
  - I4: Are designs being auto-approved? Any deviations caught?
  - I5: Is PDF parsing 98%+ accurate? Which sections struggle?
- Debug any issues, retrain models if needed
- **Critical: Prepare I5 for production launch (Day 60)**

**Phase 2 Exit Criteria:**
- ✅ All real-time integrations working
- ✅ ML models trained & validated (KPI targets met)
- ✅ Pilot well showing 5–15% improvements (schedule, ECD, loss response, etc.)
- ✅ I5 production-ready (Docker image, cloud deployment tested)

---

### PHASE 3: Days 61–90

**Day 61–75: Production Rollout**

*I1:*
- Deploy Depth-Day dashboard to all wells
- Enable automated critical path & next-best-action recommendations
- Train Drilling Managers on dashboard usage
- Measure: # of recommendations adopted, schedule improvements

*I2:*
- Deploy Hydraulics Twin to all wells
- Enable automated ROP recommendations
- Alert system for window violations
- Measure: ECD pred accuracy, ROP improvements, window violations prevented

*I3:*
- Deploy Loss Response Engine to all wells
- Real-time loss detection & playbook recommendations
- Feedback form for action tracking
- Measure: time-to-action, effectiveness ratings, NPT reduction

*I4:*
- Automated calc sheets for all well designs
- One-click approval (if no API deviations)
- Database versioning & audit trail
- Measure: calculation time, approval latency, design accuracy

*I5:*
- **CRITICAL: Enable PDF auto-ingestion across all systems**
- When new PDF uploaded → auto-process and feed I1–I4
- Interactive QA dashboard for any manual reviews needed
- Measure: % of PDFs auto-ingested, latency, accuracy

**Day 76–85: Integration & Optimization**

*Cross-initiative orchestration:*
- When schedule changes (I1) → recalculate ECD constraints (I2)
- When ECD anomaly detected (I2) → check if possible loss event (I3)
- When loss severity escalates (I3) → consider schedule change (I1)
- When casing design changes (I4) → validate against pressure plan (I2)

*Example scenario:*
```
Day 32, 1200m depth on Well #3:
  I1 detects: Operation [RIH 1200–1500m] running 20% slower than baseline
  → Schedule is now 3 days behind
  
  I2 reacts: New timeline means different mud temperature profile
  → Recalculate ECD for 1200–1500m interval
  → ECD margin shrinks from 0.15 to 0.05 ppg
  
  I3 alerts: With tighter margin, loss risk is elevated
  → Flag as "medium risk" for any well bore disturbance
  
  I4 notes: Pressure rating for technical column is 3500 PSI
  → Current ECD load is 3400 PSI (too close to limit)
  → Recommend: either slow down (more time = better ECD control)
              or switch mud system to lighter slurry (risky but faster)
  
  Recommendation to well operator:
    "Schedule is 3 days behind. Two options:
     A) Maintain current pace → ECD risks escalate (16% loss probability)
     B) Extend phase to Day 80 → recover schedule through better ROP on next phase
     Decision: Recommend Option B (risk mitigation)"
```

**Day 86–90: Production Stabilization**

- Monitor all 5 systems on production wells (10+ wells)
- Collect lessons learned:
  - What worked well? (I3 alerts were very useful)
  - What didn't work? (I1 predictions off when rig broke down unexpectedly)
  - What needs refinement? (I2 needs better mud property updates from lab)
- Update playbooks, thresholds, ML models based on feedback
- Finalize documentation (User guides, API specs, Runbooks, Troubleshooting)
- Hand off to Operations team for ongoing management

**Phase 3 Exit Criteria:**
- ✅ All 5 initiatives in production across 10+ wells
- ✅ Automated data flow from PDF → I1–I4 (I5 working)
- ✅ KPI targets met or exceeded (schedule ±2%, ECD ±0.05, loss alerts <5 min, etc.)
- ✅ <5% manual interventions needed (systems mostly autonomous)
- ✅ Team trained, documentation complete, handoff to Ops

---

## Detailed KPI Dashboard

### System-Specific KPIs (Day 90 Targets)

**I1: Depth-Day Optimizer**
```
Metric                      | Baseline    | Target      | Measurement
─────────────────────────────────────────────────────────────────────
Plan variance                | ±5-7%      | <±2-3%     | actual_days - plan_days
ETA accuracy (MAE)          | ±15-20%    | ±8-10%     | forecast vs actual cumulative days
Critical path violations    | 0% caught  | 100%       | violations/total risked operations
Time to decision            | 24-48h     | <2h        | alert → recommendation latency
Days saved per well         | —          | 30–35 d    | total_plan_days - actual_days
```

**I2: Hydraulics Digital Twin**
```
Metric                      | Baseline    | Target      | Measurement
─────────────────────────────────────────────────────────────────────
ECD prediction accuracy     | ±0.10 ppg  | ±0.05 ppg  | MAE on test wells
Mud window violations caught| 20–30%     | 100%       | alerts / incident_count
ROP optimization potential  | —          | +5–10%     | planned_rop vs optimized_rop
Calculation time/well       | 24–48h     | <2h        | dashboard generation latency
Window compliance           | ~90%       | >99%       | % of hole sections in safe zone
Pressure losses predicted   | —          | ±8%        | forecast vs field measurements
```

**I3: Losses Response Engine**
```
Metric                      | Baseline    | Target      | Measurement
─────────────────────────────────────────────────────────────────────
Time to action              | ~30 min    | <5 min     | alert → crew acknowledgment
Severity classification acc.| ~70%       | >90%       | confusion matrix accuracy
Action effectiveness        | Avg 60%    | Avg 80%    | % "Yes/Partial" feedback
NPT reduction from losses   | —          | >15%       | loss_related_npt before/after
Alert precision             | ~60%       | >85%       | TP/(TP+FP)
Rule coverage               | —          | 30/30      | # rules triggered in 90 days
Playbook adoption           | 0%         | >70%       | recommendations followed/total
```

**I4: Casing & Cementing Automation**
```
Metric                      | Baseline    | Target      | Measurement
─────────────────────────────────────────────────────────────────────
Design time/casing string   | 3–5h       | 30–45 min  | input to PDF export time
Accuracy vs API standards   | ~85%       | 100%       | passed validations/total calcs
Design variance caught      | ~70%       | 100%       | non-conformances detected
Approval velocity           | 2–3 days   | <4h        | submit to approval
Cement volume accuracy      | ±15%       | ±5%        | planned vs actual
Casing-related NPT prevent. | —          | >20%       | pressure/integrity failures avoided
Auto-approval rate          | 0%         | >80%       | designs approved without review
```

**I5: Document-to-Data Pipeline**
```
Metric                      | Baseline    | Target      | Measurement
─────────────────────────────────────────────────────────────────────
PDF processing latency      | 3–5h       | <5 min     | upload to csv-ready
Extraction accuracy         | ~90%       | 98%        | rows validated/total rows
Auto-ingestion rate         | 0%         | >90%       | PDFs processed without manual
Manual review time          | 1–2h       | <10 min    | accept/reject latency
Schema coverage             | 5 types    | 5+ types   | # supported section types
Integration triggers        | Manual     | Automatic  | # data updates per day to I1–I4
ML model accuracy           | —          | >95%       | test set precision/recall
```

### Portfolio-Level KPI (All 5 Together)

```
Metric                           | Unit         | Baseline    | Target
──────────────────────────────────────────────────────────────────────
Total operational hours saved     | hours/well   | 0           | 986.2
Days saved per well              | days/well    | 0           | ~41
Schedule predictability          | variance     | ±5–7%      | <±2%
NPT reduction (all sources)       | percent      | 0           | ~15–20%
Capital efficiency (cost/time)    | $/hour       | current     | -30%
Man-hour investment reduction     | percent      | 0           | ~25% (time on data)
System availability              | percent      | —           | >99.5%
User adoption rate               | percent      | —           | >85% across roles
```

---

## Risk Management & Escalation

### Top 10 Risks (Ranked by Probability × Impact)

| # | Risk | Probability | Impact | Mitigation |
|--|--|--|--|--|
| 1 | WITS data unavailable/unreliable | 🟡 Med | 🔴 High | Start with batch Reports, add real-time incrementally |
| 2 | Domain formula errors in PDFs | 🟡 Med | 🟡 Med | Validate against API standards, field testing |
| 3 | Crew adoption resistance | 🟡 Med | 🟡 Med | Quick wins (show 1–2 days saved), change mgmt |
| 4 | PDF parse accuracy <95% | 🟡 Med | 🟡 Med | Manual QA loop, retraining, new section types |
| 5 | ML models overfit to pilot well | 🟡 Med | 🟡 Med | Cross-validation, test on diverse wells |
| 6 | Real-time latency >10 sec | 🟢 Low | 🟡 Med | Async processing, caching, batch mode fallback |
| 7 | Database performance (>1000 queries/sec) | 🟢 Low | 🟡 Med | Sharding, indexing, read replicas |
| 8 | Alert alert-fatigue (too many false positives) | 🟡 Med | 🟡 Med | Threshold tuning on pilot, ML filtering |
| 9 | Regulatory/compliance issues | 🟢 Low | 🔴 High | Work with compliance early, audit trail |
| 10 | Key person dependency | 🟢 Low | 🟡 Med | Cross-training, knowledge docs, pair programming |

**Escalation path:**
- YELLOW flags (feasible workarounds) → Team lead resolves within 2 days
- RED flags (blocking) → Steering committee + technical deep-dive

---

## Budget Summary

### All-In 90-Day Investment

```
                  Team (FTE×days)  Hourly Rate  Subtotal
I1 Team           3.7 × 90 × 8h    $300/h      $79,920
I2 Team           3.3 × 90 × 8h    $300/h      $71,280
I3 Team           1.9 × 90 × 8h    $300/h      $41,040
I4 Team           2.0 × 90 × 8h    $300/h      $43,200
I5 Team           3.0 × 90 × 8h    $300/h      $64,800

Team subtotal:                                 $300,240

Infrastructure & Tools:
  ├─ Cloud (AWS/GCP):            $30/day × 90        $2,700
  ├─ Databases (managed):        $500/month × 3 mo   $1,500
  ├─ OCR licenses (I5):          $100/month × 3 mo   $300
  ├─ WITS API (if new sub):                          $30,000
  ├─ Monitoring & logging:       $200/day × 90       $18,000
  └─ Miscellaneous (licenses, training, travel):     $20,000

Infrastructure subtotal:                       $102,500

Contingency (10%):                            $40,274

TOTAL INVESTMENT:                             $443,014 (~$443K)
```

### Expected Returns

```
Direct Hour Savings:
  986.2 hours × $300/hour = $295,860 per well × 20 wells = $5,917,200

Indirect Savings (Risk Mitigation):
  1% reduction in total well costs (construction, equipment, delays): ~$2M per 20 wells
  
Operational Improvements:
  15% NPT reduction = ~5 days saved per well × $500K/day rig cost = $50M risk mitigation
  
Total Economic Benefit (conservative): $5.9M + $50M = $55.9M+ for 20 wells
ROI: $55.9M / $443K ≈ 126x (over 90 days)
Payback: <1 week on first well
```

---

## Success Stories to Highlight

### Projected Day 30 Win
**"Depth-Day baseline ETA predictor reduces plan variance by 3%, saving 1.2 days on first test well"**
- I1 demo: "Before" (manual forecasting, ±7% var) vs "After" (automated, ±3%)
- Communicate: "That's $600K savings just from better scheduling on one well"

### Projected Day 60 Win
**"Hydraulics Twin detects mud window violation risk 2 hours before crew would have hit it by traditional methods"**
- I2 demo: Real WITS data showing ECD climbing, system flags "High risk", crew adjusts RPM
- Communicate: "Prevented a potential well loss. This one alert pays for the entire I2 investment."

### Projected Day 90 Win
**"PDF of new drilling program uploaded → all 5 systems auto-updated within 4 minutes. Zero manual data entry."**
- I5 demo: Upload PDF → watch I1–I4 dashboards auto-refresh with new data
- Communicate: "Scalability achieved. From 5 hour manual process to 4 minute automated."

---

## Handoff & Ongoing Operations (Post-Day 90)

### Operations Team Composition
```
┌─ Data Engineering (2 FTE)
│  ├─ Pipeline monitoring & alerts
│  ├─ Monthly ML retraining
│  └─ New data source integration
│
├─ ML/Analytics (1.5 FTE)
│  ├─ Model performance tracking
│  ├─ Anomaly investigation
│  └─ New algorithm development
│
├─ Product/Support (1 FTE)
│  ├─ User feedback & feature requests
│  ├─ Documentation updates
│  └─ Training for new crews
│
└─ Infrastructure (0.5 FTE)
   ├─ Cloud infrastructure management
   ├─ Scaling & cost optimization
   └─ Disaster recovery

Total ongoing: 5 FTE (vs. 14 FTE during development)
Annual cost: ~$1.5M (includes salaries + infrastructure)
Annual savings from systems: ~$50M+ (assuming 20+ wells/year)
Net ROI: >30x annually
```

### Monthly Ops Cadence
- Week 1: Data quality review (missing values, anomalies)
- Week 2: Model performance audit (accuracy, drift detection)
- Week 3: User feedback synthesis (what's working, what needs improvement)
- Week 4: Planning & prioritization (new features, bug fixes, optimizations)

---

## Version Control & Document Management

All 5 initiative charters are version-controlled:
- **Location:** `docs/21–25_digitalization_*.md`
- **Change log:** Track scope updates, KPI revisions, risk mitigation
- **Review cycle:** Weekly steering committee review (Days 1–30), bi-weekly thereafter

---

## Approval & Sign-Off

| Role | Name | Sign-Off Date | Notes |
|--|--|--|--|
| Chief Operating Officer | TBD | [awaiting] | Overall business case approval |
| VP Engineering | TBD | [awaiting] | Technical feasibility |
| VP Drilling Operations | TBD | [awaiting] | Operational readiness |
| IT/Cloud Lead | TBD | [awaiting] | Infrastructure planning |
| Finance | TBD | [awaiting] | Budget approval |

---

**Document Status:** DRAFT v1.0 (Ready for Steering Committee Review)  
**Next milestone:** Day 5 Kickoff (contingent on approvals)  
**Questions?** Contact Project Manager or Tech Steering Committee
