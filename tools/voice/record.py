# -*- coding: utf-8 -*-
"""Записать реплики народов через API ElevenLabs и подогнать их под голос народа.

    ELEVENLABS_API_KEY=… python3 tools/voice/record.py            # все, что ждут квоты
    ELEVENLABS_API_KEY=… python3 tools/voice/record.py race_trolli # только названные
    python3 tools/voice/record.py --dry-run                        # что будет записано и почём

Ключ берётся ТОЛЬКО из переменной окружения ELEVENLABS_API_KEY и никуда не
пишется: ни в файлы, ни в вывод. В игру и в репозиторий ключ не попадает.

Что ждёт записи — строки `sounds/voice/CREDITS.md` с пометкой «ждёт квоты»;
тексты — в `lines.json`. Голос — «ГМ Подгорные — мужской», низкий бас,
сохранённый в учётной записи для тяжёлых и тёмных народов. Каждый дубль
приводится к той высоте, что уже звучит у народа (`voicefit.py`), громкость
−18 LUFS. Сырые дубли кладутся в `tools/voice/raw/`: оборвался прогон —
повторный запуск не платит второй раз за то, что уже скачано. После удачного
прогона папка удаляется.
"""
import io,json,os,re,shutil,subprocess,sys,time,urllib.request,urllib.error

КОРЕНЬ=os.path.abspath(os.path.join(os.path.dirname(__file__),"..",".."))
ТУТ=os.path.dirname(os.path.abspath(__file__))
ГОЛОС="lv8OaMrb4NLKFsuYVMNj"          # ГМ Подгорные — мужской
МОДЕЛЬ="eleven_multilingual_v2"
НАСТРОЙ={"stability":0.5,"similarity_boost":0.8,"style":0.0,"use_speaker_boost":True}

def ждут():
    t=io.open(os.path.join(КОРЕНЬ,"sounds","voice","CREDITS.md"),encoding="utf-8").read()
    return re.findall(r"^\| (race_[a-z_]+)\.mp3 \|[^|]*\| текст готов, запись ждёт квоты",t,re.M)

def запрос(текст,ключ,формат):
    тело=json.dumps({"text":текст,"model_id":МОДЕЛЬ,"language_code":"ru",
                     "voice_settings":НАСТРОЙ}).encode("utf-8")
    r=urllib.request.Request(
        "https://api.elevenlabs.io/v1/text-to-speech/%s?output_format=%s"%(ГОЛОС,формат),
        data=тело,headers={"xi-api-key":ключ,"Content-Type":"application/json",
                           "Accept":"audio/mpeg"})
    with urllib.request.urlopen(r,timeout=120) as о:
        return о.read()

def main():
    арг=[a for a in sys.argv[1:] if not a.startswith("--")]
    сухо="--dry-run" in sys.argv
    строки=json.load(io.open(os.path.join(ТУТ,"lines.json"),encoding="utf-8"))
    имена=арг or ждут()
    нет=[и for и in имена if и not in строки]
    if нет: raise SystemExit("нет текста в lines.json: "+", ".join(нет))
    знаков=sum(len(строки[и][1]) for и in имена)
    print("к записи %d реплик, %d знаков (≈ столько же кредитов)"%(len(имена),знаков))
    if сухо:
        for и in имена: print("  %-28s %s"%(и,строки[и][1]))
        return
    ключ=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not ключ: raise SystemExit("нет ELEVENLABS_API_KEY в окружении")
    сырьё=os.path.join(ТУТ,"raw"); os.makedirs(сырьё,exist_ok=True)
    формат="mp3_44100_192"; готово=[]
    for и in имена:
        сыр=os.path.join(сырьё,и+".mp3")
        if not os.path.exists(сыр):
            for попытка in range(4):
                try:
                    данные=запрос(строки[и][1],ключ,формат)
                    break
                except urllib.error.HTTPError as e:
                    тело=e.read().decode("utf-8","replace")[:300]
                    if e.code in (400,403) and формат!="mp3_44100_128" and "output_format" in тело:
                        формат="mp3_44100_128"; continue      # тариф ниже Creator
                    if e.code==429 or e.code>=500:
                        time.sleep(2**попытка*2); continue
                    raise SystemExit("%s: HTTP %d %s"%(и,e.code,тело))
            else:
                raise SystemExit(и+": не удалось после четырёх попыток")
            io.open(сыр,"wb").write(данные)
        эталон=os.path.join(КОРЕНЬ,"sounds","voice",и+".mp3")
        новая=os.path.join(сырьё,и+".fit.mp3")
        subprocess.run([sys.executable,os.path.join(ТУТ,"voicefit.py"),сыр,эталон,новая],check=True)
        готово.append((и,новая))
    for и,новая in готово:
        os.replace(новая,os.path.join(КОРЕНЬ,"sounds","voice",и+".mp3"))
    shutil.rmtree(сырьё,ignore_errors=True)
    print("записано и положено на место: %d (формат %s)"%(len(готово),формат))
    print("дальше: VOICE_RACES (последнее число → 1), VOICE_LEN, CREDITS.md, BITRATE_BASELINE, наборы 119/175/177/152")

if __name__=="__main__": main()
