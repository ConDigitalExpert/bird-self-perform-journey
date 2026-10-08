/* Renderer for the campus model. Geometry lives in model.js; WebGL and the software
   renderer consume the same world-space vertices, face normals, groups and camera state. */
import {CAMERAS,ANCHORS,SEQ,buildCampus,add,sub,mul,dot,cross,norm} from './model.js';
import * as MODEL from './model.js'; // STORY_STEPS and STORY_CAMERAS are read from here, so a missing export degrades gracefully
export {CAMERAS,ANCHORS,SEQ,buildCampus} from './model.js';
function buildShader(gl,type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh}
const LIGHT=norm([-0.8,1.05,-0.25]);
export class CampusScene{
 constructor(canvas,onMode,onSelect){this.canvas=canvas;this.onSelect=onSelect;this.story=false;this.storyP=0;this.storyView={cx:.35,cy:.5};this.objects=buildCampus();this.camera={...CAMERAS[0],target:[...CAMERAS[0].target]};this.targetCamera={...this.camera};this.chapter=0;this.seq=null;this.selected='power';this.orbit={yaw:0,pitch:0,zoom:1};this.reduced=false;this.open=false;this.dirty=true;this.projected=[];this.moved=false;this.width=1000;this.height=600;this.onMode=onMode;this.initStoryRuntime();this.initRenderer(onMode);this.events();this.resize();this.frame=this.frame.bind(this);requestAnimationFrame(this.frame)}
 initRenderer(onMode){let gl;try{gl=this.canvas.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:true});if(!gl)throw Error('WebGL unavailable');
 const deriv=!!gl.getExtension('OES_standard_derivatives'),f3=v=>v.map(x=>x.toFixed(5)).join(','),FILL=norm([.6,.35,.7]);
 const PREC='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
 const VS='attribute vec3 a_position;attribute vec3 a_normal;attribute vec2 a_uv;uniform mat4 u_matrix;uniform mat4 u_light;uniform vec3 u_target;uniform vec3 u_forward;varying vec3 v_normal;varying vec3 v_pos;varying vec2 v_uv;varying vec4 v_shadow;varying float v_far;void main(){v_normal=a_normal;v_pos=a_position;v_uv=a_uv;v_shadow=u_light*vec4(a_position,1.0);v_far=-dot(a_position-u_target,u_forward);gl_Position=u_matrix*vec4(a_position,1.0);}';
 const FS=(deriv?'#extension GL_OES_standard_derivatives : enable\n':'')+PREC+`varying vec3 v_normal;varying vec3 v_pos;varying vec2 v_uv;varying vec4 v_shadow;varying float v_far;uniform vec3 u_color;uniform float u_alpha;uniform float u_spec;uniform float u_edge;uniform float u_ghost;uniform float u_shadowOn;uniform vec3 u_view;uniform vec3 u_fogColor;uniform vec2 u_fog;uniform sampler2D u_shadowMap;uniform float u_texel;
const vec3 L=vec3(${f3(LIGHT)});const vec3 F=vec3(${f3(FILL)});
float unpackD(vec4 c){return dot(c,vec4(1.0,1.0/255.0,1.0/65025.0,1.0/16581375.0));}
float shadowF(vec3 n){if(u_shadowOn<0.5)return 1.0;vec3 p=v_shadow.xyz*0.5+0.5;if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0||p.z>1.0)return 1.0;float bias=0.0006+0.0024*(1.0-max(dot(n,L),0.0));float s=0.0;for(int i=-1;i<=1;i++){for(int j=-1;j<=1;j++){s+=(p.z-bias>unpackD(texture2D(u_shadowMap,p.xy+vec2(float(i),float(j))*u_texel)))?0.0:1.0;}}return s/9.0;}
float edgeF(){${deriv?'vec2 w=fwidth(v_uv);vec2 e=smoothstep(vec2(0.0),w*1.35,v_uv)*smoothstep(vec2(0.0),w*1.35,1.0-v_uv);return (1.0-min(e.x,e.y))*u_edge;':'return 0.0;'}}
void main(){vec3 n=normalize(v_normal);float edge=edgeF();
if(u_ghost>0.5){float fres=pow(1.0-abs(dot(n,u_view)),2.0);float k=clamp(edge+fres*0.35,0.0,1.0);vec3 gc=mix(vec3(0.82,0.88,0.86),vec3(0.16,0.42,0.32),k);float a=clamp(u_alpha+edge*0.5+fres*0.08,0.0,0.85);gl_FragColor=vec4(gc*a,a);return;}
vec3 base=pow(u_color,vec3(2.2));float sun=max(dot(n,L),0.0);float sh=shadowF(n);float hemi=n.y*0.5+0.5;
vec3 amb=mix(vec3(0.34,0.33,0.31),vec3(0.60,0.66,0.71),hemi)*0.62;vec3 key=vec3(1.0,0.95,0.88)*sun*mix(0.08,1.0,sh)*0.92;vec3 fill=vec3(0.55,0.62,0.72)*max(dot(n,F),0.0)*0.14;
float ao=mix(0.70,1.0,smoothstep(-0.3,3.2,v_pos.y));vec3 h=normalize(L+u_view);float spec=pow(max(dot(n,h),0.0),56.0)*u_spec*sh;
vec3 c=base*(amb*ao+key+fill)+vec3(spec);c=pow(c,vec3(1.0/2.2));c=mix(c,c*0.58,edge*0.6);c=mix(c,u_fogColor,smoothstep(u_fog.x,u_fog.y,v_far)*0.38);
gl_FragColor=vec4(c*u_alpha,u_alpha);}`;
 const SVS='attribute vec3 a_position;uniform mat4 u_light;void main(){gl_Position=u_light*vec4(a_position,1.0);}';
 const SFS=PREC+'void main(){vec4 e=fract(vec4(1.0,255.0,65025.0,16581375.0)*gl_FragCoord.z);e-=e.yzww*vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);gl_FragColor=e;}';
 const link=(vs,fs)=>{const p=gl.createProgram();gl.attachShader(p,buildShader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,buildShader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('WebGL shader link failed');return p};
 const program=link(VS,FS);this.gl=gl;this.program=program;gl.useProgram(program);
 this.aPos=gl.getAttribLocation(program,'a_position');this.aNormal=gl.getAttribLocation(program,'a_normal');this.aUv=gl.getAttribLocation(program,'a_uv');
 this.uni={};for(const k of ['u_matrix','u_light','u_target','u_forward','u_color','u_alpha','u_spec','u_edge','u_ghost','u_shadowOn','u_view','u_fogColor','u_fog','u_shadowMap','u_texel'])this.uni[k]=gl.getUniformLocation(program,k);
 for(const o of this.objects){if(o.storyOnly)continue;const pts=[],normals=[],uvs=[];for(const f of o.faces)for(let k=1;k<f.pts.length-1;k++)for(const idx of [0,k,k+1]){pts.push(...f.pts[idx]);normals.push(...f.normal);const uv=f.uv?f.uv[idx]:[.5,.5];uvs.push(uv[0],uv[1])}o.count=pts.length/3;for(const [key,data] of [['buffer',pts],['nbuffer',normals],['ubuffer',uvs]]){o[key]=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o[key]);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW)}}
 this.shadowOn=false;try{const sp=link(SVS,SFS);this.sProgram=sp;this.saPos=gl.getAttribLocation(sp,'a_position');this.suLight=gl.getUniformLocation(sp,'u_light');this.shadowSize=2048;const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,this.shadowSize,this.shadowSize,0,gl.RGBA,gl.UNSIGNED_BYTE,null);for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.NEAREST],[gl.TEXTURE_MAG_FILTER,gl.NEAREST],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);const rb=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,this.shadowSize,this.shadowSize);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Shadow framebuffer incomplete');gl.bindFramebuffer(gl.FRAMEBUFFER,null);this.shadowTex=tex;this.shadowFb=fb;this.lightMatrix=this.computeLight();this.shadowOn=true;this.shadowDirty=true}catch(err){this.shadowOn=false;gl.bindFramebuffer(gl.FRAMEBUFFER,null)}
 gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);this.mode='webgl';onMode(this.shadowOn?'WebGL · lit 3D campus':'WebGL · 3D campus')}catch(e){if(gl){const replacement=document.createElement('canvas');replacement.id=this.canvas.id;replacement.tabIndex=0;replacement.setAttribute('aria-label',this.canvas.getAttribute('aria-label'));this.canvas.replaceWith(replacement);this.canvas=replacement}this.ctx=this.canvas.getContext('2d',{alpha:false});this.mode='canvas';onMode('Canvas · simplified 3D')}}
 computeLight(){const Ld=LIGHT,rx=norm(cross([0,1,0],Ld)),uy=cross(Ld,rx),mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(const o of this.objects){if(o.shadow||o.storyOnly)continue;for(const f of o.faces)for(const p of f.pts){const q=[dot(p,rx),dot(p,uy),dot(p,Ld)];for(let i=0;i<3;i++){if(q[i]<mn[i])mn[i]=q[i];if(q[i]>mx[i])mx[i]=q[i]}}}const sx=2/(mx[0]-mn[0]),sy=2/(mx[1]-mn[1]),dz=mx[2]-mn[2],sz=-2/dz,tx=-1-sx*mn[0],ty=-1-sy*mn[1],tz=1+2*mn[2]/dz;return new Float32Array([sx*rx[0],sy*uy[0],sz*Ld[0],0,sx*rx[1],sy*uy[1],sz*Ld[1],0,sx*rx[2],sy*uy[2],sz*Ld[2],0,tx,ty,tz,1])}
 events(){let down=null;this.canvas.addEventListener('pointerdown',e=>{if(this.story)return;down={x:e.clientX,y:e.clientY,yaw:this.orbit.yaw,pitch:this.orbit.pitch};this.moved=false;if(e.pointerType!=='touch')this.canvas.setPointerCapture(e.pointerId)});this.canvas.addEventListener('pointermove',e=>{if(this.story||!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(e.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx)*1.25)return;if(Math.abs(dx)+Math.abs(dy)>6)this.moved=true;if(this.moved){this.orbit.yaw=down.yaw+dx*.004;this.orbit.pitch=Math.max(-.23,Math.min(.35,down.pitch+dy*.003));this.dirty=true}});const release=e=>{if(this.story){down=null;return}if(down&&!this.moved){const rect=this.canvas.getBoundingClientRect();this.pick(e.clientX-rect.left,e.clientY-rect.top)}down=null};this.canvas.addEventListener('pointerup',release);this.canvas.addEventListener('pointercancel',()=>down=null);this.canvas.addEventListener('lostpointercapture',()=>down=null);this.canvas.addEventListener('keydown',e=>{if(this.story)return;let used=true;if(e.key==='ArrowLeft')this.orbit.yaw-=.09;else if(e.key==='ArrowRight')this.orbit.yaw+=.09;else if(e.key==='ArrowUp')this.orbit.pitch=Math.min(.35,this.orbit.pitch+.06);else if(e.key==='ArrowDown')this.orbit.pitch=Math.max(-.23,this.orbit.pitch-.06);else if(e.key==='+'||e.key==='=')this.orbit.zoom=Math.max(.65,this.orbit.zoom-.08);else if(e.key==='-')this.orbit.zoom=Math.min(1.4,this.orbit.zoom+.08);else if(e.key==='0')this.reset();else used=false;if(used){e.preventDefault();this.dirty=true}});new ResizeObserver(()=>this.resize()).observe(this.canvas.parentElement);this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();const old=this.canvas,replacement=document.createElement('canvas');replacement.id=old.id;replacement.tabIndex=0;replacement.setAttribute('aria-label',old.getAttribute('aria-label'));old.replaceWith(replacement);this.canvas=replacement;this.gl=null;this.ctx=replacement.getContext('2d',{alpha:false});this.mode='canvas';this.onMode('Canvas · simplified 3D');this.events();this.resize();this.dirty=true})}
 resize(){const rect=this.canvas.parentElement.getBoundingClientRect();this.width=Math.max(1,rect.width);this.height=Math.max(1,rect.height);this.dpr=Math.min(window.devicePixelRatio||1,2);const q=this.story?this.quality:1;this.canvas.width=Math.round(this.width*this.dpr*q);this.canvas.height=Math.round(this.height*this.dpr*q);this.dirty=true}
 setState(chapter,selected,open){this.shadowDirty=true;this.chapter=chapter;this.selected=selected;this.open=open;const cam=this.seq!=null?SEQ[this.seq].cam:CAMERAS[chapter];this.targetCamera={...cam,target:[...cam.target]};this.dirty=true}
 setSeq(step){this.shadowDirty=true;this.seq=step;const cam=step!=null?SEQ[step].cam:CAMERAS[this.chapter];this.targetCamera={...cam,target:[...cam.target]};this.orbit={yaw:0,pitch:0,zoom:1};this.dirty=true}
 reset(){this.orbit={yaw:0,pitch:0,zoom:1};this.dirty=true}
 basis(){const yaw=this.camera.yaw+this.orbit.yaw,pitch=this.camera.pitch+this.orbit.pitch;this.right=[Math.cos(yaw),0,-Math.sin(yaw)];this.up=[-Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),-Math.cos(yaw)*Math.sin(pitch)];this.forward=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];const mobile=this.width<761&&this.height>this.width*.5;this.scale=Math.min(this.width/(this.camera.span*(mobile?.96:1)),this.height/(this.camera.span*(mobile?.49:.62)))/this.orbit.zoom;this.cx=this.width*(mobile?.51:this.open?.48:.61);this.cy=this.height*(mobile?.54:.57);this.renderTarget=this.camera.target}
 project(p){const a=sub(p,this.renderTarget);return{x:this.cx+dot(a,this.right)*this.scale,y:this.cy-dot(a,this.up)*this.scale,z:dot(a,this.forward)}}
 style(o){if(o.storyOnly)return{visible:false};if(this.seq!=null)return this.seqStyle(o);let visible=true,opacity=1;const c=this.chapter;if(o.shadow)return{visible:!this.shadowOn,color:[.68,.72,.69],opacity:o.opacity};if(o.future||o.campus){if(![0,6].includes(c))return{visible:false};return o.campus?{visible:true,color:[.94,.945,.945],opacity:1}:{visible:true,color:[.86,.88,.87],opacity:.08,ghost:true}}const active=this.isActive(o);if(o.terrain&&c===2&&o.color[0]<.85){}if(o.trench){visible=c!==2&&c!==4;opacity=.7}if(o.build>=3&&c===1)visible=active;if(o.build>=3&&c===2)visible=active||o.scope==='structure-enclosure'&&!o.roof&&!o.cut;if(o.roof||o.cut)visible=[0,6].includes(c)||o.roof&&this.selected==='hvac';if(o.trenchWall&&[2,4].includes(c))visible=false;if(o.hvac&&[2,3,4,5].includes(c)&&this.selected!=='hvac')visible=false;if(o.planning)visible=c===1||this.selected==='planning-design';if(o.ghost)visible=c===1;if(o.expansion)visible=c===0||c===6||this.selected==='expansion';if(o.tree&&this.width<761){}if(o.fence){opacity=.16}
 let color=active?o.color:o.terrain?[.94,.945,.945]:o.flat?[.84,.85,.85]:o.tree?[.75,.77,.77]:[.80,.82,.82];if(o.ghost){color=[.68,.71,.71];opacity=.12}if(o.scope==='context'&&!o.shadow&&!o.terrain&&!o.flat&&!o.tree)color=[.81,.83,.83];return{visible,color,opacity,ghost:!!o.ghost};}
 // Build sequence: completed scopes are transparent, the current scope is in colour, later scopes are not yet built.
 seqStyle(o){if(o.shadow)return{visible:!this.shadowOn,color:[.68,.72,.69],opacity:o.opacity};if(o.future||o.campus)return{visible:false};if(o.scope==='context')return{visible:true,color:o.terrain?[.94,.945,.945]:o.flat?[.84,.85,.85]:o.tree?[.75,.77,.77]:[.81,.83,.83],opacity:1};const step=SEQ[this.seq];if(o.trench)return{visible:step.id==='earthworks',color:o.color,opacity:.8};if(o.seqIndex==null)return{visible:false};if(o.seqIndex<this.seq)return{visible:true,color:[.70,.75,.73],opacity:.06,ghost:true};if(o.seqIndex===this.seq)return{visible:true,color:o.color,opacity:o.fence?.3:1};return{visible:false}}
 isActive(o){if(this.selected==='power')return['energy-sources','generation','powerlines','substations','power-skids'].includes(o.scope);if(this.selected==='interface')return['utilities','electrical'].includes(o.scope);if(this.selected==='hv-testing')return o.scope==='hv-testing'||o.scope==='substations'&&Math.hypot(o.center[0]+28,o.center[2]-9)<4.5;return o.scope===this.selected}
 frame(ts){if(document.hidden){this._ts=null;requestAnimationFrame(this.frame);return}if(this.story){this.storyTick(ts);requestAnimationFrame(this.frame);return}this._ts=null;let moving=false;const lerp=(a,b)=>a+(b-a)*(this.reduced?1:.095);for(const k of ['yaw','pitch','span']){if(Math.abs(this.camera[k]-this.targetCamera[k])>.001){this.camera[k]=lerp(this.camera[k],this.targetCamera[k]);moving=true}}this.camera.target=this.camera.target.map((v,i)=>{const next=lerp(v,this.targetCamera.target[i]);if(Math.abs(next-v)>.001)moving=true;return next});if(this.dirty||moving){this.basis();this.mode==='webgl'?this.drawGL():this.drawCanvas();this.drawLabels?.();this.dirty=false}requestAnimationFrame(this.frame)}
 drawGL(){const g=this.gl,draws=[];for(const o of this.objects){const st=this.style(o);if(st.visible)draws.push([o,st])}
 if(this.shadowOn&&this.shadowDirty){g.useProgram(this.sProgram);g.bindFramebuffer(g.FRAMEBUFFER,this.shadowFb);g.viewport(0,0,this.shadowSize,this.shadowSize);g.clearColor(1,1,1,1);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);g.disable(g.BLEND);g.depthMask(true);g.uniformMatrix4fv(this.suLight,false,this.lightMatrix);if(this.aNormal>=0)g.disableVertexAttribArray(this.aNormal);if(this.aUv>=0)g.disableVertexAttribArray(this.aUv);g.enableVertexAttribArray(this.saPos);for(const [o,st] of draws){if(o.terrain||o.flat||o.shadow||st.opacity<.95||st.ghost)continue;g.bindBuffer(g.ARRAY_BUFFER,o.buffer);g.vertexAttribPointer(this.saPos,3,g.FLOAT,false,0,0);g.drawArrays(g.TRIANGLES,0,o.count)}g.bindFramebuffer(g.FRAMEBUFFER,null);g.enable(g.BLEND);this.shadowDirty=false}
 g.useProgram(this.program);g.viewport(0,0,this.canvas.width,this.canvas.height);g.clearColor(0,0,0,0);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);const sx=2*this.scale/this.width,sy=2*this.scale/this.height,depth=.003;const r=this.right,u=this.up,f=this.forward,t=this.renderTarget;const m=new Float32Array([r[0]*sx,u[0]*sy,-f[0]*depth,0,r[1]*sx,u[1]*sy,-f[1]*depth,0,r[2]*sx,u[2]*sy,-f[2]*depth,0,2*this.cx/this.width-1-dot(t,r)*sx,1-2*this.cy/this.height-dot(t,u)*sy,dot(t,f)*depth,1]);
 const U=this.uni;g.uniformMatrix4fv(U.u_matrix,false,m);g.uniformMatrix4fv(U.u_light,false,this.lightMatrix||new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]));g.uniform3fv(U.u_target,t);g.uniform3fv(U.u_forward,f);g.uniform3fv(U.u_view,f);g.uniform3fv(U.u_fogColor,[.953,.961,.949]);g.uniform2fv(U.u_fog,[30,150]);g.uniform1f(U.u_shadowOn,this.shadowOn?1:0);g.uniform1f(U.u_texel,1.25/(this.shadowSize||2048));g.activeTexture(g.TEXTURE0);if(this.shadowTex)g.bindTexture(g.TEXTURE_2D,this.shadowTex);g.uniform1i(U.u_shadowMap,0);
 g.enableVertexAttribArray(this.aPos);g.enableVertexAttribArray(this.aNormal);g.enableVertexAttribArray(this.aUv);
 for(const pass of [0,1])for(const [o,st] of draws){const tr=st.opacity<.95||!!st.ghost;if((pass===1)!==tr)continue;g.uniform3fv(U.u_color,st.color);g.uniform1f(U.u_alpha,st.opacity);g.uniform1f(U.u_spec,o.spec||0);g.uniform1f(U.u_edge,o.edge||0);g.uniform1f(U.u_ghost,st.ghost?1:0);g.depthMask(!tr);g.bindBuffer(g.ARRAY_BUFFER,o.buffer);g.vertexAttribPointer(this.aPos,3,g.FLOAT,false,0,0);g.bindBuffer(g.ARRAY_BUFFER,o.nbuffer);g.vertexAttribPointer(this.aNormal,3,g.FLOAT,false,0,0);g.bindBuffer(g.ARRAY_BUFFER,o.ubuffer);g.vertexAttribPointer(this.aUv,2,g.FLOAT,false,0,0);g.drawArrays(g.TRIANGLES,0,o.count)}g.depthMask(true)}
 drawCanvas(){const c=this.ctx,w=this.width,h=this.height;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#f8faf9';c.fillRect(0,0,w,h);const faces=[];for(const o of this.objects){const s=this.style(o);if(!s.visible)continue;for(const f of o.faces){if(dot(f.normal,this.forward)<-.02)continue;const pts=f.pts.map(p=>this.project(p));if(pts.every(p=>p.x<-20)||pts.every(p=>p.x>w+20)||pts.every(p=>p.y<-20)||pts.every(p=>p.y>h+20))continue;const depth=pts.reduce((n,p)=>n+p.z,0)/pts.length;const light=.69+Math.max(0,dot(f.normal,LIGHT))*.27;const color=s.color.map(v=>Math.round(Math.min(1,v*light)*255));faces.push({pts,depth,color,opacity:s.opacity,base:o.terrain?0:o.flat||o.shadow?1:2,flat:o.flat||o.shadow||o.terrain,active:this.isActive(o)})}}faces.sort((a,b)=>a.base-b.base||a.depth-b.depth);for(const f of faces){c.beginPath();c.moveTo(f.pts[0].x,f.pts[0].y);for(let k=1;k<f.pts.length;k++)c.lineTo(f.pts[k].x,f.pts[k].y);c.closePath();c.globalAlpha=f.opacity;c.fillStyle=`rgb(${f.color.join(',')})`;c.fill();if(!f.flat){c.strokeStyle=f.active?'rgba(21,66,40,.16)':'rgba(76,99,80,.12)';c.lineWidth=.45;c.stroke()}}c.globalAlpha=1}
 pick(x,y){let closest=null;for(const [id,p]of Object.entries(ANCHORS)){if(!this.selectable?.includes(id))continue;const q=this.project(p),d=Math.hypot(q.x-x,q.y-y);if(d<48&&(!closest||d<closest.d))closest={id,d}}if(closest)this.onSelect(closest.id)}
}

