import { decompress, WindField3DFormat } from '@cdyw/asd-utils';

const fileList = [
    // { 'name': 'yanan', suffix: 'z' },
    { name: 'YW_NAFP_C_YWCC_20250808060000_P_NULL_NULL_12004_M01.bin',          'suffix': 'zst' },
    { 'name': 'YW_NAFP_C_YWCC_202409201200_P_NULL_NULL_12004.bin',              'suffix': 'zst' },
    { 'name': 'YW_RADA_C_YWCC_20250718103200_P_NULL_NULL_12003_M100-0.5.bin',   'suffix': 'zst' },
    { 'name': 'YW_RADA_C_YWCC_20250314063000_P_DPR_NULL_1016_M3000',            'suffix': 'zip' },
    { 'name': 'YW_RADA_C_YWCC_20250718015700_P_NULL_NULL_12003_M100-0.bin',     'suffix': 'zst'},
    { 'name': 'YW_RADA_C_YWCC_20250305080000_P_DPR_NULL_1016_M3000',            'suffix': 'zip' },
    { 'name': 'YW_RADA_C_YWCC_20250314073000_P_DPR_NULL_1016_M3000',            'suffix': 'zip' },
]


export const fetchWindData = (url, debug) => {
    const file = fileList[0]
    // return fetch( debug ? `/resource/${file.name}.${file.suffix}` : url)
    return fetch(`/resource/${file.name}.${file.suffix}`)
        .then((data) => data.arrayBuffer())
        .then(decompress)
        .then((buffer) => {
            const bytes = new Uint8Array(buffer);
            let wf3d = WindField3DFormat.parser(bytes);

            wf3d.minLongitude = wf3d.header.minLongitude;
            wf3d.maxLongitude = wf3d.header.maxLongitude;
            wf3d.minLatitude = wf3d.header.minLatitude;
            wf3d.maxLatitude = wf3d.header.maxLatitude;

            wf3d.width = wf3d.header.widthSize;
            wf3d.height = wf3d.header.heightSize;
            wf3d.depth = wf3d.header.depthSize;
            console.log('wf3d ==>', wf3d);
            return wf3d;
        })
}