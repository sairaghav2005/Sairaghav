import React from 'react';
import clsx from 'clsx';

export default function ConfusionMatrix({ matrix, labels }) {
  if (!matrix || !matrix.length) return <div className="glass-panel p-4 text-slate-400">No data</div>;

  const maxVal = Math.max(...matrix.flat());

  return (
    <div className="glass-panel p-6 overflow-x-auto">
      <h3 className="text-slate-200 font-semibold mb-4 text-center">Confusion Matrix</h3>
      <div className="flex flex-col items-center">
        <div className="flex">
          <div className="flex flex-col justify-end pr-2 text-slate-400 text-xs font-medium w-16 text-right">
            Actual
          </div>
          <div>
            <div className="flex text-slate-400 text-xs font-medium pb-2 text-center ml-1">
              Predicted
            </div>
            <div className="flex">
              {labels.map((l, i) => (
                <div key={i} className="w-12 text-center text-xs text-slate-400 rotate-45 transform origin-bottom-left pb-1">
                  {l}
                </div>
              ))}
            </div>
            
            <div className="flex flex-col">
              {matrix.map((row, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-16 text-right pr-2 text-xs text-slate-400">{labels[i]}</div>
                  {row.map((val, j) => (
                    <div
                      key={j}
                      className={clsx(
                        "w-12 h-12 m-[1px] flex items-center justify-center text-xs font-medium transition-colors cursor-default",
                        val === 0 ? "bg-slate-800 text-slate-500" : "text-slate-900"
                      )}
                      style={{ 
                        backgroundColor: val > 0 ? `rgba(34, 211, 238, ${Math.max(0.1, val / maxVal)})` : undefined,
                        color: val > 0 && (val/maxVal) > 0.5 ? '#0f172a' : '#e2e8f0'
                      }}
                      title={`Actual: ${labels[i]}, Predicted: ${labels[j]}\nCount: ${val}`}
                    >
                      {val}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
