import {emptyState,validate} from './finance.js';
export const KEY='organizar-financas-demo-v1';
export function load(storage) {
  const raw=storage.getItem(KEY);
  return raw === null ? emptyState() : validate(JSON.parse(raw));
}
export function persist(storage,state) { validate(state); storage.setItem(KEY,JSON.stringify(state)); }
