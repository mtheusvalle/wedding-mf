"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Guest {
  id: string;
  name: string;
  phone: string;
  code: string;
  allowedAdditionalGuests: number;
  confirmedAdditionalGuests: number;
  confirmedNames: string | null;
  status: string;
  notes: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

interface Gift {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  active: boolean;
}

interface Transaction {
  id: string;
  giftId: string;
  gift: Gift;
  guestId: string | null;
  guest: Guest | null;
  buyerName: string;
  buyerPhone: string | null;
  buyerEmail: string | null;
  message: string | null;
  amount: number;
  status: string;
  gateway: string;
  transactionId: string | null;
  createdAt: string;
}

interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
  active: boolean;
  createdAt: string;
}

interface WeddingConfig {
  brideName: string;
  groomName: string;
  weddingDate: string;
  ceremonyPlace: string;
  ceremonyAddress: string;
  ceremonyMapsUrl: string;
  partyPlace: string;
  partyAddress: string;
  partyMapsUrl: string;
  storyTitle: string;
  storyText: string;
  storyImage: string;
  heroImage: string;
  pixKey: string;
  pixQrCode: string;
  timeline: string;
}

interface AdminDashboardProps {
  initialGuests: Guest[];
  initialGifts: Gift[];
  initialTransactions: Transaction[];
  initialConfig: WeddingConfig;
  initialGallery: GalleryImage[];
}

