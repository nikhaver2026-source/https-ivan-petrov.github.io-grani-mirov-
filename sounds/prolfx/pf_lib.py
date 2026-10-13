"""pf_lib.py — общее для звуков пролога: шумы, фильтры, ревербератор, проезд машины (задержка распространения → Доплер)."""
import numpy as np,soundfile as sf,scipy.signal as sg
SR=48000
rng=np.random.default_rng(155)
def db(x):return 20*np.log10(max(1e-12,float(x)))
def load(path,sr=SR):
    x,s=sf.read(path,dtype="float32",always_2d=True);x=x.mean(1)
    if s!=sr:
        import librosa;x=librosa.resample(x,orig_sr=s,target_sr=sr)
    return x.astype(np.float64)
def pink(n,r=rng):
    # розовый шум: белый через фильтр Пола Келлета
    w=r.standard_normal(n);b=[0.049922035,-0.095993537,0.050612699,-0.004408786];a=[1,-2.494956002,2.017265875,-0.522189400]
    p=sg.lfilter(b,a,w);return p/np.std(p)
def brown(n,r=rng):
    w=r.standard_normal(n);b=sg.lfilter([1],[1,-0.997],w);b=b-sg.lfilter([1],[1,-0.9995],b)*0.0;b=sg.filtfilt(*sg.butter(1,20/(SR/2),"high"),b);return b/np.std(b)
def bp(x,lo,hi,order=2):
    s=sg.butter(order,[lo/(SR/2),hi/(SR/2)],"band",output="sos");return sg.sosfilt(s,x)
def lp(x,f,order=2):
    s=sg.butter(order,f/(SR/2),"low",output="sos");return sg.sosfilt(s,x)
def hp(x,f,order=2):
    s=sg.butter(order,f/(SR/2),"high",output="sos");return sg.sosfilt(s,x)
def fade(x,a=0.05,b=0.05):
    x=x.copy();na=int(a*SR);nb=int(b*SR)
    if na>0:x[:na]*=np.sin(np.linspace(0,np.pi/2,na))**2 if x.ndim==1 else (np.sin(np.linspace(0,np.pi/2,na))**2)[:,None]
    if nb>0:x[-nb:]*=np.cos(np.linspace(0,np.pi/2,nb))**2 if x.ndim==1 else (np.cos(np.linspace(0,np.pi/2,nb))**2)[:,None]
    return x
def ir(t60=2.0,length=None,pre=0.012,er=6,width=1.0,r=rng,dark=6000):
    """Стерео-отклик пространства: ранние отражения + экспоненциальный хвост из независимого шума L/R."""
    L=int((length or t60*1.2)*SR);t=np.arange(L)/SR;env=np.exp(-6.91*t/t60)
    out=np.zeros((L,2))
    for c in range(2):
        n=r.standard_normal(L)*env;n=lp(n,dark,1);out[:,c]=n
    out[:int(pre*SR)]=0
    for k in range(er):
        d=int((pre+r.uniform(0.003,0.06))*SR);g=r.uniform(0.25,0.7)*(0.8**k)
        out[d,0]+=g*r.choice([-1,1]);out[min(L-1,d+int(r.uniform(0,0.004)*SR)),1]+=g*r.choice([-1,1])
    m=out.mean(1,keepdims=True);out=m+(out-m)*width
    return out/np.sqrt((out**2).sum()/2)
def reverb(x,mix=0.3,**kw):
    """x — моно или стерео; возвращает стерео: сухой + мокрый."""
    if x.ndim==1:x=np.stack([x,x],1)
    h=ir(**kw);y=np.zeros((len(x)+len(h)-1,2))
    for c in range(2):y[:,c]=sg.fftconvolve(x[:,c],h[:,c])
    dry=np.zeros_like(y);dry[:len(x)]=x
    return dry*(1-mix)+y*mix*0.6
def pan2(x,p):
    """моно → стерео, постоянная мощность; p от −1 (лево) до +1 (право), можно массивом."""
    a=(np.asarray(p)+1)*np.pi/4;return np.stack([x*np.cos(a),x*np.sin(a)],1)
def norm_peak(x,peak_db=-3.0):
    return x*(10**(peak_db/20)/max(1e-9,np.abs(x).max()))
