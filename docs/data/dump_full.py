# -*- coding: utf-8 -*-
"""Full dump of Рапорт sheet - no truncation"""
import json

with open('docs/data/supervisor_report_workbook.json', encoding='utf-8') as f:
    wb = json.load(f)

rap_sh = next(s for s in wb['sheets'] if s['name'] == 'Рапорт')
cells = {(c['r'], c['c']): c for c in rap_sh['cells']}

with open('docs/data/rap_full.txt', 'w', encoding='utf-8') as out:
    for r in range(1, rap_sh['maxRow']+1):
        row = [(col, cells[(r,col)]) for col in range(1, rap_sh['maxCol']+1) if (r,col) in cells]
        if not row: continue
        parts = []
        for col, cell in row:
            v = cell['v']
            f = cell.get('f')
            vs = '' if v is None else str(v)
            fs = f' [fx={str(f)}]' if f else ' [ed]'
            parts.append(f'C{col}={repr(vs)}{fs}')
        out.write(f'R{r}:\n')
        for p in parts:
            out.write(f'  {p}\n')
        out.write('\n')

print('Done: docs/data/rap_full.txt')
