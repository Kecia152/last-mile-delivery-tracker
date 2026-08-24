# Last-Mile Delivery Tracker

A delivery management and tracking web application built with Node.js, HTML, CSS, and JavaScript.

---

## 1. Project Overview

Logistics operations involve pricing calculations, dynamic agent assignments, and customer notifications. This platform provides an end-to-end delivery tracking system:

- Rate Calculation Engine: Calculates volumetric weight, chargeable weight, zone-based pricing (Intra-zone vs Inter-zone for B2B and B2C), and COD surcharges.
- Agent Auto-Assignment: Automatically matches unassigned shipments to available delivery couriers based on zone proximity.
- Delivery Lifecycle Tracking: Tracks parcel states (Booked, Assigned, Picked Up, In Transit, Out for Delivery, Delivered, FAILED, Rescheduled) with a timestamped event history.
- Failed Delivery Rescheduling: Allows customers to select a new delivery date if an attempt fails, automatically reassigning a courier for the next attempt.
- Role Support: Interface designed for Customer, Delivery Agent, and Admin operations.

---

## 2. Setup and Running Locally

### Prerequisites
- Node.js (v16.0 or higher)

### Steps
1. Navigate to the project directory:
   cd last-mile-delivery-tracker
2. Start the application:
   node server.js
3. Open your browser and go to:
   http://localhost:3000
   (If port 3000 is in use, the server will automatically bind to port 3001).

---

## 3. Environment Variables

Sample configuration is provided in `.env.example`:

PORT=3000
NODE_ENV=development

---

## 4. Database Schema and Data Modeling

The system uses an in-memory document data model matching standard MongoDB and relational database structures.

### Data Models

#### Orders (`orders`)
| Field | Type | Description |
| :--- | :--- | :--- |
| id | String | Unique identifier |
| trackingNumber | String | Public tracking code (e.g., TRK-902188) |
| customerName | String | Recipient customer name |
| phone | String | Recipient contact number |
| orderType | String | B2C or B2B |
| paymentType | String | PREPAID or COD |
| pickupAddress | String | Origin pickup location |
| pickupZone | String | Origin zone (e.g., North Zone) |
| dropAddress | String | Destination drop location |
| dropZone | String | Destination zone (e.g., South Zone) |
| length | Number | Package length in cm |
| breadth | Number | Package breadth in cm |
| height | Number | Package height in cm |
| actualWeight | Number | Physical weight in kg |
| volumetricWeight | Number | Calculated volumetric weight in kg |
| chargeableWeight | Number | Greater of actual vs volumetric weight |
| totalPrice | Number | Final billable amount including GST |
| status | String | Current order status |
| agent | String | Assigned delivery agent |
| history | Array | Timeline events with timestamp and note |

#### Agents (`agents`)
| Field | Type | Description |
| :--- | :--- | :--- |
| name | String | Courier agent full name |
| zone | String | Primary operational zone |
| vehicle | String | Transport mode (Scooter, Van, Bike, Truck) |
| status | String | Availability state (Available, Busy) |

#### Zones (`zones`)
| Field | Type | Description |
| :--- | :--- | :--- |
| id | String | Zone identifier (e.g., zone-north) |
| name | String | Zone title (e.g., North Zone) |
| areas | Array | Covered localities and postal areas |

---

## 5. Rate Calculation Logic and Formulas

### Formulas
- Volumetric Weight (kg) = (Length × Breadth × Height) / 5000
- Chargeable Weight = max(Actual Weight, Volumetric Weight)
- Zone Scope:
  - Intra-Zone (Pickup Zone == Drop Zone): Local rate
  - Inter-Zone (Pickup Zone != Drop Zone): Transit rate

### Pricing Card Matrix
| Category | Scope | Base Rate | Base Weight | Extra / kg | COD Fee |
| :--- | :--- | :--- | :--- | :--- | :--- |
| B2C | Intra-Zone | Rs. 50.00 | 1.0 kg | Rs. 20.00 | Rs. 30.00 |
| B2C | Inter-Zone | Rs. 90.00 | 1.0 kg | Rs. 35.00 | Rs. 40.00 |
| B2B | Intra-Zone | Rs. 40.00 | 2.0 kg | Rs. 15.00 | Rs. 25.00 |
| B2B | Inter-Zone | Rs. 75.00 | 2.0 kg | Rs. 25.00 | Rs. 35.00 |

### Cost Calculation Steps
1. Extra Weight Charge = ceil(max(0, Chargeable Weight - Base Weight)) × Per Extra Kg Rate
2. Subtotal = Base Rate + Extra Weight Charge + COD Fee
3. GST (18%) = Subtotal × 0.18
4. Total Price = Subtotal + GST

---

## 6. REST API Documentation

| Method | Route | Description |
| :--- | :--- | :--- |
| POST | /api/calculate | Computes volumetric weight and price breakdown |
| GET | /api/orders | Returns all orders and tracking history |
| POST | /api/orders | Creates a new delivery shipment |
| POST | /api/orders/update-status | Updates shipment lifecycle status |
| POST | /api/orders/reschedule | Reschedules a failed order for a new date |
| POST | /api/orders/assign | Auto-assigns an agent based on zone match |

---

## 7. Sample Test Scenarios

- Delivered Shipment (#TRK-902188): Demonstrates complete lifecycle to successful delivery.
- Failed Delivery (#TRK-741903): Demonstrates failed attempt and customer reschedule date selection.
- New Booking (#TRK-229410): Demonstrates unassigned booking ready for agent auto-assignment.

---

## 8. Deployment

To deploy on Render, Railway, or Vercel:
1. Connect your GitHub repository.
2. Set the start command to: node server.js