export default function AdminDashboard({
  initialGuests,
  initialGifts,
  initialTransactions,
  initialConfig,
  initialGallery,
}: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "guests" | "gifts" | "gallery" | "config">("dashboard");

  // Data states
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [gifts, setGifts] = useState<Gift[]>(initialGifts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [config, setConfig] = useState<WeddingConfig>(initialConfig);
  const [gallery, setGallery] = useState<GalleryImage[]>(initialGallery);

  // Upload/library states
  const [mediaLibrary, setMediaLibrary] = useState<string[]>([]);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  // Global operations loading
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Copy success message status
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refs for hidden file inputs to trigger uploads
  const configUploadRef = useRef<HTMLInputElement>(null);
  const heroUploadRef = useRef<HTMLInputElement>(null);
  const pixUploadRef = useRef<HTMLInputElement>(null);
  const giftUploadRef = useRef<HTMLInputElement>(null);
  const galleryUploadRef = useRef<HTMLInputElement>(null);
  const mediaLibraryUploadRef = useRef<HTMLInputElement>(null);
  const guestImportRef = useRef<HTMLInputElement>(null);

  // --- TAB 2: GUEST MODAL STATES ---
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [guestForm, setGuestForm] = useState({
    name: "",
    phone: "",
    code: "",
    allowedAdditionalGuests: 0,
    confirmedAdditionalGuests: 0,
    confirmedNames: "",
    status: "PENDING",
    notes: "",
  });

  const [importingGuests, setImportingGuests] = useState(false);

  // --- TAB 3: GIFT MODAL STATES ---
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [giftForm, setGiftForm] = useState({
    name: "",
    description: "",
    image: "",
    price: 0, // In standard BRL value, e.g. 250.00
    active: true,
  });

  // --- TAB 4: GALLERY MODAL STATES ---
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [editingGalleryImage, setEditingGalleryImage] = useState<GalleryImage | null>(null);
  const [galleryForm, setGalleryForm] = useState({
    url: "",
    caption: "",
    active: true,
  });

  // --- CONFIG: TIMELINE STATE ---
  const [timelineItems, setTimelineItems] = useState<{ time: string; title: string; description: string }[]>(
    JSON.parse(initialConfig.timeline)
  );

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper formatting BRL cents to string
  const formatCurrency = (amountCents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amountCents / 100);
  };

  // Helper copy link
  const copyInviteLink = (guestCode: string, guestId: string) => {
    const link = `${window.location.origin}/confirmar-presenca/${guestCode}`;
    navigator.clipboard.writeText(link);
    setCopiedId(guestId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- REFRESH DATA API ---
  const refreshGuests = async () => {
    const res = await fetch("/api/admin/guests");
    if (res.ok) {
      const data = await res.json();
      setGuests(data);
    }
  };

  const refreshGiftsData = async () => {
    const res = await fetch("/api/admin/gifts");
    if (res.ok) {
      const data = await res.json();
      setGifts(data.gifts);
      setTransactions(data.transactions);
    }
  };

  const refreshGalleryData = async () => {
    const res = await fetch("/api/admin/gallery");
    if (res.ok) {
      const data = await res.json();
      setGallery(data);
    }
  };

  const loadMediaLibrary = async () => {
    const res = await fetch("/api/admin/upload");
    if (res.ok) {
      const data = await res.json();
      setMediaLibrary(data);
    }
  };

  // --- IMAGE UPLOAD HELPER ---
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onUploadSuccess: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao fazer upload do arquivo.");
      }

      if (data.url) {
        onUploadSuccess(data.url);
        // Clear input value to allow uploading the same file again
        e.target.value = "";
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Falha no upload.");
      alert(err.message || "Falha no upload.");
    } finally {
      setLoading(false);
    }
  };

  // --- GUEST CRUD OPERATIONS ---
  const openAddGuestModal = () => {
    setEditingGuest(null);
    setGuestForm({
      name: "",
      phone: "",
      code: "",
      allowedAdditionalGuests: 0,
      confirmedAdditionalGuests: 0,
      confirmedNames: "",
      status: "PENDING",
      notes: "",
    });
    setGuestModalOpen(true);
  };

  const openEditGuestModal = (g: Guest) => {
    setEditingGuest(g);
    setGuestForm({
      name: g.name,
      phone: g.phone,
      code: g.code,
      allowedAdditionalGuests: g.allowedAdditionalGuests,
      confirmedAdditionalGuests: g.confirmedAdditionalGuests,
      confirmedNames: g.confirmedNames || "",
      status: g.status,
      notes: g.notes || "",
    });
    setGuestModalOpen(true);
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const isEdit = !!editingGuest;
      const url = "/api/admin/guests";
      const method = isEdit ? "PUT" : "POST";
      
      const payload = isEdit 
        ? { id: editingGuest.id, ...guestForm }
        : guestForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar convidado.");
      }

      setGuestModalOpen(false);
      await refreshGuests();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este convidado?")) return;
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/guests?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao deletar convidado.");
      }

      await refreshGuests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGuestImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingGuests(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/guests/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao importar convidados.");
      }

      alert(data.message);
      await refreshGuests();
    } catch (err: any) {
      alert(err.message || "Erro ao processar importação.");
    } finally {
      setImportingGuests(false);
      if (guestImportRef.current) {
        guestImportRef.current.value = "";
      }
    }
  };

  // --- GIFT CRUD OPERATIONS ---
  const openAddGiftModal = () => {
    setEditingGift(null);
    setGiftForm({
      name: "",
      description: "",
      image: "",
      price: 0,
      active: true,
    });
    setGiftModalOpen(true);
  };

  const openEditGiftModal = (g: Gift) => {
    setEditingGift(g);
    setGiftForm({
      name: g.name,
      description: g.description,
      image: g.image,
      price: g.price / 100, // Show in normal BRL values to users
      active: g.active,
    });
    setGiftModalOpen(true);
  };

  const handleGiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const isEdit = !!editingGift;
      const url = "/api/admin/gifts";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        name: giftForm.name,
        description: giftForm.description,
        image: giftForm.image,
        price: Math.round(giftForm.price * 100), // Convert to cents for API
        active: giftForm.active,
      };

      const finalPayload = isEdit ? { id: editingGift.id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar presente.");
      }

      setGiftModalOpen(false);
      await refreshGiftsData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGift = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este presente?")) return;

    try {
      const res = await fetch(`/api/admin/gifts?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao excluir presente.");
      }

      await refreshGiftsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmTransaction = async (id: string, newStatus: "PAID" | "PENDING" | "CANCELLED") => {
    if (newStatus === "PAID" && !confirm("Deseja confirmar que recebeu o Pix para esta contribuição?")) return;
    if (newStatus === "CANCELLED" && !confirm("Deseja cancelar esta transação?")) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/transactions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id, status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao atualizar status da transação.");
      }

      await refreshGiftsData(); // Re-fetch gifts and transactions
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- GALLERY CRUD OPERATIONS ---
  const openAddGalleryModal = () => {
    setEditingGalleryImage(null);
    setGalleryForm({
      url: "",
      caption: "",
      active: true,
    });
    setGalleryModalOpen(true);
  };

  const openEditGalleryModal = (img: GalleryImage) => {
    setEditingGalleryImage(img);
    setGalleryForm({
      url: img.url,
      caption: img.caption || "",
      active: img.active,
    });
    setGalleryModalOpen(true);
  };

  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const isEdit = !!editingGalleryImage;
      const url = "/api/admin/gallery";
      const method = isEdit ? "PUT" : "POST";

      const payload = isEdit
        ? { id: editingGalleryImage.id, ...galleryForm }
        : galleryForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar imagem.");
      }

      setGalleryModalOpen(false);
      await refreshGalleryData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta foto da galeria?")) return;

    try {
      const res = await fetch(`/api/admin/gallery?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao excluir foto.");
      }

      await refreshGalleryData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- CONFIGURATION SAVE ---
  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          timeline: timelineItems,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar configurações.");
      }

      alert("Configurações salvas com sucesso!");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTimelineItem = (idx: number, field: string, val: string) => {
    const updated = [...timelineItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setTimelineItems(updated);
  };

  const addTimelineItem = () => {
    setTimelineItems([...timelineItems, { time: "00:00", title: "", description: "" }]);
  };

  const removeTimelineItem = (idx: number) => {
    setTimelineItems(timelineItems.filter((_, i) => i !== idx));
  };

  // --- METRIC CALCULATIONS FOR DASHBOARD ---
  const guestsCount = guests.length;
  
  const guestsConfirmed = guests.reduce(
    (acc, g) =>
      acc +
      (g.status === "CONFIRMED" ? 1 : 0) +
      (g.status === "CONFIRMED" ? g.confirmedAdditionalGuests : 0),
    0
  );

  const guestsDeclined = guests.filter((g) => g.status === "DECLINED").length;
  const guestsPending = guests.filter((g) => g.status === "PENDING").length;

  const totalRaisedCents = transactions
    .filter((t) => t.status === "PAID")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPendingCents = transactions
    .filter((t) => t.status === "PENDING")
    .reduce((acc, t) => acc + t.amount, 0);

  const paidTransactionsCount = transactions.filter((t) => t.status === "PAID").length;
  const averageTicketCents = paidTransactionsCount > 0 ? totalRaisedCents / paidTransactionsCount : 0;

  // Search/Filters states
  const [guestSearch, setGuestSearch] = useState("");
  const [guestFilter, setGuestFilter] = useState<"ALL" | "CONFIRMED" | "PENDING" | "DECLINED">("ALL");

  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
      g.phone.includes(guestSearch);

    const matchesFilter =
      guestFilter === "ALL" || g.status === guestFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-alt)" }}>
      {/* Top Navbar */}
      <header
        style={{
          height: "70px",
          backgroundColor: "var(--color-white)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="container container-admin" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--color-primary-dark)" }}>
            Painel do Casamento 💖
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={async () => {
                await loadMediaLibrary();
                setMediaLibraryOpen(true);
              }}
              style={{ border: "1px dashed var(--color-accent)", color: "var(--color-accent-dark)" }}
            >
              🖼️ Galeria de Mídias
            </button>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Noivos: {config.brideName} & {config.groomName}
            </span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="container container-admin" style={{ padding: "2.5rem 0" }}>
        
        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--color-border)",
            marginBottom: "2.5rem",
            gap: "1.5rem",
            overflowX: "auto",
            paddingBottom: "0.25rem"
          }}
        >
          {(["dashboard", "guests", "gifts", "gallery", "config"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "gallery") refreshGalleryData();
              }}
              style={{
                background: "none",
                border: "none",
                padding: "1rem 0.5rem",
                fontFamily: "var(--font-sans)",
                fontSize: "0.9rem",
                fontWeight: activeTab === tab ? "600" : "400",
                color: activeTab === tab ? "var(--color-primary)" : "var(--color-text-muted)",
                borderBottom: activeTab === tab ? "2px solid var(--color-primary)" : "2px solid transparent",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                transition: "var(--transition-fast)",
                whiteSpace: "nowrap"
              }}
            >
              {tab === "dashboard" && "Dashboard"}
              {tab === "guests" && "Convidados (RSVP)"}
              {tab === "gifts" && "Presentes & Caixa"}
              {tab === "gallery" && "Galeria de Fotos"}
              {tab === "config" && "Configurações"}
            </button>
          ))}
        </div>

        {/* --- TAB 1: DASHBOARD --- */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
              
              <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--color-accent)" }}>
                <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Total de Convites</h4>
                <div style={{ fontSize: "2rem", fontWeight: "600", marginTop: "0.5rem" }}>{guestsCount}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>famílias/convites cadastrados</div>
              </div>

              <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--color-success)" }}>
                <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Pessoas Confirmadas</h4>
                <div style={{ fontSize: "2rem", fontWeight: "600", marginTop: "0.5rem", color: "var(--color-success)" }}>{guestsConfirmed}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>considerando acompanhantes</div>
              </div>

              <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--color-warning)" }}>
                <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Aguardando RSVP</h4>
                <div style={{ fontSize: "2rem", fontWeight: "600", marginTop: "0.5rem", color: "var(--color-warning)" }}>{guestsPending}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>convites sem resposta</div>
              </div>

              <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--color-danger)" }}>
                <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Não Comparecem</h4>
                <div style={{ fontSize: "2rem", fontWeight: "600", marginTop: "0.5rem", color: "var(--color-danger)" }}>{guestsDeclined}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>convidados recusados</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
              
              <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--color-primary)" }}>
                <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Total Recebido</h4>
                <div style={{ fontSize: "2rem", fontWeight: "600", marginTop: "0.5rem", color: "var(--color-primary-dark)" }}>
                  {formatCurrency(totalRaisedCents)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                  {paidTransactionsCount} presente(s) pago(s)
                </div>
              </div>

              <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid #9ca3af" }}>
                <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Pendente no Caixa</h4>
                <div style={{ fontSize: "2rem", fontWeight: "600", marginTop: "0.5rem", color: "#4b5563" }}>
                  {formatCurrency(totalPendingCents)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>transações iniciadas</div>
              </div>

              <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--color-accent-dark)" }}>
                <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Ticket Médio</h4>
                <div style={{ fontSize: "2rem", fontWeight: "600", marginTop: "0.5rem" }}>
                  {formatCurrency(averageTicketCents)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>por presente recebido</div>
              </div>
            </div>

            {/* Quick overview of most chosen gifts */}
            <div className="card" style={{ padding: "2rem" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", marginBottom: "1.5rem" }}>Presentes Recebidos Recentes</h3>
              {transactions.filter((t) => t.status === "PAID").length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Nenhum presente recebido ainda. Divulgue a lista para os convidados! ❤️</p>
              ) : (
                <div className="table-wrapper" style={{ margin: 0 }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Presente</th>
                        <th>Comprador</th>
                        <th>Valor</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions
                        .filter((t) => t.status === "PAID")
                        .slice(0, 5)
                        .map((t) => (
                          <tr key={t.id}>
                            <td style={{ fontWeight: 500 }}>{t.gift.name}</td>
                            <td>{t.buyerName}</td>
                            <td style={{ color: "var(--color-primary-dark)", fontWeight: "600" }}>{formatCurrency(t.amount)}</td>
                            <td>{new Date(t.createdAt).toLocaleDateString("pt-BR")}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 2: GUESTS (RSVP CONTROL) --- */}
        {activeTab === "guests" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
              <div className="admin-search-bar" style={{ display: "flex", gap: "1rem", flexGrow: 1, maxWidth: "500px" }}>
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou telefone..."
                  className="form-control"
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  style={{ flexGrow: 1 }}
                />
                
                <select
                  className="form-control"
                  value={guestFilter}
                  onChange={(e) => setGuestFilter(e.target.value as any)}
                  style={{ width: "180px" }}
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="CONFIRMED">Confirmados</option>
                  <option value="PENDING">Pendentes</option>
                  <option value="DECLINED">Não Comparecem</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="file"
                  ref={guestImportRef}
                  style={{ display: "none" }}
                  accept=".xlsx, .xls"
                  onChange={handleGuestImport}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => guestImportRef.current?.click()}
                  disabled={importingGuests}
                >
                  📥 {importingGuests ? "Importando..." : "Importar Planilha"}
                </button>
                <button className="btn btn-primary" onClick={openAddGuestModal}>
                  ➕ Novo Convidado
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>Link Convite</th>
                    <th>Acomp. Máx</th>
                    <th>Acomp. Conf.</th>
                    <th>Status</th>
                    <th>Mensagem / Observação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem" }}>
                        Nenhum convidado localizado.
                      </td>
                    </tr>
                  ) : (
                    filteredGuests.map((g) => (
                      <tr key={g.id}>
                        <td style={{ fontWeight: 500 }}>{g.name}</td>
                        <td>{g.phone}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <code style={{ fontSize: "0.8rem", color: "var(--color-primary-dark)" }}>/{g.code}</code>
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem", textTransform: "none" }}
                              onClick={() => copyInviteLink(g.code, g.id)}
                            >
                              {copiedId === g.id ? "Copiado!" : "Copiar"}
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>{g.allowedAdditionalGuests}</td>
                        <td style={{ textAlign: "center" }}>
                          {g.status === "CONFIRMED" ? g.confirmedAdditionalGuests : "-"}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              g.status === "CONFIRMED"
                                ? "badge-confirmed"
                                : g.status === "DECLINED"
                                ? "badge-declined"
                                : "badge-pending"
                            }`}
                          >
                            {g.status === "CONFIRMED" && "Confirmado"}
                            {g.status === "DECLINED" && "Recusou"}
                            {g.status === "PENDING" && "Pendente"}
                          </span>
                        </td>
                        <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={g.notes || ""}>
                          {g.notes || <span style={{ opacity: 0.3 }}>Nenhuma</span>}
                          {g.confirmedNames && (
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                              Acomp: {g.confirmedNames}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: "0.3rem 0.6rem" }}
                              onClick={() => openEditGuestModal(g)}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: "0.3rem 0.6rem", borderColor: "var(--color-danger)", color: "var(--color-danger)" }}
                              onClick={() => handleDeleteGuest(g.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 3: GIFTS & CAIXA --- */}
        {activeTab === "gifts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem" }}>Lista de Presentes Cadastrados</h3>
              <button className="btn btn-primary" onClick={openAddGiftModal}>
                ➕ Adicionar Presente
              </button>
            </div>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Imagem</th>
                    <th>Presente</th>
                    <th>Descrição</th>
                    <th>Valor BRL</th>
                    <th>Ativo</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {gifts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem" }}>
                        Nenhum presente cadastrado na lista.
                      </td>
                    </tr>
                  ) : (
                    gifts.map((g) => (
                      <tr key={g.id}>
                        <td>
                          <img
                            src={g.image}
                            alt={g.name}
                            style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }}
                          />
                        </td>
                        <td style={{ fontWeight: 500 }}>{g.name}</td>
                        <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {g.description}
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(g.price)}</td>
                        <td>
                          <span
                            style={{
                              color: g.active ? "var(--color-success)" : "var(--color-danger)",
                              fontWeight: 600,
                            }}
                          >
                            {g.active ? "Sim" : "Não"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: "0.3rem 0.6rem" }}
                              onClick={() => openEditGiftModal(g)}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: "0.3rem 0.6rem", borderColor: "var(--color-danger)", color: "var(--color-danger)" }}
                              onClick={() => handleDeleteGift(g.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "4rem" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: "2rem" }}>Histórico de Transações (Presentes Recebidos)</h3>
              
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Presente</th>
                      <th>Comprador</th>
                      <th>Recado</th>
                      <th>Valor</th>
                      <th>Status Pagamento</th>
                      <th>Transação Gateway</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem" }}>
                          Nenhuma transação registrada.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t) => (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 500 }}>{t.gift.name}</td>
                          <td>{t.buyerName}</td>
                          <td style={{ fontStyle: "italic", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.message || ""}>
                            {t.message || <span style={{ opacity: 0.3 }}>-</span>}
                          </td>
                          <td style={{ fontWeight: 600 }}>{formatCurrency(t.amount)}</td>
                          <td>
                            <span
                              className={`badge ${
                                t.status === "PAID"
                                  ? "badge-confirmed"
                                  : t.status === "PENDING"
                                  ? "badge-pending"
                                  : "badge-declined"
                              }`}
                            >
                              {t.status === "PAID" && "Pago"}
                              {t.status === "PENDING" && "Pendente"}
                              {t.status === "FAILED" && "Falhou"}
                              {t.status === "CANCELLED" && "Cancelado"}
                            </span>
                          </td>
                          <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                            {t.transactionId || <span style={{ opacity: 0.3 }}>-</span>}
                          </td>
                          <td>{new Date(t.createdAt).toLocaleString("pt-BR")}</td>
                          <td>
                            <div style={{ display: "flex", gap: "0.25rem" }}>
                              {t.status === "PENDING" ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderColor: "var(--color-success)", color: "var(--color-success)" }}
                                    onClick={() => handleConfirmTransaction(t.id, "PAID")}
                                    disabled={loading}
                                  >
                                    ✓ Confirmar
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderColor: "var(--color-danger)", color: "var(--color-danger)" }}
                                    onClick={() => handleConfirmTransaction(t.id, "CANCELLED")}
                                    disabled={loading}
                                  >
                                    ✕ Cancelar
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                  onClick={() => handleConfirmTransaction(t.id, "PENDING")}
                                  disabled={loading}
                                >
                                  Reverter
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 4: GALLERY MANAGER --- */}
        {activeTab === "gallery" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem" }}>Galeria de Fotos do Site</h3>
              <button className="btn btn-primary" onClick={openAddGalleryModal}>
                ➕ Adicionar Foto
              </button>
            </div>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Imagem</th>
                    <th>Caminho / URL</th>
                    <th>Legenda</th>
                    <th>Exibir no Site</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {gallery.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem" }}>
                        Nenhuma foto cadastrada na galeria. Use o botão acima para adicionar!
                      </td>
                    </tr>
                  ) : (
                    gallery.map((img) => (
                      <tr key={img.id}>
                        <td>
                          <img
                            src={img.url}
                            alt={img.caption || "Foto da galeria"}
                            style={{ width: "80px", height: "50px", objectFit: "cover", borderRadius: "4px" }}
                          />
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.85rem", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {img.url}
                        </td>
                        <td>{img.caption || <span style={{ opacity: 0.3, fontStyle: "italic" }}>Sem legenda</span>}</td>
                        <td>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/admin/gallery", {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: img.id, active: !img.active }),
                                });
                                if (res.ok) refreshGalleryData();
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="btn btn-outline btn-sm"
                            style={{
                              borderColor: img.active ? "var(--color-success)" : "var(--color-border)",
                              color: img.active ? "var(--color-success)" : "var(--color-text-muted)",
                              padding: "0.25rem 0.75rem",
                              fontSize: "0.75rem",
                            }}
                          >
                            {img.active ? "✓ Ativa" : "Oculta"}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: "0.3rem 0.6rem" }}
                              onClick={() => openEditGalleryModal(img)}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: "0.3rem 0.6rem", borderColor: "var(--color-danger)", color: "var(--color-danger)" }}
                              onClick={() => handleDeleteGallery(img.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 5: WEDDING SETTINGS --- */}
        {activeTab === "config" && (
          <div className="card" style={{ padding: "2.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: "2rem", color: "var(--color-primary-dark)" }}>
              Gerenciar Conteúdo do Casamento
            </h3>

            <form onSubmit={handleConfigSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="bride-name">Nome da Noiva *</label>
                  <input
                    type="text"
                    id="bride-name"
                    className="form-control"
                    value={config.brideName}
                    onChange={(e) => setConfig({ ...config, brideName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="groom-name">Nome do Noivo *</label>
                  <input
                    type="text"
                    id="groom-name"
                    className="form-control"
                    value={config.groomName}
                    onChange={(e) => setConfig({ ...config, groomName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="wedding-date">Data e Horário do Casamento *</label>
                <input
                  type="datetime-local"
                  id="wedding-date"
                  className="form-control"
                  value={(() => {
                    if (!config.weddingDate) return "";
                    const d = new Date(config.weddingDate);
                    if (isNaN(d.getTime())) return "";
                    // Adjust by offset to format local date-time correctly
                    const offset = d.getTimezoneOffset();
                    const localDate = new Date(d.getTime() - offset * 60 * 1000);
                    return localDate.toISOString().slice(0, 16);
                  })()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const parsedDate = new Date(val);
                    if (!isNaN(parsedDate.getTime())) {
                      setConfig({ ...config, weddingDate: parsedDate.toISOString() });
                    }
                  }}
                  required
                />
              </div>

              <div style={{ borderTop: "1px solid var(--color-border)", padding: "1.5rem 0", marginTop: "1.5rem" }}>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-primary)" }}>
                  Cerimônia (Igreja)
                </h4>
                <div className="form-group">
                  <label className="form-label" htmlFor="ceremony-place">Local</label>
                  <input
                    type="text"
                    id="ceremony-place"
                    className="form-control"
                    placeholder="Ex: Paróquia Nossa Senhora do Brasil"
                    value={config.ceremonyPlace}
                    onChange={(e) => setConfig({ ...config, ceremonyPlace: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ceremony-address">Endereço Completo</label>
                  <input
                    type="text"
                    id="ceremony-address"
                    className="form-control"
                    placeholder="Endereço da cerimônia"
                    value={config.ceremonyAddress}
                    onChange={(e) => setConfig({ ...config, ceremonyAddress: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ceremony-maps">URL Google Maps</label>
                  <input
                    type="url"
                    id="ceremony-maps"
                    className="form-control"
                    placeholder="Link do Google Maps para a cerimônia"
                    value={config.ceremonyMapsUrl}
                    onChange={(e) => setConfig({ ...config, ceremonyMapsUrl: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--color-border)", padding: "1.5rem 0" }}>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-primary)" }}>
                  Festa (Recepção)
                </h4>
                <div className="form-group">
                  <label className="form-label" htmlFor="party-place">Local da Festa</label>
                  <input
                    type="text"
                    id="party-place"
                    className="form-control"
                    placeholder="Ex: Espaço Quintal"
                    value={config.partyPlace}
                    onChange={(e) => setConfig({ ...config, partyPlace: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="party-address">Endereço da Festa</label>
                  <input
                    type="text"
                    id="party-address"
                    className="form-control"
                    placeholder="Endereço da festa"
                    value={config.partyAddress}
                    onChange={(e) => setConfig({ ...config, partyAddress: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="party-maps">URL Google Maps</label>
                  <input
                    type="url"
                    id="party-maps"
                    className="form-control"
                    placeholder="Link do Google Maps para a festa"
                    value={config.partyMapsUrl}
                    onChange={(e) => setConfig({ ...config, partyMapsUrl: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--color-border)", padding: "1.5rem 0" }}>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-primary)" }}>
                  Nossa História & Foto de Fundo
                </h4>
                <div className="form-group">
                  <label className="form-label" htmlFor="story-title">Título da Seção</label>
                  <input
                    type="text"
                    id="story-title"
                    className="form-control"
                    value={config.storyTitle}
                    onChange={(e) => setConfig({ ...config, storyTitle: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="story-text">Texto de História</label>
                  <textarea
                    id="story-text"
                    className="form-control"
                    rows={5}
                    value={config.storyText}
                    onChange={(e) => setConfig({ ...config, storyText: e.target.value })}
                    style={{ resize: "vertical" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="story-image">Foto da História</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      id="story-image"
                      className="form-control"
                      value={config.storyImage}
                      onChange={(e) => setConfig({ ...config, storyImage: e.target.value })}
                      style={{ flexGrow: 1 }}
                    />
                    <input
                      type="file"
                      ref={configUploadRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, (url) => setConfig({ ...config, storyImage: url }))}
                    />
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ whiteSpace: "nowrap" }}
                      onClick={() => configUploadRef.current?.click()}
                    >
                      📤 Upload
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="hero-image">Foto do Topo (Hero - atrás dos nomes)</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      id="hero-image"
                      className="form-control"
                      value={config.heroImage}
                      onChange={(e) => setConfig({ ...config, heroImage: e.target.value })}
                      style={{ flexGrow: 1 }}
                    />
                    <input
                      type="file"
                      ref={heroUploadRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, (url) => setConfig({ ...config, heroImage: url }))}
                    />
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ whiteSpace: "nowrap" }}
                      onClick={() => heroUploadRef.current?.click()}
                    >
                      📤 Upload
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--color-border)", padding: "1.5rem 0" }}>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-primary)" }}>
                  Dados do Pix Manual
                </h4>
                <div className="form-group">
                  <label className="form-label" htmlFor="pix-key">Chave Pix *</label>
                  <input
                    type="text"
                    id="pix-key"
                    className="form-control"
                    placeholder="Chave Pix (ex: Celular, E-mail, CPF, Chave Aleatória)"
                    value={config.pixKey}
                    onChange={(e) => setConfig({ ...config, pixKey: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="pix-qrcode">Imagem do QR Code Pix</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      id="pix-qrcode"
                      className="form-control"
                      placeholder="URL ou upload da imagem do QRCode Pix..."
                      value={config.pixQrCode}
                      onChange={(e) => setConfig({ ...config, pixQrCode: e.target.value })}
                      style={{ flexGrow: 1 }}
                    />
                    <input
                      type="file"
                      ref={pixUploadRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, (url) => setConfig({ ...config, pixQrCode: url }))}
                    />
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ whiteSpace: "nowrap" }}
                      onClick={() => pixUploadRef.current?.click()}
                    >
                      📤 Upload
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--color-border)", padding: "1.5rem 0" }}>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-primary)" }}>
                  Programação (Timeline do Evento)
                </h4>
                
                {timelineItems.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "flex-end" }}>
                    <div style={{ width: "100px" }}>
                      <label className="form-label">Horário</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="16:00"
                        value={item.time}
                        onChange={(e) => updateTimelineItem(idx, "time", e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label className="form-label">Título</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Cerimônia"
                        value={item.title}
                        onChange={(e) => updateTimelineItem(idx, "title", e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 3 }}>
                      <label className="form-label">Descrição</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Celebração religiosa"
                        value={item.description}
                        onChange={(e) => updateTimelineItem(idx, "description", e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ borderColor: "var(--color-danger)", color: "var(--color-danger)", padding: "0.7rem" }}
                      onClick={() => removeTimelineItem(idx)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: "0.5rem" }}
                  onClick={addTimelineItem}
                >
                  ➕ Adicionar Evento
                </button>
              </div>

              {errorMsg && (
                <div style={{ color: "var(--color-danger)", fontSize: "0.85rem", marginTop: "1.5rem" }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div style={{ borderTop: "1px solid var(--color-border)", padding: "1.5rem 0", marginTop: "2rem", textAlign: "right" }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Configurações"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* --- GUEST EDIT/ADD MODAL --- */}
      {guestModalOpen && (
        <div className="modal-overlay" onClick={() => setGuestModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <button className="modal-close" onClick={() => setGuestModalOpen(false)}>
              &times;
            </button>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--color-primary-dark)" }}>
              {editingGuest ? "Editar Convidado" : "Adicionar Novo Convidado"}
            </h3>

            <form onSubmit={handleGuestSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="guest-name">Nome do Convite *</label>
                <input
                  type="text"
                  id="guest-name"
                  className="form-control"
                  placeholder="Ex: João da Silva e Família"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="guest-phone">WhatsApp / Telefone *</label>
                <input
                  type="tel"
                  id="guest-phone"
                  className="form-control"
                  placeholder="Ex: 11999999999"
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="guest-code">Código de Acesso do Link *</label>
                <input
                  type="text"
                  id="guest-code"
                  className="form-control"
                  placeholder="Ex: joao-silva"
                  value={guestForm.code}
                  onChange={(e) => setGuestForm({ ...guestForm, code: e.target.value.toLowerCase() })}
                  required
                />
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                  O link gerado será: seu-site.com/confirmar-presenca/<strong>{guestForm.code || "[codigo]"}</strong>
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="guest-allowed">Acompanhantes Permitidos *</label>
                <input
                  type="number"
                  id="guest-allowed"
                  className="form-control"
                  min="0"
                  value={guestForm.allowedAdditionalGuests}
                  onChange={(e) => setGuestForm({ ...guestForm, allowedAdditionalGuests: parseInt(e.target.value || "0", 10) })}
                  required
                />
              </div>

              {editingGuest && (
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem", marginTop: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="guest-status">Status RSVP</label>
                    <select
                      id="guest-status"
                      className="form-control"
                      value={guestForm.status}
                      onChange={(e) => setGuestForm({ ...guestForm, status: e.target.value })}
                    >
                      <option value="PENDING">Pendente</option>
                      <option value="CONFIRMED">Confirmado</option>
                      <option value="DECLINED">Não Comparece</option>
                    </select>
                  </div>

                  {guestForm.status === "CONFIRMED" && (
                    <div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="guest-confirmed-acomp">Acompanhantes Confirmados</label>
                        <input
                          type="number"
                          id="guest-confirmed-acomp"
                          className="form-control"
                          min="0"
                          max={guestForm.allowedAdditionalGuests}
                          value={guestForm.confirmedAdditionalGuests}
                          onChange={(e) => setGuestForm({ ...guestForm, confirmedAdditionalGuests: parseInt(e.target.value || "0", 10) })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="guest-names-acomp">Nome dos Acompanhantes</label>
                        <input
                          type="text"
                          id="guest-names-acomp"
                          className="form-control"
                          placeholder="Separados por vírgula"
                          value={guestForm.confirmedNames}
                          onChange={(e) => setGuestForm({ ...guestForm, confirmedNames: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="guest-notes">Mensagem / Observações</label>
                    <textarea
                      id="guest-notes"
                      className="form-control"
                      rows={2}
                      value={guestForm.notes}
                      onChange={(e) => setGuestForm({ ...guestForm, notes: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div style={{ color: "var(--color-danger)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Convidado"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- GIFT EDIT/ADD MODAL --- */}
      {giftModalOpen && (
        <div className="modal-overlay" onClick={() => setGiftModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <button className="modal-close" onClick={() => setGiftModalOpen(false)}>
              &times;
            </button>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--color-primary-dark)" }}>
              {editingGift ? "Editar Presente" : "Cadastrar Novo Presente"}
            </h3>

            <form onSubmit={handleGiftSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="gift-name">Nome do Presente *</label>
                <input
                  type="text"
                  id="gift-name"
                  className="form-control"
                  placeholder="Ex: Jantar romântico na lua de mel"
                  value={giftForm.name}
                  onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gift-desc">Descrição do Presente *</label>
                <textarea
                  id="gift-desc"
                  className="form-control"
                  rows={3}
                  placeholder="Ex: Um jantar romântico em um restaurante local"
                  value={giftForm.description}
                  onChange={(e) => setGiftForm({ ...giftForm, description: e.target.value })}
                  required
                  style={{ fontFamily: "var(--font-sans)" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gift-image">URL da Imagem *</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    id="gift-image"
                    className="form-control"
                    placeholder="URL da imagem (ex: https://images.unsplash.com/...)"
                    value={giftForm.image}
                    onChange={(e) => setGiftForm({ ...giftForm, image: e.target.value })}
                    style={{ flexGrow: 1 }}
                    required
                  />
                  <input
                    type="file"
                    ref={giftUploadRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (url) => setGiftForm({ ...giftForm, image: url }))}
                  />
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={() => giftUploadRef.current?.click()}
                  >
                    📤 Upload
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gift-price">Valor em Reais (R$) *</label>
                <input
                  type="number"
                  id="gift-price"
                  className="form-control"
                  min="0.01"
                  step="0.01"
                  placeholder="Ex: 250.00"
                  value={giftForm.price || ""}
                  onChange={(e) => setGiftForm({ ...giftForm, price: parseFloat(e.target.value || "0") })}
                  required
                />
              </div>

              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="gift-active"
                  checked={giftForm.active}
                  onChange={(e) => setGiftForm({ ...giftForm, active: e.target.checked })}
                  style={{ width: "18px", height: "18px", accentColor: "var(--color-primary)" }}
                />
                <label className="form-label" htmlFor="gift-active" style={{ marginBottom: 0, textTransform: "none" }}>
                  Presente ativo na lista (visível para convidados)
                </label>
              </div>

              {errorMsg && (
                <div style={{ color: "var(--color-danger)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Presente"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- GALLERY ADD/EDIT MODAL --- */}
      {galleryModalOpen && (
        <div className="modal-overlay" onClick={() => setGalleryModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <button className="modal-close" onClick={() => setGalleryModalOpen(false)}>
              &times;
            </button>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--color-primary-dark)" }}>
              {editingGalleryImage ? "Editar Foto da Galeria" : "Adicionar Foto na Galeria"}
            </h3>

            <form onSubmit={handleGallerySubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="gallery-image-url">Foto da Galeria *</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    id="gallery-image-url"
                    className="form-control"
                    placeholder="Cole a URL ou faça upload da foto..."
                    value={galleryForm.url}
                    onChange={(e) => setGalleryForm({ ...galleryForm, url: e.target.value })}
                    style={{ flexGrow: 1 }}
                    required
                  />
                  <input
                    type="file"
                    ref={galleryUploadRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (url) => setGalleryForm({ ...galleryForm, url }))}
                  />
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={() => galleryUploadRef.current?.click()}
                  >
                    📤 Upload
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gallery-caption">Legenda / Descrição (Opcional)</label>
                <input
                  type="text"
                  id="gallery-caption"
                  className="form-control"
                  placeholder="Ex: Nossa viagem de noivado em Gramado..."
                  value={galleryForm.caption}
                  onChange={(e) => setGalleryForm({ ...galleryForm, caption: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="gallery-active"
                  checked={galleryForm.active}
                  onChange={(e) => setGalleryForm({ ...galleryForm, active: e.target.checked })}
                  style={{ width: "18px", height: "18px", accentColor: "var(--color-primary)" }}
                />
                <label className="form-label" htmlFor="gallery-active" style={{ marginBottom: 0, textTransform: "none" }}>
                  Exibir foto na galeria do site público
                </label>
              </div>

              {errorMsg && (
                <div style={{ color: "var(--color-danger)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Foto"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MEDIA LIBRARY DRAWER/MODAL --- */}
      {mediaLibraryOpen && (
        <div className="modal-overlay" onClick={() => setMediaLibraryOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "700px", maxHeight: "85vh", overflowY: "auto" }}
          >
            <button className="modal-close" onClick={() => setMediaLibraryOpen(false)}>
              &times;
            </button>
            
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--color-primary-dark)" }}>
              Galeria de Mídias Importadas
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              Aqui estão todos os arquivos de imagem que você importou para dentro da aplicação. 
              Clique no botão de copiar e cole o link nos campos de imagens de presentes, galeria ou configurações!
            </p>

            <div style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
              <input
                type="file"
                ref={mediaLibraryUploadRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={(e) => handleImageUpload(e, async () => {
                  await loadMediaLibrary();
                })}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => mediaLibraryUploadRef.current?.click()}
                disabled={loading}
              >
                {loading ? "Enviando arquivo..." : "📤 Importar Nova Foto Local"}
              </button>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginLeft: "1rem" }}>
                Arquivos salvos em <code>public/uploads/</code>
              </span>
            </div>

            {mediaLibrary.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
                Nenhuma foto importada localmente ainda. Faça o seu primeiro upload acima!
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "1rem" }}>
                {mediaLibrary.map((url, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "6px",
                      overflow: "hidden",
                      backgroundColor: "var(--color-bg-alt)",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                    }}
                  >
                    <img
                      src={url}
                      alt="Upload local"
                      style={{ width: "100%", height: "100px", objectFit: "cover" }}
                    />
                    <div style={{ padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontFamily: "monospace",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={url}
                      >
                        {url.replace("/uploads/", "")}
                      </span>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{
                          padding: "0.2rem 0",
                          fontSize: "0.65rem",
                          width: "100%",
                          textTransform: "none",
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText(url);
                          alert(`Caminho copiado: ${url}`);
                        }}
                      >
                        🔗 Copiar Caminho
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
