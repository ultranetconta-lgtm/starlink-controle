const STORAGE_KEY = "clara-payment-clients-v1";

const demoClients = [
  { id: "demo-1", name: "Marina Costa", email: "marina.costa@email.com", model: "Mini", dueDate: "2026-08-23", amount: 890, paid: false, paidAt: null, payments: [{ id: "demo-1-p1", date: "2026-07-23", amount: 890 }] },
  { id: "demo-2", name: "Rafael Nunes", email: "rafael.nunes@email.com", model: "V2", dueDate: "2026-08-18", amount: 1250, paid: true, paidAt: "2026-08-18", payments: [{ id: "demo-2-p1", date: "2026-07-18", amount: 1250 }, { id: "demo-2-p2", date: "2026-08-18", amount: 1250 }] },
  { id: "demo-3", name: "Aline Souza", email: "aline.souza@email.com", model: "V3", dueDate: "2026-08-28", amount: 680, paid: false, paidAt: null, payments: [] },
  { id: "demo-4", name: "Bruno Martins", email: "bruno.martins@email.com", model: "V2", dueDate: "2026-09-03", amount: 1780, paid: false, paidAt: null, payments: [{ id: "demo-4-p1", date: "2026-08-03", amount: 1780 }] }
];

const state = {
  clients: loadClients(),
  search: "",
  filter: "all",
  editingId: null,
  toastTimer: null
};

const el = {
  body: document.body,
  form: document.querySelector("#clientForm"),
  modalBackdrop: document.querySelector("#modalBackdrop"),
  modalTitle: document.querySelector("#modalTitle"),
  submitLabel: document.querySelector("#submitLabel"),
  tableBody: document.querySelector("#clientsTableBody"),
  emptyState: document.querySelector("#emptyState"),
  upcomingList: document.querySelector("#upcomingList"),
  upcomingEmpty: document.querySelector("#upcomingEmpty"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  recordCount: document.querySelector("#recordCount"),
  demoNote: document.querySelector("#demoNote"),
  toast: document.querySelector("#toast"),
  todayLabel: document.querySelector("#todayLabel"),
  clientId: document.querySelector("#clientId"),
  clientName: document.querySelector("#clientName"),
  clientEmail: document.querySelector("#clientEmail"),
  clientDueDate: document.querySelector("#clientDueDate"),
  clientAmount: document.querySelector("#clientAmount"),
  clientPaid: document.querySelector("#clientPaid"),
  clientModel: document.querySelector("#clientModel"),
  historyModalBackdrop: document.querySelector("#historyModalBackdrop"),
  historyTitle: document.querySelector("#historyTitle"),
  historyMeta: document.querySelector("#historyMeta"),
  historySummary: document.querySelector("#historySummary"),
  paymentHistory: document.querySelector("#paymentHistory")
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function loadClients() {
  let clients;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) clients = JSON.parse(saved);
  } catch (error) {
    console.warn("Não foi possível ler os dados salvos.", error);
  }
  if (!Array.isArray(clients)) clients = demoClients.map((client) => ({ ...client, payments: client.payments.map((payment) => ({ ...payment })) }));
  return clients.map(normalizeClient).map(resetRecurringCycle);
}

function normalizeClient(client) {
  return {
    ...client,
    model: ["Mini", "V2", "V3"].includes(client.model) ? client.model : "V2",
    paidAt: client.paidAt || (client.paid ? String(client.dueDate).slice(0, 10) : null),
    payments: Array.isArray(client.payments) ? client.payments : []
  };
}

function resetRecurringCycle(client) {
  if (!client.paid || !client.paidAt) return client;
  const paidDate = parseDate(client.paidAt);
  const today = todayAtMidnight();
  const isNewMonth = paidDate.getFullYear() !== today.getFullYear() || paidDate.getMonth() !== today.getMonth();
  return isNewMonth ? { ...client, paid: false, paidAt: null } : client;
}

function saveClients() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.clients));
}

function todayAtMidnight() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function parseDate(value) {
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addOneMonth(dateValue) {
  const date = parseDate(dateValue);
  const originalDay = date.getDate();
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const lastDayOfNextMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(originalDay, lastDayOfNextMonth));
  return toIsoDate(next);
}

