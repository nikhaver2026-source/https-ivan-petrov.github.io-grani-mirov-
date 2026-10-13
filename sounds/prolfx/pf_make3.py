"""pf_make3.py — толпа в битве на перевалах (просьба игрока: «сейчас там как будто один-два человека дерутся, а не
целая толпа; побольше криков, крови»). Сведено из записей самой игры (sounds/weapons, blade, battle, cry, throng, mg):
сотни ударов и сотни голосов разом, каждый — своё место (азимут), своё удаление (громкость 1/r, воздух гасит верха),
отклик гор. Выход — FLAC 48 кГц 16 бит в out/:
  pf_melee_mass_01   — сеча: сотни сшибок разом — клинки, щиты, топоры, булавы, копья, удары по плоти и броне, топот;
  pf_battle_cries_01 — голоса битвы: кличи, крики боли, предсмертные вопли десятков людей и далёкий рёв тысяч;
  pf_crowd_warcry_01 — клич войска: сотня глоток разом подхватывает «Ни шагу назад!»."""
import sys,os,json,glob
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from pf_lib import *
O=os.path.join(os.path.dirname(os.path.abspath(__file__)),"out");S="/home/user/https-ivan-petrov.github.io-grani-mirov-/sounds/"
R=np.random.default_rng(20261013)
REP=json.load(open(os.path.join(O,"report.json"),encoding="utf-8"))
def out(name,x,target,note):
    y=to_level(x,target,-1.0);save(os.path.join(O,name),y)
    REP[:]=[r for r in REP if r["file"]!=name]+[{"file":name,"dur":round(len(y)/SR,2),"ch":2,"loud":round(loud_part(y),1),"peak":round(db(np.abs(y).max()),1),"note":note}]
    print(f"{name:28s} {len(y)/SR:5.1f} с  громкость {loud_part(y):6.1f}  пик {db(np.abs(y).max()):5.1f}  {note}",flush=True)
def seamless(x,xf=3.0):
    n=int(xf*SR);k=np.linspace(0,np.pi/2,n)[:,None];return np.concatenate([x[:n]*np.sin(k)+x[-n:]*np.cos(k),x[n:-n]])
USED=set()
def bank(*pats):
    fs=[];[fs.extend(sorted(glob.glob(S+p))) for p in pats]
    assert fs,pats
    xs=[]
    for f in fs:
        x=load(f);x=x/max(1e-9,np.sqrt(np.mean(x[np.abs(x)>np.abs(x).max()*0.05]**2)));xs.append((f[len(S):],x))
    return xs
def pick(lst):
    f,x=lst[R.integers(len(lst))];USED.add(f);return x
def vary(x,semi):
    """высота и скорость вместе (передискретизация): ±semi полутонов — другой человек, другой клинок"""
    r=2**(R.uniform(-semi,semi)/12);n=int(len(x)/r);return np.interp(np.arange(n)*r,np.arange(len(x)),x)
def place(mix,x,t,d,p,dref):
    """звук в точке: удаление d (м) — громкость (dref/d), срез верхов воздухом; p — сторона (−1…1), межушная задержка"""
    g=min(1.0,(dref/d)**0.85);fc=float(np.clip(16000*(dref/d)**0.5,2500,16000));y=lp(x,fc,1)*g
    st=pan2(y,p);itd=int(abs(p)*0.0006*SR)
    if itd:
        if p>0:st[:,0]=np.concatenate([np.zeros(itd),st[:-itd,0]])
        else:st[:,1]=np.concatenate([np.zeros(itd),st[:-itd,1]])
    a=int(t*SR);m=min(len(mix)-a,len(st))
    if m>0:mix[a:a+m]+=st[:m]

# ── источники ──
CLASH=bank("weapons/blade_parry_t[1-4]_*.flac","weapons/voice_ring_parry_*.flac","weapons/voice_heavy_parry_*.flac","weapons/voice_thin_parry_*.flac",
           "blade/blade_clash_*.flac","battle/battle_sword_*.ogg")
ARMOR=bank("blade/blade_armor_*.flac","weapons/sword_armor_t3_*.flac","weapons/heavy_armor_t3_*.flac")
FLESH=bank("blade/blade_flesh_*.flac","weapons/voice_ring_hit_*.flac","weapons/voice_heavy_hit_*.flac","weapons/voice_knife_hit_*.flac",
           "blade/blunt_flesh_*.flac","blade/axe_chop_*.flac","blade/spear_thrust_*.flac","battle/battle_stab_*.ogg","battle/battle_pike_*.ogg")
SHIELD=bank("blade/shield_metal_*.flac","blade/shield_wood_*.flac","battle/battle_shield_*.ogg")
SWING=bank("weapons/sword_swing_t[12]_*.flac","weapons/heavy_swing_t2_*.flac","blade/swing_blunt_*.flac","blade/swing_stab_*.flac","blade/swing_blade_*.flac")
FALL=bank("mg/hit_ground_*.ogg")
PAIN=bank("cry/*_pain_*.flac")
DIE=bank("cry/*_die_*.flac","throng/throng_die_*.ogg","mg/blade_die_*.ogg")
SHOUT=bank("mg/warrior_shout_*.ogg","mg/guard_shout_*.ogg","throng/throng_cry_*.flac","throng/throng_fight_*.flac")
SHOCK=bank("throng/throng_retreat_*.flac")

def glue(y,win=0.3,ratio=3.0,knee=6.0):
    """медленное сжатие: громкие всплески ближе к общей массе (толпа — сплошная, а не отдельные удары), волны остаются"""
    m=np.abs(y).max(1);w=int(win*SR);k=np.ones(w)/w;env=np.sqrt(np.convolve(m**2,k,mode="same"))+1e-9
    ref=np.median(env)*10**(knee/20);over=np.maximum(1.0,env/ref);g=over**(1/ratio-1)
    g=np.convolve(g,np.ones(int(0.05*SR))/int(0.05*SR),mode="same");return y*g[:,None]
