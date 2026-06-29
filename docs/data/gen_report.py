# -*- coding: utf-8 -*-
"""
Generate 139_supervisor_summary_dashboard.html from Excel JSON data.
Run: py docs/data/gen_report.py
"""
import json, math, re
from datetime import datetime

# ── Load workbook ────────────────────────────────────────────────────────────
with open('docs/data/supervisor_report_workbook.json', encoding='utf-8') as f:
    wb = json.load(f)

sheets_map = {s['name']: s for s in wb['sheets']}

def make_grid(sheet_name):
    sh = sheets_map[sheet_name]
    return {(c['r'], c['c']): c for c in sh['cells']}

def g(grid, r, c):
    cell = grid.get((r, c))
    if not cell: return None
    v = cell['v']
    return v

def fmt(v, decimals=2):
    if v is None: return ''
    if isinstance(v, float):
        if abs(v - round(v)) < 1e-9: return str(int(round(v)))
        return str(round(v, decimals))
    if isinstance(v, str):
        # clean up datetime strings
        if re.match(r'\d{4}-\d{2}-\d{2}', v):
            try:
                dt = datetime.fromisoformat(v[:10])
                return dt.strftime('%d.%m.%Y')
            except:
                pass
        return v
    return str(v)

def fmttime(v):
    """Format time value: '6:00:00' or timedelta-like '1 day, 0:00:00'"""
    if v is None: return ''
    s = str(v)
    if 'day' in s:
        return '24:00'
    # Extract HH:MM
    m = re.match(r'(\d+):(\d+)', s)
    if m:
        return f'{int(m.group(1)):02d}:{m.group(2)}'
    return s

def fmthours(v):
    if v is None: return ''
    if isinstance(v, float):
        return str(round(v, 2))
    return str(v)

# ── Main grid ────────────────────────────────────────────────────────────────
rap = make_grid('Рапорт')
knbk_grid = make_grid('КНБК')

# ── Section 1: General info ───────────────────────────────────────────────────
field       = fmt(g(rap, 5, 16))   # Уренгойское НГКМ
well        = fmt(g(rap, 7, 5))    # U2307
cluster     = fmt(g(rap, 5, 9))    # U23
report_date = fmt(g(rap, 6, 11))   # 20.04.2026
report_no   = fmt(g(rap, 7, 11))   # 13
purpose     = fmt(g(rap, 8, 5))    # Эксплуатация
constr_start= fmt(g(rap, 8, 11))   # 08.04.2026
customer    = fmt(g(rap, 9, 5))    # АО "АРКТГАЗ"
days_plan   = fmt(g(rap, 9, 11), 1)
days_fact   = fmt(g(rap, 10, 11), 1)
npv_acc     = fmt(g(rap, 11, 11), 2)
driller     = fmt(g(rap, 10, 5))
mwd_co      = fmt(g(rap, 11, 5))
bit_co      = fmt(g(rap, 12, 5))
mud_co      = fmt(g(rap, 13, 5))
cem_co      = fmt(g(rap, 14, 5))
gtds_co     = fmt(g(rap, 15, 5))
rig_type    = fmt(g(rap, 12, 11))
bit_size    = fmt(g(rap, 13, 11))
depth_end   = fmt(g(rap, 14, 11))
daily_prog  = fmt(g(rap, 15, 11))
temp_env    = fmt(g(rap, 16, 11))
sched_lag   = fmt(g(rap, 17, 11), 2)
depth_start = fmt(g(rap, 17, 18))

# Casing
cas_dir_plan  = fmt(g(rap, 7, 18))   # 320
cas_dir_fact  = fmt(g(rap, 7, 19))   # 318
cas_dir_date  = ''
cas_con_plan  = fmt(g(rap, 8, 18))   # 700
cas_con_fact  = fmt(g(rap, 8, 19))   # 699
cas_con_date  = fmt(g(rap, 8, 20))   # 18.04.2026
cas_tec_plan  = fmt(g(rap, 9, 18))   # 1651 (looks like it's tech casing)
cas_exp_plan  = fmt(g(rap, 10, 18))  # 3851

# Actually R9 C18=1651 (техническая) and R10 C18=3851 (эксплуатационная)
# Let's also try to get them from casing section header references
# R6: Конструкция скважины headers, C18=Проект м, C19=Факт м, C20=Дата цементажа
# R7: Направление, C18=320, C19=318
# R8: Кондуктор, C18=700, C19=699, C20=18.04.2026
# R9: ..., C18=1651
# R10: ..., C18=3851

# ── Section 2: BHA time log ───────────────────────────────────────────────────
# R18 header, R19 sub-header, R20-R43 data, R44 total
# Columns: B=От, C=До, D=Часы, E=Операция, N=Элемент КНБК, R=Нар.мм, S=Внутр.мм, T=Длина м, U=Σ Длина м
# (1-indexed: C2=col2, C3=col3, C4=col4, C5=col5, C14=col14, C18=col18, C19=col19, C20=col20, C21=col21)

time_log_rows = []
for r in range(20, 44):
    t_from = fmttime(g(rap, r, 2))
    t_to   = fmttime(g(rap, r, 3))
    hours  = fmthours(g(rap, r, 4))
    oper   = fmt(g(rap, r, 5))
    elem   = fmt(g(rap, r, 14))
    od     = fmt(g(rap, r, 18))
    id_    = fmt(g(rap, r, 19))
    lng    = fmt(g(rap, r, 20))
    total  = fmt(g(rap, r, 21))
    if t_from or oper or elem:
        time_log_rows.append((t_from, t_to, hours, oper, elem, od, id_, lng, total))

total_hours = fmt(g(rap, 44, 4))

# ── Section 3: Status at 6:00 ─────────────────────────────────────────────────
status_rows = []
for r in range(47, 54):
    t_from = fmttime(g(rap, r, 2))
    t_to   = fmttime(g(rap, r, 3))
    hours  = fmthours(g(rap, r, 4))
    oper   = fmt(g(rap, r, 5))
    regime = fmt(g(rap, r, 18))
    if t_from or oper:
        status_rows.append((t_from, t_to, hours, oper, regime))

# ── Section 4: Time distribution ─────────────────────────────────────────────
cat_names = [fmt(g(rap, 55, c)) for c in range(2, 21)]
today_hrs = [fmthours(g(rap, 56, c)) for c in range(2, 21)]
today_pct = [fmt(g(rap, 57, c), 3) for c in range(2, 21)]
accum_hrs = [fmt(g(rap, 59, c), 1) for c in range(2, 21)]
accum_pct = [fmt(g(rap, 60, c), 4) for c in range(2, 21)]

