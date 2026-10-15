"""Reconciliation rows: workbook takeoff (live links) vs. 3D model geometry vs. design-notes / schedule values."""
import model_data as md

TD = "'Takeoff Detail'"


def recon_rows(rowmap):
    q = md.model_quantities()
    n = lambda i: f"{TD}!O{rowmap[i]}"     # net qty cell
    c = lambda i: f"{TD}!I{rowmap[i]}"     # count cell
    return [
        ("Conditioned area vs. design notes (1,352 gsf)", f"={n('01-180')}", 1352, "SF",
         "Takeoff uses dimensioned 21'-0\" x 64'-2\". Notes area likely measured to outside of sheathing/siding. Within tolerance.", "OK"),
        ("Porch area vs. design notes (117 gsf)", f"={n('03-185')}", 117, "SF",
         "Takeoff = slab under porch incl. side-wall footprint (21' x 5'-11\"); notes = clear area between porch walls (~19.8' x 5.92'). Not an error.", "Explained"),
        ("Covered parking vs. design notes (504 gsf)", f"={TD}!J{rowmap['07-180']}*{TD}!K{rowmap['07-180']}", 504, "SF", "21'-0\" x 24'-0\" dimensioned.", "OK"),
        ("Total under roof vs. design notes (1,973 gsf)", f"={n('01-170')}", 1973, "SF", "Dimensions sum to 70'-1\" vs 70'-0\" overall (1\" chain rounding) - 0.1%.", "OK"),
        ("Slab footprint: takeoff vs. model", f"={n('03-160')}", round(q["Slab footprint (SF)"], 2), "SF", "Same dimension source.", "OK"),
        ("Exterior 2x6 wall length: takeoff vs. model", f"={n('06-100')}", round(q["Exterior 2x6 wall length (LF)"], 2), "LF", "Includes porch side walls (W/E walls run 70'-1\").", "OK"),
        ("Interior partition length: takeoff vs. model", f"={n('06-140')}", round(q["Interior 2x4 partition length (LF)"], 2), "LF",
         "Both from scaled partition coordinates (calibrated 18.81 px/ft). Partition locations are not dimensioned on A101 - scaled tolerance about +/-3\".", "Review"),
        ("Window count: takeoff vs. model vs. A701 schedule (11)", f"={c('08-100')}+{c('08-110')}+{c('08-120')}+{c('08-130')}", q["Window count (EA)"], "EA",
         "Schedule 11 = plan tags 11 = elevations 11 (A x5 west, B x2 east, C x1 rear, D x3 front).", "OK"),
        ("Exterior doors: takeoff vs. model (A701 01, 09, 10)", f"={c('08-200')}+{c('08-210')}+{c('08-220')}", q["Exterior door count (EA)"], "EA", "", "OK"),
        ("Interior doors: takeoff vs. model (A701 02-08)", f"={c('08-230')}+{c('08-240')}", q["Interior door count (EA)"], "EA", "", "OK"),
        ("Roof area (sloped): takeoff vs. model", f"={n('07-130')}*100", round(q["Roof area, sloped (SF)"], 2), "SF", "Both include ASSUMED 12\" eave & rake overhangs.", "OK"),
        ("Truss count: takeoff vs. model", f"={c('06-190')}+{c('06-191')}+{c('06-192')}", q["Truss count (EA)"], "EA", "48\" O.C. per design notes (see RFI-06).", "OK"),
        ("Light fixtures (cans + pendants + fans): takeoff vs. model RCP count", f"={c('26-300')}+{c('26-310')}+{c('26-320')}", q["Recessed/surface light fixtures (EA)"], "EA",
         "Exterior soffit/wall lights (26-330) are counted separately and are not on the RCP.", "OK"),
        ("Overall length: dimension chain vs. overall dim 70'-0\"", round(md.Z_PORCH, 3), 70.0, "FT",
         "6'-10\" + 13'-5\" + 9'-10\" + 11'-2\" + 22'-11\" + 5'-11\" = 70'-1\". 1\" discrepancy on A101 - used the chain.", "Explained"),
        ("Plan calibration: 21'-0\" vs. vertical 70'-0\" (px/ft)", 18.81, 18.74, "px/ft", "Horizontal vs. vertical scale agreement 0.4% - scan/plot distortion negligible.", "OK"),
    ]
