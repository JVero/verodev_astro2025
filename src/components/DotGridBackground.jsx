import React, { useRef, useEffect, useState } from 'react';

const DotGridBackground = () => {
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const dotsRef = useRef([]);
  const animationFrameRef = useRef(null);

  // Configuration
  const DOT_SPACING = 10; // pixels between dot centers
  const DOT_RADIUS = 2;
  const MAX_DISTANCE = 120; // Maximum effect distance
  const STRENGTH = 15; // How much dots move
  const EASING = 0.15; // How quickly dots return to position

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Calculate dimensions
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resize();
    window.addEventListener('resize', resize);

    // Generate grid of dots
    const generateDots = () => {
      const dots = [];
      const cols = Math.ceil(canvas.width / DOT_SPACING) + 2;
      const rows = Math.ceil(canvas.height / DOT_SPACING) + 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          dots.push({
            x: i * DOT_SPACING,
            y: j * DOT_SPACING,
            targetX: i * DOT_SPACING,
            targetY: j * DOT_SPACING,
            currentX: i * DOT_SPACING,
            currentY: j * DOT_SPACING,
          });
        }
      }
      return dots;
    };

    dotsRef.current = generateDots();

    // Mouse move handler
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
      setMousePos({ x: -1000, y: -1000 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update dot positions based on mouse
      dotsRef.current.forEach(dot => {
        const dx = mousePos.x - dot.x;
        const dy = mousePos.y - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < MAX_DISTANCE) {
          // Calculate push away effect
          const force = (MAX_DISTANCE - distance) / MAX_DISTANCE;
          const angle = Math.atan2(dy, dx);
          
          // Push dot away from mouse
          dot.targetX = dot.x + Math.cos(angle + Math.PI) * force * STRENGTH;
          dot.targetY = dot.y + Math.sin(angle + Math.PI) * force * STRENGTH;
        } else {
          // Return to original position
          dot.targetX = dot.x;
          dot.targetY = dot.y;
        }
        
        // Ease towards target
        dot.currentX += (dot.targetX - dot.currentX) * EASING;
        dot.currentY += (dot.targetY - dot.currentY) * EASING;
        
        // Draw dot
        ctx.beginPath();
        ctx.arc(dot.currentX, dot.currentY, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#9ca3af';
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePos]);

  return (
    <>
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
        }}
      />
      {/* Overlay for readability */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(249, 250, 251, 0.85)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

export default DotGridBackground;

