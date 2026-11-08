'use strict';
/* Mealheiro — controlo de dinheiro pessoal. Tudo corre no browser; os dados ficam no localStorage. */

// ---------- Categorias e regras base ----------
const CATS = [
  { id: 'Supermercado', ic: '🛒', group: 'need' },
  { id: 'Restauração', ic: '🍽️', group: 'want' },
  { id: 'Casa', ic: '🏠', group: 'need' },
  { id: 'Contas', ic: '💡', group: 'need' },
  { id: 'Transportes', ic: '🚌', group: 'need' },
  { id: 'Combustível', ic: '⛽', group: 'need' },
  { id: 'Saúde', ic: '💊', group: 'need' },
  { id: 'Educação', ic: '📚', group: 'need' },
  { id: 'Subscrições', ic: '📺', group: 'want' },
  { id: 'Compras', ic: '🛍️', group: 'want' },
  { id: 'Lazer', ic: '🎉', group: 'want' },
  { id: 'Levantamentos', ic: '🏧', group: 'want' },
  { id: 'Transferências', ic: '🔁', group: 'none' },
  { id: 'Poupança', ic: '🐷', group: 'save' },
  { id: 'Investimento', ic: '📈', group: 'save' },
  { id: 'Outros', ic: '📦', group: 'want' },
  { id: 'Salário', ic: '💼', group: 'income' },
  { id: 'Outras receitas', ic: '💰', group: 'income' },
];
const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
// Dinheiro que só muda de sítio (entre contas tuas ou para investir): não é gasto nem receita.
const NEUTRAL = ['Transferências', 'Poupança', 'Investimento'];
const EXPENSE_CATS = CATS.filter(c => c.group !== 'income').map(c => c.id);
const INCOME_CATS = CATS.filter(c => c.group === 'income').map(c => c.id);

const BUILTIN_RULES = Object.entries({
  'Supermercado': 'continente,pingo doce,lidl,aldi,mercadona,intermarche,minipreco,auchan,spar,froiz,meu super,amanhecer',
  'Restauração': 'mcdonald,burger king,kfc,restaurante,pastelaria,padaria,glovo,uber eats,bolt food,telepizza,pizza hut,starbucks,h3,vitaminas,cafe,taberna,churrasqueira,sushi',
  'Transportes': 'uber,bolt,cp,comboios,metro,carris,navegante,via verde,emel,portagem,brisa,stcp,fertagus,flixbus,ryanair,tap,easyjet,saba,empark,parque',
  'Combustível': 'galp,bp,repsol,prio,cepsa,shell,moeve',
  'Casa': 'renda,condominio,credito habitacao,prestacao habitacao,prestacao emprestimo,emprestimo habitacao,prestacao,amortizacao,juros emprestimo,juros credito,seguro vida credito,seguro casa,imi',
  'Contas': 'edp,epal,endesa,goldenergy,iberdrola,meo,nos,vodafone,nowo,digi,aguas,smas,ageas,fidelidade,seguro',
  'Saúde': 'farmacia,hospital,clinica,cuf,luz saude,lusiadas,dentista,wells,medicare,multicare,optica',
  'Subscrições': 'netflix,spotify,disney,hbo,apple com,icloud,google one,amazon prime,youtube,ginasio,fitness hut,solinca,chatgpt,openai,claude',
  'Compras': 'amazon,zara,primark,worten,fnac,ikea,decathlon,aliexpress,shein,temu,leroy merlin,radio popular,mediamarkt,el corte ingles,h m,pull bear,bershka,sport zone,continente bom dia',
  'Lazer': 'cinema,cinemas nos,ucicinemas,ticketline,bol pt,steam,playstation,xbox,nintendo,booking,airbnb',
  'Educação': 'escola,universidade,propina,livraria,bertrand,wook',
  'Levantamentos': 'levantamento,lev atm,atm',
  'Poupança': 'pocket,vault,cofre,savings,poupanca',
  'Transferências': 'top up,topup,carregamento revolut,payment from,money added',
  'Investimento': 'xtb,x trade brokers,degiro,trading 212,trade republic,interactive brokers,etoro,lightyear,bison,certificados aforro,aforro,igcp,ppr',
  'Salário': 'salario,vencimento,ordenado,remuneracao',
}).flatMap(([cat, kws]) => kws.split(',').map(kw => ({ kw, cat })));

const STOPWORDS = new Set('to from top up compra compras pag pagamento pagamentos trf transf mb way dd cartao card debito credito tpa ref de da do das dos a o e em no na para por com sem the visa mastercard apple pay google lda sa unipessoal pt lisboa porto'.split(' '));

// ---------- Estado ----------
const KEY = 'mealheiro-v1';
let state = load();
const ui = { month: monthKey(new Date()), editing: null };

function blank() { return { tx: [], rules: [], budgets: {}, goals: [], fixed: [], accounts: [] }; }
/** Garante pelo menos uma conta bancária e que cada movimento pertence a uma conta. */
function migrate(s) {
  s = { ...blank(), ...s };
  if (!s.accounts.some(a => a.type === 'bank')) s.accounts.unshift({ id: uid(), name: 'Conta principal', type: 'bank', opening: null });
  const main = s.accounts.find(a => a.type === 'bank').id;
  const ids = new Set(s.accounts.map(a => a.id));
  for (const t of s.tx) if (!ids.has(t.account)) t.account = main;
  for (const f of s.fixed) if (!ids.has(f.account)) f.account = main;
  return s;
}
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.tx)) return migrate(s); } catch (e) {}
  return migrate(blank());
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { toast('Não foi possível guardar os dados neste browser.'); }
}

// ---------- Utilitários ----------
const $ = s => document.querySelector(s);
const fmt = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
const eur = n => fmt.format(n || 0);
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function monthKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function shiftMonth(mk, n) { const [y, m] = mk.split('-').map(Number); return monthKey(new Date(y, m - 1 + n, 1)); }
function monthName(mk, short) {
  const [y, m] = mk.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-PT', short ? { month: 'short' } : { month: 'long', year: 'numeric' });
}
function daysInMonth(mk) { const [y, m] = mk.split('-').map(Number); return new Date(y, m, 0).getDate(); }
function todayISO() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function norm(s) { return ' ' + String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim() + ' '; }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3200); }
function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }

// ---------- Categorização automática ----------
function kwMatches(desc, kw) {
  const k = norm(kw).trim();
  if (!k) return false;
  // palavras curtas (bp, cp, nos…) só contam como palavra inteira; as longas podem ser início de palavra
  return k.length <= 3 ? desc.includes(' ' + k + ' ') : desc.includes(' ' + k);
}
function guessCat(desc, amount) {
  const d = norm(desc);
  for (const r of state.rules) if (kwMatches(d, r.kw)) return r.cat;
  const candidates = BUILTIN_RULES.filter(r => kwMatches(d, r.kw));
  // preferir a correspondência mais específica (palavra-chave mais longa)
  candidates.sort((a, b) => b.kw.length - a.kw.length);
  const hit = candidates.find(r => (amount > 0) === INCOME_CATS.includes(r.cat)) || candidates[0];
  if (hit) {
    if (amount > 0 && !INCOME_CATS.includes(hit.cat) && !NEUTRAL.includes(hit.cat)) return 'Outras receitas';
    return hit.cat;
  }
  return amount > 0 ? 'Outras receitas' : 'Outros';
}
function ruleKey(desc) {
  const words = norm(desc).trim().split(' ').filter(w => w.length > 2 && !/\d/.test(w) && !STOPWORDS.has(w));
  return words.slice(0, 2).join(' ');
}

