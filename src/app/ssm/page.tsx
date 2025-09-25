"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { TextField, Select, MenuItem, Button } from "@mui/material";
import Navbar from "@/app/components/Navbar";

type AvailabilityCreate = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type Availability = AvailabilityCreate & {
  availability_id: number;
  user_id: number;
};

type OutOfOffice = {
  ooo_id: number;
  user_id: number;
  start_datetime: string;
  end_datetime: string;
  reason: string;
};

type Booking = {
  booking_id: number;
  student_name: string;
  student_email: string;
  start_datetime: string;
  end_datetime: string;
  pathway_id: number;
};

function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();
  return (
    <button
      onClick={() => {
        logout();
        router.push("/login");
      }}
      className="px-3 py-2 rounded-md text-sm bg-gray-100 hover:bg-gray-200"
    >
      Logout
    </button>
  );
}

export default function SsmDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [avail, setAvail] = useState<AvailabilityCreate>({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
  });
  const [ooo, setOoo] = useState({ start: "", end: "", reason: "" });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("availability");
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [oooList, setOooList] = useState<OutOfOffice[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user && user.role !== "ssm") {
      router.push("/");
      return;
    }

    if (user) {
      fetchAvailabilities();
      fetchOoo();
      fetchBookings();
    }
  }, [user, authLoading, router]);

  async function fetchAvailabilities() {
    if (!user) return;
    try {
      const data = await apiGet<Availability[]>(
        `/availability/user/${user.user_id}`
      );
      setAvailabilities(data);
    } catch (e: any) {
      addToast("Failed to fetch availabilities", "error");
    }
  }

  async function fetchOoo() {
    if (!user) return;
    try {
      const data = await apiGet<OutOfOffice[]>(
        `/availability/ooo/${user.user_id}`
      );
      setOooList(data);
    } catch (e: any) {
      addToast("Failed to fetch out-of-office periods", "error");
    }
  }

  async function fetchBookings() {
    if (!user) return;
    try {
      const data = await apiGet<Booking[]>(`/booking/ssm/${user.user_id}`);
      setBookings(data);
    } catch (e: any) {
      addToast("Failed to fetch bookings", "error");
    }
  }

  async function addAvailability(e: React.FormEvent) {
    e.preventDefault();
    if (!user || loading) return;

    setLoading(true);
    try {
      await apiPost("/availability/add?user_id=" + user.user_id, {
        day_of_week: avail.day_of_week,
        start_time: avail.start_time + ":00",
        end_time: avail.end_time + ":00",
      });
      addToast("Availability added successfully", "success");
      setAvail({
        day_of_week: 1,
        start_time: "09:00",
        end_time: "17:00",
      });
      fetchAvailabilities();
    } catch (e: any) {
      addToast(e.message || "Failed to add availability", "error");
    } finally {
      setLoading(false);
    }
  }

  async function addOoo(e: React.FormEvent) {
    e.preventDefault();
    if (!user || loading) return;

    // Convert naive local datetimes to UTC ISO with Z
    const startIso = new Date(ooo.start).toISOString();
    const endIso = new Date(ooo.end).toISOString();

    setLoading(true);
    try {
      // POST to /availability/ooo (no user_id param)
      await apiPost("/availability/ooo", {
        start_datetime: startIso,
        end_datetime: endIso,
        reason: ooo.reason,
      });
      addToast("Out-of-office block added successfully", "success");
      setOoo({ start: "", end: "", reason: "" });
      fetchOoo();
    } catch (e: any) {
      addToast(e.message || "Failed to add out-of-office block", "error");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ssm") {
    return null;
  }

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                SSM Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user.full_name}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center">
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {bookings.length} upcoming sessions
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <nav className="flex overflow-x-auto">
            {[
              {
                id: "availability",
                name: "Availability",
                count: availabilities.length,
              },
              { id: "ooo", name: "Out-of-Office", count: oooList.length },
              { id: "bookings", name: "Bookings", count: bookings.length },
              { id: "integration", name: "Integration" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.name}
                {tab.count !== undefined && (
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {activeTab === "availability" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Add New Availability
                </h2>
                <form
                  onSubmit={addAvailability}
                  className="bg-gray-50 p-4 rounded-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day of Week
                      </label>
                      <Select
                        fullWidth
                        value={avail.day_of_week}
                        onChange={(e) =>
                          setAvail({
                            ...avail,
                            day_of_week: Number(e.target.value),
                          })
                        }
                        variant="outlined"
                        size="small"
                      >
                        {dayNames.map((day, index) => (
                          <MenuItem key={index} value={index}>
                            {day}
                          </MenuItem>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <TextField
                        type="time"
                        fullWidth
                        value={avail.start_time}
                        onChange={(e) =>
                          setAvail({ ...avail, start_time: e.target.value })
                        }
                        variant="outlined"
                        size="small"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <TextField
                        type="time"
                        fullWidth
                        value={avail.end_time}
                        onChange={(e) =>
                          setAvail({ ...avail, end_time: e.target.value })
                        }
                        variant="outlined"
                        size="small"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    fullWidth
                    variant="contained"
                    color="error"
                    sx={{ mt: 2 }}
                  >
                    {loading ? "Adding..." : "Add Availability"}
                  </Button>
                </form>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Availability
                </h3>
                {availabilities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No availability slots added yet
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availabilities.map((a) => (
                      <div
                        key={a.availability_id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {dayNames[a.day_of_week]}
                          </div>
                          <div className="text-sm text-gray-600">
                            {a.start_time.slice(0, 5)} -{" "}
                            {a.end_time.slice(0, 5)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "ooo" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Add Out-of-Office Period
                </h2>
                <form onSubmit={addOoo} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label
                        htmlFor="start-datetime"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Start Date & Time
                      </label>
                      <TextField
                        id="start-datetime"
                        type="datetime-local"
                        fullWidth
                        value={ooo.start}
                        onChange={(e) =>
                          setOoo({ ...ooo, start: e.target.value })
                        }
                        required
                        variant="outlined"
                        size="small"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date & Time
                      </label>
                      <TextField
                        type="datetime-local"
                        fullWidth
                        value={ooo.end}
                        onChange={(e) =>
                          setOoo({ ...ooo, end: e.target.value })
                        }
                        required
                        variant="outlined"
                        size="small"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason
                    </label>
                    <TextField
                      type="text"
                      fullWidth
                      placeholder="e.g., Vacation, Sick leave, Conference"
                      value={ooo.reason}
                      onChange={(e) =>
                        setOoo({ ...ooo, reason: e.target.value })
                      }
                      required
                      variant="outlined"
                      size="small"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    fullWidth
                    variant="contained"
                    color="error"
                  >
                    {loading ? "Adding..." : "Add Out-of-Office"}
                  </Button>
                </form>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Out-of-Office Periods
                </h3>
                {oooList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No out-of-office periods scheduled
                  </div>
                ) : (
                  <div className="space-y-3">
                    {oooList.map((o) => (
                      <div
                        key={o.ooo_id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {new Date(o.start_datetime).toLocaleDateString()} -{" "}
                            {new Date(o.end_datetime).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(o.start_datetime).toLocaleTimeString()} -{" "}
                            {new Date(o.end_datetime).toLocaleTimeString()}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {o.reason}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "bookings" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upcoming Sessions
              </h2>
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No upcoming sessions
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pathway
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.map((booking) => (
                        <tr key={booking.booking_id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {booking.student_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.student_email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">
                              {new Date(
                                booking.start_datetime
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(
                                booking.start_datetime
                              ).toLocaleTimeString()}{" "}
                              -{" "}
                              {new Date(
                                booking.end_datetime
                              ).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                              Pathway {booking.pathway_id}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "integration" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Google Calendar Integration
              </h2>
              <p className="text-gray-600">
                Connect your Google Calendar to automatically sync your
                availability and bookings.
              </p>
              <a
                href={`/google-connect?ssm_id=${user.user_id}`}
                className="inline-flex items-center bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Connect Google Calendar
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
