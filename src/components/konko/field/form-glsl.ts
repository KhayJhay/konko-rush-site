/** GLSL that evaluates where a particle lives on a given delivery form. */
export const NOISE = /* glsl */ `
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x), u.y); }
`

export const FORM = /* glsl */ `
struct Form { int kind; vec4 place; vec4 cam; vec4 p; float size; };
struct Ev { vec2 px; float z; float a; float s; float tone; float light; };

uniform vec2 uView;
uniform float uTime;
uniform float uAudio;
uniform float uDrive;   // distance driven, in van units
uniform float uArrive;  // 1 = the visitor's van is still off-screen, 0 = parked
uniform float uJoined;  // 1 once the visitor has added a van
uniform vec4 uRacer[6]; // track racers: x, y, z, heading

// wheels per vehicle: front x, rear x, axle height (= tyre radius)
vec3 wheelOf(int k){ return k == 17 ? vec3(0.62, -0.62, 0.19) : k == 16 ? vec3(0.66, -0.64, 0.30) : k == 15 ? vec3(0.62, -0.60, 0.15) : vec3(0.60, -0.60, 0.15); }
// the silhouette the wind flows over
float roofY(float x, int k){
  if(k == 17){
    float y = 0.18;
    y = mix(y, 0.36, smoothstep(0.9, 0.55, x));
    y = max(y, 0.5*smoothstep(0.35, 0.15, x)*smoothstep(-0.5, -0.3, x));
    y = max(y, 0.76*smoothstep(-0.62, -0.7, x)*smoothstep(-1.08, -1.0, x));
    return mix(y, 0.5, smoothstep(-1.1, -2.9, x));
  }
  if(k == 16){
    float y = 1.0;
    y = max(y, 0.98 + 0.88*exp(-pow((x - 0.04)/0.24, 2.0)));
    y = max(y, 1.38*smoothstep(-1.02, -0.92, x)*smoothstep(-0.42, -0.52, x));
    y = mix(y, 0.92, smoothstep(0.45, 0.8, x));
    y = mix(y, 0.4, smoothstep(0.8, 1.2, x));
    return mix(y, 1.1, smoothstep(-1.1, -2.9, x));
  }
  if(k == 15){
    float y = 0.8;
    y = mix(y, 0.56, smoothstep(0.17, 0.45, x));
    y = mix(y, 0.44, smoothstep(0.45, 0.99, x));
    y = mix(y, 0.18, smoothstep(0.99, 1.22, x));
    y = mix(y, 0.52, smoothstep(-0.34, -0.66, x));
    return mix(y, 0.44, smoothstep(-1.1, -2.9, x));
  }
  float y = 0.94;
  y = mix(y, 0.56, smoothstep(0.40, 0.74, x));
  y = mix(y, 0.42, smoothstep(0.74, 0.95, x));
  y = mix(y, 0.13, smoothstep(0.95, 1.22, x));
  return mix(y, 0.52, smoothstep(-1.25, -2.9, x));
}
// the corridor road: bend sets the arc, wig adds city-street kinks
vec3 road(float tt, float bend, float wig){
  float s = sin(3.14159*tt);
  return vec3(mix(-1.15, 1.15, tt), 0.0, -(bend*s*0.55 + wig*0.16*sin(tt*3.14159*5.0)*s));
}
// light at the van's own lamps and roof; lower body is heavier
vec3 camDir(vec4 cam){ return vec3(-cam.y*cam.z, cam.w, cam.x*cam.z); }
float facing(vec3 n, vec4 cam){ return smoothstep(-0.03, 0.2, dot(n, camDir(cam))); }

Ev evalForm(in sampler2D tex, Form F, ivec2 ij, vec4 sd){
  vec4 d = texelFetch(tex, ij, 0);
  float gf = floor(d.w);
  int g = int(gf);
  vec3 p = d.xyz;
  Ev e;
  e.a = 1.0; e.s = 1.0; e.z = 0.0;
  e.tone = clamp((d.w - gf)/0.98, 0.0, 1.0);
  e.light = 0.4 + sd.x*0.8;
  float t = uTime;

  if(g == 511){ e.a = 0.0; }
  else if(F.kind == 0 || F.kind == 15 || F.kind == 16 || F.kind == 17){  // vehicles on the road
    int K = F.kind;
    vec3 W = wheelOf(K);
    float xr = F.p.x;
    float speed = K == 15 ? F.p.y : F.p.w;
    float bob = (0.006*sin(t*5.3) + 0.004*sin(t*8.1+1.0))*speed;
    if(K == 17 && g >= 30 && g < 40){
      // the tin formula: parts fly in from the workbench and lock together
      float i = float(g - 30);
      float k = smoothstep(i*0.07 + 0.04, i*0.07 + 0.34, F.p.x);
      float q = 1.0 - k;
      if(g >= 34 && g <= 37){
        vec2 c = g <= 35 ? vec2(0.62, 0.17) : vec2(-0.62, 0.21);
        float an = -uDrive/c.y; vec2 w = p.xy - c; float cs = cos(an), sn = sin(an);
        p.xy = c + vec2(w.x*cs - w.y*sn, w.x*sn + w.y*cs);
      }
      vec3 dir = normalize(vec3(hash(vec2(i, 1.3)) - 0.5, 0.45 + hash(vec2(i, 7.1)), hash(vec2(i, 4.7)) - 0.5));
      float sp = q*q*(mod(i, 2.0) < 1.0 ? 1.6 : -1.6);
      p.xz = vec2(p.x*cos(sp) - p.z*sin(sp), p.x*sin(sp) + p.z*cos(sp));
      p += dir*q*q*1.7;
      p.y += bob; e.s = 0.95; e.light *= 0.55;
    } else if(K == 16 && g <= 3){
      p.y += bob;
      e.a = g == 2 ? mix(0.95, 0.1, xr) : g == 3 ? xr : 0.95;
      e.s = 0.9; e.light *= g == 1 ? 0.45 : 0.6;
    } else if(g >= 20 && g < 28){
      float i = float(g - 20);
      float k = smoothstep(i*0.13 + 0.12, i*0.13 + 0.22, F.p.w);
      p.y += pow(1.0 - k, 2.0)*0.75; p.y += bob;
      e.a = k*max(xr, 0.3); e.s = 0.98; e.light *= 0.6;
    } else if(g <= 4){
      vec3 n = g==0 ? vec3(0.0,0.0,1.0) : g==1 ? vec3(0.0,0.0,-1.0) : g==2 ? vec3(0.0,1.0,0.0) : g==3 ? vec3(0.75,0.66,0.0) : vec3(-1.0,0.0,0.0);
      e.a = facing(n, F.cam)*mix(0.86, 0.07, xr);
      e.s = 0.86; p.y += bob; e.light *= 0.55 + 0.6*smoothstep(0.3, 0.9, p.y);
    } else if(g <= 8){
      bool front = g <= 6; bool far = (g == 6 || g == 8);
      vec2 c = vec2(front ? W.x : W.y, W.z);
      float an = -uDrive/W.z;
      vec2 w = p.xy - c; float cs = cos(an), sn = sin(an);
      p.xy = c + vec2(w.x*cs - w.y*sn, w.x*sn + w.y*cs);
      e.a = far ? 0.28 : 1.0; e.light *= 0.4;
    } else if(g <= 10){
      p.y += bob; e.a = facing(vec3(g==9 ? 1.0 : -1.0, 0.0, g==9 ? 0.2 : 0.35), F.cam); e.s = 1.35; e.light *= 0.5;
    } else if(g == 11){
      float k = fract(d.y + t*(0.28+sd.y*0.2));
      float side = sd.z < 0.5 ? -1.0 : 1.0;
      vec3 lamp = K == 17 ? vec3(1.0, 0.14, side*0.3) : K == 16 ? vec3(0.62, 0.88, 0.0) : K == 15 ? vec3(0.99, 0.4, side*0.25) : vec3(0.985, 0.36, side*0.24);
      p = vec3(lamp.x + k*1.75, lamp.y - k*(K == 16 ? 0.5 : 0.24) + d.x*(0.03+k*0.26), lamp.z + d.z*(0.03+k*0.42));
      p.y = max(p.y, 0.005);
      e.a = F.p.z*smoothstep(0.0,0.04,k)*pow(1.0-k,1.5)*0.8; e.s = 0.95; e.light = 1.5;
    } else if(g == 12 || g == 15){
      float L = 4.4;
      float x = mod(d.x - uDrive + L, 2.0*L) - L;
      p.x = x; e.a = F.p.y*smoothstep(L, L*0.45, abs(x))*(g == 12 ? 1.0 : 0.34);
      e.s = g == 12 ? 1.0 : 0.72; e.light = 0.5;
    } else if(g == 13){
      float k = fract(d.y + t*(0.1+sd.y*0.07)*(0.35+F.p.w*0.9));
      float x = mix(1.75, -3.5, k);
      float behind = smoothstep(-1.0, -3.2, x);
      float y = roofY(x, K) + 0.035 + d.x*(0.24 + behind*0.3);
      y += behind*0.1*sin(x*3.2 + d.x*9.0 - t*1.3 + sd.y*2.0);
      p = vec3(x, y, d.z*(1.0 - behind*0.25) + behind*0.07*sin(x*2.3 + d.z*8.0 + t));
      e.a = F.p.y*smoothstep(0.0,0.14,k)*smoothstep(1.0,0.5,k)*0.8; e.s = 0.78; e.light = 1.7;
    } else if(g == 14){
      p.y += bob; e.a = xr; e.s = 0.95; e.light *= 0.6;
    } else if(g == 16){
      float L = 5.0; float x = mod(d.x - uDrive*0.9 + L, 2.0*L) - L;
      p = vec3(x, d.y, d.z); e.a = F.p.y*smoothstep(L, L*0.4, abs(x))*0.7; e.light = 0.8;
    } else if(g == 17 || g == 18 || g == 19){
      float f = g == 17 ? facing(vec3(0.0,0.0,1.0), F.cam) : g == 18 ? facing(vec3(0.0,0.0,-1.0), F.cam) : mix(0.12, 1.0, smoothstep(0.12, 0.4, abs(F.cam.y)));
      e.a = mix(f, g == 19 ? f : max(f, 0.4)*0.9, xr); e.s = 1.04; p.y += bob; e.light *= 0.6;
    }
    p.y -= K == 17 ? 0.32 : K == 16 ? 0.92 : K == 15 ? 0.36 : 0.44;
  }
  else if(F.kind == 1){                                // crates being loaded
    int id = g >> 3; int face = g & 7;
    if(id < 36){
      float T = F.p.x;
      float t0 = float(id)/36.0*0.9;
      float k = smoothstep(t0, t0+0.075, T);
      float nF = (id % 12) < 8 ? smoothstep(0.05, 0.075, T - float(id+4)/36.0*0.9) : 0.0;
      float nR = (id % 4) < 3 ? smoothstep(0.05, 0.075, T - float(id+1)/36.0*0.9) : 0.0;
      float nT = id < 24 ? smoothstep(0.05, 0.075, T - float(id+12)/36.0*0.9) : 0.0;
      float cover = face == 0 || face == 6 ? nF : face == 1 || face == 5 ? nR : nT;
      p.y += pow(1.0-k, 1.6)*1.15;
      e.a = smoothstep(0.0, 0.35, k)*(1.0-cover)*(face >= 4 ? 1.0 : face == 2 ? 0.95 : face == 1 ? 0.7 : 0.9);
      e.s = face >= 4 ? 1.05 : 0.88; e.light *= 0.6;
    } else { e.a = 0.75; e.light *= 0.5; }
  }
  else if(F.kind == 2){                                // city blocks + route
    if(g == 2){
      float head = fract(t*0.11)*1.25;
      float lit = smoothstep(head+0.004, head-0.004, e.tone);
      float hot = exp(-abs(head - e.tone)*34.0);
      e.a = mix(0.22, 1.0, lit); e.s = mix(0.8, 1.15, lit) + hot*0.6; e.tone = mix(0.62, 0.8, lit) + hot*0.19; e.light *= 0.3;
    } else if(g == 3){ p.y += 0.02*sin(t*1.6 + d.x*7.0); e.light *= 0.4; e.s = 1.1; }
    else if(g == 1){ e.a = 0.72; e.s = 0.86; }
    else { e.a = 0.5; e.s = 0.8; }
  }
  else if(F.kind == 3){                                // pin
    if(g == 7){ p.y += uArrive*2.6; p.x += uArrive*0.15; e.a = uJoined; e.light *= 0.4; }
    else if(g == 1){
      float k = fract(d.y + t*0.17); float r = 0.08 + k*1.25;
      p = vec3(cos(d.x)*r, d.z - 0.72, sin(d.x)*r);
      e.a = smoothstep(0.0,0.08,k)*pow(1.0-k,1.2)*0.9; e.tone = mix(0.8, 0.4, k);
    } else if(g == 0){ p.y += 0.03*abs(sin(t*1.5)); }
  }
  else if(F.kind == 4){                                // shop door
    if(g == 1){
      float o = 0.5 - 0.5*cos(min(fract(t*0.11)*1.35, 1.0)*6.28318); float an = o*1.25;
      vec2 h = vec2(0.10, 0.30); vec2 w = p.xz - h;
      p.xz = h + vec2(w.x*cos(an) - w.y*sin(an), w.x*sin(an) + w.y*cos(an));
    } else if(g == 2){ float o = 0.5 - 0.5*cos(min(fract(t*0.11)*1.35, 1.0)*6.28318); e.a = o*0.85; e.light = 1.2; }
    else if(g == 3){ p.y += 0.012*sin(t*2.1 + p.x*8.0)*smoothstep(0.28, 0.62, p.z); }
    else if(g == 4){ float r = fract(d.y + t*0.5); float rr = 0.03 + r*0.2; p = vec3(-0.06 + cos(d.x)*rr, -0.12 + sin(d.x)*rr, 0.31); e.a = (1.0-r)*0.9; }
  }
  else if(F.kind == 5){                                // proof of delivery
    int face = g & 7; int part = g >> 3;
    if(part == 0){
      vec3 n = face==0 ? vec3(0.0,0.0,1.0) : face==1 ? vec3(1.0,0.0,0.0) : face==2 ? vec3(0.0,1.0,0.0) : face==3 ? vec3(-1.0,0.0,0.0) : face==4 ? vec3(0.0,0.0,-1.0) : vec3(0.0);
      e.a = face >= 5 ? 1.0 : facing(n, F.cam)*(face == 2 ? 0.95 : face == 0 ? 0.62 : 0.8); e.s = face >= 5 ? 1.05 : 0.85;
      if(face >= 5){ e.a = 0.9; }
    } else if(part == 1){                              // tick, written stroke by stroke
      float w = fract(t*0.16)*2.2; float f = facing(vec3(0.0,0.0,1.0), F.cam);
      e.a = f*smoothstep(e.tone-0.01, e.tone+0.02, w); e.tone = 0.8; e.s = 1.25; e.light *= 0.5;
    } else { e.a = facing(vec3(0.0,0.0,1.0), F.cam); e.s = 0.95; }
  }
  else if(F.kind == 6){                                // receipt and coins
    if(g <= 1){
      float wv = 0.07*sin(p.y*3.1 + t*0.9) + 0.05*sin(p.y*5.7 - t*0.6);
      p.z += wv; p.x += 0.02*sin(p.y*2.4 + t*0.8); e.s = g == 1 ? 1.05 : 0.82; e.a = g == 1 ? 1.0 : 0.6;
    } else {
      vec3 c = g == 2 ? vec3(0.74,-0.42,0.2) : g == 3 ? vec3(0.9,0.12,-0.1) : vec3(0.62,0.6,0.1);
      float an = t*(g == 2 ? 1.1 : g == 3 ? -0.8 : 0.95) + gf; vec3 w = p - c;
      p = c + vec3(w.x*cos(an) + w.z*sin(an), w.y + 0.02*sin(t*1.4+gf), -w.x*sin(an) + w.z*cos(an));
      e.light *= 0.7;
    }
  }
  else if(F.kind == 7){                                // skyline that speaks
    float zf = d.z + t*0.016; float k = fract(zf);
    if(g == 0){
      float slots = 26.0;
      float id = floor(d.z*slots) + (d.x < 0.0 ? 100.0 : 0.0) + floor(abs(d.x)*3.2)*31.0;
      float near = exp(-abs(abs(d.x)-0.75)*0.55);
      float base = 0.14 + 0.62*pow(hash(vec2(id, 3.7)), 1.5)*mix(0.45, 1.0, smoothstep(0.5, 1.6, abs(d.x)));
      float band = vnoise(vec2(id*0.73, t*2.6))*vnoise(vec2(id*1.31+9.0, t*4.1));
      float h = base + uAudio*band*2.1*near;
      p = vec3(d.x, d.y*h - 0.34, mix(-6.4, 1.15, k));
      float lit = smoothstep(0.1, 0.75, uAudio*band*2.0*near);
      e.a = smoothstep(0.0,0.2,k)*smoothstep(0.97,0.7,k)*(0.22 + 0.78*d.y*d.y);
      e.tone = mix(mix(0.05, 0.4, d.y), 0.82, lit*d.y*d.y); e.s = 0.82;
    } else if(g == 1){
      float kk = fract(d.z + t*0.085); p = vec3(d.x, -0.34, mix(-6.4, 1.15, kk));
      e.a = smoothstep(0.0,0.3,kk)*smoothstep(1.0,0.93,kk); e.s = 0.95; e.light = 0.5;
    } else if(g == 2){
      p = vec3(d.x, -0.34, mix(-6.4, 1.15, k)); e.a = smoothstep(0.0,0.3,k)*smoothstep(1.0,0.9,k)*0.6; e.s = 0.8;
    } else {
      float dirn = d.x < 0.0 ? 1.0 : -1.0;
      float kk = fract(d.z + dirn*t*0.075); p = vec3(d.x, d.y - 0.34, mix(-6.4, 1.15, kk));
      e.a = smoothstep(0.0,0.2,kk)*smoothstep(1.0,0.92,kk); e.s = 1.3; e.light = 0.9;
    }
  }
  else if(F.kind == 8){                                // the day's run, on a map
    if(g == 1){
      float lit = smoothstep(e.tone-0.003, e.tone+0.003, F.p.x);
      float hot = exp(-abs(F.p.x - e.tone)*70.0);
      e.a = mix(0.3, 1.0, lit); e.s = mix(0.8, 1.15, lit) + hot*0.35; e.tone = mix(0.3, 0.8, lit); e.light *= 0.3;
    } else if(g == 2){
      float at = e.tone; float lit = smoothstep(at-0.004, at+0.004, F.p.x);
      e.a = mix(0.55, 1.0, lit); e.s = 1.1; e.tone = mix(0.4, 0.8, lit); e.light *= 0.35;
    } else if(g == 3){
      float cs = cos(F.p.w), sn = sin(F.p.w);
      p = vec3(F.p.y + d.x*cs - d.y*sn, 0.03 + d.z, -(F.p.z + d.x*sn + d.y*cs)); e.s = 1.15; e.light = 0.1;
    } else if(g == 4){
      float w = sin(p.z*26.0 + p.x*7.0 + t*0.8); e.a = 0.16 + 0.34*smoothstep(0.2, 1.0, w); e.s = 0.72; e.tone = 0.1;
    } else if(g == 5){ float b = 0.5+0.5*sin(t*1.7 + sd.x*6.28); e.a = 0.35 + 0.5*b; e.s = 0.9; }
    else { e.a = 0.42; e.s = 0.74; }
  }
  else if(F.kind == 9){                                // long exposure
    if(g == 0 || g == 1){
      float dirn = g == 0 ? 1.0 : -1.0;
      float sp = 0.05 + d.y*0.05;
      float s0 = fract(d.x + dirn*t*sp - dirn*d.z*(0.012 + F.p.x*0.42));
      float lane = e.tone*2.0 - 1.0;
      float z = mix(-8.0, 1.5, s0);
      float off = (g == 0 ? -0.11 : 0.11) + (g == 0 ? -1.0 : 1.0)*abs(lane)*0.36;
      p = vec3(1.15*sin(z*0.5 + 0.9) + 0.25 + off, -0.36 + sd.z*0.012 + 0.045*(sd.w > 0.5 ? 1.0 : 0.6), z);
      e.a = smoothstep(0.0,0.25,s0)*smoothstep(1.0,0.94,s0)*(1.0 - d.z*0.75);
      e.s = 0.95 + (1.0-d.z)*0.35; e.tone = g == 0 ? 0.42 + sd.y*0.2 : 0.97; e.light = 0.9;
    } else if(g == 2){ e.a = 0.4 + 0.6*pow(0.5+0.5*sin(t*(0.6+sd.x) + sd.y*6.28), 2.0); e.s = 0.8; }
    else if(g == 3){
      float s0 = fract(d.x); float z = mix(-8.0, 1.5, s0);
      p = vec3(1.15*sin(z*0.5 + 0.9) + 0.25 + d.y, -0.36 + d.z, z);
      e.a = smoothstep(0.0,0.3,s0)*smoothstep(1.0,0.94,s0)*0.4; e.s = 0.75;
    }
  }
  else if(F.kind == 10){                               // the fleet
    int id = g >> 3; int face = g & 7;
    if(id < 6){
      vec3 n = face==0 ? vec3(0.0,0.0,1.0) : face==2 ? vec3(0.0,1.0,0.0) : face==3 ? vec3(0.75,0.66,0.0) : vec3(0.0);
      e.a = face >= 5 ? 1.0 : facing(n, F.cam)*(face == 0 ? 0.6 : 0.9);
      if(id < 4 && face == 0) e.a *= 0.12;
      if(id < 4 && face == 5 && d.z - (float(id) - 2.5)*0.62 > 0.1) e.a *= mix(0.1, 1.0, smoothstep(-0.02, 0.12, d.y));
      if(id == 4 && face == 0) e.a *= mix(1.0, 0.12, uJoined*(1.0-smoothstep(0.0, 0.5, uArrive)));
      if(id == 5){ p.x -= uArrive*4.2; e.a *= uJoined*smoothstep(1.0, 0.85, uArrive); }
      e.s = face >= 5 ? 1.02 : 0.84; e.light *= 0.5;
    } else if(id == 7){ float s = 0.5+0.5*sin(t*2.2); e.a = (1.0-uJoined)*(0.35+0.65*s); e.s = 0.95; }
    else { e.a = 0.55; e.s = 0.8; }
  }

  else if(F.kind == 11){                               // clipboard, ticked row by row
    if(g == 1){ float w = fract(t*0.075)*1.45; e.a = smoothstep(e.tone-0.012, e.tone+0.012, w); e.tone = 0.8; e.s = 1.2; e.light *= 0.5; }
    else { e.s = 0.95; e.light *= 0.7; }
  }

  else if(F.kind == 18){                               // a circuit, with six racers on it
    if(g >= 40 && g < 46){ vec4 r = uRacer[g - 40]; p = vec3(r.x + d.x, d.y, r.z + d.z); e.s = g == 40 ? 1.35 : 1.15; e.light = 0.15; }
    else if(g == 5){ float head = fract(t*0.07); float l = exp(-abs(fract(e.tone - head + 0.5) - 0.5)*26.0); e.a = 0.12 + 0.88*l; e.tone = 0.82; e.s = 0.9 + l*0.5; }
    else if(g == 4){ e.a = 0.3; e.s = 0.7; }
    else if(g == 1){ e.s = 1.05; }
  }
  else if(F.kind == 19){                               // garage turntable under a spotlight
    if(g == 0){ float an = t*0.22; p.xz = vec2(p.x*cos(an) - p.z*sin(an), p.x*sin(an) + p.z*cos(an)); }
    else if(g == 1){ e.a = 0.12 + 0.3*pow(0.5 + 0.5*sin(t*1.7 + sd.x*30.0), 3.0); e.s = 0.8; e.light = 1.2; }
    else if(g == 3){ float k = fract(d.y + t*(0.18 + sd.y*0.2)); p.y = k*0.9; e.a = sin(k*3.14159)*0.9; e.s = 1.05; e.light = 1.4; }
    else { e.a = 0.3; e.s = 0.7; }
    p.y -= 0.42;
  }
  else if(F.kind == 20){                               // the cup
    float an = t*0.35; p.xz = vec2(p.x*cos(an) - p.z*sin(an), p.x*sin(an) + p.z*cos(an));
    if(g == 1){ e.a = pow(0.5 + 0.5*sin(t*3.0 + sd.x*40.0), 8.0); e.s = 1.4; e.light = 1.5; }
  }
  else if(F.kind == 21){                               // an item, spinning in its box
    if(g == 0){ float an = sin(t*0.7)*0.4; p.xz = vec2(p.x*cos(an) - p.z*sin(an), p.x*sin(an) + p.z*cos(an)); p.y += 0.04*sin(t*1.3); }
    else if(g == 1){ float an = t*0.5; p.xy = vec2(p.x*cos(an) - p.y*sin(an), p.x*sin(an) + p.y*cos(an)); e.s = 0.95; }
    else { float a = d.x + t*0.45; p = vec3(cos(a)*d.y, sin(a)*d.y, d.z); e.a = 0.2 + 0.8*pow(0.5 + 0.5*sin(t*2.5 + sd.x*20.0), 4.0); e.s = 1.1; e.light = 1.4; }
  }
  else if(F.kind == 22){                               // a controller, buttons pressed in turn
    if(g >= 1 && g <= 4){ float ph = mod(t*1.6 - float(g)*0.9, 3.6); float fl = exp(-ph*ph*6.0); e.s = 1.05 + fl*0.5; e.tone = mix(e.tone, 0.82, fl*0.5); p.z -= fl*0.03; }
    else if(g == 6){ p.xy += vec2(sin(t*1.7), cos(t*1.3))*0.025; }
    else if(g == 7){ p.xy += vec2(cos(t*1.1), sin(t*1.9))*0.025; }
    else if(g == 8){ p.y -= 0.02*max(0.0, sin(t*2.0)); }
    else if(g == 9){ e.a = 0.35; e.s = 0.7; }
    p.y -= 0.05;
  }
  else if(F.kind == 23){                               // the chequered flag
    if(g == 0){
      float u = d.x, v = d.y;
      float w = sin(u*5.5 - t*3.2)*0.17*u + sin(u*9.0 + v*3.0 - t*4.1)*0.045*u;
      p = vec3(u*1.55, 1.88 - v*1.0 - u*u*0.08 + sin(u*4.0 - t*3.2)*0.03*u, w);
      e.a = 0.72 + 0.28*cos(u*5.5 - t*3.2);
      e.s = 0.95;
    }
    p.x -= 0.62; p.y -= 0.96;
  }
  else if(F.kind == 13){                               // handover keypad: 4-8-2-1, then the lock opens
    float ph = mod(t, 6.4);
    if(g >= 1 && g <= 4){
      float at = 0.7 + float(g - 1)*0.62;
      float on = smoothstep(at, at + 0.12, ph)*(1.0 - smoothstep(5.6, 5.9, ph));
      e.tone = mix(e.tone*0.6, e.tone > 0.5 ? 0.86 : 0.55, on); e.a = e.tone > 0.5 ? on : 0.9; e.s = 1.1;
    } else if(g >= 10 && g < 22){
      int key = g - 10; float fl = 0.0;
      int seq[4] = int[4](3, 7, 1, 0);
      for(int i = 0; i < 4; i++){ if(seq[i] == key){ float at = 0.7 + float(i)*0.62; fl = max(fl, exp(-pow((ph - at)*7.0, 2.0))); } }
      e.tone = mix(e.tone, 0.86, fl); e.s = 1.0 + fl*0.5; p.z -= fl*0.03;
    } else if(g == 6){
      float open = smoothstep(3.3, 3.7, ph)*(1.0 - smoothstep(5.6, 6.0, ph));
      p.y += open*0.12; p.x += open*(p.x > 0.0 ? 0.0 : 0.0); e.tone = mix(e.tone, 0.86, open); e.s = 1.05;
    } else if(g == 7){
      float open = smoothstep(3.3, 3.7, ph)*(1.0 - smoothstep(5.6, 6.0, ph));
      e.tone = mix(e.tone, 0.82, open*0.8);
    } else { e.s = 0.9; }
    p.y -= 0.18;
  }
  else if(F.kind == 14){                               // a corridor between two pins
    float bend = F.p.x, wig = F.p.y;
    if(g <= 1 || g == 5 || g == 6){
      float tt = d.x;
      if(g == 1){ tt = fract(d.x + t*0.06*F.p.z); }
      vec3 a = road(tt, bend, wig), b = road(min(1.0, tt + 0.01), bend, wig) - road(max(0.0, tt - 0.01), bend, wig);
      vec3 side = normalize(vec3(-b.z, 0.0, b.x));
      float off = g == 0 ? d.y*0.055 : g == 6 ? d.y*0.42 : d.y*0.02;
      p = a + side*off + vec3(0.0, g == 5 ? 0.0 : d.z*0.0, 0.0);
      if(g == 1){ float head = fract(t*0.12*F.p.z); e.a = 0.35 + 0.65*exp(-abs(fract(tt - head + 0.5) - 0.5)*18.0); e.s = 1.15; }
      if(g == 5){ float on = step(fract(d.x*20.0 + 0.5), 0.5); p.y = 0.004; e.a = 0.5; }
      if(g == 6){ e.a = 0.25*smoothstep(0.42, 0.1, abs(off)); e.s = 0.75; }
    } else if(g == 2 || g == 3){
      vec3 at = road(g == 2 ? 0.0 : 1.0, bend, wig);
      float bounce = g == 3 ? 0.03*abs(sin(t*1.6)) : 0.0;
      p = at + d.xyz + vec3(0.0, bounce, 0.0); e.s = 1.1; e.light *= 0.4;
    } else { e.a = 0.4; e.s = 0.75; }
  }

  vec3 q = vec3(p.x*F.cam.x + p.z*F.cam.y, p.y, -p.x*F.cam.y + p.z*F.cam.x);
  float sy = q.y*F.cam.z - q.z*F.cam.w;
  float dz = q.y*F.cam.w + q.z*F.cam.z;
  float per = F.place.w/max(0.35, F.place.w - dz);
  e.px = F.place.xy + vec2(q.x, -sy)*F.place.z*per;
  e.z = dz;
  e.s *= mix(0.72, 1.0, clamp(per, 0.2, 1.5))*F.size;
  return e;
}
`
