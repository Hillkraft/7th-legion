# QA & Reconciliation Report - SFH Development Spec Home

Workbook: `output/SFH_Ouachita_Takeoff_Estimate.xlsx` (recalculated with LibreOffice; 0 formula errors).

## Takeoff vs. 3D model vs. drawing/notes values

| Check | Workbook | Model / reference | Unit | Variance | Var % | Explanation | Status |
|---|---:|---:|---|---:|---:|---|---|
| Conditioned area vs. design notes (1,352 gsf) | 1,347.50 | 1,352.00 | SF | -4.50 | -0.3% | Takeoff uses dimensioned 21'-0" x 64'-2". Notes area likely measured to outside of sheathing/siding. Within tolerance. | OK |
| Porch area vs. design notes (117 gsf) | 124.25 | 117.00 | SF | 7.25 | 6.2% | Takeoff = slab under porch incl. side-wall footprint (21' x 5'-11"); notes = clear area between porch walls (~19.8' x 5.92'). Not an error. | Explained |
| Covered parking vs. design notes (504 gsf) | 504.00 | 504.00 | SF | 0.00 | 0.0% | 21'-0" x 24'-0" dimensioned. | OK |
| Total under roof vs. design notes (1,973 gsf) | 1,975.75 | 1,973.00 | SF | 2.75 | 0.1% | Dimensions sum to 70'-1" vs 70'-0" overall (1" chain rounding) - 0.1%. | OK |
| Slab footprint: takeoff vs. model | 1,975.75 | 1,975.75 | SF | 0.00 | 0.0% | Same dimension source. | OK |
| Exterior 2x6 wall length: takeoff vs. model | 182.17 | 182.17 | LF | 0.00 | 0.0% | Includes porch side walls (W/E walls run 70'-1"). | OK |
| Interior partition length: takeoff vs. model | 138.56 | 138.56 | LF | 0.00 | 0.0% | Both from scaled partition coordinates (calibrated 18.81 px/ft). Partition locations are not dimensioned on A101 - scaled tolerance about +/-3". | Review |
| Window count: takeoff vs. model vs. A701 schedule (11) | 11.00 | 11.00 | EA | 0.00 | 0.0% | Schedule 11 = plan tags 11 = elevations 11 (A x5 west, B x2 east, C x1 rear, D x3 front). | OK |
| Exterior doors: takeoff vs. model (A701 01, 09, 10) | 3.00 | 3.00 | EA | 0.00 | 0.0% |  | OK |
| Interior doors: takeoff vs. model (A701 02-08) | 7.00 | 7.00 | EA | 0.00 | 0.0% |  | OK |
| Roof area (sloped): takeoff vs. model | 2,470.68 | 2,470.76 | SF | -0.08 | -0.0% | Both include ASSUMED 12" eave & rake overhangs. | OK |
| Truss count: takeoff vs. model | 25.00 | 25.00 | EA | 0.00 | 0.0% | 48" O.C. per design notes (see RFI-06). | OK |
| Light fixtures (cans + pendants + fans): takeoff vs. model RCP count | 28.00 | 28.00 | EA | 0.00 | 0.0% | Exterior soffit/wall lights (26-330) are counted separately and are not on the RCP. | OK |
| Overall length: dimension chain vs. overall dim 70'-0" | 70.08 | 70.00 | FT | 0.08 | 0.1% | 6'-10" + 13'-5" + 9'-10" + 11'-2" + 22'-11" + 5'-11" = 70'-1". 1" discrepancy on A101 - used the chain. | Explained |
| Plan calibration: 21'-0" vs. vertical 70'-0" (px/ft) | 18.81 | 18.74 | px/ft | 0.07 | 0.4% | Horizontal vs. vertical scale agreement 0.4% - scan/plot distortion negligible. | OK |

## QA checklist

- [x] Every takeoff row has a unit, source sheet, calculation/method, basis and confidence (`Takeoff Detail` columns P, F, T, U, V).
- [x] Plan scale calibrated to a dimensioned reference (21'-0" on A101) and cross-checked against the 70'-0" vertical dimension (0.4%).
- [x] Net quantity and waste-adjusted gross quantity are kept in separate columns; waste is a visible input per line.
- [x] Opening deductions applied to siding and drywall; not to sheathing (cut waste) - documented per row.
- [x] Window/door counts reconcile: A701 schedule = A101 tags = A401 elevations = 3D model (11 windows, 10 doors).
- [x] Every estimate line pulls quantity from the takeoff by ID (INDEX/MATCH) and unit cost from the Cost Database; allowances are labeled as such.
- [x] Each cost has a source note, market and price date; all are estimator budget values, not quotes.
- [x] Summary totals by division via SUMIFS reconcile to the Estimate Detail subtotal ($255,683 direct).
- [x] Markups are explicit inputs (markup on cost) and are not buried in unit prices.
- [ ] Human estimator review of scaled partition positions and kitchen layout (RFI-13).
- [ ] Replace budget unit costs with local supplier/sub quotes.
- [ ] Structural, MEP and geotechnical information (RFI-04/05/06/07/14/15).

## Low-confidence items

- `31-100` Clear & grub, strip topsoil (building & drive area) - 1.00 LS ($2,800)
- `31-120` Select fill building pad, 12" avg, compacted (loose CY incl. 25% shrink) - 150.00 CY ($3,825)
- `03-120` Interior grade beams 12" w x 16" below slab - concrete - 9.98 CY ($1,676)
- `06-200` 2x4 roof purlins @ 24" O.C. (flat) over 48" trusses - 1,479.63 LF ($917)
- `06-250` LVL beams 3-1/2" x 14" (carport eaves 2 x 25', porch front 22') - 72.00 LF ($2,448)
- `12-120` Tall pantry cabinet 30" x 24" x 84" - 1.00 EA ($960)
- `26-120` Devices: receptacles, switches, GFCI, plates - 64.00 EA ($1,600)
- `32-130` Driveway culvert & headwalls (if open-ditch street) - 1.00 LS ($1,200)
- `33-100` Water service 1" (meter to house) - 45.00 LF ($630)
- `33-110` Sewer service 4" PVC w/ cleanouts - 50.00 LF ($1,300)
- `33-120` Water/sewer tap, meter & impact fees (municipal) - 1.00 LS ($3,500)
- `33-130` Underground electric service lateral - 60.00 LF ($960)
- `33-140` Utility company service/connection charges - 1.00 LS ($800)

## Notes on known differences

- Interior wall drywall is taken to 9'-0" in all rooms; rooms with 8'-0" ceilings are over-measured by about 1' of wall height (~130 SF) - conservative.
- The model represents studs, trusses and purlins at their nominal spacing for visualization; the stud count in the workbook adds corners, intersections and cripples, so the model shows fewer studs than are purchased.
- The design-notes porch area (117 gsf) is a clear area; the takeoff uses the slab area (124.25 SF) for concrete and finishing.
- Grand total $332,968 includes placeholder markups; with owner acting as GC (no overhead/profit) the total is $280,276.
