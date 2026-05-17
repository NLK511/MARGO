# Builder control inventory

Current low-level controls exposed in tenant/admin builder surfaces:

## Move to Theme Studio

- theme preset selection
- primary/surface/accent color controls
- font family selection
- display/body/H1/H2/H3/paragraph font controls
- theme-level logo/logotype/favicon settings where treated as global branding system
- radius / shadow / elevation system controls
- CTA visual style controls
- nav layout and menu chrome controls
- hero/template style controls

## Replace with tokens

- font size inputs
- line-height inputs
- margin and padding inputs
- raw spacing values for blocks and menu chrome
- raw color pickers for standard tenant mode
- arbitrary surface radius values
- arbitrary shadow strings

## Remove from standard mode

- raw serialized JSON block editor output
- custom CSS-style freeform overrides
- direct per-heading typography tuning
- direct block-level numeric typography knobs

## Keep for content

- headline
- body copy
- CTA label and destination
- image uploads
- alt text
- section order
- block variants
- service/location/testimonial content
- form labels
