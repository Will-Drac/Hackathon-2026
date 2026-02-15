export default /*wgsl*/ `

@group(0) @binding(0) var<storage, read_write> pos: array<vec2f>;
@group(0) @binding(1) var<storage, read_write> vel: array<vec2f>;

const seed = _SEED;

fn hash11(n: u32) -> u32 {
    var h = n * 747796405u + 2891336453u;
    h = ((h >> ((h >> 28u) + 4u)) ^ h) * 277803737u;
    return (h >> 22u) ^ h;
}

fn rand11(f: f32) -> f32 { return f32(hash11(bitcast<u32>(f))) / f32(0xffffffff); }

fn noise(p: f32) -> f32 {
    let fl = floor(p);
    return mix(rand11(fl), rand11(fl + 1.), fract(p));
}

fn randomIndex(i: u32) -> vec2f {
    return vec2f(noise(f32(i)), noise(f32(i+1)));
}

@compute @workgroup_size(1) fn setup(
    @builtin (global_invocation_id) id: vec3u
) {
    let i = id.x;
    let fi = f32(i);
    
    pos[i] = randomIndex(i + seed)*600;
    vel[i] = (randomIndex(i + seed + 100)-vec2f(0.5))*100;
}

`