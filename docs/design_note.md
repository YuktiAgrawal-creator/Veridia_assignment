# Engineering Design Note: Veridia Match Architecture

**Author:** Senior Product Engineer Candidate  
**Platform:** Veridia Match — Precision Engineering Matchmaking  
**Domain:** Cross-Border B2B Industrial Sourcing (India to International Buyers)  

---

## 1. Target Audience & Stakeholder Persona
Veridia Match is designed for **international technical procurement managers, supply chain directors, and industrial sourcing engineers** (primarily in North America, Europe, and East Asia) sourcing custom-machined mechanical parts from India. 

These users operate under strict contractual, regulatory, and budgetary constraints. Unlike consumers purchasing off-the-shelf goods, industrial buyers face severe repercussions if a supplier fails an AS9100 aerospace audit, lacks CNC five-axis precision, or bottlenecks batch production. Consequently, our users demand **zero tolerance for subjective recommendations, total transparency in qualification criteria, and defensible audit trails**.

---

## 2. Architectural Decisions & Rationale
We selected a clean, decoupled architecture consisting of a **React + Vite SPA frontend**, a **FastAPI backend layer**, and a **pure-Python deterministic matching engine** backed by an in-memory snapshot and **SQLite ACID persistence**.

### Architectural Rationale:
1. **Separation of Presentation and Computation:** The React frontend communicates strictly over standardized REST JSON contracts. Frontend updates never risk mutating business matching rules or bypassing data validation.
2. **Read-Only Dataset Snapshot in Memory:** The 1,000-manufacturer dataset is loaded once into a thread-safe `DatasetStore`. Matching operations treat this snapshot as strictly immutable, enabling instantaneous evaluation (<15ms per match) with zero disk-lock overhead.
3. **Deterministic Persistence via SQLite:** Every buyer request is assigned a UUID `request_id`, captured alongside its exact inputs and a frozen `evaluation_date`. SQLite guarantees durability and provides instant retrieval for audits and supplier comparisons.
4. **Predictable Python Typing:** Strict Pydantic models validate buyer inputs at runtime, rejecting malformed requests (e.g., negative batch sizes, blank strings) before hitting computational logic.

---

## 3. Why Eligibility Filtering is Separated from Ranking
A foundational design choice in Veridia Match is the **strict two-stage architecture**:

$$\text{All Manufacturers (1,000)} \xrightarrow{\text{Stage 1: Hard Filter}} \text{Qualified Candidates} \xrightarrow{\text{Stage 2: Weighted Scorer}} \text{Ranked Recommendations}$$

### Engineering Rationale:
In B2B industrial procurement, **trade-offs are only permissible among qualified candidates, never across mandatory constraints**:
- A manufacturer with a perfect 100% on-time delivery rate who *does not work with titanium* cannot manufacture a titanium turbine blade. 
- A supplier with massive monthly capacity whose *ISO 9001 certification expired six months ago* cannot legally produce automotive components for an OEM.

If hard constraints were blended directly into a weighted linear sum, an ineligible supplier could achieve a passing composite score through high delivery or capacity points alone. Separating Stage 1 (hard boolean satisfaction) from Stage 2 (continuous compatibility scoring) guarantees zero false qualifications while preserving nuanced differentiation among true candidates.

---

## 4. Certification Expiry Governance
Quality certifications are evaluated against a fixed `evaluation_date` using the invariant:

$$\text{issue\_date} \le \text{evaluation\_date} \le \text{expiry\_date}$$

### Handling Imperfect Real-World Dates:
- **Missing or Malformed Expiry Dates:** In adherence to our zero-hallucination policy, missing expiry data is *never* assumed valid. The supplier is classified as `NEEDS_VERIFICATION`.
- **Evaluation Date Immutability:** When a match is initiated, the evaluation date is permanently recorded in the database. When retrieving a historical request 6 months later, the system evaluates validity against the original evaluation date, guaranteeing idempotent, reproducible results.
- **Audit Date Context:** Where `last_audit_date` is available, surveillance currency is verified and surfaced directly in the buyer's explanation dossier.

---

