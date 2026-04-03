import React, { useRef, useEffect, useMemo, Suspense } from 'react';
import { useFBX, useAnimations } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three-stdlib';
import * as THREE from 'three';

interface Ben10ModelProps {
  isTalking: boolean;
  modelUrl: string | null;
  modelType: 'fbx' | 'obj';
  textureUrl: string | null;
}

const FBXModel = ({ url, texture, isTalking }: { url: string; texture: THREE.Texture | null; isTalking: boolean }) => {
  const model = useFBX(url);
  const { actions, names } = useAnimations(model.animations, model);
  
  useEffect(() => {
    if (model && texture) {
      texture.flipY = false;
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => {
                (mat as THREE.MeshStandardMaterial).map = texture;
                (mat as THREE.MeshStandardMaterial).needsUpdate = true;
              });
            } else {
              (mesh.material as THREE.MeshStandardMaterial).map = texture;
              (mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
            }
          }
        }
      });
    }
  }, [model, texture]);

  useEffect(() => {
    if (actions && names.length > 0) {
      const idleAction = actions[names[0]];
      if (idleAction) {
        idleAction.reset().fadeIn(0.5).play();
      }
    }
  }, [actions, names]);

  useEffect(() => {
    if (isTalking && actions && names.includes('talking')) {
      actions['talking']?.reset().fadeIn(0.2).play();
    } else if (actions && names.includes('talking')) {
      actions['talking']?.fadeOut(0.2);
    }
  }, [isTalking, actions, names]);

  useEffect(() => {
    if (model) {
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 4 / maxDim;
      model.scale.setScalar(scale);
      
      const center = box.getCenter(new THREE.Vector3());
      model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    }
  }, [model]);

  return <primitive object={model} rotation={[0, Math.PI, 0]} />;
};

const OBJModel = ({ url, texture }: { url: string; texture: THREE.Texture | null }) => {
  const model = useLoader(OBJLoader, url);
  
  useEffect(() => {
    if (model && texture) {
      texture.flipY = false;
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => {
                (mat as THREE.MeshStandardMaterial).map = texture;
                (mat as THREE.MeshStandardMaterial).needsUpdate = true;
              });
            } else {
              (mesh.material as THREE.MeshStandardMaterial).map = texture;
              (mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
            }
          }
        }
      });
    }
  }, [model, texture]);

  useEffect(() => {
    if (model) {
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 4 / maxDim;
      model.scale.setScalar(scale);
      
      const center = box.getCenter(new THREE.Vector3());
      model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    }
  }, [model]);

  return <primitive object={model} rotation={[0, Math.PI, 0]} />;
};

export const Ben10Model = ({ isTalking, modelUrl, modelType, textureUrl }: Ben10ModelProps) => {
  const texture = textureUrl ? useLoader(THREE.TextureLoader, textureUrl) : null;

  if (!modelUrl) {
    return (
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.5, 1, 4, 8]} />
        <meshStandardMaterial color="#00ff00" wireframe />
      </mesh>
    );
  }

  return (
    <Suspense fallback={null}>
      {modelType === 'fbx' ? (
        <FBXModel url={modelUrl} texture={texture} isTalking={isTalking} />
      ) : (
        <OBJModel url={modelUrl} texture={texture} />
      )}
    </Suspense>
  );
};
