import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

const Store3DViewer = ({ brand = 'ecocold', width = '100%', height = '500px' }) => {
  const containerRef = useRef(null);

  const createScene = useCallback(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Camera
    const w = containerRef.current.clientWidth || 800;
    const h = containerRef.current.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.z = 5;

    // Renderer - BLACK SCREEN FIX
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xf0f0f0, 1);
    renderer.shadowMap.enabled = true;
    renderer.clear(); // CRITICAL

    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Geometry
    const brandColor = brand === 'ecocold' ? 0x1B3D4F : 0x00C4CC;
    const geometry = new THREE.BoxGeometry(2, 3, 1.5);
    const material = new THREE.MeshStandardMaterial({ color: brandColor, metalness: 0.3 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    scene.add(mesh);

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      mesh.rotation.x += 0.003;
      mesh.rotation.y += 0.005;
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [brand]);

  useEffect(() => {
    const cleanup = createScene();
    return cleanup;
  }, [createScene]);

  return <div ref={containerRef} style={{ width, height, overflow: 'hidden' }} />;
};

export default Store3DViewer;
