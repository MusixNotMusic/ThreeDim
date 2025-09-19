export async function main() { 
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();

    if (!device) {
        fail('need a browser that supports WebGPU');
        return;
    }

    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('webgpu');

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat
    })

    const shaderCode = `
    @vertex 
    fn vs (@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
        let pos = array(
            vec2f(-0.5, 0.5),
            vec2f(-0.5, -0.5),
            vec2f(0.5, -0.5),
            vec2f(-0.5, 0.5),
            vec2f(0.5, -0.5),
            vec2f(0.5, 0.5)
        );

        return vec4f(pos[vertexIndex], 0.0, 1.0);
    }

    @fragment 
    fn fs() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0);
    }
    `

    const module = device.createShaderModule({
        label: 'our hardcoded shader',
        code: shaderCode
    })

    const pipeline = device.createRenderPipeline({
        label: 'our hardcoded pipeline',
        layout: 'auto',
        vertex: {
            module
        },
        fragment: {
            module,
            targets: [ { format: presentationFormat } ]
        }
    })

    const renderPassDescriptor = {
        label: 'our basic canvas renderpass',
        colorAttachments: [
            {
                clearValue: [0.3, 0.3, 0.3, 0.6],
                loadOp: 'clear',
                storeOp: 'store'
            }
        ]
    }

    function render() { 
        renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

        const encoder = device.createCommandEncoder({ label: 'encoder' });

        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        pass.draw(3);
        pass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
    }


    // render();

    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            const canvas = entry.target;
            const width = entry.contentBoxSize[0].inlineSize;
            const height = entry.contentBoxSize[0].blockSize;
            canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
            canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
        }
        render();
    });

    observer.observe(canvas);

}
