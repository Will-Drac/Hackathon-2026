export default /*wgsl*/ `

@group(0) @binding(0) var<storage, read> pos: array<vec2f>;
@group(0) @binding(1) var<storage, read> vel: array<vec2f>;
@group(0) @binding(2) var drawTexture: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(1) fn setup(
    @builtin (global_invocation_id) id: vec3u
) {
    let i = id.x;

    let thisPos = pos[i];
    let thisPosI = vec2i(thisPos);

    let thisVel = vel[i];

    textureStore(drawTexture, thisPosI, vec4f(1, 0, 0, 1));
}


`