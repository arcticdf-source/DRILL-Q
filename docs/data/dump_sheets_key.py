"""Dump key sheets to understand their structure."""
import json

SHEETS_TO_DUMP = ['НПВ', 'Баланс', 'Время', 'Извлеченные уроки', 'Коды операций ', 'Лист7', 'PBI-таблица']
MAX_ROWS = 30  # first N rows per sheet

wb = json.load(open('docs/data/supervisor_report_workbook.json', encoding='utf-8'))

for sheet in wb['sheets']:
    name = sheet['name']
    if name not in SHEETS_TO_DUMP:
        continue
    cells = sheet['cells']
    print(f"\n{'='*60}")
    print(f"SHEET: {name}  (maxRow={sheet['maxRow']}, maxCol={sheet['maxCol']}, cells={len(cells)})")
    print('='*60)
    by_row = {}
    for cell in cells:
        r = cell['r']
        if r > MAX_ROWS:
            continue
        col = cell['c']
        by_row.setdefault(r, {})[col] = cell

    for r in sorted(by_row):
        row = by_row[r]
        parts = []
        for col in sorted(row):
            cell = row[col]
            v = cell.get('v', '')
            f = cell.get('f', '')
            marker = f'[fx={f}]' if f else '[ed]'
            val = str(v)[:80]
            parts.append(f'C{col}:{val}{marker}')
        print(f"R{r}: {' | '.join(parts)}")
