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

      const createLandTextures = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return {
            colorMap: new THREE.CanvasTexture(canvas),
            maskMap: new THREE.CanvasTexture(canvas),
            bumpMap: new THREE.CanvasTexture(canvas),
          };
        }

        const random = (() => {
          let seed = 123456;
          return () => {
            seed = (seed * 1664525 + 1013904223) % 4294967296;
            return seed / 4294967296;
          };
        })();

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const blobs = Array.from({ length: 14 }, () => ({
          x: 120 + random() * 820,
          y: 80 + random() * 340,
          r: 50 + random() * 90,
          tilt: (random() - 0.5) * 0.6,
        }));

        ctx.fillStyle = "#ffffff";
        blobs.forEach(({ x, y, r, tilt }) => {
          ctx.beginPath();
          ctx.ellipse(x, y, r, r * 0.75, tilt, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.filter = "blur(16px)";
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#ffffff";
        blobs.forEach(({ x, y, r }) => {
          ctx.beginPath();
          ctx.ellipse(x, y, r * 0.7, r * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.filter = "none";

        const maskData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < maskData.data.length; i += 4) {
          const value = maskData.data[i];
          const thresholded = value > 40 ? 255 : 0;
          maskData.data[i] = thresholded;
          maskData.data[i + 1] = thresholded;
          maskData.data[i + 2] = thresholded;
          maskData.data[i + 3] = thresholded;
        }
        ctx.putImageData(maskData, 0, 0);

        const maskTexture = new THREE.CanvasTexture(canvas);
        maskTexture.colorSpace = THREE.SRGBColorSpace;
        maskTexture.wrapS = THREE.RepeatWrapping;
        maskTexture.wrapT = THREE.ClampToEdgeWrapping;
        maskTexture.needsUpdate = true;

        const colorCanvas = document.createElement("canvas");
        colorCanvas.width = canvas.width;
        colorCanvas.height = canvas.height;
        const colorCtx = colorCanvas.getContext("2d");
        if (colorCtx) {
          colorCtx.fillStyle = "#ffffff";
          colorCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
          colorCtx.drawImage(canvas, 0, 0);
          colorCtx.globalCompositeOperation = "source-in";
          colorCtx.fillStyle = "#9ae14a";
          colorCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
        }

        const colorTexture = new THREE.CanvasTexture(colorCanvas);
        colorTexture.colorSpace = THREE.SRGBColorSpace;
        colorTexture.wrapS = THREE.RepeatWrapping;
        colorTexture.wrapT = THREE.ClampToEdgeWrapping;
        colorTexture.needsUpdate = true;

        const bumpCanvas = document.createElement("canvas");
        bumpCanvas.width = canvas.width;
        bumpCanvas.height = canvas.height;
        const bumpCtx = bumpCanvas.getContext("2d");
        if (bumpCtx) {
          bumpCtx.fillStyle = "#000000";
          bumpCtx.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);
          bumpCtx.filter = "blur(24px)";
          bumpCtx.drawImage(canvas, 0, 0);
          bumpCtx.filter = "none";
        }

        const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
        bumpTexture.colorSpace = THREE.SRGBColorSpace;
        bumpTexture.wrapS = THREE.RepeatWrapping;
        bumpTexture.wrapT = THREE.ClampToEdgeWrapping;
        bumpTexture.needsUpdate = true;

        return { colorMap: colorTexture, maskMap: maskTexture, bumpMap: bumpTexture };
      };

      const { colorMap, maskMap, bumpMap } = createLandTextures();

      const globeGeometry = new THREE.SphereGeometry(1, 96, 96);
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
      land.scale.setScalar(1.01);
      scene.add(land);

      const markerGeometry = new THREE.SphereGeometry(0.028, 16, 16);
      const originMarker = new THREE.Mesh(
        markerGeometry,
        new THREE.MeshStandardMaterial({ color: 0xff7b7b, roughness: 0.4 })
      );
      originMarker.position.copy(latLonToVector3(from.lat, from.lon, 1.02));
      scene.add(originMarker);

      const destinationMarker = new THREE.Mesh(
        markerGeometry.clone(),
        new THREE.MeshStandardMaterial({ color: 0x6ee7ff, roughness: 0.4 })
      );
      destinationMarker.position.copy(latLonToVector3(to.lat, to.lon, 1.02));
      scene.add(destinationMarker);

      const flightArc = createFlightArc(
        latLonToVector3(from.lat, from.lon, 1.02),
        latLonToVector3(to.lat, to.lon, 1.02)
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
