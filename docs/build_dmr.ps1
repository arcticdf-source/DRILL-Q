
$srcPath = 'C:\Users\Andrey\Desktop\Рабочий стол май 2026\NEW\docs\project_well_dmr_entry.html'
$curPath = 'C:\Users\Andrey\Desktop\NEW\docs\40_wellsite_program_site_edition.html'
$targetPath = 'C:\Users\Andrey\Desktop\NEW\docs\40_wellsite_program_site_edition.html'

$src = [System.IO.File]::ReadAllText($srcPath, [System.Text.Encoding]::UTF8)
$cur = [System.IO.File]::ReadAllText($curPath, [System.Text.Encoding]::UTF8)

# ---- Extract modules from original ----
$firstMod = $src.IndexOf('<div id="m_well"')
$secEnd   = $src.IndexOf('</section>', $firstMod)
$allMods  = $src.Substring($firstMod, $secEnd - $firstMod).TrimEnd()

# ---- Text replacements ----
$allMods = $allMods.Replace('РУО Petrofree','РУО (инвертная эмульсия)')
$allMods = $allMods.Replace('<h2>Well Data</h2>','<h2>Данные скважины</h2>')
$allMods = $allMods.Replace('<h2>Well Casing &amp; Sections</h2>','<h2>Обсадные колонны</h2>')
$allMods = $allMods.Replace('<h2>Lithology</h2>','<h2>Литология</h2>')
$allMods = $allMods.Replace('<h2>Well Surveys</h2>','<h2>Траектория скважины</h2>')
$allMods = $allMods.Replace('<h2>Well Testings</h2>','<h2>Испытания скважины</h2>')
$allMods = $allMods.Replace('<h2>Bit Records</h2>','<h2>Рейсы долота</h2>')
$allMods = $allMods.Replace('<h2>Hydraulics</h2>','<h2>Гидравлика</h2>')
$allMods = $allMods.Replace('<h2>Zero Defects Tracking</h2>','<h2>Контроль качества</h2>')
$allMods = $allMods.Replace('<h2>Mud Reports</h2>','<h2>Рапорты по раствору</h2>')
$allMods = $allMods.Replace('<h2>Post Well Audit</h2>','<h2>Аудит скважины</h2>')
$allMods = $allMods.Replace('<h2>Data Management</h2>','<h2>Управление данными</h2>')
$allMods = $allMods.Replace('<h2>Print Manager</h2>','<h2>Диспетчер печати</h2>')
$allMods = $allMods.Replace('<h2>Report Manager</h2>','<h2>Диспетчер отчётов</h2>')
$allMods = $allMods.Replace('>Validate testing<','>Проверить испытание<')
$allMods = $allMods.Replace('>Calc ROP/NPT<','>Рассчитать МСП/NPT<')
$allMods = $allMods.Replace('>Check geometry<','>Проверить геометрию<')
$allMods = $allMods.Replace('>Validate Well Data<','>Проверить данные скважины<')
$allMods = $allMods.Replace('>Build recap<','>Сформировать итоги<')
$allMods = $allMods.Replace('>Run zero-defects check<','>Запустить проверку качества<')
$allMods = $allMods.Replace('>Download Well Data<','>Скачать данные скважины<')
$allMods = $allMods.Replace('>Retrieve Well Data<','>Получить данные<')
$allMods = $allMods.Replace('>Upload Daily Reports<','>Загрузить суточные рапорты<')
$allMods = $allMods.Replace('>Export to DIMS<','>Экспорт в DIMS<')
$allMods = $allMods.Replace('>Backup local data<','>Создать резервную копию<')
$allMods = $allMods.Replace('>Restore local data<','>Восстановить данные<')
$allMods = $allMods.Replace('>Check product list<','>Проверить каталог<')
$allMods = $allMods.Replace('>Launch Report Manager<','>Открыть диспетчер отчётов<')
$allMods = $allMods.Replace('>Print current report<','>Распечатать текущий отчёт<')
$allMods = $allMods.Replace('>Generate Report<','>Сформировать рапорт<')
$allMods = $allMods.Replace('>Generate<','>Сформировать<')
$allMods = $allMods.Replace('>Save Template<','>Сохранить шаблон<')
$allMods = $allMods.Replace('>Export Templates<','>Экспорт шаблонов<')
$allMods = $allMods.Replace('>Import Templates<','>Импорт шаблонов<')
$allMods = $allMods.Replace('>Apply<','>Применить<')
$allMods = $allMods.Replace('>Delete<','>Удалить<')
$allMods = $allMods.Replace('<h3>Intervals recap</h3>','<h3>Итоги по интервалам</h3>')
$allMods = $allMods.Replace('<h3>Conclusions</h3>','<h3>Выводы</h3>')
$allMods = $allMods.Replace('<h3>Engineering summary</h3>','<h3>Инженерная сводка</h3>')
$allMods = $allMods.Replace('<label>Recommendations</label>','<label>Рекомендации</label>')
$allMods = $allMods.Replace('<label>Engineering summary</label>','<label>Инженерная сводка</label>')
$allMods = $allMods.Replace('<h3>Exchange Data with Server</h3>','<h3>Обмен данными с сервером</h3>')
$allMods = $allMods.Replace('<h3>Backup / Restore</h3>','<h3>Резервное копирование</h3>')
$allMods = $allMods.Replace('<h3>Task Selection</h3>','<h3>Шаг 1: Задача</h3>')
$allMods = $allMods.Replace('<h3>Report Type Selection</h3>','<h3>Шаг 2: Тип отчёта</h3>')
$allMods = $allMods.Replace('<h3>Report Selection</h3>','<h3>Шаг 3: Выбор шаблона</h3>')
$allMods = $allMods.Replace('<h3>Results</h3>','<h3>Шаг 4: Результаты</h3>')
$allMods = $allMods.Replace('>Screen 1: Task Selection<','>Шаг 1: Задача<')
$allMods = $allMods.Replace('>Экран 1: Task Selection<','>Шаг 1: Задача<')
$allMods = $allMods.Replace('>Экран 2: Report Type Selection<','>Шаг 2: Тип отчёта<')
$allMods = $allMods.Replace('>Экран 3: Report Selection<','>Шаг 3: Выбор шаблона<')
$allMods = $allMods.Replace('>Экран 4: Results<','>Шаг 4: Результаты<')
$allMods = $allMods.Replace('>Task Selection<','>Задача<')
$allMods = $allMods.Replace('>Report Type Selection<','>Тип отчёта<')
$allMods = $allMods.Replace('<option>Exploration</option>','<option>Поисковая</option>')
$allMods = $allMods.Replace('<option selected>Development</option>','<option selected>Добывающая</option>')
$allMods = $allMods.Replace('<option>Appraisal</option>','<option>Оценочная</option>')
$allMods = $allMods.Replace('<option>Workover</option>','<option>КРС</option>')
$allMods = $allMods.Replace('<option>Vertical</option>','<option>Вертикальная</option>')
$allMods = $allMods.Replace('<option selected>Deviated</option>','<option selected>Наклонно-направленная</option>')
$allMods = $allMods.Replace('<option>Horizontal</option>','<option>Горизонтальная</option>')

