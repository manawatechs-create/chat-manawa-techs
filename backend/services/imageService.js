class ImageService {
    async generateIllustration(theme, style = 'professional') {
        const prompts = {
            odoo: "Modern ERP dashboard, African business, clean interface, blue purple",
            linux: "Linux server room, modern data center, green terminal, professional",
            web: "Web developer workspace, modern laptop, African tech professional",
            imprimerie: "Modern printing workshop, colorful banners, professional equipment",
            ia: "Artificial intelligence concept, futuristic, purple blue neon, African",
            securite: "Cybersecurity concept, digital shield, network protection, dark green",
            formation: "Modern IT classroom, African students learning, bright inspiring",
            default: "MANAWA TECHS, African IT company, Côte d'Ivoire, modern professional"
        };

        const basePrompt = prompts[theme] || prompts.default;
        const fullPrompt = `${basePrompt}, ${style}, high quality, 4k, no text watermark`;
        
        const encodedPrompt = encodeURIComponent(fullPrompt);
        const seed = Math.floor(Math.random() * 10000);
        
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}`;
    }

    async generatePostImage(postContent, domaine) {
        const keywords = postContent.substring(0, 100).replace(/\s+/g, ' ');
        const prompt = `${keywords}, ${domaine}, MANAWA TECHS, African IT, modern professional`;
        const encodedPrompt = encodeURIComponent(prompt);
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
    }
}

module.exports = new ImageService();
