import React from 'react';
import { jsPDF } from 'jspdf';

const Invoice = () => {
  const invoiceData = {
    invoiceNumber: 'INV-12345',
    date: '2025-03-08',
    customerName: 'John Doe',
    items: [
      { description: 'Product A', quantity: 2, unitPrice: 25.00 },
      { description: 'Product B', quantity: 1, unitPrice: 50.00 },
      { description: 'Product C', quantity: 3, unitPrice: 15.00 },
    ],
  };

  // Calculate total
  const calculateTotal = () => {
    return invoiceData.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('Invoice', 105, 20, { align: 'center' });

    // Add invoice details
    doc.setFontSize(12);
    doc.text(`Invoice Number: ${invoiceData.invoiceNumber}`, 10, 30);
    doc.text(`Date: ${invoiceData.date}`, 10, 40);
    doc.text(`Customer: ${invoiceData.customerName}`, 10, 50);

    // Table headers
    doc.text('Description', 10, 60);
    doc.text('Quantity', 90, 60);
    doc.text('Unit Price', 130, 60);
    doc.text('Total', 180, 60);

    // Add items to the table
    let yOffset = 70;
    invoiceData.items.forEach(item => {
      doc.text(item.description, 10, yOffset);
      doc.text(item.quantity.toString(), 90, yOffset);
      doc.text(`$${item.unitPrice.toFixed(2)}`, 130, yOffset);
      doc.text(`$${(item.quantity * item.unitPrice).toFixed(2)}`, 180, yOffset);
      yOffset += 10;
    });

    // Total amount
    doc.text(`Total: $${calculateTotal().toFixed(2)}`, 10, yOffset + 20);

    // Save PDF
    doc.save('invoice.pdf');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', border: '1px solid #ddd' }}>
      <h1 style={{ textAlign: 'center' }}>Invoice</h1>
      <div>
        <strong>Invoice Number:</strong> {invoiceData.invoiceNumber}
      </div>
      <div>
        <strong>Date:</strong> {invoiceData.date}
      </div>
      <div>
        <strong>Customer:</strong> {invoiceData.customerName}
      </div>

      <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Description</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Quantity</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Unit Price</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoiceData.items.map((item, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.description}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.quantity}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>${item.unitPrice.toFixed(2)}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>${(item.quantity * item.unitPrice).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ textAlign: 'right', marginTop: '20px' }}>
        <strong>Total: ${calculateTotal().toFixed(2)}</strong>
      </div>

      <button
        onClick={generatePDF}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Download PDF
      </button>
    </div>
  );
};

export default Invoice;


//  const generateInvoicePDF = (product) => {
//     const doc = new jsPDF();

//     doc.setFontSize(14);
//     doc.setFont('helvetica', 'bold');
//     doc.text('Company Name', 15, 10);
//     doc.setFontSize(10);
//     doc.text('Company Address: 123 Business St, City, Country', 15, 15);
//     doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 150, 10);
//     if (logo) {
//       doc.addImage(logo, 'PNG', 150, 20, 40, 40);
//     }
//     doc.setFontSize(18);
//     doc.setFont('helvetica', 'normal');
//     doc.text('INVOICE', 105, 25, { align: 'center' });

//     const tableColumn = ["Product Name", "Size", "Quantity", "Description", "Price", "Total"];
//     const tableRows = [
//       [
//         product.name,
//         product.size,
//         product.qty,
//         product.description,
//         product.price,
//         `$${(parseFloat(product.price.replace('$', '')) * parseInt(product.qty)).toFixed(2)}`
//       ]
//     ];

//     autoTable(doc, {
//       head: [tableColumn],
//       body: tableRows,
//       startY: 40, 
//       theme: 'grid', 
//       headStyles: {
//         fillColor: [22, 160, 133], 
//         textColor: [255, 255, 255], 
//       },
//       bodyStyles: {
//         textColor: [0, 0, 0], 
//         halign: 'center', 
//       },
//       columnStyles: {
//         0: { cellWidth: 'auto' }, 
//         1: { cellWidth: 'auto' },
//         2: { cellWidth: 'auto' },
//         3: { cellWidth: 'auto' },
//         4: { cellWidth: 'auto' },
//         5: { cellWidth: 'auto' },
//       }
//     });

//     const totalPrice = parseFloat(product.price.replace('$', '')) * parseInt(product.qty);
//     doc.text(`Total Price: $${totalPrice.toFixed(2)}`, 15, doc.lastAutoTable.finalY + 10);

//     doc.setFontSize(8);
//     doc.setFont('helvetica', 'italic');
//     doc.text('Thank you for your business!', 15, doc.lastAutoTable.finalY + 20);
//     doc.text('For inquiries, contact us at: support@company.com', 15, doc.lastAutoTable.finalY + 25);
//     doc.text('Company Website: www.company.com', 15, doc.lastAutoTable.finalY + 30);

//     const pageCount = doc.internal.getNumberOfPages();
//     doc.setFontSize(8);
//     doc.text(`Page ${pageCount}`, 200, doc.lastAutoTable.finalY + 35);

//     doc.save(`${product.name}_invoice.pdf`);
//   };