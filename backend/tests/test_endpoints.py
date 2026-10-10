"""
Second Opinion — Tests for FastAPI API endpoints.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.anyio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"


@pytest.mark.anyio
async def test_list_demos_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/demos")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 3


@pytest.mark.anyio
async def test_audit_demo_cases():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for case_id in ["medical_faq", "climate_stats", "tenant_rights"]:
            res = await client.post("/api/audit/demo", json={"case_id": case_id})
            assert res.status_code == 200
            data = res.json()
            assert "claims" in data and len(data["claims"]) > 0
            assert "overall_reliability_score" in data
            assert "corrected_answer" in data and data["corrected_answer"] is not None
            assert len(data["corrected_answer"]["revised_text"]) > 0


@pytest.mark.anyio
async def test_audit_empty_inputs_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Empty answer
        res1 = await client.post("/api/audit/json", json={"answer_text": "   ", "source_text": "Valid source"})
        assert res1.status_code == 400

        # Empty source
        res2 = await client.post("/api/audit/json", json={"answer_text": "Valid answer", "source_text": ""})
        assert res2.status_code == 400


@pytest.mark.anyio
async def test_audit_unsupported_file_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"source_file": ("malicious.exe", b"MZbinarycontent", "application/octet-stream")}
        data = {"answer_text": "Some text"}
        res = await client.post("/api/audit", data=data, files=files)
        assert res.status_code == 400
        assert "Unsupported file type" in res.json()["detail"]


@pytest.mark.anyio
async def test_audit_oversized_inputs_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        huge_text = "A" * 100_001
        res = await client.post("/api/audit/json", json={"answer_text": huge_text, "source_text": "Normal source"})
        assert res.status_code == 400
        assert "exceeds maximum limit" in res.json()["detail"]


@pytest.mark.anyio
async def test_audit_all_six_demos_structured_traceability():
    all_demos = ["medical_faq", "climate_stats", "tenant_rights", "leave_policy", "fully_correct", "prompt_injection"]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for case_id in all_demos:
            res = await client.post("/api/audit/demo", json={"case_id": case_id})
            assert res.status_code == 200, f"Demo {case_id} failed"
            data = res.json()
            assert "claims" in data and len(data["claims"]) > 0
            for c in data["claims"]:
                assert "claim_id" in c
                assert "verdict" in c
                assert c["verdict"] in ["SUPPORTED", "CONTRADICTED", "UNSUPPORTED", "AMBIGUOUS"]
                assert "confidence" in c
                assert "evidence_status" in c
                assert "confidence_explanation" in c
            assert "corrected_answer" in data
            ca = data["corrected_answer"]
            assert len(ca["revised_text"]) > 0
            assert len(ca["changes"]) == len(data["claims"])


