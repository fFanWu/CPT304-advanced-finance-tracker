import { escapeHtml, formatCurrency, formatDate } from "../utils/format.js";
import { filterTransactions, groupByMonth, calculateTotals } from "../state/transactions.js";

export const renderSummary = (dom, transactions) => {
  const { totalIncome, totalExpenses, totalBalance } = calculateTotals(transactions);

  dom.totalIncome.textContent = formatCurrency(totalIncome);
  dom.totalExpenses.textContent = formatCurrency(Math.abs(totalExpenses));
  dom.totalBalance.textContent = formatCurrency(totalBalance);
};

export const renderTransactionItem = (tx) => {
  const typeClass = tx.amount >= 0 ? "amount--income" : "amount--expense";
  const formattedAmount = formatCurrency(tx.amount);
  const formattedDate = formatDate(tx.date);

  return `
    <div class="transaction">
      <div>
        <p class="transaction__title">${escapeHtml(tx.title)}</p>
        <div class="transaction__meta">
          <span class="badge">${escapeHtml(tx.category)}</span>
          <span>${escapeHtml(formattedDate)}</span>
        </div>
      </div>
      <div>
        <p class="amount ${typeClass}">${escapeHtml(formattedAmount)}</p>
        <button class="edit-btn" data-id="${escapeHtml(tx.id)}">Edit</button>
        <button class="delete-btn" data-id="${escapeHtml(tx.id)}">Delete</button>
      </div>
    </div>
  `;
};

export const renderTransactions = (dom, transactions, filters) => {
  const filtered = filterTransactions(transactions, filters);

  dom.resultsCount.textContent = `${filtered.length} results`;

  if (filtered.length === 0) {
    dom.transactionsList.innerHTML = `
      <div class="transactions__empty">
        <div class="empty__icon">+</div>
        <p>No transactions yet. Add your first one to get started.</p>
        <button class="btn btn--accent empty-add-btn" type="button">Add First Transaction</button>
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
          ${group.items.map(renderTransactionItem).join("")}
        </div>
      `,
    )
    .join("");
};
