export type PortfolioNameValidation =
  | { success: true; name: string }
  | { success: false; error: string };

export function validatePortfolioName(input: unknown): PortfolioNameValidation {
  if (
    typeof input !== "object" ||
    input === null ||
    !("name" in input) ||
    typeof input.name !== "string"
  ) {
    return { success: false, error: "A portfolio name is required" };
  }

  const name = input.name.trim();

  if (name.length === 0 || name.length > 100) {
    return {
      success: false,
      error: "Name must be between 1 and 100 characters",
    };
  }

  return { success: true, name };
}