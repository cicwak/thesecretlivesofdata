#!/usr/bin/env python3
"""Copy the authored Postgres runtime into its dedicated Hugo static route."""
import argparse
import shutil
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('destination', type=Path)
args = parser.parse_args()
source = Path(__file__).resolve().parents[1]
destination = args.destination.resolve()
if destination.name != 'postgres' or destination.parent.name != 'visualizations':
    parser.error('destination must be the dedicated visualizations/postgres directory')
if destination == source or source in destination.parents:
    parser.error('destination must be outside the source tree')
destination.mkdir(parents=True, exist_ok=True)
for path in source.iterdir():
    if path.is_file() and path.suffix in ('.html','.js','.css') or path.name in ('LICENSE','NOTICE.md'):
        shutil.copy2(path, destination / path.name)
for name in ('chapters','audit'):
    shutil.copytree(source / name, destination / name, dirs_exist_ok=True)
print(f'Postgres runtime copied to {destination}')
