"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { fetchAirport } from "./airportLookup";

type Props = {
  origin: string;
  destination: string;
};

export default function Globe({ origin, destination }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!origin || !destination) return;

    let renderer: THREE.WebGLRenderer;

    async function init() {
      const [from, to] = await Promise.all([
        fetchAirport(origin),
        fetchAirport(destination),
      ]);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
      camera.position.z = 3;

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(400, 400);
      mountRef.current?.appendChild(renderer.domElement);

      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(1, 64, 64),
        new THREE.MeshStandardMaterial({ color: 0x223344 })
      );
      scene.add(globe);

      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 3, 5);
      scene.add(light);

      function latLonToVector3(lat: number, lon: number, r = 1.01) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        return new THREE.Vector3(
          -r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        );
      }

      const fromMarker = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 16, 16),
        new THREE.MeshBasicMaterial({ color: "red" })
      );
      fromMarker.position.copy(
        latLonToVector3(from.lat, from.lon)
      );
      scene.add(fromMarker);

      const toMarker = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 16, 16),
        new THREE.MeshBasicMaterial({ color: "blue" })
      );
      toMarker.position.copy(
        latLonToVector3(to.lat, to.lon)
      );
      scene.add(toMarker);

      renderer.render(scene, camera);
    }

    init();

    return () => {
      if (renderer && mountRef.current) {
        mountRef.current.innerHTML = "";
        renderer.dispose();
      }
    };
  }, [origin, destination]);

  return <div ref={mountRef} />;
}
