"""pf_make.py — звуки пролога (15.5): ночной город с машинами, фонари, звон в ушах, далёкие сирена, поезд и гудок,
телевизор за стеной, гул битвы, боевые барабаны, извержение и пепельный ветер.
Источники — в src/ (OpenSFX: CC BY 3.0 и CC0; CC-Sounds: CC0 и CC BY 3.0), остальное — синтез кодом (шум и тоны,
без чужих записей). Выход — FLAC 48 кГц 16 бит в out/."""
import sys,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from pf_lib import *
O=os.path.join(os.path.dirname(os.path.abspath(__file__)),"out");os.makedirs(O,exist_ok=True)
S=os.path.join(os.path.dirname(os.path.abspath(__file__)),"src")
R=np.random.default_rng(20261013)
REPORT=[]
def out(name,x,target,peak=-1.0,note=""):
    y=to_level(x,target,peak);save(os.path.join(O,name),y)
    REPORT.append({"file":name,"dur":round(len(y)/SR,2),"ch":y.shape[1] if y.ndim>1 else 1,"loud":round(loud_part(y),1),"peak":round(db(np.abs(y).max()),1),"note":note})
    print(f"{name:28s} {len(y)/SR:5.1f} с  громкость {loud_part(y):6.1f}  пик {db(np.abs(y).max()):5.1f}  {note}",flush=True)
def stereo(x):return np.stack([x,x],1) if x.ndim==1 else x
def lauridsen(x,g=0.62,t1=0.015,t2=0.0047):
    """моно → стерео, сумма каналов = исходник (как в STEREO_4.3); стерео — как есть."""
    if x.ndim>1:return x
    n1=int(t1*SR);n2=int(t2*SR);a=np.roll(x,n1);b=np.roll(x,n2)
    return np.stack([x+g*a+0.25*b,x-g*a-0.25*b],1)*0.5
def seamless(x,xf=2.0):
    """петля: последние xf секунд плавно переходят в первые; длина уменьшается на xf."""
    n=int(xf*SR);k=np.linspace(0,np.pi/2,n)
    if x.ndim>1:k=k[:,None]
    head=x[:n]*np.sin(k)+x[-n:]*np.cos(k)
    return np.concatenate([head,x[n:-n]])

# ── ДВИГАТЕЛЬ И ШИНЫ ──────────────────────────────────────────────────────────
ENG=load(os.path.join(S,"cc_engine_ext.ogg"))
def engine(dur,rate=1.0,drift=0.04):
    """двигатель: зёрна по 0,5 с из записи мотора (CC BY, Frederik_Sunne) в случайных местах, окно Ханна, 50 %;
    обороты — пересэмплированием (rate), медленный дрейф оборотов."""
    import librosa
    N=int(dur*SR*max(1.0,rate)*1.25)+2*SR;g=int(0.5*SR);hop=g//2;w=np.hanning(g);y=np.zeros(N+g)
    for p in range(0,N,hop):
        s=R.integers(0,len(ENG)-g);y[p:p+g]+=ENG[s:s+g]*w
    y=y[:N]
    # дрейф оборотов: переменное пересэмплирование
    t=np.arange(N)/SR;r=rate*(1+drift*np.sin(2*np.pi*R.uniform(0.05,0.12)*t+R.uniform(0,6)))
    pos=np.cumsum(r);pos=pos[pos<len(y)-2]
    i0=pos.astype(int);fr=pos-i0;out=y[i0]*(1-fr)+y[i0+1]*fr
    return out/np.std(out)
def tires(n,wet=False,rough=1.0):
    """шум качения: розовый шум 280–2600 Гц с «текстурой дороги», низ корпуса; на мокром — шипение брызг 2,5–10 кГц и всплески."""
    base=bp(pink(n,R),280,2600,2);mod=1+0.18*rough*lp(R.standard_normal(n),6,1)/0.02
    mod=np.clip(mod,0.5,1.6);base=base*mod
    low=bp(pink(n,R),70,280,2)*0.55
    y=base+low
    if wet:
        hiss=bp(R.standard_normal(n),2500,10000,2)*1.5
        sw=np.abs(lp(R.standard_normal(n),3,1));sw=sw/sw.max();hiss=hiss*(0.6+0.8*sw)
        spl=np.zeros(n)
        for _ in range(int(n/SR*7)):
            p=R.integers(0,n-4000);L=R.integers(1500,4000);spl[p:p+L]+=bp(R.standard_normal(L),900,6000,2)*np.hanning(L)*R.uniform(0.6,1.4)
        y=y*0.8+hiss+spl*0.9
    return y/np.std(y)
