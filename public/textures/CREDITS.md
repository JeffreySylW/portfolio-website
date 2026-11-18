# Image credits

Internship photos (public/images/makerspace, public/images/tours): cropped from Jeff's "Summer 2025 Internship Experience" presentation by scripts/make-internship-images.mjs.

Hero Earth (public/textures/earth/), baked by scripts/make-earth.mjs from scripts/assets/bluemarble-200411-5400.jpg:
- NASA Earth Observatory, Blue Marble Next Generation, November 2004, topography and bathymetry, 5400x2700 (Reto Stöckli, NASA Earth Observatory). NASA imagery is not copyrighted (public domain); credit requested.
  Source: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/november/world.topo.bathy.200411.3x5400x2700.jpg (downloaded 2026-11-17). The Earth uses no NASA insignia.
- The night side's indigo pixel treatment is drawn by src/lib/terminatorPaint.ts.

System-map planets (public/textures/planets/), baked by scripts/make-planets.mjs and painted by src/lib/terminatorPaint.ts:
- NASA Langley: a NASA-blue world carrying the NASA insignia, from scripts/assets/planets/nasa-logo.svg (https://commons.wikimedia.org/wiki/File:NASA_logo.svg; source on that page: https://www.nasa.gov/wp-content/themes/nasa/assets/images/nasa-logo.svg). Public domain for copyright, but NASA restricts use of its insignia (https://www.nasa.gov/nasa-brand-center/nasa-logo-use/, 14 CFR 1221) and requires written approval; permission can be requested at agency-brand@mail.nasa.gov. Jeff chose to use it for his own portfolio (2026-10-10 for the 3D site, again 2026-11-17). Not confirmed to match NASA's current master artwork exactly.
- VCU: drawn by the script (black with faint gold bands) carrying the VCU seal and wordmark lockup supplied by Jeff (scripts/assets/planets/vcu-lockup.png), used unaltered; VCU's brand rules: https://brand.vcu.edu/vcu-university/guidelines/logos/primary-logo
- Bob The Tech Guy (circuit board), TA (chalkboard), DoD ASPIRE (LiDAR scan) and the NASA world's blue, stars and seams: drawn by the script, no third-party artwork. 4096x2048 masters in scripts/assets/planets/.

System-map galaxy (public/textures/galaxy/), baked by scripts/make-galaxy.mjs:
- Milky Way: "Artist's impression of the Milky Way" (eso1339g), NASA/JPL-Caltech/ESO/R. Hurt, https://www.eso.org/public/images/eso1339g/ (via https://commons.wikimedia.org/wiki/File:Artist%27s_impression_of_the_Milky_Way_(eso1339g).tiff), downloaded 2026-11-17 as a 3840 px JPEG (scripts/assets/galaxy/milkyway-eso1339g-3840.jpg). Licence: Creative Commons Attribution 4.0 International (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/. Changed: resized; the faint outer glow redrawn as indigo pixel dither. Credited on the page under the galaxy.
