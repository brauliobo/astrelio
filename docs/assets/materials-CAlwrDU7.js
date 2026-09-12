import{p as O,T as U,k as z,j as y,M as N,B as A,o as S,s as u,m as b,f as w,S as K,i as R,d as T}from"./vendor-sky-DUyptN6P.js";import{O as B,L as V,E,G as m,I as W,M as j,A as I,B as P,R as x,k as G,H as L,i as C,w as $,j as F,a as J,C as q}from"./vendor-astro-CH4inPTi.js";const de=1495978707e-1,H=695700,Q=6371,Y=1737.4,v=e=>`/astrelio/${String(e).replace(/^\//,"")}`,X=(e,a="2k")=>v(`planets/maps/${e.toLowerCase()}-${a}.jpg`),Z=[{name:"Sun",radiusKm:H,periodDays:0,color:"#ffd166",kind:"star"},{name:"Mercury",radiusKm:2439.7,periodDays:87.969,color:"#b8b1a8",kind:"planet"},{name:"Venus",radiusKm:6051.8,periodDays:224.701,color:"#e8cda2",kind:"planet"},{name:"Earth",radiusKm:Q,periodDays:365.256,color:"#6bb1e8",kind:"planet"},{name:"Moon",radiusKm:Y,periodDays:27.3217,color:"#dbeafe",kind:"moon",parent:"Earth"},{name:"Mars",radiusKm:3389.5,periodDays:686.98,color:"#e2725b",kind:"planet"},{name:"Jupiter",radiusKm:69911,periodDays:4332.589,color:"#e0b98c",kind:"planet"},{name:"Saturn",radiusKm:58232,periodDays:10759.22,color:"#e6ce9c",kind:"planet",rings:{innerKm:74500,outerKm:140220}},{name:"Uranus",radiusKm:25362,periodDays:30685.4,color:"#a8dce8",kind:"planet"},{name:"Neptune",radiusKm:24622,periodDays:60189,color:"#5b7ce6",kind:"planet"},{name:"Pluto",radiusKm:1188.3,periodDays:90560,color:"#c9b8a8",kind:"dwarf"}],pe=new Map(Z.map(e=>[e.name,e])),ye=["Mercury","Venus"],ve=["Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"],ge=["Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"],xe=["orrery","moon","eclipses","retrograde"],ee=G(),p=Math.PI/180,i=e=>P[e],s=e=>j(e instanceof Date?e:new Date(e)),ae=e=>({x:e.x,y:e.z,z:-e.y}),r=e=>ae(x(ee,e)),Me=e=>r(e),te=(e,a)=>r(L(i(e),s(a))),oe=(e,a)=>r(m(i(e),s(a),!0)),re=e=>Math.hypot(e.x,e.y,e.z),fe=(e,a)=>{const t=s(a);return new Map(e.map(o=>[o,o==="Sun"?{x:0,y:0,z:0}:te(o,t)]))},he=(e,a)=>{const t=W(i(e),s(a));return{magnitude:t.mag,phaseAngle:t.phase_angle,phaseFraction:t.phase_fraction,helioDistanceAu:t.helio_dist,geoDistanceAu:t.geo_dist,ringTilt:t.ring_tilt??null}},De=e=>{const a=V(s(e).date);return{latitudeDeg:a.elat,longitudeDeg:a.elon,distanceKm:a.dist_km,diameterDeg:a.diam_deg}},ze=(e,a)=>E(m(i(e),s(a),!0)).elon,Se=(e,a)=>E(m(i(e),s(a),!0)).elat,we=(e,a)=>{const t=J(m(i(e),s(a),!0));return q(t.ra,t.dec).name},Ee=(e,a,t)=>{const o=s(t);return I(m(i(e),o,!0),m(i(a),o,!0))},_e=(e,a,t)=>{const o=re(oe(e,t))*1495978707e-1;return Math.asin(Math.min(1,a/o))/p},ke=({latitude:e,longitude:a,elevation:t=0})=>new B(Number(e)||0,Number(a)||0,Number(t)||0),M=(e,a)=>({x:e.y*a.z-e.z*a.y,y:e.z*a.x-e.x*a.z,z:e.x*a.y-e.y*a.x}),D=(e,a)=>({x:e.x*a,y:e.y*a,z:e.z*a}),ne=(e,a)=>({x:e.x+a.x,y:e.y+a.y,z:e.z+a.z}),Oe=(e,a)=>{if(e==="Earth")return se(s(a));const t=C(i(e),s(a)),o=t.ra*15*p,n=t.spin*p,l={x:t.north.x,y:t.north.y,z:t.north.z},c={x:-Math.sin(o),y:Math.cos(o),z:0},d=ne(D(c,Math.cos(n)),D(M(l,c),Math.sin(n)));return{x:r(d),y:r(M(l,d)),z:r(l)}},se=e=>{const a=$(e)*15*p,t=F(e),o=x(t,{x:Math.cos(a),y:Math.sin(a),z:0}),n=x(t,{x:0,y:0,z:1});return{x:r(o),y:r(M(n,o)),z:r(n)}},ie=()=>({x:r({x:1,y:0,z:0}),y:r({x:0,y:1,z:0}),z:r({x:0,y:0,z:1})}),_=new O(1,96,64),ce=new U,k=()=>(globalThis.devicePixelRatio||1)<2&&(globalThis.innerWidth||1920)<900?"1k":"2k",g=(e,{color:a=!0,anisotropy:t=8}={})=>{const o=ce.load(e);return a&&(o.colorSpace=K),o.anisotropy=t,o.minFilter=R,o},f=e=>g(X(e,k())),h=(e,{color:a=!0}={})=>g(v(`planets/maps/${e}-${k()}.${e==="saturn-rings"?"png":"jpg"}`),{color:a}),Ue=e=>new z({map:f(e),roughness:.92,metalness:0}),Ne=({map:e,color:a,colorMap:t})=>new z({map:e?g(v(`planets/maps/${e}-1k.jpg`)):null,color:t?"#ffffff":a,roughness:.95,metalness:0}),Ae=e=>new y({map:f(e)}),be=()=>new S({uniforms:{dayMap:{value:f("Earth")},nightMap:{value:h("earth-night")},sunDirection:{value:new u(1,0,0)},nightGlow:{value:.9}},vertexShader:`
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    void main() {
      vUv = uv;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
    uniform sampler2D dayMap;
    uniform sampler2D nightMap;
    uniform vec3 sunDirection;
    uniform float nightGlow;
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    void main() {
      float lambert = dot(normalize(vWorldNormal), normalize(sunDirection));
      float day     = smoothstep(-0.08, 0.22, lambert);
      vec3 lit      = texture2D(dayMap, vUv).rgb * max(lambert, 0.0);
      vec3 dark     = texture2D(nightMap, vUv).rgb * nightGlow;
      gl_FragColor  = vec4(mix(dark, lit, day) + lit * 0.06, 1.0);
    }
  `}),Ke=()=>new S({transparent:!0,depthWrite:!1,uniforms:{cloudMap:{value:h("earth-clouds",{color:!1})},sunDirection:{value:new u(1,0,0)}},vertexShader:`
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    void main() {
      vUv = uv;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
    uniform sampler2D cloudMap;
    uniform vec3 sunDirection;
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    void main() {
      float cover   = texture2D(cloudMap, vUv).r;
      float lambert = max(dot(normalize(vWorldNormal), normalize(sunDirection)), 0.0);
      gl_FragColor  = vec4(vec3(1.0) * (0.15 + lambert), cover * (0.12 + lambert * 0.72));
    }
  `}),Re=(e,a,t=160)=>{const o=new b(e,a,t),n=o.attributes.position,l=o.attributes.uv;for(let c=0;c<n.count;c+=1){const d=Math.hypot(n.getX(c),n.getY(c));l.setXY(c,(d-e)/(a-e),.5)}return l.needsUpdate=!0,o},Te=()=>new y({map:h("saturn-rings"),side:w,transparent:!0,opacity:.92}),Be=e=>{const a=new N(_,new y({map:g(v("sky/starmap-4k.jpg")),side:A,depthWrite:!1}));return a.scale.setScalar(e),a.renderOrder=-1,le(a,ie()),a},Ve=(e,a)=>new y({color:new T(e),transparent:!0,opacity:a,depthWrite:!1,side:w}),le=(e,a)=>{e.matrixAutoUpdate=!1,e.matrix.makeBasis(new u(a.x.x,a.x.y,a.x.z),new u(a.z.x,a.z.y,a.z.z),new u(-a.y.x,-a.y.y,-a.y.z)),e.matrix.scale(new u(e.scale.x,e.scale.y,e.scale.z)),e.matrix.setPosition(e.position)},We=e=>{e?.traverse?.(a=>{a.geometry&&a.geometry!==_&&a.geometry.dispose();const t=Array.isArray(a.material)?a.material:[a.material];for(const o of t)if(o){for(const n of Object.values(o.uniforms||{}))n?.value?.dispose?.();o.map?.dispose?.(),o.dispose()}})};export{de as A,Z as B,Ue as C,Q as E,ye as I,Y as M,ve as O,ge as R,H as S,_ as U,xe as V,pe as a,_e as b,le as c,s as d,Ke as e,we as f,We as g,be as h,Se as i,ze as j,Me as k,Ae as l,oe as m,te as n,fe as o,he as p,re as q,De as r,Ne as s,ke as t,Oe as u,Re as v,Te as w,Ee as x,Ve as y,Be as z};
