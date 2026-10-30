# Credits & licenses

| Asset | Source | License |
|---|---|---|
| `dist/models/boxer.glb` — rigged humanoid "Mannequin" + animations (Idle_Loop, Hit_Head, Hit_Chest, Death01, Dance_Loop, Punch_Jab/Cross/Enter, Roll, Jump_Start, Crouch_Idle_Loop, Sword_Idle, Idle_Talking_Loop) | **Universal Animation Library (Standard/free) by Quaternius** — https://quaternius.itch.io/universal-animation-library , glTF mirror https://github.com/J-Ponzo/gltf-universal-animation-library | **CC0 1.0** (see `dist/models/LICENSE-Quaternius-UAL-CC0.txt`) |
| Three.js r170 (`dist/vendor/three.module.min.js`, `vendor/addons/GLTFLoader.js`, `SkeletonUtils.js`, `BufferGeometryUtils.js`, `meshopt_decoder.module.js`) | https://github.com/mrdoob/three.js | MIT (meshoptimizer decoder: MIT) |
| All outfits, hair, faces, gloves, gear, arena, crowd, UI, fighters/story text, SFX | Original, made procedurally in code for this project | Project-owned |

Model was converted from glTF to a meshopt-compressed GLB with unused animations stripped (`tools_convert.mjs`, @gltf-transform). Sound is synthesized live with WebAudio (no audio files). No Boxing Star assets, names or art are used.
