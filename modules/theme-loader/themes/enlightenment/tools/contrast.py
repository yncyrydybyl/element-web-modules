import sys,json
def lum(h):
    h=h.lstrip('#'); c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    c=[x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4 for x in c]
    return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
def cr(a,b):
    la,lb=sorted([lum(a),lum(b)],reverse=True); return (la+0.05)/(lb+0.05)
P=json.load(open(sys.argv[1]))
pairs=[("text","bg"),("text","surface"),("text","sidebar"),("muted","bg"),("muted","sidebar"),("accent","bg"),("accent","sidebar"),("onAccent","accent"),("text","own"),("text","other"),("critical","bg"),("success","bg"),("border","bg")]
for name,p in P.items():
    out=[]
    for a,b in pairs:
        r=cr(p[a],p[b]); need=3 if a in("accent","border","critical","success") else 4.5
        flag="" if r>=need else " !!"
        out.append(f"{a}/{b}={r:.1f}{flag}")
    print(f"{name:22s}"," ".join(out))
