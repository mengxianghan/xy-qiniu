/**
 * 深度合并
 * @param object
 * @param sources
 * @return {*}
 */
 export function mergeDeep(object, sources) {
    let key
    for (key in sources) {
        object[key] =
            object[key] && object[key].toString() === '[object Object]'
                ? mergeDeep(object[key], sources[key])
                : (object[key] = sources[key])
    }
    return object
}