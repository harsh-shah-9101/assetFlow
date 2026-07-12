import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import api from '../services/api';

const TIMELINE_START_HOUR = 9; // 9 AM
const TIMELINE_END_HOUR = 18; // 6 PM
const HOUR_HEIGHT = 60; // 60px per hour => 1px per minute!

export const Bookings: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  
  // View State
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Pending Booking State
  const [pendingStartTime, setPendingStartTime] = useState<string>('09:30');
  const [pendingEndTime, setPendingEndTime] = useState<string>('10:30');
  
  useEffect(() => {
    // Fetch available assets
    api.get('/assets').then(res => {
      setAssets(res.data.filter((a: any) => a.isSharedBookable));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedAssetId) {
      fetchBookings();
    } else {
      setBookings([]);
    }
  }, [selectedAssetId, selectedDate]);

  const fetchBookings = async () => {
    try {
      const res = await api.get(`/bookings?assetId=${selectedAssetId}`);
      // Filter locally for the selected date
      const dateBookings = res.data.filter((b: any) => {
        const bDate = new Date(b.startTime).toISOString().split('T')[0];
        return bDate === selectedDate && (b.status === 'UPCOMING' || b.status === 'ONGOING');
      });
      setBookings(dateBookings);
    } catch (error) {
      console.error(error);
    }
  };

  const parseTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return { h, m };
  };

  const calculateBlockStyles = (startH: number, startM: number, endH: number, endM: number) => {
    const topPx = Math.max(0, (startH - TIMELINE_START_HOUR) * HOUR_HEIGHT + startM);
    const endTotalMins = (endH - TIMELINE_START_HOUR) * 60 + endM;
    const startTotalMins = (startH - TIMELINE_START_HOUR) * 60 + startM;
    const heightPx = Math.max(15, endTotalMins - startTotalMins); // min 15px height

    return {
      top: `${topPx}px`,
      height: `${heightPx}px`,
    };
  };

  // Generate blocks for existing bookings
  const existingBlocks = bookings.map(b => {
    const sd = new Date(b.startTime);
    const ed = new Date(b.endTime);
    return {
      id: b.id,
      user: b.user?.name || 'Unknown',
      startStr: sd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endStr: ed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      styles: calculateBlockStyles(sd.getHours(), sd.getMinutes(), ed.getHours(), ed.getMinutes()),
    };
  });

  // Calculate pending block
  const pStart = parseTime(pendingStartTime);
  const pEnd = parseTime(pendingEndTime);
  const pendingBlockStyles = calculateBlockStyles(pStart.h, pStart.m, pEnd.h, pEnd.m);

  // Overlap check
  let isConflict = false;
  const pStartMins = pStart.h * 60 + pStart.m;
  const pEndMins = pEnd.h * 60 + pEnd.m;

  bookings.forEach(b => {
    const bStart = new Date(b.startTime);
    const bEnd = new Date(b.endTime);
    const bStartMins = bStart.getHours() * 60 + bStart.getMinutes();
    const bEndMins = bEnd.getHours() * 60 + bEnd.getMinutes();
    
    // Standard overlap logic: StartA < EndB and EndA > StartB
    if (pStartMins < bEndMins && pEndMins > bStartMins) {
      isConflict = true;
    }
  });

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isConflict) return;
    
    try {
      const startDateTime = new Date(`${selectedDate}T${pendingStartTime}`).toISOString();
      const endDateTime = new Date(`${selectedDate}T${pendingEndTime}`).toISOString();
      
      await api.post('/bookings', {
        assetId: selectedAssetId,
        startTime: startDateTime,
        endTime: endDateTime
      });
      fetchBookings();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to book resource.");
    }
  };

  // Generate timeline hours array
  const hoursList = [];
  for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h++) {
    hoursList.push(h);
  }

  const formatHourLabel = (h: number) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const disp = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${disp}:00 ${suffix}`;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Resource Booking</h1>
        <p className="text-[var(--color-text-muted)]">Visually manage shared space and equipment.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-8">
          
          {/* Header Controls */}
          <div className="flex gap-4 items-center bg-[var(--color-background)] p-4 rounded-xl border border-[var(--color-border)]">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Resource</label>
              <Select 
                className="w-full text-lg font-medium" 
                value={selectedAssetId} 
                onChange={setSelectedAssetId} 
                placeholder="Select a resource..."
                options={[{ value: '', label: 'Select Bookable Resource...' }, ...assets.map(a => ({ value: a.id, label: a.name }))]}
              />
            </div>
            <div className="w-48 space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Date</label>
              <input 
                type="date" 
                className="input-field w-full text-lg font-medium bg-[var(--color-surface)] cursor-pointer"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {!selectedAssetId ? (
            <div className="text-center py-20 text-[var(--color-text-muted)]">
              Select a resource above to view its availability.
            </div>
          ) : (
            <div className="flex gap-6 relative">
              {/* Timeline Axis */}
              <div className="w-16 shrink-0 relative" style={{ height: `${(TIMELINE_END_HOUR - TIMELINE_START_HOUR) * HOUR_HEIGHT}px` }}>
                {hoursList.map(h => (
                  <div 
                    key={h} 
                    className="absolute w-full text-right pr-4 text-xs font-medium text-[var(--color-text-muted)] -translate-y-2"
                    style={{ top: `${(h - TIMELINE_START_HOUR) * HOUR_HEIGHT}px` }}
                  >
                    {formatHourLabel(h)}
                  </div>
                ))}
              </div>

              {/* Timeline Area */}
              <div className="flex-1 relative border-l border-t border-[var(--color-border)] rounded-tr-xl bg-[var(--color-background)]" style={{ height: `${(TIMELINE_END_HOUR - TIMELINE_START_HOUR) * HOUR_HEIGHT}px` }}>
                
                {/* Horizontal Grid Lines */}
                {hoursList.map(h => (
                  <div 
                    key={h} 
                    className="absolute w-full border-b border-[var(--color-border)] opacity-50"
                    style={{ top: `${(h - TIMELINE_START_HOUR) * HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* Existing Bookings */}
                {existingBlocks.map(block => (
                  <div 
                    key={block.id}
                    className="absolute left-4 right-4 bg-[var(--color-primary)] text-white rounded-md px-4 py-2 overflow-hidden shadow-md z-10 opacity-90 border border-[rgba(255,255,255,0.1)] flex items-start"
                    style={block.styles}
                  >
                    <span className="font-semibold text-sm drop-shadow-md">Booked - {block.user} - {block.startStr} to {block.endStr}</span>
                  </div>
                ))}

                {/* Pending Request Block */}
                {pEndMins > pStartMins && pStart.h >= TIMELINE_START_HOUR && (
                  <div 
                    className={`absolute left-2 right-2 rounded-lg px-4 py-2 overflow-hidden shadow-lg z-20 flex items-start transition-all duration-300 border-2 border-dashed
                      ${isConflict 
                        ? 'bg-[rgba(239,68,68,0.15)] border-red-500 text-red-500' 
                        : 'bg-[rgba(16,185,129,0.15)] border-green-500 text-green-500'
                      }`}
                    style={pendingBlockStyles}
                  >
                    <span className="font-semibold text-sm">
                      Requested {pendingStartTime} to {pendingEndTime} - {isConflict ? 'conflict - slot is unavailable' : 'available to book'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Booking Form Footer */}
          {selectedAssetId && (
            <form onSubmit={handleBook} className="bg-[var(--color-background)] border border-[var(--color-border)] p-4 rounded-xl flex items-end gap-4">
              <Input 
                label="Start Time" 
                type="time" 
                required 
                value={pendingStartTime} 
                onChange={(e) => setPendingStartTime(e.target.value)} 
              />
              <Input 
                label="End Time" 
                type="time" 
                required 
                value={pendingEndTime} 
                onChange={(e) => setPendingEndTime(e.target.value)} 
              />
              <Button type="submit" disabled={isConflict || pEndMins <= pStartMins} className="w-40">
                Book a slot
              </Button>
            </form>
          )}

        </CardContent>
      </Card>
    </div>
  );
};
