"""Shared building geometry for the SFH Development spec home (Sidney Aulds Building Studio,
progress set dated 5/31/2023, sheets A100/A101/A401/A701).

Coordinate system (feet, US customary):
  x : west -> east, 0 = west exterior face of framing (the "21'-0"" dimension on A101)
  z : rear  -> front, 0 = rear (laundry/storage) exterior wall face; carport is z = -24..0,
      conditioned house z = 0..64.17, front porch z = 64.17..70.08
  y : up, 0 = finish floor (top of slab)

Every value is tagged in comments as DIM (dimensioned on drawings), SCH (schedule),
SCALED (measured from the 1/8" plan, calibrated to the 21'-0" dimension = 395 px at 150 dpi,
18.81 px/ft) or ASSUMED (not shown on drawings - see assumptions log).
This module is the single source for the 3D model and for the model side of the
quantity reconciliation.
"""
import json
import math

# ---------------------------------------------------------------- primary dimensions
W = 21.0                      # DIM  building width (A101 top chain 21'-0")
Z_LAUNDRY = 6 + 10 / 12       # DIM  6'-10"
Z_MASTER = Z_LAUNDRY + 13 + 5 / 12   # DIM 13'-5"
Z_BATH = Z_MASTER + 9 + 10 / 12      # DIM 9'-10"
Z_BED2 = Z_BATH + 11 + 2 / 12        # DIM 11'-2"
Z_HOUSE = Z_BED2 + 22 + 11 / 12      # DIM 22'-11"  -> conditioned length 64'-2"
Z_PORCH = Z_HOUSE + 5 + 11 / 12      # DIM 5'-11"   -> overall 70'-1" (drawing overall says 70'-0")
CARPORT_D = 24.0              # DIM  24'-0"
PLATE = 9.0                   # DIM  T.O. plate 9'-0" (A401)
PITCH = 6 / 12                # DIM  6"/1'-0" (A401, A101 RCP)
EAVE_OH = 1.0                 # ASSUMED eave overhang (scaled ~0.7-1.0' on A401, not dimensioned)
RAKE_OH = 1.0                 # ASSUMED rake overhang
EXT_T = 6.5 / 12              # 2x6 (5.5") + 7/16 ZIP + siding ~ 6.5" nominal wall build
INT_T = 4.5 / 12              # 2x4 + 2 layers 1/2" GWB
SLAB_T = 4 / 12               # ASSUMED 4" slab
TRUSS_OC = 4.0                # DIM (design notes) cambered roof truss 4' O.C.
STUD_OC_EXT = 2.0             # DIM (design notes) 24" O.C.
STUD_OC_INT = 2.0

SLOPE_FACTOR = math.sqrt(1 + PITCH ** 2)
RIDGE_RISE = (W / 2) * PITCH            # 5.25'
RIDGE_Y = PLATE + RIDGE_RISE            # top-of-plate based ridge (bearing at wall line)

# ---------------------------------------------------------------- openings (SCH A701 + SCALED locations)
# window: (id, type, wall, center_along_wall, width, height, sill)
WINDOWS = [
    # West wall (Elevation D): 5 x Type A 6'-0" x 4'-0" sliding, sill 3'-0"  (centers SCALED from A101 tags)
    ("W-A1", "A", "west", 11.9, 6.0, 4.0, 3.0),
    ("W-A2", "A", "west", 23.0, 6.0, 4.0, 3.0),
    ("W-A3", "A", "west", 33.9, 6.0, 4.0, 3.0),
    ("W-A4", "A", "west", 44.8, 6.0, 4.0, 3.0),
    ("W-A5", "A", "west", 55.8, 6.0, 4.0, 3.0),
    # East wall (Elevation C): 2 x Type B 6'-0" x 4'-0" casement
    ("W-B1", "B", "east", 13.5, 6.0, 4.0, 3.0),     # Master Bedroom
    ("W-B2", "B", "east", 35.5, 6.0, 4.0, 3.0),     # Bedroom #2
    # Rear/laundry wall (Elevation A): 1 x Type C 2'-0" x 4'-0" single hung
    ("W-C1", "C", "north", 6.5, 2.0, 4.0, 3.0),
    # Front wall at porch (Elevation B): 3 x Type D 3'-0" x 5'-0" single hung (ganged)
    ("W-D1", "D", "south", 8.8, 3.0, 5.0, 3.0),
    ("W-D2", "D", "south", 11.8, 3.0, 5.0, 3.0),
    ("W-D3", "D", "south", 14.8, 3.0, 5.0, 3.0),
]

