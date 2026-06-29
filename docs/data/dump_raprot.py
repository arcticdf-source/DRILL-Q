# -*- coding: utf-8 -*-
import json

with open('docs/data/supervisor_report_workbook.json', encoding='utf-8') as f:
    wb = json.load(f)

# Show all sheet names
for sh in wb['sheets']:
    print('SHEET:', repr(sh['name']))

# Find Рапорт
rap = None
for sh in wb['sheets']:
    if '\u0420\u0430\u043f\u043e\u0440\u0442' in sh['name']:
        rap = sh
        break

if not rap:
    print('Рапорт NOT FOUND')
else:
    print(f'\nFound: {rap["name"]} rows={rap["maxRow"]} cols={rap["maxCol"]}')
    cells = {(c['r'], c['c']): c for c in rap['cells']}
    with open('docs/data/raprot_dump.txt', 'w', encoding='utf-8') as out:
        for r in range(1, rap['maxRow']+1):
            row_cells = [(c, cells[(r,c)]) for c in range(1, rap['maxCol']+1) if (r,c) in cells]
            if row_cells:
                parts = []
                for c, cell in row_cells:
                    v = str(cell['v'])[:50] if cell['v'] is not None else ''
                    f = str(cell['f'])[:40] if cell.get('f') else ''
                    parts.append(f'C{c}={v}' + (f' [={f}]' if f else ''))
                out.write(f'R{r}: ' + '  |  '.join(parts) + '\n')
    print('Written docs/data/raprot_dump.txt')
