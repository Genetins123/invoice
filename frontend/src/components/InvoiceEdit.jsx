// src/components/InvoiceEdit.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const InvoiceEdit = ({ invoiceId, goBack }) => {
  const { token } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const vatRate = 0.13; // same as InvoiceList

  // Editable rows structure:
  // { productID, productName, price, amount, discountPercent, totalLineItem, barcode? }
  const [rows, setRows] = useState([]);
  const [note, setNote] = useState('');

  // Fetch invoice details
  const fetchInvoice = useCallback(async () => {
    if (!token) {
      setError('Authentication required.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(e.message || 'Failed to fetch invoice.');
      }
      const data = await res.json();
      setInvoice(data);
      // Map to rows (support different shapes)
      const mapped = (data.items || data.lineItems || []).map((it) => ({
        productID: it.productID || it.productId || it.product?._id || null,
        productName: it.productName || it.product || (it.product && it.product.name) || '',
        price: Number(it.price ?? it.unitPrice ?? 0),
        amount: Number(it.amount ?? it.quantity ?? 1),
        discountPercent: Number(it.discountPercent ?? it.discount ?? 0),
        totalLineItem: Number(it.totalLineItem ?? it.lineTotal ?? it.total ?? 0),
        barcode: it.barcode || '',
      }));
      setRows(mapped);
      setNote(data.note || data.notes || '');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not load invoice.');
    } finally {
      setLoading(false);
    }
  }, [invoiceId, token]);

  // Fetch products for select picker
  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Failed to load products');
      }
      const data = await res.json();
      // data is expected to be an array like [{ _id, name, price }]
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (err) {
      console.error('Products fetch error', err);
    } finally {
      setLoadingProducts(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
    fetchInvoice();
  }, [fetchProducts, fetchInvoice]);

  // Utilities
  const recalcRowTotal = (r) => {
    const price = Number(r.price || 0);
    const amount = Number(r.amount || 0);
    const disc = Number(r.discountPercent || 0);
    const discountedPrice = price * (1 - disc / 100);
    return parseFloat((discountedPrice * amount).toFixed(2));
  };

  const recalcTotals = (currentRows = rows) => {
    const subtotal = currentRows.reduce((acc, r) => acc + Number(r.totalLineItem || 0), 0);
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;
    return {
      subtotal: Number(subtotal.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  };

  // Handlers
  const handleRowChange = (index, field, value) => {
    setRows((prev) => {
      const copy = [...prev];
      const row = { ...copy[index] };
      if (field === 'productID') {
        // find product by _id -> auto fill price and productName & barcode
        const prod = products.find((p) => p._id === value);
        if (prod) {
          row.productID = prod._id;
          row.productName = prod.name;
          row.price = Number(prod.price || 0);
          row.barcode = prod.barcode || '';
          // discountPercent remains existing (not editable)
        } else {
          row.productID = value;
        }
      } else if (field === 'amount') {
        row.amount = Number(value || 0);
      } else if (field === 'price') {
        row.price = Number(value || 0);
      } else if (field === 'discountPercent') {
        // Not editable by UI per your request, but support programmatically if needed
        row.discountPercent = Number(value || 0);
      }
      // Recalc total
      row.totalLineItem = recalcRowTotal(row);
      copy[index] = row;
      return copy;
    });
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        productID: '',
        productName: '',
        price: 0,
        amount: 1,
        discountPercent: 0,
        totalLineItem: 0,
        barcode: '',
      },
    ]);
  };

  const handleDeleteRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!token) {
      setError('Authentication required.');
      return;
    }
    if (rows.length === 0) {
      setError('Invoice must have at least one line item.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Recompute totals from current rows just in case
      const recomputedRows = rows.map((r) => ({
        productID: r.productID,
        productName: r.productName,
        price: Number(r.price || 0),
        amount: Number(r.amount || 0),
        discountPercent: Number(r.discountPercent || 0),
        totalLineItem: Number(recalcRowTotal(r)),
      }));

      const { subtotal, vatAmount, total } = recalcTotals(
        recomputedRows.map((r) => ({ ...r, totalLineItem: r.totalLineItem }))
      );

      const payload = {
        lineItems: recomputedRows,
        totalWithoutVAT: subtotal.toFixed(2),
        totalVAT: vatAmount.toFixed(2),
        total: total.toFixed(2),
        note: note,
      };

      const res = await fetch(`${API_URL}/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(e.message || 'Failed to save invoice.');
      }

      alert('✅ Invoice updated successfully!');
      goBack(); // return to list/details screen
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  // Derived totals
  const totals = recalcTotals(rows);

  // Loading and error states
  if (loading || loadingProducts) {
    return (
      <div className="p-8 text-center text-indigo-600 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin mb-3" size={32} />
        Loading invoice and products...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-100 border border-red-400 text-red-700 font-semibold rounded-lg flex flex-col items-center">
        <p className="font-bold mb-2">Error:</p>
        {error}
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 flex-1 min-h-screen">
      <div className="flex justify-between items-center mb-6 border-b pb-4 no-print">
        <h2 className="text-3xl font-bold text-gray-900">Edit Invoice #{invoice?.invoiceNumber}</h2>
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 text-sm bg-green-600 text-white hover:bg-green-700 transition-colors p-2 rounded-lg shadow-md"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>

          <button
            onClick={goBack}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors bg-white border border-gray-300 p-2 rounded-lg"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="print-container">
        {/* Header area - keep readonly like details */}
        <div className="bg-white p-8 rounded-xl shadow-lg mb-6">
          <div className="flex justify-between items-start mb-6 border-b border-print pb-4">
            <div>
              <h1 className="text-4xl font-extrabold text-indigo-700 mb-1">IV</h1>
              <p className="text-sm text-gray-500">
                Invoice Status:{' '}
                <span
                  className={`font-semibold ${
                    invoice?.status === 'Paid' ? 'text-green-600' : invoice?.status === 'Due' ? 'text-yellow-600' : 'text-red-600'
                  }`}
                >
                  {invoice?.status}
                </span>
              </p>
            </div>
            <div className="text-right bg-gray-100 p-4 rounded-lg">
              <h3 className="text-xl font-bold text-gray-800">INVOICE</h3>
              <p className="text-sm font-semibold">Invoice Number: #{invoice?.invoiceNumber}</p>
              <p className="text-sm">Date: {invoice ? new Date(invoice.date).toLocaleDateString() : ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="p-4 border-r border-gray-200 border-print">
              <h4 className="text-lg font-bold text-gray-700 mb-2">ABC Company</h4>
              <p>Phone: 410-987-89-60</p>
              <p>Address: 412 Example South Street</p>
              <p>Email: support@ultimatekode.com</p>
              <p>Business Number: 0000</p>
            </div>

            <div className="p-4">
              <h4 className="text-lg font-bold text-gray-700 mb-2">{invoice?.client?.name || 'N/A'}</h4>
              <p>Phone: {invoice?.client?.phone || 'N/A'}</p>
              <p>Email: {invoice?.client?.email || 'N/A'} | Address: {invoice?.client?.address || 'N/A'}</p>
              <p>Business Number: {invoice?.client?.businessNumber || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Editable Line Items Table */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6 overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Line Items</h3>
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center space-x-2 text-sm bg-indigo-600 text-white p-2 rounded-lg shadow"
            >
              <Plus size={14} />
              <span>Add product</span>
            </button>
          </div>

          <table className="min-w-full">
            <thead className="bg-indigo-50 border-b border-indigo-200">
              <tr>
                {['Product', 'Amount', 'Price', 'Discount (%)', 'Total (€)', 'Actions'].map((h) => (
                  <th key={h} className="p-3 text-left text-sm font-semibold text-indigo-700 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <select
                      value={row.productID || ''}
                      onChange={(e) => handleRowChange(idx, 'productID', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2"
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {/* product name display when productID empty */}
                    {!row.productID && (
                      <input
                        type="text"
                        value={row.productName}
                        onChange={(e) => handleRowChange(idx, 'productName', e.target.value)}
                        className="mt-2 w-full border border-gray-300 rounded-lg p-2"
                        placeholder="Product name"
                      />
                    )}
                  </td>

                  <td className="p-3 w-28">
                    <input
                      type="number"
                      min="1"
                      value={row.amount}
                      onChange={(e) => handleRowChange(idx, 'amount', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-right"
                    />
                  </td>

                  <td className="p-3 w-36">
                    <input
                      type="number"
                      value={row.price}
                      onChange={(e) => handleRowChange(idx, 'price', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-right"
                    />
                  </td>

                  <td className="p-3 w-32">
                    {/* discount is read-only in UI */}
                    <input
                      type="number"
                      value={row.discountPercent}
                      readOnly
                      className="w-full border border-gray-200 bg-gray-100 rounded-lg p-2 text-center"
                    />
                  </td>

                  <td className="p-3 text-right w-36 font-semibold">
                    {Number(row.totalLineItem || 0).toFixed(2)} €
                  </td>

                  <td className="p-3 text-right w-28">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(idx)}
                      className="text-red-600 hover:text-red-900 p-2"
                      title="Delete line"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500">
                    No line items. Click "Add product" to add.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals & Note */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/2 bg-white p-6 rounded-xl shadow-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5"
              placeholder="Add any notes..."
            />
          </div>

          <div className="w-full lg:w-96 bg-gray-100 p-6 rounded-xl shadow-inner">
            <div className="flex justify-between text-base text-gray-700 pt-2">
              <span>Total Without VAT</span>
              <span className="font-medium">{totals.subtotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-base text-gray-700">
              <span>Total VAT ({(vatRate * 100).toFixed(0)}%)</span>
              <span className="font-medium">{totals.vatAmount.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-2xl pt-2 border-t border-gray-300 mt-2">
              <span>Grand Total</span>
              <span className="text-green-600">{totals.total.toFixed(2)} €</span>
            </div>

            {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceEdit;
