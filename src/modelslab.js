import debug from "debug";
const log = debug("imagine.js:modelslab");

import fetch from "node-fetch";

const MODEL = "flux";

let modelslab = null;
export default async function ModelsLab(prompt_text, options = {}) {
    if (!process.env.MODELSLAB_API_KEY) {
        throw new Error("MODELSLAB_API_KEY not set");
    }
    
    if (!options) options = {};
    if (!options.model) options.model = MODEL;
    if (!options.width) options.width = 512;
    if (!options.height) options.height = 512;
    if (!options.samples) options.samples = 1;
    if (!options.guidance) options.guidance = 3.5;

    options.prompt = prompt_text;
    options.key = process.env.MODELSLAB_API_KEY;

    try {
        log(`hitting ModelsLab API (model=${options.model})`);
        
        const response = await fetch("https://modelslab.com/api/v6/images/text2img", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(options),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`ModelsLab API error: ${response.status} - ${error}`);
        }

        const data = await response.json();

        if (data.output && Array.isArray(data.output) && data.output.length > 0) {
            const imageUrl = data.output[0];
            
            // Fetch the image
            const imageResponse = await fetch(imageUrl);
            const buffer = await imageResponse.arrayBuffer();
            
            log(`generated ModelsLab image, size: ${buffer.byteLength}`);
            
            return Buffer.from(buffer);
        }

        // Check if async generation (returns ID)
        if (data.id) {
            // Poll for result
            for (let i = 0; i < 30; i++) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const pollResponse = await fetch("https://modelslab.com/api/v6/images/fetch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        key: process.env.MODELSLAB_API_KEY, 
                        id: data.id 
                    }),
                });
                
                const pollData = await pollResponse.json();
                
                if (pollData.status === "success" && pollData.output) {
                    const imageUrl = pollData.output[0];
                    const imageResponse = await fetch(imageUrl);
                    const buffer = await imageResponse.arrayBuffer();
                    return Buffer.from(buffer);
                }
                
                if (pollData.status === "failed") {
                    throw new Error("ModelsLab image generation failed");
                }
            }
            throw new Error("Timeout waiting for ModelsLab image");
        }

        throw new Error("Unexpected response from ModelsLab API");
    } catch (error) {
        log(`error: ${error.message}`);
        throw error;
    }
}
