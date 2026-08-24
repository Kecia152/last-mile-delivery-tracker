System Design: Last-Mile Delivery Management Platform
Document Word Count: ~640 words

1. Rate Calculation Engine Architecture
The rate calculation engine computes delivery charges dynamically without hardcoded constants. It executes a five-stage computational pipeline:

Volumetric Weight Calculation: Lightweight, high-volume items consume significant cargo space in transit vehicles. The engine applies the International Air Transport Association (IATA) standard cubic conversion formula: 
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
 
Chargeable Weight Determination: To protect carrier margins while remaining fair to shippers, the billable weight is resolved as the maximum between physical scale weight and volumetric weight: 
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
Zone-Based Rate Card Resolution: The system compares origin and destination zones. If Pickup Zone equals Drop Zone, it queries the Intra-Zone rate card (reflecting local hub dispatch). Otherwise, it applies the Inter-Zone rate card (reflecting multi-hub long-haul trunk transit). Rates are partitioned into B2C (retail packages) and B2B (palletized enterprise shipments with higher base allowances).
Weight Slab and Surcharge Pricing: Any weight exceeding the base allowance (1.0 kg for B2C, 2.0 kg for B2B) is billed per additional kilogram slab. If Cash on Delivery (COD) is chosen, an admin-configured cash handling surcharge is appended.
Taxation and Breakdown: A standard 18% Goods and Services Tax (GST) is calculated on the subtotal. The complete itemized breakdown is returned to the client before the user commits to booking.
2. Zone Detection Approach
Urban delivery networks are divided into macro geographic zones:

North Zone: Central Delhi, Connaught Place, Rohini
South Zone: Saket, Hauz Khas, Gurugram Cyber Hub
West Zone: Rajouri Garden, Janakpuri, Dwarka
East Zone: Preet Vihar, Anand Vihar Freight Terminal
When a shipment is booked:

The system evaluates whether Pickup Zone equals Drop Zone.
Intra-Zone Deliveries skip central hub sorting and are dispatched directly from local dark stores or pickup stations, allowing lower base rates and faster turnaround.
Inter-Zone Deliveries route through intermediary sorting terminals, invoking inter-zone tariff schedules.
Administrators can assign new postal areas or modify zone boundaries through the admin hub without modifying core application code.

3. Intelligent Auto-Assignment Logic
The auto-assignment algorithm optimizes courier dispatch through multi-attribute scoring to maximize on-time delivery rates while balancing fleet workload:

Zone Proximity Match: Agents whose assigned hub matches the order's pickup zone receive primary preference to minimize deadhead travel distance.
Availability Filtering: Couriers currently marked as Available are prioritized over Busy agents.
Workload Balancing: To prevent delivery bottlenecks, active parcel counts are evaluated, selecting agents with lower active loads.
Vehicle and Cargo Suitability: For heavier cargo or B2B consignments, larger capacity vehicles (Delivery Vans and Mini Trucks) receive priority over two-wheelers.
The agent achieving the highest composite match is automatically bound to the shipment, transitioning the status to Assigned with zero manual dispatcher intervention.

4. Failed Delivery Handling and Rescheduling Flow
Failed deliveries represent a major operational challenge in last-mile logistics. The platform implements an automated closed-loop recovery workflow:

Failure Flagging: When a courier is unable to complete a handover (e.g., customer unavailable, incorrect address, COD refusal), the courier marks the order as FAILED.
Customer Alert: An alert is triggered for the customer containing a direct reschedule action.
Self-Service Rescheduling: The customer accesses their dashboard or tracking screen, where a reschedule interface prompts them to choose a new delivery date.
Re-Queuing and Agent Reassignment: Upon submission, the order transitions to Rescheduled. The assignment engine automatically matches a courier for the rescheduled date attempt.
Immutable Audit Trail: Every single event is permanently logged with an immutable record containing timestamp, actor, and status description.