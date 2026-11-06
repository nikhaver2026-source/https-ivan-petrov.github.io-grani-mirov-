#!/usr/bin/env python3.13
"""judge2.py — второй, независимый судья разборчивости: распознаватель Zipformer (Vosk/alphacep, другая модель и
другие данные обучения, чем GigaAM). Цены синтезатора учились по GigaAM; второй судья показывает, не подстроились
ли мы под его причуды. узнать2(y24к) → текст."""
import numpy as np, sherpa_onnx
Z = "/root/S/asr/zipformer-ru"
_r = None


def _rec(threads=1):
    global _r
    if _r is None:
        _r = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f"{Z}/encoder.int8.onnx", decoder=f"{Z}/decoder.int8.onnx",
                                                           joiner=f"{Z}/joiner.int8.onnx", tokens=f"{Z}/tokens.txt", num_threads=threads)
    return _r


def узнать2(y, sr=24000, threads=1):
    y = np.concatenate([np.zeros(int(sr * 0.1), np.float32), np.asarray(y, np.float32), np.zeros(int(sr * 0.1), np.float32)])
    a16 = np.interp(np.arange(0, len(y), sr / 16000), np.arange(len(y)), y).astype(np.float32)
    r = _rec(threads); s = r.create_stream(); s.accept_waveform(16000, a16); r.decode_stream(s)
    return s.result.text