/* =====================================================================================
   STORY MODE: dark line-art presentation renderer with animation
   (ANIMATION-CONTRACT sections 2, 5 and 6; STORY-CONTRACT sections 4, 5 and 8).
   Everything below is additive. Explore mode above is unchanged.

   API (scene = CampusScene)
     scene.setMode('story' | 'explore')   story never orbits, picks or draws labels
     scene.setStoryProgress(p)            p from 0 to 13 (step index, fractional between steps).
                                          p from -1 to 0 is an optional pre-roll in which the first step builds up from an empty stage.
     scene.exportPNG({width=3840, transparent=true, ground=!transparent, center=false})  -> Promise<Blob>
                                          the CURRENT frame (same p, same effective time, parts, reveals and flows included);
                                          transparent = the model only (no ground, no background); opaque = a faithful picture of the stage
     scene.exportGLB({ground=false})      -> Promise<Blob>  glTF 2.0 binary, metres, Y up, in the BASE POSE: parts at animPose(p, 0), reveals as
                                          revealOf(id, p) gives them (an object that is less than half built is left out, move and scale are applied,
                                          a wipe is ignored), no flows; the same bytes whatever the clock says. One mesh per discipline in its colour,
                                          everything built earlier in one dark grey 'done' mesh, the dimmed energy region ('energy-region') and the
                                          see-through structure shell ('structure-glass')
     scene.storyView = {cx, cy}           default where the camera target lands on screen for a 16:9 window (0.35, 0.5). A camera's own view: [cx, cy]
                                          in model.js overrides it and views blend between cameras with the camera smoothstep. Other window shapes follow
                                          the CSS layout: cx scales with the width left of the text column, the field of view widens on narrower
                                          windows so the same span stays in view, and stacked layouts (portrait, 640 px or less) centre it.
     scene.storyInfo()                    counts and draw lists, for checks

   Time and motion (contract section 2)
     Two clocks. Story progress p drives build-out (reveals, p-keyed parts, flow fade, camera, style blend): every frame is a pure function of p.
     scene.clock (seconds) drives the repeating cycles (rigs, rotors, tilt, movers, crews, flow pulses, the modular breathing). Effective time
     tEff = reduced ? 0 : t, so a frame is a pure function of (p, tEff) and the viewport. The settled pose is tEff = 0.
     scene.setClock({t, frozen, rate}) | scene.setClock(null) | scene.getClock()   test hooks; a frozen clock draws only when something else changes
     scene.setReducedMotion(on)           also kept as the plain property scene.reduced
     scene.renderNow()                    synchronous draw of the current (p, tEff) at full resolution; returns {p, t, reduced, calls, triangles}
     scene.animating()                    true when the loop would draw by itself right now
     scene.animInfo()                     counters for checks (parts, reveals, flows, ranges, calls, triangles, frames, lastFrameMs, prepareMs, ...)
     The loop draws only when dirty or animating (visible tab, motion on, clock running, something visible that moves). While document.hidden is
     true nothing is drawn and the clock does not advance; one frame is drawn when the tab comes back. A running clock advances by at most 50 ms
     per frame. The drawing buffer is lowered in steps of 0.15 (down to 0.6) when the median of 30 free running frames takes over 24 ms; never in
     renderNow or in exports.

   Tags read from model.js: STORY_STEPS, STORY_CAMERAS, ANIM, animPose, revealOf, flowState, flowOffset, and per object o.story =
     {region 'energy'|'campus', appear '<stepId>'|'always', disc, order 0..1, hideFrom '<stepId>', reprise ['<stepId>'],
      modular, structure, underground, clad}  and the optional extras
     {part: '<partId>'}      the object is the geometry of that rigid part and moves with its world matrix (rest pose geometry)
     {reveal: '<revealId>'}  the object is built up by that reveal (move, scale and a wipe by world position, a fade); it does not stagger or fade in with its group
     {look: 'solid'|'wire'}  solid: crease and silhouette edges (dark fill in white focus). wire: no edges, bright fill (thin members).
                             Absent: the old rule (noEdge and not a thick pipe is a wire).
     {silhouette: true}  draw as a dark silhouette in the done tone even in its own step (the telecom pole line, C29)
     {grid: true}        scenery context object drawn as faint ground lines toned from its hex (the ground grid)
     {rise: metres <= 1} {slide: [x,y,z]}  start offset the object travels from when it appears
   Objects without o.story are not drawn. Objects without a step id for appear are drawn from the start. Underground objects with no
   hideFrom are hidden from the structure step. o.faces, o.hex, o.flat, o.terrain, o.noEdge and o.tree are read as before.

   How it works: every object that carries o.story is merged into one vertex buffer (36 bytes per vertex, never rewritten) and grouped with the
   objects that share a style (appear step, hide step, reprise steps, discipline, region and flags). A group is a list of ranges: one for its
   plain objects, one per part and one per reveal. One draw call per range (adjacent ranges that are at rest are drawn together). A part range
   is drawn with the part's world matrix (a uniform), a reveal range with the matrix, the wipe and the alpha of its reveal, so animation never
   touches the buffer. Per-object stagger and rise are per-vertex attributes evaluated in the vertex shader. Edges come from the geometry: per
   object, polygon edges that are open or creases (over 38 degrees) are flagged once at start-up and drawn by distance in the fragment shader,
   so lines have constant screen width; smooth facets get a rim line where they turn away from the eye. Flows are drawn by their own program
   from static polylines and a pulse phase in a uniform.

   Visual states of a group at an integer step s:
     hidden  not yet appeared, or hidden from a later step
     focus   appears in s, re-highlighted in s, or modular in the modular step: white disciplines are LINE ART (near-black fill, bright full-alpha
             crease edges, thin parts lifted toward grey so they stay visible); coloured disciplines keep the coloured fill and glow with edges
             a little lighter than the fill (a little bolder at telecom and white space, where the scope is small on the stage). Thin members
             (look wire) keep the bright fill in every focus. In the modular step the focus style breathes with the clock.
     done    built earlier: dark silhouette, faint edges (alpha 0.22)
     dim     energy region from the campus substation step on: half-brightness silhouette
     glass   structure after its own step: alpha 0.12, front faces only (culled in the shader by face normal against the eye), faint edges
             (alpha 0.32, and 0.16 from the telecom step on so the small scopes are the brightest thing on the stage)
   Underground services are drawn through the ground in their own step and fade out under the slab pour, and again, fainter, when their trade is re-highlighted.
   Between steps k and k+1 every style is blended by t = smoothstep(fract(p)); appearing objects fade in and rise at most 1 m
   (staggered by o.story.order), vanishing objects fade out. Draw order: ground, opaque groups, translucent groups (ground and lines first, then solids far to near,
   see-through shells such as the structure last), flows, then underground services seen through the ground, then underground flows. A solid that is fading and still
   mostly opaque first writes its own depth (colour masked off, screen-door dither between alpha 0.4 and 0.6), so it hides its own far side exactly as it does in the
   opaque pass and nothing changes when a group joins or leaves that pass at the ends of a move. Face winding is never trusted: normals are rebuilt and repaired.
   Small departures from the contract text, all on the safe side (each is a constant near the top of this section):
     - the pulse core is never narrower than 3.6 px (white power flows) or 5 px (coloured flows, which have to read on a line of their own colour) at 900 px high (contract: 2), so it is at least 2.5 times the line it travels on; the white halo is kept faint so the pulses are not counted as flat white blobs; a pulse also eases in and out over the last 2 m of its path;
     - done, dim and glass edges are drawn at 0.40 line widths (focus 0.62), between the old uv edges (0.28) and the focus weight;
     - thin facets of the dim energy region are lifted to a faint grey (0.16) so rotor blades and wires keep moving in view; in focus they are lifted to 0.62 as specified;
     - for an inverted wipe (the ground lid) the GLB keeps the object while it is less than half removed;
     - renderNow ends with gl.finish(), so the frame is complete when it returns and a stepped capture leaves no queue of frames behind it (on a slow software GPU such a queue would hold up the next frames for seconds).
   ===================================================================================== */
