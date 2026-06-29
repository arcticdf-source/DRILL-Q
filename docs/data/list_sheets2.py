import json
wb = json.load(open('docs/data/supervisor_report_workbook.json', encoding='utf-8'))
for s in wb['sheets']:
    print(f"{s['name']}: rows={s.get('row_count','?')}, cols={s.get('col_count','?')}, cells={len(s['cells'])}, keys={list(s.keys())[:8]}")
