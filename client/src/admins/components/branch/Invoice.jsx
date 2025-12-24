import React from 'react';
import { formatCurrency } from '../../../utils/formatCurrency';

const Invoice = ({ order, branchName, billerName }) => {
  if (!order) return null;

  const subtotal = order.subtotal || 0;
  const cgst = order.cgst || (subtotal * 0.025);
  const sgst = order.sgst || (subtotal * 0.025);
  const discount = order.discount || 0;
  const totalBeforeRound = subtotal + cgst + sgst - discount;
  const totalPayable = order.total || Math.round(totalBeforeRound);
  const roundOff = order.roundOff || (totalPayable - totalBeforeRound);

  const groupedItems = () => {
    const groups = {};
    order.items.forEach(item => {
      const key = item.menuItem?._id ? `${item.menuItem._id}-${item.price}` : `${item.name}-${item.price}`;
      if (!groups[key]) {
        groups[key] = { ...item, quantity: 0 };
      }
      groups[key].quantity += item.quantity;
    });
    return Object.values(groups);
  };

  const items = groupedItems();

  return (
    <div className="bg-white p-6 max-w-[380px] mx-auto font-sans text-sm text-gray-900 border shadow-lg print:shadow-none print:border-none" id="printable-invoice">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-light tracking-[0.2em] mb-2">E-BILL</h1>
        <p className="text-xl font-normal">{branchName || 'The Tea Toast Co.'}</p>
        <p className="text-lg mt-4 font-normal">Biller Name: {billerName || 'Staff'}</p>
        {order.orderNumber && <p className="text-sm mt-1">Order: #{order.orderNumber}</p>}
        {order.table?.tableNumber && <p className="text-sm">Table: {order.table.tableNumber}</p>}
      </div>

      <div className="border-t border-b border-dotted border-gray-400 py-3 mb-4">
        <div className="grid grid-cols-12 gap-2 font-normal text-sm">
          <div className="col-span-5">Name</div>
          <div className="col-span-2 text-center">Qty.</div>
          <div className="col-span-2 text-right">Rate (₹)</div>
          <div className="col-span-3 text-right">Price (₹)</div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 text-sm items-start">
            <div className="col-span-5">
              <p className="font-medium text-base">{item.menuItem?.name || item.name}</p>
              {item.specialInstructions && (
                <p className="text-xs text-gray-600 mt-0.5">{item.specialInstructions}</p>
              )}
            </div>
            <div className="col-span-2 text-center text-base">{item.quantity}</div>
            <div className="col-span-2 text-right text-base">{item.price.toFixed(2)}</div>
            <div className="col-span-3 text-right text-base">{(item.price * item.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-dotted border-gray-400 pt-4 space-y-3">
        <div className="flex justify-between text-base">
          <span>Total Quantity:</span>
          <span className="font-normal">{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
        </div>
        <div className="flex justify-between text-base">
          <span>Sub Total:</span>
          <span className="font-normal">₹{subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-base text-red-600">
            <span>Discount:</span>
            <span className="font-normal">-₹{discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base">
          <div className="flex gap-8">
            <span>CGST</span>
            <span>{order.cgstRate || 2.5}%</span>
          </div>
          <span className="font-normal">₹{cgst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base">
          <div className="flex gap-8">
            <span>SGST</span>
            <span>{order.sgstRate || 2.5}%</span>
          </div>
          <span className="font-normal">₹{sgst.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-gray-900 mt-6 pt-6 space-y-3">
        <div className="flex justify-between text-base">
          <span>Round Off:</span>
          <span className="font-normal">{roundOff >= 0 ? '+' : ''}{roundOff.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xl font-normal">
          <span>Total Payable Amount:</span>
          <span className="font-medium">₹{totalPayable.toFixed(2)}</span>
        </div>
        <div className="mt-6">
          <p className="text-base font-normal">
            Paid via: {
              order.paymentMethod === 'mixed' 
                ? 'Mixed Payment' 
                : (order.paymentMethod === 'upi' ? 'Other [UPI]' : 
                   order.paymentMethod === 'cash' ? 'Cash' : 
                   order.paymentMethod === 'card' ? 'Card' : 'Other')
            }
          </p>
          {order.paymentMethod === 'mixed' && order.splitPayments && (
            <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-100">
              {order.splitPayments.map((p, i) => (
                <p key={i} className="text-sm text-gray-600">
                  {p.method.toUpperCase()}: ₹{p.amount.toFixed(2)}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Invoice;
