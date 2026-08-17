import React, { useEffect, useRef } from 'react';

/**
 * 3D Siri Particle Orb Visualizer
 * Renders a clean, elegant 3D particle sphere floating against a pure black background.
 */
export default function ParticleOrbVisualizer({ isListening, isSpeaking, isProcessing, audioVolume }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // Particle sphere setup (450 points for clean aesthetics)
    const particleCount = 450;
    const particles = [];
    const radius = Math.min(canvas.clientWidth || 300, canvas.clientHeight || 300) * 0.38;

    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < particleCount; i++) {
      const y = 1 - (i / (particleCount - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      const distanceFactor = 0.9 + Math.random() * 0.2;
      const particleRadius = 0.8 + Math.random() * 1.3;

      particles.push({
        origX: x * radius * distanceFactor,
        origY: y * radius * distanceFactor,
        origZ: z * radius * distanceFactor,
        size: particleRadius,
        baseAlpha: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let rotX = 0;
    let rotY = 0;
    let time = 0;

    let smoothVol = 0;
    let smoothExpansion = 1;
    let smoothSwell = 0;

    const render = () => {
      time += 0.002;
      const width = canvas.clientWidth || 300;
      const height = canvas.clientHeight || 300;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      const targetVol = audioVolume || 0;
      smoothVol += (targetVol - smoothVol) * 0.03;

      const breathingPulse = Math.sin(time * 0.8) * 0.02;
      const speechPulse = isSpeaking ? Math.sin(time * 1.2) * 0.035 : 0;
      const targetExpansion = 1 + breathingPulse + speechPulse + smoothVol * 0.12;
      smoothExpansion += (targetExpansion - smoothExpansion) * 0.03;

      const targetSwell = isSpeaking ? 1.0 : isListening ? 0.6 : 0.2;
      smoothSwell += (targetSwell - smoothSwell) * 0.03;

      const baseRotY = 0.0007;
      const baseRotX = 0.00035;
      const activeRotBoost = (isSpeaking ? 0.0003 : 0) + (isListening ? 0.0002 : 0);

      rotY += baseRotY + activeRotBoost;
      rotX += baseRotX + activeRotBoost * 0.5;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      const projectedParticles = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const wave = Math.sin(time * 0.8 + p.phase) * (0.4 + smoothVol * 1.8);
        const organicSwell = Math.sin(time * 0.6 + p.origY * 0.015) * smoothSwell * 1.5;

        let px = p.origX * smoothExpansion + (p.origX > 0 ? wave : -wave) * 0.1;
        let py = p.origY * smoothExpansion + organicSwell;
        let pz = p.origZ * smoothExpansion;

        let x1 = px * cosY - pz * sinY;
        let z1 = px * sinY + pz * cosY;

        let y2 = py * cosX - z1 * sinX;
        let z2 = py * sinX + z1 * cosX;

        const cameraDistance = 480;
        const scale = cameraDistance / (cameraDistance - z2);
        const screenX = centerX + x1 * scale;
        const screenY = centerY + y2 * scale;

        const size = p.size * scale;
        const alphaDepth = ((z2 + radius) / (radius * 2));
        const speechGlow = isSpeaking ? 0.06 + Math.sin(time * 1.0 + p.phase) * 0.08 : 0;
        const alpha = Math.max(0.08, Math.min(0.9, alphaDepth * p.baseAlpha + speechGlow));

        projectedParticles.push({
          x: screenX,
          y: screenY,
          z: z2,
          size,
          alpha,
        });
      }

      projectedParticles.sort((a, b) => a.z - b.z);

      for (let i = 0; i < projectedParticles.length; i++) {
        const p = projectedParticles[i];

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.4, p.size), 0, Math.PI * 2);

        let particleColor = `rgba(255, 255, 255, ${p.alpha})`;

        if (isSpeaking && (i % 4 === 0)) {
          particleColor = `rgba(224, 242, 254, ${p.alpha * 1.2})`;
        } else if (isListening && (i % 5 === 0)) {
          particleColor = `rgba(186, 230, 253, ${p.alpha * 1.15})`;
        }

        ctx.fillStyle = particleColor;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateSize);
    };
  }, [isListening, isSpeaking, isProcessing, audioVolume]);

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
