package io.github.granimirov;

import android.content.Context;
import android.content.res.AssetManager;
import android.net.ConnectivityManager;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;

import java.io.ByteArrayInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

final class AssetFiles {
    static final String HOST = "appassets.androidplatform.net";
    private static final String LOCAL = "/assets/www/";
    private static final String BASE = "https://raw.githubusercontent.com/nikhaver2026-source/"
            + "https-ivan-petrov.github.io-grani-mirov-/bf5ec7eb71dbf71c8ac3a70418b23450083a9e4a/";
    private final AssetManager assets;
    private final ConnectivityManager network;

    AssetFiles(Context context) {
        assets = context.getAssets();
        network = context.getSystemService(ConnectivityManager.class);
    }

    WebResourceResponse open(WebResourceRequest request) {
        Uri url = request.getUrl();
        if (!"https".equals(url.getScheme()) || !HOST.equals(url.getHost()) || url.getPort() != -1) {
            return null;
        }
        String path = url.getPath();
        if (!"GET".equals(request.getMethod()) || path == null || !path.startsWith(LOCAL)) return missing();
        String name = path.substring(LOCAL.length());
        if (!name.matches("[a-zA-Z0-9_./-]+") || name.contains("..") || name.contains("//")
                || name.startsWith("/") || name.endsWith("/")) return missing();

        String mime = mime(name);
        String encoding = mime.startsWith("text/") || mime.equals("application/json") ? "UTF-8" : null;
        try {
            return new WebResourceResponse(mime, encoding, assets.open("www/" + name));
        } catch (IOException absent) {
            if (!name.startsWith("sounds/") || network == null || network.getActiveNetwork() == null) return missing();
            if (!mime.startsWith("audio/")) return missing();
            String range = null;
            for (Map.Entry<String, String> header : request.getRequestHeaders().entrySet()) {
                if (header.getKey().equalsIgnoreCase("Range")) range = header.getValue();
            }
            return sound(name, mime, range);
        }
    }

    private static WebResourceResponse sound(String name, String mime, String range) {
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(BASE + name).openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(2500);
            connection.setReadTimeout(4500);
            if (range != null && range.matches("bytes=[0-9]*-[0-9]*")) {
                connection.setRequestProperty("Range", range);
            }
            int status = connection.getResponseCode();
            if (status != 200 && status != 206) {
                connection.disconnect();
                return missing();
            }

            Map<String, String> headers = new HashMap<>();
            for (String header : new String[]{"Content-Length", "Content-Range", "Accept-Ranges"}) {
                String value = connection.getHeaderField(header);
                if (value != null) headers.put(header, value);
            }
            headers.put("Cache-Control", "public, max-age=604800");
            final HttpURLConnection body = connection;
            InputStream stream = new FilterInputStream(body.getInputStream()) {
                @Override public void close() throws IOException {
                    try { super.close(); } finally { body.disconnect(); }
                }
            };
            return new WebResourceResponse(mime, null, status, status == 206 ? "Partial Content" : "OK",
                    headers, stream);
        } catch (IOException error) {
            if (connection != null) connection.disconnect();
            return missing();
        }
    }

    private static WebResourceResponse missing() {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
                new HashMap<>(), new ByteArrayInputStream(new byte[0]));
    }

    private static String mime(String path) {
        String ext = path.substring(path.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        switch (ext) {
            case "html": return "text/html";
            case "js": return "text/javascript";
            case "txt": case "md": return "text/plain";
            case "css": return "text/css";
            case "json": return "application/json";
            case "png": return "image/png";
            case "ogg": case "oga": return "audio/ogg";
            case "flac": return "audio/flac";
            case "mp3": return "audio/mpeg";
            case "wav": return "audio/wav";
            case "m4a": return "audio/mp4";
            case "opus": return "audio/ogg";
            default: return "application/octet-stream";
        }
    }
}
