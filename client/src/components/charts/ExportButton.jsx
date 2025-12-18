import { useState } from 'react';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function ExportButton({ 
  chartRef, 
  data, 
  filename = 'chart', 
  type = 'both' // 'csv', 'png', or 'both'
}) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPNG = async () => {
    if (!chartRef?.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      canvas.toBlob(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
        setIsExporting(false);
      });
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    if (type === 'csv' || type === 'both') {
      exportToCSV();
    }
    if (type === 'png' || type === 'both') {
      await exportToPNG();
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-lg transition-colors"
    >
      <Download className="w-4 h-4" />
      {isExporting ? 'Exporting...' : 'Export'}
    </button>
  );
}
