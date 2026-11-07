'use strict';
/* Données de démonstration : médecins et cabinets (issus des maquettes).
   Les coordonnées GPS sont approximatives. */
const PROVIDERS=[
{id:'d1',t:'doc',k:'Rhumatologue',n:'Morad Hadawi',s:'Rhumatologue',top:1,img:'morad.jpg',city:'Fès',price:350,pat:'300+',r:4.6,
 short:'Spécialiste traite les douleurs articulaires, musculaires et les maladies auto-immunes comme l’arthrite.',
 about:['Spécialiste traite les douleurs articulaires, musculaires et les maladies auto-immunes comme l’arthrite.','Consultations sur rendez-vous du lundi au samedi.'],
 place:'Clinique de rhumatologie',addr:'Fès',lat:34.0331,lng:-5.0003,avail:1,closed:[0]},
{id:'d2',t:'doc',k:'ORL',n:'Said khaldone',s:'ORL - Oto-Rhino-Laryngologue',top:1,img:'said.jpg',city:'Fès',price:300,pat:'400+',r:4.5,
 short:'Spécialiste des troubles de l’oreille, du nez et de la gorge.',
 about:['Spécialiste des troubles de l’oreille, du nez et de la gorge.','Consultations sur rendez-vous du lundi au samedi.'],
 place:'Cabinet ORL',addr:'Fès',lat:34.0372,lng:-4.9985,avail:1,closed:[0]},
{id:'d3',t:'doc',k:'Cardiologue',n:'Jamila El Idrissi',s:'Cardiologue',top:1,img:'jamila.jpg',city:'Rabat',price:400,pat:'600+',r:4.8,
 short:'Spécialiste du cœur et des vaisseaux sanguins.',
 about:['Spécialiste du cœur et des vaisseaux sanguins.','Électrocardiogramme et échographie cardiaque sur place.'],
 place:'Cabinet de cardiologie',addr:'Agdal, Rabat',lat:33.9945,lng:-6.8498,avail:1,closed:[0]},
{id:'d4',t:'doc',k:'Pédiatre',n:'Rafik derossi',s:'Pédiatre',top:1,img:'rafik.jpg',city:'Fès',price:300,pat:'500+',r:4.7,h24:1,
 short:'Se consacre au développement et aux maladies de l’enfant.',
 about:['Spécialiste en Pédiatrie avec plus de 5 ans d’expérience. Diplômée de la Faculté de Médecine de Casablanca. Membre de la Société Marocaine de Pédiatrie.'],
 place:'Clinique de pédiatre',addr:'V4WD+JF Fès',lat:34.0331,lng:-5.0003,avail:1,closed:[]},
{id:'d5',t:'doc',k:'Généraliste',n:'Fatiha El modane',s:'Médecin généraliste.',top:0,img:'fatiha.jpg',city:'Fès',price:200,pat:'800+',r:4.4,
 short:'Spécialisée dans le diagnostic des maladies courantes et l’orientation des patients vers des spécialistes si nécessaire.',
 about:['Spécialisée dans le diagnostic des maladies courantes et l’orientation des patients vers des spécialistes si nécessaire.'],
 place:'Cabinet médical',addr:'Fès',lat:34.0290,lng:-5.0100,avail:1,closed:[0]},
{id:'c1',t:'cab',n:'Hospitalo-universitaire IBN SINA',s:'Pr. Omar El Aoufir: Radiologue',top:1,img:'ibnsina.jpg',city:'Rabat',price:300,pat:'3000+',r:4.3,
 short:'Localisation: Centre Hospitalo universitaire IBN SINA, Av. Ahmed…',
 about:['(CHUIS) est une structure constituée de 10 établissements hospitaliers de soins et d’hospitalisation et d’une Direction Générale. Il s’agit de la structure hospitalière la plus importante au Maroc.','Dr. Omar est Spécialiste en Radiologie avec plus de 7 ans d’expérience. Diplômé de la Faculté de Médecine de Casablanca. Membre de la Société Marocaine de Radiologie.'],
 place:'Hospitalo-Universitaire IBN SINA',addr:'Centre Hospitalo universitaire IBN SINA, Av. Ahmed…, Rabat',lat:34.0035,lng:-6.8461,avail:0,closed:[]},
{id:'c2',t:'cab',n:'Clinique Psychiatrique la Vallée',s:'Service de santé mentale.',top:1,img:'vallee.jpg',city:'Tamesna',price:350,pat:'900+',r:4.2,
 short:'Localisation: Palmerie G30, Tamesna. Télé: 06 61 50 09 40',
 about:['Service de santé mentale : consultations de psychiatrie et suivi des patients.','Téléphone : 06 61 50 09 40'],
 place:'Clinique Psychiatrique la Vallée',addr:'Palmerie G30, Tamesna',tel:'0661500940',lat:33.7790,lng:-6.8310,avail:1,closed:[0]},
{id:'c3',t:'cab',n:'Cabinet de Pédiatrie Dr. Ahmed Masrour',s:'Pédiatre',top:1,img:'masrour.jpg',city:'Rabat',price:300,pat:'700+',r:4.6,
 short:'Localisation: Ibn Sina, 40 Rue 16 Novembre, 1er étage, Agdal…',
 about:['Cabinet de pédiatrie : suivi de la croissance, vaccinations et consultations de l’enfant.','40 Rue 16 Novembre, 1er étage, Agdal, Rabat.'],
 place:'Cabinet de Pédiatrie',addr:'Ibn Sina, 40 Rue 16 Novembre, 1er étage, Agdal, Rabat',lat:33.9925,lng:-6.8487,avail:1,closed:[0]},
{id:'c4',t:'cab',n:'Cabinet Dentaire Dr Mouad Ettaleb',s:'Chirurgien-dentiste',top:0,img:'dentaire.jpg',city:'Aïn El Aouda',price:250,pat:'350+',r:4.0,
 short:'Localisation: 1ère étage, résidence Al Arch, Av. Doukala, Aïn El Aouda…',
 about:['Cabinet dentaire : soins, détartrage et orthodontie.','1er étage, résidence Al Arch, Av. Doukala, Aïn El Aouda.'],
 place:'Cabinet Dentaire',addr:'Résidence Al Arch, Av. Doukala, Aïn El Aouda',lat:33.8110,lng:-6.7870,avail:1,closed:[0]}
];
/* ---- 40 médecins supplémentaires (profils de démonstration) ---- */
const SLOTS=['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];
const SUPPORT_EMAIL='support@mon-rdv-medical.example'; // à remplacer

const CITIES={'Fès':[34.0331,-5.0003],'Rabat':[34.0209,-6.8416],'Casablanca':[33.5731,-7.5898],'Marrakech':[31.6295,-7.9811],'Tanger':[35.7595,-5.8340],'Agadir':[30.4278,-9.5981],'Meknès':[33.8935,-5.5473],'Oujda':[34.6867,-1.9114],'Tétouan':[35.5785,-5.3684],'Kénitra':[34.2610,-6.5802],'Salé':[34.0531,-6.7985]};
const SPEC={ // [libellé, tarif de base, description]
'Généraliste':['Médecin généraliste',200,'Diagnostic des maladies courantes, suivi des patients et orientation vers les spécialistes si nécessaire.'],
'Pédiatre':['Pédiatre',300,'Suivi de la croissance, vaccinations et maladies de l’enfant et du nourrisson.'],
'Cardiologue':['Cardiologue',400,'Prise en charge du cœur et des vaisseaux sanguins : tension, ECG, échographie cardiaque.'],
'Dermatologue':['Dermatologue',350,'Maladies de la peau, des cheveux et des ongles ; dermatologie esthétique.'],
'Gynécologue':['Gynécologue-obstétricien',400,'Suivi gynécologique, grossesse, accouchement et santé de la femme.'],
'Ophtalmologue':['Ophtalmologue',350,'Examen de la vue, maladies de l’œil et correction des troubles visuels.'],
'ORL':['ORL - Oto-Rhino-Laryngologue',300,'Troubles de l’oreille, du nez et de la gorge.'],
'Rhumatologue':['Rhumatologue',350,'Douleurs articulaires et musculaires, arthrose, arthrite et ostéoporose.'],
'Neurologue':['Neurologue',450,'Maladies du cerveau et du système nerveux : migraines, épilepsie, troubles du sommeil.'],
'Psychiatre':['Psychiatre',400,'Santé mentale : anxiété, dépression et accompagnement psychologique.'],
'Dentiste':['Chirurgien-dentiste',250,'Soins dentaires, détartrage, prothèses et orthodontie.'],
'Orthopédiste':['Chirurgien orthopédiste',500,'Os, articulations et traumatologie : fractures, prothèses, chirurgie du sport.'],
'Gastro-entérologue':['Gastro-entérologue',400,'Maladies de l’estomac, de l’intestin et du foie ; endoscopie digestive.'],
'Endocrinologue':['Endocrinologue',400,'Diabète, thyroïde et troubles hormonaux.'],
'Urologue':['Urologue',400,'Voies urinaires, reins et santé urologique.'],
'Pneumologue':['Pneumologue',350,'Maladies des poumons : asthme, allergies respiratoires, apnée du sommeil.'],
'Néphrologue':['Néphrologue',400,'Maladies des reins, hypertension et dialyse.'],
'Radiologue':['Radiologue',300,'Imagerie médicale : radiographie, échographie, scanner et IRM.'],
'Allergologue':['Allergologue',350,'Allergies alimentaires, respiratoires et cutanées ; tests allergiques.'],
'Nutritionniste':['Médecin nutritionniste',250,'Rééquilibrage alimentaire, suivi du poids et nutrition thérapeutique.']};
const ROWS=[
['Salma Benjelloun','Dermatologue','Casablanca','f'],['Imane Alaoui','Gynécologue','Rabat','f'],['Khadija Lahlou','Ophtalmologue','Marrakech','f'],['Nadia Tazi','Endocrinologue','Fès','f'],
['Houda Berrada','Pédiatre','Tanger','f'],['Samira Chraibi','Généraliste','Agadir','f'],['Zineb El Fassi','Neurologue','Rabat','f'],['Leila Mansouri','Psychiatre','Casablanca','f'],
['Meryem Ouazzani','Dentiste','Meknès','f'],['Asmae Bennani','Nutritionniste','Salé','f'],['Soukaina Idrissi','Allergologue','Kénitra','f'],['Rajae Filali','Néphrologue','Oujda','f'],
['Hind Sebti','Radiologue','Tétouan','f'],['Ghita Kettani','Pneumologue','Casablanca','f'],['Amal Zniber','Cardiologue','Marrakech','f'],['Btissam Lamrani','Dermatologue','Fès','f'],
['Wafaa Naciri','Généraliste','Rabat','f'],['Karima Squalli','Pédiatre','Meknès','f'],['Sanaa Daoudi','Gynécologue','Tanger','f'],['Ilham Benkirane','ORL','Agadir','f'],
['Youssef Amrani','Généraliste','Casablanca','m'],['Karim Bennis','Cardiologue','Rabat','m'],['Omar Tahiri','Orthopédiste','Marrakech','m'],['Hamza El Mehdi','Urologue','Fès','m'],
['Mehdi Sqalli','Gastro-entérologue','Casablanca','m'],['Anas Benhaddou','Ophtalmologue','Tanger','m'],['Reda Chakir','Neurologue','Agadir','m'],['Ayoub Lazrak','Pneumologue','Oujda','m'],
['Tarik Belkadi','Rhumatologue','Rabat','m'],['Mustapha Ghazi','Généraliste','Kénitra','m'],['Abdelilah Rahmouni','Psychiatre','Marrakech','m'],['Soufiane Hajji','Dentiste','Casablanca','m'],
['Driss Benslimane','Endocrinologue','Salé','m'],['Hicham El Ouafi','ORL','Tétouan','m'],['Nabil Cherkaoui','Urologue','Meknès','m'],['Yassir Alami','Pédiatre','Casablanca','m'],
['Adil Maghraoui','Radiologue','Fès','m'],['Brahim Zerouali','Orthopédiste','Tanger','m'],['Saad Berrechid','Allergologue','Rabat','m'],['Mounir Kabbaj','Dermatologue','Marrakech','m']];
const hsh=s=>{let h=5381;for(const c of s)h=((h<<5)+h+c.charCodeAt(0))>>>0;return h};
const STREETS=['Av. Mohammed V','Bd Hassan II','Rue Allal Ben Abdellah','Av. des FAR','Bd Zerktouni','Av. Mohammed VI','Rue de Fès','Bd Moulay Youssef'];
ROWS.forEach((r,i)=>{const[n,k,city,g]=r,id='d'+(6+i),h=hsh(id+n),[lab,base,desc]=SPEC[k],exp=5+h%22,rt=Math.round((4+((h>>3)%10)/10)*10)/10,[la,ln]=CITIES[city],last=n.split(' ').slice(1).join(' ');
 PROVIDERS.splice(5+i,0,{id,t:'doc',k,n,s:lab,g,top:rt>=4.7?1:0,city,price:base+((h>>5)%4)*50,exp,pat:(Math.round((exp*60+h%300)/10)*10).toLocaleString('fr-FR')+'+',r:rt,
  langs:['Français, Arabe'].concat(['Français, Arabe, Anglais','Français, Arabe, Espagnol','Français, Arabe, Anglais'][h%3]).slice(-1)[0],
  short:desc,about:[`${lab} avec plus de ${exp} ans d’expérience. ${g==='f'?'Diplômée':'Diplômé'} de la Faculté de Médecine de ${['Fès','Casablanca','Rabat','Marrakech','Oujda','Agadir'].includes(city)?city:'Rabat'}.`,desc],
  place:'Cabinet du Dr '+last,addr:`${1+h%90} ${STREETS[h%STREETS.length]}, ${city}`,lat:+(la+(((h%100)-50)/4000)).toFixed(5),lng:+(ln+((((h>>7)%100)-50)/4000)).toFixed(5),avail:1,
  closed:h%3===0?[0,6]:[0],slots:h%5===0?SLOTS.slice(0,4):h%5===1?SLOTS.slice(4):null})});
PROVIDERS.forEach(p=>{if(!p.k)p.k=p.s;if(!p.langs)p.langs='Français, Arabe';if(!p.exp&&p.t==='doc')p.exp=5});
const CATS=t=>[...new Set(PROVIDERS.filter(p=>p.t===t).map(p=>p.k))].sort((a,b)=>a.localeCompare(b,'fr'));

/* ---- Portraits illustrés (style charte : aplats, formes simples) pour les médecins sans photo ---- */
const _av={};
function docAvatar(p){if(_av[p.id])return _av[p.id];const h=hsh(p.id+'av'),f=p.g==='f',
 skin=['#f6d3bd','#e9b99a','#d39b78','#b27552','#8a5a3c'][h%5],shade=['#e8bda4','#d7a07f','#bd8260','#9a6043','#744530'][h%5],
 hair=['#2b2230','#3b2a22','#5a3a26','#7a5236','#1f1f24','#8b8b93'][(h>>3)%6],sc=['#009fe3','#2657a3','#5abebd','#009640','#7a4a9e'][(h>>6)%5],
 st=(h>>9)%(f?5:4),beard=!f&&(h>>11)%3===0,glass=(h>>13)%3===0;
 let back='',front='';
 if(f&&st===0)back=`<path d="M37 56c0-22 10-32 23-32s23 10 23 32v26c0 5-7 7-11 3V60H48v25c-4 4-11 2-11-3z" fill="${hair}"/>`;
 if(f&&st===4)back=`<path d="M34 60c0-24 11-36 26-36s26 12 26 36c0 16-7 26-12 30H46c-5-4-12-14-12-30z" fill="${['#cfd8e6','#e9c6d4','#c9e2dc','#e8dcc4'][(h>>5)%4]}"/>`;
 const face=f&&st===4?`<ellipse cx="60" cy="56" rx="15" ry="19" fill="${skin}"/>`:`<ellipse cx="60" cy="53" rx="18" ry="21" fill="${skin}"/><ellipse cx="42" cy="55" rx="3" ry="5" fill="${skin}"/><ellipse cx="78" cy="55" rx="3" ry="5" fill="${skin}"/>`;
 if(f&&st===0)front=`<path d="M41 50c1-15 9-21 20-21 11 0 19 7 19 21-5-8-11-11-19-11-9 0-15 3-20 11z" fill="${hair}"/>`;
 else if(f&&st===1)front=`<path d="M41 52c0-16 8-24 19-24s19 8 19 24c-6-7-12-10-19-10s-13 3-19 10z" fill="${hair}"/><circle cx="60" cy="25" r="8" fill="${hair}"/>`;
 else if(f&&st===2)front=`<path d="M40 54c0-17 9-26 20-26s20 9 20 26c-3-9-9-14-14-14-8 6-17 10-26 14z" fill="${hair}"/><path d="M78 54c1 10 0 22-5 30l5 2c5-10 5-22 2-32z" fill="${hair}"/>`;
 else if(f&&st===3)front=`<path d="M41 50c1-16 9-23 19-23s18 7 19 23c-5-6-11-9-19-9s-14 3-19 9z" fill="${hair}"/><path d="M41 50c-3 12-2 24 2 31l4-2c-3-8-4-17-3-27z" fill="${hair}"/>`;
 else if(!f&&st===0)front=`<path d="M42 50c0-16 8-24 18-24s18 8 18 24c-3-7-8-11-18-11s-15 4-18 11z" fill="${hair}"/>`;
 else if(!f&&st===1)front=`<path d="M41 52c-1-18 8-27 20-27 13 0 20 9 19 27-3-8-6-13-12-14-8 3-18 3-27 14z" fill="${hair}"/>`;
 else if(!f&&st===2)front=`<path d="M42 48c1-13 8-18 18-18s17 5 18 18c-6-6-11-8-18-8s-12 2-18 8z" fill="${hair}"/>`;
 else if(!f&&st===3)front=`<path d="M43 45c2-9 8-13 17-13s15 4 17 13c-5-3-10-4-17-4s-12 1-17 4z" fill="${hair}" opacity=".85"/>`;
 const beardSvg=beard?`<path d="M42 56c0 14 8 22 18 22s18-8 18-22c-3 8-8 11-18 11s-15-3-18-11z" fill="${hair}"/><path d="M54 66q6 4 12 0" stroke="${skin}" stroke-width="2" fill="none" stroke-linecap="round"/>`:`<path d="M54 63q6 5 12 0" stroke="#7a3b32" stroke-width="2" fill="none" stroke-linecap="round"/>`;
 const gl=glass?`<g fill="none" stroke="#2b2b33" stroke-width="1.6"><circle cx="52.5" cy="53" r="5.5"/><circle cx="67.5" cy="53" r="5.5"/><path d="M58 53h4"/></g>`:'';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9effb"/><stop offset="1" stop-color="#a9d9f5"/></linearGradient></defs><rect width="120" height="120" fill="url(#g)"/>
<path d="M12 120c0-26 18-38 48-38s48 12 48 38z" fill="#fff"/><path d="M44 85l16 24 16-24c-5-2-10-3-16-3s-11 1-16 3z" fill="${sc}"/><path d="M44 85l-8 35h-6c0-20 4-32 14-35zM76 85l8 35h6c0-20-4-32-14-35z" fill="#e6edf4"/>
${back}<rect x="52" y="68" width="16" height="18" rx="7" fill="${shade}"/>${face}${front}${beardSvg.replace('','')}${gl}<circle cx="53" cy="54" r="1.9" fill="#2b2b33"/><circle cx="67" cy="54" r="1.9" fill="#2b2b33"/>
<path d="M45 86c-3 16 3 24 15 24s18-8 15-24" fill="none" stroke="#5b6475" stroke-width="2.6" stroke-linecap="round"/><circle cx="60" cy="110" r="3.4" fill="#5b6475"/></svg>`;
 return _av[p.id]='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
/* Images : intégrées (index.html autonome) ou fichiers dans assets/img ; une URL/chemin complet est accepté */
const A_IMG=n=>(window.__ASSETS&&window.__ASSETS[n])||(/[\/:]/.test(n)?n:'assets/img/'+n);
const imgSrc=p=>p.img?A_IMG(p.img):docAvatar(p);
const imgTag=(p,x='')=>`<img src="${imgSrc(p)}" alt="" ${x} ${p.img&&p.t==='doc'?`onerror="this.onerror=null;this.src=docAvatar(prov('${p.id}'))"`:''}>`;
