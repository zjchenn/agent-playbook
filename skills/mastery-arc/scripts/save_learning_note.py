#!/usr/bin/env python3
"""Save one immutable Mastery Arc session note with an atomic no-overwrite write."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import tempfile
import unicodedata
from pathlib import Path

MODES = ("learn", "coding", "review", "debrief")
STATUSES = ("complete", "partial", "stopped", "blocked")


def parse_timestamp(value: str | None) -> dt.datetime:
    if value is None:
        return dt.datetime.now().astimezone()
    parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.astimezone()
    return parsed


def slugify(topic: str) -> str:
    normalized = unicodedata.normalize("NFKD", topic)
    ascii_topic = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_topic.lower()).strip("-")
    return (slug or "study-session")[:64].rstrip("-")


def yaml_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def read_body(body_file: str | None) -> str:
    if body_file:
        body = Path(body_file).expanduser().read_text(encoding="utf-8")
    else:
        body = sys.stdin.read()
    if not body.strip():
        raise ValueError("the session note body is empty")
    return body.rstrip() + "\n"


def build_document(args: argparse.Namespace, timestamp: dt.datetime, body: str) -> str:
    workspace = Path(args.workspace_root).expanduser().resolve()
    lines = [
        "---",
        "schema: 1",
        'skill: "mastery-arc"',
        f"mode: {yaml_string(args.mode)}",
        f"topic: {yaml_string(args.topic)}",
        f"status: {yaml_string(args.status)}",
        f"created_at: {yaml_string(timestamp.isoformat(timespec='seconds'))}",
        f"workspace: {yaml_string(str(workspace))}",
    ]
    if args.source_revision:
        lines.append("source_revisions:")
        lines.extend(f"  - {yaml_string(value)}" for value in args.source_revision)
    if args.review_of:
        lines.append(f"review_of: {yaml_string(args.review_of)}")
    if args.next_review:
        lines.append(f"next_review: {yaml_string(args.next_review)}")
    lines.extend(("---", "", body))
    return "\n".join(lines)


def sync_directory(directory: Path) -> None:
    try:
        descriptor = os.open(directory, os.O_RDONLY)
    except OSError:
        return
    try:
        os.fsync(descriptor)
    except OSError:
        pass
    finally:
        os.close(descriptor)


def atomic_create(directory: Path, stem: str, document: str) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        dir=directory,
        prefix=".mastery-arc-",
        suffix=".tmp",
    )
    temporary_path = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(document)
            handle.flush()
            os.fsync(handle.fileno())

        index = 1
        while True:
            suffix = "" if index == 1 else f"-{index}"
            target = directory / f"{stem}{suffix}.md"
            try:
                os.link(temporary_path, target)
                break
            except FileExistsError:
                index += 1

        temporary_path.unlink()
        sync_directory(directory)
        return target.resolve()
    except Exception:
        temporary_path.unlink(missing_ok=True)
        raise


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace-root", required=True)
    parser.add_argument("--output-dir")
    parser.add_argument("--topic", required=True)
    parser.add_argument("--mode", choices=MODES, required=True)
    parser.add_argument("--status", choices=STATUSES, required=True)
    parser.add_argument("--body-file")
    parser.add_argument(
        "--timestamp", help="ISO-8601 timestamp; useful for reproducible runs"
    )
    parser.add_argument("--source-revision", action="append")
    parser.add_argument("--review-of")
    parser.add_argument("--next-review")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        timestamp = parse_timestamp(args.timestamp)
        workspace = Path(args.workspace_root).expanduser().resolve()
        if not workspace.is_dir():
            raise NotADirectoryError(f"workspace root is not a directory: {workspace}")

        if args.output_dir:
            output_dir = Path(args.output_dir).expanduser()
            if not output_dir.is_absolute():
                output_dir = workspace / output_dir
        else:
            output_dir = workspace / "learning-notes" / timestamp.strftime("%Y")

        body = read_body(args.body_file)
        document = build_document(args, timestamp, body)
        stem = (
            f"{timestamp.strftime('%Y-%m-%d-%H%M%S')}-{slugify(args.topic)}-{args.mode}"
        )
        target = atomic_create(output_dir.resolve(), stem, document)
    except (OSError, UnicodeError, ValueError) as error:
        parser.exit(1, f"save_learning_note.py: {error}\n")

    print(target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
