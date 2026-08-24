Last-Mile Delivery Tracker Platform

A delivery management and parcel tracking system built with Node.js, REST APIs, HTML, CSS, and JavaScript.

1. Project Overview and Scope
Logistics operations involve complex pricing rules, dynamic agent assignment, and reliable customer communication. This project implements a delivery management system addressing all core operational requirements:

Rate Calculation Engine: Computes volumetric weight, chargeable weight, intra/inter zone rate cards, and Cash on Delivery (COD) surcharges dynamically.
Dynamic Auto-Assignment: Matches unassigned orders to the nearest available delivery agent based on zone proximity and workload balancing.
Delivery Lifecycle Tracking: Provides status updates (Booked, Assigned, Picked Up, In Transit, Out for Delivery, Delivered, Failed) with an immutable audit history.
Failed Delivery Recovery: Enables customer-driven rescheduling on failed delivery attempts with automatic courier reassignment.
Role Perspectives: Supports Customer, Delivery Agent, and Admin operations.
2. Setup and Installation Guide
Prerequisites
Node.js (v16.0 or higher)
Steps to Run Locally
Clone or navigate to the project directory:
bash

cd last-mile-delivery-tracker
Start the server:
bash

node server.js
(Alternatively: npm start)
Open your web browser and navigate to:
text

http://localhost:3000
(If port 3000 is occupied by another process, the server automatically binds to port 3001).
3. Environment Configuration
Copy .env.example to create your local .env configuration:

env

PORT=3000
NODE_ENV=development
4. Database Architecture and Schema Modeling
The application utilizes an in-memory document store structure that directly mirrors a production MongoDB / PostgreSQL schema.

Schema Definitions
1. Orders Collection (orders)
id (String, Primary Key): Unique order identifier.
trackingNumber (String, Indexed): Customer-facing tracking code (e.g., TRK-902188).
customerName (String): Full name of recipient.
phone (String): Contact phone number.
orderType (String, Enum: B2C, B2B): Classification of the shipment.
paymentType (String, Enum: PREPAID, COD): Payment method.
pickupAddress (String): Origin physical address.
pickupZone (String): Macro zone of origin (e.g., North Zone).
dropAddress (String): Destination physical address.
dropZone (String): Macro zone of destination (e.g., South Zone).
length (Number): Package length in cm.
breadth (Number): Package breadth in cm.
height (Number): Package height in cm.
actualWeight (Number): Physical scale weight in kg.
volumetricWeight (Number): Calculated volumetric weight in kg.
chargeableWeight (Number): Billed weight (max(actualWeight, volumetricWeight)).
totalPrice (Number): Final billable charge inclusive of taxes.
status (String, Enum: Booked, Assigned, Picked Up, In Transit, Out for Delivery, Delivered, FAILED, Rescheduled).
agent (String): Name and vehicle of the assigned delivery agent.
history (Array of Objects): Immutable timeline events { status, time, note }.
2. Agents Collection (agents)
id (String, Primary Key): Agent identifier.
name (String): Courier full name.
zone (String): Primary assigned operating zone.
vehicle (String): Vehicle type (Scooter, Van, Bike, Truck).
status (String, Enum: Available, Busy).
activeOrders (Number): Count of currently assigned active packages.
3. Zones Collection (zones)
id (String, Primary Key): Unique zone code.
name (String): Zone descriptor (e.g., North Zone (Delhi Central)).
areas (Array of Strings): Pincodes and locality names mapped to this zone.
4. Rate Cards Collection (rate_cards)
id (String, Primary Key): Rate identifier (e.g., B2C-INTRA, B2C-INTER).
orderType (String): B2C or B2B.
zoneScope (String): INTRA (same zone) or INTER (different zones).
baseRate (Number): Base price for initial weight slab.
baseWeight (Number): Base weight threshold in kg.
perExtraKg (Number): Rate charged per additional kg.
codFee (Number): Surcharge applied for Cash on Delivery orders.
5. Rate Calculation Engine and Formulas
Computational Formulas
Volumetric Weight (IATA Standard): 
Volumetric Weight (kg)
=
Length (cm)
×
Breadth (cm)
×
Height (cm)
5000
Volumetric Weight (kg)= 
5000
Length (cm)×Breadth (cm)×Height (cm)
​
 

Chargeable Billable Weight: 
Chargeable Weight
=
max
⁡
(
Actual Weight
,
Volumetric Weight
)
Chargeable Weight=max(Actual Weight,Volumetric Weight)

Zone Resolution:

If 
Pickup Zone
=
=
Drop Zone
Pickup Zone==Drop Zone: Applied as Intra-Zone (local direct dispatch).
If 
Pickup Zone
≠
Drop Zone
Pickup Zone

=Drop Zone: Applied as Inter-Zone (cross-city transit).
Tariff Schedules:

Rate Card Key	Base Rate	Base Weight	Additional / kg	COD Fee
B2C Intra-Zone	50.00	1.0 kg	20.00	30.00
B2C Inter-Zone	90.00	1.0 kg	35.00	40.00
B2B Intra-Zone	40.00	2.0 kg	15.00	25.00
B2B Inter-Zone	75.00	2.0 kg	25.00	35.00
Cost Computation: 
Extra Weight Surcharge
=
⌈
max
⁡
(
0
,
Chargeable Weight
−
Base Weight
)
⌉
×
Per Extra Kg Rate
Extra Weight Surcharge=⌈max(0,Chargeable Weight−Base Weight)⌉×Per Extra Kg Rate 
Subtotal
=
Base Rate
+
Extra Weight Surcharge
+
COD Surcharge
Subtotal=Base Rate+Extra Weight Surcharge+COD Surcharge
Failed to render LaTeX: KaTeX parse error: Unexpected end of input in a macro argument, expected '}' at end of input: …al} \times 0.18
\text{GST (18%)} = \text{Subtotal} \times 0.18 
Total Billable Price
=
Subtotal
+
GST
Total Billable Price=Subtotal+GST

6. REST API Documentation
Method	Endpoint	Description	Request Body
POST	/api/calculate	Computes volumetric weight and price breakdown	{ length, breadth, height, actualWeight, orderType, pickupZone, dropZone, paymentType }
GET	/api/orders	Retrieves all registered orders and history	None
POST	/api/orders	Books a new shipment order	{ customerName, phone, orderType, pickupZone, dropZone, ... }
POST	/api/orders/update-status	Advances order lifecycle status	{ orderId, status }
POST	/api/orders/reschedule	Reschedules a failed order for a new date	{ orderId, date }
POST	/api/orders/assign	Automatically assigns an agent based on zone	{ orderId }
7. Pre-Configured Test Scenarios
Delivered Order (#TRK-902188): Demonstrates a complete lifecycle from booking to delivery by Priya Patel.
Failed Attempt (#TRK-741903): Demonstrates the failure recovery flow. Visit the Track Order tab and use the date selector to reschedule.
Pending Booking (#TRK-229410): Demonstrates unassigned state ready for agent assignment in the Admin panel.
8. Deployment
To deploy to any cloud platform (e.g., Render, Railway, Vercel):

Push this repository to GitHub.
Link the repository to your hosting provider.
Set the build command to empty and start command to:
bash

node server.js