def surge(t,ph):
    """волны боя: натиск и откат"""
    return 1+0.38*np.sin(2*np.pi*t/9.3+ph)+0.22*np.sin(2*np.pi*t/3.7+2*ph)

# ── сеча ──
def melee_mass(dur=42.0):
    N=int((dur+3)*SR);mix=np.zeros((N,2));t=0.0;ph=R.uniform(0,6);n=0
    KIND=[(CLASH,0.30,4),(ARMOR,0.14,3),(FLESH,0.22,3),(SHIELD,0.14,2),(SWING,0.14,2),(FALL,0.06,1)]
    W=np.array([k[1] for k in KIND]);W/=W.sum()
    while t<dur+2:
        d=14+100*R.random()**0.7;p=R.uniform(-0.97,0.97)
        if R.random()<0.3:
            # поединок в толпе: два-четыре удара из одной точки подряд
            for q in range(R.integers(2,5)):
                lst,_,semi=KIND[R.choice(len(KIND),p=W)];x=vary(pick(lst),semi)*R.uniform(0.6,1.1)
                place(mix,x,t+q*R.uniform(0.14,0.38),d,p,8);n+=1
        else:
            lst,_,semi=KIND[R.choice(len(KIND),p=W)];x=vary(pick(lst),semi)*R.uniform(0.6,1.1);place(mix,x,t,d,p,8);n+=1
        t+=R.exponential(1/(40*surge(t,ph)))
    # топот и давка тысяч: низкий гул, дышит волнами
    tt=np.arange(N)/SR;rum=hp(lp(brown(N,R),160,2),40,2)*(0.6+0.4*surge(tt,ph))
    mix+=np.stack([rum,np.roll(rum,1900)],1)*0.04
    y=glue(reverb_send(mix,mix=0.4,t60=2.4,pre=0.03,er=10,dark=7000)[:N])
    print("  сеча: ударов",n)
    return seamless(y[:int((dur+3)*SR)],3.0)
out("pf_melee_mass_01.flac",melee_mass(),-21.0,"сеча на перевале: сотни сшибок разом — клинки, щиты, топоры, булавы, копья, плоть и броня, топот (сведено из записей игры)")

# ── голоса битвы ──
def battle_cries(dur=38.0):
    N=int((dur+3)*SR);mix=np.zeros((N,2));t=0.0;ph=R.uniform(0,6);n=0
    KIND=[(PAIN,0.40,3.0),(SHOUT,0.30,2.0),(DIE,0.22,2.0),(SHOCK,0.08,2.5)]
    W=np.array([k[1] for k in KIND]);W/=W.sum()
    while t<dur+2:
        lst,_,semi=KIND[R.choice(len(KIND),p=W)];x=vary(pick(lst),semi)*R.uniform(0.6,1.05)
        d=14+86*R.random()**0.7;place(mix,x,t,d,R.uniform(-0.97,0.97),10);n+=1
        t+=R.exponential(1/(14*surge(t,ph)))
    # рёв тысяч вдали: сотни голосов внахлёст за сотню шагов — слов не разобрать, только гул
    t=0.0;far=np.zeros((N,2))
    while t<dur+2:
        lst=[PAIN,SHOUT,DIE][R.choice(3,p=[0.45,0.4,0.15])];x=vary(pick(lst),3.0)
        place(far,x,t,R.uniform(70,160),R.uniform(-0.95,0.95),10);t+=R.exponential(1/26)
    mix+=lp(far,2200,1)*1.6
    y=glue(reverb_send(mix,mix=0.42,t60=2.2,pre=0.028,er=10,dark=7000)[:N])
    print("  голоса: криков",n)
    return seamless(y,3.0)
out("pf_battle_cries_01.flac",battle_cries(),-21.0,"голоса битвы: кличи, крики боли и предсмертные вопли десятков людей, далёкий рёв тысяч (сведено из записей игры)")

# ── клич войска ──
def crowd_warcry(dur=5.0):
    N=int((dur+2.6)*SR);mix=np.zeros((N,2))
    for i in range(110):
        x=vary(pick(SHOUT if R.random()<0.75 else PAIN),2.5)
        # подхватывают не разом: волна идёт от ближних к дальним за полсекунды, кое-кто кричит дважды
        d=R.uniform(4,70);t0=0.05+0.5*(d-4)/66+R.normal(0,0.08)
        for rep in range(1 if R.random()<0.7 else 2):
            place(mix,x*R.uniform(0.7,1.0),max(0,t0+rep*R.uniform(0.5,0.9)),d,R.uniform(-0.97,0.97),6)
    # удар оружием о щиты в ответ: глухой стук сотни щитов
    for i in range(70):
        x=vary(pick(SHIELD),2);place(mix,x*0.6,max(0,0.25+R.normal(0,0.12)+(i%2)*0.55),R.uniform(6,60),R.uniform(-0.97,0.97),6)
    y=reverb_send(mix,mix=0.45,t60=2.6,pre=0.03,er=12,dark=6000)[:N]
    y=fade(y,0.01,0.8);return y
out("pf_crowd_warcry_01.flac",crowd_warcry(),-17.0,"клич войска: сотня глоток подхватывает приказ, удары оружием о щиты (сведено из записей игры)")

json.dump(REP,open(os.path.join(O,"report.json"),"w"),ensure_ascii=False,indent=0)
json.dump(sorted(USED),open(os.path.join(O,"make3_used.json"),"w"),ensure_ascii=False,indent=0)
print("использовано записей:",len(USED))
