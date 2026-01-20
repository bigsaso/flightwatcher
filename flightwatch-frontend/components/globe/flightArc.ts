import * as THREE from "three";

export function createFlightArc(
  start: THREE.Vector3,
  end: THREE.Vector3
) {
  const mid = start.clone()
    .add(end)
    .normalize()
    .multiplyScalar(1.3);

  const curve = new THREE.QuadraticBezierCurve3(
    start,
    mid,
    end
  );

  const geometry = new THREE.TubeGeometry(
    curve,
    64,
    0.005,
    8,
    false
  );

  const material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
  });

  return new THREE.Mesh(geometry, material);
}
