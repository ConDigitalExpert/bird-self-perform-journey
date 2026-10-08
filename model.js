/* A single real 3D campus model. WebGL and the software renderer consume the
   same world-space vertices, face normals, role groups and camera state. */
import {buildSubstation,buildInsulatorString} from './substation.js';
export const CAMERAS=[
 {target:[-1,0,1],yaw:-.78,pitch:.62,span:145},
 {target:[4,0,0],yaw:-.78,pitch:.73,span:132},
 {target:[-1,-1,14],yaw:-.83,pitch:.38,span:77},
 {target:[15,3,-5],yaw:-.78,pitch:.63,span:90},
 {target:[1,1,10],yaw:-.78,pitch:.39,span:65},
 {target:[-26,3,10],yaw:-.70,pitch:.39,span:66},
 {target:[12,0,8],yaw:-.82,pitch:.65,span:142}
];
export const ANCHORS={generation:[-6,5,26],powerlines:[-53,14,8],substations:[-30,5,5],telecom:[31,5,-8],'thermal-transfer':[36,4,10],earthworks:[-7,-1,10],utilities:[1,-1,17],concrete:[9,1,8],electrical:[3,5,-7],mechanical:[27,6,-21],hvac:[14,9,-18],'white-space':[24,4,-6],'commissioning-support':[-18,4,8],'hv-testing':[-31,5,12],expansion:[38,1,25],maintenance:[39,3,0],'planning-design':[12,.5,-3],'permit-authority':[-7,1,-23],'structure-enclosure':[16,10,-6],'owner-acceptance':[5,2,29],'energy-sources':[-86,15,-9],'power-skids':[-11,4.5,-13.5],'prefab-ups':[-11,4.5,0]};
// The build, in order: the team's chapters and construction layers in one guided sequence.
export const SEQ=[
 {id:'energy',label:'Energy sources',scopes:['energy-sources'],focus:'energy-sources',cam:{target:[-80,3,2],yaw:-.78,pitch:.5,span:92}},
 {id:'transmission',label:'Transmission line',scopes:['powerlines'],focus:'powerlines',cam:{target:[-62,7,6],yaw:-.78,pitch:.45,span:82}},
 {id:'substation',label:'Substation',scopes:['substations'],focus:'substations',cam:{target:[-28,2,4],yaw:-.78,pitch:.52,span:64}},
 {id:'earthworks',label:'Earthworks',scopes:['earthworks'],focus:'earthworks',cam:{target:[-6,0,12],yaw:-.80,pitch:.5,span:82}},
 {id:'utilities',label:'Underground utilities',scopes:['utilities'],focus:'utilities',cam:{target:[-6,-1,14],yaw:-.83,pitch:.38,span:74}},
 {id:'concrete',label:'Concrete',scopes:['concrete'],focus:'concrete',cam:{target:[12,0,-2],yaw:-.78,pitch:.6,span:88}},
 {id:'steel',label:'Structural steel and enclosure',scopes:['structure-enclosure'],focus:'structure-enclosure',cam:{target:[15,4,-6],yaw:-.78,pitch:.55,span:88}},
 {id:'electrical',label:'Electrical, skids to racks',scopes:['generation','power-skids','prefab-ups','electrical'],focus:'electrical',cam:{target:[5,2,-4],yaw:-.78,pitch:.62,span:92}},
 {id:'mechanical',label:'Mechanical and cooling',scopes:['mechanical','thermal-transfer','hvac'],focus:'mechanical',cam:{target:[18,4,-10],yaw:-.78,pitch:.6,span:90}},
 {id:'whitespace',label:'Telecom and white space',scopes:['telecom','white-space'],focus:'white-space',cam:{target:[16,2,-4],yaw:-.78,pitch:.7,span:80}},
 {id:'commissioning',label:'Commissioning and readiness',scopes:['hv-testing','commissioning-support','owner-acceptance'],focus:'hv-testing',cam:{target:[-12,2,14],yaw:-.75,pitch:.45,span:86}}
];
export const V=(x,y,z)=>[x,y,z],add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,n)=>a.map(v=>v*n),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>mul(a,1/(Math.hypot(...a)||1));
export const C={green:'#00703c',steel:'#819590',metal:'#bfc9c5',copper:'#be7d40',soil:'#a69072',sand:'#d4c5aa',concrete:'#bdc6bd',orange:'#ef8a32',black:'#354b41',white:'#dce4df',pipe:'#397e65',glass:'#659291',blue:'#60949d'};
export function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)}
export function buildCampus(){
 const objects=[];let n=0;
 const face=(pts)=>({pts,normal:norm(cross(sub(pts[1],pts[0]),sub(pts[2],pts[0]))) });
 function mesh(scope,faces,color,options={}){const parts=[];for(const p of faces){if(p.length===4&&!options.terrain&&!options.flat&&!options.shadow){const a=sub(p[1],p[0]),b=sub(p[3],p[0]),nx=Math.ceil(Math.hypot(...a)/5),ny=Math.ceil(Math.hypot(...b)/5);if(nx>1||ny>1){for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const at=(u,v)=>add(p[0],add(mul(a,u/nx),mul(b,v/ny)));const q=face([at(i,j),at(i+1,j),at(i+1,j+1),at(i,j+1)]);q.uv=[[i/nx,j/ny],[(i+1)/nx,j/ny],[(i+1)/nx,(j+1)/ny],[i/nx,(j+1)/ny]];parts.push(q);}continue;}}const q=face(p);if(p.length===4)q.uv=[[0,0],[1,0],[1,1],[0,1]];parts.push(q)}objects.push({id:n++,scope,faces:parts,center:faces[0].reduce((a,p)=>add(a,mul(p,1/faces[0].length)),[0,0,0]),color:rgb(color||C.concrete),hex:color||C.concrete,...options});}
 function box(scope,x,y,z,w,h,d,col,options={}){const p=[V(x-w/2,y,z-d/2),V(x+w/2,y,z-d/2),V(x+w/2,y+h,z-d/2),V(x-w/2,y+h,z-d/2),V(x-w/2,y,z+d/2),V(x+w/2,y,z+d/2),V(x+w/2,y+h,z+d/2),V(x-w/2,y+h,z+d/2)];if(options.angle){const a=options.angle;for(const q of p){const X=q[0]-x,Z=q[2]-z;q[0]=x+X*Math.cos(a)-Z*Math.sin(a);q[2]=z+X*Math.sin(a)+Z*Math.cos(a)}}mesh(scope,[[3,2,1,0],[4,5,6,7],[0,4,7,3],[2,6,5,1],[7,6,2,3],[0,1,5,4]].map(f=>f.map(i=>p[i])),col,options)}
 function pipe(scope,a,b,r,col,options={}){const axis=norm(sub(b,a)),u=norm(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),v=cross(axis,u),N=options.sides||8,pa=[],pb=[];for(let i=0;i<N;i++){const q=add(mul(u,Math.cos(i/N*2*Math.PI)*r),mul(v,Math.sin(i/N*2*Math.PI)*r));pa.push(add(a,q));pb.push(add(b,q))}let faces=[pa.slice().reverse(),pb];for(let i=0;i<N;i++){const j=(i+1)%N;faces.push([pa[i],pa[j],pb[j],pb[i]])}mesh(scope,faces,col,{...options,noEdge:true})}
 function route(scope,pts,r,col,opt={}){for(let i=0;i<pts.length-1;i++)pipe(scope,pts[i],pts[i+1],r,col,opt)}
 function frame(scope,x,z,w,d,h,col,opt={}){for(const X of [x-w/2,x+w/2])for(const Z of [z-d/2,z+d/2])box(scope,X,0,Z,.19,h,.19,col,opt);for(const Z of [z-d/2,z+d/2])box(scope,x,h,Z,w,.18,.18,col,opt);for(const X of [x-w/2,x+w/2])box(scope,X,h,z,.18,.18,d,col,opt)}
 function shadow(x,z,w,d,op=.10){box('context',x,-.025,z,w,.006,d,'#687b6b',{shadow:true,opacity:op})}
 // Terrain, road loop, cut soil edge and restrained cadastral grid.
 box('context',0,-3.9,0,123,.8,85,'#cbd1ca',{terrain:true});
 box('context',0,-3.1,-15.85,123,3.05,53.3,'#e4e9e2',{terrain:true});
 box('context',0,-3.1,29.75,123,3.05,25.5,'#e4e9e2',{terrain:true});
 box('context',-49.75,-3.1,13.9,23.5,3.05,6.2,'#e4e9e2',{terrain:true});
 box('context',39.75,-3.1,13.9,43.5,3.05,6.2,'#e4e9e2',{terrain:true});
 for(let x=-60;x<=60;x+=8)box('context',x,-.028,0,.025,.008,83,'#c9d1c9',{flat:true});for(let z=-40;z<=40;z+=8)box('context',0,-.029,z,121,.008,.025,'#c9d1c9',{flat:true});
 for(const z of [-31,35])box('context',0,0,z,117,.08,4,'#c1c9c3',{flat:true});for(const x of [-44,49])box('context',x,0,2,4,.08,64,'#c1c9c3',{flat:true});box('context',0,0,17,92,.06,4,'#c2ccc5',{flat:true});
 for(let x=-55;x<58;x+=4){box('context',x,.10,35,1.7,.01,.10,'#eff2ed',{flat:true});box('context',x,.10,-31,1.7,.01,.10,'#eff2ed',{flat:true})}
 // Main hall: 44 x 32 metres in this illustrative spatial model.
 shadow(15,-6,49,37,.13);box('concrete',15,0,-6,44,.55,32,C.concrete,{build:2});
 const hall={build:3};box('structure-enclosure',15,.55,-22,44,9,.3,C.white,{...hall,wall:true});box('structure-enclosure',37,.55,-6,.3,9,32,C.white,{...hall,wall:true});box('structure-enclosure',-7,.55,-6,.3,9,32,C.white,{...hall,wall:true,cut:true});box('structure-enclosure',15,.55,10,44,9,.3,C.white,{...hall,wall:true,cut:true});
 for(let x=-7;x<=37;x+=5.5){for(const z of [-22,10]){box('structure-enclosure',x,.55,z,.20,9.15,.34,C.steel,hall);box('structure-enclosure',x,9.45,-6,.19,.23,32,C.steel,hall)}}
 for(let z=-22;z<=10;z+=4)box('structure-enclosure',15,9.52,z,44,.20,.14,C.steel,hall);
 box('structure-enclosure',15,9.67,-6,44,.20,32,C.white,{...hall,roof:true});for(let x=-5;x<37;x+=2.2)box('structure-enclosure',x,9.9,-6,.035,.03,32,C.steel,{...hall,roof:true});
 // Interior zone separation. Low upstands remain visible through cutaway.
 box('concrete',10,.55,-6,.25,1,32,C.concrete,{build:2});box('concrete',23,.55,-6,.25,1,32,C.concrete,{build:2});
 for(let x=-5;x<9;x+=2.4){box('concrete',x,.55,8,1.5,.4,1.5,C.concrete,{build:2});box('concrete',x,.55,-20,1.5,.4,1.5,C.concrete,{build:2})}
 // Switchgear, UPS and electrical routing.
 for(let z=-18;z<=5;z+=4){for(const x of [-3,1,5]){box('electrical',x,.6,z,2.1,3.4,2.65,C.green,{build:3});box('electrical',x,.7,z+1.34,1.85,3.1,.03,C.metal,{build:3});box('electrical',x,2.45,z+1.37,.50,.46,.05,C.black,{build:3});box('electrical',x-.76,1.55,z+1.40,.09,.65,.04,C.black,{build:3});for(let l=0;l<5;l++)box('electrical',x-1.064,.97+l*.30,z,.035,.05,2.25,C.steel,{build:3});box('electrical',x-1.09,2.5,z,.04,.45,.55,C.black,{build:3});for(let l=0;l<3;l++)box('electrical',x+.54,.85+l*.18,z+1.39,.55,.05,.04,C.steel,{build:3});box('electrical',x+.65,3.45,z+1.41,.19,.20,.02,C.orange,{build:3})}}
 for(const x of [-3,1,5]){box('electrical',x,5.1,-6,1.2,.18,29,C.steel,{build:3});for(let k=0;k<4;k++)route('electrical',[[x-.42+k*.25,5.35,-20],[x-.42+k*.25,5.35,9],[x-.42+k*.25,.5,9],[x-.42+k*.25,-1.7,15]],.085,k===0?C.green:C.copper,{build:3});for(let z=-19;z<10;z+=3)box('electrical',x,5.09,z,1.5,.12,.08,C.metal,{build:3})}
 // Server halls and overhead telecom containment.
 const rackCols=[15.4,17.9,20.4,25,27.5,30,32.5,35];for(const x of rackCols)for(let z=-17.5;z<=6;z+=2.6){box('white-space',x,.58,z,1.25,2.9,2.1,C.black,{build:3});box('white-space',x-.65,.83,z,.03,2.3,1.8,C.steel,{build:3});for(let k=0;k<5;k++)box('white-space',x-.674,1.1+k*.42,z,.018,.08,1.62,C.metal,{build:3})}
 // Overhead busway with a power drop into every rack.
 for(const x of rackCols){box('electrical',x+.3,3.82,-5.8,.26,.14,24.8,C.copper,{build:3});for(let z=-17.5;z<=6;z+=2.6)box('electrical',x+.3,3.48,z,.05,.36,.05,C.copper,{build:3})}
 for(const x of [15,24,33]){box('telecom',x,4.45,-6,.60,.18,29,C.green,{build:3});for(let z=-18;z<=7;z+=5)box('telecom',x,3.45,z,.1,1,.1,C.copper,{build:3})}box('telecom',24,4.45,8,20,.18,.6,C.green,{build:3});
 // Mechanical plant and thermal transfer corridor.
 for(let i=0;i<6;i++){const x=7+i*4.2;box('mechanical',x,.15,-26.5,3.4,.3,4.2,C.concrete,{build:3});box('mechanical',x,.45,-26.5,2.8,3.2,3.8,C.green,{build:3});pipe('mechanical',[x,3.7,-27.8],[x,3.7,-25.2],.9,C.metal,{build:3});box('mechanical',x+.1,1.2,-24.55,1.2,1,.1,C.steel,{build:3})}
 for(let i=0;i<2;i++){const x=39+i*1.6;route('thermal-transfer',[[x,.7,26],[x,4.4,26],[x,4.4,-27],[30,4.4,-27]],.30,i?C.copper:C.green,{build:3});for(let z=-25;z<28;z+=5){box('thermal-transfer',x,.1,z,.2,4.3,.2,C.steel,{build:3});pipe('thermal-transfer',[x,4.4,z-.12],[x,4.4,z+.12],.41,C.metal,{build:3})}}
 // Rooftop HVAC; exposed in later cutaways as an offset service band.
 for(let x=-2;x<=33.5;x+=4.4)for(const z of [-17,-6.5,4]){box('hvac',x,9.95,z,3.8,1.1,3.4,C.green,{build:3,hvac:true});for(const X of [x-.9,x+.9]){pipe('hvac',[X,11.07,z],[X,11.19,z],.75,C.black,{build:3,hvac:true,sides:12});pipe('hvac',[X,11.20,z],[X,11.24,z],.56,C.steel,{build:3,hvac:true,sides:12});box('hvac',X,11.26,z,1.2,.015,.055,C.metal,{build:3,hvac:true});box('hvac',X,11.26,z,.055,.015,1.2,C.metal,{build:3,hvac:true})}}
 // Substation. Transformers, insulators, busbars and gantries. No bonding or grounding mat block (removed 5 Oct 2026, V32).
 shadow(-28,4,26,22,.1);
 for(let x=-39;x<=-17;x+=5.5){for(const z of [-6,14]){pipe('substations',[x,.25,z],[x,7.2,z],.14,C.steel,{build:3});pipe('substations',[x,7.2,z],[x,7.2,z+3],.09,C.steel,{build:3})}}
 for(let row=0;row<2;row++)for(let j=0;j<3;j++){const x=-35+j*7,z=-1+row*10;box('substations',x,.3,z,4.8,.5,4.5,C.concrete,{build:2});box('substations',x,.8,z,3.1,2.8,2.8,C.green,{build:3});for(let k=0;k<8;k++)box('substations',x-1.68,.98,z-1.3+k*.36,.2,2.0,.10,C.metal,{build:3});for(let k=-1;k<=1;k++){pipe('substations',[x+k,3.6,z],[x+k,5.6,z],.18,C.black,{build:3});for(let l=0;l<5;l++)pipe('substations',[x+k,4.1+l*.27,z],[x+k,4.16+l*.27,z],.30,C.metal,{build:3});route('substations',[[x+k,5.65,z],[x+k,6.0,z-3],[x+k,6.0,-7]],.095,C.copper,{build:3})}}
 for(const z of [-7,16])box('substations',-28,.15,z,27,2,.08,C.steel,{build:3,fence:true});for(const x of [-41,-15])box('substations',x,.15,4,.08,2,24,C.steel,{build:3,fence:true});
 for(let x=-41;x<=-15;x+=2){pipe('substations',[x,.2,16],[x,2.3,16],.04,C.steel,{build:3});pipe('substations',[x,.2,-8],[x,2.3,-8],.04,C.steel,{build:3})}
 // Generation yard.
 shadow(-6,26,24,13,.1);box('generation',-6,.1,26,24,.25,12,C.concrete,{build:2});for(let j=0;j<4;j++){const x=-14+j*5.2;box('generation',x,.4,26,3.5,3.1,7,C.green,{build:3});for(let k=0;k<7;k++)box('generation',x-1.77,.9+k*.27,25,.03,.09,3.9,C.black,{build:3});pipe('generation',[x,3.5,28],[x,7.2,28],.23,C.metal,{build:3});pipe('generation',[x+.65,3.5,28],[x+.65,6.4,28],.18,C.metal,{build:3});box('generation',x,2,29.55,1.4,.55,.03,C.black,{build:3});box('generation',x+1.2,.6,29.7,.25,1.4,.07,C.orange,{build:3})}
 // High/medium-voltage lattice towers and curved span conductors.
 for(const z of [-18,9,34]){const x=-53;for(const dx of [-1.5,1.5])for(const dz of [-1.5,1.5])pipe('powerlines',[x+dx,.1,z+dz],[x+dx*.2,17,z+dz*.2],.1,C.steel,{build:3});for(let y=2;y<16;y+=3){const r=1.5-y*.07;for(const s of [-1,1]){pipe('powerlines',[x-r,y,z+s*r],[x+r*.83,y+2.9,z+s*r*.83],.05,C.steel,{build:3});pipe('powerlines',[x+r,y,z+s*r],[x-r*.83,y+2.9,z+s*r*.83],.05,C.steel,{build:3})}}pipe('powerlines',[x-4,13,z],[x+4,13,z],.15,C.green,{build:3});pipe('powerlines',[x-3,16,z],[x+3,16,z],.12,C.green,{build:3});for(const dx of [-3.8,3.8])pipe('powerlines',[x+dx,13,z],[x+dx,11.7,z],.14,C.black,{build:3})}
 for(const x of [-56.8,-49.2])for(const interval of [[-18,9],[9,34]]){const p=[];for(let j=0;j<=12;j++){const t=j/12;p.push([x,11.7-Math.sin(t*Math.PI)*2.2,interval[0]+t*(interval[1]-interval[0])])}route('powerlines',p,.047,C.green,{build:3})}
 // Below-ground trench: a deliberate cutaway across the front of the hall.
 box('earthworks',-10,-3.05,13.9,56,3.0,6.2,C.soil,{trench:true});box('earthworks',0,-2.8,14.1,33,.2,5.7,C.sand,{build:2});for(const z of [11.35,16.85])box('concrete',0,-2.8,z,33,2.8,.18,C.concrete,{build:2,trenchWall:z>14});
 for(let i=0;i<4;i++){const z=12.1+i*1.12;route('utilities',[[-34,-1.7,z],[-2,-1.7,z],[5,-1.7,z],[5,-1.7,9],[5,.6,9]],i<2?.29:.17,i<2?C.green:C.black,{build:2});for(let x=-30;x<=0;x+=5)pipe('utilities',[x-.12,-1.7,z],[x+.12,-1.7,z],i<2?.37:.23,C.metal,{build:2})}
 for(let x=-13;x<=12;x+=5){box('concrete',x,-2.6,14, .32,.35,5,C.concrete,{build:2});for(const z of [11.5,16.65])box('concrete',x,-2.55,z,.16,2.7,.16,C.steel,{build:2})}
 // Planning footprint and off-site fabrication / logistics modules.
 for(const z of [-22,10])box('planning-design',15,.65,z,44,.035,.16,C.green,{planning:true});for(const x of [-7,37])box('planning-design',x,.65,-6,.16,.035,32,C.green,{planning:true});
 for(let i=0;i<3;i++){box('planning-design',-18+i*5,.12,-22,4,2.2,3.2,C.green,{planning:true});box('planning-design',-18+i*5,.5,-20.38,3.3,1.2,.04,C.glass,{planning:true})}
 frame('planning-design',15,-6,44,32,9.8,C.steel,{ghost:true});
 // Expansion foundations and future steel frame in the same campus.
 box('expansion',31.5,.07,26,25,.15,12,C.soil,{expansion:true});for(let x=22;x<=42;x+=5){for(const z of [22,30]){box('expansion',x,.25,z,2.3,.6,2.3,C.concrete,{expansion:true});box('expansion',x,.85,z,.22,4,.22,C.green,{expansion:true})}}for(const z of [22,30])box('expansion',32,4.8,z,21,.24,.24,C.green,{expansion:true});for(let x=23;x<42;x+=6)route('expansion',[[x,-.1,23],[x,-.1,29]],.32,C.green,{expansion:true});
 // Excavator, material laydown and inspection hold point details.
 const vehicle=(scope,x,z)=>{box(scope,x,.2,z,2,.4,3.2,C.black);box(scope,x,.7,z,2.2,.55,2.5,C.orange);box(scope,x+.35,1.25,z-.4,1.2,1.4,1.25,C.orange);box(scope,x+.35,1.75,z+.24,.9,.6,.05,C.glass);route(scope,[[x-.7,1.3,z+.8],[x-.7,3.3,z+2],[x-.7,2.2,z+4]],.20,C.orange);box(scope,x-.7,.5,z+4,.8,.5,1,C.black)};
 vehicle('earthworks',-6,20);vehicle('expansion',40,25);for(let k=0;k<5;k++)pipe('expansion',[20+k*.85,.5,32],[20+k*.85,.5,34],.35,C.concrete,{expansion:true});
 // A testing workstation is an illustrative package-test context, not full IST.
 box('hv-testing',-31,.4,12,2,1.25,1.3,C.green,{build:3});box('hv-testing',-31,1.67,12,1.7,.08,1.05,C.metal,{build:3});box('hv-testing',-31,1.75,11.8,1.1,.65,.1,C.black,{build:3});route('hv-testing',[[-31,1,11.4],[-30,.2,10],[-29,.2,9],[-29,3,9]],.05,C.orange,{build:3});
 for(const p of [[-33,10],[-33,14],[-28,10],[-28,14]]){pipe('hv-testing',[p[0],.1,p[1]],[p[0],1.3,p[1]],.05,C.orange,{build:3});box('hv-testing',p[0],.1,p[1],.5,.06,.5,C.orange,{build:3})}
 box('owner-acceptance',7,.12,29,4,2.7,3,C.concrete,{build:3});box('commissioning-support',-18,.15,10,2.2,2.7,2.3,C.metal,{build:3});
 box('maintenance',42,.1,2,6,3.1,6,C.concrete,{build:3});box('maintenance',42,3.25,2,6.3,.15,6.3,C.white,{build:3});box('permit-authority',-9,.1,-24,1.8,.8,1.8,C.concrete,{planning:true});
 // Perimeter landscaping: abstract architectural trees, always neutral.
 for(let i=0;i<30;i++){const x=-56+i*3.9,z=i%2?-36:-39;pipe('context',[x,0,z],[x,1.9,z],.10,'#acb9ac',{tree:true});pipe('context',[x,1.2,z],[x,3.8+(i%3)*.3,z],1.10,'#afbcad',{tree:true,sides:6})}for(let i=0;i<15;i++){const z=-25+i*4;pipe('context',[55,0,z],[55,2,z],.1,'#acb9ac',{tree:true});pipe('context',[55,1.6,z],[55,4,z],1.05,'#b4c0b2',{tree:true,sides:6})}
 // Energy sources beyond the campus: an illustrative mix, not a project energy strategy.
 box('context',-81.5,-3.9,0,40,3.85,85,'#dfe5de',{terrain:true});
 pipe('energy-sources',[-92,0,-30],[-92,7,-30],4.2,C.white,{build:3,sides:16});for(let k=0;k<5;k++)pipe('energy-sources',[-92,7+k*.7,-30],[-92,7.7+k*.7,-30],4.2*Math.cos((k+1)/6*Math.PI/2),C.white,{build:3,sides:16});
 for(const [y0,y1,r] of [[0,2.6,5.6],[2.6,5.2,4.7],[5.2,8,4.2],[8,10.6,4.5]])pipe('energy-sources',[-79,y0,-34],[-79,y1,-34],r,C.concrete,{build:3,sides:16});box('energy-sources',-86,0,-23.5,6,3,4,C.concrete,{build:3});
 for(let j=0;j<3;j++){const z=-14+j*6;box('energy-sources',-84,.1,z,9,3.6,3.6,C.green,{build:3});box('energy-sources',-77.6,.1,z,3.2,2.6,3,C.metal,{build:3});pipe('energy-sources',[-88,3.7,z],[-88,11,z],.75,C.metal,{build:3,sides:10})}
 box('energy-sources',-93,-.03,8,14,.05,12,C.blue,{build:3,flat:true});box('energy-sources',-85.6,0,8,1.6,5.5,13,C.concrete,{build:3});route('energy-sources',[[-85,4.4,5],[-82,1.2,5],[-79.4,.8,5]],.55,C.steel,{build:3});box('energy-sources',-77.6,.1,5,3.2,3,4,C.concrete,{build:3});
 for(const [x,z] of [[-97,24],[-89,33],[-97,38]]){pipe('energy-sources',[x,0,z],[x,16,z],.45,C.white,{build:3,sides:10});box('energy-sources',x,15.6,z,1.2,1,2.6,C.white,{build:3});for(let b=0;b<3;b++){const a=b*2*Math.PI/3+.4;pipe('energy-sources',[x,16.1,z+1.4],[x+Math.cos(a)*7,16.1+Math.sin(a)*7,z+1.5],.18,C.white,{build:3,sides:6})}}
 for(let r=0;r<6;r++)for(let s=0;s<4;s++){const x=-83+s*4.6,z=19+r*3.4;box('energy-sources',x,.55,z,4.2,.08,1.8,C.blue,{build:3});box('energy-sources',x,0,z+.5,.12,.6,.12,C.steel,{build:3})}
 // Illustrative 230 kV line on lattice towers from the energy sources to the substation.
 const tower=(x,z)=>{for(const dx of [-1.5,1.5])for(const dz of [-1.5,1.5])pipe('powerlines',[x+dx,.1,z+dz],[x+dx*.2,17,z+dz*.2],.1,C.steel,{build:3});for(let y=2;y<16;y+=3){const r=1.5-y*.07;for(const s of [-1,1]){pipe('powerlines',[x+s*r,y,z-r],[x+s*r*.83,y+2.9,z+r*.83],.05,C.steel,{build:3});pipe('powerlines',[x+s*r,y,z+r],[x+s*r*.83,y+2.9,z-r*.83],.05,C.steel,{build:3})}}pipe('powerlines',[x,13,z-4],[x,13,z+4],.15,C.green,{build:3});pipe('powerlines',[x,16,z-3],[x,16,z+3],.12,C.green,{build:3});for(const dz of [-3.8,3.8])pipe('powerlines',[x,13,z+dz],[x,11.7,z+dz],.14,C.black,{build:3})};
 tower(-66,11);tower(-80,11);
 const sag=(a,b,d)=>{const p=[];for(let j=0;j<=12;j++){const t=j/12;p.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-Math.sin(t*Math.PI)*d,a[2]+(b[2]-a[2])*t])}return p};
 for(const dz of [-3.8,3.8]){route('powerlines',sag([-80,11.7,11+dz],[-66,11.7,11+dz],1.6),.047,C.green,{build:3});route('powerlines',sag([-66,11.7,11+dz],[-53.3,12,9+dz*.35],1.3),.047,C.green,{build:3})}
 for(const [z0,z1] of [[7.8,-3],[10.2,14]])route('powerlines',sag([-52.7,12,z0],[-39,7.2,z1],.9),.045,C.green,{build:3});
 // Fibre along the towers, then underground into the meet-me room.
 route('telecom',[[-80,17.25,11],[-73,16.6,11],[-66,17.25,11],[-59.5,16.7,10],[-53,17.25,9]],.06,C.blue,{build:3});
 route('telecom',[[-53,17.25,-18],[-53,16.5,-4.5],[-53,17.25,9],[-53,16.5,21.5],[-53,17.25,34]],.06,C.blue,{build:3});
 route('telecom',[[-52.4,16.8,9.6],[-52.4,.2,9.6],[-52.4,-1.2,16.2],[12,-1.2,16.2],[12,.35,16.2],[12,.35,9.2],[12.4,.6,8.1]],.12,C.blue,{build:3});
 for(let k=0;k<3;k++)box('telecom',11.4+k*1.1,.58,7.4,.9,2.4,1.1,C.black,{build:3});
 // Prefabricated HV power skids and skidded UPS rooms. Generic modules only.
 for(const z of [-17,-10.5]){box('power-skids',-11,.1,z,2.8,.35,6,C.steel,{build:3});box('power-skids',-11,.45,z,2.6,3,5.6,C.white,{build:3});box('power-skids',-9.68,.8,z,.04,2.2,4.8,C.metal,{build:3});box('power-skids',-11,3.45,z,2.9,.18,5.9,C.green,{build:3});route('power-skids',[[-12.4,2.6,z],[-14.6,2.6,z],[-14.6,.4,z]],.12,C.copper,{build:3})}
 for(const z of [-3.5,3.5]){box('prefab-ups',-11,.1,z,2.8,.35,6,C.steel,{build:3});box('prefab-ups',-11,.45,z,2.6,3.2,5.6,C.green,{build:3});for(let k=0;k<4;k++)box('prefab-ups',-9.69,.9,z-2+k*1.3,.04,2.2,.9,C.metal,{build:3});box('prefab-ups',-11,3.65,z,2.9,.18,5.9,C.white,{build:3});route('prefab-ups',[[-9.6,2.6,z],[-7.4,2.6,z]],.14,C.copper,{build:3})}
 // Where grey space ends and white space begins.
 box('white-space',14.4,.56,-6,.22,.02,31,C.orange,{build:3,flat:true});
 // Further halls on the same campus, shown as outlines to convey campus scale.
 box('context',15,-3.9,-66,123,3.85,46,'#e4e9e2',{terrain:true,campus:true});
 for(const x of [-12,42]){box('campus-scale',x,.05,-60,44,.5,32,C.concrete,{future:true});box('campus-scale',x,.55,-60,44,9.4,32,C.white,{future:true});for(let k=0;k<9;k++)for(const zz of [-71,-60,-49])box('campus-scale',x-17.6+k*4.4,9.95,zz,3.8,1.1,3.4,C.green,{future:true})}
 buildStory(objects,{box,pipe,route,frame,C});
 for(const o of objects){const i=SEQ.findIndex(s=>s.scopes.includes(o.scope));o.seqIndex=i<0?null:i}
 // Material response: metals and glass take a soft specular sheen; outlines on built elements only.
 const SPEC={[C.metal]:.45,[C.steel]:.4,[C.copper]:.6,[C.glass]:.75,[C.black]:.3,[C.green]:.22,[C.blue]:.5,[C.white]:.12,[C.orange]:.25,[C.pipe]:.35,[C.concrete]:.05};
 for(const o of objects){o.spec=o.terrain||o.flat||o.shadow||o.scope==='context'?0:(SPEC[o.hex]??.1);o.edge=o.noEdge||o.terrain||o.flat||o.shadow||o.tree?0:1}
 return objects;
}

