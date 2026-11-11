/**
 * Cloudflare Worker: consultoriapatrimonialfi.emia.workers.dev
 * Serve static assets com cabeçalhos de segurança bancária e HSTS
 */

export default {
  async fetch(request, env, ctx) {
    // Busca o asset do bucket static assets
    let response = await env.ASSETS.fetch(request);

    // Se não encontrado (404) e é uma requisição de navegação GET, serve index.html (SPA Fallback)
    if (response.status === 404 && request.method === "GET") {
      const url = new URL(request.url);
      if (!url.pathname.includes(".")) {
        const indexUrl = new URL("/index.html", request.url);
        response = await env.ASSETS.fetch(new Request(indexUrl, request));
      }
    }

    // Clona os cabeçalhos para injetar segurança bancária
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    newHeaders.set("X-Content-Type-Options", "nosniff");
    newHeaders.set("X-Frame-Options", "SAMEORIGIN");
    newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
    newHeaders.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    
    // Cache imutável para assets estáticos e mídias
    const pathname = new URL(request.url).pathname;
    if (pathname.startsWith("/assets/") || pathname.endsWith(".webp") || pathname.endsWith(".svg") || pathname.endsWith(".mp4")) {
      newHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
};
