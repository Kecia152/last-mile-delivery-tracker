// Last-Mile Delivery Tracker 

let orders = [];
let currentTrackingId = 'TRK-902188';

// 1. Navigation
function showTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  const tab = document.getElementById(`tab-${tabId}`);
  const btn = document.getElementById(`btn-${tabId}`);
  if (tab) tab.classList.add('active');
  if (btn) btn.classList.add('active');

  if (tabId === 'track') renderTrack();
  if (tabId === 'admin') renderAdmin();
}

// 2. Fetch Orders from Backend
async function fetchOrders() {
  try {
    const res = await fetch('/api/orders');
    orders = await res.json();
    if (!currentTrackingId && orders.length > 0) {
      currentTrackingId = orders[0].trackingNumber;
    }
  } catch (err) {
    console.error(err);
  }
}

// 3. Real-time Price Calculation
async function calculatePrice() {
  const length = document.getElementById('dim-l')?.value || 10;
  const breadth = document.getElementById('dim-b')?.value || 10;
  const height = document.getElementById('dim-h')?.value || 10;
  const actualWeight = document.getElementById('actual-weight')?.value || 0.5;
  const orderType = document.getElementById('order-type')?.value || 'B2C';
  const pickupZone = document.getElementById('pickup-zone')?.value || 'North Zone';
  const dropZone = document.getElementById('drop-zone')?.value || 'South Zone';
  const paymentType = document.getElementById('payment-type')?.value || 'PREPAID';

  try {
    const res = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ length, breadth, height, actualWeight, orderType, pickupZone, dropZone, paymentType })
    });
    const data = await res.json();

    document.getElementById('p-actual-wt').innerText = `${parseFloat(actualWeight).toFixed(2)} kg`;
    document.getElementById('p-vol-wt').innerText = `${data.volumetricWeight.toFixed(2)} kg`;
    document.getElementById('p-chargeable-wt').innerText = `${data.chargeableWeight.toFixed(2)} kg`;
    document.getElementById('p-zone-type').innerText = data.zoneType;
    document.getElementById('p-base-rate').innerText = `₹${data.baseRate.toFixed(2)}`;
    document.getElementById('p-extra-rate').innerText = `₹${data.extraCharge.toFixed(2)}`;
    document.getElementById('p-cod-rate').innerText = `₹${data.codCharge.toFixed(2)}`;
    document.getElementById('p-tax-rate').innerText = `₹${data.tax.toFixed(2)}`;
    document.getElementById('p-total-rate').innerText = `₹${data.totalPrice.toFixed(2)}`;
  } catch (err) {
    console.error(err);
  }
}

// 4. Create Order
async function handleCreateOrder(e) {
  e.preventDefault();
  const orderData = {
    customerName: document.getElementById('cust-name').value,
    phone: document.getElementById('cust-phone').value,
    orderType: document.getElementById('order-type').value,
    pickupZone: document.getElementById('pickup-zone').value,
    pickupAddress: document.getElementById('pickup-address').value,
    dropZone: document.getElementById('drop-zone').value,
    dropAddress: document.getElementById('drop-address').value,
    length: document.getElementById('dim-l').value,
    breadth: document.getElementById('dim-b').value,
    height: document.getElementById('dim-h').value,
    actualWeight: document.getElementById('actual-weight').value,
    paymentType: document.getElementById('payment-type').value
  };

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  const newOrder = await res.json();
  alert(`Order created successfully! Tracking ID: ${newOrder.trackingNumber}`);
  await fetchOrders();
  currentTrackingId = newOrder.trackingNumber;
  showTab('track');
}

