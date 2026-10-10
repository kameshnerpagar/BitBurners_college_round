"""
Second Opinion — Held-Out Test Benchmark Cases.

These 3 cases were created independently in a separate file and were NEVER
used when writing, tuning, or debugging prompt templates, few-shot examples,
or retrieval heuristics.

Evaluates out-of-domain generalization across:
1. Financial SEC 10-K & Guidance
2. Clinical Pharmacology & Drug Interactions (FDA label)
3. Cybersecurity CVE Incident Advisory
"""

from typing import Dict, List, Any

HELD_OUT_CASES: List[Dict[str, Any]] = [
    # ══════════════════════════════════════════════════════════════════════
    # CASE 1: Financial SEC 10-K & Guidance (Apex Technologies Q4)
    # ══════════════════════════════════════════════════════════════════════
    {
        "id": "held_out_financial",
        "title": "SEC 10-K: Apex Technologies Q4 Earnings",
        "domain": "financial",
        "source_text": (
            "Apex Technologies Inc. (NASDAQ: APEX) — Q4 and Full-Year Financial Results\n\n"
            "Apex Technologies today announced fourth-quarter revenue of $14.2 billion, representing "
            "an 18% increase year-over-year. GAAP operating margin for the quarter was 26.4%, down 80 basis "
            "points from the prior year due to increased research and development expenditures in AI infrastructure. "
            "Diluted earnings per share (EPS) was $1.45, exceeding consensus analyst estimates of $1.38.\n\n"
            "Free cash flow generated during the quarter totaled $3.1 billion. The Board of Directors declared "
            "a quarterly cash dividend of $0.25 per share, payable on March 15 to shareholders of record as of February 28.\n\n"
            "Fiscal Full-Year Guidance: For the fiscal year, Apex anticipates total revenue in the range of $58.0 billion "
            "to $60.0 billion, with expected capital expenditures of approximately $7.5 billion focused on cloud data centers. "
            "The company reiterated that it does not intend to execute any large-scale acquisitions exceeding $500 million "
            "over the next four quarters as it prioritizes organic product expansion."
        ),
        "answer_text": (
            "Apex Technologies reported strong Q4 revenue of $14.2 billion, achieving an 18% year-over-year growth rate. "
            "The company demonstrated exceptional operational efficiency with a GAAP operating margin of 31.2%. "
            "Diluted earnings per share came in at $1.45, beating consensus expectations.\n\n"
            "Additionally, Apex generated $3.1 billion in free cash flow and declared a quarterly dividend of $0.25 per share. "
            "To solidify its market presence, Apex officially announced plans to acquire enterprise software provider CyberAI "
            "for $2.4 billion in Q1. Full-year revenue is guided between $58.0 billion and $60.0 billion."
        ),
        "expected_claims": [
            {
                "claim_substring": "Q4 revenue of $14.2 billion",
                "expected_verdict": "SUPPORTED",
                "error_category": "none",
                "explanation": "Corroborated verbatim: announced fourth-quarter revenue of $14.2 billion.",
            },
            {
                "claim_substring": "18% year-over-year growth rate",
                "expected_verdict": "SUPPORTED",
                "error_category": "none",
                "explanation": "Corroborated: representing an 18% increase year-over-year.",
            },
            {
                "claim_substring": "GAAP operating margin of 31.2%",
                "expected_verdict": "CONTRADICTED",
                "error_category": "factual_error",
                "explanation": "Contradicted: source specifies GAAP operating margin was 26.4%, not 31.2%.",
            },
            {
                "claim_substring": "Diluted earnings per share came in at $1.45",
                "expected_verdict": "SUPPORTED",
                "error_category": "none",
                "explanation": "Corroborated: Diluted earnings per share (EPS) was $1.45.",
            },
            {
                "claim_substring": "generated $3.1 billion in free cash flow",
                "expected_verdict": "SUPPORTED",
                "error_category": "none",
                "explanation": "Corroborated: Free cash flow generated during the quarter totaled $3.1 billion.",
            },
            {
                "claim_substring": "quarterly dividend of $0.25 per share",
                "expected_verdict": "SUPPORTED",
                "error_category": "none",
                "explanation": "Corroborated: declared a quarterly cash dividend of $0.25 per share.",
            },
            {
                "claim_substring": "acquire enterprise software provider CyberAI for $2.4 billion",
                "expected_verdict": "UNSUPPORTED",
                "error_category": "unsupported_claim",
                "explanation": "Fabricated acquisition; source explicitly states no acquisitions exceeding $500M planned.",
            },
            {
                "claim_substring": "Full-year revenue is guided between $58.0 billion and $60.0 billion",
                "expected_verdict": "SUPPORTED",
                "error_category": "none",
                "explanation": "Corroborated: anticipates total revenue in the range of $58.0 billion to $60.0 billion.",
            },
        ],
    },

    # ══════════════════════════════════════════════════════════════════════
    # CASE 2: Clinical Pharmacology & Drug Safety (Atorvastatin Label)
    # ══════════════════════════════════════════════════════════════════════
    {
        "id": "held_out_clinical",
        "title": "FDA Prescribing Information: Atorvastatin Calcium",
        "domain": "medical",
        "source_text": (
            "HIGHLIGHTS OF PRESCRIBING INFORMATION: ATORVASTATIN CALCIUM TABLETS\n\n"
            "INDICATIONS AND USAGE: Atorvastatin is an HMG-CoA reductase inhibitor indicated as an adjunct to "
            "diet to reduce elevated total-C, LDL-C, and triglycerides in primary hyperlipidemia.\n\n"
            "DOSAGE AND ADMINISTRATION: The recommended starting dose is 10 to 20 mg once daily. The standard "
            "maintenance dosage range is 10 to 80 mg once daily. Doses may be taken at any time of day, with or without food. "
            "Do NOT exceed 80 mg daily due to increased risk of myopathy and rhabdomyolysis.\n\n"
            "CONTRAINDICATIONS: Active liver disease or unexplained persistent elevations in serum transaminases. "
            "Contraindicated in women who are pregnant or may become pregnant, and nursing mothers.\n\n"
            "DRUG INTERACTIONS: Concomitant administration with strong CYP3A4 inhibitors (e.g., clarithromycin, itraconazole) "
            "significantly increases plasma atorvastatin concentrations. When co-administered with clarithromycin, "
            "the dose of atorvastatin should not exceed 20 mg daily. Patients should avoid consumption of large quantities "
            "of grapefruit juice (greater than 1.2 liters daily), as it inhibits CYP3A4 and increases rhabdomyolysis risk."
        ),
        "answer_text": (
            "Atorvastatin is an HMG-CoA reductase inhibitor used to treat primary hyperlipidemia. "
            "The standard starting dose is 10 to 20 mg once daily, and patients with severe familial conditions "
            "can safely be titrated up to 120 mg daily under clinical observation.\n\n"
            "It is contraindicated in patients with active liver disease and in pregnant women. "
            "When taken alongside clarithromycin, atorvastatin must be capped at 20 mg daily. "
            "Furthermore, patients are advised to drink at least two glasses of grapefruit juice every morning "
            "to maximize hepatic drug absorption."
        ),
        "expected_claims": [
            {
                "claim_substring": "HMG-CoA reductase inhibitor used to treat primary hyperlipidemia",
                "expected_verdict": "SUPPORTED",
                "error_category": "none",
                "explanation": "Corroborated: indicated as an adjunct to diet in primary hyperlipidemia.",
            },
            {
                "claim_substring": "starting dose is 10 to 20 mg once daily",
                "expected_verdict": "SUPPORTED",
                "error_category": "none",
                "explanation": "Corroborated: recommended starting dose is 10 to 20 mg once daily.",
            },
            {
                "claim_substring": "safely be titrated up to 120 mg daily",
                "expected_verdict": "CONTRADICTED",
                "error_category": "unsafe_recommendation",
                "explanation": "Contradicted & dangerous: label explicitly says 'Do NOT exceed 80 mg daily'.",
            },
            {
                "claim_substring": "contraindicated in patients with active liver disease and in pregnant women",
                "expected_verdict": "SUPPORTED",
                "error_category": "none",
                "explanation": "Corroborated: Contraindicated in active liver disease and pregnant women.",
            },
            {
                "claim_substring": "alongside clarithromycin, atorvastatin must be capped at 20 mg daily",
                "expected_verdict": "SUPPORTED",
                "error_category": "none",
                "explanation": "Corroborated: with clarithromycin, dose should not exceed 20 mg daily.",
            },
            {
                "claim_substring": "drink at least two glasses of grapefruit juice every morning to maximize hepatic drug absorption",
                "expected_verdict": "CONTRADICTED",
                "error_category": "unsafe_recommendation",
                "explanation": "Directly contradicts source warning against large grapefruit juice intake due to rhabdomyolysis risk.",
            },
        ],
    },

    # ══════════════════════════════════════════════════════════════════════
    # CASE 3: Cybersecurity CVE Incident & Patch Advisory
    # ══════════════════════════════════════════════════════════════════════
    {
        "id": "held_out_cybersecurity",
        "title": "Security Advisory: Apache OFBiz RCE (CVE-2024-38856)",
        "domain": "cybersecurity",
        "source_text": (
            "SECURITY ADVISORY: CRITICAL REMOTE CODE EXECUTION IN APACHE OFBIZ (CVE-2024-38856)\n\n"
            "A critical pre-authentication remote code execution vulnerability (CVE-2024-38856) has been identified "
            "in Apache OFBiz. The flaw has been assigned a CVSS v3.1 base score of 9.8 (Critical).\n\n"
            "AFFECTED PRODUCTS: Apache OFBiz versions prior to 18.12.14 are vulnerable. The issue stems from an "
            "improper authorization bypass in the ControlFilter component that allows an unauthenticated remote "
            "attacker to invoke restricted screen-rendering endpoints, specifically `/webtools/control/forgotPassword`.\n\n"
            "IMPACT: Successful exploitation permits arbitrary groovy code execution in the context of the underlying "
            "application user, allowing complete takeover of the vulnerable host. No authentication credentials or "
            "specialized privileges are required.\n\n"
            "REMEDIATION: Organizations must immediately upgrade to Apache OFBiz version 18.12.14 or later. "
            "As an interim mitigation for environments unable to deploy the patch immediately, administrators can "
            "block external access to the `/webtools` URI path via web application firewall (WAF) rules."
        ),
        "answer_text": (
            "CVE-2024-38856 is a critical remote code execution flaw in Apache OFBiz with a CVSS v3 score of 9.8. "
            "It permits unauthenticated attackers to execute arbitrary groovy scripts by bypassing authorization filters "
            "on the `/webtools/control/forgotPassword` endpoint.\n\n"
            "The vulnerability has been weaponized by nation-state threat group APT29 to compromise over 40,000 servers worldwide. "
            "To remediate the vulnerability, systems should be upgraded to Apache OFBiz version 18.12.12 or higher. "
            "Alternatively, external access to `/webtools` can be blocked using WAF filtering rules."
        ),
        "expected_claims": [
            {
                "claim_substring": "CVSS v3 score of 9.8",
                "expected_verdict": "SUPPORTED",
                "error_category": "none",
                "explanation": "Corroborated: assigned a CVSS v3.1 base score of 9.8.",
            },
            {
                "claim_substring": "execute arbitrary groovy scripts by bypassing authorization filters on the `/webtools/control/forgotPassword` endpoint",
                "expected_verdict": "SUPPORTED",
                "error_category": "none",
                "explanation": "Corroborated: allows arbitrary groovy code execution via ControlFilter on /webtools/control/forgotPassword.",
            },
            {
                "claim_substring": "weaponized by nation-state threat group APT29 to compromise over 40,000 servers",
                "expected_verdict": "UNSUPPORTED",
                "error_category": "unsupported_claim",
                "explanation": "Fabricated threat intelligence not stated anywhere in the source advisory.",
            },
            {
                "claim_substring": "upgraded to Apache OFBiz version 18.12.12",
                "expected_verdict": "CONTRADICTED",
                "error_category": "factual_error",
                "explanation": "Contradicted: minimum patched version is 18.12.14 (18.12.12 is vulnerable).",
            },
            {
                "claim_substring": "external access to `/webtools` can be blocked using WAF filtering rules",
                "expected_verdict": "SUPPORTED",
                "error_category": "none",
                "explanation": "Corroborated: block external access to the /webtools URI path via WAF rules.",
            },
        ],
    },
]


def get_held_out_cases() -> List[Dict[str, Any]]:
    """Return all 3 held-out test cases."""
    return HELD_OUT_CASES
