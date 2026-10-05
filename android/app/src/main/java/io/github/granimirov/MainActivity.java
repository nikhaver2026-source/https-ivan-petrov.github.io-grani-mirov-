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

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

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
   единица — обычная речь.

   Голосовой пакет Gemini (4.8) — отдельный файл GraniMirov-voicepack.zip:
   installVoicePack() открывает выбор файла, приложение проверяет его и кладёт
   копию в свою папку, а записи отдаёт странице по тому же адресу
   sounds/gvoice_pack/, что и на сайте. О конце установки — вызов
   GraniVoicePackDone(true | false | "cancel"). */
public class MainActivity extends Activity {
    private static final String START = "https://appassets.androidplatform.net/assets/www/index.html";

    private WebView web;
    private TextToSpeech tts;
    /* (9.0) Все движки речи телефона, а не только основной: игрок, поставивший
       себе ещё один синтезатор, выбирает его голос прямо в игре, не меняя
       движок по умолчанию в настройках Android. Говорит тот, чей голос выбран. */
    private final java.util.Map<String, TextToSpeech> others = new java.util.HashMap<>();
    private final java.util.Map<String, String> labels = new java.util.HashMap<>();
    private volatile TextToSpeech speaker;
    private final UtteranceProgressListener prog = new UtteranceProgressListener() {
        @Override public void onStart(String id) { }
        @Override public void onDone(String id) { callJs("GraniTTSDone", id); }
        @Override public void onError(String id) { callJs("GraniTTSError", id); }
        @Override public void onError(String id, int code) { callJs("GraniTTSError", id); }
    };
    private volatile boolean ready = false;
    private final List<String[]> pending = new ArrayList<>();
    private static final int REQ_PACK = 7101;
    private ZipFile pack;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        setVolumeControlStream(AudioManager.STREAM_MUSIC);

        tts = new TextToSpeech(this, status -> {
            if (status != TextToSpeech.SUCCESS) return;
            tts.setLanguage(new Locale("ru", "RU"));
            tts.setOnUtteranceProgressListener(prog);
            if (speaker == null) speaker = tts;
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
            synchronized (pending) { ready = true; wait = new ArrayList<>(pending); pending.clear(); }
            for (String[] p : wait) say(p[0], Float.parseFloat(p[1]), Float.parseFloat(p[2]), p[3]);
        });

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                // Голосовой пакет — из установленного файла, раньше записей самой игры.
                .addPathHandler("/assets/www/sounds/gvoice_pack/", path -> {
                    ZipFile z = pack();
                    if (z == null) return null;
                    ZipEntry e = z.getEntry("gvoice_pack/" + path);
                    if (e == null) return null;
                    try {
                        return new WebResourceResponse(path.endsWith(".js") ? "text/javascript" : "audio/flac", "utf-8", z.getInputStream(e));
                    } catch (Exception ex) { return null; }
                })
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

