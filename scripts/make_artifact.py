#!/usr/bin/env python3
"""Derive the published-artifact form of the page from web/index.html (D005).

The artifact format is a fragment: no doctype, html, head or body tags, with the
title, font link and style first. Usage, from the repo root:

    python3 scripts/make_artifact.py > /tmp/chess_coach_artifact.html
"""
import pathlib
import re
import sys

src = pathlib.Path(__file__).resolve().parent.parent / "web" / "index.html"
html = src.read_text(encoding="utf-8")
head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
head = re.sub(r"<meta[^>]*>\s*", "", head)
sys.stdout.write(head.strip() + "\n\n" + body.strip() + "\n")