def wind_noise(n):return bp(pink(n,R),90,700,2)
def car_source(dur,rate=1.0,wet=False,eng=0.55,truck=False):
    n=int(dur*SR)+SR
    e=engine(dur,rate)
    if len(e)<n:e=np.concatenate([e,e[::-1]])
    e=e[:n];e=lp(e,2200 if not truck else 1500,2)
    if truck:e=e*1.5+bp(pink(n,R),40,160,2)*0.7
    s=tires(n,wet)*1.0+e*eng+wind_noise(n)*0.35
    return s/np.std(s)

def car_pass(name,dur,v,d,direction,rate,wet=False,eng=0.55,truck=False,target=-17.0,note=""):
    src=car_source(dur+0.6,rate,wet,eng,truck)
    st,r=drive_by(src,dur,v=v,d=d,direction=direction)
    st=st*1.0
    # уличное пространство: короткий отклик (дома вдоль улицы), немного
    y=reverb_send(st,mix=0.22,t60=1.1,pre=0.008,er=8,dark=7000)[:len(st)+int(0.9*SR)]
    y=fade(y,0.4,0.6)
    out(name,y,target,note=note)
    return y

# ── 1. ПРОЕЗДЫ ────────────────────────────────────────────────────────────────
car_pass("pf_car_pass_01.flac",7.0,13.9,7.0,1,1.0,note="легковая слева направо, 50 км/ч, 7 м")
car_pass("pf_car_pass_02.flac",6.5,16.7,11.0,-1,1.18,note="легковая справа налево, 60 км/ч, 11 м")
car_pass("pf_car_pass_03.flac",8.0,10.5,9.0,1,0.78,eng=1.1,truck=True,note="тяжёлая машина слева направо, 38 км/ч")
car_pass("pf_car_wet_01.flac",7.0,13.0,6.0,1,1.0,wet=True,eng=0.4,note="по мокрому асфальту слева направо")
car_pass("pf_car_wet_02.flac",7.0,11.5,9.0,-1,0.92,wet=True,eng=0.45,note="по мокрому асфальту справа налево")

# ── 2. НОЧНОЙ ГОРОД: далёкий поток машин, петля ──────────────────────────────
def city_night(dur=38.0,rain=False):
    N=int(dur*SR);mix=np.zeros((N,2))
    rumble=lp(brown(N),140,2)*0.9;rumble*=1+0.25*lp(R.standard_normal(N),0.08,1)/0.003
    mix+=lauridsen(rumble)*0.6
    # десятки дальних машин в разное время и на разном удалении
    t=0.0
    while t<dur:
        d=R.uniform(55,260);v=R.uniform(9,19);L=R.uniform(10,16);direction=R.choice([-1,1])
        src=car_source(L+1.2,R.uniform(0.8,1.25),wet=rain,eng=R.uniform(0.3,0.8),truck=R.random()<0.15)
        st,_=drive_by(src,L,v=v,d=d,direction=direction,ground=0.2)
        p=int(t*SR);m=min(N-p,len(st))
        if m>0:mix[p:p+m]+=st[:m]*R.uniform(0.6,1.2)
        t+=R.uniform(0.9,2.6)
    # пара машин поближе — улица в квартале отсюда
    for t0 in (dur*0.22,dur*0.68):
        src=car_source(10,R.uniform(0.9,1.2),wet=rain,eng=0.5);st,_=drive_by(src,9.0,v=R.uniform(11,15),d=R.uniform(28,40),direction=R.choice([-1,1]))
        p=int(t0*SR);m=min(N-p,len(st));mix[p:p+m]+=st[:m]*0.9
    y=lp(mix,4200 if not rain else 3600,2)
    y=reverb(y,mix=0.35,t60=2.4,pre=0.02,er=10,dark=4000)[:N]
    return seamless(y,3.0)
out("pf_city_night_01.flac",city_night(),-30.0,note="ночной город: далёкий поток машин, петля")
out("pf_city_rain_01.flac",city_night(rain=True),-31.0,note="город под дождём: шорох шин вдали, петля")

# ── 3. АВТОБУС (OpenSFX, CC BY 3.0) — проезд с панорамой ──────────────────────
def bus():
    x=load(os.path.join(S,"os_bus_pass.wav"));n=len(x);t=np.arange(n)/SR
    p=np.clip(-0.85+1.5*(t/(n/SR))**1.6,-0.85,0.65);st=pan2(x,p)
    y=reverb(st,mix=0.22,t60=1.4,pre=0.01,dark=6000);y=fade(y,0.15,1.2)
    return y
