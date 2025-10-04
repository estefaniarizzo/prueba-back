import { calculateBusinessDays } from "../src/utils/businessDays";

describe("calculateBusinessDays", () => {
  it("should return 0 when start and end are the same business day", () => {
    const result = calculateBusinessDays("2025-10-01", "2025-10-01");
    expect(result).toBe(0);
  });

  it("should skip weekends", () => {
    const result = calculateBusinessDays("2025-10-04", "2025-10-06"); 
    expect(result).toBe(1);
  });

  it("should count multiple weekdays correctly", () => {
    const result = calculateBusinessDays("2025-10-01", "2025-10-07"); 
    expect(result).toBe(4);
  });
});
