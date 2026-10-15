# 7th-legion: SFH Development spec home, takeoff, estimate and 3D model

A preliminary quantity takeoff, budget estimate and interactive 3D model for the Sidney Aulds Building Studio
**SFH Development** spec home (2 bed / 2 bath, 1,352 gsf conditioned, 117 gsf porch, 504 gsf covered parking),
priced for **Ouachita Parish, Louisiana** (Monroe / West Monroe market).

Source documents: *2305031 Progress Drawings* dated 5/31/2023 (G000, A100, A101, A401, A701, marked NOT FOR
CONSTRUCTION) and the *Spec Home Schematic Design Notes*.

## Deliverables (`output/`)

| File | What it is |
|---|---|
| `SFH_Ouachita_Takeoff_Estimate.xlsx` | Formula-driven workbook with these sheets: Read Me, Summary, Drawing Register, Assumptions & RFIs, Takeoff Detail (172 items), Cost Database, Estimate Detail, Reconciliation |
| `estimate_summary.md` | Division summary and markups |
| `assumptions_rfi_log.md` | 22 RFIs, 5 estimator assumptions, the building assumptions used for the takeoff, and exclusions |
| `qa_reconciliation.md` | Takeoff vs. 3D model vs. drawing values, QA checklist, low-confidence items |
| `model/SFH_3D_Model.html` | Interactive layered 3D model (three.js is inlined, so it works offline). Drag to orbit, toggle 25 layers, click an element to inspect it, and use the section cut |
| `model/model_notes.md` | Model units, axes, layers and limitations |
| `takeoff_evidence/` | Calibrated crops of the drawings used for measurement |

## Rebuild

```bash
scripts/build_all.sh   # needs python3 + openpyxl + LibreOffice (soffice)
```

`model_data.py` holds the building geometry, and both the 3D model and the reconciliation read from it.
`build_estimate.py` writes the workbook, which LibreOffice then recalculates. `build_reports.py` writes the
model and the markdown reports.

> Preliminary budget only. Unit costs are the estimator's budget values for the Monroe / Ouachita market as of
> 2026-10-15. They are not quotes. There are no structural, MEP or geotechnical documents yet, so those scopes
> are assumptions or allowances; see the RFI log.