# door: (mark, type, wall/partition id, center_along, width, height, kind)
DOORS = [
    ("01", "R1", "south", 2.8, 4.0, 8.0, "ext-entry"),        # entry w/ sidelite
    ("09", "R2", "north", 1.9, 3.0, 6.667, "ext-entry"),      # laundry from carport
    ("10", "R5", "north", 18.4, 3.0, 6.667, "ext-swing"),     # storage from carport
    ("02", "R3", "P3", 31.75, 2.667, 6.667, "int-swing"),     # Bedroom #2
    ("04", "R3", "P3", 22.15, 2.667, 6.667, "int-swing"),     # Bath #2
    ("06", "R3", "P3", 18.55, 2.667, 6.667, "int-swing"),     # Master Bedroom
    ("08", "R3", "P1", 2.25, 2.667, 6.667, "int-swing"),      # Laundry
    ("05", "R3", "P6", 15.95, 2.667, 6.667, "int-swing"),     # Master Bath
    ("03", "R4", "P9", 15.5, 6.0, 6.667, "int-slide"),        # Bed #2 closet bypass
    ("07", "R4", "P4", 11.4, 6.0, 6.667, "int-slide"),        # Master closet bypass
]

# ---------------------------------------------------------------- walls
# Exterior 2x6 walls: id -> (x0, z0, x1, z1)   (centerline-ish at outer face inset half thickness)
h = EXT_T / 2
EXT_WALLS = {
    "west": (h, 0.0, h, Z_PORCH),          # runs full 70' incl. porch side wall
    "east": (W - h, 0.0, W - h, Z_PORCH),
    "north": (0.0, h, W, h),               # laundry/storage wall facing carport
    "south": (0.0, Z_HOUSE - h, W, Z_HOUSE),  # living wall facing porch
}
EXT_WALLS["south"] = (0.0, Z_HOUSE - h, W, Z_HOUSE - h)

# Interior 2x4 partitions (SCALED/DIM from A101)
X_HALL = 5.3        # SCALED hall wall
X_CLOSET = 8.35     # SCALED master closet wall
X_BATHS = 11.0      # SCALED bath #2 / master bath
X_STORAGE = 14.1    # SCALED storage
Z_CLOSET = 16.95    # SCALED closet end
Z_LINEN = Z_BATH - 2.5   # DIM 2'-6" closet depth
xi0, xi1 = EXT_T, W - EXT_T
PARTITIONS = {
    "P1": (xi0, Z_LAUNDRY, xi1, Z_LAUNDRY),        # laundry/storage | master+hall
    "P2": (X_STORAGE, EXT_T, X_STORAGE, Z_LAUNDRY),  # laundry | storage
    "P3": (X_HALL, Z_LAUNDRY, X_HALL, Z_BED2),     # hall wall (34'-2" chain)
    "P4": (X_CLOSET, Z_LAUNDRY, X_CLOSET, Z_CLOSET),
    "P5": (X_HALL, Z_CLOSET, X_CLOSET, Z_CLOSET),
    "P6": (X_HALL, Z_MASTER, xi1, Z_MASTER),       # master | baths
    "P7": (X_BATHS, Z_MASTER, X_BATHS, Z_BATH),    # bath2 | master bath
    "P8": (X_BATHS, Z_LINEN, xi1, Z_LINEN),        # master bath | bed2 closet
    "P9": (X_HALL, Z_BATH, xi1, Z_BATH),           # bath2+closet | bed2
    "P10": (X_HALL, Z_BED2, xi1, Z_BED2),          # bed2 | kitchen
}

