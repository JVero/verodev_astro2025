import React, { useState, useRef, useEffect } from 'react';

const ConnectDotsTask = () => {
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
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw boundary indicator to show safe drawing area
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      BORDER_PADDING, 
      BORDER_PADDING, 
      CANVAS_WIDTH - 2 * BORDER_PADDING, 
      CANVAS_HEIGHT - 2 * BORDER_PADDING
    );
    ctx.setLineDash([]); // Reset line dash
    
    // Draw completed trajectory lines
    trajectoryData.forEach((stroke, idx) => {
      if (stroke.length > 1) {
        ctx.strokeStyle = '#3b82f6';
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
      ctx.strokeStyle = '#3b82f6';
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
        ctx.fillStyle = '#10b981';
        ctx.strokeStyle = '#059669';
      } else {
        ctx.fillStyle = '#e5e7eb';
        ctx.strokeStyle = '#9ca3af';
      }
      
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = isCompleted ? '#ffffff' : '#1f2937';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(target.label, target.x, target.y);
    });
    
  }, [targets, currentIndex, trajectoryData, currentStroke]);

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
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
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
    <div className="w-full max-w-4xl mx-auto p-6 space-y-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Connect the Dots Task</h2>
        
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <label className="font-semibold text-gray-700">Difficulty:</label>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${difficulty === 'numbers' ? 'text-blue-600' : 'text-gray-500'}`}>
                  Numbers
                </span>
                <button
                  onClick={() => setDifficulty(difficulty === 'numbers' ? 'alternating' : 'numbers')}
                  disabled={isDrawing || (currentIndex > 0 && !completed)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    difficulty === 'alternating' ? 'bg-blue-600' : 'bg-gray-300'
                  } ${(isDrawing || (currentIndex > 0 && !completed)) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      difficulty === 'alternating' ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${difficulty === 'alternating' ? 'text-blue-600' : 'text-gray-500'}`}>
                  Alternating
                </span>
              </div>
            </div>
            
            <button
              onClick={resetTask}
              className="px-6 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors shadow-sm"
            >
              Reset
            </button>
          </div>
          
          <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p><strong className="text-blue-800">Instructions:</strong> Click and hold on any gray dot to start, then drag to connect the dots in sequence. Release the mouse when you reach the next dot. If you release too early, the task resets!</p>
          </div>
        </div>
        
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden mb-4 shadow-inner">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-crosshair"
            style={{ display: 'block' }}
          />
        </div>
        
        {completed && (
          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 space-y-3">
            <p className="text-green-800 font-semibold text-lg flex items-center gap-2">
              <span className="text-2xl">✓</span> Task Completed!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowData(!showData)}
                className="px-5 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm"
              >
                {showData ? 'Hide' : 'Show'} Trajectory Data
              </button>
              <button
                onClick={downloadTrajectoryData}
                className="px-5 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm"
              >
                Download JSON
              </button>
            </div>
            
            {showData && (
              <div className="mt-4 space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="font-semibold mb-3 text-gray-800">Trajectory Statistics</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">Segment</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Points</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Distance (px)</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Duration (ms)</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Avg Velocity (px/s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getTrajectoryStats()?.map((stat, idx) => (
                          <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="py-2 px-3 font-medium">{stat.segment}</td>
                            <td className="text-right py-2 px-3">{stat.points}</td>
                            <td className="text-right py-2 px-3">{stat.distance}</td>
                            <td className="text-right py-2 px-3">{stat.duration}</td>
                            <td className="text-right py-2 px-3">{stat.avgVelocity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="font-semibold mb-3 text-gray-800">Raw Data Preview</h3>
                  <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-60 border border-gray-200 font-mono">
                    {JSON.stringify({
                      difficulty,
                      numSegments: trajectoryData.length,
                      totalPoints: trajectoryData.reduce((acc, stroke) => acc + stroke.length, 0),
                      samplePoint: trajectoryData[0]?.[0]
                    }, null, 2)}
                  </pre>
                  <p className="text-xs text-gray-600 mt-2">
                    Click "Download JSON" to get the full trajectory data for analysis
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!completed && currentIndex > 0 && (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-3">
            <p className="text-blue-800 font-medium">
              Progress: <span className="font-bold">{currentIndex} / {NUM_TARGETS}</span> targets completed
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectDotsTask;