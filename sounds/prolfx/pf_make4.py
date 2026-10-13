"""pf_make4.py — первая часть пролога «Шов» (просьба игрока: «больше шумов города; более яркие звуки пролистывания
страниц; разнообразь; добавь музыку — как таковой музыки сейчас нет; не одна машина, а поток машин; дождь и гром»).
Источники: src/ (мотор — Frederik_Sunne, CC BY 4.0), src2/ (CC-Sounds: дождь, гром, гудок, сигнализация, метро,
окно), src3/ (собрание CC0 lavenderdotpet: страницы и музыка Ben Burnes, шаги по мокрому, гром), остальное — синтез.
Выход — FLAC 48 кГц 16 бит в out/."""
import sys,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from pf_lib import *
H=os.path.dirname(os.path.abspath(__file__));O=os.path.join(H,"out");S1=os.path.join(H,"src");S2=os.path.join(H,"src2");S3=os.path.join(H,"src3")
G="/home/user/https-ivan-petrov.github.io-grani-mirov-/sounds/"
R=np.random.default_rng(20261014)
REP=json.load(open(os.path.join(O,"report.json"),encoding="utf-8"))
ONLY=set(a for a in sys.argv[1:] if a.endswith(".flac"))
def out(name,x,target,note,peak=-1.0):
    if callable(x):
        if ONLY and name not in ONLY:return
        x=x()
    y=to_level(x,target,peak);save(os.path.join(O,name),y)
    REP[:]=[r for r in REP if r["file"]!=name]+[{"file":name,"dur":round(len(y)/SR,2),"ch":2,"loud":round(loud_part(y),1),"peak":round(db(np.abs(y).max()),1),"note":note}]
    print(f"{name:28s} {len(y)/SR:5.1f} с  громкость {loud_part(y):6.1f}  пик {db(np.abs(y).max()):5.1f}  {note}",flush=True)
def st(x):return np.stack([x,x],1) if x.ndim==1 else x
def ld(path):
    x,s=sf.read(path,dtype="float32",always_2d=True)
    if s!=SR:
        import librosa;x=np.stack([librosa.resample(x[:,c],orig_sr=s,target_sr=SR) for c in range(x.shape[1])],1)
    return x.astype(np.float64)
def mono(x):return x.mean(1) if x.ndim>1 else x
def tile(x,n):
    reps=int(np.ceil(n/len(x)))+1;return np.concatenate([x]*reps)[:n]
def seamless(x,xf=3.0):
    n=int(xf*SR);k=np.linspace(0,np.pi/2,n)
    if x.ndim>1:k=k[:,None]
    return np.concatenate([x[:n]*np.sin(k)+x[-n:]*np.cos(k),x[n:-n]])
def panmove(x,p0,p1):
    p=np.linspace(p0,p1,len(x));return pan2(x,p)
def shelf(x,f=2500,gain_db=5.0):
    """полка верхов: добавить верхнюю полосу — ярче, без резкости"""
    k=10**(gain_db/20)-1;return x+hp(x,f,2)*k if x.ndim==1 else x+np.stack([hp(x[:,c],f,2) for c in range(x.shape[1])],1)*k

# ── мотор и шины (как в pf_make.py) ──
ENG=load(os.path.join(S1,"cc_engine_ext.ogg"))
def engine(dur,rate=1.0,drift=0.04):
    N=int(dur*SR*max(1.0,rate)*1.25)+2*SR;g=int(0.5*SR);hop=g//2;w=np.hanning(g);y=np.zeros(N+g)
    for p in range(0,N,hop):
        s=R.integers(0,len(ENG)-g);y[p:p+g]+=ENG[s:s+g]*w
    y=y[:N];t=np.arange(N)/SR;r=rate*(1+drift*np.sin(2*np.pi*R.uniform(0.05,0.12)*t+R.uniform(0,6)))
    pos=np.cumsum(r);pos=pos[pos<len(y)-2];i0=pos.astype(int);fr=pos-i0;o=y[i0]*(1-fr)+y[i0+1]*fr
    return o/np.std(o)
