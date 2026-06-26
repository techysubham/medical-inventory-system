import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Plus, X, Eye, Trash2, Download, FileText } from 'lucide-react';
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
  const [shouldDownloadPDF, setShouldDownloadPDF] = useState(false);
  const invoiceContentRef = useRef<HTMLDivElement>(null);
  const [storeInfo, setStoreInfo] = useState({
    name: 'Siddhivinayak Medicine Store',
    gst: '',
    fssai: '',
  });

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    totalAmount: 0,
    paymentStatus: 'unpaid' as const,
    paymentMethod: 'Cash' as const,
  });

  const [inventory, setInventory] = useState<any[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Print functionality removed per request: printInvoice is disabled.

  useEffect(() => {
    if (token) fetchInvoices();
    if (token) fetchInventory();
  }, [token]);

  useEffect(() => {
    if (shouldDownloadPDF && showPrintModal && invoiceContentRef.current) {
      downloadInvoicePDF(selectedInvoice);
      setShouldDownloadPDF(false);
    }
  }, [shouldDownloadPDF, showPrintModal, invoiceContentRef]);

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

    // calculate totals using effective price based on unit type with per-item discounts
    const subtotal = invoiceItems.reduce((s, it) => {
      const qty = it.qty || it.quantityStrips || 1;
      const price = getEffectivePrice(it);
      const itemDiscount = (it.discountPercentage || 0) / 100;
      return s + (qty * price * (1 - itemDiscount));
    }, 0);
    const gstTotal = invoiceItems.reduce((s, it) => {
      const qty = it.qty || it.quantityStrips || 1;
      const price = getEffectivePrice(it);
      const itemDiscount = (it.discountPercentage || 0) / 100;
      const discountedPrice = price * (1 - itemDiscount);
      return s + (qty * discountedPrice * ((it.gstPercent ?? it.gst ?? 0) / 100));
    }, 0);
    const rawTotal = subtotal - (discount || 0) + gstTotal;
    const roundOff = Math.round(rawTotal) - rawTotal;
    const grandTotal = parseFloat((rawTotal + roundOff).toFixed(2));

    const payload = {
      ...formData,
      items: invoiceItems.map((it) => {
        const qty = it.qty || it.quantityStrips || 1;
        const effectivePrice = getEffectivePrice(it);
        const discPerc = it.discountPercentage || 0;
        const discountedPrice = effectivePrice * (1 - discPerc / 100);
        const gstPerc = it.gstPercent ?? it.gst ?? 0;
        const gstAmount = qty * discountedPrice * (gstPerc / 100);
        const lineTotal = (qty * discountedPrice) + gstAmount;
        return {
          itemId: it.itemId || it._id || null,
          name: it.name || it.title || (it.itemId && it.itemId.name),
          manufacturer: it.manufacturer || it.mfg || (it.itemId && it.itemId.manufacturer),
          quantity: qty,
          unitType: it.unitType || 'strip',
          quantityStrips: qty,
          unitPrice: discountedPrice,
          stripPrice: it.unitPrice,
          tabletsPerStrip: it.tabletsPerStrip || 1,
          stripsPerBox: it.stripsPerBox || 1,
          discountPercentage: discPerc,
          gstPercent: gstPerc,
          gstAmount,
          lineTotal,
          pack: it.pack || (it.itemId && it.itemId.pack),
          hsn: it.hsn || (it.itemId && it.itemId.hsn),
          batch: it.batch,
          expiry: it.expiry || it.exp,
        };
      }),
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
      setFormData({ customerName: '', customerEmail: '', customerPhone: '', totalAmount: 0, paymentStatus: 'unpaid', paymentMethod: 'Cash' });
      setInvoiceItems([]);
      setDiscount(0);
      fetchInvoices();
      alert('Invoice created successfully');
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    }
  };

  const addSelectedItem = async () => {
    if (!selectedItemId) return;
    const it = inventory.find((i) => i._id === selectedItemId) || inventory.find((i) => i.id === selectedItemId);
    if (!it) return;

    try {
      // Fetch available batches for FIFO selection
      const res = await fetch(`${API_URL}/stock-batches/available/${selectedItemId}`, { headers });
      let batch = null;
      let expiry = null;

      if (res.ok) {
        const batches = await res.json();
        if (batches.length > 0) {
          // Get the first batch (oldest/expiring soonest - FIFO)
          batch = batches[0];
          expiry = batch.expiryDate ? batch.expiryDate.split('T')[0] : '';
          const daysLeft = batch.daysUntilExpiry;
          
          // Show alert if batch is expiring soon
          if (daysLeft < 30) {
            console.warn(`⚠️ Batch ${batch.batchNumber} expires in ${daysLeft} days - prioritizing for sale`);
          }
        }
      }

      // default qty 1, unitPrice from item.price or item.mrp
      const newItem = {
        itemId: it._id || it.id,
        name: it.name || it.title,
        manufacturer: it.brand || it.manufacturer || it.manufacturerShort || '',
        qty: 1,
        unitType: 'strip', // Default unit type: tablets, strips, or boxes
        unitPrice: it.sellingPrice ?? it.price ?? it.mrp ?? 0,
        gstPercent: it.gst ?? 5,
        pack: it.pack,
        hsn: it.hsn,
        batch: batch?.batchNumber || it.batchNumber || it.batch || it.defaultBatch || '',
        expiry: expiry || (it.expirationDate ? (it.expirationDate.split ? it.expirationDate.split('T')[0] : it.expirationDate) : (it.defaultExpiry || '')),
        batchId: batch?._id || null,
        tabletsPerStrip: it.tabletsPerStrip || 1,
        stripsPerBox: it.stripsPerBox || 1,
      };
      setInvoiceItems((s) => [...s, newItem]);
    } catch (error) {
      console.error('Error fetching batches:', error);
      // Fallback to old method if batch fetch fails
      const it = inventory.find((i) => i._id === selectedItemId) || inventory.find((i) => i.id === selectedItemId);
      if (it) {
        const newItem = {
          itemId: it._id || it.id,
          name: it.name || it.title,
          manufacturer: it.brand || it.manufacturer || it.manufacturerShort || '',
          qty: 1,
          unitType: 'strip',
          unitPrice: it.sellingPrice ?? it.price ?? it.mrp ?? 0,
          gstPercent: it.gst ?? 5,
          pack: it.pack,
          hsn: it.hsn,
          batch: it.batchNumber || it.batch || it.defaultBatch || '',
          expiry: it.expirationDate ? (it.expirationDate.split ? it.expirationDate.split('T')[0] : it.expirationDate) : (it.defaultExpiry || ''),
          tabletsPerStrip: it.tabletsPerStrip || 1,
          stripsPerBox: it.stripsPerBox || 1,
        };
        setInvoiceItems((s) => [...s, newItem]);
      }
    }
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

  // Calculate price per unit based on unit type
  // For form items: unitPrice is strip price, calculate based on unitType
  // For saved items: unitPrice is already calculated, stripPrice has original strip price
  const getEffectivePrice = (item: any) => {
    // If this is a saved invoice item, stripPrice has the original strip price
    const basePrice = item.stripPrice || item.unitPrice || 0;
    const tabletsPerStrip = item.tabletsPerStrip || 1;
    const stripsPerBox = item.stripsPerBox || 1;

    if (item.unitType === 'tablet') {
      return basePrice / tabletsPerStrip;
    } else if (item.unitType === 'box') {
      return basePrice * stripsPerBox;
    }
    // Default to strip
    return basePrice;
  };

  // Calculate subtotal with per-item discounts applied
  const subtotalCalc = invoiceItems.reduce((s, it) => {
    const qty = it.qty || it.quantityStrips || 0;
    const price = getEffectivePrice(it);
    const itemDiscount = (it.discountPercentage || 0) / 100;
    const subtotal = qty * price * (1 - itemDiscount);
    return s + subtotal;
  }, 0);
  
  // Calculate GST on discounted price
  const gstCalc = invoiceItems.reduce((s, it) => {
    const qty = it.qty || it.quantityStrips || 0;
    const price = getEffectivePrice(it);
    const itemDiscount = (it.discountPercentage || 0) / 100;
    const discountedPrice = price * (1 - itemDiscount);
    const gst = qty * discountedPrice * ((it.gstPercent ?? it.gst ?? 0) / 100);
    return s + gst;
  }, 0);
  
  // Calculate total line item discounts
  const totalItemDiscounts = invoiceItems.reduce((s, it) => {
    const qty = it.qty || it.quantityStrips || 0;
    const price = getEffectivePrice(it);
    const itemDiscount = (it.discountPercentage || 0) / 100;
    return s + (qty * price * itemDiscount);
  }, 0);
  
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
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <FileText size={36} className="text-blue-600" />
            <span className="text-gradient bg-gradient-to-r from-blue-600 to-teal-600">Invoice Management</span>
          </h1>
          <p className="text-gray-600">Create and manage customer invoices</p>
        </div>
        {hasPermission('manage_invoices') && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-glossy flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 shadow-glossy-lg"
          >
            <Plus size={20} />
            <span className="font-bold">Create Invoice</span>
          </button>
        )}
      </div>

      <div className="glass-card shadow-glossy-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200/50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Invoice #</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Customer</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Amount</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Date</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50">
            {invoices.map((invoice) => (
              <tr key={invoice._id} className="hover:bg-blue-50/50 transition-all duration-300 group">
                <td className="px-6 py-4 text-sm font-bold text-gray-900 group-hover:text-blue-600">{invoice.invoiceNumber}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{invoice.customerName}</td>
                <td className="px-6 py-4 text-sm font-semibold text-green-600">{currencySymbol}{invoice.totalAmount.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{invoice.createdAt?.split('T')[0]}</td>
                <td className="px-6 py-4 text-sm flex gap-3">
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
                      className="p-2.5 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all duration-300 hover:scale-110 shadow-glossy-sm"
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
                          setShowPrintModal(true);
                          setShouldDownloadPDF(true);
                        } catch (err) {
                          console.error(err);
                          alert('Error downloading invoice');
                        }
                      }}
                      className="p-2.5 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-lg transition-all duration-300 hover:scale-110 shadow-glossy-sm"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    {hasPermission('manage_invoices') && (
                      <button
                        onClick={() => deleteInvoice(invoice._id)}
                        className="p-2.5 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all duration-300 hover:scale-110 shadow-glossy-sm"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-glossy-lg border border-white/20">
            <div className="border-b border-white/20 px-8 py-6 flex justify-between items-center sticky top-0 bg-gradient-to-r from-blue-50/90 to-cyan-50/90 backdrop-blur">
              <h2 className="text-2xl font-bold text-gradient bg-gradient-to-r from-blue-600 to-teal-600">📄 Create Invoice</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-lg transition-all duration-300">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <input type="text" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} placeholder="Customer Name *" className="input-modern" required />
                <div className="flex gap-3">
                  <input type="email" value={formData.customerEmail} onChange={(e) => setFormData({...formData, customerEmail: e.target.value})} placeholder="Email" className="flex-1 input-modern" />
                  <input type="tel" value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} placeholder="Phone" className="w-48 input-modern" />
                </div>

                <div className="flex items-center gap-3">
                  <select value={selectedItemId} onChange={(e)=>setSelectedItemId(e.target.value)} className="flex-1 input-modern">
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
                    <tr className="text-left text-xs">
                      <th className="px-1 py-1">#</th>
                      <th className="px-1 py-1">Name</th>
                      <th className="px-1 py-1">Unit</th>
                      <th className="px-1 py-1">QTY</th>
                      <th className="px-1 py-1">MRP</th>
                      <th className="px-1 py-1">Disc%</th>
                      <th className="px-1 py-1">GST%</th>
                      <th className="px-1 py-1">Amount</th>
                      <th className="px-1 py-1"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((it, idx) => {
                      const qty = it.qty || it.quantityStrips || 0;
                      const effectivePrice = getEffectivePrice(it);
                      const discPerc = it.discountPercentage || 0;
                      const discountedPrice = effectivePrice * (1 - discPerc / 100);
                      const gstPerc = it.gstPercent ?? it.gst ?? 0;
                      const gstAmt = (qty * discountedPrice * (gstPerc/100));
                      const lineAmount = (qty * discountedPrice) + gstAmt;
                      return (
                          <tr key={idx} className="border-t text-xs">
                          <td className="px-1 py-1">{idx+1}</td>
                            <td className="px-1 py-1 text-left">{it.name}</td>
                            <td className="px-1 py-1">
                              <select value={it.unitType || 'strip'} onChange={(e)=>updateItem(idx,{unitType: e.target.value})} className="w-16 px-1 py-0 border rounded text-xs">
                                <option value="tablet">Tab</option>
                                <option value="strip">Strip</option>
                                <option value="box">Box</option>
                              </select>
                            </td>
                          <td className="px-1 py-1"><input type="number" min={1} value={qty} onChange={(e)=>updateItem(idx,{qty: parseInt(e.target.value||'0',10)})} className="w-12 px-1 border text-right text-xs" /></td>
                          <td className="px-1 py-1 text-right">{effectivePrice.toFixed(2)}</td>
                          <td className="px-1 py-1"><input type="number" step="0.1" min="0" max="100" value={discPerc} onChange={(e)=>updateItem(idx,{discountPercentage: parseFloat(e.target.value||'0')})} className="w-12 px-1 border text-right text-xs" /></td>
                          <td className="px-1 py-1"><input type="number" step="0.01" value={gstPerc} onChange={(e)=>updateItem(idx,{gstPercent: parseFloat(e.target.value||'0')})} className="w-12 px-1 border text-right text-xs" /></td>
                          <td className="px-1 py-1 text-right">{lineAmount.toFixed(2)}</td>
                          <td className="px-1 py-1"><button type="button" onClick={()=>removeItem(idx)} className="text-red-600 text-xs">×</button></td>
                        </tr>
                      )
                    })}
                    {invoiceItems.length===0 && (
                      <tr><td colSpan={12} className="p-4 text-center text-gray-500">No items added</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 border-t border-white/20 pt-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-sm font-medium">Discount:</label>
                    <input type="number" step="0.01" value={discount} onChange={(e)=>setDiscount(parseFloat(e.target.value||'0'))} className="w-32 px-2 py-1 border rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Payment Method:</label>
                    <select value={formData.paymentMethod || 'Cash'} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})} className="px-2 py-1 border rounded bg-white">
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                </div>
                <div style={{width:'100%', marginTop: '8px'}}>
                  <div className="flex justify-between text-sm"><div>Sub Total</div><div>{currencySymbol}{subtotalCalc.toFixed(2)}</div></div>
                  <div className="flex justify-between text-sm"><div>Line Item Discounts</div><div className="text-green-600">-{currencySymbol}{totalItemDiscounts.toFixed(2)}</div></div>
                  <div className="flex justify-between text-sm"><div>Promo Discount</div><div className="text-green-600">-{currencySymbol}{(discount || 0).toFixed(2)}</div></div>
                  <div className="flex justify-between text-sm"><div>GST</div><div>{currencySymbol}{gstCalc.toFixed(2)}</div></div>
                  <div className="flex justify-between text-sm"><div>Round Off</div><div>{currencySymbol}{roundOffCalc.toFixed(2)}</div></div>
                  <div className="flex justify-between font-bold text-lg mt-2"><div>Grand Total</div><div>{currencySymbol}{grandTotalCalc.toFixed(2)}</div></div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-white/20">
                <button type="button" onClick={() => setShowModal(false)} className="btn-modern px-6 py-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="btn-glossy px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-glossy-lg">Create Invoice</button>
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
                {/* Print disabled - keep Download and Close options only */}
                <button onClick={() => setShowPrintModal(false)} className="px-3 py-1 border rounded">Close</button>
              </div>
            </div>

            <div className="p-6 printable-area" ref={invoiceContentRef} style={{background: 'white'}}>
              <style>{`
                @page { size: A4 landscape; margin: 8mm; }
                @media print {
                  /* Hide everything except printable area */
                  body * { visibility: hidden !important; }
                  .printable-area, .printable-area * { visibility: visible !important; }
                  .printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }

                  /* Prevent table rows splitting across pages */
                  table { page-break-inside: auto !important; width: 100% !important; }
                  tr    { page-break-inside: avoid !important; page-break-after: auto !important; }
                  thead { display: table-header-group !important; }
                  tfoot { display: table-footer-group !important; }

                  /* Compact print styles */
                  .printable-area { font-size: 10px; padding: 4mm !important; }
                  .invoice-table { font-size: 9px; }
                  .invoice-table th, .invoice-table td { padding: 2px 3px !important; border: 0.5px solid #999; }
                  .invoice-table th { background: #f0f0f0; }
                  .header-section { margin-bottom: 6px !important; }
                }
                /* default on-screen styles */
                .invoice-table th, .invoice-table td { padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; }
                .invoice-table { width: 100%; font-size: 11px; }
              `}</style>

              <div className="flex items-start justify-between header-section" style={{fontSize: '11px'}}>
                <div style={{flex: 1, minWidth: 0}}>
                  <textarea
                    value={storeInfo.name}
                    onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                    rows={2}
                    className="text-lg font-bold border-b mb-1 w-full resize-none"
                    style={{fontSize: '14px', lineHeight: 1.05, background: 'transparent', outline: 'none'}}
                  />
                  <div className="text-xs text-gray-700">GST: <input value={storeInfo.gst} onChange={(e)=>setStoreInfo({...storeInfo, gst: e.target.value})} className="border-b text-xs" style={{maxWidth: '100px'}} /></div>
                  <div className="text-xs text-gray-700">FSSAI: <input value={storeInfo.fssai} onChange={(e)=>setStoreInfo({...storeInfo, fssai: e.target.value})} className="border-b text-xs" style={{maxWidth: '100px'}} /></div>
                </div>
                <div style={{flex:1,textAlign:'center'}}>
                  <div className="font-bold" style={{fontSize: '12px'}}>Cash Memo</div>
                </div>
                <div style={{flex:1,textAlign:'right', fontSize: '10px'}}>
                  <div><strong>Invoice:</strong> {selectedInvoice.invoiceNumber || '-'}</div>
                  <div><strong>Patient:</strong> {selectedInvoice.customerName || '-'}</div>
                  <div><strong>Date:</strong> {new Date(selectedInvoice.invoiceDate || selectedInvoice.createdAt || Date.now()).toLocaleDateString()}</div>
                  <div><strong>Time:</strong> {new Date(selectedInvoice.invoiceDate || selectedInvoice.createdAt || Date.now()).toLocaleTimeString()}</div>
                </div>
              </div>

              <div className="mt-2">
                <table className="w-full invoice-table border-collapse" style={{borderCollapse:'collapse', fontSize: '10px'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f0f0f0'}}>
                      <th style={{width:'30px', padding: '3px'}}>S.N.</th>
                      <th style={{width:'80px', padding: '3px'}}>Medicine</th>
                      <th style={{width:'50px', padding: '3px'}}>Pack</th>
                      <th style={{width:'40px', padding: '3px'}}>HSN</th>
                      <th style={{width:'70px', padding: '3px'}}>Batch</th>
                      <th style={{width:'60px', padding: '3px'}}>EXP</th>
                      <th style={{width:'30px', padding: '3px'}}>QTY</th>
                      <th style={{width:'50px', padding: '3px', textAlign: 'right'}}>MRP</th>
                      <th style={{width:'40px', padding: '3px', textAlign: 'right'}}>GST%</th>
                      <th style={{width:'50px', padding: '3px', textAlign: 'right'}}>GST Amt</th>
                      <th style={{width:'60px', padding: '3px', textAlign: 'right'}}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(selectedInvoice.items) && selectedInvoice.items.length ? selectedInvoice.items.map((it:any, idx:number) => (
                      <tr key={idx} style={{borderBottom: '0.5px solid #ddd'}}>
                        <td style={{textAlign:'right', padding: '3px'}}>{idx+1}</td>
                        <td style={{padding: '3px'}}>{it.name || (it.itemId && it.itemId.name) || '-'}</td>
                        <td style={{padding: '3px'}}>{it.pack || (it.itemId && it.itemId.pack) || '-'}</td>
                        <td style={{padding: '3px', textAlign: 'center'}}>{it.hsn || '-'}</td>
                        <td style={{padding: '3px', fontSize: '9px'}}>{it.batch || '-'}</td>
                        <td style={{padding: '3px'}}>{it.expiry ? new Date(it.expiry).toLocaleDateString() : (it.exp || '-')}</td>
                        <td style={{textAlign:'right', padding: '3px'}}>{it.quantityStrips || it.qty || it.quantity || 1}</td>
                        <td style={{textAlign:'right', padding: '3px'}}>{currencySymbol}{(it.unitPrice || it.mrp || 0).toFixed(2)}</td>
                        <td style={{textAlign:'right', padding: '3px'}}>{(it.gstPercent ?? it.gst ?? 0)}%</td>
                        <td style={{textAlign:'right', padding: '3px'}}>{currencySymbol}{((it.gstAmount ?? 0)).toFixed(2)}</td>
                        <td style={{textAlign:'right', padding: '3px', fontWeight: 'bold'}}>{currencySymbol}{(it.lineTotal || it.amount || ((it.unitPrice || 0)*(it.quantityStrips||it.qty||it.quantity||1))).toFixed(2)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={11} style={{textAlign:'center', padding:'8px'}}>No items</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex justify-end" style={{fontSize: '11px'}}>
                <div style={{width: '280px', paddingLeft: '10px'}}>
                  <div className="flex justify-between" style={{padding: '2px 0'}}><div><strong>Sub Total</strong></div><div>{currencySymbol}{selectedSubtotal.toFixed(2)}</div></div>
                  <div className="flex justify-between" style={{padding: '2px 0'}}><div><strong>GST</strong></div><div>{currencySymbol}{selectedTax.toFixed(2)}</div></div>
                  {selectedDiscount > 0 && <div className="flex justify-between" style={{padding: '2px 0'}}><div><strong>Discount</strong></div><div>-{currencySymbol}{selectedDiscount.toFixed(2)}</div></div>}
                  <div className="flex justify-between" style={{padding: '2px 0'}}><div><strong>Round Off</strong></div><div>{currencySymbol}{selectedRoundOff.toFixed(2)}</div></div>
                  <div className="flex justify-between font-bold" style={{padding: '4px 0', borderTop: '1px solid #000', marginTop: '4px', fontSize: '12px'}}><div>GRAND TOTAL</div><div>{currencySymbol}{selectedGrandTotal.toFixed(2)}</div></div>
                  <div style={{marginTop: '8px', paddingTop: '8px', borderTop: '0.5px solid #999', fontSize: '10px'}}>
                    <div className="flex justify-between"><div><strong>Payment Mode:</strong></div><div>{selectedInvoice.paymentMethod || 'Cash'}</div></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