ROOMS = [  # name, x0, z0, x1, z1, ceiling height (DIM from A101 RCP tags)
    ("LAUNDRY", xi0, EXT_T, X_STORAGE, Z_LAUNDRY, 9.0),
    ("STORAGE", X_STORAGE, EXT_T, xi1, Z_LAUNDRY, 8.0),
    ("HALL", xi0, Z_LAUNDRY, X_HALL, Z_BED2, 9.0),
    ("MASTER CLOSET", X_HALL, Z_LAUNDRY, X_CLOSET, Z_CLOSET, 8.0),
    ("MASTER BEDROOM", X_CLOSET, Z_LAUNDRY, xi1, Z_MASTER, 9.0),
    ("BATH #2", X_HALL, Z_MASTER, X_BATHS, Z_BATH, 8.0),
    ("MASTER BATH", X_BATHS, Z_MASTER, xi1, Z_LINEN, 8.0),
    ("BED #2 CLOSET", X_BATHS, Z_LINEN, xi1, Z_BATH, 8.0),
    ("BEDROOM #2", X_HALL, Z_BATH, xi1, Z_BED2, 9.0),
    ("KITCHEN / LIVING", xi0, Z_BED2, xi1, Z_HOUSE - EXT_T, 9.0),
    ("FRONT PORCH", xi0, Z_HOUSE, xi1, Z_PORCH, None),
    ("COVERED PARKING", 0.0, -CARPORT_D, W, 0.0, None),
]

