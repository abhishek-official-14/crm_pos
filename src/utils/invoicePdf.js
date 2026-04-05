const escapePdfText = (value) => String(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const buildInvoicePdfBuffer = (order) => {
  const createdAt = new Date(order.createdAt).toISOString();
  const lines = [
    'CRM POS Invoice',
    `Invoice: ${order.invoiceNumber || order._id}`,
    `Date: ${createdAt}`,
    `Customer: ${order.customer?.name || 'Walk-in'}`,
    '',
    'Items:'
  ];

  order.items.forEach((item) => {
    lines.push(`${item.product?.name || 'Unknown'} x${item.quantity} @ ${item.unitPrice}`);
  });

  lines.push('');
  lines.push(`Subtotal: ${order.subtotal}`);
  lines.push(`GST (${order.taxRate}%): ${order.taxAmount}`);
  lines.push(`Total: ${order.totalAmount}`);
  lines.push(`Profit: ${order.profitAmount}`);

  let y = 780;
  const textOps = lines
    .map((line) => {
      const op = `BT /F1 11 Tf 50 ${y} Td (${escapePdfText(line)}) Tj ET`;
      y -= 16;
      return op;
    })
    .join('\n');

  const contentStream = `${textOps}\n`;

  const objects = [];
  objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj');
  objects.push('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj');
  objects.push('3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj');
  objects.push('4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj');
  objects.push(`5 0 obj << /Length ${Buffer.byteLength(contentStream, 'utf8')} >> stream\n${contentStream}endstream endobj`);

  let offset = 9;
  const pdfParts = ['%PDF-1.4\n'];
  const xref = ['0000000000 65535 f '];

  objects.forEach((obj) => {
    xref.push(`${String(offset).padStart(10, '0')} 00000 n `);
    pdfParts.push(`${obj}\n`);
    offset += Buffer.byteLength(`${obj}\n`, 'utf8');
  });

  const xrefOffset = offset;
  const xrefSection = `xref\n0 ${objects.length + 1}\n${xref.join('\n')}\n`;
  const trailer = `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(`${pdfParts.join('')}${xrefSection}${trailer}`, 'utf8');
};

module.exports = { buildInvoicePdfBuffer };
