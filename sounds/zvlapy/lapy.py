"""lapy.py — шаги лап из шагов по траве и щебню (0 A.D., CC BY-SA 3.0): короткий удар выше тоном, мягче по верхам,
в четвероногом ритме — два касания на шаг, четыре на бегу. Пишет FLAC 44,1 кГц моно в папку назначения."""
import sys,numpy as np,soundfile as sf
SRC="/home/user/https-ivan-petrov.github.io-grani-mirov-/sounds/tread/";OUT=sys.argv[1]
SR=44100
def load(n):
    x,sr=sf.read(SRC+n,always_2d=True);x=x.mean(axis=1)
    if sr!=SR:t=np.arange(0,len(x)*SR/sr)/SR;x=np.interp(t,np.arange(len(x))/sr,x)
    return x
def onset(x):
    e=np.abs(x);th=0.2*e.max();i=int(np.argmax(e>th));return max(0,i-int(0.004*SR))
def pitch(x,k):  # выше тоном и короче: читаем быстрее
    t=np.arange(0,len(x)/k);return np.interp(t*k,np.arange(len(x)),x)
def lp(x,fc):
    a=np.exp(-2*np.pi*fc/SR);y=np.zeros_like(x);s=0.0
    for i,v in enumerate(x):s=(1-a)*v+a*s;y[i]=s
    return y
def hp(x,fc):
    return x-lp(x,fc)
def tap(x,k,ms):
    i=onset(x);seg=x[i:i+int(ms/1000*SR*k)];seg=pitch(seg,k);seg=lp(lp(seg,3600),5200);seg=hp(seg,110)
    n=len(seg);f=np.ones(n);fo=int(0.04*SR);f[-fo:]=np.linspace(1,0,fo);fi=int(0.002*SR);f[:fi]=np.linspace(0,1,fi);return seg*f
def place(parts,total_ms):
    y=np.zeros(int(total_ms/1000*SR))
    for at,seg,g in parts:
        i=int(at/1000*SR);j=min(len(y),i+len(seg));y[i:j]+=seg[:j-i]*g
    return y
def norm(y,db=-3.0):
    p=np.abs(y).max();return y*(10**(db/20)/p) if p>0 else y
srcs=[load(n) for n in ["tread_grass_01.ogg","tread_grass_02.ogg","tread_grass_03.ogg","tread_gravel_01.ogg","tread_gravel_02.ogg","tread_gravel_03.ogg"]]
rng=np.random.default_rng(15505)
# шаг: два касания (передняя и задняя лапа)
for n in range(4):
    a,b=srcs[n%6],srcs[(n+3)%6];k1,k2=1.42+0.06*rng.random(),1.5+0.06*rng.random()
    t1=tap(a,k1,150);t2=tap(b,k2,140);gap=96+rng.integers(0,26)
    y=place([(0,t1,1.0),(gap,t2,0.72)],gap+200);sf.write(f"{OUT}/zv_paw_walk_0{n+1}.flac",norm(y),SR,subtype="PCM_16")
# бег: четыре касания, ритм галопа
for n in range(3):
    ks=[1.55+0.08*rng.random() for _ in range(4)];idx=[(n+i)%6 for i in range(4)]
    ts=[tap(srcs[idx[i]],ks[i],120) for i in range(4)];gaps=[0,62+rng.integers(0,10),118+rng.integers(0,12),205+rng.integers(0,14)]
    y=place([(gaps[i],ts[i],[1.0,0.8,0.92,0.7][i]) for i in range(4)],gaps[-1]+190);sf.write(f"{OUT}/zv_paw_run_0{n+1}.flac",norm(y),SR,subtype="PCM_16")
print("готово")
