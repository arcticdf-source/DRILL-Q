# -*- coding: utf-8 -*-
"""
Generate 139_supervisor_summary_dashboard.html from Excel JSON.
- Editable cells ([ed]) -> <input> or <textarea> 
- Formula cells ([fx]) -> <span class="fx-cell"> with formula tooltip + computed value
Run: py docs/data/gen_report2.py
"""
import json, re
from datetime import datetime

with open('docs/data/supervisor_report_workbook.json', encoding='utf-8') as f:
    wb = json.load(f)

sheets_map = {s['name']: s for s in wb['sheets']}

def make_grid(name):
    sh = sheets_map[name]
    return {(c['r'], c['c']): c for c in sh['cells']}

rap = make_grid('Рапорт')
knbk_grid   = make_grid('КНБК')
bal_grid    = make_grid('Баланс')
time_grid   = make_grid('Время')
npv_grid    = make_grid('НПВ')
ops_grid    = make_grid('Операции по скважине')
lessons_grid= make_grid('Извлеченные уроки')
graf_grid   = make_grid('График "Глубина-Время"')
pbi_grid    = make_grid('PBI-таблица')

def cell(grid, r, c):
    return grid.get((r, c))

def v(grid, r, c):
    cel = grid.get((r, c))
    return cel['v'] if cel else None

def fmt_val(val):
    if val is None: return ''
    if isinstance(val, float):
        if abs(val - round(val)) < 1e-9: return str(int(round(val)))
        return str(round(val, 4))
    s = str(val)
    if re.match(r'\d{4}-\d{2}-\d{2}', s):
        try:
            return datetime.fromisoformat(s[:10]).strftime('%d.%m.%Y')
        except: pass
    if re.match(r'\d+:\d+:\d+', s):
        m = re.match(r'(\d+):(\d+)', s)
        if m: return f'{int(m.group(1)):02d}:{m.group(2)}'
    if '1 day' in s: return '24:00'
    return s

def e(s):
    if not s: return ''
    return str(s).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')

def e_nl(s):
    """escape + preserve newlines as <br>"""
    return e(s).replace('\n','<br>')

# ── Render cell as HTML ──────────────────────────────────────────────────────
_input_idx = [0]

def render_cell(cel, tag='td', cls='', inline=False, rows=1, style=''):
    """Return HTML for a single cell. Editable -> input/textarea. Formula -> fx-span."""
    if cel is None:
        return f'<{tag}></{tag}>'
    
    val = cel['v']
    fx = cel.get('f')
    display = fmt_val(val)
    
    style_attr = f' style="{style}"' if style else ''
    cls_attr = f' class="{cls}"' if cls else ''
    
    if fx:
        # Formula cell - show computed value, non-editable, with tooltip
        fx_clean = str(fx).replace('"','&quot;')
        return f'<{tag}{cls_attr}{style_attr}><span class="fx-val" title="={fx_clean}">{e_nl(display)}</span></{tag}>'
    else:
        # Editable cell
        idx = _input_idx[0]
        _input_idx[0] += 1
        if rows > 1 or (display and '\n' in str(val or '')):
            return f'<{tag}{cls_attr}{style_attr}><textarea class="area" data-i="{idx}" rows="{max(rows,2)}">{e_nl(display)}</textarea></{tag}>'
        else:
            return f'<{tag}{cls_attr}{style_attr}><input class="field" type="text" data-i="{idx}" value="{e(display)}"></{tag}>'

def td_ed(val, cls='', style=''):
    """Editable td with given static value"""
    idx = _input_idx[0]; _input_idx[0] += 1
    style_attr = f' style="{style}"' if style else ''
    cls_attr = f' class="{cls}"' if cls else ''
    return f'<td{cls_attr}{style_attr}><input class="field" type="text" data-i="{idx}" value="{e(fmt_val(val))}"></td>'

def td_fx(val, formula='', cls='', style=''):
    """Formula td - display only with tooltip"""
    style_attr = f' style="{style}"' if style else ''
    cls_attr = f' class="{cls}"' if cls else ''
    fx_clean = e(str(formula))
    return f'<td{cls_attr}{style_attr}><span class="fx-val" title="={fx_clean}">{e(fmt_val(val))}</span></td>'

def td_label(text, cls='label-cell'):
    return f'<td class="{cls}">{e(text)}</td>'

def render_rap(r, c, tag='td', cls='', style=''):
    cel = rap.get((r, c))
    if cel is None: return f'<{tag}></{tag}>'
    return render_cell(cel, tag, cls, style=style)

# ────────────────────────────────────────────────────────────────────────────
# Build each section

# ── SECTION: General info table ──────────────────────────────────────────────
# Left column: pairs (label, cell-row, cell-col)
info_left = [
    ('Месторождение', 5, 16),
    ('Скважина №', 7, 5),
    ('Куст №', 5, 9),
    ('Назначение', 8, 5),
    ('Заказчик', 9, 5),
    ('Подрядчик по бурению', 10, 5),
    ('Подрядчик по ННВ', 11, 5),
    ('Подрядчик по долотам', 12, 5),
    ('Подрядчик по растворам', 13, 5),
    ('Подрядчик по цементированию', 14, 5),
    ('Подрядчик по ГТДС', 15, 5),
]
info_right = [
    ('Дата отчёта', 6, 11),
    ('Номер отчёта', 7, 11),
    ('Дата начала строительства скважины', 8, 11),
    ('Дней по плану', 9, 11),
    ('Фактическое количество дней', 10, 11),
    ('Накопленное НПВ, сут.', 11, 11),
    ('Тип бур/станка', 12, 11),
    ('Диаметр ствола, мм', 13, 11),
    ('Забой на конец суток, м', 14, 11),
    ('Суточная проходка, м', 15, 11),
    ('Температура окруж. среды, °C', 16, 11),
    ('Опережение/отставание от графика, сут.', 17, 11),
]

def render_info_rows(pairs):
    out = ''
    for label, r, c in pairs:
        cel = rap.get((r, c))
        out += f'<tr><td class="il">{e(label)}</td>'
        out += render_cell(cel, 'td', 'iv') if cel else '<td class="iv"></td>'
        out += '</tr>\n'
    return out

# ── SECTION: Casing ───────────────────────────────────────────────────────────
casing_rows_data = [
    ('Направление', 7, 14, 7, 18, 7, 19, 7, 20),
    ('Кондуктор', 8, 14, 8, 18, 8, 19, 8, 20),
    ('Техническая колонна', 9, 14, 9, 18, None, None, None, None),
    ('Эксплуатационная колонна', 10, 14, 10, 18, None, None, None, None),
    ('Хвостовик', 11, 14, 11, 18, None, None, None, None),
]

def render_casing():
    out = ''
    for name, r_n, c_n, r_p, c_p, r_f, c_f, r_d, c_d in casing_rows_data:
        cel_p = rap.get((r_p, c_p)) if r_p else None
        cel_f = rap.get((r_f, c_f)) if r_f else None
        cel_d = rap.get((r_d, c_d)) if r_d else None
        out += f'<tr><td class="label-cell">{e(name)}</td>'
        out += render_cell(cel_p, 'td', 'tc') if cel_p else '<td class="tc"></td>'
        out += render_cell(cel_f, 'td', 'tc') if cel_f else '<td class="tc"></td>'
        out += render_cell(cel_d, 'td', 'tc') if cel_d else '<td class="tc"></td>'
        out += '</tr>\n'
    return out

# ── SECTION: Time log (КНБК) ─────────────────────────────────────────────────
def render_timelog():
    out = ''
    for r in range(20, 44):
        cel_fr = rap.get((r, 2))
        cel_to = rap.get((r, 3))
        cel_h  = rap.get((r, 4))
        cel_op = rap.get((r, 5))
        cel_el = rap.get((r, 14))
        cel_od = rap.get((r, 18))
        cel_id = rap.get((r, 19))
        cel_l  = rap.get((r, 20))
        cel_s  = rap.get((r, 21))
        
        has_data = any([cel_fr, cel_op, cel_el])
        if not has_data and r >= 32: continue  # skip empty trailing rows

        out += '<tr>'
        out += render_cell(cel_fr, 'td', 'tc mono') if cel_fr else '<td class="tc mono"></td>'
        out += render_cell(cel_to, 'td', 'tc mono') if cel_to else '<td class="tc mono"></td>'
        out += render_cell(cel_h,  'td', 'tc bold fx-center') if cel_h else '<td class="tc"></td>'
        # Operation text - textarea for long text
        if cel_op and cel_op['v'] and len(str(cel_op['v'])) > 60:
            out += f'<td class="oper-cell">{render_cell(cel_op, "span")}</td>'
        else:
            out += render_cell(cel_op, 'td', 'oper-cell') if cel_op else '<td class="oper-cell"></td>'
        out += render_cell(cel_el, 'td', 'el-cell') if cel_el else '<td class="el-cell"></td>'
        out += render_cell(cel_od, 'td', 'tc') if cel_od else '<td class="tc"></td>'
        out += render_cell(cel_id, 'td', 'tc') if cel_id else '<td class="tc"></td>'
        out += render_cell(cel_l,  'td', 'tc') if cel_l else '<td class="tc"></td>'
        out += render_cell(cel_s,  'td', 'tc bold') if cel_s else '<td class="tc bold"></td>'
        out += '</tr>\n'
    
    # Total row
    cel_tot = rap.get((44, 4))
    out += f'<tr class="subtotal"><td colspan="2" class="tc">ИТОГО</td>'
    out += render_cell(cel_tot, 'td', 'tc bold') if cel_tot else '<td class="tc bold">24</td>'
    out += '<td colspan="6"></td></tr>\n'
    return out