def loud_part(x):
    """«звучащая часть»: средний уровень самой громкой пятой части (окна 256 при 22 050 Гц ≈ 557 при 48 кГц)."""
    m=x.mean(1) if x.ndim>1 else x;w=557;n=len(m)//w
    if n<1:return db(np.sqrt(np.mean(m**2)))
    r=np.sqrt((m[:n*w].reshape(n,w)**2).mean(1));r=np.sort(r)[::-1][:max(1,n//5)]
    return db(np.sqrt(np.mean(r**2)))
def to_level(x,target=-18.0,peak=-1.0):
    g=10**((target-loud_part(x))/20);y=x*g;pk=np.abs(y).max()
    if pk>10**(peak/20):
        # мягкий ограничитель: tanh над порогом
        t=10**(peak/20);y=np.where(np.abs(y)>t*0.8,np.sign(y)*(t*0.8+(t*0.2)*np.tanh((np.abs(y)-t*0.8)/(t*0.2))),y)
    return y
def save(path,x):
    x=np.asarray(x,np.float64)
    d=(rng.random(x.shape)-rng.random(x.shape))/32768.0   # треугольный дизер
    sf.write(path,np.clip(x+d,-1,1).astype(np.float32),SR,subtype="PCM_16",format="FLAC")
def loopify(x,xf=1.5):
    """бесшовная петля: конец плавно уходит в начало (равная мощность)."""
    n=int(xf*SR);a=x[:n];b=x[-n:];k=np.linspace(0,np.pi/2,n)
    if x.ndim>1:k=k[:,None]
    mid=x[n:-n] if len(x)>2*n else x[n:]
    return np.concatenate([b*np.cos(k)+a*np.sin(k),mid]) if False else np.concatenate([a*np.sin(k)+b*np.cos(k),x[n:-n]])
def drive_by(src,dur,v=14.0,d=6.0,direction=1,x0=None,air=True,itd=True,ground=0.35):
    """Проезд мимо слушателя по прямой на расстоянии d (м) со скоростью v (м/с).
    src(t) — сигнал источника (функция или массив длиннее dur+0.5 с). Принятый сигнал:
    y(t) = s(t − r(t)/c)/r(t) — Доплер из самой задержки; воздух гасит верха с расстоянием;
    стерео — по азимуту (постоянная мощность) и межушная задержка до 0,6 мс."""
    c=343.0;N=int(dur*SR);t=np.arange(N)/SR
    if x0 is None:x0=-v*dur/2
    x=direction*(x0+v*t);r=np.sqrt(x**2+d**2)
    tau=t-r/c+r.max()/c   # задержка относительно источника (сдвиг, чтобы индекс был ≥0)
    s=np.asarray(src);idx=tau*SR
    i0=np.clip(np.floor(idx).astype(int),0,len(s)-2);fr=idx-np.floor(idx)
    y=(s[i0]*(1-fr)+s[i0+1]*fr)
    g=d/np.maximum(r,1.0)     # 1/r, на ближней точке 1
    y=y*g
    if air:
        # поглощение верхов воздухом и прикрытие корпусом: срез от 9 кГц вблизи до 1,8 кГц вдали, по блокам
        out=np.zeros_like(y);B=1024;zi=None
        for k in range(0,N,B):
            rr=r[min(N-1,k+B//2)];fc=float(np.clip(9000*(8.0/max(rr,8.0))**0.8,1500,9000))
            sos=sg.butter(2,fc/(SR/2),"low",output="sos")
            if zi is None:zi=sg.sosfilt_zi(sos)*0
            seg,zi=sg.sosfilt(sos,y[k:k+B],zi=zi);out[k:k+B]=seg
        y=out
    az=np.arctan2(x,d);p=0.72*np.sin(az)   # не до упора: дальнее ухо слышит машину тише, но слышит
    st=pan2(y,p)
    if itd:
        # межушная задержка: дальнее ухо слышит позже (до 0,6 мс)
        dl=(np.maximum(0,p)*0.0006*SR);dr=(np.maximum(0,-p)*0.0006*SR)
        def shift(ch,dd):
            ii=np.arange(N)-dd;i0=np.clip(np.floor(ii).astype(int),0,N-2);ff=ii-np.floor(ii);return ch[i0]*(1-ff)+ch[i0+1]*ff
        st=np.stack([shift(st[:,0],dl),shift(st[:,1],dr)],1)
    if ground>0:
        # отражение от дороги: чуть более длинный путь — гребёнка, как у настоящего проезда
        h=1.0;r2=np.sqrt(x**2+d**2+(2*h)**2);dd=(r2-r)/c*SR
        ii=np.arange(N)-dd;i0=np.clip(np.floor(ii).astype(int),0,N-2);ff=ii-np.floor(ii)
        st=st+ground*(st[i0]*(1-ff)[:,None]+st[i0+1]*ff[:,None])
    return st,r

def reverb_send(st,mix=0.2,**kw):
    """сухой стерео + общий отклик от моно-суммы (отражения слышны обоими ушами)."""
    if st.ndim==1:st=np.stack([st,st],1)
    m=st.mean(1);h=ir(**kw);wet=np.stack([sg.fftconvolve(m,h[:,0]),sg.fftconvolve(m,h[:,1])],1)
    y=np.zeros_like(wet);y[:len(st)]=st*(1-mix*0.5);return y+wet*mix*0.6