# Replace m_well with Russian version from current
$rigPos    = $allMods.IndexOf('<div id="m_rig"')
$curWellS  = $cur.IndexOf('<div id="m_well"')
$curCasingS= $cur.IndexOf('<div id="m_casing"')
$curWell   = $cur.Substring($curWellS, $curCasingS - $curWellS).Trim()
$allMods   = $curWell + "`n`n      " + $allMods.Substring($rigPos)

# Extract design and pilot from current
$pilotS  = $cur.IndexOf('<div id="m_pilot"')
$designS = $cur.IndexOf('<div id="m_design"')
$mudS    = $cur.IndexOf('<div id="m_mud"')
$pilot   = $cur.Substring($pilotS,  $designS - $pilotS).Trim()
$design  = $cur.Substring($designS, $mudS    - $designS).Trim()

# Extract JS from original
$scriptPos = $src.IndexOf('<script>', $secEnd)
$jsEndPos  = $src.LastIndexOf('</script>')
$jsSection = $src.Substring($scriptPos, $jsEndPos + 9 - $scriptPos)

# ---- Build head HTML ----
$head = @'
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MudGPT-DMR — DRILL-Q</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif; background: #F5F5F7; color: #1D1D1F; font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased; min-height: 100vh; }
  :root {
    --bg: #F5F5F7; --panel: #FFFFFF; --card: #F5F5F7;
    --line: rgba(0,0,0,0.08); --txt: #1D1D1F; --muted: #6E6E73;
    --blue: #2563EB; --blue-l: #EFF6FF;
    --g: #16A34A; --g-l: #F0FDF4; --g-b: #BBF7D0;
    --w: #D97706; --w-l: #FFFBEB; --w-b: #FDE68A;
    --r: #DC2626; --r-l: #FEF2F2; --r-b: #FECACA;
    --sh-sm: 0 1px 4px rgba(0,0,0,0.06); --sh: 0 4px 20px rgba(0,0,0,0.08);
  }

  /* Nav */
  nav { position:sticky; top:0; z-index:100; background:rgba(255,255,255,0.88); backdrop-filter:saturate(180%) blur(20px); border-bottom:1px solid var(--line); height:52px; display:flex; align-items:center; padding:0 20px; gap:10px; }
  .nav-logo { display:flex; align-items:center; gap:8px; text-decoration:none; color:var(--txt); flex-shrink:0; }
  .nav-mark { width:26px; height:26px; border-radius:7px; background:var(--blue); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:#fff; }
  .nav-name { font-size:14px; font-weight:700; letter-spacing:-.3px; }
  .nav-sep { color: rgba(0,0,0,0.2); font-size:18px; line-height:1; }
  .nav-title { font-size:14px; font-weight:600; color:var(--txt); }
  .nav-actions { display:flex; gap:6px; flex-wrap:wrap; margin-left:auto; align-items:center; }
  .btn { border:1px solid var(--line); background:var(--panel); color:var(--txt); border-radius:8px; padding:5px 10px; cursor:pointer; font-weight:600; font-size:12px; font-family:inherit; white-space:nowrap; }
  .btn:hover { border-color:#93C5FD; background:var(--blue-l); color:var(--blue); }
  .btn.main { background:var(--blue); color:#fff; border-color:var(--blue); }
  .btn.main:hover { background:#1D4ED8; }
  .btn.tag-edit::after { content:'EDIT'; margin-left:6px; font-size:9px; font-weight:800; letter-spacing:.04em; padding:1px 5px; border-radius:999px; vertical-align:middle; background:#DBEAFE; color:#1E40AF; }
  .btn.tag-auto::after { content:'AUTO'; margin-left:6px; font-size:9px; font-weight:800; letter-spacing:.04em; padding:1px 5px; border-radius:999px; vertical-align:middle; background:var(--g-l); color:var(--g); }
  .btn-ghost { border:1px solid var(--line); background:transparent; color:var(--txt); border-radius:8px; padding:5px 10px; cursor:pointer; font-size:12px; font-weight:500; text-decoration:none; display:inline-flex; align-items:center; }
  .btn-ghost:hover { background:var(--bg); }

  /* Legend */
  .legend { display:flex; gap:8px; align-items:center; flex-wrap:wrap; font-size:12px; color:var(--muted); padding:8px 20px; background:var(--panel); border-bottom:1px solid var(--line); }
  .chip-edit { display:inline-flex; align-items:center; border:1px solid #BFDBFE; border-radius:999px; padding:2px 8px; background:#DBEAFE; color:#1E40AF; font-size:11px; font-weight:600; }
  .chip-auto { display:inline-flex; align-items:center; border:1px solid var(--g-b); border-radius:999px; padding:2px 8px; background:var(--g-l); color:var(--g); font-size:11px; font-weight:600; }
  .toggle { display:inline-flex; align-items:center; gap:6px; border:1px solid var(--line); border-radius:999px; padding:3px 10px; background:var(--bg); color:var(--txt); font-size:12px; }

  /* Layout */
  .app { max-width:1500px; margin:0 auto; padding:0 14px 14px; }
  .tabs-bar { position:sticky; top:52px; z-index:90; background:var(--panel); border-bottom:1.5px solid var(--line); display:flex; overflow-x:auto; padding:0 14px; gap:0; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
  .tabs-bar::-webkit-scrollbar { display:none; }
  .mod-btn { display:inline-flex; flex-direction:column; gap:1px; padding:10px 14px; border-radius:0; border:none; border-bottom:2.5px solid transparent; background:transparent; color:var(--muted); cursor:pointer; font-family:inherit; white-space:nowrap; text-align:left; flex-shrink:0; transition:color .15s, background .15s; }
  .mod-btn:hover { color:var(--txt); background:var(--bg); }
  .mod-btn.active { border-bottom-color:var(--blue); }
  .mod-title { font-weight:600; font-size:12px; color:inherit; }
  .mod-btn.active .mod-title { color:var(--blue); }
  .mod-sub { font-size:10px; color:var(--muted); }
  .mod-btn.active .mod-sub { color:rgba(37,99,235,0.65); }

  .layout { display:grid; grid-template-columns:220px 1fr; gap:12px; margin-top:12px; }
  .side { border:1.5px solid var(--line); border-radius:12px; background:var(--panel); box-shadow:var(--sh-sm); padding:14px; position:sticky; top:152px; height:calc(100vh - 168px); overflow:auto; }
  .work { border:1.5px solid var(--line); border-radius:12px; background:var(--panel); box-shadow:var(--sh-sm); padding:16px; }
  h1 { font-size:18px; font-weight:700; color:var(--txt); letter-spacing:-.3px; }
  .sub { margin-top:3px; color:var(--muted); font-size:12px; }
  .status { margin-top:12px; border:1.5px solid var(--line); border-radius:8px; background:var(--bg); padding:10px; font-size:12px; }
  .srow { display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid var(--line); }
  .srow:last-child { border-bottom:none; }
  .ok { color:var(--g); font-weight:700; }
  .warn { color:var(--w); font-weight:700; }
  .bad { color:var(--r); font-weight:700; }

  /* Modules */
  .module { display:none; }
  .module.active { display:block; }
  .module-toolbar { display:flex; justify-content:flex-end; gap:8px; margin:0 0 12px; }
  h2 { font-size:17px; font-weight:700; color:var(--txt); letter-spacing:-.3px; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid var(--line); }
  h3 { font-size:13px; font-weight:700; color:var(--txt); margin:12px 0 6px; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
  .card { border:1.5px solid var(--line); border-radius:10px; background:var(--bg); padding:12px; }
  label { display:block; font-size:11px; font-weight:600; color:var(--muted); margin:8px 0 3px; text-transform:uppercase; letter-spacing:.04em; }
  input, select, textarea { width:100%; border:1.5px solid var(--line); border-radius:6px; background:var(--panel); color:var(--txt); padding:6px 8px; font-size:13px; font-family:inherit; outline:none; }
  input:focus, select:focus, textarea:focus { border-color:#93C5FD; box-shadow:0 0 0 3px rgba(37,99,235,0.08); }
  input.ro { background:var(--blue-l); border-color:#BFDBFE; color:var(--blue); font-weight:700; }
  input.ro.fail { background:var(--r-l); border-color:var(--r-b); color:var(--r); box-shadow:0 0 0 2px rgba(220,38,38,0.1); }
  textarea { min-height:70px; resize:vertical; }
  .row { display:flex; gap:8px; align-items:center; }
  .row > * { flex:1; }
  table { width:100%; border-collapse:collapse; margin-top:8px; }
  th, td { border:1px solid var(--line); padding:7px 8px; font-size:12px; vertical-align:top; text-align:left; }
  th { background:var(--bg); font-weight:700; font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; }
  .small { font-size:11px; color:var(--muted); line-height:1.5; }
  .out { margin-top:10px; border:1.5px solid #BFDBFE; background:var(--blue-l); border-radius:8px; padding:8px; }
  .orow { display:flex; justify-content:space-between; border-bottom:1px solid rgba(37,99,235,0.12); padding:3px 0; font-size:12px; color:var(--muted); }
  .orow:last-child { border-bottom:none; }
  .mono { font-family:Consolas,monospace; color:var(--blue); font-weight:700; }

  /* Fluid */
  .fluid-report-layout { display:grid; grid-template-columns:240px 1fr; gap:12px; }
  .fluid-report-list { display:grid; gap:10px; }
  .fluid-report-list table td, .fluid-report-list table th { font-size:12px; }
  .fluid-form-grid { display:grid; grid-template-columns:1.2fr .8fr; gap:12px; }
  .fluid-tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px; }
  .fluid-tab { border:1px solid var(--line); border-radius:8px; padding:7px 10px; background:var(--bg); color:var(--txt); font-size:12px; font-weight:700; }
  .fluid-flag-row { display:flex; gap:18px; align-items:center; justify-content:flex-end; margin-bottom:8px; flex-wrap:wrap; }
  .fluid-check { display:inline-flex; align-items:center; gap:6px; font-size:12px; color:var(--muted); }
  .fluid-props table input, .fluid-props table select { min-width:0; }

  /* Hydraulics */
  .hyd-screen { display:grid; gap:12px; }
  .hyd-pumps table td, .hyd-pumps table th, .hyd-panel table td, .hyd-panel table th { font-size:12px; }
  .hyd-panels { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; align-items:start; }
  .hyd-panel { min-height:100%; }
  .hyd-panel h3 { font-style:italic; }
  .hyd-note { border:1px solid var(--w-b); background:var(--w-l); color:#92400E; }

  /* Time breakdown */
  .time-breakdown-grid { display:grid; grid-template-columns:1fr 1fr 320px; gap:12px; align-items:start; }
  .time-breakdown-screen { }
  .time-breakdown-list { display:grid; gap:8px; }
  .time-breakdown-row { display:grid; grid-template-columns:1fr 110px; gap:10px; align-items:center; }
  .time-breakdown-row label { margin:0; }

  /* Tables */
  .table-wrap { width:100%; overflow-x:auto; }
  .inventory-table { table-layout:auto; min-width:1320px; }
  .inventory-table th:nth-child(1), .inventory-table td:nth-child(1) { min-width:210px; }
  .inventory-table th:nth-child(2), .inventory-table td:nth-child(2) { min-width:120px; }
  .inventory-table th:nth-child(3), .inventory-table td:nth-child(3) { min-width:110px; }
  .inventory-table th:nth-child(4), .inventory-table td:nth-child(4) { min-width:110px; }
  .inventory-table th:nth-child(5), .inventory-table td:nth-child(5) { min-width:120px; }
  .inventory-table th:nth-child(6), .inventory-table td:nth-child(6) { min-width:120px; }
  .inventory-table th:nth-child(7), .inventory-table td:nth-child(7) { min-width:110px; }
  .inventory-table th:nth-child(8), .inventory-table td:nth-child(8) { min-width:110px; }
  .inventory-table th:nth-child(9), .inventory-table td:nth-child(9) { min-width:120px; }
  .inventory-summary { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin-top:12px; }
  .inventory-summary label { margin-top:0; }
  .additional-cost-table { table-layout:auto; min-width:1180px; }
  .additional-cost-table th:nth-child(1), .additional-cost-table td:nth-child(1) { min-width:240px; }
  .additional-cost-table th:nth-child(2), .additional-cost-table td:nth-child(2) { min-width:160px; }
  .additional-cost-table th:nth-child(3), .additional-cost-table td:nth-child(3) { min-width:90px; }
  .additional-cost-table th:nth-child(4), .additional-cost-table td:nth-child(4) { min-width:100px; }
  .additional-cost-table th:nth-child(5), .additional-cost-table td:nth-child(5) { min-width:130px; }
  .additional-cost-table th:nth-child(6), .additional-cost-table td:nth-child(6) { min-width:130px; }
  .additional-cost-table th:nth-child(7), .additional-cost-table td:nth-child(7) { min-width:190px; }
  .product-catalog-card { width:100%; }
  .product-catalog-table { table-layout:auto; min-width:1240px; }
  .product-catalog-table th:nth-child(1), .product-catalog-table td:nth-child(1) { min-width:190px; }
  .product-catalog-table th:nth-child(2), .product-catalog-table td:nth-child(2) { min-width:230px; }
  .product-catalog-table th:nth-child(3), .product-catalog-table td:nth-child(3) { min-width:70px; }
  .product-catalog-table th:nth-child(4), .product-catalog-table td:nth-child(4) { min-width:70px; }
  .product-catalog-table th:nth-child(5), .product-catalog-table td:nth-child(5) { min-width:120px; }
  .product-catalog-table th:nth-child(6), .product-catalog-table td:nth-child(6) { min-width:130px; }
  .product-catalog-table th:nth-child(7), .product-catalog-table td:nth-child(7) { min-width:130px; }
  .product-catalog-table th:nth-child(8), .product-catalog-table td:nth-child(8) { min-width:130px; }
  .product-catalog-table input, .product-catalog-table select { min-width:0; white-space:normal; }

  /* Pit visualization */
  .pit-visual-section { margin-top:12px; }
  .pit-visual-summary { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:12px; }
  .pit-visual-summary label { margin-top:0; }
  .pit-visual-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; align-items:end; }
  .pit-visual-card { border:1.5px solid #BFDBFE; border-radius:10px; background:var(--panel); padding:10px; }
  .pit-visual-head { display:flex; justify-content:space-between; gap:8px; align-items:flex-start; margin-bottom:8px; }
  .pit-visual-name { font-weight:700; color:var(--txt); }
  .pit-visual-capacity { font-size:12px; white-space:nowrap; color:var(--muted); }
  .pit-visual-tank-wrap { display:flex; justify-content:center; align-items:flex-end; min-height:150px; padding:10px 0 4px; }
  .pit-visual-tank { position:relative; width:calc(72% + 28% * var(--pit-scale,1)); height:calc(90px + 50px * var(--pit-scale,1)); border:2px solid #93C5FD; border-radius:8px 8px 10px 10px; background:linear-gradient(180deg,rgba(219,234,254,.15),rgba(239,246,255,.7)); overflow:hidden; }
  .pit-visual-fill { position:absolute; left:0; right:0; bottom:0; height:var(--pit-fill,0%); background:linear-gradient(180deg,rgba(37,99,235,.7),rgba(29,78,216,.85)); border-top:1px solid rgba(147,197,253,.35); transition:height .2s ease; }
  .pit-visual-level { position:absolute; left:0; right:0; bottom:8px; text-align:center; font-size:20px; font-weight:800; color:var(--blue); }
  .pit-visual-meta { display:flex; justify-content:space-between; gap:8px; margin-top:8px; padding-top:8px; border-top:1px dashed var(--line); font-size:11px; color:var(--muted); }
  .pit-visual-over { color:var(--r); }

  /* Mud report */
  .mud-report-workspace { display:grid; gap:12px; }
  .mud-report-stat-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:12px; }
  .mud-report-stat-grid label { margin-top:0; }
  .mud-report-preview-card { padding:12px; }
  .mud-report-preview { min-height:240px; border:1px dashed #BFDBFE; border-radius:12px; background:var(--blue-l); padding:12px; }
  .mud-report-placeholder { font-size:12px; color:var(--muted); line-height:1.6; }
  .mud-report-sheet { background:#fff; color:#152132; border-radius:12px; padding:18px 20px; box-shadow:0 18px 48px rgba(0,0,0,.08); }
  .mud-report-header { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; border-bottom:2px solid #1b3550; padding-bottom:12px; margin-bottom:12px; }
  .mud-report-brand { font-size:11px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:#47698a; }
  .mud-report-title { font-size:26px; line-height:1.1; font-weight:800; color:#10243a; margin-top:4px; }
  .mud-report-subtitle { font-size:12px; color:#5e7084; margin-top:6px; }
  .mud-report-badge { min-width:170px; border:1px solid #c9d7e6; border-radius:10px; background:#f4f8fc; padding:10px 12px; text-align:right; }
  .mud-report-badge-label { font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#70859a; }
  .mud-report-badge-value { font-size:24px; font-weight:800; color:#17314b; margin-top:4px; }
  .mud-report-badge-note { font-size:11px; color:#5f7387; margin-top:4px; }
  .mud-report-topline { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin-bottom:12px; }
  .mud-report-kpi { border:1px solid #d9e3ed; border-radius:10px; background:#f7fafc; padding:10px 12px; }
  .mud-report-kpi-label { display:block; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#74879a; }
  .mud-report-kpi-value { display:block; font-size:18px; font-weight:800; color:#13283f; margin-top:6px; }
  .mud-report-meta { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:12px; }
  .mud-report-meta-card { border:1px solid #d9e3ed; border-radius:10px; padding:10px 12px; background:#fff; }
  .mud-report-meta-title { font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#70859a; margin-bottom:8px; }
  .mud-report-meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 12px; }
  .mud-report-meta-item span { display:block; font-size:10px; color:#6e8095; text-transform:uppercase; letter-spacing:.08em; }
  .mud-report-meta-item strong { display:block; font-size:13px; color:#13283f; margin-top:4px; word-break:break-word; }
  .mud-report-section { margin-top:14px; }
  .mud-report-section-title { font-size:12px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#193651; border-top:1px solid #d9e3ed; border-bottom:1px solid #d9e3ed; background:#f5f8fb; padding:8px 10px; }
  .mud-report-section-grid { display:grid; grid-template-columns:1.2fr .8fr; gap:12px; margin-top:10px; }
  .mud-report-table { width:100%; border-collapse:collapse; margin-top:10px; }
  .mud-report-table th, .mud-report-table td { border:1px solid #d4dee8; padding:6px 7px; font-size:11px; color:#12283f; vertical-align:top; }
  .mud-report-table th { background:#eaf1f8; color:#17314b; font-weight:800; }
  .mud-report-note-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px; }
  .mud-report-note { border:1px solid #d8e2ec; border-radius:10px; background:#fbfdff; padding:10px 12px; }
  .mud-report-note h4 { font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:#6e8297; margin-bottom:8px; }
  .mud-report-note p { font-size:12px; line-height:1.55; color:#21364d; white-space:pre-wrap; }
  .mud-report-empty { color:#7f91a5; font-style:italic; }

  @media print {
    body { background:#fff; }
    nav, .legend, .tabs-bar, .side, .module-toolbar, .btn, .mud-report-preview-card>h3 { display:none !important; }
    .layout { display:block; }
    .work, .module, .module.active { display:block !important; border:none; background:#fff; padding:0; }
    .card { border:none; background:#fff; padding:0; }
    #m_mud .mud-report-preview { border:none; background:#fff; padding:0; min-height:auto; }
    #m_mud .mud-report-sheet { box-shadow:none; padding:0; border-radius:0; }
  }

  @media (max-width:1100px) { .layout { grid-template-columns:1fr; } .side { position:static; height:auto; } .hyd-panels { grid-template-columns:repeat(2,minmax(0,1fr)); } .time-breakdown-grid { grid-template-columns:1fr 1fr; } }
  @media (max-width:800px) { .grid2, .grid3, .fluid-report-layout, .fluid-form-grid, .hyd-panels, .time-breakdown-grid, .pit-visual-summary, .mud-report-topline, .mud-report-meta, .mud-report-note-grid, .mud-report-section-grid, .mud-report-stat-grid { grid-template-columns:1fr; } nav { padding:0 12px; } .nav-actions { gap:4px; } .btn { padding:4px 7px; font-size:11px; } .mod-btn { padding:8px 10px; } .mod-title { font-size:11px; } .mod-sub { display:none; } }
</style>
</head>
<body>
<nav>
  <a class="nav-logo" href="../index.html"><div class="nav-mark">DQ</div><span class="nav-name">DRILL-Q</span></a>
  <span class="nav-sep">/</span>
  <a class="btn-ghost" href="../tools.html">Инструменты</a>
  <span class="nav-sep">/</span>
  <span class="nav-title" id="brandTitle">MudGPT-DMR</span>
  <div class="nav-actions">
    <button class="btn" id="loadButton" onclick="loadState()">Загрузить</button>
    <button class="btn" id="saveButton" onclick="saveState()">Сохранить</button>
    <button class="btn" onclick="runQC()">Контроль качества</button>
    <button class="btn" onclick="openModById('data')">Обмен данными</button>
    <button class="btn" onclick="openPrintManager()">Печать</button>
    <button class="btn" onclick="exportJSON()">Экспорт JSON</button>
    <button class="btn" onclick="openReportManager()">Отчёты</button>
    <button class="btn main" onclick="generateReport()">Сформировать рапорт</button>
  </div>
</nav>
<div class="app">
  <div class="legend" style="margin-top:10px">
    <span class="chip-edit">EDIT: ввод и управление</span>
    <span class="chip-auto">AUTO: проверка/расчёт/генерация</span>
    <label class="toggle"><input id="auto_calc" type="checkbox" checked onchange="toggleAutoCalc()"> Авторасчёт при изменении полей</label>
  </div>

  <div class="tabs-bar">
    <button class="mod-btn active" data-mod="well" onclick="openMod('well',this)"><div class="mod-title">Данные скважины</div><div class="mod-sub">Паспорт и единицы</div></button>
    <button class="mod-btn" data-mod="casing" onclick="openMod('casing',this)"><div class="mod-title">Обсадные колонны</div><div class="mod-sub">Колонны и интервалы</div></button>
    <button class="mod-btn" data-mod="lith" onclick="openMod('lith',this)"><div class="mod-title">Литология</div><div class="mod-sub">Породы и интервалы</div></button>
    <button class="mod-btn" data-mod="survey" onclick="openMod('survey',this)"><div class="mod-title">Траектория</div><div class="mod-sub">MD/TVD/Азимут</div></button>
    <button class="mod-btn" data-mod="testing" onclick="openMod('testing',this)"><div class="mod-title">Испытания</div><div class="mod-sub">Пласт и интервал</div></button>
    <button class="mod-btn" data-mod="bit" onclick="openMod('bit',this)"><div class="mod-title">Рейсы долота</div><div class="mod-sub">Долото и ROP</div></button>
    <button class="mod-btn" data-mod="rig" onclick="openMod('rig',this)"><div class="mod-title">Оборудование</div><div class="mod-sub">Насосы и ёмкости</div></button>
    <button class="mod-btn" data-mod="bha" onclick="openMod('bha',this)"><div class="mod-title">КНБК</div><div class="mod-sub">BHA и насадки</div></button>
    <button class="mod-btn" data-mod="fluid" onclick="openMod('fluid',this)"><div class="mod-title">Раствор</div><div class="mod-sub">Свойства и реология</div></button>
    <button class="mod-btn" data-mod="time" onclick="openMod('time',this)"><div class="mod-title">Время суток</div><div class="mod-sub">25 категорий</div></button>
    <button class="mod-btn" data-mod="products" onclick="openMod('products',this)"><div class="mod-title">Каталог компонентов</div><div class="mod-sub">SG и цены</div></button>
    <button class="mod-btn" data-mod="inv" onclick="openMod('inv',this)"><div class="mod-title">Склад и стоимость</div><div class="mod-sub">Материалы и расходы</div></button>
    <button class="mod-btn" data-mod="vol" onclick="openMod('vol',this)"><div class="mod-title">Объёмы</div><div class="mod-sub">Баланс и потери</div></button>
    <button class="mod-btn" data-mod="hyd" onclick="openMod('hyd',this)"><div class="mod-title">Гидравлика</div><div class="mod-sub">ECD и давление</div></button>
    <button class="mod-btn" data-mod="zero" onclick="openMod('zero',this)"><div class="mod-title">QC</div><div class="mod-sub">Контроль качества</div></button>
    <button class="mod-btn" data-mod="mud" onclick="openMod('mud',this)"><div class="mod-title">Рапорты</div><div class="mod-sub">Суточные рапорты</div></button>
    <button class="mod-btn" data-mod="audit" onclick="openMod('audit',this)"><div class="mod-title">Аудит</div><div class="mod-sub">Итоги скважины</div></button>
    <button class="mod-btn" data-mod="data" onclick="openMod('data',this)"><div class="mod-title">Данные</div><div class="mod-sub">Сервер и DIMS</div></button>
    <button class="mod-btn" data-mod="print" onclick="openMod('print',this)"><div class="mod-title">Печать</div><div class="mod-sub">Пакеты отчётов</div></button>
    <button class="mod-btn" data-mod="report" onclick="openMod('report',this)"><div class="mod-title">Отчёты</div><div class="mod-sub">Шаблоны и выгрузка</div></button>
    <button class="mod-btn" data-mod="design" onclick="openMod('design',this)"><div class="mod-title">Этап 1: Проект</div><div class="mod-sub">Периметр и метрики</div></button>
    <button class="mod-btn" data-mod="pilot" onclick="openMod('pilot',this)"><div class="mod-title">Этап 2: Пилот</div><div class="mod-sub">Тени и калибровка</div></button>
  </div>

  <div class="layout">
    <aside class="side">
      <h1 id="workspaceTitle">MudGPT-DMR</h1>
      <div class="sub" id="workspaceSub">Суточный рапорт по раствору</div>
      <div class="status" id="qcPanel">
        <div class="srow"><span>Well mandatory</span><span class="mono">PENDING</span></div>
        <div class="srow"><span>Volume reconciliation</span><span class="mono">PENDING</span></div>
        <div class="srow"><span>Cost consistency</span><span class="mono">PENDING</span></div>
        <div class="srow"><span>Audit readiness</span><span class="mono">PENDING</span></div>
      </div>
    </aside>

    <section class="work">
'@

# ---- Combine all parts ----
$output = $head + $allMods + "`n`n      " + $design + "`n`n      " + $pilot + "`n    </section>`n  </div>`n</div>`n`n" + $jsSection + "`n</body>`n</html>"

# ---- Write file (UTF-8 no BOM) ----
[System.IO.File]::WriteAllText($targetPath, $output, [System.Text.UTF8Encoding]::new($false))
Write-Output "Done. Output length: $($output.Length)"