def tires(n,wet=True):
    base=bp(pink(n,R),280,2600,2)*np.clip(1+0.18*lp(R.standard_normal(n),6,1)/0.02,0.5,1.6);y=base+bp(pink(n,R),70,280,2)*0.55
    if wet:
        hiss=bp(R.standard_normal(n),2500,10000,2)*1.5;sw=np.abs(lp(R.standard_normal(n),3,1));sw=sw/sw.max();hiss=hiss*(0.6+0.8*sw)
        spl=np.zeros(n)
        for _ in range(int(n/SR*7)):
            p=R.integers(0,n-4000);L=R.integers(1500,4000);spl[p:p+L]+=bp(R.standard_normal(L),900,6000,2)*np.hanning(L)*R.uniform(0.6,1.4)
        y=y*0.8+hiss+spl*0.9
    return y/np.std(y)
def car_source(dur,rate=1.0,wet=True,eng=0.5,truck=False):
    n=int(dur*SR)+SR;e=engine(dur,rate)
    if len(e)<n:e=np.concatenate([e,e[::-1]])
    e=lp(e[:n],2200 if not truck else 1500,2)
    if truck:e=e*1.5+bp(pink(n,R),40,160,2)*0.7
    s=tires(n,wet)+e*eng+bp(pink(n,R),90,700,2)*0.35;return s/np.std(s)

# ── 1. ПОТОК МАШИН ПО МОКРОМУ ПРОСПЕКТУ: четыре полосы рядом, проспект подальше, гул города ──
def traffic(dur=46.0):
    N=int(dur*SR);mix=np.zeros((N,2));n=0
    lanes=[(6.5,1,3.0),(9.5,1,3.6),(12.5,-1,3.2),(15.5,-1,3.8),(28,1,1.6),(34,-1,1.6),(55,1,1.1),(70,-1,1.1)]
    for d,direction,gap in lanes:
        t=R.uniform(-4,0)
        while t<dur:
            L=float(np.clip(9*(d/9)**0.3,7,14));v=R.uniform(9,15.5);truck=R.random()<0.12;bus=(not truck) and R.random()<0.04
            src=car_source(L+0.8,R.uniform(0.85,1.3) if not (truck or bus) else R.uniform(0.65,0.8),eng=R.uniform(0.35,0.7) if not (truck or bus) else 1.1,truck=truck or bus)
            sig,_=drive_by(src,L,v=v,d=d,direction=direction,ground=0.3)
            g=R.uniform(0.7,1.15)*(1.25 if (truck or bus) else 1.0)
            a=int(t*SR);b0=max(0,-a);a=max(0,a);m=min(N-a,len(sig)-b0)
            if m>0:mix[a:a+m]+=sig[b0:b0+m]*g;n+=1
            t+=max(0.9,R.exponential(gap))
    rum=hp(lp(brown(N,R),150,2),35,2)*(1+0.2*lp(R.standard_normal(N),0.1,1)/0.004)
    mix+=np.stack([rum,np.roll(rum,2300)],1)*0.35
    y=reverb_send(mix,mix=0.26,t60=1.4,pre=0.01,er=12,dark=6500)[:N]
    print("  поток: проездов",n)
    return seamless(y,3.0)
out("pf_traffic_wet_01.flac",lambda:traffic(),-24.0,"поток машин по мокрому проспекту: четыре полосы рядом, проспект подальше, гул города, петля (синтез, мотор — Frederik_Sunne, CC BY 4.0)")

