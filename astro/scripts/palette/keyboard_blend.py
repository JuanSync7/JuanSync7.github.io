"""Builds the palette studio's keyboard in Blender and exports public/models/swatch-keyboard.glb.

A Keychron Q1-style 75% board: a CNC aluminium wedge case (flat bottom, about 4.5 degrees of
typing angle, rounded corners) with the plate recessed in it, sculpted Cherry-profile keycaps
(each row its own height and tilt, a shallow dish on top), a rotary knob top right, on a desk mat.
Sizes are real: the 19.05 mm key unit, 18.2 mm cap feet. Materials are named for their palette
role (case, plate, alpha, mod, accent, accent2, knob, mat); the figure colours them from the
reader's palette, so the file's own colours never show. Keys are separate objects named
key_<row>_<n> so the figure can press them. Linked duplicates share one mesh per cap shape.

Run: python3 -m venv bl && bl/bin/pip install bpy  (Blender as a module, 5.x)
     bl/bin/python astro/scripts/palette/keyboard_blend.py [out.glb]
"""

import math
import sys
from pathlib import Path

import bpy  # noqa: I001  (bpy first: it makes bmesh importable)
import bmesh

MM = 0.001
U = 19.05 * MM
OUT = Path(sys.argv[-1]) if sys.argv[-1].endswith(".glb") else Path(__file__).resolve().parents[2] / "public/models/swatch-keyboard.glb"

# Rows, back to front: (width in units, kind) and a negative width for a gap. Kinds: a alpha,
# m modifier, x accent (Escape, Enter), y second accent (arrows), k the knob's place.
F = [(1, "x"), (-0.25, ""), *[(1, "m")] * 4, (-0.25, ""), *[(1, "a")] * 4, (-0.25, ""), *[(1, "m")] * 4, (-0.25, ""), (1, "m"), (1, "k")]
ROWS = [
    F,
    [*[(1, "a")] * 13, (2, "m"), (1, "m")],
    [(1.5, "m"), *[(1, "a")] * 12, (1.5, "a"), (1, "m")],
    [(1.75, "m"), *[(1, "a")] * 11, (2.25, "x"), (1, "m")],
    [(2.25, "m"), *[(1, "a")] * 10, (1.75, "m"), (1, "y"), (1, "m")],
    [(1.25, "m"), (1.25, "m"), (1.25, "m"), (6.25, "a"), (1, "m"), (1, "m"), (1, "m"), (1, "y"), (1, "y"), (1, "y")],
]
# Cherry-style sculpt per row: cap height (mm) and top tilt (degrees, + faces the typist).
PROFILE = [(9.4, 9), (9.0, 6), (7.9, 3), (7.5, 0), (7.8, -4), (8.2, -7)]
F_GAP = 0.25 * U  # the function row stands a quarter unit apart
KEYS_W = 16 * U
KEYS_D = 6 * U + F_GAP
BEZEL = 8.5 * MM
SLOPE = math.radians(4.5)


def material(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = (0.5, 0.5, 0.5, 1)
    return m


def bevel(obj, width, segments=2):
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(40)
    return mod


def apply_all(obj):
    bpy.context.view_layer.objects.active = obj
    for mod in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)


