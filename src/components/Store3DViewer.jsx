import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';

const Store3DViewer = ({ brand = 'ecocold', width = '100%', height = '500px' }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const createScene = useCallback(() => {
    try {
      if (!containerRef.current) {
        setError('Container not found');
        return;
      }

      // Clean up previous scene
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }

      // Get container dimensions
      const width = containerRef.current.clientWidth || 800;
      const height = containerRef.current.clientHeight || 600;

      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);
      sceneRef.current = scene;

      // Camera - adjusted for better visibility
      const camera = new THREE.PerspectiveCamera(
        75,
        width / height,
        0.1,
        1000
      );
      camera.position.set(0, 0, 7);
      camera.lookAt(0, 0, 0);

      // Renderer setup - CRITICAL FIX
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        precision: 'highp'
      });

      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setClearColor(0xf5f5f5, 1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;

      rendererRef.current = renderer;
      containerRef.current.appendChild(renderer.domElement);

      // Lighting - enhanced
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
      directionalLight.position.set(5, 10, 7);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.far = 50;
      scene.add(directionalLight);

      // Add point light for better visibility
      const pointLight = new THREE.PointLight(0x00C4CC, 0.5);
      pointLight.position.set(-5, 5, 5);
      scene.add(pointLight);

      // Geometry - store shelf/unit
      const brandColor = brand === 'ecocold' ? 0x1B3D4F : 0x00C4CC;
      const geometry = new THREE.BoxGeometry(3, 4, 1.5);
      const material = new THREE.MeshStandardMaterial({
        color: brandColor,
        metalness: 0.2,
        roughness: 0.7,
        envMapIntensity: 1
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // Add a plane for shadow
      const planeGeometry = new THREE.PlaneGeometry(10, 10);
      const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0,
        roughness: 1
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -2;
      plane.receiveShadow = true;
      scene.add(plane);

      // Handle window resize
      const handleResize = () => {
        const newWidth = containerRef.current?.clientWidth || width;
        const newHeight = containerRef.current?.clientHeight || height;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };

      window.addEventListener('resize', handleResize);

      // Animation loop
      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);
        mesh.rotation.x += 0.003;
        mesh.rotation.y += 0.005;
        renderer.render(scene, camera);
      };

      animate();
      setIsLoading(false);

      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        geometry.dispose();
        material.dispose();
        planeGeometry.dispose();
        planeMaterial.dispose();
        renderer.dispose();
        if (containerRef.current && rendererRef.current) {
          try {
            containerRef.current.removeChild(renderer.domElement);
          } catch (e) {
            // Already removed
          }
        }
      };
    } catch (err) {
      console.error('3D Viewer Error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, [brand]);

  useEffect(() => {
    // Add small delay to ensure container is mounted
    const timer = setTimeout(() => {
      const cleanup = createScene();
      return cleanup;
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [createScene]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        position: 'relative',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '14px',
            color: '#666'
          }}
        >
          Loading 3D Viewer...
        </div>
      )}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '14px',
            color: '#e74c3c',
            textAlign: 'center'
          }}
        >
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default Store3DViewer;