const STEP_FALLBACK=[['energy','Energy','energy','power'],['grid','High-voltage substation','energy','power'],['transmission','Transmission','transmission','power'],['substation','Campus substation','campus','power'],['civil','Civil works','campus','civil'],['underground','Underground utilities','campus','civil'],['concrete','Concrete','campus','civil'],['structure','Structure','campus','structure'],['electrical','Electrical','campus','electrical'],['mechanical','Mechanical','campus','mechanical'],['modular','Off-site modules','campus','modular'],['telecom','Telecom','campus','telecom'],['whitespace','White space','campus','whitespace'],['next','Next in the conversation','campus','none']].map(([id,header,camera,disc])=>({id,header,camera,disc}));
const STORY_STEPS=Array.isArray(MODEL.STORY_STEPS)&&MODEL.STORY_STEPS.length?MODEL.STORY_STEPS:STEP_FALLBACK;
const NS=STORY_STEPS.length,STEP_IDX=Object.fromEntries(STORY_STEPS.map((s,i)=>[s.id,i]));
const ALWAYS=-99,NEVER=999,STORY_ASPECT=16/9,STORY_STAGE=.70;   /* the framing is authored for a 16:9 window whose text column takes 30 % of the width */
const DIM_FROM=STEP_IDX.substation??3,MOD_STEP=STEP_IDX.modular??-7,UNDER_HIDE=STEP_IDX.structure??7,QUIET_FROM=STEP_IDX.telecom??11,WS_STEP=STEP_IDX.whitespace??12;   /* QUIET_FROM: from the telecom step the structure frame is fainter, so the small scopes are the brightest thing on the stage (C20) */
const hexRGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
/* Bird Mission Critical palette only (contract section 5): Pantone 158 orange, Pantone 185 red, Pantone 349 green, grey 4d4d4f, plus white. */
export const STORY_PALETTE={background:'#0b0d0c',white:'#ffffff',electrical:'#f58025',mechanical:'#e91d2e',telecom:'#00703c',silhouette:'#4d4d4f'};
const DISC_RGB={electrical:hexRGB(STORY_PALETTE.electrical),mechanical:hexRGB(STORY_PALETTE.mechanical),telecom:hexRGB(STORY_PALETTE.telecom)};
const WHITE=[1,1,1],GLOW={electrical:.3,telecom:1,mechanical:.3};   /* telecom green is the darkest brand colour and is drawn at full brightness; orange and red need only a touch */
const discRGB=d=>DISC_RGB[d]||WHITE;
const LOOK={bg:hexRGB(STORY_PALETTE.background),ground:[.049,.057,.053],sil:[.19,.21,.20],silEdge:[.82,.84,.83],silEdgeA:.22,dim:.5,thin:1,glass:[.93,.95,.94],glassA:.12,glassEdgeA:.32,glassEdgeQuiet:.16,thruA:.5,
 art:[.075,.085,.08],      /* line art fill of the white disciplines (contract 6.2), times the lit factor 0.5 + 0.5 lambert */
 dimLift:.16,              /* thin facets of the dim energy region (rotor blades, wires) are lifted to this grey so they stay seen */
 hw:.62,hwQuiet:.40,       /* edge half width in lineW units: focus, and done, dim and glass (which were drawn at 0.28 with the old uv edges) */
 lift:.62};                /* thin facets (under 5 px across) are lifted toward this grey in line art */
/* Focus line weight (a multiplier on the edge width): telecom is light work and white space is small on the stage, so their lines are drawn a little bolder. */
const LINE_W={telecom:1.8},LINE_W_WHITESPACE=1.45;
const CREASE_COS=Math.cos(38*Math.PI/180),SMOOTH_COS=.9995;   /* contract 6.2: creases over 38 degrees, smooth facets bend less but are not coplanar */
const VB=36;                                                    /* bytes per story vertex: position 12, normal and corner 4, edge flags 4, appearance 16 */
const FLOW_BIAS=.45,FLOW_CORE_MIN={white:3.6,colour:5},FLOW_HALO={white:.35,colour:.55},WIPE_FADE=.03;            /* metres toward the eye, minimum core width in px at 900 px high, how soon a wipe edge fades in and out */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)},lerp=(a,b,t)=>a+(b-a)*t,lerp3=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const HALF=[.5,.5],ZERO3=[0,0,0],KIND_RANK={ground:0,line:1,solid:2};

/* Style of a group at integer step s. Pure function of the group description. */
const HIDDEN={vis:false};
function styleFor(g,s){
 if(s<g.a)return HIDDEN;
 const rep=g.rep.includes(s);
 if(s>=g.h&&!rep)return HIDDEN;
 if(g.kind!=='solid'){const c=LOOK.ground.map(v=>v*g.tone);return{vis:true,col:c,a:1,edge:c,ea:0,glow:0,hw:LOOK.hwQuiet,cls:'ground',art:0}}   /* ground and lines: flat very dark grey, no lighting variation of note */
 /* Half-brightness silhouette: the whole energy region once the camera has settled on the campus. */
 if(g.region==='energy'&&s>=DIM_FROM){const k=LOOK.dim;return{vis:true,col:LOOK.sil.map(v=>v*k),a:1,edge:LOOK.silEdge,ea:LOOK.silEdgeA*k,glow:0,hw:LOOK.hwQuiet,cls:'dim',art:LOOK.dimLift}}
 /* story.silhouette (the telecom pole line): a dark silhouette in its own step as well. It is thin and far away, so it keeps the full done tone to stay readable. */
 if(g.silhouette){const k=LOOK.thin;return{vis:true,col:LOOK.sil.map(v=>v*k),a:1,edge:LOOK.silEdge,ea:LOOK.silEdgeA*k,glow:0,hw:LOOK.hwQuiet,cls:'done',art:0}}
 /* Underground services fade out under the slab pour: in the step after their own they stay in the draw list, invisible, so the network dissolves instead of switching to a silhouette that the ground plane hides. */
 if(g.underground&&!rep&&s===g.a+1)return{vis:true,col:LOOK.sil,a:0,edge:LOOK.silEdge,ea:0,glow:0,hw:LOOK.hwQuiet,through:true,cls:'done',art:0};
 const focus=s===g.a||rep||(g.modular&&s===MOD_STEP);
 if(!focus&&g.structure&&s>g.a)return{vis:true,col:LOOK.glass,a:LOOK.glassA,edge:WHITE,ea:s>=QUIET_FROM?LOOK.glassEdgeQuiet:LOOK.glassEdgeA,glow:0,hw:LOOK.hwQuiet,cls:'glass',art:0};
 if(!focus)return{vis:true,col:LOOK.sil,a:1,edge:LOOK.silEdge,ea:LOOK.silEdgeA,glow:0,hw:LOOK.hwQuiet,cls:'done',art:0};
 const sd=STORY_STEPS[s]?.disc,d=sd==='whitespace'?g.disc:sd,base=discRGB(d),white=base===WHITE;
 /* White disciplines are line art: a near-black fill and bright edges (contract 6.2). Thin members (no edges) keep the bright fill. */
 const art=white&&g.edgeOn,lw=s===WS_STEP?LINE_W_WHITESPACE:LINE_W[d]||1;
 const st={vis:true,col:art?LOOK.art:base,a:1,edge:white?WHITE:base.map(v=>v+(1-v)*.28),ea:1,glow:art?0:GLOW[d]||0,hw:LOOK.hw*lw,cls:'focus',art:art?LOOK.lift:0};
 if(g.clad){st.col=st.col.map(v=>v*.82);st.ea=.6}
 /* Underground services are drawn through the ground in their own step (the trenches are only 2 m wide and 2.2 m deep, so at the fixed camera the ground plane would hide most of the network) and again, fainter, when their trade is re-highlighted. */
 if(g.underground&&(rep||s===g.a)){st.a=rep?LOOK.thruA:.9;st.ea=rep?.55:.9;st.through=true}
 return st;
}
/* Blend of a group's style at progress p, as the vertex shader does it, for one object. */
function blendObject(it,fr,sv){
 let tt=fr.t,off=ZERO3;
 if(it.appearing){const l=clamp((fr.f-sv.order*.55)/.45,0,1);tt=l*l*(3-2*l);off=[sv.off[0]*(1-tt),sv.off[1]*(1-tt),sv.off[2]*(1-tt)]}
 const A=it.A,B=it.B;
 return{a:lerp(A.a,B.a,tt),col:lerp3(A.col,B.col,tt),edge:lerp3(A.edge,B.edge,tt),ea:lerp(A.ea,B.ea,tt),glow:lerp(A.glow,B.glow,tt),off,tt};
}

/* ---------- matrices (column-major, as WebGL expects) ---------- */
function m4mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o}
function viewMatrix(eye,target){const f=norm(sub(target,eye)),r=norm(cross(f,[0,1,0])),u=cross(r,f);return new Float32Array([r[0],u[0],-f[0],0,r[1],u[1],-f[1],0,r[2],u[2],-f[2],0,-dot(r,eye),-dot(u,eye),dot(f,eye),1])}
/* Perspective with a lens shift: the camera target lands at (nx,ny) in clip space, so the model can sit left of centre. */
function projMatrix(fovy,aspect,near,far,nx,ny){const f=1/Math.tan(fovy/2);return new Float32Array([f/aspect,0,0,0,0,f,0,0,-nx,-ny,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0])}
function projectPt(m,p){return[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14],m[3]*p[0]+m[7]*p[1]+m[11]*p[2]+m[15]]}
const IDENT4=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),IDENT3=new Float32Array([1,0,0,0,1,0,0,0,1]);
function isIdent(m){for(let i=0;i<16;i++)if(Math.abs(m[i]-IDENT4[i])>1e-6)return false;return true}
/* Normal matrix of a part or reveal matrix: the cofactors of the upper 3 x 3 (columns b x c, c x a, a x b); the shader normalises. */
const NM=new Float32Array(9);
function nmatOf(m){const ax=m[0],ay=m[1],az=m[2],bx=m[4],by=m[5],bz=m[6],cx=m[8],cy=m[9],cz=m[10];
 NM[0]=by*cz-bz*cy;NM[1]=bz*cx-bx*cz;NM[2]=bx*cy-by*cx;NM[3]=cy*az-cz*ay;NM[4]=cz*ax-cx*az;NM[5]=cx*ay-cy*ax;NM[6]=ay*bz-az*by;NM[7]=az*bx-ax*bz;NM[8]=ax*by-ay*bx;return NM}
const applyM=(m,p)=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
const applyN=(m,n)=>{const c=nmatOf(m),x=c[0]*n[0]+c[3]*n[1]+c[6]*n[2],y=c[1]*n[0]+c[4]*n[1]+c[7]*n[2],z=c[2]*n[0]+c[5]*n[1]+c[8]*n[2],l=Math.hypot(x,y,z)||1;return[x/l,y/l,z/l]};

