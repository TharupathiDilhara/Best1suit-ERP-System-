import React, { useState } from 'react';
import { ShirtMeasurements, PantsMeasurements, CoatMeasurements, MeasurementType, MeasurementRecord } from '../types';
import { Save, RefreshCw, X, ShieldCheck, Ruler } from 'lucide-react';
import FractionalInput from './FractionalInput';
import { formatFractionalInches } from '../utils/fractionUtils';

interface MeasurementFormProps {
  customerId: string;
  customerName: string;
  onSave: (record: Omit<MeasurementRecord, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export default function MeasurementForm({ customerId, customerName, onSave, onCancel }: MeasurementFormProps) {
  const [garmentType, setGarmentType] = useState<MeasurementType>('shirt');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initial States with fractional imperial values
  const [shirt, setShirt] = useState<ShirtMeasurements>({
    collar: 15.5,
    chest: 40.0,
    waist: 36.0,
    sleeveLength: 25.0,
    shoulderWidth: 18.0,
    shirtLength: 30.0,
    cuff: 9.5,
    armhole: 19.5,
    bicep: 15.25
  });

  const [pants, setPants] = useState<PantsMeasurements>({
    waist: 34.0,
    hip: 40.0,
    crotchDepth: 10.5,
    inseam: 31.0,
    outseam: 41.0,
    thigh: 24.0,
    knee: 18.0,
    bottomOpening: 15.0
  });

  const [coat, setCoat] = useState<CoatMeasurements>({
    chest: 42.0,
    waist: 38.0,
    shoulderWidth: 19.0,
    sleeveLength: 26.0,
    coatLength: 31.0,
    neck: 16.5,
    backWidth: 18.5,
    armhole: 21.0,
    bicep: 16.5
  });

  const handleValueChange = (field: string, numVal: number) => {
    if (garmentType === 'shirt') {
      setShirt(prev => ({ ...prev, [field]: numVal }));
    } else if (garmentType === 'pants') {
      setPants(prev => ({ ...prev, [field]: numVal }));
    } else {
      setCoat(prev => ({ ...prev, [field]: numVal }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const values = garmentType === 'shirt' ? shirt : garmentType === 'pants' ? pants : coat;
      await onSave({
        customerId,
        date: today,
        type: garmentType,
        notes,
        values
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper descriptions for each measurement field
  const getFieldDescription = (field: string | null) => {
    if (!field) return "Hover or select any measurement field to view anatomical tape track.";
    switch (field) {
      case 'armhole':
        return "Armhole Circumference (Armscye): Pass tape over top of shoulder, around armpit crease, and back to shoulder with arm relaxed.";
      case 'bicep':
        return "Bicep Circumference: Measure horizontally around the fullest circumference of the upper arm with muscle relaxed.";
      case 'collar':
      case 'neck':
        return "Neck / Collar: Measure around base of neck where collar band rests, allowing two fingers for comfort.";
      case 'chest':
        return "Chest: Measure around fullest part of chest and across shoulder blades, keeping tape parallel to the floor.";
      case 'waist':
        return "Waist: Measure around natural waistline or trouser waistband level with comfortable upright posture.";
      case 'sleeveLength':
        return "Sleeve Length: Measure from shoulder seam tip down over relaxed elbow to the wrist bone.";
      case 'shoulderWidth':
        return "Shoulder Width: Measure horizontally across upper back from left shoulder edge to right shoulder edge.";
      case 'shirtLength':
        return "Shirt Length: Measure straight down back from base of collar seam to desired shirt tail hem.";
      case 'coatLength':
        return "Coat Length: Measure straight down back from collar seam to bottom blazer hem.";
      case 'cuff':
        return "Cuff / Wrist: Measure wrist circumference plus 1 to 1.5 inch ease for watch.";
      case 'backWidth':
        return "Back Width: Measure horizontally across back between rear armhole crease seams.";
      case 'crotchDepth':
        return "Crotch Depth / Rise: Measure vertically from the waistband level down to the crotch fork seam (or while seated erect on a firm flat chair, measure from waist to chair surface).";
      case 'inseam':
        return "Inseam: Measure from inner crotch along leg seam down to top of shoe heel.";
      case 'outseam':
        return "Outseam: Measure from top of waistband down the outside leg seam to shoe sole.";
      case 'thigh':
        return "Thigh: Measure circumference around fullest part of upper thigh 1 inch below crotch.";
      case 'knee':
        return "Knee: Measure circumference around knee joint with leg slightly bent.";
      case 'bottomOpening':
        return "Bottom Opening: Measure total circumference around trouser ankle hem.";
      default:
        return "Fractional imperial system: Record in whole inches + ⅛, ¼, ⅜, ½, ⅝, ¾, ⅞.";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden" id="measurement-form-card">
      
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-mono text-indigo-400 font-semibold">Bespoke Fitting Log</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
              Fractional Imperial (Inches)
            </span>
          </div>
          <h2 className="text-xl font-serif font-semibold mt-1">
            Measure Client: {customerName}
          </h2>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 md:p-8">
        {/* Garment Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {(['shirt', 'pants', 'coat'] as MeasurementType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setGarmentType(type);
                setFocusedField(null);
              }}
              className={`py-3 rounded-lg text-xs font-semibold capitalize font-mono transition-all cursor-pointer ${
                garmentType === type 
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {type === 'pants' ? '👖 Trousers / Pants' : type === 'shirt' ? '👔 Office Shirt' : '🧥 Wedding Coat'}
            </button>
          ))}
        </div>

        {/* Imperial Fraction Quick Note */}
        <div className="mb-6 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Fractional Imperial System:</strong> Tap any fraction pill (<span className="font-mono font-bold">⅛, ¼, ⅜, ½, ⅝, ¾, ⅞</span>), step with <span className="font-mono font-bold">+/-</span>, or type directly (e.g. <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">16 1/2</span> or <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">16.5</span>).
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Side */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
            
            <div className="bg-slate-50/50 p-5 sm:p-6 rounded-2xl border border-slate-200/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 font-mono">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                  {garmentType === 'shirt' ? 'Shirt Fit Specifications' : garmentType === 'pants' ? 'Trousers Fit Specifications' : 'Wedding Coat Specifications'}
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  {garmentType === 'shirt' || garmentType === 'coat' ? '9 measurements' : '7 measurements'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {garmentType === 'shirt' && (
                  <>
                    <FractionalInput
                      label="Collar / Neck circumference"
                      sublabel="Base of neck"
                      field="collar"
                      value={shirt.collar}
                      onChange={(v) => handleValueChange('collar', v)}
                      onFocus={() => setFocusedField('collar')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'collar'}
                    />
                    <FractionalInput
                      label="Chest circumference"
                      sublabel="Fullest bust/chest"
                      field="chest"
                      value={shirt.chest}
                      onChange={(v) => handleValueChange('chest', v)}
                      onFocus={() => setFocusedField('chest')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'chest'}
                    />
                    <FractionalInput
                      label="Waist line"
                      sublabel="Natural waist"
                      field="waist"
                      value={shirt.waist}
                      onChange={(v) => handleValueChange('waist', v)}
                      onFocus={() => setFocusedField('waist')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'waist'}
                    />
                    <FractionalInput
                      label="Armhole circumference"
                      sublabel="Armscye seam loop"
                      field="armhole"
                      value={shirt.armhole || 19.5}
                      onChange={(v) => handleValueChange('armhole', v)}
                      onFocus={() => setFocusedField('armhole')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'armhole'}
                    />
                    <FractionalInput
                      label="Bicep circumference"
                      sublabel="Fullest upper arm"
                      field="bicep"
                      value={shirt.bicep || 15.25}
                      onChange={(v) => handleValueChange('bicep', v)}
                      onFocus={() => setFocusedField('bicep')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'bicep'}
                    />
                    <FractionalInput
                      label="Sleeve length"
                      sublabel="Shoulder tip to cuff"
                      field="sleeveLength"
                      value={shirt.sleeveLength}
                      onChange={(v) => handleValueChange('sleeveLength', v)}
                      onFocus={() => setFocusedField('sleeveLength')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'sleeveLength'}
                    />
                    <FractionalInput
                      label="Shoulder width"
                      sublabel="Seam-to-seam across back"
                      field="shoulderWidth"
                      value={shirt.shoulderWidth}
                      onChange={(v) => handleValueChange('shoulderWidth', v)}
                      onFocus={() => setFocusedField('shoulderWidth')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'shoulderWidth'}
                    />
                    <FractionalInput
                      label="Full shirt length"
                      sublabel="Base of collar to hem"
                      field="shirtLength"
                      value={shirt.shirtLength}
                      onChange={(v) => handleValueChange('shirtLength', v)}
                      onFocus={() => setFocusedField('shirtLength')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'shirtLength'}
                    />
                    <FractionalInput
                      label="Cuff / Wrist size"
                      sublabel="Wrist with watch ease"
                      field="cuff"
                      value={shirt.cuff}
                      onChange={(v) => handleValueChange('cuff', v)}
                      onFocus={() => setFocusedField('cuff')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'cuff'}
                    />
                  </>
                )}

                {garmentType === 'pants' && (
                  <>
                    <FractionalInput
                      label="Waist size"
                      sublabel="Trouser waistband"
                      field="waist"
                      value={pants.waist}
                      onChange={(v) => handleValueChange('waist', v)}
                      onFocus={() => setFocusedField('waist')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'waist'}
                    />
                    <FractionalInput
                      label="Hip size"
                      sublabel="Widest seat"
                      field="hip"
                      value={pants.hip}
                      onChange={(v) => handleValueChange('hip', v)}
                      onFocus={() => setFocusedField('hip')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'hip'}
                    />
                    <FractionalInput
                      label="Crotch depth / Rise"
                      sublabel="Waistband to crotch fork seam"
                      field="crotchDepth"
                      value={pants.crotchDepth || 10.5}
                      onChange={(v) => handleValueChange('crotchDepth', v)}
                      onFocus={() => setFocusedField('crotchDepth')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'crotchDepth'}
                    />
                    <FractionalInput
                      label="Inseam"
                      sublabel="Crotch to bottom hem"
                      field="inseam"
                      value={pants.inseam}
                      onChange={(v) => handleValueChange('inseam', v)}
                      onFocus={() => setFocusedField('inseam')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'inseam'}
                    />
                    <FractionalInput
                      label="Outseam"
                      sublabel="Waistband down to shoe"
                      field="outseam"
                      value={pants.outseam}
                      onChange={(v) => handleValueChange('outseam', v)}
                      onFocus={() => setFocusedField('outseam')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'outseam'}
                    />
                    <FractionalInput
                      label="Thigh circumference"
                      sublabel="Widest upper leg"
                      field="thigh"
                      value={pants.thigh}
                      onChange={(v) => handleValueChange('thigh', v)}
                      onFocus={() => setFocusedField('thigh')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'thigh'}
                    />
                    <FractionalInput
                      label="Knee width"
                      sublabel="Around knee"
                      field="knee"
                      value={pants.knee}
                      onChange={(v) => handleValueChange('knee', v)}
                      onFocus={() => setFocusedField('knee')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'knee'}
                    />
                    <FractionalInput
                      label="Bottom opening / Ankle"
                      sublabel="Hem circumference"
                      field="bottomOpening"
                      value={pants.bottomOpening}
                      onChange={(v) => handleValueChange('bottomOpening', v)}
                      onFocus={() => setFocusedField('bottomOpening')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'bottomOpening'}
                    />
                  </>
                )}

                {garmentType === 'coat' && (
                  <>
                    <FractionalInput
                      label="Chest size"
                      sublabel="Jacket chest circumference"
                      field="chest"
                      value={coat.chest}
                      onChange={(v) => handleValueChange('chest', v)}
                      onFocus={() => setFocusedField('chest')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'chest'}
                    />
                    <FractionalInput
                      label="Waist line"
                      sublabel="Mid-button suppression"
                      field="waist"
                      value={coat.waist}
                      onChange={(v) => handleValueChange('waist', v)}
                      onFocus={() => setFocusedField('waist')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'waist'}
                    />
                    <FractionalInput
                      label="Armhole circumference"
                      sublabel="Coat armscye seam"
                      field="armhole"
                      value={coat.armhole || 21.0}
                      onChange={(v) => handleValueChange('armhole', v)}
                      onFocus={() => setFocusedField('armhole')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'armhole'}
                    />
                    <FractionalInput
                      label="Bicep circumference"
                      sublabel="Upper sleeve fullness"
                      field="bicep"
                      value={coat.bicep || 16.5}
                      onChange={(v) => handleValueChange('bicep', v)}
                      onFocus={() => setFocusedField('bicep')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'bicep'}
                    />
                    <FractionalInput
                      label="Shoulder width"
                      sublabel="Pad-to-pad seam across back"
                      field="shoulderWidth"
                      value={coat.shoulderWidth}
                      onChange={(v) => handleValueChange('shoulderWidth', v)}
                      onFocus={() => setFocusedField('shoulderWidth')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'shoulderWidth'}
                    />
                    <FractionalInput
                      label="Sleeve length"
                      sublabel="Shoulder point to cuff"
                      field="sleeveLength"
                      value={coat.sleeveLength}
                      onChange={(v) => handleValueChange('sleeveLength', v)}
                      onFocus={() => setFocusedField('sleeveLength')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'sleeveLength'}
                    />
                    <FractionalInput
                      label="Coat / Jacket length"
                      sublabel="Back collar to jacket hem"
                      field="coatLength"
                      value={coat.coatLength}
                      onChange={(v) => handleValueChange('coatLength', v)}
                      onFocus={() => setFocusedField('coatLength')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'coatLength'}
                    />
                    <FractionalInput
                      label="Collar / Neck"
                      sublabel="Jacket neckline"
                      field="neck"
                      value={coat.neck}
                      onChange={(v) => handleValueChange('neck', v)}
                      onFocus={() => setFocusedField('neck')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'neck'}
                    />
                    <FractionalInput
                      label="Back Width"
                      sublabel="Between rear armhole creases"
                      field="backWidth"
                      value={coat.backWidth}
                      onChange={(v) => handleValueChange('backWidth', v)}
                      onFocus={() => setFocusedField('backWidth')}
                      onBlur={() => {}}
                      isFocused={focusedField === 'backWidth'}
                    />
                  </>
                )}
              </div>
            </div>

            {/* General Notes for tailoring */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Special tailoring notes (e.g. armhole ease, bicep allowance, posture adjustments)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Examples: 'High armhole for extra mobility', 'Add +½&quot; bicep ease on right arm', 'Fitted silhouette with classic collar'..."
                className="w-full px-4 py-3 border border-slate-200 hover:border-slate-300 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all h-24"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-sm font-medium transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2 shadow-sm shadow-indigo-600/10 hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Measurement
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Interactive SVG Diagram Side */}
          <div className="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
            <div className="absolute top-4 left-4 font-mono text-[10px] text-slate-400 font-semibold tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> BESPOKE ANATOMICAL GUIDE
            </div>

            {/* Shirt SVG guide */}
            {garmentType === 'shirt' && (
              <div className="w-full flex flex-col items-center">
                <svg className="w-52 h-72 text-slate-300" viewBox="0 0 100 130" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {/* Body outline */}
                  <path d="M 25,12 L 35,10 L 40,20 L 60,20 L 65,10 L 75,12 L 80,45 L 72,48 L 73,115 L 27,115 L 28,48 L 20,45 Z" fill="#fcfbf7" stroke="#cbd5e1" strokeWidth="1" />
                  
                  {/* Placket */}
                  <line x1="50" y1="20" x2="50" y2="115" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="2 2" />

                  {/* Collar Guide */}
                  <ellipse 
                    cx="50" cy="20" rx="10" ry="4" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'collar' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'collar' ? '3' : '1.5'} 
                    fill={focusedField === 'collar' ? '#e0e7ff' : 'none'}
                  />

                  {/* Shoulder Guide */}
                  <line 
                    x1="35" y1="10" x2="65" y2="10" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'shoulderWidth' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'shoulderWidth' ? '3' : '1.5'} 
                  />
                  {focusedField === 'shoulderWidth' && <circle cx="50" cy="10" r="2.5" fill="#4f46e5" />}

                  {/* Chest Guide */}
                  <line 
                    x1="29" y1="40" x2="71" y2="40" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'chest' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'chest' ? '3' : '1.5'} 
                  />

                  {/* Armhole Seam Guides (Left & Right) */}
                  <path 
                    d="M 25,12 C 30,22 32,36 28,48" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'armhole' ? '#4f46e5' : '#94a3b8'} 
                    strokeWidth={focusedField === 'armhole' ? '3.5' : '1.2'} 
                    strokeDasharray={focusedField === 'armhole' ? 'none' : '2 2'}
                  />
                  <path 
                    d="M 75,12 C 70,22 68,36 72,48" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'armhole' ? '#4f46e5' : '#94a3b8'} 
                    strokeWidth={focusedField === 'armhole' ? '3.5' : '1.2'} 
                    strokeDasharray={focusedField === 'armhole' ? 'none' : '2 2'}
                  />
                  {focusedField === 'armhole' && (
                    <>
                      <circle cx="28" cy="48" r="2.5" fill="#4f46e5" />
                      <circle cx="25" cy="12" r="2.5" fill="#4f46e5" />
                      <circle cx="72" cy="48" r="2.5" fill="#4f46e5" />
                      <circle cx="75" cy="12" r="2.5" fill="#4f46e5" />
                    </>
                  )}

                  {/* Bicep Circumference Tape Lines */}
                  <line 
                    x1="22" y1="30" x2="31" y2="27" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'bicep' ? '#4f46e5' : '#94a3b8'} 
                    strokeWidth={focusedField === 'bicep' ? '3.5' : '1.2'} 
                    strokeDasharray={focusedField === 'bicep' ? 'none' : '2 2'}
                  />
                  <line 
                    x1="78" y1="30" x2="69" y2="27" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'bicep' ? '#4f46e5' : '#94a3b8'} 
                    strokeWidth={focusedField === 'bicep' ? '3.5' : '1.2'} 
                    strokeDasharray={focusedField === 'bicep' ? 'none' : '2 2'}
                  />
                  {focusedField === 'bicep' && (
                    <>
                      <circle cx="22" cy="30" r="2" fill="#4f46e5" />
                      <circle cx="31" cy="27" r="2" fill="#4f46e5" />
                    </>
                  )}

                  {/* Waist Guide */}
                  <line 
                    x1="30" y1="75" x2="70" y2="75" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'waist' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'waist' ? '3' : '1.5'} 
                  />

                  {/* Sleeve Length Guide */}
                  <path 
                    d="M 35,10 L 22,25 L 20,45" 
                    className="transition-all duration-300"
                    fill="none"
                    stroke={focusedField === 'sleeveLength' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'sleeveLength' ? '3' : '1.5'} 
                  />

                  {/* Shirt Length Guide */}
                  <line 
                    x1="45" y1="15" x2="45" y2="115" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'shirtLength' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'shirtLength' ? '3' : '1.5'} 
                    strokeDasharray="3 2"
                  />

                  {/* Cuff Guide */}
                  <line 
                    x1="18" y1="45" x2="23" y2="45" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'cuff' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'cuff' ? '3' : '1.5'} 
                  />
                </svg>
                <div className="mt-4 text-center max-w-[280px]">
                  <h4 className="text-xs font-semibold text-slate-800 capitalize font-mono">
                    {focusedField ? `Active Spec: ${focusedField}` : "Select a field to preview tape track"}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {getFieldDescription(focusedField)}
                  </p>
                </div>
              </div>
            )}

            {/* Pants SVG guide */}
            {garmentType === 'pants' && (
              <div className="w-full flex flex-col items-center">
                <svg className="w-52 h-72 text-slate-300" viewBox="0 0 100 130" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {/* Trousers block */}
                  <path d="M 32,15 L 68,15 L 70,35 L 62,118 L 52,118 L 50,45 L 48,118 L 38,118 L 30,35 Z" fill="#fcfbf7" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Waist Line */}
                  <line 
                    x1="32" y1="15" x2="68" y2="15" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'waist' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'waist' ? '3' : '1.5'} 
                  />

                  {/* Hip Line */}
                  <line 
                    x1="30" y1="35" x2="70" y2="35" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'hip' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'hip' ? '3' : '1.5'} 
                  />

