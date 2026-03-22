import React, { useState } from 'react';
import ConnectDotsTask from './ConnectDotsTask';

const ThesisConnectDots = () => {
  const [completedConditions, setCompletedConditions] = useState({});

  const handleComplete = (data) => {
    if (typeof window !== 'undefined') {
      window.__thesisData = window.__thesisData || {};
      window.__thesisData[data.difficulty] = data;
      window.dispatchEvent(new CustomEvent('thesis-data-update'));
    }
    setCompletedConditions(prev => ({ ...prev, [data.difficulty]: true }));
  };

  const numCompleted = Object.keys(completedConditions).length;

  return (
    <div>
      <ConnectDotsTask onComplete={handleComplete} />
      {numCompleted > 0 && (
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          background: '#F0EDE8',
          border: '1px solid #EBE8E3',
          borderRadius: 8,
          fontSize: 14,
          color: '#5C5852',
        }}>
          <div style={{ display: 'flex', gap: 20, marginBottom: numCompleted < 2 ? 8 : 0 }}>
            <span>
              <strong>Numbers:</strong>{' '}
              {completedConditions.numbers
                ? <span style={{ color: '#9C4430', fontWeight: 600 }}>Complete</span>
                : <span style={{ color: '#A8A39C' }}>Not yet</span>}
            </span>
            <span>
              <strong>Alternating:</strong>{' '}
              {completedConditions.alternating
                ? <span style={{ color: '#9C4430', fontWeight: 600 }}>Complete</span>
                : <span style={{ color: '#A8A39C' }}>Not yet</span>}
            </span>
          </div>
          {numCompleted === 1 && (
            <p style={{ margin: 0, fontStyle: 'italic' }}>
              Switch the difficulty toggle and complete the task again to compare your kinematics across conditions.
            </p>
          )}
          {numCompleted === 2 && (
            <p style={{ margin: 0, fontWeight: 500, color: '#9C4430' }}>
              Both conditions recorded. Scroll down to see your full analysis.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ThesisConnectDots;
