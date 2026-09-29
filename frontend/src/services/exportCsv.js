// Export data array to CSV file for official reporting and audit trails

export function exportToCsv(filename, rows) {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  const separator = ',';
  const keys = Object.keys(rows[0]);

  const csvContent =
    keys.map(key => `"${key}"`).join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            if (typeof cell === 'object') {
              cell = JSON.stringify(cell);
            }
            cell = cell.toString().replace(/"/g, '""');
            return `"${cell}"`;
          })
          .join(separator);
      })
      .join('\n');

  // Add UTF-8 BOM for Microsoft Excel compliance
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
