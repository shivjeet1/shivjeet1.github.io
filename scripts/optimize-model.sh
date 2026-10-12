#!/usr/bin/env bash
# Regenerate the hero's Dell Latitude model from the untouched Sketchfab source.
#
# The source export uses specular/glossiness
# (KHR_materials_pbrSpecularGlossiness), an extension three.js dropped in r150,
# so every material would otherwise load as flat white. This converts the
# materials to metallic/roughness, drops the Sketchfab studio floor, and packs
# the result for the web (~5.4 MB -> ~0.7 MB).
#
# Run it only when the source glb changes; the generated file is committed, and
# the network/npx dependency is deliberately kept out of the site build.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
src="$root/assets/models/laptop_dell.source.glb"
out="$root/static/models/laptop_dell.glb"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

[ -f "$src" ] || { echo "missing source model: $src" >&2; exit 1; }

cd "$work"
npm init -y >/dev/null 2>&1
npm install --silent --no-audit --no-fund @gltf-transform/cli@4

bin="$work/node_modules/.bin/gltf-transform"

"$bin" metalrough "$src" "$work/metalrough.glb"

# Orphan the floor plane the Sketchfab export sits on (node Object_266 / mesh
# Object_132) so the following prune step removes it, and collapse the 329
# meshes a little on the way.
cat > "$work/clean.mjs" <<'JS'
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld } from '@gltf-transform/functions';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
const root = doc.getRoot();

for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (node.getName() === 'Object_266' || (mesh && mesh.getName() === 'Object_132')) {
    node.dispose();
  }
}

await doc.transform(dedup(), prune(), weld());
await io.write(process.argv[3], doc);
JS
node "$work/clean.mjs" "$work/metalrough.glb" "$work/clean.glb"

# --simplify false keeps the model's detail; quantize + webp do the shrinking
# without needing a decoder at runtime (three supports KHR_mesh_quantization
# and EXT_texture_webp natively).
"$bin" optimize "$work/clean.glb" "$out" \
  --compress quantize \
  --simplify false \
  --palette false \
  --texture-compress webp \
  --texture-size 1024

echo "wrote $out ($(du -h "$out" | cut -f1))"
