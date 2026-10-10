const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  { file: 'Invoices.tsx', entity: 'invoices', name: 'Invoice', iterator: 'inv' },
  { file: 'Notes.tsx', entity: 'notes', name: 'Note', iterator: 'note' },
  { file: 'Settlements.tsx', entity: 'settlements', name: 'Settlement', iterator: 'settlement' },
  { file: 'AgentVouchers.tsx', entity: 'vouchers', name: 'Voucher', iterator: 'voucher' },
  { file: 'Commissions.tsx', entity: 'commissions', name: 'Commission', iterator: 'comm' },
  { file: 'Parties.tsx', entity: 'parties', name: 'Party', iterator: 'party' }
];

filesToUpdate.forEach(({ file, entity, name, iterator }) => {
  const filePath = path.join(__dirname, 'frontend/src/pages', file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('handleDelete')) {
    const deleteFunc = `
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ${name}?')) return;
    try {
      await axios.delete(\`\${API_URL}/${entity}/\${id}\`);
      if (typeof fetchInvoices === 'function' && typeof fetchInvoices !== 'undefined') fetchInvoices();
      if (typeof fetchNotes === 'function' && typeof fetchNotes !== 'undefined') fetchNotes();
      if (typeof fetchSettlements === 'function' && typeof fetchSettlements !== 'undefined') fetchSettlements();
      if (typeof fetchVouchers === 'function' && typeof fetchVouchers !== 'undefined') fetchVouchers();
      if (typeof fetchCommissions === 'function' && typeof fetchCommissions !== 'undefined') fetchCommissions();
      if (typeof fetchParties === 'function' && typeof fetchParties !== 'undefined') fetchParties();
    } catch (error) {
      console.error(error);
      alert('Failed to delete ${name}');
    }
  };
`;
    content = content.replace('  return (', deleteFunc + '  return (');
  }

  if (!content.includes('<th>Actions</th>')) {
    content = content.replace('</tr>\n            </thead>', '  <th>Actions</th>\n              </tr>\n            </thead>');
    content = content.replace(/<\/td>\n\s*<\/tr>/g, `</td>\n                  <td><button className="btn btn-outline" style={{padding: '0.25rem 0.5rem', color: 'var(--color-danger)'}} onClick={() => handleDelete(${iterator}.id)}>Delete</button></td>\n                </tr>`);
  }

  // Remove || p.role === 'BOTH'
  content = content.replace(/\|\| p\.role === 'BOTH'/g, '');

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
