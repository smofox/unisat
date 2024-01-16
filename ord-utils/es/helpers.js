import { OrdUnspendOutput } from "./OrdUnspendOutput";
/**
 * Get non-ord balance for spending
 * @param utxos
 * @returns
 */

export function getNonOrdBalance(utxos) {
  return utxos.map(function (v) {
    return new OrdUnspendOutput(v);
  }).reduce(function (pre, cur) {
    return pre + cur.getNonOrdSatoshis();
  }, 0);
}