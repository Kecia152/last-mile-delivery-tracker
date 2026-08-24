# System Design: Last-Mile Delivery Management Platform

Document Word Count: ~620 words

---

## 1. Rate Calculation Engine Architecture

The rate calculation engine computes parcel shipping charges dynamically based on dimensions, weight, customer type, and geographic routing:

1. Volumetric Weight Calculation: Lightweight, bulky packages occupy vehicle capacity. The engine applies the standard IATA formula:
   Volumetric Weight (kg) = (Length × Breadth × Height in cm) / 5000

2. Chargeable Weight Determination: To protect carrier operating margins while remaining transparent to shippers, the billable weight is resolved as the maximum between physical scale weight and volumetric weight:
   Chargeable Weight = max(Actual Weight, Volumetric Weight)

3. Zone-Based Rate Card Resolution: The system compares origin and destination zones. If Pickup Zone equals Drop Zone, it applies the Intra-Zone rate card (local direct routing). If they differ, it applies the Inter-Zone rate card (hub-to-hub transit). Rates are separated into B2C (retail parcels) and B2B (commercial shipments with higher base weight limits).

4. Weight Slab and Surcharge Pricing: Any weight exceeding the base allowance (1.0 kg for B2C, 2.0 kg for B2B) is rounded up and billed per additional kilogram. If Cash on Delivery (COD) is chosen, an order-type COD surcharge is added.

5. Taxation: A standard 18% Goods and Services Tax (GST) is calculated on the subtotal to generate the final billable total.

---

## 2. Zone Detection Approach

Urban delivery regions are structured into macro operating zones:
- North Zone: Central Delhi, Connaught Place, Rohini
- South Zone: Saket, Hauz Khas, Gurugram Cyber Hub
- West Zone: Rajouri Garden, Janakpuri, Dwarka
- East Zone: Preet Vihar, Anand Vihar Freight Terminal

When a shipment is booked:
- If pickupZone == dropZone, the parcel is classified as Intra-Zone, enabling lower base rates and direct local dispatch.
- If pickupZone != dropZone, the parcel is classified as Inter-Zone, routing through intermediate sorting facilities.

This approach eliminates hardcoded postal routes and allows administrators to reassign areas to zones dynamically.

---

## 3. Intelligent Auto-Assignment Logic

The auto-assignment module pairs unassigned shipments with the most appropriate courier agent based on key operational factors:

1. Zone Proximity Match: Agents assigned to the package's pickup zone receive primary preference to minimize deadhead travel distance.
2. Availability Filtering: Couriers currently marked as Available are prioritized over Busy agents.
3. Workload Balancing: When multiple agents are in the same zone, the algorithm assigns the order to the agent with the fewest active consignments.
4. Vehicle Suitability: For heavier cargo (>5 kg) or B2B shipments, larger vehicles (Delivery Vans and Mini Trucks) receive priority.

The matched courier is recorded on the shipment, advancing the status to Assigned.

---

## 4. Failed Delivery Handling and Rescheduling Flow

Failed deliveries represent a common disruption in last-mile logistics. The platform provides a recovery workflow:

1. Failure Logging: When a courier cannot complete handover (e.g., customer unavailable, incorrect address), the courier updates the order status to FAILED.
2. Customer Alert: An alert is displayed on the customer tracking screen indicating the unsuccessful attempt.
3. Self-Service Rescheduling: The customer selects a new delivery date directly from the tracking page.
4. Re-Queuing and Reassignment: The order transitions to Rescheduled, and the assignment engine automatically assigns a courier for the rescheduled date.
5. Immutable Audit Trail: Every status transition is logged with a timestamp and note in the shipment tracking history.