/* =====================================================================
   ANIMATION DATA AND EVALUATION (6 October 2026, ANIMATION-CONTRACT sections 2 and 3)
   Pure functions of (p, t): no random numbers and no clock reads. Matrices are column-major Float32Array(16) in the world frame
   (x east, y up, z south, metres). t is the effective time (0 when motion is off). For p < 0 (the intro) everything behaves as for p = 0.
   ===================================================================== */
export const ANIM_VERSION=1;
export const ANIM={version:1,rigs:{},parts:{},reveals:{},flows:[],marks:{}};
const TAU=Math.PI*2,DEG=Math.PI/180;
const clamp01=x=>x<0?0:x>1?1:x,smooth=x=>{x=clamp01(x);return x*x*(3-2*x)},lerp1=(a,b,t)=>a+(b-a)*t;
/* ---------- matrices ---------- */
const mIdent=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function mMul(a,b){const r=new Float32Array(16);for(let c=0;c<4;c++)for(let w=0;w<4;w++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+w]*b[c*4+k];r[c*4+w]=s}return r}
const mTrans=(x,y,z)=>{const m=mIdent();m[12]=x;m[13]=y;m[14]=z;return m};
function mRotAbout(pv,ax,rad){const l=Math.hypot(ax[0],ax[1],ax[2])||1,x=ax[0]/l,y=ax[1]/l,z=ax[2]/l,c=Math.cos(rad),s=Math.sin(rad),t=1-c;
 const R=new Float32Array([t*x*x+c,t*x*y+s*z,t*x*z-s*y,0,t*x*y-s*z,t*y*y+c,t*y*z+s*x,0,t*x*z+s*y,t*y*z-s*x,t*z*z+c,0,0,0,0,1]);
 return mMul(mTrans(pv[0],pv[1],pv[2]),mMul(R,mTrans(-pv[0],-pv[1],-pv[2])))}
function mScaleAlong(pv,ax,k){const l=Math.hypot(ax[0],ax[1],ax[2])||1,a=[ax[0]/l,ax[1]/l,ax[2]/l],f=k-1;
 const S=new Float32Array([1+f*a[0]*a[0],f*a[0]*a[1],f*a[0]*a[2],0,f*a[0]*a[1],1+f*a[1]*a[1],f*a[1]*a[2],0,f*a[0]*a[2],f*a[1]*a[2],1+f*a[2]*a[2],0,0,0,0,1]);
 return mMul(mTrans(pv[0],pv[1],pv[2]),mMul(S,mTrans(-pv[0],-pv[1],-pv[2])))}
function mScaleXYZ(pv,s){const S=new Float32Array([s[0],0,0,0,0,s[1],0,0,0,0,s[2],0,0,0,0,1]);return mMul(mTrans(pv[0],pv[1],pv[2]),mMul(S,mTrans(-pv[0],-pv[1],-pv[2])))}
const mApply=(m,p)=>m?[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]]:[p[0],p[1],p[2]];
const mIsIdent=(m,eps=1e-7)=>{const I=mIdent();for(let i=0;i<16;i++)if(Math.abs(m[i]-I[i])>eps)return false;return true};
/* ---------- paths (movers on a polyline, open or closed) ---------- */
function prepPath(path){const pts=path.pts.map(q=>q.slice());if(path.closed)pts.push(pts[0].slice());const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1],pts[i][2]-pts[i-1][2]));return{pts,cum,L:cum[cum.length-1],closed:!!path.closed}}
function pathPoint(P,s){if(P.closed)s=((s%P.L)+P.L)%P.L;else s=s<0?0:s>P.L?P.L:s;let i=1;while(i<P.cum.length-1&&P.cum[i]<s)i++;const a=P.pts[i-1],b=P.pts[i],u=(s-P.cum[i-1])/((P.cum[i]-P.cum[i-1])||1);return[lerp1(a[0],b[0],u),lerp1(a[1],b[1],u),lerp1(a[2],b[2],u)]}
function pathHeading(P,s){const a=pathPoint(P,s-1),b=pathPoint(P,s+1);return Math.atan2(b[2]-a[2],b[0]-a[0])}
function pathPose(P,s,s0){const p0=pathPoint(P,s0),p1=pathPoint(P,s),d=pathHeading(P,s)-pathHeading(P,s0),c=Math.cos(d),sn=Math.sin(d);
 const R=new Float32Array([c,0,sn,0,0,1,0,0,-sn,0,c,0,0,0,0,1]);return mMul(mTrans(p1[0],p1[1],p1[2]),mMul(R,mTrans(-p0[0],-p0[1],-p0[2])))}
/* ---------- motion ---------- */
function evalKeys(keys,x,kind){if(x<=keys[0][0])return keys[0][1];const n=keys.length;if(x>=keys[n-1][0])return keys[n-1][1];let i=1;while(keys[i][0]<x)i++;
 const k0=keys[i-1],k1=keys[i],u=clamp01((x-k0[0])/((k1[0]-k0[0])||1));return lerp1(k0[1],k1[1],kind==='linear'?u:u*u*(3-2*u))}
function rigPhase(rig,t){if(!rig||t<=rig.delay)return 0;const u=(t-rig.delay)/rig.period;return rig.loop===false?Math.min(u,1):u-Math.floor(u)}
function evalMotion(m,p,t){switch(m.type){
 case 'cycle':{const v=evalKeys(m.keys,rigPhase(ANIM.rigs[m.rig],t),m.ease);return m.units==='rad'||m.units==='m'?v:v*DEG}
 case 'spin':{const r=m.rate*t;return m.units==='rad/s'?r:r*DEG}
 case 'p':{const v=evalKeys(m.keys,p,m.ease);return m.units==='rad'||m.units==='m'?v:v*DEG}
 case 'fn':return m.f(p,t);
 case 'sum':{let s=0;for(const q of m.of)s+=evalMotion(q,p,t);return s}
 default:throw Error('unknown motion type '+m.type)}}
let _paths={},_order=null,_flowIdx=null;
function animReset(){_paths={};_order=null;_flowIdx=null}
function partOrder(){if(_order)return _order;const ids=Object.keys(ANIM.parts),depth={},d=id=>{if(depth[id]!=null)return depth[id];depth[id]=0;const q=ANIM.parts[id];return depth[id]=q.parent?d(q.parent)+1:0};ids.forEach(d);return _order=ids.slice().sort((a,b)=>depth[a]-depth[b])}
/* local matrix of one part, or null at rest */
function localMatrix(part,v){switch(part.kind){
 case 'rev':return v===0?null:mRotAbout(part.pivot,part.axis,v);
 case 'slide':return v===0?null:mTrans(part.axis[0]*v,part.axis[1]*v,part.axis[2]*v);
 case 'scale':return v===1?null:mScaleAlong(part.pivot,part.axis,v);
 case 'path':{const P=_paths[part.id]||(_paths[part.id]=prepPath(part.path));const s0=part.path.s0||0;if(v===0)return null;const m=pathPose(P,s0+v,s0);return mIsIdent(m)?null:m}
 default:throw Error('unknown part kind '+part.kind)}}
/* World matrix of every part at (p, t): {[partId]: Float32Array(16) | null}; null is the identity. t is the effective time. */
export function animPose(p,t){p=+p>0?+p:0;t=+t>0?+t:0;const out={};
 for(const id of partOrder()){const part=ANIM.parts[id],loc=localMatrix(part,evalMotion(part.motion,p,t)),par=part.parent?out[part.parent]:null;
  out[id]=loc&&par?mMul(par,loc):(loc||par||null)}
 return out}
/* ---------- reveals ---------- */
function revealState(rv,p){const lin=rv.ease==='linear',e=x=>{x=clamp01(x);return lin?x:x*x*(3-2*x)},rIn=e((p-rv.win[0])/((rv.win[1]-rv.win[0])||1)),q=rv.out?e((p-rv.out[0])/((rv.out[1]-rv.out[0])||1)):0;return{r:rIn*(1-q),rIn,q}}
function revealGeometry(rv,r){let M=null,wipe=null;
 for(const fx of rv.fx||[]){
  if(fx.type==='move'){const T=mTrans(fx.from[0]*(1-r),fx.from[1]*(1-r),fx.from[2]*(1-r));M=M?mMul(T,M):T}
  else if(fx.type==='scale'){const S=mScaleXYZ(fx.pivot,[lerp1(fx.from[0],1,r),lerp1(fx.from[1],1,r),lerp1(fx.from[2],1,r)]);M=M?mMul(S,M):S}
  else if(fx.type==='wipe'){const l=Math.hypot(fx.axis[0],fx.axis[1],fx.axis[2])||1;wipe=[fx.axis[0]/l,fx.axis[1]/l,fx.axis[2]/l,lerp1(fx.from,fx.to,r),fx.invert?1:0,fx.edge||0]}}
 return{m:M&&!mIsIdent(M)?M:null,wipe}}
function revealDrawn(rv,r){const w=(rv.fx||[]).find(f=>f.type==='wipe');return w&&w.invert?r<1-1e-6:r>1e-6}
const revealAlpha=(rv,r)=>rv.fade?smooth((r-rv.fade[0])/((rv.fade[1]-rv.fade[0])||1)):1;
/* {r, m (Float32Array(16) or null), wipe [ax,ay,az,front,invert,edge] or null, drawn, alpha} */
export function revealOf(id,p){const rv=ANIM.reveals[id];p=+p>0?+p:0;if(!rv)return{r:1,m:null,wipe:null,drawn:true,alpha:1};
 const s=revealState(rv,p),g=revealGeometry(rv,s.r);return{r:s.r,m:g.m,wipe:g.wipe,drawn:revealDrawn(rv,s.r),alpha:revealAlpha(rv,s.r)}}
/* {[key]: {value, total}} summed over the reveals that declare metrics */
export function animWork(p){p=+p>0?+p:0;const w={};
 for(const id in ANIM.reveals){const rv=ANIM.reveals[id];if(!rv.metrics)continue;const s=revealState(rv,p);
  for(const m of rv.metrics){const k=w[m.key]||(w[m.key]={value:0,total:0});k.total+=m.value;k.value+=m.value*(m.use==='q'?s.q:s.r)}}
 for(const k in w){w[k].value=Math.round(w[k].value*1e6)/1e6;w[k].total=Math.round(w[k].total*1e6)/1e6}
 return w}
/* ---------- flows ---------- */
function flowAtStep(fl,s,IDX){const a=IDX[fl.from||fl.step],focus=[fl.step,...(fl.also||[])].map(id=>IDX[id]);
 if(s<a)return 0;if(focus.includes(s))return 1;if(fl.region==='energy'&&s>=IDX.substation)return fl.faintEnergy??.22;return fl.faint??.3}
function flowIntensity(fl,p,IDX,n){const pc=p<0?0:p>n-1?n-1:p,k=Math.min(n-2,Math.floor(pc)),f=pc-k,A=flowAtStep(fl,k,IDX),B=flowAtStep(fl,k+1,IDX),
 t=smooth((f-(fl.order||0)*.55)/.45);return lerp1(A,B,A===0&&B>0?t:smooth(f))}
export function flowState(p){p=+p>0?+p:0;const o={};for(const f of ANIM.flows)o[f.id]=flowIntensity(f,p,STORY_INDEX,STORY_STEPS.length);return o}
/* pulse phase offset in metres, in double precision from the effective time: (speed * t + phase * gap) mod gap, in [0, gap) */
export function flowOffset(id,t){if(!_flowIdx){_flowIdx={};for(const f of ANIM.flows)_flowIdx[f.id]=f}const f=_flowIdx[id];if(!f)return 0;t=+t>0?+t:0;const o=(f.speed*t+(f.phase||0)*f.gap)%f.gap;return o<0?o+f.gap:o}
export function markWorld(id,p,t){const mk=ANIM.marks[id];if(!mk)return[0,0,0];return mApply(animPose(p,t)[mk.part],mk.p)}

/* =====================================================================
   STORY MODE GEOMETRY (added 5 October 2026, animation pass 6 October 2026)
   Everything below is generic and illustrative: plain boxes for modules and skids, no vendor designs, no bonding or grounding mat.
   Story-only objects carry storyOnly=true (the explorer hides them); every drawn story object carries
   o.story = {region, appear, disc, order?, hideFrom?, reprise?, modular?, structure?, underground?, clad?, look, part?, reveal?}
   as in STORY-CONTRACT section 7 and ANIMATION-CONTRACT section 3.2.
   World frame: x east, y up, z south (north is -z). Units are metres. Content x -145..75, z -365..55, height 0..43.
   The campus works fit x -31..53. Nothing here draws random numbers or reads the clock: two builds are identical.
   ===================================================================== */
export const STORY_STEPS=[
 {id:'energy',header:'Energy',camera:'energy',disc:'power'},
 {id:'grid',header:'High-voltage substation',camera:'energy',disc:'power'},
 {id:'transmission',header:'Transmission',camera:'transmission',disc:'power'},
 {id:'substation',header:'Campus substation',camera:'campus',disc:'power'},
 {id:'civil',header:'Civil works',camera:'campus',disc:'civil'},
 {id:'underground',header:'Underground utilities',camera:'campus',disc:'civil'},
 {id:'concrete',header:'Concrete',camera:'campus',disc:'civil'},
 {id:'structure',header:'Structure',camera:'campus',disc:'structure'},
 {id:'electrical',header:'Electrical',camera:'campus',disc:'electrical'},
 {id:'mechanical',header:'Mechanical',camera:'campus',disc:'mechanical'},
 {id:'modular',header:'Off-site modules',camera:'campus',disc:'modular'},
 {id:'telecom',header:'Telecom',camera:'campus',disc:'telecom'},
 {id:'whitespace',header:'White space',camera:'campus',disc:'whitespace'},
 {id:'next',header:'Next in the conversation',camera:'campus',disc:'none'}
];
export const STORY_INDEX=Object.fromEntries(STORY_STEPS.map((s,i)=>[s.id,i]));
// Colour hint per discipline (the renderer owns the final look). Racks and other neutral things use 'power' (white).
const DISC_HEX={power:'#ffffff',civil:'#ffffff',structure:'#ffffff',electrical:'#f58025',mechanical:'#e91d2e',telecom:'#00703c',modular:'#ffffff',context:'#161918'};

/* ---------- small vector kit ---------- */
const U3=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l]};
const X3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const S3=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const A3=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const M3=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
const D3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const L3=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const QUV=[[0,0],[1,0],[1,1],[0,1]];
const mkf=(pts,uv)=>{const f={pts,normal:U3(X3(S3(pts[1],pts[0]),S3(pts[2],pts[0])))};if(uv)f.uv=QUV;return f};
/* A "bag" is a plain array of faces; a bag becomes one object when emitted. Bags also remember the thickest pipe and bar they hold (b.pr, b.bar)
   so that out() can tag the object look 'wire' (nothing thicker than 0.8 m across) or 'solid', and the segments of their pipes and bars (b.segs). */
const trk=(b,k,v)=>{if(v>(b[k]||0))b[k]=v};
const seg=(b,A,B,r)=>{(b.segs||(b.segs=[])).push([A,B,r])};
const qd=(b,p0,p1,p2,p3,uv=1)=>{b.push(mkf([p0,p1,p2,p3],uv))};
// quad forced to face direction n (winding is flipped if needed)
const qn=(b,pts,n,uv=0)=>{let f=mkf(pts,uv);if(D3(f.normal,n)<0){f=mkf(pts.slice().reverse(),uv)}b.push(f)};
// up-facing flat rectangle on the ground plane
const flat=(b,x0,z0,x1,z1,y=0)=>{b.push(mkf([[x0,y,z0],[x0,y,z1],[x1,y,z1],[x1,y,z0]],0));b.big=1};
// axis-aligned box (optionally rotated about Y around its own centre); the unseen underside is omitted
const bx=(b,cx,y,cz,w,h,d,ry=0,uv=1)=>{const c=Math.cos(ry),s=Math.sin(ry),T=(x,yy,z)=>[cx+x*c-z*s,yy,cz+x*s+z*c],x0=-w/2,x1=w/2,z0=-d/2,z1=d/2;
 const p=[T(x0,y,z0),T(x1,y,z0),T(x1,y+h,z0),T(x0,y+h,z0),T(x0,y,z1),T(x1,y,z1),T(x1,y+h,z1),T(x0,y+h,z1)];
 for(const f of [[3,2,1,0],[4,5,6,7],[0,4,7,3],[2,6,5,1],[7,6,2,3]])qd(b,p[f[0]],p[f[1]],p[f[2]],p[f[3]],uv);
 const d3=[Math.abs(w),Math.abs(h),Math.abs(d)].sort((a,c)=>a-c);trk(b,'bar',d3[1]);
 if(d3[2]>=2.5&&d3[1]<1.4){const L=Math.abs(w)>=Math.abs(h)&&Math.abs(w)>=Math.abs(d)?[1,0,0]:Math.abs(d)>=Math.abs(h)?[0,0,1]:[0,1,0],len=Math.max(Math.abs(w),Math.abs(h),Math.abs(d)),mid=[cx,y+h/2,cz],ax=L[1]?[0,1,0]:[L[0]*c-L[2]*s,0,L[0]*s+L[2]*c];seg(b,A3(mid,M3(ax,-len/2)),A3(mid,M3(ax,len/2)),d3[1]/2)}};