function isSameMonth(dateValue, reference = new Date()) {
  const date = parseDate(dateValue);
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

function getStatus(client) {
  if (client.paid) return "paid";
  return parseDate(client.dueDate) < todayAtMidnight() ? "overdue" : "open";
}

function statusLabel(status) {
  return { paid: "Pago", overdue: "Atrasado", open: "Em aberto" }[status];
}

function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function icon(name) {
  const paths = {
    edit: '<path d="m4 16.5-.8 3.3 3.3-.8L17.8 7.7a1.7 1.7 0 0 0-2.4-2.4L4 16.5ZM14.5 6.5l3 3" />',
    trash: '<path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" />',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2" />',
    check: '<path d="m5 12 4 4L19 6" />',
    empty: '<path d="M7 3h10v18H7zM10 7h4M10 11h4M10 15h2" />'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}

function formatDate(value, options = { day: "2-digit", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("pt-BR", options).format(parseDate(value)).replace(/ de /g, " ");
}

function latestPayment(client) {
  return [...client.payments].sort((a, b) => parseDate(b.date) - parseDate(a.date))[0] || null;
}

function visibleClients() {
  const search = state.search.toLowerCase().trim();
  return state.clients.filter((client) => {
    const matchesSearch = !search || `${client.name} ${client.email} ${client.model}`.toLowerCase().includes(search);
    const matchesFilter = state.filter === "all" || getStatus(client) === state.filter;
    return matchesSearch && matchesFilter;
  });
}

function render() {
  refreshRecurringCycles();
  renderTodayLabel();
  renderSummary();
  renderTable();
  renderUpcoming();
  el.demoNote.hidden = !state.clients.some((client) => client.id.startsWith("demo-"));
}

function refreshRecurringCycles() {
  const refreshed = state.clients.map(resetRecurringCycle);
  const changed = refreshed.some((client, index) => client.paid !== state.clients[index].paid || client.paidAt !== state.clients[index].paidAt);
  state.clients = refreshed;
  if (changed) saveClients();
}

function renderTodayLabel() {
  const today = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date());
  el.todayLabel.textContent = today.toLocaleUpperCase("pt-BR");
}

function renderSummary() {
  const open = state.clients.filter((client) => getStatus(client) !== "paid");
  const monthlyPayments = state.clients.flatMap((client) => client.payments.filter((payment) => isSameMonth(payment.date)));
  const soonLimit = new Date(todayAtMidnight());
  soonLimit.setDate(soonLimit.getDate() + 7);
  const dueSoon = open.filter((client) => parseDate(client.dueDate) >= todayAtMidnight() && parseDate(client.dueDate) <= soonLimit);

  document.querySelector("#openAmount").textContent = money.format(open.reduce((sum, client) => sum + Number(client.amount), 0));
  document.querySelector("#openCaption").textContent = `${open.length} ${open.length === 1 ? "fatura aguardando pagamento" : "faturas aguardando pagamento"}`;
  document.querySelector("#paidAmount").textContent = money.format(monthlyPayments.reduce((sum, payment) => sum + Number(payment.amount), 0));
  document.querySelector("#paidCaption").textContent = `${monthlyPayments.length} ${monthlyPayments.length === 1 ? "pagamento confirmado" : "pagamentos confirmados"}`;
  document.querySelector("#dueSoonAmount").textContent = money.format(dueSoon.reduce((sum, client) => sum + Number(client.amount), 0));
  document.querySelector("#dueSoonCaption").textContent = dueSoon.length ? `${dueSoon.length} ${dueSoon.length === 1 ? "fatura próxima do prazo" : "faturas próximas do prazo"}` : "Tudo em dia por enquanto";
  document.querySelector("#clientCount").textContent = state.clients.length;
  document.querySelector("#clientCaption").textContent = state.clients.length === 1 ? "cliente cadastrado" : "clientes cadastrados";
}

function renderTable() {
  const clients = visibleClients().sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate));
  el.tableBody.innerHTML = clients.map((client, index) => {
    const status = getStatus(client);
    const dueDate = parseDate(client.dueDate);
    const dateText = formatDate(client.dueDate, { day: "2-digit", month: "short" });
    const detail = status === "paid" ? "Pagamento confirmado" : status === "overdue" ? `${Math.abs(Math.ceil((todayAtMidnight() - dueDate) / 86400000))} dias em atraso` : dueDate.getTime() === todayAtMidnight().getTime() ? "Vence hoje" : `Vence em ${Math.ceil((dueDate - todayAtMidnight()) / 86400000)} dias`;
    const payment = latestPayment(client);
    const paymentMarkup = payment ? `<span class="last-payment"><strong>${escapeHtml(formatDate(payment.date))}</strong><small>${client.paidAt ? "Pago neste ciclo" : "Pagamento anterior"}</small></span>` : `<span class="last-payment--empty">—</span>`;
    const avatarClass = ["", "avatar--green", "avatar--orange", "avatar--blue"][index % 4];
    return `<tr data-client-id="${escapeHtml(client.id)}">
      <td><div class="client-cell"><span class="client-avatar ${avatarClass}">${escapeHtml(initials(client.name))}</span><span class="client-info"><strong>${escapeHtml(client.name)}</strong><span>${escapeHtml(client.email)}</span></span></div></td>
      <td><span class="model-badge">${escapeHtml(client.model)}</span></td>
      <td><span class="date-cell ${status === "overdue" ? "date--overdue" : ""}"><strong>${escapeHtml(dateText)}</strong><small>${escapeHtml(detail)}</small></span></td>
      <td class="amount-cell">${money.format(Number(client.amount))}</td>
      <td><span class="status-pill status-pill--${status}">${statusLabel(status)}</span></td>
      <td>${paymentMarkup}</td>
      <td><span class="row-actions"><button class="row-action" data-action="edit" type="button" title="Editar cliente" aria-label="Editar ${escapeHtml(client.name)}">${icon("edit")}</button><button class="row-action" data-action="history" type="button" title="Ver histórico de pagamentos" aria-label="Ver histórico de pagamentos de ${escapeHtml(client.name)}">${icon("history")}</button><button class="row-action" data-action="delete" type="button" title="Excluir cliente" aria-label="Excluir ${escapeHtml(client.name)}">${icon("trash")}</button></span></td>
    </tr>`;
  }).join("");
  el.emptyState.hidden = clients.length !== 0;
  el.recordCount.textContent = `${clients.length} ${clients.length === 1 ? "registro" : "registros"}`;
}

