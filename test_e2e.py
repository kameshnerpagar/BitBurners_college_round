import httpx
import json

base_url = "http://localhost:8000/api"
file_path = "sample_document.pdf"

print("1. Testing Health Endpoint...")
health = httpx.get(f"{base_url}/health")
print(f"Health Response: {health.json()}")

print("\n2. Uploading Sample Document...")
with open(file_path, "rb") as f:
    files = {"file": ("sample_document.pdf", f, "application/pdf")}
    upload = httpx.post(f"{base_url}/documents", files=files)
    
if upload.status_code == 200:
    doc_data = upload.json()
    doc_id = doc_data["document_id"]
    print(f"Upload Success! Document ID: {doc_id}")
    print(f"Metadata: {doc_data}")
else:
    print(f"Upload Failed: {upload.text}")
    exit(1)

print("\n3. Running Audit...")
answer_text = "EvidenceLens parses documents using PyMuPDF. It can accept files up to 25MB in size. It was created by John Doe. The platform is powered by highly accurate modern AI models that understand context perfectly."
payload = {
    "document_id": doc_id,
    "answer_text": answer_text
}
audit = httpx.post(f"{base_url}/audits", json=payload, timeout=60.0)

if audit.status_code == 200:
    print("\nAudit Success!")
    result = audit.json()
    print("\n--- SUMMARY ---")
    print(json.dumps(result["summary"], indent=2))
    
    print("\n--- CLAIMS EVALUATED ---")
    for claim in result["claim_evaluations"]:
        print(f"\nClaim: {claim['claim_id']}")
        print(f"Verdict: {claim['verdict']}")
        print(f"Explanation: {claim['explanation']}")
        print(f"Uncertainty: {claim['uncertainty_level']}")
        if claim["evidence_items"]:
            print("Evidence Items:")
            for ev in claim["evidence_items"]:
                print(f"  - Page {ev['page']}: \"{ev['exact_quote']}\" ({ev['relationship_to_claim']})")
        else:
            print("Evidence Items: None Validated")
else:
    print(f"Audit Failed: {audit.status_code}")
    print(audit.text)
