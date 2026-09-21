"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileCheck, 
  Plus, 
  Search, 
  ShieldCheck, 
  X,
  ChevronDown,
  CheckCircle2,
  ChevronLeft
} from "lucide-react";
import { Client, Matter } from "@/types/legal";
import {
  createPersistentClient,
  loadPersistentClients,
} from "@/lib/clients-client";
import {
  createPersistentMatter,
  loadMattersWorkspace,
} from "@/lib/matters-client";
import { ClientDetailDashboard } from "@/components/client-detail-dashboard";
import { useActionContextMenu } from "@/components/action-context-menu";

interface ClientsViewProps {
  selectedClientId?: string | null;
  onCloseClientDashboard?: () => void;
  onWorkspaceChanged?: () => void | Promise<void>;
}

export function ClientsView({
  selectedClientId,
  onCloseClientDashboard,
  onWorkspaceChanged,
}: ClientsViewProps = {}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [localSelectedClientId, setLocalSelectedClientId] = useState<string | null>(null);
  const effectiveClientId = selectedClientId ?? localSelectedClientId;
  const selectedClient = effectiveClientId ? clients.find((c) => c.id === effectiveClientId) || null : null;
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const clientActionMenu = useActionContextMenu();

  // New Client Form
  const [name, setName] = useState("");
  const [type, setType] = useState<Client["type"]>("شركة / مؤسسة");
  const [nationalIdOrCr, setNationalIdOrCr] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    let cancelled = false;

    void Promise.all([loadPersistentClients(), loadMattersWorkspace()])
      .then(([loadedClients, workspace]) => {
        if (cancelled) return;
        setClients(loadedClients);
        setMatters(workspace.matters);
        setSyncError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSyncError(
          error instanceof Error ? error.message : "تعذر تحميل بيانات الموكلين.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSavingClient) return;

    setIsSavingClient(true);
    setSyncError(null);

    try {
      const newClient = await createPersistentClient({
        name: name.trim(),
        type,
        nationalIdOrCr: nationalIdOrCr.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });

      setClients((current) => [newClient, ...current]);
      await onWorkspaceChanged?.();
      setIsNewClientOpen(false);
      setName("");
      setPhone("");
      setNationalIdOrCr("");
      setEmail("");
      setAddress("");
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "تعذر حفظ بيانات الموكل.",
      );
    } finally {
      setIsSavingClient(false);
    }
  };

  const getClientActions = (client: Client) => [
    {
      id: "open",
      label: "فتح لوحة الموكل",
      onSelect: () => setLocalSelectedClientId(client.id),
    },
    {
      id: "copy-phone",
      label: "نسخ رقم الهاتف",
      disabled: !client.phone || client.phone === "غير مسجل",
      onSelect: async () => {
        await navigator.clipboard.writeText(client.phone);
      },
    },
    {
      id: "copy-email",
      label: "نسخ البريد الإلكتروني",
      disabled: !client.email || client.email === "غير مسجل",
      onSelect: async () => {
        await navigator.clipboard.writeText(client.email);
      },
    },
  ];

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.includes(search) ||
      client.phone.includes(search) ||
      client.nationalIdOrCr.includes(search);
    const matchesType = filterType === "all" || client.type === filterType;
    return matchesSearch && matchesType;
  });

  // If a client is selected, render the Client Detail Dashboard
  if (selectedClient) {
    return (
      <ClientDetailDashboard
        client={selectedClient}
        clients={clients}
        matters={matters}
        onSelectClient={(c) => setLocalSelectedClientId(c.id)}
        onBack={() => {
          setLocalSelectedClientId(null);
          onCloseClientDashboard?.();
        }}
        onAddNewMatter={async (newMatter) => {
          const persistedMatter = await createPersistentMatter({
            caseNumber: newMatter.caseNumber,
            title: newMatter.title,
            court: newMatter.court === "غير مسجل" ? undefined : newMatter.court,
            category: newMatter.category,
            clientId: selectedClient.id,
            caseYear: newMatter.year,
            circuit:
              newMatter.circuit === "غير مسجل" ? undefined : newMatter.circuit,
            clientRole:
              newMatter.clientRole === "غير مسجل" ? undefined : newMatter.clientRole,
            filingDate: newMatter.filingDate,
          });
          setMatters((current) => [persistedMatter, ...current]);
          await onWorkspaceChanged?.();
          return persistedMatter;
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--border)] shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            سجل الموكلين والشركات
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Users className="size-3.5" />
            إدارة الموكلين وربطهم بالقضايا المحفوظة فعلياً في AXIA
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewClientOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--text)] px-3.5 py-2 text-xs font-bold text-[var(--bg)] shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="size-3.5" />
            <span>إضافة موكل جديد</span>
          </button>
        </div>
      </div>

      {syncError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
          {syncError}
        </div>
      )}
      {isLoading && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 text-xs text-[var(--text-muted)]">
          جارٍ تحميل الموكلين والقضايا المحفوظة...
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[250px] max-w-sm">
            <Search className="absolute right-2.5 top-2 size-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="بحث بالاسم، رقم الهاتف، أو التوكيل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] pr-8 pl-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--axia-gold)] focus:outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none rounded-md border border-[var(--border)] bg-[var(--panel)] pr-3 pl-8 py-1.5 text-xs text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none cursor-pointer"
            >
              <option value="all">كافة التصنيفات</option>
              <option value="شركة / مؤسسة">شركات ومؤسسات</option>
              <option value="فرد / شخص طبيعي">أفراد</option>
            </select>
            <ChevronDown className="absolute left-2.5 top-2.5 size-3 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>

        <div className="text-xs text-[var(--text-muted)] hidden md:flex items-center gap-1.5">
          <span>نصيحة:</span>
          <span className="text-[var(--text)] font-medium">اضغط على أي موكل لعرض لوحة بياناته وتاريخ قضاياه المفتوحة والمغلقة</span>
        </div>
      </div>

      {/* Clients Table */}
      <div className="flex-1 overflow-hidden flex flex-col rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right text-[11px]">
            <thead className="sticky top-0 bg-[var(--panel)] z-10 shadow-[0_1px_0_var(--border)]">
              <tr className="text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                <th className="px-4 py-2.5 font-medium w-[26%]">اسم الموكل / النوع</th>
                <th className="px-4 py-2.5 font-medium w-[18%]">بيانات التواصل</th>
                <th className="px-4 py-2.5 font-medium w-[22%]">بيانات التوكيل الرسمي</th>
                <th className="px-4 py-2.5 font-medium w-[16%]">سجل القضايا (مفتوحة / مغلقة)</th>
                <th className="px-4 py-2.5 font-medium w-[18%]">الموقف المالي والإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredClients.map((client) => {
                // Compute open and closed matters for this client
                const clientMatters = matters.filter((m) => {
                  const matchId = m.clientId && m.clientId === client.id;
                  const matchName = m.clientName && (
                    m.clientName.includes(client.name) || client.name.includes(m.clientName)
                  );
                  return matchId || matchName;
                });

                const openCount = clientMatters.filter(
                  (m) => m.status === "مفتوحة" || (!m.status && m.stage !== "محكوم فيها")
                ).length;
                const closedCount = clientMatters.filter(
                  (m) => m.status === "مغلقة" || m.stage === "محكوم فيها"
                ).length;

                return (
                  <tr 
                    key={client.id}
                    {...clientActionMenu.bind(
                      getClientActions(client),
                      `الموكل ${client.name}`,
                    )}
                    onClick={() => setLocalSelectedClientId(client.id)}
                    className="hover:bg-[var(--accent)]/70 transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-start gap-2.5">
                        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--axia-gold)] group-hover:border-[var(--axia-gold)] transition">
                          {client.type === "شركة / مؤسسة" ? <Building2 className="size-4" /> : <User className="size-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text)] text-xs mb-0.5 group-hover:text-[var(--axia-gold)] transition">
                            {client.name}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">{client.nationalIdOrCr}</div>
                          <span className="inline-block mt-1 text-[9px] rounded bg-[var(--border)]/60 px-1.5 py-0.2 text-[var(--text-muted)]">
                            {client.type}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[var(--text)]">
                          <Phone className="size-3 text-[var(--text-muted)]" />
                          <span dir="ltr" className="font-mono text-left">{client.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--text)]">
                          <Mail className="size-3 text-[var(--text-muted)]" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                          <MapPin className="size-3" />
                          <span className="truncate text-[10px]">{client.address}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-1.5 mb-1 text-[var(--text)] font-semibold font-mono text-[10px]">
                        <FileCheck className="size-3 text-[var(--axia-gold)]" />
                        {client.poaNumber}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mr-4 mb-1">{client.poaOffice}</div>
                      <div className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-500 mr-4 border border-emerald-500/20">
                        <ShieldCheck className="size-2.5" />
                        {client.poaExpiry === "غير مسجل" ? "بيانات التوكيل غير مسجلة" : client.poaExpiry}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-400"></span>
                            <span>{openCount} مفتوحة</span>
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                            <CheckCircle2 className="size-2.5" />
                            <span>{closedCount} مغلقة</span>
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          إجمالي: {clientMatters.length} دعاوى مسجلة
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--text-muted)]">المسدد:</span>
                          <span className="font-semibold text-emerald-500">{client.totalPaid}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--text-muted)]">المتبقي:</span>
                          <span className="font-semibold text-amber-500">{client.balanceDue}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocalSelectedClientId(client.id);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[10px] font-bold text-[var(--text)] group-hover:border-[var(--axia-gold)] group-hover:text-[var(--axia-gold)] transition shadow-sm"
                          >
                            <span>عرض لوحة الموكل</span>
                            <ChevronLeft className="size-3" />
                          </button>
                          {clientActionMenu.triggerButton(
                            getClientActions(client),
                            `الموكل ${client.name}`,
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)] text-xs">
                    لا يوجد موكلين مطابقين للبحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--border)] bg-[var(--bg)]/30 px-4 py-2.5 text-[10px] text-[var(--text-muted)] flex justify-between items-center">
          <span>إجمالي الموكلين: {filteredClients.length}</span>
          <span className="font-medium text-[var(--text)]">مكتب أكسيا للمحاماة - الإدارة القانونية الرقمية</span>
        </div>
      </div>

      {/* New Client Modal */}
      {isNewClientOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="relative h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-xl overflow-y-auto rounded-t-[28px] sm:rounded-3xl border-t sm:border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <button
              onClick={() => setIsNewClientOpen(false)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold)] uppercase tracking-wider mb-2">
              <Plus className="size-4" />
              <span>إدراج موكل جديد</span>
            </div>
            
            <h2 className="text-xl font-bold text-[var(--text)] border-b border-[var(--border)] pb-4">تسجيل بيانات موكل / شركة</h2>
            
            <form onSubmit={handleCreateClient} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-medium">اسم الموكل أو المنشأة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة القاهرة للتطوير والاستثمار العقاري"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">نوع الكيان</label>
                  <div className="relative">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as Client["type"])}
                      className="appearance-none w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                    >
                      <option value="شركة / مؤسسة">شركة / مؤسسة تجارية</option>
                      <option value="فرد / شخص طبيعي">فرد / شخص طبيعي</option>
                    </select>
                    <ChevronDown className="absolute left-2.5 top-2.5 size-3 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">رقم السجل التجاري أو الرقم القومي</label>
                  <input
                    type="text"
                    placeholder="مثال: س.ت ٥١٩٣٠٢ / ر.ق ٢٨٠٠..."
                    value={nationalIdOrCr}
                    onChange={(e) => setNationalIdOrCr(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">رقم الهاتف الأساسي</label>
                  <input
                    type="text"
                    required
                    placeholder="+20 100 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">البريد الإلكتروني</label>
                  <input
                    type="email"
                    placeholder="client@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--accent)]/40 p-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
                بيانات التوكيلات لها سجل مستقل ولم يتم ربط واجهته بعد. سيتم حفظ الموكل الآن بدون اختلاق رقم توكيل أو مكتب توثيق، وستظهر القيم كـ«غير مسجل».
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-medium">العنوان القانوني المختار للمراسلات</label>
                <input
                  type="text"
                  placeholder="مثال: ١٤ شارع قصر النيل، القاهرة"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewClientOpen(false)}
                  className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--accent)] transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingClient}
                  className="rounded-md bg-[var(--text)] px-4 py-2 text-xs font-bold text-[var(--bg)] shadow-md hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingClient ? "جارٍ الحفظ..." : "حفظ وتسجيل الموكل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {clientActionMenu.menuNode}
    </div>
  );
}
