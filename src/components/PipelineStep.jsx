import React, { useState, useEffect, useRef, useMemo } from 'react';

// ============ Utility Functions ============

const computeVelocities = (stroke) => {
  if (!stroke || stroke.length < 2) return [];
  const velocities = [];
  for (let i = 1; i < stroke.length; i++) {
    const dx = stroke[i].x - stroke[i - 1].x;
    const dy = stroke[i].y - stroke[i - 1].y;
    const dt = (stroke[i].timestamp - stroke[i - 1].timestamp) / 1000;
    if (dt <= 0) continue;
    const v = Math.sqrt((dx / dt) ** 2 + (dy / dt) ** 2);
    velocities.push({
      v,
      t: stroke[i].timestamp,
      normalizedT: i / (stroke.length - 1),
    });
  }
  return velocities;
};

const smoothArray = (values, windowSize = 5) => {
  if (values.length === 0) return [];
  return values.map((_, i) => {
    const half = Math.floor(windowSize / 2);
    const start = Math.max(0, i - half);
    const end = Math.min(values.length, i + half + 1);
    const slice = values.slice(start, end);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
};

const getPeakIndex = (arr) => {
  if (arr.length === 0) return 0;
  return arr.reduce((maxIdx, v, idx) => v > arr[maxIdx] ? idx : maxIdx, 0);
};

// ============ Shared Hook ============

const useThesisData = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const update = () => {
      if (typeof window !== 'undefined' && window.__thesisData) {
        setData({ ...window.__thesisData });
      }
    };

    update();
    window.addEventListener('thesis-data-update', update);
    return () => window.removeEventListener('thesis-data-update', update);
  }, []);

  return data;
};

// ============ Shared Styles ============

const containerStyle = {
  background: '#FDFCFA',
  borderRadius: 8,
  border: '1px solid #EBE8E3',
  boxShadow: '0 1px 2px rgba(120,110,100,0.04)',
  padding: 24,
  marginTop: 8,
  marginBottom: 8,
};

const headingStyle = {
  fontFamily: '"Newsreader", ui-serif, Georgia, serif',
  fontSize: 18,
  fontWeight: 400,
  color: '#1A1816',
  marginTop: 0,
  marginBottom: 16,
  letterSpacing: '-0.015em',
};

const waitingStyle = {
  ...containerStyle,
  textAlign: 'center',
  color: '#A8A39C',
  padding: '40px 24px',
};

// ============ Condition Selector ============

