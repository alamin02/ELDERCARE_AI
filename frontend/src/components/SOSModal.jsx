import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAccessibility } from '../context/AccessibilityContext';
import { AlertTriangle, PhoneCall, ShieldAlert, CheckCircle2, X } from 'lucide-react';

export default function SOSModal({ isOpen, onClose, elderlyId }) {
  const { language } = useAccessibility();
  const isBn = language === 'bn';

  const [triggering, setTriggering] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setError(null);
      // Fetch emergency contacts to display on the SOS screen
      api.getEmergencyContacts(elderlyId)
        .then(data => setContacts(data))
        .catch(() => {});
    }
  }, [isOpen, elderlyId]);

  if (!isOpen) return null;

  const handleConfirmSOS = async () => {
    setTriggering(true);
    setError(null);
    try {
      const res = await api.triggerSOS({
        elderly_id: elderlyId,
        notes: "Emergency SOS triggered from patient dashboard"
      });
      setResult(res);
    } catch (err) {
      setError(err.message || "Failed to trigger SOS alert");
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-danger/30 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {!result ? (
          <div>
            <div className="w-20 h-20 mx-auto rounded-3xl bg-danger-100 flex items-center justify-center text-danger mb-4 shadow-inner">
              <ShieldAlert className="w-12 h-12 animate-bounce" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-center text-slate-900 mb-2">
              {isBn ? 'জরুরি এসওএস নিশ্চিত করুন' : 'Confirm Emergency SOS'}
            </h2>
            
            <p className="text-center text-slate-600 font-medium mb-6">
              {isBn
                ? 'এটি আপনার নিবন্ধিত কেয়ারগিভার এবং জরুরি পরিচিতিদের কাছে অবিলম্বে জরুরি সতর্কতা পাঠাবে।'
                : 'This will immediately notify your registered family caregivers and emergency contacts.'}
            </p>

            {/* Simulated Notification Mode Notice (Compliance Requirement) */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">
                    {isBn ? 'সিস্টেম স্ট্যাটাস: সিমুলেটেড মোড' : 'System Mode: Simulated Delivery Active'}
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {isBn
                      ? 'বাস্তব এসএমএস ক্রেডেনশিয়াল ছাড়া এটি সিস্টেমে ইন-অ্যাপ এবং অডিট লগে সংরক্ষিত হবে। কোনো ভুয়া ডেলিভারি দাবি করা হবে না।'
                      : 'Alert will be recorded in the live audit log & dispatch in-app caregiver notifications. External carrier SMS is explicitly flagged as simulated.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Contact Numbers */}
            {contacts.length > 0 && (
              <div className="mb-6 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isBn ? 'জরুরি কল নম্বরসমূহ' : 'Primary Emergency Contacts'}
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto">
                  {contacts.map(c => (
                    <a
                      key={c.id}
                      href={`tel:${c.phone_number}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-borderMuted transition text-left"
                    >
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">{c.name}</span>
                        <span className="text-xs text-slate-500 font-medium">{c.relationship_type}</span>
                      </div>
                      <span className="flex items-center gap-1 font-bold text-sm text-primary">
                        <PhoneCall className="w-4 h-4" />
                        {c.phone_number}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-sm font-semibold border border-red-200">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                {isBn ? 'বাতিল করুন' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmSOS}
                disabled={triggering}
                className="flex-1 py-3 px-4 rounded-2xl bg-danger hover:bg-danger-700 text-white font-extrabold text-base shadow-lg shadow-danger/20 transition flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-5 h-5" />
                <span>{triggering ? (isBn ? 'পাঠানো হচ্ছে...' : 'Dispatching...') : (isBn ? 'এসওএস পাঠান' : 'Trigger SOS Now')}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Result View */
          <div className="text-center py-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-green-100 flex items-center justify-center text-green-600 mb-4">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-2">
              {isBn ? 'জরুরি সতর্কতা সফলভাবে সক্রিয়!' : 'Emergency SOS Active!'}
            </h2>

            <p className="text-slate-600 font-medium mb-4">
              {result.message}
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-1.5 mb-6">
              <div><span className="font-bold text-slate-500">Event ID:</span> #{result.event_id}</div>
              <div><span className="font-bold text-slate-500">Patient:</span> {result.elderly_name}</div>
              <div>
                <span className="font-bold text-slate-500">Notification Status:</span>{' '}
                <span className="font-black text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded">
                  {result.notification_status} {result.is_simulated && '(Simulated)'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-500">Contacts Alerted:</span>{' '}
                {result.contacts_alerted?.join(', ') || 'Caregiver in-app alert dispatched'}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-primary text-white font-extrabold hover:bg-primary-700 transition"
            >
              {isBn ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
