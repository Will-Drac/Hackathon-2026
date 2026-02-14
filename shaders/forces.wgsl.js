export default /*wgsl*/ `

@group(0) @binding(0) var<storage, read> pos: array<vec2f>;
@group(0) @binding(1) var forcesTexture: texture_storage_2d<rg32float, write>;

fn dist(a: vec2f, b: vec2f) -> f32 {
    return distance(a, b);
}

fn gravity(on: vec2f, by: vec2f) -> vec2f {
    let r = by - on;

    return 1.0 * r / pow(dist(by, on), 3.0);
}

@compute @workgroup_size(1) fn setup(
    @builtin (global_invocation_id) id: vec3u
) {
    let pos1 = pos[id.x]; let pos2 = pos[id.y];

    let force = gravity(pos1, pos2);

    textureStore(forcesTexture, id.xy, force);
}

`