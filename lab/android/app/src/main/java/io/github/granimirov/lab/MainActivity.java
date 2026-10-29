package io.github.granimirov.lab;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Rect;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.util.Log;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.window.OnBackInvokedDispatcher;

import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/* «Подземная лаборатория» на Android 9 и новее.

   Вся игра лежит в assets/www и открывается по адресу
   https://appassets.androidplatform.net/assets/www/index.html: так у страницы
   настоящий https-источник, и записи звука читаются без сети и без file://.

   Мост LabTTS отдаёт странице синтезатор речи телефона — тот же, что у
   TalkBack: speak(текст, темп, громкость, номер), stop(), status()
   ("init" | "ready" | "failed"), isSpeaking(), hasRussian(), getVoices(), setVoice(имя),
   vibrate(узор), setOrientation("landscape" | "portrait"), setFullscreen("1" | "0"), lowRam(),
   exitApp(), log(строка). О начале, конце и ошибке фразы
   приложение сообщает вызовами LabTTSStart(номер), LabTTSDone(номер),
   LabTTSError(номер). Кнопка «Назад» закрывает окно игры (labBack); на
   инструменте во весь экран она не уводит — отойти можно только касанием
   четырьмя пальцами.

   Android 9–17: с целевым API 36 и выше «Назад» приходит только в
   зарегистрированный обработчик (onBackPressed не зовётся — он остаётся
   для Android 9–12); приложение помечено как игра (appCategory="game"), и
   на планшетах с Android 17 поворот экрана для инструментов остаётся за
   игрой; окно рисуется от края до края, поля под системные панели ставим
   сами. */
public class MainActivity extends Activity {
    private static final String START = "https://appassets.androidplatform.net/assets/www/index.html";
    private static final String TAG = "LabJS";

    private WebView web;
    private TextToSpeech tts;
    private final Map<String, TextToSpeech> others = new HashMap<>();
    private final Map<String, String> labels = new HashMap<>();
    private volatile TextToSpeech speaker;
    private volatile String state = "init";
    /* Голос, выбранный в игре. Он ставится, как только поднимется его движок: прочие движки
       речи поднимаются позже основного (после долгого перерыва — на несколько секунд), и прежде
       выбор, присланный игрой при запуске, пропадал — звучал голос основного движка. */
    private volatile String wantVoice = null;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final List<String[]> pending = new ArrayList<>();
    /* инструмент во весь экран: системные панели спрятаны, края экрана — игре */
    private volatile boolean full = false;

