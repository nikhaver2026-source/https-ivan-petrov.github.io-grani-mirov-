package io.github.granimirov;

import android.app.Activity;
import android.content.Intent;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.window.OnBackInvokedDispatcher;
import android.view.WindowInsets;
import android.widget.FrameLayout;

import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/* «Грань Миров» на Android.

   Вся игра лежит в assets/www и открывается по адресу
   https://appassets.androidplatform.net/assets/www/index.html: так у страницы
   настоящий https-источник, и работают фоновые обработчики речи, модель
   встроенного голоса и записи — без сети и без file://.

   Мост GraniTTS отдаёт странице синтезатор речи телефона — тот же, что у
   TalkBack. Страница зовёт speak(текст, темп, громкость, номер), stop(),
   isSpeaking(), getVoices() и setVoice(имя); о конце фразы приложение
   сообщает вызовом GraniTTSDone(номер), об ошибке — GraniTTSError(номер).
   Темп приходит в той же шкале, что у Web Speech API в Chrome для Android:
   единица — обычная речь. */
public class MainActivity extends Activity {
    private static final String START = "https://appassets.androidplatform.net/assets/www/index.html";

    private WebView web;
    private TextToSpeech tts;
    private volatile boolean ready = false;
    private final List<String[]> pending = new ArrayList<>();

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        setVolumeControlStream(AudioManager.STREAM_MUSIC);

        tts = new TextToSpeech(this, status -> {
            if (status != TextToSpeech.SUCCESS) return;
            tts.setLanguage(new Locale("ru", "RU"));
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) { }
                @Override public void onDone(String id) { callJs("GraniTTSDone", id); }
                @Override public void onError(String id) { callJs("GraniTTSError", id); }
                @Override public void onError(String id, int code) { callJs("GraniTTSError", id); }
            });
            List<String[]> wait;
            synchronized (pending) { ready = true; wait = new ArrayList<>(pending); pending.clear(); }
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

        web.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                return loader.shouldInterceptRequest(req.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if ("appassets.androidplatform.net".equals(u.getHost())) return false;
                /* Внешние ссылки (лицензии, авторы) — в браузере телефона. */
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "GraniTTS");
        /* С целевым API 35 и выше окно всегда рисуется от края до края:
           поля под строку состояния и панель жестов ставим сами, иначе
           верх и низ игры уходят под них. */
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xFF10121C);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
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
        /* Android 13+ и тем более 16: «Назад» приходит обратным вызовом,
           onBackPressed при целевом API 36 не зовётся. */
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::goBack);
        }
        if (state != null) web.restoreState(state);
        else web.loadUrl(START);
    }

    /* Кнопка «Назад» закрывает верхнее окно игры, как свайп двумя пальцами
       вниз; на игровом поле — сворачивает приложение, не выходя из игры. */
    @Override
    public void onBackPressed() {
        goBack();
    }

    private void goBack() {
        web.evaluateJavascript(
                "(function(){try{if(typeof activeLayer==='function'&&activeLayer()){closeTopUI();return 1;}}catch(e){}return 0;})()",
                v -> { if (!"1".equals(v)) moveTaskToBack(true); });
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        if (web != null) web.destroy();
        super.onDestroy();
    }

    private void callJs(String fn, String id) {
        final String js = "window." + fn + "&&window." + fn + "(" + JSONObject.quote(id) + ")";
        web.post(() -> web.evaluateJavascript(js, null));
    }

    private void say(String text, float rate, float volume, String id) {
        tts.setSpeechRate(Math.max(0.1f, Math.min(6f, rate > 0 ? rate : 1f)));
        Bundle p = new Bundle();
        p.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, Math.max(0f, Math.min(1f, volume >= 0 ? volume : 1f)));
        if (tts.speak(text, TextToSpeech.QUEUE_ADD, p, id) != TextToSpeech.SUCCESS) callJs("GraniTTSError", id);
    }

    private class Bridge {
        @JavascriptInterface
        public void speak(String text, double rate, double volume, String id) {
            synchronized (pending) {
                if (!ready) { pending.add(new String[]{text, String.valueOf(rate), String.valueOf(volume), id}); return; }
            }
            say(text, (float) rate, (float) volume, id);
        }

        @JavascriptInterface
        public void stop() {
            synchronized (pending) { pending.clear(); }
            if (ready) tts.stop();
        }

        @JavascriptInterface
        public boolean isSpeaking() {
            return ready && tts.isSpeaking();
        }

        /* Голоса телефона: имя, язык, работает ли без сети. Сетевые страница
           сама прячет по умолчанию. */
        @JavascriptInterface
        public String getVoices() {
            JSONArray a = new JSONArray();
            if (!ready) return a.toString();
            try {
                Set<Voice> vs = tts.getVoices();
                Voice cur = tts.getVoice();
                if (vs != null) for (Voice v : vs) {
                    JSONObject o = new JSONObject();
                    Locale l = v.getLocale();
                    o.put("id", v.getName());
                    o.put("name", v.getName() + " (" + l.getDisplayName(new Locale("ru")) + ")");
                    o.put("lang", l.toLanguageTag());
                    o.put("local", !v.isNetworkConnectionRequired());
                    o.put("default", cur != null && cur.getName().equals(v.getName()));
                    o.put("engine", tts.getDefaultEngine());
                    a.put(o);
                }
            } catch (Exception ignored) { }
            return a.toString();
        }

        @JavascriptInterface
        public void setVoice(String name) {
            if (!ready || name == null) return;
            try {
                Set<Voice> vs = tts.getVoices();
                if (vs != null) for (Voice v : vs) if (name.equals(v.getName())) { tts.setVoice(v); return; }
            } catch (Exception ignored) { }
        }
    }
}
