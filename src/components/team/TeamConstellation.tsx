"use client";

import { useEffect, useRef } from "react";

/**
 * The /our-team hero backdrop: a slowly drifting network of people (points)
 * joined by the connections between them (lines), a picture of what a hiring
 * partner does. It leans toward the cursor on desktop.
 *
 * three.js is imported only after mount, so no other page pays for it. The
 * loop stops while the hero is off-screen or the tab is hidden, and under
 * prefers-reduced-motion a single still frame is drawn. Without WebGL the
 * canvas simply stays empty over the flat navy.
 */
export default function TeamConstellation() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    void import("three").then((THREE) => {
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        return; // no WebGL: the flat navy behind stays
      }

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const phone = window.matchMedia("(max-width: 639px)").matches;
      const COUNT = phone ? 48 : 90;
      const LINK_DISTANCE = phone ? 2.3 : 2.0;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
      camera.position.z = 11;
      const group = new THREE.Group();
      scene.add(group);

      // People: soft round points, mostly white with brand-green ones mixed in.
      const positions = new Float32Array(COUNT * 3);
      const velocities = new Float32Array(COUNT * 3);
      const colors = new Float32Array(COUNT * 3);
      const white = new THREE.Color("#ffffff");
      const green = new THREE.Color("#a9d68d");
      for (let i = 0; i < COUNT; i += 1) {
        const r = 6 * Math.cbrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions.set([r * Math.sin(phi) * Math.cos(theta) * 1.6, r * Math.sin(phi) * Math.sin(theta) * 0.8, r * Math.cos(phi)], i * 3);
        velocities.set([(Math.random() - 0.5) * 0.006, (Math.random() - 0.5) * 0.006, (Math.random() - 0.5) * 0.006], i * 3);
        (i % 4 === 0 ? green : white).toArray(colors, i * 3);
      }
      const dot = document.createElement("canvas");
      dot.width = dot.height = 64;
      const ctx = dot.getContext("2d");
      if (ctx) {
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.4, "rgba(255,255,255,0.6)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
      }
      const dotTexture = new THREE.CanvasTexture(dot);
      const pointGeometry = new THREE.BufferGeometry();
      pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      pointGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const pointMaterial = new THREE.PointsMaterial({
        size: 0.22,
        map: dotTexture,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      group.add(new THREE.Points(pointGeometry, pointMaterial));

      // Connections: every pair closer than LINK_DISTANCE, rebuilt each frame.
      const maxSegments = (COUNT * (COUNT - 1)) / 2;
      const linePositions = new Float32Array(maxSegments * 6);
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
      const lineMaterial = new THREE.LineBasicMaterial({ color: "#69a44f", transparent: true, opacity: 0.28, depthWrite: false });
      group.add(new THREE.LineSegments(lineGeometry, lineMaterial));

      const step = () => {
        for (let i = 0; i < COUNT * 3; i += 1) {
          positions[i] += velocities[i];
          // Bounce inside a loose box so the network never drifts apart.
          const limit = i % 3 === 0 ? 9 : i % 3 === 1 ? 5 : 6;
          if (Math.abs(positions[i]) > limit) velocities[i] *= -1;
        }
        let n = 0;
        for (let a = 0; a < COUNT; a += 1) {
          for (let b = a + 1; b < COUNT; b += 1) {
            const dx = positions[a * 3] - positions[b * 3];
            const dy = positions[a * 3 + 1] - positions[b * 3 + 1];
            const dz = positions[a * 3 + 2] - positions[b * 3 + 2];
            if (dx * dx + dy * dy + dz * dz < LINK_DISTANCE * LINK_DISTANCE) {
              linePositions.set(positions.subarray(a * 3, a * 3 + 3), n * 6);
              linePositions.set(positions.subarray(b * 3, b * 3 + 3), n * 6 + 3);
              n += 1;
            }
          }
        }
        lineGeometry.setDrawRange(0, n * 2);
        lineGeometry.attributes.position.needsUpdate = true;
        pointGeometry.attributes.position.needsUpdate = true;
      };

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = host;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        if (reduceMotion) renderer.render(scene, camera);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();

      // Lean toward the pointer (mouse only; touch scrolling shouldn't tilt it).
      const target = { x: 0, y: 0 };
      const onPointer = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        target.y = (event.clientX / window.innerWidth - 0.5) * 0.5;
        target.x = (event.clientY / window.innerHeight - 0.5) * 0.3;
      };

      let frame = 0;
      let visible = true;
      const loop = () => {
        frame = 0;
        if (!visible || document.hidden) return;
        step();
        group.rotation.y += 0.0012 + (target.y - group.rotation.y) * 0.02;
        group.rotation.x += (target.x - group.rotation.x) * 0.02;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(loop);
      };
      const start = () => {
        if (!frame && !reduceMotion) frame = requestAnimationFrame(loop);
      };
      const io = new IntersectionObserver(([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) start();
      });
      io.observe(host);
      const onVisibility = () => {
        if (!document.hidden) start();
      };

      if (reduceMotion) {
        step();
        renderer.render(scene, camera);
      } else {
        window.addEventListener("pointermove", onPointer, { passive: true });
        document.addEventListener("visibilitychange", onVisibility);
        start();
      }

      cleanup = () => {
        cancelAnimationFrame(frame);
        io.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener("pointermove", onPointer);
        document.removeEventListener("visibilitychange", onVisibility);
        pointGeometry.dispose();
        lineGeometry.dispose();
        pointMaterial.dispose();
        lineMaterial.dispose();
        dotTexture.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-0" />;
}
