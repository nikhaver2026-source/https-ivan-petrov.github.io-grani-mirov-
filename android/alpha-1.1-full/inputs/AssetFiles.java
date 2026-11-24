package io.github.granimirov;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;

import java.io.ByteArrayInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class AssetFiles {
    static final String HOST = "appassets.androidplatform.net";
    private static final String LOCAL = "/assets/www/";
    private static final Pattern BYTE_RANGE = Pattern.compile("bytes=([0-9]*)-([0-9]*)");
    private final AssetManager assets;

    AssetFiles(Context context) {
        assets = context.getAssets();
    }

    WebResourceResponse open(WebResourceRequest request) {
        Uri url = request.getUrl();
        if (!"https".equals(url.getScheme()) || !HOST.equals(url.getHost()) || url.getPort() != -1) return null;
        String path = url.getPath();
        if (!"GET".equals(request.getMethod()) || path == null || !path.startsWith(LOCAL)) return missing();
        String name = path.substring(LOCAL.length());
        if (name.indexOf('\\') >= 0 || name.indexOf(0) >= 0) return missing();
        for (String part : name.split("/", -1)) {
            if (part.isEmpty() || part.equals(".") || part.equals("..")) return missing();
        }

        String type = mime(name);
        String charset = type.startsWith("text/") || type.equals("application/json") ? "UTF-8" : null;
        try {
            if (type.startsWith("audio/")) return audio("www/" + name, type, request);
            return new WebResourceResponse(type, charset, assets.open("www/" + name, AssetManager.ACCESS_STREAMING));
        } catch (IOException error) {
            return missing();
        }
    }

    private WebResourceResponse audio(String file, String type, WebResourceRequest request) throws IOException {
        final AssetFileDescriptor fd;
        try {
            fd = assets.openFd(file);
        } catch (IOException error) {
            // Android can still open the entry sequentially if its WebView cannot use a file descriptor.
            return new WebResourceResponse(type, null, assets.open(file, AssetManager.ACCESS_STREAMING));
        }
        InputStream stream = null;
        try {
            long length = fd.getLength();
            Map<String, String> headers = new HashMap<>();
            headers.put("Accept-Ranges", "bytes");
            String value = null;
            for (Map.Entry<String, String> header : request.getRequestHeaders().entrySet()) {
                if (header.getKey().equalsIgnoreCase("Range")) value = header.getValue();
            }
            long from = 0;
            long to = length - 1;
            Matcher range = value == null ? null : BYTE_RANGE.matcher(value);
            boolean partial = range != null && range.matches();
            if (partial) {
                try {
                    if (range.group(1).isEmpty()) {
                        long suffix = Long.parseLong(range.group(2));
                        from = Math.max(0, length - suffix);
                    } else {
                        from = Long.parseLong(range.group(1));
                        if (!range.group(2).isEmpty()) to = Math.min(to, Long.parseLong(range.group(2)));
                    }
                } catch (NumberFormatException error) {
                    from = length;
                }
                if (from > to || from >= length) {
                    fd.close();
                    headers.put("Content-Range", "bytes */" + length);
                    return new WebResourceResponse(type, null, 416, "Range Not Satisfiable", headers,
                            new ByteArrayInputStream(new byte[0]));
                }
                headers.put("Content-Range", "bytes " + from + "-" + to + "/" + length);
            }
            long size = to - from + 1;
            headers.put("Content-Length", Long.toString(size));
            stream = fd.createInputStream();
            long remaining = from;
            while (remaining > 0) {
                long skipped = stream.skip(remaining);
                if (skipped <= 0) throw new IOException("Cannot seek within asset");
                remaining -= skipped;
            }
            return new WebResourceResponse(type, null, partial ? 206 : 200,
                    partial ? "Partial Content" : "OK", headers, new Section(stream, size));
        } catch (IOException | RuntimeException error) {
            if (stream == null) fd.close(); else stream.close();
            throw error;
        }
    }

    private static final class Section extends FilterInputStream {
        private long remaining;

        Section(InputStream stream, long length) {
            super(stream);
            remaining = length;
        }

        @Override public int read() throws IOException {
            if (remaining == 0) return -1;
            int result = in.read();
            if (result >= 0) remaining--;
            return result;
        }

        @Override public int read(byte[] out, int offset, int length) throws IOException {
            if (length == 0) return 0;
            if (remaining == 0) return -1;
            int read = in.read(out, offset, (int)Math.min(length, remaining));
            if (read > 0) remaining -= read;
            return read;
        }

        @Override public int available() throws IOException {
            return (int)Math.min(remaining, in.available());
        }

        @Override public long skip(long count) throws IOException {
            long skipped = in.skip(Math.min(count, remaining));
            remaining -= skipped;
            return skipped;
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
            case "ogg": case "oga": case "opus": return "audio/ogg";
            case "flac": return "audio/flac";
            case "mp3": return "audio/mpeg";
            case "wav": return "audio/wav";
            case "m4a": return "audio/mp4";
            case "aac": return "audio/aac";
            case "webm": return "audio/webm";
            default: return "application/octet-stream";
        }
    }
}
