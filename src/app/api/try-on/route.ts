import { NextResponse } from 'next/server';
import { client } from '@gradio/client';

export const maxDuration = 60; // Allow more time for AI generation

export async function POST(req: Request) {
    try {
        const formData = await req.formData().catch(() => null);

        if (!formData) {
            return NextResponse.json({ error: "No form data provided" }, { status: 400 });
        }

        // Try-on compatible parameter names
        const human = (formData.get("image1") || formData.get("user_photo")) as File; // person
        const shirt = (formData.get("image2") || formData.get("product_photo")) as File; // cloth
        const productImageUrl = formData.get("product_image_url") as string;

        if (!human || (!shirt && !productImageUrl)) {
            return NextResponse.json({ error: "Both images or product image URL are required" }, { status: 400 });
        }

        let shirtBlob = shirt;
        if (!shirtBlob && productImageUrl) {
            console.log("Fetching shirt from URL:", productImageUrl);
            const productRes = await fetch(productImageUrl);
            if (productRes.ok) {
                shirtBlob = await productRes.blob() as any;
            }
        }

        if (!shirtBlob) {
            return NextResponse.json({ error: "Could not retrieve shirt image" }, { status: 400 });
        }

        console.log("Connecting to yisol-idm-vton HF Space...");

        // 1. Initialize the Hugging Face Space client
        const app = await client('yisol/IDM-VTON');

        console.log("Connected! Submitting images to the queue... (This could take 1-2 minutes)");

        // 2. Submit the predict request
        const result = await app.predict('/tryon', {
            dict: {
                background: human, // The user's photo
                layers: [],       // No extra masking layers
                composite: null   // No composite
            },
            garm_img: shirtBlob,    // The garment photo
            garment_des: 'shirt',   // Text description
            is_checked: true,       // Yes, use auto-masking
            is_checked_crop: false, // Don't auto-crop
            denoise_steps: 30,      // Number of steps (30 is good quality)
            seed: 42                // Seed for generation
        });

        console.log("HF Space generation successful!");

        const outputData: any = result.data;
        const finalImageUrl = outputData?.[0]?.url || null;

        if (!finalImageUrl) {
            throw new Error("Gradio client did not return a valid Image URL.");
        }

        return NextResponse.json({
            success: true,
            message: "Virtual try-on generated successfully!",
            resultUrl: finalImageUrl // Keeping key name 'resultUrl' for compatibility
        });

    } catch (error: any) {
        console.error("Try-on API failed:", error);
        return NextResponse.json({ error: error.message || "Try-on API failed" }, { status: 500 });
    }
}
