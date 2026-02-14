import renderCode from "./shaders/render.wgsl.js"
import drawCode from "./shaders/draw.wgsl.js"
import updateVelocityCode from "./shaders/updateVelocities.wgsl.js"
import updatePositionCode from "./shaders/updatePositions.wgsl.js"
import netForcesCode from "./shaders/netForces.wgsl.js"
import forcesCode from "./shaders/forces.wgsl.js"
import clearCode from "./shaders/clear.wgsl.js"
import particleSetupCode from "./shaders/particleSetup.js"

import Lookup from "./lookuptable.js"
const NUM_PARTICLES = 400

async function main() {
    // SETUP
    const adapter = await navigator.gpu?.requestAdapter()
    const device = await adapter?.requestDevice()
    if (!device) {
        alert("need a browser that supports WebGPU")
        return
    }

    const canvas = document.getElementById("mainCanvas")
    const context = canvas.getContext("webgpu")

    // the gpu prefers a format to use when rendering
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
    context.configure({
        device,
        format: presentationFormat,
    })

    const linearSampler = device.createSampler({
        addressModeU: "repeat",
        addressModeV: "repeat",
        addressModeW: "repeat",
        magFilter: "linear",
        minFilter: "linear",
        mipmapFilter: "linear",
    })

    // the texture which will be drawn
    const drawTexture = device.createTexture({
        format: "rgba8unorm",
        dimension: "2d",
        size: [canvas.clientWidth, canvas.clientHeight],
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
    })

    //---- particles setup ------//
    let particlesPos = device.createBuffer({
        label: "particle position buffer",
        size: 8 * NUM_PARTICLES,
        usage: GPUBufferUsage.STORAGE
    })

    let particlesVel = device.createBuffer({
        label: "particle velocity buffer",
        size: 8 * NUM_PARTICLES,
        usage: GPUBufferUsage.STORAGE
    })

    const particleSetupModule = device.createShaderModule({
        label: "particle setup module",
        code: particleSetupCode
    })

    const particleSetupPipeline = device.createComputePipeline({
        layout: "auto",
        compute: { module: particleSetupModule }
    })

    const particleSetupBindGroup = device.createBindGroup({
        layout: particleSetupPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: particlesPos } },
            { binding: 1, resource: { buffer: particlesVel } }
        ]
    })

    // doing the shader pass right now, not in `render`

    const particleSetupEncoder = device.createCommandEncoder({
        label: "particle setup encoder"
    })
    const particleSetupPass = particleSetupEncoder.beginComputePass({
        label: "particle setup compute pass"
    })
    particleSetupPass.setPipeline(particleSetupPipeline)
    particleSetupPass.setBindGroup(0, particleSetupBindGroup)
    particleSetupPass.dispatchWorkgroups(NUM_PARTICLES, NUM_PARTICLES)
    particleSetupPass.end()
    const particleSetupCommandBuffer = particleSetupEncoder.finish()
    device.queue.submit([particleSetupCommandBuffer])

    //---- clear setup ------//
    const clearModule = device.createShaderModule({
        label: "clear screen module",
        code: clearCode
    })

    const clearPipeline = device.createComputePipeline({
        layout: "auto",
        compute: { module: clearModule }
    })

    const clearBindGroup = device.createBindGroup({
        layout: clearPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: drawTexture.createView() }
        ]
    })

    //---- forces setup ------//
    const forcesModule = device.createShaderModule({
        label: "forces module",
        code: forcesCode
    })

    const forcesPipeline = device.createComputePipeline({
        layout: "auto",
        compute: { module: forcesModule }
    })

    const forcesTextureX = device.createTexture({
        format: "r32float",
        dimension: "2d",
        size: [NUM_PARTICLES, NUM_PARTICLES],
        usage: GPUTextureUsage.STORAGE_BINDING
    })
    const forcesTextureY = device.createTexture({
        format: "r32float",
        dimension: "2d",
        size: [NUM_PARTICLES, NUM_PARTICLES],
        usage: GPUTextureUsage.STORAGE_BINDING
    })

    const forcesBindGroup = device.createBindGroup({
        layout: forcesPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: particlesPos } },
            { binding: 1, resource: { buffer: particlesVel } },
            { binding: 2, resource: forcesTextureX.createView() },
            { binding: 3, resource: forcesTextureY.createView() }
        ]
    })

    //---- net forces setup ------//
    const netForcesModule = device.createShaderModule({
        label: "net forces module",
        code: netForcesCode
    })

    const netForcesPipeline = device.createComputePipeline({
        layout: "auto",
        compute: { module: netForcesModule }
    })

    // const netForcesUniformArray = new Uint32Array(1)
    const netForcesUniformBuffer = device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    const netForcesBindGroup = device.createBindGroup({
        layout: netForcesPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: forcesTextureX.createView() },
            { binding: 1, resource: forcesTextureY.createView() },
            { binding: 2, resource: { buffer: netForcesUniformBuffer } }
        ]
    })

    //---- update velocities setup ------//

    const updateVelModule = device.createShaderModule({
        label: "update velocity module",
        code: updateVelocityCode
    })

    const updateVelPipeline = device.createComputePipeline({
        layout: "auto",
        compute: { module: updateVelModule }
    })

    const updateVelBindGroup = device.createBindGroup({
        layout: updateVelPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: forcesTextureX.createView() },
            { binding: 1, resource: forcesTextureY.createView() },
            { binding: 2, resource: { buffer: particlesVel } }
        ]
    })

    //---- update positions setup ------//

    const updatePosModule = device.createShaderModule({
        label: "update position module",
        code: updatePositionCode
    })

    const updatePosPipeline = device.createComputePipeline({
        layout: "auto",
        compute: { module: updatePosModule }
    })

    const updatePosBindGroup = device.createBindGroup({
        label: "update pos",
        layout: updatePosPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: particlesVel } },
            { binding: 1, resource: { buffer: particlesPos } }
        ]
    })

    //---- draw setup ------//
    const drawModule = device.createShaderModule({
        label: "draw module",
        code: drawCode
    })

    const drawPipeline = device.createComputePipeline({
        layout: "auto",
        compute: { module: drawModule }
    })

    const drawBindGroup = device.createBindGroup({
        layout: drawPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: particlesPos } },
            { binding: 1, resource: { buffer: particlesVel } },
            { binding: 2, resource: drawTexture.createView() }
        ]
    })


    //---- render setup ------//
    const renderModule = device.createShaderModule({
        label:"render module",
        code: renderCode
    })

    const renderPipeline = device.createRenderPipeline({
        label: "render pipeline",
        layout: "auto",
        vertex: {
            module: renderModule
        },
        fragment: {
            module: renderModule,
            targets: [{ format: presentationFormat }]
        }
    })

    
    const renderPassDescriptor = {
        label: "render pass",
        colorAttachments: [
            {
                // view: <- to be filled out when we render (it's what we render to)
                clearValue: [0.3, 0.3, 0.3, 1],
                loadOp: "clear",
                storeOp: "store"
            }
        ]
    }

    //----           ------//


    const lookup = new Lookup(512);

    const lookupTable = device.createBuffer({
        size: lookup.size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 2, resource: lookupTable },
        ],
      });


    async function render() {
        const clearEncoder = device.createCommandEncoder({
            label: "clear encoder"
        })
        const clearPass = clearEncoder.beginComputePass()
        clearPass.setPipeline(clearPipeline)
        clearPass.setBindGroup(0, clearBindGroup)
        clearPass.dispatchWorkgroups(canvas.clientWidth, canvas.clientHeight)
        clearPass.end()
        const clearCommandBuffer = clearEncoder.finish()
        device.queue.submit([clearCommandBuffer])

        //---- forces stuff ------//
        const forcesEncoder = device.createCommandEncoder({
            label: "forces calculation encoder"
        })
        const forcesPass = forcesEncoder.beginComputePass({
            label: "forces calculation compute pass"
        })
        forcesPass.setPipeline(forcesPipeline)
        forcesPass.setBindGroup(0, forcesBindGroup)
        forcesPass.dispatchWorkgroups(NUM_PARTICLES, NUM_PARTICLES)
        forcesPass.end()
        const forcesCommandBuffer = forcesEncoder.finish()
        device.queue.submit([forcesCommandBuffer])

        //---- net forces stuff ------//
        const netForcesEncoder = device.createCommandEncoder({
            label: "net forces encoder"
        })
        const netForcesPass = netForcesEncoder.beginComputePass()
        netForcesPass.setPipeline(netForcesPipeline)
        netForcesPass.setBindGroup(0, netForcesBindGroup)
        const numSteps = Math.ceil(Math.log2(NUM_PARTICLES))
        for (let i = 0; i < numSteps; i++) {
            const thisStride = 2 ** i
            const numWorkgroups = Math.ceil(NUM_PARTICLES / (2 * thisStride))

            const stride = new Uint32Array(1)
            stride[0] = thisStride
            device.queue.writeBuffer(netForcesUniformBuffer, 0, stride)
            netForcesPass.dispatchWorkgroups(numWorkgroups, NUM_PARTICLES)
        }
        netForcesPass.end()
        const netForcesCommandBuffer = netForcesEncoder.finish()
        device.queue.submit([netForcesCommandBuffer])

        //---- update velocity stuff ----//
        const updateVelEncoder = device.createCommandEncoder({
            label: "update velocity encoder"
        })
        const updateVelPass = updateVelEncoder.beginComputePass()
        updateVelPass.setPipeline(updateVelPipeline)
        updateVelPass.setBindGroup(0, updateVelBindGroup)
        updateVelPass.dispatchWorkgroups(NUM_PARTICLES)
        updateVelPass.end()
        const updateVelCommandBuffer = updateVelEncoder.finish()
        device.queue.submit([updateVelCommandBuffer])

        //---- update position stuff ----//
        const updatePosEncoder = device.createCommandEncoder({
            label: "update position encoder"
        })
        const updatePosPass = updatePosEncoder.beginComputePass()
        updatePosPass.setPipeline(updatePosPipeline)
        updatePosPass.setBindGroup(0, updatePosBindGroup)
        updatePosPass.dispatchWorkgroups(NUM_PARTICLES)
        updatePosPass.end()
        const updatePosCommandBuffer = updatePosEncoder.finish()
        device.queue.submit([updatePosCommandBuffer])

        //---- draw stuff ------//
        const drawEncoder = device.createCommandEncoder({
            label: "draw encoder"
        })
        const drawPass = drawEncoder.beginComputePass({
            label: "draw compute pass"
        })
        drawPass.setPipeline(drawPipeline)
        drawPass.setBindGroup(0, drawBindGroup)
        drawPass.dispatchWorkgroups(NUM_PARTICLES)
        drawPass.end()
        const drawCommandBuffer = drawEncoder.finish()
        device.queue.submit([drawCommandBuffer])

        //---- render stuff ------//
        renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView()
        const renderEncoder = device.createCommandEncoder({
            label: "render command encoder"
        })
        const renderPass = renderEncoder.beginRenderPass(renderPassDescriptor)
        renderPass.setPipeline(renderPipeline)
        // renderPass.setBindGroup(0, renderBindGroup)
        renderPass.draw(6)
        renderPass.end()
        const renderCommandBuffer = renderEncoder.finish()
        device.queue.submit([renderCommandBuffer])

        requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
}
main()
