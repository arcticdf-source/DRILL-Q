import json
wb = json.load(open('docs/data/supervisor_report_workbook.json', encoding='utf-8'))
for s in wb['sheets']:
    print(f"{s['name']}: dims={s['dims']}, cells={len(s['cells'])}")
