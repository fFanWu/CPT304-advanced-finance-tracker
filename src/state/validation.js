export const validateTransactionInput = ({ title, amount, category, date }) => {
  const errors = {};

  const trimmedTitle = typeof title === "string" ? title.trim() : "";
  const amountNum = Number(amount);

  if (!trimmedTitle) {
    errors.title = "error.titleRequired";
  } else if (trimmedTitle.length > 200) {
    errors.title = "error.titleTooLong";
  }

  if (!amount || Number.isNaN(amountNum) || amountNum === 0) {
    errors.amount = "error.amountInvalid";
  }

  if (!category) {
    errors.category = "error.categoryRequired";
  }

  if (!date) {
    errors.date = "error.dateRequired";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
};
