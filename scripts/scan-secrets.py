#!/usr/bin/env python3
import re
import sys

patterns = {
    "AWS Access Key": r"AKIA[0-9A-Z]{16}",
    "GitHub Token": r"ghp_[A-Za-z0-9]{36}",
    "Slack Token": r"xox[baprs]-[A-Za-z0-9-]{10,}",
    "Generic API Key": r"(?i)api[_-]?key\s*[:=]\s*['\"]?[A-Za-z0-9]{16,}",
}

data = sys.stdin.read()
found = False

for name, pattern in patterns.items():
    if re.search(pattern, data):
        print(f"Potential secret detected: {name}", file=sys.stderr)
        found = True

if found:
    sys.exit(1)
