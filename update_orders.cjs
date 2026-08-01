const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Orders.tsx', 'utf8');
content = content.replace(
  "type OrderStatus = 'Pendente' | 'Pago' | 'Enviado' | 'Cancelado';", 
  "type OrderStatus = 'Pendente' | 'Pago' | 'Enviado' | 'Cancelado' | 'Orçamento';"
);
content = content.replace(
  "import { Eye, Truck, CheckCircle, Clock, XCircle, Search, ExternalLink, FileText, Printer, User, Calendar, MapPin, Trash2 } from 'lucide-react';",
  "import { Eye, Truck, CheckCircle, Clock, XCircle, Search, ExternalLink, FileText, Printer, User, Calendar, MapPin, Trash2, ClipboardList } from 'lucide-react';"
);
content = content.replace(
  "'Cancelado': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },",
  "'Cancelado': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },\n  'Orçamento': { icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-100' },"
);
fs.writeFileSync('src/admin/views/Orders.tsx', content);
