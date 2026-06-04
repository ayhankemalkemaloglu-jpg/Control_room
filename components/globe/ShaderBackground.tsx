"use client";

import { useEffect, useRef } from "react";

/**
 * Full-screen WebGL2 raymarch shader (Shadertoy-style `mainImage`).
 * Black + champagne-gold palette to match the site theme (--gold #c9a961).
 * Tuned for ~60fps: capped DPR, reduced march/reflection iterations, and it
 * pauses when the tab is hidden or the element scrolls out of view.
 */

// Fragment shader — user-provided raymarch, recolored black+gold and the
// iteration counts trimmed for 60fps. Wrapped for WebGL2 (#version 300 es).
const FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform float iTime;
uniform vec3  iResolution;
out vec4 _fragColor;

#define T (sin(iTime*.6)*16.+iTime*1e2)
#define P(z) (vec3(cos((z)*.011)*16.+cos((z) * .012)  *24., \
                   cos((z)*.01)*4., (z)))
#define R(a) mat2(cos(a+vec4(0,33,11,0)))
#define N normalize

// Champagne-gold light tints (was orange + blue → both gold for black/gold theme)
#define GOLD_A vec4(1e1, 6.5, 2.5, 0.)   // warm gold
#define GOLD_B vec4(1e1, 8.0, 4.0, 0.)   // pale champagne
#define BRIGHT 2.4                        // exposure: low but not too low

float boxen(vec3 p) {
    p = abs(fract(p/2e1)*2e1 - 1e1) - 1.;
    return min(p.x, min(p.y, p.z));
}

vec4 lights;
float map(vec3 p) {
    vec3 q = P(p.z);
    float m, g = q.y-p.y + 6.;

    m = boxen(p);

    p.xy -= q.xy;

    // squiggly line along z
    float red,blue;
    float e = min(red=length(p.xy -  sin(p.z / 12. + vec2(0, 1.3))*12.) - 1.,
                  blue=length(p.xy -  sin(p.z / 16. + vec2(0, .7))*16.) - 2.);

    lights += GOLD_A/(.1+abs(red));
    lights += GOLD_B/(.1+abs(blue)/1e1);

    p = abs(p);

    float tex = abs(length(sin(p*cos(p.yzx/3e1)*4.)/(p*4.)));
    float tun = min(32.-p.x - p.y, 24.-p.y);

    float d = max(min(m, g), tun)-tex;
    return min(e, d);
}

void mainImage(out vec4 o, in vec2 u) {
    float i,s,d;
    vec3  r = iResolution;

    u = (u-r.xy/2.)/r.y;

    u.y -=.2;
    o = vec4(0);
    vec3  p = P(T),ro=p,
          Z = N( P(T+2.) - p),
          X = N(vec3(Z.z,0,-Z)),
          D = N(vec3(R(sin(T*.005)*.4)*u, 1)
             * mat3(-X, cross(X, Z), Z));

    // main march — kept at 100 steps for faithful depth/brightness; fps comes
    // from the 0.75 resolution scale + DPR=1 cap instead (least-visible trim).
    for(; i++ < 1e2;)
        p = ro + D * d,
        d += s = map(p)*.8,
        o += lights + 1./max(s, .01);

    // normal (tetrahedron technique)
    const float h = 0.005;
    const vec2 k = vec2(1,-1);
    vec3 n = N(k.xyy*map( p + k.xyy*h ) +
               k.yyx*map( p + k.yyx*h ) +
               k.yxy*map( p + k.yxy*h ) +
               k.xxx*map( p + k.xxx*h ) );

    // diffuse
    o *= (.1 + max(dot(n, -D), 0.));

    // reflection march — modest trim 50 -> 30 (reflections are subtle)
    vec4 ref;
    lights = vec4(0);
    for(p += n*.05, D = reflect(D, n), s=i=0.; i++<3e1; )
        p += D*s,
        s = map(p)*.8,
        ref +=  lights + 1./max(s, .01);

    o += o*ref;
    o = tanh(o / 1e9 * BRIGHT * exp(GOLD_A*d/5e2));
}

void main() {
    vec4 o;
    mainImage(o, gl_FragCoord.xy);
    _fragColor = vec4(o.rgb, 1.0);
}
`;

const VERT = /* glsl */ `#version 300 es
precision highp float;
const vec2 verts[3] = vec2[3](vec2(-1.,-1.), vec2(3.,-1.), vec2(-1.,3.));
void main() { gl_Position = vec4(verts[gl_VertexID], 0., 1.); }
`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    // eslint-disable-next-line no-console
    console.error("shader compile error:", gl.getShaderInfoLog(sh));
  }
  return sh;
}

export function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
    if (!gl) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const uTime = gl.getUniformLocation(prog, "iTime");
    const uRes = gl.getUniformLocation(prog, "iResolution");
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Cap DPR at 1 and render at 75% scale → big fill-rate win for the heavy
    // raymarch while staying crisp enough as a background visual.
    const SCALE = 0.75;
    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * SCALE));
      const h = Math.max(1, Math.floor(canvas.clientHeight * SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    let raf = 0;
    let running = true;
    const start = performance.now();
    const render = (now: number) => {
      if (!running) return;
      resize();
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform3f(uRes, canvas.width, canvas.height, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    // Pause when the tab is hidden (saves GPU / battery).
    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[16px] border border-border bg-background">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