// box by two corners (x0,y0,z0)-(x1,y1,z1)
const bb=(b,x0,y0,z0,x1,y1,z1,uv=1)=>bx(b,(x0+x1)/2,y0,(z0+z1)/2,Math.abs(x1-x0),y1-y0,Math.abs(z1-z0),0,uv);
// n-sided prism from A to B with radius r. caps: 0 none, 1 end only, 2 both ends
const pr=(b,A,B,r,n=6,caps=1,r2=null)=>{if(Math.hypot(...S3(B,A))<1e-6)return;const ax=U3(S3(B,A)),h=Math.abs(ax[1])>.9?[1,0,0]:[0,1,0],u=U3(X3(ax,h)),v=X3(ax,u),pa=[],pb=[],rb=r2==null?r:r2;
 for(let i=0;i<n;i++){const t=i/n*2*Math.PI,cu=Math.cos(t),sv=Math.sin(t);pa.push(A3(A,A3(M3(u,cu*r),M3(v,sv*r))));pb.push(A3(B,A3(M3(u,cu*rb),M3(v,sv*rb))))}
 for(let i=0;i<n;i++){const j=(i+1)%n;b.push(mkf([pa[i],pa[j],pb[j],pb[i]]))}
 if(caps>0&&rb>1e-6)b.push(mkf(pb));if(caps>1)b.push(mkf(pa.slice().reverse()));
 trk(b,'pr',Math.max(r,rb));seg(b,A,B,Math.max(r,rb))};
// oriented box from A to B: width w (side), height h along the up hint n
const ob=(b,A,B,w,h,n=[0,1,0],caps=1)=>{if(Math.hypot(...S3(B,A))<1e-6)return;const ax=U3(S3(B,A));let up=S3(n,M3(ax,D3(n,ax)));if(Math.hypot(...up)<1e-5)up=S3([1,0,0],M3(ax,ax[0]));up=U3(up);const sd=X3(up,ax),ra=[],rb=[];
 for(const [i,j] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const o=A3(M3(sd,i*w/2),M3(up,j*h/2));ra.push(A3(A,o));rb.push(A3(B,o))}
 for(let i=0;i<4;i++){const j=(i+1)%4;qd(b,ra[i],ra[j],rb[j],rb[i])}
 if(caps>0)b.push(mkf(rb,1));if(caps>1)b.push(mkf(ra.slice().reverse(),1));
 trk(b,'bar',Math.max(w,h));seg(b,A,B,Math.max(w,h)/2)};
// thin square bar (lattice member, rail, conduit): four sides, no caps
const br=(b,A,B,t=.2)=>ob(b,A,B,t,t,[0,1,0],0);
// chain of prisms through points
const rt=(b,pts,r,n=4,caps=0)=>{for(let i=0;i<pts.length-1;i++)pr(b,pts[i],pts[i+1],r,n,caps)};
// parabolic sag between two points
const sagPts=(A,B,sag,n=8)=>{const p=[];for(let i=0;i<=n;i++){const t=i/n;p.push([A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t-4*sag*t*(1-t),A[2]+(B[2]-A[2])*t])}return p};
// rectangular frustum: base w x d at y, top tw x td at y+h, centre (cx,cz), top offset (ox,oz)
const hill=(b,cx,y,cz,w,d,h,tw,td,ox=0,oz=0)=>{const B=[[cx-w/2,y,cz-d/2],[cx+w/2,y,cz-d/2],[cx+w/2,y,cz+d/2],[cx-w/2,y,cz+d/2]],T=[[cx+ox-tw/2,y+h,cz+oz-td/2],[cx+ox+tw/2,y+h,cz+oz-td/2],[cx+ox+tw/2,y+h,cz+oz+td/2],[cx+ox-tw/2,y+h,cz+oz+td/2]],ctr=[cx,y+h/2,cz];
 for(let i=0;i<4;i++){const j=(i+1)%4,pts=[B[i],B[j],T[j],T[i]],m=M3(A3(A3(pts[0],pts[1]),A3(pts[2],pts[3])),.25),out=S3(m,ctr);qn(b,pts,[out[0],0,out[2]],1)}
 qn(b,T,[0,1,0],1);b.big=1};
// ring-stacked body of revolution about a vertical axis: rings = [[y,r],...] (dome, cooling tower, tank). capTop false leaves the top open.
const rev=(b,cx,cz,rings,n=14,y0=0,capTop=true)=>{const last=rings.length-2;for(let i=0;i<=last;i++)pr(b,[cx,y0+rings[i][0],cz],[cx,y0+rings[i+1][0],cz],rings[i][1],n,capTop&&i===last?1:0,rings[i+1][1])};
// a closed polygon prism (profile pts [[u,v],...] in a plane) extruded between two points along a direction; used for the dam. frame: origin O, axes eu, ev, extrusion vector E
const extrude=(b,O,eu,ev,prof,E)=>{const P=prof.map(q=>A3(O,A3(M3(eu,q[0]),M3(ev,q[1])))),Q=P.map(q=>A3(q,E)),n=P.length;
 for(let i=0;i<n;i++){const j=(i+1)%n;b.push(mkf([P[i],P[j],Q[j],Q[i]]))}b.push(mkf(Q));b.push(mkf(P.slice().reverse()));b.big=1};
// rectangles minus holes: returns the cell grid used for the trenched ground
function carve(R,rects){const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v)),xs=[...new Set([R[0],R[1],...rects.flatMap(r=>[cl(r[0],R[0],R[1]),cl(r[1],R[0],R[1])])])].sort((a,b)=>a-b),zs=[...new Set([R[2],R[3],...rects.flatMap(r=>[cl(r[2],R[2],R[3]),cl(r[3],R[2],R[3])])])].sort((a,b)=>a-b),nx=xs.length-1,nz=zs.length-1,own=Array.from({length:nx},()=>Array(nz).fill(-1)),e=1e-9;
 rects.forEach((r,k)=>{for(let i=0;i<nx;i++){if(xs[i]<r[0]-e||xs[i+1]>r[1]+e)continue;for(let j=0;j<nz;j++)if(zs[j]>=r[2]-e&&zs[j+1]<=r[3]+e&&own[i][j]<0)own[i][j]=k}});return {xs,zs,nx,nz,own}}
const bboxOfBag=b=>{const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(const f of b)for(const p of f.pts)for(let i=0;i<3;i++){if(p[i]<mn[i])mn[i]=p[i];if(p[i]>mx[i])mx[i]=p[i]}return [mn,mx]};
const rotY=(p,c,a)=>{const x=p[0]-c[0],z=p[2]-c[1],co=Math.cos(a),si=Math.sin(a);return [c[0]+x*co-z*si,p[1],c[1]+x*si+z*co]};   // rotate a point about the vertical axis through plan point c (same convention as bx)
/* rounded polyline helper: a closed stadium or rounded rectangle through the centre line, arcs of at most 10 degrees per vertex.
   Returns [[x,0,z],...] in travel order starting at the middle of the leg that starts at (x0 + r, z0) going +x (clockwise seen from above when +z is down is not assumed). */
function roundedLoop(x0,x1,z0,z1,r,dir=1,startFrac=.5){const w=x1-x0,d=z1-z0,pts=[],arc=(cx,cz,a0)=>{const n=Math.max(4,Math.ceil(90/10));for(let i=0;i<=n;i++){const a=a0+dir*(Math.PI/2)*i/n;pts.push([cx+r*Math.cos(a),0,cz+r*Math.sin(a)])}};
 // travel: along the north leg (z0) to +x, around the east side, back along the south leg, up the west side (dir=1: +x on the north leg)
 if(dir>0){pts.push([x0+r+(w-2*r)*startFrac,0,z0]);arc(x1-r,z0+r,-Math.PI/2);arc(x1-r,z1-r,0);arc(x0+r,z1-r,Math.PI/2);arc(x0+r,z0+r,Math.PI)}
 else{pts.push([x0+r+(w-2*r)*startFrac,0,z0]);arc(x0+r,z0+r,-Math.PI/2);arc(x0+r,z1-r,Math.PI);arc(x1-r,z1-r,Math.PI/2);arc(x1-r,z0+r,0)}
 // drop consecutive duplicates (arc ends coincide with the next arc start)
 const out=[];for(const q of pts){const l=out[out.length-1];if(!l||Math.hypot(q[0]-l[0],q[2]-l[2])>1e-6)out.push(q)}
 const f=out[0],l=out[out.length-1];if(Math.hypot(f[0]-l[0],f[2]-l[2])<1e-6)out.pop();return out}
const pathLen=(pts,closed)=>{let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1],pts[i][2]-pts[i-1][2]);if(closed)L+=Math.hypot(pts[0][0]-pts[pts.length-1][0],pts[0][1]-pts[pts.length-1][1],pts[0][2]-pts[pts.length-1][2]);return L};

// pole line along ground points [[x,z],...]: poles, crossarms and sagging conductors. Returns {att, cond}: the attachment points of every pole (three per arm)
// and, per attachment index, the polyline of the conductor through all spans (the flows follow it).
const poleLine=(b,pts,o={})=>{const {h=11,arms=[{y:10.2,half:1.7,n:3}],r=.07,sag=.4,pw=.2}=o,P=pts.map(p=>[p[0],0,p[1]]),att=[];
 const dirAt=i=>{const a=P[Math.max(0,i-1)],c=P[Math.min(P.length-1,i+1)];return U3([c[0]-a[0],0,c[2]-a[2]])};
 P.forEach((p,i)=>{pr(b,p,[p[0],h,p[2]],pw,6,1,pw*.7);const d=dirAt(i),lat=[-d[2],0,d[0]],a2=[];
  for(const a of arms){br(b,A3([p[0],a.y,p[2]],M3(lat,-a.half)),A3([p[0],a.y,p[2]],M3(lat,a.half)),.2);for(let k=0;k<a.n;k++){const t=a.n===1?0:(k/(a.n-1)*2-1);a2.push(A3([p[0],a.y+.15,p[2]],M3(lat,t*a.half)))}}att.push(a2)});
 const cond=att[0].map(()=>[]);
 for(let i=0;i<P.length-1;i++)for(let k=0;k<att[i].length;k++){const sp=sagPts(att[i][k],att[i+1][k],sag,4);rt(b,sp,r,4,0);if(i===0)cond[k].push(...sp);else cond[k].push(...sp.slice(1))}
 return{att,cond}};
// insert intermediate points so that no leg is longer than maxSpan
const subdiv=(pts,maxSpan)=>{const o=[pts[0]];for(let i=1;i<pts.length;i++){const a=pts[i-1],c=pts[i],n=Math.max(1,Math.ceil(Math.hypot(c[0]-a[0],c[1]-a[1])/maxSpan));for(let j=1;j<=n;j++)o.push([a[0]+(c[0]-a[0])*j/n,a[1]+(c[1]-a[1])*j/n])}return o};
// apply a point function to every point of a bag (new faces, same tracking fields); used to turn and move a part built in its own frame
const xfBag=(b,fn)=>{const o=b.map(f=>mkf(f.pts.map(fn),f.uv?1:0));for(const k of ['pr','bar','big'])if(b[k])o[k]=b[k];if(b.segs)o.segs=b.segs.map(s=>[fn(s[0]),fn(s[1]),s[2]]);return o};

/* ---------- cameras and layout ----------
   Perspective cameras, fov is the VERTICAL field of view in degrees, up is +y. view [cx, cy] is where the camera target lands in a 16:9 window whose
   text column takes 30 percent (fractions of the window). The campus camera never changes from step 3 on. */
export const STORY_CAMERAS={
 energy:{eye:[-88.8,233.9,-1.2],target:[-26.5,0,-294.1],fov:32,view:[.35,.46]},
 transmission:{eye:[-150.8,179.3,54.2],target:[-20,0,-155],fov:36,view:[.35,.5]},
 campus:{eye:[12,46.8,107.9],target:[12,0,-8],fov:44,view:[.37,.53]}
};
export const STORY_LAYOUT={};
export const storyDebug=()=>({segs:_SEGS,modules:_MODS});
let _SEGS=[],_MODS={};
/* campus service lanes, trench depth, white space footprint, generator and chiller yard grids */
const ZE=[-15,-9.2,-3.7,1.8];            // service lanes: HV skid, MV skid, feeder trench centres (west side of the hall)
const DEEP=2.2;                           // trench depth
const CORE={x0:.8,x1:29.8,z0:-14.2,z1:2.2};     // white space footprint: the boundary that electrical, mechanical and telecom stop at
const YARDG={gx:[-21.5,-16.5,-11.5,-6.5,-1.5,3.5],gz:[21.95,34.85],cx:[14.2,17.9,21.6,25.3,29,32.7,36.4,40.1],cz:[17.55,29.45]}; // generator and chiller yard grids
const HALLD={x0:-7,x1:37,z0:-22,z1:10,top:9.7,bx:Array.from({length:9},(_,i)=>-7+5.5*i),bz:Array.from({length:9},(_,j)=>-22+4*j)};
/* the two substations of substation.js (wiring option A): the full 500 kV yard north of the sources' centre, and the 230 kV module north of the hall */
const YARD_C=[-40,-256],YARD_ROT=-Math.PI/2,CAMPS_C=[-12,-52.5],CAMPS_ROT=Math.PI/2;
/* the module's build-up order per component (conductors last) and the line look per component */
const MORDER={'gravel-yard':0,'access-road':0,'cable-trench':.03,'fence':.06,'gate':.06,'steel-structure':.12,'lightning-mast':.16,'foundation':.22,'post-insulator':.30,'circuit-breaker':.34,'disconnect-switch':.38,'current-transformer':.42,'voltage-transformer':.42,'surge-arrester':.46,'bushing':.50,'power-transformer':.56,'transformer-radiator':.57,'transformer-conservator':.58,'fire-wall':.60,'control-building':.70,'switchgear-building':.72,'building-roof':.72,'building-opening':.72,'relay-kiosk':.74,'hvac-unit':.74,'bus-tube':.80,'conductor':.88,'insulator-string':.90,'shield-wire':.96,'duct-bank':.3};
const MSOLID=new Set(['power-transformer','transformer-radiator','transformer-conservator','circuit-breaker','current-transformer','voltage-transformer','control-building','switchgear-building','relay-kiosk','fire-wall','foundation','building-roof','building-opening','hvac-unit','duct-bank','gravel-yard','access-road','cable-trench']);
const mlook=c=>MSOLID.has(c)?'solid':'wire';

/* ---------- build state and registries ---------- */
let ST=null;
const T=(region,appear,disc,x={})=>({region,appear,disc,...x});
/* Emit one object from a bag of faces. look is 'wire' when nothing in the bag is thicker than 0.8 m across (pipe radius under 0.4 m, bar thickness under 0.4 m), else 'solid'. */
function out(b,story,opt={}){if(!b.length)return null;const {hex:hx,...rest}=opt,hex=hx||DISC_HEX[story.disc]||'#ffffff';let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
 for(const f of b)for(const p of f.pts)for(let i=0;i<3;i++){if(p[i]<mn[i])mn[i]=p[i];if(p[i]>mx[i])mx[i]=p[i]}
 const look=story.look||(story.disc==='context'||b.big||(b.pr||0)>=.4||(b.bar||0)>=.4?'solid':'wire');
 const o={id:ST.objects.length,scope:'story',faces:b,center:M3(A3(mn,mx),.5),color:rgb(hex),hex,storyOnly:true,story:{...story,look},bbox:[mn,mx],...rest};
 if(look==='wire'&&o.noEdge===undefined)o.noEdge=true;
 if(b.segs)for(const s of b.segs)_SEGS.push({a:s[0],b:s[1],r:s[2],id:o.id,appear:story.appear,disc:story.disc,name:rest.name||''});
 ST.objects.push(o);return o}
const rig=(id,period,delay=0,events={})=>{ANIM.rigs[id]={period,delay,events}};
const part=(id,parent,kind,pivot,axis,motion,extra={})=>{ANIM.parts[id]={id,parent,kind,pivot,axis,motion,...extra}};
const reveal=(id,def)=>{ANIM.reveals[id]={id,...def}};
const mark=(id,partId,p)=>{ANIM.marks[id]={part:partId,p}};
const winOf=(i,n,a,b,w)=>[a+(b-a-w)*(n>1?i/(n-1):0),a+(b-a-w)*(n>1?i/(n-1):0)+w];   // window i of n inside [a, b], each w wide, the last ends at b
/* Wrap api.pipe and api.route for the substation module so that every conductor, tube and bar segment is recorded (the flows follow them). */
function wrapApi(api0){const rec=[],wp=(scope,a,b,r,col,opt)=>{api0.pipe(scope,a,b,r,col,opt);const o=ST.objects[ST.objects.length-1];rec.push({a:a.slice(),b:b.slice(),r,id:o.id,comp:o.subComp,unit:o.subUnit});
  _SEGS.push({a:a.slice(),b:b.slice(),r,id:o.id,appear:o.story?o.story.appear:'',disc:o.story?o.story.disc:'',name:o.name||'',comp:o.subComp,unit:o.subUnit})};
 const wb=(scope,x,y,z,w,h,d,col,opt)=>{api0.box(scope,x,y,z,w,h,d,col,opt);const o=ST.objects[ST.objects.length-1];
  if(o&&(o.subComp==='conductor'||o.subComp==='bus-tube')&&Math.max(w,d)>=2.5){const ang=(opt&&opt.angle)||0,c=Math.cos(ang),s=Math.sin(ang),alongX=w>=d,ax=alongX?[c,0,s]:[-s,0,c],L=alongX?w:d,r=Math.max(h,alongX?d:w)/2,mid=[x,y+h/2,z],a=[mid[0]-ax[0]*L/2,mid[1],mid[2]-ax[2]*L/2],b=[mid[0]+ax[0]*L/2,mid[1],mid[2]+ax[2]*L/2];
   rec.push({a,b,r,id:o.id,comp:o.subComp,unit:o.subUnit});_SEGS.push({a,b,r,id:o.id,appear:o.story?o.story.appear:'',disc:o.story?o.story.disc:'',name:o.name||'',comp:o.subComp,unit:o.subUnit})}};
 return{api:{box:wb,pipe:wp,route:(scope,pts,r,col,opt)=>{for(let i=0;i<pts.length-1;i++)wp(scope,pts[i],pts[i+1],r,col,opt)},frame:api0.frame,C:api0.C},rec}}

/* ---------- entry point ---------- */
function buildStory(objects,api0){
 animReset();for(const k of Object.keys(ANIM.rigs))delete ANIM.rigs[k];for(const k of Object.keys(ANIM.parts))delete ANIM.parts[k];for(const k of Object.keys(ANIM.reveals))delete ANIM.reveals[k];for(const k of Object.keys(ANIM.marks))delete ANIM.marks[k];ANIM.flows.length=0;
 for(const k of Object.keys(STORY_LAYOUT))delete STORY_LAYOUT[k];_SEGS=[];_MODS={};
 ST={objects,api0,G:{}};
 Object.assign(STORY_LAYOUT,{zE:ZE,DEEP,YARD_C,CAMPS_C});
 buildModules();
 buildGround();
 buildEnergy();
 buildGrid();
 buildTransmission();
 buildCampusSubstation();
 buildCivil();
 buildUnderground();
 buildConcrete();
 buildStructure();
 buildElectrical();
 buildMechanical();
 buildModular();
 buildTelecom();
 buildWhitespace();
 buildFlows();
 LAST=objects;ST=null;
}
let LAST=null;

/* ---------- the two substations ---------- */
function buildModules(){
 const {api,rec}=wrapApi(ST.api0);
 const yard=buildSubstation(api,{kv:500,x:YARD_C[0],z:YARD_C[1],rot:YARD_ROT,scope:'story-hv-substation',lineKv:500,lines:2,feeders:5,
  extra:(comp)=>({build:3,storyOnly:true,name:'500 kV yard '+comp,story:{region:'energy',appear:'grid',disc:'power',order:MORDER[comp]??.5,look:mlook(comp)}})});
 const yardRec=rec.splice(0);
 const camp=buildSubstation(api,{kv:230,x:CAMPS_C[0],z:CAMPS_C[1],rot:CAMPS_ROT,scope:'story-campus-substation',lineKv:500,lines:2,transformers:3,
  extra:(comp,unit)=>comp==='duct-bank'
   ?{build:3,storyOnly:true,name:'230 kV substation duct bank',story:{region:'campus',appear:'underground',hideFrom:'structure',underground:true,disc:'electrical',reprise:['electrical'],order:.3,look:'solid'}}
   :{build:3,storyOnly:true,name:'230 kV substation '+comp,story:{region:'campus',appear:'substation',disc:'power',order:MORDER[comp]??.5,look:/-LV$/.test(unit)?'solid':mlook(comp)}}});   // the low-voltage bus ducts are thick boxes, drawn as solids
 const campRec=rec.splice(0);
 ST.G.yard=yard;ST.G.camp=camp;ST.G.yardRec=yardRec;ST.G.campRec=campRec;
 _MODS={yard:yardRec,camp:campRec};
 STORY_LAYOUT.yard={bounds:yard.bounds,lineEntries:yard.lineEntries,feederPoints:yard.feederPoints,lineBays:yard.lineBays,center:yard.center,lineDir:yard.lineDir,feederDir:yard.feederDir,footprint:yard.footprint,count:yard.count};
 STORY_LAYOUT.campusModule={bounds:camp.bounds,lineEntries:camp.lineEntries,feederPoints:camp.feederPoints,feederExit:camp.feederExit,feederExitSurface:camp.feederExitSurface,center:camp.center,lineDir:camp.lineDir,feederDir:camp.feederDir,footprint:camp.footprint,count:camp.count};
}

/* ================= ENERGY SOURCES (appear: energy, staggered by order: solar, wind, nuclear, hydro, gas) =================
   Crisp, generic silhouettes of the real equipment types (brief D). Five disjoint slots around the 500 kV yard (ANIMATION-CONTRACT 7.3).
   Slot rectangles x0, x1, z0, z1 and the height cap in metres; every object of a source lies inside its slot and under its cap. */