out("pf_bus_pass_01.flac",bus(),-18.0,note="автобус подъезжает и проходит слева направо (OpenSFX)")

# ── 4. ДАЛЁКИЕ: сирена (CC0), поезд и гудок машины (OpenSFX, CC BY 3.0) ────────
def far(x,lpf,t60,mix,tail,lead=0.0):
    x=hp(lp(x,lpf,2),140,2);x=np.concatenate([np.zeros(int(lead*SR)),x,np.zeros(int(tail*SR))])
    return reverb(x,mix=mix,t60=t60,pre=0.03,er=6,dark=max(1500,lpf))[:len(x)]
def siren():
    import librosa
    s=load(os.path.join(S,"cc_siren.ogg"));rep=np.concatenate([s]*4)
    n=len(rep);t=np.arange(n)/SR
    # уезжает вдаль: высота чуть падает, громкость растёт и гаснет
    rate=1.0-0.025*(t/(n/SR));pos=np.cumsum(rate);pos=pos[pos<n-2];i0=pos.astype(int);fr=pos-i0
    y=rep[i0]*(1-fr)+rep[i0+1]*fr
    env=np.interp(np.arange(len(y))/SR,[0,2.0,len(y)/SR*0.55,len(y)/SR],[0,1,0.8,0])
    y=y*env;st=pan2(y,np.linspace(-0.6,0.2,len(y)))
    return far(st.mean(1),2000,2.8,0.55,2.5)
out("pf_siren_far_01.flac",lauridsen(siren()),-26.0,note="сирена далеко за кварталами (CC0)")
out("pf_train_far_01.flac",lauridsen(far(load(os.path.join(S,"os_train_horn.wav")),2600,3.2,0.6,3.0,0.1)),-22.0,note="гудок поезда вдали (OpenSFX)")
def horn():
    h=load(os.path.join(S,"os_car_horn.wav"));g=np.zeros(int(0.18*SR))
    x=np.concatenate([h[:int(0.32*SR)]*0.9,g,h]);return far(x,3200,2.2,0.5,2.2)
out("pf_horn_far_01.flac",lauridsen(horn()),-22.0,note="гудок машины через квартал (OpenSFX)")

# ── 5. ФОНАРЬ: ровное гудение (петля) и мигание ────────────────────────────────
def buzz(dur):
    N=int(dur*SR);t=np.arange(N)/SR;y=np.zeros(N)
    for k in range(1,34):
        y+=np.sin(2*np.pi*100*k*t+R.uniform(0,6.28))/(k**0.75)*(1.4 if k%2==0 else 1.0)
    y*=1+0.04*lp(R.standard_normal(N),6,1)/0.02
    siz=bp(R.standard_normal(N),2800,8000,2)*(np.abs(np.sin(2*np.pi*100*t))**12)*0.5
    y=lp(y,5200,2)+siz
    return y/np.std(y)
lb=lauridsen(buzz(14.0),g=0.4,t1=0.011,t2=0.0039);lb=seamless(lb,2.0)
out("pf_lamp_buzz_01.flac",lb,-27.0,note="гудение уличного фонаря, петля (синтез)")
def flicker():
    N=int(2.6*SR);z=buzz(2.6);g=np.zeros(N)
    pat=[(0.00,0.22,1.0),(0.30,0.36,0.8),(0.52,0.55,0.9),(0.70,0.73,0.5),(0.95,1.40,1.0)]
    for a,b,v in pat:
        i,j=int(a*SR),int(b*SR);g[i:j]=v;
    g=np.convolve(g,np.ones(96)/96,"same");y=z*g
    clicks=np.zeros(N)
    for a,b,_ in pat:
        for tt in (a,b):
            i=int(tt*SR);L=300;clicks[i:i+L]+=bp(R.standard_normal(L),1800,7000,2)*np.exp(-np.arange(L)/60)*R.uniform(0.8,1.5)
    sp=load(os.path.join(S,"os_spark.wav"))[int(0.4*SR):int(0.75*SR)];sp=hp(sp,1200,2)*np.hanning(len(sp))
    y=y+clicks*2.0;p=int(1.40*SR);y[p:p+len(sp)]+=sp*2.2
    thunk=lp(R.standard_normal(2400),300,2)*np.exp(-np.arange(2400)/500);y[int(1.42*SR):int(1.42*SR)+2400]+=thunk*1.6
    y=fade(y,0.01,0.4);return reverb(y,mix=0.15,t60=0.9,dark=7000)[:N]
