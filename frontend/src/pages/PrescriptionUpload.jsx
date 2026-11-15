import React, { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Sparkles,
  ShieldCheck,
  Eye,
  ArrowRight,
  Clock,
  Info
} from 'lucide-react';

export default function PrescriptionUpload() {
  const { elderlyId } = useAuth();
  const { language } = useAccessibility();
  const isBn = language === 'bn';

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  // Review states
  const [reviewMeds, setReviewMeds] = useState([]);
  const [reviewing, setReviewing] = useState(false);
  const [reviewDoneMessage, setReviewDoneMessage] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setUploadResult(null);
      setError(null);
      setReviewDoneMessage(null);
    }
  };

  const handleUploadAndExtract = async () => {
    if (!file) {
      alert("Please select an image file first");
      return;
    }

    setUploading(true);
    setError(null);
    setReviewDoneMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    if (elderlyId) formData.append('elderly_id', elderlyId);

    try {
      const data = await api.uploadPrescription(formData);
      setUploadResult(data);
      // Initialize review candidates
      const candidates = (data.extracted_medications || []).map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        instructions: m.instructions || '',
        prescribing_doctor: m.prescribing_doctor || '',
        scheduled_times: m.suggested_times || ['09:00'],
        confirmed: true, // Default to confirmed check, human can uncheck or edit
        is_uncertain: m.is_uncertain,
        uncertainty_reason: m.uncertainty_reason
      }));
      setReviewMeds(candidates);
    } catch (err) {
      setError(err.message || "Failed to process prescription");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmReview = async (decision) => {
    if (!uploadResult) return;
    setReviewing(true);
    try {
      const res = await api.reviewPrescription(uploadResult.id, {
        confirmed_medications: reviewMeds,
        decision: decision,
        notes: "Reviewed by authorized patient/caregiver"
      });
      setReviewDoneMessage(res.message);
      setUploadResult(prev => ({ ...prev, status: decision }));
    } catch (err) {
      alert(err.message || "Failed to submit review");
    } finally {
      setReviewing(false);
    }
  };

  const updateMedField = (index, field, value) => {
    setReviewMeds(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {isBn ? 'এআই প্রেসক্রিপশন রিডার' : 'AI Prescription Reader'}
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          {isBn
            ? 'প্রেসক্রিপশন আপলোড করে ওসিআর ও এআই প্রযুক্তির মাধ্যমে স্বয়ংক্রিয়ভাবে ওষুধের তালিকা তৈরি করুন।'
            : 'Extract prescriptions via OCR & Gemini AI. Requires mandatory human confirmation before activating schedules.'}
        </p>
      </div>

      {/* Mandatory Human Review Gate Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-900">
          <span className="font-extrabold block mb-0.5">
            {isBn ? 'বাধ্যতামূলক যাচাইকরণ গেট (Safety Protocol)' : 'Mandatory Human Verification Gate'}
          </span>
          <p className="font-medium">
            {isBn
              ? 'এআই স্বয়ংক্রিয়ভাবে কোনো ওষুধ নির্ধারণ করে না। প্রেসক্রিপশন থেকে সংগৃহীত ওষুধ রোগীর অথবা কেয়ারগিভারের নিশ্চিতকরণের পরই কেবল সক্রিয় সিডিউল হিসেবে যুক্ত হবে।'
              : 'Extracted medicines are strictly kept in "pending_review". Only explicitly confirmed medicines by patient or caregiver can become active medication schedules.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upload Column */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <span>{isBn ? 'প্রেসক্রিপশন ছবি আপলোড করুন' : 'Upload Prescription Image'}</span>
            </h3>

            {/* Drag & Drop Area */}
            <label className="border-2 border-dashed border-slate-300 hover:border-primary rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition min-h-[220px]">
              <Upload className="w-10 h-10 text-primary mb-2" />
              <span className="font-extrabold text-sm text-slate-800">
                {file ? file.name : (isBn ? 'ছবি নির্বাচন করতে ক্লিক করুন' : 'Click to select or drag prescription image')}
              </span>
              <span className="text-xs text-slate-400 mt-1">PNG, JPG, JPEG (Max 5MB)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Preview */}
            {previewUrl && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 max-h-56 flex items-center justify-center bg-slate-100">
                <img src={previewUrl} alt="Prescription Preview" className="max-h-56 object-contain" />
              </div>
            )}

            {error && (
              <div className="mt-4 p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                {error}
              </div>
            )}
          </div>

          <button
            onClick={handleUploadAndExtract}
            disabled={!file || uploading}
            className="w-full mt-6 py-3.5 px-4 rounded-2xl bg-primary hover:bg-primary-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5" />
            <span>
              {uploading
                ? (isBn ? 'ওসিআর ও এআই বিশ্লেষণ চলছে...' : 'Processing OCR & AI Extraction...')
                : (isBn ? 'প্রেসক্রিপশন বিশ্লেষণ করুন' : 'Analyze Prescription with AI')}
            </span>
          </button>
        </div>

        {/* Extraction Results & Review Column */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-secondary" />
                <span>{isBn ? 'নিষ্কাশন ফলাফল ও পর্যালোচনা' : 'Extraction Review & Confirmation'}</span>
              </h3>
              
              {uploadResult && (
                <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                  uploadResult.confidence_score >= 0.85
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {Math.round(uploadResult.confidence_score * 100)}% Confidence
                </span>
              )}
            </div>

            {reviewDoneMessage && (
              <div className="p-4 mb-4 rounded-2xl bg-green-50 text-green-800 border border-green-200 text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <span>{reviewDoneMessage}</span>
              </div>
            )}

            {uploadResult?.uncertain_fields?.length > 0 && (
              <div className="p-3.5 mb-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <span className="font-extrabold block mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  {isBn ? 'অনিশ্চিত ক্ষেত্রসমূহ চিহ্নিত করা হয়েছে:' : 'Uncertain Fields Detected:'}
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                  {uploadResult.uncertain_fields.map((field, idx) => (
                    <li key={idx}>{field}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Extracted Candidates List */}
            {reviewMeds.length > 0 ? (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {reviewMeds.map((med, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition ${
                      med.is_uncertain
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`med_${idx}`}
                          checked={med.confirmed}
                          onChange={(e) => updateMedField(idx, 'confirmed', e.target.checked)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                        />
                        <label htmlFor={`med_${idx}`} className="font-extrabold text-sm text-slate-900 cursor-pointer">
                          {med.name}
                        </label>
                      </div>
                      
                      {med.is_uncertain && (
                        <span className="text-[10px] font-black uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                          Uncertain
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-500">Dosage:</span>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => updateMedField(idx, 'dosage', e.target.value)}
                          className="w-full mt-0.5 px-2 py-1 rounded-lg border border-slate-200 bg-white font-medium"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-500">Frequency:</span>
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) => updateMedField(idx, 'frequency', e.target.value)}
                          className="w-full mt-0.5 px-2 py-1 rounded-lg border border-slate-200 bg-white font-medium"
                        />
                      </div>
                    </div>

                    <div className="mt-2 text-xs">
                      <span className="font-bold text-slate-500">Scheduled Times (24h comma-separated):</span>
                      <input
                        type="text"
                        value={med.scheduled_times.join(', ')}
                        onChange={(e) => updateMedField(idx, 'scheduled_times', e.target.value.split(',').map(s => s.trim()))}
                        className="w-full mt-0.5 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 font-medium">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>{isBn ? 'ছবি আপলোড করে বিশ্লেষণ সম্পন্ন করুন' : 'Upload an image on the left to extract prescription candidates'}</p>
              </div>
            )}
          </div>

          {reviewMeds.length > 0 && uploadResult?.status === 'pending_review' && (
            <div className="mt-6 pt-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => handleConfirmReview('rejected')}
                disabled={reviewing}
                className="py-3 px-4 rounded-2xl border border-red-300 text-danger hover:bg-red-50 font-bold text-sm transition"
              >
                {isBn ? 'বাতিল করুন' : 'Reject'}
              </button>
              <button
                onClick={() => handleConfirmReview('confirmed')}
                disabled={reviewing}
                className="flex-1 py-3 px-4 rounded-2xl bg-secondary hover:bg-secondary-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {reviewing
                    ? 'Activating...'
                    : (isBn ? 'নিশ্চিত করুন ও শিডিউলে যুক্ত করুন' : 'Confirm & Activate to Schedule')}
                </span>
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
