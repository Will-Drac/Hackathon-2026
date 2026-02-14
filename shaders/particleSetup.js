export default /*wgsl*/ `

@group(0) @binding(0) var<storage, read_write> pos: array<vec2f>;
@group(0) @binding(1) var<storage, read_write> vel: array<vec2f>;

@compute @workgroup_size(1) fn setup(
    @builtin (global_invocation_id) id: vec3u
) {
    let i = id.x;
    pos[i] = vec2f(vec2u(i, i));
    vel[i] = vec2f(0);
}

`