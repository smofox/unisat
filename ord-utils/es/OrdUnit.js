export var OrdUnit = /*#__PURE__*/function () {
  function OrdUnit(satoshis, ords) {
    this.satoshis = satoshis;
    this.ords = ords;
  }

  var _proto = OrdUnit.prototype;

  _proto.hasOrd = function hasOrd() {
    return this.ords.length > 0;
  };

  return OrdUnit;
}();