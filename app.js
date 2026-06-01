/* =====================================================
   TechCRM — Service Technique  |  app.js
   Connecté à Laravel API + MySQL
   ===================================================== */

const API = 'http://localhost:8000/api';

/* ---- Données live (peuplées depuis l'API) ---------- */
let techniciens   = [];
let clients       = [];
let tickets       = [];
let depannages    = [];
let installations = [];
let contrats      = [];

/* ---- Données statiques ----------------------------- */
const calEvents = [
  { day:26, type:'ticket', title:'Panne serveur — Acme'       },
  { day:27, type:'dep',    title:'Dépannage UPS — Clinique'   },
  { day:27, type:'maint',  title:'Maintenance — DataSoft'     },
  { day:28, type:'ticket', title:'Config VPN — Énergie Plus'  },
  { day:28, type:'inst',   title:'Install NAS — DataSoft'     },
  { day:30, type:'maint',  title:'Contrat CT-2025-015 — BTP'  },
  { day:2,  type:'inst',   title:'Câblage réseau — BTP',   next:true },
  { day:5,  type:'maint',  title:'Maintenance — Énergie Plus', next:true },
];

const historique = [
  { type:'ticket',  icon:'ti-ticket',           cls:'ticket',  title:'Ticket TK-042 créé',              detail:'Panne serveur principal — Acme Industries',        time:'Il y a 2h'     },
  { type:'dep',     icon:'ti-urgent',           cls:'dep',     title:'Dépannage DP-018 ouvert',         detail:'Onduleur hors service — Clinique du Nord (URGENT)', time:'Il y a 3h'     },
  { type:'install', icon:'ti-building-cog',     cls:'install', title:'Installation IN-008 mise à jour', detail:'Avancement 70% — DataSoft SA',                     time:'Il y a 5h'     },
  { type:'contrat', icon:'ti-file-certificate', cls:'contrat', title:'Contrat CT-2024-017 expiré',      detail:'Clinique du Nord — Renouvellement requis',          time:'Il y a 1j'     },
  { type:'ticket',  icon:'ti-check',            cls:'ticket',  title:'Ticket TK-036 résolu',            detail:'Sauvegarde données — DataSoft SA',                  time:'Il y a 2j'     },
  { type:'dep',     icon:'ti-check',            cls:'dep',     title:'Dépannage DP-016 résolu',         detail:'Réseau wifi — BTP Solutions (1h 20min)',            time:'Il y a 2j'     },
  { type:'install', icon:'ti-check',            cls:'install', title:'Installation IN-006 terminée',    detail:'Climatisation salle serveurs — Énergie Plus',       time:'Il y a 13j'    },
  { type:'contrat', icon:'ti-file-certificate', cls:'contrat', title:'Contrat CT-2025-016 créé',        detail:'DataSoft SA — TMA 3 ans — 5.1M FCFA',              time:'Il y a 5 mois' },
];

/* ---- Constantes ----------------------------------- */
const AVS    = ['av-b','av-t','av-c','av-p','av-g'];
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

let currentMonth   = 4;
let currentYear    = 2026;
let contratTab     = 'all';
let charts         = {};
let currentEditIdx = -1;

/* ---- Helpers -------------------------------------- */
const fn = s => s.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

const prioBadge = p => {
  const m = { Urgent:'b-red', Haute:'b-amber', Normale:'b-blue', Basse:'b-gray' };
  return `<span class="badge ${m[p]||'b-gray'}">${p}</span>`;
};

const statBadge = s => {
  const m = { Ouvert:'b-blue','En cours':'b-amber', Résolu:'b-green', Planifié:'b-purple', Annulé:'b-gray' };
  return `<span class="badge ${m[s]||'b-gray'}">${s}</span>`;
};

const isoToFr    = d => d ? d.split('-').reverse().join('/') : '-';
const isoToShort = d => d ? d.split('-').slice(1).reverse().join('/') : '';
const frToIso    = d => d && d.includes('/') ? d.split('/').reverse().join('-') : d;

const getClientId = name => clients.find(c => c.nom === name)?._id || null;
const getTechId   = name => techniciens.find(t => t.nom === name)?._id || null;

/* ---- API helpers ---------------------------------- */
const apiFetch = {
  get:    url       => fetch(`${API}${url}`, { headers:{'Accept':'application/json'} }).then(r => r.json()),
  post:   (url, d)  => fetch(`${API}${url}`, { method:'POST',   headers:{'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify(d) }).then(r => r.json()),
  put:    (url, d)  => fetch(`${API}${url}`, { method:'PUT',    headers:{'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify(d) }).then(r => r.json()),
  delete: url       => fetch(`${API}${url}`, { method:'DELETE', headers:{'Accept':'application/json'} }).then(r => r.json()),
};

/* ---- Mappers API → format frontend ---------------- */
const PHOTO_BASE = 'http://localhost:8000/storage/';
const mapTech    = t => ({ _id:t.id, nom:t.nom, spec:t.specialite||'', actifs:t.actifs||0, resolus:t.resolus||0, dispo:t.disponibilite||100, statut:t.statut||'Disponible', tel:t.telephone||'', photo:t.photo ? PHOTO_BASE+t.photo : '' });
const mapClient  = c => ({ _id:c.id, nom:c.nom, secteur:c.secteur||'', contact:c.contact||'', email:c.email||'', ville:c.ville||'', tickets:c.nb_tickets||0, contrat:c.contrat||'Aucun' });
const mapTicket  = t => ({ _id:t.id, id:t.reference, sujet:t.sujet, client:t.client?.nom||'', client_id:t.client_id, tech:t.technicien?.nom||'', tech_id:t.technicien_id, prio:t.priorite, statut:t.statut, date:isoToShort(t.date_prevue), cat:t.categorie });
const mapDep     = d => ({ _id:d.id, id:d.reference, desc:d.description, client:d.client?.nom||'', client_id:d.client_id, tech:d.technicien?.nom||'', tech_id:d.technicien_id, equip:d.equipement||'', prio:d.priorite, statut:d.statut, date:isoToShort(d.date_intervention), montant:d.montant||'' });
const mapInst    = i => ({ _id:i.id, id:i.reference, titre:i.titre, client:i.client?.nom||'', client_id:i.client_id, tech:i.technicien?.nom||'', tech_id:i.technicien_id, equip:i.equipement||'', statut:i.statut, debut:isoToFr(i.date_debut), fin:isoToFr(i.date_fin), avancement:i.avancement||0, montant:i.montant||'' });
const mapContrat = c => ({ _id:c.id, id:c.reference, client:c.client?.nom||'', client_id:c.client_id, type:c.type_contrat, debut:isoToFr(c.date_debut), fin:isoToFr(c.date_fin), montant:c.montant||'0', visites:c.visites_par_an||1, statut:c.statut, next:c.prochaine_visite ? isoToFr(c.prochaine_visite) : '-' });

/* ---- Cache local ---------------------------------- */
const CACHE_KEY = 'crmtech_data_v1';

function saveCache(raw) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(raw)); } catch(_) {}
}

function loadCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (!raw) return false;
    techniciens   = Array.isArray(raw.techniciens)   ? raw.techniciens.map(mapTech)     : [];
    clients       = Array.isArray(raw.clients)       ? raw.clients.map(mapClient)        : [];
    tickets       = Array.isArray(raw.tickets)       ? raw.tickets.map(mapTicket)        : [];
    depannages    = Array.isArray(raw.depannages)    ? raw.depannages.map(mapDep)        : [];
    installations = Array.isArray(raw.installations) ? raw.installations.map(mapInst)   : [];
    contrats      = Array.isArray(raw.contrats)      ? raw.contrats.map(mapContrat)     : [];
    return true;
  } catch(_) { return false; }
}

/* ---- Charger toutes les données depuis l'API ------ */
async function loadAll() {
  try {
    const data = await apiFetch.get('/init');
    techniciens   = Array.isArray(data.techniciens)   ? data.techniciens.map(mapTech)     : [];
    clients       = Array.isArray(data.clients)       ? data.clients.map(mapClient)        : [];
    tickets       = Array.isArray(data.tickets)       ? data.tickets.map(mapTicket)        : [];
    depannages    = Array.isArray(data.depannages)    ? data.depannages.map(mapDep)        : [];
    installations = Array.isArray(data.installations) ? data.installations.map(mapInst)   : [];
    contrats      = Array.isArray(data.contrats)      ? data.contrats.map(mapContrat)     : [];
    saveCache(data);
  } catch(e) {
    console.error('Erreur chargement API:', e);
    const hasCache = localStorage.getItem(CACHE_KEY) !== null;
    if (hasCache) {
      showNotif('⚠️ Serveur indisponible — affichage des données en cache');
    } else {
      showNotif('⚠️ Serveur indisponible — aucune donnée disponible');
    }
  }
}

async function reload(renderFn) {
  await loadAll();
  if (renderFn) renderFn();
  renderDash();
}

/* ---- Navigation ----------------------------------- */
function nav(page, el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + page).classList.add('active');
  const r = { calendrier:renderCalendar, tickets:renderTickets, depannages:renderDepannages,
    installations:renderInstallations, contrats:renderContrats, clients:renderClients,
    techniciens:renderTechniciens, statistiques:renderStats, historique:renderHistorique, export:renderExport, parametres:renderParametres };
  if (r[page]) r[page]();
  localStorage.setItem('crmtech_page', page);

  // Rafraîchissement automatique quand on clique sur Vue d'ensemble
  if (page === 'dashboard') {
    const indicator = document.getElementById('refresh-indicator');
    if (indicator) indicator.style.opacity = '1';
    loadAll().then(() => {
      renderDash();
      if (indicator) indicator.style.opacity = '0';
    });
  }
}

function restoreNav() {
  const saved = localStorage.getItem('crmtech_page') || 'dashboard';
  const el = document.querySelector(`.nav-item[onclick*="'${saved}'"]`);
  if (el) { nav(saved, el); }
  else     { renderDash(); }
}

