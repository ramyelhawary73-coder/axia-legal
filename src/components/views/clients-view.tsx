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
  CreditCard,
  X
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
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
            <Users className="size-4" />
            <span>سجل الموكلين والشركات</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            إدارة الموكلين والتوكيلات الرسمية
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            أرشيف التوكيلات القضائية، أرقام السجلات التجارية، والمتابعة المالية
          </p>
        </div>

        <button
          onClick={() => setIsNewClientOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-[#a77e16] px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:brightness-110"
        >
          <Plus className="size-4" />
          <span>إضافة موكل / شركة جديدة</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#0d1726] p-4 sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute right-3.5 top-3 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، رقم الهاتف، أو رقم التوكيل الرسمي..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/25 pr-10 pl-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[var(--axia-gold)] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-slate-200 focus:border-[var(--axia-gold)] focus:outline-none"
          >
            <option value="all">كافة التصنيفات (شركات وأفراد)</option>
            <option value="شركة / مؤسسة">شركات ومؤسسات تجارية</option>
            <option value="فرد / شخص طبيعي">أفراد وأشخاص طبيعيين</option>
          </select>
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0d1726] p-5 shadow-lg transition hover:border-[var(--axia-gold)]/40 hover:bg-[#111e33]"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="grid size-9 place-items-center rounded-xl bg-white/5 border border-white/10 text-[var(--axia-gold-light)]">
                    {client.type === "شركة / مؤسسة" ? (
                      <Building2 className="size-4" />
                    ) : (
                      <User className="size-4" />
                    )}
                  </div>
                  <div>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      {client.type}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                  <ShieldCheck className="size-3" />
                  توكيل ساري
                </span>
              </div>

              {/* Client Name */}
              <h3 className="mt-3 text-sm font-bold text-white leading-snug">
                {client.name}
              </h3>
              <p className="mt-1 text-[11px] text-slate-400 font-mono">
                {client.nationalIdOrCr}
              </p>

              {/* Power of Attorney (التوكيل الرسمي) */}
              <div className="mt-4 rounded-xl border border-[var(--axia-gold-dim)] bg-[var(--axia-gold)]/5 p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-[var(--axia-gold-light)] font-bold text-[11px]">
                  <FileCheck className="size-3.5" />
                  <span>بيانات التوكيل الرسمي:</span>
                </div>
                <p className="text-white font-medium text-[11px]">{client.poaNumber}</p>
                <p className="text-slate-400 text-[10px]">{client.poaOffice}</p>
              </div>

              {/* Contact Info */}
              <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-slate-400" />
                  <span dir="ltr" className="font-mono text-left">{client.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-slate-400" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-slate-400" />
                  <span className="truncate text-slate-400 text-[11px]">{client.address}</span>
                </div>
              </div>
            </div>

            {/* Financial Ledger Mini Summary */}
            <div className="mt-5 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">القضايا النشطة:</span>
                <span className="font-bold text-white">{client.activeMattersCount} قضايا</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-slate-400">المسدد / المتبقي:</span>
                <span className="text-[11px]">
                  <span className="text-emerald-400 font-semibold">{client.totalPaid}</span>
                  <span className="text-slate-500 mx-1">/</span>
                  <span className="text-amber-400 font-semibold">{client.balanceDue}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Client Modal */}
      {isNewClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[var(--axia-gold-dim)] bg-[#0d1726] p-6 lg:p-8 shadow-2xl">
            <button
              onClick={() => setIsNewClientOpen(false)}
              className="absolute left-6 top-6 grid size-8 place-items-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
              <Plus className="size-4" />
              <span>إدراج موكل جديد في المنظومة</span>
            </div>
            
            <h2 className="mt-1 text-xl font-bold text-white">تسجيل بيانات موكل / شركة</h2>
            
            <form onSubmit={handleCreateClient} className="mt-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">اسم الموكل أو المنشأة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة القاهرة للتطوير والاستثمار العقاري"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">نوع الكيان</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as Client["type"])}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                  >
                    <option value="شركة / مؤسسة">شركة / مؤسسة تجارية</option>
                    <option value="فرد / شخص طبيعي">فرد / شخص طبيعي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">رقم السجل التجاري أو الرقم القومي</label>
                  <input
                    type="text"
                    placeholder="س.ت: ٥٤٨١٢٣ أو الرقم القومي"
                    value={nationalIdOrCr}
                    onChange={(e) => setNationalIdOrCr(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">رقم الهاتف والتواصل</label>
                  <input
                    type="text"
                    required
                    placeholder="+20 100 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">البريد الإلكتروني</label>
                  <input
                    type="email"
                    placeholder="legal@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">رقم التوكيل الرسمي وحرفه</label>
                  <input
                    type="text"
                    placeholder="مثال: ٥٤١ / ب لسنة ٢٠٢٥ عام قضايا"
                    value={poaNumber}
                    onChange={(e) => setPoaNumber(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">مكتب التوثيق (الشهر العقاري)</label>
                  <input
                    type="text"
                    placeholder="مثال: توثيق قصر النيل المطور"
                    value={poaOffice}
                    onChange={(e) => setPoaOffice(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">العنوان والمقر القانوني</label>
                <input
                  type="text"
                  placeholder="العنوان التفصيلي"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewClientOpen(false)}
                  className="rounded-xl bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/15"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-[#a77e16] px-5 py-2 font-bold text-slate-950 hover:brightness-110"
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
