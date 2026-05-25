# License Integration Notes

OpenSprout uses the GNU Affero General Public License v3.0 or later.

Implementation checklist:

- Keep `LICENSE` at the repository root with the full AGPLv3 text.
- Keep `"license": "AGPL-3.0-or-later"` in package manifests.
- Add short SPDX headers to substantial source files later if the project accepts outside contributions.
- Make source code available to users who interact with hosted modified versions over a network, as required by the AGPL.
- Document third-party dependency licenses before v1.0.
- Keep example deployments and self-hosting docs clear that modified hosted versions must preserve AGPL obligations.
