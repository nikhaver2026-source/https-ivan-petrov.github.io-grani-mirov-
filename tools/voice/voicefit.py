# -*- coding: utf-8 -*-
"""Подогнать новую запись под голос народа: высота как была, громкость −18 LUFS.

    python3 voicefit.py сырая.mp3 файл_народа.mp3 куда.mp3 [цель_Гц]

Четвёртый довод — высота в герцах, если её нужно задать прямо (эталон
измерился неверно или сдвиг до него слишком велик для чистого звука).

Высоту не «сдвигаем на столько-то», а ПРИВОДИМ к той, что уже звучит у этого
народа: у каждого дубля своя основная частота, и постоянный сдвиг увёл бы
народ от собственного голоса. Форманты сохраняются — меняется голос, а не
скорость речи.

Подгонка идёт по несжатому промежуточному файлу и уточняется до трёх раз:
растяжитель высоты не даёт ровно тот множитель, о котором его просят. В mp3
запись переводится ОДИН раз, в самом конце, — чтобы потерь было одно
поколение, а не три.
"""
import subprocess,sys,os,tempfile
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from f0 import f0

def гнать(вход,выход,фильтр=None):
    cmd=["ffmpeg","-v","error","-y","-i",вход]
    if фильтр: cmd+=["-af",фильтр]
    cmd+=["-ac","1","-ar","44100"]
    cmd+=(["-c:a","pcm_s16le"] if выход.endswith(".wav") else
          ["-c:a","libmp3lame","-b:a","192k"])
    cmd+=[выход]
    subprocess.run(cmd,check=True)

def main():
    сырая,эталон,выход=sys.argv[1],sys.argv[2],sys.argv[3]
    ц=float(sys.argv[4]) if len(sys.argv)>4 else f0(эталон)
    if not ц: raise SystemExit("не слышу основную частоту эталона: "+эталон)
    раб=tempfile.mkdtemp()
    исход=os.path.join(раб,"src.wav")
    гнать(сырая,исход)
    н=f0(исход)
    if not н: raise SystemExit("не слышу основную частоту дубля: "+сырая)
    k=max(0.5,min(2.0,ц/н)); лучшее=None
    for _ in range(3):
        проба=os.path.join(раб,"try.wav")
        гнать(исход,проба,"rubberband=pitch=%.6f:formant=preserved:pitchq=quality"%k)
        г=f0(проба)
        if not г: break
        ош=abs(г-ц)/ц
        if лучшее is None or ош<лучшее[0]:
            лучшее=(ош,k,г)
        if ош<=0.012: break
        k=max(0.5,min(2.0,k*(ц/г)))
    if лучшее is None: raise SystemExit("подгонка не удалась: "+сырая)
    ош,k,г=лучшее
    гнать(исход,выход,"rubberband=pitch=%.6f:formant=preserved:pitchq=quality,"
                      "loudnorm=I=-18:TP=-1.5:LRA=11"%k)
    print("%-32s эталон %.1f, дубль %.1f → %.1f Гц (×%.3f, расхождение %.1f%%)"
          %(os.path.basename(выход),ц,н,f0(выход) or 0,k,ош*100))

if __name__=="__main__": main()
