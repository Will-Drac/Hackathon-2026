export default /*wgsl*/ `

@group(0) @binding(0) var forcesTextureX: texture_storage_2d<r32float, read_write>;
@group(0) @binding(1) var forcesTextureY: texture_storage_2d<r32float, read_write>;
@group(0) @binding(2) var<uniform> stride: u32;

@compute @workgroup_size(1) fn reduce(
    @builtin(global_invocation_id) id: vec3u
) {
    let thisIndex = 2 * stride * id.x;
    let nextIndex = thisIndex + stride;


    let val1X = textureLoad(forcesTextureX, vec2u(thisIndex, id.y));
    let val2X = textureLoad(forcesTextureX, vec2u(nextIndex, id.y));

    textureStore(forcesTextureX, vec2u(thisIndex, id.y), val1X+val2X);


    let val1Y = textureLoad(forcesTextureY, vec2u(thisIndex, id.y));
    let val2Y = textureLoad(forcesTextureY, vec2u(nextIndex, id.y));

    textureStore(forcesTextureY, vec2u(thisIndex, id.y), val1Y+val2Y);
}

`