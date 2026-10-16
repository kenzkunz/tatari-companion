import {exchangePreview} from './exchange-client.mjs';
if(exchangePreview)await import('./messages-preview.mjs');else await import('./messages-live.mjs');
