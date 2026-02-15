export default /*wgsl*/ `

@group(0) @binding(0) var forcesTextureX: texture_storage_2d<r32float, read_write>;
@group(0) @binding(1) var forcesTextureY: texture_storage_2d<r32float, read_write>;
@group(0) @binding(2) var<uniform> stride: u32;

@compute @workgroup_size(1) fn sum(
    @builtin(global_invocation_id) id: vec3u
) {
    var sum = vec2f(0);
    let startIndex = u32(pow(5.0, f32(stride+1))) * id.x;

    for (var i:u32 = 0; i < 5; i++) {
        let thisIndex = u32(pow(5.0, f32(stride))) * i + startIndex;

        sum += vec2f(
            textureLoad(forcesTextureX, vec2u(thisIndex, id.y)).r,
            textureLoad(forcesTextureY, vec2u(thisIndex, id.y)).r
        );
    }

    textureStore(forcesTextureX, vec2u(startIndex, id.y), vec4f(sum.x));
    textureStore(forcesTextureY, vec2u(startIndex, id.y), vec4f(sum.y));
}

`