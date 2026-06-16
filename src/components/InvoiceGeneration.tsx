import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Plus, X, Eye, Trash2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedBase = rawApi.replace(/\/+$/g, '');
const API_URL = normalizedBase.endsWith('/api') ? normalizedBase : normalizedBase + '/api';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  createdAt?: string;
}

export function InvoiceGeneration() {
  const { token, hasPermission } = useAuth();
  const { currencySymbol } = useSettings();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const invoiceContentRef = useRef<HTMLDivElement>(null);
  const [storeInfo, setStoreInfo] = useState({
    name: 'Your Medicine Store',
    gst: '',
    fssai: '',
  });

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    totalAmount: 0,
    paymentStatus: 'unpaid' as const,
  });

  const [inventory, setInventory] = useState<any[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    if (token) fetchInvoices();
    if (token) fetchInventory();
  }, [token]);

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_URL}/inventory`, { headers });
      if (!res.ok) throw new Error('Failed to fetch inventory');
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${API_URL}/invoices`, { headers });
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const data = await response.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName) {
      alert('Customer name is required');
      return;
    }

    if (invoiceItems.length === 0) {
      alert('Add at least one item to the invoice');
      return;
    }

    // calculate totals
    const subtotal = invoiceItems.reduce((s, it) => s + ((it.unitPrice || 0) * (it.qty || it.quantityStrips || 1)), 0);
    const gstTotal = invoiceItems.reduce((s, it) => s + ((it.qty || it.quantityStrips || 1) * (it.unitPrice || 0) * ((it.gstPercent ?? it.gst ?? 0) / 100)), 0);
    const rawTotal = subtotal - (discount || 0) + gstTotal;
    const roundOff = Math.round(rawTotal) - rawTotal;
    const grandTotal = parseFloat((rawTotal + roundOff).toFixed(2));

    const payload = {
      ...formData,
      items: invoiceItems.map((it) => ({
        itemId: it.itemId || it._id || null,
        name: it.name || it.title || (it.itemId && it.itemId.name),
        manufacturer: it.manufacturer || it.mfg || (it.itemId && it.itemId.manufacturer),
        quantityStrips: it.qty || it.quantityStrips || 1,
        unitPrice: it.unitPrice,
        gstPercent: it.gstPercent ?? it.gst ?? 0,
        gstAmount: ((it.qty || it.quantityStrips || 1) * (it.unitPrice || 0) * ((it.gstPercent ?? it.gst ?? 0) / 100)),
        lineTotal: ((it.qty || it.quantityStrips || 1) * (it.unitPrice || 0)) + ((it.qty || it.quantityStrips || 1) * (it.unitPrice || 0) * ((it.gstPercent ?? it.gst ?? 0) / 100)),
        pack: it.pack || (it.itemId && it.itemId.pack),
        hsn: it.hsn || (it.itemId && it.itemId.hsn),
        batch: it.batch,
        expiry: it.expiry || it.exp,
      })),
      subtotal,
      discountAmount: discount || 0,
      taxAmount: gstTotal,
      roundOff,
      totalAmount: grandTotal,
    };

    try {
      const response = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to create invoice');
      setShowModal(false);
      setFormData({ customerName: '', customerEmail: '', customerPhone: '', totalAmount: 0, paymentStatus: 'unpaid' });
      setInvoiceItems([]);
      setDiscount(0);
      fetchInvoices();
      alert('Invoice created successfully');
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    }
  };

  const addSelectedItem = () => {
    if (!selectedItemId) return;
    const it = inventory.find((i) => i._id === selectedItemId) || inventory.find((i) => i.id === selectedItemId);
    if (!it) return;
    // default qty 1, unitPrice from item.price or item.mrp
    const newItem = {
      itemId: it._id || it.id,
      name: it.name || it.title,
      manufacturer: it.brand || it.manufacturer || it.manufacturerShort || '',
      qty: 1,
      unitPrice: it.sellingPrice ?? it.price ?? it.mrp ?? 0,
      gstPercent: it.gst ?? 5,
      pack: it.pack,
      hsn: it.hsn,
      batch: it.batchNumber || it.batch || it.defaultBatch || '',
      expiry: it.expirationDate ? (it.expirationDate.split ? it.expirationDate.split('T')[0] : it.expirationDate) : (it.defaultExpiry || ''),
    };
    setInvoiceItems((s) => [...s, newItem]);
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const res = await fetch(`${API_URL}/invoices/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed to delete invoice');
      fetchInvoices();
      alert('Invoice deleted');
    } catch (err) {
      console.error(err);
      alert('Error deleting invoice');
    }
  };

  const downloadInvoicePDF = async (invoice: any) => {
    try {
      if (!invoiceContentRef.current) {
        alert('Error: Invoice content not available');
        return;
      }

      const canvas = await html2canvas(invoiceContentRef.current, {
        scale: 2,
        allowTaint: true,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 5;

      pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 10;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`invoice-${invoice.invoiceNumber || invoice._id}.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error generating PDF');
    }
  };

  const updateItem = (index: number, partial: any) => {
    setInvoiceItems((s) => s.map((it, i) => i === index ? { ...it, ...partial } : it));
  };

  const removeItem = (index: number) => setInvoiceItems((s) => s.filter((_, i) => i !== index));

  const subtotalCalc = invoiceItems.reduce((s, it) => s + ((it.unitPrice || 0) * (it.qty || it.quantityStrips || 0)), 0);
  const gstCalc = invoiceItems.reduce((s, it) => s + (((it.qty || it.quantityStrips || 0) * (it.unitPrice || 0) * ((it.gstPercent ?? it.gst ?? 0) / 100))), 0);
  const rawTotalCalc = subtotalCalc - (discount || 0) + gstCalc;
  const roundOffCalc = Math.round(rawTotalCalc) - rawTotalCalc;
  const grandTotalCalc = parseFloat((rawTotalCalc + roundOffCalc).toFixed(2));

  if (loading) return <div className="p-8 text-center">Loading invoices...</div>;

  // computed values for selected invoice preview (fallback to items if invoice-level fields missing)
  const selectedSubtotal = selectedInvoice
    ? (selectedInvoice.subtotal ?? (Array.isArray(selectedInvoice.items) ? selectedInvoice.items.reduce((s:any, it:any) => s + ((it.unitPrice || it.mrp || 0) * (it.quantityStrips || it.qty || 1)), 0) : 0))
    : 0;
  const selectedTax = selectedInvoice
    ? (selectedInvoice.taxAmount ?? (Array.isArray(selectedInvoice.items) ? selectedInvoice.items.reduce((s:any, it:any) => s + ((it.gstAmount ?? ((it.quantityStrips || it.qty || 1) * (it.unitPrice || it.mrp || 0) * ((it.gstPercent ?? it.gst ?? 0) / 100))) ), 0) : 0))
    : 0;
  const selectedDiscount = selectedInvoice ? (selectedInvoice.discountAmount ?? 0) : 0;
  const selectedRoundOff = selectedInvoice ? (selectedInvoice.roundOff ?? 0) : 0;
  const selectedGrandTotal = selectedInvoice ? (selectedInvoice.totalAmount ?? 0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
        {hasPermission('manage_invoices') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Create Invoice
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Invoice #</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((invoice) => (
              <tr key={invoice._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{invoice.invoiceNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{invoice.customerName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{currencySymbol}{invoice.totalAmount.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{invoice.createdAt?.split('T')[0]}</td>
                <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`${API_URL}/invoices/${invoice._id}`, { headers });
                          if (!res.ok) throw new Error('Failed to fetch invoice');
                          const data = await res.json();
                          setSelectedInvoice(data);
                          setShowPrintModal(true);
                        } catch (err) {
                          alert('Error loading invoice');
                        }
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="View"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`${API_URL}/invoices/${invoice._id}`, { headers });
                          if (!res.ok) throw new Error('Failed to fetch invoice');
                          const data = await res.json();
                          setSelectedInvoice(data);
                          await downloadInvoicePDF(data);
                        } catch (err) {
                          console.error(err);
                          alert('Error downloading invoice');
                        }
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    {hasPermission('manage_invoices') && (
                      <button
                        onClick={() => deleteInvoice(invoice._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <div className="p-8 text-center text-gray-500">No invoices found</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Create Invoice</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-2">
                <input type="text" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} placeholder="Customer Name *" className="w-full px-4 py-2 border rounded-lg" required />
                <div className="flex gap-2">
                  <input type="email" value={formData.customerEmail} onChange={(e) => setFormData({...formData, customerEmail: e.target.value})} placeholder="Email" className="flex-1 px-4 py-2 border rounded-lg" />
                  <input type="tel" value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} placeholder="Phone" className="w-48 px-4 py-2 border rounded-lg" />
                </div>

                <div className="flex items-center gap-2">
                  <select value={selectedItemId} onChange={(e)=>setSelectedItemId(e.target.value)} className="flex-1 px-3 py-2 border rounded">
                    <option value="">Select medicine to add</option>
                    {inventory.map((it) => (
                      <option key={it._id || it.id} value={it._id || it.id}>{it.name || it.title} {it.pack ? ` - ${it.pack}` : ''}</option>
                    ))}
                  </select>
                  <button type="button" onClick={addSelectedItem} className="px-3 py-2 bg-gray-100 border rounded">Add</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="px-2">#</th>
                      <th className="px-2">Name</th>
                      <th className="px-2">Pack</th>
                      <th className="px-2">HSN</th>
                      <th className="px-2">Batch</th>
                      <th className="px-2">EXP</th>
                      <th className="px-2">QTY</th>
                      <th className="px-2">MRP</th>
                      <th className="px-2">GST%</th>
                      <th className="px-2">GST Amt</th>
                      <th className="px-2">Amount</th>
                      <th className="px-2"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((it, idx) => {
                      const qty = it.qty || it.quantityStrips || 0;
                      const unit = it.unitPrice || 0;
                      const gstPerc = it.gstPercent ?? it.gst ?? 0;
                      const gstAmt = (qty * unit * (gstPerc/100));
                      const lineAmount = (qty * unit) + gstAmt;
                      return (
                          <tr key={idx} className="border-t">
                          <td className="px-2 py-2">{idx+1}</td>
                            <td className="px-2 py-2">{it.name}</td>
                            <td className="px-2 py-2">{it.pack || '-'}</td>
                            <td className="px-2 py-2"><input value={it.hsn||''} onChange={(e)=>updateItem(idx,{hsn:e.target.value})} className="w-24 px-1 border" /></td>
                          <td className="px-2 py-2"><input value={it.batch||''} onChange={(e)=>updateItem(idx,{batch:e.target.value})} className="w-24 px-1 border" /></td>
                          <td className="px-2 py-2"><input value={it.expiry||it.exp||''} onChange={(e)=>updateItem(idx,{expiry:e.target.value})} className="w-24 px-1 border" /></td>
                          <td className="px-2 py-2"><input type="number" min={1} value={qty} onChange={(e)=>updateItem(idx,{qty: parseInt(e.target.value||'0',10)})} className="w-16 px-1 border text-right" /></td>
                          <td className="px-2 py-2"><input type="number" step="0.01" value={unit} onChange={(e)=>updateItem(idx,{unitPrice: parseFloat(e.target.value||'0')})} className="w-20 px-1 border text-right" /></td>
                          <td className="px-2 py-2"><input type="number" step="0.01" value={gstPerc} onChange={(e)=>updateItem(idx,{gstPercent: parseFloat(e.target.value||'0')})} className="w-16 px-1 border text-right" /></td>
                          <td className="px-2 py-2 text-right">{gstAmt.toFixed(2)}</td>
                          <td className="px-2 py-2 text-right">{lineAmount.toFixed(2)}</td>
                          <td className="px-2 py-2"><button type="button" onClick={()=>removeItem(idx)} className="text-red-600">Remove</button></td>
                        </tr>
                      )
                    })}
                    {invoiceItems.length===0 && (
                      <tr><td colSpan={12} className="p-4 text-center text-gray-500">No items added</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm">Discount:</label>
                  <input type="number" step="0.01" value={discount} onChange={(e)=>setDiscount(parseFloat(e.target.value||'0'))} className="w-32 px-2 py-1 border rounded" />
                </div>
                <div style={{width:300}}>
                  <div className="flex justify-between"><div>Sub Total</div><div>{currencySymbol}{subtotalCalc.toFixed(2)}</div></div>
                  <div className="flex justify-between"><div>GST</div><div>{currencySymbol}{gstCalc.toFixed(2)}</div></div>
                  <div className="flex justify-between"><div>Round Off</div><div>{currencySymbol}{roundOffCalc.toFixed(2)}</div></div>
                  <div className="flex justify-between font-semibold text-lg mt-2"><div>Grand Total</div><div>{currencySymbol}{grandTotalCalc.toFixed(2)}</div></div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPrintModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center p-6">
          <div className="bg-white rounded shadow-lg max-w-3xl w-full overflow-auto" style={{maxHeight: '95%'}}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Invoice Preview</h3>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await downloadInvoicePDF(selectedInvoice);
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  title="Download as PDF"
                >
                  <Download size={18} className="inline mr-1" />
                  Download
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Print
                </button>
                <button onClick={() => setShowPrintModal(false)} className="px-3 py-1 border rounded">Close</button>
              </div>
            </div>

            <div className="p-6 printable-area" ref={invoiceContentRef} style={{background: 'white'}}>
              <style>{`
                @page { size: A4 portrait; margin: 10mm; }
                @media print {
                  /* Hide everything except printable area */
                  body * { visibility: hidden !important; }
                  .printable-area, .printable-area * { visibility: visible !important; }
                  .printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }

                  /* Prevent table rows splitting across pages */
                  table { page-break-inside: auto !important; }
                  tr    { page-break-inside: avoid !important; page-break-after: auto !important; }
                  thead { display: table-header-group !important; }
                  tfoot { display: table-footer-group !important; }

                  /* Reduce padding/spacing to help fit on single page when possible */
                  .printable-area { font-size: 12px; }
                  .invoice-table th, .invoice-table td { padding: 4px 6px; border: 1px solid #ddd; }
                }
                /* default on-screen styles */
                .invoice-table th, .invoice-table td { padding: 6px 8px; border: 1px solid #ddd; }
              `}</style>

              <div className="flex items-start justify-between">
                <div style={{flex: 1}}>
                  <input type="text" value={storeInfo.name} onChange={(e)=>setStoreInfo({...storeInfo, name: e.target.value})} className="text-xl font-bold border-b mb-1" />
                  <div className="text-sm text-gray-700">GST: <input value={storeInfo.gst} onChange={(e)=>setStoreInfo({...storeInfo, gst: e.target.value})} className="border-b" /></div>
                  <div className="text-sm text-gray-700">FSSAI: <input value={storeInfo.fssai} onChange={(e)=>setStoreInfo({...storeInfo, fssai: e.target.value})} className="border-b" /></div>
                </div>
                <div style={{flex:1,textAlign:'center'}}>
                  <div className="text-lg font-semibold">GST INVOICE</div>
                </div>
                <div style={{flex:1,textAlign:'right'}}>
                  <div>Invoice No: {selectedInvoice.invoiceNumber || '-'}</div>
                  <div>Patient: {selectedInvoice.customerName || '-'}</div>
                  <div>Date: {new Date(selectedInvoice.invoiceDate || selectedInvoice.createdAt || Date.now()).toLocaleDateString()}</div>
                  <div>Time: {new Date(selectedInvoice.invoiceDate || selectedInvoice.createdAt || Date.now()).toLocaleTimeString()}</div>
                </div>
              </div>

              <div className="mt-4">
                <table className="w-full invoice-table border-collapse" style={{borderCollapse:'collapse'}}>
                  <thead>
                    <tr>
                      <th style={{width:'40px'}}>S.N.</th>
                      <th>MFG</th>
                      <th>Medicine</th>
                      <th>Pack</th>
                      <th>HSN</th>
                      <th>Batch</th>
                      <th>EXP</th>
                      <th>QTY</th>
                      <th>MRP</th>
                      <th>GST% (Incl)</th>
                      <th>GST Amt</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(selectedInvoice.items) && selectedInvoice.items.length ? selectedInvoice.items.map((it:any, idx:number) => (
                      <tr key={idx}>
                        <td style={{textAlign:'right'}}>{idx+1}</td>
                        <td>{it.manufacturer || (it.itemId && it.itemId.manufacturerShort) || (it.mfg) || '-'}</td>
                        <td>{it.name || (it.itemId && it.itemId.name) || '-'}</td>
                        <td>{it.pack || (it.itemId && it.itemId.pack) || '-'}</td>
                        <td>{it.hsn || (it.itemId && it.itemId.hsn) || '-'}</td>
                        <td>{it.batch || '-'}</td>
                        <td>{it.expiry ? new Date(it.expiry).toLocaleDateString() : (it.exp || '-')}</td>
                        <td style={{textAlign:'right'}}>{it.quantityStrips || it.qty || 1}</td>
                        <td style={{textAlign:'right'}}>{currencySymbol}{(it.unitPrice || it.mrp || 0).toFixed(2)}</td>
                        <td style={{textAlign:'right'}}>{(it.gstPercent ?? it.gst ?? 0)}%</td>
                        <td style={{textAlign:'right'}}>{currencySymbol}{((it.gstAmount ?? 0)).toFixed(2)}</td>
                        <td style={{textAlign:'right'}}>{currencySymbol}{(it.lineTotal || it.amount || ((it.unitPrice || 0)*(it.quantityStrips||it.qty||1))).toFixed(2)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={12} style={{textAlign:'center',padding:12}}>No items</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <div style={{width:300}}>
                  <div className="flex justify-between"><div>Sub Total</div><div>{currencySymbol}{selectedSubtotal.toFixed(2)}</div></div>
                  <div className="flex justify-between"><div>GST</div><div>{currencySymbol}{selectedTax.toFixed(2)}</div></div>
                  <div className="flex justify-between"><div>Discount</div><div>{currencySymbol}{selectedDiscount.toFixed(2)}</div></div>
                  <div className="flex justify-between"><div>Round Off</div><div>{currencySymbol}{selectedRoundOff.toFixed(2)}</div></div>
                  <div className="flex justify-between font-semibold text-lg mt-2"><div>Grand Total</div><div>{currencySymbol}{selectedGrandTotal.toFixed(2)}</div></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
