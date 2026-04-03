import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float, MeshDistortMaterial, Sphere, Stars, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Ben10Model } from './Ben10Model';

export const Scene = ({ isListening, isTalking, modelUrl, modelType, textureUrl }: { 
  isListening: boolean; 
  isTalking: boolean;
  modelUrl: string | null;
  modelType: 'fbx' | 'obj';
  textureUrl: string | null;
}) => {
  return (
    <div className="w-full h-full bg-black">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <OrbitControls enablePan={false} enableZoom={true} minDistance={5} maxDistance={15} />
        
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ff00" castShadow />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#00ff00" />
        
        <Suspense fallback={null}>
          <group position={[0, -1, 0]}>
            <Ben10Model isTalking={isTalking} modelUrl={modelUrl} modelType={modelType} textureUrl={textureUrl} />
          </group>
        </Suspense>

        <ContactShadows opacity={0.4} scale={10} blur={2} far={4.5} color="#00ff00" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Environment preset="night" />
      </Canvas>
    </div>
  );
};

