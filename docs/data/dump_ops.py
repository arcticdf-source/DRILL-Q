"""Dump Операции по скважине first 15 rows to understand structure."""
import json

wb = json.load(open('docs/data/supervisor_report_workbook.json', encoding='utf-8'))

for sheet in wb['sheets']:
    if sheet['name'] == 'Операции по скважине':
        cells = sheet['cells']
        by_row = {}
        for cell in cells:
            r = cell['r']
            if r > 15:
                continue
            col = cell['c']
            by_row.setdefault(r, {})[col] = cell
        print(f"SHEET: {sheet['name']} maxRow={sheet['maxRow']} maxCol={sheet['maxCol']}")
        for r in sorted(by_row):
            row = by_row[r]
            parts = []
            for col in sorted(row):
                cell = row[col]
                v = str(cell.get('v', ''))[:60]
                f = cell.get('f', '')
                marker = f'[fx={f[:30]}]' if f else '[ed]'
                parts.append(f'C{col}:{v}{marker}')
            print(f"R{r}: {' | '.join(parts)}")
        break
