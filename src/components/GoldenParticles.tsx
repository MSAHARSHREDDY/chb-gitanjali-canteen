import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  alpha: number;
  angle: number;
  spin: number;
  type: "circle" | "ribbon" | "star";
}

export function GoldenParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.width = window.innerWidth;
        height = canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    const particles: Particle[] = [];
    const colors = [
      "rgba(255, 215, 0, ",  // Gold
      "rgba(218, 165, 32, ", // Goldenrod
      "rgba(255, 223, 0, ",  // Golden yellow
      "rgba(255, 248, 220, ", // Cornsilk / Champagne
      "rgba(255, 165, 0, ",   // Orange-gold
    ];

    const createParticle = (isInitial = false): Particle => {
      const size = Math.random() * 3.5 + 1.2;
      const colorTemplate = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: Math.random() * width,
        y: isInitial ? Math.random() * height : -20,
        size,
        color: colorTemplate,
        speedX: Math.random() * 1.8 - 0.9,
        speedY: Math.random() * 2.2 + 1.2, // gracefully cascaded downward
        alpha: Math.random() * 0.75 + 0.25,
        angle: Math.random() * Math.PI * 2,
        spin: Math.random() * 0.03 - 0.015,
        type: Math.random() > 0.6 ? (Math.random() > 0.5 ? "ribbon" : "star") : "circle",
      };
    };

    // Initial warm load population
    for (let i = 0; i < 100; i++) {
      particles.push(createParticle(true));
    }

    const drawStar = (
      cContext: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      spikes: number,
      outerRadius: number,
      innerRadius: number
    ) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      cContext.beginPath();
      cContext.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        cContext.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        cContext.lineTo(x, y);
        rot += step;
      }
      cContext.lineTo(cx, cy - outerRadius);
      cContext.closePath();
      cContext.fill();
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Keep spawning active particles up to 180 count
      if (particles.length < 180 && Math.random() < 0.75) {
        particles.push(createParticle(false));
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Basic falling physics combined with simple wind-swaying noise
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(time * 0.0015 + p.angle) * 0.4;
        p.angle += p.spin;

        // Fluttering opacity for magical shimmer effect
        const currentAlpha = p.alpha * (0.55 + Math.sin(time * 0.004 + p.x) * 0.45);

        ctx.fillStyle = `${p.color}${currentAlpha})`;
        ctx.shadowColor = "rgba(255, 215, 0, 0.45)";
        ctx.shadowBlur = p.size * 1.5;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        if (p.type === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === "ribbon") {
          ctx.fillRect(-p.size, -p.size / 3, p.size * 2, p.size / 1.5);
        } else {
          drawStar(ctx, 0, 0, 5, p.size * 1.5, p.size * 0.6);
        }

        ctx.restore();

        // Recycle if below baseline
        if (p.y > height + 20 || p.x < -20 || p.x > width + 20) {
          particles[i] = createParticle(false);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="welcome_ceremony_canvas"
      className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-hidden"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
