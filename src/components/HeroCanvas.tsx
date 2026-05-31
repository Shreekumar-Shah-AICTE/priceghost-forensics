"use client";

import { useEffect, useRef, useState } from "react";

interface HeroCanvasProps {
  scrollHeightVh?: number; // Height of the scrolling container in Vh
}

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  angle: number;
  radius: number;
  orbitSpeed: number;
  flickerSpeed: number;
  flickerPhase: number;
}

export default function HeroCanvas({ scrollHeightVh = 250 }: HeroCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // 1. Calculate scroll progress (0.0 to 1.0) inside the container
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = rect.height;
      const viewportHeight = window.innerHeight;
      
      // Calculate how far the top of the container is above the viewport
      const scrolled = -rect.top;
      const totalScrollable = containerHeight - viewportHeight;
      
      if (totalScrollable <= 0) return;
      
      // Clamp between 0.0 and 1.0
      const progress = Math.min(Math.max(scrolled / totalScrollable, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Trigger initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. High-performance HTML5 generative particle simulation mapping scroll progress
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 200;

    // Handle high-DPI displays
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles centered around dynamic points
    const initParticles = () => {
      particles = [];
      const width = window.innerWidth;
      const height = window.innerHeight;
      const centerX = width / 2;
      const centerY = height / 2;

      for (let i = 0; i < particleCount; i++) {
        // Random positions
        const x = Math.random() * width;
        const y = Math.random() * height;

        // Structured concentric target orbits
        const ringIndex = i % 4; // 4 main concentric rings
        const targetRadius = (ringIndex + 1) * 75 + (Math.random() * 20 - 10);
        const targetAngle = Math.random() * Math.PI * 2;

        const originX = centerX + Math.cos(targetAngle) * targetRadius;
        const originY = centerY + Math.sin(targetAngle) * targetRadius;

        // Muted amber to severe crimson for problem state
        const isWarning = Math.random() > 0.6;
        const color = isWarning ? "rgba(255, 51, 51, 0.7)" : "rgba(245, 158, 11, 0.5)";

        particles.push({
          x,
          y,
          originX,
          originY,
          size: Math.random() * 2 + 1,
          color,
          speedX: (Math.random() * 0.6 - 0.3),
          speedY: (Math.random() * 0.6 - 0.3),
          angle: targetAngle,
          radius: targetRadius,
          orbitSpeed: (Math.random() * 0.003 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
          flickerSpeed: Math.random() * 0.05 + 0.02,
          flickerPhase: Math.random() * Math.PI * 2
        });
      }
    };
    initParticles();

    // Main Draw Loop
    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Draw subtle background radial radar overlay
      ctx.strokeStyle = "rgba(243, 243, 240, 0.02)";
      ctx.lineWidth = 1;
      for (let r = 100; r < Math.max(width, height); r += 120) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw crosshair axes
      ctx.strokeStyle = "rgba(243, 243, 240, 0.015)";
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Progress segments:
      // Segment 1 (0.0 - 0.3): Chaos
      // Segment 2 (0.3 - 0.6): Scanner pulse sweeping left-to-right
      // Segment 3 (0.6 - 0.9): Orbital Reorganization
      // Segment 4 (0.9 - 1.0): Final Constellation Locking

      // 1. Draw Scanner line sweeping if in Act 2
      if (scrollProgress > 0.25 && scrollProgress < 0.65) {
        const sweepProgress = (scrollProgress - 0.25) / 0.4; // 0 to 1
        const sweepX = sweepProgress * width;

        const scanGradient = ctx.createLinearGradient(sweepX - 80, 0, sweepX + 10, 0);
        scanGradient.addColorStop(0, "rgba(0, 255, 255, 0)");
        scanGradient.addColorStop(0.8, "rgba(0, 255, 255, 0.08)");
        scanGradient.addColorStop(1, "rgba(0, 255, 255, 0.6)");

        ctx.fillStyle = scanGradient;
        ctx.fillRect(sweepX - 80, 0, 90, height);
      }

      // 2. Draw central nexus glowing sphere in late scroll stages
      if (scrollProgress > 0.5) {
        const sphereProgress = (scrollProgress - 0.5) / 0.5; // 0 to 1
        const maxRadius = 45;
        const currentRadius = sphereProgress * maxRadius;

        const glowGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, currentRadius);
        glowGrad.addColorStop(0, "rgba(0, 255, 255, 0.25)");
        glowGrad.addColorStop(0.5, "rgba(0, 255, 255, 0.05)");
        glowGrad.addColorStop(1, "rgba(0, 255, 255, 0)");

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Dynamic Central Scanner rings
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.15 * sphereProgress})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. Render and animate particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Animate flicker
        p.flickerPhase += p.flickerSpeed;
        const opacityMultiplier = 0.4 + Math.sin(p.flickerPhase) * 0.3;

        // Apply scroll-based interpolation vectors:
        // Transition from random drifting coordinates to structured orbiting nodes
        let targetX = p.x;
        let targetY = p.y;

        if (scrollProgress < 0.3) {
          // ACT 1: Pure Brownian Drift
          p.x += p.speedX;
          p.y += p.speedY;

          // Bounce off viewport boundaries
          if (p.x < 0 || p.x > width) p.speedX *= -1;
          if (p.y < 0 || p.y > height) p.speedY *= -1;

          ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${opacityMultiplier * 0.5})`);
        } else {
          // ACT 2, 3, 4: Stream into target orbits
          const orbitAngle = p.angle + (scrollProgress * 2.5 * p.orbitSpeed * 100);
          const currentRadius = p.radius + (1 - scrollProgress) * 200; // Pull tighter as we scroll

          const orbitX = centerX + Math.cos(orbitAngle) * currentRadius;
          const orbitY = centerY + Math.sin(orbitAngle) * currentRadius;

          // Interpolate current position towards orbital coordinates
          const lerpFactor = Math.min((scrollProgress - 0.3) / 0.4, 1); // Full lock by scroll = 0.7
          p.x = p.x + (orbitX - p.x) * lerpFactor * 0.08;
          p.y = p.y + (orbitY - p.y) * lerpFactor * 0.08;

          // Color shifts: turn into bright coordinates (cyan/crimson)
          const targetColor = p.radius > 180 ? "rgba(255, 51, 51, 0.7)" : "rgba(0, 255, 255, 0.65)";
          ctx.fillStyle = targetColor.replace(/[\d.]+\)$/, `${opacityMultiplier * 0.8})`);
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // ACT 3 & 4 (scroll > 0.65): Draw connections between proximal orbital nodes
        if (scrollProgress > 0.65) {
          const connectProgress = (scrollProgress - 0.65) / 0.35; // 0 to 1
          
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Connect nearest coordinates only (within 60px)
            if (dist < 60) {
              const alpha = (1 - dist / 60) * 0.12 * connectProgress;
              ctx.strokeStyle = p.radius > 180 
                ? `rgba(255, 51, 51, ${alpha})` 
                : `rgba(0, 255, 255, ${alpha})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [scrollProgress]);

  // 3. Narrative texts displaying alongside scroll progression
  const getSceneText = () => {
    if (scrollProgress < 0.25) {
      return {
        title: "Dynamic discrimination is counting on you never proving it.",
        subtitle: "Airlines, hotels, and retail conglomerates charge different prices based on where, how, and when you search — and dynamic pricing is the invisible tax you're already paying.",
        color: "text-[#F3F3F0]"
      };
    } else if (scrollProgress < 0.6) {
      return {
        title: "We sweep through regional coordinate layers concurrently.",
        subtitle: "Firing concurrent search queries through global residential node proxy networks rotating mobile and desktop device fingerprints simultaneously.",
        color: "text-[#00FFFF]"
      };
    } else if (scrollProgress < 0.88) {
      return {
        title: "Rigorous statistical forensics isolate corporate arbitrage.",
        subtitle: "Calculating Gini coefficients of pricing inequality and running Mann-Whitney significance distributions to yield peer-reviewable legal evidence.",
        color: "text-[#00FFFF]"
      };
    } else {
      return {
        title: "PriceGhost drags the coordinates of corporate bias into light.",
        subtitle: "Expose dynamic surcharge markups, download cryptographically sealed evidence dossiers, and claim the fair market prices you deserve.",
        color: "text-[#FF3333]"
      };
    }
  };

  const sceneText = getSceneText();

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      style={{ height: `${scrollHeightVh}vh` }}
    >
      {/* Fixed Full-Viewport Cinematic Canvas */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-[#050506] forensic-grid z-0">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
        
        {/* Paper editorial boundary margins */}
        <div className="absolute inset-0 pointer-events-none border-[12px] border-[#050506] z-10">
          <div className="w-full h-full border border-[#F3F3F0]/5 relative">
            {/* Top surveillance header markers */}
            <div className="absolute top-4 left-4 flex gap-4 text-[9px] font-mono text-[#94A3B8] tracking-widest uppercase">
              <span>Origin: MUMBAI_NXS</span>
              <span>Vector: GLOBAL_AUDIT</span>
            </div>
            <div className="absolute top-4 right-4 flex gap-4 text-[9px] font-mono text-[#94A3B8] tracking-widest uppercase">
              <span>Status: SCANNER_READY</span>
              <span className="animate-pulse text-[#00FFFF]">● LIVE</span>
            </div>

            {/* Asymmetric typographic editorial columns overlay */}
            <div className="absolute bottom-16 left-8 right-8 md:left-16 md:right-16 z-20 flex flex-col md:flex-row gap-8 items-end justify-between transition-all duration-500 ease-out">
              {/* Left Column (Editorial Title) */}
              <div className="flex flex-col gap-4 max-w-2xl">
                <span className="text-[10px] font-mono text-[#00FFFF] tracking-[0.25em] uppercase font-bold">
                  Surveillance Investigation Dossier
                </span>
                <h1 className={`text-4xl md:text-6xl font-normal leading-tight font-serif tracking-tight transition-colors duration-500 ${sceneText.color}`}>
                  {sceneText.title}
                </h1>
              </div>

              {/* Right Column (Typographic Subtext) */}
              <div className="flex flex-col gap-4 max-w-sm border-t md:border-t-0 md:border-l border-[#F3F3F0]/10 pt-4 md:pt-0 md:pl-6 pb-2">
                <p className="text-xs md:text-sm font-sans leading-relaxed text-[#94A3B8] font-light">
                  {sceneText.subtitle}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#F3F3F0]/50 uppercase tracking-widest mt-1">
                  <span>Scroll to investigate</span>
                  <span className="animate-bounce">↓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
