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
public static class GraniSapi {
  static object lk = new object();
  static BlockingCollection<string[]> q = new BlockingCollection<string[]>();
  static Dictionary<string, object> tokens = new Dictionary<string, object>();
  static HashSet<string> platform = new HashSet<string>();
  static dynamic msp = null;
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
    Say(sb.ToString());
  }
  static void Worker(){
    dynamic v = null; string cur = null; dynamic prompt = null; bool onPlatform = false;
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
            if (tokens.TryGetValue(p[1], out t)) { v.Voice = (dynamic)t; onPlatform = false; }
            else if (msp != null && platform.Contains(p[1])) { msp.SelectVoice(p[1]); onPlatform = true; }
          }
          else if (p[0] == "speak" && p.Length > 4) {
            int rate = Math.Max(-10, Math.Min(10, int.Parse(p[2]))), vol = Math.Max(0, Math.Min(100, int.Parse(p[3])));
            if (onPlatform && msp != null) {
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
          bool fin = prompt != null ? (bool)prompt.IsCompleted : (bool)v.WaitUntilDone(0);
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
const PS1 = `
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -ReferencedAssemblies System.Core, Microsoft.CSharp -TypeDefinition @'
${CS}
'@
[GraniSapi]::Run()
`;

// Один процесс PowerShell с его голосами (64- или 32-битный).
class Proc {
  constructor(exe, bits) { this.exe = exe; this.bits = bits; this.proc = null; this.ready = false; this.voices = []; this.buf = ''; this.waiters = []; this.onDone = null; }
  start(file, timeoutMs) {
    return new Promise(resolve => {
      let settled = false; const done = ok => { if (!settled) { settled = true; resolve(ok); } };
      try { this.proc = spawn(this.exe, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', file], { windowsHide: true }); }
      catch (_) { return done(false); }
      this.proc.on('error', () => done(false));
      this.proc.on('exit', () => { this.ready = false; done(false); });
      this.proc.stdin.on('error', () => { });
      this.proc.stdout.setEncoding('utf8');
      this.proc.stdout.on('data', d => {
        this.buf += d; let i;
        while ((i = this.buf.indexOf('\n')) >= 0) { const line = this.buf.slice(0, i).replace(/\r$/, ''); this.buf = this.buf.slice(i + 1); this.line(line, done); }
      });
      setTimeout(() => done(this.ready && this.voices.length > 0), timeoutMs);
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
    if (l === 'ready') { this.ready = true; if (done) done(this.voices.length > 0); return; }
    if (l.startsWith('fatal')) { this.ready = false; if (done) done(false); return; }
    const m = /^(done|cancel|error) (\S*)/.exec(l);
    if (m) { if (this.onDone && m[2]) this.onDone(m[1], m[2]); return; }
    if (l === 'wav ok' || l.startsWith('wav fail')) { const w = this.waiters.shift(); if (w) w(l === 'wav ok' ? true : l); }
  }
  send(...parts) { try { if (this.proc && this.proc.stdin.writable) this.proc.stdin.write(parts.map(x => String(x).replace(/[\t\r\n]+/g, ' ')).join('\t') + '\n'); } catch (_) { } }
  quit() { try { this.send('quit'); if (this.proc) { this.proc.stdin.end(); setTimeout(() => { try { this.proc.kill(); } catch (_) { } }, 500); } } catch (_) { } }
}

const ENGINE = { sapi: 'SAPI 5', sapi32: 'SAPI 5, 32 бит', onecore: 'Windows', platform: 'Speech Platform' };

class Sapi {
  constructor() { this.procs = []; this.ready = false; this.voices = []; this.owner = new Map(); this.speaking = new Set(); this.onDone = null; this.cur = null; }
  start(timeoutMs = 6000) {
    if (process.platform !== 'win32') return Promise.resolve(false);
    const file = path.join(os.tmpdir(), 'grani-sapi.ps1');
    try { fs.writeFileSync(file, '\uFEFF' + PS1, 'utf8'); } catch (_) { return Promise.resolve(false); }
    const root = process.env.SystemRoot || 'C:\\Windows';
    const ps64 = path.join(root, process.arch === 'ia32' ? 'Sysnative' : 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const ps32 = path.join(root, 'SysWOW64', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    this.procs = [new Proc(fs.existsSync(ps64) ? ps64 : 'powershell.exe', 64)];
    if (fs.existsSync(ps32)) this.procs.push(new Proc(ps32, 32));
    this.procs.forEach(p => { p.onDone = (kind, id) => { this.speaking.delete(id); if (this.onDone) this.onDone(kind, id); }; });
    return Promise.all(this.procs.map(p => p.start(file, timeoutMs).catch(() => false))).then(() => {
      // Голос, который видят оба процесса, говорит 64-битный.
      this.voices = []; this.owner.clear();
      for (const p of this.procs) for (const v of p.voices) {
        if (this.owner.has(v.name)) continue;
        this.owner.set(v.name, p); this.voices.push(v);
      }
      this.ready = this.voices.length > 0;
      const d = this.voices.find(v => v.default) || this.voices[0];
      this.cur = d ? d.name : null;
      return this.ready;
    });
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
module.exports = { Sapi };