const ConditionSelector = ({ data, selected, onChange }) => {
  const conditions = Object.keys(data).filter(k => data[k]?.trajectoryData);
  if (conditions.length <= 1) return null;
  const labels = { numbers: 'Numbers (low load)', alternating: 'Alternating (high load)' };
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#5C5852', marginRight: 8 }}>Condition:</label>
      {conditions.map(c => (
        <button key={c} onClick={() => onChange(c)}
          style={{
            padding: '4px 12px', marginRight: 6, borderRadius: 4,
            border: `1px solid ${selected === c ? '#9C4430' : '#DDD9D2'}`,
            background: selected === c ? '#9C4430' : '#F0EDE8',
            color: selected === c ? '#fff' : '#5C5852',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          {labels[c] || c}
        </button>
      ))}
    </div>
  );
};

// ============ Step Components ============

// --- Raw Data View ---
const RawDataView = ({ data }) => {
  const conditions = Object.keys(data).filter(k => data[k]?.trajectoryData);
  const [selectedCondition, setSelectedCondition] = useState(conditions[0] || 'numbers');

  const condition = data[selectedCondition] || data[conditions[0]];
  const trajectoryData = condition?.trajectoryData;

  if (!condition || !trajectoryData || trajectoryData.length === 0) return null;

  const firstStroke = trajectoryData[0];
  if (!firstStroke || firstStroke.length === 0) return null;

  const displayPoints = firstStroke.slice(0, 20);
  const totalPoints = trajectoryData.reduce((sum, s) => sum + s.length, 0);

  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>Your Raw Data</h3>
      <ConditionSelector data={data} selected={selectedCondition} onChange={setSelectedCondition} />
      <p style={{ fontSize: 13, color: '#5C5852', marginBottom: 16, marginTop: 0 }}>
        Showing the first {displayPoints.length} samples from your first sub-trail.
        You generated <strong>{totalPoints} total data points</strong> across {trajectoryData.length} sub-trails.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', fontFamily: '"SF Mono", "Fira Code", Menlo, monospace' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #DDD9D2' }}>
              <th style={{ textAlign: 'right', padding: '6px 10px', fontWeight: 600, color: '#5C5852' }}>Sample</th>
              <th style={{ textAlign: 'right', padding: '6px 10px', fontWeight: 600, color: '#5C5852' }}>X (px)</th>
              <th style={{ textAlign: 'right', padding: '6px 10px', fontWeight: 600, color: '#5C5852' }}>Y (px)</th>
              <th style={{ textAlign: 'right', padding: '6px 10px', fontWeight: 600, color: '#5C5852' }}>Time (ms)</th>
              <th style={{ textAlign: 'right', padding: '6px 10px', fontWeight: 600, color: '#5C5852' }}>&Delta;t (ms)</th>
            </tr>
          </thead>
          <tbody>
            {displayPoints.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #EBE8E3' }}>
                <td style={{ textAlign: 'right', padding: '5px 10px', color: '#A8A39C' }}>{i}</td>
                <td style={{ textAlign: 'right', padding: '5px 10px', color: '#1A1816' }}>{p.x.toFixed(1)}</td>
                <td style={{ textAlign: 'right', padding: '5px 10px', color: '#1A1816' }}>{p.y.toFixed(1)}</td>
                <td style={{ textAlign: 'right', padding: '5px 10px', color: '#1A1816' }}>{p.timestamp.toFixed(1)}</td>
                <td style={{ textAlign: 'right', padding: '5px 10px', color: '#5C5852' }}>
                  {i > 0 ? (p.timestamp - displayPoints[i - 1].timestamp).toFixed(1) : '\u2014'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {firstStroke.length > 20 && (
        <p style={{ fontSize: 12, color: '#A8A39C', marginTop: 8, marginBottom: 0, fontStyle: 'italic' }}>
          ...and {firstStroke.length - 20} more samples in this sub-trail alone.
        </p>
      )}
    </div>
  );
};