/* ---------- cameras ---------- */
/* Orbit-style blend: target moves linearly, the eye direction turns by yaw and pitch, distance changes geometrically; the lens shift view blends linearly. */
function lerpCam(A,B,t,dv){
 if(A===B||t<=0)return A;if(t>=1)return B;
 const tg=lerp3(A.target,B.target,t),oa=sub(A.eye,A.target),ob=sub(B.eye,B.target),da=Math.hypot(...oa)||1,db=Math.hypot(...ob)||1;
 const ya=Math.atan2(oa[0],oa[2]),yb=Math.atan2(ob[0],ob[2]);let dy=yb-ya;dy-=Math.round(dy/(2*Math.PI))*2*Math.PI;
 const pa=Math.asin(clamp(oa[1]/da,-1,1)),pb=Math.asin(clamp(ob[1]/db,-1,1)),y=ya+dy*t,pt=lerp(pa,pb,t),d=da*Math.pow(db/da,t);
 const va=A.view||dv||null,vb=B.view||dv||null;
 return{target:tg,eye:add(tg,[Math.sin(y)*Math.cos(pt)*d,Math.sin(pt)*d,Math.cos(y)*Math.cos(pt)*d]),fov:lerp(A.fov||34,B.fov||34,t),view:va&&vb?[lerp(va[0],vb[0],t),lerp(va[1],vb[1],t)]:null};
}
/* Used only when model.js has no STORY_CAMERAS: frame each region from the south east. */
function autoCameras(groups){
 const box=pred=>{const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];let n=0;for(const g of groups){if(g.kind!=='solid'||!pred(g))continue;for(const o of g.objs){for(let i=0;i<3;i++){mn[i]=Math.min(mn[i],o._sv.bb[0][i]);mx[i]=Math.max(mx[i],o._sv.bb[1][i])}n++}}return n?{mn,mx}:null};
 const dir=norm([.55,.62,.85]),fit=(b,fov)=>{if(!b)return{eye:[120,90,160],target:[0,0,0],fov};const c=mul(add(b.mn,b.mx),.5),r=Math.hypot(...sub(b.mx,b.mn))*.5,t=[c[0],Math.max(0,c[1]*.4),c[2]];return{target:t,eye:add(t,mul(dir,r/Math.sin(fov*Math.PI/360)*1.15)),fov}};
 const E=fit(box(g=>g.region==='energy'),34),C=fit(box(g=>g.region==='campus'),34);
 return{energy:E,campus:C,transmission:lerpCam(E,C,.5)};
}
function normaliseCam(c){const v=Array.isArray(c.view)&&c.view.length>=2&&Number.isFinite(+c.view[0])&&Number.isFinite(+c.view[1])?[+c.view[0],+c.view[1]]:null;return{eye:[...c.eye],target:[...c.target],fov:c.fov||34,view:v}}

/* ---------- geometry preparation ---------- */
/* Outward face normals and edge flags, in one pass over the object (never across objects).
   Normals: winding is not trusted. Newell normals that follow the model's stored normal, then, for small watertight solids only, a hull test per face
   (a hull face has every other vertex on its inner side) that repairs inside-out winding. Open surfaces such as ground planes or bags of loose bars keep
   the model's normals, because the hull test is unsound there.
   Edges (only when wanted): a polygon edge is flagged when it is an open boundary (one face), non-manifold (three or more faces) or a crease (the angle between
   the two faces is over 38 degrees, measured between the winding normals corrected for the direction each face walks the shared edge, so a face wound the
   other way does not draw a false line). A face whose neighbours bend by less than 38 degrees but are not coplanar is a smooth facet (a facet of a curved
   shape) and also gets a rim line where it turns away from the eye. Faces that are coplanar draw no line, so the 5 m tiles of long quads stay clean. */
const ekey=p=>Math.round(p[0]*1e4)+','+Math.round(p[1]*1e4)+','+Math.round(p[2]*1e4);
function analyse(F,wantEdges){
 const nF=F.length,eo=new Int32Array(nF+1);let tot=0;
 for(let i=0;i<nF;i++){eo[i]=tot;tot+=F[i].pts.length}eo[nF]=tot;
 const nw=new Float64Array(nF*3),fn=new Array(nF);
 for(let i=0;i<nF;i++){const f=F[i],P=f.pts,nP=P.length;let x=0,y=0,z=0;
  for(let j=0;j<nP;j++){const a=P[j],b=P[j+1===nP?0:j+1];x+=(a[1]-b[1])*(a[2]+b[2]);y+=(a[2]-b[2])*(a[0]+b[0]);z+=(a[0]-b[0])*(a[1]+b[1])}
  const l=Math.hypot(x,y,z),hint=f.normal&&Math.hypot(f.normal[0],f.normal[1],f.normal[2])>.5?f.normal:null;let n;
  if(l>1e-9){n=[x/l,y/l,z/l];nw[i*3]=n[0];nw[i*3+1]=n[1];nw[i*3+2]=n[2]}else n=hint||[0,1,0];
  if(hint&&n[0]*hint[0]+n[1]*hint[1]+n[2]*hint[2]<0)n=[-n[0],-n[1],-n[2]];
  fn[i]=n}
 const hull=nF>=4&&tot<=400;
 if(!wantEdges&&!hull)return{fn,ef:null,sm:null,eo};
 /* shared vertices, then edges by vertex pair */
 const ids=new Int32Array(tot),idOf=new Map(),uniq=[];let nV=0;
 for(let i=0;i<nF;i++){const P=F[i].pts;for(let j=0;j<P.length;j++){const k=ekey(P[j]);let id=idOf.get(k);if(id===undefined){id=nV++;idOf.set(k,id);uniq.push(P[j])}ids[eo[i]+j]=id}}
 const K=nV+1,emap=new Map(),e1=new Int32Array(tot),e2=new Int32Array(tot),d1=new Int8Array(tot),d2=new Int8Array(tot),cnt=new Uint8Array(tot),ef=new Uint8Array(tot),sm=new Uint8Array(nF);let ne=0;
 for(let i=0;i<nF;i++){const nP=F[i].pts.length,o=eo[i];
  for(let j=0;j<nP;j++){const a=ids[o+j],b=ids[o+(j+1===nP?0:j+1)],lo=a<b?a:b,hi=a<b?b:a,key=lo*K+hi,dir=a<b?1:-1,slot=o+j;
   let id=emap.get(key);
   if(id===undefined){id=ne++;emap.set(key,id);e1[id]=slot;d1[id]=dir;cnt[id]=1}
   else{const c=cnt[id];if(c===1){e2[id]=slot;d2[id]=dir}else ef[slot]=1;if(c<255)cnt[id]=c+1}}}
 let closed=true;for(let id=0;id<ne;id++)if(cnt[id]!==2){closed=false;break}
 if(hull&&closed){
  for(let i=0;i<nF;i++){const n=fn[i],p0=F[i].pts[0];let pos=0,neg=0;
   for(const q of uniq){const d=n[0]*(q[0]-p0[0])+n[1]*(q[1]-p0[1])+n[2]*(q[2]-p0[2]);if(d>1e-6)pos++;else if(d<-1e-6)neg++;if(pos&&neg)break}
   if(pos&&!neg)fn[i]=[-n[0],-n[1],-n[2]]}}
 if(!wantEdges)return{fn,ef:null,sm:null,eo};
 /* face of each slot, found once */
 const faceOf=new Int32Array(tot);for(let i=0;i<nF;i++)for(let j=eo[i];j<eo[i+1];j++)faceOf[j]=i;
 for(let id=0;id<ne;id++){const c=cnt[id];
  if(c===1)ef[e1[id]]=1;
  else if(c>2){ef[e1[id]]=1;ef[e2[id]]=1}
  else{const i1=faceOf[e1[id]],i2=faceOf[e2[id]],d=(d1[id]===d2[id]?-1:1)*(nw[i1*3]*nw[i2*3]+nw[i1*3+1]*nw[i2*3+1]+nw[i1*3+2]*nw[i2*3+2]);
   if(d<CREASE_COS){ef[e1[id]]=1;ef[e2[id]]=1}else if(d<SMOOTH_COS){sm[i1]=1;sm[i2]=1}}}
 return{fn,ef,sm,eo};
}
/* Does a part move with the clock? Only those keep the loop drawing (a part with only p motion changes when p does). */
function motionT(m){if(!m)return false;if(m.type==='cycle'||m.type==='spin'||m.type==='fn')return true;if(m.type==='sum')return(m.of||[]).some(motionT);return false}
function partT(PARTS,id){let p=PARTS[id],n=0;while(p&&n++<64){if(motionT(p.motion))return true;p=p.parent?PARTS[p.parent]:null}return false}
function prepareStory(scene){
 const T0=performance.now(),warned=new Set(),groups=new Map(),items=[],perStep=new Array(NS+2).fill(0),hasOrder=new Array(NS+2).fill(false);
 const warn=msg=>{if(!warned.has(msg)){warned.add(msg);console.warn('Story: '+msg)}};
 const unknown=id=>{warn('unknown step id "'+id+'"');return NEVER};
 const ANIM=MODEL.ANIM,PARTS=(ANIM&&ANIM.parts)||{},REVS=(ANIM&&ANIM.reveals)||{};
 for(const o of scene.objects){
  const st=o.story;if(!st||o.shadow||!o.faces||!o.faces.length)continue;
  const faces=o.faces.filter(f=>f.pts&&f.pts.length>=3);if(!faces.length)continue;
  const a=(st.appear==null||st.appear==='always')?ALWAYS:(STEP_IDX[st.appear]??unknown(st.appear));
  let h=st.hideFrom!=null?(STEP_IDX[st.hideFrom]??unknown(st.hideFrom)):NEVER;
  if(st.underground&&st.hideFrom==null)h=UNDER_HIDE;
  const rep=(Array.isArray(st.reprise)?st.reprise:[]).map(id=>STEP_IDX[id]).filter(i=>i!=null).sort((x,y)=>x-y);
  const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(const f of faces)for(const p of f.pts)for(let i=0;i<3;i++){if(p[i]<mn[i])mn[i]=p[i];if(p[i]>mx[i])mx[i]=p[i]}
  const region=st.region==='energy'?'energy':'campus';
  const DISCS=['power','civil','structure','electrical','mechanical','telecom','modular','context'],disc=DISCS.includes(st.disc)?st.disc:'context';
  /* Scenery: flat or terrain objects with discipline context. Large, well covered ones are the ground (it fades out at its edge); thin or sparse ones
     (marking lines, trench lids and beds) are lines. Both take their tone from the object's own hex, relative to the ground hex #161918. */
  const ex=mx[0]-mn[0],ez=mx[2]-mn[2];
  let kind='solid',tone=1;
  const gridLines=!!st.grid;   /* story.grid marks the faint ground grid, whatever its geometry */
  if(disc==='context'&&(o.terrain||o.flat||gridLines)){
   let up=0;for(const f of faces){const P=f.pts;let x=0,y=0,z=0;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];x+=(a[1]-b[1])*(a[2]+b[2]);y+=(a[2]-b[2])*(a[0]+b[0]);z+=(a[0]-b[0])*(a[1]+b[1])}const l=Math.hypot(x,y,z);if(l>1e-9&&Math.abs(y)/l>.9)up+=l/2}
   kind=!gridLines&&(o.terrain||(Math.max(ex,ez)>=40&&Math.min(ex,ez)>=8&&up>=.25*ex*ez))?'ground':'line';
   const c=hexRGB(/^#[0-9a-f]{6}$/i.test(o.hex||'')?o.hex:'#161918'),l=.2126*c[0]+.7152*c[1]+.0722*c[2];
   tone=Math.round(clamp(l/.0961,kind==='ground'?.6:.8,kind==='ground'?1.3:2.6)*20)/20;
  }
  const silhouette=!!(st.silhouette||st.dim);
  const structure=!!(st.structure||st.clad||disc==='structure'),modular=!!st.modular,underground=!!st.underground,clad=!!st.clad;
  /* look (contract 3.2): solid draws crease edges, wire draws none. Without the tag, the old rule: a pipe built with noEdge is a wire unless it is thick. */
  let look=st.look==='wire'||st.look==='solid'?st.look:null;
  if(!look){let thickPipe=false;if(o.noEdge&&faces[0].pts.length>=5){const P=faces[0].pts,c=P.reduce((q,p)=>add(q,mul(p,1/P.length)),[0,0,0]);thickPipe=Math.hypot(...sub(P[0],c))>=.9}look=o.noEdge&&!thickPipe?'wire':'solid'}
  const edgeOn=kind==='solid'&&!o.tree&&look==='solid',cull=faces.length>=4;
  let part=null,reveal=null;
  if(st.part){if(PARTS[st.part])part=st.part;else warn('unknown part "'+st.part+'"')}
  if(!part&&st.reveal){if(REVS[st.reveal])reveal=st.reveal;else warn('unknown reveal "'+st.reveal+'"')}
  const key=[a,h,rep.join('.'),disc,region,+structure,+modular,+underground,+clad,kind,+edgeOn,+cull,+silhouette,tone].join('|');
  let g=groups.get(key);if(!g){g={key,a,h,rep,disc,region,structure,modular,underground,clad,kind,edgeOn,cull,silhouette,tone,objs:[]};groups.set(key,g)}
  const height=mx[1]-mn[1],rise=st.rise!=null?clamp(+st.rise||0,0,1):clamp(.35*height+.1,.12,1);
  const off=Array.isArray(st.slide)&&st.slide.length===3?st.slide.map(Number):[0,-rise,0];
  const an=analyse(faces,edgeOn);
  const sv={g,bb:[mn,mx],fn:an.fn,ef:an.ef,sm:an.sm,eo:an.eo,order:0,off:a===ALWAYS?ZERO3:off,seq:0,explicit:st.order!=null,ord:st.order!=null?clamp(+st.order||0,0,1):0,faces,part,reveal};
  if(a>=0&&a<NS){sv.seq=perStep[a]++;if(sv.explicit)hasOrder[a]=true}
  o._sv=sv;g.objs.push(o);items.push(o);
 }
 /* Stagger inside a step: explicit story.order wins; a step with none gets a gentle build-up in model order. */
 for(const o of items){const sv=o._sv,a=sv.g.a;sv.order=a<0||a>=NS?0:hasOrder[a]?sv.ord:(perStep[a]>1?.5*sv.seq/(perStep[a]-1):0)}
 const arr=[...groups.values()].sort((x,y)=>KIND_RANK[x.kind]-KIND_RANK[y.kind]||x.a-y.a||(x.key<y.key?-1:1));
 const rawCams=MODEL.STORY_CAMERAS,cams=rawCams&&rawCams.campus&&rawCams.energy?{energy:normaliseCam(rawCams.energy),campus:normaliseCam(rawCams.campus),transmission:normaliseCam(rawCams.transmission||lerpCam(rawCams.energy,rawCams.campus,.5))}:autoCameras(arr);
 const camOf=s=>cams[STORY_STEPS[clamp(s,0,NS-1)]?.camera]||cams.campus;
 /* Inside each group draw far to near from the camera that frames that group, so alpha blending composes correctly. A group is a list of ranges:
    the plain objects, then one range per part, then one per reveal; each range is sorted far to near and the ranges of a kind far to near. */
 let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9],gmn=[1e9,1e9],gmx=[-1e9,-1e9],cmn=[1e9,1e9,1e9],cmx=[-1e9,-1e9,-1e9],nv=0;const tRanges=[],partIds=new Set(),revealIds=new Set();
 for(const g of arr){
  const eye=(g.region==='energy'?cams.energy:cams.campus).eye,c=[0,0,0];
  for(const o of g.objs){const b=o._sv.bb;o._sv.c=[(b[0][0]+b[1][0])/2,(b[0][1]+b[1][1])/2,(b[0][2]+b[1][2])/2];o._sv.d=Math.hypot(...sub(o._sv.c,eye));for(let i=0;i<3;i++){c[i]+=o._sv.c[i]/g.objs.length;mn[i]=Math.min(mn[i],b[0][i]);mx[i]=Math.max(mx[i],b[1][i]);if(g.kind==='solid'){cmn[i]=Math.min(cmn[i],b[0][i]);cmx[i]=Math.max(cmx[i],b[1][i])}}if(g.kind==='ground'){gmn=[Math.min(gmn[0],b[0][0]),Math.min(gmn[1],b[0][2])];gmx=[Math.max(gmx[0],b[1][0]),Math.max(gmx[1],b[1][2])]}}
  const far=(x,y)=>y._sv.d-x._sv.d,stat=[],pm=new Map(),rm=new Map();
  for(const o of g.objs){const sv=o._sv;if(sv.part){let l=pm.get(sv.part);if(!l)pm.set(sv.part,l=[]);l.push(o)}else if(sv.reveal){let l=rm.get(sv.reveal);if(!l)rm.set(sv.reveal,l=[]);l.push(o)}else stat.push(o)}
  g.ranges=[];if(stat.length)g.ranges.push({kind:'static',id:'',objs:stat.sort(far)});
  for(const [m,kind] of [[pm,'part'],[rm,'reveal']]){const L=[...m.entries()].map(([id,l])=>({kind,id,objs:l.sort(far),d:l.reduce((s,o)=>s+o._sv.d,0)/l.length})).sort((x,y)=>y.d-x.d||(x.id<y.id?-1:1));for(const r of L){r.td=kind==='part'&&partT(PARTS,r.id);if(r.td)tRanges.push({g,r});(kind==='part'?partIds:revealIds).add(r.id);g.ranges.push(r)}}
  g.objs=g.ranges.flatMap(r=>r.objs);g.centre=c;g.nv=0;for(const o of g.objs)for(const f of o._sv.faces)g.nv+=3*(f.pts.length-2);nv+=g.nv;
  g.styles=[];for(let s=-1;s<NS;s++)g.styles.push(styleFor(g,s));
 }
 const corners=[];for(const x of [mn[0],mx[0]])for(const y of [mn[1],mx[1]])for(const z of [mn[2],mx[2]])corners.push([x,y,z]);
 const haveGround=gmx[0]>gmn[0];
 return{groups:arr,objs:items,cams,camOf,corners,bounds:{mn,mx},content:{mn:cmn,mx:cmx},light:lightFrom(cams.campus),tRanges,nParts:partIds.size,nReveals:revealIds.size,nv,hasModular:arr.some(g=>g.modular),
  ground:haveGround?[(gmn[0]+gmx[0])/2,(gmn[1]+gmx[1])/2,(gmx[0]-gmn[0])/2,(gmx[1]-gmn[1])/2]:[0,0,1e7,1e7],glFor:null,flows:null,prepareMs:performance.now()-T0};
}
/* Light from the upper left of the campus view, so a box shows three distinct tones from the fixed camera. */
function lightFrom(cam){const f=norm(sub(cam.target,cam.eye)),r=norm(cross(f,[0,1,0]));return norm(add(add([0,.82,0],mul(r,-.5)),mul(f,-.36)))}

