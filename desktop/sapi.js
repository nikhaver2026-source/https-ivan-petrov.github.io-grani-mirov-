// Голоса компьютера для игры: тот же мост, что на Android (GraniTTS).
// Мост видит все синтезаторы, установленные в Windows:
//   • SAPI 5 — голоса Microsoft и сторонних движков (RHVoice, Acapela,
//     Vocalizer, Ivona, eSpeak и любые другие со своим голосом SAPI);
//   • 32-битные голоса SAPI 5 (многие старые движки ставятся только так) —
//     их говорит второй, 32-битный процесс;
//   • голоса Windows 10/11 из «Параметры → Время и язык → Речь» (OneCore);
//   • голоса Microsoft Speech Platform (серверные голоса, например Elena);
//   • RHVoice, поставленный дополнением NVDA, и eSpeak NG (из NVDA или
//     отдельной установки) — напрямую, без NVDA.
// Каждый процесс PowerShell держит свои голоса и читает команды построчно:
// voice, speak, stop, wav (для проверки). Если мост не поднялся, игра
// говорит голосами, которые Chromium сам берёт у Windows.
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');

const CS = String.raw`
using System; using System.Collections.Generic; using System.Collections.Concurrent; using System.Globalization; using System.Text; using System.Threading;
using System.Runtime.InteropServices; using System.IO; using System.Diagnostics; using System.Runtime.ExceptionServices; using System.Security;
// ── RHVoice из дополнений NVDA — без NVDA ──
// Дополнение NVDA «RHVoice» несёт открытую библиотеку RHVoice.dll (LGPL), а
// голоса — соседние дополнения «RHVoice-voice-…» (папки data и langdata). Мост
// загружает библиотеку сам и говорит этими голосами, даже когда NVDA не запущен.
public static class GraniRh {
  [DllImport("kernel32", CharSet = CharSet.Unicode, SetLastError = true)] static extern IntPtr LoadLibraryExW(string p, IntPtr h, uint flags);
  [DllImport("kernel32", CharSet = CharSet.Ansi)] static extern IntPtr GetProcAddress(IntPtr h, string n);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int CbRate(int rate, IntPtr ud);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int CbSpeech(IntPtr samples, uint count, IntPtr ud);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate void CbDone(IntPtr ud);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate IntPtr FNew(ref InitParams p);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate uint FCount(IntPtr e);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate IntPtr FList(IntPtr e);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate IntPtr FVer();
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate IntPtr FMsg(IntPtr e, IntPtr text, uint len, int type, ref SynthParams sp, IntPtr ud);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int FSpeak(IntPtr m);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate void FDel(IntPtr m);
  [StructLayout(LayoutKind.Sequential)] struct Callbacks { public IntPtr rate, speech, mark, ws, we, ss, se, audio, done; }
  [StructLayout(LayoutKind.Sequential)] struct InitParams { public IntPtr data, config, res; public Callbacks cb; public uint options; }
  [StructLayout(LayoutKind.Sequential)] struct SynthParams { public IntPtr profile; public double ar, ap, av, rr, rp, rv; public int punct; public IntPtr plist; public int caps; public int flags; }
  [StructLayout(LayoutKind.Sequential)] struct VoiceInfo { public IntPtr lang, name; public int gender; public IntPtr country; }
  [StructLayout(LayoutKind.Sequential)] struct VoiceInfo0 { public IntPtr lang, name; public int gender; }
  public class V { public string Name, Profile, Lang, Gender; }
  public static List<V> Voices = new List<V>();
  public static string Why = "нет дополнения RHVoice";
  static IntPtr eng = IntPtr.Zero; static FMsg fMsg; static FSpeak fSpeak; static FDel fDel;
  static CbRate cbRate; static CbSpeech cbSpeech; static CbDone cbDone;   // держим, пока жив движок
  static int rate = 24000; static List<short> buf; static volatile bool cancel; static Action<short[], int> sink;
  static object synthLock = new object();
  static IntPtr U8(string s){ byte[] b = Encoding.UTF8.GetBytes(s ?? ""); IntPtr p = Marshal.AllocHGlobal(b.Length + 1); Marshal.Copy(b, 0, p, b.Length); Marshal.WriteByte(p, b.Length, 0); return p; }
  static string S8(IntPtr p){ if (p == IntPtr.Zero) return ""; int n = 0; while (Marshal.ReadByte(p, n) != 0 && n < 4096) n++; byte[] b = new byte[n]; Marshal.Copy(p, b, 0, n); return Encoding.UTF8.GetString(b); }
  static IntPtr Fn(IntPtr h, string n){ IntPtr a = GetProcAddress(h, n); if (a == IntPtr.Zero) throw new Exception("нет " + n); return a; }
  static T D<T>(IntPtr h, string n){ return (T)(object)Marshal.GetDelegateForFunctionPointer(Fn(h, n), typeof(T)); }
  // Разрядность библиотеки по заголовку PE: 64 или 32 (0 — не разобрать).
  static int Bits(string f){
    try { using (var fs = File.OpenRead(f)) { var r = new BinaryReader(fs); fs.Seek(0x3C, SeekOrigin.Begin); int pe = r.ReadInt32(); fs.Seek(pe + 4, SeekOrigin.Begin); ushort m = r.ReadUInt16(); return m == 0x8664 ? 64 : m == 0x14c ? 32 : 0; } }
    catch (Exception) { return 0; }
  }
  // Папки дополнений NVDA: установленной (%APPDATA%\nvda\addons) и переносных,
  // если их назвали в GRANI_NVDA_ADDONS (через «;»).
  static List<string> Roots(){
    var r = new List<string>();
    string ad = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
    if (!string.IsNullOrEmpty(ad)) r.Add(Path.Combine(Path.Combine(ad, "nvda"), "addons"));
    string extra = Environment.GetEnvironmentVariable("GRANI_NVDA_ADDONS");
    if (!string.IsNullOrEmpty(extra)) foreach (var x in extra.Split(';')) if (x.Trim() != "") r.Add(x.Trim());
    return r;
  }
  static bool Live(string d){ string n = Path.GetFileName(d).ToLowerInvariant(); return !n.EndsWith(".pendinginstall") && !n.EndsWith(".pendingremove") && !File.Exists(Path.Combine(d, "delete")); }
  [HandleProcessCorruptedStateExceptions, SecurityCritical]
  public static void Load(){ try { LoadRaw(); } catch (Exception ex) { Voices = new List<V>(); Why = "сбой загрузки: " + ex.GetType().Name; } }
  static void LoadRaw(){
    if (eng != IntPtr.Zero) return;
    Voices = new List<V>();
    try {
      var dlls = new List<string>(); var res = new List<string>();
      var rx = new System.Text.RegularExpressions.Regex("^RHVoice-.*(voice|language).*", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
      foreach (var root in Roots()) {
        if (!Directory.Exists(root)) continue;
        foreach (var d in Directory.GetDirectories(root)) {
          if (!Live(d)) continue;
          string sd = Path.Combine(d, "synthDrivers");
          if (Directory.Exists(sd)) foreach (var f in Directory.GetFiles(sd, "RHVoice.dll", SearchOption.AllDirectories)) dlls.Add(f);
          if (rx.IsMatch(Path.GetFileName(d))) foreach (var n in new string[] { "data", "langdata", "lang2data" }) { string x = Path.Combine(d, n); if (Directory.Exists(x)) res.Add(x); }
        }
      }
      if (dlls.Count == 0) { Why = "нет дополнения RHVoice для NVDA"; return; }
      int want = IntPtr.Size == 8 ? 64 : 32; string dll = null; bool has64 = false;
      foreach (var f in dlls) { int b = Bits(f); if (b == 64) has64 = true; if (b == want && dll == null) dll = f; }
      // 32-битный процесс не дублирует голоса, которые скажет 64-битный.
      if (want == 32 && has64) { Why = "говорит 64-битный мост"; return; }
      if (dll == null) { Why = "нет библиотеки RHVoice на " + want + " бит"; return; }
      if (res.Count == 0) { Why = "нет голосов RHVoice (дополнения RHVoice-voice-…)"; return; }
      IntPtr h = LoadLibraryExW(dll, IntPtr.Zero, 8);
      if (h == IntPtr.Zero) { Why = "библиотека RHVoice не загрузилась (" + Marshal.GetLastWin32Error() + ")"; return; }
      FNew fNew = D<FNew>(h, "RHVoice_new_tts_engine");
      FCount fNV = D<FCount>(h, "RHVoice_get_number_of_voices"); FList fV = D<FList>(h, "RHVoice_get_voices");
      FCount fNP = D<FCount>(h, "RHVoice_get_number_of_voice_profiles"); FList fP = D<FList>(h, "RHVoice_get_voice_profiles");
      fMsg = D<FMsg>(h, "RHVoice_new_message"); fSpeak = D<FSpeak>(h, "RHVoice_speak"); fDel = D<FDel>(h, "RHVoice_delete_message");
      int major = 1; try { string ver = S8(D<FVer>(h, "RHVoice_get_version")()); int.TryParse(ver.Split('.')[0], out major); } catch (Exception) { }
      string ad = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
      // Своя папка настроек: RHVoice.ini из NVDA (голоса, словари) переносится,
      // а предел темпа поднят до пяти — иначе RHVoice не говорит быстрее
      // двукратного и отстаёт от записей Gemini.
      string nvc = Path.Combine(Path.Combine(ad, "nvda"), "RHVoice-config");
      string cfg = Path.Combine(Path.GetTempPath(), "grani-rhvoice");
      try {
        Directory.CreateDirectory(cfg);
        var ini = new StringBuilder();
        string src = Path.Combine(nvc, "RHVoice.ini");
        if (File.Exists(src)) foreach (string ln in File.ReadAllLines(src)) { string k = ln.Trim().ToLowerInvariant(); if (!k.StartsWith("max_rate") && !k.StartsWith("max_volume")) ini.AppendLine(ln); }
        ini.AppendLine("max_rate=5"); ini.AppendLine("max_volume=2");
        File.WriteAllText(Path.Combine(cfg, "RHVoice.ini"), ini.ToString());
        if (Directory.Exists(Path.Combine(nvc, "dicts")) && !Directory.Exists(Path.Combine(cfg, "dicts"))) {
          string dd = Path.Combine(cfg, "dicts"); Directory.CreateDirectory(dd);
          foreach (string f in Directory.GetFiles(Path.Combine(nvc, "dicts"), "*", SearchOption.AllDirectories)) {
            string to = Path.Combine(dd, f.Substring(Path.Combine(nvc, "dicts").Length).TrimStart('\\', '/'));
            Directory.CreateDirectory(Path.GetDirectoryName(to)); File.Copy(f, to, true);
          }
        }
      } catch (Exception) { if (Directory.Exists(nvc)) cfg = nvc; }
      var ip = new InitParams(); ip.config = U8(cfg);
      ip.res = Marshal.AllocHGlobal(IntPtr.Size * (res.Count + 1));
      for (int i = 0; i < res.Count; i++) Marshal.WriteIntPtr(ip.res, i * IntPtr.Size, U8(res[i]));
      Marshal.WriteIntPtr(ip.res, res.Count * IntPtr.Size, IntPtr.Zero);
      cbRate = new CbRate(OnRate); cbSpeech = new CbSpeech(OnSpeech); cbDone = new CbDone(OnDone);
      ip.cb.rate = Marshal.GetFunctionPointerForDelegate(cbRate); ip.cb.speech = Marshal.GetFunctionPointerForDelegate(cbSpeech); ip.cb.done = Marshal.GetFunctionPointerForDelegate(cbDone);
      IntPtr e = fNew(ref ip);
      if (e == IntPtr.Zero) { Why = "движок RHVoice не поднялся"; return; }
      var lang = new Dictionary<string, string>(); var gen = new Dictionary<string, string>();
      uint nv = fNV(e); IntPtr vi = fV(e);
      int sz = major >= 1 ? Marshal.SizeOf(typeof(VoiceInfo)) : Marshal.SizeOf(typeof(VoiceInfo0));
      for (int i = 0; i < nv; i++) {
        IntPtr at = new IntPtr(vi.ToInt64() + (long)i * sz); string nm, lg, ct = ""; int g;
        if (major >= 1) { var v = (VoiceInfo)Marshal.PtrToStructure(at, typeof(VoiceInfo)); nm = S8(v.name); lg = S8(v.lang); g = v.gender; ct = S8(v.country); }
        else { var v = (VoiceInfo0)Marshal.PtrToStructure(at, typeof(VoiceInfo0)); nm = S8(v.name); lg = S8(v.lang); g = v.gender; }
        lang[nm] = lg + (ct != "" ? "-" + ct.ToUpperInvariant() : (lg == "ru" ? "-RU" : ""));
        gen[nm] = g == 1 ? "Male" : g == 2 ? "Female" : "";
      }
      uint np = fNP(e); IntPtr pl = fP(e);
      for (int i = 0; i < np; i++) {
        string prof = S8(Marshal.ReadIntPtr(pl, i * IntPtr.Size)); if (prof == "") continue;
        string first = prof.Split('+')[0]; var w = new V(); w.Profile = prof; w.Name = prof.Replace("+", " и ") + " — RHVoice";
        w.Lang = lang.ContainsKey(first) ? lang[first] : ""; w.Gender = gen.ContainsKey(first) ? gen[first] : "";
        Voices.Add(w);
      }
      eng = e; Why = "голосов " + Voices.Count;
    } catch (Exception ex) { Why = "ошибка: " + ex.Message; Voices = new List<V>(); }
  }
  static int OnRate(int r, IntPtr ud){ rate = r; return 1; }
  // Темп игры (r) — в настоящий множитель: тот же, с каким звучат записи Gemini.
  public static double Tempo(double r){ if (r <= 0) r = 1; return r <= 1 ? r : 1 + (r - 1) * 0.45; }
  static int OnSpeech(IntPtr s, uint c, IntPtr ud){
    if (cancel) return 0; var a = new short[c]; Marshal.Copy(s, a, 0, (int)c);
    if (sink != null) { try { sink(a, rate); } catch (Exception) { } } else if (buf != null) buf.AddRange(a);
    return 1;
  }
  static void OnDone(IntPtr ud){ }
  public static void Cancel(){ cancel = true; }
  // PCM 16 бит. С приёмником (snk) звук отдаётся кусками по мере синтеза и
  // начинает звучать сразу, не дожидаясь конца фразы; без него — фраза целиком.
  [HandleProcessCorruptedStateExceptions, SecurityCritical]
  public static short[] Synth(string profile, string text, double r, int vol, Action<short[], int> snk, out int sr){
    sr = rate;
    try { return SynthRaw(profile, text, r, vol, snk, out sr); }
    catch (Exception ex) { eng = IntPtr.Zero; Voices = new List<V>(); Why = "сбой RHVoice: " + ex.GetType().Name; return null; }
  }
  static short[] SynthRaw(string profile, string text, double r, int vol, Action<short[], int> snk, out int sr){
    lock (synthLock) {
      buf = new List<short>(); sink = snk; cancel = false; sr = rate;
      if (eng == IntPtr.Zero) return null;
      var sp = new SynthParams(); sp.profile = U8(profile);
      // r — во сколько раз быстрее обычного (как у записей Gemini). Обычный темп
      // RHVoice — 1, предел — 5 (см. RHVoice.ini выше); громкость 100 — обычная, 200 — вдвое.
      double k = Tempo(r);
      sp.ar = k >= 1 ? Math.Min(1.0, (k - 1) / 4.0) : Math.Max(-1.0, (k - 1) / 0.5); sp.rr = k > 5 ? k / 5 : 1;
      sp.av = Math.Max(-1.0, Math.Min(1.0, (vol - 100) / 100.0)); sp.rp = 1; sp.rv = 1;
      IntPtr t = U8(text); uint len = (uint)Encoding.UTF8.GetByteCount(text ?? "");
      try { IntPtr m = fMsg(eng, t, len, 0, ref sp, IntPtr.Zero); if (m != IntPtr.Zero) { fSpeak(m); fDel(m); } }
      finally { Marshal.FreeHGlobal(t); Marshal.FreeHGlobal(sp.profile); }
      sr = rate; short[] o = cancel ? null : buf.ToArray(); buf = null; sink = null; return o;
    }
  }
  public static byte[] Wav(short[] s, int sr){
    var ms = new MemoryStream(); var w = new BinaryWriter(ms); int n = s.Length * 2;
    w.Write(Encoding.ASCII.GetBytes("RIFF")); w.Write(36 + n); w.Write(Encoding.ASCII.GetBytes("WAVEfmt ")); w.Write(16); w.Write((short)1); w.Write((short)1);
    w.Write(sr); w.Write(sr * 2); w.Write((short)2); w.Write((short)16); w.Write(Encoding.ASCII.GetBytes("data")); w.Write(n);
    foreach (short x in s) w.Write(x); w.Flush(); return ms.ToArray();
  }
}
// ── eSpeak NG без NVDA ──
// Тот, что лежит в NVDA (synthDrivers\espeak.dll), и отдельно поставленный
// eSpeak NG (Program Files\eSpeak NG\libespeak-ng.dll). Голоса — русский и
// английский; звук отдаётся так же, как у RHVoice.
public static class GraniEs {
  [DllImport("kernel32", CharSet = CharSet.Unicode, SetLastError = true)] static extern IntPtr LoadLibraryExW(string p, IntPtr h, uint flags);
  [DllImport("kernel32", CharSet = CharSet.Ansi)] static extern IntPtr GetProcAddress(IntPtr h, string n);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int Cb(IntPtr wav, int n, IntPtr ev);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int FInit(int output, int buflen, IntPtr path, int options);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate void FSetCb(Cb cb);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate IntPtr FList(IntPtr spec);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int FVoice(IntPtr name);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int FParam(int p, int v, int rel);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int FSynth(IntPtr text, UIntPtr size, uint pos, int ptype, uint end, uint flags, IntPtr uid, IntPtr ud);
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)] delegate int FSync();
  public class V { public string Name, Id, Lang, Gender; }
  public static List<V> Voices = new List<V>();
  public static string Why = "нет eSpeak";
  static bool up = false; static Cb cb; static FVoice fVoice; static FParam fParam; static FSynth fSynth; static FSync fSync;
  static int rate = 22050; static List<short> buf; static volatile bool cancel; static Action<short[], int> sink; static object lk = new object();
  static IntPtr U8(string s){ byte[] b = Encoding.UTF8.GetBytes(s ?? ""); IntPtr p = Marshal.AllocHGlobal(b.Length + 1); Marshal.Copy(b, 0, p, b.Length); Marshal.WriteByte(p, b.Length, 0); return p; }
  static string S8(IntPtr p){ if (p == IntPtr.Zero) return ""; int n = 0; while (Marshal.ReadByte(p, n) != 0 && n < 4096) n++; byte[] b = new byte[n]; Marshal.Copy(p, b, 0, n); return Encoding.UTF8.GetString(b); }
  static T D<T>(IntPtr h, string n){ IntPtr a = GetProcAddress(h, n); if (a == IntPtr.Zero) throw new Exception("нет " + n); return (T)(object)Marshal.GetDelegateForFunctionPointer(a, typeof(T)); }
  static int Bits(string f){
    try { using (var fs = File.OpenRead(f)) { var r = new BinaryReader(fs); fs.Seek(0x3C, SeekOrigin.Begin); int pe = r.ReadInt32(); fs.Seek(pe + 4, SeekOrigin.Begin); ushort m = r.ReadUInt16(); return m == 0x8664 ? 64 : m == 0x14c ? 32 : 0; } }
    catch (Exception) { return 0; }
  }
  [HandleProcessCorruptedStateExceptions, SecurityCritical]
  public static void Load(){ try { LoadRaw(); } catch (Exception ex) { Voices = new List<V>(); Why = "сбой загрузки: " + ex.GetType().Name; } }
  static void LoadRaw(){
    if (up) return;
    Voices = new List<V>();
    try {
      var c = new List<string>();
      foreach (var pf in new string[] { Environment.GetEnvironmentVariable("ProgramFiles"), Environment.GetEnvironmentVariable("ProgramFiles(x86)"), Environment.GetEnvironmentVariable("ProgramW6432") }) {
        if (string.IsNullOrEmpty(pf)) continue;
        c.Add(Path.Combine(Path.Combine(pf, "eSpeak NG"), "libespeak-ng.dll"));
        c.Add(Path.Combine(Path.Combine(Path.Combine(pf, "NVDA"), "synthDrivers"), "espeak.dll"));
      }
      string extra = Environment.GetEnvironmentVariable("GRANI_ESPEAK_DLL"); if (!string.IsNullOrEmpty(extra)) c.Insert(0, extra);
      int want = IntPtr.Size == 8 ? 64 : 32; string dll = null; bool has64 = false; bool any = false;
      foreach (var f in c) {
        if (!File.Exists(f) || !Directory.Exists(Path.Combine(Path.GetDirectoryName(f), "espeak-ng-data"))) continue;
        any = true; int b = Bits(f); if (b == 64) has64 = true; if (b == want && dll == null) dll = f;
      }
      if (!any) { Why = "eSpeak NG не установлен"; return; }
      if (want == 32 && has64) { Why = "говорит 64-битный мост"; return; }
      if (dll == null) { Why = "нет eSpeak на " + want + " бит"; return; }
      IntPtr h = LoadLibraryExW(dll, IntPtr.Zero, 8);
      if (h == IntPtr.Zero) { Why = "eSpeak не загрузился (" + Marshal.GetLastWin32Error() + ")"; return; }
      FInit fInit = D<FInit>(h, "espeak_Initialize"); FSetCb fSetCb = D<FSetCb>(h, "espeak_SetSynthCallback"); FList fList = D<FList>(h, "espeak_ListVoices");
      fVoice = D<FVoice>(h, "espeak_SetVoiceByName"); fParam = D<FParam>(h, "espeak_SetParameter"); fSynth = D<FSynth>(h, "espeak_Synth"); fSync = D<FSync>(h, "espeak_Synchronize");
      // 2 — синхронный вывод в обратный вызов; 0x8000 — не закрывать процесс при ошибке данных.
      int sr = fInit(2, 0, U8(Path.GetDirectoryName(dll)), 0x8000);
      if (sr <= 0) { Why = "eSpeak не поднялся"; return; }
      rate = sr; cb = new Cb(OnWav); fSetCb(cb);
      IntPtr arr = fList(IntPtr.Zero);
      for (int i = 0; arr != IntPtr.Zero && i < 2000; i++) {
        IntPtr vp = Marshal.ReadIntPtr(arr, i * IntPtr.Size); if (vp == IntPtr.Zero) break;
        string name = S8(Marshal.ReadIntPtr(vp, 0)); IntPtr lp = Marshal.ReadIntPtr(vp, IntPtr.Size);
        string lang = lp == IntPtr.Zero ? "" : S8(new IntPtr(lp.ToInt64() + 1)).ToLowerInvariant();
        string ident = S8(Marshal.ReadIntPtr(vp, 2 * IntPtr.Size)).ToLowerInvariant().Replace('\\', '/');
        byte g = Marshal.ReadByte(vp, 3 * IntPtr.Size);
        // Только настоящие голоса: варианты (!v/…) и голоса MBROLA (mb/…) без
        // самой MBROLA роняли библиотеку.
        if (ident.StartsWith("!v") || ident.StartsWith("mb/") || ident.Contains("/mb-") || name.ToLowerInvariant().Contains("mbrola")) continue;
        if (!(lang == "ru" || lang.StartsWith("ru-") || lang == "en" || lang == "en-gb" || lang == "en-us")) continue;
        var w = new V(); w.Id = name; w.Name = "eSpeak NG — " + name; w.Lang = lang == "ru" ? "ru-RU" : lang == "en" ? "en-GB" : lang; w.Gender = g == 1 ? "Male" : g == 2 ? "Female" : "";
        Voices.Add(w);
      }
      up = true; Why = "голосов " + Voices.Count;
    } catch (Exception ex) { Why = "ошибка: " + ex.Message; Voices = new List<V>(); }
  }
  static int OnWav(IntPtr wav, int n, IntPtr ev){
    if (cancel) return 1;
    if (wav != IntPtr.Zero && n > 0) {
      var a = new short[n]; Marshal.Copy(wav, a, 0, n);
      if (sink != null) { try { sink(a, rate); } catch (Exception) { } } else if (buf != null) buf.AddRange(a);
    }
    return 0;
  }
  public static void Cancel(){ cancel = true; }
  // Сбой внутри чужой библиотеки (нарушение доступа) не роняет мост: движок
  // помечается неисправным, остальные голоса говорят дальше.
  [HandleProcessCorruptedStateExceptions, SecurityCritical]
  public static short[] Synth(string voice, string text, double r, int vol, Action<short[], int> snk, out int sr){
    sr = rate;
    try { return SynthRaw(voice, text, r, vol, snk, out sr); }
    catch (Exception ex) { up = false; Voices = new List<V>(); Why = "сбой eSpeak: " + ex.GetType().Name; return null; }
  }
  static short[] SynthRaw(string voice, string text, double r, int vol, Action<short[], int> snk, out int sr){
    lock (lk) {
      buf = new List<short>(); sink = snk; cancel = false; sr = rate;
      if (!up) return null;
      IntPtr vn = U8(voice); try { fVoice(vn); } finally { Marshal.FreeHGlobal(vn); }
      // Темп игры — в слова в минуту eSpeak (175 — обычный); выше 450 eSpeak NG
      // ускоряет речь библиотекой Sonic.
      fParam(1, Math.Max(80, Math.Min(1000, (int)Math.Round(175 * GraniRh.Tempo(r)))), 0);
      fParam(2, Math.Max(0, Math.Min(200, vol)), 0);
      byte[] b = Encoding.UTF8.GetBytes(text ?? ""); IntPtr t = U8(text);
      try { fSynth(t, new UIntPtr((uint)b.Length + 1), 0, 1, 0, 1, IntPtr.Zero, IntPtr.Zero); fSync(); }
      finally { Marshal.FreeHGlobal(t); }
      short[] o = cancel ? null : buf.ToArray(); buf = null; sink = null; return o;
    }
  }
}
// ── Потоковый вывод звука (waveOut) ──
// Куски речи RHVoice и eSpeak уходят в звуковую карту, как только готовы:
// первый — через 40 мс звука, дальше — по 100 мс. Голос начинает говорить
// почти сразу, а не после синтеза всей фразы.
public sealed class GraniWave {
  [StructLayout(LayoutKind.Sequential)] struct Wfx { public ushort tag, ch; public uint sr, bps; public ushort align, bits, cb; }
  [StructLayout(LayoutKind.Sequential)] struct Hdr { public IntPtr data; public uint len, rec; public IntPtr user; public uint flags, loops; public IntPtr next, res; }
  [DllImport("winmm.dll")] static extern int waveOutOpen(out IntPtr h, uint dev, ref Wfx f, IntPtr cb, IntPtr inst, uint fl);
  [DllImport("winmm.dll")] static extern int waveOutPrepareHeader(IntPtr h, IntPtr hdr, uint sz);
  [DllImport("winmm.dll")] static extern int waveOutUnprepareHeader(IntPtr h, IntPtr hdr, uint sz);
  [DllImport("winmm.dll")] static extern int waveOutWrite(IntPtr h, IntPtr hdr, uint sz);
  [DllImport("winmm.dll")] static extern int waveOutReset(IntPtr h);
  [DllImport("winmm.dll")] static extern int waveOutClose(IntPtr h);
  static readonly int HSZ = Marshal.SizeOf(typeof(Hdr));
  static readonly int FOFF = (int)Marshal.OffsetOf(typeof(Hdr), "flags");
  IntPtr h = IntPtr.Zero; int sr; bool closed = false, started = false;
  List<IntPtr> hs = new List<IntPtr>(); List<short> acc = new List<short>(); object lk = new object();
  public GraniWave(int rate){ sr = rate; }
  public bool Open(){
    try {
      var f = new Wfx(); f.tag = 1; f.ch = 1; f.sr = (uint)sr; f.bits = 16; f.align = 2; f.bps = (uint)sr * 2; f.cb = 0;
      return waveOutOpen(out h, 0xFFFFFFFF, ref f, IntPtr.Zero, IntPtr.Zero, 0) == 0;
    } catch (Exception) { h = IntPtr.Zero; return false; }
  }
  public void Add(short[] a){ lock (lk) { if (closed) return; acc.AddRange(a); if (acc.Count >= (started ? sr / 10 : sr / 25)) Flush(); } }
  void Flush(){
    if (acc.Count == 0 || h == IntPtr.Zero) return;
    short[] a = acc.ToArray(); acc.Clear();
    IntPtr d = Marshal.AllocHGlobal(a.Length * 2); Marshal.Copy(a, 0, d, a.Length);
    var x = new Hdr(); x.data = d; x.len = (uint)(a.Length * 2);
    IntPtr hp = Marshal.AllocHGlobal(HSZ); Marshal.StructureToPtr(x, hp, false);
    if (waveOutPrepareHeader(h, hp, (uint)HSZ) != 0) { Marshal.FreeHGlobal(d); Marshal.FreeHGlobal(hp); return; }
    if (waveOutWrite(h, hp, (uint)HSZ) != 0) { waveOutUnprepareHeader(h, hp, (uint)HSZ); Marshal.FreeHGlobal(d); Marshal.FreeHGlobal(hp); return; }
    hs.Add(hp); started = true; Reap(false);
  }
  void Reap(bool all){
    for (int i = hs.Count - 1; i >= 0; i--) {
      IntPtr hp = hs[i];
      if (!all && (Marshal.ReadInt32(hp, FOFF) & 1) == 0) continue;
      waveOutUnprepareHeader(h, hp, (uint)HSZ); Marshal.FreeHGlobal(Marshal.ReadIntPtr(hp, 0)); Marshal.FreeHGlobal(hp); hs.RemoveAt(i);
    }
  }
  public void End(){ lock (lk) { if (!closed) Flush(); } }
  public bool Busy(){ lock (lk) { if (closed) return false; Reap(false); return hs.Count > 0; } }
  public void Close(){
    lock (lk) {
      if (closed) return; closed = true; acc.Clear();
      if (h != IntPtr.Zero) { try { waveOutReset(h); Reap(true); waveOutClose(h); } catch (Exception) { } h = IntPtr.Zero; }
    }
  }
}
public static class GraniSapi {
  static object lk = new object();
  static BlockingCollection<string[]> q = new BlockingCollection<string[]>();
  static Dictionary<string, object> tokens = new Dictionary<string, object>();
  static HashSet<string> platform = new HashSet<string>();
  static dynamic msp = null;
  static Dictionary<string, string> rhMap = new Dictionary<string, string>();
  // Голос RHVoice и eSpeak звучит потоком (GraniWave): первые слова — через
  // десятки миллисекунд после команды. Конец фразы — когда звуковая карта
  // доиграла последний кусок. Если waveOut недоступен — запасной SoundPlayer
  // с фразой целиком.
  static object rk = new object(); static System.Media.SoundPlayer rhPlayer = null; static GraniWave rhWave = null;
  static volatile int rhGen = 0; static long rhEnd = long.MaxValue;
  static short[] EngSynth(string key, string text, double rate, int vol, Action<short[], int> snk, out int sr){
    if (key.StartsWith("es:")) return GraniEs.Synth(key.Substring(3), text, rate, vol, snk, out sr);
    return GraniRh.Synth(key.Substring(3), text, rate, vol, snk, out sr);
  }
  static void RhPlayerStop(){
    try { if (rhPlayer != null) rhPlayer.Stop(); } catch (Exception) { } rhPlayer = null;
    if (rhWave != null) { rhWave.Close(); rhWave = null; }
  }
  static void RhSpeak(string profile, string text, double rate, int vol){
    int gen = ++rhGen; GraniRh.Cancel(); GraniEs.Cancel(); Interlocked.Exchange(ref rhEnd, long.MaxValue);
    var th = new Thread(() => {
      GraniWave w = null; bool noWave = false; var rest = new List<short>(); int wsr = 0;
      try {
        Action<short[], int> snk = (a, r) => {
          if (gen != rhGen) return;
          if (w == null && !noWave) {
            var nw = new GraniWave(r);
            if (!nw.Open()) noWave = true;
            else lock (rk) { if (gen != rhGen) { nw.Close(); return; } RhPlayerStop(); rhWave = nw; w = nw; }
          }
          if (w != null) w.Add(a); else { rest.AddRange(a); wsr = r; }
        };
        int sr; short[] s = EngSynth(profile, text, rate, vol, snk, out sr);
        if (gen != rhGen) return;
        if (w != null) {
          w.End();
          while (gen == rhGen && w.Busy()) Thread.Sleep(15);
          if (gen == rhGen) Interlocked.Exchange(ref rhEnd, DateTime.UtcNow.Ticks);
          return;
        }
        if (rest.Count == 0) { Interlocked.Exchange(ref rhEnd, DateTime.UtcNow.Ticks); return; }
        var pl = new System.Media.SoundPlayer(new MemoryStream(GraniRh.Wav(rest.ToArray(), wsr > 0 ? wsr : sr)));
        lock (rk) { if (gen != rhGen) return; RhPlayerStop(); rhPlayer = pl; pl.Load(); pl.Play(); }
        Interlocked.Exchange(ref rhEnd, DateTime.UtcNow.Ticks + (long)(rest.Count * 10000000.0 / (wsr > 0 ? wsr : sr)) + 1500000);
      } catch (Exception) { Interlocked.Exchange(ref rhEnd, DateTime.UtcNow.Ticks); }
    });
    th.IsBackground = true; th.Start();
  }
  static void RhStop(){ rhGen++; GraniRh.Cancel(); GraniEs.Cancel(); lock (rk) { RhPlayerStop(); } Interlocked.Exchange(ref rhEnd, long.MaxValue); }
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
    // RHVoice из дополнений NVDA — сам, без NVDA.
    rhMap.Clear(); GraniRh.Load();
    foreach (var w in GraniRh.Voices) {
      string name = Clean(w.Name); if (name == "" || tokens.ContainsKey(name) || platform.Contains(name) || rhMap.ContainsKey(name)) continue;
      rhMap[name] = "rh:" + w.Profile; Add(sb, name, w.Lang, w.Gender, "rhvoice", "", false);
    }
    // eSpeak NG — из NVDA или отдельной установки, тоже без NVDA.
    GraniEs.Load();
    foreach (var w in GraniEs.Voices) {
      string name = Clean(w.Name); if (name == "" || tokens.ContainsKey(name) || platform.Contains(name) || rhMap.ContainsKey(name)) continue;
      rhMap[name] = "es:" + w.Id; Add(sb, name, w.Lang, w.Gender, "espeak", "", false);
    }
    // Чтец экрана — только если он запущен: его голосом говорит то, что в нём выбрано.
    if (IntPtr.Size == 8) {
      LoadNvda();
      if (NvdaUp()) Add(sb, NVDA, "ru-RU", "", "sr", "NVDA", false);
      if (JawsUp()) Add(sb, JAWS, "ru-RU", "", "sr", "JAWS", false);
    }
    Say(sb.ToString());
    // Состояние голоса чтеца экрана — для отчёта «почему не видно голосов».
    Say("sr " + (IntPtr.Size == 8 ? (nvTest != null ? "lib" : "nolib") + " " + (NvdaUp() ? "up" : "down") : "x86"));
    Say("rh " + Clean(GraniRh.Why) + "; eSpeak NG: " + Clean(GraniEs.Why));
  }
  // Сколько примерно звучит фраза у чтеца экрана: конца речи он не сообщает.
  static int SrMs(string t, int rate){ double cps = 14.0 * Math.Pow(3.0, rate / 10.0); return 350 + (int)(1000.0 * (t ?? "").Length / Math.Max(6.0, cps)); }
  static void SrStop(){ try { if (nvCancel != null) nvCancel(); } catch (Exception) { } try { if (jaws != null) jaws.StopSpeech(); } catch (Exception) { } }
  static void Worker(){
    dynamic v = null; string cur = null; dynamic prompt = null; bool onPlatform = false; string sr = null; string rh = null; DateTime srEnd = DateTime.MinValue;
    try { v = Com("SAPI.SpVoice"); } catch (Exception ex) { Say("fatal " + Clean(ex.Message)); return; }
    Enumerate(v);
    Say("ready");
    while (true) {
      string[] p;
      if (q.TryTake(out p, 25)) {
        if (p == null || p.Length == 0) continue;
        try {
          if (p[0] == "quit") return;
          // «Перечитать голоса»: движок, поставленный или запущенный после
          // открытия игры (новый голос SAPI, NVDA), появляется без перезапуска.
          if (p[0] == "enum") { tokens.Clear(); platform.Clear(); Enumerate(v); Say("ready"); continue; }
          if (p[0] == "voice" && p.Length > 1) {
            object t;
            if (p[1] == NVDA || p[1] == JAWS) { sr = p[1]; rh = null; }
            else if (rhMap.ContainsKey(p[1])) { rh = rhMap[p[1]]; onPlatform = false; sr = null; }
            else if (tokens.TryGetValue(p[1], out t)) { v.Voice = (dynamic)t; onPlatform = false; sr = null; rh = null; }
            else if (msp != null && platform.Contains(p[1])) { msp.SelectVoice(p[1]); onPlatform = true; sr = null; rh = null; }
          }
          else if (p[0] == "speak" && p.Length > 4) {
            // Темп приходит в шкале игры (единица — обычный, 5 — впятеро по шкале
            // Web Speech); голоса SAPI получают его в своей шкале (−10…10), RHVoice
            // и eSpeak — настоящим множителем. Громкость — до 200 (выше обычной
            // умеют только RHVoice и eSpeak).
            double tempo = 1; double.TryParse(p[2], NumberStyles.Float, CultureInfo.InvariantCulture, out tempo);
            tempo = Math.Max(0.1, Math.Min(10, tempo));
            int rate = (int)Math.Round(Math.Max(-10, Math.Min(10, 10 * Math.Log(tempo) / Math.Log(3))));
            int vol2 = Math.Max(0, Math.Min(200, int.Parse(p[3]))), vol = Math.Min(100, vol2);
            if (rh != null) {
              // RHVoice без NVDA: прежняя фраза снимается, новая считается и звучит.
              try { v.Speak("", 1 | 2); } catch (Exception) { }
              if (msp != null) { try { msp.SpeakAsyncCancelAll(); } catch (Exception) { } }
              prompt = null; RhSpeak(rh, p[4], tempo, vol2); cur = p[1];
            }
            else if (sr != null) {
              RhStop();
              // Голос чтеца экрана: прежняя фраза снимается, новая звучит тем, что выбрано в NVDA или JAWS.
              try { v.Speak("", 1 | 2); } catch (Exception) { }
              SrStop(); prompt = null;
              if (sr == NVDA && nvSpeak != null) nvSpeak(p[4]);
              else if (sr == JAWS && jaws != null) jaws.SayString(p[4], false);
              cur = p[1]; srEnd = DateTime.UtcNow.AddMilliseconds(SrMs(p[4], rate));
            }
            else if (onPlatform && msp != null) {
              RhStop();
              try { v.Speak("", 1 | 2); } catch (Exception) { }
              msp.SpeakAsyncCancelAll(); msp.Rate = rate; msp.Volume = vol; prompt = msp.SpeakAsync(p[4]); cur = p[1];
            } else {
              if (msp != null) { try { msp.SpeakAsyncCancelAll(); } catch (Exception) { } }
              RhStop();
              prompt = null; v.Rate = rate; v.Volume = vol;
              // 1 — не ждать, 2 — снять недосказанное (как QUEUE_FLUSH на Android), 16 — текст не разметка.
              v.Speak(p[4], 1 | 2 | 16); cur = p[1];
            }
          } else if (p[0] == "stop") {
            cur = null; prompt = null;
            if (sr != null) SrStop();
            RhStop();
            try { v.Speak("", 1 | 2); } catch (Exception) { }
            if (msp != null) { try { msp.SpeakAsyncCancelAll(); } catch (Exception) { } }
          }
          else if (p[0] == "wav" && p.Length > 3) {
            object t;
            if (rhMap.ContainsKey(p[2])) {
              int srate; short[] snd = EngSynth(rhMap[p[2]], p[3], 0, 100, null, out srate);
              if (snd == null || snd.Length == 0) throw new Exception("движок молчит");
              File.WriteAllBytes(p[1], GraniRh.Wav(snd, srate)); Say("wav ok");
            }
            else if (msp != null && platform.Contains(p[2])) {
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
          bool fin = rh != null ? DateTime.UtcNow.Ticks >= Interlocked.Read(ref rhEnd) : sr != null ? DateTime.UtcNow >= srEnd : prompt != null ? (bool)prompt.IsCompleted : (bool)v.WaitUntilDone(0);
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
      this.proc.on('exit', code => {
        const был = this.ready || this.wasReady;
        if (!this.ready && !this.why) this.why = 'мост закрылся (код ' + code + ')' + (this.err ? ': ' + this.err.slice(-300) : '');
        if (был) { this.why = 'мост упал (код ' + code + ') и поднимается заново'; this.voices = []; }
        this.ready = false; done(false);
        // Упал уже работавший мост (сбой чужого движка) — Sapi поднимает его снова.
        if (был && this.onExit) this.onExit(this);
      });
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
    if (l.startsWith('sr ')) { this.sr = l.slice(3); return; }
    if (l.startsWith('rh ')) { this.rh = l.slice(3); return; }
    if (l === 'ready') { this.ready = true; this.wasReady = true; if (done) done(this.voices.length > 0); if (this.onReady) this.onReady(); return; }
    if (l.startsWith('fatal')) { this.ready = false; this.why = 'голоса Windows недоступны: ' + l.slice(6); if (done) done(false); return; }
    const m = /^(done|cancel|error) (\S*)/.exec(l);
    if (m) { if (this.onDone && m[2]) this.onDone(m[1], m[2]); return; }
    if (l === 'wav ok' || l.startsWith('wav fail')) { const w = this.waiters.shift(); if (w) w(l === 'wav ok' ? true : l); }
  }
  // Перечитать голоса в уже поднятом мосту.
  reenum(ms) {
    return new Promise(res => {
      const prev = this.onReady; let fin = false;
      this.onReady = () => { this.onReady = prev; if (prev) prev(); if (!fin) { fin = true; res(true); } };
      this.send('enum');
      setTimeout(() => { if (!fin) { fin = true; this.onReady = prev; res(false); } }, ms);
    });
  }
  send(...parts) { try { if (this.proc && this.proc.stdin.writable) this.proc.stdin.write(parts.map(x => String(x).replace(/[\t\r\n]+/g, ' ')).join('\t') + '\n'); } catch (_) { } }
  quit() { try { this.send('quit'); if (this.proc) { this.proc.stdin.end(); setTimeout(() => { try { this.proc.kill(); } catch (_) { } }, 500); } } catch (_) { } }
}

const ENGINE = { sapi: 'SAPI 5', sapi32: 'SAPI 5, 32 бит', onecore: 'Windows', platform: 'Speech Platform', sr: 'чтец экрана', rhvoice: 'RHVoice из дополнения NVDA, без NVDA', espeak: 'eSpeak NG, без NVDA' };
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
// ── БИБЛИОТЕКИ ИЗ АРХИВА ПРИЛОЖЕНИЯ (8.0) ──
// Упаковщик кладёт приложение в архив app.asar. Electron читает из него сам,
// но PowerShell и Windows — нет: готовый мост и библиотека NVDA, лежавшие в
// архиве, у игрока не поднимались. Мост тогда собирался заново и не успевал к
// открытию игры, а голос NVDA не появлялся вовсе. Теперь библиотеки лежат
// рядом с приложением (resources/sapi, resources/sr), а если всё же оказались
// в архиве — копируются во временную папку обычными файлами.
const inAsar = f => /\.asar([\\/]|$)/i.test(String(f || ''));
function outOfAsar(f) {
  if (!inAsar(f)) return f;
  try {
    const rel = String(f).split(/\.asar[\\/]/i).pop();
    const dest = path.join(asciiTmp(), 'grani-bin', rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const data = fs.readFileSync(f);
    let same = false; try { same = fs.statSync(dest).size === data.length; } catch (_) { }
    if (!same) fs.writeFileSync(dest, data);
    return dest;
  } catch (_) { return ''; }
}
function bases(sub) {
  const out = [];
  if (process.resourcesPath) out.push(path.join(process.resourcesPath, sub));
  out.push(path.join(__dirname, sub));
  return out;
}
// Готовый мост, собранный при сборке приложения (sapi-build.js): у игрока
// ничего не компилируется — голоса Windows отвечают за секунду, без сборщика C#.
let shippedCache = null;
function shippedDll() {
  if (shippedCache !== null) return shippedCache;
  for (const d of bases('sapi')) {
    const f = path.join(d, 'grani-sapi-' + TAG + '.dll');
    try { if (fs.existsSync(f)) { const r = outOfAsar(f); if (r) return (shippedCache = r); } } catch (_) { }
  }
  return (shippedCache = '');
}
// Библиотека NVDA для голоса чтеца экрана (desktop/sr, кладётся при сборке).
function srDir() {
  for (const d of bases('sr')) {
    try {
      if (!fs.existsSync(d)) continue;
      if (!inAsar(d)) return d;
      let any = false;
      for (const a of ['x64', 'x86']) {
        const f = path.join(d, a, 'nvdaControllerClient.dll');
        if (fs.existsSync(f) && outOfAsar(f)) any = true;
      }
      if (any) return path.join(asciiTmp(), 'grani-bin', 'sr');
    } catch (_) { }
  }
  return '';
}

// eSpeak NG, поставленный вместе с игрой (resources/espeak: libespeak-ng.dll и
// espeak-ng-data). Он говорит, даже если у игрока нет ни NVDA, ни RHVoice.
function espeakDll() {
  for (const d of bases('espeak')) {
    try {
      const f = path.join(d, 'libespeak-ng.dll');
      if (fs.existsSync(f) && fs.existsSync(path.join(d, 'espeak-ng-data')) && !inAsar(d)) return f;
    } catch (_) { }
  }
  return '';
}

// RHVoice с голосом Aleksandr, поставленный вместе с игрой (resources/rhvoice —
// в том же виде, что дополнения NVDA). Берётся, только если у игрока нет
// своего RHVoice в NVDA: иначе голоса задвоились бы.
function rhvoiceDir() {
  try {
    const own = path.join(process.env.APPDATA || '', 'nvda', 'addons');
    if (process.env.APPDATA && fs.existsSync(own) && fs.readdirSync(own).some(n => /^rhvoice$/i.test(n))) return '';
  } catch (_) { }
  for (const d of bases('rhvoice')) {
    try { if (fs.existsSync(path.join(d, 'RHVoice')) && !inAsar(d)) return d; } catch (_) { }
  }
  return '';
}

// ── ГОЛОС ЧТЕЦА ПО УМОЛЧАНИЮ (9.5) ──
// Игра сама берёт голос того чтеца экрана, что стоит у игрока: запущен NVDA —
// говорит голосом NVDA, запущен JAWS — голосом JAWS. Чтец не запущен — тот
// синтезатор и голос, что выбраны в настройках NVDA (nvda.ini: RHVoice или
// eSpeak, их мост поднимает сам и без NVDA). Иначе — русский RHVoice или
// eSpeak NG, что идёт вместе с игрой; голосов Microsoft в игре нет.
function nvdaIni() {
  const out = { synth: '', voice: '' };
  try {
    const ad = process.env.APPDATA; if (!ad) return out;
    const txt = fs.readFileSync(path.join(ad, 'nvda', 'nvda.ini'), 'utf8');
    let sec = '', sub = '';
    for (const raw of txt.split(/\r?\n/)) {
      const line = raw.trim();
      let m;
      if ((m = /^\[\[(.+)\]\]$/.exec(line))) { sub = m[1].trim().toLowerCase(); continue; }
      if ((m = /^\[(.+)\]$/.exec(line))) { sec = m[1].trim().toLowerCase(); sub = ''; continue; }
      if (sec !== 'speech' || !(m = /^([^=]+?)\s*=\s*(.*)$/.exec(line))) continue;
      const k = m[1].trim().toLowerCase(), v = m[2].trim();
      if (!sub && k === 'synth') out.synth = v.toLowerCase();
      else if (sub && sub === out.synth && k === 'voice') out.voice = v;
    }
  } catch (_) { }
  return out;
}
// Голос из настроек JAWS: в его файлах настроек (%APPDATA%\Freedom Scientific\JAWS)
// ищем имя голоса, который мост умеет поднять сам (SAPI 5, RHVoice, eSpeak).
// Собственные синтезаторы JAWS (Eloquence, Vocalizer) без JAWS не поднять —
// тогда остаётся голос Windows по умолчанию.
function jawsText() {
  try {
    const base = path.join(process.env.APPDATA || '', 'Freedom Scientific', 'JAWS');
    if (!fs.existsSync(base)) return '';
    let out = '';
    const walk = (d, depth) => {
      if (depth > 4 || out.length > 400000) return;
      for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        let st; try { st = fs.statSync(p); } catch (_) { continue; }
        if (st.isDirectory()) walk(p, depth + 1);
        else if (/\.(jcf|vpf|ini|jsd)$/i.test(f) && st.size < 200000) { try { out += '\n' + fs.readFileSync(p, 'latin1') + '\n' + fs.readFileSync(p, 'utf16le'); } catch (_) { } }
      }
    };
    walk(base, 0);
    return out;
  } catch (_) { return ''; }
}
// Совпадает ли голос с записью настроек: «RHVoice_Aleksandr», «MSTTS_V110_ruRU_IrinaM»,
// «Aleksandr» — по значимым частям имени.
function voiceMatch(v, rec) {
  const low = s => String(s || '').toLowerCase();
  const parts = low(String(rec || '').replace(/^.*[\\/]/, '')).split(/[_\-\s.]+/).filter(x => x.length >= 4 && !/^(rhvoice|mstts|v110|voice|sapi5|onecore|tokens|desktop|ruru|enus)$/.test(x));
  const n = low(v.name);
  // У голосов Windows на конце имени буква пола: «PavelM», «IrinaF».
  parts.slice().forEach(x => { if (/[mf]$/.test(x) && x.length >= 5) parts.push(x.slice(0, -1)); });
  return parts.length > 0 && parts.some(x => n.indexOf(x) >= 0);
}
// ── БЕЗ ГОЛОСОВ MICROSOFT (9.5) ──
// Просьба игрока: голоса Microsoft (SAPI 5 от Microsoft, голоса Windows
// 10/11, Microsoft Speech Platform) отвечают очень медленно — их в игре нет
// совсем. Говорят голос чтеца экрана (NVDA, JAWS), RHVoice, eSpeak NG (он
// поставляется вместе с игрой) и сторонние голоса SAPI 5 (Acapela, Vocalizer).
function isMsVoice(v) {
  if (!v || v.kind === 'sr') return false;
  return v.kind === 'onecore' || v.kind === 'platform' || /microsoft/i.test(String(v.vendor || '')) || /^microsoft\b|\bmicrosoft\s/i.test(String(v.name || ''));
}
function autoVoiceName(voices, ini, jaws) {
  voices = (voices || []).filter(v => !isMsVoice(v));
  const sr = voices.filter(v => v.kind === 'sr');
  const nv = sr.find(v => /^NVDA/.test(v.name)), jw = sr.find(v => /^JAWS/.test(v.name));
  if (nv) return nv.name;
  if (jw) return jw.name;
  ini = ini || nvdaIni();
  const low = s => String(s || '').toLowerCase();
  // Чтец не запущен: голос из его настроек, но голосом, который мост
  // поднимает сам, без NVDA и без JAWS.
  if (/^sapi5$|^onecore$/.test(ini.synth)) {
    const kinds = ini.synth === 'onecore' ? ['onecore'] : ['sapi', 'sapi32'];
    const w = voices.find(v => kinds.includes(v.kind) && voiceMatch(v, ini.voice)) || voices.find(v => voiceMatch(v, ini.voice));
    if (w) return w.name;
  }
  if (/rhvoice/.test(ini.synth)) {
    const rh = voices.filter(v => v.kind === 'rhvoice');
    const w = rh.find(v => ini.voice && low(v.name).indexOf(low(ini.voice).replace(/^.*[\\/]/, '')) >= 0) || rh.find(v => /^ru/i.test(v.lang)) || rh[0];
    if (w) return w.name;
  }
  if (/espeak/.test(ini.synth)) {
    const es = voices.filter(v => v.kind === 'espeak');
    const w = es.find(v => /^ru/i.test(v.lang)) || es[0];
    if (w) return w.name;
  }
  // JAWS: голос, имя которого записано в его настройках.
  const jt = jaws !== undefined ? jaws : jawsText();
  if (jt) {
    const own = voices.filter(v => v.kind !== 'sr').sort((a, b) => b.name.length - a.name.length);
    const w = own.find(v => v.name.length >= 4 && jt.toLowerCase().indexOf(low(v.name).split(/\s+[—-]\s+/)[0]) >= 0);
    if (w) return w.name;
  }
  // Иначе — голос, что звучит быстрее и чище: русский RHVoice, русский
  // eSpeak NG, голос Windows по умолчанию (если он не Microsoft), любой.
  const ru = v => /^ru/i.test(v.lang || '');
  const d = voices.find(v => v.kind === 'rhvoice' && ru(v)) || voices.find(v => v.kind === 'espeak' && ru(v)) || voices.find(v => v.default) || voices.find(ru) || voices[0];
  return d ? d.name : '';
}

class Sapi {
  constructor() { this.procs = []; this.ready = false; this.voices = []; this.owner = new Map(); this.speaking = new Set(); this.onDone = null; this.onChange = null; this.cur = null; this.why = ''; }
  // Почему голоса Windows не подключились — игрок слышит это в настройках.
  diag() {
    if (process.platform !== 'win32') return 'не Windows';
    const parts = this.procs.map(p => p.bits + ' бит: ' + (p.ready ? 'голосов ' + p.voices.length : (p.why || 'поднимается')));
    const p64 = this.procs.find(p => p.bits === 64), p32 = this.procs.find(p => p.bits === 32);
    const sr = p64 && p64.sr ? (/^nolib/.test(p64.sr) ? '; голос NVDA: нет библиотеки NVDA' : /up$/.test(p64.sr) ? '; голос NVDA: доступен' : '; голос NVDA: NVDA не запущен — запустите NVDA и перечитайте голоса') : '';
    return (this.ready ? 'голоса Windows подключены, голосов ' + this.voices.length : 'голоса Windows не подключены' + (this.why ? ' (' + this.why + ')' : '')) +
      (parts.length ? '; ' + parts.join('; ') : '') + (shippedDll() ? '; мост готовый' : '; мост собирается на месте') + sr +
      (p64 && p64.rh ? '; RHVoice из NVDA: ' + p64.rh : '') + (p32 && p32.rh && !/64-битный/.test(p32.rh) ? '; 32 бит — RHVoice: ' + p32.rh : '');
  }
  // «Перечитать голоса»: мост, который не поднялся, запускается заново.
  restart(timeoutMs = 15000) {
    if (this.ready && this.procs.every(p => p.ready))
      return Promise.all(this.procs.map(p => p.reenum(4000))).then(() => this.merge());
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
    const ed = espeakDll(); if (ed && !env.GRANI_ESPEAK_DLL) env.GRANI_ESPEAK_DLL = ed;
    const rd = rhvoiceDir(); if (rd) env.GRANI_NVDA_ADDONS = [env.GRANI_NVDA_ADDONS, rd].filter(Boolean).join(';');
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
    fresh.forEach(p => { p.onExit = () => {
      this.merge();
      this.restarts = (this.restarts || 0) + 1;
      if (this.restarts > 3) return;   // не больше трёх подъёмов за сеанс
      setTimeout(() => this.restart(20000).then(() => { if (this.onChange) this.onChange(); }).catch(() => { }), 800);
    }; });
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
      if (this.owner.has(v.name) || isMsVoice(v)) continue;
      this.owner.set(v.name, p); this.voices.push(v);
    }
    this.ready = this.voices.length > 0;
    if (this.ready) this.why = '';
    if (!this.cur || !this.owner.has(this.cur)) { const a = autoVoiceName(this.voices); this.cur = a || (this.voices[0] ? this.voices[0].name : null); if (this.cur) this.proc(this.cur).send('voice', this.cur); }
    return this.ready;
  }
  proc(name) { return this.owner.get(name || this.cur) || this.procs[0]; }
  // Темп игры (шкала Web Speech: единица — обычный) уходит мосту как есть;
  // мост сам переводит его в шкалу SAPI (−10…10, как Chromium: десять — втрое
  // быстрее обычного), а RHVoice и eSpeak — в тот же темп, что у записей Gemini.
  static rate(r) { r = Number(r) || 1; return Math.max(0.1, Math.min(10, r)).toFixed(2); }
  speak(text, rate, volume, id) {
    this.speaking.clear(); this.speaking.add(String(id));
    const p = this.proc();
    this.procs.forEach(o => { if (o !== p) o.send('stop'); });
    p.send('speak', id, Sapi.rate(rate), Math.round(Math.max(0, Math.min(2, volume >= 0 ? volume : 1)) * 100), text);
  }
  stop() { this.speaking.clear(); this.procs.forEach(p => p.send('stop')); }
  setVoice(name) { if (!this.owner.has(name)) return; this.cur = name; this.proc(name).send('voice', name); }
  wav(file, text, voice) {
    const p = this.proc(voice);
    return new Promise(r => { p.waiters.push(r); p.send('wav', file, voice || '', text); setTimeout(() => r(false), 20000); });
  }
  // Чей голос игра возьмёт сама: NVDA, JAWS, настройки NVDA или голос Windows.
  autoVoice() { return autoVoiceName(this.voices); }
  list() {
    const auto = this.autoVoice();
    return this.voices.map(v => ({ id: v.name, name: v.name, lang: v.lang, gender: v.gender, local: true, default: v.name === this.cur && !!v.default, auto: v.name === auto,
      engine: (ENGINE[v.kind] || 'SAPI 5') + (v.vendor && !/^microsoft/i.test(v.vendor) ? ', ' + v.vendor : '') }));
  }
  quit() { this.procs.forEach(p => p.quit()); }
}
module.exports = { Sapi, CS_SOURCE: CS, TAG, autoVoiceName, nvdaIni, jawsText, isMsVoice, espeakDll, rhvoiceDir };
