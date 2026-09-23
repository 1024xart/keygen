# Background photographs

The scene shader applies dithering and parallax at runtime. These background files are independent of the locked artwork.

- `forest.jpg`: [Unsplash source image](https://images.unsplash.com/photo-1441974231531-c6227db76b6e), obtained at 1920px width, JPEG quality 85.
- `lake.jpg`: [Boathouse on a mountain lake](https://unsplash.com/photos/brown-house-near-body-of-water-zAjdgNXsMeg), Luca Bravo, obtained at 1920px width, JPEG quality 85.
- `sequence-desktop.jpg`: original wallpaper already present in this project, retained unchanged.

The two downloaded photographs are used under the [Unsplash License](https://unsplash.com/license). Source files are hosted locally; no third-party image requests are made by the running site.

Depth maps in `depth/` were estimated locally from these same photographs with [Depth Anything V2 Small (ONNX)](https://huggingface.co/onnx-community/depth-anything-v2-small), Apache-2.0, through Transformers.js. White represents nearer surfaces. Maps are softened and resized to 1024 pixels wide. No inference or model download runs in the website.