/* Packed vertex buffer (VB bytes per vertex): position 3 floats; normal 3 signed bytes and the corner (0, 1 or 2) of the triangle; the edge flags of the
   edges opposite corners 0, 1, 2 and the smooth flag, as bytes; stagger order and rise offset as 4 floats. Written once, never touched again. */
function buildVerts(S){
 let n=0;for(const g of S.groups)for(const o of g.objs)for(const f of o._sv.faces)n+=3*(f.pts.length-2);
 const buf=new ArrayBuffer(n*VB),F32=new Float32Array(buf),I8=new Int8Array(buf),U8=new Uint8Array(buf);let v=0;
 for(const g of S.groups){g.first=v;
  for(const r of g.ranges){r.first=v;
   for(const o of r.objs){const sv=o._sv,ef=sv.ef,eo=sv.eo,sm=sv.sm,ord=sv.order,off=sv.off;
    for(let fi=0;fi<sv.faces.length;fi++){const P=sv.faces[fi].pts,nm=sv.fn[fi],nP=P.length,o0=eo[fi],s=sm?sm[fi]:0;
     const nx=Math.round(clamp(nm[0],-1,1)*127),ny=Math.round(clamp(nm[1],-1,1)*127),nz=Math.round(clamp(nm[2],-1,1)*127);
     for(let k=1;k<nP-1;k++){
      /* triangle (0,k,k+1) of the fan: its own polygon edges are 0-1 (k = 1), k-(k+1) and (k+1)-0 (k + 1 = n - 1); the rest are interior diagonals */
      const fAB=ef&&k===1?ef[o0]:0,fBC=ef?ef[o0+k]:0,fCA=ef&&k+1===nP-1?ef[o0+nP-1]:0;
      for(let c=0;c<3;c++){const p=P[c===0?0:c===1?k:k+1],b=v*VB,q=v*9;
       F32[q]=p[0];F32[q+1]=p[1];F32[q+2]=p[2];I8[b+12]=nx;I8[b+13]=ny;I8[b+14]=nz;I8[b+15]=c;U8[b+16]=fBC;U8[b+17]=fCA;U8[b+18]=fAB;U8[b+19]=s;
       F32[q+5]=ord;F32[q+6]=off[0];F32[q+7]=off[1];F32[q+8]=off[2];v++}}}}
   r.count=v-r.first}
  g.count=v-g.first}
 return buf;
}
/* Flows (contract 3.6 and 5.3): every segment of every path is a quad of 6 vertices carrying both of its end points, the arc length at both ends, the
   side (-1 or +1) and the end (0 or 1) packed as end * 2 + (side > 0), and the length of its path; the vertex shader extrudes it to a width in pixels. Per flow, one range for the paths in the air and one for the
   paths through the ground. Static: only uniforms change per frame. */
function buildFlows(){
 const flows=(MODEL.ANIM&&MODEL.ANIM.flows)||[],rows=[],list=[];let nv=0;
 for(const f of flows){if(!f||!f.id||!Array.isArray(f.paths))continue;
  const rec={id:f.id,disc:f.disc,speed:f.speed,gap:f.gap,len:f.len,width:f.width,ranges:[]};
  for(const through of [false,true]){const first=nv;
   for(const path of f.paths){if(!!path.through!==through||!path.pts||path.pts.length<2)continue;let s=0,L=0;
    for(let i=0;i<path.pts.length-1;i++){const a=path.pts[i],b=path.pts[i+1];L+=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])}
    for(let i=0;i<path.pts.length-1;i++){const a=path.pts[i],b=path.pts[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);if(!(l>1e-6))continue;
     for(const [e,sd] of [[0,-1],[0,1],[1,1],[0,-1],[1,1],[1,-1]])rows.push(a[0],a[1],a[2],b[0],b[1],b[2],s,s+l,e*2+(sd>0?1:0),L);nv+=6;s+=l}}
   if(nv>first)rec.ranges.push({first,count:nv-first,through})}
  if(rec.ranges.length)list.push(rec)}
 return{list,data:new Float32Array(rows),nv};
}

/* ---------- shaders ---------- */
const S_PREC='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
const S_VS=`attribute vec3 a_position;attribute vec4 a_nc;attribute vec4 a_fl;attribute vec4 a_app;
uniform mat4 u_vp;uniform mat4 u_model;uniform mat3 u_nmat;uniform vec4 u_f0;uniform vec4 u_f1;uniform vec4 u_e0;uniform vec4 u_e1;uniform vec4 u_t;uniform vec2 u_glow;
varying vec4 v_fill;varying vec4 v_edge;varying float v_glow;varying vec3 v_n;varying vec3 v_pos;varying vec3 v_bary;varying vec4 v_fl;
void main(){
 float tt=u_t.x;vec3 off=vec3(0.0);
 if(u_t.z>0.5){float l=clamp((u_t.y-a_app.x*0.55)/0.45,0.0,1.0);tt=l*l*(3.0-2.0*l);off=a_app.yzw*(1.0-tt);}
 v_fill=mix(u_f0,u_f1,tt);v_edge=mix(u_e0,u_e1,tt);v_glow=mix(u_glow.x,u_glow.y,tt);
 vec3 p=(u_model*vec4(a_position,1.0)).xyz+off;
 v_pos=p;v_n=u_nmat*(a_nc.xyz*(1.0/127.0));
 float c=a_nc.w;v_bary=vec3(1.0-min(c,1.0),1.0-abs(c-1.0),max(c-1.0,0.0));v_fl=a_fl;
 gl_Position=u_vp*vec4(p,1.0);
}`;
const S_FS=deriv=>(deriv?'#extension GL_OES_standard_derivatives : enable\n':'')+S_PREC+`varying vec4 v_fill;varying vec4 v_edge;varying float v_glow;varying vec3 v_n;varying vec3 v_pos;varying vec3 v_bary;varying vec4 v_fl;
uniform vec3 u_eye;uniform vec3 u_L;uniform vec4 u_style;uniform vec4 u_gnd;uniform vec2 u_misc;uniform vec4 u_wipe;uniform vec4 u_rv;uniform vec4 u_wc;
float ign(vec2 p){return fract(52.9829189*fract(dot(p,vec2(0.06711056,0.00583715))));}
void main(){
${deriv?' vec3 w=max(fwidth(v_bary),vec3(1e-5));':''}
 float ra=u_rv.z,wd=1e9;
 if(u_rv.x>0.5){float c=dot(v_pos,u_wipe.xyz);wd=u_rv.x>1.5?c-u_wipe.w:u_wipe.w-c;if(wd<0.0)discard;}
 float fa=v_fill.a*ra;
 if(fa<0.004&&v_edge.a*ra<0.004)discard;
 vec3 n=normalize(v_n);float facing=dot(n,u_eye-v_pos);
 if(u_style.z>0.5&&facing<0.0)discard;
 /* Depth-only pre-pass for a fading solid: the nearest surface of the group is recorded where the group is still mostly opaque (fully above alpha 0.6, not at all below 0.4,
    screen-door dither in between), so a solid that fades in or out keeps hiding its own far side and the picture does not change when it joins or leaves the opaque pass. */
 if(u_misc.y>0.5){if(smoothstep(0.4,0.6,fa)<=ign(gl_FragCoord.xy))discard;gl_FragColor=vec4(0.0);return;}
 if(facing<0.0)n=-n;
 float shade=0.5+0.5*max(dot(n,u_L),0.0);
 float lit=mix(shade,1.0,v_glow*0.65);
 vec3 rgb=min(v_fill.rgb*lit*(1.0+0.28*v_glow),vec3(1.0));
 float e=0.0;
 if(u_style.y>0.5){
${deriv?`  vec3 d=v_bary/w;float dm=1e9;
  if(v_fl.x>0.5)dm=min(dm,d.x);if(v_fl.y>0.5)dm=min(dm,d.y);if(v_fl.z>0.5)dm=min(dm,d.z);
  e=1.0-smoothstep(u_style.x,u_style.x+1.0,dm);
  if(v_fl.w>0.5){float r=1.0-smoothstep(0.10,0.26,abs(dot(n,normalize(u_eye-v_pos))));e=max(e,r);}
  float alt=1.0/max(max(w.x,w.y),w.z);
  rgb=max(rgb,vec3(u_misc.x*(1.0-smoothstep(1.5,5.0,alt))));`:`  float dm=1e9;
  if(v_fl.x>0.5)dm=min(dm,v_bary.x);if(v_fl.y>0.5)dm=min(dm,v_bary.y);if(v_fl.z>0.5)dm=min(dm,v_bary.z);
  e=1.0-smoothstep(0.012,0.04,dm);`}
 }
 float ea=e*v_edge.a*ra;vec3 ec=v_edge.rgb;
 if(u_rv.x>0.5&&u_rv.y>0.0){float k=(1.0-smoothstep(0.0,u_rv.y,wd))*u_rv.w;ea=max(ea,k*u_wc.a*ra);ec=mix(ec,u_wc.rgb,k);}
 vec4 col=vec4(ec*ea,ea)+vec4(rgb*fa,fa)*(1.0-ea);
 if(u_style.w>0.5){vec2 q=abs(v_pos.xz-u_gnd.xy)/u_gnd.zw;col*=1.0-smoothstep(0.55,1.0,max(q.x,q.y));}
 gl_FragColor=col;
}`;
/* Flow pulses: a quad per segment extruded to a width in pixels, a skewed Gaussian pulse along the arc length and a Gaussian across, white-hot core in the
   discipline colour and a wider halo at half strength. fract((s - offset) / gap) is computed as mod(s - offset, gap) from the offset the CPU reduced in double precision. */
const F_VS=`attribute vec3 a_a;attribute vec3 a_b;attribute vec4 a_k;
uniform mat4 u_vp;uniform vec3 u_eye;uniform vec2 u_res;uniform float u_hw;uniform float u_bias;
varying float v_s;varying float v_x;varying float v_L;
vec4 proj(vec3 p){return u_vp*vec4(p+normalize(u_eye-p)*u_bias,1.0);}
void main(){
 vec4 ca=proj(a_a),cb=proj(a_b);
 if(ca.w<0.05||cb.w<0.05){gl_Position=vec4(2.0,2.0,2.0,1.0);v_s=0.0;v_x=0.0;v_L=1.0;return;}
 vec2 sa=ca.xy/ca.w*u_res*0.5,sb=cb.xy/cb.w*u_res*0.5;
 vec2 d=sb-sa;float dl=length(d);d=dl>1e-4?d/dl:vec2(1.0,0.0);
 vec2 nr=vec2(-d.y,d.x);
 float en=floor(a_k.z*0.5),sd=(a_k.z-en*2.0)*2.0-1.0;
 vec4 c=en<0.5?ca:cb;
 vec2 o=nr*sd*u_hw+d*(en*2.0-1.0)*u_hw;
 c.xy+=o/(u_res*0.5)*c.w;
 gl_Position=c;v_s=en<0.5?a_k.x:a_k.y;v_x=sd;v_L=a_k.w;
}`;
const F_FS=S_PREC+`varying float v_s;varying float v_x;varying float v_L;
uniform vec3 u_col;uniform vec4 u_pulse;uniform vec3 u_core;
void main(){
 float q=mod(v_s-u_pulse.y,u_pulse.z);
 float x=q/u_pulse.w;
 float tail=(x-0.62)/(x<0.62?0.34:0.17);
 float along=exp(-tail*tail);
 float r=abs(v_x)*u_core.y;
 float cr=r/u_core.x,hr=r/(u_core.x*2.0);
 float core=exp(-cr*cr*1.3)*along,halo=exp(-hr*hr)*along;
 float hot=clamp(core,0.0,1.0);
 float fl=max(min(2.0,0.25*v_L),0.01),ends=smoothstep(0.0,fl,v_s)*smoothstep(0.0,fl,v_L-v_s);   /* a pulse eases in and out over the last 2 m of a path instead of popping */
 float a=clamp(hot+u_core.z*halo,0.0,1.0)*u_pulse.x*ends;
 if(a<0.003)discard;
 vec3 rgb=mix(u_col,vec3(1.0),clamp(hot*0.8,0.0,1.0));
 gl_FragColor=vec4(rgb*a,a);
}`;