/* ---- Dashboard ------------------------------------ */
function renderDash() {
  document.getElementById('dash-tickets').innerHTML = visibleTickets().slice(0,5).map(t => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1;min-width:0">
        <div style="font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.sujet}</div>
        <div style="font-size:11px;color:var(--text-secondary)">${t.client}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        ${statBadge(t.statut)}
        <span style="font-size:10px;font-family:var(--font-mono);color:var(--text-muted)">${t.id}</span>
      </div>
    </div>`).join('');

  const agenda = [
    { h:'09:00', t:'Visite maintenance — DataSoft SA', tech:'Karim Diallo'  },
    { h:'11:30', t:'Install NAS — DataSoft SA',        tech:'Karim Diallo'  },
    { h:'14:00', t:'Config VPN — Énergie Plus',        tech:'Sophie Martin' },
  ];
  document.getElementById('dash-agenda').innerHTML = agenda.map(a => `
    <div class="agenda-item">
      <div class="agenda-hour">${a.h}</div>
      <div><div class="agenda-title">${a.t}</div><div class="agenda-tech">${a.tech}</div></div>
    </div>`).join('');

  document.getElementById('dash-techload').innerHTML = techniciens.map((t,i) => {
    const pct = Math.round((t.actifs / 6) * 100);
    const grad = pct > 80 ? 'linear-gradient(90deg,#ff4f6d,#b91d73)'
               : pct > 60 ? 'linear-gradient(90deg,#ffd200,#f7971e)'
               :             'linear-gradient(90deg,#6a5af9,#3b82f6)';
    return `<div class="tech-load-item">
      <div class="avatar ${AVS[i%5]}">${fn(t.nom)}</div>
      <div class="tech-load-name">${t.nom}</div>
      <div class="tech-load-bar"><div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:${grad}"></div></div></div>
      <span class="tech-load-cnt">${t.actifs} tickets</span>
    </div>`;
  }).join('');

  document.getElementById('dash-contrats').innerHTML = contrats.filter(c=>c.statut==='Actif').slice(0,3).map(c => `
    <div style="padding:8px 0;border-bottom:1px solid var(--border)">
      <div class="rf" style="justify-content:space-between">
        <span style="font-size:12.5px;font-weight:600">${c.client}</span>
        ${c.fin.includes('2026') ? '<span class="badge b-amber">Expire 2026</span>' : '<span class="badge b-green">Actif</span>'}
      </div>
      <div style="font-size:11px;color:var(--text-secondary);margin-top:3px">${c.type} · Prochaine : ${c.next}</div>
    </div>`).join('');
}

/* ---- Calendrier ----------------------------------- */
function renderCalendar() {
  document.getElementById('cal-month-title').textContent = MONTHS[currentMonth] + ' ' + currentYear;
  document.getElementById('cal-names').innerHTML = DAYS.map(d => `<div class="cal-day-name">${d}</div>`).join('');
  const first = new Date(currentYear, currentMonth, 1).getDay();
  const offset = (first === 0 ? 6 : first - 1);
  const total  = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevTotal = new Date(currentYear, currentMonth, 0).getDate();
  let cells = '';
  for (let i = 0; i < offset; i++)
    cells += `<div class="cal-cell other-month"><div class="cal-num">${prevTotal - offset + i + 1}</div></div>`;
  for (let d = 1; d <= total; d++) {
    const isToday = d === 28 && currentMonth === 4 && currentYear === 2026;
    const evs = calEvents.filter(e => e.day === d && !e.next);
    cells += `<div class="cal-cell${isToday ? ' today' : ''}">
      <div class="cal-num">${d}</div>
      ${evs.map(e => `<div class="cal-event ${e.type}" title="${e.title}">${e.title.split(' — ')[0]}</div>`).join('')}
    </div>`;
  }
  const rem = (7 - ((offset + total) % 7)) % 7;
  for (let i = 1; i <= rem; i++) {
    const nextEvs = calEvents.filter(e => e.day === i && e.next);
    cells += `<div class="cal-cell other-month"><div class="cal-num">${i}</div>${nextEvs.map(e=>`<div class="cal-event ${e.type}">${e.title.split(' — ')[0]}</div>`).join('')}</div>`;
  }
  document.getElementById('cal-body').innerHTML = cells;
}
function changeMonth(d) {
  currentMonth += d;
  if (currentMonth > 11) { currentMonth = 0;  currentYear++; }
  if (currentMonth < 0)  { currentMonth = 11; currentYear--; }
  renderCalendar();
}

/* ---- Tickets -------------------------------------- */
function renderTickets() {
  const fs = document.getElementById('fs').value;
  const fp = document.getElementById('fp').value;
  let list = visibleTickets();
  if (fs) list = list.filter(t => t.statut === fs);
  if (fp) list = list.filter(t => t.prio   === fp);
  const tech = isTech();
  document.getElementById('tickets-body').innerHTML = list.map((t,i) => `
    <tr>
      <td class="mono" style="font-size:11px;color:var(--text-secondary)">${t.id}</td>
      <td title="${t.sujet}">${t.sujet}</td>
      <td>${t.client}</td>
      <td><div class="rf"><div class="avatar ${AVS[i%5]}">${fn(t.tech||'?')}</div>${(t.tech||'—').split(' ')[0]}</div></td>
      <td>${prioBadge(t.prio)}</td>
      <td>${statBadge(t.statut)}</td>
      <td class="muted">${t.date}</td>
      <td><div class="rf">
        <button class="btn btn-sm" onclick="resolveTicket(${t._id})" title="Résoudre"><i class="ti ti-circle-check ic-action-resolve"></i></button>
        ${!tech ? `<button class="btn btn-sm" onclick="editTicket(${t._id})" title="Modifier"><i class="ti ti-pencil ic-action-edit"></i></button>` : ''}
        ${!tech ? `<button class="btn btn-sm btn-danger" onclick="deleteTicket(${t._id})" title="Supprimer"><i class="ti ti-trash-x" style="color:#f87171"></i></button>` : ''}
      </div></td>
    </tr>`).join('');
}

function resolveTicket(id) {
  const t = tickets.find(x => x._id === id);
  if (t && t.statut !== 'Résolu') {
    apiFetch.put(`/tickets/${id}`, { statut:'Résolu' }).then(() => {
      reload(renderTickets);
      showNotif(`Ticket ${t.id} résolu`);
    });
  }
}

function editTicket(id) {
  const i = tickets.findIndex(x => x._id === id);
  currentEditIdx = i;
  const t = tickets[i];
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-hdr"><div class="modal-title">Modifier le ticket</div><button class="close-btn" onclick="closeModal()"><i class="ti ti-x" style="color:#f87171"></i></button></div>
    <div class="fg2">
      <div class="form-group"><label class="form-label">Client</label>
        <select id="e-client">${clients.map(c=>`<option${t.client===c.nom?' selected':''}>${c.nom}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Priorité</label>
        <select id="e-prio">${['Urgent','Haute','Normale','Basse'].map(p=>`<option${t.prio===p?' selected':''}>${p}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Sujet</label><input id="e-sujet" type="text" value="${t.sujet}"></div>
    <div class="fg2">
      <div class="form-group"><label class="form-label">Technicien</label>
        <select id="e-tech">${techniciens.map(tc=>`<option${t.tech===tc.nom?' selected':''}>${tc.nom}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Statut</label>
        <select id="e-statut">${['Ouvert','En cours','Résolu'].map(s=>`<option${t.statut===s?' selected':''}>${s}</option>`).join('')}</select>
      </div>
    </div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveTicket()"><i class="ti ti-device-floppy" style="color:#4ade80"></i> Enregistrer</button></div>`;
  document.getElementById('modal-overlay').classList.add('open');
}

function saveTicket() {
  const t = tickets[currentEditIdx];
  const data = {
    sujet:         document.getElementById('e-sujet').value.trim() || t.sujet,
    client_id:     getClientId(document.getElementById('e-client').value),
    technicien_id: getTechId(document.getElementById('e-tech').value),
    priorite:      document.getElementById('e-prio').value,
    statut:        document.getElementById('e-statut').value,
  };
  apiFetch.put(`/tickets/${t._id}`, data).then(() => {
    closeModal(); reload(renderTickets); showNotif('Ticket mis à jour');
  });
}

function deleteTicket(id) {
  const t = tickets.find(x => x._id === id);
  apiFetch.delete(`/tickets/${id}`).then(() => {
    reload(renderTickets); showNotif(`Ticket ${t?.id||''} supprimé`);
  });
}

/* ---- Dépannages ----------------------------------- */
function renderDepannages() {
  const tech = isTech();
  document.getElementById('dep-body').innerHTML = visibleDepannages().map((d,i) => `
    <tr>
      <td class="mono" style="font-size:11px;color:var(--text-secondary)">${d.id}</td>
      <td title="${d.desc}">${d.desc}</td>
      <td>${d.client}</td>
      <td title="${d.equip}">${d.equip}</td>
      <td><div class="rf"><div class="avatar ${AVS[i%5]}">${fn(d.tech||'?')}</div>${(d.tech||'—').split(' ')[0]}</div></td>
      <td>${prioBadge(d.prio)}</td>
      <td>${statBadge(d.statut)}</td>
      <td class="muted">${d.date}</td>
      <td style="font-weight:600;color:var(--green);font-size:11.5px">${d.montant ? d.montant+' FCFA' : '<span class="muted">—</span>'}</td>
      <td><div class="rf">
        ${tech
          ? `<button class="btn btn-sm" onclick="resolveDepannage(${d._id})" title="Marquer résolu"><i class="ti ti-circle-check ic-action-resolve"></i></button>`
          : `<button class="btn btn-sm" onclick="editDepannage(${d._id})" title="Modifier"><i class="ti ti-pencil ic-action-edit"></i></button>
             <button class="btn btn-sm btn-danger" onclick="deleteDepannage(${d._id})" title="Supprimer"><i class="ti ti-trash-x" style="color:#f87171"></i></button>`
        }
      </div></td>
    </tr>`).join('');
}

function editDepannage(id) {
  const i = depannages.findIndex(x => x._id === id);
  currentEditIdx = i;
  const d = depannages[i];
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-hdr"><div class="modal-title">Modifier le dépannage</div><button class="close-btn" onclick="closeModal()"><i class="ti ti-x" style="color:#f87171"></i></button></div>
    <div class="fg2">
      <div class="form-group"><label class="form-label">Client</label>
        <select id="e-client">${clients.map(c=>`<option${d.client===c.nom?' selected':''}>${c.nom}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Priorité</label>
        <select id="e-prio">${['Urgent','Haute','Normale','Basse'].map(p=>`<option${d.prio===p?' selected':''}>${p}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><input id="e-desc" type="text" value="${d.desc}"></div>
    <div class="form-group"><label class="form-label">Équipement</label><input id="e-equip" type="text" value="${d.equip}"></div>
    <div class="fg2">
      <div class="form-group"><label class="form-label">Technicien</label>
        <select id="e-tech">${techniciens.map(t=>`<option${d.tech===t.nom?' selected':''}>${t.nom}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Statut</label>
        <select id="e-statut">${['En cours','Résolu','Annulé'].map(s=>`<option${d.statut===s?' selected':''}>${s}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Montant du marché (FCFA)</label><input id="e-montant" type="text" placeholder="Ex: 850 000" value="${d.montant}"></div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveDepannage()"><i class="ti ti-device-floppy" style="color:#4ade80"></i> Enregistrer</button></div>`;
  document.getElementById('modal-overlay').classList.add('open');
}

function saveDepannage() {
  const d = depannages[currentEditIdx];
  const data = {
    description:       document.getElementById('e-desc').value.trim()  || d.desc,
    equipement:        document.getElementById('e-equip').value.trim() || d.equip,
    client_id:         getClientId(document.getElementById('e-client').value),
    technicien_id:     getTechId(document.getElementById('e-tech').value),
    priorite:          document.getElementById('e-prio').value,
    statut:            document.getElementById('e-statut').value,
    montant:           document.getElementById('e-montant').value.trim(),
  };
  apiFetch.put(`/depannages/${d._id}`, data).then(() => {
    closeModal(); reload(renderDepannages); showNotif('Dépannage mis à jour');
  });
}

function deleteDepannage(id) {
  apiFetch.delete(`/depannages/${id}`).then(() => {
    reload(renderDepannages); showNotif('Dépannage supprimé');
  });
}

function resolveDepannage(id) {
  const d = depannages.find(x => x._id === id);
  if (d && d.statut !== 'Résolu') {
    apiFetch.put(`/depannages/${id}`, { statut:'Résolu' }).then(() => {
      reload(renderDepannages); showNotif(`Dépannage ${d.id} résolu ✅`);
    });
  }
}

/* ---- Installations -------------------------------- */
function renderInstallations() {
  const tech = isTech();
  document.getElementById('installations-list').innerHTML = visibleInstallations().map((inst,i) => {
    const grad = inst.avancement === 100 ? 'linear-gradient(90deg,#11998e,#38ef7d)'
               : inst.avancement > 50    ? 'linear-gradient(90deg,#6a5af9,#3b82f6)'
               :                           'linear-gradient(90deg,#f7971e,#ffd200)';
    return `<div class="install-card">
      <div class="inst-hdr">
        <div><div class="inst-title">${inst.titre}</div><div class="inst-ref">${inst.id}</div></div>
        <div class="rf" style="gap:6px">
          ${statBadge(inst.statut)}
          ${tech
            ? `<button class="btn btn-sm" onclick="updateAvancement(${inst._id})" title="Mettre à jour avancement"><i class="ti ti-percentage ic-action-edit"></i></button>`
            : `<button class="btn btn-sm" onclick="editInstallation(${inst._id})" title="Modifier"><i class="ti ti-pencil ic-action-edit"></i></button>
               <button class="btn btn-sm btn-danger" onclick="deleteInstallation(${inst._id})" title="Supprimer"><i class="ti ti-trash-x" style="color:#f87171"></i></button>`
          }
        </div>
      </div>
      <div class="inst-body">
        <div><div class="inst-field">Client</div><div class="inst-val">${inst.client}</div></div>
        <div><div class="inst-field">Équipement</div><div class="inst-val">${inst.equip}</div></div>
        <div><div class="inst-field">Technicien</div><div class="inst-val">${inst.tech}</div></div>
        <div><div class="inst-field">Période</div><div class="inst-val">${inst.debut} → ${inst.fin}</div></div>
        ${inst.montant ? `<div><div class="inst-field">Montant du marché</div><div class="inst-val" style="font-weight:600;color:var(--green)">${inst.montant} FCFA</div></div>` : ''}
      </div>
      <div class="inst-progress">
        <div class="inst-progress-hdr"><span>Avancement</span><span>${inst.avancement}%</span></div>
        <div class="prog-bar" style="height:7px"><div class="prog-fill" style="width:${inst.avancement}%;background:${grad}"></div></div>
      </div>
    </div>`;
  }).join('');
}

function editInstallation(id) {
  const i = installations.findIndex(x => x._id === id);
  currentEditIdx = i;
  const inst = installations[i];
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-hdr"><div class="modal-title">Modifier l'installation</div><button class="close-btn" onclick="closeModal()"><i class="ti ti-x" style="color:#f87171"></i></button></div>
    <div class="form-group"><label class="form-label">Titre</label><input id="e-titre" type="text" value="${inst.titre}"></div>
    <div class="fg2">
      <div class="form-group"><label class="form-label">Client</label>
        <select id="e-client">${clients.map(c=>`<option${inst.client===c.nom?' selected':''}>${c.nom}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Technicien</label>
        <select id="e-tech">${techniciens.map(t=>`<option${inst.tech===t.nom?' selected':''}>${t.nom}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Équipement</label><input id="e-equip" type="text" value="${inst.equip}"></div>
    <div class="fg2">
      <div class="form-group"><label class="form-label">Date début (JJ/MM/AAAA)</label><input id="e-debut" type="text" value="${inst.debut}"></div>
      <div class="form-group"><label class="form-label">Date fin (JJ/MM/AAAA)</label><input id="e-fin" type="text" value="${inst.fin}"></div>
    </div>
    <div class="fg3">
      <div class="form-group"><label class="form-label">Avancement (%)</label><input id="e-av" type="number" min="0" max="100" value="${inst.avancement}"></div>
      <div class="form-group"><label class="form-label">Statut</label>
        <select id="e-statut">${['Planifié','En cours','Résolu','Annulé'].map(s=>`<option${inst.statut===s?' selected':''}>${s}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Montant du marché (FCFA)</label><input id="e-montant" type="text" placeholder="Ex: 1 500 000" value="${inst.montant}"></div>
    </div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveInstallation()"><i class="ti ti-device-floppy" style="color:#4ade80"></i> Enregistrer</button></div>`;
  document.getElementById('modal-overlay').classList.add('open');
}

function saveInstallation() {
  const inst = installations[currentEditIdx];
  const data = {
    titre:         document.getElementById('e-titre').value.trim() || inst.titre,
    client_id:     getClientId(document.getElementById('e-client').value),
    technicien_id: getTechId(document.getElementById('e-tech').value),
    equipement:    document.getElementById('e-equip').value.trim() || inst.equip,
    date_debut:    frToIso(document.getElementById('e-debut').value.trim()),
    date_fin:      frToIso(document.getElementById('e-fin').value.trim()),
    avancement:    parseInt(document.getElementById('e-av').value) || inst.avancement,
    statut:        document.getElementById('e-statut').value,
    montant:       document.getElementById('e-montant').value.trim(),
  };
  apiFetch.put(`/installations/${inst._id}`, data).then(() => {
    closeModal(); reload(renderInstallations); showNotif('Installation mise à jour');
  });
}

function deleteInstallation(id) {
  apiFetch.delete(`/installations/${id}`).then(() => {
    reload(renderInstallations); showNotif('Installation supprimée');
  });
}

function updateAvancement(id) {
  const inst = installations.find(x => x._id === id);
  if (!inst) return;
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-hdr">
      <div class="modal-title">Mettre à jour — ${inst.titre}</div>
      <button class="close-btn" onclick="closeModal()"><i class="ti ti-x" style="color:#f87171"></i></button>
    </div>
    <div class="form-group">
      <label class="form-label">Avancement (%)</label>
      <input id="e-av" type="range" min="0" max="100" value="${inst.avancement}"
        style="width:100%;accent-color:var(--accent)"
        oninput="document.getElementById('av-val').textContent=this.value+'%'">
      <div style="text-align:center;font-size:20px;font-weight:700;color:var(--accent);margin-top:6px" id="av-val">${inst.avancement}%</div>
    </div>
    <div class="form-group">
      <label class="form-label">Statut</label>
      <select id="e-statut">${['Planifié','En cours','Résolu','Annulé'].map(s=>`<option${inst.statut===s?' selected':''}>${s}</option>`).join('')}</select>
    </div>
    <div class="modal-actions">
      <button class="btn" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="saveAvancement(${id})"><i class="ti ti-device-floppy" style="color:#4ade80"></i> Enregistrer</button>
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
}

function saveAvancement(id) {
  const data = {
    avancement: parseInt(document.getElementById('e-av').value),
    statut:     document.getElementById('e-statut').value,
  };
  apiFetch.put(`/installations/${id}`, data).then(() => {
    closeModal(); reload(renderInstallations); showNotif('Avancement mis à jour ✅');
  });
}

/* ---- Contrats ------------------------------------- */
function renderContrats() {
  let list = contrats;
  if (contratTab === 'actif')  list = list.filter(c => c.statut === 'Actif');
  if (contratTab === 'expire') list = list.filter(c => c.statut === 'Expiré');
  document.getElementById('contrats-list').innerHTML = list.map(c => `
    <div class="contrat-card">
      <div class="contrat-hdr">
        <div><div class="contrat-client">${c.client}</div><div class="contrat-ref">${c.id}</div></div>
        <div class="rf" style="gap:6px">
          ${c.statut === 'Actif' ? '<span class="badge b-green">Actif</span>' : '<span class="badge b-red">Expiré</span>'}
          ${c.statut === 'Expiré' ? `<button class="btn btn-primary btn-sm" onclick="showNotif('Contrat en cours de renouvellement')">Renouveler</button>` : ''}
          <button class="btn btn-sm" onclick="openRapportModal(${c._id})" title="Rédiger rapport de visite" style="border-color:#9b8cff22"><i class="ti ti-file-description ic-violet"></i></button>
          <button class="btn btn-sm" onclick="editContrat(${c._id})" title="Modifier"><i class="ti ti-pencil ic-action-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteContrat(${c._id})" title="Supprimer"><i class="ti ti-trash-x" style="color:#f87171"></i></button>
        </div>
      </div>
      <div class="contrat-type">${c.type}</div>
      <div class="contrat-body">
        <div><div class="contrat-field">Début</div><div class="contrat-val">${c.debut}</div></div>
        <div><div class="contrat-field">Fin</div><div class="contrat-val">${c.fin}</div></div>
        <div><div class="contrat-field">Montant</div><div class="contrat-val">${c.montant} FCFA</div></div>
        <div><div class="contrat-field">Visites/an</div><div class="contrat-val">${c.visites}</div></div>
        <div><div class="contrat-field">Prochaine visite</div><div class="contrat-val">${c.next}</div></div>
      </div>
    </div>`).join('');
}

function editContrat(id) {
  const i = contrats.findIndex(x => x._id === id);
  currentEditIdx = i;
  const c = contrats[i];
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-hdr"><div class="modal-title">Modifier le contrat</div><button class="close-btn" onclick="closeModal()"><i class="ti ti-x" style="color:#f87171"></i></button></div>
    <div class="fg2">
      <div class="form-group"><label class="form-label">Client</label>
        <select id="e-client">${clients.map(cl=>`<option${c.client===cl.nom?' selected':''}>${cl.nom}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Type de contrat</label>
        <select id="e-type">${['Maintenance préventive','Maintenance corrective','Maintenance corrective 24/7','Maintenance 24/7','Contrat global TMA','Maintenance matériel','Maintenance réseau'].map(tp=>`<option${c.type===tp?' selected':''}>${tp}</option>`).join('')}</select>
      </div>
    </div>
    <div class="fg3">
      <div class="form-group"><label class="form-label">Date début</label><input id="e-debut" type="text" value="${c.debut}"></div>
      <div class="form-group"><label class="form-label">Date fin</label><input id="e-fin" type="text" value="${c.fin}"></div>
      <div class="form-group"><label class="form-label">Visites/an</label><input id="e-visites" type="number" min="1" value="${c.visites}"></div>
    </div>
    <div class="fg2">
      <div class="form-group"><label class="form-label">Montant (FCFA)</label><input id="e-montant" type="text" value="${c.montant}"></div>
      <div class="form-group"><label class="form-label">Statut</label>
        <select id="e-statut"><option${c.statut==='Actif'?' selected':''}>Actif</option><option${c.statut==='Expiré'?' selected':''}>Expiré</option></select>
      </div>
    </div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveContrat()"><i class="ti ti-device-floppy" style="color:#4ade80"></i> Enregistrer</button></div>`;
  document.getElementById('modal-overlay').classList.add('open');
}

function saveContrat() {
  const c = contrats[currentEditIdx];
  const data = {
    client_id:     getClientId(document.getElementById('e-client').value),
    type_contrat:  document.getElementById('e-type').value,
    date_debut:    frToIso(document.getElementById('e-debut').value.trim()),
    date_fin:      frToIso(document.getElementById('e-fin').value.trim()),
    visites_par_an:parseInt(document.getElementById('e-visites').value) || c.visites,
    montant:       document.getElementById('e-montant').value.trim() || c.montant,
    statut:        document.getElementById('e-statut').value,
  };
  apiFetch.put(`/contrats/${c._id}`, data).then(() => {
    closeModal(); reload(renderContrats); showNotif('Contrat mis à jour');
  });
}

function deleteContrat(id) {
  apiFetch.delete(`/contrats/${id}`).then(() => {
    reload(renderContrats); showNotif('Contrat supprimé');
  });
}

function setContratTab(el, tab) {
  document.querySelectorAll('#panel-contrats .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active'); contratTab = tab; renderContrats();
}

/* ---- Clients -------------------------------------- */
function renderClients() {
  document.getElementById('clients-body').innerHTML = clients.map((c,i) => `
    <tr>
      <td><div class="rf"><div class="avatar ${AVS[i%5]}">${fn(c.nom)}</div>${c.nom}</div></td>
      <td>${c.secteur}</td><td>${c.contact}</td>
      <td class="muted">${c.email}</td>
      <td><span class="badge b-blue">${c.tickets}</span></td>
      <td>${c.contrat==='Actif'?'<span class="badge b-green">Actif</span>':'<span class="badge b-red">Expiré</span>'}</td>
      <td class="muted">${c.ville}</td>
      <td><div class="rf">
        <button class="btn btn-sm" onclick="editClient(${c._id})" title="Modifier"><i class="ti ti-pencil ic-action-edit"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteClient(${c._id})" title="Supprimer"><i class="ti ti-trash-x" style="color:#f87171"></i></button>
      </div></td>
    </tr>`).join('');
}

function editClient(id) {
  const i = clients.findIndex(x => x._id === id);
  currentEditIdx = i;
  const c = clients[i];
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-hdr"><div class="modal-title">Modifier le client</div><button class="close-btn" onclick="closeModal()"><i class="ti ti-x" style="color:#f87171"></i></button></div>
    <div class="fg2">
      <div class="form-group"><label class="form-label">Raison sociale</label><input id="e-nom" type="text" value="${c.nom}"></div>
      <div class="form-group"><label class="form-label">Secteur</label>
        <select id="e-secteur">${['Industrie','BTP','Santé','IT','Énergie','Commerce'].map(s=>`<option${c.secteur===s?' selected':''}>${s}</option>`).join('')}</select>
      </div>
    </div>
    <div class="fg2">
      <div class="form-group"><label class="form-label">Contact principal</label><input id="e-contact" type="text" value="${c.contact}"></div>
      <div class="form-group"><label class="form-label">Email</label><input id="e-email" type="email" value="${c.email}"></div>
    </div>
    <div class="fg2">
      <div class="form-group"><label class="form-label">Ville</label><input id="e-ville" type="text" value="${c.ville}"></div>
      <div class="form-group"><label class="form-label">Contrat</label>
        <select id="e-contrat"><option${c.contrat==='Actif'?' selected':''}>Actif</option><option${c.contrat==='Expiré'?' selected':''}>Expiré</option><option${c.contrat==='Aucun'?' selected':''}>Aucun</option></select>
      </div>
    </div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveClient()"><i class="ti ti-device-floppy" style="color:#4ade80"></i> Enregistrer</button></div>`;
  document.getElementById('modal-overlay').classList.add('open');
}

function saveClient() {
  const c = clients[currentEditIdx];
  const data = {
    nom:     document.getElementById('e-nom').value.trim()     || c.nom,
    secteur: document.getElementById('e-secteur').value,
    contact: document.getElementById('e-contact').value.trim() || c.contact,
    email:   document.getElementById('e-email').value.trim()   || c.email,
    ville:   document.getElementById('e-ville').value.trim()   || c.ville,
    contrat: document.getElementById('e-contrat').value,
  };
  apiFetch.put(`/clients/${c._id}`, data).then(() => {
    closeModal(); reload(renderClients); showNotif('Client mis à jour');
  });
}

function deleteClient(id) {
  apiFetch.delete(`/clients/${id}`).then(() => {
    reload(renderClients); showNotif('Client supprimé');
  });
}

/* ---- Techniciens ---------------------------------- */
function techAvatar(t, i) {
  if (t.photo) return `<img src="${t.photo}" alt="${t.nom}" class="avatar-photo">`;
  return `<div class="avatar ${AVS[i%5]}">${fn(t.nom)}</div>`;
}

function renderTechniciens() {
  const tech = isTech();
  document.getElementById('tech-body').innerHTML = visibleTechniciens().map((t,i) => {
    const sc = t.statut==='Disponible'?'b-green':t.statut==='Occupé'?'b-amber':'b-red';
    return `<tr>
      <td><div class="rf">${techAvatar(t,i)}<span>${t.nom}</span></div></td>
      <td class="muted">${t.spec}</td>
      <td><span class="badge b-blue">${t.actifs}</span></td>
      <td>${t.resolus}</td>
      <td><div class="prog-bar" style="width:90px"><div class="prog-fill" style="width:${t.dispo}%"></div></div></td>
      <td><span class="badge ${sc}">${t.statut}</span></td>
      <td class="muted">${t.tel}</td>
      <td><div class="rf">
        ${!tech
          ? `<button class="btn btn-sm" onclick="editTech(${t._id})" title="Modifier"><i class="ti ti-pencil ic-action-edit"></i></button>
             <button class="btn btn-sm btn-danger" onclick="deleteTech(${t._id})" title="Supprimer"><i class="ti ti-trash-x" style="color:#f87171"></i></button>`
          : `<span class="badge b-gray" style="font-size:10px">Mon profil</span>`
        }
      </div></td>
    </tr>`;
  }).join('');
}

function editTech(id) {
  const i = techniciens.findIndex(x => x._id === id);
  currentEditIdx = i;
  const t = techniciens[i];
  const photoHtml = t.photo
    ? `<img id="photo-preview" src="${t.photo}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);display:block;margin-bottom:6px">`
    : `<div id="photo-preview" class="avatar ${AVS[i%5]}" style="width:72px;height:72px;font-size:22px;margin-bottom:6px">${fn(t.nom)}</div>`;
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-hdr"><div class="modal-title">Modifier le technicien</div><button class="close-btn" onclick="closeModal()"><i class="ti ti-x" style="color:#f87171"></i></button></div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
      ${photoHtml}
      <div>
        <label class="form-label">Photo de profil</label>
        <input type="file" id="e-photo" accept="image/*" onchange="previewPhoto(this)" style="font-size:12px;color:var(--text-secondary)">
        <div style="font-size:11px;color:var(--text-muted);margin-top:3px">JPG, PNG — max 2 Mo</div>
      </div>
    </div>
    <div class="fg2">
      <div class="form-group"><label class="form-label">Nom complet</label><input id="e-nom" type="text" value="${t.nom}"></div>
      <div class="form-group"><label class="form-label">Poste occupé</label><input id="e-spec" type="text" value="${t.spec}"></div>
    </div>
    <div class="fg2">
      <div class="form-group"><label class="form-label">Téléphone</label><input id="e-tel" type="tel" value="${t.tel}"></div>
      <div class="form-group"><label class="form-label">Statut</label>
        <select id="e-statut">
          <option${t.statut==='Disponible'?' selected':''}>Disponible</option>
          <option${t.statut==='Occupé'?' selected':''}>Occupé</option>
          <option${t.statut==='En intervention'?' selected':''}>En intervention</option>
        </select>
      </div>
    </div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveTech()"><i class="ti ti-device-floppy" style="color:#4ade80"></i> Enregistrer</button></div>`;
  document.getElementById('modal-overlay').classList.add('open');
}

function previewPhoto(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('photo-preview');
    if (prev) {
      prev.outerHTML = `<img id="photo-preview" src="${e.target.result}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);display:block;margin-bottom:6px">`;
    }
  };
  reader.readAsDataURL(input.files[0]);
}

function buildTechFormData(fields) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k,v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
  const photoInput = document.getElementById('e-photo');
  if (photoInput && photoInput.files[0]) fd.append('photo', photoInput.files[0]);
  return fd;
}

function saveTech() {
  const t = techniciens[currentEditIdx];
  const fd = buildTechFormData({
    nom:        document.getElementById('e-nom').value.trim()  || t.nom,
    specialite: document.getElementById('e-spec').value.trim() || t.spec,
    telephone:  document.getElementById('e-tel').value.trim()  || t.tel,
    statut:     document.getElementById('e-statut').value,
    _method:    'PUT',   // Laravel method spoofing pour FormData
  });
  fetch(`${API}/techniciens/${t._id}`, { method:'POST', headers:{'Accept':'application/json'}, body:fd })
    .then(r => r.json())
    .then(() => { closeModal(); reload(renderTechniciens); showNotif('Technicien mis à jour'); });
}

function togglePwField(id, btn) {
  const input = document.getElementById(id);
  const icon  = btn.querySelector('i');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  icon.className = input.type === 'password' ? 'ti ti-eye' : 'ti ti-eye-off';
}

function addTech() {
  const nom      = document.getElementById('e-nom').value.trim();
  const login    = (document.getElementById('e-login')?.value    || '').trim().toLowerCase();
  const password = (document.getElementById('e-password')?.value || '').trim();

  if (!nom)             { showNotif('⚠️ Le nom est requis'); return; }
  if (!login)           { showNotif('⚠️ L\'identifiant de connexion est requis'); return; }
  if (password.length < 6) { showNotif('⚠️ Mot de passe trop court (min. 6 car.)'); return; }
  if (getAllUsers().some(u => u.login === login)) {
    showNotif('⚠️ Cet identifiant est déjà utilisé'); return;
  }

  const fd = buildTechFormData({
    nom,
    specialite: document.getElementById('e-spec').value.trim(),
    telephone:  document.getElementById('e-tel').value.trim(),
    statut:     document.getElementById('e-statut').value,
  });

  fetch(`${API}/techniciens`, { method:'POST', headers:{'Accept':'application/json'}, body:fd })
    .then(r => r.json())
    .then(() => {
      const initials = nom.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
      const extras   = getExtraUsers();
      extras.push({ login, password, nom, role:'Technicien', avatar:initials, techNom:nom, base:false });
      saveExtraUsers(extras);
      closeModal();
      reload(renderTechniciens);
      renderComptes();
      showNotif(`${nom} ajouté avec accès CRM ✅`);
    });
}

function deleteTech(id) {
  const tech = techniciens.find(t => t._id === id);
  apiFetch.delete(`/techniciens/${id}`).then(() => {
    // Supprimer le compte CRM associé
    if (tech) {
      const extras = getExtraUsers().filter(u => u.techNom !== tech.nom);
      saveExtraUsers(extras);
      renderComptes();
    }
    reload(renderTechniciens);
    showNotif('Technicien supprimé');
  });
}

/* ---- Historique ----------------------------------- */
function renderHistorique() {
  const f = document.getElementById('hist-filter').value;
  let list = historique;
  if (f) list = list.filter(h => h.type === f);
  document.getElementById('hist-list').innerHTML = list.map(h => `
    <div class="hist-item">
      <div class="hist-icon ${h.cls}"><i class="ti ${h.icon}"></i></div>
      <div class="hist-body">
        <div class="hist-title">${h.title}</div>
        <div class="hist-detail">${h.detail}</div>
      </div>
      <div class="hist-time">${h.time}</div>
    </div>`).join('');
}

/* ---- Export PDF ----------------------------------- */
function renderExport() {
  const today = new Date().toLocaleDateString('fr-FR');
  const exports = [
    { titre:'Tous les tickets',         icon:'ti-ticket ic-orange',     type:'tickets' },
    { titre:'Tous les dépannages',      icon:'ti-bolt ic-red',          type:'depannages' },
    { titre:'Tous les contrats',        icon:'ti-file-check ic-yellow', type:'contrats' },
    { titre:'Toutes les installations', icon:'ti-crane ic-green',       type:'installations' },
    { titre:'Liste des techniciens',    icon:'ti-user-cog ic-cyan',     type:'techniciens' },
    { titre:'Rapport global',           icon:'ti-chart-bar ic-violet',  type:'global' },
  ];
  document.getElementById('export-list').innerHTML = exports.map(r => `
    <div class="export-row">
      <div class="rf" style="gap:10px">
        <i class="ti ${r.icon}" style="font-size:18px"></i>
        <div><div class="export-label">${r.titre}</div><div class="export-desc">Données en temps réel · ${today}</div></div>
      </div>
      <div class="export-actions">
        <button class="btn btn-sm" onclick="exportPDF('${r.type}')" title="Télécharger en PDF" style="border-color:#f8717133"><i class="ti ti-file-type-pdf" style="color:#f87171"></i> PDF</button>
        <button class="btn btn-sm" onclick="exportExcel('${r.type}')" title="Télécharger en Excel" style="border-color:#4ade8033"><i class="ti ti-file-type-xls" style="color:#4ade80"></i> Excel</button>
        <button class="btn btn-sm" onclick="exportWord('${r.type}')" title="Télécharger en Word" style="border-color:#60a5fa33"><i class="ti ti-file-type-doc" style="color:#60a5fa"></i> Word</button>
      </div>
    </div>`).join('');
  const selClient = document.getElementById('exp-client');
  if (selClient) {
    selClient.innerHTML = '<option value="">Tous les clients</option>' +
      clients.map(c => `<option value="${c.nom}">${c.nom}</option>`).join('');
  }
  updateStatutOptions();
  const expType = document.getElementById('exp-type');
  if (expType) expType.addEventListener('change', updateStatutOptions);
}

function updateStatutOptions() {
  const type = document.getElementById('exp-type')?.value;
  const sel  = document.getElementById('exp-statut');
  if (!sel) return;
  const opts = {
    tickets:       ['Ouvert','En cours','Résolu','Annulé'],
    depannages:    ['En cours','Résolu','Annulé'],
    contrats:      ['Actif','Expiré'],
    installations: ['Planifié','En cours','Terminé','Annulé'],
    techniciens:   ['Disponible','Occupé','En intervention'],
    global:        [],
  };
  const list = opts[type] || [];
  sel.innerHTML = '<option value="">Tous</option>' + list.map(s => `<option>${s}</option>`).join('');
}

function exportPDF(type, filtreClient, filtreStatut) {
  filtreClient = filtreClient || '';
  filtreStatut = filtreStatut || '';
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
  const today = new Date().toLocaleDateString('fr-FR');
  const W = doc.internal.pageSize.getWidth();

  // En-tête commune
  doc.setFillColor(26,27,46);
  doc.rect(0,0,W,22,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(14); doc.setFont('helvetica','bold');
  doc.text('TechCRM — Service Technique', 14, 10);
  doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text('Généré le ' + today, 14, 17);

  const filtrer = arr => arr.filter(x =>
    (!filtreClient || x.client === filtreClient) &&
    (!filtreStatut || x.statut === filtreStatut)
  );

  let titre, head, body, filename;

  if (type === 'tickets') {
    titre = 'Rapport — Tickets';
    filename = 'tickets_' + today.replace(/\//g,'-') + '.pdf';
    head = [['Référence','Sujet','Client','Technicien','Catégorie','Priorité','Statut','Date']];
    body = filtrer(tickets).map(t => [t.id, t.sujet, t.client, t.tech, t.cat||'-', t.prio||'-', t.statut, t.date||'-']);

  } else if (type === 'depannages') {
    titre = 'Rapport — Dépannages';
    filename = 'depannages_' + today.replace(/\//g,'-') + '.pdf';
    head = [['Référence','Description','Client','Technicien','Équipement','Priorité','Statut','Montant']];
    body = filtrer(depannages).map(d => [d.id, d.desc, d.client, d.tech, d.equip||'-', d.prio||'-', d.statut, d.montant ? d.montant+' FCFA' : '-']);

  } else if (type === 'contrats') {
    titre = 'Rapport — Contrats de maintenance';
    filename = 'contrats_' + today.replace(/\//g,'-') + '.pdf';
    head = [['Référence','Client','Type','Début','Fin','Montant','Visites/an','Proch. visite','Statut']];
    body = filtrer(contrats).map(c => [c.id, c.client, c.type, c.debut, c.fin, c.montant+' FCFA', c.visites, c.next, c.statut]);

  } else if (type === 'installations') {
    titre = 'Rapport — Installations';
    filename = 'installations_' + today.replace(/\//g,'-') + '.pdf';
    head = [['Référence','Titre','Client','Technicien','Équipement','Début','Fin','Avancement','Statut','Montant']];
    body = filtrer(installations).map(i => [i.id, i.titre, i.client, i.tech, i.equip||'-', i.debut, i.fin, i.avancement+'%', i.statut, i.montant ? i.montant+' FCFA' : '-']);

  } else if (type === 'techniciens') {
    titre = 'Rapport — Techniciens';
    filename = 'techniciens_' + today.replace(/\//g,'-') + '.pdf';
    head = [['Nom','Poste occupé','Tickets actifs','Résolus','Disponibilité','Statut','Téléphone']];
    body = techniciens
      .filter(t => !filtreStatut || t.statut === filtreStatut)
      .map(t => [t.nom, t.spec||'-', t.actifs, t.resolus, t.dispo+'%', t.statut, t.tel||'-']);

  } else {
    // Rapport global
    titre = 'Rapport global — TechCRM';
    filename = 'rapport_global_' + today.replace(/\//g,'-') + '.pdf';
    doc.setTextColor(30,30,60); doc.setFontSize(14); doc.setFont('helvetica','bold');
    doc.text(titre, 14, 34);
    doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(80,80,80);
    const kpis = [
      ['Techniciens', techniciens.length], ['Clients', clients.length],
      ['Tickets', tickets.length], ['Dépannages', depannages.length],
      ['Installations', installations.length], ['Contrats actifs', contrats.filter(c=>c.statut==='Actif').length]
    ];
    kpis.forEach(([k,v],i) => doc.text(k+' : '+v, 14+(i%3)*90, 44+Math.floor(i/3)*7));
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(30,30,60);
    doc.text('Tickets récents', 14, 62);
    doc.autoTable({ startY:65, head:[['Réf','Sujet','Client','Priorité','Statut']], body:tickets.slice(0,10).map(t=>[t.id,t.sujet,t.client,t.prio,t.statut]), theme:'grid', styles:{fontSize:8}, headStyles:{fillColor:[26,27,46]}, margin:{left:14,right:14} });
    const y2 = doc.lastAutoTable.finalY + 8;
    doc.text('Contrats actifs', 14, y2);
    doc.autoTable({ startY:y2+3, head:[['Réf','Client','Type','Proch. visite','Statut']], body:contrats.filter(c=>c.statut==='Actif').map(c=>[c.id,c.client,c.type,c.next,c.statut]), theme:'grid', styles:{fontSize:8}, headStyles:{fillColor:[26,27,46]}, margin:{left:14,right:14} });
    addPageNumbers(doc, W);
    doc.save(filename);
    showNotif('Rapport global téléchargé ✅');
    return;
  }

  // Tableau standard
  doc.setTextColor(30,30,60); doc.setFontSize(14); doc.setFont('helvetica','bold');
  doc.text(titre, 14, 34);
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(100,100,100);
  doc.text(body.length + ' enregistrement(s)', 14, 40);
  doc.autoTable({
    startY: 44, head, body: body.length ? body : [['Aucune donnée disponible']],
    theme: 'grid', styles: { fontSize:8, cellPadding:3 },
    headStyles: { fillColor:[26,27,46], textColor:255, fontStyle:'bold' },
    alternateRowStyles: { fillColor:[245,245,252] },
    margin: { left:14, right:14 },
  });
  addPageNumbers(doc, W);
  doc.save(filename);
  showNotif('PDF téléchargé ✅');
}

function addPageNumbers(doc, W) {
  const pc = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pc; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text('Page '+i+' / '+pc+' — TechCRM', W/2, doc.internal.pageSize.getHeight()-5, { align:'center' });
  }
}

function genererExport(format) {
  const type   = document.getElementById('exp-type').value;
  const client = document.getElementById('exp-client').value;
  const statut = document.getElementById('exp-statut').value;
  if (format === 'pdf')   exportPDF(type, client, statut);
  if (format === 'excel') exportExcel(type, client, statut);
  if (format === 'word')  exportWord(type, client, statut);
}

/* -- Données communes pour export -- */
function getExportData(type, filtreClient, filtreStatut) {
  filtreClient = filtreClient || '';
  filtreStatut = filtreStatut || '';
  const filtrer = arr => arr.filter(x =>
    (!filtreClient || x.client === filtreClient) &&
    (!filtreStatut || x.statut === filtreStatut)
  );
  const configs = {
    tickets:       { titre:'Tickets',              head:['Référence','Sujet','Client','Technicien','Catégorie','Priorité','Statut','Date'],           rows: filtrer(tickets).map(t=>[t.id,t.sujet,t.client,t.tech,t.cat||'-',t.prio||'-',t.statut,t.date||'-']) },
    depannages:    { titre:'Dépannages',            head:['Référence','Description','Client','Technicien','Équipement','Priorité','Statut','Montant'], rows: filtrer(depannages).map(d=>[d.id,d.desc,d.client,d.tech,d.equip||'-',d.prio||'-',d.statut,d.montant?d.montant+' FCFA':'-']) },
    contrats:      { titre:'Contrats',              head:['Référence','Client','Type','Début','Fin','Montant','Visites/an','Proch. visite','Statut'],  rows: filtrer(contrats).map(c=>[c.id,c.client,c.type,c.debut,c.fin,c.montant+' FCFA',c.visites,c.next,c.statut]) },
    installations: { titre:'Installations',         head:['Référence','Titre','Client','Technicien','Équipement','Début','Fin','Avancement','Statut','Montant'], rows: filtrer(installations).map(i=>[i.id,i.titre,i.client,i.tech,i.equip||'-',i.debut,i.fin,i.avancement+'%',i.statut,i.montant?i.montant+' FCFA':'-']) },
    techniciens:   { titre:'Techniciens',           head:['Nom','Poste occupé','Tickets actifs','Résolus','Disponibilité','Statut','Téléphone'],         rows: techniciens.filter(t=>!filtreStatut||t.statut===filtreStatut).map(t=>[t.nom,t.spec||'-',t.actifs,t.resolus,t.dispo+'%',t.statut,t.tel||'-']) },
    global:        { titre:'Rapport global',        head:['Type','Nombre'], rows:[['Techniciens',techniciens.length],['Clients',clients.length],['Tickets',tickets.length],['Dépannages',depannages.length],['Installations',installations.length],['Contrats actifs',contrats.filter(c=>c.statut==='Actif').length]] },
  };
  return configs[type] || configs.global;
}

/* -- Export Excel (SheetJS) -- */
function exportExcel(type, filtreClient, filtreStatut) {
  const { titre, head, rows } = getExportData(type, filtreClient, filtreStatut);
  const today = new Date().toLocaleDateString('fr-FR');
  const wb = XLSX.utils.book_new();

  // Feuille principale
  const wsData = [head, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Style largeur des colonnes
  ws['!cols'] = head.map(() => ({ wch: 20 }));

  // Geler la ligne d'en-tête
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, ws, titre.slice(0, 31));
  XLSX.writeFile(wb, titre.replace(/[^a-zA-Z0-9]/g,'_') + '_' + today.replace(/\//g,'-') + '.xlsx');
  showNotif('Excel téléchargé ✅');
}

/* -- Export Word (.doc via HTML) -- */
function exportWord(type, filtreClient, filtreStatut) {
  const { titre, head, rows } = getExportData(type, filtreClient, filtreStatut);
  const today = new Date().toLocaleDateString('fr-FR');

  const headerRow = head.map(h => `<th style="background:#1a1b2e;color:white;padding:7px 10px;text-align:left;font-size:11pt">${h}</th>`).join('');
  const bodyRows  = rows.map((row, i) =>
    `<tr style="background:${i%2===0?'#ffffff':'#f5f5fc'}">${row.map(cell => `<td style="padding:6px 10px;border:1px solid #ddd;font-size:10pt">${cell ?? '-'}</td>`).join('')}</tr>`
  ).join('');

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${titre}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; margin: 2cm; color: #1a1b2e; }
  h1   { color: #1a1b2e; font-size: 18pt; margin-bottom: 4px; }
  p.sub{ color: #888; font-size: 10pt; margin-bottom: 20px; }
  table{ border-collapse: collapse; width: 100%; }
  th   { font-size: 11pt; }
  td   { font-size: 10pt; }
  .footer { margin-top: 24px; font-size: 9pt; color: #aaa; text-align: center; }
</style></head>
<body>
  <h1>TechCRM — ${titre}</h1>
  <p class="sub">Généré le ${today} · ${rows.length} enregistrement(s)</p>
  <table>
    <thead><tr>${headerRow}</tr></thead>
    <tbody>${bodyRows || '<tr><td colspan="${head.length}" style="padding:10px;color:#aaa">Aucune donnée</td></tr>'}</tbody>
  </table>
  <p class="footer">Document généré par TechCRM — Service Technique</p>
</body></html>`;

  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = titre.replace(/[^a-zA-Z0-9]/g,'_') + '_' + today.replace(/\//g,'-') + '.doc';
  a.click();
  URL.revokeObjectURL(url);
  showNotif('Word téléchargé ✅');
}

/* ---- Statistiques --------------------------------- */
function renderStats() {
  const n = parseInt(document.getElementById('stat-period').value);
  const allM = ['Déc','Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov'];
  const months = allM.slice(12 - n);
  const data1  = Array.from({ length: n }, () => Math.round(30 + Math.random() * 30));
  const grid = 'rgba(255,255,255,0.05)';
  const tick = '#8b90b8';
  const base = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: grid }, ticks: { color: tick } },
      x: { grid: { display: false }, ticks: { color: tick } },
    }
  };
  if (charts.t) charts.t.destroy();
  charts.t = new Chart(document.getElementById('chart-tickets'), {
    type: 'bar',
    data: { labels: months, datasets: [{ label:'Tickets', data: data1, backgroundColor:'rgba(106,90,249,0.7)', borderRadius:5 }] },
    options: base,
  });
  if (charts.c) charts.c.destroy();
  charts.c = new Chart(document.getElementById('chart-cat'), {
    type: 'doughnut',
    data: {
      labels: ['Matériel','Logiciel','Réseau','Électrique'],
      datasets: [{ data:[42,27,18,13], backgroundColor:['#6a5af9','#38ef7d','#ffd200','#ff4f6d'], borderWidth:0 }]
    },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, cutout:'62%' }
  });
  if (charts.p) charts.p.destroy();
  charts.p = new Chart(document.getElementById('chart-tech'), {
    type: 'bar',
    data: {
      labels: techniciens.map(t => t.nom.split(' ').map((w,i)=>i===0?w[0]+'.':w).join(' ')),
      datasets: [{ label:'Résolus', data: techniciens.map(t=>t.resolus), backgroundColor:'rgba(56,239,125,0.65)', borderRadius:5 }]
    },
    options: { ...base, indexAxis:'y',
      scales: { x: { beginAtZero:true, grid:{color:grid}, ticks:{color:tick} }, y: { grid:{display:false}, ticks:{color:tick} } }
    }
  });
  if (charts.d) charts.d.destroy();
  charts.d = new Chart(document.getElementById('chart-delai'), {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label:'Délai (h)',
        data: Array.from({length:n},(_,i)=>parseFloat((2.8-i*.05+Math.random()*.4).toFixed(1))),
        borderColor:'#f953c6', backgroundColor:'rgba(249,83,198,0.08)',
        tension:.4, pointRadius:3, fill:true
      }]
    },
    options: { ...base,
      scales: { y:{beginAtZero:false,grid:{color:grid},ticks:{color:tick}}, x:{grid:{display:false},ticks:{color:tick}} }
    }
  });
}

/* ---- Modals (création) ----------------------------- */
const modalTemplates = {
  technicien: `<div class="modal-hdr"><div class="modal-title">Ajouter un technicien</div><button class="close-btn" onclick="closeModal()"><i class="ti ti-x" style="color:#f87171"></i></button></div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
      <div id="photo-preview" style="width:72px;height:72px;border-radius:50%;background:var(--bg-input);border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="ti ti-user" style="font-size:28px;color:var(--text-muted)"></i>
      </div>
      <div>
        <label class="form-label">Photo de profil</label>
        <input type="file" id="e-photo" accept="image/*" onchange="previewPhoto(this)" style="font-size:12px;color:var(--text-secondary)">
        <div style="font-size:11px;color:var(--text-muted);margin-top:3px">JPG, PNG — max 2 Mo (optionnel)</div>
      </div>
    </div>
    <div class="fg2">
      <div class="form-group"><label class="form-label">Nom complet <span style="color:#f87171">*</span></label><input id="e-nom" type="text" placeholder="Prénom Nom"></div>
      <div class="form-group"><label class="form-label">Poste occupé</label><input id="e-spec" type="text" placeholder="Ex: Technicien réseau…"></div>
    </div>
    <div class="fg2">
      <div class="form-group"><label class="form-label">Téléphone</label><input id="e-tel" type="tel" placeholder="+225 07 00 00 00"></div>
      <div class="form-group"><label class="form-label">Statut</label>
        <select id="e-statut"><option>Disponible</option><option>Occupé</option><option>En intervention</option></select>
      </div>
    </div>
    <div class="modal-section-divider"><i class="ti ti-lock"></i> Accès CRM</div>
    <div class="fg2">
      <div class="form-group">
        <label class="form-label">Identifiant de connexion <span style="color:#f87171">*</span></label>
        <input id="e-login" type="text" placeholder="ex: k.diallo" autocomplete="off">
      </div>
      <div class="form-group">
        <label class="form-label">Mot de passe initial <span style="color:#f87171">*</span></label>
        <div style="position:relative">
          <input id="e-password" type="password" placeholder="min. 6 caractères" autocomplete="new-password">
          <button type="button" onclick="togglePwField('e-password',this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:15px"><i class="ti ti-eye"></i></button>
        </div>
      </div>
    </div>
    <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:4px"><i class="ti ti-info-circle" style="margin-right:4px"></i>Le technicien pourra modifier son mot de passe depuis ses paramètres.</div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="addTech()"><i class="ti ti-user-plus" style="color:#4ade80"></i> Ajouter</button></div>`,
};

function openModal(type) {
  if (modalTemplates[type]) {
    document.getElementById('modal-content').innerHTML = modalTemplates[type];
    document.getElementById('modal-overlay').classList.add('open');
    return;
  }
  // Modals dynamiques avec données live
  const clientOpts  = clients.map(c=>`<option>${c.nom}</option>`).join('');
  const techOpts    = techniciens.map(t=>`<option>${t.nom}</option>`).join('');
  const today       = new Date().toISOString().split('T')[0];

  const tpls = {
    ticket: `<div class="modal-hdr"><div class="modal-title">Nouveau ticket</div><button class="close-btn" onclick="closeModal()"><i class="ti ti-x" style="color:#f87171"></i></button></div>
      <div class="fg2">
        <div class="form-group"><label class="form-label">Client</label><select id="n-client">${clientOpts}</select></div>
        <div class="form-group"><label class="form-label">Priorité</label><select id="n-prio"><option>Normale</option><option>Haute</option><option>Urgent</option><option>Basse</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">Sujet</label><input id="n-sujet" type="text" placeholder="Décrivez le problème…"></div>
      <div class="fg3">
        <div class="form-group"><label class="form-label">Catégorie</label><select id="n-cat"><option>Matériel</option><option>Logiciel</option><option>Réseau</option><option>Électrique</option></select></div>
        <div class="form-group"><label class="form-label">Technicien</label><select id="n-tech">${techOpts}</select></div>
        <div class="form-group"><label class="form-label">Date prévue</label><input id="n-date" type="date" value="${today}"></div>
      </div>
      <div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="createTicket()"><i class="ti ti-circle-plus" style="color:#4ade80"></i> Créer</button></div>`,

    depannage: `<div class="modal-hdr"><div class="modal-title">Nouveau dépannage</div><button class="close-btn" onclick="closeModal()"><i class="ti ti-x" style="color:#f87171"></i></button></div>
      <div class="fg2">
        <div class="form-group"><label class="form-label">Client</label><select id="n-client">${clientOpts}</select></div>
        <div class="form-group"><label class="form-label">Priorité</label><select id="n-prio"><option>Normale</option><option>Haute</option><option>Urgent</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">Description de la panne</label><input id="n-desc" type="text" placeholder="Ex: Onduleur hors service…"></div>
      <div class="form-group"><label class="form-label">Équipement concerné</label><input id="n-equip" type="text" placeholder="Marque, modèle…"></div>
      <div class="fg2">
        <div class="form-group"><label class="form-label">Technicien</label><select id="n-tech">${techOpts}</select></div>
        <div class="form-group"><label class="form-label">Date</label><input id="n-date" type="date" value="${today}"></div>
      </div>
      <div class="form-group"><label class="form-label">Montant du marché (FCFA)</label><input id="n-montant" type="text" placeholder="Ex: 850 000"></div>
      <div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="createDepannage()"><i class="ti ti-device-floppy" style="color:#4ade80"></i> Enregistrer</button></div>`,

    installation: `<div class="modal-hdr"><div class="modal-title">Nouvelle installation</div><button class="close-btn" onclick="closeModal()"><i class="ti ti-x" style="color:#f87171"></i></button></div>
      <div class="form-group"><label class="form-label">Titre du projet</label><input id="n-titre" type="text" placeholder="Ex: Installation réseau bureaux…"></div>
      <div class="fg2">
        <div class="form-group"><label class="form-label">Client</label><select id="n-client">${clientOpts}</select></div>
        <div class="form-group"><label class="form-label">Technicien référent</label><select id="n-tech">${techOpts}</select></div>
      </div>
      <div class="form-group"><label class="form-label">Équipement / matériel</label><input id="n-equip" type="text" placeholder="Marque, modèle, quantité…"></div>
      <div class="fg2">
        <div class="form-group"><label class="form-label">Date début</label><input id="n-debut" type="date" value="${today}"></div>
        <div class="form-group"><label class="form-label">Date fin prévue</label><input id="n-fin" type="date" value="${today}"></div>
      </div>
      <div class="form-group"><label class="form-label">Montant du marché (FCFA)</label><input id="n-montant" type="text" placeholder="Ex: 1 500 000"></div>
      <div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="createInstallation()"><i class="ti ti-calendar-plus" style="color:#34d399"></i> Planifier</button></div>`,

    contrat: `<div class="modal-hdr"><div class="modal-title">Nouveau contrat</div><button class="close-btn" onclick="closeModal()"><i class="ti ti-x" style="color:#f87171"></i></button></div>
      <div class="fg2">
        <div class="form-group"><label class="form-label">Client</label><select id="n-client">${clientOpts}</select></div>
        <div class="form-group"><label class="form-label">Type</label><select id="n-type"><option>Maintenance préventive</option><option>Maintenance corrective</option><option>Maintenance 24/7</option><option>Contrat global TMA</option></select></div>
      </div>
      <div class="fg3">
        <div class="form-group"><label class="form-label">Date début</label><input id="n-debut" type="date" value="${today}"></div>
        <div class="form-group"><label class="form-label">Date fin</label><input id="n-fin" type="date" value="${today}"></div>
        <div class="form-group"><label class="form-label">Visites/an</label><input id="n-visites" type="number" value="4" min="1"></div>
      </div>
      <div class="form-group"><label class="form-label">Montant (FCFA)</label><input id="n-montant" type="number" placeholder="Ex: 2400000"></div>
      <div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="createContrat()"><i class="ti ti-circle-plus" style="color:#4ade80"></i> Créer</button></div>`,

    client: `<div class="modal-hdr"><div class="modal-title">Nouveau client</div><button class="close-btn" onclick="closeModal()"><i class="ti ti-x" style="color:#f87171"></i></button></div>
      <div class="fg2">
        <div class="form-group"><label class="form-label">Raison sociale</label><input id="n-nom" type="text" placeholder="Nom de l'entreprise…"></div>
        <div class="form-group"><label class="form-label">Secteur</label><select id="n-secteur"><option>Industrie</option><option>BTP</option><option>Santé</option><option>IT</option><option>Énergie</option><option>Commerce</option></select></div>
      </div>
      <div class="fg2">
        <div class="form-group"><label class="form-label">Contact principal</label><input id="n-contact" type="text" placeholder="Prénom Nom"></div>
        <div class="form-group"><label class="form-label">Email</label><input id="n-email" type="email" placeholder="email@entreprise.ci"></div>
      </div>
      <div class="fg2">
        <div class="form-group"><label class="form-label">Ville</label><input id="n-ville" type="text" placeholder="Abidjan…"></div>
        <div class="form-group"><label class="form-label">Téléphone</label><input id="n-tel" type="tel" placeholder="+225 07 00 00 00"></div>
      </div>
      <div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="createClient()"><i class="ti ti-user-plus" style="color:#4ade80"></i> Ajouter</button></div>`,

    intervention: `<div class="modal-hdr"><div class="modal-title">Planifier une intervention</div><button class="close-btn" onclick="closeModal()"><i class="ti ti-x" style="color:#f87171"></i></button></div>
      <div class="fg2">
        <div class="form-group"><label class="form-label">Type</label><select><option>Ticket</option><option>Installation</option><option>Maintenance</option><option>Dépannage</option></select></div>
        <div class="form-group"><label class="form-label">Client</label><select>${clientOpts}</select></div>
      </div>
      <div class="form-group"><label class="form-label">Objet</label><input type="text" placeholder="Ex: Visite de maintenance trimestrielle…"></div>
      <div class="fg3">
        <div class="form-group"><label class="form-label">Date</label><input type="date" value="${today}"></div>
        <div class="form-group"><label class="form-label">Heure début</label><input type="text" placeholder="09:00"></div>
        <div class="form-group"><label class="form-label">Durée</label><select><option>1h</option><option>2h</option><option>4h</option><option>Journée</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">Technicien</label><select>${techOpts}</select></div>
      <div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="closeModal();showNotif('Intervention planifiée')"><i class="ti ti-calendar"></i> Planifier</button></div>`,
  };

  document.getElementById('modal-content').innerHTML = tpls[type] || '';
  document.getElementById('modal-overlay').classList.add('open');
}

/* ---- Fonctions de création via API ---------------- */
function createTicket() {
  const sujet = document.getElementById('n-sujet').value.trim();
  if (!sujet) return;
  apiFetch.post('/tickets', {
    sujet,
    client_id:     getClientId(document.getElementById('n-client').value),
    technicien_id: getTechId(document.getElementById('n-tech').value),
    priorite:      document.getElementById('n-prio').value,
    categorie:     document.getElementById('n-cat').value,
    date_prevue:   document.getElementById('n-date').value,
    statut:        'Ouvert',
  }).then(() => { closeModal(); reload(renderTickets); showNotif('Ticket créé'); });
}

function createDepannage() {
  const desc = document.getElementById('n-desc').value.trim();
  if (!desc) return;
  apiFetch.post('/depannages', {
    description:       desc,
    client_id:         getClientId(document.getElementById('n-client').value),
    technicien_id:     getTechId(document.getElementById('n-tech').value),
    equipement:        document.getElementById('n-equip').value.trim(),
    priorite:          document.getElementById('n-prio').value,
    date_intervention: document.getElementById('n-date').value,
    statut:            'En cours',
    montant:           document.getElementById('n-montant').value.trim(),
  }).then(() => { closeModal(); reload(renderDepannages); showNotif('Dépannage enregistré'); });
}

function createInstallation() {
  const titre = document.getElementById('n-titre').value.trim();
  if (!titre) return;
  apiFetch.post('/installations', {
    titre,
    client_id:     getClientId(document.getElementById('n-client').value),
    technicien_id: getTechId(document.getElementById('n-tech').value),
    equipement:    document.getElementById('n-equip').value.trim(),
    date_debut:    document.getElementById('n-debut').value,
    date_fin:      document.getElementById('n-fin').value,
    statut:        'Planifié',
    avancement:    0,
    montant:       document.getElementById('n-montant').value.trim(),
  }).then(() => { closeModal(); reload(renderInstallations); showNotif('Installation planifiée'); });
}

function createContrat() {
  apiFetch.post('/contrats', {
    client_id:      getClientId(document.getElementById('n-client').value),
    type_contrat:   document.getElementById('n-type').value,
    date_debut:     document.getElementById('n-debut').value,
    date_fin:       document.getElementById('n-fin').value,
    visites_par_an: parseInt(document.getElementById('n-visites').value) || 4,
    montant:        document.getElementById('n-montant').value.trim(),
    statut:         'Actif',
  }).then(() => { closeModal(); reload(renderContrats); showNotif('Contrat créé'); });
}

function createClient() {
  const nom = document.getElementById('n-nom').value.trim();
  if (!nom) return;
  apiFetch.post('/clients', {
    nom,
    secteur:   document.getElementById('n-secteur').value,
    contact:   document.getElementById('n-contact').value.trim(),
    email:     document.getElementById('n-email').value.trim(),
    ville:     document.getElementById('n-ville').value.trim(),
    telephone: document.getElementById('n-tel').value.trim(),
    contrat:   'Aucun',
  }).then(() => { closeModal(); reload(renderClients); showNotif('Client ajouté'); });
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }

/* ---- Paramètres ----------------------------------- */
const PARAM_KEY = 'crmtech_parametres';

function getParametres() {
  try { return JSON.parse(localStorage.getItem(PARAM_KEY) || '{}'); } catch(_) { return {}; }
}

/* ---- Gestion des comptes utilisateurs ------------- */
function renderComptes() {
  const el = document.getElementById('comptes-list');
  if (!el) return;
  const all = getAllUsers();
  el.innerHTML = all.map(u => `
    <div class="compte-row">
      <div class="compte-avatar">${u.avatar}</div>
      <div class="compte-info">
        <div class="compte-nom">${u.nom}</div>
        <div class="compte-login"><i class="ti ti-at" style="font-size:11px"></i> ${u.login}</div>
      </div>
      <span class="badge ${u.role==='Administrateur'?'b-purple':u.role==='Manager'?'b-blue':'b-teal'}">${u.role}</span>
      ${u.techNom ? `<span style="font-size:11px;color:var(--text-muted)">→ ${u.techNom}</span>` : ''}
      ${!u.base
        ? `<button class="btn btn-sm btn-danger" onclick="deleteCompte('${u.login}')" title="Supprimer"><i class="ti ti-trash-x" style="color:#f87171"></i></button>`
        : `<span style="font-size:10px;color:var(--text-muted);padding:0 6px">système</span>`
      }
    </div>`).join('');
}

function openCreateCompte() {
  const techOptions = techniciens
    .filter(t => !getAllUsers().some(u => u.techNom === t.nom))
    .map(t => `<option value="${t.nom}">${t.nom}</option>`)
    .join('');

  if (!techOptions) {
    showNotif('⚠️ Tous les techniciens ont déjà un compte');
    return;
  }

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-hdr">
      <div class="modal-title"><i class="ti ti-user-plus" style="color:var(--accent);margin-right:8px"></i>Créer un compte technicien</div>
      <button class="close-btn" onclick="closeModal()"><i class="ti ti-x" style="color:#f87171"></i></button>
    </div>
    <div class="form-group">
      <label class="form-label">Technicien associé</label>
      <select id="nc-tech"><option value="">— Sélectionner —</option>${techOptions}</select>
    </div>
    <div class="fg2">
      <div class="form-group">
        <label class="form-label">Identifiant de connexion</label>
        <input id="nc-login" type="text" placeholder="ex: karim.diallo" autocomplete="off">
      </div>
      <div class="form-group">
        <label class="form-label">Mot de passe</label>
        <input id="nc-password" type="text" placeholder="min. 6 caractères" autocomplete="off">
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="saveNewCompte()"><i class="ti ti-user-check" style="color:#4ade80"></i> Créer le compte</button>
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
}

function saveNewCompte() {
  const techNom  = document.getElementById('nc-tech').value.trim();
  const login    = document.getElementById('nc-login').value.trim().toLowerCase();
  const password = document.getElementById('nc-password').value.trim();

  if (!techNom)        { showNotif('⚠️ Sélectionnez un technicien'); return; }
  if (!login)          { showNotif('⚠️ Identifiant requis'); return; }
  if (password.length < 6) { showNotif('⚠️ Mot de passe trop court (min. 6 caractères)'); return; }

  const all = getAllUsers();
  if (all.some(u => u.login === login)) { showNotif('⚠️ Cet identifiant existe déjà'); return; }

  const tech   = techniciens.find(t => t.nom === techNom);
  const initials = techNom.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const newUser  = { login, password, nom: techNom, role: 'Technicien', avatar: initials, techNom, base: false };

  const extras = getExtraUsers();
  extras.push(newUser);
  saveExtraUsers(extras);

  closeModal();
  renderComptes();
  showNotif(`Compte créé : ${login} ✅`);
}

function deleteCompte(login) {
  const extras = getExtraUsers().filter(u => u.login !== login);
  saveExtraUsers(extras);
  renderComptes();
  showNotif(`Compte supprimé`);
}

function renderParametres() {
  const p = getParametres();
  const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
  set('p-societe',     p.societe     || '');
  set('p-secteur',     p.secteur     || '');
  set('p-email',       p.email       || '');
  set('p-tel',         p.tel         || '');
  set('p-adresse',     p.adresse     || '');
  set('p-email-notif', p.emailNotif  || 'e.kouame@groupamk.com');
  set('p-delai-rappel',p.delaiRappel || '7');
  set('p-appname',     p.appName     || '');

  const notifEl = document.getElementById('p-notif-contrats');
  if (notifEl) notifEl.checked = p.notifContrats !== false;

  // Restaurer la couleur active
  if (p.accent) {
    document.querySelectorAll('.color-dot').forEach(d => {
      d.classList.toggle('active', d.style.background === p.accent || d.getAttribute('onclick')?.includes(p.accent));
    });
  }

  // Statut API et DB
  checkSystemStatus();

  // Gestion comptes (admin seulement)
  renderComptes();
}

function changePassword() {
  const current = document.getElementById('pw-current')?.value  || '';
  const next    = document.getElementById('pw-new')?.value      || '';
  const confirm = document.getElementById('pw-confirm')?.value  || '';
  const session = getSession();
  if (!session) return;

  // Vérifier le mot de passe actuel
  const me = getAllUsers().find(u => u.login === session.login);
  if (!me || me.password !== current) {
    showNotif('⚠️ Mot de passe actuel incorrect'); return;
  }
  if (next.length < 6) {
    showNotif('⚠️ Nouveau mot de passe trop court (min. 6 caractères)'); return;
  }
  if (next !== confirm) {
    showNotif('⚠️ Les mots de passe ne correspondent pas'); return;
  }

  // Appliquer l'override
  setPwOverride(session.login, next);

  // Vider les champs
  ['pw-current','pw-new','pw-confirm'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  showNotif('Mot de passe mis à jour ✅');
}

function saveParametres() {
  const p = {
    societe:      document.getElementById('p-societe')?.value.trim(),
    secteur:      document.getElementById('p-secteur')?.value.trim(),
    email:        document.getElementById('p-email')?.value.trim(),
    tel:          document.getElementById('p-tel')?.value.trim(),
    adresse:      document.getElementById('p-adresse')?.value.trim(),
    emailNotif:   document.getElementById('p-email-notif')?.value.trim(),
    delaiRappel:  document.getElementById('p-delai-rappel')?.value,
    notifContrats:document.getElementById('p-notif-contrats')?.checked,
    appName:      document.getElementById('p-appname')?.value.trim(),
    accent:       getParametres().accent,
  };
  localStorage.setItem(PARAM_KEY, JSON.stringify(p));

  // Appliquer le nom personnalisé
  if (p.appName) {
    document.querySelector('.logo-title').textContent = p.appName;
    document.title = p.appName + ' — Service Technique';
  }
  showNotif('Paramètres enregistrés ✅');
}

function setAccent(color, el) {
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  el.classList.add('active');
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent-hover', color);
  const p = getParametres();
  p.accent = color;
  localStorage.setItem(PARAM_KEY, JSON.stringify(p));
}

async function checkSystemStatus() {
  const apiEl = document.getElementById('p-api-status');
  const dbEl  = document.getElementById('p-db-status');
  if (!apiEl) return;
  apiEl.innerHTML = `<span style="color:var(--text-muted)">● Vérification…</span>`;
  dbEl.innerHTML  = `<span style="color:var(--text-muted)">● Vérification…</span>`;
  try {
    const start = Date.now();
    await apiFetch.get('/init');
    const ms = Date.now() - start;
    apiEl.innerHTML = `<span style="color:#4ade80">● En ligne</span> <span style="color:var(--text-muted)">(${ms}ms)</span>`;
    dbEl.innerHTML  = `<span style="color:#4ade80">● Connectée</span> <span style="color:var(--text-muted)">MySQL — crmtech</span>`;
  } catch(_) {
    const hasCache = localStorage.getItem(CACHE_KEY) !== null;
    if (hasCache) {
      apiEl.innerHTML = `<span style="color:#fb923c">● Hors ligne</span> <span style="color:var(--text-muted)">— mode démonstration (cache local)</span>`;
      dbEl.innerHTML  = `<span style="color:#fb923c">● Non disponible</span> <span style="color:var(--text-muted)">— données chargées depuis le cache</span>`;
    } else {
      apiEl.innerHTML = `<span style="color:#f87171">● Hors ligne</span> <span style="color:var(--text-muted)">— aucune donnée disponible</span>`;
      dbEl.innerHTML  = `<span style="color:#f87171">● Non disponible</span> <span style="color:var(--text-muted)">— aucun cache trouvé</span>`;
    }
  }
}

// Appliquer les paramètres sauvegardés au démarrage
function applyParametresOnLoad() {
  const p = getParametres();
  if (p.accent) document.documentElement.style.setProperty('--accent', p.accent);
  if (p.appName) {
    document.querySelector('.logo-title').textContent = p.appName;
    document.title = p.appName + ' — Service Technique';
  }
}

/* ---- Toast ---------------------------------------- */
let notifTimer = null;
function showNotif(msg) {
  const n = document.getElementById('notif');
  document.getElementById('notif-msg').textContent = msg;
  n.classList.add('show');
  if (notifTimer) clearTimeout(notifTimer);
  notifTimer = setTimeout(() => n.classList.remove('show'), 3200);
}

/* ---- Rapport IA ----------------------------------- */
let rapportContratId = null;
let rapportGenere    = null;
let rapportContratRef = null;

function openRapportModal(contratId) {
  rapportContratId  = contratId;
  rapportGenere     = null;
  const c = contrats.find(x => x._id === contratId);
  rapportContratRef = c ? c.id : '';
  // Pré-remplir le technicien si dispo
  const techInput = document.getElementById('rap-technicien');
  if (techInput && c && c.tech) techInput.value = c.tech;
  // Reset UI
  document.getElementById('rap-equipements').value    = '';
  document.getElementById('rap-interventions').value  = '';
  document.getElementById('rap-problemes').value      = '';
  document.getElementById('rap-recommandations').value= '';
  document.getElementById('rap-etat').value           = 'Correct';
  document.getElementById('rapport-error').style.display = 'none';
  showRapportStep1();
  document.getElementById('rapport-overlay').style.display = 'flex';
}

function closeRapportModal() {
  document.getElementById('rapport-overlay').style.display = 'none';
}

function showRapportStep1() {
  document.getElementById('rapport-step1').style.display  = 'block';
  document.getElementById('rapport-step2').style.display  = 'none';
  document.getElementById('rapport-loading').style.display= 'none';
}

async function genererRapport() {
  const equipements    = document.getElementById('rap-equipements').value.trim();
  const interventions  = document.getElementById('rap-interventions').value.trim();
  const errDiv = document.getElementById('rapport-error');

  if (!equipements || !interventions) {
    errDiv.textContent = 'Veuillez renseigner les équipements vérifiés et les interventions réalisées.';
    errDiv.style.display = 'block';
    return;
  }
  errDiv.style.display = 'none';

  // Afficher le loader
  document.getElementById('rapport-step1').style.display   = 'none';
  document.getElementById('rapport-loading').style.display = 'block';

  const payload = {
    equipements,
    interventions,
    problemes:       document.getElementById('rap-problemes').value.trim(),
    recommandations: document.getElementById('rap-recommandations').value.trim(),
    etat_general:    document.getElementById('rap-etat').value,
    technicien_nom:  document.getElementById('rap-technicien').value.trim(),
  };

  try {
    const res = await apiFetch.post(`/contrats/${rapportContratId}/rapport/generer`, payload);
    if (res.error) throw new Error(res.error);

    rapportGenere = res.rapport;
    document.getElementById('rap-result').value = rapportGenere;
    document.getElementById('rapport-loading').style.display = 'none';
    document.getElementById('rapport-step2').style.display   = 'block';
  } catch (e) {
    document.getElementById('rapport-loading').style.display = 'none';
    document.getElementById('rapport-step1').style.display   = 'block';
    errDiv.textContent = 'Erreur : ' + e.message + ' — Vérifiez qu\'Ollama est démarré (ollama serve).';
    errDiv.style.display = 'block';
  }
}

async function telechargerRapport() {
  const rapport = document.getElementById('rap-result').value.trim();
  if (!rapport) return;

  try {
    const response = await fetch(`${API}/contrats/${rapportContratId}/rapport/telecharger`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      body: JSON.stringify({ rapport, date_visite: new Date().toLocaleDateString('fr-FR') }),
    });

    if (!response.ok) throw new Error('Erreur lors de la génération Word');

    const blob = await response.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `rapport_${rapportContratRef}_${new Date().toISOString().slice(0,10)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    closeRapportModal();
    showNotif('Rapport Word téléchargé ✅');
  } catch (e) {
    showNotif('Erreur téléchargement : ' + e.message);
  }
}

/* =====================================================
   AUTHENTIFICATION
   ===================================================== */

const AUTH_KEY      = 'crmtech_auth_v1';
const ACCOUNTS_KEY  = 'crmtech_accounts_v1';
const PW_KEY        = 'crmtech_pw_v1';       // overrides de mots de passe

/* Comptes de base non modifiables */
const BASE_USERS = [
  { login: 'admin',   password: 'admin123', nom: 'Administrateur', role: 'Administrateur', avatar: 'A',  techNom: null, base: true },
  { login: 'manager', password: 'manager1', nom: 'Manager',        role: 'Manager',        avatar: 'MG', techNom: null, base: true },
];

/* Comptes dynamiques créés par l'admin */
function getExtraUsers() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); } catch(_) { return []; }
}
function saveExtraUsers(list) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

/* Overrides de mots de passe (pour tous les comptes) */
function getPwOverrides() {
  try { return JSON.parse(localStorage.getItem(PW_KEY) || '{}'); } catch(_) { return {}; }
}
function setPwOverride(login, password) {
  const ov = getPwOverrides();
  ov[login] = password;
  localStorage.setItem(PW_KEY, JSON.stringify(ov));
}

/* Liste complète avec mots de passe appliqués */
function getAllUsers() {
  const overrides = getPwOverrides();
  const all = [...BASE_USERS, ...getExtraUsers()];
  return all.map(u => overrides[u.login] ? { ...u, password: overrides[u.login] } : u);
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch(_) { return null; }
}

function saveSession(user, remember) {
  const data = { login: user.login, nom: user.nom, role: user.role, avatar: user.avatar, techNom: user.techNom || null };
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  if (remember) sessionStorage.setItem(AUTH_KEY, 'keep');
}

/* ---- Helpers RBAC --------------------------------- */
function isTech()   { const s = getSession(); return s?.role === 'Technicien'; }
function isAdmin()  { const s = getSession(); return s?.role !== 'Technicien'; }
function myTechNom(){ return getSession()?.techNom || null; }

function visibleTickets()       { return isTech() ? tickets.filter(t      => t.tech    === myTechNom()) : tickets;       }
function visibleDepannages()    { return isTech() ? depannages.filter(d   => d.tech    === myTechNom()) : depannages;    }
function visibleInstallations() { return isTech() ? installations.filter(i => i.tech   === myTechNom()) : installations; }
function visibleTechniciens()   { return isTech() ? techniciens.filter(t  => t.nom     === myTechNom()) : techniciens;   }

function applyRoleUI() {
  const tech = isTech();
  // Masquer items admin dans la sidebar
  document.querySelectorAll('[data-admin]').forEach(el => {
    el.style.display = tech ? 'none' : '';
  });
  // Masquer boutons de création dans les topbars
  document.querySelectorAll('.admin-action').forEach(el => {
    el.style.display = tech ? 'none' : '';
  });
  // Badge rôle sidebar
  const roleEl = document.getElementById('sidebar-user-role');
  const s = getSession();
  if (roleEl && s) roleEl.textContent = s.role;
  // Si technicien sur une page interdite, rediriger
  if (tech) {
    const forbidden = ['contrats','clients','statistiques','export'];
    const cur = localStorage.getItem('crmtech_page') || 'dashboard';
    if (forbidden.includes(cur)) {
      localStorage.setItem('crmtech_page','dashboard');
    }
  }
}

function clearSession() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
}

function fillDemo(login = 'admin', password = 'admin123') {
  document.getElementById('login-email').value    = login;
  document.getElementById('login-password').value = password;
  document.getElementById('login-email').focus();
}

function togglePassword(btn) {
  const input = btn.closest('.login-input-wrap').querySelector('input');
  const icon  = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'ti ti-eye-off';
  } else {
    input.type = 'password';
    icon.className = 'ti ti-eye';
  }
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  document.getElementById('login-error-msg').textContent = msg;
  el.style.display = 'flex';
  // Shake animation
  const card = document.querySelector('.login-card');
  card.style.animation = 'none';
  card.offsetHeight;
  card.style.animation = 'loginShake .4s ease';
}

function setLoginLoading(on) {
  const btn  = document.getElementById('login-submit');
  const text = btn.querySelector('.login-btn-text');
  const icon = btn.querySelector('.ti-arrow-right');
  const loader = btn.querySelector('.login-btn-loader');
  btn.disabled = on;
  text.textContent = on ? 'Connexion…' : 'Se connecter';
  if (icon)   icon.style.display   = on ? 'none' : '';
  if (loader) loader.style.display = on ? '' : 'none';
}

async function handleLogin(e) {
  e.preventDefault();
  const login    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const remember = document.getElementById('login-remember').checked;

  document.getElementById('login-error').style.display = 'none';

  if (!login || !password) {
    showLoginError('Veuillez remplir tous les champs.');
    return;
  }

  setLoginLoading(true);
  // Simulation délai réseau (UX)
  await new Promise(r => setTimeout(r, 600));

  const user = getAllUsers().find(u => u.login === login && u.password === password);

  if (!user) {
    setLoginLoading(false);
    showLoginError('Identifiant ou mot de passe incorrect.');
    document.getElementById('login-password').value = '';
    document.getElementById('login-password').focus();
    return;
  }

  saveSession(user, remember);
  updateSidebarUser(user);
  setLoginLoading(false);

  // Transition vers l'app
  const screen = document.getElementById('login-screen');
  screen.style.transition = 'opacity .5s ease';
  screen.style.opacity = '0';
  setTimeout(() => {
    screen.classList.add('hidden');
    initApp();
  }, 500);
}

function handleLogout() {
  clearSession();
  // Réinitialiser le formulaire
  document.getElementById('login-form').reset();
  document.getElementById('login-error').style.display = 'none';
  // Ré-afficher l'écran de connexion
  const screen = document.getElementById('login-screen');
  screen.style.opacity = '0';
  screen.classList.remove('hidden');
  screen.style.transition = 'opacity .4s ease';
  requestAnimationFrame(() => { screen.style.opacity = '1'; });
}

function updateSidebarUser(user) {
  const el   = document.getElementById('sidebar-user-name');
  const av   = document.getElementById('sidebar-user-avatar');
  const role = document.getElementById('sidebar-user-role');
  if (el)   el.textContent   = user.nom;
  if (av)   av.textContent   = user.avatar;
  if (role) role.textContent = user.role;
  applyRoleUI();
}

/* ---- Init ----------------------------------------- */
async function initApp() {
  applyParametresOnLoad();
  applyRoleUI();

  // 1. Affichage instantané avec le cache local (si disponible)
  const hasCacheData = loadCache();
  if (hasCacheData) {
    restoreNav();
  }

  // 2. Rafraîchissement depuis l'API en arrière-plan
  const indicator = document.getElementById('refresh-indicator');
  if (indicator) indicator.style.opacity = '1';
  await loadAll();
  if (indicator) indicator.style.opacity = '0';

  // 3. Si pas de cache, premier affichage après l'API
  if (!hasCacheData) {
    restoreNav();
  } else {
    // Mettre à jour silencieusement la vue active
    const saved = localStorage.getItem('crmtech_page') || 'dashboard';
    const renders = { dashboard:renderDash, calendrier:renderCalendar, tickets:renderTickets,
      depannages:renderDepannages, installations:renderInstallations, contrats:renderContrats,
      clients:renderClients, techniciens:renderTechniciens, statistiques:renderStats,
      historique:renderHistorique, export:renderExport, parametres:renderParametres };
    if (renders[saved]) renders[saved]();
    else renderDash();
  }

  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('rapport-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeRapportModal();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const session = getSession();
  if (session) {
    // Session existante → accès direct
    updateSidebarUser(session);
    document.getElementById('login-screen').classList.add('hidden');
    initApp();
  }
  // Sinon → l'écran de connexion est déjà visible (HTML par défaut)
});
