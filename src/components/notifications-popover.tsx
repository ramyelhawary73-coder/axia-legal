"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Check, 
  ArrowLeft, 
  X, 
  Scale, 
  Building2, 
  User,
  Radio,
  Send,
  Sparkles,
  Gavel,
  Car,
  MapPin,
  Navigation
} from "lucide-react";
import { LegalTask, NavigationTab, Hearing } from "@/types/legal";
import { 
  getUpcomingDeadlineTasks, 
  getHighPriorityTasksDueWithinHour 
} from "@/lib/task-utils";
import {
  getNotificationPermissionStatus,
  requestBrowserNotificationPermission,
  sendTaskDeadlineBrowserNotification,
  sendTestBrowserNotification,
  sendHearingBrowserNotification,
  NotificationPermissionStatus,
} from "@/lib/browser-notifications";
import { mockHearings } from "@/lib/mock-legal-data";

interface NotificationsPopoverProps {
  tasks: LegalTask[];
  onToggleTaskStatus?: (taskId: string) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export function NotificationsPopover({
  tasks,
  onToggleTaskStatus,
  onNavigate,
}: NotificationsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSegment, setActiveSegment] = useState<"hearings" | "tasks">("hearings");
  const [completedNotificationId, setCompletedNotificationId] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>(() => {
    return typeof window !== "undefined" ? getNotificationPermissionStatus() : "default";
  });
  const [isRequestingPerm, setIsRequestingPerm] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // States for Hearings and Traffic Live data
  const [hearings, setHearings] = useState<Hearing[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("axia_hearings");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return mockHearings;
  });
  const [travelTimes, setTravelTimes] = useState<Record<string, { duration: string; distance: string; source: string }>>({});
  const [notifiedHearings, setNotifiedHearings] = useState<Set<string>>(new Set());

  // Helper: Parse hearing date and time string
  const parseHearingDateTime = (dateStr: string, timeStr: string): Date => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      
      const cleanTime = timeStr.trim();
      const timeMatch = cleanTime.match(/^(\d+):(\d+)\s*(ص|م|am|pm)?/i);
      let hours = 9;
      let minutes = 0;
      
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        const period = timeMatch[3];
        if (period) {
          if ((period === "م" || period.toLowerCase() === "pm") && hours < 12) {
            hours += 12;
          } else if ((period === "ص" || period.toLowerCase() === "am") && hours === 12) {
            hours = 0;
          }
        }
      }
      
      const date = new Date();
      date.setFullYear(year, month, day);
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    return new Date(`${dateStr}`);
  };

  // Helper: Convert travel duration string to minute number
  const parseTravelTimeToMinutes = (durationStr: string): number => {
    const arabicToEnglish = (str: string) => {
      return str.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
    };
    
    const cleanStr = arabicToEnglish(durationStr).toLowerCase();
    const minuteMatch = cleanStr.match(/(\d+)\s*(دقيقة|دقائق|min|minute|m)/);
    let minutes = 0;
    if (minuteMatch) {
      minutes += parseInt(minuteMatch[1], 10);
    }
    const hourMatch = cleanStr.match(/(\d+)\s*(ساعة|ساعات|hour|hr|h)/);
    if (hourMatch) {
      minutes += parseInt(hourMatch[1], 10) * 60;
    }
    return minutes === 0 ? 30 : minutes;
  };

  // Helper: Format date into Arabic 12-hour string
  const formatArabicTime = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "م" : "ص";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const paddedMinutes = minutes.toString().padStart(2, "0");
    return `${hours}:${paddedMinutes} ${period}`;
  };

  // Load hearings from localStorage or fallback
  useEffect(() => {
    try {
      const cached = localStorage.getItem("axia_hearings");
      if (cached) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHearings(JSON.parse(cached));
      }
    } catch {}
  }, [isOpen]);

  // Today's active hearings (September 18, 2026 - Cairo system date context)
  const todayHearings = useMemo(() => {
    return hearings.filter((h) => h.hearingDate === "2026-09-18" && !h.isArchived);
  }, [hearings]);

  // Fetch travel time live estimates for today's hearings
  useEffect(() => {
    if (todayHearings.length === 0) return;

    todayHearings.forEach(async (h) => {
      if (travelTimes[h.id]) return; // Already fetched
      try {
        const res = await fetch(`/api/maps/travel-time?court=${encodeURIComponent(h.court)}`);
        if (res.ok) {
          const data = await res.json();
          setTravelTimes((prev) => ({
            ...prev,
            [h.id]: {
              duration: data.duration,
              distance: data.distance,
              source: data.source || "سجل التقديرات المحلّية",
            },
          }));
        }
      } catch (err) {
        console.error("Error fetching travel time:", err);
      }
    });
  }, [todayHearings, travelTimes]);

  // Background check for upcoming hearings (Auto Push alerts 1 hour prior)
  useEffect(() => {
    const checkUpcomingHearings = () => {
      // System local reference time is 2026-09-18 (Cairo timezone context)
      const now = new Date();
      
      todayHearings.forEach((h) => {
        if (notifiedHearings.has(h.id)) return;

        const hearingTimeDate = parseHearingDateTime(h.hearingDate, h.hearingTime);
        const diffMs = hearingTimeDate.getTime() - now.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        // If the hearing is starting within the next 65 minutes (1 hour) and hasn't started yet
        if (diffMinutes > 0 && diffMinutes <= 65) {
          const travel = travelTimes[h.id] || { duration: "٣٠ دقيقة", distance: "١٥ كم", source: "سجل التقديرات المحلّية" };
          const travelMinutes = parseTravelTimeToMinutes(travel.duration);
          
          // Calculate departure (HearingTime - TravelTime - 10 min safe buffer)
          const depDate = new Date(hearingTimeDate.getTime() - (travelMinutes + 10) * 60 * 1000);
          const depText = formatArabicTime(depDate);

          // Dispatch native notification
          sendHearingBrowserNotification({
            hearing: h,
            travelTimeText: `${travel.duration} (${travel.distance})`,
            departureTimeText: depText,
            onClick: () => {
              setIsOpen(true);
              onNavigate("hearings");
            }
          });

          setNotifiedHearings((prev) => {
            const next = new Set(prev);
            next.add(h.id);
            return next;
          });
        }
      });
    };

    checkUpcomingHearings();
    const interval = setInterval(checkUpcomingHearings, 30000);
    return () => clearInterval(interval);
  }, [todayHearings, travelTimes, notifiedHearings, onNavigate]);

  // Sync notification permission state when popover opens
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermissionStatus(getNotificationPermissionStatus());
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Compute tasks due within next 24 hours
  const upcomingDeadlines = useMemo(() => {
    return getUpcomingDeadlineTasks(tasks);
  }, [tasks]);

  // Compute critical tasks due within <= 1 hour
  const tasksDueWithinOneHour = useMemo(() => {
    return getHighPriorityTasksDueWithinHour(tasks);
  }, [tasks]);

  const hasCritical = upcomingDeadlines.some(
    (item) => item.task.priority.includes("حرجة") || item.isOverdue
  );

  const hasDueWithinOneHour = tasksDueWithinOneHour.length > 0;

  const handleTaskClick = () => {
    setIsOpen(false);
    onNavigate("tasks");
  };

  const handleQuickComplete = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setCompletedNotificationId(taskId);
    if (onToggleTaskStatus) {
      onToggleTaskStatus(taskId);
    }
    setTimeout(() => {
      setCompletedNotificationId(null);
    }, 1500);
  };

  const handleRequestPermission = async () => {
    setIsRequestingPerm(true);
    try {
      const res = await requestBrowserNotificationPermission();
      setPermissionStatus(res);

      // If granted and there are tasks due within 1 hour, immediately alert for them
      if (res === "granted" && tasksDueWithinOneHour.length > 0) {
        const topTask = tasksDueWithinOneHour[0];
        sendTaskDeadlineBrowserNotification({
          task: topTask.task,
          diffHours: topTask.diffHours,
          onClick: () => {
            setIsOpen(false);
            onNavigate("tasks");
          },
          force: true,
        });
      }
    } finally {
      setIsRequestingPerm(false);
    }
  };

  const handleSendTestNotification = () => {
    const success = sendTestBrowserNotification(() => {
      setIsOpen(false);
      onNavigate("tasks");
    });
    if (success) {
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3000);
    }
  };

  const handleTriggerManualAlert = (e: React.MouseEvent, item: (typeof tasksDueWithinOneHour)[0]) => {
    e.stopPropagation();
    sendTaskDeadlineBrowserNotification({
      task: item.task,
      diffHours: item.diffHours,
      onClick: () => {
        setIsOpen(false);
        onNavigate("tasks");
      },
      force: true,
    });
  };

  return (
    <div className="relative" ref={containerRef} id="notifications-menu-container">
      {/* Trigger Button */}
      <button
        type="button"
        id="notifications-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="تنبيهات المواعيد النهائية"
        aria-expanded={isOpen}
        className={`relative grid size-8 place-items-center rounded-lg border transition-all ${
          isOpen
            ? "border-[var(--axia-gold)] bg-[var(--accent-hover)] text-[var(--axia-gold)] shadow-sm"
            : "border-[var(--border)] bg-[var(--panel)]/60 text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
        }`}
        title={
          upcomingDeadlines.length > 0
            ? `${upcomingDeadlines.length} مهام تقترب مواعيدها خلال ٢٤ ساعة`
            : "التنبيهات"
        }
      >
        <Bell className="size-4" />

        {upcomingDeadlines.length > 0 && (
          <>
            {/* Pulsing indicator for critical items */}
            {hasCritical && (
              <span className="absolute -top-1 -right-1 flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-rose-600" />
              </span>
            )}
            
            {/* Count Badge */}
            <span
              id="notifications-count-badge"
              className="absolute -top-1.5 -right-1.5 flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--bg)]"
            >
              {upcomingDeadlines.length}
            </span>
          </>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          id="notifications-popover-panel"
          className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[var(--border-strong)] bg-[var(--panel)] p-0 shadow-2xl z-50 text-xs overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--accent)]/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid size-7 place-items-center rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <AlertTriangle className="size-4" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text)] text-sm leading-tight">
                  تنبيهات المواعيد النهائية
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  المهام والمواعيد الإجرائية خلال الـ 24 ساعة القادمة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {upcomingDeadlines.length > 0 && (
                <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                  {upcomingDeadlines.length} عاجل
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid size-6 place-items-center rounded-md text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
                title="إغلاق"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Browser Notification Integration Bar */}
          <div className="border-b border-[var(--border)] bg-[var(--panel-glass)] px-3.5 py-2.5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Radio className={`size-3.5 ${
                  permissionStatus === "granted"
                    ? "text-emerald-500 animate-pulse"
                    : permissionStatus === "denied"
                    ? "text-red-500"
                    : "text-[var(--axia-gold)]"
                }`} />
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[11px] text-[var(--text)]">
                      إشعارات المتصفح الفورية (Desktop Alerts)
                    </span>
                    {permissionStatus === "granted" && (
                      <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                        مفعلة
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {permissionStatus === "granted"
                      ? "يتم إرسال تنبيه صوتي ومكتبي فوري عند بقاء أقل من ساعة على أي ميعاد حرج"
                      : permissionStatus === "denied"
                      ? "الإشعارات محظورة في إعدادات المتصفح. يمكنك السماح بها عبر شريط العنوان"
                      : "احصل على تنبيه صوتي ومكتبي فوري عند بقاء أقل من ساعة على المهام الحرجة"}
                  </p>
                </div>
              </div>

              {/* Action button based on permission state */}
              <div>
                {permissionStatus === "granted" ? (
                  <button
                    type="button"
                    onClick={handleSendTestNotification}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-[10px] font-medium text-[var(--text)] hover:border-[var(--axia-gold)] hover:text-[var(--axia-gold)] transition-colors"
                    title="إرسال إشعار تجريبي لاختبار التنبيه المكتبي"
                  >
                    <Send className="size-2.5" />
                    <span>{testNotificationSent ? "تم الإرسال ✓" : "تجربة إشعار"}</span>
                  </button>
                ) : permissionStatus === "denied" ? (
                  <span className="text-[10px] text-red-400 font-medium">محظورة</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    disabled={isRequestingPerm}
                    className="inline-flex items-center gap-1 rounded-lg bg-[var(--axia-gold)] px-2.5 py-1 text-[10px] font-bold text-black shadow-sm hover:bg-[var(--axia-gold-light)] transition-colors"
                  >
                    <Sparkles className="size-2.5" />
                    <span>{isRequestingPerm ? "جاري التفعيل..." : "تفعيل الآن"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* High Priority (<1h) Alert Highlight Banner */}
          {hasDueWithinOneHour && (
            <div className="border-b border-red-500/30 bg-red-950/20 px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-red-600" />
                  </div>
                  <div>
                    <span className="font-bold text-[11px] text-red-400">
                      إنذار ميعاد سقوط عاجل (أقل من ساعة)
                    </span>
                    <p className="text-[10px] text-red-300/80">
                      {tasksDueWithinOneHour.length} مهمة تستوجب تدخلاً فورياً قبل انتهاء الميعاد القضائي
                    </p>
                  </div>
                </div>

                {permissionStatus === "granted" && (
                  <button
                    type="button"
                    onClick={(e) => handleTriggerManualAlert(e, tasksDueWithinOneHour[0])}
                    className="inline-flex items-center gap-1 rounded border border-red-500/40 bg-red-600/20 px-1.5 py-0.5 text-[9px] font-bold text-red-300 hover:bg-red-600/30 transition-colors"
                    title="إرسال إشعار فوري لسطح المكتب لهذه المهمة"
                  >
                    <span>إشعار مكتبي</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Segment Selector tabs */}
          <div className="flex border-b border-[var(--border)] bg-[var(--accent)]/30 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSegment("hearings")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                activeSegment === "hearings"
                  ? "bg-[var(--panel)] text-[var(--axia-gold)] shadow-sm border border-[var(--border-strong)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent)]/50"
              }`}
            >
              <Gavel className="size-3.5" />
              <span>جلسات اليوم</span>
              {todayHearings.length > 0 && (
                <span className="rounded-full bg-[var(--axia-gold)]/10 border border-[var(--axia-gold)]/30 px-1.5 py-0.5 text-[9px] font-bold text-[var(--axia-gold)]">
                  {todayHearings.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveSegment("tasks")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                activeSegment === "tasks"
                  ? "bg-[var(--panel)] text-rose-500 shadow-sm border border-[var(--border-strong)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent)]/50"
              }`}
            >
              <Clock className="size-3.5" />
              <span>مواعيد قلم المحضرين</span>
              {upcomingDeadlines.length > 0 && (
                <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-500">
                  {upcomingDeadlines.length}
                </span>
              )}
            </button>
          </div>

          {/* Body List Container */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--border)] custom-scrollbar">
            {activeSegment === "hearings" ? (
              todayHearings.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="grid size-12 place-items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-3">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text)]">
                    لا توجد جلسات مجدولة لليوم
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 max-w-[240px]">
                    جميع القضايا متبعة ومؤمنة في التواريخ القادمة. يمكنك إضافة جلسات جديدة من تبويب الجلسات.
                  </p>
                </div>
              ) : (
                todayHearings.map((h) => {
                  const travel = travelTimes[h.id];
                  const travelText = travel ? `${travel.duration} (${travel.distance})` : "جاري جلب الحالة المرورية الحية...";
                  
                  let departureText = "قيد الحساب...";
                  if (travel) {
                    const travelMinutes = parseTravelTimeToMinutes(travel.duration);
                    const hearingTimeDate = parseHearingDateTime(h.hearingDate, h.hearingTime);
                    // Propose departure: leave with safe buffer of 10 extra minutes for parking/entry
                    const depDate = new Date(hearingTimeDate.getTime() - (travelMinutes + 10) * 60 * 1000);
                    departureText = formatArabicTime(depDate);
                  }

                  const handleTestHearingNotification = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    sendHearingBrowserNotification({
                      hearing: h,
                      travelTimeText: travel ? `${travel.duration} (${travel.distance})` : "٣٠ دقيقة (١٥ كم)",
                      departureTimeText: departureText !== "قيد الحساب..." ? departureText : h.hearingTime,
                      onClick: () => {
                        setIsOpen(false);
                        onNavigate("hearings");
                      }
                    });
                  };

                  return (
                    <div
                      key={h.id}
                      onClick={() => {
                        setIsOpen(false);
                        onNavigate("hearings");
                      }}
                      className="group relative cursor-pointer p-4 transition-colors hover:bg-[var(--accent-hover)] text-right"
                    >
                      {/* Top Row: Case & Time */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)] border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                          {h.caseNumber}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--axia-gold)]/30 bg-[var(--axia-gold)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--axia-gold)]">
                          <Clock className="size-3 animate-pulse" />
                          <span>{h.hearingTime}</span>
                        </span>
                      </div>

                      {/* Title & Circuit */}
                      <h4 className="font-semibold text-xs text-[var(--text)] group-hover:text-[var(--axia-gold)] transition-colors leading-relaxed">
                        {h.court}
                      </h4>
                      <div className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-[var(--text-muted)]">
                        <span>الدائرة: {h.circuit}</span>
                        <span>•</span>
                        <span>رول رقم: {h.rollNumber}</span>
                        <span>•</span>
                        <span>القاعة: {h.hall}</span>
                      </div>

                      {/* Intelligent Google Maps travel section */}
                      <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--accent)]/40 p-2.5 text-[11px]">
                        <div className="flex items-center justify-between gap-1.5 mb-1.5 border-b border-[var(--border)]/60 pb-1.5">
                          <div className="flex items-center gap-1 text-[var(--axia-gold)]">
                            <Navigation className="size-3.5 rotate-45" />
                            <span className="font-bold">ملاحة ذكية ومواقيت حركة المرور</span>
                          </div>
                          <span className="text-[9px] text-[var(--text-muted)] font-mono">
                            {travel?.source || "تقديرات حيّة"}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-muted)]">زمن السير المتوقع:</span>
                            <span className="font-bold text-[var(--text)] flex items-center gap-1">
                              <Car className="size-3 text-emerald-500" />
                              <span>{travelText}</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between bg-[var(--axia-gold)]/5 border border-[var(--axia-gold)]/20 rounded-lg p-1.5 mt-1">
                            <span className="text-[var(--text-muted)] font-medium">موعد التحرك المقترح:</span>
                            <span className="font-black text-xs text-[var(--axia-gold)] flex items-center gap-1">
                              <MapPin className="size-3" />
                              <span>{departureText}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Manual Push Simulation Trigger */}
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-[var(--border)]/40">
                        <span className="text-[9px] text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
                          انقر لتفاصيل الرول والمرافعة &larr;
                        </span>

                        {permissionStatus === "granted" ? (
                          <button
                            type="button"
                            onClick={handleTestHearingNotification}
                            className="inline-flex items-center gap-1 rounded-lg bg-[var(--axia-gold)]/10 border border-[var(--axia-gold)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--axia-gold)] hover:bg-[var(--axia-gold)] hover:text-black transition-colors cursor-pointer"
                            title="إرسال إشعار تذكير مكتبي فوري لهذه الجلسة"
                          >
                            <Send className="size-2.5" />
                            <span>تنبيه فوري (اختبار)</span>
                          </button>
                        ) : (
                          <span className="text-[9px] text-[var(--text-muted)]">فعّل الإشعارات لتلقي تنبيهات التحرك</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              upcomingDeadlines.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="grid size-12 place-items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-3">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text)]">
                    لا توجد مهام تقترب مواعيدها خلال الـ 24 ساعة القادمة
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 max-w-[240px]">
                    جميع مواعيد سقوط الطعون وإعلانات قلم المحضرين مسددة ومنتظمة في موعدها.
                  </p>
                </div>
              ) : (
                upcomingDeadlines.map(({ task, remainingText, badgeColorClass }) => {
                  const isJustCompleted = completedNotificationId === task.id;

                  return (
                    <div
                      key={task.id}
                      id={`notification-task-${task.id}`}
                      onClick={handleTaskClick}
                      className="group relative cursor-pointer p-3.5 transition-colors hover:bg-[var(--accent-hover)] text-right"
                    >
                      {/* Top Row: Category + Remaining Time Pill */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)] border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                            {task.category}
                          </span>
                          {task.priority.includes("حرجة") && (
                            <span className="rounded-md bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-500">
                              ميعاد سقوط
                            </span>
                          )}
                        </div>

                        {/* Remaining hours badge */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeColorClass}`}
                        >
                          <Clock className="size-3" />
                          <span>{remainingText}</span>
                        </span>
                      </div>

                      {/* Task Title */}
                      <h4 className="font-semibold text-xs text-[var(--text)] group-hover:text-[var(--axia-gold)] transition-colors line-clamp-2 leading-relaxed">
                        {task.title}
                      </h4>

                      {/* Meta Details: Case Number & Court/Office */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
                        {task.matterCaseNumber && (
                          <div className="flex items-center gap-1">
                            <Scale className="size-3 text-[var(--axia-gold)]" />
                            <span className="font-mono text-[10px]">{task.matterCaseNumber}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Building2 className="size-3" />
                          <span className="truncate max-w-[140px]">{task.courtOrBailiffOffice}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="size-3" />
                          <span>{task.assignedTo.split(" ")[0]} {task.assignedTo.split(" ")[1] || ""}</span>
                        </div>
                      </div>

                      {/* Quick Complete Button */}
                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[var(--border)]">
                        <span className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
                          انقر للتفاصيل والتنفيذ &larr;
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleQuickComplete(e, task.id)}
                          disabled={isJustCompleted}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all ${
                            isJustCompleted
                              ? "bg-emerald-500 text-white"
                              : "border border-[var(--border)] bg-[var(--panel)] text-[var(--text-muted)] hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-500"
                          }`}
                          title="تحديد كمكتملة الآن"
                        >
                          <Check className="size-3" />
                          <span>{isJustCompleted ? "تم الإنجاز" : "إتمام المهمة"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border)] bg-[var(--accent)]/40 p-2.5">
            <button
              type="button"
              id="notifications-view-all-tasks-button"
              onClick={handleTaskClick}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] py-2 text-xs font-semibold text-[var(--text)] shadow-sm hover:border-[var(--axia-gold)] hover:text-[var(--axia-gold)] transition-colors"
            >
              <span>فتح جدول المواعيد وقلم المحضرين بالكامل</span>
              <ArrowLeft className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
