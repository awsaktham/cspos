/* QR Code local generator — lightweight wrapper around qrserver.com API */
window.CSPSR_QR = {
  url: function(text, size) {
    size = size || 200;
    return 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodeURIComponent(text);
  },
  img: function(text, size) {
    var img = document.createElement('img');
    img.src = this.url(text, size);
    img.alt = 'QR Code';
    img.style.width = (size || 200) + 'px';
    return img;
  }
};
