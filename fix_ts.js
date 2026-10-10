const fs = require('fs');

const files = [
  'frontend/src/pages/AgentVouchers.tsx',
  'frontend/src/pages/Invoices.tsx',
  'frontend/src/pages/Notes.tsx',
  'frontend/src/pages/Settlements.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/if \(typeof fetchInvoices === 'function'.*?\n/g, '');
  content = content.replace(/if \(typeof fetchNotes === 'function'.*?\n/g, '');
  content = content.replace(/if \(typeof fetchSettlements === 'function'.*?\n/g, '');
  content = content.replace(/if \(typeof fetchVouchers === 'function'.*?\n/g, '');
  content = content.replace(/if \(typeof fetchCommissions === 'function'.*?\n/g, '');
  content = content.replace(/if \(typeof fetchParties === 'function'.*?\n/g, '');
  
  // This matches the exact injected line that causes the variable undefined error in empty states
  content = content.replace(/\n\s*<td><button className="btn btn-outline" style={{padding: '0\.25rem 0\.5rem', color: 'var\(--color-danger\)'}} onClick=\{\(\) => handleDelete\([a-zA-Z]+\.id\)\}>Delete<\/button><\/td>/g, '');
  
  fs.writeFileSync(file, content);
});

// Fix imports
let analytics = fs.readFileSync('frontend/src/pages/Analytics.tsx', 'utf8');
analytics = analytics.replace('PieChart, Clock, Users, ArrowUpRight, TrendingUp, Building2, Search, UserCircle, Calendar, Tag', 'Clock, TrendingUp, Building2, UserCircle, Calendar, Tag');
fs.writeFileSync('frontend/src/pages/Analytics.tsx', analytics);

let parties = fs.readFileSync('frontend/src/pages/Parties.tsx', 'utf8');
parties = parties.replace('Plus, Search, Building2, User, Building, Edit2, Trash2', 'Plus, Building2, User, Building');
fs.writeFileSync('frontend/src/pages/Parties.tsx', parties);

let reports = fs.readFileSync('frontend/src/pages/Reports.tsx', 'utf8');
reports = reports.replace("import { Activity } from 'lucide-react';\n", '');
fs.writeFileSync('frontend/src/pages/Reports.tsx', reports);

console.log("Fixes applied.");