// --- Segments View ---
const SegmentsView = ({ data }) => {
  const canvasRef = useRef(null);
  const conditions = Object.keys(data).filter(k => data[k]?.trajectoryData);
  const [selectedCondition, setSelectedCondition] = useState(conditions[0] || 'numbers');

  const condition = data[selectedCondition] || data[conditions[0]];
  const trajectoryData = condition?.trajectoryData;
  const targets = condition?.targets;

  const CANVAS_W = 600;
  const CANVAS_H = 450;

  useEffect(() => {
    if (!trajectoryData || !targets) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#F0EDE8';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Scale from 800x600 task canvas to our display canvas
    const sx = CANVAS_W / 800;
    const sy = CANVAS_H / 600;

    const numSegments = trajectoryData.length;
    trajectoryData.forEach((stroke, idx) => {
      if (stroke.length < 2) return;
      const hue = (idx * 360 / numSegments);
      ctx.strokeStyle = `hsl(${hue}, 60%, 45%)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * sx, stroke[0].y * sy);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x * sx, stroke[i].y * sy);
      }
      ctx.stroke();
    });

    // Draw targets
    targets.forEach((t) => {
      ctx.beginPath();
      ctx.arc(t.x * sx, t.y * sy, 15, 0, 2 * Math.PI);
      ctx.fillStyle = '#FDFCFA';
      ctx.fill();
      ctx.strokeStyle = '#DDD9D2';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#1A1816';
      ctx.font = 'bold 12px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.label, t.x * sx, t.y * sy);
    });
  }, [trajectoryData, targets, selectedCondition]);

  if (!condition || !trajectoryData) return null;

  const segmentStats = trajectoryData.map((stroke, idx) => {
    const distance = stroke.reduce((acc, p, i) => {
      if (i === 0) return 0;
      return acc + Math.sqrt((p.x - stroke[i - 1].x) ** 2 + (p.y - stroke[i - 1].y) ** 2);
    }, 0);
    const duration = stroke.length > 1 ? stroke[stroke.length - 1].timestamp - stroke[0].timestamp : 0;
    return { points: stroke.length, distance: distance.toFixed(0), duration: duration.toFixed(0) };
  });

  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>Your Path, Segmented</h3>
      <ConditionSelector data={data} selected={selectedCondition} onChange={setSelectedCondition} />
      <div style={{ border: '1px solid #EBE8E3', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
      </div>
      <div style={{ fontSize: 13, color: '#5C5852', marginBottom: 12 }}>
        <strong>{trajectoryData.length} sub-trails</strong> extracted. Each color is a single goal-directed movement
        between consecutive targets.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
        {segmentStats.map((s, i) => (
          <div key={i} style={{
            padding: '8px 10px',
            background: '#F0EDE8',
            borderRadius: 6,
            fontSize: 12,
            borderLeft: `3px solid hsl(${i * 360 / segmentStats.length}, 60%, 45%)`
          }}>
            <div style={{ fontWeight: 600, color: '#1A1816', marginBottom: 2 }}>
              {targets[i]?.label} &rarr; {targets[i + 1]?.label}
            </div>
            <div style={{ color: '#5C5852' }}>
              {s.points} samples &middot; {s.distance}px &middot; {s.duration}ms
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Velocity View ---
const VelocityView = ({ data }) => {
  const canvasRef = useRef(null);
  const conditions = Object.keys(data).filter(k => data[k]?.trajectoryData);
  const [selectedCondition, setSelectedCondition] = useState(conditions[0] || 'numbers');
  const [selectedSegment, setSelectedSegment] = useState(0);

  const condition = data[selectedCondition] || data[conditions[0]];
  const trajectoryData = condition?.trajectoryData;
  const targets = condition?.targets;
  const stroke = trajectoryData?.[selectedSegment];

  const velocities = useMemo(() => stroke ? computeVelocities(stroke) : [], [stroke]);
  const smoothedV = useMemo(() => smoothArray(velocities.map(v => v.v), 5), [velocities]);
  const peakIdx = useMemo(() => getPeakIndex(smoothedV), [smoothedV]);
  const normalizedPeakTiming = velocities.length > 1 ? peakIdx / (smoothedV.length - 1) : 0.5;

  const CANVAS_W = 600;
  const CANVAS_H = 300;
  const PAD = { left: 70, right: 20, top: 30, bottom: 45 };
  const plotW = CANVAS_W - PAD.left - PAD.right;
  const plotH = CANVAS_H - PAD.top - PAD.bottom;

  // Reset segment selection when condition changes
  useEffect(() => { setSelectedSegment(0); }, [selectedCondition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || smoothedV.length === 0) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#FDFCFA';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const maxV = Math.max(...smoothedV) * 1.1;
    const minT = velocities[0].t;
    const maxT = velocities[velocities.length - 1].t;
    const timeRange = maxT - minT || 1;

    const toX = (t) => PAD.left + ((t - minT) / timeRange) * plotW;
    const toY = (v) => PAD.top + plotH - (v / maxV) * plotH;

    // Grid lines
    ctx.strokeStyle = '#EBE8E3';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + (plotH * i / 4);
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + plotW, y);
      ctx.stroke();
    }

    // Plot area border
    ctx.strokeStyle = '#DDD9D2';
    ctx.strokeRect(PAD.left, PAD.top, plotW, plotH);

    // Velocity curve
    ctx.strokeStyle = '#9C4430';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    smoothedV.forEach((v, i) => {
      const x = toX(velocities[i].t);
      const y = toY(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Peak vertical dashed line
    const peakX = toX(velocities[peakIdx].t);
    const peakY = toY(smoothedV[peakIdx]);
    ctx.strokeStyle = '#9C4430';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(peakX, PAD.top);
    ctx.lineTo(peakX, PAD.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Peak marker
    ctx.beginPath();
    ctx.arc(peakX, peakY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#9C4430';
    ctx.fill();
    ctx.strokeStyle = '#FDFCFA';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Peak annotation
    ctx.fillStyle = '#9C4430';
    ctx.font = 'bold 12px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    const peakLabel = `Peak: ${(normalizedPeakTiming * 100).toFixed(0)}% through movement`;
    const labelX = Math.min(Math.max(peakX, PAD.left + 100), PAD.left + plotW - 100);
    ctx.fillText(peakLabel, labelX, PAD.top - 8);

    // Y axis label
    ctx.fillStyle = '#5C5852';
    ctx.font = '12px -apple-system, system-ui, sans-serif';
    ctx.save();
    ctx.translate(15, PAD.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Velocity (px/s)', 0, 0);
    ctx.restore();

    // X axis label
    ctx.textAlign = 'center';
    ctx.fillText('Time (ms)', PAD.left + plotW / 2, CANVAS_H - 5);

    // Y tick labels
    ctx.font = '11px "SF Mono", Menlo, monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = (maxV * (4 - i) / 4).toFixed(0);
      ctx.fillText(val, PAD.left - 8, PAD.top + plotH * i / 4 + 4);
    }

    // X tick labels
    ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
      const t = minT + timeRange * i / 4;
      ctx.fillText(t.toFixed(0), toX(t), PAD.top + plotH + 18);
    }
  }, [smoothedV, velocities, peakIdx, normalizedPeakTiming, selectedSegment, selectedCondition]);

  if (!condition || !trajectoryData || !stroke || smoothedV.length === 0) return null;

  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>Velocity Profile</h3>
      <ConditionSelector data={data} selected={selectedCondition} onChange={setSelectedCondition} />
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#5C5852' }}>Sub-trail:</label>
        <select
          value={selectedSegment}
          onChange={(e) => setSelectedSegment(Number(e.target.value))}
          style={{
            padding: '4px 8px', borderRadius: 4, border: '1px solid #DDD9D2',
            fontSize: 13, background: '#F0EDE8', color: '#1A1816',
          }}
        >
          {trajectoryData.map((_, i) => (
            <option key={i} value={i}>
              {targets[i]?.label} &rarr; {targets[i + 1]?.label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ border: '1px solid #EBE8E3', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
      </div>
      <div style={{ fontSize: 13, color: '#5C5852' }}>
        Peak velocity of <strong>{smoothedV[peakIdx]?.toFixed(0)} px/s</strong> occurs
        at <strong>{(normalizedPeakTiming * 100).toFixed(0)}%</strong> of the way through this sub-trail.
        Try selecting different sub-trails to see how consistent (or inconsistent) the timing is.
      </div>
    </div>
  );
};

// --- Peak Timing View ---
const PeakTimingView = ({ data }) => {
  const canvasRef = useRef(null);

  const conditionData = useMemo(() => {
    const result = {};
    for (const [key, condition] of Object.entries(data)) {
      if (!condition?.trajectoryData) continue;

      const timings = condition.trajectoryData.map(stroke => {
        const velocities = computeVelocities(stroke);
        if (velocities.length < 3) return null;
        const smoothed = smoothArray(velocities.map(v => v.v), 5);
        const peakIdx = getPeakIndex(smoothed);
        return peakIdx / (smoothed.length - 1);
      }).filter(t => t !== null);

      const avgVelocities = condition.trajectoryData.map(stroke => {
        const vel = computeVelocities(stroke);
        if (vel.length === 0) return 0;
        return vel.reduce((sum, v) => sum + v.v, 0) / vel.length;
      });

      result[key] = {
        timings,
        meanTiming: timings.length > 0 ? timings.reduce((a, b) => a + b, 0) / timings.length : 0,
        avgVelocity: avgVelocities.length > 0
          ? avgVelocities.reduce((a, b) => a + b, 0) / avgVelocities.length
          : 0,
      };
    }
    return result;
  }, [data]);

  const conditions = Object.keys(conditionData);
  const hasComparison = conditions.length === 2;

  const CANVAS_W = 600;
  const CANVAS_H = hasComparison ? 220 : 150;
  const PAD = { left: 110, right: 30, top: 35, bottom: 35 };
  const plotW = CANVAS_W - PAD.left - PAD.right;
  const rowH = 55;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || conditions.length === 0) return;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#FDFCFA';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const toX = (t) => PAD.left + t * plotW;

    // Grid
    ctx.strokeStyle = '#EBE8E3';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = toX(i / 10);
      ctx.beginPath();
      ctx.moveTo(x, PAD.top - 5);
      ctx.lineTo(x, PAD.top + conditions.length * rowH);
      ctx.stroke();
    }

    // X axis labels
    ctx.fillStyle = '#5C5852';
    ctx.font = '11px "SF Mono", Menlo, monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i++) {
      ctx.fillText((i * 10) + '%', toX(i / 10), CANVAS_H - 10);
    }

    // Draw each condition
    const colors = { numbers: '#4A7C59', alternating: '#9C4430' };
    const labels = { numbers: 'Numbers', alternating: 'Alternating' };

    // Sort so numbers comes first if present
    const sortedConditions = [...conditions].sort((a, b) => a === 'numbers' ? -1 : 1);

    sortedConditions.forEach((key, rowIdx) => {
      const cd = conditionData[key];
      const centerY = PAD.top + rowIdx * rowH + rowH / 2;
      const color = colors[key] || '#5C5852';

      // Row label
      ctx.fillStyle = '#1A1816';
      ctx.font = 'bold 13px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(labels[key] || key, PAD.left - 14, centerY + 4);

      // Individual dots with deterministic jitter
      cd.timings.forEach((t, i) => {
        ctx.beginPath();
        const jitter = (((i * 7 + 3) % 11) / 11 - 0.5) * 20;
        ctx.arc(toX(t), centerY + jitter, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color + '77';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Mean line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(toX(cd.meanTiming), centerY - rowH / 2 + 8);
      ctx.lineTo(toX(cd.meanTiming), centerY + rowH / 2 - 8);
      ctx.stroke();

      // Mean label
      ctx.fillStyle = color;
      ctx.font = 'bold 11px "SF Mono", Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`\u03BC = ${(cd.meanTiming * 100).toFixed(1)}%`, toX(cd.meanTiming), centerY - rowH / 2);
    });
  }, [conditionData, conditions.length]);

  if (conditions.length === 0) return null;

  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>Peak Velocity Timing Across Sub-trails</h3>
      <div style={{ border: '1px solid #EBE8E3', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
      </div>

      <div style={{ fontSize: 13, color: '#5C5852' }}>
        <p style={{ margin: '0 0 8px 0' }}>
          Each dot is one sub-trail&rsquo;s normalized peak velocity timing &mdash; where in the movement
          you reached your fastest speed. The vertical line marks the mean.
        </p>
        {hasComparison ? (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: '#4A7C59', fontWeight: 700 }}>Numbers:</span>{' '}
              mean peak at {(conditionData.numbers?.meanTiming * 100).toFixed(1)}%,
              avg speed {conditionData.numbers?.avgVelocity.toFixed(0)} px/s
            </div>
            <div>
              <span style={{ color: '#9C4430', fontWeight: 700 }}>Alternating:</span>{' '}
              mean peak at {(conditionData.alternating?.meanTiming * 100).toFixed(1)}%,
              avg speed {conditionData.alternating?.avgVelocity.toFixed(0)} px/s
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, fontStyle: 'italic' }}>
            Complete both conditions to compare timing across cognitive loads.
          </p>
        )}
      </div>
    </div>
  );
};

// ============ Waiting State ============

const WaitingPlaceholder = ({ message }) => (
  <div style={waitingStyle}>
    <p style={{ margin: 0, fontSize: 14, fontStyle: 'italic' }}>
      {message || 'Complete the Connect the Dots task above to see your data here.'}
    </p>
  </div>
);

// ============ Main Component ============

const PipelineStep = ({ step }) => {
  const data = useThesisData();

  if (!data || Object.keys(data).length === 0) {
    const messages = {
      'raw-data': 'Complete the task above to see your raw trajectory data.',
      'segments': 'Complete the task above to see your path segmented into sub-trails.',
      'velocity': 'Complete the task above to see your velocity profile.',
      'peak-timing': 'Complete the task above to see your peak velocity timing analysis.',
    };
    return <WaitingPlaceholder message={messages[step]} />;
  }

  switch (step) {
    case 'raw-data': return <RawDataView data={data} />;
    case 'segments': return <SegmentsView data={data} />;
    case 'velocity': return <VelocityView data={data} />;
    case 'peak-timing': return <PeakTimingView data={data} />;
    default: return null;
  }
};

export default PipelineStep;
