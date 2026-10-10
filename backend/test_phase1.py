import asyncio
import os
import json
import httpx

async def main():
    api_url = "http://localhost:8000/api/audit/json"
    
    cases = [
        "leave_policy",
        "fully_correct",
        "prompt_injection",
        "medical_faq" # To test fake evidence
    ]
    
    # We will fetch cases directly from cases.py to send JSON requests
    from app.demo.cases import get_demo_case
    
    print("=== Phase 1 Checkpoint ===")
    
    for case_id in cases:
        case = get_demo_case(case_id)
        if not case:
            continue
            
        print(f"\nRunning {case_id}...")
        
        payload = {
            "answer_text": case["answer_text"],
            "source_text": case["source_text"],
            "simulate_fake_evidence": True if case_id == "medical_faq" else False
        }
        
        async with httpx.AsyncClient(timeout=None) as client:
            resp = await client.post(api_url, json=payload)
            if resp.status_code != 200:
                print(f"Error: {resp.text}")
                continue
                
            res = resp.json()
            
            print(f"Total claims: {res['total_claims']}")
            print(f"Supported: {res['supported_count']}")
            print(f"Contradicted: {res['contradicted_count']}")
            print(f"Unsupported: {res['unsupported_count']}")
            print(f"Ambiguous: {res['ambiguous_count']}")
            print(f"Reasoning issues: {res['reasoning_issue_count']}")
            print(f"Safety flags: {res['safety_flag_count']}")
            
            if case_id == "medical_faq":
                print("Checking fake evidence simulation...")
                fake_count = sum(1 for c in res['claims'] if not c['evidence_verified'])
                print(f"Claims with failed evidence verification: {fake_count}")
                for c in res['claims']:
                    if not c['evidence_verified']:
                        print(f"  -> {c['claim_text']} (Verdict: {c['verdict']}, Reason: {c['human_review_reason']})")

if __name__ == "__main__":
    asyncio.run(main())
