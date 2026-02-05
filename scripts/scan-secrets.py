#!/usr/bin/env python3
import re
import sys

patterns = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----"),
    re.compile(r"ghp_[A-Za-z0-9]{36,}"),
]

data = sys.stdin.read()

matches = [pattern.pattern for pattern in patterns if pattern.search(data)]

if matches:
    sys.stderr.write("Potential secrets detected for patterns:\n")
    for match in matches:
        sys.stderr.write(f"- {match}\n")
    sys.exit(1)

sys.stderr.write("No secrets detected.\n")
