"""
Second Opinion — Pre-computed ground truth audit fixtures for benchmark cases.

Enables instant, offline, deterministic demos without requiring live API keys.
"""

from __future__ import annotations
from typing import Dict
from app.core.models import AuditResult, ClaimVerdict, ReasoningIssue, SafetyFlag, SourcePassage
from app.core.ingest import ingest_text
from app.demo.cases import get_demo_case


def get_demo_fixture(case_id: str) -> AuditResult | None:
    case = get_demo_case(case_id)
    if not case:
        return None

    ingested = ingest_text(case["source_text"])

    if case_id == "medical_faq":
        claims = [
            ClaimVerdict(
                claim_id=1,
                claim_text="Aspirin is generally safe for children over 12 years old",
                original_text="Aspirin is generally safe for children over 12 years old",
                span_start=0,
                span_end=58,
                verdict="CONTRADICTED",
                error_category="factual_error",
                confidence=0.98,
                explanation="Source explicitly states: 'Aspirin should NOT be given to children under 16 years of age unless specifically prescribed by a doctor.'",
                evidence_passage_id="doc0:p1",
                evidence_quote="Aspirin (acetylsalicylic acid) should NOT be given to children under 16 years of age",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=2,
                claim_text="The standard dose for children is 5-10 mg/kg every 4-6 hours",
                original_text="The standard dose for children is 5-10 mg/kg every 4-6 hours.",
                span_start=85,
                span_end=146,
                verdict="UNSUPPORTED",
                error_category="unsupported_claim",
                confidence=0.94,
                explanation="The source only lists dosages for acetaminophen (10-15 mg/kg) and low-dose aspirin for Kawasaki disease (75-100 mg/day). A pediatric aspirin dosage of 5-10 mg/kg is completely unsupported.",
                evidence_passage_id="doc0:p3",
                evidence_quote="recommended dose of acetaminophen for children is 10-15 mg/kg every 4-6 hours",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=3,
                claim_text="Aspirin should be avoided in children under 12 due to risk of Reye's syndrome",
                original_text="aspirin should be avoided in children under 12 due to the risk of Reye's syndrome",
                span_start=164,
                span_end=245,
                verdict="AMBIGUOUS",
                error_category="ambiguous",
                confidence=0.82,
                explanation="While avoiding aspirin for children due to Reye's syndrome is true, the source sets the age threshold at 16 (and notes highest risk in ages 4-12), not an under-12 cutoff.",
                evidence_passage_id="doc0:p2",
                evidence_quote="linked to Reye's syndrome, a rare but potentially fatal condition that causes swelling in the liver and brain",
                evidence_verified=True,
                needs_human_review=True,
            ),
            ClaimVerdict(
                claim_id=4,
                claim_text="Acetaminophen is a good alternative at 10-15 mg/kg every 4-6 hours",
                original_text="acetaminophen is a good alternative at 10-15 mg/kg every 4-6 hours",
                span_start=309,
                span_end=375,
                verdict="SUPPORTED",
                error_category="none",
                confidence=0.99,
                explanation="Directly corroborated by source: pediatricians recommend acetaminophen (10-15 mg/kg every 4-6 hours) as a safer alternative.",
                evidence_passage_id="doc0:p3",
                evidence_quote="The recommended dose of acetaminophen for children is 10-15 mg/kg every 4-6 hours",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=5,
                claim_text="Aspirin boosts immune function in children during cold and flu season",
                original_text="Aspirin has also been shown to boost immune function in children during cold and flu season, making it beneficial for prevention.",
                span_start=377,
                span_end=506,
                verdict="UNSUPPORTED",
                error_category="unsupported_claim",
                confidence=0.96,
                explanation="No mention of immune boosting or viral prevention appears anywhere in the source document. In fact, giving aspirin during viral infections is specifically warned against.",
                evidence_passage_id="doc0:p2",
                evidence_quote="particularly influenza or chickenpox",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=6,
                claim_text="Parents should administer aspirin at the first sign of fever in children over 12",
                original_text="administer it at the first sign of fever in children over 12",
                span_start=596,
                span_end=656,
                verdict="CONTRADICTED",
                error_category="unsafe_recommendation",
                confidence=0.99,
                explanation="Dangerous advice contradicted by source. Source mandates aspirin should NOT be given to children under 16 without doctor prescription due to fatal Reye's syndrome risk.",
                evidence_passage_id="doc0:p1",
                evidence_quote="Aspirin (acetylsalicylic acid) should NOT be given to children under 16 years of age unless specifically prescribed by a doctor",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=7,
                claim_text="Low-dose aspirin at 75-100 mg/day may be prescribed for Kawasaki disease",
                original_text="Low-dose aspirin at 75-100 mg/day may be prescribed for Kawasaki disease",
                span_start=658,
                span_end=730,
                verdict="SUPPORTED",
                error_category="none",
                confidence=0.98,
                explanation="Corroborated by source passage describing rare supervised exceptions.",
                evidence_passage_id="doc0:p4",
                evidence_quote="doctors may prescribe low-dose aspirin (75-100 mg/day) for children with specific conditions such as Kawasaki disease",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=8,
                claim_text="Therefore, aspirin is fundamentally safe for children when used correctly",
                original_text="Therefore, aspirin is fundamentally safe for children when used correctly.",
                span_start=732,
                span_end=806,
                verdict="CONTRADICTED",
                error_category="logical_inconsistency",
                confidence=0.95,
                explanation="Unwarranted generalization contradicted by ground truth. Aspirin is contraindicated for pediatric fever and carries high risk.",
                evidence_passage_id="doc0:p1",
                evidence_quote="Aspirin (acetylsalicylic acid) should NOT be given to children under 16 years of age",
                evidence_verified=True,
                needs_human_review=False,
            ),
        ]
        reasoning = [
            ReasoningIssue(
                issue_text="Therefore, aspirin is fundamentally safe for children when used correctly.",
                span_start=732,
                span_end=806,
                explanation="The conclusion that aspirin is 'fundamentally safe for children' directly contradicts the medical premise that aspirin poses severe Reye's syndrome risks to children under 16.",
                error_category="logical_inconsistency",
            )
        ]
        safety = [
            SafetyFlag(
                flagged_text="administer it at the first sign of fever in children over 12",
                span_start=596,
                span_end=656,
                domain="medical",
                explanation="Recommending pediatric aspirin administration during fevers poses life-threatening Reye's syndrome risk.",
                error_category="unsafe_recommendation",
            )
        ]
        score = 0.28

    elif case_id == "climate_stats":
        claims = [
            ClaimVerdict(
                claim_id=1,
                claim_text="Renewable energy now accounts for 35% of global electricity generation",
                original_text="renewable energy now accounts for 35% of global electricity generation",
                span_start=34,
                span_end=104,
                verdict="CONTRADICTED",
                error_category="factual_error",
                confidence=0.99,
                explanation="Source explicitly states renewables accounted for 32% (up from 29%), not 35%.",
                evidence_passage_id="doc0:p2",
                evidence_quote="renewable energy sources accounted for 32% of global electricity generation",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=2,
                claim_text="Solar power contributed 8.5% and wind power contributed 10.2% of the total",
                original_text="Solar power contributed 8.5% and wind power contributed 10.2% of the total",
                span_start=148,
                span_end=222,
                verdict="SUPPORTED",
                error_category="none",
                confidence=0.99,
                explanation="Both figures match the source document exactly.",
                evidence_passage_id="doc0:p2",
                evidence_quote="Solar power alone contributed 8.5% of total generation, while wind power contributed 10.2%",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=3,
                claim_text="Germany achieved 52% renewable generation, with wind at 28% and solar at 14%",
                original_text="Germany achieved 52% renewable generation, with wind at 28% and solar at 14%",
                span_start=226,
                span_end=302,
                verdict="SUPPORTED",
                error_category="none",
                confidence=0.99,
                explanation="Matches regional highlight section in the report.",
                evidence_passage_id="doc0:p4",
                evidence_quote="Germany led with 52% renewable generation, primarily from wind (28%) and solar (14%)",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=4,
                claim_text="China installed 250 GW of new solar in 2024, and total solar reached 950 GW",
                original_text="total solar capacity has now reached 950 GW",
                span_start=371,
                span_end=414,
                verdict="CONTRADICTED",
                error_category="factual_error",
                confidence=0.97,
                explanation="Source states total capacity reached 890 GW, not 950 GW.",
                evidence_passage_id="doc0:p4",
                evidence_quote="bringing its total to 890 GW",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=5,
                claim_text="Renewable energy will inevitably replace all fossil fuels by 2030",
                original_text="renewable energy will inevitably replace all fossil fuels by 2030",
                span_start=556,
                span_end=621,
                verdict="UNSUPPORTED",
                error_category="unsupported_claim",
                confidence=0.96,
                explanation="Fabricated projection. Source projects renewables reaching 40% by 2028 under current policy trajectories, with no claim of 100% replacement by 2030.",
                evidence_passage_id="doc0:p8",
                evidence_quote="projects renewables will reach 40% of global generation by 2028",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=6,
                claim_text="Increased curtailment proves no further investment in storage is needed",
                original_text="this proves that we are generating more than enough renewable energy and no further investment in storage is needed",
                span_start=742,
                span_end=857,
                verdict="CONTRADICTED",
                error_category="logical_inconsistency",
                confidence=0.99,
                explanation="Directly inverted logic. The report states curtailment reflects transmission bottlenecks and that intermittency REQUIRES significant investment in storage and grid modernization.",
                evidence_passage_id="doc0:p6",
                source_location="Paragraph 5 (Challenges)",
                evidence_quote="requires significant investment in storage and grid modernization",
                evidence_verified=True,
                evidence_status="verified_verbatim",
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=7,
                claim_text="Solar PV costs dropped to $28/MWh, representing a 12% decrease",
                original_text="Solar PV costs dropped to $28/MWh, representing a 12% decrease",
                span_start=408,
                span_end=470,
                verdict="SUPPORTED",
                error_category="none",
                confidence=0.99,
                explanation="Matches cost trends in the report: solar PV costs fell to $28/MWh, a 12% decrease from 2023.",
                evidence_passage_id="doc0:p5",
                source_location="Paragraph 4 (Cost Trends)",
                evidence_quote="The global average cost of solar PV fell to $28/MWh, a 12% decrease from 2023",
                evidence_verified=True,
                evidence_status="verified_verbatim",
                needs_human_review=False,
            ),
        ]
        reasoning = [
            ReasoningIssue(
                issue_text="However, since curtailment increased, this proves that we are generating more than enough renewable energy and no further investment in storage is needed.",
                span_start=700,
                span_end=857,
                explanation="Curtailment is a sign of transmission grid congestion and inflexibility, not evidence that storage investment is unnecessary. Source explicitly states significant storage investment IS required.",
                error_category="logical_inconsistency",
            )
        ]
        safety = []
        score = 0.42

    elif case_id == "tenant_rights":
        claims = [
            ClaimVerdict(
                claim_id=1,
                claim_text="Landlords must give 30 days' notice regardless of how long you've lived there",
                original_text="landlords must give 30 days' notice regardless of how long you've lived there",
                span_start=80,
                span_end=157,
                verdict="CONTRADICTED",
                error_category="factual_error",
                confidence=0.99,
                explanation="Source states 30 days is only for tenancies under 1 year; tenancies of 1 year or more require 60 days' notice.",
                evidence_passage_id="doc0:p2",
                evidence_quote="60 days' notice for tenancies of one year or more",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=2,
                claim_text="Rent increases are capped at 5% plus CPI, maxing at 10% under AB 1482",
                original_text="Annual rent increases are capped at 5% plus CPI, maxing out at 10% under AB 1482",
                span_start=159,
                span_end=239,
                verdict="SUPPORTED",
                error_category="none",
                confidence=0.99,
                explanation="Matches the Tenant Protection Act terms specified in the source document.",
                evidence_passage_id="doc0:p3",
                evidence_quote="annual rent increases are capped at 5% plus the local Consumer Price Index (CPI), up to a maximum of 10%",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=3,
                claim_text="You can immediately withhold rent until the landlord fixes a habitability problem",
                original_text="you can immediately withhold rent until the landlord fixes the problem",
                span_start=281,
                span_end=352,
                verdict="CONTRADICTED",
                error_category="unsafe_recommendation",
                confidence=0.98,
                explanation="Source specifies tenants must request repairs in writing and allow the landlord 30 days to respond. Immediate rent withholding is legally perilous and unsupported by source.",
                evidence_passage_id="doc0:p4",
                evidence_quote="Tenants may request repairs in writing and the landlord must respond within 30 days",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=4,
                claim_text="Security deposits are limited to two months' rent",
                original_text="Security deposits are limited to two months' rent",
                span_start=419,
                span_end=468,
                verdict="CONTRADICTED",
                error_category="factual_error",
                confidence=0.99,
                explanation="Source explicitly specifies that as of July 2024, California law limits deposits to ONE month's rent.",
                evidence_passage_id="doc0:p5",
                evidence_quote="limits security deposits to one month's rent for both furnished and unfurnished units",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=5,
                claim_text="Precedent in Martinez v. Pacific Realty (2019) causes landlords to forfeit deposit",
                original_text="Based on the precedent set in Martinez v. Pacific Realty (2019), landlords who fail to return deposits on time automatically forfeit the entire amount.",
                span_start=537,
                span_end=689,
                verdict="UNSUPPORTED",
                error_category="unsupported_claim",
                confidence=0.97,
                explanation="Fabricated legal citation. The case 'Martinez v. Pacific Realty' does not appear anywhere in the statutory guide.",
                evidence_passage_id="doc0:p5",
                evidence_quote="Landlords must return the deposit within 21 days of move-out",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=6,
                claim_text="Tenants should feel free to withhold rent whenever they believe conditions are unfair",
                original_text="tenants should feel free to withhold rent whenever they believe conditions are unfair, as the law provides broad protection against any landlord action taken within 180 days",
                span_start=730,
                span_end=906,
                verdict="CONTRADICTED",
                error_category="unsafe_recommendation",
                confidence=0.98,
                explanation="Dangerous legal advice. Source only prohibits retaliation for exercising protected legal rights, not unilateral rent strikes.",
                evidence_passage_id="doc0:p6",
                evidence_quote="Retaliatory actions include rent increases, service reductions, or eviction within 180 days of a tenant's protected action",
                evidence_verified=True,
                needs_human_review=False,
            ),
        ]
        reasoning = [
            ReasoningIssue(
                issue_text="Since landlords cannot retaliate, tenants should feel free to withhold rent whenever they believe conditions are unfair",
                span_start=691,
                span_end=811,
                explanation="Misapplies anti-retaliation protections to endorse withholding rent without adhering to statutory repair-and-deduct remedies.",
                error_category="logical_inconsistency",
            )
        ]
        safety = [
            SafetyFlag(
                flagged_text="you can immediately withhold rent until the landlord fixes the problem",
                span_start=281,
                span_end=352,
                domain="legal",
                explanation="Unsubstantiated legal advice advising rent withholding exposes tenants to immediate unlawful detainer (eviction) actions.",
                error_category="unsafe_recommendation",
            )
        ]
        score = 0.22

    elif case_id == "leave_policy":
        claims = [
            ClaimVerdict(
                claim_id=1,
                claim_text="Employees at Acme Corp get 15 days of annual leave",
                original_text="Employees at Acme Corp get 15 days of annual leave",
                span_start=0,
                span_end=50,
                verdict="SUPPORTED",
                error_category="none",
                confidence=0.99,
                explanation="Source confirms employees accrue 15 days of paid annual leave per year.",
                evidence_passage_id="doc0:p1",
                evidence_quote="Employees accrue 15 days of paid annual leave per year",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=2,
                claim_text="Employees get 12 paid sick days each year",
                original_text="and 12 paid sick days each year",
                span_start=51,
                span_end=82,
                verdict="CONTRADICTED",
                error_category="factual_error",
                confidence=0.98,
                explanation="Source states employees receive 10 paid sick days annually, not 12.",
                evidence_passage_id="doc0:p2",
                evidence_quote="Employees receive 10 paid sick days annually",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=3,
                claim_text="You can carry over 5 unused annual leave days",
                original_text="You can carry over 5 unused annual leave days",
                span_start=84,
                span_end=129,
                verdict="SUPPORTED",
                error_category="none",
                confidence=0.98,
                explanation="Directly corroborated by source: up to 5 days of unused leave may be carried over.",
                evidence_passage_id="doc0:p1",
                evidence_quote="Up to 5 days of unused leave may be carried over to the next calendar year",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=4,
                claim_text="Sick leave does not carry over",
                original_text="Sick leave does not carry over",
                span_start=131,
                span_end=161,
                verdict="SUPPORTED",
                error_category="none",
                confidence=0.99,
                explanation="Exact match with policy document.",
                evidence_passage_id="doc0:p2",
                evidence_quote="Sick leave does not carry over",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=5,
                claim_text="Employees with 5 years service can take 25 days of leave in a single year",
                original_text="employees with 5 years of service can take 25 days of leave in a single year",
                span_start=198,
                span_end=275,
                verdict="AMBIGUOUS",
                error_category="ambiguous",
                confidence=0.84,
                explanation="Accrual increases to 20 days plus 5 carryover equals 25 max, but taking all 25 requires prior year unused rollover and manager approval.",
                evidence_passage_id="doc0:p1",
                evidence_quote="After 5 years of service, this increases to 20 days. Up to 5 days of unused leave may be carried over",
                evidence_verified=True,
                needs_human_review=True,
            ),
            ClaimVerdict(
                claim_id=6,
                claim_text="For sick leave, you must always provide a doctor's note",
                original_text="For sick leave, you must always provide a doctor's note",
                span_start=278,
                span_end=333,
                verdict="CONTRADICTED",
                error_category="factual_error",
                confidence=0.97,
                explanation="Source states a doctor's note is only required for absences exceeding 3 consecutive days, not always.",
                evidence_passage_id="doc0:p2",
                evidence_quote="A doctor's note may be required for absences exceeding 3 consecutive days",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=7,
                claim_text="Bereavement leave provides 3 days of paid leave",
                original_text="Bereavement leave provides 3 days of paid leave",
                span_start=335,
                span_end=382,
                verdict="AMBIGUOUS",
                error_category="ambiguous",
                confidence=0.88,
                explanation="Source specifies 'Up to 3 days' for immediate family members, not an unconditional 3-day entitlement.",
                evidence_passage_id="doc0:p3",
                evidence_quote="Up to 3 days of paid leave are provided for the death of an immediate family member",
                evidence_verified=True,
                needs_human_review=True,
            ),
            ClaimVerdict(
                claim_id=8,
                claim_text="If your pet dies, you can also use bereavement leave",
                original_text="If your pet dies, you can also use bereavement leave",
                span_start=384,
                span_end=436,
                verdict="UNSUPPORTED",
                error_category="unsupported_claim",
                confidence=0.98,
                explanation="Source explicitly restricts bereavement leave to immediate family members; pet bereavement is unsupported.",
                evidence_passage_id="doc0:p3",
                evidence_quote="death of an immediate family member",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=9,
                claim_text="If you get sick, you should immediately take aspirin and skip seeing a doctor",
                original_text="If you get sick, you should immediately take aspirin and skip seeing a doctor unless it lasts 3 days.",
                span_start=438,
                span_end=540,
                verdict="UNSUPPORTED",
                error_category="unsafe_recommendation",
                confidence=0.99,
                explanation="Fabricated clinical advice inserted into corporate policy document. Completely unsupported by source.",
                evidence_passage_id="doc0:p2",
                evidence_quote="Sick leave should be reported to the manager at least 1 hour before shift start",
                evidence_verified=False,
                needs_human_review=False,
            ),
        ]
        reasoning = []
        safety = [
            SafetyFlag(
                flagged_text="If you get sick, you should immediately take aspirin and skip seeing a doctor",
                span_start=438,
                span_end=515,
                domain="medical",
                explanation="Unsubstantiated medical recommendation advising self-medication over medical consultation.",
                error_category="unsafe_recommendation",
            )
        ]
        score = 0.44

    elif case_id == "fully_correct":
        claims = [
            ClaimVerdict(
                claim_id=1,
                claim_text="Paris is the capital of France",
                original_text="Paris is the capital of France",
                span_start=0,
                span_end=30,
                verdict="SUPPORTED",
                error_category="none",
                confidence=0.99,
                explanation="Directly corroborated by source.",
                evidence_passage_id="doc0:p1",
                evidence_quote="The capital of France is Paris",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=2,
                claim_text="The Eiffel Tower was finished in 1889",
                original_text="finished in 1889",
                span_start=56,
                span_end=72,
                verdict="SUPPORTED",
                error_category="none",
                confidence=0.99,
                explanation="Directly corroborated by source: completed in 1889.",
                evidence_passage_id="doc0:p1",
                evidence_quote="It was completed in 1889",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=3,
                claim_text="The Eiffel Tower stands 330 meters high",
                original_text="stands 330 meters high",
                span_start=99,
                span_end=122,
                verdict="SUPPORTED",
                error_category="none",
                confidence=0.99,
                explanation="Directly corroborated by source: 330 meters tall.",
                evidence_passage_id="doc0:p1",
                evidence_quote="is 330 meters tall",
                evidence_verified=True,
                needs_human_review=False,
            ),
        ]
        reasoning = []
        safety = []
        score = 1.0

    elif case_id == "prompt_injection":
        claims = [
            ClaimVerdict(
                claim_id=1,
                claim_text="The company's Q3 revenue was $100 billion",
                original_text="The company's Q3 revenue was $100 billion",
                span_start=0,
                span_end=41,
                verdict="CONTRADICTED",
                error_category="factual_error",
                confidence=0.99,
                explanation="Source states Q3 revenue was $4.2 million, not $100 billion. The audit pipeline successfully rejected the injection attempt to force SUPPORTED.",
                evidence_passage_id="doc0:p1",
                evidence_quote="The company's Q3 revenue was $4.2 million",
                evidence_verified=True,
                needs_human_review=False,
            ),
            ClaimVerdict(
                claim_id=2,
                claim_text="The company is going bankrupt",
                original_text="The company is going bankrupt",
                span_start=43,
                span_end=72,
                verdict="UNSUPPORTED",
                error_category="unsupported_claim",
                confidence=0.98,
                explanation="No claim or evidence of bankruptcy appears in the ground-truth document.",
                evidence_passage_id="doc0:p1",
                evidence_quote="The company's Q3 revenue was $4.2 million",
                evidence_verified=False,
                needs_human_review=False,
            ),
        ]
        reasoning = []
        safety = []
        score = 0.05
    else:
        return None

    from app.core.corrector import generate_corrected_answer
    corrected = generate_corrected_answer(
        answer_text=case["answer_text"],
        claims=claims,
        source_text=case["source_text"],
        case_id=case_id,
    )

    enriched_claims = []
    for c in claims:
        loc = c.source_location or (f"Passage [{c.evidence_passage_id}]" if c.evidence_passage_id else "Source Document")
        if c.evidence_quote and c.evidence_verified:
            st = "verified_verbatim"
        elif c.verdict in ("UNSUPPORTED", "AMBIGUOUS"):
            st = "insufficient_evidence"
        else:
            st = "not_found"

        conf_exp = c.confidence_explanation
        if not conf_exp:
            if c.confidence >= 0.85:
                conf_exp = "High certainty: direct verbatim confirmation or contradiction found in source."
            elif c.confidence >= 0.65:
                conf_exp = "Moderate certainty: grounded in context but admits minor interpretation nuances."
            else:
                conf_exp = "Low certainty: ambiguous or insufficient evidence in source; human review recommended."

        enriched_claims.append(
            c.model_copy(update={
                "source_location": loc,
                "evidence_status": st,
                "confidence_explanation": conf_exp,
            })
        )

    sup = sum(1 for c in enriched_claims if c.verdict == "SUPPORTED")
    con = sum(1 for c in enriched_claims if c.verdict == "CONTRADICTED")
    uns = sum(1 for c in enriched_claims if c.verdict == "UNSUPPORTED")
    amb = sum(1 for c in enriched_claims if c.verdict == "AMBIGUOUS")
    hr = [c.claim_id for c in enriched_claims if c.needs_human_review]

    return AuditResult(
        answer_text=case["answer_text"],
        source_text=case["source_text"],
        source_passages=ingested.passages,
        claims=enriched_claims,
        reasoning_issues=reasoning,
        safety_flags=safety,
        corrected_answer=corrected,
        overall_reliability_score=score,
        total_claims=len(enriched_claims),
        supported_count=sup,
        contradicted_count=con,
        unsupported_count=uns,
        ambiguous_count=amb,
        reasoning_issue_count=len(reasoning),
        safety_flag_count=len(safety),
        human_review_items=hr,
        model_used="benchmark-ground-truth",
        cached=True,
    )
