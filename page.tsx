'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CalendarCheck, Clock, MapPin, ChevronRight, Plus, Wind, Zap, Droplets, Camera, Thermometer, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { STATUS_CONFIG } from '@/lib/services-data';
import { useAuth } from '@/hooks/use-auth';
import { fetchBookings, getIconName, type BookingWithDetails } from '@/lib/supabase-data';

const ICON_MAP: Record<string, LucideIcon> = { Wind, Camera, Droplets, Zap, Thermometer, RefreshCw };

// Category-based color mapping for bookings
const CATEGORY_COLORS: Record<string, { color: string; iconColor: string }> = {
  appliance: { color: 'from-blue-500/20 to-blue-600/10', iconColor: 'text-blue-400' },
  security: { color: 'from-green-500/20 to-green-600/10', iconColor: 'text-green-400' },
  home: { color: 'from-cyan-500/20 to-cyan-600/10', iconColor: 'text-cyan-400' },
};
const DEFAULT_COLOR = { color: 'from-orange-500/20 to-orange-600/10', iconColor: 'text-orange-400' };

type FilterType = 'all' | 'active' | 'completed';

export default function BookingsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      (async () => {
        const data = await fetchBookings(user.id);
        setBookings(data);
        setLoading(false);
      })();
    } else {
      setLoading(false);
    }
  }, [user]);

  const filtered = bookings.filter(b => {
    if (filter === 'active') return ['pending', 'confirmed', 'in_progress'].includes(b.status);
    if (filter === 'completed') return ['completed', 'cancelled'].includes(b.status);
    return true;
  });

  const activeCount = bookings.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status)).length;
  const completedCount = bookings.filter(b => ['completed', 'cancelled'].includes(b.status)).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="min-h-screen bg-[#070707] pb-24">
      <Header title="Booking History" showLocation={false} />

      <div className="px-4 pt-4 max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { label: 'Total', value: bookings.length, color: 'text-white' },
            { label: 'Active', value: activeCount, color: 'text-orange-500' },
            { label: 'Done', value: completedCount, color: 'text-green-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass rounded-2xl p-3 text-center glass-card">
              <p className={`text-xl font-black ${color}`}>{loading ? '-' : value}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 glass rounded-2xl p-1 mb-5">
          {(['all', 'active', 'completed'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-all duration-300 ${
                filter === f
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-black'
                  : 'text-white/35 hover:text-white/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass rounded-2xl p-4 animate-pulse">
                <div className="flex items-start gap-3.5 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-white/5" />
                  <div className="flex-1">
                    <div className="h-4 bg-white/5 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !user ? (
          <div className="text-center py-16">
            <CalendarCheck size={40} className="text-white/8 mx-auto mb-3" />
            <p className="text-white/25 font-semibold">Login to view bookings</p>
            <Link href="/login" className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-bold px-4 py-2.5 rounded-xl text-sm">
              Sign In
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <CalendarCheck size={40} className="text-white/8 mx-auto mb-3" />
            <p className="text-white/25 font-semibold">No bookings found</p>
            <Link href="/services" className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-bold px-4 py-2.5 rounded-xl text-sm">
              <Plus size={14} /> Book a Service
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(booking => {
              const iconName = getIconName(booking.service_icon || 'wind');
              const Icon = ICON_MAP[iconName] || Wind;
              const catColors = CATEGORY_COLORS[booking.service_category || ''] || DEFAULT_COLOR;
              const statusCfg = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const dateStr = booking.scheduled_date
                ? new Date(booking.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'TBD';
              return (
                <Link key={booking.id} href={`/bookings/${booking.id}`} className="block group">
                  <div className="glass rounded-2xl p-4 glass-card relative overflow-hidden">
                    {['confirmed', 'in_progress'].includes(booking.status) && (
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
                    )}

                    <div className="flex items-start gap-3.5 mb-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${catColors.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={18} className={catColors.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-white text-sm">{booking.service_name}</p>
                            <p className="text-[10px] text-white/25 mt-0.5 font-medium">#{booking.id.slice(0, 8)} • {booking.provider_name || 'Pending assignment'}</p>
                          </div>
                          <span className={`shrink-0 text-[9px] font-bold px-2 py-1 rounded-lg border ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-white/30">
                        <Clock size={11} />
                        <span className="text-[11px]">{dateStr} at {booking.scheduled_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/30">
                        <MapPin size={11} />
                        <span className="text-[11px] truncate">{booking.address}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.04]">
                      <span className="text-base font-black text-gradient">₹{booking.total_amount}</span>
                      <div className="flex items-center gap-1 text-xs text-orange-500/70 group-hover:text-orange-400 font-semibold">
                        Details <ChevronRight size={12} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Book More */}
        {user && (
          <div className="mt-5">
            <Link
              href="/services"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-dashed border-orange-500/25 text-orange-500/70 text-sm font-semibold hover:bg-orange-500/5 hover:border-orange-500/40 transition-all duration-300"
            >
              <Plus size={16} /> Book Another Service
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </motion.div>
  );
}