out("pf_lamp_flicker_01.flac",flicker(),-18.0,note="фонарь мигает и гаснет с треском (синтез + искра OpenSFX)")

# ── 6. ЗВОН В УШАХ (синтез) ───────────────────────────────────────────────────
def ring(dur,f0,f1,amp0,amp1,att,rel):
    N=int(dur*SR);t=np.arange(N)/SR
    f=np.linspace(f0,f1,N)*(1+0.0015*np.sin(2*np.pi*4.3*t))
    ph=2*np.pi*np.cumsum(f)/SR;y=np.sin(ph)+0.35*np.sin(ph*1.063+1.0)+0.12*np.sin(ph*0.5)
    y*=1+0.12*np.sin(2*np.pi*0.7*t)
    env=np.interp(t,[0,att,dur-rel,dur],[0,1,1,0])*np.interp(t,[0,dur],[amp0,amp1])
    y=y*env;return np.stack([y,y*0.97],1)
out("pf_tinnitus_01.flac",ring(5.5,6900,6950,1.0,1.0,1.4,1.8),-30.0,note="тонкий звон в ушах (синтез)")
out("pf_tinnitus_rise_01.flac",ring(7.0,6500,7450,0.08,1.0,0.6,0.35),-26.0,note="звон в ушах нарастает (синтез)")

# ── 7. ТЕЛЕВИЗОР ЗА СТЕНОЙ (CC BY 3.0, kwahmah_02) ────────────────────────────
def tv():
    parts=[]
    for k in [0,3,1,5,2,4,0,2]:
        c=load(os.path.join(S,f"cc_chatter{k}.ogg"));parts+=[c,np.zeros(int(R.uniform(0.05,0.3)*SR))]
    x=np.concatenate(parts);x=lp(hp(x,180,2),850,3)
    x=reverb(x,mix=0.3,t60=0.6,pre=0.004,dark=2000)[:len(x)+int(0.4*SR)]
    return fade(x,0.6,1.2)
out("pf_tv_wall_01.flac",tv(),-30.0,note="телевизор за стеной, неразборчиво (CC BY 3.0)")

# ── 8. ГУЛ БИТВЫ: тысячи голосов издали (синтез), петля ────────────────────────
VOW={"а":(750,1200,2600),"о":(500,850,2500),"э":(520,1750,2500),"у":(350,700,2350),"ы":(420,1400,2300)}
def shout(dur,f0,vow):
    N=int(dur*SR);t=np.arange(N)/SR
    glide=1+R.uniform(-0.12,0.18)*np.sin(np.pi*t/dur)
    f=f0*glide*(1+0.01*R.standard_normal(N).cumsum()/np.sqrt(np.arange(1,N+1)))
    ph=np.cumsum(f)/SR;saw=2*(ph%1)-1
    ex=saw*0.75+R.standard_normal(N)*0.35
    y=np.zeros(N)
    for F,bw in zip(VOW[vow],(90,120,180)):
        y+=bp(ex,max(60,F-bw),F+bw,2)*(1.0 if F<1000 else 0.6)
    env=np.minimum(1,t/R.uniform(0.05,0.2))*np.exp(-np.maximum(0,t-dur*0.6)/(dur*0.25))
    return y*env
def battle_roar(dur=34.0):
    N=int(dur*SR);mix=np.zeros((N,2))
    for _ in range(int(dur*22)):
        L=R.uniform(0.4,1.6);f0=R.uniform(95,150) if R.random()<0.8 else R.uniform(160,240)
        s=shout(L,f0,R.choice(list(VOW)));d=R.uniform(12,90)
        s=lp(s,float(np.clip(6500*(12/d),1300,6500)),1)*(12/d)
        p=int(R.uniform(0,dur-L)*SR);mix[p:p+len(s)]+=pan2(s,R.uniform(-0.95,0.95))
    feet=bp(brown(N),40,260,2)*0.5;armor=bp(R.standard_normal(N),1800,6000,2)*np.abs(lp(R.standard_normal(N),9,1))*4.0
    mix+=lauridsen(feet)*0.3+lauridsen(armor)*0.1
    mix*=(1+0.25*lp(R.standard_normal(N),0.15,1)/0.004)[:,None].clip(0.5,1.6)
    y=reverb(mix,mix=0.45,t60=2.6,pre=0.03,er=8,dark=3500)[:N]
    return seamless(y,3.0)
out("pf_battle_roar_01.flac",battle_roar(),-22.0,note="гул битвы на перевале: крики и топот тысяч, петля (синтез)")