const SLOTS={
 solar:{x0:-142,x1:-92,z0:-252,z1:-196,cap:6,order:0},
 wind:{x0:-142,x1:-4,z0:-362,z1:-338,cap:43,order:.2},
 nuclear:{x0:8,x1:68,z0:-322,z1:-262,cap:40,order:.4},
 hydro:{x0:-142,x1:-92,z0:-318,z1:-262,cap:36,order:.6},
 gas:{x0:8,x1:68,z0:-250,z1:-196,cap:36,order:.8}
};
const SRC_BAY={solar:0,hydro:1,wind:2,nuclear:3,gas:4};      // bay of the 500 kV yard's collector gantry, west to east (the angular order of the sources)
function buildEnergy(){
 const P=(order,x={})=>T('energy','energy','power',{order,...x});
 STORY_LAYOUT.slots={...SLOTS,yard:{x0:-77.5,x1:-.2,z0:-316,z1:-196,cap:34}};
 const parts=[];
 /* ---- wind: 4 turbines on a row; tapered tubular tower (12 sides), nacelle with a sloped top, spinner, three tapered twisted blades ---- */
 {const S=SLOTS.wind,xs=[-116,-84,-52,-20],cz=-350,yaw=-.35,rates=[22,18,26,20],ph=[0,.7,1.5,.3];
  const cs=Math.cos(yaw),sn=Math.sin(yaw);STORY_LAYOUT.windTurbines=[];
  xs.forEach((cx,n)=>{
   const W=p=>[cx+p[0]*cs+p[2]*sn,p[1],cz-p[0]*sn+p[2]*cs],rT=y=>1.3+(.85-1.3)*y/26.9,HUB=[0,28,4.0];
   // tower and flange bands
   {const b=[];pr(b,[0,0,0],[0,26.9,0],1.3,12,1,.85);for(const y of [9.2,18.2])pr(b,[0,y-.13,0],[0,y+.13,0],rT(y)+.09,12,2);out(xfBag(b,W),P(S.order,{}),{name:'wind turbine '+(n+1)+' tower'})}
   // nacelle: 6.5 x 2.4 x 2.4 with a sloped top
   {const b=[];bx(b,0,26.9,.25,2.4,2,6.5);hill(b,0,28.9,.25,2.4,6.5,.4,1.6,4.8,0,-.15);out(xfBag(b,W),P(S.order+.03),{name:'wind turbine '+(n+1)+' nacelle'})}
   // rotor: hub, closed 8 sided spinner 2.2 m long, three tapered blades 13.5 m (root chord 1.5 to tip 0.25, 12 degrees of twist)
   {const b=[];pr(b,[0,28,3.3],[0,28,4.5],1.0,8,2);pr(b,[0,28,4.5],[0,28,6.7],1.0,8,1,.05);
    for(let k=0;k<3;k++){const phi=ph[n]+k*2*Math.PI/3,d=[Math.cos(phi),Math.sin(phi),0],t=[-Math.sin(phi),Math.cos(phi),0],st=[];
     for(let i=0;i<=4;i++){const s=i/4,rho=.9+13.5*s,c=1.5-1.25*s,th=.2*c,tw=12*(1-s)*Math.PI/180,ch=A3(M3(t,Math.cos(tw)),[0,0,Math.sin(tw)]),nh=A3(M3(t,-Math.sin(tw)),[0,0,Math.cos(tw)]),ctr=[HUB[0]+d[0]*rho,HUB[1]+d[1]*rho,HUB[2]];
      st.push([[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,e])=>A3(ctr,A3(M3(ch,a*c/2),M3(nh,e*th/2)))))}
     for(let i=0;i<4;i++)for(let a=0;a<4;a++){const a2=(a+1)%4;b.push(mkf([st[i][a],st[i][a2],st[i+1][a2],st[i+1][a]]))}
     b.push(mkf(st[4].slice()));b.push(mkf(st[0].slice().reverse()))}
    b.big=1;const id='wt.'+(n+1)+'.rotor',hub=W(HUB),ax=[-sn,0,-cs];
    out(xfBag(b,W),P(S.order+.06,{part:id}),{name:'wind turbine '+(n+1)+' rotor'});
    part(id,null,'rev',hub,ax,{type:'spin',rate:rates[n]});mark('wt.'+(n+1)+'.hub',id,hub);STORY_LAYOUT.windTurbines.push({x:cx,z:cz,hub,axis:ax,tip:42.4})}
  })}
 /* ---- solar: single-axis tracker rows (N-S torque tubes, posts), panels tilt plus and minus 30 degrees, inverter skids at the east edge ---- */
 {const S=SLOTS.solar,rowsX=Array.from({length:7},(_,i)=>-140.4+7*i),zc=-224,TL=24,GAP=1.5,YT=1.55,posts=[];rig('solar',48,0,{});let nn=0;
  const tilt=30*DEG;
  for(const x of rowsX)for(const t of [0,1]){const z=zc+(t?1:-1)*(TL/2+GAP/2),id='solar.'+String(++nn).padStart(2,'0')+'.panel';
   {const b=[];bx(b,x,YT-.04,z,2.2,.08,TL);for(const dz of [-7,7])bx(b,x,YT-.16,z+dz,2.0,.1,.14);b.big=1;
    out(b,P(S.order+nn*.004,{part:id}),{name:'solar table '+nn});part(id,null,'rev',[x,YT,z],[0,0,1],{type:'fn',f:(p,tt)=>tilt*Math.sin(TAU*tt/48)})}
   pr(posts,[x,YT,z-TL/2-.2],[x,YT,z+TL/2+.2],.09,6,2);for(const dz of [-10.5,-3.5,3.5,10.5])bx(posts,x,0,z+dz,.16,YT-.09,.16)}
  out(posts,P(S.order),{name:'solar posts and torque tubes'});
  const sk=[];for(const z of [-238,-224,-210]){bx(sk,-94,0,z,2.4,2.8,2.4);for(let k=0;k<3;k++)bx(sk,-95.23,.9+k*.55,z,.05,.14,1.7)}sk.big=1;out(sk,P(S.order+.1),{name:'solar inverter skids'})}
 /* ---- nuclear SMR: reactor building with containment and a five ring dome, turbine hall, auxiliary and control buildings, two generator transformers, smooth hyperbolic cooling tower ---- */
 {const S=SLOTS.nuclear;
  {const b=[];bx(b,45,0,-281,26,12,22);pr(b,[45,12,-281],[45,24,-281],8.5,20,0);rev(b,45,-281,[[0,8.5],[2.63,8.08],[5,6.88],[6.88,5],[8.08,2.63],[8.5,.06]],20,24,true);out(b,P(S.order),{name:'nuclear reactor building and containment'})}
  {const b=[];bx(b,17,0,-289,14,16,38);extrude(b,[10,16,-308],[1,0,0],[0,1,0],[[0,0],[14,0],[7,1.8]],[0,0,38]);for(const z of [-298,-280])bx(b,17,17.4,z,3,1.4,4);out(b,P(S.order+.04),{name:'nuclear turbine hall'})}
  {const b=[];bx(b,39,0,-265.5,14,8,5);bx(b,52,0,-265.5,8,6,5);out(b,P(S.order+.08),{name:'nuclear auxiliary and control buildings'})}
  {const b=[];for(const x of [12.5,19.5]){bx(b,x,0,-313,5,4.5,3.5);for(let k=-1;k<=1;k++){bx(b,x+k*1.4,.6,-315.1,.5,3,.14);pr(b,[x+k*1.4,4.5,-313],[x+k*1.4,6.9,-313],.24,8,1)}}out(b,P(S.order+.12),{name:'nuclear generator transformers'})}
  {const b=[],R=[[0,14],[3.8,12.6],[7.6,11.4],[11.4,10.4],[15.2,9.8],[19,9.4],[22.8,9.25],[26.6,9.2],[30.4,9.3],[34.2,9.55],[38,9.8]];rev(b,54,-308,R,24,0,false);
   /* the renderer culls back faces, so an open top shows no far wall: a flat rim and a short inner lip make both sides of the top ellipse read from above */
   {const cx=54,cz=-308,N=24,yt=38,yl=34.2,ro=9.8,ri=9.0,rl=8.75;
    for(let i=0;i<N;i++){const a0=i/N*2*Math.PI,a1=(i+1)/N*2*Math.PI,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1),am=(a0+a1)/2;
     qn(b,[[cx+ro*c0,yt,cz+ro*s0],[cx+ro*c1,yt,cz+ro*s1],[cx+ri*c1,yt,cz+ri*s1],[cx+ri*c0,yt,cz+ri*s0]],[0,1,0]);
     qn(b,[[cx+ri*c0,yt,cz+ri*s0],[cx+ri*c1,yt,cz+ri*s1],[cx+rl*c1,yl,cz+rl*s1],[cx+rl*c0,yl,cz+rl*s0]],[-Math.cos(am),0,-Math.sin(am)])}}
   out(b,P(S.order+.16),{name:'nuclear cooling tower'})}}
 /* ---- gas: combined cycle, two blocks (filter house, turbine enclosure, exhaust duct, HRSG with drum, stack with rings, step-up transformer) and a shared steam turbine hall ---- */
 {const S=SLOTS.gas;
  [-240,-224].forEach((z,k)=>{
   {const b=[];bx(b,25,0,z,6,10,6);for(let q=0;q<4;q++)bx(b,25,1.6+q*2,z+3.04,5,.3,.1);bx(b,36,0,z,16,7,7);extrude(b,[28,7,z-3.5],[0,0,1],[0,1,0],[[0,0],[7,0],[3.5,.9]],[16,0,0]);bx(b,46,2,z,4,3.4,3.2);out(b,P(S.order+k*.05),{name:'gas block '+(k+1)+' turbine enclosure and filter house'})}
   {const b=[];bx(b,54,0,z,12,16,7);pr(b,[49,16.9,z],[59,16.9,z],1.2,12,2);pr(b,[57,16,z],[57,34,z],2.2,16,1);for(const y of [22,28])pr(b,[57,y-.15,z],[57,y+.15,z],2.36,16,2);out(b,P(S.order+.02+k*.05),{name:'gas block '+(k+1)+' heat recovery steam generator and stack'})}
   {const b=[];bx(b,13,0,z,5,4.5,3.5);for(let q=-1;q<=1;q++){bx(b,13+q*1.4,.6,z-1.9,.5,3,.14);pr(b,[13+q*1.4,4.5,z],[13+q*1.4,6.9,z],.24,8,1)}out(b,P(S.order+.04+k*.05),{name:'gas block '+(k+1)+' step-up transformer'})}
  });
  {const b=[];bx(b,46,0,-203,24,12,12);extrude(b,[34,12,-209],[1,0,0],[0,1,0],[[0,0],[24,0],[12,1.6]],[0,0,12]);pr(b,[54,12,-220.5],[54,12,-209],.6,10,2);out(b,P(S.order+.1),{name:'gas steam turbine hall'})}}
 /* ---- hydro: dam across a valley between mountain flanks, crest with parapet, five spillway bays, penstocks to a powerhouse, reservoir plate, tailrace.
    The valley runs north to south (upstream is north) so that the long face of the dam and its penstocks face the camera. ---- */
 {const S=SLOTS.hydro;
  {const b=[];hill(b,-101,0,-302,18,32,22,9,18);hill(b,-99.5,0,-307,11,18,36,3,5,.5,-1);hill(b,-135,0,-302,14,32,20,7,18);hill(b,-137,0,-308,10,16,34,3,4);hill(b,-118,0,-313,16,10,28,10,4,0,-1);out(b,P(S.order),{name:'hydro mountains'})}
  {const b=[];extrude(b,[-138,0,0],[0,0,1],[0,1,0],[[-290,0],[-290,24],[-286.5,24],[-280,0]],[40,0,0]);bx(b,-118,24,-289.8,40,1,.4);
   for(let k=0;k<6;k++)bx(b,-136+k*7.2,24,-288.2,.8,3.2,2.4);for(let k=0;k<5;k++){const x=-136+3.6+k*7.2;bx(b,x,24,-288.9,6,2.4,.5);bx(b,x,27.4,-288.2,6.4,.3,.3)}out(b,P(S.order+.05),{name:'hydro dam and spillway gates'})}
  {const b=[];for(const x of [-124,-114,-104]){pr(b,[x,21,-284.3],[x,9,-280.8],1.5,12,1);pr(b,[x,9,-280.8],[x,6.5,-279],1.5,12,2)}out(b,P(S.order+.1),{name:'hydro penstocks'})}
  {const b=[];bx(b,-114,0,-274,22,12,10);bx(b,-114,12,-274,23,.5,11);bx(b,-114,0,-265,5,4,3.5);for(let q=-1;q<=1;q++)pr(b,[-114+q*1.4,4,-265],[-114+q*1.4,6.4,-265],.24,8,1);out(b,P(S.order+.15),{name:'hydro powerhouse and transformer'})}
  {const b=[];flat(b,-128,-308,-110,-290,22);out(b,P(S.order+.2),{name:'hydro reservoir'})}
  {const b=[];bx(b,-101.5,0,-271.5,1,.8,15);bx(b,-96.5,0,-271.5,1,.8,15);bx(b,-99,0,-264.2,6,.8,.8);out(b,P(S.order+.25),{name:'hydro tailrace channel'})}}
}

/* ================= 500 kV COLLECTOR SUBSTATION (appear: grid): the module of substation.js plus the feeder pole lines of the five sources ================= */
const FEED_ROUTES={     // plan routes [x, z], first pole at the source's own equipment, last pole 7.4 m north of the yard's collector gantry; no two routes cross
 solar:[[-90.5,-224],[-84,-224],[-84,-324],[-66,-324],[-66,-318]],
 hydro:[[-109,-265],[-91,-265],[-91,-330],[-53,-330],[-53,-318]],
 wind:[[-128,-337],[-96,-337],[-64,-337],[-40,-337],[-40,-318]],
 nuclear:[[6,-313],[6,-330],[-27,-330],[-27,-318]],
 gas:[[7,-224],[1,-224],[1,-318],[-14,-318]]};
function buildGrid(){
 STORY_LAYOUT.feederRoutes=FEED_ROUTES;
 const G=(order,x={})=>T('energy','grid','power',{order,...x});
 const rec=ST.G.yardRec,feeders=ST.G.feeders={},tipOf=(bay,ph)=>{const r=rec.find(q=>q.unit==='STR-F'+(bay+1)+'-'+ph);return r.b.slice()};
 const mid=(a,c)=>[(a[0]+c[0])/2,(a[1]+c[1])/2,(a[2]+c[2])/2];
 for(const src of ['solar','wind','nuclear','hydro','gas']){
  const bay=SRC_BAY[src],tips=['A','B','C'].map(ph=>tipOf(bay,ph)),b=[],pts=subdiv(FEED_ROUTES[src],30);
  const {att,cond}=poleLine(b,pts,{h:11,arms:[{y:10.2,half:1.8,n:3}],sag:.5});
  // last span: the three conductors of the last pole to the three string tips, paired west to east
  const last=att[att.length-1].slice().sort((p,q)=>p[0]-q[0]),order=att[att.length-1].map(p=>last.indexOf(p));
  const ends=[];
  att[att.length-1].forEach((p,k)=>{const tip=tips[order[k]],sp=sagPts(p,tip,.15,4);rt(b,sp,.07,4,0);cond[k].push(...sp.slice(1));ends[k]=order[k]});
  if(src==='wind'){ // the fourth turbine reaches the corner pole through a short spur from its own pole
   const pe=[-32,-337],corner=att[att.length-2],ang=Math.PI/2,lat=[0,0,1],p0=[[pe[0],10.35,pe[1]-1.8],[pe[0],10.35,pe[1]],[pe[0],10.35,pe[1]+1.8]];
   pr(b,[pe[0],0,pe[1]],[pe[0],11,pe[1]],.2,6,1,.14);br(b,[pe[0],10.2,pe[1]-1.8],[pe[0],10.2,pe[1]+1.8],.2);
   const cs=corner.slice().sort((p,q)=>p[2]-q[2]);p0.forEach((p,k)=>rt(b,sagPts(p,cs[k],.25,4),.07,4,0))}
  out(b,G(SLOTS[src].order),{name:'feeder '+src});
  feeders[src]={cond,tips,order:ends,bay,pts}}
}

/* ================= TRANSMISSION: four 500 kV lattice towers (the existing design, the turn is liked), double circuit, six strings of 20 discs on every tower, the line comes down into the site ================= */
const TOWER_PATH=[[-40,-172],[-40,-144],[-36,-120],[-22,-96]],TOWER_H=[34,34,36,30];
function latticeTower(b,x,z,H,f){
 const lat=[-f[2],0,f[0]],P=(a,y,c)=>[x+lat[0]*a+f[0]*c,y,z+lat[2]*a+f[2]*c],wb=H*.12,ww=H*.045,wt=ww*.6,yw=.55*H,yt=.93*H,t=H*.0065+.1;
 const w=y=>y<=yw?wb+(ww-wb)*y/yw:ww+(wt-ww)*(y-yw)/(yt-yw),ys=[0,.14,.28,.42,.55,.66,.76,.86,.93].map(q=>q*H),C4=[[-1,-1],[1,-1],[1,1],[-1,1]],cn=(i,y)=>P(C4[i][0]*w(y),y,C4[i][1]*w(y));
 for(let k=0;k<ys.length-1;k++){const y0=ys[k],y1=ys[k+1];for(let i=0;i<4;i++){const j=(i+1)%4;br(b,cn(i,y0),cn(i,y1),t*1.4);if(k>0)br(b,cn(i,y0),cn(j,y0),t);br(b,cn(i,y0),cn(j,y1),t*.8);if(k<4)br(b,cn(j,y0),cn(i,y1),t*.8)}}
 for(let i=0;i<4;i++)br(b,cn(i,yt),cn((i+1)%4,yt),t);
 const ARMS=[{f:.62,L:7.4},{f:.74,L:6.5},{f:.86,L:5.5}],tops=[[],[]];
 for(const a of ARMS){const y=a.f*H,wy=w(y),up=H*.045+.5;for(const [si,s] of [[0,-1],[1,1]]){const root=P(s*wy,y,0),tip=P(s*a.L,y,0),mid=wy+(a.L-wy)*.5;
  br(b,root,tip,t*1.2);br(b,P(s*wy,y+up,0),P(s*a.L,y+.5,0),t);br(b,tip,P(s*a.L,y+.5,0),t);br(b,root,P(s*mid,y+up*.75,0),t*.8);br(b,P(s*mid,y+up*.75,0),tip,t*.8);
  tops[si].push(tip)}}
 const peaks=[];for(const s of [-1,1]){br(b,cn(s<0?0:1,yt),P(s*3.4,yt+1.4,0),t);br(b,P(0,yt,0),P(s*3.4,yt+1.4,0),t);peaks.push(P(s*3.4,yt+1.5,0))}
 return{tops,peaks}}
function buildTransmission(){
 const NT=TOWER_PATH.length,dirp=(a,c)=>U3([c[0]-a[0],0,c[1]-a[1]]),yard=ST.G.yard,camp=ST.G.camp,towers=[];
 const fwd=TOWER_PATH.map((p,i)=>{const d1=i>0?dirp(TOWER_PATH[i-1],p):dirp(p,TOWER_PATH[i+1]),d2=i<NT-1?dirp(p,TOWER_PATH[i+1]):d1;return U3([d1[0]+d2[0],0,d1[2]+d2[2]])});
 const {api}=wrapApi(ST.api0);
 TOWER_PATH.forEach((p,i)=>{const b=[],r=latticeTower(b,p[0],p[1],TOWER_H[i],fwd[i]),ord=i/(NT-1)*.85;
  out(b,T('campus','transmission','power',{order:ord}),{name:'500 kV tower '+(i+1)});
  // six strings of 20 discs: one at the tip of every arm (V08), the conductors hang from their lower ends
  const att=[[],[]];
  r.tops.forEach((arr,si)=>arr.forEach((top,ai)=>{const to=[top[0],top[1]-5.4,top[2]];
   buildInsulatorString(api,{kv:500,from:top.slice(),to,discRadius:.40,unit:'TWR'+(i+1)+'-'+(si?'W':'E')+(ai+1),scope:'story-line',
    extra:{build:3,storyOnly:true,name:'500 kV tower '+(i+1)+' insulator string',story:{region:'campus',appear:'transmission',disc:'power',order:ord+.02,look:'wire'}}});att[si].push(to)}));
  towers.push({x:p[0],z:p[1],H:TOWER_H[i],att,peaks:r.peaks,tops:r.tops,f:fwd[i]})});
 /* Circuits: side index 1 of every tower is the west arm set at tower 1 and carries the west circuit all the way (the arms keep their side as the line turns).
    Each conductor is identified by its side and arm; its two ends pair with the string tips of the two substations by order of x (no crossing in plan). */
 const idxAsc=pts=>pts.map((_,i)=>i).sort((a,c)=>pts[a][0]-pts[c][0]),meanX=a=>a.reduce((n,p)=>n+p[0],0)/a.length;
 const westFirst=bays=>meanX(bays[0])<meanX(bays[1])?[bays[0],bays[1]]:[bays[1],bays[0]];
 const yBays=westFirst(yard.lineBays),cBays=westFirst(camp.lineBays),cond=[[[],[],[]],[[],[],[]]],span=(a,c)=>Math.hypot(a[0]-c[0],a[2]-c[2]);
 const bYard=[],bLast=[];
 [1,0].forEach((si,c)=>{   // c = 0 west circuit (side 1), c = 1 east circuit (side 0)
  const ia=idxAsc(towers[0].att[si]),it=idxAsc(yBays[c]),ib=idxAsc(towers[NT-1].att[si]),im=idxAsc(cBays[c]);
  const yardTip=[],modTip=[];ia.forEach((arm,j)=>yardTip[arm]=yBays[c][it[j]]);ib.forEach((arm,j)=>modTip[arm]=cBays[c][im[j]]);
  for(let k=0;k<3;k++){
   const s0=sagPts(yardTip[k],towers[0].att[si][k],.028*span(yardTip[k],towers[0].att[si][k])+.3,10);rt(bYard,s0,.17,4,0);cond[c][k].push(...s0);
   const sN=sagPts(towers[NT-1].att[si][k],modTip[k],.028*span(modTip[k],towers[NT-1].att[si][k])+.3,10);rt(bLast,sN,.17,4,0);
   cond[c][k].tail=sN}});
 out(bYard,T('campus','transmission','power',{order:0}),{name:'500 kV yard exit conductors'});
 for(let i=0;i<NT-1;i++){const b=[],A=towers[i],B=towers[i+1],sp=Math.hypot(TOWER_PATH[i+1][0]-TOWER_PATH[i][0],TOWER_PATH[i+1][1]-TOWER_PATH[i][1]);
  [1,0].forEach((si,c)=>{for(let k=0;k<3;k++){const q=sagPts(A.att[si][k],B.att[si][k],.028*sp,10);rt(b,q,.17,4,0);cond[c][k].push(...q.slice(1))}});
  for(let si=0;si<2;si++)rt(b,sagPts(A.peaks[si],B.peaks[si],.014*sp,8),.09,4,0);
  out(b,T('campus','transmission','power',{order:(i+1)/(NT-1)*.85}),{name:'500 kV conductors '+(i+1)})}
 out(bLast,T('campus','transmission','power',{order:.9}),{name:'500 kV last span into the campus substation'});
 for(const c of cond)for(const k of c){k.push(...k.tail.slice(1));delete k.tail}
 STORY_LAYOUT.towers=TOWER_PATH;STORY_LAYOUT.towerHeights=TOWER_H;ST.G.towers=towers;ST.G.lineCond=cond;
}

/* ================= GROUND AND THE TRENCH NETWORK ================= */
/* trench network (x0, x1, z0, z1, name), listed in dig order. The west feeder trenches now start at the HV skids (the old substation is gone), the west corridor runs
   north to the new power feeder trench that leaves the 230 kV substation's duct bank mouth. 21 trenches. */
