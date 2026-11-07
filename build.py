#!/usr/bin/env python3
"""Génère index.html AUTONOME (CSS + JS + images intégrés) à partir de src/.
Usage : python3 build.py   (aucune dépendance)"""
import base64,json,mimetypes,os
R=os.path.dirname(os.path.abspath(__file__))
rd=lambda p:open(os.path.join(R,p),encoding='utf-8').read()
assets={}
d=os.path.join(R,'assets','img')
for f in sorted(os.listdir(d)):
    m=mimetypes.guess_type(f)[0] or 'application/octet-stream'
    assets[f]=f'data:{m};base64,'+base64.b64encode(open(os.path.join(d,f),'rb').read()).decode()
js=(rd('src/data.js')+'\n'+rd('src/app.js')).replace('</script','<\\/script')
h=rd('src/template.html').replace('/*CSS*/',rd('src/style.css')).replace('/*ASSETS*/',json.dumps(assets)).replace('/*JS*/',js)
open(os.path.join(R,'index.html'),'w',encoding='utf-8').write(h)
print('index.html généré :',round(len(h)/1024),'Ko')
