import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  Pill,
  Plus,
  Clock,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  History,
  ShieldCheck,
  Search
} from 'lucide-react';

export default function MedicationManagement() {
  const { elderlyId } = useAuth();
  const { language } = useAccessibility();
  const isBn = language === 'bn';

  const [medications, setMedications] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [scheduledTimes, setScheduledTimes] = useState('09:00');
  const [instructions, setInstructions] = useState('');
  const [doctor, setDoctor] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchMedications = async () => {
    try {
      const [medsData, historyData] = await Promise.all([
        api.getMedications(elderlyId),
        api.getMedicationHistory(elderlyId, 14)
      ]);
      setMedications(medsData);
      setHistoryLogs(historyData);
    } catch (err) {
      console.error("Failed to fetch medications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [elderlyId]);

  const openAddModal = () => {
    setEditingMed(null);
    setName('');
    setDosage('');
    setFrequency('Once daily');
    setScheduledTimes('09:00');
    setInstructions('');
    setDoctor('');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (med) => {
    setEditingMed(med);
    setName(med.name);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    const times = med.schedules?.map(s => s.scheduled_time).join(', ') || '09:00';
    setScheduledTimes(times);
    setInstructions(med.instructions || '');
    setDoctor(med.prescribing_doctor || '');
    setIsActive(med.is_active);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const timeArray = scheduledTimes
        .split(',')
        .map(t => t.trim())
        .filter(t => /^\d{2}:\d{2}$/.test(t))
        .map(t => ({ scheduled_time: t, day_of_week: 'daily' }));

      if (timeArray.length === 0) {
        timeArray.push({ scheduled_time: '09:00', day_of_week: 'daily' });
      }

      if (editingMed) {
        await api.updateMedication(editingMed.id, {
          name,
          dosage,
          frequency,
          instructions,
          prescribing_doctor: doctor,
          is_active: isActive,
          schedules: timeArray
        }, elderlyId);
      } else {
        await api.createMedication({
          elderly_id: elderlyId,
          name,
          dosage,
          frequency,
          instructions,
          prescribing_doctor: doctor,
          is_active: isActive,
          schedules: timeArray
        });
      }

      setShowModal(false);
      await fetchMedications();
    } catch (err) {
      alert(err.message || 'Failed to save medication');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (medId) => {
    if (!window.confirm(isBn ? 'আপনি কি নিশ্চিত এই ওষুধটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this medication?')) {
      return;
    }
    try {
      await api.deleteMedication(medId, elderlyId);
      await fetchMedications();
    } catch (err) {
      alert(err.message || 'Failed to delete medication');
    }
  };

  const filteredMeds = medications.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.dosage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isBn ? 'ওষুধ ব্যবস্থাপনা' : 'Medication Management'}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {isBn ? 'সম্পূর্ণ ও সঠিক সময়সূচী সহ ওষুধের বিবরণ' : 'Manage prescribed medications, schedules, and view adherence history'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary hover:bg-primary-700 text-white font-extrabold text-sm shadow-md transition"
        >
          <Plus className="w-5 h-5" />
          <span>{isBn ? 'নতুন ওষুধ যুক্ত করুন' : 'Add Medication'}</span>
        </button>
      </div>

      {/* Safety Alert Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-blue-900">
          <span className="font-extrabold block mb-0.5">
            {isBn ? 'চিকিৎসা নিরাপত্তা নির্দেশিকা' : 'Clinical Safety Protocol'}
          </span>
          <p className="font-medium">
            {isBn
              ? 'ডাক্তারের পরামর্শ ছাড়া কখনো ওষুধের মাত্রা পরিবর্তন করবেন না। কোনো ডোজ মিস হলে কখনো একসাথে ডাবল ডোজ গ্রহণ করবেন না।'
              : 'Never independently alter prescribed dosage or schedule times. If a dose was missed, do not take a double dose to make up for it.'}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder={isBn ? 'ওষুধের নাম দিয়ে খুঁজুন...' : 'Search medications by name or dosage...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-borderMuted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
        />
      </div>

      {/* Medications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMeds.map((med) => (
          <div
            key={med.id}
            className="bg-white rounded-3xl p-6 border border-borderMuted shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center font-bold">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-slate-900">{med.name}</h3>
                    <span className="text-xs font-bold text-primary">{med.dosage}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    med.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {med.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Schedules */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase">{isBn ? 'ফ্রিকোয়েন্সি' : 'Frequency'}</span>
                  <span className="font-extrabold text-slate-800">{med.frequency}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase">{isBn ? 'নির্ধারিত সময়' : 'Times'}</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {med.schedules?.map(s => (
                      <span key={s.id} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono font-bold">
                        {s.scheduled_time}
                      </span>
                    )) || <span className="text-slate-400">None</span>}
                  </div>
                </div>

                {med.instructions && (
                  <div className="pt-2 text-xs text-slate-600 font-medium">
                    <span className="font-bold block text-slate-500 mb-0.5">{isBn ? 'নির্দেশনা:' : 'Instructions:'}</span>
                    <p className="bg-slate-50 p-2 rounded-xl border border-slate-100">{med.instructions}</p>
                  </div>
                )}

                {med.prescribing_doctor && (
                  <p className="text-[11px] text-slate-400 font-medium pt-1">
                    {isBn ? 'ডাক্তার:' : 'Doctor:'} {med.prescribing_doctor}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => openEditModal(med)}
                className="p-2 text-slate-500 hover:text-primary rounded-xl hover:bg-slate-50 transition"
                title="Edit Medication"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(med.id)}
                className="p-2 text-slate-400 hover:text-danger rounded-xl hover:bg-red-50 transition"
                title="Delete Medication"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Medication Adherence History Log */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-secondary" />
          <h2 className="text-xl font-extrabold text-slate-900">
            {isBn ? 'ওষুধ গ্রহণের ইতিহাস' : 'Recent Medication Logs (Audit Trail)'}
          </h2>
        </div>

        {historyLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase text-slate-400">
                  <th className="pb-3">{isBn ? 'ওষুধ' : 'Medication'}</th>
                  <th className="pb-3">{isBn ? 'নির্ধারিত সময়' : 'Scheduled Time'}</th>
                  <th className="pb-3">{isBn ? 'অবস্থা' : 'Status'}</th>
                  <th className="pb-3">{isBn ? 'গৃহীত সময়' : 'Logged At'}</th>
                  <th className="pb-3">{isBn ? 'মন্তব্য' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {historyLogs.slice(0, 15).map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-900">{log.medication_name || `Med #${log.medication_id}`}</td>
                    <td className="py-3 font-mono font-bold text-slate-600">{log.scheduled_time}</td>
                    <td className="py-3">
                      <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${
                        log.status === 'taken'
                          ? 'bg-green-100 text-green-800'
                          : log.status === 'missed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 text-xs">
                      {log.actual_time ? new Date(log.actual_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 text-slate-500 text-xs max-w-xs truncate">{log.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">
            {isBn ? 'কোনো ইতিহাস পাওয়া যায়নি' : 'No history logs recorded yet.'}
          </p>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-borderMuted relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-slate-900 mb-4">
              {editingMed ? (isBn ? 'ওষুধ সম্পাদনা করুন' : 'Edit Medication') : (isBn ? 'নতুন ওষুধ যুক্ত করুন' : 'Add New Medication')}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  {isBn ? 'ওষুধের নাম' : 'Medicine Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metformin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    {isBn ? 'ডোজ' : 'Dosage *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 mg"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    {isBn ? 'ফ্রিকোয়েন্সি' : 'Frequency *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Twice daily"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  {isBn ? 'নির্ধারিত সময় (কমা দিয়ে আলাদা করুন, 24h)' : 'Scheduled Times (Comma-separated, 24-hr format)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="08:30, 20:30"
                  value={scheduledTimes}
                  onChange={(e) => setScheduledTimes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Format: HH:MM (e.g. 08:30, 14:00, 20:30)</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  {isBn ? 'নির্দেশাবলী' : 'Instructions'}
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Take after breakfast with warm water"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  {isBn ? 'প্রেসক্রিপশনকারী ডাক্তার' : 'Prescribing Doctor (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Tariqul Islam"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  {isBn ? 'সক্রিয় ওষুধ হিসেবে চিহ্নিত করুন' : 'Mark as Active Medication'}
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-2xl bg-primary hover:bg-primary-700 text-white font-extrabold text-sm shadow-md transition"
                >
                  {submitting ? 'Saving...' : (isBn ? 'সংরক্ষণ করুন' : 'Save Medicine')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
