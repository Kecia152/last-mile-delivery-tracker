// Last-Mile Delivery Tracker - Simple Node.js Server
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

let PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// In-Memory Database for Orders and Agents
let orders = [
  {
    id: '1',
    trackingNumber: 'TRK-902188',
    customerName: 'Ananya Roy',
    phone: '+91 98100 12345',
    pickupAddress: 'Connaught Place, New Delhi',
    pickupZone: 'North Zone',
    dropAddress: 'Saket, New Delhi',
    dropZone: 'South Zone',
    length: 35, breadth: 20, height: 10,
    actualWeight: 1.2,
    volumetricWeight: 1.4,
    chargeableWeight: 1.4,
    orderType: 'B2C',
    paymentType: 'PREPAID',
    totalPrice: 154.88,
    status: 'DELIVERED',
    agent: 'Priya Patel (Van)',
    history: [
      { status: 'Booked', time: 'Yesterday 09:30 AM', note: 'Order placed online' },
      { status: 'Assigned', time: 'Yesterday 10:00 AM', note: 'Assigned to Priya Patel' },
      { status: 'Picked Up', time: 'Yesterday 11:00 AM', note: 'Collected from sender' },
      { status: 'In Transit', time: 'Yesterday 02:00 PM', note: 'In transit to South Hub' },
      { status: 'Out for Delivery', time: 'Today 10:00 AM', note: 'Agent is out for delivery' },
      { status: 'Delivered', time: 'Today 11:45 AM', note: 'Delivered to customer' }
    ]
  },
  {
    id: '2',
    trackingNumber: 'TRK-741903',
    customerName: 'Kavita Mehta',
    phone: '+91 98223 34455',
    pickupAddress: 'Rajouri Garden',
    pickupZone: 'West Zone',
    dropAddress: 'Janakpuri',
    dropZone: 'West Zone',
    length: 25, breadth: 15, height: 8,
    actualWeight: 0.8,
    volumetricWeight: 0.6,
    chargeableWeight: 0.8,
    orderType: 'B2C',
    paymentType: 'COD',
    totalPrice: 99.12,
    status: 'FAILED',
    agent: 'Amit Verma (Bike)',
    history: [
      { status: 'Booked', time: 'Yesterday 12:00 PM', note: 'COD order placed' },
      { status: 'Assigned', time: 'Yesterday 01:00 PM', note: 'Assigned to Amit Verma' },
      { status: 'Out for Delivery', time: 'Today 09:30 AM', note: 'Agent reached address' },
      { status: 'FAILED', time: 'Today 10:30 AM', note: 'Delivery failed: Customer not available' }
    ]
  },
  {
    id: '3',
    trackingNumber: 'TRK-229410',
    customerName: 'Rohan Gupta',
    phone: '+91 97110 55443',
    pickupAddress: 'Civil Lines',
    pickupZone: 'North Zone',
    dropAddress: 'Rohini Sector 14',
    dropZone: 'North Zone',
    length: 20, breadth: 15, height: 10,
    actualWeight: 1.5,
    volumetricWeight: 0.6,
    chargeableWeight: 1.5,
    orderType: 'B2C',
    paymentType: 'PREPAID',
    totalPrice: 86.73,
    status: 'Booked',
    agent: 'Unassigned',
    history: [
      { status: 'Booked', time: 'Just now', note: 'Order placed. Awaiting agent assignment.' }
    ]
  }
];

const agents = [
  { name: 'Rahul Sharma', zone: 'North Zone', vehicle: 'Scooter' },
  { name: 'Priya Patel', zone: 'South Zone', vehicle: 'Van' },
  { name: 'Amit Verma', zone: 'West Zone', vehicle: 'Bike' },
  { name: 'Sneha Das', zone: 'East Zone', vehicle: 'Truck' }
];

// Rate Calculation Function
function calculateRate(data) {
  const L = parseFloat(data.length) || 10;
  const B = parseFloat(data.breadth) || 10;
  const H = parseFloat(data.height) || 10;
  const actualWeight = parseFloat(data.actualWeight) || 0.5;
  const orderType = data.orderType || 'B2C';
  const pickupZone = data.pickupZone || 'North Zone';
  const dropZone = data.dropZone || 'South Zone';
  const paymentType = data.paymentType || 'PREPAID';

  // 1. Volumetric Weight = (L*B*H)/5000
  const volumetricWeight = parseFloat(((L * B * H) / 5000).toFixed(2));

  // 2. Chargeable Weight = max(actual, volumetric)
  const chargeableWeight = parseFloat(Math.max(actualWeight, volumetricWeight).toFixed(2));

  // 3. Zone Check (Intra vs Inter)
  const isIntra = (pickupZone === dropZone);

  let baseRate = 50;
  let baseWeight = 1.0;
  let perExtraKg = 20;
  let codFee = 30;

  if (orderType === 'B2C') {
    if (isIntra) { baseRate = 50; baseWeight = 1.0; perExtraKg = 20; codFee = 30; }
    else { baseRate = 90; baseWeight = 1.0; perExtraKg = 35; codFee = 40; }
  } else { // B2B
    if (isIntra) { baseRate = 40; baseWeight = 2.0; perExtraKg = 15; codFee = 25; }
    else { baseRate = 75; baseWeight = 2.0; perExtraKg = 25; codFee = 35; }
  }

  // Extra weight calculation
  const extraKg = Math.max(0, chargeableWeight - baseWeight);
  const extraCharge = Math.ceil(extraKg) * perExtraKg;
  const codCharge = (paymentType === 'COD') ? codFee : 0;

  // Subtotal & 18% Tax
  const subtotal = baseRate + extraCharge + codCharge;
  const tax = parseFloat((subtotal * 0.18).toFixed(2));
  const totalPrice = parseFloat((subtotal + tax).toFixed(2));

  return {
    volumetricWeight,
    chargeableWeight,
    zoneType: isIntra ? 'Intra-Zone (Same Zone)' : 'Inter-Zone (Cross Zone)',
    baseRate,
    extraCharge,
    codCharge,
    tax,
    totalPrice
  };
}

