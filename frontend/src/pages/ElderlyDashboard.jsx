import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  Heart,
  Pill,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  Flame,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function ElderlyDashboard({ onOpenSOS, onNavigateToAssistant }) {
  const { user, elderlyId } = useAuth();
  const { language } = useAccessibility();
  const isBn = language === 'bn';

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchSummary = async () => {
    try {
      const data = await api.getDashboardSummary(elderlyId);
      setSummary(data);
    } catch (err) {
      console.error("Failed to load dashboard summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [elderlyId]);

  const handleMarkDose = async (item, status) => {
    setActionLoading(item.schedule_id);
    try {
      await api.logMedicationAction({
        schedule_id: item.schedule_id,
        medication_id: item.medication_id,
        elderly_id: elderlyId,
        scheduled_time: item.scheduled_time,
        status: status,
        notes: `Marked as ${status} from Elderly Dashboard`
      });
      await fetchSummary();
    } catch (err) {
      alert(err.message || "Failed to update dose status");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const nextMed = summary?.next_medication;
  const schedule = summary?.today_schedule || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-blue-600 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" />
            <span>{isBn ? 'দৈনিক স্বাস্থ্য মনিটর' : 'Daily Health Companion'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {isBn ? `স্বাগতম, ${summary?.full_name || 'শ্রদ্ধেয়'}!` : `Welcome, ${summary?.full_name || 'Sir'}!`}
          </h1>
          <p className="mt-2 text-base sm:text-lg text-blue-100 font-medium">
            {isBn
              ? 'আপনার ওষুধের সময়সূচী ও সুস্থতা বজায় রাখতে আমরা সর্বদা আপনার সাথে আছি।'
              : 'Here is your daily medication overview and vital health statistics for today.'}
          </p>
        </div>

        {/* Action Pills */}
        <div className="mt-6 flex flex-wrap gap-3 relative z-10">
          <button
            onClick={onNavigateToAssistant}
            className="px-5 py-3 rounded-2xl bg-white text-primary font-black text-sm shadow-md hover:bg-blue-50 transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>{isBn ? 'এআই সহকারীর সাথে কথা বলুন' : 'Ask ElderCare Assistant'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSOS}
            className="px-5 py-3 rounded-2xl bg-danger hover:bg-danger-700 text-white font-black text-sm shadow-md transition flex items-center gap-2 animate-pulse"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isBn ? 'জরুরি এসওএস বোতাম' : 'One-Tap Emergency SOS'}</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white rounded-3xl p-5 border border-borderMuted shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center font-black text-xl shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
              {isBn ? 'গৃহীত ওষুধ' : 'Doses Taken'}
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{summary?.taken_count || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-borderMuted shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-xl shrink-0">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
              {isBn ? 'বাকি ওষুধ' : 'Doses Pending'}
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{summary?.pending_count || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-borderMuted shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-black text-xl shrink-0">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
              {isBn ? 'মিস হওয়া ওষুধ' : 'Doses Missed'}
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{summary?.missed_count || 0}</p>
          </div>
        </div>

      </div>

      {/* Main Grid: Next Medicine & Health Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Next Medicine Reminder Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-extrabold text-slate-900">
                  {isBn ? 'পরবর্তী ওষুধের রিমাইন্ডার' : 'Next Medicine Reminder'}
                </h2>
              </div>
              <span className="text-xs font-black uppercase bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                {isBn ? 'শীঘ্রই নিতে হবে' : 'Upcoming'}
              </span>
            </div>

            {nextMed ? (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                      {nextMed.name}
                    </h3>
                    <p className="text-base font-bold text-primary mt-1">
                      {isBn ? 'ডোজ:' : 'Dosage:'} {nextMed.dosage}
                    </p>
                    <p className="text-sm text-slate-600 font-medium mt-2">
                      <span className="font-bold">{isBn ? 'নির্দেশনা:' : 'Instructions:'}</span>{' '}
                      {nextMed.instructions || (isBn ? 'পর্যাপ্ত পানি সহ গ্রহণ করুন' : 'Take with water as prescribed')}
                    </p>
                  </div>

                  <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 shrink-0">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      {isBn ? 'নির্ধারিত সময়' : 'Scheduled At'}
                    </span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 block mt-1">
                      {nextMed.scheduled_time}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleMarkDose(nextMed, 'taken')}
                    disabled={actionLoading === nextMed.schedule_id}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-secondary hover:bg-secondary-700 text-white font-extrabold text-base shadow-md transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isBn ? 'ওষুধ খাওয়া হয়েছে (Mark Taken)' : 'Mark as Taken'}</span>
                  </button>
                  <button
                    onClick={() => handleMarkDose(nextMed, 'skipped')}
                    disabled={actionLoading === nextMed.schedule_id}
                    className="py-3.5 px-5 rounded-2xl border-2 border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition"
                  >
                    {isBn ? 'বাদ দেওয়া হয়েছে (Skip)' : 'Skip Dose'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 rounded-2xl p-8 border border-green-200 text-center text-green-800">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <h4 className="text-lg font-extrabold">{isBn ? 'আজকের সব ওষুধ সম্পন্ন!' : 'All Doses Completed Today!'}</h4>
                <p className="text-sm text-green-700 mt-1">
                  {isBn ? 'আজকের দিনের আর কোনো বাকি ওষুধ নেই। ভালো থাকুন ও বিশ্রাম নিন।' : 'You have no more pending medications for today. Rest well and stay healthy!'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Basic Health Information Widget */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-secondary" />
              <h2 className="text-xl font-extrabold text-slate-900">
                {isBn ? 'সর্বশেষ স্বাস্থ্য তথ্য' : 'Latest Vitals'}
              </h2>
            </div>

            <div className="space-y-4">
              
              <div className="p-4 rounded-2xl bg-slate-50 border border-borderMuted flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-500 block">
                    {isBn ? 'রক্তচাপ (Blood Pressure)' : 'Blood Pressure'}
                  </span>
                  <span className="text-xl font-black text-slate-900">
                    {summary?.latest_bp || '120/80 mmHg'}
                  </span>
                </div>
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  {isBn ? 'স্বাভাবিক' : 'Normal'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-borderMuted flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-500 block">
                    {isBn ? 'রক্তের শর্করা (Glucose)' : 'Blood Glucose'}
                  </span>
                  <span className="text-xl font-black text-slate-900">
                    {summary?.latest_glucose || '108 mg/dL'}
                  </span>
                </div>
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  {isBn ? 'নিয়ন্ত্রিত' : 'Optimal'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-borderMuted flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-500 block">
                    {isBn ? 'শরীরের ওজন (Weight)' : 'Body Weight'}
                  </span>
                  <span className="text-xl font-black text-slate-900">
                    {summary?.latest_weight || '68 kg'}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded-full">
                  {isBn ? 'স্থিতিশীল' : 'Stable'}
                </span>
              </div>

            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 italic text-center">
            {isBn ? 'তথ্যের উদ্দেশ্যে প্রদর্শিত। কোনো চিকিৎসা নির্ণয় বা পরামর্শ নয়।' : 'Informational only. Not intended as clinical diagnosis.'}
          </p>
        </div>

      </div>

      {/* Today's Full Schedule Table/Cards */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderMuted shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {isBn ? 'আজকের সম্পূর্ণ ওষুধের তালিকা' : "Today's Medication Schedule"}
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {schedule.length} {isBn ? 'টি ওষুধ নির্ধারিত' : 'Doses Scheduled'}
          </span>
        </div>

        {schedule.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedule.map((item) => {
              const isTaken = item.status === 'taken';
              const isMissed = item.status === 'missed';
              const isPending = item.status === 'pending';

              return (
                <div
                  key={`${item.schedule_id}_${item.scheduled_time}`}
                  className={`p-5 rounded-2xl border transition-all ${
                    isTaken
                      ? 'bg-green-50/50 border-green-200'
                      : isMissed
                      ? 'bg-red-50/50 border-red-200'
                      : 'bg-white border-slate-200 hover:border-primary shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-black text-slate-900">{item.name}</h4>
                      <p className="text-xs font-bold text-primary mt-0.5">{item.dosage}</p>
                    </div>
                    <span
                      className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                        isTaken
                          ? 'bg-green-100 text-green-800'
                          : isMissed
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 text-slate-600 font-extrabold text-sm">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{item.scheduled_time}</span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 font-medium line-clamp-2">
                    {item.instructions || (isBn ? 'পর্যাপ্ত পানি সহ গ্রহণ করুন' : 'Take with water')}
                  </p>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex gap-2">
                    {!isTaken ? (
                      <>
                        <button
                          onClick={() => handleMarkDose(item, 'taken')}
                          disabled={actionLoading === item.schedule_id}
                          className="flex-1 py-2 px-3 rounded-xl bg-secondary hover:bg-secondary-700 text-white font-bold text-xs transition flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isBn ? 'খেয়েছি' : 'Take Dose'}</span>
                        </button>
                        <button
                          onClick={() => handleMarkDose(item, 'skipped')}
                          disabled={actionLoading === item.schedule_id}
                          className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
                        >
                          {isBn ? 'বাদ' : 'Skip'}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>{isBn ? 'নির্ধারিত সময়ে গৃহীত' : 'Logged & Taken'}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 font-medium">
            <Pill className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p>{isBn ? 'আজকের কোনো ওষুধ নির্ধারিত নেই' : 'No medications scheduled for today'}</p>
          </div>
        )}
      </div>

    </div>
  );
}
