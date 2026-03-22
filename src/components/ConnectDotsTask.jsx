import React, { useState, useRef, useEffect } from 'react';

const ConnectDotsTask = ({ onComplete } = {}) => {
  const canvasRef = useRef(null);
  const [difficulty, setDifficulty] = useState('numbers'); // 'numbers' or 'alternating'
  const [targets, setTargets] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [trajectoryData, setTrajectoryData] = useState([]);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [showData, setShowData] = useState(false);
  const startTimeRef = useRef(null);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const DOT_RADIUS = 25;
  const NUM_TARGETS = 12;
  const MIN_POINT_DISTANCE = 5; // Minimum distance (in pixels) between consecutive points
  const BORDER_PADDING = DOT_RADIUS + 50; // Extra padding around canvas borders

  // Generate random positions for targets
  const generateTargets = (diff) => {
    const newTargets = [];

    for (let i = 0; i < NUM_TARGETS; i++) {
      let x, y, tooClose;
      do {
        x = BORDER_PADDING + Math.random() * (CANVAS_WIDTH - 2 * BORDER_PADDING);
        y = BORDER_PADDING + Math.random() * (CANVAS_HEIGHT - 2 * BORDER_PADDING);

        // Check if too close to existing targets
        tooClose = newTargets.some(target => {
          const dist = Math.sqrt((target.x - x) ** 2 + (target.y - y) ** 2);
          return dist < DOT_RADIUS * 3;
        });
      } while (tooClose);

      let label;
      if (diff === 'numbers') {
        label = (i + 1).toString();
      } else {
        // Alternating: 1, A, 2, B, 3, C, etc.
        label = i % 2 === 0
          ? ((i / 2) + 1).toString()
          : String.fromCharCode(65 + Math.floor(i / 2));
      }

      newTargets.push({ x, y, label, index: i });
    }

    return newTargets;
  };

  // Initialize targets when difficulty changes
  useEffect(() => {
    resetTask();
  }, [difficulty]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background — warm off-white
    ctx.fillStyle = '#F0EDE8';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw boundary indicator — warm stone border
    ctx.strokeStyle = '#EBE8E3';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      BORDER_PADDING,
      BORDER_PADDING,
      CANVAS_WIDTH - 2 * BORDER_PADDING,
      CANVAS_HEIGHT - 2 * BORDER_PADDING
    );
    ctx.setLineDash([]); // Reset line dash

    // Draw completed trajectory lines — accent color
    trajectoryData.forEach((stroke, idx) => {
      if (stroke.length > 1) {
        ctx.strokeStyle = '#9C4430';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
      }
    });

    // Draw current stroke
    if (currentStroke.length > 1) {
      ctx.strokeStyle = '#9C4430';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.stroke();
    }

    // Draw targets
    targets.forEach((target, idx) => {
      const isCompleted = idx < currentIndex;

      // Draw circle
      ctx.beginPath();
      ctx.arc(target.x, target.y, DOT_RADIUS, 0, 2 * Math.PI);

      if (isCompleted) {
        ctx.fillStyle = '#9C4430'; // accent for completed
        ctx.strokeStyle = '#7A3526';
      } else {
        ctx.fillStyle = '#EBE8E3'; // warm stone for incomplete
        ctx.strokeStyle = '#DDD9D2';
      }

      ctx.fill();
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = isCompleted ? '#ffffff' : '#1A1816';
      ctx.font = 'bold 18px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(target.label, target.x, target.y);
    });

  }, [targets, currentIndex, trajectoryData, currentStroke]);

  useEffect(() => {
    if (completed && onComplete) {
      onComplete({
        difficulty,
        trajectoryData,
        targets: targets.map(t => ({ x: t.x, y: t.y, label: t.label, index: t.index })),
        totalTime: trajectoryData.length > 0
          ? trajectoryData[trajectoryData.length - 1][trajectoryData[trajectoryData.length - 1].length - 1].timestamp
          : 0
      });
    }
  }, [completed]);

  const resetTask = () => {
    setTargets(generateTargets(difficulty));
    setCurrentIndex(0);
    setIsDrawing(false);
    setTrajectoryData([]);
    setCurrentStroke([]);
    setCompleted(false);
    setShowData(false);
    startTimeRef.current = null;
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const isInsideTarget = (pos, target) => {
    const dist = Math.sqrt((pos.x - target.x) ** 2 + (pos.y - target.y) ** 2);
    return dist <= DOT_RADIUS;
  };

  const handleMouseDown = (e) => {
    if (completed) return;

    const pos = getMousePos(e);
    const currentTarget = targets[currentIndex];

    if (isInsideTarget(pos, currentTarget)) {
      setIsDrawing(true);
      if (startTimeRef.current === null) {
        startTimeRef.current = performance.now();
      }

      // Mark the clicked target as complete immediately
      // This means we're starting to draw TO the next target
      const fromTargetIndex = currentIndex;
      setCurrentIndex(prev => {
        // If this is the last target, the task will complete
        if (prev === targets.length - 1) {
          setCompleted(true);
          setIsDrawing(false);
          return prev;
        }
        return prev + 1;
      });

      setCurrentStroke([{
        x: pos.x,
        y: pos.y,
        timestamp: performance.now() - startTimeRef.current,
        targetIndex: fromTargetIndex
      }]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const pos = getMousePos(e);

    // Check minimum distance from previous point to improve data quality
    // Only add the point if it's far enough from the last point
    if (currentStroke.length > 0) {
      const lastPoint = currentStroke[currentStroke.length - 1];
      const dist = Math.sqrt(
        (pos.x - lastPoint.x) ** 2 + (pos.y - lastPoint.y) ** 2
      );
      if (dist < MIN_POINT_DISTANCE) {
        return; // Skip this point, it's too close to the previous one
      }
    }

    // Get the target we're drawing TO (which is currentIndex)
    const targetWeAreDrawingTo = targets[currentIndex];

    setCurrentStroke(prev => [...prev, {
      x: pos.x,
      y: pos.y,
      timestamp: performance.now() - startTimeRef.current,
      targetIndex: currentIndex
    }]);

    // Check if we've entered the target we're aiming for
    if (isInsideTarget(pos, targetWeAreDrawingTo)) {
      // We're inside the target - check if this is different from last position
      const lastStroke = currentStroke[currentStroke.length - 1];
      if (!lastStroke || !isInsideTarget(lastStroke, targetWeAreDrawingTo)) {
        // Just entered the target, move to next
        const finalStroke = [...currentStroke, {
          x: pos.x,
          y: pos.y,
          timestamp: performance.now() - startTimeRef.current,
          targetIndex: currentIndex
        }];

        setTrajectoryData(prev => [...prev, finalStroke]);
        setCurrentStroke([]);

        // Check if we just reached the last target
        if (currentIndex === targets.length - 1) {
          // Task completed!
          setCompleted(true);
          setIsDrawing(false);
        } else {
          setCurrentIndex(prev => prev + 1);
        }
      }
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;

    // If we're still drawing when mouse is released, the task failed
    // (they lifted the mouse before reaching the target)
    if (!completed) {
      resetTask();
    }

    setIsDrawing(false);
  };

  const downloadTrajectoryData = () => {
    const dataStr = JSON.stringify({
      difficulty,
      targets: targets.map(t => ({ x: t.x, y: t.y, label: t.label, index: t.index })),
      trajectoryData,
      totalTime: trajectoryData.length > 0
        ? trajectoryData[trajectoryData.length - 1][trajectoryData[trajectoryData.length - 1].length - 1].timestamp
        : 0
    }, null, 2);

    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trajectory-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTrajectoryStats = () => {
    if (trajectoryData.length === 0) return null;

    const stats = trajectoryData.map((stroke, idx) => {
      const distance = stroke.reduce((acc, point, i) => {
        if (i === 0) return 0;
        const dx = point.x - stroke[i-1].x;
        const dy = point.y - stroke[i-1].y;
        return acc + Math.sqrt(dx * dx + dy * dy);
      }, 0);

      const duration = stroke[stroke.length - 1].timestamp - stroke[0].timestamp;
      const avgVelocity = distance / (duration / 1000); // pixels per second

      return {
        segment: `${targets[idx].label} → ${targets[idx + 1]?.label || 'End'}`,
        points: stroke.length,
        distance: distance.toFixed(2),
        duration: duration.toFixed(0),
        avgVelocity: avgVelocity.toFixed(2)
      };
    });

    return stats;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div style={{ background: '#FDFCFA', borderRadius: 8, border: '1px solid #EBE8E3', boxShadow: '0 1px 2px rgba(120,110,100,0.04)', padding: '24px' }}>
        <h2 style={{ fontFamily: '"Newsreader", ui-serif, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#1A1816', marginBottom: 20, letterSpacing: '-0.015em', marginTop: 0 }}>Connect the Dots Task</h2>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F0EDE8', borderRadius: 8, border: '1px solid #EBE8E3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ fontWeight: 600, fontSize: 13, color: '#5C5852' }}>Difficulty:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: difficulty === 'numbers' ? '#9C4430' : '#A8A39C' }}>
                  Numbers
                </span>
                <button
                  onClick={() => setDifficulty(difficulty === 'numbers' ? 'alternating' : 'numbers')}
                  disabled={isDrawing || (currentIndex > 0 && !completed)}
                  style={{
                    position: 'relative',
                    display: 'inline-flex',
                    height: 28,
                    width: 48,
                    alignItems: 'center',
                    borderRadius: 14,
                    border: 'none',
                    transition: 'background-color 0.15s ease',
                    backgroundColor: difficulty === 'alternating' ? '#9C4430' : '#DDD9D2',
                    cursor: (isDrawing || (currentIndex > 0 && !completed)) ? 'not-allowed' : 'pointer',
                    opacity: (isDrawing || (currentIndex > 0 && !completed)) ? 0.5 : 1,
                    padding: 0,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      height: 22,
                      width: 22,
                      borderRadius: '50%',
                      backgroundColor: '#FDFCFA',
                      transition: 'transform 0.15s ease',
                      transform: difficulty === 'alternating' ? 'translateX(23px)' : 'translateX(3px)',
                    }}
                  />
                </button>
                <span style={{ fontSize: 13, fontWeight: 500, color: difficulty === 'alternating' ? '#9C4430' : '#A8A39C' }}>
                  Alternating
                </span>
              </div>
            </div>

            <button
              onClick={resetTask}
              style={{ padding: '7px 16px', background: '#9C4430', color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, borderRadius: 6, cursor: 'pointer' }}
            >
              Reset
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 13, color: '#5C5852', background: '#F0EDE8', border: '1px solid #EBE8E3', borderRadius: 8, padding: '12px 16px', lineHeight: 1.6 }}>
            <strong style={{ color: '#1A1816' }}>Instructions:</strong> Click and hold on any gray dot to start, then drag to connect the dots in sequence. Release the mouse when you reach the next dot. If you release too early, the task resets!
          </div>
        </div>

        <div style={{ border: '2px solid #DDD9D2', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-crosshair"
            style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
          />
        </div>

        {completed && (
          <div style={{ background: '#F0EDE8', border: '2px solid #9C4430', borderRadius: 8, padding: 16 }}>
            <p style={{ color: '#1A1816', fontWeight: 600, fontSize: 16, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#9C4430', fontSize: 20 }}>&#10003;</span> Task Completed!
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowData(!showData)}
                style={{ padding: '7px 16px', background: 'none', border: '1px solid #DDD9D2', color: '#5C5852', fontSize: 13, fontWeight: 500, borderRadius: 6, cursor: 'pointer' }}
              >
                {showData ? 'Hide' : 'Show'} Trajectory Data
              </button>
              <button
                onClick={downloadTrajectoryData}
                style={{ padding: '7px 16px', background: '#9C4430', color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, borderRadius: 6, cursor: 'pointer' }}
              >
                Download JSON
              </button>
            </div>

            {showData && (
              <div style={{ marginTop: 16 }}>
                <div style={{ background: '#FDFCFA', borderRadius: 8, padding: 16, border: '1px solid #EBE8E3', marginBottom: 12 }}>
                  <h3 style={{ fontWeight: 600, marginBottom: 12, color: '#1A1816', fontSize: 14, marginTop: 0 }}>Trajectory Statistics</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #DDD9D2' }}>
                          <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#5C5852' }}>Segment</th>
                          <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, color: '#5C5852' }}>Points</th>
                          <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, color: '#5C5852' }}>Distance (px)</th>
                          <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, color: '#5C5852' }}>Duration (ms)</th>
                          <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, color: '#5C5852' }}>Avg Velocity (px/s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getTrajectoryStats()?.map((stat, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #EBE8E3' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 500, color: '#1A1816' }}>{stat.segment}</td>
                            <td style={{ textAlign: 'right', padding: '8px 12px', color: '#5C5852' }}>{stat.points}</td>
                            <td style={{ textAlign: 'right', padding: '8px 12px', color: '#5C5852' }}>{stat.distance}</td>
                            <td style={{ textAlign: 'right', padding: '8px 12px', color: '#5C5852' }}>{stat.duration}</td>
                            <td style={{ textAlign: 'right', padding: '8px 12px', color: '#5C5852' }}>{stat.avgVelocity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ background: '#FDFCFA', borderRadius: 8, padding: 16, border: '1px solid #EBE8E3' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: 12, color: '#1A1816', fontSize: 14, marginTop: 0 }}>Raw Data Preview</h3>
                  <pre style={{ fontSize: 12, background: '#F0EDE8', padding: 12, borderRadius: 6, overflow: 'auto', maxHeight: 240, border: '1px solid #EBE8E3', fontFamily: '"SF Mono", "Fira Code", Menlo, monospace', color: '#5C5852', margin: 0 }}>
                    {JSON.stringify({
                      difficulty,
                      numSegments: trajectoryData.length,
                      totalPoints: trajectoryData.reduce((acc, stroke) => acc + stroke.length, 0),
                      samplePoint: trajectoryData[0]?.[0]
                    }, null, 2)}
                  </pre>
                  <p style={{ fontSize: 12, color: '#A8A39C', marginTop: 8, marginBottom: 0 }}>
                    Click "Download JSON" to get the full trajectory data for analysis
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!completed && currentIndex > 0 && (
          <div style={{ background: '#F0EDE8', border: '1px solid #EBE8E3', borderRadius: 8, padding: 12 }}>
            <p style={{ color: '#5C5852', fontWeight: 500, fontSize: 14, margin: 0 }}>
              Progress: <span style={{ fontWeight: 700, color: '#9C4430' }}>{currentIndex} / {NUM_TARGETS}</span> targets completed
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectDotsTask;
