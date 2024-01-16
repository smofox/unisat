"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.amountToSaothis = exports.satoshisToAmount = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
function satoshisToAmount(val) {
    const num = new bignumber_js_1.default(val);
    return num.dividedBy(100000000).toFixed(8);
}
exports.satoshisToAmount = satoshisToAmount;
function amountToSaothis(val) {
    const num = new bignumber_js_1.default(val);
    return num.multipliedBy(100000000).toNumber();
}
exports.amountToSaothis = amountToSaothis;