# ── 9. БОЕВЫЕ БАРАБАНЫ (синтез), петля ────────────────────────────────────────
def drum(f_hi,f_lo,dec,slap=0.5):
    L=int(1.4*SR);t=np.arange(L)/SR;f=f_lo+(f_hi-f_lo)*np.exp(-t/0.06)
    body=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/dec)
    sk=bp(R.standard_normal(L),180,1600,2)*np.exp(-t/0.025)*slap
    return body+sk
def war_drums(bars=8,bpm=88):
    beat=60/bpm;dur=bars*4*beat;N=int(dur*SR)+SR;mix=np.zeros((N,2))
    big=drum(95,46,0.55,0.4);mid=drum(140,72,0.35,0.6);hi=drum(210,120,0.18,0.9)
    pat=[(0,big,0.95,-0.25),(1.5,mid,0.55,0.35),(2,big,0.85,-0.25),(3,mid,0.6,0.35),(3.5,hi,0.45,0.6)]
    for b in range(bars):
        for pos,dr,v,pn in pat:
            tt=(b*4+pos)*beat+R.normal(0,0.008);p=max(0,int(tt*SR));g=v*R.uniform(0.85,1.1)
            m=min(N-p,len(dr));mix[p:p+m]+=pan2(dr[:m]*g,pn+R.uniform(-0.05,0.05))
    y=reverb(mix,mix=0.4,t60=2.2,pre=0.025,er=8,dark=3000)[:N]
    y=y[:int(dur*SR)+int(1.0*SR)]
    return seamless(y,1.0)
out("pf_war_drums_01.flac",war_drums(),-19.0,note="боевые барабаны племён, петля (синтез)")

# ── 10. ИЗВЕРЖЕНИЕ (синтез) ───────────────────────────────────────────────────
def eruption(dur=8.0):
    N=int(dur*SR);t=np.arange(N)/SR
    boom=lp(R.standard_normal(N),260,3)*np.exp(-t/1.1)*np.minimum(1,t/0.01)
    sub=np.sin(2*np.pi*np.cumsum(38-14*np.minimum(1,t/1.5))/SR)*np.exp(-t/1.8)*np.minimum(1,t/0.02)
    rum=lp(brown(N),110,2)*(0.4+0.6*np.exp(-t/3.5))*(1+0.3*np.sin(2*np.pi*3.1*t))
    deb=np.zeros(N)
    for _ in range(260):
        p=int(R.exponential(1.8)*SR)
        if p>=N-800:continue
        L=R.integers(200,800);deb[p:p+L]+=bp(R.standard_normal(L),700,4200,2)*np.exp(-np.arange(L)/R.uniform(60,200))*R.uniform(0.2,1)*np.exp(-p/SR/3)
    y=boom*1.6+sub*1.2+rum*0.7+deb*0.6
    st=lauridsen(y,g=0.5);st=reverb(st,mix=0.4,t60=3.5,pre=0.04,er=6,dark=2500)[:N]
    return fade(st,0.0,1.5)
out("pf_eruption_01.flac",eruption(),-14.0,note="горы раскрывают рты: взрыв, гул и осыпь (синтез)")

# ── 11. ПЕПЕЛЬНЫЙ ВЕТЕР (синтез), петля ──────────────────────────────────────
def ashfall(dur=32.0):
    N=int(dur*SR);n=pink(N,R)
    fc=420+260*np.sin(2*np.pi*0.05*np.arange(N)/SR)+120*lp(R.standard_normal(N),0.3,1)/0.01
    out_=np.zeros(N);B=2048;zi=None
    for k in range(0,N,B):
        f=float(np.clip(fc[min(N-1,k)],180,1200));sos=sg.butter(2,[f*0.7/(SR/2),f*1.4/(SR/2)],"band",output="sos")
        if zi is None:zi=sg.sosfilt_zi(sos)*0
        seg,zi=sg.sosfilt(sos,n[k:k+B],zi=zi);out_[k:k+B]=seg
    howl=out_*(1+0.5*lp(R.standard_normal(N),0.2,1)/0.006).clip(0.3,2)
    hiss=bp(R.standard_normal(N),2200,7000,2)*0.12*(1+0.5*np.sin(2*np.pi*0.11*np.arange(N)/SR))
    y=lauridsen(howl/np.std(howl)+hiss,g=0.6,t1=0.017,t2=0.0052)
    return seamless(y,3.0)
out("pf_ashfall_01.flac",ashfall(),-28.0,note="пепел вместо снега: глухой ветер и шорох, петля (синтез)")

json.dump(REPORT,open(os.path.join(O,"report.json"),"w"),ensure_ascii=False,indent=0)
print("готово",len(REPORT))