const TR=[
 [-16,-3.3,-16,-14,'west feeder A'],[-16,-3.3,-10.2,-8.2,'west feeder B'],[-16,-3.3,-4.7,-2.7,'west feeder C'],[-16,-3.3,.8,2.8,'west feeder D'],
 [-10.9,-9.1,-31.4,11,'west corridor'],[-9.1,2.8,-31.4,-29.6,'power feeder'],
 [-24.5,7.4,13.4,15.2,'generator collector north'],[-26.4,-24.6,13.4,43,'generator ring west'],[-24.5,7.4,41.2,43,'generator collector south'],[5.6,7.4,6.5,43,'generator ring east and feeder'],[-4.9,-3.1,6.5,13.4,'generator feeder 2'],[-24,5,27.8,29,'generator aisle collector'],[7.4,43.4,10.9,12.5,'chiller power north'],[7.4,43.4,35.4,37,'chiller power south'],
 [10.2,12,6.5,24.5,'chilled water south'],[42.4,44.2,-16,24.5,'chilled water east'],[38,44.2,-15.4,-13.6,'chilled water east entry'],
 [-12,43,-27.6,-25.8,'storm main'],[32.8,34.2,-41.2,-19,'fibre north'],[32.8,48,-41.2,-39.8,'fibre pole feed'],[37,53,2.6,4.4,'water supply']
];
const NTR=TR.length,kk2=k=>String(k).padStart(2,'0');
const TRWIN=k=>{const w0=3.06+.66*k/(NTR-1);return[w0,w0+.22]},TROUT=k=>{const w0=5.00+.38*k/(NTR-1);return[w0,w0+.22]};
function buildGround(){
 const CAMP=[-72,72,-58,58],BIG=[-1800,1800,-2600,700],ctx=T('campus','always','context');
 STORY_LAYOUT.trenches=TR;
 {const g=[];flat(g,BIG[0],BIG[2],BIG[1],CAMP[2]);flat(g,BIG[0],CAMP[3],BIG[1],BIG[3]);flat(g,BIG[0],CAMP[2],CAMP[0],CAMP[3]);flat(g,CAMP[1],CAMP[2],BIG[1],CAMP[3]);out(g,{...ctx},{flat:true,noEdge:true,hex:'#161918',name:'ground plane'})}
 // faint grid on the big ground outside the campus rectangle (parallax cue while the camera moves; the campus itself stays clean)
 {const gr=[],GX=[-450,450],GZ=[-520,330],w=.18,h=.05,sp=50,inCamp=(fixed,axis)=>axis==='x'?(fixed>CAMP[2]&&fixed<CAMP[3]):(fixed>CAMP[0]&&fixed<CAMP[1]);
  for(let z=Math.ceil(GZ[0]/sp)*sp;z<=GZ[1];z+=sp){const segs=inCamp(z,'x')?[[GX[0],CAMP[0]],[CAMP[1],GX[1]]]:[[GX[0],GX[1]]];for(const [a,c] of segs)bb(gr,a,0,z-w,c,h,z+w,0)}
  for(let x=Math.ceil(GX[0]/sp)*sp;x<=GX[1];x+=sp){const segs=inCamp(x,'z')?[[GZ[0],CAMP[2]],[CAMP[3],GZ[1]]]:[[GZ[0],GZ[1]]];for(const [a,c] of segs)bb(gr,x-w,0,a,x+w,h,c,0)}
  out(gr,{...ctx,grid:true},{noEdge:true,hex:'#1e2220',name:'ground reference lines'})}
 const cg=carve(CAMP,TR),G=[],BED=[],trays=TR.map(()=>[]),lids=TR.map(()=>[]);
 for(let j=0;j<cg.nz;j++){let i=0;while(i<cg.nx){const hole=cg.own[i][j]>=0;let i1=i;if(!hole){while(i1+1<cg.nx&&cg.own[i1+1][j]<0)i1++;flat(G,cg.xs[i],cg.zs[j],cg.xs[i1+1],cg.zs[j+1])}i=i1+1}}
 for(let j=0;j<cg.nz;j++)for(let i=0;i<cg.nx;i++){const k=cg.own[i][j];if(k<0)continue;const x0=cg.xs[i],x1=cg.xs[i+1],z0=cg.zs[j],z1=cg.zs[j+1],tb=trays[k];
  flat(lids[k],x0,z0,x1,z1);flat(BED,x0,z0,x1,z1,-DEEP-.4);flat(tb,x0,z0,x1,z1,-DEEP);
  const open=(a,c)=>a<0||a>=cg.nx||c<0||c>=cg.nz||cg.own[a][c]<0;
  if(open(i-1,j))qn(tb,[[x0,0,z0],[x0,0,z1],[x0,-DEEP,z1],[x0,-DEEP,z0]],[1,0,0]);
  if(open(i+1,j))qn(tb,[[x1,0,z0],[x1,0,z1],[x1,-DEEP,z1],[x1,-DEEP,z0]],[-1,0,0]);
  if(open(i,j-1))qn(tb,[[x0,0,z0],[x1,0,z0],[x1,-DEEP,z0],[x0,-DEEP,z0]],[0,0,1]);
  if(open(i,j+1))qn(tb,[[x0,0,z1],[x1,0,z1],[x1,-DEEP,z1],[x0,-DEEP,z1]],[0,0,-1])}
 out(G,{...ctx},{flat:true,noEdge:true,hex:'#161918',name:'campus ground'});
 out(BED,{...ctx},{flat:true,noEdge:true,hex:'#101312',name:'trench bed'});
 // every trench has a ground lid (removed by an inverted wipe as the trench opens, put back as it is backfilled) and the open trench (walls and floor) that the same wipe reveals
 const trenchInfo=[];
 TR.forEach((r,k)=>{const long=(r[1]-r[0])>=(r[3]-r[2]),ax=long?[1,0,0]:[0,0,1],[mn,mx]=bboxOfBag(trays[k]),c0=long?mn[0]:mn[2],c1=long?mx[0]:mx[2],len=c1-c0;
  const id='rv.trench.'+kk2(k),lid='rv.lid.'+kk2(k);
  reveal(id,{win:TRWIN(k),out:TROUT(k),fx:[{type:'wipe',axis:ax,from:c0-.01,to:c1+.01,edge:.8}],metrics:[{key:'trenchOpenM',value:Math.round(len*100)/100,use:'r'},{key:'backfilledM',value:Math.round(len*100)/100,use:'q'}]});
  reveal(lid,{win:TRWIN(k),out:TROUT(k),fx:[{type:'wipe',axis:ax,from:c0-.01,to:c1+.01,invert:true}]});
  out(lids[k],T('campus','always','context',{reveal:lid}),{flat:true,noEdge:true,hex:'#161918',name:'trench lid '+r[4]});
  out(trays[k],T('campus','civil','civil',{order:.1+.75*k/(NTR-1),hideFrom:'structure',reveal:id,look:'solid'}),{noEdge:true,name:'trench '+r[4]});
  trenchInfo.push({k,id,lid,axis:ax,c0,c1,len,rect:r})});
 ST.G.trenches=trenchInfo;
}

/* ================= CIVIL WORKS (appear: civil): a running simulation. Three excavators (boom, stick, bucket) dig, swing, dump into a waiting truck and cast onto a pile;
   three side-dump trucks haul along a closed road loop to a spoil pile and back; a dozer pushes soil; crews carry pipe along the trenches; spoil piles grow and
   shrink with story progress (reveals); the machine cycles run on the wall clock (rigs). ================= */
/* rotate a closed loop so that it starts at plan point q (q must lie on a straight leg); the loop keeps its direction of travel */
function loopFrom(pts,q){const n=pts.length;let best=0,bd=1e9;for(let i=0;i<n;i++){const a=pts[i],c=pts[(i+1)%n],dx=c[0]-a[0],dz=c[2]-a[2],L2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((q[0]-a[0])*dx+(q[1]-a[2])*dz)/L2)),d=Math.hypot(a[0]+dx*t-q[0],a[2]+dz*t-q[1]);if(d<bd){bd=d;best=i}}
 const o=[[q[0],0,q[1]]];for(let i=0;i<n;i++)o.push(pts[(best+1+i)%n]);if(Math.hypot(o[1][0]-o[0][0],o[1][2]-o[0][2])<1e-6)o.splice(1,1);
 const l=o[o.length-1];if(Math.hypot(l[0]-o[0][0],l[2]-o[0][2])<1e-6)o.pop();return o}
/* arc length from the start of a closed loop to the point of the loop nearest to plan point q */
function arcTo(P,q){const n=P.length;let s=0,best=1e9,bs=0;for(let i=0;i<n;i++){const a=P[i],c=P[(i+1)%n],dx=c[0]-a[0],dz=c[2]-a[2],L=Math.hypot(dx,dz),L2=L*L||1,t=Math.max(0,Math.min(1,((q[0]-a[0])*dx+(q[1]-a[2])*dz)/L2)),d=Math.hypot(a[0]+dx*t-q[0],a[2]+dz*t-q[1]);if(d<best){best=d;bs=s+t*L}s+=L}return bs}
/* a machine frame at plan point (x, z) turned by ry (same convention as bx: the local +lz axis is the forward axis, +lx the lateral axis) */
const frameFn=(x,z,ry)=>{const c=Math.cos(ry),s=Math.sin(ry);return (lx,y,lz)=>[x+lx*c-lz*s,y,z+lx*s+lz*c]};
const boxIn=(b,X,ry,lx,y,lz,w,h,d)=>{const p=X(lx,y,lz);bx(b,p[0],y,p[2],w,h,d,ry)};
const ryOfHeading=h=>h-Math.PI/2;                         // forward = (cos h, sin h)  <=>  ry = h - pi/2
const R2D=180/Math.PI;
/* two link arm of the generic 20 t excavator in its vertical plane (r forward, y up): boom foot F, elbow K1, bucket pivot K2 at rest (the bucket sits on the ground at the dig point) */
const EXC={F:[1.3,2.0],K1:[3.8,4.6],K2:[6.66,.82]};
EXC.L1=Math.hypot(EXC.K1[0]-EXC.F[0],EXC.K1[1]-EXC.F[1]);EXC.L2=Math.hypot(EXC.K2[0]-EXC.K1[0],EXC.K2[1]-EXC.K1[1]);
EXC.th1=Math.atan2(EXC.K1[1]-EXC.F[1],EXC.K1[0]-EXC.F[0]);EXC.th2=Math.atan2(EXC.K2[1]-EXC.K1[1],EXC.K2[0]-EXC.K1[0]);
/* joint rotations in degrees that put the bucket pivot at (r, y) with the bucket turned bucketAbs degrees in total. A positive angle is the right-hand rotation about the lateral axis,
   which lowers a forward pointing arm. The stick and bucket joints are relative to their parents. */
function excIK(r,y,bucketAbs){const dr=r-EXC.F[0],dy=y-EXC.F[1],d=Math.min(Math.hypot(dr,dy),EXC.L1+EXC.L2-.05),del=Math.atan2(dy,dr),al=Math.acos(Math.max(-1,Math.min(1,(EXC.L1*EXC.L1+d*d-EXC.L2*EXC.L2)/(2*EXC.L1*d)))),
 th1=del+al,K1=[EXC.F[0]+EXC.L1*Math.cos(th1),EXC.F[1]+EXC.L1*Math.sin(th1)],th2=Math.atan2(y-K1[1],r-K1[0]);
 const boom=-(th1-EXC.th1)*R2D,stickAbs=-(th2-EXC.th2)*R2D;return{boom,stick:stickAbs-boom,bucket:bucketAbs-stickAbs}}
/* One excavator. spec: {id, x, z, heading (plan angle of the dig direction), truckAt (bed centre of the waiting truck), pile (cast point), period, delay}. Six bucket cycles per period:
   the first two dump into the truck, the other four cast onto the pile while the truck is away. */
function excavatorRig(spec,order){
 const {id,x,z,heading:hd}=spec,RY=ryOfHeading(hd),XX=frameFn(x,z,RY),lat=[Math.cos(RY),0,Math.sin(RY)];
 const base=[];boxIn(base,XX,RY,-1.15,0,0,.85,1,4.4);boxIn(base,XX,RY,1.15,0,0,.85,1,4.4);boxIn(base,XX,RY,0,.6,0,2.8,.45,3.4);
 const house=[];boxIn(house,XX,RY,0,1.05,-.3,2.6,1,3.2);boxIn(house,XX,RY,.55,2.05,.9,1.4,1.6,1.5);boxIn(house,XX,RY,-.1,2.05,-1.5,2.2,1.1,1.6);boxIn(house,XX,RY,0,1.05,-2.2,2.4,1.1,.7);
 const piv=XX(0,EXC.F[1],EXC.F[0]),k1=XX(0,EXC.K1[1],EXC.K1[0]),k2=XX(0,EXC.K2[1],EXC.K2[0]);
 const boom=[];ob(boom,piv,k1,.6,.7);pr(boom,XX(0,2.1,2.2),XX(0,3.9,3.1),.13,6,1);
 const stick=[];ob(stick,k1,k2,.42,.5);pr(stick,XX(0,4.7,4.2),XX(0,3.2,5.4),.12,6,1);
 const bucket=[];boxIn(bucket,XX,RY,0,.56,7.06,1.0,.9,1.2);for(const s of [-.36,0,.36])boxIn(bucket,XX,RY,s,.5,7.72,.12,.3,.2);
 const tag=(part)=>T('campus','civil','civil',{order,hideFrom:'structure',...(part?{part}:{})});
 const pid=id+'.house',pb=id+'.boom',ps=id+'.stick',pk=id+'.bucket',nm='excavator '+id.slice(-1).toUpperCase();
 out(base,tag(),{name:nm+' tracks'});out(house,tag(pid),{name:nm+' house'});out(boom,tag(pb),{name:nm+' boom'});out(stick,tag(ps),{name:nm+' stick'});out(bucket,tag(pk),{name:nm+' bucket'});
 const N=6,keys={house:[],boom:[],stick:[],bucket:[]},events={dump:[],cast:[]};
 const sigmaTo=(px,pz)=>{const a=Math.atan2(pz-z,px-x);return((hd-a)*R2D+540)%360-180};          // the right-hand rotation about +y by sigma turns a polar angle by -sigma
 const rTo=(px,pz)=>Math.hypot(px-x,pz-z),sTruck=sigmaTo(...spec.truckAt),rTruck=rTo(...spec.truckAt),sPile=sigmaTo(...spec.pile),rPile=rTo(...spec.pile);
 const push=(u,sg,p)=>{keys.house.push([u,sg]);keys.boom.push([u,p.boom]);keys.stick.push([u,p.stick]);keys.bucket.push([u,p.bucket])};
 const rest=excIK(EXC.K2[0],EXC.K2[1],0);
 for(let c=0;c<N;c++){const toTruck=c<2,sg=toTruck?sTruck:sPile,rd=toTruck?rTruck:rPile,u=v=>(c+v)/N;
  const dig=excIK(3.9,.7,-65),carry=excIK(3.8,3.6,-70),dump=excIK(rd,4.4,-70),open=excIK(rd,4.4,35),back=excIK(5.6,3.4,0);
  if(c===0)push(0,0,rest);
  push(u(.24),0,dig);push(u(.38),0,carry);push(u(.62),sg,dump);push(u(.74),sg,open);push(u(.80),sg,open);push(u(.90),0,back);push(c<N-1?u(1):1,0,rest);
  (toTruck?events.dump:events.cast).push(Math.round(u(.72)*1e4)/1e4)}
 rig(id,spec.period,spec.delay,events);
 const cyc=k=>({type:'cycle',rig:id,keys:keys[k]});
 part(pid,null,'rev',[x,1.0,z],[0,1,0],cyc('house'));part(pb,pid,'rev',piv,lat,cyc('boom'));part(ps,pb,'rev',k1,lat,cyc('stick'));part(pk,ps,'rev',k2,lat,cyc('bucket'));
 mark(id+'.bucket',pk,XX(0,1.0,7.06));
 return{RY,X:XX,sTruck,sPile,rTruck,rPile,events,keys}}
/* A generic side-dump truck. The body part follows a closed loop from the parking point (which is the centre of its bed), the bed is a part of its own on a hinge along the pile side. */
function truckRig(id,loop,rigId,tipPt,pilePt,order,sched){
 const P=prepPath({pts:loop,closed:true}),s0=0,p0=pathPoint(P,0),h0=pathHeading(P,0),RY=ryOfHeading(h0),X=frameFn(p0[0],p0[2],RY),fwd=[Math.cos(h0),0,Math.sin(h0)];
 const body=[];boxIn(body,X,RY,0,.5,.9,2.2,.5,6.4);boxIn(body,X,RY,0,1.0,3.8,2.5,2.0,1.9);boxIn(body,X,RY,0,.5,4.65,2.5,.5,.2);
 for(const lz of [3.7,-.1,-1.7])for(const sx of [-1,1])pr(body,X(sx*1.45,.55,lz),X(sx*1.0,.55,lz),.55,10,2);
 const bed=[];boxIn(bed,X,RY,0,1.15,0,2.7,1.5,4.9);boxIn(bed,X,RY,0,2.65,2.0,2.7,.8,.3);
 const tag=part=>T('campus','civil','civil',{order,hideFrom:'structure',part});
 out(body,tag(id+'.body'),{name:'truck '+id.slice(-1)+' body'});out(bed,tag(id+'.bed'),{name:'truck '+id.slice(-1)+' bed'});
 const L=P.L,tipS=arcTo(loop,tipPt),pk=[[0,0],[sched.go0,0],[sched.tip0,tipS],[sched.tip1,tipS],[1,L]];
 part(id+'.body',null,'path',[p0[0],0,p0[2]],[0,1,0],{type:'cycle',rig:rigId,units:'m',keys:pk},{path:{pts:loop,closed:true,s0}});
 // the pile side at the tip point: left of travel (+lateral) or right
 const ht=pathHeading(P,tipS),latT=[Math.sin(ht),0,-Math.cos(ht)],tp=pathPoint(P,tipS),side=((pilePt[0]-tp[0])*latT[0]+(pilePt[1]-tp[2])*latT[2])>=0?1:-1;
 const hinge=X(side*1.35,1.15,0),far=X(-side*1.35,2.4,0);let ax=fwd;
 {const m=mRotAbout(hinge,ax,.3),q=mApply(m,far);if(q[1]<far[1])ax=[-ax[0],0,-ax[2]]}
 part(id+'.bed',id+'.body','rev',hinge,ax,{type:'cycle',rig:rigId,keys:[[0,0],[sched.bed0,0],[sched.bed0+.035,48],[sched.tip1-.035,48],[sched.tip1,0],[1,0]]});
 mark(id+'.bed',id+'.bed',X(0,2.65,0));
 return{P,p0,h0,X,tipS,side,L}}
/* worker figure (two of them carry a pipe): a simple stack of prisms in the frame X */
function worker(b,X,lx,lz,bend=.5){const t0=X(lx,.85,lz),t1=X(lx,1.55,lz+bend*.45);for(const l of [-.13,.13])pr(b,X(lx+l,0,lz),X(lx+l,.85,lz),.1,6,1);pr(b,t0,t1,.24,6,1);
 for(const l of [-.31,.31])pr(b,X(lx+l,1.45,lz+bend*.4),X(lx+l*1.1,.95,lz+.55+bend*.3),.07,5,1);pr(b,t1,A3(t1,[0,.22,0]),.15,8,1);pr(b,A3(t1,[0,.2,0]),A3(t1,[0,.31,0]),.21,8,1)}
function buildCivil(){
 const CIV={a:{x:-17.6,z:-12.2,hd:0,truck:[-22.6,-12.2],pile:[-18.4,-7.2],tip:[-29.6,2],tipPile:[-26.1,1]},
            b:{x:26.7,z:-35.5,hd:Math.PI/2,truck:[20.2,-38],pile:[26.7,-40.8],tip:[12,-50],tipPile:[16.1,-50]},
            c:{x:30,z:40.4,hd:-Math.PI/2,truck:[30,46],pile:[35.6,40.4],tip:[40,52.5],tipPile:[40,49.25]}};
 const LOOPS={a:roundedLoop(-29.6,-22.6,-26,8,3.3,-1,.5),b:roundedLoop(12,20.2,-62,-31.3,4.1,-1,.5),c:roundedLoop(22,49,46,52.5,3.25,1,.5)};
 const RIGP={a:[36,0],b:[40,.8],c:[33,1.6]};
 ST.G.civil={cfg:CIV,loops:{},trucks:{},excs:{}};
 ['a','b','c'].forEach((k,i)=>{const w=CIV[k],id='exc.'+k,[period,delay]=RIGP[k];
  const e=excavatorRig({id,x:w.x,z:w.z,heading:w.hd,truckAt:w.truck,pile:w.pile,period,delay},.02*i);
  const loop=loopFrom(LOOPS[k],w.truck);
  const t=truckRig('trk.'+(i+1),loop,id,w.tip,w.tipPile,.02*i+.03,{go0:.40,tip0:.60,tip1:.72,bed0:.62});
  ST.G.civil.loops[k]=loop;ST.G.civil.trucks[k]=t;ST.G.civil.excs[k]=e;(STORY_LAYOUT.haulLoops||(STORY_LAYOUT.haulLoops={}))['trk.'+(i+1)]=loop});
 /* ---- dozer: pushes soil along the east strip and spreads it ---- */
 {const line=[[50.4,0,29],[50.4,0,13]],s0=2,P=prepPath({pts:line,closed:false}),p0=pathPoint(P,s0),h0=pathHeading(P,s0),RY=ryOfHeading(h0),X=frameFn(p0[0],p0[2],RY),lat=[Math.cos(RY),0,Math.sin(RY)];
  const body=[];boxIn(body,X,RY,-1.3,0,0,.9,1.1,4.4);boxIn(body,X,RY,1.3,0,0,.9,1.1,4.4);boxIn(body,X,RY,0,.5,0,2.4,1.1,3.4);boxIn(body,X,RY,0,1.6,1.1,2.0,1.0,1.7);boxIn(body,X,RY,0,1.6,-.9,1.7,1.8,1.5);pr(body,X(.5,2.6,1.2),X(.5,3.6,1.2),.12,6,1);
  const blade=[];boxIn(blade,X,RY,0,.2,3.7,3.7,1.3,.35);for(const s of [-1,1])ob(blade,X(s*1.3,.9,1.4),X(s*1.7,.7,3.5),.3,.3);
  const tag=part=>T('campus','civil','civil',{order:.12,hideFrom:'structure',part});
  out(body,tag('doz.1.body'),{name:'dozer body'});out(blade,tag('doz.1.blade'),{name:'dozer blade'});
  rig('doz.1',30,2,{});
  part('doz.1.body',null,'path',[p0[0],0,p0[2]],[0,1,0],{type:'cycle',rig:'doz.1',units:'m',keys:[[0,0],[.40,12],[.50,12],[.90,0],[1,0]]},{path:{pts:line,closed:false,s0}});
  part('doz.1.blade','doz.1.body','rev',X(0,.9,1.4),lat,{type:'cycle',rig:'doz.1',keys:[[0,0],[.40,0],[.46,-14],[.88,-14],[.94,0],[1,0]]});
  ST.G.civil.dozer={line,s0}}
 /* ---- crews: two workers carry a length of pipe along the trench edge, at walking pace (1.1 m/s) ---- */
 [[[-17.6,-15.0,-27.5,-21.5],1.3,[-15.0,-24.5],'west corridor'],[[38,46,-34.9,-32.3],1.3,[42,-34.9],'fibre'],[[47,49.6,-8,-1],1.3,[49.6,-4.5],'chilled water east'],[[-18,-8,45.7,48.3],1.3,[-13,45.7],'generator collector south']].forEach(([[x0,x1,z0,z1],r,start,nm],i)=>{
  let lp=roundedLoop(x0,x1,z0,z1,r,1,.5);if(start)lp=loopFrom(lp,start);
  const P=prepPath({pts:lp,closed:true}),p0=pathPoint(P,0),h0=pathHeading(P,0),RY=ryOfHeading(h0),X=frameFn(p0[0],p0[2],RY),b=[];
  worker(b,X,0,-1.2);worker(b,X,0,1.2);pr(b,X(0,1.0,-1.5),X(0,1.0,1.5),.2,8,2);
  const id='crew.'+(i+1);rig(id,P.L/1.1,0,{});
  out(b,T('campus','civil','civil',{order:.86+i*.035,hideFrom:'concrete',part:id}),{noEdge:true,name:'crew laying pipe '+nm});
  part(id,null,'path',[p0[0],0,p0[2]],[0,1,0],{type:'cycle',rig:id,units:'m',ease:'linear',keys:[[0,0],[1,P.L]]},{path:{pts:lp,closed:true,s0:0}})});
 /* ---- spoil piles: they grow while the trenches open (progress 3 to 4) and shrink as the trenches are backfilled ---- */
 [[-18.4,-7.2,4,3,1.4],[-26.1,1,2.8,5,1.6],[26.7,-40.8,4,3,1.4],[16.1,-50,2.6,5,1.6],[11.5,41,4,3,1.4],[40,49.25,5,2.4,1.4],[50.4,9.5,4.5,3.2,1.6]].forEach(([x,z,w,d,h],k)=>{
  const b=[];hill(b,x,0,z,w,d,h,w*.42,d*.4);const id='rv.spoil.'+k;
  reveal(id,{win:[3.1+.07*k,3.48+.07*k],out:[5.10,5.60],fx:[{type:'scale',pivot:[x,0,z],from:[.4,.02,.4]}]});
  out(b,C0civil(.2,{reveal:id}),{name:'spoil pile '+(k+1)})});
 {const b=[],x=49,z=-14.5;for(let r=0;r<4;r++)for(let i=0;i<4-r;i++)pr(b,[x-3,.4+r*.62,z+i*.72+r*.36],[x+3,.4+r*.62,z+i*.72+r*.36],.34,8,2);out(b,C0civil(.22),{name:'pipe laydown'})}
}
const C0civil=(order,x={})=>T('campus','civil','civil',{order,hideFrom:'structure',...x});

