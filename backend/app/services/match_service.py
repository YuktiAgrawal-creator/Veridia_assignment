"""
Veridia Match - Match Service with SQLite Persistence & Concurrency Support
"""
import json
import sqlite3
import uuid
from datetime import date, datetime
from typing import Optional, List, Dict, Any

from backend.app.config import DB_PATH
from backend.app.data.loader import DatasetStore
from backend.app.engine.matcher import MatchEngine
from backend.app.engine.expiry import parse_iso_date
from backend.app.models.schemas import BuyerRequirement, MatchResponse, ManufacturerMatch


class MatchService:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=15.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS match_requests (
                    request_id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    evaluation_date TEXT NOT NULL,
                    buyer_requirements_json TEXT NOT NULL,
                    total_scanned INTEGER NOT NULL,
                    total_eligible INTEGER NOT NULL,
                    total_needs_verification INTEGER NOT NULL,
                    total_ineligible INTEGER NOT NULL,
                    results_json TEXT NOT NULL
                )
            """)
            conn.commit()

    def execute_match(self, requirements: BuyerRequirement) -> MatchResponse:
        """
        Executes match request isolated per buyer, fixing evaluation_date at request creation.
        """
        request_id = str(uuid.uuid4())
        created_at_dt = datetime.now()
        created_at_str = created_at_dt.isoformat()

        # Deterministic evaluation date: use buyer's if provided, else use current creation date
        if requirements.evaluation_date:
            eval_date_obj = parse_iso_date(requirements.evaluation_date)
            eval_date_str = eval_date_obj.isoformat()
        else:
            eval_date_obj = created_at_dt.date()
            eval_date_str = eval_date_obj.isoformat()

        dataset_records = DatasetStore.get_instance().get_all_records()
        engine = MatchEngine(dataset_records)

        matches, counts = engine.evaluate_match(
            requirements=requirements,
            evaluation_date=eval_date_obj,
            include_ineligible=False,
        )

        response = MatchResponse(
            request_id=request_id,
            created_at=created_at_str,
            evaluation_date=eval_date_str,
            requirements=requirements,
            total_scanned=len(dataset_records),
            total_eligible=counts["eligible"],
            total_needs_verification=counts["needs_verification"],
            total_ineligible=counts["ineligible"],
            results=matches,
        )

        # Persist deterministically
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO match_requests (
                    request_id,
                    created_at,
                    evaluation_date,
                    buyer_requirements_json,
                    total_scanned,
                    total_eligible,
                    total_needs_verification,
                    total_ineligible,
                    results_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    request_id,
                    created_at_str,
                    eval_date_str,
                    requirements.model_dump_json(),
                    response.total_scanned,
                    response.total_eligible,
                    response.total_needs_verification,
                    response.total_ineligible,
                    json.dumps([m.model_dump() for m in matches]),
                ),
            )
            conn.commit()

        return response

    def get_match_by_id(self, request_id: str) -> Optional[MatchResponse]:
        """
        Retrieves a saved match request by ID, returning results evaluated strictly
        at its original fixed evaluation date.
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM match_requests WHERE request_id = ?", (request_id,))
            row = cursor.fetchone()

        if not row:
            return None

        req_dict = json.loads(row["buyer_requirements_json"])
        results_list = json.loads(row["results_json"])

        matches = [ManufacturerMatch(**m) for m in results_list]

        return MatchResponse(
            request_id=row["request_id"],
            created_at=row["created_at"],
            evaluation_date=row["evaluation_date"],
            requirements=BuyerRequirement(**req_dict),
            total_scanned=row["total_scanned"],
            total_eligible=row["total_eligible"],
            total_needs_verification=row["total_needs_verification"],
            total_ineligible=row["total_ineligible"],
            results=matches,
        )

    def get_recent_requests(self, limit: int = 10) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT request_id, created_at, evaluation_date, buyer_requirements_json,
                       total_eligible, total_needs_verification
                FROM match_requests
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (limit,),
            )
            rows = cursor.fetchall()

        recent = []
        for r in rows:
            req = json.loads(r["buyer_requirements_json"])
            recent.append({
                "request_id": r["request_id"],
                "created_at": r["created_at"],
                "evaluation_date": r["evaluation_date"],
                "material": req.get("material"),
                "process": req.get("process"),
                "quantity": req.get("quantity"),
                "certification": req.get("certification"),
                "destination_country": req.get("destination_country"),
                "total_eligible": r["total_eligible"],
                "total_needs_verification": r["total_needs_verification"],
            })
        return recent
