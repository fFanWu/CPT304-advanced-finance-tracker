export const validateTransactionInput = ({ title, amount, category, date }) => {
  const errors = {};

  const trimmedTitle = typeof title === "string" ? title.trim() : "";
  const amountNum = Number(amount);

  if (!trimmedTitle) {
    errors.title = "Title is required.";
  } else if (trimmedTitle.length > 200) {
    errors.title = "Title must be 200 characters or fewer.";
  }

  if (!amount || Number.isNaN(amountNum) || amountNum === 0) {
    errors.amount = "Enter a valid amount.";
  }

  if (!category) {
    errors.category = "Select a category.";
  }

  if (!date) {
    errors.date = "Pick a date.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
};