# ── SECTION: Status at 6:00 ───────────────────────────────────────────────────
def render_status():
    out = ''
    for r in range(47, 54):
        cel_fr = rap.get((r, 2))
        cel_to = rap.get((r, 3))
        cel_h  = rap.get((r, 4))
        cel_op = rap.get((r, 5))
        cel_rg = rap.get((r, 18))
        if not (cel_fr or cel_op): continue
        out += '<tr>'
        out += render_cell(cel_fr, 'td', 'tc mono') if cel_fr else '<td></td>'
        out += render_cell(cel_to, 'td', 'tc mono') if cel_to else '<td></td>'
        out += render_cell(cel_h,  'td', 'tc bold fx-center') if cel_h else '<td></td>'
        if cel_op and cel_op['v'] and len(str(cel_op['v'])) > 60:
            op_idx = _input_idx[0]; _input_idx[0] += 1
            op_val = fmt_val(cel_op['v'])
            out += f'<td class="oper-cell"><textarea class="area" data-i="{op_idx}" rows="3">{e(op_val)}</textarea></td>'
        else:
            out += render_cell(cel_op, 'td', 'oper-cell') if cel_op else '<td></td>'
        if cel_rg and cel_rg['v'] and len(str(cel_rg['v'])) > 60:
            rg_idx = _input_idx[0]; _input_idx[0] += 1
            rg_val = fmt_val(cel_rg['v'])
            out += f'<td class="regime-cell"><textarea class="area" data-i="{rg_idx}" rows="3">{e(rg_val)}</textarea></td>'
        else:
            out += render_cell(cel_rg, 'td', 'regime-cell') if cel_rg else '<td class="regime-cell"></td>'
        out += '</tr>\n'
    return out

# ── SECTION: Time distribution ────────────────────────────────────────────────
# Row55 = category names (C2..C20), Row56 = today hours (editable), Row57 = today% (formula)
# Row59 = accum hours (formula), Row60 = accum% (formula)
cat_cols = list(range(2, 21))  # C2..C20

def render_timedist():
    out = ''
    for c in cat_cols:
        cel_name = rap.get((55, c))
        if not cel_name or not cel_name['v']: continue
        name = fmt_val(cel_name['v'])
        cel_th = rap.get((56, c))
        cel_tp = rap.get((57, c))
        cel_ah = rap.get((59, c))
        cel_ap = rap.get((60, c))
        
        # Format pct values
        def pct_td(cel):
            if cel is None: return '<td class="tc pct"></td>'
            val = cel['v']
            fx = cel.get('f')
            try: pct = f'{float(val)*100:.1f}%'
            except: pct = fmt_val(val)
            if fx:
                return f'<td class="tc pct"><span class="fx-val" title="={e(str(fx))}">{e(pct)}</span></td>'
            else:
                idx = _input_idx[0]; _input_idx[0] += 1
                return f'<td class="tc pct"><input class="field" data-i="{idx}" value="{e(pct)}" style="width:70px"></td>'
        
        out += f'<tr><td class="label-cell">{e(name)}</td>'
        out += render_cell(cel_th, 'td', 'tc') if cel_th else '<td class="tc"></td>'
        out += pct_td(cel_tp)
        out += render_cell(cel_ah, 'td', 'tc') if cel_ah else '<td class="tc"></td>'
        out += pct_td(cel_ap)
        out += '</tr>\n'
    
    # Totals row56 sum + row59 sum
    cel_th_total = rap.get((56, 20))  # C20 = SUM
    cel_ah_total = rap.get((59, 20))
    def fmt_total(cel):
        if cel is None: return '<td class="tc bold"></td>'
        return render_cell(cel, 'td', 'tc bold')
    
    out += f'<tr class="subtotal"><td class="label-cell">ИТОГО</td>'
    out += fmt_total(cel_th_total)
    out += '<td></td>'
    out += fmt_total(cel_ah_total)
    out += '<td></td></tr>\n'
    return out

# ── SECTION: Bits ─────────────────────────────────────────────────────────────
def render_bits():
    out = ''
    for r in range(4, 12):
        # Check if row has data
        cel_run = knbk_grid.get((r, 3))
        cel_d   = knbk_grid.get((r, 4))
        if not cel_run and not cel_d: continue
        
        run_val = fmt_val(v(knbk_grid, r, 3))
        is_cur = run_val == '4'
        cls = ' class="row-current"' if is_cur else ''
        
        out += f'<tr{cls}>'
        for col in [3,1,2,4,5,6,7,8,10]:
            out += render_cell(knbk_grid.get((r,col)), 'td', 'tc') if knbk_grid.get((r,col)) else '<td></td>'
        # Interval from/to
        cel_fr = knbk_grid.get((r, 11))
        cel_to2 = knbk_grid.get((r, 12))
        out += render_cell(cel_fr, 'td', 'tc') if cel_fr else '<td></td>'
        out += render_cell(cel_to2, 'td', 'tc') if cel_to2 else '<td></td>'
        for col in [13,14,15,16,17,18,19,20,21,22]:
            out += render_cell(knbk_grid.get((r,col)), 'td', 'tc') if knbk_grid.get((r,col)) else '<td></td>'
        # КНБК description
        cel_desc = knbk_grid.get((r, 24))
        if cel_desc and cel_desc['v']:
            idx = _input_idx[0]; _input_idx[0] += 1
            out += f'<td class="knbk-desc"><textarea class="area" data-i="{idx}" rows="2">{e_nl(fmt_val(cel_desc["v"]))}</textarea></td>'
        else:
            out += '<td></td>'
        out += '</tr>\n'
    return out

# ── SECTION: Mud ──────────────────────────────────────────────────────────────
mud_cols_r = [3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,21]

def render_mud_row(r, row_cls):
    out = f'<tr class="{row_cls}"><td class="row-label">{row_cls.upper()}</td>'
    for c in mud_cols_r:
        out += render_cell(rap.get((r, c)), 'td', 'tc') if rap.get((r, c)) else '<td></td>'
    out += '</tr>\n'
    return out

# ── SECTION: Pumps/Shakers ────────────────────────────────────────────────────
# R71 = header row: C2=Р нас, C3=Втулки насоса, C4=Ходы насоса/мин, C5=Произв нас л/сек
# C7=Время подъема в затрубье, C8=Время полного цикла, C10=Скорость истечения из долота
# C12=Гидравлическая мощность HSI, C14=Вибросита, C15=Размер сеток, C17=Время работы
# C18=Система очистки (ВС,О,ПО,мертвые зоны), C19=Центрифуга, C21=Потери в скв, сут
# R72-R75: vibroscreens + pumps data
def render_shakers():
    out = ''
    for r in range(72, 76):
        cel_n = rap.get((r, 14))
        cel_m = rap.get((r, 15))
        cel_h = rap.get((r, 17))
        cel_sys = rap.get((r, 18))
        cel_cen = rap.get((r, 19))
        cel_lo = rap.get((r, 21))
        # Skip if all empty
        if not any([cel_n, cel_m, cel_h]): continue
        out += '<tr>'
        out += render_cell(cel_n, 'td', 'tc') if cel_n else '<td></td>'
        out += render_cell(cel_m, 'td', 'tc') if cel_m else '<td></td>'
        out += render_cell(cel_h, 'td', 'tc') if cel_h else '<td></td>'
        out += render_cell(cel_sys, 'td') if cel_sys else '<td></td>'
        out += render_cell(cel_cen, 'td', 'tc') if cel_cen else '<td></td>'
        out += render_cell(cel_lo, 'td', 'tc') if cel_lo else '<td></td>'
        out += '</tr>\n'
    return out

# Pump parameters from R71 header description - the cells R72-R75 cols 2-13
def render_pumps():
    out = ''
    # headers from R71
    header_cols = [(2,'Р нас, атм'),(3,'Втулки насоса'),(4,'Ходы нас, ход/мин'),(5,'Произв нас, л/с'),
                   (7,'Время подъема в затрубье, мин'),(8,'Время полн. цикла, мин'),
                   (10,'Скорость истеч. из долота, м/сек'),(12,'HSI, hp/in²')]
    for r in range(72, 76):
        has = any(rap.get((r, c)) for c, _ in header_cols if rap.get((r, c)))
        if not has: continue
        out += '<tr>'
        out += f'<td class="label-cell">Насос {r-71}</td>'
        for c, _ in header_cols:
            out += render_cell(rap.get((r, c)), 'td', 'tc') if rap.get((r, c)) else '<td></td>'
        out += '</tr>\n'
    return out