# fixtures / casework  (name, layer, x0, z0, x1, z1, y0, y1, takeoff_id)
FIXTURES = [
    ("Kitchen tall pantry cabinet", "casework", X_HALL + 0.2, Z_BED2 + 0.2, 8.0, Z_BED2 + 2.2, 0, 7.5, "12-120"),
    ("Kitchen base cabinets", "casework", 8.0, Z_BED2 + 0.2, 10.9, Z_BED2 + 2.2, 0, 3.0, "12-100"),
    ("Range (owner supplied)", "fixtures", 10.9, Z_BED2 + 0.2, 13.4, Z_BED2 + 2.2, 0, 3.0, "11-100"),
    ("Kitchen base cabinets", "casework", 13.4, Z_BED2 + 0.2, 16.5, Z_BED2 + 2.2, 0, 3.0, "12-100"),
    ("Refrigerator space (owner supplied)", "fixtures", 16.6, Z_BED2 + 0.3, 20.0, Z_BED2 + 2.8, 0, 6.0, "11-100"),
    ("Kitchen wall cabinets", "casework", 8.0, Z_BED2 + 0.2, 10.9, Z_BED2 + 1.2, 4.5, 7.0, "12-110"),
    ("Microwave over range (owner)", "fixtures", 10.9, Z_BED2 + 0.2, 13.4, Z_BED2 + 1.4, 4.9, 6.4, "11-100"),
    ("Kitchen wall cabinets", "casework", 13.4, Z_BED2 + 0.2, 16.5, Z_BED2 + 1.2, 4.5, 7.0, "12-110"),
    ("Kitchen wall cabinet over refrigerator", "casework", 16.6, Z_BED2 + 0.2, 20.0, Z_BED2 + 2.2, 6.0, 7.5, "12-110"),
    ("Kitchen island base cabinets", "casework", 8.4, 46.3, 16.1, 48.3, 0, 2.95, "12-100"),
    ("Island laminate countertop", "casework", 8.3, 46.1, 16.2, 49.1, 2.95, 3.08, "12-200"),
    ("Kitchen laminate countertop", "casework", 8.0, Z_BED2 + 0.2, 16.5, Z_BED2 + 2.3, 2.95, 3.08, "12-200"),
    ("Kitchen sink (island)", "fixtures", 11.3, 46.6, 13.3, 47.9, 2.6, 3.1, "22-110"),
    ("Bath #2 vanity", "casework", 8.4, Z_MASTER + 0.2, X_BATHS - 0.2, Z_MASTER + 2.0, 0, 2.85, "12-130"),
    ("Bath #2 toilet", "fixtures", 9.0, 24.6, 10.8, 26.6, 0, 2.5, "22-130"),
    ("Bath #2 tub/shower w/ surround", "fixtures", X_HALL + 0.2, Z_BATH - 2.6, X_BATHS - 0.2, Z_BATH - 0.1, 0, 1.6, "22-140"),
    ("Master bath vanity", "casework", xi1 - 1.8, 21.0, xi1, 23.6, 0, 2.85, "12-130"),
    ("Master bath toilet", "fixtures", xi1 - 2.2, 24.6, xi1, 26.2, 0, 2.5, "22-130"),
    ("Master bath tub/shower w/ surround", "fixtures", X_BATHS + 0.2, Z_MASTER + 0.6, X_BATHS + 2.7, Z_LINEN - 0.2, 0, 1.6, "22-140"),
    ("Washer (owner supplied)", "fixtures", 8.8, EXT_T + 0.1, 11.2, EXT_T + 2.6, 0, 3.2, "11-100"),
    ("Dryer (owner supplied)", "fixtures", 11.3, EXT_T + 0.1, 13.7, EXT_T + 2.6, 0, 3.2, "11-100"),
    ("50 gal electric water heater", "mep", 17.0, 4.0, 19.0, 6.0, 0, 5.0, "22-150"),
    ("HVAC condenser 2-ton (pad)", "mep", W + 1.0, 37.0, W + 3.5, 39.5, 0, 2.6, "23-100"),
    ("Air handler (attic)", "mep", 1.8, 20.0, 4.0, 24.5, PLATE + 0.6, PLATE + 2.0, "23-100"),
    ("Electrical panel 200A", "mep", W - EXT_T - 0.25, 2.5, W - EXT_T, 4.0, 4.0, 6.5, "26-100"),
    ("Closet shelf & rod", "casework", X_HALL + 0.2, Z_LAUNDRY + 0.3, X_CLOSET - 0.2, Z_CLOSET - 0.3, 5.5, 5.6, "10-120"),
    ("Closet shelf & rod", "casework", X_BATHS + 0.2, Z_LINEN + 0.2, xi1 - 0.1, Z_BATH - 0.3, 5.5, 5.6, "10-120"),
]

# lights from RCP (name, x, z, kind)  kind: can / pendant / fan / vanity / exterior
LIGHTS = [
    ("Carport recessed", 5.25, -17.5, "can"), ("Carport recessed", 15.75, -17.5, "can"),
    ("Carport recessed", 5.25, -6.5, "can"), ("Carport recessed", 15.75, -6.5, "can"),
    ("Laundry recessed", 6.75, 3.4, "can"), ("Storage recessed", 17.5, 3.4, "can"),
    ("Master closet recessed", 6.8, 11.5, "can"),
    ("Hall recessed", 2.8, 13.9, "can"), ("Hall recessed", 2.8, 20.7, "can"),
    ("Hall recessed", 2.8, 27.6, "can"), ("Hall recessed", 2.8, 34.4, "can"),
    ("Hall recessed", 2.8, 41.2, "can"),
    ("Master bedroom fan/light", 14.5, 13.5, "fan"),
    ("Bath #2 recessed", 8.1, 22.0, "can"), ("Bath #2 shower light", 8.1, 28.3, "can"),
    ("Master bath recessed", 15.6, 23.5, "can"), ("Master bath shower light", 12.4, 23.5, "can"),
    ("Bed #2 closet recessed", 16.0, 28.8, "can"),
    ("Bedroom #2 fan/light", 13.0, 35.6, "fan"),
    ("Kitchen pendant", 10.6, 47.6, "pendant"), ("Kitchen pendant", 13.9, 47.6, "pendant"),
    ("Living recessed", 5.25, 54.6, "can"), ("Living recessed", 15.75, 54.6, "can"),
    ("Living recessed", 5.25, 61.0, "can"), ("Living recessed", 15.75, 61.0, "can"),
    ("Living fan/light", 10.5, 57.8, "fan"),
    ("Porch recessed", 5.25, 67.1, "can"), ("Porch recessed", 15.75, 67.1, "can"),
]


