import * as THREE from "three";

export function createFlightArc(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number
) {
  const ARC_HEIGHT = radius * 0.35;

  const mid = start.clone()
    .add(end)
    .multiplyScalar(1.3)
    .normalize()
    .multiplyScalar(radius + ARC_HEIGHT);

  const curve = new THREE.QuadraticBezierCurve3(
    start,
    mid,
    end
  );

  const geometry = new THREE.TubeGeometry(
    curve,
    64,
    radius * 0.003,
    8,
    false
  );

  const material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
  });

  return new THREE.Mesh(geometry, material);
}
