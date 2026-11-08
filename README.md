# Mealheiro 🐷 — controlo de dinheiro pessoal

App simples para registar despesas e receitas, ver estatísticas e planear poupanças.
Funciona no browser do telemóvel e pode ser "instalada" como app (ecrã inicial). Não precisa de servidor nem de conta:
**os dados ficam guardados só no teu dispositivo.**

## O que já faz
- **Adicionar movimentos à mão** (botão +). A categoria é sugerida pela descrição (ex.: "Galp" → Combustível).
- **Importar o extrato do banco em CSV** — deteta sozinha as colunas (data, descrição, valor ou débito/crédito),
  lida com o formato português (`1.234,56`, `dd-mm-aaaa`, `;`), ignora duplicados e categoriza automaticamente
  (reconhece ~150 lojas/serviços comuns em Portugal).
- **Pagamentos fixos** (renda, ginásio, salário…): mensais ou anuais, lançados sozinhos na data certa. Ao importar o extrato,
  o movimento do banco junta-se ao lançado automaticamente, sem duplicar. Os pagamentos repetidos detetados podem virar fixos com um toque.
- **Várias contas** (bancos e investimentos): saldo de cada conta, património total, extrato importado para a conta certa.
  Transferências entre contas tuas são detetadas sozinhas (mesmo valor a sair de uma e a entrar noutra até 4 dias) e não contam como gasto.
- **Extratos testados nos formatos de Revolut (CSV/Excel), Santander e ActivoBank (Excel)** — ignora movimentos anulados
  e noutras moedas, soma comissões. O saldo indicado numa data não é alterado por extratos antigos importados depois.
- **Crédito habitação**: conta do tipo crédito, com o valor em dívida atualizado à mão; entra no património.
- **Investimentos** (ex.: XTB): indicas o valor atual de vez em quando; as transferências para lá são somadas e a app mostra o ganho/perda.
- **Aprende**: se corriges a categoria de um movimento, cria uma regra e aplica-a a movimentos parecidos.
- **Resumo do mês**: entradas, saídas, saldo, taxa de poupança, previsão até ao fim do mês, alertas.
- **Estatísticas**: últimos 6 meses, médias, cada categoria vs. a tua média, pagamentos recorrentes (subscrições, contas).
- **Poupança**: objetivos com prazo (diz quanto tens de poupar por mês e se é viável), limites por categoria, plano 50/30/20.
- **Cópia de segurança** (exportar/restaurar ficheiro) e dados de exemplo para experimentar.

## Como usar no telemóvel
1. No GitHub: *Settings → Pages → Branch:* escolher o ramo e a pasta `/ (root)` → *Save*.
2. Abrir o endereço que aparece (ex.: `https://<utilizador>.github.io/Save-Matriz-Banc/`).
3. No Android (Chrome): menu ⋮ → *Adicionar ao ecrã principal*. No iPhone (Safari): Partilhar → *Adicionar ao ecrã principal*.

Para testar no computador: `python3 -m http.server` nesta pasta e abrir `http://localhost:8000`.

## Próximos passos possíveis (formas de não escrever tudo à mão)
- **Ligação direta ao banco (Open Banking / PSD2)** — via um agregador (ex.: Tink, Salt Edge, Enable Banking).
  Precisa de um pequeno servidor e normalmente de registo/contrato com o agregador.
- **Fotografia do talão** com leitura automática (OCR) do valor e da loja.
- **Ler notificações / SMS do banco** (só possível numa app Android nativa).
- **Importar ficheiros Excel** (.xlsx) diretamente.
- **Sincronizar entre dispositivos** (precisa de conta/servidor).

## Ficheiros
`index.html` (ecrãs), `style.css` (aspeto), `app.js` (lógica), `sw.js` + `manifest.json` (funcionar offline e instalar).