def opening_area(kind="all"):
    w = sum(o[4] * o[5] for o in WINDOWS)
    d = sum(o[4] * o[5] for o in DOORS if o[6].startswith("ext"))
    return {"windows": w, "ext_doors": d}[kind] if kind != "all" else w + d


def model_quantities():
    """Quantities measured from the model geometry (used for reconciliation)."""
    ext_len = 2 * Z_PORCH + 2 * W                  # W/E walls run porch length too
    part_len = sum(math.dist((a, b), (c, d)) for a, b, c, d in PARTITIONS.values())
    roof_len = Z_PORCH + CARPORT_D + 2 * RAKE_OH
    roof_run = W / 2 + EAVE_OH
    return {
        "Slab footprint (SF)": W * (Z_PORCH + CARPORT_D),
        "Conditioned footprint (SF)": W * Z_HOUSE,
        "Porch slab (SF)": W * (Z_PORCH - Z_HOUSE),
        "Carport slab (SF)": W * CARPORT_D,
        "Exterior 2x6 wall length (LF)": ext_len,
        "Interior 2x4 partition length (LF)": part_len,
        "Window count (EA)": len(WINDOWS),
        "Window area (SF)": opening_area("windows"),
        "Exterior door count (EA)": sum(1 for d in DOORS if d[6].startswith("ext")),
        "Interior door count (EA)": sum(1 for d in DOORS if d[6].startswith("int")),
        "Roof area, sloped (SF)": roof_len * roof_run * SLOPE_FACTOR * 2,
        "Truss count (EA)": len(truss_positions()),
        "Recessed/surface light fixtures (EA)": len(LIGHTS),
    }


def truss_positions():
    """Trusses @ 4' O.C. from the front (porch) gable back to carport gable."""
    pos = [("gable", Z_PORCH), ("vaulted", (Z_PORCH + Z_HOUSE) / 2)]   # porch
    # 17 flat-bottom-chord trusses over the conditioned house, one on each end wall
    for i in range(17):
        pos.append(("common", max(Z_HOUSE - i * TRUSS_OC, 0.0)))
    # carport: 5 vaulted trusses + end gable
    for i in range(1, 6):
        pos.append(("vaulted", -i * TRUSS_OC))
    pos.append(("gable", -CARPORT_D))
    return pos


def as_json():
    return json.dumps({
        "W": W, "Z_HOUSE": Z_HOUSE, "Z_PORCH": Z_PORCH, "CARPORT_D": CARPORT_D,
        "Z_LAUNDRY": Z_LAUNDRY, "Z_MASTER": Z_MASTER, "Z_BATH": Z_BATH, "Z_BED2": Z_BED2,
        "PLATE": PLATE, "PITCH": PITCH, "EAVE_OH": EAVE_OH, "RAKE_OH": RAKE_OH,
        "EXT_T": EXT_T, "INT_T": INT_T, "SLAB_T": SLAB_T, "TRUSS_OC": TRUSS_OC,
        "STUD_OC_EXT": STUD_OC_EXT, "STUD_OC_INT": STUD_OC_INT,
        "windows": WINDOWS, "doors": DOORS, "extWalls": EXT_WALLS, "partitions": PARTITIONS,
        "rooms": ROOMS, "fixtures": FIXTURES, "lights": LIGHTS,
        "trusses": truss_positions(),
    })


if __name__ == "__main__":
    for k, v in model_quantities().items():
        print(f"{k:40s} {v:10.2f}")