function uploadStory(scene,S){
 const g=scene.gl,deriv=!!g.getExtension('OES_standard_derivatives');
 const mk=(vs,fs,locs)=>{const prog=g.createProgram();g.attachShader(prog,buildShader(g,g.VERTEX_SHADER,vs));g.attachShader(prog,buildShader(g,g.FRAGMENT_SHADER,fs));locs.forEach((n,i)=>g.bindAttribLocation(prog,i,n));g.linkProgram(prog);if(!g.getProgramParameter(prog,g.LINK_STATUS))throw Error('Story shader link failed: '+g.getProgramInfoLog(prog));return prog};
 const uni=(prog,names)=>{const U={};for(const k of names)U[k]=g.getUniformLocation(prog,k);return U};
 const prog=mk(S_VS,S_FS(deriv),['a_position','a_nc','a_fl','a_app']);
 const U=uni(prog,['u_vp','u_model','u_nmat','u_f0','u_f1','u_e0','u_e1','u_t','u_glow','u_eye','u_L','u_style','u_gnd','u_misc','u_wipe','u_rv','u_wc']);
 const vbo=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,vbo);const data=buildVerts(S);g.bufferData(g.ARRAY_BUFFER,data,g.STATIC_DRAW);
 S.bytes=data.byteLength;
 const fl=buildFlows();S.flows=fl.list;S.flowVerts=fl.nv;
 const fprog=mk(F_VS,F_FS,['a_a','a_b','a_k']),FU=uni(fprog,['u_vp','u_eye','u_res','u_hw','u_bias','u_col','u_pulse','u_core']);
 const fbo=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,fbo);g.bufferData(g.ARRAY_BUFFER,fl.data.length?fl.data:new Float32Array(10),g.STATIC_DRAW);
 S.gl={ctx:g,prog,U,vbo,deriv,fprog,FU,fbo};S.glFor=g;
}

