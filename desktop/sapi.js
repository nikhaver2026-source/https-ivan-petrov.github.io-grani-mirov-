// Голоса Windows (SAPI) для игры: тот же мост, что на Android (GraniTTS).
// Постоянный процесс PowerShell держит голос SAPI (SAPI.SpVoice) и
// читает команды построчно: voice, speak, stop, wav (для проверки).
// Если мост не поднялся (нет PowerShell или System.Speech), игра говорит
// голосами, которые Chromium сам берёт у Windows.
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');

const CS = String.raw`
using System; using System.Collections.Generic; using System.Collections.Concurrent; using System.Globalization; using System.Text; using System.Threading;
public static class GraniSapi {
  static object lk = new object();
  static BlockingCollection<string[]> q = new BlockingCollection<string[]>();
  static Dictionary<string, object> tokens = new Dictionary<string, object>();
  static List<string> order = new List<string>();
  static void Say(string line){ lock(lk){ Console.Out.WriteLine(line); Console.Out.Flush(); } }
  static string Clean(string t){ return (t ?? "").Replace("\t"," ").Replace("|","/").Replace(";",",").Replace("\r"," ").Replace("\n"," "); }
  static dynamic Com(string prog){ return Activator.CreateInstance(Type.GetTypeFromProgID(prog)); }
  static string Lang(dynamic t){
    try { string a = t.GetAttribute("Language"); if (string.IsNullOrEmpty(a)) return "";
      return new CultureInfo(int.Parse(a.Split(';')[0], NumberStyles.HexNumber)).Name; } catch (Exception) { return ""; }
  }
  static string Attr(dynamic t, string n){ try { string a = t.GetAttribute(n); return a ?? ""; } catch (Exception) { return ""; } }
  // Голоса SAPI 5 и голоса Windows 10/11 (OneCore), которые ставятся через «Параметры → Время и язык → Речь».
  static void Enumerate(dynamic voice){
    string[] cats = { @"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech\Voices", @"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech_OneCore\Voices",
                      @"HKEY_CURRENT_USER\SOFTWARE\Microsoft\Speech\Voices" };
    var sb = new StringBuilder("voices\t");
    string def = ""; try { def = voice.Voice.GetDescription(0); } catch (Exception) { }
    foreach (var cat in cats) {
      try {
        dynamic c = Com("SAPI.SpObjectTokenCategory"); c.SetId(cat, false);
        dynamic toks = c.EnumerateTokens();
        int n = toks.Count;
        for (int i = 0; i < n; i++) {
          dynamic t = toks.Item(i); string name = Clean((string)t.GetDescription(0));
          if (string.IsNullOrEmpty(name) || tokens.ContainsKey(name)) continue;
          tokens[name] = t; order.Add(name);
          sb.Append(name).Append('|').Append(Lang(t)).Append('|').Append(Attr(t, "Gender")).Append('|')
            .Append(cat.Contains("OneCore") ? "onecore" : "sapi").Append('|').Append(name == Clean(def) ? "1" : "0").Append(';');
        }
      } catch (Exception) { }
    }
    Say(sb.ToString());
  }
  static void Worker(){
    dynamic v = null; string cur = null;
    try { v = Com("SAPI.SpVoice"); } catch (Exception ex) { Say("fatal " + Clean(ex.Message)); return; }
    Enumerate(v);
    Say("ready");
    while (true) {
      string[] p;
      if (q.TryTake(out p, 25)) {
        if (p == null || p.Length == 0) continue;
        try {
          if (p[0] == "quit") return;
          if (p[0] == "voice" && p.Length > 1) { object t; if (tokens.TryGetValue(p[1], out t)) v.Voice = (dynamic)t; }
          else if (p[0] == "speak" && p.Length > 4) {
            v.Rate = Math.Max(-10, Math.Min(10, int.Parse(p[2]))); v.Volume = Math.Max(0, Math.Min(100, int.Parse(p[3])));
            // 1 — не ждать, 2 — снять недосказанное (как QUEUE_FLUSH на Android), 16 — текст не разметка.
            v.Speak(p[4], 1 | 2 | 16); cur = p[1];
          } else if (p[0] == "stop") { v.Speak("", 1 | 2); cur = null; }
          else if (p[0] == "wav" && p.Length > 3) {
            dynamic w = Com("SAPI.SpVoice"); object t;
            if (p[2] != "" && tokens.TryGetValue(p[2], out t)) w.Voice = (dynamic)t;
            dynamic fs = Com("SAPI.SpFileStream"); dynamic fmt = Com("SAPI.SpAudioFormat"); fmt.Type = 22; fs.Format = fmt; fs.Open(p[1], 3, false);
            w.AudioOutputStream = fs; w.Speak(p[3], 16); fs.Close();
            Say("wav ok");
          }
        } catch (Exception ex) { if (p[0] == "wav") Say("wav fail " + Clean(ex.Message)); else Say("error " + (p.Length > 1 ? p[1] : "") + " " + Clean(ex.Message)); if (p[0] == "speak") cur = null; }
      }
      if (cur != null) { try { if ((bool)v.WaitUntilDone(0)) { Say("done " + cur); cur = null; } } catch (Exception) { Say("error " + cur); cur = null; } }
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

class Sapi {
  constructor() { this.proc = null; this.ready = false; this.voices = []; this.speaking = new Set(); this.onDone = null; this.buf = ''; this.waiters = []; }
  start(timeoutMs = 6000) {
    return new Promise(resolve => {
      if (process.platform !== 'win32') return resolve(false);
      let settled = false; const done = ok => { if (!settled) { settled = true; resolve(ok); } };
      try {
        const file = path.join(os.tmpdir(), 'grani-sapi.ps1');
        fs.writeFileSync(file, '﻿' + PS1, 'utf8');
        this.proc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', file], { windowsHide: true });
      } catch (_) { return done(false); }
      this.proc.on('error', () => done(false));
      this.proc.on('exit', () => { this.ready = false; done(false); });
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
        const [name, lang, gender, kind, def] = x.split('|'); return { name, lang, gender, kind, default: def === '1' };
      });
      return;
    }
    if (l === 'ready') { this.ready = true; if (done) done(this.voices.length > 0); return; }
    if (l.startsWith('fatal')) { this.ready = false; if (done) done(false); return; }
    const m = /^(done|cancel|error) (\S*)/.exec(l);
    if (m) { this.speaking.delete(m[2]); if (this.onDone && m[2]) this.onDone(m[1], m[2]); return; }
    if (l === 'wav ok' || l.startsWith('wav fail')) { const w = this.waiters.shift(); if (w) w(l === 'wav ok' ? true : l); }
  }
  send(...parts) { try { if (this.proc && this.proc.stdin.writable) this.proc.stdin.write(parts.map(x => String(x).replace(/[\t\r\n]+/g, ' ')).join('\t') + '\n'); } catch (_) { } }
  // Темп игры (шкала Web Speech: единица — обычный) — в шкалу SAPI (−10…10)
  // так же, как это делает Chromium: десять у SAPI — втрое быстрее обычного.
  static rate(r) { r = Number(r) || 1; return Math.round(Math.max(-10, Math.min(10, 10 * Math.log(r) / Math.log(3)))); }
  speak(text, rate, volume, id) { this.speaking.clear(); this.speaking.add(String(id)); this.send('speak', id, Sapi.rate(rate), Math.round(Math.max(0, Math.min(1, volume >= 0 ? volume : 1)) * 100), text); }
  stop() { this.speaking.clear(); this.send('stop'); }
  setVoice(name) { this.send('voice', name); }
  wav(file, text, voice) { return new Promise(r => { this.waiters.push(r); this.send('wav', file, voice || '', text); setTimeout(() => r(false), 20000); }); }
  list() {
    const def = (this.voices.find(v => v.default) || this.voices[0] || {}).name;
    return this.voices.map(v => ({ id: v.name, name: v.name, lang: v.lang, gender: v.gender, local: true, default: v.name === def,
      engine: v.kind === 'onecore' ? 'Windows' : 'SAPI 5' }));
  }
  quit() { try { this.send('quit'); if (this.proc) { this.proc.stdin.end(); setTimeout(() => { try { this.proc.kill(); } catch (_) { } }, 500); } } catch (_) { } }
}
module.exports = { Sapi };