# ── SECTION: Inclinometry plan (R83 header, R84-R101 plan, R102 TD)────────────
def render_incl_plan():
    out = ''
    incl_grid = make_grid('Инклинометрия')
    # Plan from Рапорт R84-R101
    for r in range(84, 102):
        row_data = [rap.get((r, c)) for c in [2,3,4,5,6,7]]
        if not any(c and c['v'] is not None for c in row_data): continue
        out += '<tr>'
        for cel in row_data:
            out += render_cell(cel, 'td', 'tc') if cel else '<td></td>'
        out += '</tr>\n'
    return out

def render_incl_fact():
    out = ''
    for r in range(118, 132):
        row_data = [rap.get((r, c)) for c in [2,3,4,5,6,7]]
        if not any(c and c['v'] is not None for c in row_data): continue
        out += '<tr>'
        for cel in row_data:
            out += render_cell(cel, 'td', 'tc') if cel else '<td></td>'
        out += '</tr>\n'
    return out

# ── SECTION: MWD ─────────────────────────────────────────────────────────────
mwd_cols = [
    ('Глубина замера, м', 2), ('ГК, API', 3), ('Азимут, °', 4),
    ('TVD, м', 5), ('DLS °/10м', 6), ('Отход, м', 7),
    ('Температура, °C', 8), ('ГК 2, API', 9), ('Зен. угол, °', 10),
    ('Глубина 2, м', 11), ('Отход 2, м', 12), ('МСП, м/ч', 13),
]

def render_mwd():
    out = ''
    for label, c in mwd_cols:
        cel = rap.get((132, c))
        if not cel: continue
        out += f'<tr><td class="il">{e(label)}</td>'
        out += render_cell(cel, 'td', 'tc')
        out += '</tr>\n'
    return out

# ── SECTION: Personnel ────────────────────────────────────────────────────────
# R143: C2=role, C5=name, C7=phone/email, C9=role2, C12=name2, C16=phone2
# R144: C2=role, C5=name+phone, C9=role, C12=name+phone

def render_personnel():
    people = [
        (v(rap,143,2), v(rap,143,5), v(rap,143,7)),
        (v(rap,143,9), v(rap,143,12), v(rap,143,16)),
        (v(rap,144,2), v(rap,144,5), None),
        (v(rap,144,9), v(rap,144,12), None),
    ]
    out = ''
    for role, name, contact in people:
        if not role and not name: continue
        out += '<div class="person-card">'
        out += f'<div class="role">{e_nl(fmt_val(role))}</div>' if role else ''
        out += f'<div class="name">{e_nl(fmt_val(name))}</div>' if name else ''
        out += f'<div class="contact">{e_nl(fmt_val(contact))}</div>' if contact else ''
        out += '</div>\n'
    return out

# ────────────────────────────────────────────────────────────────────────────
# ── NEW SECTIONS FROM OTHER SHEETS ──────────────────────────────────────────

def render_graf_kpi():
    """График "Глубина-Время" — key KPI summary block."""
    items = [
        # (label, grid, row, col)
        ('Скважина №',         graf_grid, 2, 14),
        ('Забой на 24 ч, м',   graf_grid, 8, 14),
        ('Суточная проходка, м',graf_grid, 9, 14),
        ('Дата начала бурения', graf_grid, 4, 9),
        ('Плановая дата окончания', graf_grid, 5, 9),
        ('Целевая дата окончания',  graf_grid, 7, 9),
        ('Расч. дата оконч. (с учётом отставания, план)', graf_grid, 8, 9),
        ('Расч. дата оконч. (с учётом отставания, цель)', graf_grid, 9, 9),
        ('Фактическое время строительства, сут.',  graf_grid, 8, 12),
        ('Факт. время без НПВ, сут.',              graf_grid, 9, 12),
        ('Опережение/отставание от плана, сут.',   graf_grid, 4, 14),
        ('Опережение/отставание от цели, сут.',    graf_grid, 7, 14),
        ('План (Цель), сут.',    graf_grid, 4, 12),
        ('План (Договор), сут.', graf_grid, 7, 12),
    ]
    out = ''
    for label, grid, r, c in items:
        cel = grid.get((r, c))
        out += f'<tr><td class="il">{e(label)}</td>'
        out += render_cell(cel, 'td', 'iv') if cel else '<td class="iv"></td>'
        out += '</tr>\n'
    return out

def render_graf_npt():
    """НПВ по контрагентам из листа График "Глубина-Время"."""
    contractors = [
        (4,2,'НПВ — АО «АРКТИКГАЗ»'),
        (5,2,'НПВ — ООО «ЭНГС»'),
        (7,2,'НПВ — БурСервис'),
        (8,2,'НПВ — Долота'),
        (9,2,'НПВ — Цементаж'),
        (10,2,'НПВ — Растворы'),
    ]
    out = ''
    for r, c, label in contractors:
        cel = graf_grid.get((r, c))
        cel_val = graf_grid.get((r, 4))
        out += f'<tr><td class="il">{e(label)}</td>'
        out += render_cell(cel_val, 'td', 'iv') if cel_val else (
               render_cell(cel, 'td', 'iv') if cel else '<td class="iv"></td>')
        out += '</tr>\n'
    return out

# Casing dims from График
def render_graf_casings():
    out = ''
    # Row 3-8, cols 15-20: Diameter casing, depth plan, depth fact, footage plan
    headers = ['Диам. ствола, мм', 'Диам. ОК, мм', 'Глубина ОК план, м', 'Глубина ОК факт, м', 'Проходка план', 'Факт/Цель']
    col_data = [15, 16, 17, 18, 19, 20]
    for r in range(3, 9):
        row_cells = [graf_grid.get((r, c)) for c in col_data]
        if not any(cel and cel.get('v') is not None for cel in row_cells):
            continue
        out += '<tr>'
        for cel in row_cells:
            out += render_cell(cel, 'td', 'tc') if cel else '<td></td>'
        out += '</tr>\n'
    return out

# ── НПВ sheet ────────────────────────────────────────────────────────────────
def render_npv():
    """Render НПВ log from НПВ sheet."""
    out = ''
    max_r = sheets_map['НПВ']['maxRow']
    for r in range(6, max_r + 1):
        cel1  = npv_grid.get((r, 1))   # №
        cel2  = npv_grid.get((r, 2))   # Секция
        cel3  = npv_grid.get((r, 3))   # Общ НПВ ч
        cel4  = npv_grid.get((r, 4))   # Дата
        cel14 = npv_grid.get((r, 14))  # Причина
        cel15 = npv_grid.get((r, 15))  # АКТ
        cel17 = npv_grid.get((r, 17))  # Тип
        # Contractor hours (C5-C13)
        contr_cels = [npv_grid.get((r, c)) for c in range(5, 14)]
        has_data = any(cel and cel.get('v') for cel in [cel3, cel4, cel14])
        if not has_data:
            continue
        total_h = fmt_val(cel3['v'] if cel3 else None)
        if total_h in ('', '0', None) and not any(cel and cel.get('v') for cel in contr_cels):
            continue
        out += '<tr>'
        out += render_cell(cel1,  'td', 'tc mono') if cel1 else '<td></td>'
        out += render_cell(cel2,  'td', 'tc') if cel2 else '<td></td>'
        out += render_cell(cel4,  'td', 'tc mono') if cel4 else '<td></td>'
        out += render_cell(cel3,  'td', 'tc bold') if cel3 else '<td></td>'
        for cc in contr_cels:
            out += render_cell(cc, 'td', 'tc') if (cc and cc.get('v')) else '<td class="tc">—</td>'
        if cel14 and cel14['v'] and len(str(cel14['v'])) > 60:
            idx = _input_idx[0]; _input_idx[0] += 1
            out += f'<td class="oper-cell"><textarea class="area" data-i="{idx}" rows="2">{e(fmt_val(cel14["v"]))}</textarea></td>'
        else:
            out += render_cell(cel14, 'td', 'oper-cell') if cel14 else '<td></td>'
        out += render_cell(cel15, 'td', 'tc') if cel15 else '<td></td>'
        out += render_cell(cel17, 'td', 'tc') if cel17 else '<td></td>'
        out += '</tr>\n'
    return out