# ── 2. ДОЖДЬ НА УЛИЦЕ: ливень по асфальту и крышам, водосток, капли по жести и лужам ──
HEAVY=mono(ld(os.path.join(S2,"environment_weather_heavyrain.ogg")));STORM=mono(ld(os.path.join(S2,"environment_weather_WEATHER_RAINSTORM.ogg")))
def drops(N,rate,f_lo,f_hi,dec=(8,40),amp=(0.2,1.0),metal=0.0):
    y=np.zeros(N)
    for _ in range(int(N/SR*rate)):
        p=R.integers(0,N-3000);m=R.integers(200,1600);e=np.exp(-np.arange(m)/R.uniform(*dec))
        d=bp(R.standard_normal(m),f_lo,f_hi,2)*e*R.uniform(*amp)
        if metal and R.random()<metal:
            f=R.uniform(1800,4200);d+=np.sin(2*np.pi*f*np.arange(m)/SR)*np.exp(-np.arange(m)/R.uniform(300,900))*R.uniform(0.2,0.6)
        y[p:p+m]+=d
    return y
def gutter(N):
    base=bp(pink(N,R),400,3000,2)*(0.6+0.4*np.abs(lp(R.standard_normal(N),2,1))/0.05)
    gur=np.zeros(N)
    for _ in range(int(N/SR*6)):
        p=R.integers(0,N-6000);m=R.integers(1500,5000);f=R.uniform(250,700)*np.linspace(1,R.uniform(1.2,1.8),m)
        gur[p:p+m]+=np.sin(2*np.pi*np.cumsum(f)/SR)*np.hanning(m)*R.uniform(0.2,0.6)
    return lp(base*0.7+gur*0.5,4500,2)
def rain_street(dur=34.0):
    N=int(dur*SR);a=tile(HEAVY,N);b=tile(np.roll(HEAVY,int(13*SR)),N);c=tile(STORM,N)
    L=a*0.8+c*0.35;Rr=b*0.8+np.roll(c,int(5*SR))*0.35
    y=np.stack([L,Rr],1)
    for side in (-0.75,-0.3,0.3,0.75):y+=pan2(drops(N,18,1000,7000,metal=0.3),side)*0.18
    y+=pan2(gutter(N),-0.6)*0.12
    return seamless(y,3.0)
out("pf_rain_street_01.flac",lambda:rain_street(),-24.0,"ливень на улице: по асфальту и крышам, водосток, капли по жести и лужам, петля (Ali@k и Iam_calderon, CC0; капли и водосток — синтез)")

# ── 3. МОРОСЬ: тонкий дождь по мокрой улице ──
DRIZ=mono(ld(os.path.join(S2,"environment_weather_drizzle.ogg")));LR=ld(os.path.join(S3,"loop_rain.ogg"))
def drizzle(dur=32.0):
    N=int(dur*SR);d=DRIZ/np.sqrt(np.mean(DRIZ**2));a=tile(d,N);b=tile(np.roll(d,int(11*SR)),N)
    lr=st(LR);lr=lr/np.sqrt(np.mean(lr**2));l2=np.stack([tile(lr[:,0],N),tile(lr[:,1],N)],1)
    y=np.stack([a,b],1)*0.7+l2*0.35
    for side in (-0.7,0.0,0.7):y+=pan2(drops(N,10,1500,8000,amp=(0.1,0.5)),side)*0.12
    return seamless(y,3.0)
out("pf_drizzle_01.flac",lambda:drizzle(),-30.0,"морось: тонкий дождь по мокрой улице, петля (klankbeeld, CC BY 3.0; собрание CC0; капли — синтез)")

