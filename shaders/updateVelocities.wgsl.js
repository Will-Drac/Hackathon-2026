export default /*wgsl*/ `

@group(0) @binding(0) var forcesTextureX: texture_storage_2d<r32float, read>;
@group(0) @binding(1) var forcesTextureY: texture_storage_2d<r32float, read>;
@group(0) @binding(2) var<storage, read_write> velocities: array<vec2f>;

@compute @workgroup_size(1) fn updateVel(
    @builtin (global_invocation_id) id: vec3u
) {
    let i = id.x;

    let acceleration = vec2f(
        textureLoad(forcesTextureX, vec2u(0, i)).r,
        textureLoad(forcesTextureY, vec2u(0, i)).r,
    );

    velocities[i] = acceleration * 0.016 + velocities[i];
    // velocities[i] = vec2f(0, 1) * 0.016 + velocities[i];
}

`