    /* Приложение уходит в фон или его закрывают: игра записывает себя там,
       где стоит герой, — система может выгрузить её, не спросив страницу. */
    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) web.evaluateJavascript(
            "try{if(typeof entered!=='undefined'&&entered&&typeof saveGame==='function')saveGame(true);}catch(e){}", null);
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

    private synchronized ZipFile pack() {
        if (pack == null) {
            File f = new File(getFilesDir(), "voicepack.zip");
            if (f.exists()) { try { pack = new ZipFile(f); } catch (Exception ignored) { } }
        }
        return pack;
    }

    private void packDone(String v) {
        final String js = "window.GraniVoicePackDone&&window.GraniVoicePackDone(" + v + ")";
        web.post(() -> web.evaluateJavascript(js, null));
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req != REQ_PACK) return;
        if (res != RESULT_OK || data == null || data.getData() == null) { packDone("\"cancel\""); return; }
        final Uri u = data.getData();
        new Thread(() -> {
            File tmp = new File(getFilesDir(), "voicepack.part");
            try (InputStream in = getContentResolver().openInputStream(u); OutputStream out = new FileOutputStream(tmp)) {
                byte[] b = new byte[1 << 16]; int n;
                while ((n = in.read(b)) > 0) out.write(b, 0, n);
            } catch (Exception e) { tmp.delete(); packDone("false"); return; }
            boolean ok;
            try (ZipFile z = new ZipFile(tmp)) {
                ok = z.getEntry("gvoice_pack/m/bank.js") != null || z.getEntry("gvoice_pack/f/bank.js") != null;
            } catch (Exception e) { ok = false; }
            if (ok) {
                synchronized (MainActivity.this) {
                    if (pack != null) { try { pack.close(); } catch (Exception ignored) { } pack = null; }
                    File dst = new File(getFilesDir(), "voicepack.zip");
                    dst.delete();
                    ok = tmp.renameTo(dst);
                }
            } else tmp.delete();
            packDone(ok ? "true" : "false");
        }).start();
    }

    private void callJs(String fn, String id) {
        final String js = "window." + fn + "&&window." + fn + "(" + JSONObject.quote(id) + ")";
        web.post(() -> web.evaluateJavascript(js, null));
    }

    private void say(String text, float rate, float volume, String id) {
        final TextToSpeech tts = speaker != null ? speaker : this.tts;
        /* (9.5.2) Темп приходит числом ползунка «Скорость синтезатора» и
           пересчитывается так же, как у записей Gemini и у моста Windows:
           1 — обычная речь, 5 — в 2,8 раза быстрее. Прежде 5 значило «впятеро». */
        float r = rate > 0 ? rate : 1f;
        float tempo = r <= 1f ? r : 1f + (r - 1f) * 0.45f;
        tts.setSpeechRate(Math.max(0.1f, Math.min(3.5f, tempo)));
        Bundle p = new Bundle();
        p.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, Math.max(0f, Math.min(1f, volume >= 0 ? volume : 1f)));
        /* Очередь ведёт сама игра и шлёт по одной фразе, дождавшись конца прежней.
           QUEUE_FLUSH снимает всё недосказанное в самом синтезаторе в тот же миг,
           что и новая фраза: при быстром листании устаревший пункт больше не
           успевает прозвучать поверх нужного. */
        if (tts.speak(text, TextToSpeech.QUEUE_FLUSH, p, id) != TextToSpeech.SUCCESS) callJs("GraniTTSError", id);
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
            if (ready) { tts.stop(); TextToSpeech sp = speaker; if (sp != null && sp != tts) sp.stop(); }
        }

        @JavascriptInterface
        public boolean isSpeaking() {
            TextToSpeech sp = speaker != null ? speaker : tts;
            return ready && sp.isSpeaking();
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
                /* Голоса прочих движков: id — «движок::голос». */
                synchronized (others) {
                    for (java.util.Map.Entry<String, TextToSpeech> en : others.entrySet()) {
                        Set<Voice> ov = en.getValue().getVoices();
                        if (ov == null) continue;
                        String lab = labels.containsKey(en.getKey()) ? labels.get(en.getKey()) : en.getKey();
                        for (Voice v : ov) {
                            JSONObject o = new JSONObject();
                            Locale l = v.getLocale();
                            o.put("id", en.getKey() + "::" + v.getName());
                            o.put("name", v.getName() + " (" + l.getDisplayName(new Locale("ru")) + ")");
                            o.put("lang", l.toLanguageTag());
                            o.put("local", !v.isNetworkConnectionRequired());
                            o.put("default", false);
                            o.put("engine", lab);
                            a.put(o);
                        }
                    }
                }
            } catch (Exception ignored) { }
            return a.toString();
        }

        /* «Установить голосовой пакет»: выбор скачанного файла. */
        @JavascriptInterface
        public void installVoicePack() {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/zip", "application/x-zip-compressed", "application/octet-stream"});
                try { startActivityForResult(i, REQ_PACK); } catch (Exception e) { packDone("false"); }
            });
        }

        /* Полный APK: голосовой пакет уже внутри приложения (assets) — ставить нечего. */
        @JavascriptInterface
        public boolean voicePackBuiltin() {
            for (String v : new String[]{"m", "f"}) {
                try (java.io.InputStream in = getAssets().open("www/sounds/gvoice_pack/" + v + "/bank.js")) { return true; }
                catch (Exception ignored) { }
            }
            return false;
        }

        /* «Выход» в меню действий: игра уже сохранилась — закрываем приложение. */
        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(() -> {
                try { if (ready) tts.stop(); } catch (Exception ignored) { }
                finishAndRemoveTask();
            });
        }

        @JavascriptInterface
        public void setVoice(String name) {
            if (!ready || name == null) return;
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
    }
}
