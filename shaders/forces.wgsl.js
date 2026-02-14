export default /*wgsl*/ `

@group(0) @binding(0) var<storage, read> pos: array<vec2f>;
@group(0) @binding(1) var<storage, read> vel: array<vec2f>;
@group(0) @binding(2) var forcesTextureX: texture_storage_2d<r32float, write>;
@group(0) @binding(3) var forcesTextureY: texture_storage_2d<r32float, write>;
@group(0) @binding(2) var<uniform> lookupTable: array<f32>;

fn dist(a: vec2f, b: vec2f) -> f32 {
    if (a.x == b.x && a.y == b.y) {return 10000000.0;}
    return distance(a, b);
}

fn gravity(on: vec2f, by: vec2f) -> vec2f {
    let r = by - on;

    return r / pow(dist(by, on), 3.0);
}

fn drag(on: vec2f, by: vec2f, velOn: vec2f, velBy: vec2f) -> vec2f {
    if (dist(on, by) < 25) {
        let velDiff = velOn-velBy;
        return -velDiff;
    }
    else {
        return vec2f(0);
    }
}



@compute @workgroup_size(1) fn setup(
    @builtin (global_invocation_id) id: vec3u
) {
    let on = pos[id.y]; let by = pos[id.x];

    let force = 1000 * gravity(on, by) + 20 * drag(on, by, vel[id.y], vel[id.x]);

    textureStore(forcesTextureX, id.xy, vec4f(force.x));
    textureStore(forcesTextureY, id.xy, vec4f(force.y));
}

`