// ---------- Cálculos ----------
function txOfMonth(mk) { return state.tx.filter(t => t.date.startsWith(mk)); }
function totals(list) {
  let inc = 0, out = 0, inv = 0;
  for (const t of list) {
    if (t.cat === 'Poupança' || t.cat === 'Investimento') { inv -= t.amount; continue; }
    if (t.cat === 'Transferências') continue;
    t.amount >= 0 ? inc += t.amount : out -= t.amount;
  }
  return { inc, out, bal: inc - out, inv };
}
function byCat(list) {
  const m = {};
  for (const t of list) if (t.amount < 0 && !NEUTRAL.includes(t.cat)) m[t.cat] = (m[t.cat] || 0) - t.amount;
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
/** Médias dos últimos n meses completos (antes do mês atual) que tenham movimentos. */
function averages(n = 3) {
  const cur = monthKey(new Date());
  const months = [];
  for (let i = 1; i <= 12 && months.length < n; i++) {
    const mk = shiftMonth(cur, -i);
    if (txOfMonth(mk).length) months.push(mk);
  }
  if (!months.length) return null;
  const sums = months.map(mk => totals(txOfMonth(mk)));
  const avg = k => sums.reduce((s, x) => s + x[k], 0) / months.length;
  const cats = {};
  for (const mk of months) for (const [c, v] of byCat(txOfMonth(mk))) cats[c] = (cats[c] || 0) + v / months.length;
  return { months, inc: avg('inc'), out: avg('out'), bal: avg('bal'), cats };
}
function recurring() {
  const cur = monthKey(new Date());
  const since = shiftMonth(cur, -5);
  const groups = {};
  for (const t of state.tx) {
    if (t.amount >= 0 || t.fixed || t.date.slice(0, 7) < since || NEUTRAL.includes(t.cat) || t.cat === 'Levantamentos') continue;
    const k = ruleKey(t.desc) || norm(t.desc).trim();
    (groups[k] ||= []).push(t);
  }
  const res = [];
  for (const [k, list] of Object.entries(groups)) {
    const months = new Set(list.map(t => t.date.slice(0, 7)));
    // 3+ meses, ou 2 meses se for uma categoria tipicamente fixa
    if (months.size < 3 && !(months.size === 2 && ['Casa', 'Contas', 'Subscrições', 'Educação'].includes(list[0].cat))) continue;
    const amts = list.map(t => -t.amount).sort((a, b) => a - b);
    const med = amts[Math.floor(amts.length / 2)];
    if (amts.every(a => Math.abs(a - med) <= med * 0.2) && list.length <= months.size + 1) {
      const last = list.reduce((a, b) => (a.date > b.date ? a : b));
      res.push({ name: last.desc, cat: list[0].cat, monthly: med, months: months.size, last: last.date });
    }
  }
  return res.sort((a, b) => b.monthly - a.monthly);
}

// ---------- Contas ----------
const ACC_IC = { bank: '🏦', invest: '📈', loan: '🏠' };
const ACC_TYPES = [['bank', '🏦 Conta bancária'], ['invest', '📈 Investimentos (corretora, PPR, certificados…)'], ['loan', '🏠 Crédito (habitação, carro…)']];
const banks = () => state.accounts.filter(a => a.type === 'bank');
const invests = () => state.accounts.filter(a => a.type === 'invest');
const accById = id => state.accounts.find(a => a.id === id);
const accByName = n => state.accounts.find(a => a.name === n);
function accSum(id) { return state.tx.reduce((s, t) => s + (t.account === id ? t.amount : 0), 0); }
/** Saldo = o saldo que indicaste numa data + movimentos depois dessa data
 *  (os anteriores já estavam incluídos, mesmo que sejam importados mais tarde). */
// Movimentos depois da data + os escritos à mão nesse próprio dia (os importados desse dia já vinham no saldo)
function accSince(id, date) {
  return state.tx.reduce((s, t) => s + (t.account === id && (t.date > date || (t.date === date && !t.imp)) ? t.amount : 0), 0);
}
function bankBalance(a) {
  if (a.anchor) return a.anchor.value + accSince(a.id, a.anchor.date) - (a.anchor.sameDay || 0);
  return a.opening == null ? null : a.opening + accSum(a.id);
}
/** Dinheiro posto num investimento: o que já lá tinhas + transferências para lá − resgates. */
function invested(a, since = '') {
  const only = invests().length === 1;
  return (since ? 0 : a.base || 0) - state.tx.reduce((s, t) => s + (t.cat === 'Investimento' && t.date >= since && (t.to === a.id || (!t.to && only)) ? t.amount : 0), 0);
}
/** Valor atual: último valor que indicaste + depósitos/resgates registados depois disso
 *  (com data a partir desse dia; os anteriores já estavam incluídos no valor). */
function investValue(a) {
  const snap = (a.values || []).at(-1);
  if (!snap) return invested(a);
  const since = invested(a, snap.date);
  return snap.value + since - (snap.since ?? since);
}
function loanDebt(a) { const v = (a.values || []).at(-1); return v ? v.value : null; }
function accValue(a) {
  if (a.type === 'invest') return investValue(a);
  if (a.type === 'loan') { const d = loanDebt(a); return d == null ? null : -d; }
  return bankBalance(a);
}
function uniqueName(n, except) {
  let name = n.trim() || 'Conta', i = 2;
  while (state.accounts.some(a => a.name === name && a !== except)) name = `${n.trim()} ${i++}`;
  return name;
}
function renderAccounts() {
  let total = 0, unknown = false;
  const rows = state.accounts.map(a => {
    const v = accValue(a);
    if (v == null) unknown = true; else total += v;
    let sub = a.type === 'invest' ? 'Investimentos' : 'Banco';
    if (a.type === 'loan') {
      const last = (a.values || []).at(-1), first = (a.values || [])[0];
      sub = last ? `Em dívida · atualizado a ${last.date.split('-').reverse().join('/')}` : 'Crédito';
      if (first && last && first !== last && first.value > last.value) sub += ` · já abateste ${eur(first.value - last.value)}`;
    }
    if (a.type === 'invest') {
      const inv = invested(a), g = v - inv;
      sub = `Investido ${eur(inv)}${(a.values || []).length ? ` · <span class="${g >= 0 ? 'pos' : 'neg'}">${g >= 0 ? '+' : ''}${eur(g)}${inv > 0 ? ` (${(g / inv * 100).toFixed(1).replace('.', ',')}%)` : ''}</span>` : ' · toca para indicar o valor atual'}`;
    }
    return `<li data-acc="${a.id}"><span class="ic">${ACC_IC[a.type]}</span><span class="info"><b>${esc(a.name)}</b><small>${sub}</small></span><span class="amt ${v < 0 ? 'neg' : ''}">${v == null ? `<small class="muted">${a.type === 'loan' ? 'indicar dívida' : 'definir saldo'}</small>` : eur(v)}</span></li>`;
  }).join('');
  $('#accounts').innerHTML = `<ul class="tx-list">${rows}</ul>
    ${state.accounts.some(a => a.type === 'loan') ? `<p class="total-line sub"><span>Bancos + investimentos</span><b>${eur(state.accounts.filter(a => a.type !== 'loan').reduce((s, a) => s + (accValue(a) || 0), 0))}</b></p>` : ''}
    <p class="total-line"><span>Património total${unknown ? ' <small class="muted">(falta o saldo de alguma conta)</small>' : ''}</span><b>${eur(total)}</b></p>`;
  // seletores de conta
  const bankOpts = banks().map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('');
  const f = $('#txForm');
  const keep = f.account.value;
  f.account.innerHTML = bankOpts;
  if (keep && accById(keep)) f.account.value = keep;
  const cf = $('#txAccFilter'), cv = cf.value;
  cf.innerHTML = '<option value="">Todas as contas</option>' + bankOpts;
  cf.value = accById(cv) ? cv : '';
  cf.hidden = banks().length < 2;
}
function accountForm(a, newType) {
  if (!a && !newType) {
    // primeiro escolhe o tipo, depois mostra só os campos desse tipo
    openForm('Nova conta', [{ name: 'type', label: 'Que tipo de conta?', options: ACC_TYPES, value: 'bank' }],
      v => { setTimeout(() => accountForm(null, v.type), 0); });
    return;
  }
  const type = a ? a.type : newType;
  const isInv = type === 'invest';
  const fields = [
    { name: 'name', label: 'Nome', value: a?.name, required: true, placeholder: { bank: 'ex.: ActivoBank, Santander, Revolut', invest: 'ex.: XTB', loan: 'ex.: Crédito casa' }[type] },
  ];
  if (type === 'loan') fields.push({ name: 'debt', label: 'Quanto falta pagar hoje (€)', type: 'money', value: '', required: !a, placeholder: a ? 'deixa vazio para não mudar' : 'vê no extrato do crédito', hint: 'Atualiza de vez em quando (ex.: quando chega o extrato anual) para veres a dívida a descer.' });
  if (type === 'bank') fields.push({ name: 'balance', label: 'Saldo atual hoje (€)', type: 'money', value: a && bankBalance(a) != null ? String(Math.round(bankBalance(a) * 100) / 100).replace('.', ',') : '', placeholder: 'vê na app do banco', hint: 'Os movimentos a partir de amanhã são somados sozinhos. Podes importar extratos antigos à vontade: não mexem neste saldo.' });
  if (isInv) {
    fields.push({ name: 'value', label: 'Valor atual hoje (€)', type: 'money', value: '', placeholder: a ? 'deixa vazio para não mudar' : 'ex.: 5230,40', hint: 'Vê o valor da conta na app da corretora. Atualiza quando quiseres (ex.: uma vez por mês).' });
    fields.push({ name: 'base', label: 'Quanto já tinhas investido antes de usar esta app (€)', type: 'money', value: a?.base ? String(a.base).replace('.', ',') : '', placeholder: 'para calcular o ganho/perda' });
  }
  openForm(a ? 'Editar conta' : 'Nova conta', fields, v => {
    const acc = a || { id: uid(), type };
    if (!a) state.accounts.push(acc);
    acc.name = uniqueName(v.name, a);
    if (type === 'bank' && v.balance?.trim()) {
      const b = parseAmount(v.balance); if (isNaN(b)) { if (!a) state.accounts.pop(); toast('Saldo inválido.'); return false; }
      const d = todayISO();
      acc.anchor = { date: d, value: b, sameDay: accSince(acc.id, d) - accSince(acc.id, d.replace(/\d\d$/, '99')) }; delete acc.opening;
    } else if (type === 'bank' && !a) acc.opening = null;
    if (type === 'loan') {
      acc.values ||= [];
      if (v.debt?.trim()) {
        const d = parseAmount(v.debt); if (isNaN(d)) { if (!a) state.accounts.pop(); toast('Valor inválido.'); return false; }
        acc.values = acc.values.filter(x => x.date !== todayISO());
        acc.values.push({ date: todayISO(), value: Math.abs(d) });
      }
    }
    if (type === 'invest') {
      if (v.base?.trim()) acc.base = Math.max(0, parseAmount(v.base) || 0);
      if (v.value?.trim()) {
        const val = parseAmount(v.value); if (isNaN(val)) { if (!a) state.accounts.pop(); toast('Valor inválido.'); return false; }
        acc.values = (acc.values || []).filter(x => x.date !== todayISO());
        acc.values.push({ date: todayISO(), value: val, since: invested(acc, todayISO()) });
      }
      acc.values ||= [];
    }
    toast(a ? 'Conta atualizada.' : 'Conta criada.');
  }, a && state.accounts.length > 1 ? async () => {
    const n = state.tx.filter(t => t.account === a.id).length;
    if (!(await ask(n ? `Apagar “${a.name}” e os seus ${n} movimentos?` : `Apagar “${a.name}”?`, 'Apagar'))) return;
    state.tx = state.tx.filter(t => t.account !== a.id);
    for (const t of state.tx) if (t.to === a.id) delete t.to;
    state.fixed = state.fixed.filter(f => f.account !== a.id);
    state.accounts = state.accounts.filter(x => x !== a);
    if (!banks().length) state = migrate(state);
    save(); render(); toast('Conta apagada.');
  } : null);
}
/** Cria os movimentos de uma transferência entre contas tuas (ou para um investimento). */
function makeTransfer(date, desc, amount, from, to, extra = {}) {
  amount = Math.abs(amount);
  const dest = accById(to);
  if (dest?.type === 'invest') return [{ id: uid(), date, desc: desc || `Para ${dest.name}`, amount: -amount, cat: 'Investimento', account: from, to, ...extra }];
  const a = { id: uid(), date, desc: desc || `Para ${dest?.name || 'outra conta'}`, amount: -amount, cat: 'Transferências', account: from, ...extra };
  const b = { id: uid(), date, desc: desc || `De ${accById(from)?.name || 'outra conta'}`, amount, cat: 'Transferências', account: to, pair: a.id, ...extra };
  a.pair = b.id;
  return [a, b];
}
/** Depois de importar: um movimento que sai de uma conta tua e entra noutra (mesmo valor, até 4 dias) é transferência. */
function matchTransfers(newTx) {
  let n = 0;
  for (const t of newTx) {
    if (t.pair) continue;
    const o = state.tx.find(x => !x.pair && x.account !== t.account && accById(x.account)?.type === 'bank' && x.amount === -t.amount && Math.abs(new Date(x.date) - new Date(t.date)) <= 4 * 864e5);
    if (!o) continue;
    t.cat = o.cat = 'Transferências'; t.pair = o.id; o.pair = t.id; n++;
  }
  return n;
}

// ---------- Pagamentos fixos ----------
// Cada pagamento fixo guarda `next`: o próximo mês ainda por lançar. Ao abrir a app,
// lança todos os meses em falta cuja data já chegou.
function fixedDate(f, mk) { return `${mk}-${String(Math.min(f.day, daysInMonth(mk))).padStart(2, '0')}`; }
function fixedDue(f, mk) { return f.freq !== 'yearly' || mk.slice(5) === f.start.slice(5); }
function runFixed() {
  const today = todayISO();
  let n = 0;
  for (const f of state.fixed) {
    let mk = f.next || f.start;
    for (let guard = 0; guard < 120 && fixedDate(f, mk) <= today; guard++) {
      if (fixedDue(f, mk)) {
        if (f.to) state.tx.push(...makeTransfer(fixedDate(f, mk), f.desc, f.amount, f.account, f.to, { fixed: f.id }));
        else state.tx.push({ id: uid(), date: fixedDate(f, mk), desc: f.desc, amount: f.amount, cat: f.cat, account: f.account, fixed: f.id });
        n++;
      }
      mk = shiftMonth(mk, 1);
    }
    f.next = mk;
  }
  if (n) save();
  return n;
}
/** Pagamentos fixos que ainda vão acontecer no mês indicado. */
function fixedPending(mk) {
  return state.fixed.filter(f => (f.next || f.start) <= mk && f.start <= mk && fixedDue(f, mk));
}
function freqLabel(f) {
  const where = f.to ? ` · para ${accById(f.to)?.name || '?'}` : (banks().length > 1 ? ` · ${accById(f.account)?.name || ''}` : '');
  return (f.freq === 'yearly' ? `todos os anos, a ${f.day} de ${monthName(f.start).split(' ')[0]}` : `dia ${f.day} de cada mês`) + where;
}
function fixedForm(f, preset) {
  const base = f || preset || {};
  openForm(f ? 'Editar pagamento fixo' : 'Novo pagamento fixo', [
    { name: 'kind', label: 'Tipo', options: ['Despesa', 'Receita'], value: (base.amount ?? -1) >= 0 ? 'Receita' : 'Despesa' },
    { name: 'desc', label: 'Descrição', value: base.desc, required: true, placeholder: 'ex.: Renda, Ginásio, Salário' },
    { name: 'amount', label: 'Valor (€)', type: 'money', value: base.amount ? String(Math.abs(base.amount)).replace('.', ',') : '', required: true },
    { name: 'cat', label: 'Categoria', options: CATS.map(c => c.id), value: base.cat || 'Casa' },
    ...(banks().length > 1 ? [{ name: 'account', label: 'Conta', options: banks().map(a => [a.id, a.name]), value: base.account }] : []),
    { name: 'freq', label: 'Repete', options: ['Todos os meses', 'Todos os anos'], value: base.freq === 'yearly' ? 'Todos os anos' : 'Todos os meses' },
    { name: 'first', label: f ? 'Data (dia do mês em que acontece)' : 'Primeira vez (ou próxima)', type: 'date', value: base.first || (f ? fixedDate(f, f.next || f.start) : todayISO()), required: true },
  ], v => {
    const n = parseAmount(v.amount);
    if (!n) { toast('Valor inválido.'); return false; }
    const amount = Math.abs(n) * (v.kind === 'Receita' ? 1 : -1);
    const day = +v.first.slice(8, 10), mk = v.first.slice(0, 7);
    const data = { desc: v.desc.trim(), amount, cat: v.cat, day, freq: v.freq === 'Todos os anos' ? 'yearly' : 'monthly', account: v.account || base.account || banks()[0].id };
    if (f) {
      Object.assign(f, data);
      // nunca recuar `next`, para não lançar outra vez meses que já foram lançados
      if (data.freq === 'yearly') f.start = mk;
      if (mk > (f.next || f.start)) f.next = mk;
      toast('Atualizado. Os movimentos já lançados não mudam.');
    } else {
      state.fixed.push({ id: uid(), ...data, start: mk, next: preset?.next || mk });
    }
    const added = runFixed();
    if (!f) toast(added ? `Pagamento fixo criado. Lançado(s) ${added} movimento(s) até hoje.` : 'Pagamento fixo criado. Será lançado na data certa.');
  });
}
function renderFixed() {
  const list = [...state.fixed].sort((a, b) => a.day - b.day);
  const out = list.filter(f => f.amount < 0 && f.freq !== 'yearly').reduce((s, f) => s - f.amount, 0);
  $('#fixedList').innerHTML = list.length
    ? '<ul class="tx-list">' + list.map(f => `<li data-fixed="${f.id}"><span class="ic">${CAT[f.cat]?.ic || '📦'}</span><span class="info"><b>${esc(f.desc)}</b><small>🔁 ${freqLabel(f)}</small></span><span class="amt ${f.amount >= 0 ? 'pos' : ''}">${f.amount >= 0 ? '+' : ''}${eur(f.amount)}</span></li>`).join('') + '</ul>'
      + (out ? `<p class="muted">Despesas fixas mensais: <b>${eur(out)}</b> (${eur(out * 12)}/ano).</p>` : '')
    : '<p class="muted">Ex.: renda, ginásio, Netflix, salário. São lançados sozinhos na data certa.</p>';
}

// ---------- Render ----------
function render() {
  runFixed();
  const ml = monthName(ui.month).replace(' de ', ' ');
  $('#monthLabel').textContent = ml[0].toUpperCase() + ml.slice(1);
  renderAccounts(); renderHome(); renderTxList(); renderFixed(); renderStats(); renderSave(); renderRules();
}

function txItem(t) {
  const c = CAT[t.cat] || CAT['Outros'];
  const accName = state.accounts.length > 1 ? ' · ' + esc(accById(t.account)?.name || '') : '';
  return `<li data-id="${t.id}"><span class="ic">${c.ic}</span><span class="info"><b>${esc(t.desc)}</b><small>${t.fixed ? '🔁 ' : ''}${esc(t.cat)} · ${t.date.split('-').reverse().join('/')}${accName}</small></span><span class="amt ${t.amount >= 0 ? 'pos' : ''}">${t.amount >= 0 ? '+' : ''}${eur(t.amount)}</span></li>`;
}
function barRow(label, value, max, extra = '', over = false, mark) {
  const w = max ? Math.min(100, value / max * 100) : 0;
  return `<div class="bar-row"><div class="lbl"><span>${label}</span><span>${extra}</span></div><div class="bar"><i class="${over ? 'over' : ''}" style="width:${w}%"></i>${mark != null ? `<span class="mark" style="left:${Math.min(100, mark)}%"></span>` : ''}</div></div>`;
}

function renderHome() {
  const list = txOfMonth(ui.month);
  const t = totals(list);
  $('#kIn').textContent = eur(t.inc);
  $('#kOut').textContent = eur(t.out);
  $('#kBal').textContent = eur(t.bal);
  $('#kBal').className = t.bal >= 0 ? 'pos' : 'neg';

  const cats = byCat(list);
  $('#homeCats').innerHTML = cats.length
    ? cats.map(([c, v]) => barRow(`${CAT[c]?.ic || ''} ${esc(c)}`, v, cats[0][1], `${eur(v)} · ${pct(v, t.out)}%`)).join('')
    : '<p class="empty">Sem despesas neste mês.</p>';

  const recent = [...list].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  $('#homeTx').innerHTML = recent.length ? recent.map(txItem).join('') : '<li class="empty" style="cursor:default">Ainda não há movimentos neste mês.</li>';

  // Dicas / alertas
  const tips = [];
  if (!state.tx.length) {
    tips.push('👋 <b>Bem-vindo!</b> Começa por adicionar uma despesa no botão <b>+</b>, ou importa o extrato do banco em <b>Mais → Importar</b>.');
    tips.push('<button class="btn small" data-act="demo">Ver com dados de exemplo</button>');
  } else {
    if (t.inc > 0) {
      const rate = t.bal / t.inc;
      tips.push(rate >= 0.2 ? `✅ Estás a poupar <b>${Math.round(rate * 100)}%</b> do que ganhaste. Ótimo!`
        : rate > 0 ? `🙂 Poupaste <b>${Math.round(rate * 100)}%</b> do que ganhaste. O ideal é chegar aos 20%.`
        : `⚠️ Gastaste mais do que ganhaste este mês (<b>${eur(-t.bal)}</b> a mais).`);
    }
    const cur = monthKey(new Date());
    if (ui.month === cur && t.out > 0) {
      // só os gastos do dia-a-dia são extrapolados; renda, contas e subscrições contam uma vez
      const day = new Date().getDate(), dim = daysInMonth(cur);
      const FIXED = ['Casa', 'Contas', 'Subscrições', 'Educação', 'Poupança'];
      const variable = cats.filter(([c]) => !FIXED.includes(c)).reduce((s, [, v]) => s + v, 0);
      if (day >= 5 && day < dim) tips.push(`📈 A este ritmo vais gastar cerca de <b>${eur(t.out + variable / day * (dim - day) + fixedPending(cur).filter(f => f.amount < 0 && !f.to && !NEUTRAL.includes(f.cat)).reduce((s, f) => s - f.amount, 0))}</b> até ao fim do mês.`);
    }
    const prev = totals(txOfMonth(shiftMonth(ui.month, -1)));
    if (prev.out > 0 && t.out > 0 && ui.month !== cur) {
      const d = (t.out - prev.out) / prev.out;
      tips.push(d > 0 ? `🔺 Gastaste <b>${Math.round(d * 100)}%</b> mais que no mês anterior.` : `🔻 Gastaste <b>${Math.round(-d * 100)}%</b> menos que no mês anterior.`);
    }
    const pend = fixedPending(ui.month).filter(f => ui.month >= monthKey(new Date()));
    const pendList = pend.filter(f => f.amount < 0 && !f.to && !NEUTRAL.includes(f.cat));
    const pendOut = pendList.reduce((s, f) => s - f.amount, 0);
    if (pendOut) tips.push(`🔁 Ainda vão sair <b>${eur(pendOut)}</b> em pagamentos fixos este mês (${pendList.map(f => esc(f.desc)).join(', ')}).`);
    if (t.inv > 0) tips.push(`📈 Puseste <b>${eur(t.inv)}</b> de parte em poupança/investimentos este mês (não conta como gasto).`);
    if (cats[0]) tips.push(`🏷️ A maior fatia foi <b>${esc(cats[0][0])}</b>: ${eur(cats[0][1])}.`);
    const catMap = Object.fromEntries(cats);
    for (const [c, lim] of Object.entries(state.budgets)) {
      if ((catMap[c] || 0) > lim) tips.push(`🚨 Passaste o limite de <b>${esc(c)}</b> (${eur(catMap[c])} de ${eur(lim)}).`);
    }
  }
  $('#insights').innerHTML = tips.map(x => `<div class="insight">${x}</div>`).join('');
}

function renderTxList() {
  const q = norm($('#txSearch').value).trim();
  const cf = $('#txCatFilter').value, af = $('#txAccFilter').value;
  const list = txOfMonth(ui.month)
    .filter(t => (!q || norm(t.desc).includes(q)) && (!cf || t.cat === cf) && (!af || t.account === af))
    .sort((a, b) => b.date.localeCompare(a.date));
  let html = '', lastDay = '';
  for (const t of list) {
    if (t.date !== lastDay) {
      lastDay = t.date;
      const d = new Date(t.date + 'T12:00');
      html += `<li class="day">${d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</li>`;
    }
    html += txItem(t);
  }
  $('#txList').innerHTML = html || '<li class="empty" style="cursor:default">Sem movimentos.</li>';
}

function renderStats() {
  // Gráfico de barras: 6 meses até ao mês selecionado
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(ui.month, i - 5));
  const data = months.map(mk => totals(txOfMonth(mk)));
  const max = Math.max(1, ...data.flatMap(d => [d.inc, d.out]));
  const W = 600, H = 200, base = 175, slot = W / 6, bw = slot * 0.3;
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Entradas e saídas por mês">`;
  data.forEach((d, i) => {
    const x = i * slot + slot / 2;
    const hi = d.inc / max * 150, ho = d.out / max * 150;
    svg += `<rect x="${x - bw - 2}" y="${base - hi}" width="${bw}" height="${hi}" rx="3" fill="var(--pos)"><title>Entradas ${eur(d.inc)}</title></rect>`;
    svg += `<rect x="${x + 2}" y="${base - ho}" width="${bw}" height="${ho}" rx="3" fill="var(--neg)"><title>Saídas ${eur(d.out)}</title></rect>`;
    svg += `<text x="${x}" y="194" text-anchor="middle">${monthName(months[i], true).replace('.', '')}</text>`;
  });
  svg += `<line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="var(--line)"/></svg>`;
  $('#chartMonths').innerHTML = svg;

  const av = averages();
  $('#averages').innerHTML = av ? `
    ${barRow('Entram por mês', av.inc, Math.max(av.inc, av.out), eur(av.inc))}
    ${barRow('Saem por mês', av.out, Math.max(av.inc, av.out), eur(av.out))}
    <p>Sobra em média <b class="${av.bal >= 0 ? 'pos' : 'neg'}">${eur(av.bal)}</b> por mês${av.inc ? ` (<b>${pct(av.bal, av.inc)}%</b> do rendimento)` : ''}.
    Num ano isso dá <b>${eur(av.bal * 12)}</b>.</p>
    <p class="muted">Baseado em: ${av.months.map(m => monthName(m)).join(', ')}.</p>`
    : '<p class="empty">Precisa de pelo menos um mês completo de dados.</p>';

  const cur = Object.fromEntries(byCat(txOfMonth(ui.month)));
  const allCats = [...new Set([...Object.keys(cur), ...Object.keys(av?.cats || {})])];
  const maxC = Math.max(1, ...allCats.flatMap(c => [cur[c] || 0, av?.cats[c] || 0]));
  $('#catCompare').innerHTML = allCats.length ? allCats
    .sort((a, b) => (cur[b] || 0) - (cur[a] || 0))
    .map(c => {
      const v = cur[c] || 0, a = av?.cats[c];
      const extra = a != null ? `${eur(v)} <small class="${v > a * 1.1 ? 'neg' : 'muted'}">(média ${eur(a)})</small>` : eur(v);
      return barRow(`${CAT[c]?.ic || ''} ${esc(c)}`, v, maxC, extra, a != null && v > a * 1.1, a != null ? a / maxC * 100 : null);
    }).join('') + '<p class="muted">O traço vertical marca a tua média.</p>'
    : '<p class="empty">Sem dados.</p>';

  const fixedKeys = new Set(state.fixed.map(f => ruleKey(f.desc)));
  const rec = recurring().filter(r => !fixedKeys.has(ruleKey(r.name)));
  const total = rec.reduce((s, r) => s + r.monthly, 0);
  ui.detected = rec;
  $('#recurring').innerHTML = rec.length
    ? rec.map((r, i) => `<div class="bar-row"><div class="lbl"><span>${CAT[r.cat]?.ic || ''} ${esc(r.name)}</span><span>${eur(r.monthly)}/mês <button class="btn small" data-make-fixed="${i}">Tornar fixo</button></span></div></div>`).join('')
      + `<p>Total: <b>${eur(total)}/mês</b> · <b>${eur(total * 12)}/ano</b>. Vale a pena rever se usas tudo isto.</p>`
      + '<p class="muted">“Tornar fixo” faz a app lançar o pagamento sozinha nos próximos meses.</p>'
    : '<p class="empty">Ainda não foram encontrados pagamentos que se repetem todos os meses.</p>';
}