function renderUpcoming() {
  const upcoming = state.clients.filter((client) => getStatus(client) !== "paid").sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate)).slice(0, 4);
  el.upcomingList.innerHTML = upcoming.map((client) => {
    const date = parseDate(client.dueDate);
    const status = getStatus(client);
    return `<div class="upcoming-item ${status === "overdue" ? "upcoming-item--overdue" : ""}"><span class="upcoming-date"><strong>${String(date.getDate()).padStart(2, "0")}</strong><small>${new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "")}</small></span><span class="upcoming-info"><strong>${escapeHtml(client.name)}</strong><span>${status === "overdue" ? "Pagamento atrasado" : "Fatura em aberto"}</span></span><span class="upcoming-value">${money.format(Number(client.amount))}</span></div>`;
  }).join("");
  el.upcomingEmpty.hidden = upcoming.length !== 0;
}

function openModal(client = null) {
  state.editingId = client?.id || null;
  el.modalTitle.textContent = client ? "Editar cliente" : "Novo cliente";
  el.submitLabel.textContent = client ? "Salvar alterações" : "Adicionar cliente";
  el.clientId.value = client?.id || "";
  el.clientName.value = client?.name || "";
  el.clientEmail.value = client?.email || "";
  el.clientDueDate.value = client?.dueDate || "";
  el.clientAmount.value = client?.amount ?? "";
  el.clientModel.value = client?.model || "V2";
  el.clientPaid.checked = Boolean(client?.paid);
  el.modalBackdrop.hidden = false;
  el.body.classList.add("modal-open");
  requestAnimationFrame(() => el.clientName.focus());
}

function closeModal() {
  el.modalBackdrop.hidden = true;
  el.body.classList.remove("modal-open");
  el.form.reset();
  state.editingId = null;
}

