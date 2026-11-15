import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  PhoneCall,
  Plus,
  ShieldAlert,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Clock,
  History,
  X
} from 'lucide-react';

export default function EmergencyContacts({ onOpenSOS }) {
  const { elderlyId } = useAuth();
  const { language } = useAccessibility();
  const isBn = language === 'bn';

  const [contacts, setContacts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [relationshipType, setRelationshipType] = useState('Family');
  const [phone, setPhone] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const fetchContactsAndEvents = async () => {
    try {
      const [contactsData, eventsData] = await Promise.all([
        api.getEmergencyContacts(elderlyId),
        api.getEmergencyEvents(elderlyId)
      ]);
      setContacts(contactsData);
      setEvents(eventsData);
    } catch (err) {
      console.error("Failed to load emergency contacts/events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactsAndEvents();
  }, [elderlyId]);

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createEmergencyContact({
        elderly_id: elderlyId,
        name,
        relationship_type: relationshipType,
        phone_number: phone,
        is_primary: isPrimary
      });
      setShowModal(false);
      setName('');
      setPhone('');
      setIsPrimary(false);
      await fetchContactsAndEvents();
    } catch (err) {
      alert(err.message || "Failed to add emergency contact");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm(isBn ? 'এই কন্টাক্টটি মুছে ফেলতে চান?' : 'Delete this emergency contact?')) return;
    try {
      await api.deleteEmergencyContact(id, elderlyId);
      await fetchContactsAndEvents();
    } catch (err) {
      alert(err.message || "Failed to delete contact");
    }
  };

  const handleResolveEvent = async (eventId) => {
    try {
      await api.resolveEmergency(eventId);
      await fetchContactsAndEvents();
    } catch (err) {
      alert(err.message || "Failed to resolve emergency");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isBn ? 'জরুরি যোগাযোগ ও এসওএস' : 'Emergency Contacts & SOS Alerts'}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {isBn ? 'জরুরি পরিচিতি পরিচালনা এবং এসওএস ইভেন্ট ট্র্যাকিং' : 'Direct emergency contacts, one-tap SOS dispatch, and auditable alert events.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'পরিচিতি যুক্ত করুন' : 'Add Contact'}</span>
          </button>
          <button
            onClick={onOpenSOS}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-danger hover:bg-danger-700 text-white font-extrabold text-sm shadow-lg shadow-danger/20 transition animate-pulse"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>{isBn ? 'এক-ট্যাপ এসওএস বোতাম' : 'One-Tap SOS Button'}</span>
          </button>
        </div>
      </div>

      {/* Simulated Mode Compliance Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-900">
          <span className="font-extrabold block mb-0.5">
            {isBn ? 'এসএমএস বিজ্ঞপ্তি নীতি ও অডিট সিস্টেম' : 'Simulated Carrier Dispatch Mode'}
          </span>
          <p className="font-medium">
            {isBn
              ? 'বাহ্যিক এসএমএস গেটওয়ে অনুপস্থিত থাকলে সিস্টেম পরিষ্কারভাবে "simulated_sent" প্রদর্শন করে। কোনো ভুয়া সফল এসএমএস ডেলিভারি দেখানো হয় না।'
              : 'Without external production SMS gateway credentials, SOS notifications are logged in-app and clearly labeled as "simulated_sent". Simulated status is never falsified as real carrier SMS.'}
          </p>
        </div>
      </div>

      {/* Contacts List Grid */}
      <div>
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">
          {isBn ? 'নিবন্ধিত জরুরি নম্বরসমূহ' : 'Emergency Contact Directory'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-6 rounded-3xl border transition-all ${
                contact.is_primary
                  ? 'bg-red-50/40 border-2 border-danger/40 shadow-sm'
                  : 'bg-white border-borderMuted shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-black text-lg text-slate-900">{contact.name}</h4>
                  <span className="text-xs font-bold text-slate-500">{contact.relationship_type}</span>
                </div>
                {contact.is_primary && (
                  <span className="text-[10px] font-black uppercase bg-danger text-white px-2 py-0.5 rounded-full">
                    Primary
                  </span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={`tel:${contact.phone_number}`}
                  className="inline-flex items-center gap-2 font-extrabold text-sm text-primary hover:underline"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{contact.phone_number}</span>
                </a>
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="p-1.5 text-slate-400 hover:text-danger rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Event Audit Log */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-sm">
        <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
          <History className="w-5 h-5 text-secondary" />
          <span>{isBn ? 'জরুরি সতর্কতার ইতিহাস (অডিট লগ)' : 'Emergency SOS Event Audit Log'}</span>
        </h3>

        {events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase text-slate-400">
                  <th className="pb-3">Event ID</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Event Status</th>
                  <th className="pb-3">Notification Status</th>
                  <th className="pb-3">Triggered Time</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 font-bold text-slate-900">#{ev.id}</td>
                    <td className="py-3.5 capitalize text-xs font-bold text-slate-700">{ev.event_type.replace('_', ' ')}</td>
                    <td className="py-3.5">
                      <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${
                        ev.status === 'active'
                          ? 'bg-red-100 text-danger animate-pulse'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        {ev.notification_status}
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-slate-500">
                      {new Date(ev.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5">
                      {ev.status === 'active' ? (
                        <button
                          onClick={() => handleResolveEvent(ev.id)}
                          className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <span className="text-xs text-green-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">No emergency events logged.</p>
        )}
      </div>

      {/* Add Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-borderMuted relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-slate-900 mb-4">
              {isBn ? 'নতুন জরুরি পরিচিতি' : 'Add Emergency Contact'}
            </h3>

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Farhana Rahman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Relationship *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daughter / Doctor / Neighbor"
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+880 1819-222333"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="primaryContact"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded text-danger focus:ring-danger"
                />
                <label htmlFor="primaryContact" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Mark as Primary Emergency Contact (Notified First)
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-2xl bg-danger hover:bg-danger-700 text-white font-extrabold text-sm shadow-md"
                >
                  {submitting ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
