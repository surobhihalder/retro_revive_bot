import { process } from "./env.js";
const apiKey = process.env.OPENAI_API_KEY;
console.log(apiKey);
const imageInput = document.getElementById('upload-vintage-image');
const description = document.getElementById('trendy-desc');
const processImageBtn = document.getElementById('process-image-btn');
const generatedImage = document.getElementById('generated-trendy-image');
const priceElement = document.getElementById('price');

const url = 'https://api.openai.com/v1/chat/completions';

async function fetchTrendyDescription(base64Image) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: `Generate a short and crisp text description of a trendy cloth image inspired from the style of the given vintage clothing image.
                        Keep in mind this description is sent to DALL-E model to generate the image from the description you give.
                        If the image is not a clothing image, please output as "Please provide clothing image".
                        ### Image: data:image/jpeg;base64,${base64Image}`
                    }
                ],
                max_tokens: 100 // Adjust this value based on your requirement
            })
        });
        const data = await response.json();
        const botReply = data.choices[0].message.content.trim();
        console.log(botReply);
        description.innerText = botReply;

        if (botReply !== "Please provide clothing image") {
            await generateImage(botReply);
            await predictPrice(botReply);
        } else {
            console.error("Please provide clothing image");
        }
    } catch (error) {
        console.error('Error:', error);
        description.innerText = "Sorry, something went wrong. Please try again.";
    }
}

async function generateImage(prompt) {
    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: prompt,
                n: 1,
                size: '1024x1024',
                response_format: 'url'
            })
        });

        const data = await response.json();
        console.log('API response:', data);

        if (data.data && data.data[0] && data.data[0].url) {
            const imageUrl = data.data[0].url;
            console.log('Generated Image URL:', imageUrl);

            // Display the generated image
            generatedImage.src = imageUrl;
        } else {
            console.error('No image URL found in the response');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function predictPrice(description) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: `Predict the price of a trendy cloth item described as follows. Provide the price in both INR and USD. Just give the numbers, don't give any text or explanation.
                        ###
                        Description: ${description}
                        Price in INR:
                        Price in USD: `
                    }
                ],
                max_tokens: 50 // Adjust this value based on your requirement
            })
        });
        const data = await response.json();
        const priceText = data.choices[0].message.content.trim();
        console.log(priceText);
        priceElement.innerText = priceText;
    } catch (error) {
        console.error('Error:', error);
        priceElement.innerText = "Sorry, something went wrong with price prediction. Please try again.";
    }
}

async function processImage() {
    const file = imageInput.files[0];

    if (file) {
        const validImageTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/webp'];
        if (validImageTypes.includes(file.type)) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Image = e.target.result.split(',')[1]; // Get base64 part only
                await fetchTrendyDescription(base64Image);
            };
            reader.readAsDataURL(file);
        } else {
            description.innerText = "Invalid file type. Please upload an image.";
        }
    } else {
        description.innerText = "No file selected. Please upload an image.";
}
}

// Attach the processImage function to the button click event
processImageBtn.addEventListener('click', processImage);
