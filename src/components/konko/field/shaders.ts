/**
 * Shaders for the KonKo Rush particle field.
 *
 * The flow map, spring simulation and capsule streaks are adapted from
 * "Sculpture Hero" by Guglielmo Giannattasio (components/ui/liquid-sculpture-hero).
 * Here the home of every particle is not an image pixel but a point on one of many
 * animated 3D delivery forms, and the cursor is slipstream, not liquid.
 */

import { FORM, NOISE } from "./form-glsl"

export const QUAD_VS = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }
`

/** Cursor wake, in viewport space. RGBA8: velocity around 128, energy in B. */
export const FLOW_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform vec2 uSize;
uniform float uRadius;
uniform float uPresence;
uniform float uDecay;
vec2 decV(vec4 c){ return (c.rg*255.0-128.0)/127.0; }
void main(){
  vec2 v0 = decV(texture(uPrev, vUv));
  vec2 uv = vUv - v0*uTexel*2.5;
  vec4 c = texture(uPrev, uv)*0.52
    + 0.12*(texture(uPrev, uv+vec2(uTexel.x,0.0)) + texture(uPrev, uv-vec2(uTexel.x,0.0))
          + texture(uPrev, uv+vec2(0.0,uTexel.y)) + texture(uPrev, uv-vec2(0.0,uTexel.y)));
  vec2 v = decV(c);
  float p = c.b;
  vec2 d = (vUv-uMouse)*uSize;
  float f = exp(-dot(d,d)/(uRadius*uRadius))*uPresence;
  float sp = clamp(length(uVel)*2.5, 0.0, 1.0);
  v += uVel*f*0.24;
  p = max(p, f*sp);
  v *= uDecay; p *= uDecay;
  v = sign(v)*max(abs(v)-1.2/127.0, 0.0);
  p = max(p-1.2/255.0, 0.0);
  v = clamp(v, -1.0, 1.0);
  o = vec4((v*127.0+128.0)/255.0, p, 1.0);
}
`

/** Spring simulation. State = (offset from home, velocity) in CSS px. */
export const SIM_FS = `#version 300 es
precision highp float;
precision highp int;
out vec4 o;
uniform sampler2D uState;
uniform sampler2D uSeed;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform sampler2D uFlow;
uniform int uRebase;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uPresence;
uniform float uDt;
uniform float uAge;
uniform float uGust;
${NOISE}
${FORM}
uniform Form uA;
uniform Form uB;
vec2 curl(vec2 p){
  const float e = 0.35;
  float a = vnoise(p+vec2(0.0,e)) - vnoise(p-vec2(0.0,e));
  float b = vnoise(p+vec2(e,0.0)) - vnoise(p-vec2(e,0.0));
  return vec2(a, -b)/(2.0*e);
}
void main(){
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 sd = texelFetch(uSeed, ij, 0);
  vec4 st = texelFetch(uState, ij, 0);
  Ev B = evalForm(uTexB, uB, ij, sd);
  if(uRebase == 1){
    Ev A = evalForm(uTexA, uA, ij, sd);
    vec2 from = clamp(A.px + st.xy, -0.25*uView, 1.25*uView);
    o = vec4(from - B.px, st.zw*0.5);
    return;
  }
  vec2 off = st.xy;
  vec2 vel = st.zw;
  vec2 p = B.px + off;
  vec4 fl = texture(uFlow, clamp(p/uView, 0.0, 1.0));
  vec2 wake = (fl.rg*255.0-128.0)/127.0;
  vec2 toM = p - uMouse;
  float r2 = dot(toM,toM);
  float f = exp(-r2/(uRadius*uRadius))*uPresence;
  vec2 n = toM*inversesqrt(r2+1.0);
  float e = clamp(fl.b*2.0 + f*0.35, 0.0, 1.0);

  // morph: particles let go one by one, then are pulled in
  float delay = sd.w*0.42 + sd.y*0.1;
  float go = smoothstep(delay, delay+0.35, uAge);
  float fly = go*smoothstep(1.9, 0.5, uAge);

  vec2 acc = vec2(0.0);
  // wind: mostly carried by the gust, a little pushed and curled around the cursor
  acc += n*f*0.5*B.light;
  acc += vec2(-n.y, n.x)*f*0.35*B.light;
  acc += (wake*46.0*B.light - vel)*e*0.085;
  vec2 q = p*0.0085 + vec2(uTime*0.35, -uTime*0.2);
  vec2 c = curl(q) + 0.5*curl(q*2.3 + 7.1);
  acc += c*(e*1.35*B.light + fly*2.6);
  // constant breath of wind over light material
  acc += vec2(0.06, -0.012)*uGust*max(B.light-0.9, 0.0)*(0.5+0.5*vnoise(p*0.006 + vec2(-uTime*0.6, 0.0)));
  float k = mix(0.018, 0.0125, fly)*(0.7+sd.z*0.6)*go;
  acc -= off*k;
  vel += acc*uDt;
  vel *= pow(mix(0.885, 0.95, e), uDt);
  off += vel*uDt;
  if(dot(off,off) < 0.0004 && dot(vel,vel) < 0.0004){ off = vec2(0.0); vel = vec2(0.0); }
  o = vec4(off, vel);
}
`

