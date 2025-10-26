import React, { useRef, useEffect, useState } from 'react';

const DotGridBackground = () => {
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const lastMousePosRef = useRef({ x: -1000, y: -1000 });
  const dotsRef = useRef([]);
  const animationFrameRef = useRef(null);

  // Configuration
  const DOT_SPACING = 15; // pixels between dot centers
  const DOT_RADIUS = 2;
  const MAX_DISTANCE = 120; // Maximum effect distance
  const MAX_DISTANCE_SQ = 120 * 120; // Squared for faster comparison
  const STRENGTH = 15; // How much dots move
  const EASING = 0.15; // How quickly dots return to position
  const MIN_CHANGE = 1; // Don't redraw if dot moved less than this

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
            lastDrawnX: i * DOT_SPACING,
            lastDrawnY: j * DOT_SPACING,
          });
        }
      }
      return dots;
    };

    dotsRef.current = generateDots();
    
    // Track which dots are active
    dotsRef.current.forEach(dot => {
      dot.isActive = false;
    });

    // Mouse move handler with throttling
    let rafScheduled = false;
    const handleMouseMove = (e) => {
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(() => {
          setMousePos({ x: e.clientX, y: e.clientY });
          rafScheduled = false;
        });
      }
    };

    const handleMouseLeave = () => {
      setMousePos({ x: -1000, y: -1000 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    let hasRendered = false;
    let activeDots = new Set();

    // Animation loop
    const animate = () => {
      // Only update if mouse moved significantly
      const dx = mousePos.x - lastMousePosRef.current.x;
      const dy = mousePos.y - lastMousePosRef.current.y;
      const mouseChanged = Math.sqrt(dx * dx + dy * dy) > 2;
      
      let needsRedraw = false;
      let activeThisFrame = false;
      
      if (mouseChanged) {
        lastMousePosRef.current = { ...mousePos };
        
        // Add newly affected dots to active set
        const mouseX = mousePos.x;
        const mouseY = mousePos.y;
        
        dotsRef.current.forEach((dot, idx) => {
          const dx = mouseX - dot.x;
          const dy = mouseY - dot.y;
          const distanceSq = dx * dx + dy * dy;
          
          if (distanceSq < MAX_DISTANCE_SQ) {
            const distance = Math.sqrt(distanceSq);
            const force = (MAX_DISTANCE - distance) / MAX_DISTANCE;
            const angle = Math.atan2(dy, dx);
            
            // Push dot away from mouse
            dot.targetX = dot.x + Math.cos(angle + Math.PI) * force * STRENGTH;
            dot.targetY = dot.y + Math.sin(angle + Math.PI) * force * STRENGTH;
            dot.isActive = true;
            activeDots.add(idx);
            activeThisFrame = true;
          } else {
            // Return to original position - but keep it active until it settles
            dot.targetX = dot.x;
            dot.targetY = dot.y;
            // Don't remove from activeDots here - let it settle
          }
        });
      }
      
      let isSettling = false;
      
      // Only process active dots or dots that were recently active
      for (let idx of activeDots) {
        const dot = dotsRef.current[idx];
        if (!dot) continue;
        
        dot.currentX += (dot.targetX - dot.currentX) * EASING;
        dot.currentY += (dot.targetY - dot.currentY) * EASING;
        
        // Track if this dot needs redrawing
        const changeX = Math.abs(dot.currentX - dot.lastDrawnX);
        const changeY = Math.abs(dot.currentY - dot.lastDrawnY);
        if (changeX > MIN_CHANGE || changeY > MIN_CHANGE) {
          needsRedraw = true;
        }
        
        // Check if still settling AFTER easing
        const dx = Math.abs(dot.currentX - dot.targetX);
        const dy = Math.abs(dot.currentY - dot.targetY);
        
        if (dx > 0.1 || dy > 0.1) {
          isSettling = true;
        } else if (dot.targetX === dot.x && dot.targetY === dot.y) {
          // Fully settled, remove from active set
          activeDots.delete(idx);
          dot.isActive = false;
        }
      }
      
      // If nothing changed and nothing is settling, skip redraw entirely
      if (!needsRedraw && !isSettling && hasRendered && activeDots.size === 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      // Always redraw if something changed, settling, or never rendered
      if (needsRedraw || isSettling || !hasRendered) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw each dot individually to avoid path issues
        ctx.fillStyle = '#9ca3af';
        dotsRef.current.forEach(dot => {
          ctx.beginPath();
          ctx.arc(dot.currentX, dot.currentY, DOT_RADIUS, 0, Math.PI * 2);
          ctx.fill();
          dot.lastDrawnX = dot.currentX;
          dot.lastDrawnY = dot.currentY;
        });
        
        hasRendered = true;
      }

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