def box(name, size, at, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    obj.data.materials.append(mat)
    return obj


CAPS = {}


def cap_mesh(width_u, row):
    """One cap shape: a tapered, tilted frustum with a dished top, bevelled soft."""
    key = (width_u, row)
    if key in CAPS:
        return CAPS[key]
    h, tilt = PROFILE[row]
    bw, bd = width_u * U - 0.85 * MM, 18.2 * MM
    tw, td = bw - 5.6 * MM, bd - 4.4 * MM
    back = 0.8 * MM
    t = math.tan(math.radians(tilt))
    bm = bmesh.new()
    lo = [bm.verts.new((x * bw / 2, y * bd / 2, 0)) for x, y in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    hi = []
    for x, y in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        yy = y * td / 2 + back
        hi.append(bm.verts.new((x * tw / 2, yy, h * MM - t * yy)))
    bm.faces.new(lo[::-1])
    top = bm.faces.new(hi)
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((lo[i], lo[j], hi[j], hi[i]))
    # The dish: an inset on top, pressed half a millimetre in.
    inner = bmesh.ops.inset_region(bm, faces=[top], thickness=1.1 * MM)["faces"]
    dish = {v for f in [top] + inner for v in f.verts if v not in hi}
    bmesh.ops.translate(bm, verts=list(dish), vec=(0, 0, -0.55 * MM))
    mesh = bpy.data.meshes.new(f"cap_{width_u}_{row}")
    bm.to_mesh(mesh)
    bm.free()
    tmp = bpy.data.objects.new("tmp", mesh)
    bpy.context.collection.objects.link(tmp)
    bevel(tmp, 0.9 * MM, 3)
    apply_all(tmp)
    bpy.data.objects.remove(tmp)
    CAPS[key] = mesh
    return mesh


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mats = {k: material(k) for k in ("case", "plate", "alpha", "mod", "accent", "accent2", "knob", "mat")}
    board = bpy.data.objects.new("board", None)
    bpy.context.collection.objects.link(board)

    # Case: a block taller than needed, recessed for the plate, tilted, then cut flat underneath.
    cw, cd = KEYS_W + 2 * BEZEL, KEYS_D + 2 * BEZEL
    case = box("case", (cw, cd, 40 * MM), (0, 0, -20 * MM), mats["case"])
    bevel(case, 3 * MM, 4)
    apply_all(case)
    well = box("well", (KEYS_W + 1.2 * MM, KEYS_D + 1.2 * MM, 30 * MM), (0, 0, 8 * MM), mats["case"])
    cut = case.modifiers.new("well", "BOOLEAN")
    cut.object, cut.operation, cut.solver = well, "DIFFERENCE", "EXACT"
    apply_all(case)
    bpy.data.objects.remove(well)
    box("plate", (KEYS_W, KEYS_D, 1.5 * MM), (0, 0, -6.8 * MM), mats["plate"]).parent = board
    case.parent = board

    # Keys, back row at +y. Each cap is its own object on a shared mesh.
    y = KEYS_D / 2
    for r, row in enumerate(ROWS):
        y -= U / 2
        x = -KEYS_W / 2
        n = 0
        for w, kind in row:
            if w < 0:
                x += -w * U
                continue
            cx = x + w * U / 2
            if kind == "k":
                bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=8.5 * MM, depth=13 * MM, location=(cx, y, 0.5 * MM))
                knob = bpy.context.active_object
                knob.name = "knob"
                for i, v in enumerate(knob.data.vertices):
                    if i % 2 and abs(v.co.z) > 1e-4:
                        v.co.x *= 0.96
                        v.co.y *= 0.96
                knob.data.materials.append(mats["knob"])
                bevel(knob, 1 * MM, 3)
                apply_all(knob)
                knob.parent = board
            else:
                obj = bpy.data.objects.new(f"key_{r}_{n}", cap_mesh(w, r))
                bpy.context.collection.objects.link(obj)
                obj.location = (cx, y, -0.2 * MM)
                obj.parent = board
                n += 1
            x += w * U
        y -= U / 2 + (F_GAP if r == 0 else 0)
    for obj in board.children:
        if obj.name.startswith("key_"):
            r, n = (int(p) for p in obj.name.split("_")[1:])
            kinds = [k for w, k in ROWS[r] if w > 0 and k != "k"]
            mesh = obj.data
            if not mesh.materials:
                mesh.materials.append(None)
            obj.material_slots[0].link = "OBJECT"
            obj.material_slots[0].material = mats[{"a": "alpha", "m": "mod", "x": "accent", "y": "accent2"}[kinds[n]]]

    # Typing angle about the front edge, then lift so the case's front foot rests on the mat.
    board.location = (0, 0, 21 * MM)
    board.rotation_euler = (SLOPE, 0, 0)
    bpy.context.view_layer.update()
    for obj in [case]:
        floor = box("floor", (1, 1, 1), (0, 0, -0.5), mats["case"])
        cut = obj.modifiers.new("floor", "BOOLEAN")
        cut.object, cut.operation, cut.solver = floor, "DIFFERENCE", "EXACT"
        apply_all(obj)
        bpy.data.objects.remove(floor)
    mat = box("mat", (cw + 36 * MM, cd + 30 * MM, 3 * MM), (0, -4 * MM, -1.5 * MM), mats["mat"])
    bevel(mat, 1.4 * MM, 3)
    apply_all(mat)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUT),
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_texcoords=False,
        export_materials="EXPORT",
    )
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB), {len(CAPS)} cap shapes")


build()
