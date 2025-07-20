export const updateOrderBookSide = (
  currentSide: [string, string][],
  updates: [string, string][],
  sortOrder: 'asc' | 'desc'
): [string, string][] => {
  const updated = [...currentSide];
  
  updates.forEach(([price, quantity]) => {
    const index = updated.findIndex(item => item[0] === price);
    
    if (parseFloat(quantity) === 0) {
      if (index !== -1) updated.splice(index, 1);
    } else if (index !== -1) {
      updated[index] = [price, quantity];
    } else {
      updated.push([price, quantity]);
    }
  });

  return updated.sort((a, b) => 
    sortOrder === 'desc' 
      ? parseFloat(b[0]) - parseFloat(a[0])
      : parseFloat(a[0]) - parseFloat(b[0])
  );
};