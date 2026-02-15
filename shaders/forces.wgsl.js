export default /*wgsl*/ `

@group(0) @binding(0) var<storage, read> pos: array<vec2f>;
@group(0) @binding(1) var<storage, read> vel: array<vec2f>;
@group(0) @binding(2) var forcesTextureX: texture_storage_2d<r32float, write>;
@group(0) @binding(3) var forcesTextureY: texture_storage_2d<r32float, write>;
@group(0) @binding(4) var<uniform> lookupTable: array<f32, 512>;

const R = 5.0;

fn length(a: vec2f) -> f32 {
    var b = abs(a);
    let larger = max(b.x, b.y);
    let smaller = min(b.x, b.y);

    let r = smaller/larger;
    let pos = r * 512;
    let fi = floor(pos);
    let i = u32(pos);

    let interpolation = lookupTable[i] + (pos-fi) * (lookupTable[i+1] - lookupTable[i]);
    return larger * interpolation;
}

fn dist(a: vec2f, b: vec2f) -> f32 {
    if (a.x == b.x && a.y == b.y) {return 100000000.0;}

    return length(a-b) / (5.0*R);
}

// fn dist(a: vec2f, b: vec2f) -> f32 {
//     if (a.x == b.x && a.y == b.y) {return 10000000.0;}
//     return distance(a, b)/(5.0*R);
// }

fn gravity(on: vec2f, by: vec2f) -> vec2f {
    let r = by - on;

    if (dist(by, on) < 3) {return vec2f(0);}

    return r / pow(dist(by, on), 3.0);
}

fn drag(on: vec2f, by: vec2f, velOn: vec2f, velBy: vec2f) -> vec2f {
    if (dist(on, by) < 1) {
        let velDiff = velOn-velBy;
        return -velDiff;
    }
    else {
        return vec2f(0);
    }
}

fn repulsion(on: vec2f, by: vec2f) -> vec2f {
    let r = by - on;

    if (dist(by, on) < 3) {return vec2f(0);}

    return -r /  pow(dist(by, on), 4);
}



@compute @workgroup_size(1) fn setup(
    @builtin (global_invocation_id) id: vec3u
) {
    let on = pos[id.y]; let by = pos[id.x];

    let centerForce = gravity(on, vec2f(300));

    let force = 35 * gravity(on, by) + 0.5 * drag(on, by, vel[id.y], vel[id.x]) + 12 * repulsion(on, by) + centerForce;

    textureStore(forcesTextureX, id.xy, vec4f(force.x));
    textureStore(forcesTextureY, id.xy, vec4f(force.y));
}

`