function renderSave() {
  const av = averages();
  const surplus = av ? av.bal : null;
  const now = new Date();
  $('#goals').innerHTML = state.goals.length ? state.goals.map(g => {
    const left = Math.max(0, g.target - g.saved);
    const [y, m] = (g.deadline || '').split('-').map(Number);
    const monthsLeft = g.deadline ? Math.max(1, (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth()) + 1) : null;
    const perMonth = monthsLeft ? left / monthsLeft : null;
    let verdict = '';
    if (left === 0) verdict = '🎉 Objetivo atingido!';
    else if (perMonth != null && surplus != null) {
      verdict = surplus >= perMonth
        ? `✅ Precisas de <b>${eur(perMonth)}/mês</b> durante ${monthsLeft} ${monthsLeft === 1 ? 'mês' : 'meses'}. Com a tua sobra média (${eur(surplus)}) é possível.`
        : `⚠️ Precisas de <b>${eur(perMonth)}/mês</b>, mas sobra-te em média ${eur(Math.max(0, surplus))}. Corta ${eur(perMonth - Math.max(0, surplus))}/mês ou adia o prazo.`;
    } else if (perMonth != null) verdict = `Precisas de <b>${eur(perMonth)}/mês</b> durante ${monthsLeft} ${monthsLeft === 1 ? 'mês' : 'meses'}.`;
    else if (surplus > 0) verdict = `Ao ritmo da tua sobra média chegas lá em cerca de <b>${Math.ceil(left / surplus)} meses</b>.`;
    return `<div class="goal"><h3>🎯 ${esc(g.name)}</h3>
      ${barRow(`${eur(g.saved)} de ${eur(g.target)}`, g.saved, g.target, `${pct(g.saved, g.target)}%`)}
      <p class="muted">${g.deadline ? 'Prazo: ' + monthName(g.deadline) + '. ' : ''}${verdict}</p>
      <div class="row"><button class="btn small primary" data-goal-dep="${g.id}">+ Juntar dinheiro</button>
      <button class="btn small" data-goal-edit="${g.id}">Editar</button>
      <button class="btn small danger" data-goal-del="${g.id}">Apagar</button></div></div>`;
  }).join('') : '<p class="empty">Ainda não tens objetivos. Ex.: “Fundo de emergência”, “Férias”, “Carro”.</p>'
    + (av ? `<p class="muted">💡 Sugestão: um fundo de emergência de 3 a 6 meses de despesas = <b>${eur(av.out * 3)}</b> a <b>${eur(av.out * 6)}</b>.</p>` : '');

  const cur = Object.fromEntries(byCat(txOfMonth(ui.month)));
  const b = Object.entries(state.budgets);
  $('#budgets').innerHTML = b.length ? b.map(([c, lim]) => {
    const v = cur[c] || 0;
    return barRow(`${CAT[c]?.ic || ''} ${esc(c)}`, v, lim,
      `${eur(v)} / ${eur(lim)}${v > lim ? ' 🚨' : ''} <button class="chip-x" data-budget-del="${esc(c)}" aria-label="Remover limite">✕</button>`, v > lim);
  }).join('') : '';

  // 50/30/20
  const inc = totals(txOfMonth(ui.month)).inc || av?.inc || 0;
  if (!inc) { $('#plan5030').innerHTML = '<p class="empty">Regista o teu rendimento (ex.: salário) para ver o plano.</p>'; return; }
  const g = { need: 0, want: 0, save: 0 };
  for (const [c, v] of Object.entries(cur)) { const grp = CAT[c]?.group || 'want'; if (grp in g) g[grp] += v; }
  const spent = g.need + g.want;
  const saved = Math.max(0, inc - spent);
  const rows = [
    ['🧱 Necessidades (casa, contas, comida, transportes, saúde)', g.need, inc * 0.5, '50%'],
    ['🎈 Desejos (restaurantes, compras, lazer, subscrições)', g.want, inc * 0.3, '30%'],
    ['🐷 Poupança (o que sobra)', saved, inc * 0.2, '20%'],
  ];
  $('#plan5030').innerHTML = `<p class="muted">Uma regra simples: do que ganhas (${eur(inc)}), 50% para o essencial, 30% para o resto e 20% para poupar.</p>` +
    rows.map(([l, v, ideal, p], i) => barRow(l, v, ideal, `${eur(v)} <small class="muted">ideal ${p}: ${eur(ideal)}</small>`, i < 2 ? v > ideal : v < ideal)).join('');
}

