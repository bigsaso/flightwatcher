"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { fetchAirport } from "./airportLookup";
import { createFlightArc } from "./flightArc";
import { latLonToVector3 } from "./geo";

type Props = {
  origin: string;
  destination: string;
};

const GLOBE_RADIUS = 0.75;
const SURFACE_OFFSET = 0.02;

export default function Globe({ origin, destination }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!origin || !destination) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let frameId: number | null = null;
    let disposeScene: (() => void) | null = null;
    let cancelled = false;

    async function init() {
      const mount = mountRef.current;
      if (!mount) return;

      const [from, to] = await Promise.all([
        fetchAirport(origin),
        fetchAirport(destination),
      ]);

      if (cancelled) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#f7f9ff");

      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 3.2);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mount.clientWidth || 420, mount.clientHeight || 420, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.innerHTML = "";
      mount.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 2.4;
      controls.maxDistance = 5;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
      keyLight.position.set(5, 4, 6);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
      fillLight.position.set(-5, -2, 4);
      scene.add(fillLight);

      // const createLandTextures = async () => {
      //   const img = new Image();
      //   img.src = "/textures/earth-land-mask.png";
      //   await img.decode();

      //   const w = img.width;
      //   const h = img.height;

      //   const baseCanvas = document.createElement("canvas");
      //   baseCanvas.width = w;
      //   baseCanvas.height = h;
      //   const ctx = baseCanvas.getContext("2d")!;

      //   // Draw land mask
      //   ctx.drawImage(img, 0, 0, w, h);

      //   // --- soften + cartoonify ---
      //   ctx.filter = "blur(6px)";
      //   ctx.drawImage(baseCanvas, 0, 0);
      //   ctx.filter = "none";

      //   const data = ctx.getImageData(0, 0, w, h);
      //   for (let i = 0; i < data.data.length; i += 4) {
      //     const v = data.data[i]; // grayscale
      //     const t = v > 80 ? 255 : 0; // bold threshold
      //     data.data[i] = t;
      //     data.data[i + 1] = t;
      //     data.data[i + 2] = t;
      //     data.data[i + 3] = t;
      //   }
      //   ctx.putImageData(data, 0, 0);

      //   // --- mask texture ---
      //   const maskTexture = new THREE.CanvasTexture(baseCanvas);
      //   maskTexture.colorSpace = THREE.SRGBColorSpace;
      //   maskTexture.wrapS = THREE.RepeatWrapping;
      //   maskTexture.wrapT = THREE.ClampToEdgeWrapping;

      //   // --- color texture ---
      //   const colorCanvas = document.createElement("canvas");
      //   colorCanvas.width = w;
      //   colorCanvas.height = h;
      //   const colorCtx = colorCanvas.getContext("2d")!;
      //   colorCtx.fillStyle = "#9ae14a";
      //   colorCtx.fillRect(0, 0, w, h);
      //   colorCtx.globalCompositeOperation = "destination-in";
      //   colorCtx.drawImage(baseCanvas, 0, 0);

      //   const colorTexture = new THREE.CanvasTexture(colorCanvas);
      //   colorTexture.colorSpace = THREE.SRGBColorSpace;
      //   colorTexture.wrapS = THREE.RepeatWrapping;
      //   colorTexture.wrapT = THREE.ClampToEdgeWrapping;

      //   // --- bump texture ---
      //   const bumpCanvas = document.createElement("canvas");
      //   bumpCanvas.width = w;
      //   bumpCanvas.height = h;
      //   const bumpCtx = bumpCanvas.getContext("2d")!;
      //   bumpCtx.filter = "blur(18px)";
      //   bumpCtx.drawImage(baseCanvas, 0, 0);

      //   const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
      //   bumpTexture.wrapS = THREE.RepeatWrapping;
      //   bumpTexture.wrapT = THREE.ClampToEdgeWrapping;

      //   maskTexture.minFilter = THREE.LinearMipmapLinearFilter;
      //   maskTexture.magFilter = THREE.LinearFilter;
      //   maskTexture.generateMipmaps = true;

      //   colorTexture.minFilter = THREE.LinearMipmapLinearFilter;
      //   colorTexture.magFilter = THREE.LinearFilter;
      //   colorTexture.generateMipmaps = true;

      //   return { colorMap: colorTexture, maskMap: maskTexture, bumpMap: bumpTexture };
      // };
      const createLandTextures = async () => {
        const img = new Image();
        img.src = "/textures/earth-land-sdf.png"; // <- generated by python
        await img.decode();

        const w = img.width;
        const h = img.height;

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;

        // Draw SDF (8-bit, 128 ~= coastline)
        ctx.drawImage(img, 0, 0, w, h);

        const sdf = ctx.getImageData(0, 0, w, h);
        const out = ctx.createImageData(w, h);

        // Helper: smoothstep
        const smoothstep = (e0: number, e1: number, x: number) => {
          const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
          return t * t * (3 - 2 * t);
        };

        // SDF decoding:
        // sdfVal 0..255 where 128 is coastline
        // signedDist in "SDF pixels" where +/- MAX_DIST in python maps to +/-32 -> (val-128)/127*MAX_DIST
        const MAX_DIST = 32.0;

        for (let y = 0; y < h; y++) {
          // latitude in degrees (equirectangular)
          const lat = 90 - ((y + 0.5) * 180) / h;
          const t = Math.min(1, Math.abs(lat) / 90); // 0 at equator, 1 at poles

          // --- (1) latitudinal/polar mitigation ---
          // make edges slightly softer near poles to avoid aliasing shimmer
          const edgeSoftness = 0.9 + 2.2 * t * t; // tweakable

          // slight dilation near poles (keeps thin polar features visible)
          const bias = 0.9 * t * t * t; // tweakable

          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const sdfVal = sdf.data[i]; // grayscale
            const signedDist = ((sdfVal - 128) / 127) * MAX_DIST;

            // --- (2) SDF -> alpha with smooth coastlines ---
            // Alpha is 1 inside land, 0 outside, with a smooth edge around the coastline.
            // bias shifts the coastline outward slightly near poles.
            const d = signedDist + bias;

            // map distance to alpha; edgeSoftness controls transition width
            const a = smoothstep(-edgeSoftness, edgeSoftness, d);

            const alpha = Math.round(a * 255);

            // Store as a white mask with alpha
            out.data[i] = 255;
            out.data[i + 1] = 255;
            out.data[i + 2] = 255;
            out.data[i + 3] = alpha;
          }
        }

        ctx.putImageData(out, 0, 0);

        // --- mask texture (uses alpha channel) ---
        const maskTexture = new THREE.CanvasTexture(canvas);
        maskTexture.colorSpace = THREE.SRGBColorSpace;
        maskTexture.wrapS = THREE.RepeatWrapping;
        maskTexture.wrapT = THREE.ClampToEdgeWrapping;
        maskTexture.generateMipmaps = true;
        maskTexture.minFilter = THREE.LinearMipmapLinearFilter;
        maskTexture.magFilter = THREE.LinearFilter;

        // --- color texture (solid fill clipped by mask alpha) ---
        const colorCanvas = document.createElement("canvas");
        colorCanvas.width = w;
        colorCanvas.height = h;
        const colorCtx = colorCanvas.getContext("2d")!;
        colorCtx.fillStyle = "#9ae14a";
        colorCtx.fillRect(0, 0, w, h);
        colorCtx.globalCompositeOperation = "destination-in";
        colorCtx.drawImage(canvas, 0, 0);

        const colorTexture = new THREE.CanvasTexture(colorCanvas);
        colorTexture.colorSpace = THREE.SRGBColorSpace;
        colorTexture.wrapS = THREE.RepeatWrapping;
        colorTexture.wrapT = THREE.ClampToEdgeWrapping;
        colorTexture.generateMipmaps = true;
        colorTexture.minFilter = THREE.LinearMipmapLinearFilter;
        colorTexture.magFilter = THREE.LinearFilter;

        // --- bump texture (blurred alpha for gentle relief) ---
        const bumpCanvas = document.createElement("canvas");
        bumpCanvas.width = w;
        bumpCanvas.height = h;
        const bumpCtx = bumpCanvas.getContext("2d")!;
        bumpCtx.filter = "blur(12px)";
        bumpCtx.drawImage(canvas, 0, 0);

        const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
        bumpTexture.wrapS = THREE.RepeatWrapping;
        bumpTexture.wrapT = THREE.ClampToEdgeWrapping;
        bumpTexture.generateMipmaps = true;
        bumpTexture.minFilter = THREE.LinearMipmapLinearFilter;
        bumpTexture.magFilter = THREE.LinearFilter;

        return { colorMap: colorTexture, maskMap: maskTexture, bumpMap: bumpTexture };
      };


      const { colorMap, maskMap, bumpMap } = await createLandTextures();

      const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 96);
      const oceanMaterial = new THREE.MeshStandardMaterial({
        color: 0x2f8bff,
        roughness: 0.25,
        metalness: 0.05,
      });
      const globe = new THREE.Mesh(globeGeometry, oceanMaterial);
      scene.add(globe);

      const landMaterial = new THREE.MeshStandardMaterial({
        map: colorMap,
        alphaMap: maskMap,
        transparent: true,
        bumpMap,
        bumpScale: 0.08,
        roughness: 0.6,
        metalness: 0.02,
      });
      const land = new THREE.Mesh(globeGeometry.clone(), landMaterial);
      land.scale.setScalar(1 + SURFACE_OFFSET);
      scene.add(land);

      const markerGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 0.015, 16, 16);
      const originMarker = new THREE.Mesh(
        markerGeometry,
        new THREE.MeshStandardMaterial({ color: 0xff7b7b, roughness: 0.4 })
      );
      originMarker.position.copy(latLonToVector3(from.lat, from.lon, GLOBE_RADIUS * (1 + SURFACE_OFFSET)));
      scene.add(originMarker);

      const destinationMarker = new THREE.Mesh(
        markerGeometry.clone(),
        new THREE.MeshStandardMaterial({ color: 0x6ee7ff, roughness: 0.4 })
      );
      destinationMarker.position.copy(latLonToVector3(to.lat, to.lon, GLOBE_RADIUS * (1 + SURFACE_OFFSET)));
      scene.add(destinationMarker);

      const flightArc = createFlightArc(
        latLonToVector3(from.lat, from.lon, GLOBE_RADIUS * (1 + SURFACE_OFFSET)),
        latLonToVector3(to.lat, to.lon, GLOBE_RADIUS * (1 + SURFACE_OFFSET)),
        GLOBE_RADIUS
      );
      scene.add(flightArc);

      const handleResize = () => {
        if (!renderer || !mount) return;
        const width = mount.clientWidth || 420;
        const height = mount.clientHeight || 420;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };

      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(mount);
      handleResize();

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        controls?.update();
        renderer?.render(scene, camera);
      };

      animate();

      disposeScene = () => {
        if (frameId) cancelAnimationFrame(frameId);
        resizeObserver?.disconnect();
        controls?.dispose();
        colorMap.dispose();
        maskMap.dispose();
        bumpMap.dispose();

        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });

        renderer?.dispose();
        if (mount) {
          mount.innerHTML = "";
        }
      };
    }

    init().catch((error) => {
      console.error("Failed to initialize globe", error);
    });

    return () => {
      cancelled = true;
      disposeScene?.();
    };
  }, [origin, destination]);

  return <div ref={mountRef} className="h-[420px] w-[420px]" />;
}
