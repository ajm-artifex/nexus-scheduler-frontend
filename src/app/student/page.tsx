"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useToast } from "@/lib/toast";
import type { UserOut, AvailabilityResponse, BookingOut } from "@/types";

function useQueryParam(key: string) {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setValue(params.get(key));
  }, [key]);
  return value;
}

interface SSMInfo {
  id: number;
  name: string;
  email?: string;
}

type SlotAPI = {
  ssm_id: number;
  start_datetime: string; // UTC ISO
  end_datetime: string; // UTC ISO
  slot_minutes: number;
  pathway_id: number;
};

type SlotsResp = {
  pathway_id: number;
  window_start: string;
  window_end: string;
  slot_minutes: number;
  total_slots: number;
  slots: SlotAPI[];
};

type SlotView = {
  ssm_id: number;
  label: string;
  start: string;
  end: string;
  ssm_name: string;
};
export default function StudentPage() {
  const discoUserId = useQueryParam("disco_user_id");
  const [student, setStudent] = useState<UserOut | null>(null);
  const [pathwayId, setPathwayId] = useState<number>(1);
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [ssmInfo, setSsmInfo] = useState<Record<number, SSMInfo>>({});
  const [selectedSlot, setSelectedSlot] = useState<SlotView | null>(null);
  const [loading, setLoading] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const { addToast } = useToast();

  // load student by disco_user_id
  useEffect(() => {
    if (!discoUserId) return;
    setLoading(true);
    apiGet<UserOut>(`/user/${discoUserId}`)
      .then(setStudent)
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Failed to load student";
        addToast(msg, "error");
      })
      .finally(() => setLoading(false));
  }, [discoUserId, addToast]);

  // optional: fetch SSM directory (if endpoint exists). Falls back to “SSM {id}”
  useEffect(() => {
    apiGet<SSMInfo[]>("/ssms")
      .then((ssms) => {
        const map: Record<number, SSMInfo> = {};
        ssms.forEach((s) => {
          map[s.id] = s;
        });
        setSsmInfo(map);
      })
      .catch(() => {
        // Silently ignore; fallback names will be used
        // console.warn("Could not fetch SSM details, using fallback names");
      });
  }, []);

  // load raw availability payload for selected pathway
  useEffect(() => {
    if (!pathwayId) return;
    setSlotLoading(true);
    apiGet<AvailabilityResponse>(`/availability/${pathwayId}`)
      .then(setData)
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Failed to load availability";
        addToast(msg, "error");
      })
      .finally(() => setSlotLoading(false));
  }, [pathwayId, addToast]);

  // build visible slot list (2 weeks ahead, 30-min blocks)
  const slots = useMemo<SlotView[]>(() => {
    if (!data) return [];

    const results: SlotView[] = [];
    const now = new Date();

    for (const avail of data.availabilities) {
      for (let week = 0; week < 2; week++) {
        const todayDow = now.getDay(); // 0=Sun
        const deltaDays = ((avail.day_of_week - todayDow + 7) % 7) + week * 7;

        const start = new Date(now);
        start.setDate(now.getDate() + deltaDays);

        const [h, m] = avail.start_time.split(":").map(Number);
        start.setHours(h, m, 0, 0);

        const end = new Date(start.getTime() + 30 * 60 * 1000);

        if (start < now) continue;

        const ssmName = ssmInfo[avail.user_id]?.name ?? `SSM ${avail.user_id}`;

        results.push({
          ssm_id: avail.user_id,
          label: `${start.toLocaleString()} (${ssmName})`,
          start: start.toISOString(),
          end: end.toISOString(),
          ssm_name: ssmName,
        });
      }
    }

    return results.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [data, ssmInfo]);

  async function book() {
    if (!student || !discoUserId || !selectedSlot) return;
    setBookingLoading(true);
    try {
      const payload = {
        student_disco_user_id: discoUserId,
        ssm_id: selectedSlot.ssm_id,
        pathway_id: pathwayId,
        start_datetime: selectedSlot.start,
        end_datetime: selectedSlot.end,
      };
      await apiPost<BookingOut>(`/booking`, payload);
      addToast(
        `Booking confirmed! Your session is scheduled with ${selectedSlot.ssm_name}`,
        "success"
      );
      setSelectedSlot(null);

      // refresh availability
      setSlotLoading(true);
      apiGet<AvailabilityResponse>(`/availability/${pathwayId}`)
        .then(setData)
        .catch((err: unknown) => {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to refresh availability";
          addToast(msg, "error");
        })
        .finally(() => setSlotLoading(false));
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Booking failed. Please try again.";
      addToast(msg, "error");
    } finally {
      setBookingLoading(false);
    }
  }

  if (!discoUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <h2 className="font-semibold text-lg mb-2">Access Required</h2>
            <p>
              Missing <code>disco_user_id</code> in the URL. Please access this
              page through your learning platform.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Book a 1:1 Session</h1>
            {student && (
              <div className="flex items-center">
                <div className="bg-red-500 rounded-full p-2 mr-3">
                  {/* Heroicons: user */}
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">
                    Welcome, {student.full_name}
                  </div>
                  <div className="text-sm opacity-90">{student.email}</div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {/* Pathway Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Your Pathway
                </label>
                <div className="flex gap-3">
                  {[1, 2].map((id) => (
                    <button
                      key={id}
                      onClick={() => {
                        setPathwayId(id);
                        setSelectedSlot(null);
                      }}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        pathwayId === id
                          ? "bg-red-100 border-red-500 text-red-700 shadow-sm"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Pathway {id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Slots */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-gray-700">
                    Available Time Slots
                  </label>
                  {!slotLoading && (
                    <span className="text-sm text-gray-500">
                      {slots.length} slot{slots.length !== 1 ? "s" : ""}{" "}
                      available
                    </span>
                  )}
                </div>

                {slotLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-2" />
                      <span>Loading available slots...</span>
                    </div>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      {/* Heroicons: clock */}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-gray-500">No available slots found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Please check back later or try a different pathway
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                    {slots.map((slot) => {
                      const startDate = new Date(slot.start);
                      const isToday =
                        new Date().toDateString() === startDate.toDateString();

                      return (
                        <button
                          key={`${slot.ssm_id}-${slot.start}`}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-4 border rounded-xl text-left transition-all ${
                            selectedSlot?.start === slot.start
                              ? "border-red-500 bg-red-50 ring-2 ring-red-100"
                              : "border-gray-200 hover:border-red-300 hover:bg-red-50"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-gray-900">
                              {slot.ssm_name}
                            </div>
                            {isToday && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                Today
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {startDate.toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            {startDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(slot.end).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Slot Confirmation */}
              {selectedSlot && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h3 className="font-medium text-red-900 mb-3">
                    Selected Session
                  </h3>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="text-red-800 font-medium">
                        With {selectedSlot.ssm_name}
                      </div>
                      <div className="text-red-700">
                        {new Date(selectedSlot.start).toLocaleDateString()} at{" "}
                        {new Date(selectedSlot.start).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <button
                      onClick={book}
                      disabled={bookingLoading}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors flex items-center"
                    >
                      {bookingLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Booking...
                        </>
                      ) : (
                        "Confirm Booking"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Information Footer */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    {/* Heroicons: information-circle */}
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Important Information
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Sessions are 30 minutes long</li>
                  <li>• You can cancel up to 24 hours before your session</li>
                  <li>• Bring any questions or topics you’d like to discuss</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
