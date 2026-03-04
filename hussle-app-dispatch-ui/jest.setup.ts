import { TextEncoder, TextDecoder } from 'util';

// jsdom does not expose TextEncoder/TextDecoder — polyfill from Node's util module
Object.assign(global, { TextEncoder, TextDecoder });

import '@testing-library/jest-dom';