// HTTP Server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse Body Helper
  const getBody = (callback) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { callback(JSON.parse(data || '{}')); }
      catch (e) { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid JSON' })); }
    });
  };

  // --- API Endpoints ---

  // 1. Calculate Price
  if (pathname === '/api/calculate' && method === 'POST') {
    getBody(body => {
      const result = calculateRate(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    });
    return;
  }

  // 2. Get All Orders
  if (pathname === '/api/orders' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(orders));
    return;
  }

  // 3. Create Order
  if (pathname === '/api/orders' && method === 'POST') {
    getBody(body => {
      const calc = calculateRate(body);
      const newOrder = {
        id: String(Date.now()),
        trackingNumber: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
        customerName: body.customerName || 'Customer',
        phone: body.phone || '+91 98000 00000',
        pickupAddress: body.pickupAddress || 'Pickup',
        pickupZone: body.pickupZone || 'North Zone',
        dropAddress: body.dropAddress || 'Drop',
        dropZone: body.dropZone || 'South Zone',
        length: parseFloat(body.length) || 10,
        breadth: parseFloat(body.breadth) || 10,
        height: parseFloat(body.height) || 10,
        actualWeight: parseFloat(body.actualWeight) || 0.5,
        volumetricWeight: calc.volumetricWeight,
        chargeableWeight: calc.chargeableWeight,
        orderType: body.orderType || 'B2C',
        paymentType: body.paymentType || 'PREPAID',
        totalPrice: calc.totalPrice,
        status: 'Booked',
        agent: 'Unassigned',
        history: [
          { status: 'Booked', time: 'Just now', note: `Order placed. Total: ₹${calc.totalPrice}` }
        ]
      };

      orders.unshift(newOrder);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newOrder));
    });
    return;
  }

  // 4. Update Status
  if (pathname === '/api/orders/update-status' && method === 'POST') {
    getBody(({ orderId, status }) => {
      const order = orders.find(o => o.id === orderId || o.trackingNumber === orderId);
      if (order) {
        order.status = status;
        order.history.push({
          status,
          time: 'Just now',
          note: status === 'FAILED' ? 'Delivery attempt failed' : `Status updated to ${status}`
        });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, order }));
    });
    return;
  }

  // 5. Reschedule Failed Order
  if (pathname === '/api/orders/reschedule' && method === 'POST') {
    getBody(({ orderId, date }) => {
      const order = orders.find(o => o.id === orderId || o.trackingNumber === orderId);
      if (order) {
        order.status = 'Rescheduled';
        // Auto assign agent for pickup zone
        const bestAgent = agents.find(a => a.zone === order.pickupZone) || agents[0];
        order.agent = `${bestAgent.name} (${bestAgent.vehicle})`;
        order.history.push({
          status: 'Rescheduled',
          time: 'Just now',
          note: `Rescheduled for ${date}. Assigned to ${order.agent}`
        });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, order }));
    });
    return;
  }

  // 6. Assign Agent
  if (pathname === '/api/orders/assign' && method === 'POST') {
    getBody(({ orderId }) => {
      const order = orders.find(o => o.id === orderId || o.trackingNumber === orderId);
      if (order) {
        const bestAgent = agents.find(a => a.zone === order.pickupZone) || agents[0];
        order.agent = `${bestAgent.name} (${bestAgent.vehicle})`;
        order.status = 'Assigned';
        order.history.push({
          status: 'Assigned',
          time: 'Just now',
          note: `Assigned to ${order.agent}`
        });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, order }));
    });
    return;
  }

  // --- Serve Static Frontend Files ---
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
  };

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }
    const contentType = mimeTypes[path.extname(filePath)] || 'text/plain';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

// Start Server with port fallback
function start(portToTry) {
  server.listen(portToTry, () => {
    console.log(`\n======================================================`);
    console.log(`🚚 Last-Mile Delivery Tracker running at:`);
    console.log(`👉 http://localhost:${portToTry}`);
    console.log(`======================================================\n`);
  });

  server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${portToTry} is in use, trying ${portToTry + 1}...`);
      start(portToTry + 1);
    } else {
      console.error(err);
    }
  });
}

start(PORT);
