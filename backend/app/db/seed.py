"""
Database seeding script for Campus WaterPoint Board.
Seeds realistic campus water points and initial report states.
Run with: python -m app.db.seed
"""

from datetime import datetime, timedelta, timezone
from app.db.session import SessionLocal
from app.models.water_point import WaterPoint
from app.models.report import IssueReport


def seed_database():
    db = SessionLocal()
    try:
        # Check if already seeded
        existing_count = db.query(WaterPoint).count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} water points. Skipping seed.")
            return

        print("Seeding database with campus water points...")
        water_points_data = [
            {
                "name": "Library Hydration Station 1F",
                "location": "North Wing, near study area 102",
                "building": "Central Library",
            },
            {
                "name": "Dining Hall Main Cooler",
                "location": "Main entrance by tray return",
                "building": "Student Center",
            },
            {
                "name": "Engineering Block A Fountain",
                "location": "2nd Floor, between Lab 204 and 205",
                "building": "Engineering Block A",
            },
            {
                "name": "Science Complex Station",
                "location": "Ground Floor Foyer, beside elevators",
                "building": "Science Complex",
            },
            {
                "name": "Sports Center Chilled Dispenser",
                "location": "Ground Floor, next to main gymnasium entrance",
                "building": "Sports Center",
            },
            {
                "name": "Innovation Hub 3F Tap",
                "location": "3rd Floor, collaborative breakout lounge",
                "building": "Innovation Hub",
            },
            {
                "name": "Hostel 3 Common Dispenser",
                "location": "1st Floor common room hallway",
                "building": "Hostel 3",
            },
            {
                "name": "Arts Quad Pavilion Fountain",
                "location": "Courtyard breezeway, south entrance",
                "building": "Arts & Humanities",
            },
        ]

        created_points = []
        for wp_info in water_points_data:
            wp = WaterPoint(
                name=wp_info["name"],
                location=wp_info["location"],
                building=wp_info["building"],
            )
            db.add(wp)
            created_points.append(wp)

        db.flush()  # assign IDs

        now = datetime.now(timezone.utc)

        # 1. Active report on Library Hydration Station 1F
        report1 = IssueReport(
            water_point_id=created_points[0].id,
            description="Water tap leaking continuously and low pressure filter warning light on.",
            status="reported_unavailable",
            reported_at=now - timedelta(hours=3, minutes=15),
        )
        db.add(report1)

        # 2. Resolved report on Dining Hall Main Cooler
        report2 = IssueReport(
            water_point_id=created_points[1].id,
            description="Tastes like metallic mineral residue.",
            status="staff_confirmed_resolved",
            reported_at=now - timedelta(hours=6),
            resolved_at=now - timedelta(hours=1, minutes=30),
            resolved_by="Dave (Plumbing Lead)",
            resolution_notes="Replaced multi-stage carbon filter cartridge and flushed system.",
        )
        db.add(report2)

        # 3. Active report on Sports Center Chilled Dispenser
        report3 = IssueReport(
            water_point_id=created_points[4].id,
            description="Chiller completely warm, no cold water dispensing during peak practice.",
            status="reported_unavailable",
            reported_at=now - timedelta(hours=1, minutes=45),
        )
        db.add(report3)

        # 4. Resolved report on Hostel 3 Common Dispenser
        report4 = IssueReport(
            water_point_id=created_points[6].id,
            description="Slow drip from nozzle creating puddle on tile floor.",
            status="staff_confirmed_resolved",
            reported_at=now - timedelta(days=2),
            resolved_at=now - timedelta(days=1, hours=4),
            resolved_by="Sarah (Facilities)",
            resolution_notes="Tightened pipe fitting and replaced degraded rubber O-ring seal.",
        )
        db.add(report4)

        db.commit()
        print(f"Successfully seeded {len(created_points)} water points and 4 sample reports.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
