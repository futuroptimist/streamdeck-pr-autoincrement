#!/usr/bin/env python3
import re
import sys

PATTERNS = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"ASIA[0-9A-Z]{16}"),
    re.compile(r"BEGIN PRIVATE KEY"),
]

current_file = None
for line in sys.stdin:
    if line.startswith("+++ b/"):
        current_file = line.strip().split("+++ b/", 1)[1]
        continue

    if current_file == "scripts/scan-secrets.py":
        continue

    for pattern in PATTERNS:
        if pattern.search(line):
            print(f"Potential secret detected: {pattern.pattern}", file=sys.stderr)
            sys.exit(1)

sys.exit(0)
