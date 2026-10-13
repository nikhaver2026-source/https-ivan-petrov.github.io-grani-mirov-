"""pf_make2.py — ещё два звука Пепельного года (просьба игрока: «звуки прохода через перевал, более яркие звуки боя»):
поход по перевалу (сотни ног по щебню и снегу, гомон, скрип) и звон боя (лязг металла сотен клинков издали).
Синтез кодом: шум и тоны, без чужих записей. Выход — FLAC 48 кГц 16 бит в out/."""
import sys,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from pf_lib import *
O=os.path.join(os.path.dirname(os.path.abspath(__file__)),"out")
R=np.random.default_rng(20261014)
REP=json.load(open(os.path.join(O,"report.json"),encoding="utf-8"))
def out(name,x,target,note):
    y=to_level(x,target,-1.0);save(os.path.join(O,name),y)
    REP[:]=[r for r in REP if r["file"]!=name]+[{"file":name,"dur":round(len(y)/SR,2),"ch":2,"loud":round(loud_part(y),1),"peak":round(db(np.abs(y).max()),1),"note":note}]
    print(f"{name:28s} {len(y)/SR:5.1f} с  громкость {loud_part(y):6.1f}  пик {db(np.abs(y).max()):5.1f}  {note}",flush=True)
def seamless(x,xf=3.0):
    n=int(xf*SR);k=np.linspace(0,np.pi/2,n)[:,None];return np.concatenate([x[:n]*np.sin(k)+x[-n:]*np.cos(k),x[n:-n]])

# ── шаг по щебню и снегу: пятка и носок — россыпь мелких щелчков камней и глухой удар ──
def step(snow=False):
    L=int(0.42*SR);y=np.zeros(L)
    for ph,(t0,dur,amp) in enumerate([(0.0,0.11,1.0),(0.13,0.16,0.75)]):
        n=int(R.uniform(30,60)*dur*10)
        for _ in range(n):
            p=int((t0+R.uniform(0,dur))*SR);m=R.integers(40,220)
            if p+m>=L:continue
            cl=R.standard_normal(m)*np.exp(-np.arange(m)/R.uniform(12,45))*R.uniform(0.2,1.0)
            y[p:p+m]+=cl
        th=int(t0*SR);m=int(0.06*SR);y[th:th+m]+=lp(R.standard_normal(m),180,2)*np.exp(-np.arange(m)/700)*3.0*amp
    if snow:y=lp(y,3200,2)+bp(R.standard_normal(L),900,2600,2)*np.exp(-np.arange(L)/2500)*0.25
    else:y=bp(y,700,7000,2)+lp(y,250,2)*0.6
    return y
STEPS=[step(i%3==0) for i in range(24)]
def murmur(dur):
    """гомон идущих: десятки голосов вполголоса — тот же голосовой синтез, что у гула битвы, но тихо и протяжно."""
    VOW={"а":(750,1200,2600),"о":(500,850,2500),"э":(520,1750,2500),"у":(350,700,2350)}
    N=int(dur*SR);y=np.zeros((N,2))
    for _ in range(int(dur*3)):
        L=int(R.uniform(0.5,1.4)*SR);t=np.arange(L)/SR;f0=R.uniform(95,150)
        ph=np.cumsum(f0*(1+0.03*np.sin(2*np.pi*R.uniform(1,3)*t)))/SR;ex=(2*(ph%1)-1)*0.6+R.standard_normal(L)*0.5
        v=np.zeros(L)
        for F,bw in zip(VOW[R.choice(list(VOW))],(80,110,160)):v+=bp(ex,max(60,F-bw),F+bw,2)
        v*=np.sin(np.pi*t/(L/SR))**2;d=R.uniform(8,60);v=lp(v,float(np.clip(4000*(8/d),900,4000)),1)*(8/d)
        p=R.integers(0,N-L);y[p:p+L]+=pan2(v,R.uniform(-0.9,0.9))
    return y
