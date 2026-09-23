"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Signature from "./Signature";
import { chooseBackground, type Background } from "./backgrounds";

const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() { uv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }
`;
const fragmentSource = `
precision mediump float;
varying vec2 uv;
uniform sampler2D picture;
uniform sampler2D depthMap;
uniform float drift;
uniform float turbo;
uniform vec2 imageSize;
uniform vec2 screenSize;
uniform vec2 pointer;
uniform float pixelRatio;

float bayer(vec2 p) {
  vec2 a = mod(floor(p), 2.);
  vec2 b = mod(floor(p / 2.), 2.);
  float low = 2. * a.x + 3. * a.y - 4. * a.x * a.y;
  float high = 2. * b.x + 3. * b.y - 4. * b.x * b.y;
  return (4. * low + high) / 16. - .5;
}
void main() {
  vec2 cover = vec2(1.);
  float screenAspect = screenSize.x / screenSize.y;
  float imageAspect = imageSize.x / imageSize.y;
  if (screenAspect > imageAspect) cover.y = imageAspect / screenAspect;
  else cover.x = screenAspect / imageAspect;
  vec2 sampleUV = (uv - .5) * cover * .92 + .5;
  float depth = texture2D(depthMap, sampleUV).r;
  vec2 breathing = vec2(sin(drift * 1.5708) * cos(drift * .6) * .0075, cos(drift * 2.5133) * sin(drift) * .0025);
  sampleUV += (pointer * mix(.2, 1., turbo) + breathing) * depth;
  vec3 color = texture2D(picture, sampleUV).rgb;
  color = pow(color, vec3(1.1));
  float threshold = bayer(gl_FragCoord.xy / pixelRatio / 2.);
  color = floor(clamp(color, 0., 1.) * 2. + threshold + .5) / 2.;
  float vignette = 1. - .24 * dot(uv - .5, uv - .5);
  gl_FragColor = vec4(color * vignette, 1.);
}
`;

export default function Scene({ children }: { children: ReactNode }) {
  const [credit, setCredit] = useState<Background["credit"]>();
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const softwareCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = root.current!;
    let surface = canvas.current!;
    surface.style.display = "block";
    softwareCanvas.current!.style.display = "none";
    let stopped = false;
    let frame = 0;
    let previous: string | null = null;
    try {
      previous = localStorage.getItem("sequence:last-background");
    } catch {
      /* Storage is optional. */
    }
    const background = chooseBackground(previous);
    setCredit(background.credit);
    try {
      localStorage.setItem("sequence:last-background", background.id);
    } catch {
      /* Session still works. */
    }
    element.dataset.background = background.id;
    const fallback = element.querySelector<HTMLElement>(".scene-fallback")!;
    fallback.style.backgroundImage = `url("${background.src}")`;
    const image = new Image();
    const depthImage = new Image();
    depthImage.src = background.depth;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let turbo = 0,
      turboTarget = 0;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const precise = window.matchMedia("(hover: hover) and (pointer: fine)");
    let draw = () => {};
    let resizeDrawing = () => {};
    let disposeDrawing = () => {};

    function tick() {
      frame = 0;
      if (stopped || document.hidden) return;
      pointer.x += (pointer.targetX - pointer.x) * 0.085;
      pointer.y += (pointer.targetY - pointer.y) * 0.085;
      turbo += (turboTarget - turbo) * 0.1;
      if (motion.matches || !precise.matches) {
        pointer.x = pointer.y = 0;
        turbo = 0;
      }
      element.dataset.distortion = turbo.toFixed(3);
      element.style.setProperty("--scene-x", `${-pointer.x * 28}px`);
      element.style.setProperty("--scene-y", `${pointer.y * 22}px`);
      draw();
      if (!motion.matches && precise.matches)
        frame = requestAnimationFrame(tick);
    }
    function queue() {
      if (!frame && !stopped) frame = requestAnimationFrame(tick);
    }
    function move(event: PointerEvent) {
      if (motion.matches || !precise.matches || event.pointerType === "touch")
        return;
      pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.targetY = 1 - (event.clientY / window.innerHeight) * 2;
      queue();
    }
    function releaseHold() {
      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = null;
      turboTarget = 0;
    }
    function hold(event: PointerEvent) {
      if (
        event.button !== 0 ||
        motion.matches ||
        !precise.matches ||
        !(event.target instanceof Element) ||
        !event.target.closest(".scene") ||
        event.target.closest("button")
      )
        return;
      releaseHold();
      holdTimer = setTimeout(() => {
        turboTarget = 1;
        queue();
      }, 150);
    }
    function reset() {
      releaseHold();
      pointer.targetX = pointer.targetY = 0;
      queue();
    }
    function resize() {
      resizeDrawing();
      queue();
    }
    function visibility() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else queue();
    }

    function softwareDither() {
      canvas.current!.style.display = "none";
      surface = softwareCanvas.current!;
      surface.style.display = "block";
      const context = surface.getContext("2d", { willReadFrequently: true });
      if (!context) {
        element.dataset.renderer = "image";
        return;
      }
      element.dataset.renderer = "canvas";
      const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      resizeDrawing = () => {
        const width = Math.min(window.innerWidth + 100, 1440);
        const height = Math.round(
          (width * (window.innerHeight + 100)) / (window.innerWidth + 100),
        );
        surface.width = width;
        surface.height = height;
        const scale = Math.max(width / image.width, height / image.height);
        context.drawImage(
          image,
          (width - image.width * scale) / 2,
          (height - image.height * scale) / 2,
          image.width * scale,
          image.height * scale,
        );
        const pixels = context.getImageData(0, 0, width, height);
        for (let y = 0; y < height; y++)
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const cssX = Math.floor(
              (x * (window.innerWidth + 100)) / width / 2,
            );
            const cssY = Math.floor(
              (y * (window.innerHeight + 100)) / height / 2,
            );
            const threshold = bayer[(cssY % 4) * 4 + (cssX % 4)] / 16 - 0.5;
            for (let c = 0; c < 3; c++) {
              const value = Math.pow(pixels.data[i + c] / 255, 1.1);
              pixels.data[i + c] = Math.max(
                0,
                Math.min(
                  255,
                  (Math.floor(value * 2 + threshold + 0.5) / 2) * 255,
                ),
              );
            }
          }
        context.putImageData(pixels, 0, 0);
        element.dataset.ready = "true";
      };
      draw = () => {
        surface.style.transform = `translate(${-pointer.x * 20}px,${pointer.y * 16}px)`;
      };
      resize();
    }

    image.onload = async () => {
      let depthReady = true;
      try {
        await depthImage.decode();
      } catch {
        depthReady = false;
      }
      if (stopped) return;
      element.dataset.depth = depthReady ? "map" : "flat";
      let gl: WebGLRenderingContext | null = null;
      try {
        gl = surface.getContext("webgl", {
          alpha: false,
          antialias: false,
          powerPreference: "low-power",
        });
      } catch {
        /* Software fallback below. */
      }
      if (!gl) {
        softwareDither();
        return;
      }
      const shaders: WebGLShader[] = [];
      function compile(type: number, source: string) {
        const shader = gl!.createShader(type)!;
        shaders.push(shader);
        gl!.shaderSource(shader, source);
        gl!.compileShader(shader);
        if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS))
          throw new Error("Shader failed");
        return shader;
      }
      const program = gl.createProgram()!;
      let buffer: WebGLBuffer | null = null;
      let texture: WebGLTexture | null = null;
      let depthTexture: WebGLTexture | null = null;
      disposeDrawing = () => {
        if (buffer) gl!.deleteBuffer(buffer);
        if (texture) gl!.deleteTexture(texture);
        if (depthTexture) gl!.deleteTexture(depthTexture);
        shaders.forEach((shader) => gl!.deleteShader(shader));
        gl!.deleteProgram(program);
      };
      try {
        gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
          throw new Error("Shader link failed");
        gl.useProgram(program);
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
          gl.STATIC_DRAW,
        );
        const position = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.uniform1i(gl.getUniformLocation(program, "picture"), 0);
        depthTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        if (depthReady)
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            depthImage,
          );
        else
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            1,
            1,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 0, 255]),
          );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.uniform1i(gl.getUniformLocation(program, "depthMap"), 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform2f(
          gl.getUniformLocation(program, "imageSize"),
          image.width,
          image.height,
        );
        const pointerUniform = gl.getUniformLocation(program, "pointer");
        resizeDrawing = () => {
          const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
          surface.width = Math.round(window.innerWidth * ratio);
          surface.height = Math.round(window.innerHeight * ratio);
          gl!.viewport(0, 0, surface.width, surface.height);
          gl!.uniform2f(
            gl!.getUniformLocation(program, "screenSize"),
            surface.width,
            surface.height,
          );
          gl!.uniform1f(gl!.getUniformLocation(program, "pixelRatio"), ratio);
        };
        const driftUniform = gl.getUniformLocation(program, "drift");
        const turboUniform = gl.getUniformLocation(program, "turbo");
        draw = () => {
          gl!.uniform1f(
            driftUniform,
            motion.matches || !precise.matches ? 0 : performance.now() / 1000,
          );
          gl!.uniform1f(turboUniform, turbo);
          gl!.uniform2f(pointerUniform, pointer.x, pointer.y);
          gl!.drawArrays(gl!.TRIANGLES, 0, 6);
          element.dataset.ready = "true";
        };
        element.dataset.renderer = "webgl";
        resize();
      } catch {
        disposeDrawing();
        disposeDrawing = () => {};
        softwareDither();
      }
    };
    image.onerror = () => {
      element.dataset.renderer = "image";
      element.dataset.ready = "true";
    };
    image.src = background.src;
    window.addEventListener("pointerdown", hold);
    window.addEventListener("pointerup", releaseHold);
    window.addEventListener("pointercancel", releaseHold);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", reset);
    precise.addEventListener("change", reset);
    return () => {
      stopped = true;
      releaseHold();
      window.removeEventListener("pointerdown", hold);
      window.removeEventListener("pointerup", releaseHold);
      window.removeEventListener("pointercancel", releaseHold);
      cancelAnimationFrame(frame);
      image.onload = null;
      image.onerror = null;
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", reset);
      precise.removeEventListener("change", reset);
      disposeDrawing();
    };
  }, []);

  return (
    <div className="scene" ref={root}>
      <div className="scene-fallback" aria-hidden="true" />
      <canvas className="scene-background" ref={canvas} aria-hidden="true" />
      <canvas
        className="scene-background scene-software"
        ref={softwareCanvas}
        aria-hidden="true"
      />
      <div className="scene-icons"><div className="scene-items">{children}</div></div>
      <Signature />
      {credit && (
        <div className="scene-credit">
          Photo by{" "}
          <a href={credit.url} target="_blank" rel="noreferrer">
            {credit.photographer}
          </a>{" "}
          /{" "}
          <a href="https://www.pexels.com" target="_blank" rel="noreferrer">
            Pexels
          </a>
        </div>
      )}
    </div>
  );
}