# ── 4. ДОЖДЬ ЗА ОКНОМ ПУСТОЙ КОМНАТЫ: глухой шум за стеклом, капли по стеклу и подоконнику ──
IN1=mono(ld(os.path.join(S2,"environment_weather_indoors_rain.ogg")));IN2=mono(ld(os.path.join(S2,"environment_weather_WEATHER_RAINSTORM_inside.ogg")))
def rain_room(dur=30.0):
    N=int(dur*SR);a=tile(IN1/np.sqrt(np.mean(IN1**2)),N);b=tile(IN2/np.sqrt(np.mean(IN2**2)),N)
    y=np.stack([a*0.7+b*0.45,np.roll(a,int(9*SR))*0.7+np.roll(b,int(4*SR))*0.45],1)
    tap=np.zeros(N)
    for _ in range(int(dur*4)):
        p=R.integers(0,N-2000);m=R.integers(150,700);f=R.uniform(2500,6000)
        tap[p:p+m]+=(np.sin(2*np.pi*f*np.arange(m)/SR)*0.5+bp(R.standard_normal(m),2000,9000,2))*np.exp(-np.arange(m)/R.uniform(25,90))*R.uniform(0.2,1)
    y+=pan2(tap,0.35)*0.10
    y=reverb(y,mix=0.18,t60=0.7,pre=0.006,er=6,dark=5000)[:N]
    return seamless(y,3.0)
out("pf_rain_room_01.flac",lambda:rain_room(),-28.0,"дождь за окном пустой комнаты: глухой шум за стеклом, капли по стеклу, петля (InspectorJ, CC BY 3.0; klankbeeld, CC BY 4.0)")

# ── 5. ГРОМ: близкий раскат с эхом от домов; дальний ──
TN=mono(ld(os.path.join(S2,"environment_weather_thunder_near.ogg")));TF=mono(ld(os.path.join(S2,"environment_weather_thunder_far.ogg")))
T3=ld(os.path.join(S3,"sfx100v2_thunder_01.ogg"))
def echoes(x,taps):
    y=np.zeros((len(x)+int(1.2*SR),2));y[:len(x)]+=st(x)
    for dt,g,p,f in taps:
        a=int(dt*SR);e=lp(x,f,2)*g;y[a:a+len(e)]+=pan2(e,p)
    return y
def thunder_near():
    x=TN/np.abs(TN).max();y=echoes(x,[(0.17,0.45,-0.7,4000),(0.33,0.35,0.75,3000),(0.58,0.25,-0.4,2200),(0.9,0.18,0.5,1600)])
    y=reverb(y,mix=0.3,t60=2.8,pre=0.02,er=12,dark=4000);return fade(y,0.002,1.5)
out("pf_thunder_near_01.flac",lambda:thunder_near(),-15.0,"гроза над городом: близкий раскат и эхо от домов (mrsorbias, CC BY 3.0)")
def thunder_crack():
    x=mono(T3);x=x/np.abs(x).max();y=echoes(x,[(0.12,0.5,0.7,5000),(0.29,0.35,-0.7,3500),(0.52,0.22,0.3,2500)])
    y=reverb(y,mix=0.32,t60=3.0,pre=0.02,er=12,dark=4500);return fade(y,0.002,1.5)
out("pf_thunder_near_02.flac",lambda:thunder_crack(),-15.0,"гроза: сухой треск разряда и раскат по улицам (собрание CC0)")
def thunder_far():
    x=lp(TF/np.abs(TF).max(),1500,2);y=reverb(st(x),mix=0.45,t60=3.5,pre=0.04,er=8,dark=2500);return fade(y,0.3,1.5)
out("pf_thunder_far_01.flac",lambda:thunder_far(),-24.0,"дальний гром за кварталами (chromakei, CC0)")

# ── 6. ГУДКИ НА ПЕРЕКРЁСТКЕ, СИГНАЛИЗАЦИЯ, МЕТРО ПОД УЛИЦЕЙ, ОКНО ──
HORN=mono(ld(os.path.join(S2,"vehicle_horn_medium_horn_medium.ogg")))
def horns():
    N=int(4.2*SR);y=np.zeros((N,2))
    def put(x,t,d,p,rate=1.0):
        if rate!=1.0:n=int(len(x)/rate);x=np.interp(np.arange(n)*rate,np.arange(len(x)),x)
        g=min(1,6/d);s=pan2(lp(x,float(np.clip(12000*(6/d)**0.5,2500,12000)),1)*g,p);a=int(t*SR);m=min(N-a,len(s));y[a:a+m]+=s[:m]
    for t in (0.0,0.32):put(HORN,t,14,-0.55)                     # короткий двойной
    for k in range(5):put(HORN,0.95+k*0.11,22,0.6,0.86)         # долгий злой — тоном ниже, сплошь
    put(HORN,2.5,40,-0.2,1.12)                                    # дальний ответ
    return reverb_send(y,mix=0.3,t60=1.3,pre=0.01,er=10,dark=6000)
