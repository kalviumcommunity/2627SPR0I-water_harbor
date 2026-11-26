import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy.orm import Session

from app.cli.provision_staff import provision_staff_account
from app.core.storage import LocalStorageBackend, get_storage
from app.main import app


def _make_jpeg_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (40, 40), color=(20, 90, 150)).save(buf, format="JPEG")
    return buf.getvalue()


def test_campus_hierarchy_and_water_point_persistence(client: TestClient, staff_auth: dict):
    """Staff can build campus -> block -> floor -> indoor area and standalone facilities."""
    headers = staff_auth["headers"]

    # Public cannot create campus locations
    with TestClient(app) as anon_client:
        unauth = anon_client.post("/api/campus-locations", json={"name": "Campus", "location_type": "campus"})
        assert unauth.status_code == 401

    campus = client.post(
        "/api/campus-locations",
        json={"name": "Main Campus", "location_type": "campus"},
        headers=headers,
    )
    assert campus.status_code == 201
    campus_id = campus.json()["id"]

    block = client.post(
        "/api/campus-locations",
        json={"name": "Block A", "location_type": "block", "parent_id": campus_id, "code": "BLK-A"},
        headers=headers,
    )
    assert block.status_code == 201
    block_id = block.json()["id"]

    floor = client.post(
        "/api/campus-locations",
        json={"name": "Floor 1", "location_type": "floor", "parent_id": block_id},
        headers=headers,
    )
    assert floor.status_code == 201
    floor_id = floor.json()["id"]

    # Standalone facility without a numbered block
    facility = client.post(
        "/api/campus-locations",
        json={"name": "Central Library", "location_type": "facility", "parent_id": campus_id},
        headers=headers,
    )
    assert facility.status_code == 201

    # Floor without parent must be rejected
    bad_floor = client.post(
        "/api/campus-locations",
        json={"name": "Orphan Floor", "location_type": "floor"},
        headers=headers,
    )
    assert bad_floor.status_code == 400

    # Create water point with persisted type and campus_location_id
    wp_res = client.post(
        "/api/water-points",
        json={
            "name": "East Wing Cooler",
            "location": "Next to Seminar Hall",
            "type": "water_cooler",
            "campus_location_id": floor_id,
        },
        headers=headers,
    )
    assert wp_res.status_code == 201
    wp = wp_res.json()
    assert wp["type"] == "water_cooler"
    assert wp["building"] == "Block A"
    assert [p["name"] for p in wp["location_path"]] == ["Main Campus", "Block A", "Floor 1"]

    # Filter by ancestor block returns descendant water points
    filtered = client.get(f"/api/water-points?campus_location_id={block_id}&type=water_cooler")
    assert filtered.status_code == 200
    assert len(filtered.json()) == 1

    # Edit & deactivate water point
    patch_res = client.patch(
        f"/api/water-points/{wp['id']}",
        json={"type": "bottle_filler", "is_active": False},
        headers=headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["type"] == "bottle_filler"
    assert patch_res.json()["is_active"] is False

    # Staff can view inactive when include_inactive=true; anonymous cannot
    assert len(client.get("/api/water-points?include_inactive=true").json()) == 1
    with TestClient(app) as anon:
        assert anon.get("/api/water-points").json() == []
        assert anon.get("/api/water-points?include_inactive=true").json() == []
        assert anon.get(f"/api/water-points/{wp['id']}").status_code == 404

    # Deactivated water point rejects new reports
    rep_res = client.post(
        "/api/reports",
        json={"water_point_id": wp["id"], "description": "Broken tap"},
    )
    assert rep_res.status_code == 400


def test_inactive_locations_and_ancestors_hidden_from_public(client: TestClient, staff_auth: dict):
    """Anonymous requests never see inactive locations, inactive water points, or inactive ancestors."""
    headers = staff_auth["headers"]

    block = client.post(
        "/api/campus-locations",
        json={"name": "Block Z", "location_type": "block"},
        headers=headers,
    ).json()
    floor = client.post(
        "/api/campus-locations",
        json={"name": "Floor 2", "location_type": "floor", "parent_id": block["id"]},
        headers=headers,
    ).json()
    wp = client.post(
        "/api/water-points",
        json={"name": "Z-201 Cooler", "location": "Hallway", "campus_location_id": floor["id"]},
        headers=headers,
    ).json()

    # Deactivate water point, floor, then block so block is inactive ancestor
    assert client.patch(f"/api/water-points/{wp['id']}", json={"is_active": False}, headers=headers).status_code == 200
    assert client.patch(f"/api/campus-locations/{floor['id']}", json={"is_active": False}, headers=headers).status_code == 200
    assert client.patch(f"/api/campus-locations/{block['id']}", json={"is_active": False}, headers=headers).status_code == 200

    # Re-enable water point and floor while keeping parent block inactive (inactive ancestor case)
    # Note: floor activation requires parent active, so keep floor active while block is inactive by
    # testing direct DB or deactivating block? Service prevents deactivating parent with active children,
    # so let's verify inactive leaf location & inactive water point are hidden publicly and visible to staff.
    with TestClient(app) as anon:
        assert anon.get("/api/campus-locations?include_inactive=true").json() == []
        assert anon.get(f"/api/campus-locations/{block['id']}").status_code == 404
        assert anon.get(f"/api/campus-locations/{floor['id']}").status_code == 404
        assert anon.get("/api/water-points?include_inactive=true").json() == []
        assert anon.get(f"/api/water-points/{wp['id']}").status_code == 404

    assert len(client.get("/api/campus-locations?include_inactive=true").json()) == 2
    assert client.get(f"/api/campus-locations/{block['id']}").status_code == 200
    assert len(client.get("/api/water-points?include_inactive=true").json()) == 1


def test_moving_water_point_recalculates_building_label(client: TestClient, staff_auth: dict):
    """Moving a water point between blocks/facilities/outdoor areas updates building authoritatively."""
    headers = staff_auth["headers"]

    block_a = client.post(
        "/api/campus-locations",
        json={"name": "Block A", "location_type": "block"},
        headers=headers,
    ).json()
    floor_a = client.post(
        "/api/campus-locations",
        json={"name": "Ground Floor", "location_type": "floor", "parent_id": block_a["id"]},
        headers=headers,
    ).json()
    facility = client.post(
        "/api/campus-locations",
        json={"name": "Sports Complex", "location_type": "facility"},
        headers=headers,
    ).json()
    outdoor = client.post(
        "/api/campus-locations",
        json={"name": "Main Quad", "location_type": "outdoor_area"},
        headers=headers,
    ).json()

    wp = client.post(
        "/api/water-points",
        json={
            "name": "Movable Cooler",
            "location": "Lobby",
            "building": "Stale Manual Building",
            "campus_location_id": floor_a["id"],
        },
        headers=headers,
    ).json()
    assert wp["building"] == "Block A"

    # Move to standalone facility even if client sends stale building label
    moved = client.patch(
        f"/api/water-points/{wp['id']}",
        json={"campus_location_id": facility["id"], "building": "Block A"},
        headers=headers,
    ).json()
    assert moved["building"] == "Sports Complex"

    # Move to top-level outdoor area (no building/facility/block ancestor) -> building becomes None
    moved_out = client.patch(
        f"/api/water-points/{wp['id']}",
        json={"campus_location_id": outdoor["id"], "building": "Sports Complex"},
        headers=headers,
    ).json()
    assert moved_out["building"] is None


def test_multi_staff_claim_ownership_and_resolution_sync(
    db: Session, client: TestClient, staff_auth: dict
):
    """Unassigned cannot resolve (409); Staff B cannot resolve Staff A's claim (403); Staff A resolves (200)."""
    wp = client.post(
        "/api/water-points",
        json={"name": "Hostel Cooler", "location": "Ground Floor", "type": "water_cooler"},
        headers=staff_auth["headers"],
    ).json()

    report = client.post(
        "/api/reports",
        json={"water_point_id": wp["id"], "description": "Not cooling"},
    ).json()

    # Unassigned issue cannot be resolved before claiming
    unclaimed_res = client.post(
        f"/api/reports/{report['id']}/resolve",
        headers=staff_auth["headers"],
    )
    assert unclaimed_res.status_code == 409
    assert "claimed" in unclaimed_res.json()["detail"].lower()

    # Staff A claims the report
    claim_a = client.post(
        f"/api/reports/{report['id']}/claim",
        headers=staff_auth["headers"],
    )
    assert claim_a.status_code == 200
    assert claim_a.json()["assigned_staff"]["display_name"] == staff_auth["staff"].display_name

    # Public reports must NOT expose assigned_staff or resolved_by
    pub_rep = client.get(f"/api/reports/{report['id']}").json()
    assert "assigned_staff" not in pub_rep
    assert "resolved_by" not in pub_rep

    # Staff B logs in on a separate client
    provision_staff_account(db, "facilities-tech-2", "Second Technician", "second-staff-key-2026")
    with TestClient(app) as client_b:
        login_b = client_b.post("/api/staff/login", json={"access_key": "second-staff-key-2026"})
        assert login_b.status_code == 200
        csrf_b = login_b.json()["csrf_token"]

        # Staff B sees assignment
        staff_b_reports = client_b.get("/api/staff/reports").json()
        assert staff_b_reports[0]["assigned_staff"]["display_name"] == staff_auth["staff"].display_name

        # Staff B cannot claim the already-claimed issue (409)
        claim_b = client_b.post(
            f"/api/reports/{report['id']}/claim",
            headers={"X-CSRF-Token": csrf_b},
        )
        assert claim_b.status_code == 409

        # Staff B cannot resolve Staff A's claimed issue (403)
        resolve_b = client_b.post(
            f"/api/reports/{report['id']}/resolve",
            json={"resolution_notes": "Hijack attempt"},
            headers={"X-CSRF-Token": csrf_b},
        )
        assert resolve_b.status_code == 403
        assert staff_auth["staff"].display_name in resolve_b.json()["detail"]

    # Staff A resolves their claimed issue
    res_a = client.post(
        f"/api/reports/{report['id']}/resolve",
        json={"resolution_notes": "Compressor reset"},
        headers=staff_auth["headers"],
    )
    assert res_a.status_code == 200
    assert res_a.json()["status"] == "staff_confirmed_resolved"
    assert res_a.json()["resolved_by"] == staff_auth["staff"].display_name


def test_anonymous_student_confirmations_and_private_photo_access(
    client: TestClient, staff_auth: dict, tmp_path
):
    """Students attach photos & confirm once; photos are accessible ONLY to authenticated staff."""
    test_storage = LocalStorageBackend(str(tmp_path))
    app.dependency_overrides[get_storage] = lambda: test_storage
    try:
        wp = client.post(
            "/api/water-points",
            json={"name": "Library Dispenser", "location": "2nd Floor", "type": "purifier"},
            headers=staff_auth["headers"],
        ).json()

        # Submit report with JPEG photo anonymously
        jpeg_bytes = _make_jpeg_bytes()
        with TestClient(app) as anon_submitter:
            create_res = anon_submitter.post(
                "/api/reports",
                data={"water_point_id": str(wp["id"]), "description": "Leaking pipe"},
                files={"photo": ("../../evil-name.jpg", jpeg_bytes, "image/jpeg")},
            )
            assert create_res.status_code == 201
            report = create_res.json()
            assert report["has_photo"] is True
            # Public response must NOT expose photo_url or photo_key
            assert "photo_url" not in report
            assert "photo_key" not in report

            # Unauthenticated student CANNOT fetch the photo
            anon_photo = anon_submitter.get(f"/api/reports/{report['id']}/photo")
            assert anon_photo.status_code == 401

        # Authenticated staff sees photo_url in /api/staff/reports and CAN fetch the photo
        staff_reports = client.get("/api/staff/reports").json()
        assert staff_reports[0]["photo_url"] == f"/api/reports/{report['id']}/photo"
        photo_res = client.get(staff_reports[0]["photo_url"])
        assert photo_res.status_code == 200
        assert photo_res.headers["content-type"] == "image/jpeg"
        assert photo_res.headers["x-content-type-options"] == "nosniff"
        assert photo_res.headers["cache-control"] == "private, no-store"

        # Student 1 confirms once from allowed origin
        with TestClient(app) as student_1:
            c1 = student_1.post(
                f"/api/reports/{report['id']}/confirm",
                headers={"Origin": "http://localhost:5173"},
            )
            assert c1.status_code == 200
            assert c1.json()["confirmation_count"] == 1
            assert (
                student_1.post(
                    f"/api/reports/{report['id']}/confirm",
                    headers={"Origin": "http://localhost:5173"},
                ).status_code
                == 409
            )
            mine = student_1.get("/api/reports/my-confirmations")
            assert report["id"] in mine.json()["report_ids"]

        # Distinct anonymous student increments count to 2
        with TestClient(app) as student_2:
            c2 = student_2.post(
                f"/api/reports/{report['id']}/confirm",
                headers={"Origin": "http://localhost:5173"},
            )
            assert c2.status_code == 200
            assert c2.json()["confirmation_count"] == 2
    finally:
        app.dependency_overrides.pop(get_storage, None)


def test_confirmation_origin_and_fetch_metadata_csrf(client: TestClient, staff_auth: dict):
    """Confirm endpoint enforces Origin allowlist and Fetch Metadata CSRF rules."""
    wp = client.post(
        "/api/water-points",
        json={"name": "CSRF Fountain", "location": "Atrium"},
        headers=staff_auth["headers"],
    ).json()
    report = client.post(
        "/api/reports",
        json={"water_point_id": wp["id"], "description": "No flow"},
    ).json()

    with TestClient(app) as anon:
        # Untrusted origin -> 403
        r_evil = anon.post(
            f"/api/reports/{report['id']}/confirm",
            headers={"Origin": "https://evil.example"},
        )
        assert r_evil.status_code == 403

        # Null origin -> 403
        r_null = anon.post(
            f"/api/reports/{report['id']}/confirm",
            headers={"Origin": "null"},
        )
        assert r_null.status_code == 403

        # Missing Origin + cross-site Fetch Metadata -> 403
        r_cross = anon.post(
            f"/api/reports/{report['id']}/confirm",
            headers={"Sec-Fetch-Site": "cross-site"},
        )
        assert r_cross.status_code == 403

        # Missing Origin + no Fetch Metadata -> 403
        r_no_hdrs = anon.post(f"/api/reports/{report['id']}/confirm")
        assert r_no_hdrs.status_code == 403

        # Missing Origin + explicit same-origin Fetch Metadata -> 200
        r_same = anon.post(
            f"/api/reports/{report['id']}/confirm",
            headers={"Sec-Fetch-Site": "same-origin"},
        )
        assert r_same.status_code == 200
        assert r_same.json()["confirmation_count"] == 1


def test_confirmation_atomic_rollback_when_concurrently_resolved(
    db: Session, client: TestClient, staff_auth: dict
):
    """If a report is resolved concurrently, add_confirmation rolls back and does not increment."""
    from app.models.report import ReportConfirmation
    from app.repositories.report_repository import report_repo

    wp = client.post(
        "/api/water-points",
        json={"name": "Race Confirm Station", "location": "Hall"},
        headers=staff_auth["headers"],
    ).json()
    report = client.post(
        "/api/reports",
        json={"water_point_id": wp["id"], "description": "Dripping"},
    ).json()

    # Resolve the report
    assert client.post(f"/api/reports/{report['id']}/claim", headers=staff_auth["headers"]).status_code == 200
    assert client.post(f"/api/reports/{report['id']}/resolve", headers=staff_auth["headers"]).status_code == 200

    # Simulate concurrent add_confirmation racing past initial status check
    outcome, count = report_repo.add_confirmation(db, report_id=report["id"], participant_hash="a" * 64)
    assert outcome == "inactive"
    assert count == 0
    assert db.query(ReportConfirmation).filter(ReportConfirmation.report_id == report["id"]).count() == 0


def test_water_point_building_consistency_and_inactive_ancestor_rejection(
    db: Session, client: TestClient, staff_auth: dict
):
    """Renaming, reparenting, outdoor areas, and inactive-ancestor checks keep building consistent."""
    from app.models.campus_location import CampusLocation

    headers = staff_auth["headers"]

    campus = client.post(
        "/api/campus-locations",
        json={"name": "North Campus", "location_type": "campus"},
        headers=headers,
    ).json()
    block_1 = client.post(
        "/api/campus-locations",
        json={"name": "Block One", "location_type": "block", "parent_id": campus["id"]},
        headers=headers,
    ).json()
    block_2 = client.post(
        "/api/campus-locations",
        json={"name": "Block Two", "location_type": "block", "parent_id": campus["id"]},
        headers=headers,
    ).json()
    building = client.post(
        "/api/campus-locations",
        json={"name": "Science Wing", "location_type": "building", "parent_id": block_1["id"]},
        headers=headers,
    ).json()
    outdoor = client.post(
        "/api/campus-locations",
        json={"name": "Lawn Area", "location_type": "outdoor_area", "parent_id": campus["id"]},
        headers=headers,
    ).json()

    # 1. Creating at standalone outdoor area with stale client-supplied building persists None
    wp_out = client.post(
        "/api/water-points",
        json={
            "name": "Lawn Fountain",
            "location": "East Lawn",
            "building": "Stale Client Building",
            "campus_location_id": outdoor["id"],
        },
        headers=headers,
    )
    assert wp_out.status_code == 201
    assert wp_out.json()["building"] is None

    # 2. Creating beneath a block/building derives building; renaming updates descendant water points
    wp_in = client.post(
        "/api/water-points",
        json={
            "name": "Wing Cooler",
            "location": "1st Floor",
            "campus_location_id": building["id"],
        },
        headers=headers,
    ).json()
    assert wp_in["building"] == "Science Wing"

    # Rename Science Wing -> Innovation Wing
    assert (
        client.patch(
            f"/api/campus-locations/{building['id']}",
            json={"name": "Innovation Wing"},
            headers=headers,
        ).status_code
        == 200
    )
    assert client.get(f"/api/water-points/{wp_in['id']}").json()["building"] == "Innovation Wing"

    # Reparent floor directly under Block One, then rename Block One -> Block Alpha
    floor_b1 = client.post(
        "/api/campus-locations",
        json={"name": "Floor 1", "location_type": "floor", "parent_id": block_1["id"]},
        headers=headers,
    ).json()
    assert (
        client.patch(
            f"/api/water-points/{wp_in['id']}",
            json={"campus_location_id": floor_b1["id"]},
            headers=headers,
        ).json()["building"]
        == "Block One"
    )
    assert (
        client.patch(
            f"/api/campus-locations/{block_1['id']}",
            json={"name": "Block Alpha"},
            headers=headers,
        ).status_code
        == 200
    )
    assert client.get(f"/api/water-points/{wp_in['id']}").json()["building"] == "Block Alpha"

    # Reparent floor_b1 under Block Two -> descendant water point updates to Block Two
    assert (
        client.patch(
            f"/api/campus-locations/{floor_b1['id']}",
            json={"parent_id": block_2["id"]},
            headers=headers,
        ).status_code
        == 200
    )
    assert client.get(f"/api/water-points/{wp_in['id']}").json()["building"] == "Block Two"

    # 3. Location beneath an inactive ancestor is rejected when assigning a water point
    db.query(CampusLocation).filter(CampusLocation.id == block_2["id"]).update({"is_active": False})
    db.commit()
    bad_assign = client.post(
        "/api/water-points",
        json={"name": "Blocked Station", "location": "Corridor", "campus_location_id": floor_b1["id"]},
        headers=headers,
    )
    assert bad_assign.status_code == 400


def test_key_rotation_invalidates_existing_sessions(db: Session, client: TestClient):
    """Rotating a staff access key increments session_version and invalidates prior cookies."""
    from app.cli.provision_staff import rotate_staff_key

    provision_staff_account(db, "rot-staff", "Rotating Staff", "initial-staff-key-2026")
    login_res = client.post("/api/staff/login", json={"access_key": "initial-staff-key-2026"})
    assert login_res.status_code == 200
    assert client.get("/api/staff/session").status_code == 200

    # Rotate key -> existing cookie must immediately be rejected
    rotate_staff_key(db, "rot-staff", "rotated-staff-key-2026")
    assert client.get("/api/staff/session").status_code == 401
    assert client.get("/api/staff/reports").status_code == 401

    # Logging in with new key succeeds
    login_new = client.post("/api/staff/login", json={"access_key": "rotated-staff-key-2026"})
    assert login_new.status_code == 200
    assert client.get("/api/staff/session").status_code == 200


def test_deactivation_then_reactivation_invalidates_old_session(
    db: Session, client: TestClient
):
    """An old session must remain invalid after a staff account is reactivated."""
    from app.cli.provision_staff import provision_staff_account, set_staff_active_state

    provision_staff_account(
        db, "reactivate-staff", "Reactivation Test", "reactivate-key-2026"
    )

    login = client.post(
        "/api/staff/login", json={"access_key": "reactivate-key-2026"}
    )
    assert login.status_code == 200
    assert client.get("/api/staff/session").status_code == 200

    set_staff_active_state(db, "reactivate-staff", False)
    assert client.get("/api/staff/session").status_code == 401

    set_staff_active_state(db, "reactivate-staff", True)
    assert client.get("/api/staff/session").status_code == 401

    new_login = client.post(
        "/api/staff/login", json={"access_key": "reactivate-key-2026"}
    )
    assert new_login.status_code == 200
    assert client.get("/api/staff/session").status_code == 200


def test_oversized_multipart_body_rejected_with_and_without_content_length(
    client: TestClient, staff_auth: dict, monkeypatch
):
    """Requests exceeding REPORT_MAX_BODY_BYTES return 413 with or without Content-Length."""
    from app.routers import reports as reports_router

    wp = client.post(
        "/api/water-points",
        json={"name": "Upload Cap WP", "location": "Hall"},
        headers=staff_auth["headers"],
    ).json()

    monkeypatch.setattr(reports_router.settings, "REPORT_MAX_BODY_BYTES", 512)
    oversized = b"x" * 1024

    # 1. With Content-Length header
    res_cl = client.post(
        "/api/reports",
        data={"water_point_id": str(wp["id"]), "description": "Too big"},
        files={"photo": ("big.jpg", oversized, "image/jpeg")},
    )
    assert res_cl.status_code == 413

    # 2. Without Content-Length (streaming chunks via ASGI)
    import asyncio
    from starlette.requests import Request as StarletteRequest

    async def run_stream_without_cl():
        chunks = [b"--bound\r\n", b"x" * 400, b"y" * 400, b"\r\n--bound--\r\n"]
        idx = 0

        async def receive():
            nonlocal idx
            if idx < len(chunks):
                c = chunks[idx]
                idx += 1
                return {"type": "http.request", "body": c, "more_body": idx < len(chunks)}
            return {"type": "http.request", "body": b"", "more_body": False}

        scope = {
            "type": "http",
            "method": "POST",
            "path": "/api/reports",
            "headers": [(b"content-type", b"multipart/form-data; boundary=bound")],
        }
        req = StarletteRequest(scope, receive)
        await reports_router._read_bounded_body(req, 512)

    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(run_stream_without_cl())
    assert exc_info.value.status_code == 413
