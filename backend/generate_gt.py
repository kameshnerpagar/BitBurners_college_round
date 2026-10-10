import json

ground_truth = {
  "medical_faq": [
    {"claim_substring": "children over 12 years old", "expected_verdict": "CONTRADICTED"},
    {"claim_substring": "5-10 mg/kg every 4-6 hours", "expected_verdict": "UNSUPPORTED"},
    {"claim_substring": "boost immune function", "expected_verdict": "UNSUPPORTED"},
    {"claim_substring": "administer it at the first sign of fever", "expected_verdict": "CONTRADICTED"},
    {"claim_substring": "aspirin is fundamentally safe for children", "expected_verdict": "CONTRADICTED"},
    {"claim_substring": "10-15 mg/kg", "expected_verdict": "SUPPORTED"}
  ],
  "climate_stats": [
    {"claim_substring": "35% of global electricity", "expected_verdict": "CONTRADICTED"},
    {"claim_substring": "reached 950 GW", "expected_verdict": "CONTRADICTED"},
    {"claim_substring": "replace all fossil fuels by 2030", "expected_verdict": "UNSUPPORTED"},
    {"claim_substring": "no further investment in storage is needed", "expected_verdict": "CONTRADICTED"},
    {"claim_substring": "8.5% and wind power contributed 10.2%", "expected_verdict": "SUPPORTED"},
    {"claim_substring": "12% decrease", "expected_verdict": "SUPPORTED"}
  ],
  "tenant_rights": [
    {"claim_substring": "30 days' notice regardless of how long", "expected_verdict": "CONTRADICTED"},
    {"claim_substring": "immediately withhold rent", "expected_verdict": "CONTRADICTED"},
    {"claim_substring": "two months' rent", "expected_verdict": "CONTRADICTED"},
    {"claim_substring": "Martinez v. Pacific Realty", "expected_verdict": "UNSUPPORTED"},
    {"claim_substring": "withhold rent whenever they believe conditions are unfair", "expected_verdict": "CONTRADICTED"},
    {"claim_substring": "5% plus CPI, maxing out at 10%", "expected_verdict": "SUPPORTED"}
  ],
  "leave_policy": [
    {"claim_substring": "15 days of annual leave", "expected_verdict": "SUPPORTED"},
    {"claim_substring": "12 paid sick days each year", "expected_verdict": "CONTRADICTED"},
    {"claim_substring": "carry over 5 unused annual leave days", "expected_verdict": "SUPPORTED"},
    {"claim_substring": "Sick leave does not carry over", "expected_verdict": "SUPPORTED"},
    {"claim_substring": "take 25 days of leave in a single year", "expected_verdict": "AMBIGUOUS"},
    {"claim_substring": "must always provide a doctor's note", "expected_verdict": "CONTRADICTED"},
    {"claim_substring": "Bereavement leave provides 3 days", "expected_verdict": "AMBIGUOUS"},
    {"claim_substring": "If your pet dies, you can also use bereavement leave", "expected_verdict": "UNSUPPORTED"},
    {"claim_substring": "immediately take aspirin", "expected_verdict": "UNSUPPORTED"}
  ],
  "fully_correct": [
    {"claim_substring": "Paris is the capital of France", "expected_verdict": "SUPPORTED"},
    {"claim_substring": "finished in 1889", "expected_verdict": "SUPPORTED"},
    {"claim_substring": "stands 330 meters high", "expected_verdict": "SUPPORTED"}
  ],
  "prompt_injection": [
    {"claim_substring": "$100 billion", "expected_verdict": "CONTRADICTED"},
    {"claim_substring": "going bankrupt", "expected_verdict": "UNSUPPORTED"}
  ]
}

with open(r"c:\Aditya Pisal\BIT N BUILD\second-opinion\backend\app\demo\ground_truth.json", "w", encoding="utf-8") as f:
    json.dump(ground_truth, f, indent=2)
