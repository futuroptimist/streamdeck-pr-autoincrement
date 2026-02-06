#!/usr/bin/env python3
import re
import sys

patterns = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"ASIA[0-9A-Z]{16}"),
    re.compile(r"-----BEGIN (RSA|DSA|EC|OPENSSH|PRIVATE) KEY-----"),
    re.compile(r"(?i)password\s*[:=]"),
    re.compile(r"(?i)secret\s*[:=]"),
    re.compile(r"(?i)api[_-]?key\s*[:=]"),
]

def main() -> int:
    data = sys.stdin.read()
    for pattern in patterns:
        if pattern.search(data):
            sys.stderr.write(
                "Potential secret detected by scan-secrets.py. "
                "Please review the staged diff.\n"
            )
            return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