function renderRules() {
  $('#rules').innerHTML = (state.rules.length
    ? state.rules.map((r, i) => `<span class="chip">“${esc(r.kw)}” → ${CAT[r.cat]?.ic || ''} ${esc(r.cat)}<button data-rule-del="${i}" aria-label="Remover">✕</button></span>`).join('')
    : '<p class="muted">Sem regras tuas ainda.</p>')
    + `<p class="muted">Além disso, a app já reconhece ${BUILTIN_RULES.length} lojas e serviços comuns em Portugal (Continente, Galp, EDP, Netflix…).</p>`;
}

// ---------- Movimentos: adicionar / editar ----------
function fillCatSelect(sel, kind, value) {
  const cats = kind === 'in' ? [...INCOME_CATS, ...NEUTRAL] : EXPENSE_CATS;
  sel.innerHTML = cats.map(c => `<option ${c === value ? 'selected' : ''}>${c}</option>`).join('');
}
function openTx(t) {
  ui.editing = t || null;
  const f = $('#txForm');
  const kind = t ? (t.amount >= 0 ? 'in' : 'out') : 'out';
  f.kind.value = kind;
  f.amount.value = t ? String(Math.abs(t.amount)).replace('.', ',') : '';
  f.desc.value = t ? t.desc : '';
  f.date.value = t ? t.date : (ui.month === monthKey(new Date()) ? todayISO() : ui.month + '-01');
  if (t) f.account.value = t.account;
  $('#kindTransfer').hidden = !!t || state.accounts.filter(a => a.type !== 'loan').length < 2;
  setKindUI();
  fillCatSelect(f.cat, kind, t ? t.cat : (kind === 'in' ? 'Salário' : 'Supermercado'));
  f.cat.dataset.touched = t ? '1' : '';
  $('#txDialogTitle').textContent = t ? 'Editar movimento' : 'Novo movimento';
  $('#txDelete').hidden = !t;
  f.repeat.value = 'no';
  $('#repeatWrap').hidden = !!t;
  $('#fixedNote').hidden = !(t && t.fixed);
  $('#txDialog').showModal();
  if (!t) setTimeout(() => f.amount.focus(), 50);
}
function setKindUI() {
  const f = $('#txForm'), tr = f.kind.value === 'tr';
  $('#catWrap').hidden = tr;
  $('#toWrap').hidden = !tr;
  $('#accWrap').hidden = banks().length < 2 && !tr;
  $('#accLabel').textContent = tr ? 'De' : 'Conta';
  f.desc.required = !tr;
  if (tr) {
    f.to.innerHTML = state.accounts.filter(a => a.id !== f.account.value && a.type !== 'loan').map(a => `<option value="${a.id}">${ACC_IC[a.type]} ${esc(a.name)}</option>`).join('');
  }
}
function setupTxForm() {
  const f = $('#txForm');
  f.account.addEventListener('change', setKindUI);
  f.querySelectorAll('input[name=kind]').forEach(r => r.addEventListener('change', () => {
    setKindUI();
    if (f.kind.value === 'tr') return;
    fillCatSelect(f.cat, f.kind.value, f.kind.value === 'in' ? 'Salário' : 'Supermercado');
    f.cat.dataset.touched = '';
  }));
  f.desc.addEventListener('input', () => {
    if (f.cat.dataset.touched) return;
    const sign = f.kind.value === 'in' ? 1 : -1;
    const c = guessCat(f.desc.value, sign);
    if ([...f.cat.options].some(o => o.value === c)) f.cat.value = c;
  });
  f.cat.addEventListener('change', () => { f.cat.dataset.touched = '1'; });
  $('#txCancel').onclick = () => $('#txDialog').close();
  $('#txDelete').onclick = async () => {
    const t = ui.editing;
    if (!t || !(await ask(t.pair ? 'Apagar esta transferência (nas duas contas)?' : 'Apagar este movimento?', 'Apagar'))) return;
    state.tx = state.tx.filter(x => x.id !== t.id && x.id !== t.pair);
    save(); $('#txDialog').close(); render(); toast('Movimento apagado.');
  };
  f.addEventListener('submit', e => {
    e.preventDefault();
    const v = parseAmount(f.amount.value);
    if (!v) { toast('Valor inválido.'); return; }
    if (f.kind.value === 'tr') {
      const from = f.account.value, to = f.to.value;
      if (!to) { toast('Escolhe a conta de destino.'); return; }
      if (f.repeat.value !== 'no') {
        const fx = { id: uid(), desc: f.desc.value.trim() || `Para ${accById(to).name}`, amount: -Math.abs(v), cat: accById(to).type === 'invest' ? 'Investimento' : 'Transferências',
          day: +f.date.value.slice(8, 10), freq: f.repeat.value, start: f.date.value.slice(0, 7), next: f.date.value.slice(0, 7), account: from, to };
        state.fixed.push(fx);
        runFixed();
      } else state.tx.push(...makeTransfer(f.date.value, f.desc.value.trim(), v, from, to));
      save(); $('#txDialog').close(); ui.month = f.date.value.slice(0, 7); render();
      toast('Transferência registada. Não conta como gasto.');
      return;
    }
    const amount = Math.abs(v) * (f.kind.value === 'in' ? 1 : -1);
    const data = { date: f.date.value, desc: f.desc.value.trim(), amount, cat: f.cat.value, account: f.account.value || banks()[0].id };
    if (ui.editing) {
      const old = ui.editing;
      Object.assign(old, data);
      if (old.cat !== guessCat(old.desc, old.amount)) learnRule(old);
    } else if (f.repeat.value !== 'no') {
      // o próprio movimento é a primeira ocorrência; os seguintes são lançados sozinhos
      const fx = { id: uid(), desc: data.desc, amount, cat: data.cat, account: data.account, day: +data.date.slice(8, 10),
        freq: f.repeat.value, start: data.date.slice(0, 7), next: shiftMonth(data.date.slice(0, 7), 1) };
      state.fixed.push(fx);
      state.tx.push({ id: uid(), ...data, fixed: fx.id });
      runFixed();
      toast('Guardado como pagamento fixo. Vê-os em Movimentos.');
    } else {
      state.tx.push({ id: uid(), ...data });
    }
    save(); $('#txDialog').close();
    ui.month = data.date.slice(0, 7);
    render();
  });
}
/** Quando o utilizador corrige uma categoria, cria uma regra e aplica-a aos movimentos parecidos. */
function learnRule(t) {
  const kw = ruleKey(t.desc);
  if (!kw) return;
  state.rules = state.rules.filter(r => r.kw !== kw);
  state.rules.unshift({ kw, cat: t.cat });
  let n = 0;
  for (const x of state.tx) {
    if (x !== t && (x.cat === 'Outros' || x.cat === 'Outras receitas') && kwMatches(norm(x.desc), kw) && (x.amount > 0) === (t.amount > 0)) { x.cat = t.cat; n++; }
  }
  toast(`Aprendido: “${kw}” → ${t.cat}${n ? `. Aplicado a mais ${n} movimento(s).` : ''}`);
}

