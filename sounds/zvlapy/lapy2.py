"""lapy2.py ПАПКА — шаги зверей (15.5, второй набор): лапы и копыта своего склада у каждого рода, из шагов и копыт
0 A.D. (sounds/tread, CC BY-SA 3.0) и синтеза (щелчок когтя, треск углей, звон стекла, мокрый шлепок — без чужих
записей). Первый набор (zv_paw_walk, zv_paw_run) не трогается. Пишет FLAC 44,1 кГц моно и zv_level_lapy.json —
множители громкости тем же замером, что zv_level.py (звучащая часть к −14 дБ, пик к −3 дБ, 0,5…8)."""
import sys,json,subprocess,numpy as np,soundfile as sf
SRC="/home/user/https-ivan-petrov.github.io-grani-mirov-/sounds/tread/";OUT=sys.argv[1]
SR=44100
def load(n):
    x,sr=sf.read(SRC+n,always_2d=True);x=x.mean(axis=1)
    if sr!=SR:t=np.arange(0,len(x)*SR/sr)/SR;x=np.interp(t,np.arange(len(x))/sr,x)
    return x
def onset(x):
    e=np.abs(x);th=0.2*e.max();i=int(np.argmax(e>th));return max(0,i-int(0.004*SR))
def pitch(x,k):
    t=np.arange(0,len(x)/k);return np.interp(t*k,np.arange(len(x)),x)
def lp(x,fc):
    a=np.exp(-2*np.pi*fc/SR);y=np.zeros_like(x);s=0.0
    for i,v in enumerate(x):s=(1-a)*v+a*s;y[i]=s
    return y
def hp(x,fc):return x-lp(x,fc)
def fade(seg,fi=0.002,fo=0.04):
    n=len(seg);f=np.ones(n);a=min(n,int(fi*SR));b=min(n,int(fo*SR))
    if a:f[:a]=np.linspace(0,1,a)
    if b:f[-b:]=np.minimum(f[-b:],np.linspace(1,0,b))
    return seg*f
def tap(x,k,ms,lo=110,hi1=3600,hi2=5200):
    i=onset(x);seg=x[i:i+int(ms/1000*SR*k)];seg=pitch(seg,k);seg=lp(lp(seg,hi1),hi2);seg=hp(seg,lo);return fade(seg)
def place(parts,total_ms):
    y=np.zeros(int(total_ms/1000*SR))
    for at,seg,g in parts:
        i=int(at/1000*SR);j=min(len(y),i+len(seg))
        if j>i:y[i:j]+=seg[:j-i]*g
    return y
def norm(y,db=-3.0):
    p=np.abs(y).max();return y*(10**(db/20)/p) if p>0 else y
rng=np.random.default_rng(15521)
def noise(ms):return rng.standard_normal(int(ms/1000*SR))
def dec(n,tau):return np.exp(-np.arange(n)/(tau*SR))
def click(ms=5,lo=2500,hi=7000):  # щелчок когтя: короткий шум в полосе
    z=noise(ms);z=hp(lp(z,hi),lo);return z*dec(len(z),0.0015)
def crackle(ms=260,rate=55):      # треск углей: редкие щелчки разной силы
    y=np.zeros(int(ms/1000*SR));t=0.0
    while True:
        t+=rng.exponential(1/rate)
        if t*1000>=ms-8:break
        c=hp(lp(noise(4),5200),1800)*dec(int(0.004*SR),0.001)*rng.uniform(0.15,0.45);i=int(t*SR);y[i:i+len(c)]+=c[:len(y)-i]
    return y
def ping(ms=220,amp=0.2):          # звон стекла: три негармонических призвука
    n=int(ms/1000*SR);t=np.arange(n)/SR;y=np.zeros(n)
    for f,a,tau in [(2793,1.0,0.07),(4187,0.7,0.05),(5571,0.45,0.035)]:
        f*=1+rng.uniform(-0.01,0.01);y+=a*np.sin(2*np.pi*f*t)*np.exp(-t/tau)
    return fade(y*amp/1.8,0.0005,0.02)
def puff(ms=90,fc=900,amp=0.18):  # мягкий выдох пыли и пепла
    z=lp(lp(noise(ms),fc),fc*1.5);z=z/np.abs(z).max();return fade(z*dec(len(z),ms/1000/3)*amp,0.003,0.03)
def wet(ms=130,amp=0.28):         # мокрый шлепок: шум в полосе с дрожью
    z=hp(lp(noise(ms),5000),800);n=len(z);m=1+0.6*np.sin(2*np.pi*rng.uniform(28,40)*np.arange(n)/SR);z=z*m*dec(n,0.03)
    return fade(z/np.abs(z).max()*amp,0.002,0.03)
G=[load(f"tread_grass_0{i}.ogg") for i in (1,2,3)];V=[load(f"tread_gravel_0{i}.ogg") for i in (1,2,3)]
S=[load(f"tread_sand_0{i}.ogg") for i in (1,2,3)];N=[load(f"tread_snow_0{i}.ogg") for i in (1,2,3)];H=[load(f"tread_hoof_0{i}.ogg") for i in (1,2,3)]
U=lambda a,b:a+(b-a)*rng.random()
def two(src_a,src_b,k1,k2,ms,gap,g2,**kw):
    t1=tap(src_a,k1,ms,**kw);t2=tap(src_b,k2,ms,**kw);return place([(0,t1,1.0),(gap,t2,g2)],gap+ms+80)