                  {/* Crotch Depth / Rise Line */}
                  <line 
                    x1="50" y1="15" x2="50" y2="45" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'crotchDepth' ? '#4f46e5' : '#94a3b8'} 
                    strokeWidth={focusedField === 'crotchDepth' ? '3.5' : '1.2'} 
                    strokeDasharray={focusedField === 'crotchDepth' ? 'none' : '2 2'}
                  />
                  {focusedField === 'crotchDepth' && (
                    <>
                      <circle cx="50" cy="15" r="2.5" fill="#4f46e5" />
                      <circle cx="50" cy="45" r="2.5" fill="#4f46e5" />
                    </>
                  )}

                  {/* Outseam Line */}
                  <path 
                    d="M 68,15 L 70,35 L 62,118" 
                    className="transition-all duration-300"
                    fill="none"
                    stroke={focusedField === 'outseam' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'outseam' ? '3' : '1.5'} 
                  />

                  {/* Inseam Line */}
                  <line 
                    x1="50" y1="45" x2="42" y2="118" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'inseam' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'inseam' ? '3' : '1.5'} 
                  />

                  {/* Thigh Line */}
                  <line 
                    x1="31.5" y1="52" x2="49.5" y2="52" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'thigh' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'thigh' ? '3' : '1.5'} 
                  />

                  {/* Knee Line */}
                  <line 
                    x1="34" y1="80" x2="48.5" y2="80" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'knee' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'knee' ? '3' : '1.5'} 
                  />

                  {/* Bottom Opening Line */}
                  <line 
                    x1="38" y1="118" x2="48" y2="118" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'bottomOpening' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'bottomOpening' ? '3' : '1.5'} 
                  />
                </svg>
                <div className="mt-4 text-center max-w-[280px]">
                  <h4 className="text-xs font-semibold text-slate-800 capitalize font-mono">
                    {focusedField ? `Active Spec: ${focusedField}` : "Select a field to preview tape track"}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {getFieldDescription(focusedField)}
                  </p>
                </div>
              </div>
            )}

            {/* Coat SVG guide */}
            {garmentType === 'coat' && (
              <div className="w-full flex flex-col items-center">
                <svg className="w-52 h-72 text-slate-300" viewBox="0 0 100 130" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {/* Suit Coat silhouette */}
                  <path d="M 23,12 L 34,10 L 42,22 L 58,22 L 66,10 L 77,12 L 82,45 L 75,48 L 74,110 L 26,110 L 25,48 L 18,45 Z" fill="#fcfbf7" stroke="#cbd5e1" strokeWidth="1" />
                  
                  {/* Lapels */}
                  <path d="M 34,10 L 44,45 L 50,45 L 56,45 L 66,10" stroke="#cbd5e1" strokeWidth="1.5" />
                  <line x1="50" y1="45" x2="50" y2="110" stroke="#e2e8f0" strokeWidth="1" />

                  {/* Shoulder Width */}
                  <line 
                    x1="34" y1="10" x2="66" y2="10" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'shoulderWidth' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'shoulderWidth' ? '3' : '1.5'} 
                  />

                  {/* Collar / Neck */}
                  <ellipse 
                    cx="50" cy="21" rx="8" ry="3.5" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'neck' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'neck' ? '3' : '1.5'} 
                  />

                  {/* Chest */}
                  <line 
                    x1="26" y1="42" x2="74" y2="42" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'chest' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'chest' ? '3' : '1.5'} 
                  />

                  {/* Armhole Seam Guide (Coat) */}
                  <path 
                    d="M 23,12 C 28,22 30,36 25,48" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'armhole' ? '#4f46e5' : '#94a3b8'} 
                    strokeWidth={focusedField === 'armhole' ? '3.5' : '1.2'} 
                    strokeDasharray={focusedField === 'armhole' ? 'none' : '2 2'}
                  />
                  <path 
                    d="M 77,12 C 72,22 70,36 75,48" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'armhole' ? '#4f46e5' : '#94a3b8'} 
                    strokeWidth={focusedField === 'armhole' ? '3.5' : '1.2'} 
                    strokeDasharray={focusedField === 'armhole' ? 'none' : '2 2'}
                  />
                  {focusedField === 'armhole' && (
                    <>
                      <circle cx="25" cy="48" r="2.5" fill="#4f46e5" />
                      <circle cx="23" cy="12" r="2.5" fill="#4f46e5" />
                      <circle cx="75" cy="48" r="2.5" fill="#4f46e5" />
                      <circle cx="77" cy="12" r="2.5" fill="#4f46e5" />
                    </>
                  )}

                  {/* Bicep Circumference Guide (Coat) */}
                  <line 
                    x1="20.5" y1="29" x2="29.5" y2="26" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'bicep' ? '#4f46e5' : '#94a3b8'} 
                    strokeWidth={focusedField === 'bicep' ? '3.5' : '1.2'} 
                    strokeDasharray={focusedField === 'bicep' ? 'none' : '2 2'}
                  />
                  <line 
                    x1="79.5" y1="29" x2="70.5" y2="26" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'bicep' ? '#4f46e5' : '#94a3b8'} 
                    strokeWidth={focusedField === 'bicep' ? '3.5' : '1.2'} 
                    strokeDasharray={focusedField === 'bicep' ? 'none' : '2 2'}
                  />
                  {focusedField === 'bicep' && (
                    <>
                      <circle cx="20.5" cy="29" r="2" fill="#4f46e5" />
                      <circle cx="29.5" cy="26" r="2" fill="#4f46e5" />
                    </>
                  )}

                  {/* Waist */}
                  <line 
                    x1="27" y1="72" x2="73" y2="72" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'waist' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'waist' ? '3' : '1.5'} 
                  />

                  {/* Sleeve length */}
                  <path 
                    d="M 34,10 L 21,26 L 19,45" 
                    className="transition-all duration-300"
                    fill="none"
                    stroke={focusedField === 'sleeveLength' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'sleeveLength' ? '3' : '1.5'} 
                  />

                  {/* Coat length */}
                  <line 
                    x1="46" y1="12" x2="46" y2="110" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'coatLength' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'coatLength' ? '3' : '1.5'} 
                    strokeDasharray="3 2"
                  />

                  {/* Back Width (drawn as horizontal dashed on shoulders) */}
                  <line 
                    x1="32" y1="28" x2="68" y2="28" 
                    className="transition-all duration-300"
                    stroke={focusedField === 'backWidth' ? '#4f46e5' : '#cbd5e1'} 
                    strokeWidth={focusedField === 'backWidth' ? '3' : '1.5'} 
                    strokeDasharray="2 1"
                  />
                </svg>
                <div className="mt-4 text-center max-w-[280px]">
                  <h4 className="text-xs font-semibold text-slate-800 capitalize font-mono">
                    {focusedField ? `Active Spec: ${focusedField}` : "Select a field to preview tape track"}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {getFieldDescription(focusedField)}
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