# ── Операции по скважине ─────────────────────────────────────────────────────
def render_ops():
    """Render all operations from Операции по скважине sheet."""
    out = ''
    max_r = sheets_map['Операции по скважине']['maxRow']
    for r in range(6, max_r + 1):
        cel_date = ops_grid.get((r, 1))
        cel_sec  = ops_grid.get((r, 2))
        cel_ph   = ops_grid.get((r, 3))
        cel_fr   = ops_grid.get((r, 4))
        cel_to   = ops_grid.get((r, 5))
        cel_dur  = ops_grid.get((r, 6))
        cel_dep  = ops_grid.get((r, 7))
        cel_prog = ops_grid.get((r, 8))
        cel_dens = ops_grid.get((r, 9))
        cel_acc  = ops_grid.get((r, 11))  # accum days
        cel_pv   = ops_grid.get((r, 22))  # ПВ/НПВ
        cel_cat  = ops_grid.get((r, 26))  # category
        cel_desc = ops_grid.get((r, 28))  # description
        cel_act  = ops_grid.get((r, 29))  # АКТ НПВ
        if not (cel_date and cel_date.get('v') or cel_desc and cel_desc.get('v')):
            continue
        pv_val = fmt_val(cel_pv['v'] if cel_pv else None)
        row_cls = ' class="npt-row"' if pv_val == 'НПВ' else ''
        out += f'<tr{row_cls}>'
        out += render_cell(cel_date, 'td', 'tc mono') if cel_date else '<td></td>'
        out += render_cell(cel_sec,  'td', 'tc') if cel_sec else '<td></td>'
        out += render_cell(cel_ph,   'td', 'tc') if cel_ph else '<td></td>'
        out += render_cell(cel_fr,   'td', 'tc mono') if cel_fr else '<td></td>'
        out += render_cell(cel_to,   'td', 'tc mono') if cel_to else '<td></td>'
        out += render_cell(cel_dur,  'td', 'tc bold') if cel_dur else '<td></td>'
        out += render_cell(cel_dep,  'td', 'tc') if cel_dep else '<td></td>'
        out += render_cell(cel_prog, 'td', 'tc') if cel_prog else '<td></td>'
        out += render_cell(cel_dens, 'td', 'tc') if cel_dens else '<td></td>'
        out += render_cell(cel_acc,  'td', 'tc') if cel_acc else '<td></td>'
        out += render_cell(cel_pv,   'td', 'tc bold') if cel_pv else '<td></td>'
        out += render_cell(cel_cat,  'td', 'tc') if cel_cat else '<td></td>'
        if cel_desc and cel_desc.get('v') and len(str(cel_desc['v'])) > 60:
            idx = _input_idx[0]; _input_idx[0] += 1
            out += f'<td class="oper-cell"><textarea class="area" data-i="{idx}" rows="2">{e(fmt_val(cel_desc["v"]))}</textarea></td>'
        else:
            out += render_cell(cel_desc, 'td', 'oper-cell') if cel_desc else '<td></td>'
        out += render_cell(cel_act, 'td', 'tc') if cel_act else '<td></td>'
        out += '</tr>\n'
    return out

# ── Баланс ───────────────────────────────────────────────────────────────────
def render_balance():
    """Render Баланс operations schedule."""
    out = ''
    max_r = sheets_map['Баланс']['maxRow']
    for r in range(13, max_r + 1):
        cel_no  = bal_grid.get((r, 1))
        cel_sec = bal_grid.get((r, 2))
        cel_ph  = bal_grid.get((r, 3))
        cel_op  = bal_grid.get((r, 4))
        cel_td  = bal_grid.get((r, 5))
        cel_goal_h = bal_grid.get((r, 6))
        cel_plan_h = bal_grid.get((r, 7))
        cel_fact_h = bal_grid.get((r, 8))
        cel_plan_dt = bal_grid.get((r, 9))
        cel_fact_dt = bal_grid.get((r, 11))
        cel_dev_h   = bal_grid.get((r, 18))   # hours deviation
        cel_dev_d   = bal_grid.get((r, 15))   # days deviation
        cel_comment = bal_grid.get((r, 17))   # краткое описание отставания
        cel_plan_acc = bal_grid.get((r, 19))  # план нарастающим
        cel_fact_acc = bal_grid.get((r, 20))  # факт нарастающим
        if not (cel_no and cel_no.get('v') is not None) and not (cel_op and cel_op.get('v')):
            continue
        # Highlight rows with deviation
        dev_v = cel_dev_h['v'] if cel_dev_h else None
        try:
            dev_f = float(str(dev_v or 0))
            row_cls = ' class="bal-behind"' if dev_f > 2 else (' class="bal-ahead"' if dev_f < -0.5 else '')
        except:
            row_cls = ''
        out += f'<tr{row_cls}>'
        out += render_cell(cel_no,  'td', 'tc mono') if cel_no else '<td></td>'
        out += render_cell(cel_sec, 'td', 'tc') if cel_sec else '<td></td>'
        out += render_cell(cel_ph,  'td', 'tc') if cel_ph else '<td></td>'
        if cel_op and cel_op.get('v') and len(str(cel_op['v'])) > 50:
            idx = _input_idx[0]; _input_idx[0] += 1
            out += f'<td class="oper-cell"><textarea class="area" data-i="{idx}" rows="2">{e(fmt_val(cel_op["v"]))}</textarea></td>'
        else:
            out += render_cell(cel_op, 'td', 'oper-cell') if cel_op else '<td></td>'
        out += render_cell(cel_td,      'td', 'tc') if cel_td else '<td></td>'
        out += render_cell(cel_goal_h,  'td', 'tc') if cel_goal_h else '<td></td>'
        out += render_cell(cel_plan_h,  'td', 'tc') if cel_plan_h else '<td></td>'
        out += render_cell(cel_fact_h,  'td', 'tc bold') if cel_fact_h else '<td></td>'
        out += render_cell(cel_plan_dt, 'td', 'tc mono') if cel_plan_dt else '<td></td>'
        out += render_cell(cel_fact_dt, 'td', 'tc mono') if cel_fact_dt else '<td></td>'
        out += render_cell(cel_dev_h,   'td', 'tc bold') if cel_dev_h else '<td></td>'
        out += render_cell(cel_dev_d,   'td', 'tc') if cel_dev_d else '<td></td>'
        out += render_cell(cel_plan_acc,'td', 'tc') if cel_plan_acc else '<td></td>'
        out += render_cell(cel_fact_acc,'td', 'tc bold') if cel_fact_acc else '<td></td>'
        if cel_comment and cel_comment.get('v'):
            idx = _input_idx[0]; _input_idx[0] += 1
            out += f'<td class="oper-cell"><textarea class="area" data-i="{idx}" rows="1">{e(fmt_val(cel_comment["v"]))}</textarea></td>'
        else:
            out += '<td></td>'
        out += '</tr>\n'
    return out

# ── Время (daily time tracker) ───────────────────────────────────────────────
TIME_CATS = [
    (4,'Бурение'),(5,'Наращивание'),(6,'Подъём КНБК'),(7,'Спуск КНБК'),
    (8,'Сборка/разборка КНБК'),(9,'Промывка'),(10,'ГФР'),(11,'Шаблонировка'),
    (12,'Спуск ОК'),(13,'Цементирование'),(14,'ОЗЦ'),(15,'ТО'),
    (16,'ПВО'),(17,'ПЗР'),(18,'Замеры ТС'),(19,'Другое'),
    (20,'Простой/инциденты'),(21,'Ремонты'),
]

def render_time_table():
    out = ''
    max_r = sheets_map['Время']['maxRow']
    for r in range(2, max_r + 1):
        cel_date = time_grid.get((r, 1))
        cel_no   = time_grid.get((r, 2))
        cel_dep  = time_grid.get((r, 3))
        if not (cel_date and cel_date.get('v')):
            continue
        cel_prog = time_grid.get((r, 22))
        cel_tot  = time_grid.get((r, 23))
        cel_pv   = time_grid.get((r, 34))  # prod time h
        cel_npv  = time_grid.get((r, 35))  # NPT h
        cel_desc = time_grid.get((r, 24))  # NPT description

        out += '<tr>'
        out += render_cell(cel_date, 'td', 'tc mono') if cel_date else '<td></td>'
        out += render_cell(cel_no,   'td', 'tc bold') if cel_no else '<td></td>'
        out += render_cell(cel_dep,  'td', 'tc') if cel_dep else '<td></td>'
        out += render_cell(cel_prog, 'td', 'tc bold') if cel_prog else '<td></td>'
        for col, _ in TIME_CATS:
            cel = time_grid.get((r, col))
            if cel and cel.get('v'):
                out += render_cell(cel, 'td', 'tc num')
            else:
                out += '<td class="tc num">—</td>'
        out += render_cell(cel_tot, 'td', 'tc bold') if cel_tot else '<td></td>'
        out += render_cell(cel_pv,  'td', 'tc') if cel_pv else '<td></td>'
        out += render_cell(cel_npv, 'td', 'tc warn-cell') if cel_npv else '<td></td>'
        if cel_desc and cel_desc.get('v'):
            idx = _input_idx[0]; _input_idx[0] += 1
            out += f'<td class="oper-cell"><textarea class="area" data-i="{idx}" rows="2">{e(fmt_val(cel_desc["v"]))}</textarea></td>'
        else:
            out += '<td class="oper-cell"></td>'
        out += '</tr>\n'
    return out