function openHistory(client) {
  const payments = [...client.payments].sort((a, b) => parseDate(b.date) - parseDate(a.date));
  const total = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  el.historyTitle.textContent = client.name;
  el.historyMeta.textContent = `${client.email} · Starlink ${client.model}`;
  el.historySummary.innerHTML = `<strong>${payments.length}</strong><span>${payments.length === 1 ? "pagamento registrado" : "pagamentos registrados"}</span><span>Total recebido: <strong>${money.format(total)}</strong></span>`;
  el.paymentHistory.innerHTML = payments.length ? payments.map((payment) => `<div class="payment-entry"><span class="payment-entry-icon">${icon("check")}</span><span class="payment-entry-info"><strong>${escapeHtml(formatDate(payment.date))}</strong><small>Pagamento recorrente confirmado</small></span><span class="payment-entry-amount">${money.format(Number(payment.amount))}</span></div>`).join("") : `<div class="payment-history-empty">${icon("empty")}<p>Nenhum pagamento registrado para este cliente.</p></div>`;
  el.historyModalBackdrop.hidden = false;
  requestAnimationFrame(() => document.querySelector("#closeHistoryButton").focus());
}

function closeHistory() {
  el.historyModalBackdrop.hidden = true;
}

function showToast(message) {
  clearTimeout(state.toastTimer);
  el.toast.textContent = message;
  el.toast.classList.add("is-visible");
  state.toastTimer = setTimeout(() => el.toast.classList.remove("is-visible"), 2600);
}

document.querySelector("#openCreateButton").addEventListener("click", () => openModal());
document.querySelector("#emptyCreateButton").addEventListener("click", () => openModal());
document.querySelector("#closeModalButton").addEventListener("click", closeModal);
document.querySelector("#cancelModalButton").addEventListener("click", closeModal);
el.modalBackdrop.addEventListener("click", (event) => { if (event.target === el.modalBackdrop) closeModal(); });
document.querySelector("#closeHistoryButton").addEventListener("click", closeHistory);
el.historyModalBackdrop.addEventListener("click", (event) => { if (event.target === el.historyModalBackdrop) closeHistory(); });
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!el.historyModalBackdrop.hidden) closeHistory();
  else if (!el.modalBackdrop.hidden) closeModal();
});

el.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(el.form);
  const existing = state.editingId ? state.clients.find((item) => item.id === state.editingId) : null;
  const client = normalizeClient({
    id: state.editingId || `client-${Date.now()}`,
    name: formData.get("name").trim(),
    email: formData.get("email").trim(),
    model: formData.get("model"),
    dueDate: formData.get("dueDate"),
    amount: Number(formData.get("amount")),
    paid: el.clientPaid.checked,
    paidAt: existing?.paidAt || null,
    payments: existing?.payments || []
  });
  const isNewPayment = client.paid && !existing?.paid;
  if (isNewPayment) {
    const payment = { id: `payment-${Date.now()}`, date: toIsoDate(), amount: client.amount };
    client.payments = [...client.payments, payment];
    client.paidAt = payment.date;
    client.dueDate = addOneMonth(client.dueDate);
  } else if (!client.paid) {
    client.paidAt = null;
  }
  if (state.editingId) {
    state.clients = state.clients.map((item) => item.id === state.editingId ? client : item);
    showToast("Dados do cliente atualizados");
  } else {
    state.clients.push(client);
    showToast("Cliente adicionado com sucesso");
  }
  saveClients();
  render();
  closeModal();
});

el.tableBody.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const row = actionButton.closest("tr");
  const client = state.clients.find((item) => item.id === row.dataset.clientId);
  if (!client) return;
  if (actionButton.dataset.action === "edit") openModal(client);
  if (actionButton.dataset.action === "history") openHistory(client);
  if (actionButton.dataset.action === "delete") {
    if (!window.confirm(`Excluir ${client.name}? Esta ação não pode ser desfeita.`)) return;
    state.clients = state.clients.filter((item) => item.id !== client.id);
    saveClients();
    render();
    showToast("Cliente removido");
  }
});

el.searchInput.addEventListener("input", (event) => { state.search = event.target.value; renderTable(); });
el.statusFilter.addEventListener("change", (event) => { state.filter = event.target.value; renderTable(); });

document.querySelector("#clearDemoButton").addEventListener("click", () => {
  const hasDemo = state.clients.some((client) => client.id.startsWith("demo-"));
  if (!hasDemo) { showToast("Os dados de exemplo já foram removidos"); return; }
  if (!window.confirm("Remover todos os dados de demonstração?")) return;
  state.clients = state.clients.filter((client) => !client.id.startsWith("demo-"));
  saveClients();
  render();
  showToast("Dados de demonstração removidos");
});

render();
setInterval(render, 60 * 60 * 1000);
