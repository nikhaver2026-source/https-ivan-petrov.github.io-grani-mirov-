package io.github.granimirov.lab;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.util.Log;
import android.view.View;
import android.view.WindowInsets;
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
   vibrate(узор), exitApp(), log(строка). О начале, конце и ошибке фразы
   приложение сообщает вызовами LabTTSStart(номер), LabTTSDone(номер),
   LabTTSError(номер). Кнопка «Назад» закрывает окно игры (labBack). */
public class MainActivity extends Activity {
    private static final String START = "https://appassets.androidplatform.net/assets/www/index.html";
    private static final String TAG = "LabJS";

    private WebView web;
    private TextToSpeech tts;
    private final Map<String, TextToSpeech> others = new HashMap<>();
    private final Map<String, String> labels = new HashMap<>();
    private volatile TextToSpeech speaker;
    private volatile String state = "init";
    private final List<String[]> pending = new ArrayList<>();

    private final UtteranceProgressListener prog = new UtteranceProgressListener() {
        @Override public void onStart(String id) { callJs("LabTTSStart", id); }
        @Override public void onDone(String id) { callJs("LabTTSDone", id); }
        @Override public void onError(String id) { callJs("LabTTSError", id); }
        @Override public void onError(String id, int code) { callJs("LabTTSError", id); }
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
                    }, pkg);
                }
            } catch (Exception ignored) { }
            List<String[]> wait;
            synchronized (pending) { state = "ready"; wait = new ArrayList<>(pending); pending.clear(); }
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

    @Override
    public void onBackPressed() { goBack(); }

    /* «Назад» закрывает верхнее окно игры; на игровом поле — открывает окно
       персонажа (там «Сохранить игру» и «Выход»). */
    private void goBack() {
        web.evaluateJavascript("(function(){try{return window.labBack?window.labBack():0;}catch(e){return 0;}})()",
                v -> { if (!"1".equals(v)) moveTaskToBack(true); });
    }

    /* Уход в фон: игра записывает себя (автозапись). */
    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) web.evaluateJavascript("try{window.labPause&&window.labPause();}catch(e){}", null);
    }

    /* Возврат на экран: единые обработчики звука и речи будят звук и повторяют
       фразу, оборванную уходом в фон (labResume). */
    @Override
    protected void onResume() {
        super.onResume();
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

        @JavascriptInterface
        public boolean hasRussian() {
            if (!"ready".equals(state)) return true;
            try {
                int r = tts.isLanguageAvailable(new Locale("ru", "RU"));
                return r >= TextToSpeech.LANG_AVAILABLE;
            } catch (Exception e) { return false; }
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

        @JavascriptInterface
        public void setVoice(String name) {
            if (!"ready".equals(state) || name == null) return;
            try {
                int cut = name.indexOf("::");
                if (cut > 0) {
                    TextToSpeech t;
                    synchronized (others) { t = others.get(name.substring(0, cut)); }
                    String vn = name.substring(cut + 2);
                    if (t != null) {
                        Set<Voice> ov = t.getVoices();
                        if (ov != null) for (Voice v : ov) if (vn.equals(v.getName())) { tts.stop(); t.setVoice(v); speaker = t; return; }
                    }
                    return;
                }
                Set<Voice> vs = tts.getVoices();
                if (vs != null) for (Voice v : vs) if (name.equals(v.getName())) { TextToSpeech sp = speaker; if (sp != null && sp != tts) sp.stop(); tts.setVoice(v); speaker = tts; return; }
            } catch (Exception ignored) { }
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