## 5. Multiple Buyer Concurrency & Request Isolation
To ensure high-throughput concurrent access without cross-contamination:
- **No Shared Mutable State:** Matching requests carry no module-level global variables. Each buyer request instantiates an isolated `MatchEngine` execution scope using read-only dataset snapshots.
- **Independent Request Identities:** Every request receives a cryptographically unique UUID. Concurrent threads running disparate RFQs (e.g., Buyer A sourcing Aluminium CNC vs. Buyer B sourcing Stainless Sheet Metal) execute independently in parallel.
- **Thread Safety:** Automated concurrency tests verify simultaneous multi-threaded execution with zero requirement leakage or state contamination.

---

## 6. Handling Imperfect Dataset Records
Real-world datasets are inherently messy. Rather than discarding or silently altering imperfect records, Veridia Match applies principled governance:

1. **Duplicate Manufacturer IDs (10 Collision Keys / 20 Distinct Companies):**
   - *Investigation:* Analysis proved these represent distinct legal entities (different names, cities, capacities, and materials) that received non-unique IDs during upstream data entry.
   - *Strategy:* The original ID is preserved for external client traceability while generating a deterministic `record_id` internally. Both companies remain fully matchable without row collision.
2. **Missing Lead Times (10 Records / 1.0%):**
   - *Strategy:* Never assume missing turnaround satisfies a deadline. Such records are tagged with status `NEEDS_VERIFICATION` and awarded neutral baseline points, alerting procurement to conduct manual follow-up.
3. **Out-of-Bounds Metrics (10 Records with OTD > 100%):**
   - *Strategy:* Historical percentages up to 142.6% are mathematically clamped to 100.0% during scoring, and an explicit audit caveat is appended to the supplier profile.
4. **Destination Country Limitation:**
   - *Strategy:* All suppliers reside in India. While export history is verified, the dataset does not record country-specific shipping transit days. This limitation is explicitly stated in product warnings.

---

## 7. Role of Artificial Intelligence: Optional & Constrained
In Veridia Match, AI is treated strictly as an **interaction enhancer**, never a decision-maker:
- **Permitted AI Use:** Natural language RFQ extraction (converting conversational buyer prompts into structured parameters) and formatting human-readable summaries.
- **Prohibited AI Use:** An LLM is never allowed to determine certification validity, calculate capacity thresholds, or assign match ranks. 
- **Deterministic Reliability:** The core platform operates with 100% functionality without requiring external AI API keys or third-party cloud services.

---

## 8. What Was Deliberately Left Out and Why
1. **Unsafe Fuzzy String Matching:** Algorithms like Levenshtein distance were deliberately omitted for materials and processes. Fuzzy matching can silently map unrelated terms (e.g., "cast iron" to "casting"), causing costly manufacturing errors. We enforce strict canonical synonym dictionaries.
2. **Complex Multi-Echelon Supply Chain Tiers:** Second- and third-tier sub-tier supplier tracing was excluded because the dataset represents single-tier precision manufacturing shops.
3. **Automated RFQ Bidding / Pricing Engine:** The dataset provides capacity and lead time, but not raw material pricing formulas or part geometry drawings. Fabricating price estimates without CAD files would mislead buyers.

---

## 9. Success Metrics & Validation
If deployed in production at Veridia, success would be measured across four operational vectors:
1. **Qualification Precision:** Zero instances of an unqualified or expired supplier reaching the final supplier shortlist.
2. **RFQ-to-Quote Turnaround:** Reduction of manual sourcing time from 48 hours to under 30 seconds.
3. **Supplier Verification Accuracy:** Percentage of `NEEDS_VERIFICATION` flags correctly resolved upon direct supplier contact.
4. **Buyer Adoption:** Repeat RFQ submissions and shortlist-to-contract conversion rates.

---

## 10. Future Improvements
- **CAD File Dimension Analysis:** Integrating an automated step/dxf file parser to calculate bounding box dimensions and machine envelope compatibility.
- **Live ERP Webhooks:** Direct integrations with SAP / Oracle / Tally ERP systems at Indian manufacturing clusters for live capacity and machine utilization feeds.
- **Port-to-Port Freight Estimator:** Connecting Indian sea/air cargo freight tables (Nhava Sheva, Chennai Port) to calculate door-to-door transit schedules for destination countries.