out("pf_horns_01.flac",lambda:horns(),-19.0,"гудки на перекрёстке: двойной, долгий злой, дальний ответ (Legnalegna55, CC0)")
ALARM=mono(ld(os.path.join(S2,"vehicle_car_alarm_car_alarm.ogg")))
def alarm():
    x=np.concatenate([ALARM,ALARM,ALARM[:int(len(ALARM)*0.6)]]);x=lp(x,3500,2)*0.5
    y=reverb(st(x),mix=0.45,t60=1.8,pre=0.03,er=10,dark=3500);return fade(y,0.05,1.2)
out("pf_car_alarm_far_01.flac",lambda:alarm(),-26.0,"автосигнализация во дворе через квартал (InspectorJ, CC BY 3.0)")
UND=mono(ld(os.path.join(S2,"environment_ambient_underground.ogg")))
def subway():
    fr=int(0.5*SR);e=np.array([np.mean(UND[i:i+fr]**2) for i in range(0,len(UND)-fr,fr)]);c=int(np.argmax(np.convolve(e,np.ones(18),mode="same")))*fr
    a=max(0,c-int(4.5*SR));x=UND[a:a+int(9*SR)];x=lp(x,900,2)+lp(brown(len(x),R),70,2)*0.25*np.std(x)/0.3
    x=x*np.sin(np.linspace(0,np.pi,len(x)))**1.2;return st(x)
out("pf_subway_01.flac",lambda:subway(),-24.0,"метро под улицей: поезд проходит под ногами, гул сквозь землю (Kinoton, CC0)")
WIN=mono(ld(os.path.join(S2,"close_door_window_close_window.ogg")))
def window():
    y=reverb(pan2(lp(WIN,6000,1),0.5),mix=0.35,t60=1.0,pre=0.012,er=8,dark=5000);return fade(y,0.002,0.4)
out("pf_window_close_01.flac",lambda:window(),-22.0,"окно захлопнули через двор (cabled_mess, CC0)")

# ── 7. ПРОХОЖИЙ ПОД ЗОНТОМ: шаги по лужам, дробь дождя по зонту — слева направо ──
WET=[mono(ld(os.path.join(S3,f"sfx100v2_footstep_wet_0{i}.ogg"))) for i in (1,2,3)]
def umbrella_pass(dur=7.5):
    N=int(dur*SR);y=np.zeros(N);t=0.2;steps=[]
    while t<dur-0.5:
        s=WET[R.integers(3)]*R.uniform(0.7,1.0);a=int(t*SR);m=min(N-a,len(s));y[a:a+m]+=s[:m];t+=R.uniform(0.5,0.58)
    pat=np.zeros(N)
    for _ in range(int(dur*90)):
        p=R.integers(0,N-1200);m=R.integers(120,500);f=R.uniform(1200,3500)
        pat[p:p+m]+=(bp(R.standard_normal(m),900,5000,2)+0.4*np.sin(2*np.pi*f*np.arange(m)/SR))*np.exp(-np.arange(m)/R.uniform(20,60))*R.uniform(0.2,1)
    x=y*1.0+pat*0.05;tt=np.arange(N)/SR;d=np.sqrt(((tt-dur/2)*1.3)**2+2.0**2);g=2.0/d
    xs=panmove(x*g,-0.85,0.85);return reverb_send(xs,mix=0.2,t60=1.1,pre=0.008,er=8,dark=6000)
out("pf_umbrella_pass_01.flac",lambda:umbrella_pass(),-22.0,"прохожий под зонтом: шаги по лужам и дробь дождя по зонту, слева направо (шаги — собрание CC0; дробь — синтез)")