/* ================= UNDERGROUND UTILITIES (appear: underground, hidden from structure; power, chilled water and fibre re-highlight in their own step) =================
   Every utility is cut into sections of at most 8 m along its route; each section is lowered into the open trench (a reveal with a move and a fade). ================= */
function buildUnderground(){
 const UGs=(disc,order,x={})=>T('campus','underground',disc,{order,hideFrom:'structure',underground:true,...x});
 const ZEl=ZE,routes=[],R=(id,disc,kind,pts,o={})=>routes.push({id,disc,kind,pts,...o});
 /* routes in laying order (the crews follow the dig order) */
 ZEl.forEach((z,i)=>R('pw.lane.'+(i+1),'electrical','duct',[[-15,z],[-3.8,z]],{y:-1.5,reprise:['electrical'],stubs:[[-13.5,z,.9],[-4.5,z,1.2]]}));
 R('pw.feeder','electrical','duct',[[1.9,-32.5],[1.9,-30.5],[-10,-30.5],[-10,1.8]],{y:-1.5,reprise:['electrical']});
 R('pw.gen.n','electrical','duct',[[-25.5,14.3],[6.5,14.3],[6.5,7]],{y:-1.5,reprise:['electrical'],stubs:Array.from({length:6},(_,i)=>[-21.5+i*5,16.1,.9])});
 R('pw.gen.f2','electrical','duct',[[-4,14.3],[-4,7]],{y:-1.5,reprise:['electrical']});
 R('pw.gen.ring','electrical','duct',[[-25.5,14.3],[-25.5,42.1],[6.5,42.1],[6.5,14.3]],{y:-1.5,reprise:['electrical']});
 R('pw.gen.aisle','electrical','duct',[[-24,28.4],[5,28.4]],{y:-1.5,reprise:['electrical'],stubs:Array.from({length:6},(_,i)=>[-21.5+i*5,29.1,.9])});
 R('pw.chiller.n','electrical','duct',[[6.5,11.7],[43,11.7]],{y:-.65,reprise:['electrical']});
 R('pw.chiller.s','electrical','duct',[[6.5,36.2],[43,36.2]],{y:-1.5,reprise:['electrical']});
 R('me.chw.s','mechanical','twin',[[11.1,23.5],[11.1,7]],{y:-1.55,reprise:['mechanical']});
 R('me.chw.e','mechanical','twin',[[43.3,23.5],[43.3,-14.5],[38.8,-14.5]],{y:-1.55,reprise:['mechanical']});
 R('civ.storm','civil','pipe',[[-8.4,-26.7],[42,-26.7]],{y:-1.55,r:.6,sides:10,manholes:[-5,10,25,40]});
 R('tc.fibre','telecom','fibre',[[48,-40.5],[33.5,-40.5],[33.5,-19.5]],{y:-.7,reprise:['telecom']});
 R('civ.water.c','civil','pipe',[[-10,-26.7],[-10,10]],{y:-.72,r:.32,sides:8});
 R('civ.water.e','civil','pipe',[[53,3.5],[37.5,3.5]],{y:-.75,r:.3,sides:8});
 /* sections */
 const MAXL=8,secs=[];
 routes.forEach((r,ri)=>{const n=r.pts.length-1;r.sections=[];
  for(let i=0;i<n;i++){const A=r.pts[i],B=r.pts[i+1],len=Math.hypot(B[0]-A[0],B[1]-A[1]),m=Math.max(1,Math.ceil(len/MAXL)),d=[(B[0]-A[0])/len,(B[1]-A[1])/len];
   for(let j=0;j<m;j++){const a=[A[0]+d[0]*len*j/m,A[1]+d[1]*len*j/m],c=[A[0]+d[0]*len*(j+1)/m,A[1]+d[1]*len*(j+1)/m];
    const s={route:r,leg:i,j,a,c,len:len/m,d,extA:(j===0&&i>0)?1:0,extB:(j===m-1&&i<n-1)?1:0,bag:[],stubs:[],id:null};r.sections.push(s);secs.push(s)}}});
 const NS=secs.length,NSLOT=Math.min(NS,36);
 secs.forEach((s,k)=>{s.slot=Math.min(NSLOT-1,Math.floor(k*NSLOT/NS))});
 const slotLen=Array(NSLOT).fill(0);secs.forEach(s=>slotLen[s.slot]+=s.len);
 for(let i=0;i<NSLOT;i++){const w0=4.08+(4.96-.12-4.08)*i/(NSLOT-1);reveal('rv.pipe.'+kk2(i),{win:[w0,w0+.12],fx:[{type:'move',from:[0,6,0]}],fade:[0,.3],metrics:[{key:'pipeLaidM',value:Math.round(slotLen[i]*100)/100,use:'r'}]})}
 /* geometry of one section */
 const LAT=d=>[-d[1],0,d[0]];
 for(const s of secs){const r=s.route,b=s.bag,d=s.d,l=[-d[1],0,d[0]],e0=r.kind==='duct'?.85:r.kind==='twin'?.7:0,a0=s.extA*e0,a1=s.extB*e0,
   P0=[s.a[0]-d[0]*a0,s.a[1]-d[1]*a0],P1=[s.c[0]+d[0]*a1,s.c[1]+d[1]*a1],y=r.y;
  if(r.kind==='duct'){for(const lat of [-.6,0,.6])for(const dy of [-.22,.22]){const o=lat;pr(b,[P0[0]+l[0]*o,y+dy,P0[1]+l[1]*o],[P1[0]+l[0]*o,y+dy,P1[1]+l[1]*o],.17,6,1)}}
  else if(r.kind==='twin'){for(const sd of [-.65,.65])pr(b,[P0[0]+l[0]*sd,y,P0[1]+l[1]*sd],[P1[0]+l[0]*sd,y,P1[1]+l[1]*sd],.5,10,1)}
  else if(r.kind==='fibre'){for(const [dx,dz] of [[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]])pr(b,[P0[0]+dx,y,P0[1]+dz],[P1[0]+dx,y,P1[1]+dz],.13,6,1)}
  else pr(b,[P0[0],y,P0[1]],[P1[0],y,P1[1]],r.r,r.sides,1)}
 // risers, stubs and manholes go into the section nearest to them
 const nearest=(r,x,z)=>{let best=null,bd=1e9;for(const s of r.sections){const dx=s.c[0]-s.a[0],dz=s.c[1]-s.a[1],L2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[1])*dz)/L2)),d=Math.hypot(s.a[0]+dx*t-x,s.a[1]+dz*t-z);if(d<bd){bd=d;best=s}}return best};
 for(const r of routes){
  for(const [x,z,top] of r.stubs||[]){const s=nearest(r,x,z);for(const [dx,dz] of [[-.3,-.3],[.3,-.3],[-.3,.3],[.3,.3]])pr(s.bag,[x+dx,r.y,z+dz],[x+dx,top,z+dz],.15,6,1)}
  for(const x of r.manholes||[]){const s=nearest(r,x,r.pts[0][1]);pr(s.bag,[x,-2.15,r.pts[0][1]],[x,-.3,r.pts[0][1]],.95,10,1)}
  if(r.kind==='fibre'){const s=nearest(r,48.6,-40.5);for(const [dx,dz] of [[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]])pr(s.bag,[48.6+dx,r.y,-40.5+dz],[48.6+dx,.5,-40.5+dz],.13,6,1)}}
 // emit
 for(const s of secs){const r=s.route,id='rv.pipe.'+kk2(s.slot);s.id=id;
  out(s.bag,T('campus','underground',r.disc,{order:.2,hideFrom:'structure',underground:true,reveal:id,...(r.reprise?{reprise:r.reprise}:{})}),{noEdge:true,name:'underground '+r.id+' section '+(r.sections.indexOf(s)+1)})}
 // the 230 kV substation's own duct bank mouth is lowered with the first section of the feeder
 const first=routes.find(r=>r.id==='pw.feeder').sections[0].id;
 for(const o of ST.objects)if(o.subComp==='duct-bank'&&o.story)o.story.reveal=first;
 ST.G.routes=routes;ST.G.sections=secs;
 STORY_LAYOUT.sections=NS;
}

/* ================= CONCRETE (appear: concrete): backfill first (the trench reveals close), then slab and pad pours, each a rising wipe with a bright front.
   A boom pump aims at the hall slabs being poured (progress keyed) and sways with the clock; two mixer trucks circulate on a loop. ================= */
/* planar solver for the pump boom: three sections of lengths LB, equal bends of the last two sections, hose end hanging 4 m below the last hinge.
   Returns the absolute elevation of section 1 and the common bend (degrees) that put the end of section 3 at horizontal distance d and height hy. */
const PUMP={H0:2.6,LB:[13.5,13,10.5],HOSE:4};
function pumpSolve(d,hy){let best=null;for(let a=-4;a<=75;a+=1)for(let g2=0;g2<=150;g2+=2)for(let g3=-30;g3<=150;g3+=2){const a1=a*DEG,a2=a1-g2*DEG,a3=a2-g3*DEG,
 y1=PUMP.H0+PUMP.LB[0]*Math.sin(a1),y2=y1+PUMP.LB[1]*Math.sin(a2);if(y1<3.5||y2<2.5)continue;
 const x=PUMP.LB[0]*Math.cos(a1)+PUMP.LB[1]*Math.cos(a2)+PUMP.LB[2]*Math.cos(a3),y=y2+PUMP.LB[2]*Math.sin(a3),e=Math.hypot(x-d,y-hy)+(g2+Math.abs(g3))*.004;
 if(!best||e<best.e)best={e,a,g2,g3,x,y}}return best}
function buildConcrete(){
 const K=(order,x={})=>T('campus','concrete','civil',{order,...x});
 const pad=(b,list)=>list.forEach(a=>bb(b,...a));
 // [name, bag builder, area, wipe axis, modular, window start]
 const rows=[];
 const slab=(nm,x0,z0,x1,z1)=>{const b=[];bb(b,x0,0,z0,x1,.55,z1);return[nm,b,(x1-x0)*(z1-z0),null,false]};
 rows.push(slab('slab pour 3',-7,-6,15,10),slab('slab pour 1',-7,-22,15,-6),slab('slab pour 2',15,-22,37,-6),slab('slab pour 4',15,-6,37,10));
 {const b=[];bb(b,CORE.x0,.55,CORE.z0,CORE.x1,.7,CORE.z1);rows.push(['white space plinth',b,(CORE.x1-CORE.x0)*(CORE.z1-CORE.z0),null,false])}
 {const b=[];for(const z of ZE)bb(b,-15.6,0,z-2.8,-11.4,.3,z+2.8);rows.push(['HV skid pads',b,4*4.2*5.6,null,false])}
 {const b=[];bb(b,-24.4,0,15.4,5.4,.2,41);rows.push(['generator yard apron',b,29.8*25.6,null,false])}
 YARDG.gz.forEach((z,r)=>{const b=[];for(const x of YARDG.gx)bb(b,x-1.9,.2,z-5.45,x+1.9,.5,z+5.45);rows.push(['generator pads row '+(r+1),b,6*3.8*10.9,null,true])});
 {const b=[];bb(b,12.2,0,12.3,42.1,.2,34.7);rows.push(['chiller yard apron',b,29.9*22.4,null,false])}
 YARDG.cz.forEach((z,r)=>{const b=[];for(const x of YARDG.cx)bb(b,x-1.7,.2,z-4.9,x+1.7,.5,z+4.9);rows.push(['chiller pads row '+(r+1),b,8*3.4*9.8,null,true])});
 {const b=[];for(const x of [15,21,27,33,39])bb(b,x-3,.2,22.9,x+3,.5,24.1);rows.push(['pipe rack pads',b,5*6*1.2,null,true])}
 /* pour windows: the five hall pours (served by the pump) run one after the other, the yard pours run alongside; every window is 0.15 wide, the first starts at 5.45, the last ends at 5.97 */
 const starts=[5.45,5.52,5.59,5.66,5.73,5.50,5.55,5.62,5.68,5.72,5.77,5.82,5.82];
 const pours=[];
 rows.forEach(([nm,b,area,ax,mod],i)=>{const [mn,mx]=bboxOfBag(b),sx=mx[0]-mn[0],sz=mx[2]-mn[2],w0=starts[i],id='rv.pour.'+kk2(i);
  // the pump pours away from itself: the front of a hall pour moves from the side nearest the truck to the far side; the other pours sweep along their long axis
  const AX={'slab pour 3':[0,0,-1],'slab pour 1':[0,0,-1],'slab pour 2':[1,0,0],'slab pour 4':[1,0,0],'white space plinth':[0,0,-1]},axis=AX[nm]||(sx>=sz?[1,0,0]:[0,0,1]);
  const cs4=[[mn[0],mn[2]],[mx[0],mn[2]],[mn[0],mx[2]],[mx[0],mx[2]]].map(q=>q[0]*axis[0]+q[1]*axis[2]),c0=Math.min(...cs4),c1=Math.max(...cs4);
  reveal(id,{win:[w0,w0+.15],fx:[{type:'scale',pivot:[(mn[0]+mx[0])/2,mn[1],(mn[2]+mx[2])/2],from:[1,.08,1]},{type:'wipe',axis,from:c0-.01,to:c1+.01,edge:1.0}],metrics:[{key:'pouredM2',value:Math.round(area*10)/10,use:'r'}]});
  out(b,K(.05*i,{reveal:id,...(mod?{modular:true}:{})}),{name:nm});
  pours.push({nm,id,w0,w1:w0+.15,c:[(mn[0]+mx[0])/2,(mn[2]+mx[2])/2],axis,c0,c1,top:mx[1],bbox:[mn,mx]})});
 ST.G.pours=pours;
 /* ---- boom pump: truck, turret and three boom sections; the turret and sections follow progress keys, a small sway follows the clock ---- */
 {const xs=7.4,zs=12.0,ORDER=.7,tag=part=>T('campus','concrete','civil',{order:ORDER,hideFrom:'structure',...(part?{part}:{})});
  const tr=[];bx(tr,xs-.8,0,zs,8.6,1.2,2.6);bx(tr,xs+3.2,0,zs,2.0,2.4,2.6);for(const dz of [-1.9,1.9])for(const dx of [-3.2,3.0])bx(tr,xs+dx,0,zs+dz,.7,.35,.8);
  for(const dx of [-2.6,0,2.6])for(const sg of [-1,1])pr(tr,[xs+dx,.5,zs+sg*1.0],[xs+dx,.5,zs+sg*1.5],.5,10,2);
  out(tr,tag(),{name:'pump truck'});
  const tur=[];bx(tur,xs,1.2,zs,2.2,1.4,2.2);
  // rest (stowed) pose: a folded Z over the truck
  const REST={a1:8*DEG,b:[172*DEG,-172*DEG]};
  const a=[REST.a1,REST.a1+REST.b[0],REST.a1+REST.b[0]+REST.b[1]],pt=[[xs,PUMP.H0,zs]];
  for(let i=0;i<3;i++){const q=pt[i];pt.push([q[0]+PUMP.LB[i]*Math.cos(a[i]),q[1]+PUMP.LB[i]*Math.sin(a[i]),zs])}
  const sec=[[],[],[]];for(let i=0;i<3;i++){ob(sec[i],pt[i],pt[i+1],.9-.1*i,.9-.1*i,[0,0,1],1);}
  const hose=[];pr(hose,pt[3],[pt[3][0],pt[3][1]-PUMP.HOSE,pt[3][2]],.18,6,1);
  out(tur,tag('pump.base'),{name:'pump turret'});['pump.b1','pump.b2','pump.b3'].forEach((id,i)=>out(sec[i],tag(id),{name:'pump boom section '+(i+1)}));out(hose,tag('pump.hose'),{name:'pump end hose'});
  rig('pump',7,0,{});
  // aim keys: for each hall pour the hose end follows a short sweep across the middle of the pour; the pump is stowed (all values 0) before the first and after the last
  const hall=pours.slice(0,5),keysS=[],keys1=[],keys2=[],keys3=[],keys4=[],push=(p,sl,a1,g2,g3)=>{const v1=a1-REST.a1*R2D,v2=-g2-REST.b[0]*R2D,v3=-g3-REST.b[1]*R2D;keysS.push([p,sl]);keys1.push([p,v1]);keys2.push([p,v2]);keys3.push([p,v3]);keys4.push([p,-(v1+v2+v3)])};
  const zero=p=>{keysS.push([p,0]);keys1.push([p,0]);keys2.push([p,0]);keys3.push([p,0]);keys4.push([p,0])};
  zero(5.36);
  hall.forEach((po,i)=>{const nxt=hall[i+1],pStart=po.w0,pEnd=nxt?nxt.w0:po.w1;
   for(const q of (nxt?[0,.5]:[0,.5,1])){const p=pStart+q*(pEnd-pStart),r=smooth(q),sweep=(r-.5)*.5*(po.c1-po.c0),aim=[po.c[0]+po.axis[0]*sweep,po.c[1]+po.axis[2]*sweep],
     dx=aim[0]-xs,dz=aim[1]-zs,d0=Math.hypot(dx,dz),ang=Math.atan2(dz,dx),dd=Math.max(d0,14),sol=pumpSolve(dd,po.top+1.2+PUMP.HOSE);
    push(p,-ang*R2D,sol.a,sol.g2,sol.g3)}});
  zero(6.0);
  const sway=(amp,per,ph)=>({type:'fn',f:(p,t)=>amp*DEG*Math.sin(TAU*t/per+ph)-amp*DEG*Math.sin(ph)});
  const pk=(keys,amp,per,ph)=>({type:'sum',of:[{type:'p',keys,ease:'smooth'},sway(amp,per,ph)]});
  part('pump.base',null,'rev',[xs,PUMP.H0,zs],[0,1,0],pk(keysS,1.2,7,0));
  part('pump.b1','pump.base','rev',pt[0],[0,0,1],pk(keys1,.5,5,1));
  part('pump.b2','pump.b1','rev',pt[1],[0,0,1],pk(keys2,.7,6,2));
  part('pump.b3','pump.b2','rev',pt[2],[0,0,1],pk(keys3,.9,4.5,3));
  part('pump.hose','pump.b3','rev',pt[3],[0,0,1],{type:'p',keys:keys4,ease:'smooth'});
  mark('pump.tip','pump.hose',[pt[3][0],pt[3][1]-PUMP.HOSE,pt[3][2]]);
  ST.G.pump={xs,zs,rest:pt,keysS,keys1,keys2,keys3}}
 /* ---- two mixer trucks circulate on a loop beside the east strip, drums turning ---- */
 {const loop=roundedLoop(47.2,51.6,-32,-20,2.2,1,.5),lp=loopFrom(loop,[51.6,-26]),P=prepPath({pts:lp,closed:true});
  [0,1].forEach(k=>{const id='mix.'+(k+1),s0=k?P.L/2:0,p0=pathPoint(P,s0),h0=pathHeading(P,s0),RY=ryOfHeading(h0),X=frameFn(p0[0],p0[2],RY),tag=part=>T('campus','concrete','civil',{order:.72+.02*k,hideFrom:'structure',part});
   const body=[];boxIn(body,X,RY,0,.5,.9,2.2,.5,6.4);boxIn(body,X,RY,0,1.0,3.8,2.5,2.0,1.9);for(const lz of [3.7,-.1,-1.7])for(const sx of [-1,1])pr(body,X(sx*1.45,.55,lz),X(sx*1.0,.55,lz),.55,10,2);
   const a=X(0,2.0,-2.6),c=X(0,3.2,2.0),drum=[];pr(drum,a,c,1.3,10,2,.5);
   out(body,tag(id+'.body'),{name:'mixer '+(k+1)+' body'});out(drum,tag(id+'.drum'),{name:'mixer '+(k+1)+' drum'});
   rig(id,P.L/3.2,k*8,{});
   part(id+'.body',null,'path',[p0[0],0,p0[2]],[0,1,0],{type:'cycle',rig:id,units:'m',ease:'linear',keys:[[0,0],[1,P.L]]},{path:{pts:lp,closed:true,s0}});
   part(id+'.drum',id+'.body','rev',[(a[0]+c[0])/2,(a[1]+c[1])/2,(a[2]+c[2])/2],[c[0]-a[0],c[1]-a[1],c[2]-a[2]],{type:'spin',rate:55})});
  ST.G.mixLoop=lp;(STORY_LAYOUT.haulLoops||(STORY_LAYOUT.haulLoops={}))['mix']=lp}
}

/* ================= STRUCTURE (appear: structure): the steel stick frame rises. Columns rise out of the slab, roof trusses are lowered by a crawler crane one after another,
   eave beams, girts, bracing and purlins grow in along their length, cladding panels slide in (part of the building is clad, part still open). ================= */