// ---------- Formulário genérico ----------
function openForm(title, fields, onSubmit, onDelete) {
  $('#genTitle').textContent = title;
  const opt = (o, sel) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`; };
  $('#genFields').innerHTML = fields.map(fl => (fl.options
    ? `<label>${fl.label}<select name="${fl.name}">${fl.options.map(o => opt(o, fl.value)).join('')}</select></label>`
    : `<label>${fl.label}<input name="${fl.name}" type="${fl.type || 'text'}" ${fl.type === 'money' ? 'inputmode="decimal"' : ''} value="${esc(fl.value ?? '')}" ${fl.required ? 'required' : ''} placeholder="${esc(fl.placeholder || '')}"></label>`)
    + (fl.hint ? `<p class="muted hint">${fl.hint}</p>` : '')
  ).join('').replaceAll('type="money"', 'type="text"');
  $('#genDelete').hidden = !onDelete;
  $('#genDelete').onclick = () => { $('#genDialog').close(); onDelete(); };
  const form = $('#genForm');
  form.onsubmit = e => {
    e.preventDefault();
    const vals = Object.fromEntries(new FormData(form));
    if (onSubmit(vals) !== false) { $('#genDialog').close(); save(); render(); }
  };
  $('#genCancel').onclick = () => $('#genDialog').close();
  $('#genDialog').showModal();
}

function goalForm(g) {
  openForm(g ? 'Editar objetivo' : 'Novo objetivo', [
    { name: 'name', label: 'Nome', value: g?.name, required: true, placeholder: 'ex.: Férias no verão' },
    { name: 'target', label: 'Valor a juntar (€)', type: 'money', value: g ? String(g.target).replace('.', ',') : '', required: true },
    { name: 'saved', label: 'Já tenho (€)', type: 'money', value: g ? String(g.saved).replace('.', ',') : '0' },
    { name: 'deadline', label: 'Até quando? (opcional)', type: 'month', value: g?.deadline || '' },
  ], v => {
    const target = parseAmount(v.target);
    if (!target || target <= 0) { toast('Valor inválido.'); return false; }
    const obj = { name: v.name.trim(), target, saved: Math.max(0, parseAmount(v.saved) || 0), deadline: v.deadline || '' };
    if (g) Object.assign(g, obj); else state.goals.push({ id: uid(), ...obj });
  });
}

// ---------- Importação CSV ----------
function parseAmount(s) {
  if (typeof s === 'number') return s;
  let x = String(s ?? '').replace(/[\s €]|EUR/gi, '');
  if (!x || x === '-') return 0;
  let neg = false;
  if (/^\(.*\)$/.test(x)) { neg = true; x = x.slice(1, -1); }
  if (/-$/.test(x)) { neg = true; x = x.slice(0, -1); }
  const lc = x.lastIndexOf(','), ld = x.lastIndexOf('.');
  if (lc > -1 && ld > -1) x = lc > ld ? x.replace(/\./g, '').replace(',', '.') : x.replace(/,/g, '');
  else if (lc > -1) x = x.replace(/,(?=\d{3}(\D|$))(?!\d{1,2}$)/g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(x)) x = x.replace(/\./g, '');
  const n = parseFloat(x);
  return isNaN(n) ? NaN : (neg ? -Math.abs(n) : n);
}
function parseDate(s) {
  s = String(s ?? '').trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
  return null;
}
function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const firstLines = text.split(/\r?\n/).slice(0, 40).join('\n');
  const delim = [';', '\t', ','].map(d => [d, firstLines.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell.trim()); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell.trim()); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  return rows.filter(r => r.some(c => c));
}
function guessMapping(rows) {
  // a linha de cabeçalho é a primeira com texto tipo "data" seguida de linhas com datas
  let h = rows.findIndex((r, i) => r.length >= 3 && r.some(c => /^data|date|fecha/i.test(c)) && rows[i + 1] && rows[i + 1].some(c => parseDate(c)));
  if (h < 0) h = rows.findIndex(r => r.some(c => parseDate(c))) - 1;
  const header = h >= 0 ? rows[h] : [];
  const body = rows.slice(h + 1).filter(r => r.some(c => parseDate(c)));
  const n = Math.max(...body.slice(0, 20).map(r => r.length), header.length);
  const H = Array.from({ length: n }, (_, i) => norm(header[i] || '').trim());
  const find = (re, not) => H.findIndex(x => re.test(x) && !(not && not.test(x)));
  const map = { date: -1, desc: -1, amount: -1, debit: -1, credit: -1, fee: -1, state: -1, currency: -1, invert: false };
  // Extras do Revolut (e outros): comissão a somar, estado (ignorar anulados/pendentes) e moeda
  map.fee = find(/^fee$|^comissao$|^taxa$/);
  map.state = find(/^state$|^estado$/);
  map.currency = find(/^currency$|^moeda$|^divisa$/);
  map.date = find(/data (mov|lanc|oper|transa)|^data$|^date|fecha/);
  if (map.date < 0) map.date = find(/data/);
  map.desc = find(/descri|detalhe|movimento|concept|narrativ|description|referencia/, /data/);
  map.debit = find(/debito|saida|levantament|debit/);
  map.credit = find(/credito|entrada|deposito|credit/);
  if (map.debit < 0 || map.credit < 0) { map.debit = map.credit = -1; map.amount = find(/montante|valor|importancia|importe|amount|quantia/, /data|saldo/); }
  // Fallback pelo conteúdo
  const sample = body.slice(0, 15);
  const isDateCol = i => sample.filter(r => parseDate(r[i])).length > sample.length * 0.7;
  const isNumCol = i => sample.filter(r => r[i] && !isNaN(parseAmount(r[i])) && /\d/.test(r[i]) && !parseDate(r[i])).length > sample.length * 0.5;
  if (map.date < 0) map.date = [...Array(n).keys()].find(isDateCol) ?? -1;
  if (map.amount < 0 && map.debit < 0) map.amount = [...Array(n).keys()].find(i => isNumCol(i) && !/saldo/.test(H[i])) ?? -1;
  if (map.desc < 0) {
    let best = -1, len = 0;
    for (let i = 0; i < n; i++) {
      if (i === map.date || isDateCol(i) || isNumCol(i)) continue;
      const l = sample.reduce((s, r) => s + (r[i] || '').length, 0);
      if (l > len) { len = l; best = i; }
    }
    map.desc = best;
  }
  return { header: header.length ? header : Array.from({ length: n }, (_, i) => 'Coluna ' + (i + 1)), body, map, n };
}
function rowsToTx(info) {
  const { body, map } = info;
  const out = [];
  for (const r of body) {
    const date = parseDate(r[map.date]);
    if (!date) continue;
    let amount;
    if (map.debit >= 0 || map.credit >= 0) {
      const d = map.debit >= 0 ? Math.abs(parseAmount(r[map.debit]) || 0) : 0;
      const c = map.credit >= 0 ? Math.abs(parseAmount(r[map.credit]) || 0) : 0;
      amount = c - d;
    } else amount = parseAmount(r[map.amount]);
    if (!amount || isNaN(amount)) continue;
    if (map.invert) amount = -amount;
    if (map.state >= 0 && r[map.state] && !/complet|conclu/i.test(r[map.state])) continue;
    if (map.currency >= 0 && r[map.currency] && !/^eur$/i.test(r[map.currency].trim())) continue;
    if (map.fee >= 0) amount -= Math.abs(parseAmount(r[map.fee]) || 0);
    const desc = (r[map.desc] || 'Sem descrição').replace(/\s+/g, ' ').trim();
    out.push({ date, desc, amount: Math.round(amount * 100) / 100 });
  }
  return out;
}
function renderImport(info) {
  const opts = (sel, allowNone) => (allowNone ? '<option value="-1">— nenhuma —</option>' : '') +
    info.header.map((h, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${esc(h || 'Coluna ' + (i + 1))}</option>`).join('');
  const m = info.map;
  const parsed = rowsToTx(info);
  // Duplicado = movimento que já está na app (ex.: importar o mesmo mês duas vezes).
  // Conta-se quantas vezes cada um existe, para que dois movimentos iguais no mesmo dia
  // (ex.: dois cafés de 1,20 €) sejam ambos contabilizados.
  const key = t => t.date + '|' + t.amount + '|' + norm(t.desc);
  const existing = {};
  if (!accById(ui.importAcc) || accById(ui.importAcc).type !== 'bank') ui.importAcc = banks()[0].id;
  const acc = ui.importAcc;
  for (const t of state.tx) if (t.account === acc) existing[key(t)] = (existing[key(t)] || 0) + 1;
  const fresh = parsed.filter(t => existing[key(t)] > 0 ? (existing[key(t)]--, false) : true);
  const two = m.debit >= 0 || m.credit >= 0;
  $('#importArea').innerHTML = `
    <label>De que conta é este extrato?<select id="importAcc">${banks().map(a => `<option value="${a.id}" ${a.id === acc ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></label>
    <p class="muted">Tens mais bancos? Cria as contas no Resumo → “As minhas contas”. Confirma se as colunas estão certas:</p>
    <label>Data<select data-map="date">${opts(m.date)}</select></label>
    <label>Descrição<select data-map="desc">${opts(m.desc)}</select></label>
    <div class="seg"><label><input type="radio" name="amode" value="one" ${two ? '' : 'checked'}><span>Uma coluna de valor</span></label><label><input type="radio" name="amode" value="two" ${two ? 'checked' : ''}><span>Débito + Crédito</span></label></div>
    ${two ? `<label>Débito (saídas)<select data-map="debit">${opts(m.debit, true)}</select></label><label>Crédito (entradas)<select data-map="credit">${opts(m.credit, true)}</select></label>`
      : `<label>Valor<select data-map="amount">${opts(m.amount)}</select></label>`}
    <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="invert" style="width:auto;margin:0" ${m.invert ? 'checked' : ''}> As despesas aparecem como números positivos (inverter sinal)</label>
    <div class="table-wrap"><table><tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Categoria</th></tr>
      ${parsed.slice(0, 6).map(t => `<tr><td>${t.date}</td><td>${esc(t.desc.slice(0, 28))}</td><td class="${t.amount >= 0 ? 'pos' : ''}">${eur(t.amount)}</td><td>${guessCat(t.desc, t.amount)}</td></tr>`).join('')}
    </table></div>
    <p>${parsed.length} movimentos encontrados${parsed.length - fresh.length ? `, ${parsed.length - fresh.length} já existiam` : ''}.</p>
    <button class="btn primary" id="doImport" ${fresh.length ? '' : 'disabled'}>Importar ${fresh.length} movimentos</button>`;
  $('#importArea').querySelectorAll('[data-map]').forEach(s => s.onchange = () => { m[s.dataset.map] = +s.value; renderImport(info); });
  $('#importArea').querySelectorAll('input[name=amode]').forEach(r => r.onchange = () => {
    if (r.value === 'two') { m.amount = -1; m.debit = 0; m.credit = 0; } else { m.debit = m.credit = -1; m.amount = 0; }
    renderImport(info);
  });
  $('#invert').onchange = e => { m.invert = e.target.checked; renderImport(info); };
  $('#importAcc').onchange = e => { ui.importAcc = e.target.value; renderImport(info); };
  const btn = $('#doImport');
  if (btn) btn.onclick = () => {
    let merged = 0;
    const added = [];
    for (const t of fresh) {
      const auto = state.tx.find(x => x.fixed && !x.bank && x.account === acc && x.amount === t.amount && Math.abs(new Date(x.date) - new Date(t.date)) <= 6 * 864e5);
      if (auto) { auto.date = t.date; auto.desc = t.desc; auto.bank = true; auto.imp = true; merged++; continue; }
      const nt = { id: uid(), ...t, cat: guessCat(t.desc, t.amount), account: acc, imp: true };
      state.tx.push(nt); added.push(nt);
    }
    const tr = matchTransfers(added);
    if (tr) setTimeout(() => toast(`${tr} transferência(s) entre as tuas contas encontradas — não contam como gasto.`), merged ? 6600 : 3300);
    if (merged) setTimeout(() => toast(`${merged} pagamento(s) fixo(s) já lançados foram juntados com o extrato (sem duplicar).`), 3300);
    save();
    const months = fresh.map(t => t.date.slice(0, 7)).sort();
    if (months.length) ui.month = months[months.length - 1];
    $('#importArea').innerHTML = `<p class="pos">✅ ${fresh.length} movimentos importados.</p>`;
    render(); toast('Importado! Revê as categorias em Movimentos.');
  };
}
// Excel: a biblioteca só é carregada quando é preciso
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((ok, fail) => {
    const sc = document.createElement('script');
    sc.src = XLSX_URL; sc.onload = () => ok(window.XLSX); sc.onerror = () => fail(new Error('sem internet'));
    document.head.appendChild(sc);
  });
}
async function readExcel(file) {
  let X;
  try { X = await loadXLSX(); } catch { toast('Para ler Excel é preciso internet. Tenta outra vez ou exporta em CSV.'); throw new Error('xlsx'); }
  const wb = X.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const sh = wb.Sheets[wb.SheetNames[0]];
  const pad = n => String(n).padStart(2, '0');
  return X.utils.sheet_to_json(sh, { header: 1, raw: true, defval: '' })
    .map(r => r.map(c => c instanceof Date ? `${c.getFullYear()}-${pad(c.getMonth() + 1)}-${pad(c.getDate())}` : String(c).trim()))
    .filter(r => r.some(c => c));
}
async function readFileText(file) {
  const buf = await file.arrayBuffer();
  let text = new TextDecoder('utf-8').decode(buf);
  // muitos bancos portugueses exportam em Windows-1252/ISO-8859-1
  if (text.includes('\uFFFD')) text = new TextDecoder('windows-1252').decode(buf);
  return text;
}

// ---------- Dados de exemplo ----------
function demoData() {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tx = [];
  const add = (mk, day, desc, amount) => { day = Math.min(day, daysInMonth(mk)); tx.push({ id: uid(), date: `${mk}-${String(day).padStart(2, '0')}`, desc, amount: Math.round(amount * 100) / 100 }); };
  const cur = monthKey(new Date()), today = new Date().getDate();
  for (let i = 4; i >= 0; i--) {
    const mk = shiftMonth(cur, -i);
    const lim = i === 0 ? today : 31;
    const a = (d, desc, v) => { if (d <= lim) add(mk, d, desc, v); };
    a(1, 'TRF VENCIMENTO EMPRESA XYZ', 1450);
    a(2, 'DD RENDA CASA', -550);
    a(5, 'DD EDP COMERCIAL', -(48 + rnd() * 20));
    a(6, 'DD MEO SERVICOS', -39.99);
    a(8, 'COMPRA NETFLIX.COM', -13.99);
    a(9, 'COMPRA SPOTIFY', -7.99);
    a(10, 'DD FITNESS HUT', -29.9);
    for (let w = 0; w < 4; w++) {
      a(3 + w * 7, rnd() > 0.5 ? 'COMPRA CONTINENTE MODELO' : 'COMPRA PINGO DOCE', -(35 + rnd() * 45));
      a(4 + w * 7, 'COMPRA LIDL', -(12 + rnd() * 20));
      if (rnd() > 0.3) a(6 + w * 7, 'COMPRA GALP AREEIRO', -(40 + rnd() * 20));
      if (rnd() > 0.4) a(5 + w * 7, rnd() > 0.5 ? 'COMPRA GLOVO' : 'COMPRA RESTAURANTE O MANEL', -(12 + rnd() * 25));
      if (rnd() > 0.6) a(7 + w * 7, 'COMPRA AMAZON EU', -(15 + rnd() * 50));
    }
    a(14, 'COMPRA FARMACIA CENTRAL', -(8 + rnd() * 25));
    if (rnd() > 0.5) a(20, 'COMPRA CINEMAS NOS', -14.6);
    a(22, 'LEVANTAMENTO ATM', -40);
  }
  return tx.map(t => ({ ...t, cat: guessCat(t.desc, t.amount) }));
}

// ---------- Ligações aos elementos ----------
function bind() {
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
    document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('active', x === b));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + b.dataset.view));
    window.scrollTo(0, 0);
  });
  $('#prevMonth').onclick = () => { ui.month = shiftMonth(ui.month, -1); render(); };
  $('#nextMonth').onclick = () => { ui.month = shiftMonth(ui.month, 1); render(); };
  $('#fab').onclick = () => openTx();
  $('#txSearch').oninput = renderTxList;
  $('#txCatFilter').innerHTML += CATS.map(c => `<option>${c.id}</option>`).join('');
  $('#txCatFilter').onchange = renderTxList;
  setupTxForm();

  document.body.addEventListener('click', e => {
    const li = e.target.closest('.tx-list li[data-id]');
    if (li) { openTx(state.tx.find(t => t.id === li.dataset.id)); return; }
    const ali = e.target.closest('li[data-acc]');
    if (ali) { accountForm(accById(ali.dataset.acc)); return; }
    const fli = e.target.closest('li[data-fixed]');
    if (fli) { fixedMenu(state.fixed.find(f => f.id === fli.dataset.fixed)); return; }
    const d = e.target.dataset;
    if (d.act === 'demo') loadDemo();
    if (d.goalDep) {
      const g = state.goals.find(x => x.id === d.goalDep);
      openForm(`Juntar a “${g.name}”`, [{ name: 'v', label: 'Valor (€)', type: 'money', required: true }], v => {
        const n = parseAmount(v.v); if (!n) { toast('Valor inválido.'); return false; }
        g.saved = Math.max(0, g.saved + n);
        if (g.saved >= g.target) toast('🎉 Parabéns, objetivo atingido!');
      });
    }
    if (d.goalEdit) goalForm(state.goals.find(x => x.id === d.goalEdit));
    if (d.goalDel) ask('Apagar este objetivo?', 'Apagar').then(ok => { if (ok) { state.goals = state.goals.filter(x => x.id !== d.goalDel); save(); render(); } });
    if (d.budgetDel) { delete state.budgets[d.budgetDel]; save(); render(); }
    if (d.makeFixed != null) {
      const r = ui.detected[+d.makeFixed];
      fixedForm(null, { desc: r.name, amount: -r.monthly, cat: r.cat, first: r.last, next: shiftMonth(r.last.slice(0, 7), 1) });
    }
    if (d.ruleDel != null) { state.rules.splice(+d.ruleDel, 1); save(); render(); }
  });

  $('#addGoal').onclick = () => goalForm();
  $('#addFixed').onclick = () => fixedForm();
  $('#addAccount').onclick = () => accountForm();
  $('#txAccFilter').onchange = renderTxList;
  document.addEventListener('visibilitychange', () => { if (!document.hidden && runFixed()) render(); });
  $('#addBudget').onclick = () => {
    const av = averages();
    openForm('Limite mensal', [
      { name: 'cat', label: 'Categoria', options: EXPENSE_CATS.filter(c => c !== 'Transferências'), value: 'Restauração' },
      { name: 'v', label: 'Limite por mês (€)' + (av ? ' — vê a tua média em Estatísticas' : ''), type: 'money', required: true },
    ], v => {
      const n = parseAmount(v.v); if (!n || n <= 0) { toast('Valor inválido.'); return false; }
      state.budgets[v.cat] = n;
    });
  };
  $('#addRule').onclick = () => openForm('Nova regra', [
    { name: 'kw', label: 'Se a descrição contém…', required: true, placeholder: 'ex.: padaria joana' },
    { name: 'cat', label: 'Então a categoria é', options: CATS.map(c => c.id), value: 'Restauração' },
  ], v => {
    const kw = norm(v.kw).trim(); if (!kw) return false;
    state.rules = state.rules.filter(r => r.kw !== kw);
    state.rules.unshift({ kw, cat: v.cat });
    let n = 0;
    for (const t of state.tx) if (kwMatches(norm(t.desc), kw) && t.cat !== v.cat) { t.cat = v.cat; n++; }
    toast(`Regra criada${n ? ` e aplicada a ${n} movimento(s)` : ''}.`);
  });

  $('#csvFile').onchange = async e => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    try {
      const rows = /\.(xlsx?|ods)$/i.test(file.name) ? await readExcel(file) : parseCSV(await readFileText(file));
      const info = guessMapping(rows);
      if (!info.body.length) { $('#importArea').innerHTML = '<p class="neg">Não encontrei movimentos com datas neste ficheiro.</p>'; return; }
      renderImport(info);
    } catch (err) { console.error(err); toast('Não consegui ler o ficheiro.'); }
  };

  // Cópia: mostra o texto para copiar (funciona em todo o lado) e tenta também descarregar o ficheiro.
  $('#exportJson').onclick = () => {
    const json = JSON.stringify(state);
    $('#backupText').value = json;
    $('#backupCopy').onclick = async () => {
      try { await navigator.clipboard.writeText(json); toast('Copiado. Cola numa nota ou envia para ti por email.'); }
      catch { $('#backupText').select(); toast('Seleciona o texto e copia.'); }
    };
    $('#backupDownload').onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = `mealheiro-${todayISO()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $('#backupDialog').showModal();
  };
  $('#backupClose').onclick = () => $('#backupDialog').close();
  $('#restoreText').onclick = () => restore($('#backupText').value);
  $('#importJson').onchange = async e => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    restore(await file.text());
  };
  $('#loadDemo').onclick = loadDemo;
  $('#wipe').onclick = async () => { if (await ask('Apagar TODOS os dados? Isto não se pode desfazer.', 'Apagar tudo')) { state = migrate(blank()); save(); render(); } };
}
async function fixedMenu(f) {
  const d = $('#fixedDialog');
  $('#fixedTitle').textContent = f.desc;
  $('#fixedInfo').textContent = `${f.amount >= 0 ? '+' : ''}${eur(f.amount)} · ${freqLabel(f)}`;
  $('#fixedEdit').onclick = () => { d.close(); fixedForm(f); };
  $('#fixedStop').onclick = async () => {
    d.close();
    if (!(await ask(`Parar “${f.desc}”? Os movimentos já lançados ficam.`, 'Parar'))) return;
    state.fixed = state.fixed.filter(x => x.id !== f.id);
    save(); render(); toast('Pagamento fixo parado.');
  };
  $('#fixedClose').onclick = () => d.close();
  d.showModal();
}
async function restore(text) {
  let s;
  try { s = JSON.parse(text); if (!Array.isArray(s.tx)) throw new Error('formato'); }
  catch { toast('Cópia inválida.'); return; }
  if (!(await ask(`Substituir os dados atuais pelos da cópia (${s.tx.length} movimentos)?`, 'Restaurar'))) return;
  state = migrate(s); save(); render();
  if ($('#backupDialog').open) $('#backupDialog').close();
  toast('Cópia restaurada.');
}
/** Pergunta de confirmação dentro da página (confirm() não funciona em todo o lado). */
function ask(msg, okLabel = 'Continuar') {
  return new Promise(resolve => {
    const d = $('#askDialog');
    $('#askMsg').textContent = msg;
    $('#askOk').textContent = okLabel;
    $('#askOk').onclick = () => { d.close(); resolve(true); };
    $('#askCancel').onclick = () => { d.close(); resolve(false); };
    d.oncancel = () => resolve(false);
    d.showModal();
  });
}
async function loadDemo() {
  if (state.tx.length && !(await ask('Isto substitui os teus dados pelos de exemplo. Continuar?'))) return;
  state = blank();
  state.accounts = [
    { id: 'demo-a', name: 'Conta ordenado', type: 'bank', opening: 0 },
    { id: 'demo-b', name: 'Conta poupança', type: 'bank', opening: 0 },
    { id: 'demo-x', name: 'XTB', type: 'invest', base: 4000, values: [] },
  ];
  state.tx = demoData().map(t => ({ ...t, account: 'demo-a' }));
  state.goals = [{ id: uid(), name: 'Fundo de emergência', target: 3000, saved: 600, deadline: shiftMonth(monthKey(new Date()), 12) }];
  state.budgets = { 'Restauração': 100 };
  const cur = monthKey(new Date());
  const fx = (desc, amount, cat, day) => {
    const id = uid();
    for (const t of state.tx) if (t.desc === desc) t.fixed = id;
    state.fixed.push({ id, desc, amount, cat, day, account: 'demo-a', freq: 'monthly', start: shiftMonth(cur, -4), next: fixedDate({ day }, cur) <= todayISO() ? shiftMonth(cur, 1) : cur });
  };
  fx('TRF VENCIMENTO EMPRESA XYZ', 1450, 'Salário', 1);
  fx('DD RENDA CASA', -550, 'Casa', 2);
  fx('DD MEO SERVICOS', -39.99, 'Contas', 6);
  fx('COMPRA NETFLIX.COM', -13.99, 'Subscrições', 8);
  fx('DD FITNESS HUT', -29.9, 'Subscrições', 10);
  // 200 €/mês para a XTB e uma transferência para a conta poupança
  const xf = { id: uid(), desc: 'TRF XTB', amount: -200, cat: 'Investimento', day: 3, freq: 'monthly', start: shiftMonth(cur, -4), next: shiftMonth(cur, -4), account: 'demo-a', to: 'demo-x' };
  state.fixed.push(xf);
  runFixed();
  state.tx.push(...makeTransfer(`${shiftMonth(cur, -1)}-15`, 'TRF PARA POUPANCA', 300, 'demo-a', 'demo-b'));
  state.accounts[0].anchor = { date: todayISO(), value: 2350 };
  state.accounts[1].anchor = { date: todayISO(), value: 6000 };
  // valor indicado no fim do mês passado (antes do depósito deste mês)
  const thisMonth = state.tx.filter(t => t.to === 'demo-x' && t.date.startsWith(cur)).reduce((s, t) => s - t.amount, 0);
  state.accounts[2].values = [{ date: `${shiftMonth(cur, -1)}-28`, value: 5180, since: invested(state.accounts[2], `${shiftMonth(cur, -1)}-28`) - thisMonth }];
  ui.month = monthKey(new Date());
  save(); render(); toast('Dados de exemplo carregados. Podes apagá-los em Mais.');
}

bind();
save();
render();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});

// exposto para testes
if (typeof window !== 'undefined') window.__mealheiro = { parseAmount, parseDate, parseCSV, guessMapping, rowsToTx, guessCat };
