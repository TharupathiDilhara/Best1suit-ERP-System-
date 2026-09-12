import React, { useState, useEffect } from 'react';
import { COMMON_FRACTIONS, formatFractionalInches, parseFractionalInches, splitToWholeAndFraction } from '../utils/fractionUtils';
import { ChevronUp, ChevronDown, Plus, Minus } from 'lucide-react';

interface FractionalInputProps {
  label: string;
  field: string;
  value: number;
  onChange: (newValue: number) => void;
  onFocus: () => void;
  onBlur: () => void;
  isFocused: boolean;
  sublabel?: string;
}

export default function FractionalInput({
  label,
  field,
  value,
  onChange,
  onFocus,
  onBlur,
  isFocused,
  sublabel,
}: FractionalInputProps) {
  const { whole, fractionIndex } = splitToWholeAndFraction(value);

  // Local text input state for flexible typing (e.g. typing "19 1/2" or "19.5" or "19")
  const [textValue, setTextValue] = useState<string>(
    value ? formatFractionalInches(value, { showUnit: false, useUnicode: false }) : ''
  );

  // Synchronize when value changes externally (e.g. switching garments)
  useEffect(() => {
    setTextValue(value ? formatFractionalInches(value, { showUnit: false, useUnicode: false }) : '');
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTextValue(raw);
    const parsed = parseFractionalInches(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleTextBlur = () => {
    const parsed = parseFractionalInches(textValue);
    onChange(parsed);
    setTextValue(parsed ? formatFractionalInches(parsed, { showUnit: false, useUnicode: false }) : '');
    onBlur();
  };

  const handleSelectFraction = (fractionVal: number) => {
    const newTotal = whole + fractionVal;
    onChange(newTotal);
    setTextValue(newTotal ? formatFractionalInches(newTotal, { showUnit: false, useUnicode: false }) : '');
  };

  const adjustByEighth = (increment: boolean) => {
    const delta = increment ? 0.125 : -0.125;
    const newTotal = Math.max(0, Math.round((value + delta) * 8) / 8);
    onChange(newTotal);
    setTextValue(newTotal ? formatFractionalInches(newTotal, { showUnit: false, useUnicode: false }) : '');
  };

  return (
    <div
      className={`p-3 rounded-xl border transition-all duration-200 bg-white ${
        isFocused
          ? 'border-indigo-500 ring-2 ring-indigo-500/15 shadow-sm'
          : 'border-slate-200 hover:border-slate-300'
      }`}
      id={`input-group-${field}`}
    >
      {/* Header: Label + Fractional Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0">
          <label
            htmlFor={`input-${field}`}
            className={`block text-xs font-semibold truncate transition-colors ${
              isFocused ? 'text-indigo-600' : 'text-slate-700'
            }`}
          >
            {label}
          </label>
          {sublabel && <p className="text-[10px] text-slate-400 truncate">{sublabel}</p>}
        </div>

        {/* Live Bespoke Fractional Imperial Badge */}
        <div className="shrink-0 flex items-center gap-1 bg-indigo-50/80 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-mono text-xs font-bold shadow-2xs">
          <span>{formatFractionalInches(value)}</span>
        </div>
      </div>

      {/* Input controls row */}
      <div className="flex items-center gap-1.5">
        {/* Quick Stepper: Minus 1/8" */}
        <button
          type="button"
          onClick={() => adjustByEighth(false)}
          title="Decrease by ⅛ inch"
          className="h-9 w-7 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors text-xs cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Text Field for direct imperial or whole inch entry */}
        <div className="relative flex-1">
          <input
            id={`input-${field}`}
            type="text"
            placeholder="e.g. 16 1/2 or 16.5"
            value={textValue}
            onChange={handleTextChange}
            onFocus={onFocus}
            onBlur={handleTextBlur}
            className="w-full h-9 px-3 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-lg font-mono text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all text-center"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-medium text-slate-400 pointer-events-none">
            in
          </span>
        </div>

        {/* Quick Stepper: Plus 1/8" */}
        <button
          type="button"
          onClick={() => adjustByEighth(true)}
          title="Increase by ⅛ inch"
          className="h-9 w-7 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors text-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Fractional Selector Pills: 0, ⅛, ¼, ⅜, ½, ⅝, ¾, ⅞ */}
      <div className="mt-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[9px] font-mono uppercase text-slate-400 font-semibold shrink-0">Frac:</span>
          <div className="grid grid-cols-8 gap-0.5 flex-1">
            {COMMON_FRACTIONS.map((frac, idx) => {
              const isSelected = fractionIndex === idx;
              return (
                <button
                  key={frac.label}
                  type="button"
                  onClick={() => handleSelectFraction(frac.value)}
                  title={frac.description}
                  className={`h-6 text-[11px] font-mono rounded transition-all cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100/70 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {frac.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
