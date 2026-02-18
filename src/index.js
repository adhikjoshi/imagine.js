import Replicate from "./replicate.js";
import Stability from "./stability.js";
import A1111 from "./a1111.js";
import ModelsLab from "./modelslab.js";

export default async function Imagine(input, options = {}) {
    if (options.service == Imagine.REPLICATE) return await Replicate(input, options);
    if (options.service == Imagine.STABILITY) return await Stability(input, options);
    if (options.service == Imagine.MODELSLAB) return await ModelsLab(input, options);
    return await A1111(input, options);
}

Imagine.REPLICATE = "replicate";
Imagine.STABILITY = "stability";
Imagine.A1111 = "a1111";
Imagine.MODELSLAB = "modelslab";