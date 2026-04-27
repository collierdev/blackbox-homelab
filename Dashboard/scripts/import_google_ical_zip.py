#!/usr/bin/env python3
"""
Import Google Calendar .ics/.zip export into Pi Dashboard.

Usage examples:
  python3 scripts/import_google_ical_zip.py --zip "/path/to/collierjw93@gmail.com.ical.zip"
  python3 scripts/import_google_ical_zip.py --ics "/path/to/basic.ics" --dry-run
  python3 scripts/import_google_ical_zip.py --zip "/path/to/export.zip" --api-url "http://localhost:8080"
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
import zipfile
from pathlib import Path
from typing import Dict, Iterable, List, Optional
from urllib import request, error


def unfold_ical_lines(raw_text: str) -> List[str]:
    lines = raw_text.splitlines()
    unfolded: List[str] = []
    for line in lines:
        if line.startswith(" ") or line.startswith("\t"):
            if unfolded:
                unfolded[-1] += line[1:]
        else:
            unfolded.append(line)
    return unfolded


def parse_ical_datetime(value: str, is_date_only: bool) -> tuple[str, bool]:
    if is_date_only:
        # YYYYMMDD
        date = dt.datetime.strptime(value.strip(), "%Y%m%d").date()
        return date.isoformat(), True

    val = value.strip()
    if val.endswith("Z"):
        parsed = dt.datetime.strptime(val, "%Y%m%dT%H%M%SZ").replace(tzinfo=dt.timezone.utc)
    else:
        # Floating local time; preserve as ISO without TZ if possible.
        parsed = dt.datetime.strptime(val, "%Y%m%dT%H%M%S")
    return parsed.isoformat(), False


def parse_vevents(ics_text: str) -> List[Dict[str, object]]:
    lines = unfold_ical_lines(ics_text)
    events: List[Dict[str, object]] = []

    in_event = False
    current: Dict[str, object] = {}

    for line in lines:
        if line == "BEGIN:VEVENT":
            in_event = True
            current = {
                "title": "Untitled Event",
                "notes": [],
                "links": [],
                "priority": "medium",
                "origin": "google",
                "tagIds": [],
                "taskIds": [],
                "isCompleted": False,
            }
            continue
        if line == "END:VEVENT":
            in_event = False
            if current.get("startDateTime") and current.get("endDateTime"):
                events.append(current)
            current = {}
            continue
        if not in_event or ":" not in line:
            continue

        key, value = line.split(":", 1)
        key_upper = key.upper()

        if key_upper.startswith("SUMMARY"):
            current["title"] = value.strip() or "Untitled Event"
        elif key_upper.startswith("DESCRIPTION"):
            desc = value.replace("\\n", "\n").strip()
            if desc:
                current["notes"] = [desc]
        elif key_upper.startswith("LOCATION"):
            loc = value.strip()
            if loc:
                current["location"] = loc
        elif key_upper.startswith("URL"):
            url = value.strip()
            if url:
                current["links"] = [url]
        elif key_upper.startswith("STATUS"):
            current["isCompleted"] = value.strip().upper() == "CANCELLED"
        elif key_upper.startswith("UID"):
            current["remoteId"] = value.strip()
        elif key_upper.startswith("DTSTART"):
            is_date_only = "VALUE=DATE" in key_upper
            start_iso, all_day = parse_ical_datetime(value, is_date_only)
            current["startDateTime"] = start_iso
            current["isAllDay"] = all_day
        elif key_upper.startswith("DTEND"):
            is_date_only = "VALUE=DATE" in key_upper
            end_iso, _ = parse_ical_datetime(value, is_date_only)
            current["endDateTime"] = end_iso
        elif key_upper.startswith("PRIORITY"):
            try:
                p = int(value.strip())
                current["priority"] = "high" if p <= 4 else "medium" if p <= 6 else "low"
            except ValueError:
                current["priority"] = "medium"

    return events


def read_ics_from_zip(zip_path: Path) -> Iterable[tuple[str, str]]:
    with zipfile.ZipFile(zip_path, "r") as zf:
        for name in zf.namelist():
            if name.lower().endswith(".ics"):
                with zf.open(name) as fp:
                    yield name, fp.read().decode("utf-8", errors="replace")


def post_event(api_url: str, event_payload: Dict[str, object]) -> None:
    body = json.dumps(event_payload).encode("utf-8")
    req = request.Request(
        f"{api_url.rstrip('/')}/api/calendar/events",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(req, timeout=20) as response:
        if response.status not in (200, 201):
            raise RuntimeError(f"Unexpected response status: {response.status}")


def dedupe_key(event: Dict[str, object]) -> str:
    title = str(event.get("title", "")).strip().lower()
    start = str(event.get("startDateTime", "")).strip()
    end = str(event.get("endDateTime", "")).strip()
    uid = str(event.get("remoteId", "")).strip().lower()
    return f"{uid}|{title}|{start}|{end}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Import Google Calendar iCal export into Pi Dashboard")
    parser.add_argument("--zip", type=Path, help="Path to Google .zip calendar export")
    parser.add_argument("--ics", type=Path, help="Path to single .ics file")
    parser.add_argument("--api-url", default="http://localhost:8080", help="Dashboard base URL")
    parser.add_argument("--project-id", default="default", help="Project ID to attach imported events to")
    parser.add_argument("--dry-run", action="store_true", help="Parse only, do not POST events")
    args = parser.parse_args()

    if not args.zip and not args.ics:
        parser.error("Provide either --zip or --ics")
    if args.zip and args.ics:
        parser.error("Use only one input source: --zip or --ics")

    all_events: List[Dict[str, object]] = []

    if args.zip:
        if not args.zip.exists():
            raise FileNotFoundError(f"ZIP not found: {args.zip}")
        for name, ics_text in read_ics_from_zip(args.zip):
            file_events = parse_vevents(ics_text)
            for e in file_events:
                e["_source"] = name
            all_events.extend(file_events)
    else:
        if not args.ics.exists():
            raise FileNotFoundError(f"ICS not found: {args.ics}")
        ics_text = args.ics.read_text(encoding="utf-8", errors="replace")
        file_events = parse_vevents(ics_text)
        for e in file_events:
            e["_source"] = args.ics.name
        all_events.extend(file_events)

    seen = set()
    deduped: List[Dict[str, object]] = []
    for e in all_events:
        key = dedupe_key(e)
        if key not in seen:
            seen.add(key)
            deduped.append(e)

    print(f"Parsed {len(all_events)} events, deduped to {len(deduped)}")

    if args.dry_run:
        preview = deduped[:5]
        print("Dry run preview:")
        for item in preview:
            print(f"- {item.get('title')} [{item.get('startDateTime')} -> {item.get('endDateTime')}] ({item.get('_source')})")
        return 0

    success = 0
    failed = 0
    for event in deduped:
        payload = {
            "title": event.get("title", "Untitled Event"),
            "startDateTime": event.get("startDateTime"),
            "endDateTime": event.get("endDateTime"),
            "location": event.get("location"),
            "notes": event.get("notes", []),
            "links": event.get("links", []),
            "origin": "google",
            "priority": event.get("priority", "medium"),
            "isCompleted": bool(event.get("isCompleted", False)),
            "isAllDay": bool(event.get("isAllDay", False)),
            "projectId": args.project_id,
            "tagIds": [],
            "taskIds": [],
            "remoteId": event.get("remoteId"),
        }

        try:
            post_event(args.api_url, payload)
            success += 1
        except (error.URLError, error.HTTPError, RuntimeError) as exc:
            failed += 1
            title = payload.get("title", "Untitled Event")
            print(f"FAILED: {title} -> {exc}", file=sys.stderr)

    print(f"Import complete. Success: {success}, Failed: {failed}")
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
