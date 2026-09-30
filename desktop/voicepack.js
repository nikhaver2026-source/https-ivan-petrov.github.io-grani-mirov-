// Голосовой пакет Gemini в приложении для Windows: файл GraniMirov-voicepack.zip
// читается прямо, без распаковки. Приложение ищет его в своей папке данных
// (куда кладёт кнопка «Установить голосовой пакет»), рядом с GraniMirov.exe и в
// папке «Загрузки»; распакованная папка gvoice_pack рядом с exe тоже подходит.
const fs = require('fs'), path = require('path'), zlib = require('zlib'), os = require('os');

// Оглавление zip: имя → {offset, size, csize, method}.
function readZipIndex(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const st = fs.fstatSync(fd);
    const tailLen = Math.min(st.size, 65557);
    const tail = Buffer.alloc(tailLen);
    fs.readSync(fd, tail, 0, tailLen, st.size - tailLen);
    let e = -1;
    for (let i = tailLen - 22; i >= 0; i--) if (tail.readUInt32LE(i) === 0x06054b50) { e = i; break; }
    if (e < 0) return null;
    let count = tail.readUInt16LE(e + 10), cdSize = tail.readUInt32LE(e + 12), cdOff = tail.readUInt32LE(e + 16);
    if (cdOff === 0xffffffff || count === 0xffff) {
      // ZIP64: запись о конце каталога — перед обычной.
      const loc = e - 20;
      if (loc >= 0 && tail.readUInt32LE(loc) === 0x07064b50) {
        const z64 = Number(tail.readBigUInt64LE(loc + 8));
        const b = Buffer.alloc(56); fs.readSync(fd, b, 0, 56, z64);
        count = Number(b.readBigUInt64LE(32)); cdSize = Number(b.readBigUInt64LE(40)); cdOff = Number(b.readBigUInt64LE(48));
      }
    }
    const cd = Buffer.alloc(cdSize); fs.readSync(fd, cd, 0, cdSize, cdOff);
    const idx = new Map(); let p = 0;
    for (let n = 0; n < count && p + 46 <= cd.length; n++) {
      if (cd.readUInt32LE(p) !== 0x02014b50) break;
      const method = cd.readUInt16LE(p + 10);
      let csize = cd.readUInt32LE(p + 20), size = cd.readUInt32LE(p + 24);
      const nl = cd.readUInt16LE(p + 28), xl = cd.readUInt16LE(p + 30), cl = cd.readUInt16LE(p + 32);
      let off = cd.readUInt32LE(p + 42);
      const name = cd.toString('utf8', p + 46, p + 46 + nl).replace(/\\/g, '/');
      // ZIP64 в дополнительном поле.
      let x = p + 46 + nl; const xe = x + xl;
      while (x + 4 <= xe) {
        const id = cd.readUInt16LE(x), len = cd.readUInt16LE(x + 2); let q = x + 4;
        if (id === 1) {
          if (size === 0xffffffff) { size = Number(cd.readBigUInt64LE(q)); q += 8; }
          if (csize === 0xffffffff) { csize = Number(cd.readBigUInt64LE(q)); q += 8; }
          if (off === 0xffffffff) { off = Number(cd.readBigUInt64LE(q)); q += 8; }
        }
        x += 4 + len;
      }
      if (!name.endsWith('/')) idx.set(name, { off, size, csize, method });
      p += 46 + nl + xl + cl;
    }
    return idx;
  } finally { fs.closeSync(fd); }
}

class VoicePack {
  constructor(app) { this.app = app; this.file = null; this.idx = null; this.dir = null; }
  candidates() {
    const out = [];
    const add = f => { if (f && !out.includes(f)) out.push(f); };
    try { add(path.join(this.app.getPath('userData'), 'GraniMirov-voicepack.zip')); } catch (_) { }
    const exeDir = path.dirname(process.execPath);
    try { add(path.join(this.app.getPath('downloads'), 'GraniMirov-voicepack.zip')); } catch (_) { }
    add(path.join(exeDir, 'GraniMirov-voicepack.zip'));
    try {
      // Скачанный повторно файл браузер называет «… (1).zip»: берём самый свежий.
      const dl = this.app.getPath('downloads');
      fs.readdirSync(dl).filter(n => /^GraniMirov-voicepack.*\.zip$/i.test(n))
        .map(n => path.join(dl, n)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs).forEach(add);
    } catch (_) { }
    return out;
  }
  // Найти пакет; true — если нашёлся.
  load() {
    this.file = null; this.idx = null; this.dir = null;
    const exeDir = path.dirname(process.execPath);
    for (const d of [path.join(exeDir, 'gvoice_pack'), path.join(exeDir, 'voicepack', 'gvoice_pack')]) {
      if (fs.existsSync(path.join(d, 'm', 'bank.js')) || fs.existsSync(path.join(d, 'f', 'bank.js'))) { this.dir = d; return true; }
    }
    for (const f of this.candidates()) {
      try {
        if (!fs.existsSync(f)) continue;
        const idx = readZipIndex(f);
        if (idx && (idx.has('gvoice_pack/m/bank.js') || idx.has('gvoice_pack/f/bank.js'))) { this.file = f; this.idx = idx; return true; }
      } catch (_) { }
    }
    return false;
  }
  // Проверить выбранный файл и положить копию в папку данных приложения.
  install(src) {
    const idx = readZipIndex(src);
    if (!idx || !(idx.has('gvoice_pack/m/bank.js') || idx.has('gvoice_pack/f/bank.js'))) return false;
    const dst = path.join(this.app.getPath('userData'), 'GraniMirov-voicepack.zip');
    if (path.resolve(src) !== path.resolve(dst)) {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      const tmp = dst + '.part'; fs.copyFileSync(src, tmp); fs.renameSync(tmp, dst);
    }
    return this.load();
  }
  // Содержимое файла пакета по пути внутри gvoice_pack/ (например «m/p00001.flac»).
  async read(rel) {
    rel = String(rel || '').replace(/^\/+/, '');
    if (rel.includes('..')) return null;
    if (this.dir) {
      const f = path.join(this.dir, rel);
      try { return await fs.promises.readFile(f); } catch (_) { return null; }
    }
    if (!this.idx) return null;
    const e = this.idx.get('gvoice_pack/' + rel);
    if (!e) return null;
    const fh = await fs.promises.open(this.file, 'r');
    try {
      const h = Buffer.alloc(30); await fh.read(h, 0, 30, e.off);
      if (h.readUInt32LE(0) !== 0x04034b50) return null;
      const start = e.off + 30 + h.readUInt16LE(26) + h.readUInt16LE(28);
      const buf = Buffer.alloc(e.csize); await fh.read(buf, 0, e.csize, start);
      if (e.method === 0) return buf;
      if (e.method === 8) return zlib.inflateRawSync(buf);
      return null;
    } finally { await fh.close(); }
  }
  info() { return { installed: !!(this.idx || this.dir), file: this.file || this.dir || '' }; }
}
module.exports = { VoicePack, readZipIndex };