const CRANE={cx:15,cz:21.5,y0:.55,foot:1.6,fy:2.4,LB:42,a0:60*DEG,Lc0:14};
function buildStructure(){
 const {x0,x1,z0,z1,top,bx:BX,bz:BZ}=HALLD,y0=.55,ch=top-y0;
 const S=(order,x={})=>T('campus','structure','structure',{order,structure:true,...x});
 const metric=(k,v)=>[{key:k,value:v,use:'r'}];
 /* columns on the perimeter, one object each; they rise out of the slab in a sweep from the north west to the south east */
 const cols=[];for(const x of BX)for(const z of [z0,z1])cols.push([x,z]);for(const z of BZ.slice(1,-1))for(const x of [x0,x1])cols.push([x,z]);
 cols.sort((a,c)=>(a[0]+a[1]*.6)-(c[0]+c[1]*.6));
 const NCG=Math.ceil(cols.length/2);   // two neighbouring columns of the sweep rise together, which halves the number of reveal ranges
 for(let j=0;j<NCG;j++){const id='rv.col.'+kk2(j),w0=6.06+(6.55-.12-6.06)*j/(NCG-1),n=Math.min(2,cols.length-2*j);reveal(id,{win:[w0,w0+.12],fx:[{type:'move',from:[0,-9.4,0]}],metrics:metric('steelMembers',n)})}
 cols.forEach(([x,z],i)=>{const b=[];bx(b,x,y0,z,.6,ch,.6);out(b,S(i/(cols.length-1)*.3,{reveal:'rv.col.'+kk2(Math.floor(i/2))}),{name:'column '+(i+1)})});
 /* eave beams and wall girts: each grows from its west or north end */
 const grow=(id,w,pivot,axis,len,keyk)=>reveal(id,{win:w,fx:[{type:'scale',pivot,from:[axis===0?.02:1,1,axis===2?.02:1]}],metrics:metric('steelMembers',1)});
 [['north',()=>{const b=[];bx(b,15,top-.5,z0,44.6,.5,.4);return b},[x0-.3,top-.5,z0],0],['south',()=>{const b=[];bx(b,15,top-.5,z1,44.6,.5,.4);return b},[x0-.3,top-.5,z1],0],
  ['west',()=>{const b=[];bx(b,x0,top-.5,-6,.4,.5,32.6);return b},[x0,top-.5,z0-.3],2],['east',()=>{const b=[];bx(b,x1,top-.5,-6,.4,.5,32.6);return b},[x1,top-.5,z0-.3],2]].forEach(([nm,mkb,pv,ax],k)=>{
  const id='rv.eave.'+kk2(k),w0=6.30+.03*k;grow(id,[w0,w0+.10],pv,ax);out(mkb(),S(.32,{reveal:id}),{name:'eave beam '+nm})});
 [['north',()=>{const b=[];for(const y of [3.6,6.7])bx(b,15,y,z0,44,.22,.22);return b},[x0-.1,5,z0],0],['south',()=>{const b=[];for(const y of [3.6,6.7])bx(b,15,y,z1,44,.22,.22);return b},[x0-.1,5,z1],0],
  ['west',()=>{const b=[];for(const y of [3.6,6.7])bx(b,x0,y,-6,.22,.22,32);return b},[x0,5,z0-.1],2],['east',()=>{const b=[];for(const y of [3.6,6.7])bx(b,x1,y,-6,.22,.22,32);return b},[x1,5,z0-.1],2]].forEach(([nm,mkb,pv,ax],k)=>{
  const id='rv.girt.'+kk2(k),w0=6.33+.03*k;grow(id,[w0,w0+.10],pv,ax);out(mkb(),S(.36,{reveal:id}),{noEdge:true,name:'wall girts '+nm})});
 /* roof trusses across the short span: lowered by the crane, one after another; the crane hook follows each one */
 const trusses=[];
 BX.forEach((x,i)=>{const b=[];bx(b,x,top-.25,-6,.38,.4,32.6);bx(b,x,top-1.8,-6,.3,.3,32);
  for(let k=0;k<BZ.length;k++)br(b,[x,top-1.7,BZ[k]],[x,top-.25,BZ[k]],.22);
  for(let k=0;k<BZ.length-1;k++){const a=BZ[k],c=BZ[k+1];k%2?br(b,[x,top-.25,a],[x,top-1.7,c],.22):br(b,[x,top-1.7,a],[x,top-.25,c],.22)}
  const id='rv.truss.'+kk2(i),w0=6.40+(6.92-.065-6.40)*i/(BX.length-1);
  reveal(id,{win:[w0,w0+.065],fx:[{type:'move',from:[0,5,0]}],fade:[0,.25],metrics:metric('steelMembers',1)});out(b,S(.34+i*.03,{reveal:id}),{noEdge:true,name:'roof truss '+(i+1)});
  trusses.push({x,id,w0,w1:w0+.065})});
 {const b=[];for(const z of BZ)bx(b,15,top+.1,z,44.4,.24,.24);reveal('rv.purlin',{win:[6.74,6.90],fx:[{type:'wipe',axis:[0,0,1],from:z0-.3,to:z1+.3,edge:.8}],metrics:metric('steelMembers',1)});out(b,S(.62,{reveal:'rv.purlin'}),{noEdge:true,name:'roof purlins'})}
 {const b=[];const bayx=i=>[BX[i],BX[i+1]],bayz=j=>[BZ[j],BZ[j+1]];
  for(const i of [0,7]){const [a,c]=bayx(i);br(b,[a,y0,z0],[c,top-.5,z0],.3);br(b,[c,y0,z0],[a,top-.5,z0],.3)}
  for(const j of [0,7]){const [a,c]=bayz(j);br(b,[x1,y0,a],[x1,top-.5,c],.3);br(b,[x1,y0,c],[x1,top-.5,a],.3)}
  for(const j of [0,1]){const [a,c]=bayz(j);br(b,[x0,y0,a],[x0,top-.5,c],.3);br(b,[x0,y0,c],[x0,top-.5,a],.3)}
  for(const i of [4,7]){const [a,c]=bayx(i);br(b,[a,y0,z1],[c,top-.5,z1],.3);br(b,[c,y0,z1],[a,top-.5,z1],.3)}
  reveal('rv.brace',{win:[6.55,6.72],fx:[{type:'wipe',axis:[0,1,0],from:y0-.2,to:top+.2,edge:.8}],metrics:metric('steelMembers',1)});out(b,S(.4,{reveal:'rv.brace'}),{noEdge:true,name:'bracing'})}
 /* cladding: some walls clad, some bays still open (the south west opening stays open for modules); panels slide in */
 {const panels=[];const P=(x,y,z,w,h,d,nm,mv)=>panels.push({x,y,z,w,h,d,nm,mv});
  for(let i=0;i<8;i++)P((BX[i]+BX[i+1])/2,y0+.1,z0-.02,5.2,8.6,.12,'north wall panel '+(i+1),[0,0,-6]);
  for(let j=0;j<6;j++)P(x1+.02,y0+.1,(BZ[j]+BZ[j+1])/2,.12,8.6,3.8,'east wall panel '+(j+1),[6,0,0]);
  for(let i=4;i<8;i++)P((BX[i]+BX[i+1])/2,y0+.1,z1+.02,5.2,8.6,.12,'south wall panel '+(i-3),[0,0,6]);
  for(let j=0;j<3;j++)P(x0-.02,y0+.1,(BZ[j]+BZ[j+1])/2,.12,8.6,3.8,'west wall panel '+(j+1),[-6,0,0]);
  for(let r=0;r<4;r++)for(let q=0;q<2;q++)P(-7+11*r+5.5,top+.22,-22+8*q+4,10.8,.1,7.8,'roof panel '+(r*2+q+1),[0,6,0]);
  // panels of one wall slide in three at a time (one reveal each): north 8, east 6, south 4, west 3 and roof 8 panels make 11 groups
  const groups=[];{const byWall={};panels.forEach((p,k)=>{const w=p.nm.replace(/ panel \d+$/,'');(byWall[w]||(byWall[w]=[])).push(k)});for(const w of Object.keys(byWall)){const l=byWall[w];for(let i=0;i<l.length;i+=3)groups.push(l.slice(i,i+3))}}
  const ng=groups.length,gid=new Map();groups.forEach((g,j)=>{const id='rv.clad.'+kk2(j),w0=6.60+(6.95-.10-6.60)*j/(ng-1);reveal(id,{win:[w0,w0+.10],fx:[{type:'move',from:panels[g[0]].mv}],fade:[0,.4],metrics:metric('steelMembers',g.length)});g.forEach(k=>gid.set(k,id))});
  panels.forEach((p,k)=>{const b=[];bx(b,p.x,p.y,p.z,p.w,p.h,p.d);out(b,S(.8,{clad:true,reveal:gid.get(k)}),{name:p.nm})})}
 buildCrane(trusses);
 ST.G.trusses=trusses;STORY_LAYOUT.hall=HALLD;
}
/* mobile crawler crane south of the hall: tracks (static), cab on the slew ring, luffing boom, sheave on a part that cancels the boom's rotation so the cable hangs plumb,
   cable (scale) and hook with slings and a spreader beam (slide). Everything is keyed to progress: the hook follows each truss down; after the last lift it hangs and sways. */
function buildCrane(trusses){
 const {cx,cz,y0,foot,fy,LB,a0,Lc0}=CRANE,tag=part=>T('campus','structure','structure',{order:.3,structure:true,hideFrom:'electrical',...(part?{part}:{})});
 const f=[0,0,-1],lat=[1,0,0],pv0=[cx,y0+fy,cz-foot],r0=foot+LB*Math.cos(a0),h0=y0+fy+LB*Math.sin(a0),tip0=[cx,h0,cz-r0];
 const trk=[];for(const s of [-1,1])bx(trk,cx+s*2.7,y0,cz,1.5,1.3,7.4);bx(trk,cx,y0+.9,cz,4.4,.7,5.6);out(trk,tag(),{name:'crane tracks'});
 const cab=[];bx(cab,cx,y0+1.6,cz+.2,3.6,2.4,4.6);bx(cab,cx+.9,y0+4.0,cz-1.2,1.4,1.4,1.6);bx(cab,cx,y0+1.6,cz+3.6,3.2,2.0,1.6);out(cab,tag('crane.cab'),{name:'crane cab'});
 const boom=[];ob(boom,pv0,tip0,1.0,1.0,[1,0,0]);out(boom,tag('crane.boom'),{name:'crane boom'});
 const sheave=[];bx(sheave,tip0[0],tip0[1]-.4,tip0[2],.8,.8,.8);out(sheave,tag('crane.plumb'),{name:'crane boom head'});
 const cable=[];pr(cable,tip0,[tip0[0],tip0[1]-Lc0,tip0[2]],.06,4,0);out(cable,tag('crane.cable'),{name:'crane cable'});
 const hk=[],hy=tip0[1]-Lc0;bx(hk,tip0[0],hy-.5,tip0[2],.7,.5,.7);for(const s of [-1,1])br(hk,[tip0[0],hy-.4,tip0[2]],[tip0[0]+s*1.5,hy-3.0,tip0[2]],.08);bx(hk,tip0[0],hy-3.2,tip0[2],3.6,.22,.4);out(hk,tag('crane.hook'),{name:'crane hook and spreader'});
 // keys: aim the hook at (x, y_hook_top, z)
 const aim=(x,y,z)=>{const dx=x-cx,dz=z-cz,rt=Math.hypot(dx,dz),a=Math.atan2(dz,dx),sl=((-Math.PI/2-a)*R2D+540)%360-180,al=Math.acos(Math.max(-1,Math.min(1,(rt-foot)/LB))),
  tipY=y0+fy+LB*Math.sin(al),rr=foot+LB*Math.cos(al);return{sl,luff:(al-a0)*R2D,tipr:rr-r0,tipy:tipY-h0,Lc:tipY-y}};
 const K={sl:[],luff:[],cab:[],hook:[],plumb:[]};
 const key=(p,A)=>{K.sl.push([p,A.sl]);K.luff.push([p,A.luff]);K.cab.push([p,A.Lc/Lc0]);K.hook.push([p,A.Lc-Lc0]);K.plumb.push([p,-A.luff])};
 const restA={sl:0,luff:0,tipr:0,tipy:0,Lc:Lc0};
 key(6.20,restA);
 trusses.forEach((t,i)=>{const nxt=trusses[i+1],pS=t.w0,pE=nxt?nxt.w0:t.w1;
  for(const q of (nxt?[0,.25,.5,.75]:[0,.25,.5,.75,1])){const p=pS+q*(pE-pS),rr=smooth((p-t.w0)/(t.w1-t.w0)),yTop=HALLD.top+.1+3.0+5*(1-rr);key(p,aim(t.x,yTop,-6))}});
 // hold above the north half of the hall after the last lift (the boom clears the south eave): hook 10 m above the roof
 key(6.97,aim(15,HALLD.top+10,-12));
 const sway={type:'fn',f:(p,t)=>8*DEG*smooth((p-6.93)/.05)*Math.sin(TAU*t/12)};
 rig('crane',12,0,{});
 part('crane.cab',null,'rev',[cx,y0+fy,cz],[0,1,0],{type:'sum',of:[{type:'p',keys:K.sl,ease:'smooth'},sway]});
 part('crane.boom','crane.cab','rev',pv0,lat,{type:'p',keys:K.luff,ease:'smooth'});
 part('crane.plumb','crane.boom','rev',tip0,lat,{type:'p',keys:K.plumb,ease:'smooth'});
 part('crane.cable','crane.plumb','scale',tip0,[0,1,0],{type:'p',units:'m',keys:K.cab,ease:'smooth'});
 part('crane.hook','crane.plumb','slide',tip0,[0,-1,0],{type:'p',units:'m',keys:K.hook,ease:'smooth'});
 mark('crane.hook','crane.hook',[tip0[0],hy-3.0,tip0[2]]);
 ST.G.crane={...CRANE,r0,h0,tip0,keys:K}}

/* ================= 9. ELECTRICAL (appear: electrical): HV skids outside, MV skids inside the outer ring, UPS rooms, switchgear, generators in the yard,
   conduit and busway that stop at the white-space boundary. The underground power duct banks re-highlight in this step (reprise). ================= */
function buildElectrical(){
 {
  const E_=(order,x={})=>T('campus','electrical','electrical',{order,...x});
  // HV skids outside the building (plain boxes, factory built)
  ZE.forEach((z,i)=>{const b=[];bx(b,-13.5,.3,z,3.4,3.6,5);out(b,E_(i*.04,{modular:true}),{name:'HV skid '+(i+1)})});
  // MV skids inside, in the outer ring
  ZE.forEach((z,i)=>{const b=[];bx(b,-4.5,.55,z,3.4,3.4,5);out(b,E_(.16+i*.04,{modular:true}),{name:'MV skid '+(i+1)})});
  // UPS rooms in the ring
  [[-.2,-19.5],[12.3,-19.5],[24.8,-19.5],[18.5,7.5]].forEach(([x,z],i)=>{const b=[];bx(b,x,.55,z,12,3.6,3.4);out(b,E_(.32+i*.05,{modular:true}),{name:'UPS room '+(i+1)})});
  // stick-built switchgear lineups between the ring and the core
  [[-1.5,13.5,-16.4,'x'],[15.5,29.5,-16.4,'x'],[13,27,4.6,'x'],[-12,2,-.5,'z']].forEach(([a,c,fix,ax],i)=>{const b=[],n=Math.round(c-a);
   for(let k=0;k<n;k++){const p=a+k+.5;ax==='x'?bx(b,p,.55,fix,.95,2.4,1.1):bx(b,fix,.55,p,1.1,2.4,.95)}out(b,E_(.55+i*.03),{name:'switchgear lineup '+(i+1)})});
  // generators in the yard: dense, two rows, packed close
  {let gi=0;for(const z of YARDG.gz)for(const x of YARDG.gx){const b=[];bx(b,x,.5,z-1.1,3.2,3.2,8.6);bx(b,x,.5,z+4.3,3.2,3,2);bx(b,x+.7,3.7,z-3,1.1,1.1,2.3);pr(b,[x+.7,4.8,z-3],[x+.7,8.2,z-3],.3,8,1);
    out(b,E_(.4+gi*.035),{name:'generator '+(gi+1)});gi++}
   const b=[];for(const x of [-15,-3])pr(b,[x-5,2.1,47],[x+5,2.1,47],2,12,2);out(b,E_(.82),{name:'fuel tanks'})}
  // conduit, cable tray and busway from the ring to the white-space boundary; they stop at its edge
  {const t=[],c=[],cap=[],R={north:[],west:[],south:[],busway:[]};
   const run=(A,B,y,w,rec)=>{rec.push([[A[0],y,A[1]],[B[0],y,B[1]]]);const mid=[(A[0]+B[0])/2,(A[1]+B[1])/2],len=Math.hypot(B[0]-A[0],B[1]-A[1]);const ang=Math.atan2(B[1]-A[1],B[0]-A[0]);bx(t,mid[0],y,mid[1],len,.12,w,-ang);
    const d=U3([B[0]-A[0],0,B[1]-A[1]]),l=[-d[2],0,d[0]];for(const o of [-.18,0,.18])pr(c,[A[0]+l[0]*o,y-.28,A[1]+l[2]*o],[B[0]+l[0]*o,y-.28,B[1]+l[2]*o],.07,4,1);
    for(const f of [.25,.75]){const p=[A[0]+(B[0]-A[0])*f,A[1]+(B[1]-A[1])*f];br(c,[p[0],y,p[1]],[p[0],8,p[1]],.08)}bx(cap,B[0],y-.35,B[1],d[0]?.3:.7,.5,d[2]?.3:.7)};
   for(const x of [3,9,15,21,27])run([x,-17.6],[x,CORE.z0-.2],4,.6,R.north);                         // north set, from the UPS rooms
   for(const z of ZE)run([-2.8,z],[CORE.x0-.2,z],4,.6,R.west);                                     // west set, from the MV skids
   for(const x of [14,18,22])run([x,5.7],[x,CORE.z1+.2],4,.6,R.south);                              // south set, from the south UPS room
   const bw=[];for(const x of [6,12,18,24]){bx(bw,x,4.35,(-17.6+CORE.z0-.2)/2,.5,.45,4.3);const zc=(-17.6+CORE.z0-.2)/2;R.busway.push([[x,4.58,zc-2.15],[x,4.58,zc+2.15]])}   // busway into the boundary
   out(t,E_(.88),{name:'cable trays to the boundary'});out(c,E_(.9),{noEdge:true,name:'conduit to the boundary'});out(cap,E_(.92),{name:'boundary terminations'});out(bw,E_(.94),{name:'busway to the boundary'});ST.G.el=R}
 }
}

/* ================= 10. MECHANICAL (appear: mechanical): dense chiller yard perpendicular to the hall, headers, risers where the underground chilled water
   comes up at the building, pump skids in the ring, piping that stops at the white-space boundary. The chilled water mains re-highlight (reprise). ================= */
function buildMechanical(){
 {
  const M_=(order,x={})=>T('campus','mechanical','mechanical',{order,...x});
  // chillers: two packed rows, long axis perpendicular to the south wall
  {let ci=0;YARDG.cz.forEach((z,r)=>YARDG.cx.forEach((x,k)=>{const b=[];bx(b,x,.5,z,3,2.7,9.5);for(const dz of [-3.5,-1.2,1.2,3.5])pr(b,[x,3.2,z+dz],[x,3.46,z+dz],.85,8,1);bx(b,x,.5,z+(r?4.9:-4.9),1.4,1.6,.4);
    out(b,M_((r+k*2)/15*.5),{name:'chiller '+(++ci)})}))}
  // supply and return headers with laterals into every chiller, risers to the underground mains
  {const b=[],MEG={headS:[[42.65,1.5,23.1],[10.45,1.5,23.1]],headR:[[11.75,1.5,23.9],[43.95,1.5,23.9]]};ST.G.me=MEG;pr(b,[10.45,1.5,23.1],[42.65,1.5,23.1],.38,10,1);pr(b,[11.75,1.5,23.9],[43.95,1.5,23.9],.38,10,1);
   for(const x of YARDG.cx){for(const o of [-.5,.5]){pr(b,[x+o,1.5,23.1],[x+o,1.5,22.4],.2,6,1);pr(b,[x+o,1.5,23.9],[x+o,1.5,24.6],.2,6,1)}}
   pr(b,[10.45,-1.55,23.3],[10.45,1.5,23.3],.5,10,1);pr(b,[11.75,-1.55,23.7],[11.75,1.5,23.7],.5,10,1);pr(b,[42.65,-1.55,23.3],[42.65,1.5,23.3],.5,10,1);pr(b,[43.95,-1.55,23.7],[43.95,1.5,23.7],.5,10,1);
   out(b,M_(.55),{noEdge:true,name:'chiller headers'})}
  // yard pipe-rack modules under the header (plain boxes)
  {const b=[];for(const x of [15,21,27,33,39])bx(b,x,.5,23.5,6,.8,1.2);out(b,M_(.6,{modular:true}),{name:'pipe rack modules'})}
  // pump skids in the east ring, fed by the east chilled water main
  [-14.55,-8.75,-2.95].forEach((z,i)=>{const b=[];bx(b,34.5,.55,z,3.4,3.4,5.3);out(b,M_(.64+i*.03,{modular:true}),{name:'pump skid '+(i+1)})});
  // risers above ground at the building, and the piping inside up to the white-space boundary
  {const b=[],ME=ST.G.me;
   ME.indoorS=[];ME.indoorE=[];
   // south entry: twin risers at x=10.45 and 11.75, then headers over the south middle band
   pr(b,[10.45,0,7],[10.45,5.2,7],.45,10,1);pr(b,[11.75,0,7],[11.75,4.6,7],.45,10,1);
   rt(b,[[10.45,5.2,7],[10.45,5.2,3],[28,5.2,3]],.35,10,1);rt(b,[[11.75,4.6,7],[11.75,4.6,4.3],[28,4.6,4.3]],.35,10,1);ME.hdrS=[[10.45,5.2,7],[10.45,5.2,3],[28,5.2,3]];ME.hdrR=[[11.75,4.6,7],[11.75,4.6,4.3],[28,4.6,4.3]];
   for(const x of [13,16,19,22,25]){ME.indoorS.push([[x,5.2,3],[x,5.2,CORE.z1+.3]]);ME.indoorS.push([[x+.6,4.6,4.3],[x+.6,4.6,CORE.z1+.3]]);pr(b,[x,5.2,3],[x,5.2,CORE.z1+.3],.2,6,1);bx(b,x,4.95,CORE.z1+.15,.6,.5,.3);pr(b,[x+.6,4.6,4.3],[x+.6,4.6,CORE.z1+.3],.2,6,1);bx(b,x+.6,4.35,CORE.z1+.15,.6,.5,.3)}
   // east entry: twin risers outside the east wall into the pump skid, then the east header
   pr(b,[38.8,-1.55,-15.15],[38.8,3.4,-15.15],.45,10,1);pr(b,[38.8,-1.55,-13.85],[38.8,2.6,-13.85],.45,10,1);pr(b,[38.8,3.4,-15.15],[36.3,3.4,-15.15],.35,10,1);pr(b,[38.8,2.6,-13.85],[36.3,2.6,-13.85],.35,10,1);
   for(const z of [-14.55,-8.75,-2.95])for(const [y,o] of [[5.2,-.3],[4.6,.5]])pr(b,[32.8,3.2,z+o],[30.3+(y>5?0:.8),y,z+o],.25,6,1);
   pr(b,[30.3,5.2,-14.8],[30.3,5.2,-1.2],.35,10,1);pr(b,[31.1,4.6,-14.2],[31.1,4.6,-.6],.35,10,1);ME.eastRiserS=[[38.8,-1.55,-15.15],[38.8,3.4,-15.15],[36.3,3.4,-15.15]];ME.eastRiserR=[[38.8,-1.55,-13.85],[38.8,2.6,-13.85],[36.3,2.6,-13.85]];ME.hdrES=[[30.3,5.2,-14.8],[30.3,5.2,-1.2]];ME.hdrER=[[31.1,4.6,-14.2],[31.1,4.6,-.6]];
   for(const z of [-12,-8.5,-5,-1.5]){ME.indoorE.push([[30.3,5.2,z],[CORE.x1+.3,5.2,z]]);ME.indoorE.push([[31.1,4.6,z+.6],[CORE.x1+.3,4.6,z+.6]]);pr(b,[30.3,5.2,z],[CORE.x1+.3,5.2,z],.2,6,1);bx(b,CORE.x1+.15,4.95,z,.3,.5,.6);pr(b,[31.1,4.6,z+.6],[CORE.x1+.3,4.6,z+.6],.2,6,1);bx(b,CORE.x1+.15,4.35,z+.6,.3,.5,.6)}
   out(b,M_(.8),{noEdge:true,name:'risers and piping to the boundary'})}
 }
}

/* ================= 11. OFF-SITE MODULES (appear: modular): the rest of the outer ring, modules inside, and one module on a dolly entering the building.
   Every object tagged modular:true in earlier steps (HV and MV skids, UPS rooms, pump skids, yard pads, pipe-rack modules) re-highlights here. Generic plain boxes only. ================= */
function buildModular(){
 {
  const D_=(order,x={})=>T('campus','modular','modular',{order,modular:true,...x});
  {const b=[];bx(b,30.7,.55,7.5,11,3.6,3.4);out(b,D_(0),{name:'ring module south east'})}
  {const b=[];bx(b,34.5,.55,2.7,3.4,3.6,5);out(b,D_(.08),{name:'ring module east'})}
  [4,7.8].forEach((x,i)=>{const b=[];bx(b,x,.55,4,3.4,3.4,3.4);out(b,D_(.16+i*.08),{name:'interior module '+(i+1)})});
  // dolly: loading apron at the opening, flat dolly on four wheels, one plain module half inside
  {const b=[];bx(b,1.5,0,13,5,.55,6);out(b,D_(.4),{name:'loading apron'})}
  {const b=[];bx(b,1.5,.8,11.15,3.9,.4,9.4);for(const [dx,dz] of [[-1.7,-4],[1.7,-4],[-1.7,4],[1.7,4]])bx(b,1.5+dx,.55,11.15+dz,.4,.25,.9);bx(b,1.5,1.2,11.15,3.4,3.6,8.8);out(b,D_(0,{part:'dolly.module'}),{name:'module on dolly'});part('dolly.module',null,'slide',[1.5,.8,11.15],[0,0,1],{type:'p',units:'m',keys:[[9.05,7],[9.95,0]],ease:'smooth'});mark('dolly.module','dolly.module',[1.5,3.0,11.15])}
 }
}

/* ================= 12. TELECOM (appear: telecom): its own pole line from the distance, into the meet-me room, small BMS boxes on the walls.
   Stops at grey space: nothing goes into the white space. The fibre ducts re-highlight (reprise). ================= */
 const TELE={path:[[70,-200],[66.9,-177.3],[63.7,-154.6],[60.6,-131.9],[57.4,-109.1],[54.3,-86.4],[51.1,-63.7],[48,-41]]};
