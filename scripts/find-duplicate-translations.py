#!/usr/bin/env python3
# ruff: noqa: T201
"""
Find translation keys that share the same value — candidates for consolidation.

Usage:
    python3 scripts/find-duplicate-translations.py [locales/en/translation.json]

Outputs groups of keys that all resolve to the same string, sorted by the
number of duplicates (most duplicates first) then alphabetically by value.
Keys that are already under 'common.*' are highlighted so you can see which
ones have already been consolidated.
"""

import json
import sys
from collections import defaultdict
from pathlib import Path

TRANSLATION_FILE = (
    Path(sys.argv[1])
    if len(sys.argv) > 1
    else Path(__file__).parent.parent / "flamerelay/static/locales/en/translation.json"
)


def flatten(obj: dict, prefix: str = "") -> dict[str, str]:
    out: dict[str, str] = {}
    for k, v in obj.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, key))
        else:
            out[key] = str(v)
    return out


def main() -> None:
    with open(TRANSLATION_FILE) as f:  # noqa: PTH123
        data = json.load(f)

    flat = flatten(data)

    # Group keys by value
    by_value: dict[str, list[str]] = defaultdict(list)
    for key, value in flat.items():
        by_value[value].append(key)

    # Filter to values with more than one key
    duplicates = {v: keys for v, keys in by_value.items() if len(keys) > 1}

    if not duplicates:
        print("No duplicate values found — nothing to consolidate.")
        return

    # Sort: most duplicates first, then alphabetically by value
    sorted_groups = sorted(duplicates.items(), key=lambda x: (-len(x[1]), x[0]))

    total_savings = sum(len(keys) - 1 for keys in duplicates.values())
    print(f"Found {len(duplicates)} values shared by multiple keys")
    print(f"Potential savings: {total_savings} keys could be removed\n")
    print("─" * 72)

    for value, keys in sorted_groups:
        already_common = [k for k in keys if k.startswith("common.")]
        not_common = [k for k in keys if not k.startswith("common.")]

        # Mark keys: [C] = already in common.*, [D] = duplicate candidate
        print(f"\nValue: {json.dumps(value)}")
        print(f"  Keys ({len(keys)}):")
        for key in sorted(keys):
            marker = " [common]" if key.startswith("common.") else ""
            print(f"    {key}{marker}")

        if already_common and not_common:
            print(f"  → Suggest: replace {list(not_common)} with {already_common[0]}")
        elif not already_common:
            print(f"  → Suggest: move to common.<name>, update {len(keys)} references")

    print("\n" + "─" * 72)
    print(f"\nTotal duplicate groups: {len(duplicates)}")
    print(f"Total keys that could be removed: {total_savings}")


if __name__ == "__main__":
    main()
