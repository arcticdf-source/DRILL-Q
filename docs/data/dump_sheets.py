# -*- coding: utf-8 -*-
"""Dump key sheets to separate text files for analysis"""
import json, sys

with open('docs/data/supervisor_report_workbook.json', encoding='utf-8') as f:
    wb = json.load(f)

sheets_map = {s['name']: s for s in wb['sheets']}

def dump_sheet(name, max_rows=200, out_file=None):
    sh = sheets_map.get(name)
    if not sh:
        print(f'Sheet not found: {name}')
        return
    cells = {(c['r'], c['c']): c for c in sh['cells']}
    lines = []
    for r in range(1, min(sh['maxRow']+1, max_rows+1)):
        row = [(col, cells[(r,col)]) for col in range(1, sh['maxCol']+1) if (r,col) in cells]
        if row:
            parts = []
            for col, cell in row:
                v = cell['v']
                f = cell.get('f')
                vs = '' if v is None else str(v)[:60]
                fs = f' [={str(f)[:40]}]' if f else ''
                parts.append(f'C{col}={vs}{fs}')
            lines.append(f'R{r}: ' + '  |  '.join(parts))
    if out_file:
        with open(out_file, 'w', encoding='utf-8') as fp:
            fp.write('\n'.join(lines))
        print(f'Written {out_file} ({len(lines)} rows)')
    else:
        print('\n'.join(lines))

# Dump КНБК sheet
dump_sheet('КНБК', 20, 'docs/data/knbk_sheet.txt')

# Dump НПВ sheet (first 30 rows)
dump_sheet('НПВ', 30, 'docs/data/npv_sheet.txt')

# Dump Операции по скважине (last 20 rows around 640-653)
sh = sheets_map['Операции по скважине']
cells = {(c['r'], c['c']): c for c in sh['cells']}
lines = []
for r in range(1, 30):  # First 30 rows for headers
    row = [(col, cells[(r,col)]) for col in range(1, 40) if (r,col) in cells]
    if row:
        parts = [f'C{col}={str(cell["v"])[:40]}{" [="+str(cell.get("f",""))[:30]+"]" if cell.get("f") else ""}' for col,cell in row]
        lines.append(f'R{r}: ' + '  |  '.join(parts))
# Last rows
for r in range(640, sh['maxRow']+1):
    row = [(col, cells[(r,col)]) for col in range(1, 40) if (r,col) in cells]
    if row:
        parts = [f'C{col}={str(cell["v"])[:40]}' for col,cell in row]
        lines.append(f'R{r}: ' + '  |  '.join(parts))
with open('docs/data/ops_sheet.txt', 'w', encoding='utf-8') as fp:
    fp.write('\n'.join(lines))
print(f'Written ops_sheet.txt ({len(lines)} rows)')

# Dump Инклинометрия - first 30 and last 10
sh = sheets_map['Инклинометрия']
cells_inc = {(c['r'], c['c']): c for c in sh['cells']}
lines2 = []
for r in list(range(1,31)) + list(range(sh['maxRow']-9, sh['maxRow']+1)):
    row = [(col, cells_inc[(r,col)]) for col in range(1, sh['maxCol']+1) if (r,col) in cells_inc]
    if row:
        parts = [f'C{col}={str(cell["v"])[:35]}' for col,cell in row]
        lines2.append(f'R{r}: ' + '  |  '.join(parts))
with open('docs/data/incl_sheet.txt', 'w', encoding='utf-8') as fp:
    fp.write('\n'.join(lines2))
print(f'Written incl_sheet.txt')