export const PART_VS = `#version 300 es
precision highp float;
precision highp int;
layout(location=0) in vec2 aCorner;
uniform sampler2D uState;
uniform sampler2D uSeed;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform int uTexW;
uniform float uDot;
uniform float uAge;
uniform float uFade;
uniform vec3 uHot;
uniform vec4 uVeil[3];
uniform vec3 uInk;
uniform vec3 uCool;
uniform vec3 uWarm;
out vec2 vLocal;
out float vHalfLen;
out float vR;
out vec3 vCol;
out float vA;
${NOISE}
${FORM}
uniform Form uA;
uniform Form uB;
void main(){
  int id = gl_InstanceID;
  ivec2 ij = ivec2(id % uTexW, id / uTexW);
  vec4 sd = texelFetch(uSeed, ij, 0);
  vec4 st = texelFetch(uState, ij, 0);
  Ev e = evalForm(uTexB, uB, ij, sd);
  float a = e.a, s = e.s, tone = e.tone;
  if(uAge < 1.6){
    Ev A = evalForm(uTexA, uA, ij, sd);
    float m = smoothstep(sd.w*0.42, sd.w*0.42+0.75, uAge);
    a = mix(A.a, a, m); s = mix(A.s, s, m); tone = mix(A.tone, tone, m);
  }
  a *= uFade;
  if(a < 0.012){ gl_Position = vec4(2.0,2.0,2.0,1.0); return; }
  vec2 base = e.px + st.xy;
  // keep copy readable: particles thin out behind marked text blocks
  for(int i=0;i<3;i++){
    if(uVeil[i].z > 0.0){
      vec2 vq = abs(base - uVeil[i].xy) - uVeil[i].zw;
      float vd = length(max(vq, 0.0)) + min(max(vq.x, vq.y), 0.0);
      a *= mix(0.08, 1.0, smoothstep(-8.0, 46.0, vd));
    }
  }
  vec2 v = st.zw;
  float sp = length(v);
  vec2 dir = sp > 0.001 ? v/sp : vec2(1.0,0.0);
  float r = uDot*s*(0.78+sd.y*0.44)*0.5;
  float len = min(sp*1.15, 20.0);
  vec2 lc = aCorner*vec2(r + len*0.5 + 1.0, r + 1.0);
  vec2 world = base - dir*len*0.5 + dir*lc.x + vec2(-dir.y, dir.x)*lc.y;
  vec2 clip = world/uView*2.0-1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vLocal = lc; vHalfLen = len*0.5; vR = r;
  vec3 col = tone < 0.4 ? mix(uCool, uInk, tone/0.4) : tone < 0.8 ? mix(uInk, uWarm, (tone-0.4)/0.4) : mix(uWarm, uHot, (tone-0.8)/0.2);
  vCol = col; vA = a;
}
`

export const PART_FS = `#version 300 es
precision highp float;
in vec2 vLocal;
in float vHalfLen;
in float vR;
in vec3 vCol;
in float vA;
uniform float uDpr;
out vec4 o;
void main(){
  vec2 q = vec2(max(abs(vLocal.x)-vHalfLen, 0.0), vLocal.y);
  float d = length(q) - vR;
  float a = clamp(0.5 - d*uDpr, 0.0, 1.0);
  float tail = vHalfLen > 0.0 ? clamp(0.5 - vLocal.x/(2.0*(vHalfLen+vR)), 0.0, 1.0) : 0.0;
  a *= 1.0 - tail*0.55;
  a *= vA;
  if(a < 0.004) discard;
  o = vec4(vCol*a, a);
}
`
