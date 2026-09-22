# -*- coding: utf-8 -*-
"""Медианная основная частота речи: автокорреляция по озвонченным кадрам."""
import subprocess,sys,numpy as np

def wav(p,sr=16000):
    d=subprocess.run(["ffmpeg","-v","error","-i",p,"-ac","1","-ar",str(sr),
                      "-f","f32le","-"],capture_output=True).stdout
    return np.frombuffer(d,dtype=np.float32),sr

def f0(p,lo=55,hi=400):
    x,sr=wav(p)
    n=int(0.040*sr); hop=int(0.010*sr)
    lag_lo=int(sr/hi); lag_hi=int(sr/lo)
    out=[]
    for i in range(0,max(0,len(x)-n),hop):
        f=x[i:i+n].astype(np.float64)
        if np.sqrt((f*f).mean())<0.012: continue
        f=f-f.mean()
        r=np.correlate(f,f,"full")[n-1:]
        if r[0]<=0: continue
        seg=r[lag_lo:lag_hi]
        if not len(seg): continue
        k=int(np.argmax(seg))+lag_lo
        if r[k]/r[0]<0.35: continue
        out.append(sr/k)
    return float(np.median(out)) if out else None

if __name__=="__main__":
    for p in sys.argv[1:]:
        v=f0(p)
        print("%-46s %s"%(p, ("%.1f Гц"%v) if v else "тихо"))
