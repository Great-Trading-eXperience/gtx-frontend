export const formatDate = (timestamp: string): string => {
  return new Date(parseInt(timestamp)).toLocaleString();
};
