import React from 'react';
import { cn } from '../lib/utils';

interface ToothSelectorProps {
  selectedTeeth: number[];
  onToggle: (teeth: number[]) => void;
}

const SUPERIOR_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const SUPERIOR_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const INFERIOR_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
const INFERIOR_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

export default function ToothSelector({ selectedTeeth, onToggle }: ToothSelectorProps) {
  const toggleTooth = (tooth: number) => {
    if (selectedTeeth.includes(tooth)) {
      onToggle(selectedTeeth.filter(t => t !== tooth));
    } else {
      onToggle([...selectedTeeth, tooth]);
    }
  };

  const renderTooth = (num: number) => {
    const isSelected = selectedTeeth.includes(num);
    return (
      <button
        key={num}
        onClick={(e) => {
          e.preventDefault();
          toggleTooth(num);
        }}
        className={cn(
          "w-8 h-10 border rounded-md flex flex-col items-center justify-center transition-all",
          isSelected 
            ? "bg-brand-accent text-white border-brand-accent shadow-lg scale-110 z-10" 
            : "bg-white text-neutral-400 border-neutral-100 hover:border-brand-accent hover:text-brand-accent"
        )}
      >
        <span className="text-[10px] font-black">{num}</span>
        <div className={cn(
          "w-3 h-4 mt-1 rounded-sm border-2",
          isSelected ? "border-white/50 bg-white/20" : "border-neutral-100 bg-neutral-50"
        )} />
      </button>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-brand-beige/20 rounded-[1.5rem] md:rounded-[2rem] border border-brand-beige w-full overflow-hidden">
      <div className="space-y-8 overflow-x-auto pb-4 no-scrollbar">
        <div className="min-w-[500px]">
          {/* Superior */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Arcada Superior</p>
            <div className="flex gap-1 justify-center">
              <div className="flex gap-1 border-r border-brand-beige pr-2">
                {SUPERIOR_RIGHT.map(renderTooth)}
              </div>
              <div className="flex gap-1 pl-2">
                {SUPERIOR_LEFT.map(renderTooth)}
              </div>
            </div>
          </div>

          {/* Inferior */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1 justify-center">
              <div className="flex gap-1 border-r border-brand-beige pr-2">
                {INFERIOR_RIGHT.reverse().map(renderTooth)}
              </div>
              <div className="flex gap-1 pl-2">
                {INFERIOR_LEFT.map(renderTooth)}
              </div>
            </div>
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mt-2">Arcada Inferior</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-center gap-4">
        <button 
          onClick={(e) => { e.preventDefault(); onToggle([]); }}
          className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-brand-accent transition-colors"
        >
          Limpar Seleção
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); onToggle([...SUPERIOR_RIGHT, ...SUPERIOR_LEFT]); }}
          className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-brand-accent transition-colors"
        >
          Todos Superior
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); onToggle([...INFERIOR_RIGHT, ...INFERIOR_LEFT]); }}
          className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-brand-accent transition-colors"
        >
          Todos Inferior
        </button>
      </div>
    </div>
  );
}
