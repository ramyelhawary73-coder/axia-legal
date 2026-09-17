"use client";

import { useState } from "react";
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
  ChevronDown
} from "lucide-react";
import { mockClients } from "@/lib/mock-legal-data";
import { Client } from "@/types/legal";

export function ClientsView() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);

  // New Client Form
  const [name, setName] = useState("");
  const [type, setType] = useState<Client["type"]>("شركة / مؤسسة");
  const [nationalIdOrCr, setNationalIdOrCr] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [poaNumber, setPoaNumber] = useState("");
  const [poaOffice, setPoaOffice] = useState("");
  const [address, setAddress] = useState("");

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newClient: Client = {
      id: `CLI-${Date.now()}`,
      name,
      type,
      nationalIdOrCr: nationalIdOrCr || "قيد الاستيفاء",
      phone,
      email: email || "info@client.com",
      poaNumber: poaNumber || "توكيل قيد الإيداع",
      poaOffice: poaOffice || "مكتب توثيق النموذجي",
      poaExpiry: "ساري",
      activeMattersCount: 1,
      totalPaid: "٠ ج.م",
      balanceDue: "٠ ج.م",
      address: address || "القاهرة، جمهورية مصر العربية",
    };

    setClients([newClient, ...clients]);
    setIsNewClientOpen(false);
    setName("");
    setPhone("");
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.includes(search) ||
      client.phone.includes(search) ||
      client.poaNumber.includes(search);
    const matchesType = filterType === "all" || client.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col h-full max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--border)] shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            سجل الموكلين والشركات
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Users className="size-3.5" />
            إدارة الموكلين، أرشيف التوكيلات الرسمية، والمتابعة المالية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewClientOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--text)] px-3 py-1.5 text-xs font-medium text-[var(--bg)] shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="size-3.5" />
            <span>إضافة موكل جديد</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 py-3 shrink-0">
        <div className="relative flex-1 min-w-[250px] max-w-sm">
          <Search className="absolute right-2.5 top-1.5 size-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="بحث بالاسم، رقم الهاتف، أو التوكيل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] pr-8 pl-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
          />
        </div>

        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="appearance-none rounded-md border border-[var(--border)] bg-[var(--panel)] pr-8 pl-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
          >
            <option value="all">كافة التصنيفات</option>
            <option value="شركة / مؤسسة">شركات ومؤسسات</option>
            <option value="فرد / شخص طبيعي">أفراد</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-2 size-3 text-[var(--text-muted)] pointer-events-none" />
        </div>
      </div>

      {/* Clients Table */}
      <div className="flex-1 overflow-hidden flex flex-col rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right text-[11px]">
            <thead className="sticky top-0 bg-[var(--panel)] z-10 shadow-[0_1px_0_var(--border)]">
              <tr className="text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                <th className="px-4 py-2 font-medium w-[25%]">اسم الموكل / النوع</th>
                <th className="px-4 py-2 font-medium w-[20%]">بيانات التواصل</th>
                <th className="px-4 py-2 font-medium w-[25%]">بيانات التوكيل الرسمي</th>
                <th className="px-4 py-2 font-medium w-[15%]">القضايا النشطة</th>
                <th className="px-4 py-2 font-medium w-[15%]">الموقف المالي (مسدد / متبقي)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredClients.map((client) => (
                <tr 
                  key={client.id} 
                  className="hover:bg-[var(--accent)] transition-colors group cursor-default"
                >
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-start gap-2.5">
                      <div className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--bg)] border border-[var(--border)] text-[var(--text-muted)]">
                        {client.type === "شركة / مؤسسة" ? <Building2 className="size-3.5" /> : <User className="size-3.5" />}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--text)] text-xs mb-0.5">{client.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">{client.nationalIdOrCr}</div>
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
                    <div className="flex items-center gap-1.5 mb-1 text-[var(--text)] font-medium">
                      <FileCheck className="size-3 text-[var(--gold)]" />
                      {client.poaNumber}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mr-4.5 mb-1">{client.poaOffice}</div>
                    <div className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400 mr-4.5 border border-emerald-500/20">
                      <ShieldCheck className="size-2.5" />
                      توكيل ساري
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[10px] font-bold text-[var(--text)]">
                      {client.activeMattersCount}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--text-muted)]">المسدد:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{client.totalPaid}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--text-muted)]">المتبقي:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">{client.balanceDue}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
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
        <div className="border-t border-[var(--border)] bg-[var(--bg)]/30 px-4 py-2 text-[10px] text-[var(--text-muted)]">
          إجمالي الموكلين: {filteredClients.length}
        </div>
      </div>

      {/* New Client Modal */}
      {isNewClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--panel-glass)] backdrop-blur-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <button
              onClick={() => setIsNewClientOpen(false)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              <Plus className="size-4 text-[var(--text)]" />
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
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">نوع الكيان</label>
                  <div className="relative">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as Client["type"])}
                      className="appearance-none w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                    >
                      <option value="شركة / مؤسسة">شركة / مؤسسة تجارية</option>
                      <option value="فرد / شخص طبيعي">فرد / شخص طبيعي</option>
                    </select>
                    <ChevronDown className="absolute left-2.5 top-2.5 size-3 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">رقم السجل التجاري / الرقم القومي</label>
                  <input
                    type="text"
                    placeholder="س.ت: ٥٤٨١٢٣ أو الرقم القومي"
                    value={nationalIdOrCr}
                    onChange={(e) => setNationalIdOrCr(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">رقم الهاتف والتواصل</label>
                  <input
                    type="text"
                    required
                    placeholder="+20 100 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">البريد الإلكتروني</label>
                  <input
                    type="email"
                    placeholder="legal@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">رقم التوكيل الرسمي وحرفه</label>
                  <input
                    type="text"
                    placeholder="مثال: ٥٤١ / ب لسنة ٢٠٢٥ عام قضايا"
                    value={poaNumber}
                    onChange={(e) => setPoaNumber(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">مكتب التوثيق (الشهر العقاري)</label>
                  <input
                    type="text"
                    placeholder="مثال: توثيق قصر النيل المطور"
                    value={poaOffice}
                    onChange={(e) => setPoaOffice(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-medium">العنوان والمقر القانوني</label>
                <input
                  type="text"
                  placeholder="العنوان التفصيلي"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                />
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewClientOpen(false)}
                  className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 py-2 font-medium text-[var(--text)] hover:bg-[var(--accent)] transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[var(--text)] px-4 py-2 font-medium text-[var(--bg)] hover:opacity-90 transition-opacity"
                >
                  حفظ الموكل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
