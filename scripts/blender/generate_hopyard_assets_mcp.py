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
x = -3.0
bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.03, depth=6.0, location=(x, 0, 2.1))
kr_pole = finish_mesh(bpy.context.object, galvanized, 0.003)
kr_pole.name = 'KR_SteelPole_6m'
set_origin(kr_pole, (x, 0, 0))
kr_pole['total_length_m'] = 6.0
kr_pole['buried_depth_m'] = 0.9
kr_pole['exposed_height_m'] = 5.1
kr_pole['source'] = 'HopEden material catalog'

# North American wood pole: 22 ft total, 4 ft buried, 18 ft exposed.
x = -1.5
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
x = 0.4
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
x = 2.1
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
            if getattr(result, "isError", False):
                raise RuntimeError("BlenderMCP returned an error")


if __name__ == "__main__":
    asyncio.run(main())
