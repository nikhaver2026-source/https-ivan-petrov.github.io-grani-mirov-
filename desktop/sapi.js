// Голоса компьютера для игры: тот же мост, что на Android (GraniTTS).
// Мост видит все синтезаторы, установленные в Windows:
//   • SAPI 5 — голоса Microsoft и сторонних движков (RHVoice, Acapela,
//     Vocalizer, Ivona, eSpeak и любые другие со своим голосом SAPI);
//   • 32-битные голоса SAPI 5 (многие старые движки ставятся только так) —
//     их говорит второй, 32-битный процесс;
//   • голоса Windows 10/11 из «Параметры → Время и язык → Речь» (OneCore);
//   • голоса Microsoft Speech Platform (серверные голоса, например Elena).
// Каждый процесс PowerShell держит свои голоса и читает команды построчно:
// voice, speak, stop, wav (для проверки). Если мост не поднялся, игра
// говорит голосами, которые Chromium сам берёт у Windows.
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');

const CS = String.raw`
using System; using System.Collections.Generic; using System.Collections.Concurrent; using System.Globalization; using System.Text; using System.Threading;
using System.Runtime.InteropServices; using System.IO; using System.Diagnostics;
public static class GraniSapi {
  static object lk = new object();
  static BlockingCollection<string[]> q = new BlockingCollection<string[]>();
  static Dictionary<string, object> tokens = new Dictionary<string, object>();
  static HashSet<string> platform = new HashSet<string>();
  static dynamic msp = null;
  // ── Голос чтеца экрана ──
  // Синтезаторы, поставленные дополнениями NVDA (RHVoice, Vocalizer, Acapela
  // для NVDA и другие), — не голоса Windows: их видит только сам NVDA. Игра
  // говорит ими через NVDA (библиотека nvdaControllerClient) или через JAWS.
  [DllImport("kernel32", CharSet = CharSet.Unicode, SetLastError = true)] static extern IntPtr LoadLibraryW(string p);
  [DllImport("kernel32", CharSet = CharSet.Ansi)] static extern IntPtr GetProcAddress(IntPtr h, string n);
  [UnmanagedFunctionPointer(CallingConvention.StdCall)] delegate int NvVoid();
  [UnmanagedFunctionPointer(CallingConvention.StdCall)] delegate int NvText([MarshalAs(UnmanagedType.LPWStr)] string t);
  static NvVoid nvTest = null, nvCancel = null; static NvText nvSpeak = null;
  static dynamic jaws = null;
  const string NVDA = "NVDA — голос чтеца экрана", JAWS = "JAWS — голос чтеца экрана";
  static void LoadNvda(){
    try {
      string dir = Environment.GetEnvironmentVariable("GRANI_SR_DIR"); if (string.IsNullOrEmpty(dir)) return;
      string sub = IntPtr.Size == 8 ? "x64" : "x86";
      string[] names = { Path.Combine(dir, sub, "nvdaControllerClient.dll"), Path.Combine(dir, IntPtr.Size == 8 ? "nvdaControllerClient64.dll" : "nvdaControllerClient32.dll") };
      foreach (var f in names) {
        if (!File.Exists(f)) continue;
        IntPtr h = LoadLibraryW(f); if (h == IntPtr.Zero) continue;
        IntPtr a = GetProcAddress(h, "nvdaController_testIfRunning"), b = GetProcAddress(h, "nvdaController_speakText"), c = GetProcAddress(h, "nvdaController_cancelSpeech");
        if (a == IntPtr.Zero || b == IntPtr.Zero || c == IntPtr.Zero) continue;
        nvTest = (NvVoid)Marshal.GetDelegateForFunctionPointer(a, typeof(NvVoid));
        nvSpeak = (NvText)Marshal.GetDelegateForFunctionPointer(b, typeof(NvText));
        nvCancel = (NvVoid)Marshal.GetDelegateForFunctionPointer(c, typeof(NvVoid));
        return;
      }
    } catch (Exception) { nvTest = null; nvSpeak = null; nvCancel = null; }
  }
  static bool NvdaUp(){ try { return nvTest != null && nvTest() == 0; } catch (Exception) { return false; } }
  static bool JawsUp(){
    try { if (Process.GetProcessesByName("jfw").Length == 0) return false; if (jaws == null) jaws = Com("FreedomSci.JawsApi"); return jaws != null; }
    catch (Exception) { jaws = null; return false; }
  }
  static void Say(string line){ lock(lk){ Console.Out.WriteLine(line); Console.Out.Flush(); } }
  static string Clean(string t){ return (t ?? "").Replace("\t"," ").Replace("|","/").Replace(";",",").Replace("\r"," ").Replace("\n"," ").Trim(); }
  static dynamic Com(string prog){ return Activator.CreateInstance(Type.GetTypeFromProgID(prog)); }
  static string Lang(dynamic t){
    try { string a = t.GetAttribute("Language"); if (string.IsNullOrEmpty(a)) return "";
      return new CultureInfo(int.Parse(a.Split(';')[0], NumberStyles.HexNumber)).Name; } catch (Exception) { return ""; }
  }
  static string Attr(dynamic t, string n){ try { string a = t.GetAttribute(n); return Clean(a); } catch (Exception) { return ""; } }
  static void Add(StringBuilder sb, string name, string lang, string gender, string kind, string vendor, bool def){
    sb.Append(name).Append('|').Append(lang).Append('|').Append(gender).Append('|').Append(kind).Append('|').Append(def ? "1" : "0").Append('|').Append(vendor).Append(';');
  }
  static void Enumerate(dynamic voice){
    string[] cats = { @"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech\Voices", @"HKEY_CURRENT_USER\SOFTWARE\Microsoft\Speech\Voices",
                      @"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech_OneCore\Voices" };
    var sb = new StringBuilder("voices\t");
    string def = ""; try { def = Clean((string)voice.Voice.GetDescription(0)); } catch (Exception) { }
    foreach (var cat in cats) {
      try {
        dynamic c = Com("SAPI.SpObjectTokenCategory"); c.SetId(cat, false);
        dynamic toks = c.EnumerateTokens();
        int n = toks.Count;
        for (int i = 0; i < n; i++) {
          dynamic t = toks.Item(i); string name = Clean((string)t.GetDescription(0));
          if (string.IsNullOrEmpty(name) || tokens.ContainsKey(name)) continue;
          tokens[name] = t;
          Add(sb, name, Lang(t), Attr(t, "Gender"), cat.Contains("OneCore") ? "onecore" : "sapi", Attr(t, "Vendor"), name == def);
        }
      } catch (Exception) { }
    }
    // Microsoft Speech Platform: своя библиотека Microsoft.Speech, если она стоит.
    try {
      var asm = System.Reflection.Assembly.Load("Microsoft.Speech, Version=11.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35");
      msp = Activator.CreateInstance(asm.GetType("Microsoft.Speech.Synthesis.SpeechSynthesizer"));
      try { msp.SetOutputToDefaultAudioDevice(); } catch (Exception) { }
      foreach (dynamic iv in msp.GetInstalledVoices()) {
        try {
          if (!(bool)iv.Enabled) continue; dynamic vi = iv.VoiceInfo; string name = Clean((string)vi.Name);
          if (string.IsNullOrEmpty(name) || tokens.ContainsKey(name) || platform.Contains(name)) continue;
          platform.Add(name);
          string lang = ""; try { lang = vi.Culture.Name; } catch (Exception) { }
          Add(sb, name, lang, vi.Gender.ToString(), "platform", "Microsoft Speech Platform", false);
        } catch (Exception) { }
      }
    } catch (Exception) { msp = null; }
    // Чтец экрана — только если он запущен: его голосом говорит то, что в нём выбрано.
    if (IntPtr.Size == 8) {
      LoadNvda();
      if (NvdaUp()) Add(sb, NVDA, "ru-RU", "", "sr", "NVDA", false);
      if (JawsUp()) Add(sb, JAWS, "ru-RU", "", "sr", "JAWS", false);
    }
    Say(sb.ToString());
  }
  // Сколько примерно звучит фраза у чтеца экрана: конца речи он не сообщает.
  static int SrMs(string t, int rate){ double cps = 14.0 * Math.Pow(3.0, rate / 10.0); return 350 + (int)(1000.0 * (t ?? "").Length / Math.Max(6.0, cps)); }
  static void SrStop(){ try { if (nvCancel != null) nvCancel(); } catch (Exception) { } try { if (jaws != null) jaws.StopSpeech(); } catch (Exception) { } }
  static void Worker(){
    dynamic v = null; string cur = null; dynamic prompt = null; bool onPlatform = false; string sr = null; DateTime srEnd = DateTime.MinValue;
    try { v = Com("SAPI.SpVoice"); } catch (Exception ex) { Say("fatal " + Clean(ex.Message)); return; }
    Enumerate(v);
    Say("ready");
    while (true) {
      string[] p;
      if (q.TryTake(out p, 25)) {
        if (p == null || p.Length == 0) continue;
        try {
          if (p[0] == "quit") return;
          if (p[0] == "voice" && p.Length > 1) {
            object t;
            if (p[1] == NVDA || p[1] == JAWS) { sr = p[1]; }
            else if (tokens.TryGetValue(p[1], out t)) { v.Voice = (dynamic)t; onPlatform = false; sr = null; }
            else if (msp != null && platform.Contains(p[1])) { msp.SelectVoice(p[1]); onPlatform = true; sr = null; }
          }
          else if (p[0] == "speak" && p.Length > 4) {
            int rate = Math.Max(-10, Math.Min(10, int.Parse(p[2]))), vol = Math.Max(0, Math.Min(100, int.Parse(p[3])));
            if (sr != null) {
              // Голос чтеца экрана: прежняя фраза снимается, новая звучит тем, что выбрано в NVDA или JAWS.
              try { v.Speak("", 1 | 2); } catch (Exception) { }
              SrStop(); prompt = null;
              if (sr == NVDA && nvSpeak != null) nvSpeak(p[4]);
              else if (sr == JAWS && jaws != null) jaws.SayString(p[4], false);
              cur = p[1]; srEnd = DateTime.UtcNow.AddMilliseconds(SrMs(p[4], rate));
            }
            else if (onPlatform && msp != null) {
              try { v.Speak("", 1 | 2); } catch (Exception) { }
              msp.SpeakAsyncCancelAll(); msp.Rate = rate; msp.Volume = vol; prompt = msp.SpeakAsync(p[4]); cur = p[1];
            } else {
              if (msp != null) { try { msp.SpeakAsyncCancelAll(); } catch (Exception) { } }
              prompt = null; v.Rate = rate; v.Volume = vol;
              // 1 — не ждать, 2 — снять недосказанное (как QUEUE_FLUSH на Android), 16 — текст не разметка.
              v.Speak(p[4], 1 | 2 | 16); cur = p[1];
            }
          } else if (p[0] == "stop") {
            cur = null; prompt = null;
            if (sr != null) SrStop();
            try { v.Speak("", 1 | 2); } catch (Exception) { }
            if (msp != null) { try { msp.SpeakAsyncCancelAll(); } catch (Exception) { } }
          }
          else if (p[0] == "wav" && p.Length > 3) {
            object t;
            if (msp != null && platform.Contains(p[2])) {
              msp.SelectVoice(p[2]); msp.SetOutputToWaveFile(p[1]); msp.Speak(p[3]); msp.SetOutputToDefaultAudioDevice();
              Say("wav ok");
            } else {
              dynamic w = Com("SAPI.SpVoice");
              if (p[2] != "" && tokens.TryGetValue(p[2], out t)) w.Voice = (dynamic)t;
              dynamic fs = Com("SAPI.SpFileStream"); dynamic fmt = Com("SAPI.SpAudioFormat"); fmt.Type = 22; fs.Format = fmt; fs.Open(p[1], 3, false);
              w.AudioOutputStream = fs; w.Speak(p[3], 16); fs.Close();
              Say("wav ok");
            }
          }
        } catch (Exception ex) { if (p[0] == "wav") Say("wav fail " + Clean(ex.Message)); else Say("error " + (p.Length > 1 ? p[1] : "") + " " + Clean(ex.Message)); if (p[0] == "speak") { cur = null; prompt = null; } }
      }
      if (cur != null) {
        try {
          bool fin = sr != null ? DateTime.UtcNow >= srEnd : prompt != null ? (bool)prompt.IsCompleted : (bool)v.WaitUntilDone(0);
          if (fin) { Say("done " + cur); cur = null; prompt = null; }
        } catch (Exception) { Say("error " + cur); cur = null; prompt = null; }
      }
    }
  }
  public static void Run(){
    var th = new Thread(Worker); th.IsBackground = true; th.SetApartmentState(ApartmentState.MTA); th.Start();
    string line;
    while ((line = Console.In.ReadLine()) != null) q.Add(line.Split('\t'));
    q.Add(new string[] { "quit" }); th.Join(2000);
  }
}`;
// Сборка кода моста (Add-Type) на обычном компьютере занимает от пяти до
// двадцати секунд, а при двух процессах сразу — и дольше. Прежде мост собирался
// заново при каждом запуске и не успевал к открытию игры: игра оставалась с
// голосами, которые видит сам Chromium, — только голосами Microsoft, без RHVoice,
// Acapela и прочих SAPI 5. Теперь собранная библиотека кладётся во временную
// папку (своя для 32 и 64 бит, в имени — отпечаток кода) и со второго запуска
// поднимается мгновенно.
const crypto = require('crypto');
const TAG = crypto.createHash('sha1').update(CS).digest('hex').slice(0, 10);
const PS1 = `
param([string]$Dll)
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ok = $false
if ($Dll -and (Test-Path $Dll)) { try { Add-Type -Path $Dll; $ok = $true } catch { $ok = $false } }
if (-not $ok) {
  $src = @'
${CS}
'@
  $built = $false
  if ($Dll) { try { Add-Type -ReferencedAssemblies System.Core, Microsoft.CSharp -TypeDefinition $src -OutputAssembly $Dll -OutputType Library; Add-Type -Path $Dll; $built = $true } catch { $built = $false } }
  if (-not $built) { Add-Type -ReferencedAssemblies System.Core, Microsoft.CSharp -TypeDefinition $src }
}
[GraniSapi]::Run()
`;

