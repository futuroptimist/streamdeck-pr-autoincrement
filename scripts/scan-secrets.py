#!/usr/bin/env python3
import re
import sys

data = sys.stdin.read()

patterns = {
    "aws_access_key": re.compile(r"AKIA[0-9A-Z]{16}"),
    "github_token": re.compile(r"ghp_[0-9A-Za-z]{36}"),
    "private_key": re.compile(r"-----BEGIN (RSA|EC|OPENSSH|DSA) PRIVATE KEY-----"),
}

hits = [name for name, pattern in patterns.items() if pattern.search(data)]

if hits:
    print(f"Potential secrets detected: {', '.join(hits)}", file=sys.stderr)
    sys.exit(1)

sys.exit(0)
