import sys
from PIL import Image
for p in sys.argv[1:]:
    im=Image.open(p).convert("RGBA"); w,h=im.size
    x=w//2
    col=[im.getpixel((x,int(y))) for y in [0,min(1,h-1),h*0.25,max(0,h*0.5-1),h*0.5,h*0.75,max(0,h-2),h-1]]
    row=[im.getpixel((int(xx),h//2)) for xx in [0,min(1,w-1),w*0.5,w-1]]
    f=lambda c:"#%02X%02X%02X/%d"%c
    print(p.split('/')[-1],f"{w}x{h}","col:",' '.join(map(f,col)),"| row:",' '.join(map(f,row)))
