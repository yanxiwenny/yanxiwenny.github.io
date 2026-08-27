import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import './styles.css';

const $ = (id) => document.getElementById(id);
const mobile = matchMedia('(max-width: 600px)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
} catch {
  document.body.classList.add('no-webgl');
}

if (renderer) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x8d9fc8, 0.035);
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0.2, mobile ? 13.5 : 12);
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.8));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.38, 0.6, 0.8);
  composer.addPass(bloom);

  scene.add(new THREE.HemisphereLight(0xe8efff, 0x526691, 2.2));
  const key = new THREE.DirectionalLight(0xfff4d6, 3.2); key.position.set(-4, 6, 5); key.castShadow = true; scene.add(key);
  const rim = new THREE.PointLight(0xf5c66e, 14, 18); rim.position.set(4, 2, 3); scene.add(rim);
  const cool = new THREE.PointLight(0x789ee5, 12, 20); cool.position.set(-5, -1, 2); scene.add(cool);

  const root = new THREE.Group(); scene.add(root);
  const bouquet = new THREE.Group(); bouquet.position.y = -.25; bouquet.scale.setScalar(mobile ? .82 : .95); bouquet.visible = false; root.add(bouquet);
  const cake = new THREE.Group(); cake.position.y = -5; cake.scale.setScalar(mobile ? .82 : 1); cake.visible = false; root.add(cake);
  const cream = new THREE.MeshPhysicalMaterial({ color: 0xfff9e8, roughness: .38, metalness: 0, clearcoat: .2, sheen: .6, sheenColor: 0xffe6b7, side: THREE.DoubleSide });
  const innerCream = cream.clone(); innerCream.color.set(0xf5e3b8);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x477b64, roughness: .65, side: THREE.DoubleSide });
  const gold = new THREE.MeshStandardMaterial({ color: 0xe7c777, metalness: .75, roughness: .26 });

  function petalGeometry(w, h, curl = .22) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.bezierCurveTo(-w*.55,h*.2,-w*.62,h*.7,0,h); shape.bezierCurveTo(w*.62,h*.7,w*.55,h*.2,0,0);
    const g = new THREE.ExtrudeGeometry(shape, { depth: .035, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 2, curveSegments: 7 });
    const p = g.attributes.position;
    for(let i=0;i<p.count;i++){ const y=p.getY(i); p.setZ(i,p.getZ(i)+Math.sin(y/h*Math.PI)*curl); }
    g.computeVertexNormals(); return g;
  }
  function flower(scale=1, openness=1) {
    const f = new THREE.Group();
    [[7,.68,1],[6,.5,.72],[5,.34,.48]].forEach(([count,size,radius],layer) => {
      for(let i=0;i<count;i++){
        const p = new THREE.Mesh(petalGeometry(size, size*1.18, .18*openness), layer===2?innerCream:cream);
        p.rotation.z = i/count*Math.PI*2 + layer*.33; p.rotation.x = Math.PI/2-(.52+layer*.18)*openness;
        p.position.set(Math.cos(p.rotation.z)*radius*.28, Math.sin(p.rotation.z)*radius*.28, layer*.08);
        p.castShadow=true; f.add(p);
      }
    });
    f.scale.setScalar(scale); return f;
  }
  function leaf(scale=1) {
    const g=petalGeometry(.42*scale,1.35*scale,.12); const l=new THREE.Mesh(g,leafMat); l.rotation.x=Math.PI/2.4;
    const vein=new THREE.Mesh(new THREE.CylinderGeometry(.012,.018,1.05*scale,6),gold); vein.rotation.z=.02; vein.position.y=.5*scale; vein.position.z=.15; l.add(vein); return l;
  }
  const flowerData=[[-1.25,.7,.15,1.05,0],[0,.95,.5,1.18,.15],[1.22,.62,.1,1,-.2],[-.7,-.15,.65,.86,.28],[.72,-.2,.7,.9,-.25],[1.58,-.25,.3,.65,-.5]];
  flowerData.forEach(([x,y,z,s,r])=>{const f=flower(s,s<.7?.55:1);f.position.set(x,y,z);f.rotation.set(-.18+r,.18*x,r);bouquet.add(f)});
  for(let i=0;i<9;i++){const l=leaf(.75+Math.random()*.4);const a=i/9*Math.PI*2;l.position.set(Math.cos(a)*1.45,-.5+Math.sin(a)*.55,-.2);l.rotation.z=a-Math.PI/2;l.rotation.y=(i%3-1)*.35;bouquet.add(l)}
  const stemMat=new THREE.MeshStandardMaterial({color:0x3f765f,roughness:.8});
  for(let i=0;i<7;i++){const s=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,2.9,7),stemMat);s.position.set((i-3)*.09,-1.75,0);s.rotation.z=(i-3)*.035;bouquet.add(s)}
  const wrapMat=new THREE.MeshPhysicalMaterial({color:0xbccbe4,transparent:true,opacity:.23,roughness:.3,transmission:.35,side:THREE.DoubleSide,depthWrite:false});
  const wrap=new THREE.Mesh(new THREE.ConeGeometry(1.5,2.65,5,1,true),wrapMat);wrap.position.y=-1.55;wrap.rotation.y=.3;bouquet.add(wrap);
  const ribbon=new THREE.Mesh(new THREE.TorusGeometry(.37,.035,8,50),gold);ribbon.scale.y=.55;ribbon.position.y=-1.25;ribbon.rotation.x=Math.PI/2;bouquet.add(ribbon);

  const targets=[]; bouquet.traverse(o=>{if(o.isMesh){const pos=o.geometry.attributes.position;for(let i=0;i<pos.count;i+=Math.max(1,Math.floor(pos.count/35))){const v=new THREE.Vector3().fromBufferAttribute(pos,i);o.localToWorld(v);targets.push(v)}}});
  const particleCount=mobile?900:1700, pp=new Float32Array(particleCount*3), pt=new Float32Array(particleCount*3);
  for(let i=0;i<particleCount;i++){const a=Math.random()*Math.PI*2,r=5+Math.random()*5;pp[i*3]=Math.cos(a)*r;pp[i*3+1]=(Math.random()-.5)*9;pp[i*3+2]=Math.sin(a)*r-1;const t=targets[i%targets.length];pt.set([t.x,t.y,t.z],i*3)}
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pp,3));
  const particles=new THREE.Points(pg,new THREE.PointsMaterial({color:0xffedb4,size:mobile?.035:.045,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));root.add(particles);

  function cylinder(radius,height,color,y,rough=.4){const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius*.98,height,64),new THREE.MeshPhysicalMaterial({color,roughness:rough,clearcoat:.25}));m.position.y=y;m.castShadow=true;m.receiveShadow=true;cake.add(m);return m}
  cylinder(2.25,.3,0x9bb0ce,-1.35,.18).material.transparent=true;
  cylinder(1.82,1.5,0x102a59,-.45,.38); cylinder(1.3,1.2,0x173b78,.85,.36);
  [0.28,1.47].forEach((y,j)=>{const band=new THREE.Mesh(new THREE.TorusGeometry(j?1.31:1.83,.035,8,80),gold);band.rotation.x=Math.PI/2;band.position.y=y;cake.add(band)});
  const frosting=new THREE.Mesh(new THREE.CylinderGeometry(1.31,1.31,.16,64),new THREE.MeshPhysicalMaterial({color:0xe8eff6,roughness:.55,clearcoat:.12}));frosting.position.y=1.49;cake.add(frosting);
  for(let i=0;i<11;i++){const pearl=new THREE.Mesh(new THREE.SphereGeometry(.08+(i%3)*.025,16,12),new THREE.MeshPhysicalMaterial({color:i%2?0xe7c777:0xc6d8ed,metalness:i%2?.7:.15,roughness:.18}));const a=i/11*Math.PI*2;pearl.position.set(Math.cos(a)*1.7,-.15+((i%3)-1)*.35,Math.sin(a)*1.7);cake.add(pearl)}
  function starShape(){const s=new THREE.Shape();for(let i=0;i<10;i++){const r=i%2?.1:.23,a=i*Math.PI/5-Math.PI/2;s[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r)}s.closePath();return new THREE.ExtrudeGeometry(s,{depth:.04,bevelEnabled:true,bevelSize:.02,bevelThickness:.02})}
  for(let i=0;i<8;i++){const st=new THREE.Mesh(starShape(),gold);const a=i/8*Math.PI*2;st.position.set(Math.cos(a)*(1.38+(i%2)*.5),.1+(i%4)*.43,Math.sin(a)*(1.38+(i%2)*.5));st.lookAt(camera.position);cake.add(st)}
  const moon=new THREE.Group(), moonOuter=new THREE.Mesh(new THREE.SphereGeometry(.38,24,18),gold), cut=new THREE.Mesh(new THREE.SphereGeometry(.34,24,18),new THREE.MeshStandardMaterial({color:0x173b78}));cut.position.set(.17,.08,.12);moon.add(moonOuter,cut);moon.position.set(-.63,1.95,.05);cake.add(moon);
  [0,1].forEach(i=>{const f=flower(.3+i*.04,1);f.position.set(.35+i*.42,1.57,.2-i*.15);f.rotation.x=-.3;cake.add(f)});
  const crystalMat=new THREE.MeshPhysicalMaterial({color:0xbfd9ff,transparent:true,opacity:.55,transmission:.55,roughness:.1});
  for(let i=0;i<4;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(.1,.5+i*.06,5),crystalMat);c.position.set(-.15+i*.23,1.75,-.25);c.rotation.z=(i-1.5)*.16;cake.add(c)}
  const candle=new THREE.Mesh(new THREE.CylinderGeometry(.055,.065,.82,12),new THREE.MeshStandardMaterial({color:0xf5dfa0,roughness:.4}));candle.position.set(0,1.95,0);cake.add(candle);
  const flame=new THREE.Group();flame.position.set(0,2.46,0);cake.add(flame);
  const outerFlame=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),new THREE.MeshBasicMaterial({color:0xffa63c,transparent:true,opacity:.8}));outerFlame.scale.y=1.8;
  const innerFlame=new THREE.Mesh(new THREE.SphereGeometry(.06,12,10),new THREE.MeshBasicMaterial({color:0xffffd0}));innerFlame.scale.y=1.6;innerFlame.position.y=-.03;flame.add(outerFlame,innerFlame);
  const flameLight=new THREE.PointLight(0xffb24d,8,4);flameLight.position.y=.1;flame.add(flameLight);
  const rings=[];[2.2,2.65,3].forEach((r,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.018,6,120),new THREE.MeshBasicMaterial({color:i===1?0xbdd7ff:0xf5dfa0,transparent:true,opacity:.55}));ring.rotation.set(Math.PI/2+(i-1)*.18,(i-1)*.25,0);ring.position.y=.2+(i-1)*.45;cake.add(ring);rings.push(ring)});

  let phase='welcome', phaseStart=0, drag=false, lastX=0, userSpin=0, raf, audioWarned=false, fadeTimer;
  const audio=$('bgm');audio.volume=0;
  async function playMusic(){try{await audio.play();clearInterval(fadeTimer);fadeTimer=setInterval(()=>{audio.volume=Math.min(.44,audio.volume+.03);if(audio.volume>=.44)clearInterval(fadeTimer)},100)}catch(e){if(!audioWarned){console.warn('背景音乐暂时无法播放，动画将继续。',e);audioWarned=true}$('music').textContent='音乐待加入'}}
  function show(id,on=true){$(id).classList.toggle('active',on);$(id).setAttribute('aria-hidden',String(!on))}
  function start(){phase='forming';phaseStart=performance.now();show('welcome',false);bouquet.visible=true;playMusic();}
  function transition(){if(phase!=='bouquet')return;phase='transition';phaseStart=performance.now();show('bouquet-copy',false)}
  function showCake(){phase='cake';phaseStart=performance.now();bouquet.visible=false;cake.visible=true;show('birthday');$('controls').classList.add('show')}
  function wish(){if(phase!=='cake')return;phase='wished';phaseStart=performance.now();$('birthday').classList.add('wished')}
  function replay(){phase='welcome';phaseStart=performance.now();cake.visible=false;bouquet.visible=false;particles.visible=true;cake.position.y=-5;flame.visible=true;flameLight.intensity=8;$('birthday').classList.remove('wished');show('birthday',false);show('bouquet-copy',false);show('welcome');$('controls').classList.remove('show')}
  $('start').addEventListener('click',start);$('accept').addEventListener('click',transition);$('wish').addEventListener('click',wish);$('replay').addEventListener('click',replay);
  $('music').addEventListener('click',()=>{if(audio.paused){playMusic();$('music').textContent='音乐开/关'}else audio.pause()});
  $('scene').addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;$('scene').setPointerCapture(e.pointerId)});addEventListener('pointerup',()=>drag=false);addEventListener('pointermove',e=>{if(drag){userSpin+=(e.clientX-lastX)*.009;lastX=e.clientX}});
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight)});
  function animate(t){raf=requestAnimationFrame(animate);if(document.hidden)return;const elapsed=(t-phaseStart)/1000;root.rotation.y=userSpin+(reduced?0:t*.00008);rings.forEach((r,i)=>r.rotation.z=t*.00012*(i%2?1:-1));
    outerFlame.scale.y=1.7+Math.sin(t*.004)*.16;flame.rotation.z=Math.sin(t*.0022)*.06;
    if(phase==='forming'){const k=Math.min(1,elapsed/(reduced?.2:4));const pos=pg.attributes.position;for(let i=0;i<particleCount;i++){const e=1-Math.pow(1-k,3);pos.array[i*3]+=(pt[i*3]-pos.array[i*3])*.04*(1+e*2);pos.array[i*3+1]+=(pt[i*3+1]-pos.array[i*3+1])*.04*(1+e*2);pos.array[i*3+2]+=(pt[i*3+2]-pos.array[i*3+2])*.04*(1+e*2)}pos.needsUpdate=true;bouquet.scale.setScalar((mobile?.82:.95)*(.7+.3*k));if(elapsed>(reduced?.3:4.5)){phase='bouquet';phaseStart=t;show('bouquet-copy')}}
    if(phase==='bouquet'&&elapsed>8)transition();
    if(phase==='transition'){particles.rotation.y+=.018;bouquet.scale.multiplyScalar(.985);bouquet.rotation.y+=.025;if(elapsed>2.3)showCake()}
    if(phase==='cake'){cake.position.y+=( -.25-cake.position.y)*.035;particles.visible=false}
    if(phase==='wished'){flame.scale.multiplyScalar(.92);flameLight.intensity*=.9;if(elapsed>.8)flame.visible=false}
    composer.render();}
  phaseStart=performance.now();animate(phaseStart);
}
