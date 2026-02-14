export default /*wgsl*/ `

@group(0) @binding(0) var forcesTexture: texture_storage_2d<rg32float, read_write>;
@group(0) @binding(1) var<uniform> stride: u32;

@compute() @workgroup_size(1) fn reduce(
    @builtin(global_invocation_id) id: vec3u
) {
    thisIndex = 2 * stride * id.x;
    nextIndex = thisIndex + stride
    val1 = textureLoad(forcesTexture, vec2i(thisIndex, id.y), 0);
    val1 = textureLoad(forcesTexture, vec2i(nextIndex, id.y), 0);

    textureStore(forcesTexture, vec2i(thisIndex, id.y), val1+val2);
}

`