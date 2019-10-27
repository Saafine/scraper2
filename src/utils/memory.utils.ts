/* tslint:disable:no-console */
import { freemem, totalmem } from 'os';

export function memMonitor(target, key, descriptor) {
    // save a reference to the original method this way we keep the values currently in the
    // descriptor and don't overwrite what another decorator might have done to the descriptor.
    if (descriptor === undefined) {
        descriptor = Object.getOwnPropertyDescriptor(target, key);
    }

    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
        console.log(`(${key}) mem-usage: ${ getMemoryUsage() }`);
        return originalMethod.apply(this, args);
    };

    // return edited descriptor as opposed to overwriting the descriptor
    return descriptor;
}

export function getMemoryUsage(): string {
    return (freemem() / totalmem() * 100).toFixed(2) + ' %';
}

// TODO [P. Labus] create docs
// This replaces the entire method with a new one that logs the arguments, calls the original method and then logs the output.
// function log(target, name, descriptor) {
//     const original = descriptor.value;
//     if (typeof original === 'function') {
//         descriptor.value = function(...args) {
//             console.log(`Arguments: ${ args }`);
//             try {
//                 const result = original.apply(this, args);
//                 console.log(`Result: ${ result }`);
//                 return result;
//             } catch (e) {
//                 console.log(`Error: ${ e }`);
//                 throw e;
//             }
//         };
//     }
//     return descriptor;
// }
