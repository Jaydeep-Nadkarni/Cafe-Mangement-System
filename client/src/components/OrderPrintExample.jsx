import React, { useState } from 'react';
import { Printer, X } from 'lucide-react';
import ThermalBill, { printBill } from '../ThermalBill';

/**
 * Example: How to integrate thermal bill printing in your Orders component
 * 
 * This shows how to add a print button and preview modal
 */
export default function OrderPrintExample({ order, branch }) {
    const [showPreview, setShowPreview] = useState(false);

    const cafeInfo = {
        name: branch?.name || 'Smart Cafe',
        address: branch?.location || 'Address not set',
        phone: branch?.contact || 'Phone not set',
        gst: branch?.gstNumber || '',
        website: branch?.website || ''
    };

    const handlePrint = () => {
        printBill(order, cafeInfo, '80mm');
        setShowPreview(false);
    };

    return (
        <div>
            {/* Print Button */}
            <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
                <Printer size={18} />
                Print Bill
            </button>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold">Bill Preview</h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Bill Preview */}
                        <div className="p-6">
                            <div className="thermal-bill-preview size-80mm">
                                <ThermalBill order={order} cafe={cafeInfo} size="80mm" />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                                <Printer size={18} />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Usage in your Orders component:
 * 
 * import OrderPrintExample from './OrderPrintExample';
 * 
 * <OrderPrintExample order={selectedOrder} branch={branchData} />
 */