# ── Извлечённые уроки ────────────────────────────────────────────────────────
def render_lessons():
    out = ''
    max_r = sheets_map['Извлеченные уроки']['maxRow']
    for r in range(3, max_r + 1):
        cel_date = lessons_grid.get((r, 2))
        cel_well = lessons_grid.get((r, 5))
        cel_sec  = lessons_grid.get((r, 8))
        cel_op   = lessons_grid.get((r, 9))
        cel_desc = lessons_grid.get((r, 10))
        cel_act  = lessons_grid.get((r, 11))
        cel_les  = lessons_grid.get((r, 12))
        cel_stat = lessons_grid.get((r, 13))
        cel_resp = lessons_grid.get((r, 14))
        if not (cel_date and cel_date.get('v')):
            continue
        out += '<tr>'
        out += render_cell(cel_date, 'td', 'tc mono') if cel_date else '<td></td>'
        out += render_cell(cel_well, 'td', 'tc') if cel_well else '<td></td>'
        out += render_cell(cel_sec,  'td', 'tc') if cel_sec else '<td></td>'
        out += render_cell(cel_op,   'td', 'tc') if cel_op else '<td></td>'
        for cel in [cel_desc, cel_act, cel_les]:
            if cel and cel.get('v') and len(str(cel['v'])) > 40:
                idx = _input_idx[0]; _input_idx[0] += 1
                out += f'<td class="oper-cell"><textarea class="area" data-i="{idx}" rows="2">{e(fmt_val(cel["v"]))}</textarea></td>'
            else:
                out += render_cell(cel, 'td', 'oper-cell') if cel else '<td></td>'
        out += render_cell(cel_stat, 'td', 'tc') if cel_stat else '<td></td>'
        if cel_resp and cel_resp.get('v') and len(str(cel_resp['v'])) > 30:
            idx = _input_idx[0]; _input_idx[0] += 1
            out += f'<td class="oper-cell"><textarea class="area" data-i="{idx}" rows="2">{e(fmt_val(cel_resp["v"]))}</textarea></td>'
        else:
            out += render_cell(cel_resp, 'td', 'oper-cell') if cel_resp else '<td></td>'
        out += '</tr>\n'
    return out

# ── PBI KPIs ─────────────────────────────────────────────────────────────────
PBI_COLS = [
    (1,'Проект'),(2,'Куст'),(3,'Скважина'),
    (4,'План, сут'),(5,'Факт. время строительства, сут'),(6,'НПВ, сут'),
    (7,'Забой, м'),(8,'Опережение / отставание, сут'),(9,'НПВ, %'),
    (10,'Время строительства, мес'),(11,'КС факт'),(12,'КС план'),
    (13,'DDI план'),(14,'DDI факт'),(15,'Извилистость, °/10м'),
    (16,'ERD план'),(17,'ERD факт'),
]
def render_pbi():
    out = ''
    for col, label in PBI_COLS:
        cel = pbi_grid.get((2, col))
        if not cel: continue
        out += f'<tr><td class="il">{e(label)}</td>'
        out += render_cell(cel, 'td', 'iv')
        out += '</tr>\n'
    return out

# ────────────────────────────────────────────────────────────────────────────
# Pull quick display values for badges
depth_end   = fmt_val(v(rap, 14, 11))
daily_prog  = fmt_val(v(rap, 15, 11))
npv_acc_raw = v(rap, 11, 11)
npv_acc     = fmt_val(npv_acc_raw) if npv_acc_raw else ''
sched_lag_raw = v(rap, 17, 11)
sched_lag   = fmt_val(sched_lag_raw) if sched_lag_raw else '0'
try:
    lag_f = float(str(sched_lag_raw or 0))
    lag_class = 'danger' if lag_f < 0 else 'ok'
    lag_arrow = '▼' if lag_f < 0 else '▲'
except:
    lag_class = 'warn'; lag_arrow = '—'
report_date = fmt_val(v(rap, 6, 11))
well        = fmt_val(v(rap, 7, 5))
cluster     = fmt_val(v(rap, 5, 9))
field       = fmt_val(v(rap, 5, 16))
report_no   = fmt_val(v(rap, 7, 11))

# ────────────────────────────────────────────────────────────────────────────
# HTML
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
*,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}
:root{{
  --bg0:#071018;--bg1:#0d1b2a;--bg2:#0f2237;
  --accent:#0ab4c7;--accent2:#1e90c4;--gold:#e2ac55;--danger:#e05050;--ok:#4caf7d;--warn:#f0a030;
  --panel:rgba(255,255,255,0.97);--panel-hdr:#162d42;
  --border:#d0dce8;--border2:#b0c4d8;
  --text:#0d1b2a;--text2:#3a5068;--text3:#6b8094;
  --mono:'Courier New',monospace;
  --fx-bg:#eef7eb;--fx-border:#a8d8a8;
}}
html{{font-size:13px;scroll-behavior:smooth}}
body{{background:var(--bg0);color:var(--text);font-family:'Manrope',sans-serif;min-height:100vh}}

