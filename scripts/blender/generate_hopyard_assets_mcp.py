#!/usr/bin/env python3
"""Generate the HopEden web asset kit through BlenderMCP.

Run while Blender is open with the BlenderMCP add-on connected:
    uv run --with mcp python scripts/blender/generate_hopyard_assets_mcp.py
"""

import asyncio
import json
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BLEND_PATH = PROJECT_ROOT / "assets/blender/hopyard-asset-kit.blend"
GLB_PATH = PROJECT_ROOT / "public/models/hopyard-asset-kit.glb"

BLENDER_CODE = f'''
import bpy
import json
import math
import os
from mathutils import Vector

blend_path = {str(BLEND_PATH)!r}
glb_path = {str(GLB_PATH)!r}
os.makedirs(os.path.dirname(blend_path), exist_ok=True)
os.makedirs(os.path.dirname(glb_path), exist_ok=True)

# Clear the scene and orphaned data.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for collection in list(bpy.data.collections):
    if collection.name != 'Collection':
        bpy.data.collections.remove(collection)
root = bpy.context.scene.collection
base_collection = bpy.data.collections.get('Collection')
if base_collection:
    base_collection.name = 'HopYard_AssetKit'
else:
    base_collection = bpy.data.collections.new('HopYard_AssetKit')
    root.children.link(base_collection)

# Materials.
def principled_material(name, color, metallic, roughness):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    return material

galvanized = principled_material('GalvanizedSteel', (0.42, 0.47, 0.50), 0.82, 0.34)
wood = principled_material('TreatedWood', (0.24, 0.095, 0.035), 0.0, 0.78)
concrete = principled_material('PrecastConcrete', (0.38, 0.40, 0.39), 0.0, 0.92)
hop_stem = principled_material('HopStem', (0.055, 0.20, 0.025), 0.0, 0.82)
hop_leaf = principled_material('HopLeaf', (0.08, 0.34, 0.035), 0.0, 0.72)
hop_cone = principled_material('HopCone', (0.34, 0.58, 0.08), 0.0, 0.68)
wood_nodes = wood.node_tree.nodes
wood_links = wood.node_tree.links
noise = wood_nodes.new('ShaderNodeTexNoise')
noise.inputs['Scale'].default_value = 4.0
noise.inputs['Detail'].default_value = 2.0
noise.inputs['Roughness'].default_value = 0.65
mapping = wood_nodes.new('ShaderNodeMapping')
texcoord = wood_nodes.new('ShaderNodeTexCoord')
ramp = wood_nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].color = (0.055, 0.015, 0.006, 1.0)
ramp.color_ramp.elements[1].color = (0.38, 0.15, 0.045, 1.0)
wood_links.new(texcoord.outputs['Generated'], mapping.inputs['Vector'])
wood_links.new(mapping.outputs['Vector'], noise.inputs['Vector'])
wood_links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
wood_links.new(ramp.outputs['Color'], wood_nodes.get('Principled BSDF').inputs['Base Color'])


def move_to_collection(obj):
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    base_collection.objects.link(obj)


def set_origin(obj, location):
    bpy.context.scene.cursor.location = location
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR', center='MEDIAN')
    obj.select_set(False)


def finish_mesh(obj, material, bevel=0.0):
    move_to_collection(obj)
    obj.data.materials.append(material)
    if bevel > 0:
        modifier = obj.modifiers.new('EdgeSoftening', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 2
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj

# Korean galvanized steel pole: total 6 m, 0.9 m buried, 5.1 m exposed.
x = -4.5
bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.03, depth=6.0, location=(x, 0, 2.1))
kr_pole = finish_mesh(bpy.context.object, galvanized, 0.003)
kr_pole.name = 'KR_SteelPole_6m'
set_origin(kr_pole, (x, 0, 0))
kr_pole['total_length_m'] = 6.0
kr_pole['buried_depth_m'] = 0.9
kr_pole['exposed_height_m'] = 5.1
kr_pole['source'] = 'HopEden material catalog'

# Korean galvanized steel pole: total 9 m, 1.5 m buried, 7.5 m exposed.
x = -3.4
bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.03, depth=9.0, location=(x, 0, 3.0))
kr_steel_9m = finish_mesh(bpy.context.object, galvanized, 0.003)
kr_steel_9m.name = 'KR_SteelPole_9m'
set_origin(kr_steel_9m, (x, 0, 0))
kr_steel_9m['total_length_m'] = 9.0
kr_steel_9m['buried_depth_m'] = 1.5
kr_steel_9m['exposed_height_m'] = 7.5
kr_steel_9m['source'] = 'HopEden material catalog'

# Korean H4 square timber poles, 6 m total and 4.9 m exposed.
for x, section_m, name in (
    (-2.3, 0.10, 'KR_WoodPole_100_6m'),
    (-1.2, 0.12, 'KR_WoodPole_120_6m'),
):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, 1.9))
    timber = bpy.context.object
    timber.scale = (section_m, section_m, 6.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish_mesh(timber, wood, 0.008)
    timber.name = name
    set_origin(timber, (x, 0, 0))
    timber['total_length_m'] = 6.0
    timber['buried_depth_m'] = 1.1
    timber['exposed_height_m'] = 4.9
    timber['section_mm'] = int(section_m * 1000)
    timber['source'] = 'HopEden material catalog'

# Korean precast concrete utility poles.
for x, total_m, exposed_m, base_radius, top_radius, name in (
    (0.0, 9.0, 7.5, 0.115, 0.075, 'KR_PCPole_9m'),
    (1.2, 12.0, 10.5, 0.135, 0.085, 'KR_PCPole_12m'),
):
    buried_m = total_m - exposed_m
    bpy.ops.mesh.primitive_cone_add(
        vertices=16,
        radius1=base_radius,
        radius2=top_radius,
        depth=total_m,
        location=(x, 0, (exposed_m - buried_m) / 2),
    )
    pc_pole = finish_mesh(bpy.context.object, concrete, 0.004)
    pc_pole.name = name
    set_origin(pc_pole, (x, 0, 0))
    pc_pole['total_length_m'] = total_m
    pc_pole['buried_depth_m'] = buried_m
    pc_pole['exposed_height_m'] = exposed_m
    pc_pole['source'] = 'HopEden material catalog'

# North American wood pole: 22 ft total, 4 ft buried, 18 ft exposed.
x = 2.5
bpy.ops.mesh.primitive_cone_add(
    vertices=20,
    radius1=0.0889,
    radius2=0.0635,
    depth=6.7056,
    location=(x, 0, 2.1336),
)
us_pole = finish_mesh(bpy.context.object, wood, 0.006)
us_pole.name = 'US_WoodPole_22ft'
set_origin(us_pole, (x, 0, 0))
us_pole['total_length_ft'] = 22.0
us_pole['buried_depth_ft'] = 4.0
us_pole['exposed_height_ft'] = 18.0
us_pole['source'] = 'Nebraska Extension EC3026'

# North American 48 in ground anchor with a 6 in helical plate and eye.
x = 3.8
parts = []
bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.0079375, depth=1.2192, location=(x, 0, -0.6096))
parts.append(finish_mesh(bpy.context.object, galvanized, 0.001))

segments = 36
inner_radius = 0.017
outer_radius = 0.0762
vertices = []
faces = []
for index in range(segments + 1):
    angle = index / segments * math.tau * 1.5
    z = -1.10 + index / segments * 0.16
    vertices.extend([
        (x + math.cos(angle) * inner_radius, math.sin(angle) * inner_radius, z),
        (x + math.cos(angle) * outer_radius, math.sin(angle) * outer_radius, z),
    ])
    if index < segments:
        offset = index * 2
        faces.append((offset, offset + 1, offset + 3, offset + 2))
mesh = bpy.data.meshes.new('US_HelixAnchor_FlightMesh')
mesh.from_pydata(vertices, [], faces)
mesh.update()
flight = bpy.data.objects.new('US_HelixAnchor_Flight', mesh)
base_collection.objects.link(flight)
flight.data.materials.append(galvanized)
parts.append(flight)

bpy.ops.mesh.primitive_torus_add(
    major_segments=16,
    minor_segments=8,
    location=(x, 0, 0.065),
    major_radius=0.045,
    minor_radius=0.007,
    rotation=(math.pi / 2, 0, 0),
)
parts.append(finish_mesh(bpy.context.object, galvanized))
for part in parts:
    part.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
anchor = parts[0]
anchor.name = 'US_HelixAnchor_48in'
set_origin(anchor, (x, 0, 0))
anchor['length_in'] = 48.0
anchor['plate_diameter_in'] = 6.0
anchor['source'] = 'Nebraska Extension EC3026'

# Simplified 12 in turnbuckle oriented along local/global X.
x = 5.0
z = 0.35
parts = []
def add_horizontal_cylinder(radius, depth, center_x):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=12,
        radius=radius,
        depth=depth,
        location=(center_x, 0, z),
        rotation=(0, math.pi / 2, 0),
    )
    obj = finish_mesh(bpy.context.object, galvanized, 0.001)
    parts.append(obj)

add_horizontal_cylinder(0.024, 0.14, x)
add_horizontal_cylinder(0.008, 0.0824, x - 0.1112)
add_horizontal_cylinder(0.008, 0.0824, x + 0.1112)
for eye_x in (x - 0.1524, x + 0.1524):
    bpy.ops.mesh.primitive_torus_add(
        major_segments=16,
        minor_segments=8,
        location=(eye_x, 0, z),
        major_radius=0.022,
        minor_radius=0.006,
        rotation=(math.pi / 2, 0, 0),
    )
    parts.append(finish_mesh(bpy.context.object, galvanized))
for part in parts:
    part.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
turnbuckle = parts[0]
turnbuckle.name = 'US_Turnbuckle_12in'
set_origin(turnbuckle, (x, 0, z))
turnbuckle['length_in'] = 12.0
turnbuckle['source'] = 'Nebraska Extension EC3026'

# Hop vine master for web instancing. The local Z axis follows a training
# string; Three.js rotates and stretches it from the hill to each top wire.
bpy.ops.object.select_all(action='DESELECT')
x = 6.2
plant_parts = []

def add_plant_cylinder(name, start, end, radius, material):
    start_vector = Vector(start)
    end_vector = Vector(end)
    direction = end_vector - start_vector
    midpoint = (start_vector + end_vector) * 0.5
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=8,
        radius=radius,
        depth=direction.length,
        location=midpoint,
    )
    obj = finish_mesh(bpy.context.object, material)
    obj.name = name
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = direction.to_track_quat('Z', 'Y')
    plant_parts.append(obj)
    return obj

vine_points = []
for point_index in range(25):
    z_value = point_index * 5.15 / 24
    angle = point_index * math.pi * 0.58
    vine_points.append((x + math.cos(angle) * 0.035, math.sin(angle) * 0.035, z_value))
for point_index in range(len(vine_points) - 1):
    add_plant_cylinder(
        f'Hop_Vine_{{point_index:02d}}',
        vine_points[point_index],
        vine_points[point_index + 1],
        0.022,
        hop_stem,
    )
for index, height in enumerate((1.1, 1.65, 2.2, 2.75, 3.3, 3.85, 4.35, 4.75)):
    side = -1 if index % 2 == 0 else 1
    reach = 0.20 + 0.04 * (index % 3)
    z_tip = height + 0.14
    tip = (x + side * reach, 0.08 * ((index % 3) - 1), z_tip)
    add_plant_cylinder(f'Hop_Branch_{{index:02d}}', (x, 0, height), tip, 0.014, hop_stem)

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.18, location=tip)
    leaf = finish_mesh(bpy.context.object, hop_leaf)
    leaf.name = f'Hop_Leaf_{{index:02d}}'
    leaf.scale = (1.45, 0.42, 0.72)
    leaf.rotation_euler = (0.18 * side, 0.32 * side, 0.55 * side)
    plant_parts.append(leaf)

    if height >= 2.75:
        cone_position = (tip[0] - side * 0.09, tip[1], tip[2] - 0.17)
        bpy.ops.mesh.primitive_cone_add(
            vertices=8,
            radius1=0.045,
            radius2=0.022,
            depth=0.13,
            location=cone_position,
        )
        cone = finish_mesh(bpy.context.object, hop_cone)
        cone.name = f'Hop_Cone_{{index:02d}}'
        cone.rotation_euler = (0.08 * side, 0.18 * side, 0)
        plant_parts.append(cone)

for part in plant_parts:
    part.select_set(True)
bpy.context.view_layer.objects.active = plant_parts[0]
bpy.ops.object.join()
hop_plant = plant_parts[0]
hop_plant.name = 'Hop_Vine_Segment'
set_origin(hop_plant, (x, 0, 0))
hop_plant['nominal_height_m'] = 5.15
hop_plant['asset_role'] = 'web-instanced vine aligned to a training string'
hop_plant['source'] = 'Original HopEden BlenderMCP asset'

# Apply transforms while preserving named object origins.
for obj in base_collection.objects:
    if obj.type == 'MESH':
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        obj.select_set(False)

bpy.context.scene['asset_kit_license'] = 'Original procedural geometry; no external assets'
bpy.context.scene['asset_kit_purpose'] = 'Web instancing masters for HopEden Designer'
bpy.ops.wm.save_as_mainfile(filepath=blend_path)

bpy.ops.object.select_all(action='DESELECT')
for obj in base_collection.objects:
    if obj.type == 'MESH':
        obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_extras=True,
    export_yup=True,
)

report = []
for obj in sorted((item for item in base_collection.objects if item.type == 'MESH'), key=lambda item: item.name):
    report.append({{
        'name': obj.name,
        'dimensions_m': [round(value, 4) for value in obj.dimensions],
        'vertices': len(obj.data.vertices),
        'polygons': len(obj.data.polygons),
    }})
print('HOPYARD_ASSET_REPORT=' + json.dumps(report))
print('HOPYARD_BLEND_PATH=' + blend_path)
print('HOPYARD_GLB_PATH=' + glb_path)
report
'''


async def main() -> None:
    server = StdioServerParameters(
        command="/opt/homebrew/bin/uvx",
        args=["blender-mcp"],
    )
    async with stdio_client(server) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            tools = await session.list_tools()
            tool_names = {tool.name for tool in tools.tools}
            if "execute_blender_code" not in tool_names:
                raise RuntimeError(f"execute_blender_code not available: {sorted(tool_names)}")
            if "disable_telemetry" in tool_names:
                await session.call_tool("disable_telemetry", {})
            result = await session.call_tool("execute_blender_code", {"code": BLENDER_CODE})
            print(json.dumps(result.model_dump(), ensure_ascii=False, indent=2, default=str))
            text_results = [
                str(getattr(item, "text", "")) for item in result.content
                if getattr(item, "type", None) == "text"
            ]
            if getattr(result, "isError", False) or any(text.startswith("Error executing code:") for text in text_results):
                raise RuntimeError("BlenderMCP returned an error")


if __name__ == "__main__":
    asyncio.run(main())
