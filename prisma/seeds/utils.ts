export const createInitialScores = (
  count: number,
  level: string | null = null
) => {
  return Array.from({ length: count }, () => ({
    level: level,
    value: 0
  }));
};