def pass_march(dur=34.0):
    N=int(dur*SR);mix=np.zeros((N,2))
    for _ in range(260):      # сотни идущих: свой шаг, свой темп, своё удаление
        d=R.uniform(4,110);cad=R.uniform(0.52,0.66);t=R.uniform(0,cad);pn=R.uniform(-0.95,0.95);g=(4/d)**1.1
        lpf=float(np.clip(9000*(4/d)**0.6,1200,9000))
        while t<dur:
            s=STEPS[R.integers(0,len(STEPS))];p=int(t*SR);m=min(N-p,len(s))
            if m>0:mix[p:p+m]+=pan2(lp(s[:m],lpf,1)*g*R.uniform(0.7,1.2),pn)
            t+=cad*R.uniform(0.94,1.06)
    # скрип телег и колёс: медленный тон трения с хрустом, проходит мимо
    for _ in range(5):
        L=int(R.uniform(4,7)*SR);t=np.arange(L)/SR;f=R.uniform(280,520)*(1+0.08*np.sin(2*np.pi*R.uniform(0.6,1.2)*t))
        sq=np.sin(2*np.pi*np.cumsum(f)/SR)*(0.5+0.5*np.sin(2*np.pi*R.uniform(0.5,0.9)*t))**6
        sq=bp(sq+R.standard_normal(L)*0.15,250,2500,2)*np.sin(np.pi*t/(L/SR))**2*0.08
        p=R.integers(0,N-L);mix[p:p+L]+=pan2(sq,np.linspace(R.uniform(-0.9,-0.2),R.uniform(0.2,0.9),L))
    # осыпь: камешки срываются из-под ног и катятся вниз
    for _ in range(14):
        L=int(R.uniform(0.6,1.6)*SR);y=np.zeros(L)
        for _ in range(R.integers(15,45)):
            q=int(R.uniform(0,0.8)*L);m=R.integers(80,400)
            if q+m<L:y[q:q+m]+=R.standard_normal(m)*np.exp(-np.arange(m)/R.uniform(20,80))*R.uniform(0.3,1)
        y=bp(y,500,5000,2)*0.25;p=R.integers(0,N-L);mix[p:p+L]+=pan2(y,R.uniform(-0.9,0.9))
    mix+=murmur(dur)*0.6
    wind=bp(pink(N,R),150,1100,2)*(1+0.4*lp(R.standard_normal(N),0.25,1)/0.008).clip(0.3,2)
    mix+=np.stack([wind,np.roll(wind,700)],1)*0.05
    y=reverb(mix,mix=0.35,t60=2.2,pre=0.025,er=10,dark=4500)[:N]
    return seamless(y,3.0)
out("pf_pass_march_01.flac",pass_march(),-24.0,"поход по перевалу: сотни ног по щебню и снегу, гомон, скрип телег, осыпь, петля (синтез)")

# ── звон боя: удар клинка о клинок — неравные моды металла с быстрым затуханием и щелчком; сотни издали ──
def clash():
    L=int(0.9*SR);t=np.arange(L)/SR;f0=R.uniform(900,2400);y=np.zeros(L)
    for k,(r,dec) in enumerate(zip((1.0,2.32,4.25,6.63,9.38),(0.55,0.32,0.2,0.12,0.08))):
        f=f0*r*(1+R.uniform(-0.01,0.01))
        if f>15000:continue
        y+=np.sin(2*np.pi*f*t+R.uniform(0,6))*np.exp(-t/(dec*R.uniform(0.6,1.2)))*(1/(k+1))**0.6
    tr=bp(R.standard_normal(L),2000,9000,2)*np.exp(-t/0.006)*2.5
    if R.random()<0.35:   # скрежет: клинок скользит по клинку
        m=int(R.uniform(0.12,0.3)*SR);fc=np.linspace(R.uniform(4000,6000),R.uniform(1500,2500),m)
        sc=R.standard_normal(m)*np.hanning(m);out_=np.zeros(m)
        for q in range(0,m,256):
            seg=sc[q:q+256];out_[q:q+256]=bp(seg,fc[min(q,m-1)]*0.8,fc[min(q,m-1)]*1.2,1)
        y[:m]+=out_*0.8
    return (y+tr)*np.minimum(1,t/0.001)
def battle_clash(dur=30.0):
    N=int(dur*SR);mix=np.zeros((N,2));t=0.0
    while t<dur:
        s=clash();d=R.uniform(10,90);g=(10/d);s=lp(s,float(np.clip(12000*(10/d)**0.5,2500,12000)),1)
        p=int(t*SR);m=min(N-p,len(s));mix[p:p+m]+=pan2(s[:m]*g,R.uniform(-0.95,0.95))
        # удары по щитам и телам — глухо, низко
        if R.random()<0.35:
            L=int(0.25*SR);th=lp(R.standard_normal(L),R.uniform(250,600),2)*np.exp(-np.arange(L)/R.uniform(900,2500))*g*1.4
            q=min(N-L,p+int(R.uniform(0,0.2)*SR));mix[q:q+L]+=pan2(th,R.uniform(-0.9,0.9))
        t+=R.exponential(0.12)
    y=reverb(mix,mix=0.42,t60=2.4,pre=0.03,er=8,dark=6500)[:N]
    return seamless(y,2.5)
out("pf_battle_clash_01.flac",battle_clash(),-24.0,"звон боя: лязг сотен клинков, удары по щитам, издали, петля (синтез)")
json.dump(REP,open(os.path.join(O,"report.json"),"w"),ensure_ascii=False,indent=0)
