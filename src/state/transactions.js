export const filterTransactions = (transactions, filters) => {
  const { category, type, search } = filters;

  return transactions.filter((tx) => {
    const matchesCategory = category === "all" || tx.category === category;
    const matchesType =
      type === "all" ||
      (type === "income" && tx.amount > 0) ||
      (type === "expense" && tx.amount < 0);
    const matchesSearch = tx.title.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesType && matchesSearch;
  });
};

export const groupByMonth = (transactions) => {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  const groups = [];
  const lookup = new Map();

  sorted.forEach((tx) => {
    const label = new Date(tx.date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (!lookup.has(label)) {
      lookup.set(label, { label, items: [] });
      groups.push(lookup.get(label));
    }

    lookup.get(label).items.push(tx);
  });

  return groups;
};

export const calculateTotals = (transactions) => {
  const amounts = transactions.map((tx) => tx.amount);

  const totalIncome = amounts
    .filter((a) => a > 0)
    .reduce((sum, a) => sum + a, 0);

  const totalExpenses = amounts
    .filter((a) => a < 0)
    .reduce((sum, a) => sum + a, 0);

  const totalBalance = totalIncome + totalExpenses;

  return { totalIncome, totalExpenses, totalBalance };
};