// Один процесс PowerShell с его голосами (64- или 32-битный).
class Proc {
  constructor(exe, bits) { this.exe = exe; this.bits = bits; this.proc = null; this.ready = false; this.voices = []; this.buf = ''; this.waiters = []; this.onDone = null; }
  start(file, timeoutMs, dll, env) {
    return new Promise(resolve => {
      let settled = false; const done = ok => { if (!settled) { settled = true; resolve(ok); } };
      this.why = ''; this.err = '';
      try { this.proc = spawn(this.exe, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', file, '-Dll', dll || ''], { windowsHide: true, env: env || process.env }); }
      catch (e) { this.why = 'PowerShell не запустился: ' + (e && e.message || e); return done(false); }
      this.proc.on('error', e => { this.why = 'PowerShell не запустился: ' + (e && e.message || e); done(false); });
      this.proc.on('exit', code => { if (!this.ready && !this.why) this.why = 'мост закрылся (код ' + code + ')' + (this.err ? ': ' + this.err.slice(-300) : ''); this.ready = false; done(false); });
      this.proc.stdin.on('error', () => { });
      // Ошибки PowerShell (сборка моста, запрет сценариев, антивирус) — для причины сбоя.
      try { this.proc.stderr.setEncoding('utf8'); this.proc.stderr.on('data', d => { this.err = (this.err + d).slice(-2000); }); } catch (_) { }
      this.proc.stdout.setEncoding('utf8');
      this.proc.stdout.on('data', d => {
        this.buf += d; let i;
        while ((i = this.buf.indexOf('\n')) >= 0) { const line = this.buf.slice(0, i).replace(/\r$/, ''); this.buf = this.buf.slice(i + 1); this.line(line, done); }
      });
      setTimeout(() => { if (!this.ready && !this.why) this.why = 'мост не ответил за ' + Math.round(timeoutMs / 1000) + ' с' + (this.err ? ': ' + this.err.slice(-300) : ''); done(this.ready && this.voices.length > 0); }, timeoutMs);
    });
  }
  line(l, done) {
    if (l.startsWith('voices\t')) {
      this.voices = l.slice(7).split(';').filter(Boolean).map(x => {
        const [name, lang, gender, kind, def, vendor] = x.split('|');
        return { name, lang, gender, kind: kind === 'sapi' && this.bits === 32 ? 'sapi32' : kind, default: def === '1', vendor: vendor || '' };
      });
      return;
    }
    if (l === 'ready') { this.ready = true; if (done) done(this.voices.length > 0); if (this.onReady) this.onReady(); return; }
    if (l.startsWith('fatal')) { this.ready = false; this.why = 'голоса Windows недоступны: ' + l.slice(6); if (done) done(false); return; }
    const m = /^(done|cancel|error) (\S*)/.exec(l);
    if (m) { if (this.onDone && m[2]) this.onDone(m[1], m[2]); return; }
    if (l === 'wav ok' || l.startsWith('wav fail')) { const w = this.waiters.shift(); if (w) w(l === 'wav ok' ? true : l); }
  }
  send(...parts) { try { if (this.proc && this.proc.stdin.writable) this.proc.stdin.write(parts.map(x => String(x).replace(/[\t\r\n]+/g, ' ')).join('\t') + '\n'); } catch (_) { } }
  quit() { try { this.send('quit'); if (this.proc) { this.proc.stdin.end(); setTimeout(() => { try { this.proc.kill(); } catch (_) { } }, 500); } } catch (_) { } }
}

const ENGINE = { sapi: 'SAPI 5', sapi32: 'SAPI 5, 32 бит', onecore: 'Windows', platform: 'Speech Platform', sr: 'чтец экрана' };
// Папка для временных файлов моста без кириллицы и пробелов: сборщик C#
// (csc), которым PowerShell собирает мост, на пути вида
// C:\Users\Никита\AppData\Local\Temp иногда спотыкается, и мост не поднимался.
function asciiTmp() {
  const t = os.tmpdir();
  if (/^[\x21-\x7e\\:]+$/.test(t)) return t;
  for (const base of [process.env.ProgramData, process.env.PUBLIC, 'C:\\ProgramData']) {
    if (!base || !/^[\x21-\x7e\\:]+$/.test(base)) continue;
    const d = path.join(base, 'GraniMirov', 'tmp');
    try { fs.mkdirSync(d, { recursive: true }); fs.accessSync(d, fs.constants.W_OK); return d; } catch (_) { }
  }
  return t;
}
// Готовый мост, собранный при сборке приложения (sapi-build.js): у игрока
// ничего не компилируется — голоса Windows отвечают за секунду, без сборщика C#.
function shippedDll() {
  for (const d of [path.join(__dirname, 'sapi'), path.join(process.resourcesPath || '', 'sapi')]) {
    const f = path.join(d, 'grani-sapi-' + TAG + '.dll');
    try { if (fs.existsSync(f)) return f; } catch (_) { }
  }
  return '';
}
// Библиотека NVDA для голоса чтеца экрана (desktop/sr, кладётся при сборке).
function srDir() {
  for (const d of [path.join(__dirname, 'sr'), path.join(process.resourcesPath || '', 'sr')]) { try { if (fs.existsSync(d)) return d; } catch (_) { } }
  return '';
}

class Sapi {
  constructor() { this.procs = []; this.ready = false; this.voices = []; this.owner = new Map(); this.speaking = new Set(); this.onDone = null; this.onChange = null; this.cur = null; this.why = ''; }
  // Почему голоса Windows не подключились — игрок слышит это в настройках.
  diag() {
    if (process.platform !== 'win32') return 'не Windows';
    const parts = this.procs.map(p => p.bits + ' бит: ' + (p.ready ? 'голосов ' + p.voices.length : (p.why || 'поднимается')));
    return (this.ready ? 'голоса Windows подключены, голосов ' + this.voices.length : 'голоса Windows не подключены' + (this.why ? ' (' + this.why + ')' : '')) +
      (parts.length ? '; ' + parts.join('; ') : '') + (shippedDll() ? '; мост готовый' : '; мост собирается на месте');
  }
  // «Перечитать голоса»: мост, который не поднялся, запускается заново.
  restart(timeoutMs = 15000) {
    if (this.ready && this.procs.every(p => p.ready)) return Promise.resolve(this.merge());
    this.procs.forEach(p => { if (!p.ready) p.quit(); });
    const keep = this.procs.filter(p => p.ready);
    return this.start(timeoutMs, keep);
  }
  start(timeoutMs = 6000, keep) {
    if (process.platform !== 'win32') return Promise.resolve(false);
    const tmp = asciiTmp();
    const file = path.join(tmp, 'grani-sapi.ps1');
    try { fs.writeFileSync(file, '\uFEFF' + PS1, 'utf8'); } catch (e) { this.why = 'не записан сценарий моста: ' + (e && e.message || e); return Promise.resolve(false); }
    const env = Object.assign({}, process.env, { TEMP: tmp, TMP: tmp });
    const sd = srDir(); if (sd) env.GRANI_SR_DIR = sd;
    const root = process.env.SystemRoot || 'C:\\Windows';
    const ps64 = path.join(root, process.arch === 'ia32' ? 'Sysnative' : 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const ps32 = path.join(root, 'SysWOW64', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const keepBits = new Set((keep || []).map(p => p.bits));
    const fresh = [];
    if (!keepBits.has(64)) fresh.push(new Proc(fs.existsSync(ps64) ? ps64 : 'powershell.exe', 64));
    if (!keepBits.has(32) && fs.existsSync(ps32)) fresh.push(new Proc(ps32, 32));
    this.procs = (keep || []).concat(fresh).sort((a, b) => b.bits - a.bits);
    fresh.forEach(p => { p.onDone = (kind, id) => { this.speaking.delete(id); if (this.onDone) this.onDone(kind, id); }; });
    // Процесс, ответивший позже срока, всё равно добавляет свои голоса — и
    // игра узнаёт об этом сразу (onChange), а не со следующего запуска.
    fresh.forEach(p => { p.onReady = () => { const was = this.voices.length; this.merge(); if (this.onChange && this.voices.length !== was) this.onChange(); }; });
    const cached = fresh.every(p => fs.existsSync(this.dll(p.bits)));
    // Мост собирается на месте только без готовой библиотеки — тогда ждём дольше.
    const wait = cached ? timeoutMs : Math.max(timeoutMs, 30000);
    return Promise.all(fresh.map(p => p.start(file, wait, this.dll(p.bits), env).catch(() => false))).then(() => {
      const ok = this.merge();
      if (!ok) this.why = fresh.map(p => p.why).filter(Boolean).join('; ') || this.why;
      return ok;
    });
  }
  dll(bits) { return shippedDll() || path.join(asciiTmp(), 'grani-sapi-' + TAG + '-' + bits + '.dll'); }
  merge() {
    // Голос, который видят оба процесса, говорит 64-битный.
    this.voices = []; this.owner.clear();
    for (const p of this.procs) for (const v of p.voices) {
      if (this.owner.has(v.name)) continue;
      this.owner.set(v.name, p); this.voices.push(v);
    }
    this.ready = this.voices.length > 0;
    if (this.ready) this.why = '';
    if (!this.cur || !this.owner.has(this.cur)) { const d = this.voices.find(v => v.default) || this.voices[0]; this.cur = d ? d.name : null; }
    return this.ready;
  }
  proc(name) { return this.owner.get(name || this.cur) || this.procs[0]; }
  // Темп игры (шкала Web Speech: единица — обычный) — в шкалу SAPI (−10…10)
  // так же, как это делает Chromium: десять у SAPI — втрое быстрее обычного.
  static rate(r) { r = Number(r) || 1; return Math.round(Math.max(-10, Math.min(10, 10 * Math.log(r) / Math.log(3)))); }
  speak(text, rate, volume, id) {
    this.speaking.clear(); this.speaking.add(String(id));
    const p = this.proc();
    this.procs.forEach(o => { if (o !== p) o.send('stop'); });
    p.send('speak', id, Sapi.rate(rate), Math.round(Math.max(0, Math.min(1, volume >= 0 ? volume : 1)) * 100), text);
  }
  stop() { this.speaking.clear(); this.procs.forEach(p => p.send('stop')); }
  setVoice(name) { if (!this.owner.has(name)) return; this.cur = name; this.proc(name).send('voice', name); }
  wav(file, text, voice) {
    const p = this.proc(voice);
    return new Promise(r => { p.waiters.push(r); p.send('wav', file, voice || '', text); setTimeout(() => r(false), 20000); });
  }
  list() {
    return this.voices.map(v => ({ id: v.name, name: v.name, lang: v.lang, gender: v.gender, local: true, default: v.name === this.cur && !!v.default,
      engine: (ENGINE[v.kind] || 'SAPI 5') + (v.vendor && !/^microsoft/i.test(v.vendor) ? ', ' + v.vendor : '') }));
  }
  quit() { this.procs.forEach(p => p.quit()); }
}
module.exports = { Sapi, CS_SOURCE: CS, TAG };
