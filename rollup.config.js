import resolve from 'rollup-plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import clear from 'rollup-plugin-clear'
import {terser} from 'rollup-plugin-terser'

export default {
    input: 'src/Qiniu.js',
    output: [
        {
            file: 'dist/index.js',
            format: 'esm'
        },
        {
            file: 'dist/index.umd.js',
            format: 'umd',
            name: 'Qiniu',
            globals: {
                'qiniu-js': 'qiniu'
            }
        },
        {
            file: 'dist/index.umd.min.js',
            format: 'umd',
            name: 'Qiniu',
            globals: {
                'qiniu-js': 'qiniu'
            },
            plugins: [
                terser()
            ]
        }
    ],
    plugins: [
        resolve(),
        babel({
            babelHelpers: 'bundled',
            exclude: 'node_modules/**'
        }),
        clear({
            targets: ['dist'],
            watch: true
        })
    ],
    external: ['qiniu-js']
}
