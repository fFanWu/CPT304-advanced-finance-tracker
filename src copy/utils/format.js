export const generateID = () => {
  return `tx_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const escapeHtml = (str) => {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
