import React, { useEffect, useRef } from 'react';

const MathBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const mathSymbols = [
      '∫', '∑', '∆', '∇', '∂', '∞', 'π', 'θ', 'λ', 'μ', 'σ', 'Φ', 'Ω',
      'α', 'β', 'γ', '≈', '≠', '≤', '≥', '±', '×', '÷', '√', '∛',
      'sin', 'cos', 'tan', 'log', 'ln', 'e^x', 'x²', 'x³', 'f(x)',
      'dy/dx', '∮', '∏', '∈', '∉', '⊂', '⊃', '∪', '∩', '∅'
    ];

    // Particle system with physics and connections
    class PhysicsSymbol {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.symbol = mathSymbols[Math.floor(Math.random() * mathSymbols.length)];
        this.size = Math.random() * 16 + 12;
        this.mass = this.size / 10;
        this.opacity = Math.random() * 0.6 + 0.4;
        this.connections = [];
        this.energy = Math.random() * 100;
        this.maxEnergy = 100;
        // Blue color scheme
        this.hue = Math.random() * 60 + 220; // Blue to purple range
      }

      update(symbols) {
        // Physics
        this.x += this.vx;
        this.y += this.vy;
        
        // Boundary bouncing
        if (this.x <= 0 || this.x >= canvas.width) {
          this.vx *= -0.8;
          this.x = Math.max(0, Math.min(canvas.width, this.x));
        }
        if (this.y <= 0 || this.y >= canvas.height) {
          this.vy *= -0.8;
          this.y = Math.max(0, Math.min(canvas.height, this.y));
        }
        
        // Friction
        this.vx *= 0.999;
        this.vy *= 0.999;
        
        // Find connections
        this.connections = [];
        symbols.forEach(other => {
          if (other !== this) {
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
              this.connections.push({
                symbol: other,
                distance: distance,
                strength: 1 - (distance / 120)
              });
              
              // Subtle attraction
              const force = 0.001;
              this.vx -= (dx / distance) * force;
              this.vy -= (dy / distance) * force;
            }
          }
        });
        
        // Energy decay and regeneration
        this.energy = Math.max(0, this.energy - 0.5);
        if (this.energy < 20) {
          this.energy += Math.random() * 2;
        }
      }

      draw() {
        // Draw connections first
        this.connections.forEach(conn => {
          const alpha = conn.strength * 0.3;
          ctx.strokeStyle = `hsl(${this.hue}, 70%, 60%, ${alpha})`;
          ctx.lineWidth = conn.strength * 2;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(conn.symbol.x, conn.symbol.y);
          ctx.stroke();
        });
        
        // Draw symbol with energy-based effects
        const energyRatio = this.energy / this.maxEnergy;
        const pulseSize = this.size + Math.sin(Date.now() * 0.01) * energyRatio * 3;
        
        ctx.save();
        
        // Glow based on energy
        ctx.shadowColor = `hsl(${this.hue}, 70%, 60%, ${energyRatio})`;
        ctx.shadowBlur = energyRatio * 15;
        
        ctx.font = `${pulseSize}px 'Arial', sans-serif`;
        ctx.fillStyle = `hsl(${this.hue}, 70%, 60%, ${this.opacity})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, this.x, this.y);
        
        // Energy ring
        if (energyRatio > 0.7) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, pulseSize + 5, 0, Math.PI * 2);
          ctx.strokeStyle = `hsl(${this.hue}, 70%, 60%, ${(energyRatio - 0.7) * 0.5})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        ctx.restore();
      }
    }

    const symbols = [];
    for (let i = 0; i < 35; i++) {
      symbols.push(new PhysicsSymbol());
    }

    const animate = () => {
      // Clear with blue gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      );
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      symbols.forEach(symbol => {
        symbol.update(symbols);
        symbol.draw();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    />
  );
};

export default MathBackground;