    private final UtteranceProgressListener prog = new UtteranceProgressListener() {
        @Override public void onStart(String id) { callJs("LabTTSStart", id); }
        @Override public void onDone(String id) { callJs("LabTTSDone", id); }
        @Override public void onError(String id) { callJs("LabTTSError", id); }
        @Override public void onError(String id, int code) { callJs("LabTTSError", id); }
        /* фраза оборвана (смена голоса, новая фраза поверх): игра не ждёт её конца понапрасну */
        @Override public void onStop(String id, boolean interrupted) { callJs("LabTTSDone", id); }
    };

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        tts = new TextToSpeech(this, status -> {
            if (status != TextToSpeech.SUCCESS) { state = "failed"; return; }
            try { tts.setLanguage(new Locale("ru", "RU")); } catch (Exception ignored) { }
            tts.setOnUtteranceProgressListener(prog);
            if (speaker == null) speaker = tts;
            /* Все движки речи телефона, а не только основной: игрок выбирает голос
               прямо в игре, не меняя движок по умолчанию в настройках Android. */
            try {
                String def = tts.getDefaultEngine();
                for (TextToSpeech.EngineInfo e : tts.getEngines()) {
                    if (e.name == null || e.name.equals(def)) continue;
                    final String pkg = e.name;
                    labels.put(pkg, e.label != null ? e.label : pkg);
                    final TextToSpeech[] h = new TextToSpeech[1];
                    h[0] = new TextToSpeech(this, st -> {
                        if (st != TextToSpeech.SUCCESS) return;
                        h[0].setOnUtteranceProgressListener(prog);
                        synchronized (others) { others.put(pkg, h[0]); }
                        if (wantVoice != null) main.post(() -> applyVoice());
                    }, pkg);
                }
            } catch (Exception ignored) { }
            List<String[]> wait;
            synchronized (pending) { state = "ready"; wait = new ArrayList<>(pending); pending.clear(); }
            if (wantVoice != null) main.post(() -> applyVoice());
            for (String[] p : wait) say(p[0], Float.parseFloat(p[1]), Float.parseFloat(p[2]), p[3]);
        });

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);

        /* Процесс страницы закрылся (нехватка памяти, сбой): страница
           загружается заново из автозаписи, приложение не падает целиком. */
        web.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                return loader.shouldInterceptRequest(req.getUrl());
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                if (getIntent() != null && getIntent().getBooleanExtra("lab_selftest", false)) {
                    view.postDelayed(() -> view.evaluateJavascript("try{LAB.selftest()}catch(e){window.LabTTS&&LabTTS.log('selftest FAIL '+e.message)}", null), 2500);
                }
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if ("appassets.androidplatform.net".equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
            @Override
            public boolean onRenderProcessGone(WebView view, android.webkit.RenderProcessGoneDetail detail) {
                boolean crashed = Build.VERSION.SDK_INT >= 26 && detail != null && detail.didCrash();
                Log.e(TAG, "renderer gone: " + (crashed ? "сбой" : "закрыт системой (память)"));
                recreate();
                return true;
            }
        });
        /* Сообщения страницы — в журнал устройства: проверка на эмуляторе ищет там ошибки. */
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage m) {
                Log.i("LabConsole", m.messageLevel() + " " + m.message() + " @" + m.sourceId() + ":" + m.lineNumber());
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "LabTTS");

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xFF05060A);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        /* экран повернулся — края, защищённые от жеста «Назад», пересчитать */
        web.addOnLayoutChangeListener((v, l, t, r, b, ol, ot, or, ob) -> { if (full) guardEdges(true); });
        /* С целевым API 35 и выше окно рисуется от края до края: поля под
           строку состояния и панель жестов ставим сами. */
        root.setOnApplyWindowInsetsListener((v, ins) -> {
            int l, t, r, b;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets i = ins.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                l = i.left; t = i.top; r = i.right; b = i.bottom;
            } else {
                l = ins.getSystemWindowInsetLeft(); t = ins.getSystemWindowInsetTop();
                r = ins.getSystemWindowInsetRight(); b = ins.getSystemWindowInsetBottom();
            }
            v.setPadding(l, t, r, b);
            return ins;
        });
        setContentView(root);
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::goBack);
        }
        /* после сбоя страницы состояния может не быть — тогда загрузить заново */
        if (saved == null || web.restoreState(saved) == null) web.loadUrl(START);
    }

    /* Android 9–12: «Назад» — сюда; Android 13 и новее — в обработчик выше. */
    @Override
    public void onBackPressed() { goBack(); }

    /* Весь экран для инструмента: строка состояния и панель жестов уходят
       (смахнуть от края — покажутся на время), края экрана — игре. */
    private void applyFullscreen(boolean on) {
        full = on;
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                if (on) {
                    c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                    c.hide(WindowInsets.Type.systemBars());
                } else c.show(WindowInsets.Type.systemBars());
            }
        } else {
            View d = getWindow().getDecorView();
            d.setSystemUiVisibility(on ? (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN) : View.SYSTEM_UI_FLAG_VISIBLE);
        }
        guardEdges(on);
    }

    /* Жест «Назад» от края экрана (Android 10 и новее) не должен ловить
       глиссандо, начатое у края: средняя часть левого и правого краёв —
       игре (система отдаёт не больше 200 dp на край). */
    private void guardEdges(boolean on) {
        if (Build.VERSION.SDK_INT < 29 || web == null) return;
        if (!on) { web.setSystemGestureExclusionRects(Collections.emptyList()); return; }
        float dp = getResources().getDisplayMetrics().density;
        int w = web.getWidth(), h = web.getHeight(), ex = Math.min(h, (int) (200 * dp)), edge = (int) (48 * dp), top = Math.max(0, (h - ex) / 2);
        List<Rect> rs = new ArrayList<>();
        rs.add(new Rect(0, top, edge, top + ex));
        rs.add(new Rect(Math.max(0, w - edge), top, w, top + ex));
        web.setSystemGestureExclusionRects(rs);
    }

    /* «Назад» закрывает верхнее окно игры; на игровом поле — открывает окно
       персонажа (там «Сохранить игру» и «Выход»). */
    private void goBack() {
        web.evaluateJavascript("(function(){try{return window.labBack?window.labBack():0;}catch(e){return 0;}})()",
                v -> { if (!"1".equals(v)) moveTaskToBack(true); });
    }

    /* Уход в фон: игра записывает себя (автозапись). (3.0) Если звук в фоне
       выключен (игра отвечает 0), страница засыпает целиком: таймеры, раскладка
       и анимации стоят, процессор телефона отдыхает. Приглушённый звук в фоне
       играет дальше — тогда страница не засыпает. */
    private boolean paused = false, timersPaused = false;
    @Override
    protected void onPause() {
        super.onPause();
        paused = true;
        if (web != null) web.evaluateJavascript("(function(){try{return window.labPause?window.labPause():1;}catch(e){return 1;}})()", v -> {
            if (paused && !timersPaused && "0".equals(v) && web != null) { timersPaused = true; web.onPause(); web.pauseTimers(); }
        });
    }

    /* Возврат на экран: единые обработчики звука и речи будят звук и повторяют
       фразу, оборванную уходом в фон (labResume). */
    @Override
    protected void onResume() {
        super.onResume();
        paused = false;
        if (web != null && timersPaused) { timersPaused = false; web.resumeTimers(); web.onResume(); }
        if (web != null) web.evaluateJavascript("try{window.labResume&&window.labResume();}catch(e){}", null);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        synchronized (others) { for (TextToSpeech t : others.values()) { try { t.stop(); t.shutdown(); } catch (Exception ignored) { } } others.clear(); }
        if (web != null) web.destroy();
        super.onDestroy();
    }

    private void callJs(String fn, String id) {
        final String js = "window." + fn + "&&window." + fn + "(" + JSONObject.quote(id) + ")";
        web.post(() -> web.evaluateJavascript(js, null));
    }

    private void say(String text, float rate, float volume, String id) {
        final TextToSpeech t = speaker != null ? speaker : this.tts;
        /* темп приходит из ползунка «Скорость речи» (0–100 %): 0,5 … 3 */
        float r = rate > 0 ? rate : 1f;
        t.setSpeechRate(Math.max(0.3f, Math.min(4f, r)));
        Bundle p = new Bundle();
        p.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, Math.max(0f, Math.min(1f, volume >= 0 ? volume : 1f)));
        /* Очередь ведёт игра: по одной фразе, QUEUE_FLUSH снимает недосказанное. */
        if (t.speak(text, TextToSpeech.QUEUE_FLUSH, p, id) != TextToSpeech.SUCCESS) callJs("LabTTSError", id);
    }

    /* Поставить выбранный голос; true — поставлен (или выбора нет), false — его движок или
       список голосов ещё не готов. */
    private boolean applyVoice() {
        String name = wantVoice;
        if (name == null) return true;
        if (!"ready".equals(state)) return false;
        try {
            int cut = name.indexOf("::");
            if (cut > 0) {
                TextToSpeech t;
                synchronized (others) { t = others.get(name.substring(0, cut)); }
                if (t == null) return false;
                String vn = name.substring(cut + 2);
                Set<Voice> ov = t.getVoices();
                if (ov != null) for (Voice v : ov) if (vn.equals(v.getName())) { if (speaker != t) tts.stop(); t.setVoice(v); speaker = t; return true; }
                return false;
            }
            Set<Voice> vs = tts.getVoices();
            if (vs != null) for (Voice v : vs) if (name.equals(v.getName())) { TextToSpeech sp = speaker; if (sp != null && sp != tts) sp.stop(); tts.setVoice(v); speaker = tts; return true; }
        } catch (Exception ignored) { }
        return false;
    }

    private void retryVoice(final int left) {
        if (applyVoice() || left <= 0) return;
        main.postDelayed(() -> retryVoice(left - 1), 500);
    }

    private class Bridge {
        @JavascriptInterface
        public void speak(String text, double rate, double volume, String id) {
            synchronized (pending) {
                if (!"ready".equals(state)) {
                    if ("failed".equals(state)) { callJs("LabTTSError", id); return; }
                    pending.add(new String[]{text, String.valueOf(rate), String.valueOf(volume), id});
                    return;
                }
            }
            say(text, (float) rate, (float) volume, id);
        }

        @JavascriptInterface
        public void stop() {
            synchronized (pending) { pending.clear(); }
            if (!"ready".equals(state)) return;
            TextToSpeech sp = speaker != null ? speaker : tts;
            try { sp.playSilentUtterance(1, TextToSpeech.QUEUE_FLUSH, "__hush"); } catch (Throwable t) { sp.stop(); }
        }

        @JavascriptInterface
        public String status() { return state; }

        /* Говорит ли ещё синтезатор: игра не перебивает недосказанную фразу. */
        @JavascriptInterface
        public boolean isSpeaking() {
            if (!"ready".equals(state)) return false;
            try { TextToSpeech sp = speaker != null ? speaker : tts; return sp.isSpeaking(); } catch (Exception e) { return false; }
        }

        /* Русский голос — у основного движка или у любого другого движка речи телефона. */
        @JavascriptInterface
        public boolean hasRussian() {
            if (!"ready".equals(state)) return true;
            Locale ru = new Locale("ru", "RU");
            try { if (tts.isLanguageAvailable(ru) >= TextToSpeech.LANG_AVAILABLE) return true; } catch (Exception ignored) { }
            synchronized (others) {
                for (TextToSpeech t : others.values()) {
                    try { if (t.isLanguageAvailable(ru) >= TextToSpeech.LANG_AVAILABLE) return true; } catch (Exception ignored) { }
                }
            }
            return false;
        }

        @JavascriptInterface
        public String getVoices() {
            JSONArray a = new JSONArray();
            if (!"ready".equals(state)) return a.toString();
            try {
                Set<Voice> vs = tts.getVoices();
                if (vs != null) for (Voice v : vs) {
                    JSONObject o = new JSONObject();
                    Locale l = v.getLocale();
                    o.put("id", v.getName());
                    o.put("name", v.getName() + " (" + l.getDisplayName(new Locale("ru")) + ")");
                    o.put("lang", l.toLanguageTag());
                    o.put("local", !v.isNetworkConnectionRequired());
                    a.put(o);
                }
                synchronized (others) {
                    for (Map.Entry<String, TextToSpeech> en : others.entrySet()) {
                        Set<Voice> ov = en.getValue().getVoices();
                        if (ov == null) continue;
                        String lab = labels.containsKey(en.getKey()) ? labels.get(en.getKey()) : en.getKey();
                        for (Voice v : ov) {
                            JSONObject o = new JSONObject();
                            Locale l = v.getLocale();
                            o.put("id", en.getKey() + "::" + v.getName());
                            o.put("name", lab + ": " + v.getName() + " (" + l.getDisplayName(new Locale("ru")) + ")");
                            o.put("lang", l.toLanguageTag());
                            o.put("local", !v.isNetworkConnectionRequired());
                            a.put(o);
                        }
                    }
                }
            } catch (Exception ignored) { }
            return a.toString();
        }

        /* Голос игрока: запомнить и поставить — сразу или, если его движок ещё не поднялся
           (так бывает при запуске), чуть позже: попытки — каждые полсекунды до 20 секунд и
           сразу, как поднимется очередной движок. */
        @JavascriptInterface
        public void setVoice(String name) {
            if (name == null) return;
            wantVoice = name.isEmpty() ? null : name;
            main.post(() -> retryVoice(40));
        }

        /* Отдача: узор «пауза, вибрация, пауза…» в миллисекундах через запятую. */
        @JavascriptInterface
        public void vibrate(String pattern) {
            try {
                Vibrator vb = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (vb == null || !vb.hasVibrator()) return;
                String[] parts = pattern.split(",");
                long[] p = new long[parts.length + 1];
                p[0] = 0;
                for (int i = 0; i < parts.length; i++) p[i + 1] = Math.max(0, Math.min(2000, Long.parseLong(parts[i].trim())));
                if (Build.VERSION.SDK_INT >= 26) vb.vibrate(VibrationEffect.createWaveform(p, -1));
                else vb.vibrate(p, -1);
            } catch (Exception ignored) { }
        }

        @JavascriptInterface
        public void log(String msg) { Log.i(TAG, msg == null ? "" : msg); }

        /* Поворот экрана (2.0): на пианино и гитаре играют, держа телефон
           боком — "landscape" (любой стороной, по датчику, даже если
           автоповорот выключен); "portrait" — снова вертикально. */
        @JavascriptInterface
        public void setOrientation(String mode) {
            final int o = "landscape".equals(mode) ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE : ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
            runOnUiThread(() -> { try { setRequestedOrientation(o); } catch (Exception ignored) { } });
        }

        /* Инструмент во весь экран (2.0): "1" — спрятать системные панели, "0" — вернуть. */
        @JavascriptInterface
        public void setFullscreen(String on) {
            final boolean f = "1".equals(on);
            runOnUiThread(() -> { try { applyFullscreen(f); } catch (Exception ignored) { } });
        }

        /* Слабый телефон (мало памяти): игра один раз подскажет про облегчённый режим. */
        @JavascriptInterface
        public String lowRam() {
            try {
                ActivityManager am = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
                if (am == null) return "0";
                if (am.isLowRamDevice()) return "1";
                ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
                am.getMemoryInfo(mi);
                return mi.totalMem > 0 && mi.totalMem < 3L * 1024 * 1024 * 1024 ? "1" : "0";
            } catch (Exception e) { return "0"; }
        }

        /* «Выход» в окне персонажа: игра уже записана — закрываем приложение. */
        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(() -> {
                try { if ("ready".equals(state)) tts.stop(); } catch (Exception ignored) { }
                finishAndRemoveTask();
            });
        }
    }
}