// 5. Track Order View
function renderTrack() {
  const container = document.getElementById('tracking-display');
  const sampleDiv = document.getElementById('sample-trk-buttons');
  const order = orders.find(o => o.trackingNumber === currentTrackingId) || orders[0];

  if (!order) return;

  if (sampleDiv) {
    sampleDiv.innerHTML = orders.map(o => `
      <button class="pill ${o.trackingNumber === order.trackingNumber ? 'active' : ''}" onclick="trackOrder('${o.trackingNumber}')">
        #${o.trackingNumber} (${o.status})
      </button>
    `).join('');
  }

  container.innerHTML = `
    <div style="margin-top: 15px; border-top: 1px solid #EEEEEE; padding-top: 15px;">
      
      ${order.status === 'FAILED' ? `
        <div style="background: #F8D7DA; border: 1px solid #F5C6CB; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
          <strong style="color: #721C24;">⚠️ Delivery Attempt Failed: Customer Not Available</strong>
          <p style="font-size: 12px; margin-top: 4px;">Please choose a new date to reschedule your delivery:</p>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <input type="date" id="reschedule-date-input" style="max-width: 200px;">
            <button onclick="rescheduleOrder('${order.id}')" style="background:#801625; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">Reschedule</button>
          </div>
        </div>
      ` : ''}

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3>#${order.trackingNumber}</h3>
          <p style="font-size: 12px; color: #666;">Customer: ${order.customerName} (${order.phone})</p>
        </div>
        <div>
          <span class="status-badge ${order.status === 'Delivered' ? 'badge-green' : order.status === 'FAILED' ? 'badge-red' : 'badge-yellow'}">${order.status}</span>
          <div style="font-weight: bold; color: #801625; margin-top: 4px;">₹${order.totalPrice}</div>
        </div>
      </div>

      <div style="background: #F8F9FA; padding: 10px; border-radius: 6px; margin: 12px 0; font-size: 12px;">
        <div><strong>Route:</strong> ${order.pickupAddress} (${order.pickupZone}) ➔ ${order.dropAddress} (${order.dropZone})</div>
        <div style="margin-top:4px;"><strong>Weight:</strong> ${order.actualWeight}kg (Billed on ${order.chargeableWeight}kg) | <strong>Agent:</strong> ${order.agent}</div>
      </div>

      <h4 style="font-size: 13px; color: #801625; margin: 14px 0 6px 0;">Tracking Event History</h4>
      <div style="border-left: 2px solid #FFCDD2; padding-left: 10px;">
        ${order.history.map(h => `
          <div style="margin-bottom: 8px; font-size: 12px;">
            <strong>${h.status}</strong> <span style="color:#888; font-size:11px;">(${h.time})</span>
            <div>${h.note}</div>
          </div>
        `).join('')}
      </div>

    </div>
  `;
}

function trackOrder(trk) {
  currentTrackingId = trk.trim();
  const input = document.getElementById('track-input');
  if (input) input.value = trk.trim();
  renderTrack();
}

// 6. Reschedule Order
async function rescheduleOrder(orderId) {
  const date = document.getElementById('reschedule-date-input').value;
  if (!date) {
    alert('Please select a date');
    return;
  }
  await fetch('/api/orders/reschedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, date })
  });
  alert(`Delivery rescheduled for ${date}`);
  await fetchOrders();
  renderTrack();
}

// 7. Admin & Agent Dashboard
function renderAdmin() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>#${o.trackingNumber}</strong></td>
      <td>${o.customerName}</td>
      <td style="font-size: 11px;">${o.pickupZone} ➔ ${o.dropZone}</td>
      <td>${o.chargeableWeight} kg</td>
      <td style="color:#801625; font-weight:bold;">₹${o.totalPrice}</td>
      <td>
        <select onchange="updateStatus('${o.id}', this.value)" style="font-size:11px; padding:2px;">
          <option ${o.status === 'Booked' ? 'selected' : ''}>Booked</option>
          <option ${o.status === 'Assigned' ? 'selected' : ''}>Assigned</option>
          <option ${o.status === 'Picked Up' ? 'selected' : ''}>Picked Up</option>
          <option ${o.status === 'In Transit' ? 'selected' : ''}>In Transit</option>
          <option ${o.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
          <option ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option ${o.status === 'FAILED' ? 'selected' : ''}>FAILED</option>
          <option ${o.status === 'Rescheduled' ? 'selected' : ''}>Rescheduled</option>
        </select>
      </td>
      <td>
        ${o.agent !== 'Unassigned' ? o.agent : `
          <button onclick="assignAgent('${o.id}')" class="btn-assign">Assign Agent</button>
        `}
      </td>
      <td>
        <button onclick="trackOrder('${o.trackingNumber}'); showTab('track');" style="border:1px solid #ccc; background:#fff; padding:2px 6px; border-radius:4px; font-size:11px; cursor:pointer;">Track</button>
      </td>
    </tr>
  `).join('');
}

async function updateStatus(orderId, status) {
  await fetch('/api/orders/update-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, status })
  });
  alert(`Status updated to: ${status}`);
  await fetchOrders();
  renderAdmin();
}

async function assignAgent(orderId) {
  await fetch('/api/orders/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId })
  });
  alert('Courier agent assigned!');
  await fetchOrders();
  renderAdmin();
}

// Initial Boot
document.addEventListener('DOMContentLoaded', async () => {
  await fetchOrders();
  calculatePrice();
  renderTrack();
});