/* TOP BAR */
.topbar{{background:linear-gradient(135deg,#071018 0%,#0d2035 60%,#0a2a40 100%);border-bottom:2px solid var(--accent);padding:10px 20px;display:flex;align-items:center;gap:14px;position:sticky;top:0;z-index:100;flex-wrap:wrap}}
.topbar-logo{{font-family:'Oswald',sans-serif;font-size:1.05rem;font-weight:600;color:#fff;white-space:nowrap}}
.topbar-meta{{flex:1;display:flex;gap:8px;flex-wrap:wrap;align-items:center}}
.badge{{background:rgba(10,180,199,.15);border:1px solid rgba(10,180,199,.3);border-radius:5px;padding:3px 9px;font-size:.72rem;color:#8de4ef;font-weight:600;white-space:nowrap}}
.badge.warn{{background:rgba(240,160,48,.15);border-color:rgba(240,160,48,.35);color:#f5c070}}
.badge.danger{{background:rgba(224,80,80,.15);border-color:rgba(224,80,80,.35);color:#f09090}}
.badge.ok{{background:rgba(76,175,125,.15);border-color:rgba(76,175,125,.35);color:#80dfb0}}
.topbar-actions{{display:flex;gap:8px;align-items:center}}
.btn{{display:inline-flex;align-items:center;gap:5px;padding:6px 13px;border-radius:6px;font-size:.78rem;font-weight:600;cursor:pointer;border:none;text-decoration:none;white-space:nowrap}}
.btn-save{{background:linear-gradient(135deg,#0ab4c7,#1e75c4);color:#fff}}
.btn-print{{background:rgba(255,255,255,.1);color:#b0d4e8;border:1px solid rgba(255,255,255,.15)}}
.save-state{{font-size:.7rem;color:#6b9aaf}}

/* LAYOUT */
.wrap{{max-width:1700px;margin:0 auto;padding:16px 14px 40px}}
.section{{background:var(--panel);border-radius:10px;box-shadow:0 2px 16px rgba(0,0,0,.14);margin-bottom:16px;overflow:hidden}}
.section-head{{background:var(--panel-hdr);color:#fff;padding:9px 16px;display:flex;align-items:center;gap:10px;font-family:'Oswald',sans-serif;font-size:.92rem;font-weight:500;letter-spacing:.4px}}
.section-body{{padding:14px 16px}}

/* SEC NAV */
.sec-nav{{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}}
.sec-nav a{{background:rgba(10,180,199,.1);border:1px solid rgba(10,180,199,.25);border-radius:4px;padding:3px 10px;font-size:.7rem;color:#3ab8c8;font-weight:600;text-decoration:none;white-space:nowrap}}
.sec-nav a:hover{{background:rgba(10,180,199,.2)}}

/* INFO TABLE */
.info-tbl{{width:100%;border-collapse:collapse}}
.info-tbl .il{{color:var(--text2);font-size:.78rem;padding:4px 8px;white-space:nowrap;width:240px;border-bottom:1px solid var(--border)}}
.info-tbl .iv{{font-weight:600;font-size:.84rem;padding:4px 8px;border-bottom:1px solid var(--border)}}
.info-split{{display:grid;grid-template-columns:1fr 1fr;gap:24px}}

/* DATA TABLES */
.dtbl{{width:100%;border-collapse:collapse;font-size:.79rem}}
.dtbl th{{background:#162d42;color:#8de4ef;padding:5px 7px;text-align:center;font-family:'Oswald',sans-serif;font-weight:500;white-space:nowrap}}
.dtbl td{{padding:4px 6px;border-bottom:1px solid #e4edf5;vertical-align:middle}}
.dtbl tr:hover td{{background:#f5faff}}
.dtbl .tc{{text-align:center}}
.dtbl .bold{{font-weight:700}}
.dtbl .mono{{font-family:var(--mono);font-size:.75rem}}
.dtbl .label-cell{{font-weight:600;color:#1a3050;background:#f0f5fa;white-space:nowrap;padding:5px 10px}}
.dtbl .il{{color:var(--text2);font-size:.77rem;padding:4px 8px;border-bottom:1px solid var(--border);white-space:nowrap;width:220px}}
.dtbl .iv{{font-size:.82rem;padding:4px 8px;border-bottom:1px solid var(--border)}}
.dtbl .oper-cell{{min-width:200px;max-width:340px;font-size:.77rem;line-height:1.4}}
.dtbl .el-cell{{min-width:160px;font-size:.77rem}}
.dtbl .regime-cell{{min-width:200px;font-size:.76rem;color:#2a4060}}
.dtbl .pct{{color:var(--text2);font-size:.75rem}}
.dtbl .row-current{{background:#eff9f0}}
.dtbl .row-current td{{font-weight:600}}
.dtbl tr.subtotal{{background:#e8f0f8}}
.dtbl tr.subtotal td{{font-weight:700;border-top:2px solid var(--border2)}}
.dtbl .row-label{{font-weight:700;background:#e8f0f8 !important;text-align:left;padding:5px 10px;white-space:nowrap}}
.dtbl .fx-center{{text-align:center}}
.dtbl .knbk-desc{{min-width:180px;font-size:.74rem}}

/* INPUTS */
input.field{{border:1px solid #c5d8ea;border-radius:4px;padding:3px 6px;font-size:.79rem;font-family:'Manrope',sans-serif;color:var(--text);background:#fff;width:100%;min-width:60px}}
input.field:focus{{outline:none;border-color:var(--accent);background:#f0fafd}}
textarea.area{{border:1px solid #c5d8ea;border-radius:4px;padding:4px 7px;font-size:.78rem;font-family:'Manrope',sans-serif;color:var(--text);background:#fff;width:100%;resize:vertical}}
textarea.area:focus{{outline:none;border-color:var(--accent)}}

/* FORMULA CELLS */
.fx-val{{background:var(--fx-bg);border:1px solid var(--fx-border);border-radius:3px;padding:2px 6px;font-size:.78rem;color:#2a6020;font-family:var(--mono);cursor:help;display:inline-block}}
.fx-val::before{{content:'=';font-size:.65rem;color:#6aaa55;margin-right:2px}}

/* MUD TABLE */
.mud-wrap{{overflow-x:auto}}
.mud-tbl{{border-collapse:collapse;font-size:.77rem;min-width:1100px;width:100%}}
.mud-tbl th{{background:#162d42;color:#8de4ef;padding:5px 7px;text-align:center;font-family:'Oswald',sans-serif;font-weight:500;white-space:nowrap}}
.mud-tbl td{{padding:5px 7px;border:1px solid var(--border);text-align:center}}
.mud-tbl .plan-row td{{background:#f0f7ff}}
.mud-tbl .fact-row td{{background:#eff9f2;font-weight:600}}
.mud-tbl .row-label{{font-weight:700;text-align:left;background:#e4eef8 !important;white-space:nowrap}}

/* PERSON */
.person-grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}}
.person-card{{background:#f4f8fc;border:1px solid var(--border);border-radius:8px;padding:11px 14px}}
.person-card .role{{font-size:.7rem;color:var(--text2);font-weight:600;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}}
.person-card .name{{font-weight:700;font-size:.86rem;margin-bottom:3px}}
.person-card .contact{{font-size:.77rem;color:var(--accent2)}}

/* COMMENT */
.comment-grid{{display:grid;grid-template-columns:1fr 1fr;gap:12px}}
.comment-block label{{display:block;font-size:.77rem;font-weight:600;color:var(--text2);margin-bottom:4px}}
.comment-block textarea{{width:100%;min-height:75px;border:1px solid var(--border);border-radius:6px;padding:7px;font-family:'Manrope',sans-serif;font-size:.8rem;color:var(--text);resize:vertical}}
.comment-block textarea:focus{{outline:none;border-color:var(--accent)}}
.comment-block.full{{grid-column:1/-1}}

/* MISC */
.two-col{{display:grid;grid-template-columns:1fr 1fr;gap:16px}}
.scroll-x{{overflow-x:auto}}
.sec-title{{font-size:.78rem;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px}}

.dtbl .num{{text-align:right;font-family:var(--mono);font-size:.75rem}}
.dtbl .warn-cell{{color:var(--danger);font-weight:700;text-align:center}}
.dtbl .npt-row td{{background:#fff8f0}}
.dtbl .bal-behind td{{background:#fff3f3}}
.dtbl .bal-ahead td{{background:#f0fff4}}
.pbi-card{{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:0}}

@media print{{
  body{{background:#fff}}
  .topbar{{position:relative;background:#162d42;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .section{{box-shadow:none;border:1px solid #ccc;break-inside:avoid}}
  .btn-save,.btn-print,.save-state,.sec-nav{{display:none}}
}}
</style>
</head>
<body>

<header class="topbar">
  <div class="topbar-logo">DDR · {e(well)}</div>
  <div class="topbar-meta">
    <span class="badge">Скв. {e(well)} · Куст {e(cluster)}</span>
    <span class="badge">{e(field)}</span>
    <span class="badge warn">Рапорт №{e(report_no)} · {e(report_date)}</span>
    <span class="badge {lag_class}">{lag_arrow} {e(sched_lag)} сут. от графика</span>
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
<nav class="sec-nav">
  <a href="#s-info">Общая информация</a>
  <a href="#s-const">Конструкция</a>
  <a href="#s-timelog">Журнал операций</a>
  <a href="#s-status">Состояние на 6:00</a>
  <a href="#s-timedist">Распределение времени</a>
  <a href="#s-bits">Долота / КНБК</a>
  <a href="#s-mud">Буровой раствор</a>
  <a href="#s-pumps">Насосы / вибросита</a>
  <a href="#s-incl">Инклинометрия</a>
  <a href="#s-mwd">ГТД / MWD</a>
  <a href="#s-comments">Комментарии</a>
  <a href="#s-people">Персонал</a>
  <a href="#s-pbi">KPI проекта</a>
  <a href="#s-graf">График Гл-Время</a>
  <a href="#s-npv">НПВ</a>
  <a href="#s-ops">Операции (все)</a>
  <a href="#s-balance">Баланс (сетевой график)</a>
  <a href="#s-time">Время нарастающим</a>
  <a href="#s-lessons">Извлечённые уроки</a>
</nav>

<!-- 1. ОБЩАЯ ИНФОРМАЦИЯ -->
<section class="section" id="s-info">
  <div class="section-head">📋 ОБЩАЯ ИНФОРМАЦИЯ О СКВАЖИНЕ</div>
  <div class="section-body">
    <div class="info-split">
      <div>
        <table class="dtbl info-tbl">
          <colgroup><col style="width:240px"><col></colgroup>
          {render_info_rows(info_left)}
        </table>
      </div>
      <div>
        <table class="dtbl info-tbl">
          <colgroup><col style="width:280px"><col></colgroup>
          {render_info_rows(info_right)}
        </table>
      </div>
    </div>
  </div>
</section>

<!-- 2. КОНСТРУКЦИЯ -->
<section class="section" id="s-const">
  <div class="section-head">🏗 КОНСТРУКЦИЯ СКВАЖИНЫ</div>
  <div class="section-body scroll-x">
    <table class="dtbl">
      <thead>
        <tr>
          <th style="text-align:left">Колонна</th>
          <th>Глубина проект, м</th>
          <th>Глубина факт, м</th>
          <th>Дата цементажа</th>
        </tr>
      </thead>
      <tbody>{render_casing()}</tbody>
    </table>
  </div>
</section>

<!-- 3. ЖУРНАЛ ОПЕРАЦИЙ + КНБК -->
<section class="section" id="s-timelog">
  <div class="section-head">⏱ ЖУРНАЛ ОПЕРАЦИЙ ЗА СУТКИ · 20.04.2026</div>
  <div class="section-body scroll-x">
    <table class="dtbl">
      <thead>
        <tr>
          <th rowspan="2">От</th>
          <th rowspan="2">До</th>
          <th rowspan="2">Часы</th>
          <th rowspan="2" style="min-width:200px">Описание операции</th>
          <th colspan="5" style="background:#1a3d58">Элементы КНБК №4</th>
        </tr>
        <tr>
          <th style="min-width:150px;background:#1a3d58">Наименование</th>
          <th style="background:#1a3d58">Нар. мм</th>
          <th style="background:#1a3d58">Внутр. мм</th>
          <th style="background:#1a3d58">Длина, м</th>
          <th style="background:#1a3d58">Σ Длина, м</th>
        </tr>
      </thead>
      <tbody>{render_timelog()}</tbody>
    </table>
  </div>
</section>

<!-- 4. СОСТОЯНИЕ НА 6:00 -->
<section class="section" id="s-status">
  <div class="section-head">🕕 СОСТОЯНИЕ НА 6:00 · ПЛАН НА СЛЕДУЮЩИЕ СУТКИ</div>
  <div class="section-body scroll-x">
    <table class="dtbl">
      <thead>
        <tr>
          <th>От</th>
          <th>До</th>
          <th>Часы</th>
          <th style="min-width:260px">Описание операции / параметры</th>
          <th style="min-width:250px">Режим бурения</th>
        </tr>
      </thead>
      <tbody>{render_status()}</tbody>
    </table>
  </div>
</section>

<!-- 5. РАСПРЕДЕЛЕНИЕ ВРЕМЕНИ -->
<section class="section" id="s-timedist">
  <div class="section-head">📊 РАСПРЕДЕЛЕНИЕ ОПЕРАЦИОННОГО ВРЕМЕНИ</div>
  <div class="section-body scroll-x">
    <div style="font-size:.74rem;color:var(--text2);margin-bottom:8px">
      <span class="fx-val" style="font-size:.72rem">Ячейки с зелёным фоном — расчётные формулы (только просмотр)</span>
      &nbsp;&nbsp; Белые ячейки — редактируемые
    </div>
    <table class="dtbl">
      <thead>
        <tr>
          <th style="text-align:left;min-width:180px">Категория операций</th>
          <th>Сутки, ч</th>
          <th>Сутки, %</th>
          <th>Нараст. итог, ч</th>
          <th>Нараст. итог, %</th>
        </tr>
      </thead>
      <tbody>{render_timedist()}</tbody>
    </table>
  </div>
</section>

<!-- 6. ДОЛОТА / КНБК -->
<section class="section" id="s-bits">
  <div class="section-head">⚙️ ИСТОРИЯ РЕЙСОВ ДОЛОТА / КНБК</div>
  <div class="section-body scroll-x">
    <table class="dtbl">
      <thead>
        <tr>
          <th>№ рейса</th>
          <th>Дата спуска</th>
          <th>Дата подъёма</th>
          <th>Диам., мм</th>
          <th>Модель</th>
          <th>Серийный №</th>
          <th>Насадки</th>
          <th>TFA</th>
          <th>ВЗД/РУС</th>
          <th>Инт. от, м</th>
          <th>Инт. до, м</th>
          <th>Проходка, м</th>
          <th>Вр. цирк., ч</th>
          <th>Вр. бур., ч</th>
          <th>МСП пл.</th>
          <th>МСП факт</th>
          <th>Q, л/с</th>
          <th>G, тн</th>
          <th>N, об/мин</th>
          <th>T, кН·м</th>
          <th>Код износа IADC</th>
          <th style="min-width:200px">Состав КНБК</th>
        </tr>
      </thead>
      <tbody>{render_bits()}</tbody>
    </table>
  </div>
</section>

<!-- 7. БУРОВОЙ РАСТВОР -->
<section class="section" id="s-mud">
  <div class="section-head">🧪 ПАРАМЕТРЫ БУРОВОГО РАСТВОРА</div>
  <div class="section-body">
    <div class="mud-wrap">
      <table class="mud-tbl">
        <thead>
          <tr>
            <th>Тип</th>
            <th>ρ, г/см³</th>
            <th>УВ, сек/кв</th>
            <th>ПВ, сП</th>
            <th>ДНС</th>
            <th>СНС 10с/10мин</th>
            <th>R6/3</th>
            <th>Водоотд. LTLP</th>
            <th>Хлориды мг/мл</th>
            <th>Песок %</th>
            <th>ЭС, В</th>
            <th>OWR %</th>
            <th>Изв. кг/м³</th>
            <th>Корка, мм</th>
            <th>СаСО₃ кг/м³</th>
            <th>рН</th>
            <th>В скважине м³</th>
            <th>В ёмкостях м³</th>
            <th>Всего м³</th>
          </tr>
        </thead>
        <tbody>
          {render_mud_row(69, 'plan')}
          {render_mud_row(70, 'fact')}
        </tbody>
      </table>
    </div>
    <div style="margin-top:8px;font-size:.77rem;color:var(--text2)">
      Тип раствора ПЛАН: <strong>{e(fmt_val(v(rap, 69, 2)))}</strong> &nbsp;&nbsp;
      ФАКТ: <strong>{e(fmt_val(v(rap, 70, 2)))}</strong>
    </div>
  </div>
</section>

<!-- 8. НАСОСЫ И ВИБРОСИТА -->
<section class="section" id="s-pumps">
  <div class="section-head">🔧 НАСОСЫ · ВИБРОСИТА · УЧЁТ ШЛАМА</div>
  <div class="section-body">
    <div class="two-col">
      <div>
        <div class="sec-title">Вибросита</div>
        <table class="dtbl">
          <thead>
            <tr>
              <th>Вибросито №</th>
              <th>Сетки (API)</th>
              <th>Часы работы</th>
              <th>Система очистки</th>
              <th>Центрифуга</th>
              <th>Потери в скв, сут</th>
            </tr>
          </thead>
          <tbody>{render_shakers()}</tbody>
        </table>
        <div style="margin-top:12px">
          <div class="sec-title">Насосы</div>
          <table class="dtbl">
            <thead>
              <tr>
                <th></th>
                <th>Р нас, атм</th>
                <th>Втулки насоса</th>
                <th>Ходы нас, х/мин</th>
                <th>Произв нас, л/с</th>
                <th>Вр. подъёма в затрубье, мин</th>
                <th>Вр. полн. цикла, мин</th>
                <th>Скор. истеч., м/с</th>
                <th>HSI, hp/in²</th>
              </tr>
            </thead>
            <tbody>{render_pumps()}</tbody>
          </table>
        </div>
      </div>
      <div>
        <div class="sec-title">Учёт шлама</div>
        <table class="dtbl">
          <thead>
            <tr>
              <th style="text-align:left">Параметр</th>
              <th>За сутки (шт/м³)</th>
              <th>С начала месяца (шт/м³)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="label-cell">Набрано (день / ночь)</td>
              <td>{td_ed(None)}</td>
              <td>{td_ed(None)}</td>
            </tr>
            <tr>
              <td class="label-cell">Вывезено (шт)</td>
              <td>{td_ed(None)}</td>
              <td>{td_ed(None)}</td>
            </tr>
            <tr>
              <td class="label-cell">Вывезено (м³)</td>
              <td>{td_ed(None)}</td>
              <td>{td_ed(None)}</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:8px;font-size:.8rem">
          <label style="display:flex;align-items:center;gap:7px;cursor:pointer">
            <input type="checkbox" class="field cb"> Состояние ОТТВИОС в норме, происшествий нет
          </label>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 9. ИНКЛИНОМЕТРИЯ -->
<section class="section" id="s-incl">
  <div class="section-head">📐 ИНКЛИНОМЕТРИЯ · ПЛАН И ФАКТ</div>
  <div class="section-body">
    <div class="two-col">
      <div class="scroll-x">
        <div class="sec-title">Инклинометрия факт</div>
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
          <tbody>{render_incl_fact()}</tbody>
        </table>
      </div>
      <div>
        <div class="sec-title">Плановая проектная точка (TD)</div>
        <table class="dtbl">
          <thead>
            <tr><th>Параметр</th><th>Значение</th></tr>
          </thead>
          <tbody>
            <tr><td class="il">Глубина план, м</td>{render_rap(102,2,'td','tc')}</tr>
            <tr><td class="il">Зен. угол план, °</td>{render_rap(102,3,'td','tc')}</tr>
            <tr><td class="il">Азимут план, °</td>{render_rap(102,4,'td','tc')}</tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>

<!-- 10. ГТД / MWD -->
<section class="section" id="s-mwd">
  <div class="section-head">📡 ПАРАМЕТРЫ ГТД / MWD (последний замер)</div>
  <div class="section-body">
    <table class="dtbl" style="max-width:600px">
      <colgroup><col style="width:260px"><col></colgroup>
      <thead><tr><th style="text-align:left">Параметр</th><th>Значение</th></tr></thead>
      <tbody>{render_mwd()}</tbody>
    </table>
  </div>
</section>

<!-- 11. КОММЕНТАРИИ -->
<section class="section" id="s-comments">
  <div class="section-head">💬 ТЕХНИКА · КОММЕНТАРИИ СПЕЦИАЛИСТОВ</div>
  <div class="section-body">
    <div class="comment-grid">
      <div class="comment-block">
        <label>{e(fmt_val(v(rap, 137, 2)))}</label>
        <textarea class="area" rows="4"></textarea>
      </div>
      <div class="comment-block">
        <label>{e(fmt_val(v(rap, 138, 2)))}</label>
        <textarea class="area" rows="4"></textarea>
      </div>
      <div class="comment-block">
        <label>{e(fmt_val(v(rap, 139, 2)))}</label>
        <textarea class="area" rows="4"></textarea>
      </div>
      <div class="comment-block">
        <label>{e(fmt_val(v(rap, 140, 2)))} / {e(fmt_val(v(rap, 140, 4)))}</label>
        <textarea class="area" rows="4"></textarea>
      </div>
      <div class="comment-block">
        <label>{e(fmt_val(v(rap, 141, 4)))} — {e(fmt_val(v(rap, 141, 5)))}</label>
        <textarea class="area" rows="4"></textarea>
      </div>
      <div class="comment-block">
        <label>{e(fmt_val(v(rap, 142, 4)))}</label>
        <textarea class="area" rows="4"></textarea>
      </div>
    </div>
  </div>
</section>

<!-- 12. ПЕРСОНАЛ -->
<section class="section" id="s-people">
  <div class="section-head">👷 ПЕРСОНАЛ · КОНТАКТЫ</div>
  <div class="section-body">
    <div class="person-grid">
      {render_personnel()}
    </div>
  </div>
</section>

<!-- 13. KPI ПРОЕКТА (PBI-таблица) -->
<section class="section" id="s-pbi">
  <div class="section-head">📊 KPI ПРОЕКТА</div>
  <div class="section-body">
    <table class="dtbl info-tbl" style="max-width:620px">
      <colgroup><col style="width:300px"><col></colgroup>
      <thead><tr><th style="text-align:left">Показатель</th><th>Значение</th></tr></thead>
      <tbody>{render_pbi()}</tbody>
    </table>
  </div>
</section>

<!-- 14. ГРАФИК "ГЛУБИНА-ВРЕМЯ" -->
<section class="section" id="s-graf">
  <div class="section-head">📈 ГРАФИК «ГЛУБИНА-ВРЕМЯ» · КЛЮЧЕВЫЕ ПАРАМЕТРЫ</div>
  <div class="section-body">
    <div class="two-col">
      <div>
        <div class="sec-title">Сроки и прогресс</div>
        <table class="dtbl info-tbl">
          <colgroup><col style="width:280px"><col></colgroup>
          <tbody>{render_graf_kpi()}</tbody>
        </table>
      </div>
      <div>
        <div class="sec-title">НПВ по контрагентам (ч)</div>
        <table class="dtbl info-tbl">
          <colgroup><col style="width:280px"><col></colgroup>
          <tbody>{render_graf_npt()}</tbody>
        </table>
        <div style="margin-top:14px">
          <div class="sec-title">Секции — диаметры и глубины</div>
          <table class="dtbl">
            <thead><tr>
              <th>Диам. ствола, мм</th>
              <th>Диам. ОК, мм</th>
              <th>Глубина ОК план, м</th>
              <th>Глубина ОК факт, м</th>
              <th>Проходка план</th>
              <th>Факт/Цель</th>
            </tr></thead>
            <tbody>{render_graf_casings()}</tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 15. НПВ -->
<section class="section" id="s-npv">
  <div class="section-head">⚠️ ЖУРНАЛ НПВ (НЕПРОИЗВОДИТЕЛЬНОЕ ВРЕМЯ)</div>
  <div class="section-body scroll-x">
    <table class="dtbl">
      <thead>
        <tr>
          <th>№</th>
          <th>Секция</th>
          <th>Дата</th>
          <th>Общ. НПВ, ч</th>
          <th>АРКТИКГАЗ</th>
          <th>ЭНГС</th>
          <th>БурСервис РМ</th>
          <th>БурСервис Р-ры</th>
          <th>БурСервис Цем</th>
          <th>БурСервис ННБ</th>
          <th>БурСервис Долота</th>
          <th>ГИС/ГФР</th>
          <th>Превышение норм</th>
          <th style="min-width:220px">Причина</th>
          <th>АКТ</th>
          <th>Тип НПВ</th>
        </tr>
      </thead>
      <tbody>{render_npv()}</tbody>
    </table>
  </div>
</section>

<!-- 16. ОПЕРАЦИИ ПО СКВАЖИНЕ -->
<section class="section" id="s-ops">
  <div class="section-head">📋 ОПЕРАЦИИ ПО СКВАЖИНЕ (ДЕТАЛЬНЫЙ ЖУРНАл)</div>
  <div class="section-body scroll-x">
    <table class="dtbl">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Секция</th>
          <th>Фаза</th>
          <th>Начало</th>
          <th>Окончание</th>
          <th>Продолж., ч</th>
          <th>Забой, м</th>
          <th>Проходка, м</th>
          <th>ρ р-ра</th>
          <th>Накоп. сут.</th>
          <th>ПВ/НПВ</th>
          <th>Категория</th>
          <th style="min-width:260px">Описание операции</th>
          <th>АКТ НПВ</th>
        </tr>
      </thead>
      <tbody>{render_ops()}</tbody>
    </table>
  </div>
</section>

<!-- 17. БАЛАНС (СЕТЕВОЙ ГРАФИК) -->
<section class="section" id="s-balance">
  <div class="section-head">🗓 БАЛАНС — ПЛАНОВЫЙ СЕТЕВОЙ ГРАФИК «ГЛУБИНА-ДЕНЬ»</div>
  <div class="section-body scroll-x">
    <table class="dtbl">
      <thead>
        <tr>
          <th>№</th>
          <th>Секция</th>
          <th>Фаза</th>
          <th style="min-width:200px">Операция</th>
          <th>Забой, м</th>
          <th>Цель, ч</th>
          <th>План, ч</th>
          <th>Факт, ч</th>
          <th>Дата оконч. план</th>
          <th>Дата оконч. факт</th>
          <th>Откл. план, ч</th>
          <th>Откл. план, сут</th>
          <th>План нараст., сут</th>
          <th>Факт нараст., сут</th>
          <th style="min-width:160px">Комментарий</th>
        </tr>
      </thead>
      <tbody>{render_balance()}</tbody>
    </table>
  </div>
</section>

<!-- 18. ВРЕМЯ НАРАСТАЮЩИМ ИТОГОМ -->
<section class="section" id="s-time">
  <div class="section-head">⏰ ВРЕМЯ НАРАСТАЮЩИМ ИТОГОМ (ЛИСТ «ВРЕМЯ»)</div>
  <div class="section-body scroll-x">
    <table class="dtbl">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Рапорт №</th>
          <th>Забой, м</th>
          <th>Проходка, м</th>
          <th>Бурение</th>
          <th>Наращ.</th>
          <th>Подъём</th>
          <th>Спуск</th>
          <th>Сборка КНБК</th>
          <th>Промывка</th>
          <th>ГФР</th>
          <th>Шаблон.</th>
          <th>Спуск ОК</th>
          <th>Цемент.</th>
          <th>ОЗЦ</th>
          <th>ТО</th>
          <th>ПВО</th>
          <th>ПЗР</th>
          <th>Замеры</th>
          <th>Другое</th>
          <th>Простой</th>
          <th>Ремонты</th>
          <th>ИТОГО, ч</th>
          <th>ПВ, ч</th>
          <th>НПВ, ч</th>
          <th style="min-width:200px">Краткое описание НПВ</th>
        </tr>
      </thead>
      <tbody>{render_time_table()}</tbody>
    </table>
  </div>
</section>

<!-- 19. ИЗВЛЕЧЁННЫЕ УРОКИ -->
<section class="section" id="s-lessons">
  <div class="section-head">🎓 ИЗВЛЕЧЁННЫЕ УРОКИ / РЕКОМЕНДАЦИИ</div>
  <div class="section-body scroll-x">
    <table class="dtbl">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Скважина</th>
          <th>Секция</th>
          <th>Операция</th>
          <th style="min-width:200px">Описание</th>
          <th style="min-width:180px">Принятые действия</th>
          <th style="min-width:180px">Извлечённый урок</th>
          <th>Статус</th>
          <th style="min-width:140px">Ответственные</th>
        </tr>
      </thead>
      <tbody>{render_lessons()}</tbody>
    </table>
  </div>
</section>

</main>

<script>
const STORAGE_KEY = 'ddr-139-v3';

function saveState() {{
  const data = {{}};
  document.querySelectorAll('input.field[type=text], textarea.area').forEach(el => {{
    const i = el.dataset.i;
    if (i !== undefined) data['f_'+i] = el.value;
  }});
  document.querySelectorAll('input.cb').forEach((el, i) => {{
    data['cb_'+i] = el.checked;
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
    document.querySelectorAll('input.field[type=text], textarea.area').forEach(el => {{
      const i = el.dataset.i;
      if (i !== undefined && data['f_'+i] !== undefined) el.value = data['f_'+i];
    }});
    document.querySelectorAll('input.cb').forEach((el, i) => {{
      if (data['cb_'+i] !== undefined) el.checked = data['cb_'+i];
    }});
    if (data._ts) {{
      const s = document.getElementById('saveState');
      s.textContent = '✓ Сохранено ' + data._ts;
      s.style.color = '#4caf7d';
    }}
  }} catch(e) {{}}
}}

document.addEventListener('DOMContentLoaded', restoreState);
document.addEventListener('keydown', e => {{
  if ((e.ctrlKey||e.metaKey) && e.key === 's') {{ e.preventDefault(); saveState(); }}
}});
</script>
</body>
</html>
'''

with open('docs/139_supervisor_summary_dashboard.html', 'w', encoding='utf-8') as fp:
    fp.write(html)
print(f'Written {len(html):,} chars, {_input_idx[0]} editable/formula cells rendered')
