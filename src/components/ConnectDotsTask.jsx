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

  // Generate random positions for targets
  const generateTargets = (diff) => {
    const newTargets = [];
    const padding = DOT_RADIUS + 20;
    
    for (let i = 0; i < NUM_TARGETS; i++) {
      let x, y, tooClose;
      do {
        x = padding + Math.random() * (CANVAS_WIDTH - 2 * padding);
        y = padding + Math.random() * (CANVAS_HEIGHT - 2 * padding);
        
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
      setCurrentStroke([{
        x: pos.x,
        y: pos.y,
        timestamp: performance.now() - startTimeRef.current,
        targetIndex: currentIndex
      }]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    
    const pos = getMousePos(e);
    setCurrentStroke(prev => [...prev, {
      x: pos.x,
      y: pos.y,
      timestamp: performance.now() - startTimeRef.current,
      targetIndex: currentIndex
    }]);
    
    // Check if we've entered the current target while dragging
    const currentTarget = targets[currentIndex];
    if (isInsideTarget(pos, currentTarget)) {
      // We're inside the target - check if this is different from last position
      const lastStroke = currentStroke[currentStroke.length - 1];
      if (!lastStroke || !isInsideTarget(lastStroke, currentTarget)) {
        // Just entered the target, move to next
        const finalStroke = [...currentStroke, {
          x: pos.x,
          y: pos.y,
          timestamp: performance.now() - startTimeRef.current,
          targetIndex: currentIndex
        }];
        
        setTrajectoryData(prev => [...prev, finalStroke]);
        setCurrentStroke([]);
        
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
        <h2 className="text-2xl font-bold mb-4">Connect the Dots Task</h2>
        
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-4">
            <label className="font-semibold">Difficulty:</label>
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              disabled={isDrawing || (currentIndex > 0 && !completed)}
            >
              <option value="numbers">Numbers (1→2→3...)</option>
              <option value="alternating">Alternating (1→A→2→B...)</option>
            </select>
            
            <button
              onClick={resetTask}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Reset Task
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Instructions:</strong> Click and hold on the highlighted dot, then drag to connect the dots in sequence. Release the mouse when you reach the next dot. If you release too early, the task resets!</p>
          </div>
        </div>
        
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden mb-4">
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
          <div className="bg-green-100 border border-green-400 rounded-lg p-4 space-y-3">
            <p className="text-green-800 font-semibold text-lg">✓ Task Completed!</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowData(!showData)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {showData ? 'Hide' : 'Show'} Trajectory Data
              </button>
              <button
                onClick={downloadTrajectoryData}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Download JSON Data
              </button>
            </div>
            
            {showData && (
              <div className="mt-4 space-y-4">
                <div className="bg-white rounded p-4">
                  <h3 className="font-semibold mb-2">Trajectory Statistics</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Segment</th>
                          <th className="text-right py-2 px-3">Points</th>
                          <th className="text-right py-2 px-3">Distance (px)</th>
                          <th className="text-right py-2 px-3">Duration (ms)</th>
                          <th className="text-right py-2 px-3">Avg Velocity (px/s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getTrajectoryStats()?.map((stat, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-2 px-3">{stat.segment}</td>
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
                
                <div className="bg-white rounded p-4">
                  <h3 className="font-semibold mb-2">Raw Data Preview</h3>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-60">
                    {JSON.stringify({
                      difficulty,
                      numSegments: trajectoryData.length,
                      totalPoints: trajectoryData.reduce((acc, stroke) => acc + stroke.length, 0),
                      samplePoint: trajectoryData[0]?.[0]
                    }, null, 2)}
                  </pre>
                  <p className="text-xs text-gray-600 mt-2">
                    Click "Download JSON Data" to get the full trajectory data for analysis
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!completed && currentIndex > 0 && (
          <div className="bg-blue-100 border border-blue-400 rounded-lg p-3">
            <p className="text-blue-800">
              Progress: {currentIndex} / {NUM_TARGETS} targets completed
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectDotsTask;