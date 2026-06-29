import json
wb = json.load(open('docs/data/supervisor_report_workbook.json', encoding='utf-8'))
# show first cell structure of each sheet
for s in wb['sheets']:
    if s['cells']:
        print(f"{s['name']}: {list(s['cells'][0].keys())}")
        break