def to_pct(v):
    """Format fraction as percent string"""
    try:
        f = float(v)
        if f == 0: return '0'
        return f'{f*100:.1f}%'
    except:
        return v or ''

# ── Section 5: Bits ──────────────────────────────────────────────────────────
# From КНБК sheet: R4-R7 (4 runs)
bit_runs = []
for r in range(4, 12):
    date_in  = fmt(g(knbk_grid, r, 1))
    date_out = fmt(g(knbk_grid, r, 2))
    run_no   = fmt(g(knbk_grid, r, 3))
    diam     = fmt(g(knbk_grid, r, 4))
    model    = fmt(g(knbk_grid, r, 5))
    serial   = fmt(g(knbk_grid, r, 6))
    nozzles  = fmt(g(knbk_grid, r, 7))
    tfa      = fmt(g(knbk_grid, r, 8))
    motor    = fmt(g(knbk_grid, r, 10))
    depth_fr = fmt(g(knbk_grid, r, 11))
    depth_to = fmt(g(knbk_grid, r, 12))
    footage  = fmt(g(knbk_grid, r, 13))
    t_circ   = fmt(g(knbk_grid, r, 14), 2)
    t_bit    = fmt(g(knbk_grid, r, 15), 2)
    rop_plan = fmt(g(knbk_grid, r, 16))
    rop_fact = fmt(g(knbk_grid, r, 17), 2)
    q        = fmt(g(knbk_grid, r, 18))
    wob      = fmt(g(knbk_grid, r, 19))
    rpm      = fmt(g(knbk_grid, r, 20))
    torque   = fmt(g(knbk_grid, r, 21))
    dull     = fmt(g(knbk_grid, r, 22))
    knbk_desc= fmt(g(knbk_grid, r, 24))
    if run_no or diam:
        bit_runs.append({
            'run': run_no, 'date_in': date_in, 'date_out': date_out,
            'diam': diam, 'model': model, 'serial': serial,
            'nozzles': nozzles, 'tfa': tfa, 'motor': motor,
            'from': depth_fr, 'to': depth_to, 'footage': footage,
            't_circ': t_circ, 't_bit': t_bit,
            'rop_plan': rop_plan, 'rop_fact': rop_fact,
            'q': q, 'wob': wob, 'rpm': rpm, 'torque': torque,
            'dull': dull, 'knbk': knbk_desc
        })

# ── Section 6: Mud ───────────────────────────────────────────────────────────
mud_plan = {
    'type': fmt(g(rap, 69, 2)),
    'dens': fmt(g(rap, 69, 3)),
    'visc': fmt(g(rap, 69, 4)),
    'pv':   fmt(g(rap, 69, 5)),
    'yp':   fmt(g(rap, 69, 6)),
    'gel':  fmt(g(rap, 69, 7)),
    'r63':  fmt(g(rap, 69, 8)),
    'fl':   fmt(g(rap, 69, 9)),
    'cl':   fmt(g(rap, 69, 10)),
    'sand': fmt(g(rap, 69, 11)),
    'es':   fmt(g(rap, 69, 12)),
    'owr':  fmt(g(rap, 69, 13)),
    'lime': fmt(g(rap, 69, 14)),
    'cake': fmt(g(rap, 69, 15)),
    'caco': fmt(g(rap, 69, 16)),
    'ph':   fmt(g(rap, 69, 17)),
    'vol_well':  fmt(g(rap, 69, 18)),
    'vol_tanks': fmt(g(rap, 69, 19)),
    'vol_total': fmt(g(rap, 69, 21)),
}
mud_fact = {
    'type': fmt(g(rap, 70, 2)),
    'dens': fmt(g(rap, 70, 3)),
    'visc': fmt(g(rap, 70, 4)),
    'pv':   fmt(g(rap, 70, 5)),
    'yp':   fmt(g(rap, 70, 6)),
    'gel':  fmt(g(rap, 70, 7)),
    'r63':  fmt(g(rap, 70, 8)),
    'fl':   fmt(g(rap, 70, 9)),
    'cl':   fmt(g(rap, 70, 10)),
    'sand': fmt(g(rap, 70, 11)),
    'es':   fmt(g(rap, 70, 12)),
    'owr':  fmt(g(rap, 70, 13)),
    'lime': fmt(g(rap, 70, 14)),
    'cake': fmt(g(rap, 70, 15)),
    'caco': fmt(g(rap, 70, 16)),
    'ph':   fmt(g(rap, 70, 17)),
    'vol_well':  fmt(g(rap, 70, 18)),
    'vol_tanks': fmt(g(rap, 70, 19)),
    'vol_total': fmt(g(rap, 70, 21)),
}

# ── Section 7: Pumps / vibroscreens ──────────────────────────────────────────
# R72-R75: C14=Вибросита №, C15=Сетки, C17=Часы работы
shakers = []
for r in range(72, 76):
    name   = fmt(g(rap, r, 14))
    meshes = fmt(g(rap, r, 15))
    hours  = fmt(g(rap, r, 17))
    if name or meshes:
        shakers.append((name or str(r-71), meshes, hours))

# ── Section 8: Inclinometry fact (R118-R130) ──────────────────────────────────
incl_fact = []
for r in range(118, 132):
    d   = fmt(g(rap, r, 2))
    zen = fmt(g(rap, r, 3))
    az  = fmt(g(rap, r, 4))
    tvd = fmt(g(rap, r, 5))
    dls = fmt(g(rap, r, 6))
    dof = fmt(g(rap, r, 7))
    if d:
        incl_fact.append((d, zen, az, tvd, dls, dof))

# ── Section 9: MWD parameters (R132) ─────────────────────────────────────────
mwd = {
    'depth':    fmt(g(rap, 132, 2)),
    'gamma':    fmt(g(rap, 132, 3)),
    'azimuth':  fmt(g(rap, 132, 4)),
    'tvd':      fmt(g(rap, 132, 5)),
    'dls':      fmt(g(rap, 132, 6)),
    'dogleg':   fmt(g(rap, 132, 7)),
    'temp':     fmt(g(rap, 132, 8)),
    'gr2':      fmt(g(rap, 132, 9)),
    'inc':      fmt(g(rap, 132, 10)),
    'depth2':   fmt(g(rap, 132, 11)),
    'offset':   fmt(g(rap, 132, 12)),
    'rop':      fmt(g(rap, 132, 13)),
}

# ── Section 10: Personnel (R143-R144) ────────────────────────────────────────
sup_name  = fmt(g(rap, 143, 5))
sup_phone = fmt(g(rap, 143, 7))
cli_name  = fmt(g(rap, 143, 12))
cli_phone = fmt(g(rap, 143, 16))
drm_name  = fmt(g(rap, 144, 5))
drm_phone = ''  # embedded in name
bit_name  = fmt(g(rap, 144, 12))
bit_phone = ''