function buildTelecom(){
 {
  const L_=(order,x={})=>T('campus','telecom','telecom',{order,...x});
  // pole line (separate from the power towers, arriving from the north east)
  {const b=[];const PL=poleLine(b,TELE.path,{h:18,arms:[{y:17,half:2.2,n:2}],r:.17,sag:.8,pw:.5});pr(b,[48.5,0,-41],[48.5,16.8,-41],.2,6,1);ST.G.tele={cond:PL.cond,att:PL.att};out(b,L_(0,{silhouette:true}),{noEdge:true,name:'telecom pole line'})}   // silhouetted like the power generation (C29)
  // meet-me room in the north east corner of the ring
  {const b=[];bx(b,33.75,.55,-19.5,4.9,3.6,3.4);out(b,L_(.5),{name:'meet-me room'})}
  // simplified distribution from the meet-me room to the white-space boundary: two trays on an overhead rack, one riser stub at the boundary
  {const b=[];for(const dz of [0,.55]){const z=-18.35-dz;bx(b,24.8,5.4,z,13.4,.12,.4);}bx(b,18.5,5.4,(-18.35+CORE.z0)/2,.4,.12,Math.abs(CORE.z0+18.35)+.4);bx(b,19.1,5.4,(-18.35+CORE.z0)/2,.4,.12,Math.abs(CORE.z0+18.35)+.4);
   for(const x of [31,25,19]){br(b,[x,5.5,-18.6],[x,8,-18.6],.08)}pr(b,[18.5,5.4,CORE.z0+.1],[18.5,6.4,CORE.z0+.1],.22,6,1);pr(b,[19.1,5.4,CORE.z0+.1],[19.1,6.4,CORE.z0+.1],.22,6,1);
   out(b,L_(.65),{name:'telecom trays to the boundary'})}
  // BMS boxes on the walls: small, plain
  {const b=[];const add=(x,z,ry)=>bx(b,x,2.1,z,.55,.75,.2,ry);
   for(const x of [-1.5,4,9.5])add(x,10.45,0);for(const x of [17.7,23.2,28.7,34.2])add(x,10.45,0);                    // south wall
   for(const z of [-18,-14,-10,-6,-2])add(-7.45,z,Math.PI/2);for(const z of [-18,-14,-10,-6,-2,2])add(37.45,z,Math.PI/2); // west and east walls
   for(const x of [-2,5,12,19,26,33])add(x,-22.45,0);                                                                    // north wall
   out(b,L_(.85),{name:'BMS boxes'})}
 }
}

/* ================= 13. WHITE SPACE (appear: whitespace): racks (the computers) and a dense zoo of conduit, busway, cable tray and cooling pipe,
   each piece tagged with its own discipline (electrical, mechanical, telecom). Racks are neutral and use 'power' (white). ================= */
function buildWhitespace(){
 {
  const W_=(order,disc,x={})=>T('campus','whitespace',disc,{order,...x});
  const pairZ=[-12.3,-8,-3.7,.6],rowZ=pairZ.flatMap(z=>[z-.6,z+.6]),rx=Array.from({length:33},(_,i)=>2.6+.8*i),aisleZ=[-10.15,-5.85,-1.55],X0=rx[0]-.4,X1=rx[rx.length-1]+.4,XC=(X0+X1)/2,XL=X1-X0,WS={el:[],me:[],tc:[]};ST.G.ws=WS;
  rowZ.forEach((z,r)=>{const b=[];for(const x of rx)bx(b,x,.7,z,.75,2.4,1.2);out(b,W_(r*.06,'power'),{name:'rack row '+(r+1)})});
  // electrical: busway over each row pair, conduit bundles, tap boxes, power distribution units at the row ends
  {const b=[];for(const z of pairZ){WS.el.push([[X0,3.4,z],[X1,3.4,z]]);bx(b,XC,3.4,z,XL,.5,.7);for(const o of [-.55,.55])for(const y of [3.25,3.1])pr(b,[X0,y,z+o],[X1,y,z+o],.11,4,1);
    for(let k=0;k<rx.length;k+=2)bx(b,rx[k]+.4,3.12,z,.5,.4,.7)}
   for(const z of rowZ)bx(b,1.4,.7,z,.5,2,1.1);out(b,W_(.52,'electrical'),{name:'zoo electrical'})}
  // mechanical: supply and return laterals across the rows, header, drops and coolant distribution units
  {const b=[];for(let k=0;k<7;k++){const x=4.4+k*4;WS.me.push([[x+.35,4.8,CORE.z0+.7],[x+.35,4.8,CORE.z1-.5]]);for(const s of [-.35,.35])pr(b,[x+s,s>0?4.8:4.3,CORE.z0+.7],[x+s,s>0?4.8:4.3,CORE.z1-.5],.28,6,1);
    for(const z of pairZ)for(const s of [-.35,.35])pr(b,[x+s,s>0?4.8:4.3,z],[x+s,3.15,z+s*.8],.15,5,1)}
   for(const [y,z] of [[4.3,CORE.z1-.9],[4.8,CORE.z1-.4]])pr(b,[3.4,y,z],[X1-.4,y,z],.4,8,1);
   for(const z of rowZ)bx(b,29.2,.7,z,.7,2,1.1);out(b,W_(.66,'mechanical'),{name:'zoo mechanical'})}
  // telecom: cable trays along the aisles and across the row ends
  {const b=[];for(const z of [...aisleZ,CORE.z0+.5]){WS.tc.push([[18.8,3.75,z],[X0,3.75,z]]);WS.tc.push([[18.8,3.75,z],[X1,3.75,z]]);bx(b,XC,3.75,z,XL,.16,.95)}bx(b,1.9,3.9,-5.8,.9,.16,15.2);bx(b,28.9,3.9,-5.8,.9,.16,15.2);
   for(const x of [6,12,18,24])for(const z of aisleZ.slice(0,2))br(b,[x,3.8,z],[x,8,z],.14);out(b,W_(.8,'telecom'),{name:'zoo telecom'})}
 }
}

/* ================= FLOWS (brief A): pulses travel along the conductors and pipes. Every polyline follows real geometry: the pole line conductors, the tower conductors, the conductors and
   tubes of the two substations (found by a small router over the recorded segments), the underground routes, the trays, risers and headers. The speed of every flow is
   set from the camera of its focus step so that the pulses cross the screen at about 90 px/s. ================= */
/* ---- a router over recorded conductor segments: nodes are segments, two segments are linked when they touch; shortest path by length ---- */
function segDist(a,b){   // closest distance between two segments {a,b} (3D) and the closest points
 const d1=S3(a.b,a.a),d2=S3(b.b,b.a),r=S3(a.a,b.a),A=D3(d1,d1),E=D3(d2,d2),F=D3(d2,r);let s,t;const eps=1e-12;
 if(A<=eps&&E<=eps){s=t=0}else if(A<=eps){s=0;t=Math.max(0,Math.min(1,F/E))}else{const c=D3(d1,r);if(E<=eps){t=0;s=Math.max(0,Math.min(1,-c/A))}else{const bb2=D3(d1,d2),den=A*E-bb2*bb2;s=den>eps?Math.max(0,Math.min(1,(bb2*F-c*E)/den)):0;t=(bb2*s+F)/E;if(t<0){t=0;s=Math.max(0,Math.min(1,-c/A))}else if(t>1){t=1;s=Math.max(0,Math.min(1,(bb2-c)/A))}}}
 const p=A3(a.a,M3(d1,s)),q=A3(b.a,M3(d2,t));return{d:Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]),p,q}}
function makeRouter(rec,comps){
 const S=rec.filter(r=>comps.has(r.comp)&&(r.comp!=='insulator-string')).map((r,i)=>({a:r.a,b:r.b,r:r.r,comp:r.comp,unit:r.unit,i,adj:[]}));
 const cell=4,grid=new Map(),key=(x,y,z)=>x+','+y+','+z;
 S.forEach(s=>{const lo=[Math.min(s.a[0],s.b[0])-s.r-.3,Math.min(s.a[1],s.b[1])-s.r-.3,Math.min(s.a[2],s.b[2])-s.r-.3],hi=[Math.max(s.a[0],s.b[0])+s.r+.3,Math.max(s.a[1],s.b[1])+s.r+.3,Math.max(s.a[2],s.b[2])+s.r+.3];
  for(let x=Math.floor(lo[0]/cell);x<=Math.floor(hi[0]/cell);x++)for(let y=Math.floor(lo[1]/cell);y<=Math.floor(hi[1]/cell);y++)for(let z=Math.floor(lo[2]/cell);z<=Math.floor(hi[2]/cell);z++){const k=key(x,y,z);(grid.get(k)||grid.set(k,[]).get(k)).push(s.i)}});
 const seen=new Set();
 for(const list of grid.values())for(let u=0;u<list.length;u++)for(let v=u+1;v<list.length;v++){const i=list[u],j=list[v],k=i<j?i*100003+j:j*100003+i;if(seen.has(k))continue;seen.add(k);
  const A=S[i],B=S[j],r=segDist(A,B);if(r.d<=A.r+B.r+.2){const w=Math.hypot(A.a[0]-B.a[0]+A.b[0]-B.b[0],A.a[1]-B.a[1]+A.b[1]-B.b[1],A.a[2]-B.a[2]+A.b[2]-B.b[2])/2+.01;A.adj.push([j,w,r.p,r.q]);B.adj.push([i,w,r.q,r.p])}}
 const nearest=pt=>{let best=-1,bd=1e9,bp=null;for(const s of S){const q=segDist({a:pt,b:pt},s);if(q.d<bd){bd=q.d;best=s.i;bp=q.q}}return{i:best,d:bd,p:bp}};
 /* shortest path between two points: returns the polyline through the touching segments */
 const route=(from,to)=>{const A=nearest(from),B=nearest(to);if(A.d>1.5||B.d>1.5)throw Error('router: start or goal is not on a conductor ('+A.d.toFixed(2)+', '+B.d.toFixed(2)+')');
  const dist=new Float64Array(S.length).fill(1e18),prev=new Int32Array(S.length).fill(-1),done=new Uint8Array(S.length);dist[A.i]=0;
  for(let n=0;n<S.length;n++){let u=-1,bd=1e18;for(let i=0;i<S.length;i++)if(!done[i]&&dist[i]<bd){bd=dist[i];u=i}if(u<0||u===B.i)break;done[u]=1;for(const [v,w] of S[u].adj)if(dist[u]+w<dist[v]){dist[v]=dist[u]+w;prev[v]=u}}
  if(prev[B.i]<0&&A.i!==B.i)throw Error('router: no path');
  const chain=[];for(let i=B.i;i>=0;i=prev[i]){chain.unshift(i);if(i===A.i)break}
  const pts=[from.slice()];let cur=A.p;pts.push(cur);
  for(let k=0;k<chain.length-1;k++){const e=S[chain[k]].adj.find(x=>x[0]===chain[k+1]);pts.push(e[2]);pts.push(e[3])}
  pts.push(B.p);pts.push(to.slice());
  const out=[pts[0]];for(const p of pts.slice(1)){const l=out[out.length-1];if(Math.hypot(p[0]-l[0],p[1]-l[1],p[2]-l[2])>.05)out.push(p)}return out};
 return{route,nearest,S}}
/* ordered points of a unit built with route() or pipe(): consecutive recorded segments */
function unitPts(rec,unit){const s=rec.filter(r=>r.unit===unit);if(!s.length)return[];const o=[s[0].a];for(const q of s)o.push(q.b);return o}
const rvs=p=>p.slice().reverse();
const cat=(...ps)=>{const o=[];for(const p of ps)for(const q of p){const l=o[o.length-1];if(!l||Math.hypot(q[0]-l[0],q[1]-l[1],q[2]-l[2])>.02)o.push(q)}return o};
/* screen scale of a polyline at a camera: pixels per metre along the path, length weighted (1600 x 900, view offset of the camera) */
function pxPerMetre(camName,paths){const cam=STORY_CAMERAS[camName],W=1600,H=900,f=U3(S3(cam.target,cam.eye)),r=U3(X3(f,[0,1,0])),u=X3(r,f),tf=1/Math.tan(cam.fov*Math.PI/360),asp=W/H,nx=2*cam.view[0]-1,ny=1-2*cam.view[1];
 const P=p=>{const d=S3(p,cam.eye),x=D3(d,r),y=D3(d,u),z=D3(d,f);if(z<1)return null;const X=(tf/asp*x)/z+nx,Y=tf*y/z+ny;return[(X*.5+.5)*W,(1-(Y*.5+.5))*H]};
 let sp=0,sm=0;for(const pp of paths){const pts=pp.pts;for(let i=1;i<pts.length;i++){const a=P(pts[i-1]),b=P(pts[i]),m=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1],pts[i][2]-pts[i-1][2]);if(a&&b&&m>.01){sp+=Math.hypot(a[0]-b[0],a[1]-b[1]);sm+=m}}}
 return sm>0?sp/sm:4}
function buildFlows(){
 const yardRec=ST.G.yardRec,campRec=ST.G.campRec,yard=ST.G.yard,camp=ST.G.camp,feeders=ST.G.feeders,flows=[];
 const FL=(id,disc,step,o,paths)=>flows.push({id,disc,step,order:0,region:'campus',faint:.3,faintEnergy:.22,...o,paths:paths.map(p=>Array.isArray(p)?{pts:p}:p)});
 const ph='ABC';
 /* ---------- energy region: feeders, collector, yard, line ---------- */
 const SRC=['solar','hydro','wind','nuclear','gas'];
 SRC.forEach((s,i)=>FL('pw.feeder.'+s,'power','grid',{region:'energy',order:SLOTS[s].order*.8},feeders[s].cond.map(c=>c)));
 {const drop=SRC.map(s=>{const b=feeders[s].bay;return unitPts(yardRec,'LINK-F'+(b+1)+'-B')});
  const tubes=[0,1,2].map(k=>{const p=unitPts(yardRec,'BUS-C-'+ph[k]);return p[0][0]<=p[p.length-1][0]?p:rvs(p)});
  FL('pw.collector','power','grid',{region:'energy',order:.2},[...drop,...tubes])}
 const yr=makeRouter(yardRec,new Set(['conductor','bus-tube','bushing','circuit-breaker','disconnect-switch','current-transformer']));
 const txInfo=name=>{const bs=yardRec.filter(r=>r.unit==='TX-'+name&&r.comp==='bushing');let top=null;for(const r of bs)for(const p of [r.a,r.b])if(!top||p[1]>top[1])top=p;
  const base=pt=>{let y=1e9;for(const r of bs)for(const p of [r.a,r.b])if(Math.hypot(p[0]-pt[0],p[2]-pt[2])<.3&&p[1]<y)y=p[1];return[pt[0],y,pt[2]]};return{h1:top,h1b:base(top),base}};
 const bankUnits={T1:['T1A','T1B','T1C'],T2:['T2A','T2B','T2C']},unitId={T2A:1,T2B:2,T2C:3,SP:4,T1A:5,T1B:6,T1C:7};
 ['T1','T2'].forEach((bk,bi)=>{const paths=[],lpaths=[];
  bankUnits[bk].forEach((u,k)=>{const lx=unitPts(yardRec,'LINK-X'+unitId[u]),inf=txInfo(u),x1=lx[0],x1b=inf.base(x1);
   paths.push(cat(rvs(lx),[x1b],[inf.h1b],[inf.h1]));
   const tip=yard.lineBays[bi][k];lpaths.push(yr.route(inf.h1,tip))});
  FL('pw.yard.'+bk.toLowerCase(),'power','grid',{region:'energy',order:.4+.1*bi},paths);
  FL('pw.yard.line'+(bi+1),'power','grid',{region:'energy',order:.55+.1*bi},lpaths)});
 {const west=ST.G.lineCond;FL('pw.line.1','power','transmission',{region:'energy',order:.2},west[0]);FL('pw.line.2','power','transmission',{region:'energy',order:.3},west[1])}
 /* ---------- campus substation ---------- */
 const cr=makeRouter(campRec,new Set(['conductor','bus-tube','bushing','circuit-breaker','disconnect-switch','current-transformer']));
 const Wc=(x,z)=>[CAMPS_C[0]+(z+3.6),CAMPS_C[1]+x];     // local to world for the 230 kV module (rot pi/2, mirrored, centre z offset of the two bay layout)
 const bays=camp.lineBays.map((tips,b)=>({tips,bn:b+1}));
 const inPaths=bays.map(({tips,bn})=>[0,1,2].map(k=>{const bus=unitPts(campRec,'BUS-M'+bn+'-'+ph[k]);const far=bus[0][2]>bus[bus.length-1][2]?bus[0]:bus[bus.length-1];
   // the tip nearest to this phase: the module lists the tips A, B, C in order of the bay's lanes
   return cr.route(tips[k],far)}));
 FL('pw.campus.in1','power','substation',{order:.2},inPaths[0]);FL('pw.campus.in2','power','substation',{order:.3},inPaths[1]);
 {const paths=[0,1,2].map(k=>{const a=unitPts(campRec,'LINK-T1-'+ph[k]+'a'),b=unitPts(campRec,'LINK-T1-'+ph[k]+'b');return cr.route(a[a.length-1],b[b.length-1])});FL('pw.campus.tx','power','substation',{order:.5},paths)}
 {const paths=[];
  // LV bus ducts: the three transformers' middle LV bushings, over the rear wall and down onto the MV building; then the four conduits of the duct bank mouth (below grade)
  [0,1,2].forEach(i=>{const rb=campRec.filter(r=>r.unit==='TX-T'+(i+1)&&r.comp==='bushing');
   // the LV bushings are the 13 mm class: radius .13; their tops are the highest points among them
   const lv=rb.filter(r=>Math.abs(r.r-.13)<.01),tz=camp.transformers[i][2];let top=null;for(const r of lv)for(const p of [r.a,r.b])if(!top||p[1]>top[1]+.01||(Math.abs(p[1]-top[1])<.01&&Math.abs(p[2]-tz)<Math.abs(top[2]-tz)))top=p;
   if(top){const up=[top[0],top[1]+.65,top[2]],over=[up[0]+4.0,up[1],up[2]],down=[over[0],4.8,over[2]];paths.push([top,up,over,down])}});
  const duct=campRec.filter(r=>r.comp==='duct-bank');duct.forEach(r=>paths.push({pts:[r.a,r.b],through:true}));
  FL('pw.campus.out','power','substation',{order:.8},paths)}
 /* ---------- underground and indoor routes ---------- */
 const R=Object.fromEntries(ST.G.routes.map(r=>[r.id,r])),yy=(pts,y)=>pts.map(p=>[p[0],y,p[1]]);
 ZE.forEach((z,i)=>{const feed=yy([[1.9,-32.5],[1.9,-30.5],[-10,-30.5],[-10,z]],-1.5);
  FL('el.duct.'+(i+1),'electrical','electrical',{order:.05+.06*i,faint:0},[{pts:cat(feed,[[-13.5,-1.5,z]]),through:true},{pts:cat(feed,[[-4.5,-1.5,z]]),through:true}])});
 FL('el.duct.gen','electrical','electrical',{order:.35,faint:0},[{pts:yy([[-25.5,14.3],[6.5,14.3],[6.5,7]],-1.5),through:true},{pts:yy([[-4,14.3],[-4,7]],-1.5),through:true},{pts:yy([[-24,28.4],[5,28.4]],-1.5),through:true}]);
 const EL=ST.G.el;
 FL('el.indoor.north','electrical','electrical',{order:.45,also:['whitespace']},[EL.north[0],EL.north[2],EL.north[4]]);
 FL('el.indoor.west','electrical','electrical',{order:.5,also:['whitespace']},[EL.west[0],EL.west[1],EL.west[2],EL.west[3]]);
 FL('el.indoor.south','electrical','electrical',{order:.55,also:['whitespace']},EL.south);
 FL('el.busway','electrical','electrical',{order:.6,also:['whitespace']},EL.busway);
 const ME=ST.G.me,twinS=[[10.45,-1.55,23.3],[10.45,-1.55,7],[10.45,0,7],[10.45,5.2,7]],twinR=[[11.75,4.6,7],[11.75,0,7],[11.75,-1.55,7],[11.75,-1.55,23.7],[11.75,1.5,23.7]];
 FL('me.chw.supply.s','mechanical','mechanical',{order:.1,faint:.3},[{pts:cat([[10.45,1.5,23.3]],twinS),through:true}]);
 FL('me.chw.return.s','mechanical','mechanical',{order:.15,faint:.3},[{pts:twinR,through:true}]);
 FL('me.chw.supply.e','mechanical','mechanical',{order:.2,faint:.3},[{pts:[[42.65,1.5,23.3],[42.65,-1.55,23.3],[42.65,-1.55,-13.85],[38.8,-1.55,-13.85],[38.8,2.6,-13.85],[36.3,2.6,-13.85]],through:true}]);
 FL('me.chw.return.e','mechanical','mechanical',{order:.25,faint:.3},[{pts:[[36.3,3.4,-15.15],[38.8,3.4,-15.15],[38.8,-1.55,-15.15],[43.95,-1.55,-15.15],[43.95,-1.55,23.7],[43.95,1.5,23.7]],through:true}]);
 FL('me.yard','mechanical','mechanical',{order:.4},[ME.headS,ME.headR]);
 FL('me.indoor','mechanical','mechanical',{order:.6,also:['whitespace']},[ME.hdrS,ME.hdrR,ME.hdrES,ME.hdrER,ME.indoorS[0],ME.indoorS[2],ME.indoorE[0],ME.indoorE[2]]);
 const TC=ST.G.tele,tp=TELE.path;
 FL('tc.pole','telecom','telecom',{order:0},TC.cond.map(c=>cat(c,[[48.5,16.8,-41],[48.5,.3,-41]])));
 FL('tc.duct','telecom','telecom',{order:.3,faint:0},[{pts:[[48.6,.5,-40.5],[48.6,-.7,-40.5],[33.5,-.7,-40.5],[33.5,-.7,-19.5]],through:true}]);
 FL('tc.indoor','telecom','telecom',{order:.6,also:['whitespace']},[[[31.5,5.4,-18.35],[18.5,5.4,-18.35],[18.5,5.4,CORE.z0+.1],[18.5,6.4,CORE.z0+.1]],[[31.5,5.4,-18.9],[19.1,5.4,-18.9],[19.1,5.4,CORE.z0+.1],[19.1,6.4,CORE.z0+.1]]]);
 const WS=ST.G.ws;
 FL('ws.el','electrical','whitespace',{order:.2},WS.el);FL('ws.me','mechanical','whitespace',{order:.45},WS.me.slice(0,4));FL('ws.tc','telecom','whitespace',{order:.7},WS.tc.slice(0,4));
 /* ---------- calibration from the camera of the focus step: about 90 px/s, pulses 20 px long and 200 px apart (a pulse core wider than 7 px would count as a flat white blob), core width as the renderer's minimum (3.6 px white, 5 px colour), phases spread by the golden ratio so that no two flows pulse in step ---------- */
 for(const f of flows){const cam=STORY_STEPS[STORY_INDEX[f.step]].camera,ppm=pxPerMetre(cam,f.paths);
  f.speed=Math.round(Math.max(1.5,Math.min(60,90/ppm))*100)/100;f.gap=Math.round(Math.max(5,Math.min(90,200/ppm))*10)/10;f.len=Math.round(Math.max(1,Math.min(14,20/ppm))*10)/10;f.width=f.disc==='power'?3.6:5;f.phase=Math.round(((flows.indexOf(f)*0.618034)%1)*100)/100;
  f.px=Math.round(ppm*100)/100;ANIM.flows.push(f)}
 ST.G.flows=flows;
}
/* stubs: buildCampusSubstation */
function buildCampusSubstation(){}
/* Counts per step and discipline for checks. With no argument it inspects the most recent build. */
export function storyStats(objs){
 objs=objs||LAST||buildCampus();
 const byStep={},byDisc={},regions={energy:0,campus:0},flags={modular:0,underground:0,structure:0,clad:0,reprise:0,storyOnly:0,withStory:0,explore:0};
 const row=()=>({objects:0,faces:0,byDisc:{}});
 for(const s of STORY_STEPS)byStep[s.id]=row();byStep.always=row();
 let faces=0,objects=0,withPart=0,withReveal=0;
 for(const o of objs){if(!o.story){flags.explore++;continue}
  const s=o.story,r=byStep[s.appear]||(byStep[s.appear]=row());r.objects++;r.faces+=o.faces.length;r.byDisc[s.disc]=(r.byDisc[s.disc]||0)+1;
  byDisc[s.disc]=(byDisc[s.disc]||0)+1;regions[s.region]=(regions[s.region]||0)+1;faces+=o.faces.length;objects++;flags.withStory++;
  if(o.storyOnly)flags.storyOnly++;for(const k of ['modular','underground','structure','clad'])if(s[k])flags[k]++;if(s.reprise)flags.reprise++;
  if(s.part)withPart++;if(s.reveal)withReveal++}
 return {objects,faces,byStep,byDisc,regions,flags,totalObjects:objs.length,exploreObjects:flags.explore,
  anim:{parts:Object.keys(ANIM.parts).length,reveals:Object.keys(ANIM.reveals).length,flows:ANIM.flows.length,marks:Object.keys(ANIM.marks).length,objectsWithPart:withPart,objectsWithReveal:withReveal}}
}