Object.assign(CampusScene.prototype,{
 /* ----- clock, motion and redraw policy (contract sections 2 and 5.4) ----- */
 initStoryRuntime(){
  this.clock={t:0,frozen:false,rate:1};this.quality=1;this._ts=null;this._redSeen=this.reduced;this.prepareMs=0;this.storyFailed=false;
  this.stats={calls:0,triangles:0,frames:0,ms:0,lastP:null};this.adaptive=true;this._adapt={dts:[],last:null};this._anim={p:null,v:false,gen:0};this._warnedAnim=new Set();
  if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{this._ts=null;this._adapt.last=null;this.dirty=true});
 },
 tEff(){return this.reduced?0:this.clock.t},
 setClock(o){
  const c=this.clock;
  if(o===null){c.frozen=false;c.rate=1}
  else if(o&&typeof o==='object'){
   if(o.rate!==undefined&&Number.isFinite(+o.rate)&&+o.rate>0)c.rate=+o.rate;
   if(o.t!==undefined&&Number.isFinite(+o.t)){c.t=+o.t;c.frozen=o.frozen!==false}
   else if(o.frozen!==undefined)c.frozen=!!o.frozen;
  }
  this._ts=null;this.dirty=true;return this.getClock();
 },
 getClock(){return{t:this.clock.t,frozen:this.clock.frozen,rate:this.clock.rate,reduced:!!this.reduced,hidden:typeof document!=='undefined'&&!!document.hidden}},
 setReducedMotion(on){this.reduced=!!on;this._redSeen=this.reduced;this.dirty=true},
 /* Guard around the model's animation functions: a bad table must not take the whole story down. Each failure is reported once. */
 safe(name,fn){try{return fn()}catch(err){if(!this._warnedAnim.has(name)){this._warnedAnim.add(name);console.error('Story animation ('+name+'):',err)}return null}},
 /* Is anything visible that moves with the clock at this p? Cached by p and by the style tables. */
 animProbe(p){
  const S=this._S,A=this._anim;if(!S)return false;
  if(A.p===p&&A.S===S)return A.v;
  const pc=clamp(p,-1,NS-1),k=Math.floor(pc),f=pc-k;let v=false;   /* the same indexing as storyBlend */
  const vis=g=>{const a=g.styles[k+1],b=g.styles[Math.min(k+1,NS-1)+1];if(!a.vis&&!b.vis)return false;if(!a.vis&&b.vis&&f<=0)return false;return true};
  for(const t of S.tRanges)if(vis(t.g)){v=true;break}
  if(!v&&S.hasModular&&p>MOD_STEP-1&&p<MOD_STEP+1)v=true;
  if(!v&&MODEL.flowState&&S.flows&&S.flows.length){const fs=this.safe('flowState',()=>MODEL.flowState(Math.max(0,p)));if(fs)for(const f of S.flows)if((fs[f.id]||0)>=.01){v=true;break}}
  A.p=p;A.S=S;A.v=v;return v;
 },
 animating(){
  if(!this.story||(typeof document!=='undefined'&&document.hidden)||this.reduced||this.clock.frozen||!this._S||this.mode!=='webgl')return false;
  return this.animProbe(clamp(this.storyP,-1,NS-1));
 },
 /* One rAF in story mode: advance the clock, draw when something changed or something animates. */
 storyTick(ts){
  let dt=0;if(this._ts!=null&&Number.isFinite(ts))dt=Math.min(Math.max((ts-this._ts)/1000,0),.05);this._ts=Number.isFinite(ts)?ts:null;
  if(this.reduced!==this._redSeen){this._redSeen=this.reduced;this.dirty=true}
  const c=this.clock;if(!c.frozen&&!this.reduced)c.t+=dt*c.rate;
  const anim=this.animating();
  if(!this.dirty&&!anim){this._adapt.last=null;return}
  this.dirty=false;
  try{this.drawStoryDisplay()}catch(err){if(!this.storyFailed){this.storyFailed=true;console.error('Story render failed',err)}return}
  if(anim&&this.adaptive&&dt>0)this.adaptQuality(ts);else this._adapt.last=null;
 },
 /* Adaptive resolution for the free running loop: the median of 30 frame intervals over 24 ms lowers the drawing buffer by 0.15, down to 0.6. */
 adaptQuality(ts){
  const A=this._adapt;if(A.last==null){A.last=ts;A.dts.length=0;return}
  const d=ts-A.last;A.last=ts;if(d>250){A.dts.length=0;return}
  A.dts.push(d);if(A.dts.length<30)return;
  const s=A.dts.slice().sort((x,y)=>x-y),med=s[15];A.dts.length=0;
  if(med>24&&this.quality>.6+1e-6)this.setQuality(Math.max(.6,Math.round((this.quality-.15)*100)/100));
 },
 setQuality(q){if(Math.abs(q-this.quality)<1e-6)return;this.quality=q;this.resize()},
 renderNow(){
  if(this.story){if(this.quality!==1)this.setQuality(1);this.dirty=false;this.drawStoryDisplay();if(this.gl&&this.mode==='webgl')this.gl.finish()}   /* complete when it returns: a stepped capture or recording leaves no queue of frames behind it */
  else{this.basis();this.mode==='webgl'&&this.gl?this.drawGL():this.drawCanvas();this.drawLabels?.();this.dirty=false}
  return{p:this.storyP,t:this.tEff(),reduced:!!this.reduced,calls:this.stats.calls,triangles:this.stats.triangles};
 },
 animInfo(){
  let S=this._S;if(!S&&this.story){try{S=this.ensureStory()}catch(e){S=null}}
  const st=this.stats;
  return{reduced:!!this.reduced,t:this.tEff(),frozen:this.clock.frozen,parts:S?S.nParts:0,reveals:S?S.nReveals:0,flows:S&&S.flows?S.flows.length:0,
   ranges:S?S.groups.reduce((n,g)=>n+g.ranges.length,0):0,calls:st.calls,triangles:st.triangles,frames:st.frames,lastFrameMs:st.ms,prepareMs:this.prepareMs,
   vertices:S?S.nv:0,bytes:S?(S.bytes||0):0,quality:this.quality};
 },

 /* ----- public API (contract section 8) ----- */
 setMode(mode){const on=mode==='story';if(on===!!this.story)return;this.story=on;this.dirty=true;this.shadowDirty=true;this._ts=null;if(on)this.orbit={yaw:0,pitch:0,zoom:1};else if(this.quality!==1){this.quality=1;this.resize()}},
 setStoryProgress(p){p=+p;if(!Number.isFinite(p))return;this.storyP=clamp(p,-1,NS-1);this.dirty=true},
 getStoryProgress(){return this.storyP},
 storyInfo(){const S=this.ensureStory();return{steps:NS,groups:S.groups.length,objects:S.objs.length,vertices:S.nv,ground:S.ground,bounds:S.bounds,cameras:S.cams,light:S.light,groupList:S.groups.map(g=>({key:g.key,n:g.objs.length,first:g.first,count:g.count,ranges:g.ranges.map(r=>({kind:r.kind,id:r.id,n:r.objs.length,first:r.first,count:r.count}))})),anim:{parts:S.nParts,reveals:S.nReveals,flows:S.flows?S.flows.length:0,flowVertices:S.flowVerts||0}}},
 /* ----- internals ----- */
 ensureStory(){
  if(!this._S){const t0=performance.now();this._S=prepareStory(this);this.prepareMs=performance.now()-t0}
  const S=this._S;
  if(this.gl&&S.glFor!==this.gl){const t0=performance.now();uploadStory(this,S);this.prepareMs+=performance.now()-t0}
  return S;
 },
 storyCamAt(p){const S=this.ensureStory(),pc=clamp(p,0,NS-1),k=Math.min(NS-2,Math.floor(pc));return lerpCam(S.camOf(k),S.camOf(k+1),smooth(pc-k),[this.storyView.cx,this.storyView.cy])},
 storyFrame(W,H,opts={}){
  const S=this.ensureStory(),p=clamp(this.storyP,-1,NS-1),k=Math.floor(p),f=p-k,t=smooth(f),cam=this.storyCamAt(p),aspect=W/H;
  /* The text column stacks under the model on portrait screens and on windows 640 px wide or less, and otherwise sits at the right with the width
     styles.css gives it. Both rules are read here in CSS pixels (this.width), never in drawing-buffer pixels, so a high pixel ratio changes nothing. */
  const cssW=this.width||W,stacked=aspect<=1||cssW<=640,stage=stacked?1:Math.max(.3,1-Math.min(860,Math.max(340,.30*cssW))/cssW);
  /* where the camera target lands: the camera's own view (blended between cameras) or the scene default, for a 16:9 window with the text column at 30 % */
  const view=cam.view||[this.storyView.cx,this.storyView.cy];
  const cx=opts.center?.5:stacked?.5:view[0]*stage/STORY_STAGE,cy=opts.center?.5:stacked?.4:view[1];
  let fov=cam.fov*Math.PI/180;
  /* The cameras are authored for a 16:9 window with the text column taking 30 %: vertical field of view as given there. A portrait screen shows a
     horizontal span about 15 % wider than its height, so the energy region and the east yards both stay inside the narrow screen. A narrower landscape
     window (4:3, 16:10) or a wider text column widens the field of view so the same horizontal span stays in the space left of the column: the energy
     region keeps its place at the top left and the east yards stay clear of the column. */
  if(aspect<=1)fov=2*Math.atan(Math.tan(fov/2)*1.15/aspect);
  else if(!stacked)fov=2*Math.atan(Math.tan(fov/2)*Math.max(1,STORY_ASPECT/aspect*STORY_STAGE/stage));
  const fwd=norm(sub(cam.target,cam.eye)),nx=2*cx-1,ny=1-2*cy;let dmax=-1e9;
  for(const c of S.corners){const d=dot(sub(c,cam.eye),fwd);if(d>dmax)dmax=d}
  /* Near plane: the depth at which the lowest frustum rays first reach the top of the scene (plus a margin for parts that rise above their rest pose). Everything is
     farther than that, so depth precision stays high even with an energy region hundreds of metres away. Far plane: a 40 m margin for animated parts. */
  const right=norm(cross(fwd,[0,1,0])),up=cross(right,fwd),tf=1/Math.tan(fov/2),ytop=S.bounds.mx[1]+13;let tmin=1e9;
  if(cam.eye[1]>ytop)for(const [X,Y] of [[-1,-1],[1,-1],[0,-1],[-1,0],[1,0],[-1,1],[1,1]]){const tx=(X-nx)*aspect/tf,ty=(Y-ny)/tf,dy=right[1]*tx+up[1]*ty+fwd[1];if(dy<-1e-6)tmin=Math.min(tmin,(cam.eye[1]-ytop)/-dy)}
  const far=Math.max(10,dmax*1.05+50),near=tmin<1e8?clamp(tmin*.9,.5,far*.5):.5;
  return{p,k,f,t,cam,eye:cam.eye,fwd,fov,aspect,cx,cy,near,far,vp:m4mul(projMatrix(fov,aspect,near,far,nx,ny),viewMatrix(cam.eye,cam.target))};
 },
 /* The groups to draw for this frame, with their two blended states. */
 storyBlend(fr){
  const S=this._S,out=[],k0=fr.k+1,k1=Math.min(fr.k+1,NS-1)+1;
  for(const gr of S.groups){
   let A=gr.styles[k0],B=gr.styles[k1];if(!A.vis&&!B.vis)continue;
   const appearing=!A.vis&&B.vis,vanishing=A.vis&&!B.vis;
   if(!A.vis)A={...B,a:0,ea:0};if(!B.vis)B={...A,a:0,ea:0};   /* the missing end keeps the other end's colours but has no fill and no lines, so both fade together */
   let trans;
   if(appearing){if(fr.f<=0)continue;trans=B.a<.999||fr.f<1}else if(vanishing)trans=fr.f>0||A.a<.999;else trans=lerp(A.a,B.a,fr.t)<.999;
   out.push({g:gr,A,B,appearing,vanishing,trans,thru:!!(A.through||B.through),solid:gr.kind==='solid',sA:fr.k,sB:Math.min(fr.k+1,NS-1)});
  }
  return out;
 },
 /* Everything the animation contributes to one frame: part matrices, reveal states (cached per id), flow intensities. A bad table costs only its own feature. */
 evalAnim(fr,tE,opts={}){
  const p=Math.max(0,fr.p),pose=MODEL.animPose?this.safe('animPose',()=>MODEL.animPose(p,tE)):null,cache=new Map();
  const reveal=id=>{let r=cache.get(id);if(r===undefined){r=MODEL.revealOf?this.safe('revealOf',()=>MODEL.revealOf(id,p)):null;cache.set(id,r||null)}return r||null};
  let fs=null;if(!this.reduced&&opts.flows!==false&&MODEL.flowState&&this._S.flows&&this._S.flows.length)fs=this.safe('flowState',()=>MODEL.flowState(p));
  return{p,pose,reveal,fs};
 },
 /* The draw packets of one blended group: runs of ranges. Ranges at rest (identity matrix, no wipe in progress, alpha 1) that touch in the buffer are drawn in one call.
    List 's': plain objects, parts, and reveals of a group that is not appearing. List 'r': reveals of an appearing group, which are already there (style B for the whole
    move). List 'a': reveals that are fading (alpha below 1), drawn translucent. */
 storyPackets(it,anim){
  const L={s:[],r:[],a:[]},end={s:-1,r:-1,a:-1},plainPk={s:null,r:null,a:null};
  for(const r of it.g.ranges){
   let m=null,wmode=0,wipe=null,edge=0,gain=1,alpha=1,list='s';
   if(r.kind==='part'){const q=anim.pose&&anim.pose[r.id];if(q&&!isIdent(q))m=q}
   else if(r.kind==='reveal'){
    const rv=anim.reveal(r.id);
    if(rv){
     if(rv.drawn===false)continue;
     if(rv.m&&!isIdent(rv.m))m=rv.m;
     const w=rv.wipe;
     /* A wipe that has run its course (built, or for an inverted wipe not started) clips nothing and draws no edge; while it runs the bright edge fades in and out at the two ends. */
     if(w){const inv=!!w[4],done=inv?rv.r<=1e-6:rv.r>=1-1e-6;if(!done){wmode=inv?2:1;wipe=w;edge=w[5]>0?w[5]:0;gain=edge>0?smooth(rv.r/WIPE_FADE)*smooth((1-rv.r)/WIPE_FADE):0}}
     if(rv.alpha<.999)alpha=Math.max(0,rv.alpha);
     list=alpha<1?'a':it.appearing?'r':'s';
    }else list=it.appearing?'r':'s';
   }
   const plain=!m&&!wmode&&alpha>=1,Lst=L[list];
   if(plain&&plainPk[list]&&end[list]===r.first){plainPk[list].count+=r.count;end[list]+=r.count}
   else{const pk={first:r.first,count:r.count,m,wmode,wipe,edge,gain,alpha};Lst.push(pk);if(plain){plainPk[list]=pk;end[list]=r.first+r.count}else{plainPk[list]=null;end[list]=-1}}
  }
  return L;
 },
 drawStoryDisplay(){
  const t0=performance.now();
  if(this.mode==='webgl'&&this.gl)this.drawStoryGL({});else if(this.ctx)this.drawStoryCanvas(this.ctx,this.canvas.width,this.canvas.height,{transparent:false});
  this.stats.ms=performance.now()-t0;this.stats.frames++;
 },
 drawStoryGL(opts={}){
  const g=this.gl,S=this.ensureStory(),G=S.gl,U=G.U,W=g.drawingBufferWidth,H=g.drawingBufferHeight,fr=this.storyFrame(W,H,opts),items=this.storyBlend(fr);
  const tE=this.tEff(),anim=this.evalAnim(fr,tE,opts),breath=this.reduced?null:.5+.5*Math.sin(2*Math.PI*tE/4);
  let calls=0,tris=0;
  g.useProgram(G.prog);g.viewport(0,0,W,H);g.disable(g.SCISSOR_TEST);g.disable(g.CULL_FACE);g.colorMask(true,true,true,true);g.depthMask(true);
  if(opts.transparent)g.clearColor(0,0,0,0);else g.clearColor(LOOK.bg[0],LOOK.bg[1],LOOK.bg[2],1);
  g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);g.enable(g.DEPTH_TEST);g.depthFunc(g.LEQUAL);g.enable(g.BLEND);g.blendFunc(g.ONE,g.ONE_MINUS_SRC_ALPHA);
  const bindStory=()=>{g.bindBuffer(g.ARRAY_BUFFER,G.vbo);for(const [i,n,t,o] of [[0,3,g.FLOAT,0],[1,4,g.BYTE,12],[2,4,g.UNSIGNED_BYTE,16],[3,4,g.FLOAT,20]]){g.enableVertexAttribArray(i);g.vertexAttribPointer(i,n,t,false,VB,o)}},unbindStory=()=>{for(let i=0;i<4;i++)g.disableVertexAttribArray(i)};
  bindStory();
  g.uniformMatrix4fv(U.u_vp,false,fr.vp);g.uniform3fv(U.u_eye,fr.eye);g.uniform3fv(U.u_L,S.light);g.uniform4fv(U.u_gnd,opts.ground===false?[0,0,1e7,1e7]:S.ground);
  const lineW=opts.lineW??clamp(1.15*H/900,1,4);
  /* per-range state, tracked so that unchanged uniforms are not sent again */
  let identBound=false;const RV=[-1,0,0,0],setRv=(mode,edge,alpha,gain)=>{if(RV[0]!==mode||RV[1]!==edge||RV[2]!==alpha||RV[3]!==gain){RV[0]=mode;RV[1]=edge;RV[2]=alpha;RV[3]=gain;g.uniform4f(U.u_rv,mode,edge,alpha,gain)}};
  g.uniformMatrix4fv(U.u_model,false,IDENT4);g.uniformMatrix3fv(U.u_nmat,false,IDENT3);identBound=true;setRv(0,0,1,0);g.uniform4f(U.u_wipe,1,0,0,0);
  const WC=[.9,.9,.9,.5];
  const draw=(it,list,pre)=>{
   const gr=it.g;let A=it.A,B=it.B;
   let f0=A.col,f1=B.col,ea0=A.ea,ea1=B.ea;
   if(breath!=null&&MOD_STEP>=0){   /* the modular highlight breathes (contract 5.3): edge alpha 0.82..1.0, fill 0.95..1.05 */
    const ke=.82+.18*breath,kf=.95+.10*breath;
    if(it.sA===MOD_STEP&&A.cls==='focus'){ea0=A.ea*ke;f0=A.col.map(v=>v*kf)}
    if(it.sB===MOD_STEP&&B.cls==='focus'){ea1=B.ea*ke;f1=B.col.map(v=>v*kf)}
   }
   g.uniform4f(U.u_f0,f0[0],f0[1],f0[2],A.a);g.uniform4f(U.u_f1,f1[0],f1[1],f1[2],B.a);
   g.uniform4f(U.u_e0,A.edge[0],A.edge[1],A.edge[2],ea0);g.uniform4f(U.u_e1,B.edge[0],B.edge[1],B.edge[2],ea1);
   g.uniform4f(U.u_t,fr.t,fr.f,it.appearing?1:0,0);g.uniform2f(U.u_glow,A.glow,B.glow);
   g.uniform4f(U.u_style,lineW*lerp(A.hw||LOOK.hwQuiet,B.hw||LOOK.hwQuiet,fr.t),gr.edgeOn?1:0,gr.cull?1:0,it.solid?0:1);g.uniform2f(U.u_misc,lerp(A.art||0,B.art||0,fr.t),pre?1:0);
   if(it.hasWipe){const foc=B.cls==='focus'?B:A.cls==='focus'?A:null;if(foc){WC[0]=foc.edge[0];WC[1]=foc.edge[1];WC[2]=foc.edge[2];WC[3]=1}else{WC[0]=WC[1]=WC[2]=.9;WC[3]=.5}
    g.uniform4fv(U.u_wc,WC)}
   for(const pk of list){
    if(pk.m){g.uniformMatrix4fv(U.u_model,false,pk.m);g.uniformMatrix3fv(U.u_nmat,false,nmatOf(pk.m));identBound=false}
    else if(!identBound){g.uniformMatrix4fv(U.u_model,false,IDENT4);g.uniformMatrix3fv(U.u_nmat,false,IDENT3);identBound=true}
    if(pk.wmode){g.uniform4f(U.u_wipe,pk.wipe[0],pk.wipe[1],pk.wipe[2],pk.wipe[3]);setRv(pk.wmode,pk.edge,pk.alpha,pk.gain)}else setRv(0,0,pk.alpha,0);
    g.drawArrays(g.TRIANGLES,pk.first,pk.count);calls++;tris+=pk.count/3}};
  /* A draw job is a blended group with the packets to draw in it. Reveals of a group that is appearing are already there, so they are drawn with the end style for the whole move
     (list r); reveals that are fading in or out are drawn translucent (list a); everything else with the group's own style (list s). */
  const ground=[],opaque=[],trans=[],thru=[];
  const add=(j,list)=>{if(!list.length||(!j.solid&&opts.ground===false))return;j.pk=list;j.hasWipe=list.some(pk=>pk.wmode&&pk.edge>0);if(j.thru)thru.push(j);else if(j.trans)trans.push(j);else if(!j.solid)ground.push(j);else opaque.push(j)};
  for(const it of items){
   const L=this.storyPackets(it,anim);
   add(it,L.s);
   if(L.r.length)add({...it,A:it.B,B:it.B,sA:it.sB,appearing:false,trans:it.B.a<.999},L.r);
   if(L.a.length)add(it.appearing?{...it,A:it.B,B:it.B,sA:it.sB,appearing:false,trans:true}:{...it,trans:true},L.a)}
  for(const it of trans){it.depth=dot(sub(it.g.centre,fr.eye),fr.fwd);
   /* rank 0 ground and lines (they lie flat on the ground and must never paint over a solid), 1 solids, 2 glass (a solid that is or becomes see-through, such as the
      structure shell): glass is drawn after everything it encloses, exactly as it is once the opaque pass has drawn the equipment inside it. */
   it.rank=!it.solid?0:Math.min(it.appearing?it.B.a:it.A.a,it.vanishing?it.A.a:it.B.a)<.5?2:1}
  trans.sort((a,b)=>a.rank-b.rank||b.depth-a.depth);
  /* 0 ground (opaque, fades out at its edge); 1 opaque; 2 translucent far to near with no depth writes (this includes ground that is fading in or out,
     so what lies beneath it cross-fades instead of vanishing); a fading solid that is still mostly opaque first writes its own depth (colour masked off)
     so it keeps hiding its far side exactly as it does in the opaque pass; 3 flows; 4 underground services seen through the slab; 5 flows through the ground */
  g.depthMask(true);for(const it of ground)draw(it,it.pk,false);
  for(const it of opaque)draw(it,it.pk,false);
  for(const it of trans){
   if(it.solid&&Math.max(it.A.a,it.B.a)>.4){g.colorMask(false,false,false,false);g.depthMask(true);draw(it,it.pk,true);g.colorMask(true,true,true,true)}
   g.depthMask(false);draw(it,it.pk,false);
  }
  unbindStory();
  const fl=anim.fs&&opts.flows!==false&&S.flows.length>0,FC={calls:0,tris:0};
  if(fl){g.depthMask(false);this.drawFlows(G,fr,anim,W,H,false,FC);g.depthMask(true)}
  if(thru.length){g.useProgram(G.prog);bindStory();g.depthFunc(g.ALWAYS);for(const it of thru)draw(it,it.pk,false);unbindStory()}
  if(fl){g.depthMask(false);this.drawFlows(G,fr,anim,W,H,true,FC);g.depthMask(true)}
  g.depthFunc(g.LESS);g.depthMask(true);
  this.stats.calls=calls+FC.calls;this.stats.triangles=Math.round(tris+FC.tris);this.stats.lastP=fr.p;
  this.lastStoryDraw={p:fr.p,t:tE,ground:ground.map(it=>it.g.key),opaque:opaque.map(it=>it.g.key),translucent:trans.map(it=>({key:it.g.key,depth:+it.depth.toFixed(1)})),through:thru.map(it=>it.g.key)};
 },
 /* Flow pulses. through = false: the paths in the air, depth tested with a bias toward the eye; true: the paths through the ground, drawn over everything. Returns the number of draw calls. */
 drawFlows(G,fr,anim,W,H,through,FC){
  const g=this.gl,S=this._S,F=G.FU,tE=this.tEff();let started=false;
  for(const f of S.flows){
   const inten=anim.fs[f.id];if(!(inten>=.01))continue;
   for(const rg of f.ranges){if(rg.through!==through)continue;
    if(!started){started=true;g.useProgram(G.fprog);g.bindBuffer(g.ARRAY_BUFFER,G.fbo);
     g.enableVertexAttribArray(0);g.vertexAttribPointer(0,3,g.FLOAT,false,40,0);g.enableVertexAttribArray(1);g.vertexAttribPointer(1,3,g.FLOAT,false,40,12);g.enableVertexAttribArray(2);g.vertexAttribPointer(2,4,g.FLOAT,false,40,24);
     g.uniformMatrix4fv(F.u_vp,false,fr.vp);g.uniform3fv(F.u_eye,fr.eye);g.uniform2f(F.u_res,W,H);g.uniform1f(F.u_bias,through?0:FLOW_BIAS);
     g.depthFunc(through?g.ALWAYS:g.LEQUAL)}
    const off=this.safe('flowOffset',()=>MODEL.flowOffset(f.id,tE));if(off==null)continue;
    const c=discRGB(f.disc),kind=c===WHITE?'white':'colour',core=Math.max(2,Math.max(FLOW_CORE_MIN[kind],+f.width||0)*H/900),half=core*.5;
    g.uniform1f(F.u_hw,half*3);g.uniform3f(F.u_col,c[0],c[1],c[2]);g.uniform4f(F.u_pulse,inten,off,Math.max(.01,+f.gap||1),Math.max(.01,+f.len||1));g.uniform3f(F.u_core,half,half*3,FLOW_HALO[kind]);
    g.drawArrays(g.TRIANGLES,rg.first,rg.count);FC.calls++;FC.tris+=rg.count/3}}
  if(started){g.disableVertexAttribArray(0);g.disableVertexAttribArray(1);g.disableVertexAttribArray(2);g.depthFunc(g.LEQUAL)}
 },
 /* Software fallback: same styles, painter's algorithm, no ground plane, the settled pose (parts at animPose(p, 0)) with reveals at p, no flows.
    Used without WebGL and for the PNG export there. */
 drawStoryCanvas(ctx,W,H,opts={}){
  const S=this.ensureStory(),fr=this.storyFrame(W,H,opts),items=this.storyBlend(fr),L=S.light,pa=Math.max(0,fr.p);
  const pose=MODEL.animPose?this.safe('animPose',()=>MODEL.animPose(pa,0)):null,rvc=new Map(),revealOf=id=>{let r=rvc.get(id);if(r===undefined){r=MODEL.revealOf?this.safe('revealOf',()=>MODEL.revealOf(id,pa)):null;rvc.set(id,r||null)}return r||null};
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.lineJoin='round';
  const css=(c,a)=>`rgba(${Math.round(clamp(c[0],0,1)*255)},${Math.round(clamp(c[1],0,1)*255)},${Math.round(clamp(c[2],0,1)*255)},${a})`;
  if(opts.transparent)ctx.clearRect(0,0,W,H);else{ctx.fillStyle=css(LOOK.bg,1);ctx.fillRect(0,0,W,H)}
  const faces=[],lw=clamp(1.15*H/900,1,4)*.8;
  for(const it of items){
   const gr=it.g,pass=it.thru?3:it.trans?2:1;if(!it.solid)continue;   /* the software fallback leaves out the ground: huge faces cannot fade softly */
   for(const r of gr.ranges){
    let M=null,rv=null,over=false;
    if(r.kind==='part'){const q=pose&&pose[r.id];if(q&&!isIdent(q))M=q}
    else if(r.kind==='reveal'){rv=revealOf(r.id);if(rv){if(rv.drawn===false)continue;if(rv.m&&!isIdent(rv.m))M=rv.m;over=it.appearing}}
    for(const o of r.objs){
     const sv=o._sv,bl=blendObject(over?{...it,A:it.B,appearing:false}:it,fr,sv);if(bl.a<.01&&bl.ea<.01)continue;
     const ra=rv&&rv.alpha<1?Math.max(0,rv.alpha):1;
     for(let fi=0;fi<sv.faces.length;fi++){
      const f=sv.faces[fi],P0=f.pts,ox=bl.off[0],oy=bl.off[1],oz=bl.off[2];
      const P=M?P0.map(q=>applyM(M,q)):P0,n=M?applyN(M,sv.fn[fi]):sv.fn[fi];
      if(rv&&rv.wipe){const w=rv.wipe,c=[0,0,0];for(const q of P){c[0]+=q[0]/P.length;c[1]+=q[1]/P.length;c[2]+=q[2]/P.length}const d=c[0]*w[0]+c[1]*w[1]+c[2]*w[2];if(w[4]?d<=w[3]:d>w[3])continue}
      const facing=n[0]*(fr.eye[0]-P[0][0]-ox)+n[1]*(fr.eye[1]-P[0][1]-oy)+n[2]*(fr.eye[2]-P[0][2]-oz);
      if(gr.cull&&facing<0)continue;
      const nn=facing<0?[-n[0],-n[1],-n[2]]:n,pts=[];let wsum=0,ok=true,minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9;
      for(const q of P){const c=projectPt(fr.vp,[q[0]+ox,q[1]+oy,q[2]+oz]);if(c[3]<=.01){ok=false;break}const x=(c[0]/c[3]*.5+.5)*W,y=(1-(c[1]/c[3]*.5+.5))*H;pts.push([x,y]);wsum+=c[3];minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y)}
      if(!ok||maxx<0||minx>W||maxy<0||miny>H)continue;
      const shade=.5+.5*Math.max(dot(nn,L),0),lit=shade+(1-shade)*bl.glow*.65,k=lit*(1+.28*bl.glow);
      faces.push({pts,pass,depth:wsum/P.length,fill:css(bl.col.map(v=>Math.min(1,v*k)),1),a:bl.a*ra,ea:gr.edgeOn?bl.ea*ra:0,edge:css(bl.edge,1),ef:sv.ef?sv.ef.subarray(sv.eo[fi],sv.eo[fi+1]):null});
     }
    }
   }
  }
  faces.sort((x,y)=>x.pass-y.pass||y.depth-x.depth);
  for(const f of faces){
   ctx.beginPath();ctx.moveTo(f.pts[0][0],f.pts[0][1]);for(let i=1;i<f.pts.length;i++)ctx.lineTo(f.pts[i][0],f.pts[i][1]);ctx.closePath();
   if(f.a>.004){ctx.globalAlpha=f.a;ctx.fillStyle=f.fill;ctx.fill()}
   if(f.ea>.02){ctx.globalAlpha=f.ea*Math.max(f.a,.3);ctx.strokeStyle=f.edge;ctx.lineWidth=lw;
    if(f.ef){const n=f.pts.length;ctx.beginPath();for(let i=0;i<n;i++)if(f.ef[i]){const a=f.pts[i],b=f.pts[(i+1)%n];ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1])}ctx.stroke()}else ctx.stroke()}
  }
  ctx.globalAlpha=1;
 },
 /* PNG of the current story frame (same p, same effective time, parts, reveals and flows), 3840 px wide, same framing as the screen unless {center:true}. Transparent
    means the model only: the ground plane (which fills the whole frame) is left out unless asked for; an opaque export is a faithful picture of the stage, ground included. */
 async exportPNG({width=3840,transparent=true,ground=!transparent,center=false}={}){
  this.ensureStory();
  const aspect=(this.width||this.canvas.width||1600)/(this.height||this.canvas.height||900);let W=Math.round(width),H=Math.round(width/aspect);
  if(this.mode==='webgl'&&this.gl){
   const g=this.gl,c=this.canvas,ow=c.width,oh=c.height,vd=g.getParameter(g.MAX_VIEWPORT_DIMS)||[4096,4096],lim=Math.min(vd[0],vd[1],g.getParameter(g.MAX_RENDERBUFFER_SIZE)||4096);
   if(W>lim){H=Math.round(H*lim/W);W=lim}if(H>lim){W=Math.round(W*lim/H);H=lim}
   c.width=W;c.height=H;
   let pending;
   try{this.drawStoryGL({transparent,ground,center});pending=new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(Error('PNG encoding failed')),'image/png'))}
   finally{c.width=ow;c.height=oh;this.dirty=true;try{if(this.story)this.drawStoryDisplay();else{this.basis();this.drawGL()}}catch(e){}}
   return pending;
  }
  const c=document.createElement('canvas');c.width=W;c.height=H;this.drawStoryCanvas(c.getContext('2d'),W,H,{transparent,ground,center});
  return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(Error('PNG encoding failed')),'image/png'));
 },
 /* glTF 2.0 binary of the visible story geometry in the BASE POSE: metres, Y up, one mesh and one material per discipline. Parts stand at animPose(p, 0), reveals as
    revealOf(id, p) gives them (an object that is less than half built is left out; the move and scale are applied; a wipe is ignored so the object is whole). No flows,
    and nothing depends on the clock, so two exports at the same p are the same bytes. */
 async exportGLB({ground=false}={}){
  const S=this.ensureStory(),fr=this.storyFrame(1600,900,{}),items=this.storyBlend(fr),pa=Math.max(0,fr.p);
  const pose=MODEL.animPose?this.safe('animPose',()=>MODEL.animPose(pa,0)):null,rvc=new Map(),revealOf=id=>{let r=rvc.get(id);if(r===undefined){r=MODEL.revealOf?this.safe('revealOf',()=>MODEL.revealOf(id,pa)):null;rvc.set(id,r||null)}return r||null};
  const lin=c=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4),SIL=hexRGB(STORY_PALETTE.silhouette);
  /* The model carries the state the screen shows: the focus of this step in its discipline colour (one mesh per discipline), everything built earlier in one
     dark grey 'done' mesh, the energy region in a darker one, and the structure shell as a see-through mesh, so PowerPoint shows one bright colour on a quiet model. */
  const CLASS={done:{name:'done',rgb:SIL},dim:{name:'energy-region',rgb:SIL.map(v=>v*LOOK.dim)},glass:{name:'structure-glass',rgb:LOOK.glass},ground:{name:'ground',rgb:null}};
  const parts=new Map();
  for(const it of items){const gr=it.g;if(!it.solid&&!ground)continue;
   const st=it.appearing?it.B:it.vanishing?it.A:fr.t<.5?it.A:it.B,cls=st.cls||'focus';if(st.a<.02)continue;
   const rgb=CLASS[cls]?.rgb||st.col,name=CLASS[cls]?.name||gr.disc,alpha=cls==='glass'?st.a:1,key=[name,rgb.map(v=>v.toFixed(3)).join(','),alpha.toFixed(2)].join('|');
   for(const r of gr.ranges){
    let M=null,rv=null;
    if(r.kind==='part'){const q=pose&&pose[r.id];if(q&&!isIdent(q))M=q}
    else if(r.kind==='reveal'){rv=revealOf(r.id);if(rv){const inv=!!(rv.wipe&&rv.wipe[4]);if(inv?rv.r>=.5:rv.r<.5)continue;if(rv.m&&!isIdent(rv.m))M=rv.m}}
    for(const o of r.objs){const sv=o._sv,bl=blendObject(it,fr,sv);
     if(!rv){if(it.appearing&&bl.tt<.5)continue;if(it.vanishing&&bl.tt>=.5)continue}
     let P=parts.get(key);if(!P){P={name,rgb,alpha,list:[]};parts.set(key,P)}P.list.push([o,rv?ZERO3:bl.off,M])}}}
  const json={asset:{version:'2.0',generator:'Bird From Site to Service story renderer',extras:{storyProgress:fr.p,step:STORY_STEPS[clamp(Math.round(fr.p),0,NS-1)]?.id,pose:'base'}},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],accessors:[],bufferViews:[],buffers:[]};
  const bins=[];let binLen=0;
  const addView=(typed,target)=>{const bytes=new Uint8Array(typed.buffer,typed.byteOffset,typed.byteLength);json.bufferViews.push({buffer:0,byteOffset:binLen,byteLength:bytes.length,target});bins.push(bytes);binLen+=bytes.length;return json.bufferViews.length-1};
  for(const P of parts.values()){
   let nv=0;for(const [o] of P.list)for(const f of o._sv.faces)nv+=3*(f.pts.length-2);if(!nv)continue;
   const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),idx=new Uint32Array(nv),mn=[1e30,1e30,1e30],mx=[-1e30,-1e30,-1e30];let w=0;
   for(const [o,off,M] of P.list){const sv=o._sv;
    for(let fi=0;fi<sv.faces.length;fi++){const F0=sv.faces[fi].pts,n=M?applyN(M,sv.fn[fi]):sv.fn[fi],F=M?F0.map(q=>applyM(M,q)):F0;
     for(let k=1;k<F.length-1;k++){
      const a=add(F[0],off),b=add(F[k],off),c=add(F[k+1],off),gn=cross(sub(b,a),sub(c,a)),tri=dot(gn,n)<0?[a,c,b]:[a,b,c];
      for(const q of tri){pos[w*3]=q[0];pos[w*3+1]=q[1];pos[w*3+2]=q[2];nor[w*3]=n[0];nor[w*3+1]=n[1];nor[w*3+2]=n[2];idx[w]=w;for(let i=0;i<3;i++){if(q[i]<mn[i])mn[i]=q[i];if(q[i]>mx[i])mx[i]=q[i]}w++}}}}
   const vp=addView(pos,34962),vn=addView(nor,34962),vi=addView(idx,34963),base=json.accessors.length;
   json.accessors.push({bufferView:vp,componentType:5126,count:nv,type:'VEC3',min:mn,max:mx},{bufferView:vn,componentType:5126,count:nv,type:'VEC3'},{bufferView:vi,componentType:5125,count:nv,type:'SCALAR'});
   const rgb=P.rgb,mat={name:P.name,pbrMetallicRoughness:{baseColorFactor:[lin(rgb[0]),lin(rgb[1]),lin(rgb[2]),P.alpha],metallicFactor:0,roughnessFactor:.9},alphaMode:P.alpha<.999?'BLEND':'OPAQUE'};
   json.materials.push(mat);json.meshes.push({name:P.name,primitives:[{attributes:{POSITION:base,NORMAL:base+1},indices:base+2,material:json.materials.length-1,mode:4}]});
   json.nodes.push({name:P.name,mesh:json.meshes.length-1});json.scenes[0].nodes.push(json.nodes.length-1);
  }
  if(binLen)json.buffers.push({byteLength:binLen});else{delete json.bufferViews;delete json.accessors;delete json.buffers;delete json.meshes;delete json.materials;delete json.nodes;json.scenes[0].nodes=[]}
  let jb=new TextEncoder().encode(JSON.stringify(json));const jpad=(4-jb.length%4)%4;if(jpad){const t=new Uint8Array(jb.length+jpad);t.set(jb);t.fill(32,jb.length);jb=t}
  const bpad=(4-binLen%4)%4,total=12+8+jb.length+(binLen?8+binLen+bpad:0),head=new DataView(new ArrayBuffer(20));
  head.setUint32(0,0x46546C67,true);head.setUint32(4,2,true);head.setUint32(8,total,true);head.setUint32(12,jb.length,true);head.setUint32(16,0x4E4F534A,true);
  const blobParts=[head.buffer,jb];
  if(binLen){const bh=new DataView(new ArrayBuffer(8));bh.setUint32(0,binLen+bpad,true);bh.setUint32(4,0x004E4942,true);blobParts.push(bh.buffer,...bins);if(bpad)blobParts.push(new Uint8Array(bpad))}
  return new Blob(blobParts,{type:'model/gltf-binary'});
 }
});