# Helper: make percent bar HTML
def pct_bar(value_str):
    try:
        v = float(value_str.replace('%','')) if '%' in (value_str or '') else float(value_str or 0)
        if '%' not in (value_str or ''):
            v = v * 100
        v = min(max(v, 0), 100)
        color = '#3ecfcf' if v > 0 else 'transparent'
        return f'<div class="bar-wrap"><div class="bar-fill" style="width:{v:.1f}%;background:{color}"></div><span>{v:.1f}%</span></div>'
    except:
        return value_str or ''

# ── Generate HTML ─────────────────────────────────────────────────────────────

def e(s):
    """Escape HTML"""
    if not s: return ''
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

# Build time log table rows
tlog_html = ''
for row in time_log_rows:
    t_from, t_to, hours, oper, elem, od, id_, lng, total = row
    tlog_html += f'''
        <tr>
          <td class="tc mono">{e(t_from)}</td>
          <td class="tc mono">{e(t_to)}</td>
          <td class="tc bold">{e(hours)}</td>
          <td class="oper-cell">{e(oper)}</td>
          <td>{e(elem)}</td>
          <td class="tc">{e(od)}</td>
          <td class="tc">{e(id_)}</td>
          <td class="tc">{e(lng)}</td>
          <td class="tc bold">{e(total)}</td>
        </tr>'''

# Status rows
status_html = ''
for row in status_rows:
    t_from, t_to, hours, oper, regime = row
    status_html += f'''
        <tr>
          <td class="tc mono">{e(t_from)}</td>
          <td class="tc mono">{e(t_to)}</td>
          <td class="tc bold">{e(hours)}</td>
          <td class="oper-cell">{e(oper)}</td>
          <td class="regime-cell">{e(regime)}</td>
        </tr>'''

# Time distribution table
time_cats = list(zip(cat_names, today_hrs, today_hrs, accum_hrs, accum_pct))

# Build time dist HTML
def build_time_dist():
    rows = ''
    for i, name in enumerate(cat_names):
        if not name: continue
        th = today_hrs[i] if i < len(today_hrs) else ''
        tp_raw = today_pct[i] if i < len(today_pct) else ''
        ah = accum_hrs[i] if i < len(accum_hrs) else ''
        ap_raw = accum_pct[i] if i < len(accum_pct) else ''
        try:
            tp = f'{float(tp_raw)*100:.1f}%' if tp_raw else ''
        except:
            tp = tp_raw
        try:
            ap = f'{float(ap_raw)*100:.1f}%' if ap_raw else ''
        except:
            ap = ap_raw
        rows += f'<tr><td>{e(name)}</td><td class="tc">{e(th)}</td><td class="tc pct">{e(tp)}</td><td class="tc">{e(ah)}</td><td class="tc pct">{e(ap)}</td></tr>\n'
    return rows

# Bit runs HTML
def build_bits():
    rows = ''
    for b in bit_runs:
        is_cur = b['run'] == '4'
        cls = ' class="row-current"' if is_cur else ''
        rows += f'''<tr{cls}>
          <td class="tc bold">{e(b["run"])}</td>
          <td class="tc">{e(b["date_in"])}</td>
          <td class="tc">{e(b["date_out"])}</td>
          <td class="tc bold">{e(b["diam"])}</td>
          <td>{e(b["model"])}</td>
          <td>{e(b["serial"])}</td>
          <td>{e(b["nozzles"])}</td>
          <td class="tc">{e(b["tfa"])}</td>
          <td class="tc">{e(b["motor"])}</td>
          <td class="tc">{e(b["from"])}</td>
          <td class="tc">{e(b["to"])}</td>
          <td class="tc bold">{e(b["footage"])}</td>
          <td class="tc">{e(b["t_circ"])}</td>
          <td class="tc">{e(b["t_bit"])}</td>
          <td class="tc">{e(b["rop_plan"])}</td>
          <td class="tc bold">{e(b["rop_fact"])}</td>
          <td class="tc">{e(b["q"])}</td>
          <td class="tc">{e(b["wob"])}</td>
          <td class="tc">{e(b["rpm"])}</td>
          <td class="tc">{e(b["torque"])}</td>
          <td>{e(b["dull"])}</td>
        </tr>'''
    return rows

# Inclinometry HTML
def build_incl():
    rows = ''
    for row in incl_fact:
        d, zen, az, tvd, dls, dof = row
        rows += f'<tr><td class="tc bold">{e(d)}</td><td class="tc">{e(zen)}</td><td class="tc">{e(az)}</td><td class="tc">{e(tvd)}</td><td class="tc">{e(dls)}</td><td class="tc">{e(dof)}</td></tr>\n'
    return rows

# Shakers HTML
def build_shakers():
    rows = ''
    for (name, meshes, hours) in shakers:
        rows += f'<tr><td>{e(name)}</td><td class="tc">{e(meshes)}</td><td class="tc">{e(hours)}</td></tr>\n'
    return rows

