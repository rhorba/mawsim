# decisions
## ADR-01: pgvector for RFQ-to-listing matching
Product embeddings enable semantic matching ("blé dur Karim" matches "blé dur grade A Gharb").
Better than string matching for agricultural product variety names.

## ADR-02: Escrow is 30% deposit + 70% delivery
Agricultural deals have delivery risk. Protects both parties.
Two payment events in state machine. No shortcut to full release.

## ADR-03: Price board is public SSR — primary acquisition hook
Price transparency brings farmers in. No login required. Cached for performance on 3G.

## ADR-04: Contract PDF is bilingual FR/AR
Legal requirement and trust signal. Generated server-side with @react-pdf/renderer.
Hash stored for tamper detection.

## ADR-05: Platform commission is fixed and transparent
2.5% buyer + 1.5% farmer = 4% total. Below typical intermediary margin (15-30%).
Stated explicitly everywhere. Non-negotiable in v0.1.
