export const SERVICES = [
  "B&W Printout",
  "Color Printout",
  "Spiral Binding",
  "Hardcover Binding",
  "Lamination",
  "Scan to PDF",
  "Photocopy",
  "Poster Print",
];

function generateId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function getOrders() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('xeroxq_orders') || '[]');
  } catch {
    return [];
  }
}

export function saveOrders(orders) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('xeroxq_orders', JSON.stringify(orders));
}

export function addOrder({ studentName, phone, services, copies, notes, shop }) {
  const order = {
    id: generateId(),
    studentName,
    phone,
    services,
    copies: Number(copies),
    notes,
    shopId: shop.id,
    shopName: shop.name,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
  return order;
}

export function updateOrderStatus(orderId, status) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx].status = status;
    saveOrders(orders);
    return orders[idx];
  }
  return null;
}

export function getOrderById(orderId) {
  return getOrders().find(o => o.id === orderId) || null;
}

export function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