# ── 8. МОТОРОЛЛЕР ПО МОКРОМУ ──
def moto():
    src=car_source(6.5,1.9,eng=1.1);sig,_=drive_by(src,6.0,v=17,d=7,direction=-1,ground=0.3)
    return fade(reverb_send(sig,mix=0.22,t60=1.2,pre=0.01,er=8,dark=6500),0.3,0.6)
out("pf_moto_wet_01.flac",lambda:moto(),-19.0,"мотороллер по мокрому асфальту справа налево (синтез, мотор — Frederik_Sunne, CC BY 4.0)")

# ── 9. СТРАНИЦЫ: ярко и близко — переворот листа и пролистывание ──
def page(path,a,b,sweep=(0.45,-0.45),boost=5.5):
    x=ld(os.path.join(S3,path));x=x[int(a*SR):int(b*SR)];m=hp(mono(x),140,2);m=shelf(m,2500,boost)
    m=m/np.abs(m).max();y=panmove(m,*sweep)
    y=reverb(y,mix=0.1,t60=0.45,pre=0.004,er=5,dark=7000)[:len(y)+int(0.25*SR)];return fade(y,0.003,0.12)
out("pf_page_turn_01.flac",lambda:page("Page_Turn_1.wav",0.0,2.8),-15.0,"страница перевёрнута: шорох, лист проходит справа налево и ложится (Ben Burnes, CC0)")
out("pf_page_turn_02.flac",lambda:page("Page_Turn_2.wav",0.1,2.9,(-0.4,0.45)),-15.0,"страница перевёрнута слева направо (Ben Burnes, CC0)")
out("pf_page_turn_03.flac",lambda:page("Page_Turn_Fast.wav",0.05,0.95,(0.5,-0.5),6.5),-14.0,"быстрый переворот страницы с хлопком (Ben Burnes, CC0)")
out("pf_page_riffle_01.flac",lambda:page("Flipping_Pages_3.wav",0.0,1.45,(0.35,-0.35),4.5),-14.0,"пролистывание: веер страниц под пальцем (Ben Burnes, CC0)")
out("pf_page_riffle_02.flac",lambda:page("Flipping_Pages_2.wav",0.0,1.75,(-0.3,0.35),4.5),-14.0,"пролистывание книги от начала к концу (Ben Burnes, CC0)")

# ── 10. МУЗЫКА ПЕРВОЙ ЧАСТИ: ночной нуар под дождь (Ben Burnes, «Midnight Murmurs», CC0) ──
def mus_noir():
    rh=ld(os.path.join(S3,"2023-03-15_Midnight_Murmurs_-_Chill_Rhodes.wav"));noir=ld(os.path.join(S3,"2023-03-15_Midnight_Murmurs_-_Rainy_Noir.wav"))
    fin=ld(os.path.join(S3,"2023-03-15_Midnight_Murmurs_-_Harmonized_Fadeout.wav"))
    def lvl(x):return x/np.sqrt(np.mean(x**2))
    rh,noir,fin=lvl(rh)*0.8,lvl(noir),lvl(fin)*0.85
    parts=[rh,noir,noir,noir,fin];xf=int(1.5*SR)   # около 65 с — первая часть успевает до повтора
    y=parts[0]
    for p in parts[1:]:
        k=np.linspace(0,np.pi/2,xf)[:,None];head=y[-xf:]*np.cos(k)+p[:xf]*np.sin(k);y=np.concatenate([y[:-xf],head,p[xf:]])
    return seamless(np.concatenate([y,np.zeros((int(1.0*SR),2))]),2.0)
out("pf_mus_noir_01.flac",lambda:mus_noir(),-22.0,"музыка первой части: ночной нуар под дождь — Rhodes, бас, щётки (Ben Burnes, «Midnight Murmurs», CC0), петля")

json.dump(REP,open(os.path.join(O,"report.json"),"w"),ensure_ascii=False,indent=0)
