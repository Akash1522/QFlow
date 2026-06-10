import React, { useEffect, useState } from 'react';
import { FileText, Download, Search, Calendar, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useSocket } from '../../context/SocketContext';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); 
  const [resourceFilter, setResourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const socket = useSocket();

  const fetchReports = async () => {
    try {
      const res = await axios.get('/admin/reports');
      setReports(res.data);
      setFilteredReports(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    if(socket) socket.on('queue_update', fetchReports);
    return () => { if(socket) socket.off('queue_update', fetchReports); }
  }, [socket]);

  useEffect(() => {
    let filtered = [...reports];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.user_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (resourceFilter !== 'all') {
        filtered = filtered.filter(r => r.resource_type === resourceFilter);
    }

    if (statusFilter !== 'all') {
        filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let cutoff = new Date();
      if (dateFilter === 'today') {
        cutoff.setHours(0,0,0,0);
      } else if (dateFilter === '7days') {
        cutoff.setDate(now.getDate() - 7);
      } else if (dateFilter === '30days') {
        cutoff.setDate(now.getDate() - 30);
      }
      filtered = filtered.filter(r => new Date(r.queue_time) >= cutoff);
    }

    setFilteredReports(filtered);
    setCurrentPage(1);
  }, [searchTerm, dateFilter, resourceFilter, statusFilter, reports]);

  const handleExportCSV = () => {
    if (filteredReports.length === 0) return;
    
    // Excel compatibility requires BOM
    const BOM = "\uFEFF";
    
    const headers = ['User Name', 'Resource', 'Status', 'Queue Time', 'Completion Time', 'Duration (mins)'];
    
    const csvContent = BOM + [
      headers.join(','),
      ...filteredReports.map(r => [
        `"${r.user_name}"`,
        `"${r.resource_type.replace('_', ' ')}"`,
        `"${r.status}"`,
        `"${new Date(r.queue_time).toLocaleString()}"`,
        `"${r.completion_time ? new Date(r.completion_time).toLocaleString() : '-'}"`,
        `"${r.duration !== null ? r.duration : '-'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Filename format: qflow-report-YYYY-MM-DD.csv
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `qflow-report-${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
      if (filteredReports.length === 0) return;
      const doc = new jsPDF();
      
      doc.text("QFlow System Reports", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

      const tableData = filteredReports.map(r => [
          r.user_name,
          r.resource_type.replace('_', ' '),
          r.status,
          new Date(r.queue_time).toLocaleString(),
          r.completion_time ? new Date(r.completion_time).toLocaleString() : '-',
          r.duration !== null ? r.duration : '-'
      ]);

      doc.autoTable({
          startY: 30,
          head: [['User Name', 'Resource', 'Status', 'Queue Time', 'Completion Time', 'Duration (mins)']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [14, 165, 233] }
      });

      doc.save(`qflow-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const currentReports = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/20 text-warning flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Queue Reports</h2>
            <p className="text-muted-foreground">Export and view detailed queue history</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handleExportCSV}
                disabled={filteredReports.length === 0}
                className="flex items-center justify-center gap-2 bg-card hover:bg-muted disabled:opacity-50 text-foreground px-4 py-3 rounded-xl border border-border transition-colors font-medium"
            >
                <Download size={18} /> CSV
            </button>
            <button 
                onClick={handleExportPDF}
                disabled={filteredReports.length === 0}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground px-4 py-3 rounded-xl transition-colors font-medium shadow-[0_0_15px_rgba(var(--primary),0.3)]"
            >
                <FileDown size={18} /> PDF
            </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Filters */}
        <div className="p-6 border-b border-border flex flex-col xl:flex-row gap-4 justify-between items-center bg-background/50">
            <div className="relative w-full xl:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                    type="text" 
                    placeholder="Search by student name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl py-2 pl-10 pr-4 text-foreground focus:outline-none focus:border-primary transition-colors"
                />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                <select 
                    value={resourceFilter}
                    onChange={(e) => setResourceFilter(e.target.value)}
                    className="bg-card border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:border-primary transition-colors flex-1 md:flex-none"
                >
                    <option value="all">All Resources</option>
                    <option value="washroom">Washrooms</option>
                    <option value="washing_machine">Washing Machines</option>
                </select>

                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-card border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:border-primary transition-colors flex-1 md:flex-none"
                >
                    <option value="all">All Statuses</option>
                    <option value="waiting">Waiting</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>

                <div className="flex items-center gap-2 w-full md:w-auto flex-1 md:flex-none">
                    <Calendar className="text-muted-foreground" size={18} />
                    <select 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:border-primary transition-colors"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                    </select>
                </div>
            </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-background/80 text-muted-foreground text-sm">
                <th className="p-4 font-medium">User Name</th>
                <th className="p-4 font-medium">Resource</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Queue Time</th>
                <th className="p-4 font-medium">Completion Time</th>
                <th className="p-4 font-medium">Duration (m)</th>
              </tr>
            </thead>
            <tbody>
              {currentReports.length === 0 ? (
                 <tr><td colSpan="6" className="text-center text-muted-foreground p-8">No reports found matching your criteria.</td></tr>
              ) : (
                currentReports.map(report => (
                  <tr key={report.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium text-foreground capitalize">{report.user_name}</td>
                    <td className="p-4 text-muted-foreground capitalize">{report.resource_type.replace('_', ' ')}</td>
                    <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            report.status === 'completed' ? 'bg-success/10 text-success' :
                            report.status === 'active' ? 'bg-primary/10 text-primary' :
                            report.status === 'waiting' ? 'bg-warning/10 text-warning' :
                            'bg-destructive/10 text-destructive'
                        }`}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(report.queue_time).toLocaleString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">{report.completion_time ? new Date(report.completion_time).toLocaleString() : '-'}</td>
                    <td className="p-4 text-sm font-medium text-foreground">{report.duration !== null ? report.duration : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between bg-background/30">
                <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredReports.length)} of {filteredReports.length} results
                </p>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-border disabled:opacity-50 hover:bg-muted"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center px-4 text-sm font-medium">
                        Page {currentPage} of {totalPages}
                    </div>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-border disabled:opacity-50 hover:bg-muted"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
