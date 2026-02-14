export default /*wgsl*/ `

@group(0) @binding(0) var<storage, read> velocities: array<vec2f>;
@group(0) @binding(1) var<storage, read_write> positions: array<vec2f>;

@compute @workgroup_size(1) fn updatePos(
    @builtin (global_invocation_id) id: vec3u
) {
    let i = id.x;

    positions[i] = velocities[i] * 0.016 + positions[i];
}

`