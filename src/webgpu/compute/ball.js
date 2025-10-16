export async function main() {
    const balls = 200;
    const size = balls * 6 * Float32Array.BYTES_PER_ELEMENT;
    const minRadius = 2;
    const maxRadius = 10;
    const hasRender = true;

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();

    if (!device) {
      fail('need a browser that supports WebGPU');
      return;
    }

    const code = `
        struct Ball {
            radius: f32,
            position : vec2<f32>,
            velocity : vec2<f32>,
        }

        @group(0) @binding(0) var<storage, read> input: array<Ball>;
        @group(0) @binding(1) var<storage, read_write> output: array<Ball>;

        struct Scene {
            width: f32,
            height: f32,
        }

        @group(0) @binding(2) var<storage, read> scene: Scene;

        const PI: f32 = 3.141592653589793;
        const TIME_STEP:f32 = 0.016;

        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
            let num_balls = arrayLength(&output);

            if (global_id.x > num_balls) {
                return;
            }

            var src_ball = input[global_id.x];
            let dst_ball = &output[global_id.x];

            (*dst_ball) = src_ball;

            for(var i = 0u; i < num_balls; i = i + 1u) {
                if (i == global_id.x) {
                    continue;
                }

                var other_ball = input[i];
                let n = src_ball.position - other_ball.position;
                let distance = length(n);

                if (distance >= src_ball.radius + other_ball.radius) {
                    continue;
                }

                let overlap = (src_ball.radius + other_ball.radius) - distance;

                (*dst_ball).position = src_ball.position + normalize(n) * overlap / 2.0;

                let src_mass = pow(src_ball.radius, 2.0) * PI;
                let other_mass = pow(other_ball.radius, 2.0) * PI;
                let c = 2.0 * dot(n, (other_ball.velocity - src_ball.velocity)) / (dot(n, n) * (1.0 / src_mass + 1.0 / other_mass));
                (*dst_ball).velocity = src_ball.velocity + c / src_mass * n;

            }
            
            (*dst_ball).position = (*dst_ball).position + (*dst_ball).velocity * TIME_STEP;

            let top    = (*dst_ball).position.y - (*dst_ball).radius;
            let bottom = (*dst_ball).position.y + (*dst_ball).radius - scene.height;
            let left   = (*dst_ball).position.x - (*dst_ball).radius;
            let right  = (*dst_ball).position.x + (*dst_ball).radius - scene.width;

            if(top < 0.0) {
                (*dst_ball).position.y = (*dst_ball).radius;
                (*dst_ball).velocity.y = -(*dst_ball).velocity.y;
            }

            if(bottom > 0.0) {
                (*dst_ball).position.y = scene.height - (*dst_ball).radius;
                (*dst_ball).velocity.y = -(*dst_ball).velocity.y;
            }

            if(left < 0.0) {
                (*dst_ball).position.x = (*dst_ball).radius;
                (*dst_ball).velocity.x = -(*dst_ball).velocity.x;
            }

            if(right > 0.0) {
                (*dst_ball).position.x = scene.width - (*dst_ball).radius;
                (*dst_ball).velocity.x = -(*dst_ball).velocity.x;
            }
        }
    `

    const module = device.createShaderModule({ code });
    const layout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'read-only-storage' },
            },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'storage' },
            },
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'read-only-storage' },
            }
        ]
    })

    const pipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
        compute: {
            module,
            entryPoint: 'main',
        },
    })

    const sceneBuffer = device.createBuffer({
        size: 2 * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })

    const inputBuffer = device.createBuffer({
        size: size,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })

    const outputBuffer = device.createBuffer({
        size: size,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    })

    const ballsBuffer = device.createBuffer({
        size: size,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    })

    const group = device.createBindGroup({
        layout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: inputBuffer,
                },
            },
            {
                binding: 1,
                resource: {
                    buffer: outputBuffer,
                },
            },
            {
                binding: 2,
                resource: {
                    buffer: sceneBuffer,
                }
            }
        ]
    })

    function update() {
        return new Promise(e => requestAnimationFrame(e))
    }

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    let bufferData = new Float32Array(new ArrayBuffer(size));

    for(let i = 0; i < balls; i++) {
        bufferData[i * 6 + 0] = random(minRadius, maxRadius);
        bufferData[i * 6 + 2] = random(0, canvas.width);
        bufferData[i * 6 + 3] = random(0, canvas.height);
        bufferData[i * 6 + 4] = random(-100, 100);
        bufferData[i * 6 + 5] = random(-100, 100);
    }

    device.queue.writeBuffer(sceneBuffer, 0, new Float32Array([canvas.width, canvas.height]));
    let result;
    let v = 0;
    async function frame() {
        performance.mark("webgpu start"),
        
        device.queue.writeBuffer(inputBuffer, 0, bufferData);
        const encoder = device.createCommandEncoder()
        const pass = encoder.beginComputePass();
        pass.setPipeline(pipeline),
        pass.setBindGroup(0, group);
        
        const num = Math.ceil(balls / 64);
        
        pass.dispatchWorkgroups(num),
        pass.end(),

        encoder.copyBufferToBuffer(outputBuffer, 0, ballsBuffer, 0, size);
        const n = encoder.finish();
        device.queue.submit([n]),
        
        await ballsBuffer.mapAsync(GPUMapMode.READ, 0, size);
        
        const buffer = ballsBuffer.getMappedRange(0, size).slice();
        
        result = new Float32Array(buffer),
        ballsBuffer.unmap(),
        
        performance.mark("webgpu end"),
        performance.measure("webgpu", "webgpu start", "webgpu end"),

        draw(result) 
   
        bufferData = result;

        requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)
    function draw(result) {
        ctx.save(),
        ctx.scale(1, -1),
        ctx.translate(0, -ctx.canvas.height),
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height),
        ctx.fillStyle = "red";
        for (let i = 0; i < result.length; i += 6) {
            const radius = result[i + 0]
            const px = result[i + 2]
            const py = result[i + 3]
            const vx = result[i + 4]
            const vy = result[i + 5];
    
            let rad = Math.atan(vy / (vx === 0 ? Number.EPSILON : vx));
            
            vx < 0 && (rad += Math.PI);
            
            const x = px + Math.cos(rad) * Math.sqrt(2) * radius;
            const y = py + Math.sin(rad) * Math.sqrt(2) * radius;
            
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, 2 * Math.PI, true);
            ctx.moveTo(x, y);
            ctx.arc(px, py, radius, rad - Math.PI / 4, rad + Math.PI / 4, true);
            ctx.lineTo(x, y);

            ctx.fillStyle = i !== 0 ? 'blue' : 'red';
            
            ctx.closePath();
            ctx.fill()
        }
        ctx.restore()
    }
}