# ── HTML Template ─────────────────────────────────────────────────────────────
html = f'''<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>139 · Суточный рапорт супервайзера — {e(well)} · {e(report_date)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
/* ── Reset & base ── */
*,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}
:root{{
  --bg0:#071018;--bg1:#0d1b2a;--bg2:#0f2237;
  --accent:#0ab4c7;--accent2:#1e90c4;--gold:#e2ac55;--danger:#e05050;--ok:#4caf7d;--warn:#f0a030;
  --panel:rgba(255,255,255,0.96);--panel-hdr:#162d42;
  --border:#d0dce8;--border2:#b0c4d8;
  --text:#0d1b2a;--text2:#3a5068;--text3:#6b8094;
  --mono:'Courier New',monospace;
}}
html{{font-size:14px;scroll-behavior:smooth}}
body{{background:var(--bg0);color:var(--text);font-family:'Manrope',sans-serif;min-height:100vh}}

/* ── Top bar ── */
.topbar{{
  background:linear-gradient(135deg,#071018 0%,#0d2035 60%,#0a2a40 100%);
  border-bottom:2px solid var(--accent);
  padding:12px 20px;display:flex;align-items:center;gap:16px;
  position:sticky;top:0;z-index:100;
}}
.topbar-logo{{font-family:'Oswald',sans-serif;font-size:1.1rem;font-weight:600;color:#fff;letter-spacing:.5px;white-space:nowrap}}
.topbar-meta{{flex:1;display:flex;gap:12px;flex-wrap:wrap;align-items:center}}
.badge{{background:rgba(10,180,199,.18);border:1px solid rgba(10,180,199,.35);border-radius:5px;padding:3px 10px;font-size:.75rem;color:#8de4ef;font-weight:600;white-space:nowrap}}
.badge.warn{{background:rgba(240,160,48,.18);border-color:rgba(240,160,48,.4);color:#f5c070}}
.badge.danger{{background:rgba(224,80,80,.18);border-color:rgba(224,80,80,.4);color:#f09090}}
.badge.ok{{background:rgba(76,175,125,.18);border-color:rgba(76,175,125,.4);color:#80dfb0}}
.topbar-actions{{display:flex;gap:8px;align-items:center}}
.btn{{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:7px;font-size:.8rem;font-weight:600;cursor:pointer;border:none;text-decoration:none;white-space:nowrap;transition:all .2s}}
.btn-save{{background:linear-gradient(135deg,#0ab4c7,#1e75c4);color:#fff}}
.btn-save:hover{{opacity:.88;transform:translateY(-1px)}}
.btn-print{{background:rgba(255,255,255,.1);color:#b0d4e8;border:1px solid rgba(255,255,255,.18)}}
.btn-print:hover{{background:rgba(255,255,255,.18)}}
.save-state{{font-size:.72rem;color:#6b9aaf}}

/* ── Layout ── */
.wrap{{max-width:1600px;margin:0 auto;padding:18px 16px 40px}}
.section{{background:var(--panel);border-radius:12px;box-shadow:0 2px 18px rgba(0,0,0,.15);margin-bottom:18px;overflow:hidden}}
.section-head{{
  background:var(--panel-hdr);color:#fff;
  padding:10px 18px;display:flex;align-items:center;gap:10px;
  font-family:'Oswald',sans-serif;font-size:.95rem;font-weight:500;letter-spacing:.5px;
}}
.section-head .icon{{font-size:1.1rem;opacity:.85}}
.section-body{{padding:16px 18px}}

/* ── Info grid ── */
.info-grid{{display:grid;grid-template-columns:1fr 1fr;gap:0}}
.info-col{{padding:4px 0}}
.info-row{{display:flex;align-items:baseline;padding:4px 8px;border-bottom:1px solid var(--border)}}
.info-row:last-child{{border-bottom:none}}
.info-label{{color:var(--text2);font-size:.78rem;min-width:220px;flex-shrink:0}}
.info-value{{font-weight:600;font-size:.85rem;color:var(--text)}}
.info-value.accent{{color:var(--accent2)}}
.info-value.warn{{color:var(--warn)}}
.info-value.danger{{color:var(--danger)}}
.info-value.ok{{color:var(--ok)}}

/* ── Casing table ── */
.casing-tbl{{width:100%;border-collapse:collapse;font-size:.82rem}}
.casing-tbl th{{background:#1e3a52;color:#8de4ef;padding:6px 10px;text-align:center;font-family:'Oswald',sans-serif;letter-spacing:.3px;font-weight:500}}
.casing-tbl td{{padding:7px 10px;border-bottom:1px solid var(--border);text-align:center}}
.casing-tbl tr:last-child td{{border-bottom:none}}
.casing-tbl tr:hover td{{background:#f0f6fb}}

/* ── Data tables ── */
.dtbl{{width:100%;border-collapse:collapse;font-size:.8rem}}
.dtbl th{{background:#162d42;color:#8de4ef;padding:6px 8px;text-align:center;font-family:'Oswald',sans-serif;letter-spacing:.3px;font-weight:500;white-space:nowrap}}
.dtbl td{{padding:5px 7px;border-bottom:1px solid #e4edf5;vertical-align:top}}
.dtbl tr:hover td{{background:#f5faff}}
.dtbl .tc{{text-align:center}}
.dtbl .tr{{text-align:right}}
.dtbl .bold{{font-weight:700}}
.dtbl .mono{{font-family:var(--mono);font-size:.78rem}}
.dtbl .oper-cell{{max-width:320px;font-size:.79rem;line-height:1.4}}
.dtbl .regime-cell{{max-width:240px;font-size:.78rem;color:#3a5068;line-height:1.4}}
.dtbl .pct{{color:var(--text2);font-size:.78rem}}
.dtbl .row-current{{background:#eff8f0}}
.dtbl .row-current td{{font-weight:600}}
.dtbl tr.subtotal{{background:#f0f4f8;font-weight:700}}
.dtbl tr.subtotal td{{border-top:2px solid var(--border2)}}

/* ── Mud tables ── */
.mud-wrap{{overflow-x:auto}}
.mud-tbl{{border-collapse:collapse;font-size:.78rem;min-width:900px}}
.mud-tbl th{{background:#162d42;color:#8de4ef;padding:5px 8px;text-align:center;font-family:'Oswald',sans-serif;white-space:nowrap;font-weight:500}}
.mud-tbl td{{padding:6px 8px;border:1px solid var(--border);text-align:center}}
.mud-tbl .plan-row td{{background:#f0f7ff}}
.mud-tbl .fact-row td{{background:#eff8f2;font-weight:600}}
.mud-tbl .row-label{{font-weight:700;text-align:left;background:#e8f0f8 !important;white-space:nowrap}}

/* ── Param cards ── */
.param-cards{{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;padding:4px 0}}
.param-card{{background:#f4f8fc;border:1px solid var(--border);border-radius:8px;padding:10px 12px;text-align:center}}
.param-card .pc-label{{font-size:.7rem;color:var(--text2);margin-bottom:4px}}
.param-card .pc-value{{font-size:1.15rem;font-weight:700;color:var(--text)}}
.param-card .pc-unit{{font-size:.68rem;color:var(--text3)}}
.param-card.highlight{{border-color:var(--accent);background:#e8f9fb}}
.param-card.highlight .pc-value{{color:var(--accent2)}}
.param-card.warn{{border-color:var(--warn);background:#fffbe8}}
.param-card.warn .pc-value{{color:#c87010}}

/* ── Two-column layout ── */
.two-col{{display:grid;grid-template-columns:1fr 1fr;gap:18px}}
.three-col{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px}}

/* ── Bar chart ── */
.bar-wrap{{display:flex;align-items:center;gap:6px;min-width:80px}}
.bar-fill{{height:8px;border-radius:4px;transition:width .3s}}
.bar-wrap span{{font-size:.75rem;color:var(--text2);white-space:nowrap}}

/* ── Status badge ── */
.status-dot{{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}}
.dot-ok{{background:var(--ok)}}
.dot-warn{{background:var(--warn)}}
.dot-bad{{background:var(--danger)}}

/* ── Comments ── */
.comment-grid{{display:grid;grid-template-columns:1fr 1fr;gap:14px}}
.comment-block label{{display:block;font-size:.78rem;font-weight:600;color:var(--text2);margin-bottom:4px}}
.comment-block textarea{{width:100%;min-height:80px;border:1px solid var(--border);border-radius:6px;padding:8px;font-family:'Manrope',sans-serif;font-size:.82rem;color:var(--text);resize:vertical;background:#fafcff}}
.comment-block textarea:focus{{outline:none;border-color:var(--accent)}}
.comment-block.full{{grid-column:1/-1}}

/* ── Personnel ── */
.person-grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}}
.person-card{{background:#f4f8fc;border:1px solid var(--border);border-radius:8px;padding:12px 14px}}
.person-card .role{{font-size:.7rem;color:var(--text2);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}}
.person-card .name{{font-weight:700;font-size:.88rem;margin-bottom:3px}}
.person-card .contact{{font-size:.78rem;color:var(--accent2)}}

/* ── Print ── */
@media print{{
  body{{background:#fff;color:#000}}
  .topbar{{position:relative;background:#162d42;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .section{{box-shadow:none;border:1px solid #ccc;margin-bottom:12px;break-inside:avoid}}
  .btn-save,.btn-print,.save-state{{display:none}}
}}

/* ── Scrollable ── */
.scroll-x{{overflow-x:auto}}

/* ── Section nav ── */
.sec-nav{{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}}
.sec-nav a{{background:rgba(10,180,199,.12);border:1px solid rgba(10,180,199,.28);border-radius:5px;padding:4px 11px;font-size:.73rem;color:#3ab8c8;font-weight:600;text-decoration:none;white-space:nowrap}}
.sec-nav a:hover{{background:rgba(10,180,199,.22)}}

/* ── Highlight rows ── */
.hdr-row td{{background:#e8f0f8;font-weight:700;font-size:.79rem;color:#1a3050}}
.sub-row td{{background:#f4f8fc;font-style:italic;font-size:.77rem;color:#3a5068}}
</style>
</head>
<body>

<!-- TOP BAR -->
<header class="topbar">
  <div class="topbar-logo">DDR · {e(well)}</div>
  <div class="topbar-meta">
    <span class="badge">Скв. {e(well)} · Куст {e(cluster)}</span>
    <span class="badge">{e(field)}</span>
    <span class="badge warn">Рапорт №{e(report_no)} · {e(report_date)}</span>
    <span class="badge {'danger' if sched_lag and float(sched_lag.replace(',','.')) < 0 else 'ok'}">
      {'▼' if sched_lag and float(sched_lag.replace(',','.')) < 0 else '▲'} {e(sched_lag)} сут. от графика
    </span>
    <span class="badge">Забой: {e(depth_end)} м</span>
    <span class="badge">Суточная проходка: {e(daily_prog)} м</span>
    <span class="badge">НПВ накоп.: {e(npv_acc)} сут.</span>
  </div>
  <div class="topbar-actions">
    <span class="save-state" id="saveState">Не сохранено</span>
    <button class="btn btn-save" onclick="saveState()">💾 Сохранить</button>
    <button class="btn btn-print" onclick="window.print()">🖨 Печать</button>
  </div>
</header>

<main class="wrap">

<!-- SECTION NAV -->
<nav class="sec-nav">
  <a href="#s-info">Общая информация</a>
  <a href="#s-const">Конструкция</a>
  <a href="#s-timelog">Журнал операций (КНБК)</a>
  <a href="#s-status">Состояние на 6:00</a>
  <a href="#s-timedist">Распределение времени</a>
  <a href="#s-bits">Долота</a>
  <a href="#s-mud">Буровой раствор</a>
  <a href="#s-shakers">Насосы / вибросита</a>
  <a href="#s-incl">Инклинометрия</a>
  <a href="#s-mwd">ГТД (MWD)</a>
  <a href="#s-comments">Комментарии</a>
  <a href="#s-people">Персонал</a>
</nav>

<!-- ═══════════════════════════════════════════════════════ 1. ОБЩАЯ ИНФОРМАЦИЯ -->
<section class="section" id="s-info">
  <div class="section-head"><span class="icon">📋</span> ОБЩАЯ ИНФОРМАЦИЯ О СКВАЖИНЕ</div>
  <div class="section-body">
    <div class="info-grid">
      <div class="info-col">
        <div class="info-row"><span class="info-label">Месторождение</span><span class="info-value accent">{e(field)}</span></div>
        <div class="info-row"><span class="info-label">Скважина №</span><span class="info-value bold">{e(well)}</span></div>
        <div class="info-row"><span class="info-label">Куст №</span><span class="info-value">{e(cluster)}</span></div>
        <div class="info-row"><span class="info-label">Назначение</span><span class="info-value">{e(purpose)}</span></div>
        <div class="info-row"><span class="info-label">Заказчик</span><span class="info-value">{e(customer)}</span></div>
        <div class="info-row"><span class="info-label">Подрядчик по бурению</span><span class="info-value">{e(driller)}</span></div>
        <div class="info-row"><span class="info-label">Подрядчик по ННВ</span><span class="info-value">{e(mwd_co)}</span></div>
        <div class="info-row"><span class="info-label">Подрядчик по долотам</span><span class="info-value">{e(bit_co)}</span></div>
        <div class="info-row"><span class="info-label">Подрядчик по растворам</span><span class="info-value">{e(mud_co)}</span></div>
        <div class="info-row"><span class="info-label">Подрядчик по цементированию</span><span class="info-value">{e(cem_co)}</span></div>
        <div class="info-row"><span class="info-label">Подрядчик по ГТДС</span><span class="info-value">{e(gtds_co)}</span></div>
      </div>
      <div class="info-col">
        <div class="info-row"><span class="info-label">Дата отчёта</span><span class="info-value bold">{e(report_date)}</span></div>
        <div class="info-row"><span class="info-label">Номер отчёта</span><span class="info-value">{e(report_no)}</span></div>
        <div class="info-row"><span class="info-label">Дата начала строительства</span><span class="info-value">{e(constr_start)}</span></div>
        <div class="info-row"><span class="info-label">Дней по плану</span><span class="info-value">{e(days_plan)}</span></div>
        <div class="info-row"><span class="info-label">Фактическое количество дней</span><span class="info-value">{e(days_fact)}</span></div>
        <div class="info-row"><span class="info-label">Накопленное НПВ, сут.</span><span class="info-value warn">{e(npv_acc)}</span></div>
        <div class="info-row"><span class="info-label">Тип буровой установки</span><span class="info-value">{e(rig_type)}</span></div>
        <div class="info-row"><span class="info-label">Диаметр ствола, мм</span><span class="info-value">{e(bit_size)}</span></div>
        <div class="info-row"><span class="info-label">Забой на конец суток, м</span><span class="info-value bold accent">{e(depth_end)}</span></div>
        <div class="info-row"><span class="info-label">Суточная проходка, м</span><span class="info-value">{e(daily_prog)}</span></div>
        <div class="info-row"><span class="info-label">Температура окруж. среды, °C</span><span class="info-value">{e(temp_env)}</span></div>
        <div class="info-row"><span class="info-label">Опережение / отставание, сут.</span>
          <span class="info-value {'danger' if sched_lag and float(sched_lag.replace(',','.')) < 0 else 'ok'}">{e(sched_lag)}</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════ 2. КОНСТРУКЦИЯ СКВАЖИНЫ -->
<section class="section" id="s-const">
  <div class="section-head"><span class="icon">🏗</span> КОНСТРУКЦИЯ СКВАЖИНЫ</div>
  <div class="section-body">
    <table class="casing-tbl">
      <thead>
        <tr>
          <th>Обсадная колонна</th>
          <th>Диаметр, мм</th>
          <th>Глубина проект, м</th>
          <th>Глубина факт, м</th>
          <th>Дата цементажа</th>
          <th>Статус</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Направление</strong></td>
          <td>—</td>
          <td>{e(cas_dir_plan)}</td>
          <td>{e(cas_dir_fact)}</td>
          <td>—</td>
          <td><span class="status-dot dot-ok"></span>Зацементировано</td>
        </tr>
        <tr>
          <td><strong>Кондуктор</strong></td>
          <td>700</td>
          <td>{e(cas_con_plan)}</td>
          <td>{e(cas_con_fact)}</td>
          <td>{e(cas_con_date)}</td>
          <td><span class="status-dot dot-ok"></span>Зацементировано</td>
        </tr>
        <tr>
          <td><strong>Техническая колонна</strong></td>
          <td>—</td>
          <td>{e(cas_tec_plan)}</td>
          <td>—</td>
          <td>—</td>
          <td><span class="status-dot dot-warn"></span>В плане</td>
        </tr>
        <tr>
          <td><strong>Эксплуатационная колонна</strong></td>
          <td>—</td>
          <td>{e(cas_exp_plan)}</td>
          <td>—</td>
          <td>—</td>
          <td><span class="status-dot dot-warn"></span>В плане</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════ 3. ЖУРНАЛ ОПЕРАЦИЙ + КНБК -->
<section class="section" id="s-timelog">
  <div class="section-head"><span class="icon">⏱</span> КНБК №4 · ЖУРНАЛ ОПЕРАЦИЙ ЗА СУТКИ 20.04.2026</div>
  <div class="section-body scroll-x">
    <table class="dtbl">
      <thead>
        <tr>
          <th rowspan="2">От</th>
          <th rowspan="2">До</th>
          <th rowspan="2">Часы</th>
          <th rowspan="2" style="min-width:220px">Описание операции</th>
          <th colspan="5" style="background:#1a3d58">Элементы КНБК №4</th>
        </tr>
        <tr>
          <th style="background:#1a3d58">Наименование</th>
          <th style="background:#1a3d58">Нар.мм</th>
          <th style="background:#1a3d58">Внутр.мм</th>
          <th style="background:#1a3d58">Длина, м</th>
          <th style="background:#1a3d58">Σ Длина, м</th>
        </tr>
      </thead>
      <tbody>
        {tlog_html}
        <tr class="subtotal">
          <td colspan="2" class="tc">ИТОГО</td>
          <td class="tc">{e(total_hours)}</td>
          <td colspan="6"></td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════ 4. СОСТОЯНИЕ НА 6:00 -->
<section class="section" id="s-status">
  <div class="section-head"><span class="icon">🕕</span> СОСТОЯНИЕ НА 6:00 · ПЛАН СЛЕДУЮЩИХ СУТОК</div>
  <div class="section-body scroll-x">
    <table class="dtbl">
      <thead>
        <tr>
          <th>От</th>
          <th>До</th>
          <th>Часы</th>
          <th style="min-width:280px">Описание операции</th>
          <th style="min-width:240px">Режим / параметры</th>
        </tr>
      </thead>
      <tbody>
        {status_html if status_html else '<tr><td colspan="5" style="text-align:center;color:#999">Нет данных</td></tr>'}
      </tbody>
    </table>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════ 5. РАСПРЕДЕЛЕНИЕ ВРЕМЕНИ -->
<section class="section" id="s-timedist">
  <div class="section-head"><span class="icon">📊</span> РАСПРЕДЕЛЕНИЕ ОПЕРАЦИОННОГО ВРЕМЕНИ</div>
  <div class="section-body scroll-x">
    <table class="dtbl">
      <thead>
        <tr>
          <th style="min-width:180px;text-align:left">Категория</th>
          <th>Сутки, ч</th>
          <th>Сутки, %</th>
          <th>Нараст. итог, ч</th>
          <th>Нараст. итог, %</th>
        </tr>
      </thead>
      <tbody>
        {build_time_dist()}
      </tbody>
    </table>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════ 6. ДОЛОТА -->
<section class="section" id="s-bits">
  <div class="section-head"><span class="icon">⚙️</span> ИСТОРИЯ РЕЙСОВ ДОЛОТА</div>
  <div class="section-body scroll-x">
    <table class="dtbl">
      <thead>
        <tr>
          <th>№</th>
          <th>Спуск</th>
          <th>Подъём</th>
          <th>Диам., мм</th>
          <th>Модель</th>
          <th>Серийный №</th>
          <th>Насадки</th>
          <th>TFA, мм²</th>
          <th>ВЗД/РУС</th>
          <th>Инт. от, м</th>
          <th>Инт. до, м</th>
          <th>Проходка, м</th>
          <th>Вр. цирк., ч</th>
          <th>Вр. бур., ч</th>
          <th>МСП пл., м/ч</th>
          <th>МСП факт, м/ч</th>
          <th>Q, л/с</th>
          <th>G, тн</th>
          <th>N, об/мин</th>
          <th>T, кН·м</th>
          <th>Код износа IADC</th>
        </tr>
      </thead>
      <tbody>
        {build_bits()}
      </tbody>
    </table>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════ 7. БУРОВОЙ РАСТВОР -->
<section class="section" id="s-mud">
  <div class="section-head"><span class="icon">🧪</span> ПАРАМЕТРЫ БУРОВОГО РАСТВОРА</div>
  <div class="section-body">
    <div class="mud-wrap">
      <table class="mud-tbl" style="width:100%">
        <thead>
          <tr>
            <th>Тип</th>
            <th>ρ, г/см³</th>
            <th>УВ, сек/кв</th>
            <th>ПВ, сП</th>
            <th>ДНС</th>
            <th>СНС 10с/10мин</th>
            <th>R6/3</th>
            <th>Водоотд. LTLP мл/30мин</th>
            <th>Хлориды мг/мл</th>
            <th>Песок %</th>
            <th>ЭС, В</th>
            <th>OWR %</th>
            <th>Изв. кг/м³</th>
            <th>Корка, мм</th>
            <th>СаСО₃ кг/м³</th>
            <th>рН</th>
            <th>В скважине, м³</th>
            <th>В ёмкостях, м³</th>
            <th>Всего, м³</th>
          </tr>
        </thead>
        <tbody>
          <tr class="plan-row">
            <td class="row-label">ПЛАН</td>
            <td>{e(mud_plan["dens"])}</td>
            <td>{e(mud_plan["visc"])}</td>
            <td>{e(mud_plan["pv"])}</td>
            <td>{e(mud_plan["yp"])}</td>
            <td>{e(mud_plan["gel"])}</td>
            <td>{e(mud_plan["r63"])}</td>
            <td>{e(mud_plan["fl"])}</td>
            <td>{e(mud_plan["cl"])}</td>
            <td>{e(mud_plan["sand"])}</td>
            <td>{e(mud_plan["es"])}</td>
            <td>{e(mud_plan["owr"])}</td>
            <td>{e(mud_plan["lime"])}</td>
            <td>{e(mud_plan["cake"])}</td>
            <td>{e(mud_plan["caco"])}</td>
            <td>{e(mud_plan["ph"])}</td>
            <td>{e(mud_plan["vol_well"])}</td>
            <td>{e(mud_plan["vol_tanks"])}</td>
            <td>{e(mud_plan["vol_total"])}</td>
          </tr>
          <tr class="fact-row">
            <td class="row-label">ФАКТ</td>
            <td>{e(mud_fact["dens"])}</td>
            <td>{e(mud_fact["visc"])}</td>
            <td>{e(mud_fact["pv"])}</td>
            <td>{e(mud_fact["yp"])}</td>
            <td>{e(mud_fact["gel"])}</td>
            <td>{e(mud_fact["r63"])}</td>
            <td>{e(mud_fact["fl"])}</td>
            <td>{e(mud_fact["cl"])}</td>
            <td>{e(mud_fact["sand"])}</td>
            <td>{e(mud_fact["es"])}</td>
            <td>{e(mud_fact["owr"])}</td>
            <td>{e(mud_fact["lime"])}</td>
            <td>{e(mud_fact["cake"])}</td>
            <td>{e(mud_fact["caco"])}</td>
            <td>{e(mud_fact["ph"])}</td>
            <td><input class="field" type="text" value="{e(mud_fact["vol_well"])}" style="width:70px"></td>
            <td><input class="field" type="text" value="{e(mud_fact["vol_tanks"])}" style="width:70px"></td>
            <td><input class="field" type="text" value="{e(mud_fact["vol_total"])}" style="width:70px"></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="margin-top:10px;font-size:.78rem;color:var(--text2)">
      Тип раствора: <strong>{e(mud_plan["type"])}</strong>
    </div>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════ 8. НАСОСЫ / ВИБРОСИТА -->
<section class="section" id="s-shakers">
  <div class="section-head"><span class="icon">🔧</span> НАСОСЫ И ВИБРОСИТА</div>
  <div class="section-body">
    <div class="two-col">
      <div>
        <div style="font-size:.8rem;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Вибросита / сепараторы</div>
        <table class="dtbl">
          <thead>
            <tr><th style="text-align:left">Агрегат</th><th>Размер сеток (API)</th><th>Часы работы</th></tr>
          </thead>
          <tbody>
            {build_shakers()}
          </tbody>
        </table>
      </div>
      <div>
        <div style="font-size:.8rem;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Учёт шлама</div>
        <table class="dtbl">
          <thead>
            <tr>
              <th style="text-align:left">Смена</th>
              <th>Набрано, шт</th>
              <th>Набрано, м³</th>
              <th>Вывезено, шт</th>
              <th>Вывезено, м³</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>День</td>
              <td><input class="field" type="text" style="width:60px"></td>
              <td><input class="field" type="text" style="width:60px"></td>
              <td><input class="field" type="text" style="width:60px"></td>
              <td><input class="field" type="text" style="width:60px"></td>
            </tr>
            <tr>
              <td>Ночь</td>
              <td><input class="field" type="text" style="width:60px"></td>
              <td><input class="field" type="text" style="width:60px"></td>
              <td><input class="field" type="text" style="width:60px"></td>
              <td><input class="field" type="text" style="width:60px"></td>
            </tr>
            <tr class="subtotal">
              <td>ИТОГО</td>
              <td></td><td></td><td></td><td></td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:8px;font-size:.78rem">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
            <input type="checkbox" class="field"> <span>Состояние ОТТВИОС в норме, происшествий нет</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════ 9. ИНКЛИНОМЕТРИЯ -->
<section class="section" id="s-incl">
  <div class="section-head"><span class="icon">📐</span> ИНКЛИНОМЕТРИЯ ФАКТ</div>
  <div class="section-body">
    <div class="two-col">
      <div class="scroll-x">
        <div style="font-size:.8rem;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Фактические замеры</div>
        <table class="dtbl">
          <thead>
            <tr>
              <th>Глубина, м</th>
              <th>Зен. угол, °</th>
              <th>Азимут, °</th>
              <th>TVD, м</th>
              <th>DLS °/10м</th>
              <th>Отход, м</th>
            </tr>
          </thead>
          <tbody>
            {build_incl()}
          </tbody>
        </table>
      </div>
      <div>
        <div style="font-size:.8rem;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Плановая проектная точка (TD)</div>
        <div class="param-cards">
          <div class="param-card highlight">
            <div class="pc-label">Глубина план</div>
            <div class="pc-value">{e(fmt(g(rap,102,2)))}</div>
            <div class="pc-unit">м</div>
          </div>
          <div class="param-card">
            <div class="pc-label">Зен. угол</div>
            <div class="pc-value">{e(fmt(g(rap,102,3)))}</div>
            <div class="pc-unit">°</div>
          </div>
          <div class="param-card">
            <div class="pc-label">Азимут</div>
            <div class="pc-value">{e(fmt(g(rap,102,4)))}</div>
            <div class="pc-unit">°</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════ 10. ГТД (MWD) -->
<section class="section" id="s-mwd">
  <div class="section-head"><span class="icon">📡</span> ПАРАМЕТРЫ ГЕОЛОГО-ТЕХНИЧЕСКИХ ДАННЫХ (ГТД / MWD)</div>
  <div class="section-body">
    <div class="param-cards">
      <div class="param-card highlight">
        <div class="pc-label">Глубина замера</div>
        <div class="pc-value">{e(mwd["depth"])}</div>
        <div class="pc-unit">м</div>
      </div>
      <div class="param-card">
        <div class="pc-label">ГК</div>
        <div class="pc-value">{e(mwd["gamma"])}</div>
        <div class="pc-unit">API</div>
      </div>
      <div class="param-card">
        <div class="pc-label">Азимут</div>
        <div class="pc-value">{e(mwd["azimuth"])}</div>
        <div class="pc-unit">°</div>
      </div>
      <div class="param-card">
        <div class="pc-label">TVD</div>
        <div class="pc-value">{e(mwd["tvd"])}</div>
        <div class="pc-unit">м</div>
      </div>
      <div class="param-card warn">
        <div class="pc-label">DLS</div>
        <div class="pc-value">{e(mwd["dls"])}</div>
        <div class="pc-unit">°/10м</div>
      </div>
      <div class="param-card">
        <div class="pc-label">Догляд</div>
        <div class="pc-value">{e(mwd["dogleg"])}</div>
        <div class="pc-unit"></div>
      </div>
      <div class="param-card">
        <div class="pc-label">Темп., °C</div>
        <div class="pc-value">{e(mwd["temp"])}</div>
        <div class="pc-unit">°C</div>
      </div>
      <div class="param-card">
        <div class="pc-label">ГК 2</div>
        <div class="pc-value">{e(mwd["gr2"])}</div>
        <div class="pc-unit">API</div>
      </div>
      <div class="param-card">
        <div class="pc-label">Зен. угол</div>
        <div class="pc-value">{e(mwd["inc"])}</div>
        <div class="pc-unit">°</div>
      </div>
      <div class="param-card">
        <div class="pc-label">Глубина 2</div>
        <div class="pc-value">{e(mwd["depth2"])}</div>
        <div class="pc-unit">м</div>
      </div>
      <div class="param-card warn">
        <div class="pc-label">Отход</div>
        <div class="pc-value">{e(mwd["offset"])}</div>
        <div class="pc-unit">м</div>
      </div>
      <div class="param-card">
        <div class="pc-label">МСП</div>
        <div class="pc-value">{e(mwd["rop"])}</div>
        <div class="pc-unit">м/ч</div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════ 11. КОММЕНТАРИИ -->
<section class="section" id="s-comments">
  <div class="section-head"><span class="icon">💬</span> КОММЕНТАРИИ СПЕЦИАЛИСТОВ</div>
  <div class="section-body">
    <div class="comment-grid">
      <div class="comment-block">
        <label>Комментарии супервайзера и предложения по оптимизации</label>
        <textarea class="area" rows="4"></textarea>
      </div>
      <div class="comment-block">
        <label>Комментарии геолога ГТД</label>
        <textarea class="area" rows="4"></textarea>
      </div>
      <div class="comment-block">
        <label>Комментарий бурового подрядчика</label>
        <textarea class="area" rows="4"></textarea>
      </div>
      <div class="comment-block">
        <label>НПВ</label>
        <textarea class="area" rows="4"></textarea>
      </div>
      <div class="comment-block">
        <label>Растворный сервис</label>
        <textarea class="area" rows="4"></textarea>
      </div>
      <div class="comment-block">
        <label>Контроль параметров и объёмов ВР</label>
        <textarea class="area" rows="4"></textarea>
      </div>
      <div class="comment-block full">
        <label>BSS / Прочие комментарии</label>
        <textarea class="area" rows="3"></textarea>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════ 12. ПЕРСОНАЛ -->
<section class="section" id="s-people">
  <div class="section-head"><span class="icon">👷</span> ПЕРСОНАЛ И КОНТАКТЫ</div>
  <div class="section-body">
    <div class="person-grid">
      <div class="person-card">
        <div class="role">Супервайзер ООО "БурСервис"</div>
        <div class="name">{e(sup_name)}</div>
        <div class="contact">{e(sup_phone)}</div>
      </div>
      <div class="person-card">
        <div class="role">Представитель Заказчика</div>
        <div class="name">{e(cli_name)}</div>
        <div class="contact">{e(cli_phone)}</div>
      </div>
      <div class="person-card">
        <div class="role">Мастер буровой ООО "РН-Бурение"</div>
        <div class="name">{e(drm_name)}</div>
        <div class="contact">{e(drm_phone)}</div>
      </div>
      <div class="person-card">
        <div class="role">Инж. долотного сервиса "Халлибуртон нт. ГмбХ"</div>
        <div class="name">{e(bit_name)}</div>
        <div class="contact">{e(bit_phone)}</div>
      </div>
    </div>
  </div>
</section>

</main>

<script>
const STORAGE_KEY = 'ddr-139-v2';

function saveState() {{
  const data = {{}};
  document.querySelectorAll('input.field[type=text], textarea.area').forEach((el, i) => {{
    data['f_' + i] = el.value;
  }});
  document.querySelectorAll('input.field[type=checkbox]').forEach((el, i) => {{
    data['cb_' + i] = el.checked;
  }});
  data._ts = new Date().toLocaleString('ru-RU');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  const s = document.getElementById('saveState');
  s.textContent = '✓ Сохранено ' + data._ts;
  s.style.color = '#4caf7d';
}}

function restoreState() {{
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {{
    const data = JSON.parse(raw);
    const inputs = document.querySelectorAll('input.field[type=text], textarea.area');
    const cbs = document.querySelectorAll('input.field[type=checkbox]');
    inputs.forEach((el, i) => {{ if (data['f_' + i] !== undefined) el.value = data['f_' + i]; }});
    cbs.forEach((el, i) => {{ if (data['cb_' + i] !== undefined) el.checked = data['cb_' + i]; }});
    if (data._ts) {{
      const s = document.getElementById('saveState');
      s.textContent = '✓ Сохранено ' + data._ts;
      s.style.color = '#4caf7d';
    }}
  }} catch(e) {{}}
}}

document.addEventListener('DOMContentLoaded', restoreState);
document.addEventListener('keydown', e => {{ if ((e.ctrlKey||e.metaKey) && e.key === 's') {{ e.preventDefault(); saveState(); }} }});
</script>
</body>
</html>
'''

out_path = 'docs/139_supervisor_summary_dashboard.html'
with open(out_path, 'w', encoding='utf-8') as fp:
    fp.write(html)
print(f'Written {out_path} ({len(html):,} chars)')