R={}
for n in range(3):
    R.setdefault("zv_paw_soft",[]).append(two(G[n],G[(n+1)%3],U(1.75,1.85),U(1.8,1.9),100,U(80,100),0.5,lo=140,hi1=2400,hi2=3200))
    R.setdefault("zv_paw_snow",[]).append(two(N[n],N[(n+2)%3],U(1.45,1.55),U(1.45,1.55),130,U(100,120),0.7,lo=120,hi1=4200,hi2=6000))
    R.setdefault("zv_paw_heavy",[]).append(two(V[n],G[n],U(1.12,1.2),U(1.12,1.2),190,U(130,150),0.85,lo=80,hi1=2600,hi2=3800))
    ts=[tap((G+V)[(n+i)%6],U(1.6,1.7),110) for i in range(3)];g=[0,U(65,75),U(140,155)]
    R.setdefault("zv_paw_trot",[]).append(place([(g[i],ts[i],[1,0.75,0.85][i]) for i in range(3)],g[2]+190))
    t=tap(G[n],U(1.9,2.0),90,hi1=3000,hi2=4500);R.setdefault("zv_paw_light",[]).append(place([(0,t,1.0),(70,t,0.35)],240))
    R.setdefault("zv_paw_sand",[]).append(two(S[n],S[(n+1)%3],U(1.25,1.35),U(1.25,1.35),170,U(120,140),0.8,hi1=3000,hi2=4200))
    a=tap(V[n],1.5,120);b=tap(V[(n+1)%3],1.55,120);gap=U(100,110)
    R.setdefault("zv_claw_step",[]).append(place([(0,a,1.0),(12,click(),0.35),(gap,b,0.75),(gap+12,click(),0.28)],gap+220))
    a=tap(V[n],1.3,160);b=tap(G[n],1.35,150);gap=U(110,130)
    R.setdefault("zv_paw_ember",[]).append(place([(0,a,1.0),(gap,b,0.78),(10,crackle(),1.0)],gap+260))
    a=tap(G[n],1.6,110,hi1=3000,hi2=4200);b=tap(G[(n+2)%3],1.65,110,hi1=3000,hi2=4200);gap=U(95,110)
    R.setdefault("zv_paw_glass",[]).append(place([(0,a,1.0),(5,ping(),1.0),(gap,b,0.7),(gap+5,ping(180,0.12),1.0)],gap+260))
    a=tap(S[n],1.4,150,hi1=1800,hi2=2400);b=tap(S[(n+2)%3],1.42,150,hi1=1800,hi2=2400);gap=U(105,125)
    R.setdefault("zv_paw_ash",[]).append(place([(0,a,1.0),(0,puff(),1.0),(gap,b,0.75),(gap,puff(70,800,0.12),1.0)],gap+230))
    a=tap(H[n],U(1.22,1.28),200,lo=180,hi1=6000,hi2=8000);R.setdefault("zv_hoof_light",[]).append(place([(0,a,1.0),(U(85,95),a,0.6)],330))
    a=tap(H[n],U(0.78,0.82),260,lo=60,hi1=2800,hi2=3600);b=tap(H[(n+1)%3],0.8,260,lo=60,hi1=2800,hi2=3600)
    R.setdefault("zv_hoof_heavy",[]).append(place([(0,a,1.0),(U(150,170),b,0.8)],460))
    a=tap(H[n],U(1.42,1.48),140,lo=150,hi1=6000,hi2=8000);g1=U(38,45)
    R.setdefault("zv_hoof_cloven",[]).append(place([(0,a,1.0),(g1,a,0.7),(150,a,0.85),(150+g1,a,0.6)],380))
    a=tap(H[n],U(1.08,1.12),220,lo=120,hi1=5000,hi2=7000)
    R.setdefault("zv_hoof_stone",[]).append(place([(0,a,1.0),(2,click(8,1200,3000),0.45)],300))
    a=tap(H[n],U(0.93,0.97),240,lo=80,hi1=1400,hi2=1800)
    R.setdefault("zv_hoof_ash",[]).append(place([(0,a,1.0),(0,puff(110,700,0.22),1.0)],320))
    a=tap(H[n],U(0.98,1.02),240,lo=90,hi1=5000,hi2=7000)
    R.setdefault("zv_hoof_wet",[]).append(place([(0,a,1.0),(20,wet(),1.0)],320))
def measure(p):
    raw=subprocess.run(["ffmpeg","-nostdin","-v","error","-i",p,"-ac","1","-ar","22050","-f","f32le","-"],capture_output=True).stdout
    y=np.frombuffer(raw,dtype=np.float32);pk=20*np.log10(float(np.max(np.abs(y)))+1e-9);n=len(y)//256
    w=y[:n*256].reshape(n,256);rms=np.sqrt(np.mean(w**2,axis=1));top=np.sort(rms)[::-1][:max(1,n//5)];lvl=20*np.log10(float(np.mean(top))+1e-9)
    k=min(10**((-14.0-lvl)/20),10**((-3.0-pk)/20));return round(max(0.5,min(8.0,k)),2)
lev={}
for role,ys in R.items():
    for i,y in enumerate(ys):
        fn=f"{role}_0{i+1}.flac";sf.write(f"{OUT}/{fn}",norm(y),SR,subtype="PCM_16");lev["zvlapy/"+fn]=measure(f"{OUT}/{fn}")
for fn in ["zv_paw_walk_01","zv_paw_walk_02","zv_paw_walk_03","zv_paw_walk_04","zv_paw_run_01","zv_paw_run_02","zv_paw_run_03"]:
    lev[f"zvlapy/{fn}.flac"]=measure(f"{OUT}/{fn}.flac")
json.dump(lev,open(f"{OUT}/../zv_level_lapy.json","w"),ensure_ascii=False,sort_keys=True,separators=(",",":"))
print("ролей",len(R),"файлов",sum(len(v) for v in R.values()),"замерено",len(lev))
