import { escapeHtml, formatCurrency, formatDate } from "../utils/format.js";
import { filterTransactions, groupByMonth, calculateTotals } from "../state/transactions.js";

const identityT = (key) => key;

const translateCategory = (rawCategory, t) => {
  if (typeof rawCategory !== "string" || rawCategory.length === 0) return "";
  const key = `category.${rawCategory.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? rawCategory : translated;
};

export const renderSummary = (dom, transactions) => {
  const { totalIncome, totalExpenses, totalBalance } = calculateTotals(transactions);

  dom.totalIncome.textContent = formatCurrency(totalIncome);
  dom.totalExpenses.textContent = formatCurrency(Math.abs(totalExpenses));
  dom.totalBalance.textContent = formatCurrency(totalBalance);
};

export const renderTransactionItem = (tx, t = identityT) => {
  const typeClass = tx.amount >= 0 ? "amount--income" : "amount--expense";
  const formattedAmount = formatCurrency(tx.amount);
  const formattedDate = formatDate(tx.date);
  const categoryLabel = translateCategory(tx.category, t);

  return `
    <div class="transaction">
      <div>
        <p class="transaction__title">${escapeHtml(tx.title)}</p>
        <div class="transaction__meta">
          <span class="badge">${escapeHtml(categoryLabel)}</span>
          <span>${escapeHtml(formattedDate)}</span>
        </div>
      </div>
      <div>
        <p class="amount ${typeClass}">${escapeHtml(formattedAmount)}</p>
        <button class="edit-btn" data-id="${escapeHtml(tx.id)}">${escapeHtml(t("transactions.edit"))}</button>
        <button class="delete-btn" data-id="${escapeHtml(tx.id)}">${escapeHtml(t("transactions.delete"))}</button>
      </div>
    </div>
  `;
};

export const renderTransactions = (dom, transactions, filters, t = identityT) => {
  const filtered = filterTransactions(transactions, filters);

  dom.resultsCount.textContent = `${filtered.length} ${t("transactions.results")}`;

  if (filtered.length === 0) {
    dom.transactionsList.innerHTML = `
      <div class="transactions__empty">
        <div class="empty__icon">+</div>
        <p>${escapeHtml(t("transactions.empty"))}</p>
        <button class="btn btn--accent empty-add-btn" type="button">${escapeHtml(t("transactions.addFirst"))}</button>
      </div>
    `;
    return;
  }

  const groups = groupByMonth(filtered);

  dom.transactionsList.innerHTML = groups
    .map(
      (group) => `
        <div class="month-group">
          <p class="month-title">${escapeHtml(group.label)}</p>
          ${group.items.map((item) => renderTransactionItem(item, t)).join("")}
        </div>
      `,
    )
    .join("");
};
