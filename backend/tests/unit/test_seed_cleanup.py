from sqlalchemy.orm import Session

from app.db.seed import seed_database
from app.models import IssueReport, ReportStatus, WaterPoint


def test_seed_database_does_not_insert_fictional_records(db: Session):
    """Running seed_database must leave an empty database empty."""
    assert db.query(WaterPoint).count() == 0
    assert db.query(IssueReport).count() == 0

    seed_database()

    assert db.query(WaterPoint).count() == 0
    assert db.query(IssueReport).count() == 0


def test_seed_database_preserves_existing_records(db: Session):
    """Running seed_database must not delete, truncate, or modify existing records."""
    wp = WaterPoint(
        name="North Wing Station",
        location="1st Floor Corridor",
        building="North Wing",
    )
    db.add(wp)
    db.flush()

    report = IssueReport(
        water_point_id=wp.id,
        description="Tap pressure is low",
        status=ReportStatus.REPORTED_UNAVAILABLE.value,
    )
    db.add(report)
    db.commit()

    seed_database()

    water_points = db.query(WaterPoint).all()
    reports = db.query(IssueReport).all()
    assert len(water_points) == 1
    assert water_points[0].name == "North Wing Station"
    assert len(reports) == 1
    assert reports[0].description == "Tap pressure is low"
