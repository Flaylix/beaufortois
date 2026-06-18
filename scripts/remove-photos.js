const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Hero background — remove base64 image
html = html.replace(
  /\.hero-bg\{[^}]*background-image:url\('data:image[^']+'\);[^}]*\}/s,
  `.hero-bg{
  position:absolute;inset:0;
  background:linear-gradient(135deg,#1a1814 0%,#2a2418 45%,#1a1814 100%);
  background-size:cover;background-position:center center;
  transform:scale(1.05);
  animation:zoomin 8s ease forwards;
}`
);

// Fallback: strip any remaining inline hero base64
html = html.replace(/background-image:url\('data:image[^']+'\);\s*/g, '');

// About image — placeholder
html = html.replace(
  /<img class="about-img" src="data:image[^"]+"[^>]*>/,
  '<div class="about-img about-img-placeholder" id="aboutPhoto" aria-label="Photo du restaurant"></div>'
);

// Gallery — 5 empty slots
const galerieStart = html.indexOf('<!-- GALERIE -->');
const galerieEnd = html.indexOf('<!-- Menu photo public');
if (galerieStart === -1 || galerieEnd === -1) {
  console.error('Section markers not found');
  process.exit(1);
}

const newGalerie = `<!-- GALERIE -->
<div class="galerie-bg" id="galerie">
  <div class="galerie-inner">
    <div class="reveal" style="text-align:center;margin-bottom:48px">
      <p class="s-eyebrow">En images</p>
      <h2 class="s-title">Notre <em>univers</em></h2>
    </div>
    <div class="galerie-grid reveal" id="galerieGrid">
      <div class="gal-item gal-item--placeholder" id="gal-photo-1"><div class="gal-placeholder"><span>Photo 1</span></div></div>
      <div class="gal-item gal-item--placeholder" id="gal-photo-2"><div class="gal-placeholder"><span>Photo 2</span></div></div>
      <div class="gal-item gal-item--placeholder" id="gal-photo-3"><div class="gal-placeholder"><span>Photo 3</span></div></div>
      <div class="gal-item gal-item--placeholder" id="gal-photo-4"><div class="gal-placeholder"><span>Photo 4</span></div></div>
      <div class="gal-item gal-item--placeholder" id="gal-photo-5"><div class="gal-placeholder"><span>Photo 5</span></div></div>
    </div>
  </div>
</div>

`;

html = html.slice(0, galerieStart) + newGalerie + html.slice(galerieEnd);

// Placeholder CSS
const placeholderCss = `
.about-img-placeholder,.gal-placeholder{
  background:linear-gradient(145deg,#2a2418,#1a1814);
  display:flex;align-items:center;justify-content:center;
}
.about-img-placeholder{min-height:420px;border-radius:4px}
.gal-item--placeholder .gal-placeholder{
  width:100%;height:100%;min-height:180px;
  color:rgba(255,255,255,.25);font-size:13px;letter-spacing:.08em;text-transform:uppercase;
}
.gal-item--placeholder img{display:none}
`;

if (!html.includes('.about-img-placeholder')) {
  html = html.replace('</style>', placeholderCss + '</style>');
}

fs.writeFileSync(htmlPath, html);
console.log('Photos removed. File size:', html.length, 'bytes');
