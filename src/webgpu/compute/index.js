import { fail } from '../utils/expection';

export async function main(myInput) {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
      fail('need a browser that supports WebGPU');
      return;
    }

    const computeCode = `
        @group(0) @binding(0) var<storage, read_write> data: array<f32>;

        @compute @workgroup_size(1) 
        fn compute(@builtin(global_invocation_id) id: vec3u) {
            let i = id.x;
            data[i] *= 2.0;
        }
    `

    const module = device.createShaderModule({
        label: 'doubling computer module',
        code: computeCode
    })

    const pipeline = device.createComputePipeline({
        label: 'doubling computer pipeline',
        layout: 'auto',
        compute: {
            module
        }
    })

    const input = new Float32Array(myInput);

    const workBuffer = device.createBuffer({
        label: 'work buffer',
        size: input.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    });

    device.queue.writeBuffer(workBuffer, 0, input);

    const resultBuffer = device.createBuffer({
        label: 'result buffer',
        size: input.byteLength,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    });

    const bindGroup = device.createBindGroup({
        label: 'bind group',
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: { buffer: workBuffer }
            }
        ]
    });

    const encoder = device.createCommandEncoder({ label: 'command encoder' });

    const pass = encoder.beginComputePass({ label: 'compute pass' });

    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(input.length);
    pass.end();

    encoder.copyBufferToBuffer(workBuffer, 0, resultBuffer, 0, resultBuffer.size);

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    await resultBuffer.mapAsync(GPUMapMode.READ);
    const result = new Float32Array(resultBuffer.getMappedRange().slice());

    resultBuffer.unmap();

    console.log('input ->', input);
    console.log('result ->', result);
    return {
        input,
        result
    }
}