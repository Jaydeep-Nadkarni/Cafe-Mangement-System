import React from 'react';
import QRCode from 'qrcode.react';

/**
 * Thermal Bill Component
 * Optimized for 58mm and 80mm thermal printers
 * 
 * Usage:
 * <ThermalBill order={orderData} size="80mm" />
 * window.print();
 */
export default function ThermalBill({ order, cafe, size = '80mm' }) {
    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount || 0).toFixed(2)}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className={`thermal-bill size-${size}`}>
            {/* Header */}
            <div className="bill-header">
                <div className="cafe-name">{cafe?.name || 'SMART CAFE'}</div>
                <div className="cafe-info">
                    {cafe?.address || 'Address Line 1'}<br />
                    {cafe?.phone || 'Phone: +91 XXXXXXXXXX'}<br />
                    {cafe?.gst && `GSTIN: ${cafe.gst}`}
                </div>
            </div>

            {/* Bill Details */}
            <div className="bill-details">
                <div className="row">
                    <span>Bill No:</span>
                    <span><strong>{order.billNumber || order._id?.slice(-8)}</strong></span>
                </div>
                <div className="row">
                    <span>Date:</span>
                    <span>{formatDate(order.createdAt || new Date())}</span>
                </div>
                <div className="row">
                    <span>Table:</span>
                    <span>{order.tableNumber || order.table?.tableNumber || 'N/A'}</span>
                </div>
                {order.customerName && (
                    <div className="row">
                        <span>Customer:</span>
                        <span>{order.customerName}</span>
                    </div>
                )}
                {order.customerPhone && (
                    <div className="row">
                        <span>Phone:</span>
                        <span>{order.customerPhone}</span>
                    </div>
                )}
            </div>

            {/* Items */}
            <div className="bill-items">
                <div className="item" style={{ fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '2mm', marginBottom: '2mm' }}>
                    <div className="item-name">ITEM</div>
                    <div className="item-qty">QTY</div>
                    <div className="item-price">PRICE</div>
                </div>
                {order.items?.map((item, index) => (
                    <div key={index} className="item">
                        <div className="item-name">
                            {item.name || item.menuItem?.name}
                            {item.customizations && item.customizations.length > 0 && (
                                <div style={{ fontSize: '9px', color: '#666', marginTop: '1mm' }}>
                                    {item.customizations.map(c => c.name).join(', ')}
                                </div>
                            )}
                        </div>
                        <div className="item-qty">{item.quantity}x</div>
                        <div className="item-price">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                ))}
            </div>

            {/* Totals */}
            <div className="bill-totals">
                <div className="total-row">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.subtotal || order.totalAmount)}</span>
                </div>

                {order.discount > 0 && (
                    <div className="total-row">
                        <span>Discount:</span>
                        <span>- {formatCurrency(order.discount)}</span>
                    </div>
                )}

                {order.taxes && order.taxes.length > 0 && order.taxes.map((tax, index) => (
                    <div key={index} className="total-row">
                        <span>{tax.name} ({tax.rate}%):</span>
                        <span>{formatCurrency(tax.amount)}</span>
                    </div>
                ))}

                {order.cgst > 0 && (
                    <div className="total-row">
                        <span>CGST:</span>
                        <span>{formatCurrency(order.cgst)}</span>
                    </div>
                )}

                {order.sgst > 0 && (
                    <div className="total-row">
                        <span>SGST:</span>
                        <span>{formatCurrency(order.sgst)}</span>
                    </div>
                )}

                <div className="total-row grand-total">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                </div>

                <div className="total-row">
                    <span>Payment:</span>
                    <span>{order.paymentMethod || 'Cash'}</span>
                </div>

                {order.paymentStatus && (
                    <div className="total-row">
                        <span>Status:</span>
                        <span style={{ textTransform: 'uppercase' }}>{order.paymentStatus}</span>
                    </div>
                )}
            </div>

            {/* QR Code for digital receipt */}
            {order._id && (
                <div className="bill-qr">
                    <QRCode
                        value={`${window.location.origin}/receipt/${order._id}`}
                        size={80}
                        level="M"
                    />
                    <div style={{ fontSize: '9px', marginTop: '2mm' }}>
                        Scan for digital receipt
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="bill-footer">
                <div className="thank-you">THANK YOU!</div>
                <div>Visit Again</div>
                {cafe?.website && <div>{cafe.website}</div>}
                <div style={{ marginTop: '3mm', fontSize: '9px' }}>
                    Powered by Smart Cafe POS
                </div>
            </div>
        </div>
    );
}

/**
 * Print Helper Function
 * Usage: printBill(orderData, cafeData, '80mm')
 */
export function printBill(order, cafe, size = '80mm') {
    // Create a temporary container
    const printContainer = document.createElement('div');
    printContainer.style.display = 'none';
    document.body.appendChild(printContainer);

    // Render the bill
    const root = ReactDOM.createRoot(printContainer);
    root.render(<ThermalBill order={order} cafe={cafe} size={size} />);

    // Wait for render, then print
    setTimeout(() => {
        window.print();

        // Cleanup after print
        setTimeout(() => {
            root.unmount();
            document.body.removeChild(printContainer);
        }, 100);
    }, 100);
}
