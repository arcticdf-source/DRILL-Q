"""Quick dump Лист1-5 and Graf sheet."""
import json
wb = json.load(open('docs/data/supervisor_report_workbook.json', encoding='utf-8'))
TARGET = ['Лист1','Лист2','Лист3','Лист4','Лист5','График "Глубина-Время"']
for sheet in wb['sheets']:
    if sheet['name'] not in TARGET:
        continue
    cells = sheet['cells']
    by_row = {}
    for cell in cells:
        r = cell['r']
        if r > 10:
            continue
        col = cell['c']
        by_row.setdefault(r, {})[col] = cell
    print(f"\n=== {sheet['name']} (maxRow={sheet['maxRow']}, cells={len(cells)}) ===")
    for r in sorted(by_row):
        row = by_row[r]
        parts = []
        for col in sorted(row):
            cell = row[col]
            v = str(cell.get('v', ''))[:60]
            f = cell.get('f', '')
            marker = f'[fx]' if f else '[ed]'
            parts.append(f'C{col}:{v}{marker}')
        print(f"R{r}: {' | '.join(parts)}")
